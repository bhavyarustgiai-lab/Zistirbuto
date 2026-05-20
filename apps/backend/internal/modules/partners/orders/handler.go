package orders

import (
	"net/http"

	"github.com/zistributo/zistributo/apps/backend/internal/platform/auth"
	"github.com/zistributo/zistributo/apps/backend/internal/platform/httpx"
	"github.com/zistributo/zistributo/apps/backend/internal/store"
)

type Handler struct {
	store *store.Store
}

func NewHandler(st *store.Store) *Handler {
	return &Handler{store: st}
}

func RegisterRoutes(mux *http.ServeMux, prefix string, st *store.Store) {
	h := NewHandler(st)

	mux.HandleFunc("GET "+prefix+"/partners/firms/{firmId}/orders", h.List)
	mux.HandleFunc("POST "+prefix+"/partners/firms/{firmId}/orders", h.Create)
	mux.HandleFunc("GET "+prefix+"/partners/firms/{firmId}/orders/{orderId}", h.Get)
	mux.HandleFunc("PUT "+prefix+"/partners/firms/{firmId}/orders/{orderId}", h.Update)
	mux.HandleFunc("POST "+prefix+"/partners/firms/{firmId}/orders/{orderId}/status", h.UpdateStatus)
	mux.HandleFunc("GET "+prefix+"/partners/firms/{firmId}/orders/{orderId}/returns", h.ListReturns)
	mux.HandleFunc("POST "+prefix+"/partners/firms/{firmId}/orders/{orderId}/returns", h.CreateReturn)
	mux.HandleFunc("POST "+prefix+"/partners/firms/{firmId}/orders/{orderId}/returns/{returnId}/void", h.VoidReturn)
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	service, ok := h.serviceForRequest(w, r)
	if !ok {
		return
	}
	items, err := service.List(r.Context(), r.PathValue("firmId"))
	if err != nil {
		httpx.WriteError(w, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, items)
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	service, ok := h.serviceForRequest(w, r)
	if !ok {
		return
	}
	var req CreateRequest
	if err := httpx.DecodeJSON(r, &req); err != nil {
		httpx.BadRequest(w, err.Error())
		return
	}
	item, err := service.Create(r.Context(), r.PathValue("firmId"), req)
	if err != nil {
		httpx.WriteError(w, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, item)
}

func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	service, ok := h.serviceForRequest(w, r)
	if !ok {
		return
	}
	item, err := service.Get(r.Context(), r.PathValue("firmId"), r.PathValue("orderId"))
	if err != nil {
		httpx.WriteError(w, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, item)
}

func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	service, ok := h.serviceForRequest(w, r)
	if !ok {
		return
	}
	var req UpdateRequest
	if err := httpx.DecodeJSON(r, &req); err != nil {
		httpx.BadRequest(w, err.Error())
		return
	}
	item, err := service.Update(r.Context(), r.PathValue("firmId"), r.PathValue("orderId"), req)
	if err != nil {
		httpx.WriteError(w, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, item)
}

func (h *Handler) UpdateStatus(w http.ResponseWriter, r *http.Request) {
	var req StatusRequest
	if err := httpx.DecodeJSON(r, &req); err != nil {
		httpx.BadRequest(w, err.Error())
		return
	}
	service, ok := h.serviceForRequest(w, r)
	if !ok {
		return
	}
	item, err := service.UpdateStatus(r.Context(), r.PathValue("firmId"), r.PathValue("orderId"), req)
	if err != nil {
		httpx.WriteError(w, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, item)
}

func (h *Handler) ListReturns(w http.ResponseWriter, r *http.Request) {
	service, ok := h.serviceForRequest(w, r)
	if !ok {
		return
	}
	items, err := service.ListReturns(r.Context(), r.PathValue("firmId"), r.PathValue("orderId"))
	if err != nil {
		httpx.WriteError(w, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, items)
}

func (h *Handler) CreateReturn(w http.ResponseWriter, r *http.Request) {
	service, ok := h.serviceForRequest(w, r)
	if !ok {
		return
	}
	var req CreateReturnRequest
	if err := httpx.DecodeJSON(r, &req); err != nil {
		httpx.BadRequest(w, err.Error())
		return
	}
	item, err := service.CreateReturn(r.Context(), r.PathValue("firmId"), r.PathValue("orderId"), req)
	if err != nil {
		httpx.WriteError(w, err)
		return
	}
	httpx.WriteJSON(w, http.StatusCreated, item)
}

func (h *Handler) VoidReturn(w http.ResponseWriter, r *http.Request) {
	service, ok := h.serviceForRequest(w, r)
	if !ok {
		return
	}
	item, err := service.VoidReturn(r.Context(), r.PathValue("firmId"), r.PathValue("orderId"), r.PathValue("returnId"))
	if err != nil {
		httpx.WriteError(w, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, item)
}

func (h *Handler) serviceForRequest(w http.ResponseWriter, r *http.Request) (*Service, bool) {
	st, err := auth.StoreForRequest(r, h.store)
	if err != nil {
		httpx.WriteError(w, err)
		return nil, false
	}
	return NewService(st), true
}
