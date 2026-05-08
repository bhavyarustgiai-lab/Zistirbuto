package jobs

import "time"

type Status string

const (
	StatusQueued    Status = "QUEUED"
	StatusRunning   Status = "RUNNING"
	StatusCompleted Status = "COMPLETED"
	StatusFailed    Status = "FAILED"
	StatusCancelled Status = "CANCELLED"
)

type Type string

const (
	TypeSendInvoiceEmail   Type = "SEND_INVOICE_EMAIL"
	TypeExportLedger       Type = "EXPORT_LEDGER"
	TypeExportReceivables  Type = "EXPORT_RECEIVABLES"
	TypeGenerateStatement  Type = "GENERATE_STATEMENT"
	TypeGenerateInvoicePDF Type = "GENERATE_INVOICE_PDF"
)

type Job struct {
	ID           string
	FirmID       string
	UserID       string
	Type         Type
	Status       Status
	PayloadJSON  []byte
	ResultJSON   []byte
	ErrorMessage string
	Attempts     int
	MaxAttempts  int
	LockedAt     *time.Time
	LockedBy     string
	CreatedAt    time.Time
	UpdatedAt    time.Time
}
