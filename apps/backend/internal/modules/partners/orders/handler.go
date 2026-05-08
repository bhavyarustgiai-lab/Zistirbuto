package orders

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"github.com/zistributo/zistributo/apps/backend/internal/store"
)

type Handler struct {
	service *Service
}

func NewHandler(st *store.Store) *Handler {
	return &Handler{service: NewService(st)}
}

func (h *Handler) UpdateStatus(w http.ResponseWriter, r *http.Request) {
	var req StatusRequest
	if err := decodeJSON(r, &req); err != nil {
		badRequest(w, err.Error())
		return
	}
	item, err := h.service.UpdateStatus(r.Context(), r.PathValue("firmId"), r.PathValue("orderId"), req)
	if err != nil {
		var forbiddenErr ErrForbidden
		if errors.As(err, &forbiddenErr) {
			forbidden(w, err.Error())
			return
		}
		if strings.Contains(strings.ToLower(err.Error()), "not found") {
			notFound(w, err.Error())
			return
		}
		badRequest(w, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func decodeJSON(r *http.Request, dest any) error {
	defer r.Body.Close()
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	return decoder.Decode(dest)
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func badRequest(w http.ResponseWriter, message string) {
	writeJSON(w, http.StatusBadRequest, map[string]any{"error": message})
}

func notFound(w http.ResponseWriter, message string) {
	writeJSON(w, http.StatusNotFound, map[string]any{"error": message})
}

func forbidden(w http.ResponseWriter, message string) {
	writeJSON(w, http.StatusForbidden, map[string]any{"error": message})
}
