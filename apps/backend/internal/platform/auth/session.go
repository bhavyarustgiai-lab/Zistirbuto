package auth

import (
	"net/http"
	"strings"
	"time"

	"github.com/zistributo/zistributo/apps/backend/internal/platform/apperrors"
	"github.com/zistributo/zistributo/apps/backend/internal/store"
)

const (
	SessionCookieName = "zistributo_session"
	SessionTTL        = 7 * 24 * time.Hour
)

func TokenFromRequest(r *http.Request) string {
	cookie, err := r.Cookie(SessionCookieName)
	if err != nil {
		return ""
	}
	return strings.TrimSpace(cookie.Value)
}

func StoreForRequest(r *http.Request, base *store.Store) (*store.Store, error) {
	token := TokenFromRequest(r)
	if token == "" {
		return nil, apperrors.Unauthorized("authentication required")
	}
	user, err := base.UserBySessionToken(token)
	if err != nil {
		return nil, apperrors.Unauthorized("authentication required")
	}
	return base.ForUser(user), nil
}

func SetSessionCookie(w http.ResponseWriter, token string) {
	http.SetCookie(w, &http.Cookie{
		Name:     SessionCookieName,
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   int(SessionTTL.Seconds()),
	})
}

func ClearSessionCookie(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     SessionCookieName,
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   -1,
	})
}
