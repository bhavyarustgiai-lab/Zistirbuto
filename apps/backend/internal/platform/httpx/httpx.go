package httpx

import (
	"encoding/json"
	"net/http"

	"github.com/zistributo/zistributo/apps/backend/internal/platform/apperrors"
)

func DecodeJSON(r *http.Request, dest any) error {
	defer r.Body.Close()
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	return decoder.Decode(dest)
}

func WriteJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func WriteError(w http.ResponseWriter, err error) {
	if appErr, ok := apperrors.As(err); ok {
		WriteJSON(w, apperrors.HTTPStatus(appErr), appErr)
		return
	}
	WriteJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
}

func BadRequest(w http.ResponseWriter, message string) {
	WriteJSON(w, http.StatusBadRequest, map[string]any{"error": message})
}

func NotFound(w http.ResponseWriter, message string) {
	WriteJSON(w, http.StatusNotFound, map[string]any{"error": message})
}

func Forbidden(w http.ResponseWriter, message string) {
	WriteJSON(w, http.StatusForbidden, map[string]any{"error": message})
}

func Unauthorized(w http.ResponseWriter, message string) {
	WriteJSON(w, http.StatusUnauthorized, map[string]any{"error": message})
}

func InternalError(w http.ResponseWriter, err error) {
	WriteJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
}
