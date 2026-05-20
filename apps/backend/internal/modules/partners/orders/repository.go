package orders

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/zistributo/zistributo/apps/backend/internal/store"
)

type Repository struct {
	pool  *pgxpool.Pool
	store *store.Store
}

func NewRepository(st *store.Store) *Repository {
	return &Repository{pool: st.Pool(), store: st}
}

func (r *Repository) List(ctx context.Context, firmID string) ([]Order, error) {
	return r.store.GetPartnerOrders(firmID)
}

func (r *Repository) Create(ctx context.Context, firmID string, input CreateRequest) (Order, error) {
	return r.store.CreatePartnerOrder(firmID, input)
}

func (r *Repository) GetByID(ctx context.Context, firmID, orderID string) (Order, error) {
	// TODO: move the order detail query from internal/store into this repository.
	return r.store.GetPartnerOrderByID(firmID, orderID)
}

func (r *Repository) Update(ctx context.Context, firmID, orderID string, input UpdateRequest) (Order, error) {
	return r.store.UpdatePartnerOrder(firmID, orderID, input)
}

func (r *Repository) UpdateStatusWithInput(ctx context.Context, firmID, orderID string, input StatusRequest) (Order, error) {
	return r.store.UpdatePartnerOrderStatusWithInput(firmID, orderID, input)
}

func (r *Repository) ListReturns(ctx context.Context, firmID, orderID string) ([]Return, error) {
	return r.store.GetPartnerOrderReturns(firmID, orderID)
}

func (r *Repository) CreateReturn(ctx context.Context, firmID, orderID string, input CreateReturnRequest) (ReturnResponse, error) {
	return r.store.CreatePartnerOrderReturn(firmID, orderID, input)
}

func (r *Repository) VoidReturn(ctx context.Context, firmID, orderID, returnID string) (ReturnResponse, error) {
	return r.store.VoidPartnerOrderReturn(firmID, orderID, returnID)
}

func (r *Repository) UpdateStatus(ctx context.Context, firmID, orderID, nextStatus string) error {
	var currentStatus string
	if err := r.pool.QueryRow(ctx, `
		select status
		from partner_orders
		where firm_id = $1::bigint and id = $2
	`, firmID, orderID).Scan(&currentStatus); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return fmt.Errorf("order not found")
		}
		return err
	}
	nextStatus = strings.TrimSpace(nextStatus)
	if !canTransitionStatus(currentStatus, nextStatus) {
		return fmt.Errorf("cannot move order from %s to %s", currentStatus, nextStatus)
	}
	query := `
		update partner_orders
		set status = $3,
		    confirmed_at = case when $3 = 'CONFIRMED' then now() else confirmed_at end,
		    dispatched_at = case when $3 = 'DISPATCHED' then now() else dispatched_at end,
		    delivered_at = case when $3 = 'DELIVERED' then now() else delivered_at end,
		    cancelled_at = case when $3 = 'CANCELLED' then now() else cancelled_at end,
		    updated_at = now()
		where firm_id = $1::bigint and id = $2
	`
	_, err := r.pool.Exec(ctx, query, firmID, orderID, nextStatus)
	return err
}
