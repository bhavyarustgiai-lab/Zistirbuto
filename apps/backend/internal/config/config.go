package config

import (
	"fmt"
	"net/url"
	"os"
)

type Config struct {
	Env                       string
	Port                      string
	DatabaseURL               string
	CORSOrigins               string
	CurrentUserID             string
	CurrentUserName           string
	CurrentUserPhone          string
	SMSProvider               string
	TwilioAccountSID          string
	TwilioAuthToken           string
	TwilioFromNumber          string
	TwilioMessagingServiceSID string
	TwilioVerifyServiceSID    string
}

func Load() Config {
	dbURL := getenv("DATABASE_URL", "")
	if dbURL == "" {
		dbURL = buildDatabaseURL()
	}

	return Config{
		Env:                       getenv("APP_ENV", "development"),
		Port:                      getenv("APP_PORT", "8081"),
		DatabaseURL:               dbURL,
		CORSOrigins:               getenv("CORS_ORIGINS", "http://localhost:3000"),
		CurrentUserID:             getenv("APP_CURRENT_USER_ID", "1"),
		CurrentUserName:           getenv("APP_CURRENT_USER_NAME", "Kevin Arora"),
		CurrentUserPhone:          getenv("APP_CURRENT_USER_PHONE", "+919876500000"),
		SMSProvider:               getenv("SMS_PROVIDER", "log"),
		TwilioAccountSID:          getenv("TWILIO_ACCOUNT_SID", ""),
		TwilioAuthToken:           getenv("TWILIO_AUTH_TOKEN", ""),
		TwilioFromNumber:          getenv("TWILIO_FROM_PHONE_NUMBER", ""),
		TwilioMessagingServiceSID: getenv("TWILIO_MESSAGING_SERVICE_SID", ""),
		TwilioVerifyServiceSID:    getenv("TWILIO_VERIFY_SERVICE_SID", ""),
	}
}

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func buildDatabaseURL() string {
	host := getenv("DB_HOST", "localhost")
	port := getenv("DB_PORT", "5432")
	name := getenv("DB_NAME", "zistributo")
	user := getenv("DB_USER", "postgres")
	password := os.Getenv("DB_PASSWORD")
	sslmode := getenv("DB_SSLMODE", "disable")

	if password == "" {
		return fmt.Sprintf("postgres://%s@%s:%s/%s?sslmode=%s",
			url.QueryEscape(user),
			host,
			port,
			name,
			url.QueryEscape(sslmode),
		)
	}

	return fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=%s",
		url.QueryEscape(user),
		url.QueryEscape(password),
		host,
		port,
		name,
		url.QueryEscape(sslmode),
	)
}
