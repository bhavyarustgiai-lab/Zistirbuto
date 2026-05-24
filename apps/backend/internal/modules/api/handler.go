package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	backendphone "github.com/zistributo/zistributo/apps/backend/internal/common/phone"
	partnerorders "github.com/zistributo/zistributo/apps/backend/internal/modules/partners/orders"
	"github.com/zistributo/zistributo/apps/backend/internal/platform/auth"
	"github.com/zistributo/zistributo/apps/backend/internal/sms"
	"github.com/zistributo/zistributo/apps/backend/internal/store"
)

type Handler struct {
	store        *store.Store
	otpService   sms.AuthOTPService
	exposeDevOTP bool
}

func RegisterRoutes(mux *http.ServeMux, prefix string, st *store.Store, otpService sms.AuthOTPService, exposeDevOTP bool) {
	h := &Handler{
		store:        st,
		otpService:   otpService,
		exposeDevOTP: exposeDevOTP,
	}

	registerCoreRoutes(mux, prefix, h)
	registerLegacyPartnerRoutes(mux, prefix, h)
	partnerorders.RegisterRoutes(mux, prefix, st)
}

func registerCoreRoutes(mux *http.ServeMux, prefix string, h *Handler) {
	mux.HandleFunc("GET "+prefix+"/health", h.health)
	mux.HandleFunc("POST "+prefix+"/auth/otp/request", h.requestLoginOTP)
	mux.HandleFunc("POST "+prefix+"/auth/otp/verify", h.verifyLoginOTP)
	mux.HandleFunc("PATCH "+prefix+"/auth/profile", h.updateAuthProfile)
	mux.HandleFunc("POST "+prefix+"/auth/logout", h.logout)
	mux.HandleFunc("GET "+prefix+"/me", h.getMe)
}

func registerLegacyPartnerRoutes(mux *http.ServeMux, prefix string, h *Handler) {
	mux.HandleFunc("GET "+prefix+"/partners/me", h.getPartnersMe)
	mux.HandleFunc("POST "+prefix+"/partners/firms", h.createPartnerFirm)
	mux.HandleFunc("GET "+prefix+"/partners/firms/{firmId}", h.getPartnerFirm)
	mux.HandleFunc("PATCH "+prefix+"/partners/firms/{firmId}", h.updatePartnerFirm)
	mux.HandleFunc("GET "+prefix+"/partners/firms/{firmId}/memberships", h.getPartnerFirmMemberships)
	mux.HandleFunc("POST "+prefix+"/partners/firms/{firmId}/memberships", h.createPartnerFirmMembership)
	mux.HandleFunc("DELETE "+prefix+"/partners/firms/{firmId}/memberships/{userId}", h.removePartnerFirmMembership)
	mux.HandleFunc("GET "+prefix+"/partners/firms/{firmId}/invites", h.getPartnerFirmInvites)
	mux.HandleFunc("POST "+prefix+"/partners/firms/{firmId}/invites/{inviteId}/revoke", h.revokePartnerFirmInvite)
	mux.HandleFunc("GET "+prefix+"/partners/firms/{firmId}/dashboard", h.getPartnerDashboard)
	mux.HandleFunc("GET "+prefix+"/partners/firms/{firmId}/brands", h.getPartnerFirmBrands)
	mux.HandleFunc("POST "+prefix+"/partners/firms/{firmId}/brands", h.createPartnerFirmBrand)
	mux.HandleFunc("DELETE "+prefix+"/partners/firms/{firmId}/brands/{brandId}", h.deletePartnerFirmBrand)
	mux.HandleFunc("GET "+prefix+"/partners/firms/{firmId}/brands/{brandId}/items", h.getPartnerBrandItems)
	mux.HandleFunc("POST "+prefix+"/partners/firms/{firmId}/brands/{brandId}/items", h.createPartnerBrandItem)
	mux.HandleFunc("PATCH "+prefix+"/partners/firms/{firmId}/brands/{brandId}/items/{itemId}", h.updatePartnerBrandItem)
	mux.HandleFunc("GET "+prefix+"/partners/firms/{firmId}/clients", h.getPartnerClients)
	mux.HandleFunc("GET "+prefix+"/partners/firms/{firmId}/client-businesses", h.getPartnerClientBusinesses)
	mux.HandleFunc("GET "+prefix+"/partners/firms/{firmId}/client-businesses/validate-gstin", h.validatePartnerClientBusinessGSTIN)
	mux.HandleFunc("POST "+prefix+"/partners/firms/{firmId}/client-businesses", h.createPartnerClientBusiness)
	mux.HandleFunc("PATCH "+prefix+"/partners/firms/{firmId}/client-businesses/{businessId}", h.updatePartnerClientBusiness)
	mux.HandleFunc("POST "+prefix+"/partners/firms/{firmId}/client-businesses/{businessId}/archive", h.archivePartnerClientBusiness)
	mux.HandleFunc("POST "+prefix+"/partners/firms/{firmId}/client-businesses/{businessId}/outlets", h.addPartnerClientOutlet)
	mux.HandleFunc("PATCH "+prefix+"/partners/firms/{firmId}/client-businesses/{businessId}/outlets/{outletId}", h.updatePartnerClientOutlet)
	mux.HandleFunc("POST "+prefix+"/partners/firms/{firmId}/client-businesses/{businessId}/outlets/{outletId}/archive", h.archivePartnerClientOutlet)
	mux.HandleFunc("GET "+prefix+"/partners/firms/{firmId}/receivables", h.getPartnerReceivablesSummary)
	mux.HandleFunc("GET "+prefix+"/partners/firms/{firmId}/payments", h.getPartnerPayments)
	mux.HandleFunc("POST "+prefix+"/partners/firms/{firmId}/payments", h.createPartnerPayment)
	mux.HandleFunc("GET "+prefix+"/partners/firms/{firmId}/client-ledger", h.getPartnerClientLedger)
	mux.HandleFunc("GET "+prefix+"/partners/firms/{firmId}/payables", h.getPartnerPayables)
	mux.HandleFunc("GET "+prefix+"/partners/firms/{firmId}/supplier-invoices", h.getPartnerSupplierInvoices)
	mux.HandleFunc("POST "+prefix+"/partners/firms/{firmId}/supplier-invoices", h.createPartnerSupplierInvoice)
	mux.HandleFunc("POST "+prefix+"/partners/firms/{firmId}/supplier-invoices/{supplierInvoiceId}/finalize", h.finalizePartnerSupplierInvoice)
	mux.HandleFunc("GET "+prefix+"/partners/firms/{firmId}/supplier-payments", h.getPartnerSupplierPayments)
	mux.HandleFunc("POST "+prefix+"/partners/firms/{firmId}/supplier-payments", h.createPartnerSupplierPayment)
	mux.HandleFunc("GET "+prefix+"/partners/firms/{firmId}/supplier-ledger", h.getPartnerSupplierLedger)
	mux.HandleFunc("GET "+prefix+"/partners/firms/{firmId}/invoices", h.getPartnerInvoices)
	mux.HandleFunc("POST "+prefix+"/partners/firms/{firmId}/invoices", h.createPartnerInvoice)
	mux.HandleFunc("GET "+prefix+"/partners/firms/{firmId}/invoices/{invoiceId}", h.getPartnerInvoiceByID)
	mux.HandleFunc("POST "+prefix+"/partners/firms/{firmId}/invoices/{invoiceId}/finalize", h.finalizePartnerInvoice)
	mux.HandleFunc("POST "+prefix+"/partners/firms/{firmId}/invoices/{invoiceId}/cancel", h.cancelPartnerInvoice)
	mux.HandleFunc("GET "+prefix+"/partners/firms/{firmId}/credit-notes", h.getPartnerCreditNotes)
	mux.HandleFunc("POST "+prefix+"/partners/firms/{firmId}/credit-notes", h.createPartnerCreditNote)
	mux.HandleFunc("GET "+prefix+"/partners/firms/{firmId}/debit-notes", h.getPartnerDebitNotes)
	mux.HandleFunc("POST "+prefix+"/partners/firms/{firmId}/debit-notes", h.createPartnerDebitNote)
	mux.HandleFunc("GET "+prefix+"/partners/firms/{firmId}/audit", h.getPartnerAuditLogs)
	mux.HandleFunc("GET "+prefix+"/partners/firms/{firmId}/search", h.getPartnerGlobalSearch)
	mux.HandleFunc("GET "+prefix+"/partners/firms/{firmId}/suppliers", h.getPartnerSuppliers)
	mux.HandleFunc("GET "+prefix+"/partners/firms/{firmId}/suppliers/validate-gstin", h.validatePartnerSupplierGSTIN)
	mux.HandleFunc("POST "+prefix+"/partners/firms/{firmId}/suppliers", h.createPartnerSupplier)
	mux.HandleFunc("PATCH "+prefix+"/partners/firms/{firmId}/suppliers/{supplierId}", h.updatePartnerSupplier)
	mux.HandleFunc("POST "+prefix+"/partners/firms/{firmId}/suppliers/{supplierId}/archive", h.archivePartnerSupplier)
	mux.HandleFunc("GET "+prefix+"/partners/firms/{firmId}/purchases", h.getPartnerPurchases)
	mux.HandleFunc("POST "+prefix+"/partners/firms/{firmId}/purchases", h.createPartnerPurchase)
	mux.HandleFunc("GET "+prefix+"/partners/firms/{firmId}/purchases/{purchaseId}", h.getPartnerPurchaseByID)
	mux.HandleFunc("PATCH "+prefix+"/partners/firms/{firmId}/purchases/{purchaseId}", h.updatePartnerPurchase)
	mux.HandleFunc("POST "+prefix+"/partners/firms/{firmId}/purchases/{purchaseId}/order", h.orderPartnerPurchase)
	mux.HandleFunc("POST "+prefix+"/partners/firms/{firmId}/purchases/{purchaseId}/cancel", h.cancelPartnerPurchase)
	mux.HandleFunc("GET "+prefix+"/partners/firms/{firmId}/purchases/{purchaseId}/receipts", h.getPartnerGoodsReceipts)
	mux.HandleFunc("POST "+prefix+"/partners/firms/{firmId}/purchases/{purchaseId}/receipts", h.receivePartnerPurchase)
	mux.HandleFunc("GET "+prefix+"/partners/firms/{firmId}/supplier-returns", h.getPartnerSupplierReturns)
	mux.HandleFunc("POST "+prefix+"/partners/firms/{firmId}/supplier-returns", h.createPartnerSupplierReturn)
	mux.HandleFunc("GET "+prefix+"/partners/firms/{firmId}/supplier-returns/{returnId}", h.getPartnerSupplierReturnByID)
	mux.HandleFunc("PATCH "+prefix+"/partners/firms/{firmId}/supplier-returns/{returnId}", h.updatePartnerSupplierReturn)
	mux.HandleFunc("POST "+prefix+"/partners/firms/{firmId}/supplier-returns/{returnId}/cancel", h.cancelPartnerSupplierReturn)
	mux.HandleFunc("POST "+prefix+"/partners/firms/{firmId}/supplier-returns/{returnId}/complete", h.completePartnerSupplierReturn)
	mux.HandleFunc("GET "+prefix+"/partners/firms/{firmId}/stock", h.getPartnerStock)
	mux.HandleFunc("GET "+prefix+"/partners/firms/{firmId}/stock/reference-ledger", h.getPartnerStockLedgerByReference)
	mux.HandleFunc("GET "+prefix+"/partners/firms/{firmId}/stock/{itemId}/ledger", h.getPartnerStockLedger)
	mux.HandleFunc("POST "+prefix+"/partners/firms/{firmId}/stock/adjustments", h.createPartnerStockAdjustment)
	mux.HandleFunc("POST "+prefix+"/partners/firms/{firmId}/stock/actions", h.createPartnerStockAction)
	mux.HandleFunc("GET "+prefix+"/partners/firms/{firmId}/inventory", h.getPartnerInventory)
	mux.HandleFunc("POST "+prefix+"/partners/firms/{firmId}/inventory", h.createPartnerInventory)
	mux.HandleFunc("PATCH "+prefix+"/partners/firms/{firmId}/inventory/{itemId}", h.updatePartnerInventory)
	mux.HandleFunc("GET "+prefix+"/partners/firms/{firmId}/inventory/history", h.getPartnerInventoryHistory)
}

