package server

import (
	"context"
	"net/http"

	"github.com/zistributo/zistributo/apps/backend/internal/config"
	"github.com/zistributo/zistributo/apps/backend/internal/middleware"
	apiModule "github.com/zistributo/zistributo/apps/backend/internal/modules/api"
	"github.com/zistributo/zistributo/apps/backend/internal/sms"
	"github.com/zistributo/zistributo/apps/backend/internal/store"
)

func New(ctx context.Context, cfg config.Config) (http.Handler, func(), error) {
	mux := http.NewServeMux()
	st, err := store.New(ctx, cfg.DatabaseURL, cfg.CurrentUserID, cfg.CurrentUserName, cfg.CurrentUserPhone)
	if err != nil {
		return nil, nil, err
	}
	otpService, exposeDevOTP, err := sms.NewAuthOTPService(sms.Config{
		Provider:                  cfg.SMSProvider,
		TwilioAccountSID:          cfg.TwilioAccountSID,
		TwilioAuthToken:           cfg.TwilioAuthToken,
		TwilioFromNumber:          cfg.TwilioFromNumber,
		TwilioMessagingServiceSID: cfg.TwilioMessagingServiceSID,
		TwilioVerifyServiceSID:    cfg.TwilioVerifyServiceSID,
	})
	if err != nil {
		st.Close()
		return nil, nil, err
	}
	apiModule.RegisterRoutes(mux, "/api/v1", st, otpService, exposeDevOTP)

	handler := middleware.RequestID()(mux)
	handler = middleware.CORS(cfg.CORSOrigins)(handler)
	return handler, st.Close, nil
}
