package orders

import (
	"context"
	"fmt"
	"strings"

	"github.com/zistributo/zistributo/apps/backend/internal/store"
)

type ErrForbidden struct {
	Message string
}

func (e ErrForbidden) Error() string {
	return e.Message
}

type Service struct {
	store *store.Store
	repo  *Repository
}

func NewService(st *store.Store) *Service {
	return &Service{store: st, repo: NewRepository(st)}
}

func (s *Service) UpdateStatus(ctx context.Context, firmID, orderID string, req StatusRequest) (Order, error) {
	if strings.TrimSpace(firmID) == "" || strings.TrimSpace(orderID) == "" {
		return Order{}, fmt.Errorf("firmId and orderId are required")
	}
	if !s.store.UserHasPartnerFirmAccess(firmID) {
		return Order{}, ErrForbidden{Message: "firm access denied"}
	}
	if strings.TrimSpace(req.Status) == "" {
		return Order{}, fmt.Errorf("status is required")
	}
	return s.store.UpdatePartnerOrderStatusWithInput(firmID, orderID, req)
}

func canTransitionStatus(current, next string) bool {
	if current == next {
		return true
	}
	switch current {
	case "DRAFT":
		return next == "PLACED" || next == "CONFIRMED" || next == "CANCELLED"
	case "PLACED":
		return next == "CONFIRMED" || next == "CANCELLED"
	case "CONFIRMED":
		return next == "DRAFT" || next == "PACKED" || next == "CANCELLED"
	case "PACKED":
		return next == "DRAFT" || next == "DISPATCHED" || next == "CANCELLED"
	case "DISPATCHED":
		return next == "DELIVERED" || next == "PARTIALLY_DELIVERED" || next == "RETURNED" || next == "PARTIALLY_RETURNED"
	case "PARTIALLY_DELIVERED":
		return next == "DELIVERED" || next == "RETURNED" || next == "PARTIALLY_RETURNED"
	case "DELIVERED":
		return next == "RETURNED" || next == "PARTIALLY_RETURNED"
	case "PARTIALLY_RETURNED":
		return next == "DELIVERED" || next == "RETURNED"
	default:
		return false
	}
}