func (h *Handler) health(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{"ok": true})
}

func (h *Handler) requestLoginOTP(w http.ResponseWriter, r *http.Request) {
	var req store.RequestLoginOTPInput
	if err := decodeJSON(r, &req); err != nil {
		badRequest(w, err.Error())
		return
	}
	if h.otpService.UsesRemoteVerification() {
		phone, err := backendphone.NormalizeE164(req.Phone)
		if err != nil {
			badRequest(w, err.Error())
			return
		}
		if err := h.otpService.RequestOTP(r.Context(), phone, ""); err != nil {
			internalError(w, err)
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{
			"ok":        true,
			"phone":     phone,
			"expiresAt": time.Now().UTC().Add(store.LoginOTPTTL).Format(time.RFC3339),
		})
		return
	}
	result, err := h.store.RequestLoginOTP(req)
	if err != nil {
		badRequest(w, err.Error())
		return
	}
	if err := h.otpService.RequestOTP(r.Context(), result.Phone, result.OTP); err != nil {
		internalError(w, err)
		return
	}
	response := map[string]any{"ok": true, "phone": result.Phone, "expiresAt": result.ExpiresAt}
	if h.exposeDevOTP {
		response["otp"] = result.OTP
	}
	writeJSON(w, http.StatusOK, response)
}

func (h *Handler) verifyLoginOTP(w http.ResponseWriter, r *http.Request) {
	var req store.VerifyLoginOTPInput
	if err := decodeJSON(r, &req); err != nil {
		badRequest(w, err.Error())
		return
	}
	var user *store.User
	if h.otpService.UsesRemoteVerification() {
		phone, err := backendphone.NormalizeE164(req.Phone)
		if err != nil {
			badRequest(w, err.Error())
			return
		}
		code := strings.TrimSpace(req.OTP)
		if code == "" {
			badRequest(w, "phone and otp are required")
			return
		}
		if err := h.otpService.VerifyOTP(r.Context(), phone, code); err != nil {
			badRequest(w, err.Error())
			return
		}
		resolvedUser, err := h.store.FindOrCreateUserByPhone(phone)
		if err != nil {
			internalError(w, err)
			return
		}
		if err := h.store.ActivatePartnerFirmInvitesForPhone(resolvedUser.ID, phone); err != nil {
			internalError(w, err)
			return
		}
		user = &resolvedUser
	} else {
		result, err := h.store.VerifyLoginOTP(req)
		if err != nil {
			badRequest(w, err.Error())
			return
		}
		if result.User == nil {
			internalError(w, fmt.Errorf("otp verification returned no user"))
			return
		}
		user = result.User
	}
	session, err := h.store.CreateSession(user.ID, auth.SessionTTL)
	if err != nil {
		internalError(w, err)
		return
	}
	h.setSessionCookie(w, session.Token)
	writeJSON(w, http.StatusOK, map[string]any{
		"user": user,
	})
}

func (h *Handler) updateAuthProfile(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	var req store.UpdateCurrentUserProfileInput
	if err := decodeJSON(r, &req); err != nil {
		badRequest(w, err.Error())
		return
	}
	user, err := st.UpdateCurrentUserProfile(req)
	if err != nil {
		badRequest(w, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"user": user})
}

func (h *Handler) logout(w http.ResponseWriter, r *http.Request) {
	token := h.sessionTokenFromRequest(r)
	if token != "" {
		_ = h.store.DeleteSessionByToken(token)
	}
	h.clearSessionCookie(w)
	writeJSON(w, http.StatusOK, map[string]any{"ok": true})
}

func (h *Handler) getMe(w http.ResponseWriter, r *http.Request) {
	token := h.sessionTokenFromRequest(r)
	if token == "" {
		unauthorized(w, "authentication required")
		return
	}
	user, err := h.store.UserBySessionToken(token)
	if err != nil {
		unauthorized(w, "authentication required")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"user": user})
}

func (h *Handler) createEntity(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	var req store.CreateEntityInput
	if err := decodeJSON(r, &req); err != nil {
		badRequest(w, err.Error())
		return
	}
	if strings.TrimSpace(req.Name) == "" || strings.TrimSpace(req.OwnerName) == "" || strings.TrimSpace(req.OwnerPhone) == "" {
		badRequest(w, "ownerName, ownerPhone, and name are required")
		return
	}
	client, err := st.CreateEntity(req)
	if err != nil {
		internalError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, client)
}

func (h *Handler) getMembers(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	entityID := r.URL.Query().Get("entityId")
	if entityID == "" {
		badRequest(w, "entityId is required")
		return
	}
	if !st.HasEntityAccess(entityID) {
		forbidden(w, "entity access denied")
		return
	}
	items, err := st.GetMembers(entityID)
	if err != nil {
		internalError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, items)
}

func (h *Handler) removeMember(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	entityID := r.URL.Query().Get("entityId")
	userID := r.PathValue("userId")
	if entityID == "" || userID == "" {
		badRequest(w, "entityId and userId are required")
		return
	}
	if !h.canManageUsers(st, entityID) {
		forbidden(w, "only owner or account manager can manage users")
		return
	}
	ok, err := st.RemoveMember(entityID, userID)
	if err != nil {
		internalError(w, err)
		return
	}
	if !ok {
		notFound(w, "member not found")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"ok": true})
}

func (h *Handler) getInvites(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	entityID := r.URL.Query().Get("entityId")
	if entityID == "" {
		badRequest(w, "entityId is required")
		return
	}
	role, hasRole := st.CurrentUserRole(entityID)
	if !hasRole || role == store.RoleStaff {
		forbidden(w, "only non-staff members can view invites")
		return
	}
	items, err := st.GetInvites(entityID)
	if err != nil {
		internalError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, items)
}

