package orders

import (
	"context"
	"strings"

	"github.com/zistributo/zistributo/apps/backend/internal/platform/apperrors"
	"github.com/zistributo/zistributo/apps/backend/internal/store"
)

type Service struct {
	store *store.Store
	repo  *Repository
}

func NewService(st *store.Store) *Service {
	return &Service{store: st, repo: NewRepository(st)}
}

func (s *Service) List(ctx context.Context, firmID string) ([]Order, error) {
	if err := s.requireFirmAccess(firmID); err != nil {
		return nil, err
	}
	return s.repo.List(ctx, firmID)
}

func (s *Service) Create(ctx context.Context, firmID string, req CreateRequest) (Order, error) {
	if err := s.requireFirmAccess(firmID); err != nil {
		return Order{}, err
	}
	item, err := s.repo.Create(ctx, firmID, req)
	if err != nil {
		return Order{}, apperrors.Validation(err.Error())
	}
	return item, nil
}

func (s *Service) Get(ctx context.Context, firmID, orderID string) (Order, error) {
	if strings.TrimSpace(firmID) == "" || strings.TrimSpace(orderID) == "" {
		return Order{}, apperrors.Validation("firmId and orderId are required")
	}
	if err := s.requireFirmAccess(firmID); err != nil {
		return Order{}, err
	}
	item, err := s.repo.GetByID(ctx, firmID, orderID)
	if err != nil {
		return Order{}, classifyNotFoundOrInternal(err)
	}
	return item, nil
}

func (s *Service) Update(ctx context.Context, firmID, orderID string, req UpdateRequest) (Order, error) {
	if strings.TrimSpace(firmID) == "" || strings.TrimSpace(orderID) == "" {
		return Order{}, apperrors.Validation("firmId and orderId are required")
	}
	if err := s.requireFirmAccess(firmID); err != nil {
		return Order{}, err
	}
	item, err := s.repo.Update(ctx, firmID, orderID, req)
	if err != nil {
		return Order{}, apperrors.Validation(err.Error())
	}
	return item, nil
}

func (s *Service) UpdateStatus(ctx context.Context, firmID, orderID string, req StatusRequest) (Order, error) {
	if strings.TrimSpace(firmID) == "" || strings.TrimSpace(orderID) == "" {
		return Order{}, apperrors.Validation("firmId and orderId are required")
	}
	if err := s.requireFirmAccess(firmID); err != nil {
		return Order{}, err
	}
	if strings.TrimSpace(req.Status) == "" {
		return Order{}, apperrors.Validation("status is required")
	}
	item, err := s.repo.UpdateStatusWithInput(ctx, firmID, orderID, req)
	if err != nil {
		return Order{}, classifyNotFoundOrValidation(err)
	}
	return item, nil
}

func (s *Service) ListReturns(ctx context.Context, firmID, orderID string) ([]Return, error) {
	if strings.TrimSpace(firmID) == "" || strings.TrimSpace(orderID) == "" {
		return nil, apperrors.Validation("firmId and orderId are required")
	}
	if err := s.requireFirmAccess(firmID); err != nil {
		return nil, err
	}
	items, err := s.repo.ListReturns(ctx, firmID, orderID)
	if err != nil {
		return nil, classifyNotFoundOrInternal(err)
	}
	return items, nil
}

func (s *Service) CreateReturn(ctx context.Context, firmID, orderID string, req CreateReturnRequest) (ReturnResponse, error) {
	if strings.TrimSpace(firmID) == "" || strings.TrimSpace(orderID) == "" {
		return ReturnResponse{}, apperrors.Validation("firmId and orderId are required")
	}
	if err := s.requireFirmAccess(firmID); err != nil {
		return ReturnResponse{}, err
	}
	item, err := s.repo.CreateReturn(ctx, firmID, orderID, req)
	if err != nil {
		return ReturnResponse{}, classifyNotFoundOrValidation(err)
	}
	return item, nil
}

func (s *Service) VoidReturn(ctx context.Context, firmID, orderID, returnID string) (ReturnResponse, error) {
	if strings.TrimSpace(firmID) == "" || strings.TrimSpace(orderID) == "" || strings.TrimSpace(returnID) == "" {
		return ReturnResponse{}, apperrors.Validation("firmId, orderId and returnId are required")
	}
	if err := s.requireFirmAccess(firmID); err != nil {
		return ReturnResponse{}, err
	}
	item, err := s.repo.VoidReturn(ctx, firmID, orderID, returnID)
	if err != nil {
		return ReturnResponse{}, classifyNotFoundOrValidation(err)
	}
	return item, nil
}

func (s *Service) requireFirmAccess(firmID string) error {
	if strings.TrimSpace(firmID) == "" {
		return apperrors.Validation("firmId is required")
	}
	if !s.store.UserHasPartnerFirmAccess(firmID) {
		return apperrors.Forbidden("firm access denied")
	}
	return nil
}

func classifyNotFoundOrValidation(err error) error {
	if err == nil {
		return nil
	}
	if strings.Contains(strings.ToLower(err.Error()), "not found") {
		return apperrors.NotFound(err.Error())
	}
	return apperrors.Validation(err.Error())
}

func classifyNotFoundOrInternal(err error) error {
	if err == nil {
		return nil
	}
	if strings.Contains(strings.ToLower(err.Error()), "not found") {
		return apperrors.NotFound(err.Error())
	}
	return apperrors.Internal(err.Error())
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
