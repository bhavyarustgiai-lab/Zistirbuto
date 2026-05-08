package handlers

import (
	"context"

	"github.com/zistributo/zistributo/apps/backend/internal/jobs"
)

func SendInvoiceEmail(ctx context.Context, job jobs.Job) ([]byte, error) {
	_ = ctx
	_ = job
	return []byte(`{"status":"prepared"}`), nil
}