func (h *Handler) createInvite(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	var req store.CreateInviteInput
	if err := decodeJSON(r, &req); err != nil {
		badRequest(w, err.Error())
		return
	}
	if req.EntityID == "" || strings.TrimSpace(req.Phone) == "" {
		badRequest(w, "entityId and phone are required")
		return
	}
	if role, hasRole := st.CurrentUserRole(req.EntityID); !hasRole || role != store.RoleOwner {
		forbidden(w, "only owner can invite users")
		return
	}
	invite, err := st.CreateInvite(req)
	if err != nil {
		badRequest(w, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, invite)
}

func (h *Handler) acceptInvite(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	var req store.AcceptInviteInput
	if err := decodeJSON(r, &req); err != nil {
		badRequest(w, err.Error())
		return
	}
	member, err := st.AcceptInvite(req.Token)
	if err != nil {
		badRequest(w, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, member)
}

func (h *Handler) revokeInvite(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	inviteID := r.PathValue("inviteId")
	if inviteID == "" {
		badRequest(w, "inviteId is required")
		return
	}
	entityID := st.EntityIDForInvite(inviteID)
	if entityID == "" || !h.canManageUsers(st, entityID) {
		forbidden(w, "only owner or account manager can manage users")
		return
	}
	ok, err := st.RevokeInvite(inviteID)
	if err != nil {
		internalError(w, err)
		return
	}
	if !ok {
		notFound(w, "invite not found")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"ok": true})
}

func (h *Handler) getServices(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	clientID := r.URL.Query().Get("clientId")
	if clientID == "" {
		badRequest(w, "clientId is required")
		return
	}
	if !st.HasEntityAccess(clientID) {
		forbidden(w, "entity access denied")
		return
	}
	items, err := st.GetServices(clientID)
	if err != nil {
		internalError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, items)
}

func (h *Handler) createService(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	var req store.CreateServiceInput
	if err := decodeJSON(r, &req); err != nil {
		badRequest(w, err.Error())
		return
	}
	if req.ClientID == "" || strings.TrimSpace(req.Name) == "" {
		badRequest(w, "clientId and name are required")
		return
	}
	if !st.HasEntityAccess(req.ClientID) {
		forbidden(w, "entity access denied")
		return
	}
	item, err := st.CreateService(req)
	if err != nil {
		internalError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (h *Handler) getServiceCategories(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	clientID := r.URL.Query().Get("clientId")
	if clientID == "" {
		badRequest(w, "clientId is required")
		return
	}
	if !st.HasEntityAccess(clientID) {
		forbidden(w, "entity access denied")
		return
	}
	items, err := st.GetServiceCategories(clientID)
	if err != nil {
		internalError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, items)
}

func (h *Handler) createServiceCategory(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	var req store.CreateServiceCategoryInput
	if err := decodeJSON(r, &req); err != nil {
		badRequest(w, err.Error())
		return
	}
	if req.ClientID == "" || strings.TrimSpace(req.Name) == "" {
		badRequest(w, "clientId and name are required")
		return
	}
	if !st.HasEntityAccess(req.ClientID) {
		forbidden(w, "entity access denied")
		return
	}
	item, err := st.CreateServiceCategory(req)
	if err != nil {
		internalError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (h *Handler) updateService(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	var req store.UpdateServiceInput
	if err := decodeJSON(r, &req); err != nil {
		badRequest(w, err.Error())
		return
	}
	serviceID := r.PathValue("id")
	clientID := st.ClientIDForService(serviceID)
	if clientID == "" {
		notFound(w, "service not found")
		return
	}
	if !st.HasEntityAccess(clientID) {
		forbidden(w, "entity access denied")
		return
	}
	item, err := st.UpdateService(serviceID, req)
	if err != nil {
		notFound(w, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (h *Handler) deleteService(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	serviceID := r.PathValue("id")
	clientID := st.ClientIDForService(serviceID)
	if clientID == "" {
		notFound(w, "service not found")
		return
	}
	if !st.HasEntityAccess(clientID) {
		forbidden(w, "entity access denied")
		return
	}
	if err := st.DeleteService(serviceID); err != nil {
		notFound(w, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"ok": true})
}

func (h *Handler) updateServiceCategory(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	var req store.UpdateServiceCategoryInput
	if err := decodeJSON(r, &req); err != nil {
		badRequest(w, err.Error())
		return
	}
	categoryID := r.PathValue("id")
	clientID := st.ClientIDForServiceCategory(categoryID)
	if clientID == "" {
		notFound(w, "category not found")
		return
	}
	if !st.HasEntityAccess(clientID) {
		forbidden(w, "entity access denied")
		return
	}
	item, err := st.UpdateServiceCategory(categoryID, req)
	if err != nil {
		notFound(w, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (h *Handler) deleteServiceCategory(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	categoryID := r.PathValue("id")
	clientID := st.ClientIDForServiceCategory(categoryID)
	if clientID == "" {
		notFound(w, "category not found")
		return
	}
	if !st.HasEntityAccess(clientID) {
		forbidden(w, "entity access denied")
		return
	}
	if err := st.DeleteServiceCategory(categoryID); err != nil {
		notFound(w, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"ok": true})
}

func (h *Handler) getStaffCapabilities(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	entityID := r.URL.Query().Get("entityId")
	if entityID == "" {
		badRequest(w, "entityId is required")
		return
	}
	if !st.HasEntityAccess(entityID) {
		forbidden(w, "entity access denied")
		return
	}
	items, err := st.GetStaffCapabilities(entityID)
	if err != nil {
		internalError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, items)
}

func (h *Handler) updateStaffCapabilities(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	var req store.UpdateStaffCapabilitiesInput
	if err := decodeJSON(r, &req); err != nil {
		badRequest(w, err.Error())
		return
	}
	if req.EntityID == "" {
		badRequest(w, "entityId is required")
		return
	}
	if !h.canEditStaffCapabilities(st, req.EntityID) {
		forbidden(w, "only owner, manager, or account manager can edit staff capabilities")
		return
	}
	items, err := st.UpdateStaffCapabilities(r.PathValue("userId"), req)
	if err != nil {
		internalError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, items)
}

func (h *Handler) getDayEntries(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	clientID := r.URL.Query().Get("clientId")
	if clientID == "" {
		badRequest(w, "clientId is required")
		return
	}
	if !st.HasEntityAccess(clientID) {
		forbidden(w, "entity access denied")
		return
	}
	items, err := st.GetDayEntries(clientID, r.URL.Query().Get("from"), r.URL.Query().Get("to"))
	if err != nil {
		internalError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, items)
}

func (h *Handler) createDayEntry(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	var req store.CreateDayEntryInput
	if err := decodeJSON(r, &req); err != nil {
		badRequest(w, err.Error())
		return
	}
	if req.ClientID == "" || req.ServiceID == "" || req.StaffID == "" || req.Date == "" {
		badRequest(w, "clientId, serviceId, staffId, and date are required")
		return
	}
	if !st.HasEntityAccess(req.ClientID) {
		forbidden(w, "entity access denied")
		return
	}
	item, err := st.CreateDayEntry(req)
	if err != nil {
		internalError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (h *Handler) updateDayEntry(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	var req store.UpdateDayEntryInput
	if err := decodeJSON(r, &req); err != nil {
		badRequest(w, err.Error())
		return
	}
	if req.StaffID != nil && strings.TrimSpace(*req.StaffID) == "" {
		badRequest(w, "staffId cannot be empty")
		return
	}
	if req.StaffIDs != nil && len(req.StaffIDs) == 0 {
		badRequest(w, "staffIds cannot be empty")
		return
	}
	entryID := r.PathValue("id")
	clientID := st.ClientIDForDayEntry(entryID)
	if clientID == "" {
		notFound(w, "day entry not found")
		return
	}
	if !st.HasEntityAccess(clientID) {
		forbidden(w, "entity access denied")
		return
	}
	item, err := st.UpdateDayEntry(entryID, req)
	if err != nil {
		notFound(w, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (h *Handler) deleteDayEntry(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	entryID := r.PathValue("id")
	clientID := st.ClientIDForDayEntry(entryID)
	if clientID == "" {
		notFound(w, "day entry not found")
		return
	}
	if !st.HasEntityAccess(clientID) {
		forbidden(w, "entity access denied")
		return
	}
	ok, err := st.DeleteDayEntry(entryID)
	if err != nil {
		internalError(w, err)
		return
	}
	if !ok {
		notFound(w, "day entry not found")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"ok": true})
}

func (h *Handler) createPayment(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	var req store.CreatePaymentInput
	if err := decodeJSON(r, &req); err != nil {
		badRequest(w, err.Error())
		return
	}
	if req.ClientID == "" || req.DayEntryID == "" || req.Amount <= 0 {
		badRequest(w, "clientId, dayEntryId, and positive amount are required")
		return
	}
	if !st.HasEntityAccess(req.ClientID) {
		forbidden(w, "entity access denied")
		return
	}
	item, err := st.CreatePayment(req)
	if err != nil {
		notFound(w, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (h *Handler) getPartnersMe(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	res, err := st.GetPartnersMe()
	if err != nil {
		internalError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, res)
}

func (h *Handler) createPartnerFirm(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	var req store.CreatePartnerFirmInput
	if err := decodeJSON(r, &req); err != nil {
		badRequest(w, err.Error())
		return
	}
	if strings.TrimSpace(req.Name) == "" || strings.TrimSpace(req.BillingAddress) == "" || strings.TrimSpace(req.City) == "" ||
		strings.TrimSpace(req.OwnerName) == "" || strings.TrimSpace(req.Phone) == "" ||
		strings.TrimSpace(req.Email) == "" {
		badRequest(w, "name, billingAddress, city, ownerName, phone, and email are required")
		return
	}
	item, err := st.CreatePartnerFirm(req)
	if err != nil {
		internalError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (h *Handler) getPartnerFirm(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	firmID := r.PathValue("firmId")
	if firmID == "" {
		badRequest(w, "firmId is required")
		return
	}
	if !st.UserHasPartnerFirmAccess(firmID) {
		forbidden(w, "firm access denied")
		return
	}
	item, err := st.GetPartnerFirm(firmID)
	if err != nil {
		internalError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (h *Handler) updatePartnerFirm(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	firmID := r.PathValue("firmId")
	if firmID == "" {
		badRequest(w, "firmId is required")
		return
	}
	if !st.UserHasPartnerFirmAccess(firmID) {
		forbidden(w, "firm access denied")
		return
	}
	var req store.UpdatePartnerFirmInput
	if err := decodeJSON(r, &req); err != nil {
		badRequest(w, err.Error())
		return
	}
	if strings.TrimSpace(req.Name) == "" || strings.TrimSpace(req.BillingAddress) == "" || strings.TrimSpace(req.City) == "" ||
		strings.TrimSpace(req.OwnerName) == "" || strings.TrimSpace(req.Phone) == "" ||
		strings.TrimSpace(req.Email) == "" {
		badRequest(w, "name, billingAddress, city, ownerName, phone, and email are required")
		return
	}
	item, err := st.UpdatePartnerFirm(firmID, req)
	if err != nil {
		internalError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (h *Handler) getPartnerFirmMemberships(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	firmID := r.PathValue("firmId")
	if firmID == "" {
		badRequest(w, "firmId is required")
		return
	}
	if !st.UserHasPartnerFirmAccess(firmID) {
		forbidden(w, "firm access denied")
		return
	}
	items, err := st.GetPartnerFirmMemberships(firmID)
	if err != nil {
		internalError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, items)
}

func (h *Handler) getPartnerFirmInvites(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	firmID := r.PathValue("firmId")
	if firmID == "" {
		badRequest(w, "firmId is required")
		return
	}
	if !h.canManagePartnerFirmMembers(st, firmID) {
		forbidden(w, "only owners can manage firm members")
		return
	}
	items, err := st.GetPartnerFirmInvites(firmID)
	if err != nil {
		internalError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, items)
}

func (h *Handler) createPartnerFirmMembership(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	firmID := r.PathValue("firmId")
	if firmID == "" {
		badRequest(w, "firmId is required")
		return
	}
	if !h.canManagePartnerFirmMembers(st, firmID) {
		forbidden(w, "only owners can manage firm members")
		return
	}
	var req store.CreatePartnerFirmInviteInput
	if err := decodeJSON(r, &req); err != nil {
		badRequest(w, err.Error())
		return
	}
	if strings.TrimSpace(req.Phone) == "" {
		badRequest(w, "phone is required")
		return
	}
	result, err := st.CreatePartnerFirmInvite(firmID, req)
	if err != nil {
		badRequest(w, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *Handler) removePartnerFirmMembership(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	firmID := r.PathValue("firmId")
	userID := r.PathValue("userId")
	if firmID == "" || userID == "" {
		badRequest(w, "firmId and userId are required")
		return
	}
	if !h.canManagePartnerFirmMembers(st, firmID) {
		forbidden(w, "only owners can manage firm members")
		return
	}
	role := store.PartnerFirmRole(strings.TrimSpace(r.URL.Query().Get("role")))
	if role == "" {
		badRequest(w, "role is required")
		return
	}
	if err := st.RemovePartnerFirmMembership(firmID, userID, role); err != nil {
		badRequest(w, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"ok": true})
}

func (h *Handler) revokePartnerFirmInvite(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	firmID := r.PathValue("firmId")
	inviteID := r.PathValue("inviteId")
	if firmID == "" || inviteID == "" {
		badRequest(w, "firmId and inviteId are required")
		return
	}
	if !h.canManagePartnerFirmMembers(st, firmID) {
		forbidden(w, "only owners can manage firm members")
		return
	}
	role := store.PartnerFirmRole(strings.TrimSpace(r.URL.Query().Get("role")))
	if role == "" {
		badRequest(w, "role is required")
		return
	}
	if err := st.RevokePartnerFirmInvite(firmID, inviteID, role); err != nil {
		badRequest(w, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"ok": true})
}

func (h *Handler) getPartnerDashboard(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	firmID := r.PathValue("firmId")
	if firmID == "" {
		badRequest(w, "firmId is required")
		return
	}
	if !st.UserHasPartnerFirmAccess(firmID) {
		forbidden(w, "firm access denied")
		return
	}
	res, err := st.GetPartnerDashboard(firmID)
	if err != nil {
		internalError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, res)
}

func (h *Handler) getPartnerFirmBrands(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	firmID := r.PathValue("firmId")
	if firmID == "" {
		badRequest(w, "firmId is required")
		return
	}
	if !st.UserHasPartnerFirmAccess(firmID) {
		forbidden(w, "firm access denied")
		return
	}
	items, err := st.GetPartnerFirmBrands(firmID)
	if err != nil {
		internalError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, items)
}

func (h *Handler) createPartnerFirmBrand(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	firmID := r.PathValue("firmId")
	if firmID == "" {
		badRequest(w, "firmId is required")
		return
	}
	if !st.UserHasPartnerFirmAccess(firmID) {
		forbidden(w, "firm access denied")
		return
	}

	var req store.CreatePartnerFirmBrandInput
	if err := decodeJSON(r, &req); err != nil {
		badRequest(w, err.Error())
		return
	}
	if strings.TrimSpace(req.BrandID) == "" && strings.TrimSpace(req.BrandName) == "" {
		badRequest(w, "brandId or brandName is required")
		return
	}

	item, err := st.CreatePartnerFirmBrand(firmID, req)
	if err != nil {
		internalError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (h *Handler) deletePartnerFirmBrand(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	firmID := r.PathValue("firmId")
	brandID := r.PathValue("brandId")
	if firmID == "" || brandID == "" {
		badRequest(w, "firmId and brandId are required")
		return
	}
	if !st.UserHasPartnerFirmAccess(firmID) {
		forbidden(w, "firm access denied")
		return
	}
	okDelete, err := st.DeletePartnerFirmBrand(firmID, brandID)
	if err != nil {
		internalError(w, err)
		return
	}
	if !okDelete {
		notFound(w, "brand mapping not found")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"ok": true})
}

func (h *Handler) getPartnerBrandItems(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	firmID := r.PathValue("firmId")
	brandID := r.PathValue("brandId")
	if firmID == "" || brandID == "" {
		badRequest(w, "firmId and brandId are required")
		return
	}
	if !st.UserHasPartnerFirmAccess(firmID) {
		forbidden(w, "firm access denied")
		return
	}
	if !st.HasPartnerFirmBrand(firmID, brandID) {
		notFound(w, "brand mapping not found")
		return
	}
	items, err := st.GetPartnerBrandItems(firmID, brandID)
	if err != nil {
		internalError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, items)
}

func (h *Handler) getPartnerClients(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	firmID := r.PathValue("firmId")
	if firmID == "" {
		badRequest(w, "firmId is required")
		return
	}
	if !st.UserHasPartnerFirmAccess(firmID) {
		forbidden(w, "firm access denied")
		return
	}
	items, err := st.GetPartnerClients(firmID, r.URL.Query().Get("q"))
	if err != nil {
		internalError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, items)
}

func (h *Handler) getPartnerClientBusinesses(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	firmID := r.PathValue("firmId")
	if firmID == "" {
		badRequest(w, "firmId is required")
		return
	}
	if !st.UserHasPartnerFirmAccess(firmID) {
		forbidden(w, "firm access denied")
		return
	}
	items, err := st.GetPartnerClientBusinesses(firmID, r.URL.Query().Get("q"))
	if err != nil {
		internalError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, items)
}

func (h *Handler) validatePartnerClientBusinessGSTIN(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	firmID := r.PathValue("firmId")
	if firmID == "" {
		badRequest(w, "firmId is required")
		return
	}
	if !st.UserHasPartnerFirmAccess(firmID) {
		forbidden(w, "firm access denied")
		return
	}
	res, err := st.ValidatePartnerBusinessGSTIN(firmID, r.URL.Query().Get("gstin"), r.URL.Query().Get("excludeBusinessId"))
	if err != nil {
		internalError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, res)
}

func (h *Handler) createPartnerClientBusiness(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	firmID := r.PathValue("firmId")
	if firmID == "" {
		badRequest(w, "firmId is required")
		return
	}
	if !st.UserHasPartnerFirmAccess(firmID) {
		forbidden(w, "firm access denied")
		return
	}
	var req store.CreatePartnerClientBusinessInput
	if err := decodeJSON(r, &req); err != nil {
		badRequest(w, err.Error())
		return
	}
	item, err := st.CreatePartnerClientBusiness(firmID, req)
	if err != nil {
		badRequest(w, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (h *Handler) updatePartnerClientBusiness(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	firmID := r.PathValue("firmId")
	businessID := r.PathValue("businessId")
	if firmID == "" || businessID == "" {
		badRequest(w, "firmId and businessId are required")
		return
	}
	if !st.UserHasPartnerFirmAccess(firmID) {
		forbidden(w, "firm access denied")
		return
	}
	var req store.UpdatePartnerClientBusinessInput
	if err := decodeJSON(r, &req); err != nil {
		badRequest(w, err.Error())
		return
	}
	item, err := st.UpdatePartnerClientBusiness(firmID, businessID, req)
	if err != nil {
		badRequest(w, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (h *Handler) archivePartnerClientBusiness(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	firmID := r.PathValue("firmId")
	businessID := r.PathValue("businessId")
	if firmID == "" || businessID == "" {
		badRequest(w, "firmId and businessId are required")
		return
	}
	if !st.UserHasPartnerFirmAccess(firmID) {
		forbidden(w, "firm access denied")
		return
	}
	item, err := st.ArchivePartnerClientBusiness(firmID, businessID)
	if err != nil {
		badRequest(w, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (h *Handler) addPartnerClientOutlet(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	firmID := r.PathValue("firmId")
	businessID := r.PathValue("businessId")
	if firmID == "" || businessID == "" {
		badRequest(w, "firmId and businessId are required")
		return
	}
	if !st.UserHasPartnerFirmAccess(firmID) {
		forbidden(w, "firm access denied")
		return
	}
	var req store.CreatePartnerClientOutletInput
	if err := decodeJSON(r, &req); err != nil {
		badRequest(w, err.Error())
		return
	}
	item, err := st.AddPartnerClientOutlet(firmID, businessID, req)
	if err != nil {
		badRequest(w, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (h *Handler) updatePartnerClientOutlet(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	firmID := r.PathValue("firmId")
	businessID := r.PathValue("businessId")
	outletID := r.PathValue("outletId")
	if firmID == "" || businessID == "" || outletID == "" {
		badRequest(w, "firmId, businessId, and outletId are required")
		return
	}
	if !st.UserHasPartnerFirmAccess(firmID) {
		forbidden(w, "firm access denied")
		return
	}
	var req store.UpdatePartnerClientOutletInput
	if err := decodeJSON(r, &req); err != nil {
		badRequest(w, err.Error())
		return
	}
	item, err := st.UpdatePartnerClientOutlet(firmID, businessID, outletID, req)
	if err != nil {
		badRequest(w, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (h *Handler) archivePartnerClientOutlet(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	firmID := r.PathValue("firmId")
	businessID := r.PathValue("businessId")
	outletID := r.PathValue("outletId")
	if firmID == "" || businessID == "" || outletID == "" {
		badRequest(w, "firmId, businessId, and outletId are required")
		return
	}
	if !st.UserHasPartnerFirmAccess(firmID) {
		forbidden(w, "firm access denied")
		return
	}
	item, err := st.ArchivePartnerClientOutlet(firmID, businessID, outletID)
	if err != nil {
		badRequest(w, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (h *Handler) createPartnerBrandItem(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	firmID := r.PathValue("firmId")
	brandID := r.PathValue("brandId")
	if firmID == "" || brandID == "" {
		badRequest(w, "firmId and brandId are required")
		return
	}
	if !st.UserHasPartnerFirmAccess(firmID) {
		forbidden(w, "firm access denied")
		return
	}
	if !st.HasPartnerFirmBrand(firmID, brandID) {
		notFound(w, "brand mapping not found")
		return
	}

	var req store.CreatePartnerBrandItemInput
	if err := decodeJSON(r, &req); err != nil {
		badRequest(w, err.Error())
		return
	}
	if strings.TrimSpace(req.Name) == "" {
		badRequest(w, "name is required")
		return
	}

	item, err := st.CreatePartnerBrandItem(firmID, brandID, req)
	if err != nil {
		badRequest(w, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (h *Handler) updatePartnerBrandItem(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	firmID := r.PathValue("firmId")
	brandID := r.PathValue("brandId")
	itemID := r.PathValue("itemId")
	if firmID == "" || brandID == "" || itemID == "" {
		badRequest(w, "firmId, brandId, and itemId are required")
		return
	}
	if !st.UserHasPartnerFirmAccess(firmID) {
		forbidden(w, "firm access denied")
		return
	}
	if !st.HasPartnerFirmBrand(firmID, brandID) {
		notFound(w, "brand mapping not found")
		return
	}

	var req store.UpdatePartnerBrandItemInput
	if err := decodeJSON(r, &req); err != nil {
		badRequest(w, err.Error())
		return
	}
	if req.SKU != nil {
		badRequest(w, "SKU cannot be changed. Create a new item for a different SKU.")
		return
	}

	item, err := st.UpdatePartnerBrandItem(firmID, brandID, itemID, req)
	if err != nil {
		badRequest(w, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (h *Handler) getPartnerStock(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	firmID := r.PathValue("firmId")
	if firmID == "" {
		badRequest(w, "firmId is required")
		return
	}
	if !st.UserHasPartnerFirmAccess(firmID) {
		forbidden(w, "firm access denied")
		return
	}
	items, err := st.GetPartnerStock(firmID, r.URL.Query().Get("brandId"))
	if err != nil {
		internalError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, items)
}

func (h *Handler) getPartnerStockLedgerByReference(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	firmID := r.PathValue("firmId")
	if firmID == "" {
		badRequest(w, "firmId is required")
		return
	}
	if !st.UserHasPartnerFirmAccess(firmID) {
		forbidden(w, "firm access denied")
		return
	}
	items, err := st.GetPartnerStockLedgerByReference(firmID, r.URL.Query().Get("referenceType"), r.URL.Query().Get("referenceId"))
	if err != nil {
		internalError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, items)
}

func (h *Handler) getPartnerStockLedger(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	firmID := r.PathValue("firmId")
	itemID := r.PathValue("itemId")
	if firmID == "" || itemID == "" {
		badRequest(w, "firmId and itemId are required")
		return
	}
	if !st.UserHasPartnerFirmAccess(firmID) {
		forbidden(w, "firm access denied")
		return
	}
	items, err := st.GetPartnerStockLedger(firmID, itemID, store.PartnerStockLedgerFilters{
		ReasonType:    strings.TrimSpace(r.URL.Query().Get("reasonType")),
		ReferenceType: strings.TrimSpace(r.URL.Query().Get("referenceType")),
		FromDate:      strings.TrimSpace(r.URL.Query().Get("fromDate")),
		ToDate:        strings.TrimSpace(r.URL.Query().Get("toDate")),
		Query:         strings.TrimSpace(r.URL.Query().Get("q")),
	})
	if err != nil {
		internalError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, items)
}

func (h *Handler) createPartnerStockAdjustment(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	firmID := r.PathValue("firmId")
	if firmID == "" {
		badRequest(w, "firmId is required")
		return
	}
	if !st.UserHasPartnerFirmAccess(firmID) {
		forbidden(w, "firm access denied")
		return
	}
	var req store.CreatePartnerStockAdjustmentInput
	if err := decodeJSON(r, &req); err != nil {
		badRequest(w, err.Error())
		return
	}
	item, err := st.CreatePartnerStockAdjustment(firmID, req)
	if err != nil {
		badRequest(w, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (h *Handler) createPartnerStockAction(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	firmID := r.PathValue("firmId")
	if firmID == "" {
		badRequest(w, "firmId is required")
		return
	}
	if !st.UserHasPartnerFirmAccess(firmID) {
		forbidden(w, "firm access denied")
		return
	}
	var req store.CreatePartnerStockActionInput
	if err := decodeJSON(r, &req); err != nil {
		badRequest(w, err.Error())
		return
	}
	item, err := st.CreatePartnerStockAction(firmID, req)
	if err != nil {
		badRequest(w, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (h *Handler) getPartnerSupplierReturns(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	firmID := r.PathValue("firmId")
	if firmID == "" {
		badRequest(w, "firmId is required")
		return
	}
	if !st.UserHasPartnerFirmAccess(firmID) {
		forbidden(w, "firm access denied")
		return
	}
	items, err := st.GetPartnerSupplierReturns(firmID, r.URL.Query().Get("brandId"))
	if err != nil {
		internalError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, items)
}

func (h *Handler) createPartnerSupplierReturn(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	firmID := r.PathValue("firmId")
	if firmID == "" {
		badRequest(w, "firmId is required")
		return
	}
	if !st.UserHasPartnerFirmAccess(firmID) {
		forbidden(w, "firm access denied")
		return
	}
	var req store.CreatePartnerSupplierReturnInput
	if err := decodeJSON(r, &req); err != nil {
		badRequest(w, err.Error())
		return
	}
	item, err := st.CreatePartnerSupplierReturn(firmID, req)
	if err != nil {
		badRequest(w, err.Error())
		return
	}
	writeJSON(w, http.StatusCreated, item)
}

func (h *Handler) getPartnerSupplierReturnByID(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	firmID := r.PathValue("firmId")
	returnID := r.PathValue("returnId")
	if firmID == "" || returnID == "" {
		badRequest(w, "firmId and returnId are required")
		return
	}
	if !st.UserHasPartnerFirmAccess(firmID) {
		forbidden(w, "firm access denied")
		return
	}
	item, err := st.GetPartnerSupplierReturnByID(firmID, returnID)
	if err != nil {
		badRequest(w, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (h *Handler) updatePartnerSupplierReturn(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	firmID := r.PathValue("firmId")
	returnID := r.PathValue("returnId")
	if firmID == "" || returnID == "" {
		badRequest(w, "firmId and returnId are required")
		return
	}
	if !st.UserHasPartnerFirmAccess(firmID) {
		forbidden(w, "firm access denied")
		return
	}
	var req store.CreatePartnerSupplierReturnInput
	if err := decodeJSON(r, &req); err != nil {
		badRequest(w, err.Error())
		return
	}
	item, err := st.UpdatePartnerSupplierReturn(firmID, returnID, req)
	if err != nil {
		badRequest(w, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (h *Handler) cancelPartnerSupplierReturn(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	firmID := r.PathValue("firmId")
	returnID := r.PathValue("returnId")
	if firmID == "" || returnID == "" {
		badRequest(w, "firmId and returnId are required")
		return
	}
	if !st.UserHasPartnerFirmAccess(firmID) {
		forbidden(w, "firm access denied")
		return
	}
	var req store.CancelPartnerSupplierReturnInput
	if err := decodeJSON(r, &req); err != nil {
		badRequest(w, err.Error())
		return
	}
	item, err := st.CancelPartnerSupplierReturn(firmID, returnID, req)
	if err != nil {
		badRequest(w, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (h *Handler) completePartnerSupplierReturn(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	firmID := r.PathValue("firmId")
	returnID := r.PathValue("returnId")
	if firmID == "" || returnID == "" {
		badRequest(w, "firmId and returnId are required")
		return
	}
	if !st.UserHasPartnerFirmAccess(firmID) {
		forbidden(w, "firm access denied")
		return
	}
	item, err := st.CompletePartnerSupplierReturn(firmID, returnID)
	if err != nil {
		badRequest(w, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (h *Handler) getPartnerInventory(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	firmID := r.PathValue("firmId")
	if firmID == "" {
		badRequest(w, "firmId is required")
		return
	}
	if !st.UserHasPartnerFirmAccess(firmID) {
		forbidden(w, "firm access denied")
		return
	}
	items, err := st.GetPartnerInventory(firmID, r.URL.Query().Get("brandId"))
	if err != nil {
		internalError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, items)
}

func (h *Handler) createPartnerInventory(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	firmID := r.PathValue("firmId")
	if firmID == "" {
		badRequest(w, "firmId is required")
		return
	}
	if !st.UserHasPartnerFirmAccess(firmID) {
		forbidden(w, "firm access denied")
		return
	}
	badRequest(w, "supplier stock inward must be received through purchases and GRNs; use stock adjustments only for corrections")
}

func (h *Handler) updatePartnerInventory(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	firmID := r.PathValue("firmId")
	itemID := r.PathValue("itemId")
	if firmID == "" || itemID == "" {
		badRequest(w, "firmId and itemId are required")
		return
	}
	if !st.UserHasPartnerFirmAccess(firmID) {
		forbidden(w, "firm access denied")
		return
	}

	var req store.UpdatePartnerInventoryItemInput
	if err := decodeJSON(r, &req); err != nil {
		badRequest(w, err.Error())
		return
	}
	if req.Quantity == nil && req.Status == nil {
		badRequest(w, "quantity or status is required")
		return
	}
	item, err := st.UpdatePartnerInventoryItem(firmID, itemID, req)
	if err != nil {
		badRequest(w, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (h *Handler) getPartnerInventoryHistory(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	firmID := r.PathValue("firmId")
	if firmID == "" {
		badRequest(w, "firmId is required")
		return
	}
	if !st.UserHasPartnerFirmAccess(firmID) {
		forbidden(w, "firm access denied")
		return
	}
	items, err := st.GetPartnerInventoryHistory(firmID, store.PartnerInventoryHistoryFilters{
		BrandID:  strings.TrimSpace(r.URL.Query().Get("brandId")),
		FromDate: strings.TrimSpace(r.URL.Query().Get("fromDate")),
		ToDate:   strings.TrimSpace(r.URL.Query().Get("toDate")),
		Query:    strings.TrimSpace(r.URL.Query().Get("q")),
	})
	if err != nil {
		internalError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, items)
}

func (h *Handler) getPartnerReceivablesSummary(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	firmID := r.PathValue("firmId")
	if firmID == "" {
		badRequest(w, "firmId is required")
		return
	}
	if !st.UserHasPartnerFirmAccess(firmID) {
		forbidden(w, "firm access denied")
		return
	}
	item, err := st.GetPartnerReceivablesSummary(firmID, store.GetPartnerReceivablesSummaryInput{
		Search:      r.URL.Query().Get("q"),
		Status:      r.URL.Query().Get("status"),
		FromDate:    r.URL.Query().Get("fromDate"),
		ToDate:      r.URL.Query().Get("toDate"),
		OverdueOnly: strings.EqualFold(r.URL.Query().Get("overdueOnly"), "true"),
	})
	if err != nil {
		internalError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (h *Handler) getPartnerPayments(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	firmID := r.PathValue("firmId")
	if firmID == "" {
		badRequest(w, "firmId is required")
		return
	}
	if !st.UserHasPartnerFirmAccess(firmID) {
		forbidden(w, "firm access denied")
		return
	}
	items, err := st.GetPartnerPayments(firmID, store.GetPartnerPaymentsInput{
		Search:           r.URL.Query().Get("q"),
		ClientBusinessID: r.URL.Query().Get("clientBusinessId"),
		InvoiceID:        r.URL.Query().Get("invoiceId"),
		FromDate:         r.URL.Query().Get("fromDate"),
		ToDate:           r.URL.Query().Get("toDate"),
	})
	if err != nil {
		internalError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, items)
}

func (h *Handler) createPartnerPayment(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	firmID := r.PathValue("firmId")
	if firmID == "" {
		badRequest(w, "firmId is required")
		return
	}
	if !st.UserHasPartnerFirmAccess(firmID) {
		forbidden(w, "firm access denied")
		return
	}
	if !st.UserHasPartnerFinanceAccess(firmID) {
		forbidden(w, "only owners and accountants can record payments")
		return
	}
	var req store.CreatePartnerPaymentInput
	if err := decodeJSON(r, &req); err != nil {
		badRequest(w, err.Error())
		return
	}
	item, err := st.CreatePartnerPayment(firmID, req)
	if err != nil {
		badRequest(w, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (h *Handler) getPartnerClientLedger(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	firmID := r.PathValue("firmId")
	if firmID == "" {
		badRequest(w, "firmId is required")
		return
	}
	if !st.UserHasPartnerFirmAccess(firmID) {
		forbidden(w, "firm access denied")
		return
	}
	items, err := st.GetPartnerClientLedger(firmID, store.GetPartnerClientLedgerInput{
		ClientBusinessID: r.URL.Query().Get("clientBusinessId"),
		FromDate:         r.URL.Query().Get("fromDate"),
		ToDate:           r.URL.Query().Get("toDate"),
	})
	if err != nil {
		internalError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, items)
}

func (h *Handler) getPartnerPayables(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	firmID := r.PathValue("firmId")
	if firmID == "" {
		badRequest(w, "firmId is required")
		return
	}
	if !st.UserHasPartnerFirmAccess(firmID) {
		forbidden(w, "firm access denied")
		return
	}
	item, err := st.GetPartnerPayablesSummary(firmID, store.GetPartnerSupplierInvoicesInput{
		Search:      r.URL.Query().Get("q"),
		SupplierID:  r.URL.Query().Get("supplierId"),
		Status:      r.URL.Query().Get("status"),
		FromDate:    r.URL.Query().Get("fromDate"),
		ToDate:      r.URL.Query().Get("toDate"),
		OverdueOnly: strings.EqualFold(r.URL.Query().Get("overdueOnly"), "true"),
	})
	if err != nil {
		internalError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (h *Handler) getPartnerSupplierInvoices(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	firmID := r.PathValue("firmId")
	if firmID == "" {
		badRequest(w, "firmId is required")
		return
	}
	if !st.UserHasPartnerFirmAccess(firmID) {
		forbidden(w, "firm access denied")
		return
	}
	items, err := st.GetPartnerSupplierInvoices(firmID, store.GetPartnerSupplierInvoicesInput{
		Search:      r.URL.Query().Get("q"),
		SupplierID:  r.URL.Query().Get("supplierId"),
		Status:      r.URL.Query().Get("status"),
		FromDate:    r.URL.Query().Get("fromDate"),
		ToDate:      r.URL.Query().Get("toDate"),
		OverdueOnly: strings.EqualFold(r.URL.Query().Get("overdueOnly"), "true"),
	})
	if err != nil {
		internalError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, items)
}

func (h *Handler) createPartnerSupplierInvoice(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	firmID := r.PathValue("firmId")
	if firmID == "" {
		badRequest(w, "firmId is required")
		return
	}
	if !st.UserHasPartnerFirmAccess(firmID) {
		forbidden(w, "firm access denied")
		return
	}
	if !st.UserHasPartnerFinanceAccess(firmID) {
		forbidden(w, "only owners and accountants can manage payables")
		return
	}
	var req store.CreatePartnerSupplierInvoiceInput
	if err := decodeJSON(r, &req); err != nil {
		badRequest(w, err.Error())
		return
	}
	item, err := st.CreatePartnerSupplierInvoice(firmID, req)
	if err != nil {
		badRequest(w, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (h *Handler) finalizePartnerSupplierInvoice(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	firmID := r.PathValue("firmId")
	supplierInvoiceID := r.PathValue("supplierInvoiceId")
	if firmID == "" || supplierInvoiceID == "" {
		badRequest(w, "firmId and supplierInvoiceId are required")
		return
	}
	if !st.UserHasPartnerFirmAccess(firmID) {
		forbidden(w, "firm access denied")
		return
	}
	if !st.UserHasPartnerFinanceAccess(firmID) {
		forbidden(w, "only owners and accountants can manage payables")
		return
	}
	item, err := st.FinalizePartnerSupplierInvoice(firmID, supplierInvoiceID)
	if err != nil {
		badRequest(w, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (h *Handler) getPartnerSupplierPayments(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	firmID := r.PathValue("firmId")
	if firmID == "" {
		badRequest(w, "firmId is required")
		return
	}
	if !st.UserHasPartnerFirmAccess(firmID) {
		forbidden(w, "firm access denied")
		return
	}
	items, err := st.GetPartnerSupplierPayments(firmID, store.GetPartnerSupplierPaymentsInput{
		Search:            r.URL.Query().Get("q"),
		SupplierID:        r.URL.Query().Get("supplierId"),
		SupplierInvoiceID: r.URL.Query().Get("supplierInvoiceId"),
		FromDate:          r.URL.Query().Get("fromDate"),
		ToDate:            r.URL.Query().Get("toDate"),
	})
	if err != nil {
		internalError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, items)
}

func (h *Handler) createPartnerSupplierPayment(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	firmID := r.PathValue("firmId")
	if firmID == "" {
		badRequest(w, "firmId is required")
		return
	}
	if !st.UserHasPartnerFirmAccess(firmID) {
		forbidden(w, "firm access denied")
		return
	}
	if !st.UserHasPartnerFinanceAccess(firmID) {
		forbidden(w, "only owners and accountants can manage payables")
		return
	}
	var req store.CreatePartnerSupplierPaymentInput
	if err := decodeJSON(r, &req); err != nil {
		badRequest(w, err.Error())
		return
	}
	item, err := st.CreatePartnerSupplierPayment(firmID, req)
	if err != nil {
		badRequest(w, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (h *Handler) getPartnerSupplierLedger(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	firmID := r.PathValue("firmId")
	if firmID == "" {
		badRequest(w, "firmId is required")
		return
	}
	if !st.UserHasPartnerFirmAccess(firmID) {
		forbidden(w, "firm access denied")
		return
	}
	items, err := st.GetPartnerSupplierLedger(firmID, store.GetPartnerSupplierLedgerInput{
		SupplierID: r.URL.Query().Get("supplierId"),
		FromDate:   r.URL.Query().Get("fromDate"),
		ToDate:     r.URL.Query().Get("toDate"),
	})
	if err != nil {
		internalError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, items)
}

func (h *Handler) getPartnerInvoices(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	firmID := r.PathValue("firmId")
	if firmID == "" {
		badRequest(w, "firmId is required")
		return
	}
	if !st.UserHasPartnerFirmAccess(firmID) {
		forbidden(w, "firm access denied")
		return
	}
	items, err := st.GetPartnerInvoices(firmID)
	if err != nil {
		internalError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, items)
}

func (h *Handler) getPartnerInvoiceByID(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	firmID := r.PathValue("firmId")
	invoiceID := r.PathValue("invoiceId")
	if firmID == "" || invoiceID == "" {
		badRequest(w, "firmId and invoiceId are required")
		return
	}
	if !st.UserHasPartnerFirmAccess(firmID) {
		forbidden(w, "firm access denied")
		return
	}
	item, err := st.GetPartnerInvoiceByID(firmID, invoiceID)
	if err != nil {
		if strings.Contains(strings.ToLower(err.Error()), "not found") {
			notFound(w, err.Error())
			return
		}
		internalError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (h *Handler) createPartnerInvoice(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	firmID := r.PathValue("firmId")
	if firmID == "" {
		badRequest(w, "firmId is required")
		return
	}
	if !st.UserHasPartnerFirmAccess(firmID) {
		forbidden(w, "firm access denied")
		return
	}
	if !st.UserHasPartnerFinanceAccess(firmID) {
		forbidden(w, "only owners and accountants can create invoices")
		return
	}
	var req store.CreatePartnerInvoiceInput
	if err := decodeJSON(r, &req); err != nil {
		badRequest(w, err.Error())
		return
	}
	item, err := st.CreatePartnerInvoice(firmID, req)
	if err != nil {
		badRequest(w, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (h *Handler) finalizePartnerInvoice(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	firmID := r.PathValue("firmId")
	invoiceID := r.PathValue("invoiceId")
	if firmID == "" || invoiceID == "" {
		badRequest(w, "firmId and invoiceId are required")
		return
	}
	if !st.UserHasPartnerFirmAccess(firmID) {
		forbidden(w, "firm access denied")
		return
	}
	if !st.UserHasPartnerFinanceAccess(firmID) {
		forbidden(w, "only owners and accountants can finalize invoices")
		return
	}
	item, err := st.FinalizePartnerInvoice(firmID, invoiceID)
	if err != nil {
		if strings.Contains(strings.ToLower(err.Error()), "not found") {
			notFound(w, err.Error())
			return
		}
		badRequest(w, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (h *Handler) cancelPartnerInvoice(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	firmID := r.PathValue("firmId")
	invoiceID := r.PathValue("invoiceId")
	if firmID == "" || invoiceID == "" {
		badRequest(w, "firmId and invoiceId are required")
		return
	}
	if !st.UserHasPartnerFirmAccess(firmID) {
		forbidden(w, "firm access denied")
		return
	}
	if !st.UserHasPartnerFinanceAccess(firmID) {
		forbidden(w, "only owners and accountants can cancel invoices")
		return
	}
	item, err := st.CancelPartnerInvoice(firmID, invoiceID)
	if err != nil {
		badRequest(w, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (h *Handler) getPartnerCreditNotes(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	firmID := r.PathValue("firmId")
	if firmID == "" {
		badRequest(w, "firmId is required")
		return
	}
	if !st.UserHasPartnerFirmAccess(firmID) {
		forbidden(w, "firm access denied")
		return
	}
	items, err := st.GetPartnerCreditNotes(firmID)
	if err != nil {
		internalError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, items)
}

func (h *Handler) createPartnerCreditNote(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	firmID := r.PathValue("firmId")
	if firmID == "" {
		badRequest(w, "firmId is required")
		return
	}
	if !st.UserHasPartnerFinanceAccess(firmID) {
		forbidden(w, "only owners and accountants can issue credit notes")
		return
	}
	var req store.CreatePartnerCreditNoteInput
	if err := decodeJSON(r, &req); err != nil {
		badRequest(w, err.Error())
		return
	}
	item, err := st.CreatePartnerCreditNote(firmID, req)
	if err != nil {
		badRequest(w, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (h *Handler) getPartnerDebitNotes(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	firmID := r.PathValue("firmId")
	if firmID == "" {
		badRequest(w, "firmId is required")
		return
	}
	if !st.UserHasPartnerFirmAccess(firmID) {
		forbidden(w, "firm access denied")
		return
	}
	items, err := st.GetPartnerDebitNotes(firmID)
	if err != nil {
		internalError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, items)
}

func (h *Handler) createPartnerDebitNote(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	firmID := r.PathValue("firmId")
	if firmID == "" {
		badRequest(w, "firmId is required")
		return
	}
	if !st.UserHasPartnerFinanceAccess(firmID) {
		forbidden(w, "only owners and accountants can issue debit notes")
		return
	}
	var req store.CreatePartnerDebitNoteInput
	if err := decodeJSON(r, &req); err != nil {
		badRequest(w, err.Error())
		return
	}
	item, err := st.CreatePartnerDebitNote(firmID, req)
	if err != nil {
		badRequest(w, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (h *Handler) getPartnerAuditLogs(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	firmID := r.PathValue("firmId")
	if firmID == "" {
		badRequest(w, "firmId is required")
		return
	}
	if !st.UserHasPartnerFirmAccess(firmID) {
		forbidden(w, "firm access denied")
		return
	}
	items, err := st.GetPartnerAuditLogs(firmID, store.GetPartnerAuditLogsInput{
		EntityType: r.URL.Query().Get("entityType"),
		FromDate:   r.URL.Query().Get("fromDate"),
		ToDate:     r.URL.Query().Get("toDate"),
		UserID:     r.URL.Query().Get("userId"),
	})
	if err != nil {
		internalError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, items)
}

func (h *Handler) getPartnerGlobalSearch(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	firmID := r.PathValue("firmId")
	if firmID == "" {
		badRequest(w, "firmId is required")
		return
	}
	if !st.UserHasPartnerFirmAccess(firmID) {
		forbidden(w, "firm access denied")
		return
	}
	items, err := st.GetPartnerGlobalSearch(firmID, r.URL.Query().Get("q"))
	if err != nil {
		internalError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, items)
}

func (h *Handler) getPartnerSuppliers(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	firmID := r.PathValue("firmId")
	if firmID == "" {
		badRequest(w, "firmId is required")
		return
	}
	if !st.UserHasPartnerFirmAccess(firmID) {
		forbidden(w, "firm access denied")
		return
	}
	items, err := st.GetPartnerSuppliers(firmID, r.URL.Query().Get("q"))
	if err != nil {
		internalError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, items)
}

func (h *Handler) validatePartnerSupplierGSTIN(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	firmID := r.PathValue("firmId")
	if firmID == "" {
		badRequest(w, "firmId is required")
		return
	}
	if !st.UserHasPartnerFirmAccess(firmID) {
		forbidden(w, "firm access denied")
		return
	}
	item, err := st.ValidatePartnerSupplierGSTIN(firmID, r.URL.Query().Get("gstin"), r.URL.Query().Get("excludeSupplierId"))
	if err != nil {
		internalError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (h *Handler) createPartnerSupplier(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	firmID := r.PathValue("firmId")
	if firmID == "" {
		badRequest(w, "firmId is required")
		return
	}
	if !st.UserHasPartnerFirmAccess(firmID) {
		forbidden(w, "firm access denied")
		return
	}
	var req store.CreatePartnerSupplierInput
	if err := decodeJSON(r, &req); err != nil {
		badRequest(w, err.Error())
		return
	}
	item, err := st.CreatePartnerSupplier(firmID, req)
	if err != nil {
		badRequest(w, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (h *Handler) updatePartnerSupplier(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	firmID := r.PathValue("firmId")
	supplierID := r.PathValue("supplierId")
	if firmID == "" || supplierID == "" {
		badRequest(w, "firmId and supplierId are required")
		return
	}
	if !st.UserHasPartnerFirmAccess(firmID) {
		forbidden(w, "firm access denied")
		return
	}
	var req store.UpdatePartnerSupplierInput
	if err := decodeJSON(r, &req); err != nil {
		badRequest(w, err.Error())
		return
	}
	item, err := st.UpdatePartnerSupplier(firmID, supplierID, req)
	if err != nil {
		badRequest(w, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (h *Handler) archivePartnerSupplier(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	firmID := r.PathValue("firmId")
	supplierID := r.PathValue("supplierId")
	if firmID == "" || supplierID == "" {
		badRequest(w, "firmId and supplierId are required")
		return
	}
	if !st.UserHasPartnerFirmAccess(firmID) {
		forbidden(w, "firm access denied")
		return
	}
	item, err := st.ArchivePartnerSupplier(firmID, supplierID)
	if err != nil {
		badRequest(w, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (h *Handler) getPartnerPurchases(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	firmID := r.PathValue("firmId")
	if firmID == "" {
		badRequest(w, "firmId is required")
		return
	}
	if !st.UserHasPartnerFirmAccess(firmID) {
		forbidden(w, "firm access denied")
		return
	}
	items, err := st.GetPartnerPurchases(firmID)
	if err != nil {
		internalError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, items)
}

func (h *Handler) getPartnerPurchaseByID(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	firmID := r.PathValue("firmId")
	purchaseID := r.PathValue("purchaseId")
	if firmID == "" || purchaseID == "" {
		badRequest(w, "firmId and purchaseId are required")
		return
	}
	if !st.UserHasPartnerFirmAccess(firmID) {
		forbidden(w, "firm access denied")
		return
	}
	item, err := st.GetPartnerPurchaseByID(firmID, purchaseID)
	if err != nil {
		notFound(w, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (h *Handler) createPartnerPurchase(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	firmID := r.PathValue("firmId")
	if firmID == "" {
		badRequest(w, "firmId is required")
		return
	}
	if !st.UserHasPartnerFirmAccess(firmID) {
		forbidden(w, "firm access denied")
		return
	}
	var req store.CreatePartnerPurchaseInput
	if err := decodeJSON(r, &req); err != nil {
		badRequest(w, err.Error())
		return
	}
	item, err := st.CreatePartnerPurchase(firmID, req)
	if err != nil {
		badRequest(w, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (h *Handler) updatePartnerPurchase(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	firmID := r.PathValue("firmId")
	purchaseID := r.PathValue("purchaseId")
	if firmID == "" || purchaseID == "" {
		badRequest(w, "firmId and purchaseId are required")
		return
	}
	if !st.UserHasPartnerFirmAccess(firmID) {
		forbidden(w, "firm access denied")
		return
	}
	var req store.UpdatePartnerPurchaseInput
	if err := decodeJSON(r, &req); err != nil {
		badRequest(w, err.Error())
		return
	}
	item, err := st.UpdatePartnerPurchase(firmID, purchaseID, req)
	if err != nil {
		badRequest(w, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (h *Handler) orderPartnerPurchase(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	firmID := r.PathValue("firmId")
	purchaseID := r.PathValue("purchaseId")
	if firmID == "" || purchaseID == "" {
		badRequest(w, "firmId and purchaseId are required")
		return
	}
	if !st.UserHasPartnerFirmAccess(firmID) {
		forbidden(w, "firm access denied")
		return
	}
	item, err := st.OrderPartnerPurchase(firmID, purchaseID)
	if err != nil {
		badRequest(w, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (h *Handler) cancelPartnerPurchase(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	firmID := r.PathValue("firmId")
	purchaseID := r.PathValue("purchaseId")
	if firmID == "" || purchaseID == "" {
		badRequest(w, "firmId and purchaseId are required")
		return
	}
	if !st.UserHasPartnerFirmAccess(firmID) {
		forbidden(w, "firm access denied")
		return
	}
	var req store.CancelPartnerPurchaseInput
	if err := decodeJSON(r, &req); err != nil {
		badRequest(w, err.Error())
		return
	}
	item, err := st.CancelPartnerPurchase(firmID, purchaseID, req)
	if err != nil {
		badRequest(w, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (h *Handler) getPartnerGoodsReceipts(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	firmID := r.PathValue("firmId")
	purchaseID := r.PathValue("purchaseId")
	if firmID == "" || purchaseID == "" {
		badRequest(w, "firmId and purchaseId are required")
		return
	}
	if !st.UserHasPartnerFirmAccess(firmID) {
		forbidden(w, "firm access denied")
		return
	}
	items, err := st.GetPartnerGoodsReceipts(firmID, purchaseID)
	if err != nil {
		internalError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, items)
}

func (h *Handler) receivePartnerPurchase(w http.ResponseWriter, r *http.Request) {
	st, ok := h.authedStore(w, r)
	if !ok {
		return
	}
	firmID := r.PathValue("firmId")
	purchaseID := r.PathValue("purchaseId")
	if firmID == "" || purchaseID == "" {
		badRequest(w, "firmId and purchaseId are required")
		return
	}
	if !st.UserHasPartnerFirmAccess(firmID) {
		forbidden(w, "firm access denied")
		return
	}
	var req store.ReceivePartnerPurchaseInput
	if err := decodeJSON(r, &req); err != nil {
		badRequest(w, err.Error())
		return
	}
	item, err := st.ReceivePartnerPurchase(firmID, purchaseID, req)
	if err != nil {
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

func internalError(w http.ResponseWriter, err error) {
	writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
}

func unauthorized(w http.ResponseWriter, message string) {
	writeJSON(w, http.StatusUnauthorized, map[string]any{"error": message})
}

func (h *Handler) sessionTokenFromRequest(r *http.Request) string {
	return auth.TokenFromRequest(r)
}

func (h *Handler) authedStore(w http.ResponseWriter, r *http.Request) (*store.Store, bool) {
	st, err := auth.StoreForRequest(r, h.store)
	if err != nil {
		unauthorized(w, "authentication required")
		return nil, false
	}
	return st, true
}

func (h *Handler) setSessionCookie(w http.ResponseWriter, token string) {
	auth.SetSessionCookie(w, token)
}

func (h *Handler) clearSessionCookie(w http.ResponseWriter) {
	auth.ClearSessionCookie(w)
}

func (h *Handler) canManageUsers(st *store.Store, entityID string) bool {
	role, ok := st.CurrentUserRole(entityID)
	if !ok {
		return false
	}
	return role == store.RoleOwner || role == store.RoleAccountManager
}

func (h *Handler) canEditStaffCapabilities(st *store.Store, entityID string) bool {
	role, ok := st.CurrentUserRole(entityID)
	if !ok {
		return false
	}
	return role == store.RoleOwner || role == store.RoleManager || role == store.RoleAccountManager
}

func (h *Handler) canManagePartnerFirmMembers(st *store.Store, firmID string) bool {
	role, ok := st.CurrentUserPartnerFirmRole(firmID)
	if !ok {
		return false
	}
	return role == store.PartnerFirmRoleOwner
}
