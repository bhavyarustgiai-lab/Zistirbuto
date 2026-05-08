package sms

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"

	"github.com/zistributo/zistributo/apps/backend/internal/common/logger"
)

type AuthOTPService interface {
	RequestOTP(ctx context.Context, phone string, code string) error
	VerifyOTP(ctx context.Context, phone string, code string) error
	UsesRemoteVerification() bool
}

type Config struct {
	Provider                  string
	TwilioAccountSID          string
	TwilioAuthToken           string
	TwilioFromNumber          string
	TwilioMessagingServiceSID string
	TwilioVerifyServiceSID    string
}

func NewAuthOTPService(cfg Config) (AuthOTPService, bool, error) {
	switch strings.ToLower(strings.TrimSpace(cfg.Provider)) {
	case "", "log":
		return LogOTPService{}, true, nil
	case "twilio":
		if strings.TrimSpace(cfg.TwilioAccountSID) == "" {
			return nil, false, fmt.Errorf("TWILIO_ACCOUNT_SID is required when SMS_PROVIDER=twilio")
		}
		if strings.TrimSpace(cfg.TwilioAuthToken) == "" {
			return nil, false, fmt.Errorf("TWILIO_AUTH_TOKEN is required when SMS_PROVIDER=twilio")
		}
		if strings.TrimSpace(cfg.TwilioFromNumber) == "" && strings.TrimSpace(cfg.TwilioMessagingServiceSID) == "" {
			return nil, false, fmt.Errorf("TWILIO_FROM_PHONE_NUMBER or TWILIO_MESSAGING_SERVICE_SID is required when SMS_PROVIDER=twilio")
		}
		return TwilioMessageOTPService{
			accountSID:          strings.TrimSpace(cfg.TwilioAccountSID),
			authToken:           strings.TrimSpace(cfg.TwilioAuthToken),
			fromNumber:          strings.TrimSpace(cfg.TwilioFromNumber),
			messagingServiceSID: strings.TrimSpace(cfg.TwilioMessagingServiceSID),
			client:              http.DefaultClient,
		}, false, nil
	case "twilio_verify":
		if strings.TrimSpace(cfg.TwilioAccountSID) == "" {
			return nil, false, fmt.Errorf("TWILIO_ACCOUNT_SID is required when SMS_PROVIDER=twilio_verify")
		}
		if strings.TrimSpace(cfg.TwilioAuthToken) == "" {
			return nil, false, fmt.Errorf("TWILIO_AUTH_TOKEN is required when SMS_PROVIDER=twilio_verify")
		}
		if strings.TrimSpace(cfg.TwilioVerifyServiceSID) == "" {
			return nil, false, fmt.Errorf("TWILIO_VERIFY_SERVICE_SID is required when SMS_PROVIDER=twilio_verify")
		}
		return TwilioVerifyOTPService{
			accountSID:       strings.TrimSpace(cfg.TwilioAccountSID),
			authToken:        strings.TrimSpace(cfg.TwilioAuthToken),
			verifyServiceSID: strings.TrimSpace(cfg.TwilioVerifyServiceSID),
			client:           http.DefaultClient,
		}, false, nil
	default:
		return nil, false, fmt.Errorf("unsupported SMS_PROVIDER %q", cfg.Provider)
	}
}

type LogOTPService struct{}

func (LogOTPService) RequestOTP(_ context.Context, phone string, code string) error {
	logger.Infof("sms otp phone=%s code=%s", phone, code)
	return nil
}

func (LogOTPService) VerifyOTP(_ context.Context, _ string, _ string) error {
	return fmt.Errorf("local otp verification should use store verification")
}

func (LogOTPService) UsesRemoteVerification() bool {
	return false
}

type TwilioMessageOTPService struct {
	accountSID          string
	authToken           string
	fromNumber          string
	messagingServiceSID string
	client              *http.Client
}

func (s TwilioMessageOTPService) RequestOTP(ctx context.Context, phone string, code string) error {
	form := url.Values{}
	form.Set("To", strings.TrimSpace(phone))
	form.Set("Body", fmt.Sprintf("%s is your Zistributo login code. It expires in 10 minutes.", code))
	if s.messagingServiceSID != "" {
		form.Set("MessagingServiceSid", s.messagingServiceSID)
	} else {
		form.Set("From", s.fromNumber)
	}
	_, err := s.postForm(ctx, fmt.Sprintf("https://api.twilio.com/2010-04-01/Accounts/%s/Messages.json", url.PathEscape(s.accountSID)), form)
	return err
}

func (s TwilioMessageOTPService) VerifyOTP(_ context.Context, _ string, _ string) error {
	return fmt.Errorf("twilio message otp verification should use store verification")
}

func (s TwilioMessageOTPService) UsesRemoteVerification() bool {
	return false
}

type TwilioVerifyOTPService struct {
	accountSID       string
	authToken        string
	verifyServiceSID string
	client           *http.Client
}

func (s TwilioVerifyOTPService) RequestOTP(ctx context.Context, phone string, _ string) error {
	form := url.Values{}
	form.Set("To", strings.TrimSpace(phone))
	form.Set("Channel", "sms")
	_, err := s.postForm(ctx, fmt.Sprintf("https://verify.twilio.com/v2/Services/%s/Verifications", url.PathEscape(s.verifyServiceSID)), form)
	return err
}

func (s TwilioVerifyOTPService) VerifyOTP(ctx context.Context, phone string, code string) error {
	form := url.Values{}
	form.Set("To", strings.TrimSpace(phone))
	form.Set("Code", strings.TrimSpace(code))
	body, err := s.postForm(ctx, fmt.Sprintf("https://verify.twilio.com/v2/Services/%s/VerificationCheck", url.PathEscape(s.verifyServiceSID)), form)
	if err != nil {
		return err
	}
	var response struct {
		Status string `json:"status"`
		Valid  bool   `json:"valid"`
	}
	if err := json.Unmarshal(body, &response); err != nil {
		return fmt.Errorf("failed to decode twilio verify response: %w", err)
	}
	if !response.Valid && !strings.EqualFold(response.Status, "approved") {
		return fmt.Errorf("invalid or expired otp")
	}
	return nil
}

func (s TwilioVerifyOTPService) UsesRemoteVerification() bool {
	return true
}

func (s TwilioMessageOTPService) postForm(ctx context.Context, endpoint string, form url.Values) ([]byte, error) {
	return postTwilioForm(ctx, s.client, s.accountSID, s.authToken, endpoint, form)
}

func (s TwilioVerifyOTPService) postForm(ctx context.Context, endpoint string, form url.Values) ([]byte, error) {
	return postTwilioForm(ctx, s.client, s.accountSID, s.authToken, endpoint, form)
}

func postTwilioForm(ctx context.Context, client *http.Client, accountSID string, authToken string, endpoint string, form url.Values) ([]byte, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, strings.NewReader(form.Encode()))
	if err != nil {
		return nil, err
	}
	req.SetBasicAuth(accountSID, authToken)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	if client == nil {
		client = http.DefaultClient
	}
	res, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()
	body, _ := io.ReadAll(io.LimitReader(res.Body, 4096))

	if res.StatusCode >= http.StatusBadRequest {
		return nil, fmt.Errorf("twilio request failed: status=%d body=%s", res.StatusCode, strings.TrimSpace(string(body)))
	}
	return body, nil
}
