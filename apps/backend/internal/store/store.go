package store

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"math/big"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	backendphone "github.com/zistributo/zistributo/apps/backend/internal/common/phone"
	backenddb "github.com/zistributo/zistributo/apps/backend/internal/db"
)

type ClientType string

const (
	ClientTypeSalon   ClientType = "SALON"
	ClientTypeSpa     ClientType = "SPA"
	ClientTypeFitness ClientType = "FITNESS"
)

const LoginOTPTTL = 10 * time.Minute

type EntityRole string

const (
	RoleOwner          EntityRole = "OWNER"
	RoleManager        EntityRole = "MANAGER"
	RoleStaff          EntityRole = "STAFF"
	RoleAccountManager EntityRole = "ACCOUNT_MANAGER"
)

type EntityMemberStatus string

const (
	MemberStatusActive  EntityMemberStatus = "ACTIVE"
	MemberStatusInvited EntityMemberStatus = "INVITED"
)

type InviteStatus string

const (
	InviteStatusPending  InviteStatus = "PENDING"
	InviteStatusAccepted InviteStatus = "ACCEPTED"
	InviteStatusExpired  InviteStatus = "EXPIRED"
)

type PartnerFirmRole string

const (
	PartnerFirmRoleOwner           PartnerFirmRole = "OWNER"
	PartnerFirmRoleStaff           PartnerFirmRole = "STAFF"
	PartnerFirmRoleAccountant      PartnerFirmRole = "ACCOUNTANT"
	PartnerFirmRoleDeliveryPartner PartnerFirmRole = "DELIVERY_PARTNER"
)

type PartnerFirmMembershipStatus string

const (
	PartnerFirmMembershipStatusActive    PartnerFirmMembershipStatus = "ACTIVE"
	PartnerFirmMembershipStatusSuspended PartnerFirmMembershipStatus = "SUSPENDED"
)

type PartnerFirmInviteStatus string

const (
	PartnerFirmInviteStatusPending  PartnerFirmInviteStatus = "PENDING"
	PartnerFirmInviteStatusAccepted PartnerFirmInviteStatus = "ACCEPTED"
	PartnerFirmInviteStatusExpired  PartnerFirmInviteStatus = "EXPIRED"
)

type PaymentStatus string

const (
	PaymentStatusPaid    PaymentStatus = "paid"
	PaymentStatusUnpaid  PaymentStatus = "unpaid"
	PaymentStatusPartial PaymentStatus = "partial"
)

type DayEntryStatus string

const (
	DayEntryStatusPlanned    DayEntryStatus = "planned"
	DayEntryStatusInProgress DayEntryStatus = "in_progress"
	DayEntryStatusDone       DayEntryStatus = "done"
	DayEntryStatusBilled     DayEntryStatus = "billed"
	DayEntryStatusCancelled  DayEntryStatus = "cancelled"
)

type PaymentMode string

type User struct {
	ID        int64  `json:"id"`
	Name      string `json:"name"`
	Phone     string `json:"phone"`
	BirthDate string `json:"birthDate,omitempty"`
}

type UserSession struct {
	ID        string `json:"id"`
	UserID    int64  `json:"userId"`
	Token     string `json:"token"`
	ExpiresAt string `json:"expiresAt"`
	CreatedAt string `json:"createdAt"`
}

type RequestLoginOTPInput struct {
	Phone string `json:"phone"`
}

type RequestLoginOTPResult struct {
	Phone     string `json:"phone"`
	OTP       string `json:"otp,omitempty"`
	ExpiresAt string `json:"expiresAt"`
}

type VerifyLoginOTPInput struct {
	Phone string `json:"phone"`
	OTP   string `json:"otp"`
}

type VerifyLoginOTPResult struct {
	User *User `json:"user,omitempty"`
}

type UpdateCurrentUserProfileInput struct {
	Name      string `json:"name"`
	BirthDate string `json:"birthDate"`
}

type Client struct {
	ID         string     `json:"id"`
	Name       string     `json:"name"`
	ClientType ClientType `json:"clientType"`
	Address    string     `json:"-"`
	Location   LatLng     `json:"-"`
	Images     []string   `json:"-"`
}

type LatLng struct {
	Lat float64 `json:"lat"`
	Lng float64 `json:"lng"`
}

type EntityMember struct {
	UserID    int64              `json:"userId"`
	EntityID  string             `json:"entityId"`
	Name      string             `json:"name"`
	AvatarURL string             `json:"avatarUrl,omitempty"`
	Phone     string             `json:"phone"`
	Role      EntityRole         `json:"role"`
	Status    EntityMemberStatus `json:"status"`
	JoinedAt  string             `json:"joinedAt"`
}

type Invite struct {
	ID        string       `json:"id"`
	EntityID  string       `json:"entityId"`
	Phone     string       `json:"phone"`
	Role      EntityRole   `json:"role"`
	Token     string       `json:"token"`
	Status    InviteStatus `json:"status"`
	ExpiresAt string       `json:"expiresAt"`
	CreatedAt string       `json:"createdAt"`
}

type Service struct {
	ID              string `json:"id"`
	ClientID        string `json:"clientId"`
	CategoryID      string `json:"categoryId,omitempty"`
	Name            string `json:"name"`
	CategoryPath    string `json:"categoryPath,omitempty"`
	Description     string `json:"description,omitempty"`
	Price           int    `json:"price,omitempty"`
	DurationMinutes int    `json:"durationMinutes,omitempty"`
	UpdatedAt       string `json:"updatedAt,omitempty"`
	Active          bool   `json:"active"`
}

type ServiceCategory struct {
	ID        string `json:"id"`
	ClientID  string `json:"clientId"`
	Name      string `json:"name"`
	ParentID  string `json:"parentId,omitempty"`
	SortOrder int    `json:"sortOrder,omitempty"`
}

type StaffServiceCapability struct {
	EntityID  string `json:"entityId"`
	UserID    int64  `json:"userId"`
	ServiceID string `json:"serviceId"`
	IsEnabled bool   `json:"isEnabled"`
}

type DayEntry struct {
	ID            string         `json:"id"`
	VisitID       string         `json:"visitId,omitempty"`
	ClientID      string         `json:"clientId"`
	Date          string         `json:"date"`
	StartTime     string         `json:"startTime,omitempty"`
	ServiceID     string         `json:"serviceId"`
	StaffID       string         `json:"staffId"`
	StaffIDs      []string       `json:"staffIds,omitempty"`
	PriceOverride *int           `json:"priceOverride,omitempty"`
	CustomerName  string         `json:"customerName,omitempty"`
	CustomerPhone string         `json:"customerPhone,omitempty"`
	Note          string         `json:"note,omitempty"`
	Status        DayEntryStatus `json:"status"`
	PaymentStatus PaymentStatus  `json:"paymentStatus"`
	PaidAmount    int            `json:"paidAmount,omitempty"`
}

type PaymentRecord struct {
	ID         string      `json:"id"`
	DayEntryID string      `json:"dayEntryId"`
	ClientID   string      `json:"clientId"`
	Amount     int         `json:"amount"`
	Mode       PaymentMode `json:"mode"`
	Note       string      `json:"note,omitempty"`
	CreatedAt  string      `json:"createdAt"`
}

type MeResponse struct {
	User              User           `json:"user"`
	Clients           []Client       `json:"clients"`
	CurrentClientID   string         `json:"currentClientId"`
	Memberships       []EntityMember `json:"memberships"`
	CurrentEntityRole *EntityRole    `json:"currentEntityRole,omitempty"`
}

type PartnerFirm struct {
	ID             int64  `json:"id"`
	Name           string `json:"name"`
	TradeName      string `json:"tradeName,omitempty"`
	GSTIN          string `json:"gstin,omitempty"`
	BillingAddress string `json:"billingAddress,omitempty"`
	City           string `json:"city,omitempty"`
	OwnerName      string `json:"ownerName,omitempty"`
	Phone          string `json:"phone,omitempty"`
	Email          string `json:"email,omitempty"`
	Status         string `json:"status,omitempty"`
	CreatedAt      string `json:"createdAt,omitempty"`
	UpdatedAt      string `json:"updatedAt,omitempty"`
}

type PartnerBrand struct {
	ID        int64  `json:"id"`
	Name      string `json:"name"`
	ItemCount int    `json:"itemCount"`
}

type PartnerCatalogItem struct {
	ID                        string  `json:"id"`
	BrandID                   string  `json:"brandId"`
	Name                      string  `json:"name"`
	Description               string  `json:"description,omitempty"`
	HSNCode                   string  `json:"hsnCode,omitempty"`
	SKU                       string  `json:"sku"`
	DefaultMRP                int     `json:"defaultMrp"`
	DefaultDiscountPercentage float64 `json:"defaultDiscountPercentage"`
	Status                    string  `json:"status"`
	UpdatedAt                 string  `json:"updatedAt"`
}

type PartnerItem struct {
	ID                 string  `json:"id"`
	BrandID            string  `json:"brandId"`
	ItemCode           string  `json:"itemCode"`
	Name               string  `json:"name"`
	Description        string  `json:"description,omitempty"`
	HSNCode            string  `json:"hsnCode,omitempty"`
	SKU                string  `json:"sku"`
	Unit               string  `json:"unit"`
	MRP                float64 `json:"mrp"`
	DiscountPercentage float64 `json:"discountPercentage"`
	CurrentStockQty    int     `json:"currentStockQty"`
	Status             string  `json:"status"`
	UpdatedAt          string  `json:"updatedAt"`
}

type PartnerClient struct {
	ID      string `json:"id"`
	FirmID  string `json:"firmId"`
	Name    string `json:"name"`
	Phone   string `json:"phone"`
	GSTIN   string `json:"gstin,omitempty"`
	Address string `json:"address,omitempty"`
	Status  string `json:"status"`
}

type PartnerClientOutlet struct {
	ID               string                 `json:"id"`
	FirmID           string                 `json:"firmId"`
	ClientBusinessID string                 `json:"clientBusinessId"`
	OutletName       string                 `json:"outletName"`
	Address          string                 `json:"address,omitempty"`
	Contacts         []PartnerOutletContact `json:"contacts"`
	IsPrimary        bool                   `json:"isPrimary"`
	Status           string                 `json:"status"`
}

type PartnerOutletContact struct {
	ID        string `json:"id"`
	FirmID    string `json:"firmId"`
	OutletID  string `json:"outletId"`
	Name      string `json:"name"`
	Phone     string `json:"phone"`
	IsPrimary bool   `json:"isPrimary"`
	SortOrder int    `json:"sortOrder"`
}

type PartnerClientContact struct {
	ID               string `json:"id"`
	FirmID           string `json:"firmId"`
	ClientBusinessID string `json:"clientBusinessId"`
	Name             string `json:"name"`
	Phone            string `json:"phone"`
	IsPrimary        bool   `json:"isPrimary"`
	SortOrder        int    `json:"sortOrder"`
}

type PartnerClientBusiness struct {
	ID             string                 `json:"id"`
	FirmID         string                 `json:"firmId"`
	BusinessName   string                 `json:"businessName"`
	GSTIN          string                 `json:"gstin,omitempty"`
	BillingName    string                 `json:"billingName,omitempty"`
	BillingAddress string                 `json:"billingAddress,omitempty"`
	Contacts       []PartnerClientContact `json:"contacts"`
	OutletCount    int                    `json:"outletCount"`
	Outlets        []PartnerClientOutlet  `json:"outlets"`
}

type PartnerStockRow struct {
	ItemID             string  `json:"itemId"`
	CatalogItemID      string  `json:"catalogItemId,omitempty"`
	ItemName           string  `json:"itemName"`
	ItemCode           string  `json:"itemCode"`
	BrandID            string  `json:"brandId"`
	BrandName          string  `json:"brandName"`
	SKU                string  `json:"sku"`
	MRP                float64 `json:"mrp"`
	DiscountPercentage float64 `json:"discountPercentage"`
	CurrentStockQty    int     `json:"currentStockQty"`
	LastUpdated        string  `json:"lastUpdated"`
}

type PartnerInventoryItem struct {
	FirmID             string  `json:"firmId"`
	ItemID             string  `json:"itemId"`
	CatalogItemID      string  `json:"catalogItemId"`
	BrandID            string  `json:"brandId"`
	ItemName           string  `json:"itemName"`
	SKU                string  `json:"sku"`
	MRP                int     `json:"mrp"`
	DiscountPercentage float64 `json:"discountPercentage"`
	Status             string  `json:"status"`
	Quantity           int     `json:"quantity"`
	UpdatedAt          string  `json:"updatedAt"`
	LastSupplierID     string  `json:"lastSupplierId,omitempty"`
	LastSupplierName   string  `json:"lastSupplierName,omitempty"`
	LastReceivedAt     string  `json:"lastReceivedAt,omitempty"`
}

type PartnerInventoryHistoryLine struct {
	ItemID        string `json:"itemId"`
	CatalogItemID string `json:"catalogItemId"`
	ItemName      string `json:"itemName"`
	SKU           string `json:"sku"`
	Quantity      int    `json:"quantity"`
}

type PartnerInventoryAdjustment struct {
	ID           string `json:"id"`
	FirmID       string `json:"firmId"`
	ItemID       string `json:"itemId"`
	QuantityFrom int    `json:"quantityFrom"`
	QuantityTo   int    `json:"quantityTo"`
	Note         string `json:"note"`
	CreatedBy    string `json:"createdBy,omitempty"`
	CreatedAt    string `json:"createdAt"`
}

type PartnerInventoryHistoryEntry struct {
	ID            string                        `json:"id"`
	FirmID        string                        `json:"firmId"`
	BrandID       string                        `json:"brandId"`
	ItemID        string                        `json:"itemId,omitempty"`
	CatalogItemID string                        `json:"catalogItemId,omitempty"`
	ItemName      string                        `json:"itemName,omitempty"`
	SKU           string                        `json:"sku,omitempty"`
	EventType     string                        `json:"eventType"`
	QuantityDelta int                           `json:"quantityDelta"`
	QuantityFrom  int                           `json:"quantityFrom,omitempty"`
	QuantityTo    int                           `json:"quantityTo,omitempty"`
	SupplierID    string                        `json:"supplierId,omitempty"`
	SupplierName  string                        `json:"supplierName,omitempty"`
	Note          string                        `json:"note,omitempty"`
	Status        string                        `json:"status,omitempty"`
	CanRevert     bool                          `json:"canRevert,omitempty"`
	RevertedAt    string                        `json:"revertedAt,omitempty"`
	RevertReason  string                        `json:"revertReason,omitempty"`
	EventAt       string                        `json:"eventAt"`
	Items         []PartnerInventoryHistoryLine `json:"items,omitempty"`
}

type PartnerInventoryHistoryFilters struct {
	BrandID  string `json:"brandId,omitempty"`
	FromDate string `json:"fromDate,omitempty"`
	ToDate   string `json:"toDate,omitempty"`
	Query    string `json:"query,omitempty"`
}

type PartnerStockLedgerEntry struct {
	ID            string  `json:"id"`
	FirmID        string  `json:"firmId"`
	ItemID        string  `json:"itemId"`
	QuantityDelta int     `json:"quantityDelta"`
	ReasonType    string  `json:"reasonType"`
	ReferenceType string  `json:"referenceType,omitempty"`
	ReferenceID   string  `json:"referenceId,omitempty"`
	Note          string  `json:"note,omitempty"`
	CreatedAt     string  `json:"createdAt"`
	UnitCost      float64 `json:"unitCost,omitempty"`
}

type PartnerStockLedgerFilters struct {
	ReasonType    string `json:"reasonType,omitempty"`
	ReferenceType string `json:"referenceType,omitempty"`
	FromDate      string `json:"fromDate,omitempty"`
	ToDate        string `json:"toDate,omitempty"`
	Query         string `json:"query,omitempty"`
}

type PartnerOrderItem struct {
	ID                 string  `json:"id"`
	OrderID            string  `json:"orderId"`
	BillableLineID     string  `json:"billableLineId,omitempty"`
	ItemID             string  `json:"itemId"`
	BrandID            string  `json:"brandId,omitempty"`
	CatalogItemID      string  `json:"catalogItemId,omitempty"`
	ItemCode           string  `json:"itemCode"`
	ItemName           string  `json:"itemName"`
	Unit               string  `json:"unit"`
	Quantity           int     `json:"quantity"`
	PackedQuantity     int     `json:"packedQuantity"`
	DispatchedQuantity int     `json:"dispatchedQuantity"`
	DeliveredQuantity  int     `json:"deliveredQuantity"`
	ReturnedQuantity   int     `json:"returnedQuantity"`
	CancelledQuantity  int     `json:"cancelledQuantity"`
	ShortReason        string  `json:"shortReason,omitempty"`
	MRP                float64 `json:"mrp"`
	DiscountPercentage float64 `json:"discountPercentage"`
}

type PartnerOrderBillableLine struct {
	ID                     string  `json:"id"`
	OrderID                string  `json:"orderId"`
	CatalogItemID          string  `json:"catalogItemId"`
	ItemCode               string  `json:"itemCode"`
	ItemName               string  `json:"itemName"`
	Quantity               int     `json:"quantity"`
	MRP                    float64 `json:"mrp"`
	SellerMarginPercentage float64 `json:"sellerMarginPercentage"`
	Rate                   float64 `json:"rate"`
	LineTotal              float64 `json:"lineTotal"`
}

type PartnerUnfulfilledOrderItem struct {
	ID                string `json:"id"`
	FirmID            string `json:"firmId"`
	ClientBusinessID  string `json:"clientBusinessId"`
	ClientOutletID    string `json:"clientOutletId"`
	SourceOrderID     string `json:"sourceOrderId"`
	SourceOrderLineID string `json:"sourceOrderLineId"`
	BrandID           string `json:"brandId"`
	CatalogItemID     string `json:"catalogItemId"`
	ItemCode          string `json:"itemCode"`
	ItemName          string `json:"itemName"`
	RequestedQuantity int    `json:"requestedQuantity"`
	FulfilledQuantity int    `json:"fulfilledQuantity"`
	OpenQuantity      int    `json:"openQuantity"`
	Status            string `json:"status"`
	Reason            string `json:"reason"`
	CreatedAt         string `json:"createdAt"`
	UpdatedAt         string `json:"updatedAt"`
	ClearedAt         string `json:"clearedAt,omitempty"`
}

type PartnerOrder struct {
	ID                     string                        `json:"id"`
	FirmID                 string                        `json:"firmId"`
	OrderNumber            string                        `json:"orderNumber"`
	ClientBusinessID       string                        `json:"clientBusinessId"`
	ClientBusinessName     string                        `json:"clientBusinessName"`
	ClientOutletID         string                        `json:"clientOutletId"`
	ClientOutletName       string                        `json:"clientOutletName"`
	OrderDate              string                        `json:"orderDate"`
	Source                 string                        `json:"source"`
	Status                 string                        `json:"status"`
	CreatedAt              string                        `json:"createdAt,omitempty"`
	CreatedByName          string                        `json:"createdByName,omitempty"`
	ConfirmedAt            string                        `json:"confirmedAt,omitempty"`
	DispatchDate           string                        `json:"dispatchDate,omitempty"`
	TransportName          string                        `json:"transportName,omitempty"`
	VehicleNumber          string                        `json:"vehicleNumber,omitempty"`
	DriverPhone            string                        `json:"driverPhone,omitempty"`
	DispatchNotes          string                        `json:"dispatchNotes,omitempty"`
	DispatchedAt           string                        `json:"dispatchedAt,omitempty"`
	DeliveredDate          string                        `json:"deliveredDate,omitempty"`
	DeliveryRecipientName  string                        `json:"deliveryRecipientName,omitempty"`
	DeliveryProofReference string                        `json:"deliveryProofReference,omitempty"`
	DeliveryNotes          string                        `json:"deliveryNotes,omitempty"`
	DeliveredAt            string                        `json:"deliveredAt,omitempty"`
	CancelledAt            string                        `json:"cancelledAt,omitempty"`
	LinkedInvoiceID        string                        `json:"linkedInvoiceId,omitempty"`
	LinkedInvoiceNumber    string                        `json:"linkedInvoiceNumber,omitempty"`
	ItemCount              int                           `json:"itemCount"`
	TotalQuantity          int                           `json:"totalQuantity"`
	Notes                  string                        `json:"notes,omitempty"`
	Items                  []PartnerOrderItem            `json:"items"`
	RequestedItems         []PartnerOrderItem            `json:"requestedItems"`
	BillableLines          []PartnerOrderBillableLine    `json:"billableLines"`
	UnfulfilledItems       []PartnerUnfulfilledOrderItem `json:"unfulfilledItems"`
}

type PartnerInvoiceItem struct {
	ID                 string  `json:"id"`
	InvoiceID          string  `json:"invoiceId"`
	BillableLineID     string  `json:"billableLineId,omitempty"`
	ItemID             string  `json:"itemId"`
	ItemCode           string  `json:"itemCode"`
	ItemName           string  `json:"itemName"`
	SKU                string  `json:"sku,omitempty"`
	HSNSAC             string  `json:"hsnSac,omitempty"`
	Quantity           int     `json:"quantity"`
	Unit               string  `json:"unit,omitempty"`
	MRP                float64 `json:"mrp"`
	DiscountPercentage float64 `json:"discountPercentage"`
	SellMarginPercent  float64 `json:"sellMarginPercentage"`
	Rate               float64 `json:"rate"`
	DiscountAmount     float64 `json:"discountAmount"`
	TaxableValue       float64 `json:"taxableValue"`
	GSTPercentage      float64 `json:"gstPercentage"`
	CGSTPercentage     float64 `json:"cgstPercentage"`
	SGSTPercentage     float64 `json:"sgstPercentage"`
	IGSTPercentage     float64 `json:"igstPercentage"`
	CGSTAmount         float64 `json:"cgstAmount"`
	SGSTAmount         float64 `json:"sgstAmount"`
	IGSTAmount         float64 `json:"igstAmount"`
	TotalTaxAmount     float64 `json:"totalTaxAmount"`
	LineTotal          float64 `json:"lineTotal"`
}

type PartnerInvoice struct {
	ID                    string               `json:"id"`
	FirmID                string               `json:"firmId"`
	OrderID               string               `json:"orderId,omitempty"`
	InvoiceNumber         string               `json:"invoiceNumber"`
	ClientBusinessID      string               `json:"clientBusinessId"`
	ClientBusinessName    string               `json:"clientBusinessName"`
	ClientOutletID        string               `json:"clientOutletId"`
	ClientOutletName      string               `json:"clientOutletName"`
	InvoiceDate           string               `json:"invoiceDate"`
	DueDate               string               `json:"dueDate,omitempty"`
	Status                string               `json:"status"`
	PaymentStatus         string               `json:"paymentStatus"`
	CreatedAt             string               `json:"createdAt,omitempty"`
	CreatedByName         string               `json:"createdByName,omitempty"`
	Amount                float64              `json:"amount"`
	PaidAmount            float64              `json:"paidAmount"`
	DueAmount             float64              `json:"dueAmount"`
	DispatchReference     string               `json:"dispatchReference,omitempty"`
	FirmName              string               `json:"firmName,omitempty"`
	FirmGSTIN             string               `json:"firmGstin,omitempty"`
	FirmBillingAddress    string               `json:"firmBillingAddress,omitempty"`
	FirmState             string               `json:"firmState,omitempty"`
	BillToName            string               `json:"billToName"`
	BillToGSTIN           string               `json:"billToGstin,omitempty"`
	BillToAddress         string               `json:"billToAddress,omitempty"`
	ClientGSTIN           string               `json:"clientGstin,omitempty"`
	ClientBillingAddress  string               `json:"clientBillingAddress,omitempty"`
	ClientState           string               `json:"clientState,omitempty"`
	DeliverToName         string               `json:"deliverToName"`
	DeliverToLocality     string               `json:"deliverToLocality,omitempty"`
	DeliverToAddress      string               `json:"deliverToAddress,omitempty"`
	DeliverToManagerName  string               `json:"deliverToManagerName,omitempty"`
	DeliverToManagerPhone string               `json:"deliverToManagerPhone,omitempty"`
	OutletShippingAddress string               `json:"outletShippingAddress,omitempty"`
	OutletContactName     string               `json:"outletContactName,omitempty"`
	OutletContactPhone    string               `json:"outletContactPhone,omitempty"`
	PlaceOfSupply         string               `json:"placeOfSupply,omitempty"`
	PaymentTerms          string               `json:"paymentTerms,omitempty"`
	SubtotalAmount        float64              `json:"subtotalAmount"`
	DiscountAmount        float64              `json:"discountAmount"`
	TaxableAmount         float64              `json:"taxableAmount"`
	CGSTAmount            float64              `json:"cgstAmount"`
	SGSTAmount            float64              `json:"sgstAmount"`
	IGSTAmount            float64              `json:"igstAmount"`
	RoundOffAmount        float64              `json:"roundOffAmount"`
	AdditionalCharges     float64              `json:"additionalChargesAmount"`
	FinalTotalAmount      float64              `json:"finalTotalAmount"`
	Notes                 string               `json:"notes,omitempty"`
	Items                 []PartnerInvoiceItem `json:"items"`
}

type PartnerPaymentAllocation struct {
	ID               string  `json:"id"`
	PaymentID        string  `json:"paymentId"`
	InvoiceID        string  `json:"invoiceId"`
	InvoiceNumber    string  `json:"invoiceNumber"`
	InvoiceDate      string  `json:"invoiceDate,omitempty"`
	InvoiceAmount    float64 `json:"invoiceAmount,omitempty"`
	InvoiceDueAmount float64 `json:"invoiceDueAmount,omitempty"`
	Amount           float64 `json:"amount"`
}

type PartnerPayment struct {
	ID                 string                     `json:"id"`
	FirmID             string                     `json:"firmId"`
	PaymentReference   string                     `json:"paymentReference"`
	ClientBusinessID   string                     `json:"clientBusinessId"`
	ClientBusinessName string                     `json:"clientBusinessName"`
	ClientOutletID     string                     `json:"clientOutletId,omitempty"`
	ClientOutletName   string                     `json:"clientOutletName,omitempty"`
	PaymentDate        string                     `json:"paymentDate"`
	Mode               string                     `json:"mode"`
	ReferenceNumber    string                     `json:"referenceNumber,omitempty"`
	Status             string                     `json:"status,omitempty"`
	CreatedAt          string                     `json:"createdAt,omitempty"`
	RecordedByName     string                     `json:"recordedByName,omitempty"`
	CollectedByUserID  string                     `json:"collectedByUserId,omitempty"`
	CollectedByName    string                     `json:"collectedByName,omitempty"`
	Amount             float64                    `json:"amount"`
	AllocatedAmount    float64                    `json:"allocatedAmount"`
	UnallocatedAmount  float64                    `json:"unallocatedAmount"`
	Notes              string                     `json:"notes,omitempty"`
	Allocations        []PartnerPaymentAllocation `json:"allocations"`
}

type PartnerClientLedgerEntry struct {
	ID                 string  `json:"id"`
	FirmID             string  `json:"firmId"`
	ClientBusinessID   string  `json:"clientBusinessId"`
	ClientBusinessName string  `json:"clientBusinessName,omitempty"`
	EntryDate          string  `json:"entryDate"`
	Type               string  `json:"type"`
	ReferenceType      string  `json:"referenceType"`
	ReferenceID        string  `json:"referenceId"`
	ReferenceNumber    string  `json:"referenceNumber"`
	Description        string  `json:"description"`
	DebitAmount        float64 `json:"debitAmount"`
	CreditAmount       float64 `json:"creditAmount"`
	RunningBalance     float64 `json:"runningBalance"`
	CreatedAt          string  `json:"createdAt,omitempty"`
}

type PartnerSupplier struct {
	ID           string `json:"id"`
	FirmID       string `json:"firmId"`
	SupplierName string `json:"supplierName"`
	GSTIN        string `json:"gstin,omitempty"`
	Phone        string `json:"phone,omitempty"`
	Address      string `json:"address,omitempty"`
	Status       string `json:"status"`
	CreatedAt    string `json:"createdAt,omitempty"`
	UpdatedAt    string `json:"updatedAt,omitempty"`
}

type PartnerSupplierGSTINValidation struct {
	Exists       bool   `json:"exists"`
	SupplierID   string `json:"supplierId,omitempty"`
	SupplierName string `json:"supplierName,omitempty"`
}

type PartnerSupplierInvoice struct {
	ID                string  `json:"id"`
	FirmID            string  `json:"firmId"`
	SupplierID        string  `json:"supplierId"`
	SupplierName      string  `json:"supplierName"`
	PurchaseID        string  `json:"purchaseId,omitempty"`
	PurchaseNumber    string  `json:"purchaseNumber,omitempty"`
	GRNID             string  `json:"grnId,omitempty"`
	GRNNumber         string  `json:"grnNumber,omitempty"`
	InvoiceNumber     string  `json:"invoiceNumber"`
	InvoiceDate       string  `json:"invoiceDate"`
	DueDate           string  `json:"dueDate,omitempty"`
	TaxableAmount     float64 `json:"taxableAmount"`
	GSTAmount         float64 `json:"gstAmount"`
	FinalTotalAmount  float64 `json:"finalTotalAmount"`
	PaidAmount        float64 `json:"paidAmount"`
	OutstandingAmount float64 `json:"outstandingAmount"`
	Status            string  `json:"status"`
	PayableStatus     string  `json:"payableStatus"`
	CreatedAt         string  `json:"createdAt,omitempty"`
	CreatedByName     string  `json:"createdByName,omitempty"`
	FinalizedAt       string  `json:"finalizedAt,omitempty"`
	FinalizedByName   string  `json:"finalizedByName,omitempty"`
	CancelledAt       string  `json:"cancelledAt,omitempty"`
	CancelledByName   string  `json:"cancelledByName,omitempty"`
}

type PartnerSupplierPaymentAllocation struct {
	ID                 string  `json:"id"`
	PaymentID          string  `json:"paymentId"`
	SupplierInvoiceID  string  `json:"supplierInvoiceId"`
	InvoiceNumber      string  `json:"invoiceNumber"`
	InvoiceDate        string  `json:"invoiceDate,omitempty"`
	InvoiceAmount      float64 `json:"invoiceAmount,omitempty"`
	InvoiceOutstanding float64 `json:"invoiceOutstanding,omitempty"`
	Amount             float64 `json:"amount"`
}

type PartnerSupplierPayment struct {
	ID                string                             `json:"id"`
	FirmID            string                             `json:"firmId"`
	SupplierID        string                             `json:"supplierId"`
	SupplierName      string                             `json:"supplierName"`
	PaymentDate       string                             `json:"paymentDate"`
	Mode              string                             `json:"mode"`
	ReferenceNumber   string                             `json:"referenceNumber,omitempty"`
	CreatedAt         string                             `json:"createdAt,omitempty"`
	RecordedByName    string                             `json:"recordedByName,omitempty"`
	Amount            float64                            `json:"amount"`
	AllocatedAmount   float64                            `json:"allocatedAmount"`
	UnallocatedAmount float64                            `json:"unallocatedAmount"`
	Notes             string                             `json:"notes,omitempty"`
	Allocations       []PartnerSupplierPaymentAllocation `json:"allocations"`
}

type PartnerSupplierLedgerEntry struct {
	ID              string  `json:"id"`
	FirmID          string  `json:"firmId"`
	SupplierID      string  `json:"supplierId"`
	SupplierName    string  `json:"supplierName,omitempty"`
	EntryDate       string  `json:"entryDate"`
	Type            string  `json:"type"`
	ReferenceType   string  `json:"referenceType"`
	ReferenceID     string  `json:"referenceId"`
	ReferenceNumber string  `json:"referenceNumber"`
	Description     string  `json:"description"`
	DebitAmount     float64 `json:"debitAmount"`
	CreditAmount    float64 `json:"creditAmount"`
	RunningBalance  float64 `json:"runningBalance"`
	CreatedAt       string  `json:"createdAt,omitempty"`
}

type PartnerPayablesSummary struct {
	TotalPayables    float64                  `json:"totalPayables"`
	OverduePayables  float64                  `json:"overduePayables"`
	InvoicesDueToday int                      `json:"invoicesDueToday"`
	Invoices         []PartnerSupplierInvoice `json:"invoices"`
}

type PartnerPurchaseItem struct {
	ID                 string  `json:"id"`
	PurchaseID         string  `json:"purchaseId"`
	ItemID             string  `json:"itemId"`
	ItemCode           string  `json:"itemCode"`
	ItemName           string  `json:"itemName"`
	SKU                string  `json:"sku,omitempty"`
	Quantity           int     `json:"quantity"`
	ReceivedQuantity   int     `json:"receivedQuantity"`
	DamagedQuantity    int     `json:"damagedQuantity"`
	CostPrice          float64 `json:"costPrice"`
	DiscountPercentage float64 `json:"discountPercentage,omitempty"`
	TaxPercentage      float64 `json:"taxPercentage,omitempty"`
	LineTotal          float64 `json:"lineTotal"`
}

type PartnerPurchase struct {
	ID                    string                `json:"id"`
	FirmID                string                `json:"firmId"`
	PurchaseNumber        string                `json:"purchaseNumber"`
	SupplierID            string                `json:"supplierId"`
	SupplierName          string                `json:"supplierName"`
	SupplierInvoiceNumber string                `json:"supplierInvoiceNumber,omitempty"`
	SupplierInvoiceDate   string                `json:"supplierInvoiceDate,omitempty"`
	PurchaseDate          string                `json:"purchaseDate"`
	ExpectedInwardDate    string                `json:"expectedInwardDate,omitempty"`
	Status                string                `json:"status"`
	CreatedAt             string                `json:"createdAt,omitempty"`
	CreatedByName         string                `json:"createdByName,omitempty"`
	OrderedAt             string                `json:"orderedAt,omitempty"`
	OrderedByName         string                `json:"orderedByName,omitempty"`
	PostedAt              string                `json:"postedAt,omitempty"`
	PostedByName          string                `json:"postedByName,omitempty"`
	CancelledAt           string                `json:"cancelledAt,omitempty"`
	Notes                 string                `json:"notes,omitempty"`
	LineCount             int                   `json:"lineCount"`
	TotalQuantity         int                   `json:"totalQuantity"`
	ReceivedQuantity      int                   `json:"receivedQuantity"`
	DamagedQuantity       int                   `json:"damagedQuantity"`
	TotalAmount           float64               `json:"totalAmount"`
	StockPosted           bool                  `json:"stockPosted"`
	Items                 []PartnerPurchaseItem `json:"items"`
}

type PartnerGoodsReceiptItem struct {
	ID               string `json:"id"`
	GRNID            string `json:"grnId"`
	PurchaseItemID   string `json:"purchaseItemId"`
	ItemID           string `json:"itemId"`
	ItemName         string `json:"itemName"`
	SKU              string `json:"sku,omitempty"`
	OrderedQuantity  int    `json:"orderedQuantity"`
	ReceivedQuantity int    `json:"receivedQuantity"`
	DamagedQuantity  int    `json:"damagedQuantity"`
	Notes            string `json:"notes,omitempty"`
}

type PartnerGoodsReceipt struct {
	ID            string                    `json:"id"`
	FirmID        string                    `json:"firmId"`
	PurchaseID    string                    `json:"purchaseId"`
	GRNNumber     string                    `json:"grnNumber"`
	SupplierID    string                    `json:"supplierId"`
	SupplierName  string                    `json:"supplierName"`
	ReceivedDate  string                    `json:"receivedDate"`
	Notes         string                    `json:"notes,omitempty"`
	CreatedAt     string                    `json:"createdAt,omitempty"`
	CreatedByName string                    `json:"createdByName,omitempty"`
	Items         []PartnerGoodsReceiptItem `json:"items"`
}

type PartnerCreditNoteLine struct {
	ID                     string  `json:"id"`
	CreditNoteID           string  `json:"creditNoteId"`
	ItemID                 string  `json:"itemId,omitempty"`
	ItemName               string  `json:"itemName,omitempty"`
	Quantity               int     `json:"quantity,omitempty"`
	Amount                 float64 `json:"amount"`
	ReferenceInvoiceLineID string  `json:"referenceInvoiceLineId,omitempty"`
}

type PartnerCreditNote struct {
	ID                   string                  `json:"id"`
	FirmID               string                  `json:"firmId"`
	CreditNoteNumber     string                  `json:"creditNoteNumber"`
	SalesReturnID        string                  `json:"salesReturnId,omitempty"`
	ClientBusinessID     string                  `json:"clientBusinessId"`
	ClientBusinessName   string                  `json:"clientBusinessName"`
	ClientOutletID       string                  `json:"clientOutletId"`
	ClientOutletName     string                  `json:"clientOutletName"`
	RelatedInvoiceID     string                  `json:"relatedInvoiceId,omitempty"`
	RelatedInvoiceNumber string                  `json:"relatedInvoiceNumber,omitempty"`
	CreditDate           string                  `json:"creditDate"`
	Note                 string                  `json:"note,omitempty"`
	Status               string                  `json:"status"`
	HasStockReturn       bool                    `json:"hasStockReturn"`
	TotalAmount          float64                 `json:"totalAmount"`
	CreatedAt            string                  `json:"createdAt,omitempty"`
	CreatedByName        string                  `json:"createdByName,omitempty"`
	CancelledAt          string                  `json:"cancelledAt,omitempty"`
	Lines                []PartnerCreditNoteLine `json:"lines"`
}

type PartnerSalesReturnLine struct {
	ID               string  `json:"id"`
	SalesReturnID    string  `json:"salesReturnId"`
	OrderItemID      string  `json:"orderItemId"`
	InvoiceLineID    string  `json:"invoiceLineId,omitempty"`
	ItemID           string  `json:"itemId"`
	ItemName         string  `json:"itemName"`
	ReturnedQuantity int     `json:"returnedQuantity"`
	AcceptedQuantity int     `json:"acceptedQuantity"`
	CreditAmount     float64 `json:"creditAmount"`
	Reason           string  `json:"reason,omitempty"`
}

type PartnerSalesReturn struct {
	ID                 string                   `json:"id"`
	FirmID             string                   `json:"firmId"`
	ReturnNumber       string                   `json:"returnNumber"`
	OrderID            string                   `json:"orderId"`
	OrderNumber        string                   `json:"orderNumber,omitempty"`
	InvoiceID          string                   `json:"invoiceId"`
	InvoiceNumber      string                   `json:"invoiceNumber,omitempty"`
	CreditNoteID       string                   `json:"creditNoteId,omitempty"`
	CreditNoteNumber   string                   `json:"creditNoteNumber,omitempty"`
	ClientBusinessID   string                   `json:"clientBusinessId"`
	ClientBusinessName string                   `json:"clientBusinessName"`
	ClientOutletID     string                   `json:"clientOutletId"`
	ClientOutletName   string                   `json:"clientOutletName"`
	ReturnDate         string                   `json:"returnDate"`
	Status             string                   `json:"status"`
	Notes              string                   `json:"notes,omitempty"`
	TotalQuantity      int                      `json:"totalQuantity"`
	TotalCreditAmount  float64                  `json:"totalCreditAmount"`
	CreatedAt          string                   `json:"createdAt,omitempty"`
	CreatedByName      string                   `json:"createdByName,omitempty"`
	CancelledAt        string                   `json:"cancelledAt,omitempty"`
	Lines              []PartnerSalesReturnLine `json:"lines"`
}

type PartnerDebitNoteLine struct {
	ID          string  `json:"id"`
	DebitNoteID string  `json:"debitNoteId"`
	ItemID      string  `json:"itemId,omitempty"`
	ItemName    string  `json:"itemName,omitempty"`
	Description string  `json:"description"`
	Amount      float64 `json:"amount"`
}

type PartnerDebitNote struct {
	ID                   string                 `json:"id"`
	FirmID               string                 `json:"firmId"`
	DebitNoteNumber      string                 `json:"debitNoteNumber"`
	ClientBusinessID     string                 `json:"clientBusinessId"`
	ClientBusinessName   string                 `json:"clientBusinessName"`
	ClientOutletID       string                 `json:"clientOutletId"`
	ClientOutletName     string                 `json:"clientOutletName"`
	RelatedInvoiceID     string                 `json:"relatedInvoiceId,omitempty"`
	RelatedInvoiceNumber string                 `json:"relatedInvoiceNumber,omitempty"`
	DebitDate            string                 `json:"debitDate"`
	Note                 string                 `json:"note,omitempty"`
	Status               string                 `json:"status"`
	TotalAmount          float64                `json:"totalAmount"`
	CreatedAt            string                 `json:"createdAt,omitempty"`
	CreatedByName        string                 `json:"createdByName,omitempty"`
	CancelledAt          string                 `json:"cancelledAt,omitempty"`
	Lines                []PartnerDebitNoteLine `json:"lines"`
}

type PartnerAuditLog struct {
	ID             string `json:"id"`
	FirmID         string `json:"firmId"`
	UserID         string `json:"userId"`
	UserName       string `json:"userName"`
	EntityType     string `json:"entityType"`
	EntityID       string `json:"entityId"`
	Action         string `json:"action"`
	ReferenceLabel string `json:"referenceLabel,omitempty"`
	BeforeState    string `json:"beforeState,omitempty"`
	AfterState     string `json:"afterState,omitempty"`
	CreatedAt      string `json:"createdAt"`
}

type PartnerGlobalSearchResult struct {
	ID       string `json:"id"`
	Type     string `json:"type"`
	Title    string `json:"title"`
	Subtitle string `json:"subtitle"`
	Href     string `json:"href"`
}

type PartnerSalesReportRow struct {
	InvoiceID          string  `json:"invoiceId"`
	InvoiceNumber      string  `json:"invoiceNumber"`
	InvoiceDate        string  `json:"invoiceDate"`
	ClientBusinessID   string  `json:"clientBusinessId"`
	ClientBusinessName string  `json:"clientBusinessName"`
	ClientOutletID     string  `json:"clientOutletId"`
	ClientOutletName   string  `json:"clientOutletName"`
	BrandID            string  `json:"brandId"`
	BrandName          string  `json:"brandName"`
	ItemID             string  `json:"itemId"`
	ItemName           string  `json:"itemName"`
	QuantitySold       int     `json:"quantitySold"`
	InvoiceValue       float64 `json:"invoiceValue"`
	PaymentReceived    float64 `json:"paymentReceived"`
	Outstanding        float64 `json:"outstanding"`
}

type PartnerStockMovementReportRow struct {
	ItemID         string `json:"itemId"`
	ItemName       string `json:"itemName"`
	BrandID        string `json:"brandId"`
	BrandName      string `json:"brandName"`
	OpeningStock   int    `json:"openingStock"`
	PurchaseInward int    `json:"purchaseInward"`
	ReturnIn       int    `json:"returnIn"`
	Sale           int    `json:"sale"`
	ReturnOut      int    `json:"returnOut"`
	Damage         int    `json:"damage"`
	Adjustment     int    `json:"adjustment"`
	ClosingStock   int    `json:"closingStock"`
}

type PartnerClientPurchaseHistoryRow struct {
	ClientBusinessID   string  `json:"clientBusinessId"`
	ClientBusinessName string  `json:"clientBusinessName"`
	ClientOutletID     string  `json:"clientOutletId"`
	ClientOutletName   string  `json:"clientOutletName"`
	InvoiceID          string  `json:"invoiceId"`
	InvoiceNumber      string  `json:"invoiceNumber"`
	InvoiceDate        string  `json:"invoiceDate"`
	ItemID             string  `json:"itemId"`
	ItemName           string  `json:"itemName"`
	Quantity           int     `json:"quantity"`
	Amount             float64 `json:"amount"`
}

type PartnerDashboardActivity struct {
	ID            string `json:"id"`
	Title         string `json:"title"`
	Subtitle      string `json:"subtitle"`
	CreatedAt     string `json:"createdAt"`
	Type          string `json:"type,omitempty"`
	Action        string `json:"action,omitempty"`
	Reference     string `json:"reference,omitempty"`
	Subject       string `json:"subject,omitempty"`
	Party         string `json:"party,omitempty"`
	Location      string `json:"location,omitempty"`
	Status        string `json:"status,omitempty"`
	QuantityDelta int    `json:"quantityDelta,omitempty"`
	ImpactText    string `json:"impactText,omitempty"`
	Href          string `json:"href,omitempty"`
}

type PartnerDashboardStats struct {
	MappedBrandsCount    int                        `json:"mappedBrandsCount"`
	ItemCount            int                        `json:"itemCount"`
	ClientBusinessCount  int                        `json:"clientBusinessCount"`
	OutletCount          int                        `json:"outletCount"`
	SupplierCount        int                        `json:"supplierCount"`
	OpenOrdersCount      int                        `json:"openOrdersCount"`
	UnpaidInvoicesCount  int                        `json:"unpaidInvoicesCount"`
	CurrentStockQtyTotal int                        `json:"currentStockQtyTotal"`
	RecentActivity       []PartnerDashboardActivity `json:"recentActivity"`
}

type PartnerReceivableInvoiceSummary struct {
	InvoiceID     string  `json:"invoiceId"`
	InvoiceNumber string  `json:"invoiceNumber"`
	ClientID      string  `json:"clientId,omitempty"`
	ClientName    string  `json:"clientName,omitempty"`
	OutletID      string  `json:"outletId"`
	OutletName    string  `json:"outletName"`
	InvoiceDate   string  `json:"invoiceDate"`
	DueDate       string  `json:"dueDate"`
	Amount        float64 `json:"amount"`
	PaidAmount    float64 `json:"paidAmount"`
	Outstanding   float64 `json:"outstanding"`
	AgeDays       int     `json:"ageDays"`
	AgingBucket   string  `json:"agingBucket"`
	Status        string  `json:"status"`
	PaymentStatus string  `json:"paymentStatus"`
}

type PartnerReceivableOutletSummary struct {
	OutletID      string  `json:"outletId"`
	OutletName    string  `json:"outletName"`
	TotalInvoiced float64 `json:"totalInvoiced"`
	TotalPaid     float64 `json:"totalPaid"`
	Outstanding   float64 `json:"outstanding"`
}

type PartnerReceivableBusinessSummary struct {
	BusinessID         string                            `json:"businessId"`
	BusinessName       string                            `json:"businessName"`
	OutletCount        int                               `json:"outletCount"`
	TotalInvoiced      float64                           `json:"totalInvoiced"`
	TotalPaid          float64                           `json:"totalPaid"`
	Outstanding        float64                           `json:"outstanding"`
	Overdue0To30       float64                           `json:"overdue0To30"`
	Overdue31To60      float64                           `json:"overdue31To60"`
	Overdue61To90      float64                           `json:"overdue61To90"`
	Overdue90Plus      float64                           `json:"overdue90Plus"`
	LatestActivityDate string                            `json:"latestActivityDate"`
	Outlets            []PartnerReceivableOutletSummary  `json:"outlets"`
	Invoices           []PartnerReceivableInvoiceSummary `json:"invoices"`
}

type PartnerReceivablesSummary struct {
	TotalReceivables   float64                            `json:"totalReceivables"`
	OverdueReceivables float64                            `json:"overdueReceivables"`
	InvoicesDueToday   int                                `json:"invoicesDueToday"`
	ClientsWithDues    int                                `json:"clientsWithDues"`
	Businesses         []PartnerReceivableBusinessSummary `json:"businesses"`
}

type PartnerMeResponse struct {
	User         User          `json:"user"`
	Firms        []PartnerFirm `json:"firms"`
	ActiveFirmID int64         `json:"activeFirmId"`
}

type PartnerFirmMembership struct {
	UserID   int64                       `json:"userId"`
	FirmID   int64                       `json:"firmId"`
	Name     string                      `json:"name"`
	Phone    string                      `json:"phone"`
	Role     PartnerFirmRole             `json:"role"`
	Status   PartnerFirmMembershipStatus `json:"status"`
	JoinedAt string                      `json:"joinedAt"`
}

type PartnerFirmInvite struct {
	ID         string                  `json:"id"`
	FirmID     int64                   `json:"firmId"`
	Phone      string                  `json:"phone"`
	Role       PartnerFirmRole         `json:"role"`
	Status     PartnerFirmInviteStatus `json:"status"`
	InvitedBy  int64                   `json:"invitedBy"`
	ExpiresAt  string                  `json:"expiresAt"`
	AcceptedAt string                  `json:"acceptedAt,omitempty"`
	CreatedAt  string                  `json:"createdAt"`
}

type CreatePartnerFirmInviteInput struct {
	Phone string          `json:"phone"`
	Role  PartnerFirmRole `json:"role"`
}

type CreatePartnerFirmInviteResult struct {
	Kind       string                 `json:"kind"`
	Membership *PartnerFirmMembership `json:"membership,omitempty"`
	Invite     *PartnerFirmInvite     `json:"invite,omitempty"`
}

type CreatePartnerFirmInput struct {
	Name           string `json:"name"`
	TradeName      string `json:"tradeName,omitempty"`
	GSTIN          string `json:"gstin,omitempty"`
	BillingAddress string `json:"billingAddress"`
	City           string `json:"city"`
	OwnerName      string `json:"ownerName"`
	Phone          string `json:"phone"`
	Email          string `json:"email"`
}

type UpdatePartnerFirmInput struct {
	Name           string `json:"name"`
	TradeName      string `json:"tradeName,omitempty"`
	GSTIN          string `json:"gstin,omitempty"`
	BillingAddress string `json:"billingAddress"`
	City           string `json:"city"`
	OwnerName      string `json:"ownerName"`
	Phone          string `json:"phone"`
	Email          string `json:"email"`
	Status         string `json:"status,omitempty"`
}

type CreateEntityInput struct {
	OwnerName  string     `json:"ownerName"`
	OwnerPhone string     `json:"ownerPhone"`
	Name       string     `json:"name"`
	ClientType ClientType `json:"clientType"`
	Address    string     `json:"address"`
	Location   LatLng     `json:"location"`
	Images     []string   `json:"images"`
}

type CreateInviteInput struct {
	EntityID string     `json:"entityId"`
	Phone    string     `json:"phone"`
	Role     EntityRole `json:"role"`
}

type AcceptInviteInput struct {
	Token string `json:"token"`
}

type UpdateStaffCapabilitiesInput struct {
	EntityID   string   `json:"entityId"`
	ServiceIDs []string `json:"serviceIds"`
}

type CreateServiceInput struct {
	ClientID        string `json:"clientId"`
	CategoryID      string `json:"categoryId,omitempty"`
	Name            string `json:"name"`
	CategoryPath    string `json:"categoryPath,omitempty"`
	Description     string `json:"description,omitempty"`
	Price           *int   `json:"price,omitempty"`
	DurationMinutes *int   `json:"durationMinutes,omitempty"`
	Active          bool   `json:"active"`
}

type UpdateServiceInput struct {
	CategoryID      *string `json:"categoryId,omitempty"`
	Name            *string `json:"name,omitempty"`
	CategoryPath    *string `json:"categoryPath,omitempty"`
	Description     *string `json:"description,omitempty"`
	Price           *int    `json:"price,omitempty"`
	DurationMinutes *int    `json:"durationMinutes,omitempty"`
	Active          *bool   `json:"active,omitempty"`
}

type CreateServiceCategoryInput struct {
	ClientID  string `json:"clientId"`
	Name      string `json:"name"`
	ParentID  string `json:"parentId,omitempty"`
	SortOrder *int   `json:"sortOrder,omitempty"`
}

type UpdateServiceCategoryInput struct {
	Name      *string `json:"name,omitempty"`
	ParentID  *string `json:"parentId,omitempty"`
	SortOrder *int    `json:"sortOrder,omitempty"`
}

type CreateDayEntryInput struct {
	VisitID       string   `json:"visitId,omitempty"`
	ClientID      string   `json:"clientId"`
	Date          string   `json:"date"`
	StartTime     string   `json:"startTime,omitempty"`
	ServiceID     string   `json:"serviceId"`
	StaffID       string   `json:"staffId"`
	StaffIDs      []string `json:"staffIds,omitempty"`
	PriceOverride *int     `json:"priceOverride,omitempty"`
	CustomerName  string   `json:"customerName,omitempty"`
	CustomerPhone string   `json:"customerPhone,omitempty"`
	Note          string   `json:"note,omitempty"`
	Status        string   `json:"status"`
	PaidAmount    int      `json:"paidAmount,omitempty"`
}

type UpdateDayEntryInput struct {
	VisitID       *string  `json:"visitId,omitempty"`
	ClientID      *string  `json:"clientId,omitempty"`
	Date          *string  `json:"date,omitempty"`
	StartTime     *string  `json:"startTime,omitempty"`
	ServiceID     *string  `json:"serviceId,omitempty"`
	StaffID       *string  `json:"staffId,omitempty"`
	StaffIDs      []string `json:"staffIds,omitempty"`
	PriceOverride *int     `json:"priceOverride,omitempty"`
	CustomerName  *string  `json:"customerName,omitempty"`
	CustomerPhone *string  `json:"customerPhone,omitempty"`
	Note          *string  `json:"note,omitempty"`
	Status        *string  `json:"status,omitempty"`
	PaidAmount    *int     `json:"paidAmount,omitempty"`
}

type CreatePaymentInput struct {
	ClientID   string      `json:"clientId"`
	DayEntryID string      `json:"dayEntryId"`
	Amount     int         `json:"amount"`
	Mode       PaymentMode `json:"mode"`
	Note       string      `json:"note,omitempty"`
}

type CreatePartnerFirmBrandInput struct {
	BrandID   string `json:"brandId,omitempty"`
	BrandName string `json:"brandName,omitempty"`
}

type CreatePartnerBrandItemInput struct {
	Name                      string  `json:"name"`
	Description               string  `json:"description,omitempty"`
	SKU                       string  `json:"sku,omitempty"`
	HSNCode                   string  `json:"hsnCode,omitempty"`
	DefaultMRP                int     `json:"defaultMrp,omitempty"`
	DefaultDiscountPercentage float64 `json:"defaultDiscountPercentage,omitempty"`
	Status                    string  `json:"status,omitempty"`
}

type UpdatePartnerBrandItemInput struct {
	Name                      *string  `json:"name,omitempty"`
	Description               *string  `json:"description,omitempty"`
	SKU                       *string  `json:"sku,omitempty"`
	HSNCode                   *string  `json:"hsnCode,omitempty"`
	DefaultMRP                *int     `json:"defaultMrp,omitempty"`
	DefaultDiscountPercentage *float64 `json:"defaultDiscountPercentage,omitempty"`
	Status                    *string  `json:"status,omitempty"`
}

type UpdatePartnerInventoryItemInput struct {
	Status   *string `json:"status,omitempty"`
	Quantity *int    `json:"quantity,omitempty"`
	Note     string  `json:"note,omitempty"`
}

type CreatePartnerClientBusinessInput struct {
	BusinessName   string                      `json:"businessName"`
	GSTIN          string                      `json:"gstin,omitempty"`
	BillingAddress string                      `json:"billingAddress,omitempty"`
	Contacts       []PartnerClientContactInput `json:"contacts,omitempty"`
}

type CreatePartnerClientOutletInput struct {
	OutletName string                      `json:"outletName"`
	Address    string                      `json:"address,omitempty"`
	Contacts   []PartnerClientContactInput `json:"contacts,omitempty"`
}

type UpdatePartnerClientBusinessInput struct {
	BusinessName   string                      `json:"businessName"`
	GSTIN          string                      `json:"gstin,omitempty"`
	BillingAddress string                      `json:"billingAddress,omitempty"`
	Contacts       []PartnerClientContactInput `json:"contacts,omitempty"`
}

type PartnerClientContactInput struct {
	Name  string `json:"name"`
	Phone string `json:"phone"`
}

type UpdatePartnerClientOutletInput struct {
	OutletName string                      `json:"outletName"`
	Address    string                      `json:"address,omitempty"`
	Contacts   []PartnerClientContactInput `json:"contacts,omitempty"`
	Status     string                      `json:"status"`
}

type PartnerGSTINValidation struct {
	Exists       bool   `json:"exists"`
	BusinessID   string `json:"businessId,omitempty"`
	BusinessName string `json:"businessName,omitempty"`
}

type CreatePartnerOrderLineInput struct {
	ItemID   string `json:"itemId"`
	Quantity int    `json:"quantity"`
}

type CreatePartnerOrderInput struct {
	ClientBusinessID       string                        `json:"clientBusinessId"`
	ClientOutletID         string                        `json:"clientOutletId"`
	OrderDate              string                        `json:"orderDate"`
	Source                 string                        `json:"source,omitempty"`
	Status                 string                        `json:"status,omitempty"`
	SellerMarginPercentage *float64                      `json:"sellerMarginPercentage,omitempty"`
	Notes                  string                        `json:"notes,omitempty"`
	Items                  []CreatePartnerOrderLineInput `json:"items"`
}

type UpdatePartnerOrderStatusInput struct {
	Status                 string                             `json:"status"`
	SellerMarginPercentage *float64                           `json:"sellerMarginPercentage,omitempty"`
	Note                   string                             `json:"note,omitempty"`
	Items                  []CreatePartnerOrderLineInput      `json:"items,omitempty"`
	RequestedItems         []PartnerOrderStatusRequestedInput `json:"requestedItems,omitempty"`
	PackedItems            []PartnerOrderPackedItemInput      `json:"packedItems,omitempty"`
	DispatchDetails        PartnerOrderDispatchDetailsInput   `json:"dispatchDetails,omitempty"`
	DispatchedItems        []PartnerOrderDispatchedItemInput  `json:"dispatchedItems,omitempty"`
	DeliveryDetails        PartnerOrderDeliveryDetailsInput   `json:"deliveryDetails,omitempty"`
	DeliveredItems         []PartnerOrderDeliveredItemInput   `json:"deliveredItems,omitempty"`
}

type PartnerOrderStatusRequestedInput struct {
	ItemID                 string  `json:"itemId"`
	SellerMarginPercentage float64 `json:"sellerMarginPercentage"`
}

type PartnerOrderPackedItemInput struct {
	OrderItemID    string `json:"orderItemId,omitempty"`
	ItemID         string `json:"itemId,omitempty"`
	PackedQuantity int    `json:"packedQuantity"`
	ShortReason    string `json:"shortReason,omitempty"`
}

type PartnerOrderDispatchedItemInput struct {
	OrderItemID        string `json:"orderItemId,omitempty"`
	ItemID             string `json:"itemId,omitempty"`
	DispatchedQuantity int    `json:"dispatchedQuantity"`
}

type PartnerOrderDeliveredItemInput struct {
	OrderItemID       string `json:"orderItemId,omitempty"`
	ItemID            string `json:"itemId,omitempty"`
	DeliveredQuantity int    `json:"deliveredQuantity"`
	ReturnedQuantity  int    `json:"returnedQuantity,omitempty"`
}

type PartnerOrderDispatchDetailsInput struct {
	DispatchDate  string `json:"dispatchDate,omitempty"`
	TransportName string `json:"transportName,omitempty"`
	VehicleNumber string `json:"vehicleNumber,omitempty"`
	DriverPhone   string `json:"driverPhone,omitempty"`
	Notes         string `json:"notes,omitempty"`
}

type PartnerOrderDeliveryDetailsInput struct {
	DeliveredDate  string `json:"deliveredDate,omitempty"`
	RecipientName  string `json:"recipientName,omitempty"`
	ProofReference string `json:"proofReference,omitempty"`
	Notes          string `json:"notes,omitempty"`
}

type UpdatePartnerOrderInput struct {
	ClientBusinessID       string                        `json:"clientBusinessId"`
	ClientOutletID         string                        `json:"clientOutletId"`
	Source                 string                        `json:"source,omitempty"`
	SellerMarginPercentage *float64                      `json:"sellerMarginPercentage,omitempty"`
	Notes                  string                        `json:"notes,omitempty"`
	Items                  []CreatePartnerOrderLineInput `json:"items"`
}

type CreatePartnerInvoiceInput struct {
	OrderID          string                        `json:"orderId,omitempty"`
	ClientBusinessID string                        `json:"clientBusinessId"`
	ClientOutletID   string                        `json:"clientOutletId"`
	InvoiceDate      string                        `json:"invoiceDate"`
	DueDate          string                        `json:"dueDate,omitempty"`
	Notes            string                        `json:"notes,omitempty"`
	Items            []CreatePartnerOrderLineInput `json:"items,omitempty"`
}

type CreatePartnerPaymentInput struct {
	InvoiceID         string  `json:"invoiceId"`
	PaymentDate       string  `json:"paymentDate"`
	Amount            float64 `json:"amount"`
	PaymentMode       string  `json:"paymentMode"`
	ReferenceNumber   string  `json:"referenceNumber,omitempty"`
	CollectedByUserID string  `json:"collectedByUserId,omitempty"`
	Notes             string  `json:"notes,omitempty"`
}

type GetPartnerPaymentsInput struct {
	Search           string `json:"search,omitempty"`
	ClientBusinessID string `json:"clientBusinessId,omitempty"`
	InvoiceID        string `json:"invoiceId,omitempty"`
	FromDate         string `json:"fromDate,omitempty"`
	ToDate           string `json:"toDate,omitempty"`
}

type GetPartnerClientLedgerInput struct {
	ClientBusinessID string `json:"clientBusinessId,omitempty"`
	FromDate         string `json:"fromDate,omitempty"`
	ToDate           string `json:"toDate,omitempty"`
}

type CreatePartnerSupplierInput struct {
	SupplierName string `json:"supplierName"`
	GSTIN        string `json:"gstin,omitempty"`
	Phone        string `json:"phone,omitempty"`
	Address      string `json:"address,omitempty"`
}

type UpdatePartnerSupplierInput struct {
	SupplierName string `json:"supplierName"`
	GSTIN        string `json:"gstin,omitempty"`
	Phone        string `json:"phone,omitempty"`
	Address      string `json:"address,omitempty"`
	Status       string `json:"status"`
}

type GetPartnerSupplierInvoicesInput struct {
	Search      string `json:"search,omitempty"`
	SupplierID  string `json:"supplierId,omitempty"`
	Status      string `json:"status,omitempty"`
	FromDate    string `json:"fromDate,omitempty"`
	ToDate      string `json:"toDate,omitempty"`
	OverdueOnly bool   `json:"overdueOnly,omitempty"`
}

type CreatePartnerSupplierInvoiceInput struct {
	SupplierID       string  `json:"supplierId"`
	PurchaseID       string  `json:"purchaseId,omitempty"`
	GRNID            string  `json:"grnId,omitempty"`
	InvoiceNumber    string  `json:"invoiceNumber"`
	InvoiceDate      string  `json:"invoiceDate"`
	DueDate          string  `json:"dueDate,omitempty"`
	TaxableAmount    float64 `json:"taxableAmount"`
	GSTAmount        float64 `json:"gstAmount"`
	FinalTotalAmount float64 `json:"finalTotalAmount"`
	Finalize         bool    `json:"finalize,omitempty"`
}

type CreatePartnerSupplierPaymentInput struct {
	SupplierInvoiceID string  `json:"supplierInvoiceId"`
	PaymentDate       string  `json:"paymentDate"`
	Amount            float64 `json:"amount"`
	PaymentMode       string  `json:"paymentMode"`
	ReferenceNumber   string  `json:"referenceNumber,omitempty"`
	Notes             string  `json:"notes,omitempty"`
}

type GetPartnerSupplierPaymentsInput struct {
	Search            string `json:"search,omitempty"`
	SupplierID        string `json:"supplierId,omitempty"`
	SupplierInvoiceID string `json:"supplierInvoiceId,omitempty"`
	FromDate          string `json:"fromDate,omitempty"`
	ToDate            string `json:"toDate,omitempty"`
}

type GetPartnerSupplierLedgerInput struct {
	SupplierID string `json:"supplierId,omitempty"`
	FromDate   string `json:"fromDate,omitempty"`
	ToDate     string `json:"toDate,omitempty"`
}

type CreatePartnerPurchaseLineInput struct {
	ItemID             string  `json:"itemId"`
	Quantity           int     `json:"quantity"`
	CostPrice          float64 `json:"costPrice"`
	DiscountPercentage float64 `json:"discountPercentage,omitempty"`
	TaxPercentage      float64 `json:"taxPercentage,omitempty"`
}

type CreatePartnerPurchaseInput struct {
	SupplierID            string                           `json:"supplierId"`
	PurchaseNumber        string                           `json:"purchaseNumber"`
	SupplierInvoiceNumber string                           `json:"supplierInvoiceNumber,omitempty"`
	SupplierInvoiceDate   string                           `json:"supplierInvoiceDate,omitempty"`
	PurchaseDate          string                           `json:"purchaseDate"`
	ExpectedInwardDate    string                           `json:"expectedInwardDate,omitempty"`
	Notes                 string                           `json:"notes,omitempty"`
	Items                 []CreatePartnerPurchaseLineInput `json:"items"`
}

type ReceivePartnerPurchaseLineInput struct {
	PurchaseItemID   string `json:"purchaseItemId,omitempty"`
	ItemID           string `json:"itemId,omitempty"`
	ReceivedQuantity int    `json:"receivedQuantity"`
	DamagedQuantity  int    `json:"damagedQuantity,omitempty"`
	Notes            string `json:"notes,omitempty"`
}

type ReceivePartnerPurchaseInput struct {
	ReceivedDate string                            `json:"receivedDate"`
	Notes        string                            `json:"notes,omitempty"`
	Items        []ReceivePartnerPurchaseLineInput `json:"items"`
}

type CreatePartnerStockAdjustmentInput struct {
	ItemID        string `json:"itemId"`
	QuantityDelta int    `json:"quantityDelta"`
	ReasonType    string `json:"reasonType"`
	ReferenceType string `json:"referenceType,omitempty"`
	ReferenceID   string `json:"referenceId,omitempty"`
	Note          string `json:"note,omitempty"`
}

type GetPartnerReceivablesSummaryInput struct {
	Search      string `json:"search,omitempty"`
	Status      string `json:"status,omitempty"`
	FromDate    string `json:"fromDate,omitempty"`
	ToDate      string `json:"toDate,omitempty"`
	OverdueOnly bool   `json:"overdueOnly,omitempty"`
}

type CreatePartnerStockActionInput struct {
	ActionType       string `json:"actionType"`
	ItemID           string `json:"itemId"`
	Quantity         int    `json:"quantity,omitempty"`
	QuantityDelta    int    `json:"quantityDelta,omitempty"`
	ActionDate       string `json:"actionDate"`
	Note             string `json:"note,omitempty"`
	ReferenceID      string `json:"referenceId,omitempty"`
	ReferenceType    string `json:"referenceType,omitempty"`
	ClientBusinessID string `json:"clientBusinessId,omitempty"`
	ClientOutletID   string `json:"clientOutletId,omitempty"`
	SupplierID       string `json:"supplierId,omitempty"`
	InvoiceID        string `json:"invoiceId,omitempty"`
	PurchaseID       string `json:"purchaseId,omitempty"`
	DamageCategory   string `json:"damageCategory,omitempty"`
}

type CreatePartnerCreditNoteLineInput struct {
	ItemID                 string  `json:"itemId,omitempty"`
	Quantity               int     `json:"quantity,omitempty"`
	Amount                 float64 `json:"amount"`
	ReferenceInvoiceLineID string  `json:"referenceInvoiceLineId,omitempty"`
}

type CreatePartnerCreditNoteInput struct {
	ClientBusinessID string                             `json:"clientBusinessId"`
	ClientOutletID   string                             `json:"clientOutletId"`
	RelatedInvoiceID string                             `json:"relatedInvoiceId,omitempty"`
	CreditDate       string                             `json:"creditDate"`
	Note             string                             `json:"note,omitempty"`
	Status           string                             `json:"status,omitempty"`
	HasStockReturn   bool                               `json:"hasStockReturn"`
	Lines            []CreatePartnerCreditNoteLineInput `json:"lines"`
}

type CreatePartnerOrderReturnLineInput struct {
	OrderItemID string `json:"orderItemId"`
	Quantity    int    `json:"quantity"`
}

type CreatePartnerOrderReturnInput struct {
	ReturnDate string                              `json:"returnDate"`
	Note       string                              `json:"note,omitempty"`
	Lines      []CreatePartnerOrderReturnLineInput `json:"lines"`
}

type CreatePartnerOrderReturnResponse struct {
	SalesReturn PartnerSalesReturn `json:"salesReturn"`
	CreditNote  PartnerCreditNote  `json:"creditNote"`
	Order       PartnerOrder       `json:"order"`
}

type VoidPartnerOrderReturnResponse = CreatePartnerOrderReturnResponse

type CreatePartnerDebitNoteLineInput struct {
	ItemID      string  `json:"itemId,omitempty"`
	Description string  `json:"description"`
	Amount      float64 `json:"amount"`
}

type CreatePartnerDebitNoteInput struct {
	ClientBusinessID string                            `json:"clientBusinessId"`
	ClientOutletID   string                            `json:"clientOutletId"`
	RelatedInvoiceID string                            `json:"relatedInvoiceId,omitempty"`
	DebitDate        string                            `json:"debitDate"`
	Note             string                            `json:"note,omitempty"`
	Status           string                            `json:"status,omitempty"`
	Lines            []CreatePartnerDebitNoteLineInput `json:"lines"`
}

type GetPartnerAuditLogsInput struct {
	EntityType string `json:"entityType,omitempty"`
	FromDate   string `json:"fromDate,omitempty"`
	ToDate     string `json:"toDate,omitempty"`
	UserID     string `json:"userId,omitempty"`
}

type GetPartnerSalesReportInput struct {
	FromDate         string `json:"fromDate,omitempty"`
	ToDate           string `json:"toDate,omitempty"`
	BrandID          string `json:"brandId,omitempty"`
	ItemID           string `json:"itemId,omitempty"`
	ClientBusinessID string `json:"clientBusinessId,omitempty"`
	ClientOutletID   string `json:"clientOutletId,omitempty"`
	GroupBy          string `json:"groupBy,omitempty"`
}

type GetPartnerStockMovementReportInput struct {
	FromDate string `json:"fromDate,omitempty"`
	ToDate   string `json:"toDate,omitempty"`
	BrandID  string `json:"brandId,omitempty"`
	ItemID   string `json:"itemId,omitempty"`
}

type Store struct {
	pool             *pgxpool.Pool
	currentUserID    string
	currentUserName  string
	currentUserPhone string
}

func New(ctx context.Context, databaseURL, currentUserID, currentUserName, currentUserPhone string) (*Store, error) {
	pool, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		return nil, err
	}

	if err := backenddb.ApplySchema(ctx, pool); err != nil {
		pool.Close()
		return nil, err
	}

	s := &Store{
		pool:             pool,
		currentUserID:    currentUserID,
		currentUserName:  currentUserName,
		currentUserPhone: currentUserPhone,
	}

	if err := s.ensureCurrentUser(ctx); err != nil {
		pool.Close()
		return nil, err
	}

	return s, nil
}

func (s *Store) Close() {
	if s.pool != nil {
		s.pool.Close()
	}
}

func (s *Store) Pool() *pgxpool.Pool {
	return s.pool
}

func (s *Store) ForUser(user User) *Store {
	next := *s
	next.currentUserID = strconv.FormatInt(user.ID, 10)
	next.currentUserName = user.Name
	next.currentUserPhone = user.Phone
	return &next
}

func (s *Store) RequestLoginOTP(input RequestLoginOTPInput) (RequestLoginOTPResult, error) {
	ctx := context.Background()
	phone, err := normalizePhone(input.Phone)
	if err != nil {
		return RequestLoginOTPResult{}, err
	}

	code, err := generateOTPCode(4)
	if err != nil {
		return RequestLoginOTPResult{}, err
	}
	expiresAt := time.Now().UTC().Add(LoginOTPTTL)

	if _, err := s.pool.Exec(ctx, `
		delete from user_login_otps
		where phone = $1 and consumed_at is null
	`, phone); err != nil {
		return RequestLoginOTPResult{}, err
	}

	if _, err := s.pool.Exec(ctx, `
		insert into user_login_otps (id, phone, code, expires_at)
		values ($1, $2, $3, $4)
	`, nextID("otp"), phone, code, expiresAt); err != nil {
		return RequestLoginOTPResult{}, err
	}

	return RequestLoginOTPResult{
		Phone:     phone,
		OTP:       code,
		ExpiresAt: expiresAt.Format(time.RFC3339),
	}, nil
}

func (s *Store) VerifyLoginOTP(input VerifyLoginOTPInput) (VerifyLoginOTPResult, error) {
	ctx := context.Background()
	phone, err := normalizePhone(input.Phone)
	code := strings.TrimSpace(input.OTP)
	if err != nil {
		return VerifyLoginOTPResult{}, err
	}
	if code == "" {
		return VerifyLoginOTPResult{}, fmt.Errorf("phone and otp are required")
	}

	var otpID string
	err = s.pool.QueryRow(ctx, `
		select id
		from user_login_otps
		where phone = $1
		  and code = $2
		  and consumed_at is null
		  and expires_at > now()
		order by created_at desc
		limit 1
	`, phone, code).Scan(&otpID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return VerifyLoginOTPResult{}, fmt.Errorf("invalid or expired otp")
		}
		return VerifyLoginOTPResult{}, err
	}

	if _, err := s.pool.Exec(ctx, `
		update user_login_otps
		set consumed_at = now()
		where id = $1
	`, otpID); err != nil {
		return VerifyLoginOTPResult{}, err
	}

	user, err := s.FindOrCreateUserByPhone(phone)
	if err != nil {
		return VerifyLoginOTPResult{}, err
	}
	if err := s.ActivatePartnerFirmInvitesForPhone(user.ID, phone); err != nil {
		return VerifyLoginOTPResult{}, err
	}
	return VerifyLoginOTPResult{
		User: &user,
	}, nil
}

func (s *Store) FindOrCreateUserByPhone(phone string) (User, error) {
	ctx := context.Background()
	normalizedPhone, err := normalizePhone(phone)
	if err != nil {
		return User{}, err
	}
	var existingID int64
	err = s.pool.QueryRow(ctx, `select id from users where phone = $1`, normalizedPhone).Scan(&existingID)
	if err == nil {
		return s.GetUserByID(strconv.FormatInt(existingID, 10))
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return User{}, err
	}
	var id int64
	if err := s.pool.QueryRow(ctx, `
		insert into users (name, phone)
		values ($1, $2)
		returning id
	`, "", normalizedPhone).Scan(&id); err != nil {
		return User{}, err
	}
	return s.GetUserByID(strconv.FormatInt(id, 10))
}

func (s *Store) UpdateCurrentUserProfile(input UpdateCurrentUserProfileInput) (User, error) {
	ctx := context.Background()
	name := strings.TrimSpace(input.Name)
	birthDate := strings.TrimSpace(input.BirthDate)
	if name == "" {
		return User{}, fmt.Errorf("name is required")
	}
	if strings.TrimSpace(s.currentUserID) == "" {
		return User{}, fmt.Errorf("authentication required")
	}
	var birthDateValue any
	if birthDate != "" {
		birthDateValue = birthDate
	}
	if _, err := s.pool.Exec(ctx, `
		update users
		set name = $2,
		    birth_date = $3::date,
		    updated_at = now()
		where id = $1
	`, s.currentUserID, name, birthDateValue); err != nil {
		return User{}, err
	}
	return s.GetUserByID(s.currentUserID)
}

func (s *Store) CreateSession(userID int64, ttl time.Duration) (UserSession, error) {
	ctx := context.Background()
	id := nextID("sess")
	token, err := generateSessionToken()
	if err != nil {
		return UserSession{}, err
	}
	tokenHash := hashToken(token)
	expiresAt := time.Now().UTC().Add(ttl)

	var session UserSession
	err = s.pool.QueryRow(ctx, `
		insert into user_sessions (id, user_id, token, expires_at)
		values ($1, $2, $3, $4)
		returning id, user_id, token, to_char(expires_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
		          to_char(created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
	`, id, userID, tokenHash, expiresAt).Scan(
		&session.ID, &session.UserID, &session.Token, &session.ExpiresAt, &session.CreatedAt,
	)
	if err != nil {
		return UserSession{}, err
	}
	session.Token = token
	return session, nil
}

func (s *Store) DeleteSessionByToken(token string) error {
	ctx := context.Background()
	if strings.TrimSpace(token) == "" {
		return nil
	}
	_, err := s.pool.Exec(ctx, `delete from user_sessions where token = $1`, hashToken(token))
	return err
}

func (s *Store) UserBySessionToken(token string) (User, error) {
	ctx := context.Background()
	var user User
	err := s.pool.QueryRow(ctx, `
		select u.id, u.name, u.phone, coalesce(to_char(u.birth_date, 'YYYY-MM-DD'), '')
		from user_sessions s
		join users u on u.id = s.user_id
		where s.token = $1 and s.expires_at > now()
	`, hashToken(token)).Scan(&user.ID, &user.Name, &user.Phone, &user.BirthDate)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return User{}, fmt.Errorf("session not found")
		}
		return User{}, err
	}
	return user, nil
}

func (s *Store) GetUserByID(id string) (User, error) {
	ctx := context.Background()
	var user User
	err := s.pool.QueryRow(ctx, `
		select id, name, phone, coalesce(to_char(birth_date, 'YYYY-MM-DD'), '')
		from users
		where id = $1
	`, id).Scan(&user.ID, &user.Name, &user.Phone, &user.BirthDate)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return User{}, fmt.Errorf("user not found")
		}
		return User{}, err
	}
	return user, nil
}

func (s *Store) GetMe() (MeResponse, error) {
	ctx := context.Background()
	currentUser, err := s.currentUser(ctx)
	if err != nil {
		return MeResponse{}, err
	}
	if _, err := s.pool.Exec(ctx, `
		update entity_invites
		set status = 'EXPIRED'
		where status = 'PENDING' and expires_at <= now()
	`); err != nil {
		return MeResponse{}, err
	}

	clientsRows, err := s.pool.Query(ctx, `
		select e.id, e.name, e.client_type
		from entities e
		join entity_members m on m.entity_id = e.id
		where m.user_id = $1::bigint and m.status = 'ACTIVE'
		order by e.created_at desc
	`, currentUser.ID)
	if err != nil {
		return MeResponse{}, err
	}
	defer clientsRows.Close()

	var clients []Client
	for clientsRows.Next() {
		var client Client
		if err := clientsRows.Scan(&client.ID, &client.Name, &client.ClientType); err != nil {
			return MeResponse{}, err
		}
		clients = append(clients, client)
	}
	if err := clientsRows.Err(); err != nil {
		return MeResponse{}, err
	}

	memberRows, err := s.pool.Query(ctx, `
		select m.user_id, m.entity_id, u.name, coalesce(u.avatar_url, ''), u.phone, m.role, m.status, m.joined_at
		from entity_members m
		join users u on u.id = m.user_id
		where m.user_id = $1::bigint and m.status = 'ACTIVE'
		order by m.joined_at asc
	`, currentUser.ID)
	if err != nil {
		return MeResponse{}, err
	}
	defer memberRows.Close()

	var memberships []EntityMember
	for memberRows.Next() {
		member, err := scanMember(memberRows)
		if err != nil {
			return MeResponse{}, err
		}
		memberships = append(memberships, member)
	}
	if err := memberRows.Err(); err != nil {
		return MeResponse{}, err
	}

	currentClientID := ""
	var currentEntityRole *EntityRole
	if len(clients) > 0 {
		currentClientID = clients[0].ID
		for _, membership := range memberships {
			if membership.EntityID == currentClientID {
				role := membership.Role
				currentEntityRole = &role
				break
			}
		}
	}

	return MeResponse{
		User:              currentUser,
		Clients:           ensureClients(clients),
		CurrentClientID:   currentClientID,
		Memberships:       ensureMembers(memberships),
		CurrentEntityRole: currentEntityRole,
	}, nil
}

func (s *Store) GetPartnersMe() (PartnerMeResponse, error) {
	ctx := context.Background()
	currentUser, err := s.currentUser(ctx)
	if err != nil {
		return PartnerMeResponse{}, err
	}

	rows, err := s.pool.Query(ctx, `
		select distinct
			f.id, f.name, coalesce(f.trade_name, ''), coalesce(f.gstin, ''), coalesce(f.billing_address, ''),
			coalesce(f.city, ''), coalesce(f.owner_name, ''), coalesce(f.phone, ''),
			coalesce(f.email, ''), coalesce(f.status, 'ACTIVE'),
			to_char(f.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
			to_char(f.updated_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
		from partner_firm_memberships m
		join partner_firms f on f.id = m.firm_id
		where m.user_id = $1::bigint and m.status = 'ACTIVE'
		order by f.name asc
	`, currentUser.ID)
	if err != nil {
		return PartnerMeResponse{}, err
	}
	defer rows.Close()

	var firms []PartnerFirm
	for rows.Next() {
		var firm PartnerFirm
		if err := scanPartnerFirm(rows, &firm); err != nil {
			return PartnerMeResponse{}, err
		}
		firms = append(firms, firm)
	}
	if err := rows.Err(); err != nil {
		return PartnerMeResponse{}, err
	}

	var activeFirmID int64
	if len(firms) > 0 {
		activeFirmID = firms[0].ID
	}

	return PartnerMeResponse{
		User:         currentUser,
		Firms:        ensurePartnerFirms(firms),
		ActiveFirmID: activeFirmID,
	}, nil
}

func (s *Store) GetPartnerFirm(firmID string) (PartnerFirm, error) {
	ctx := context.Background()
	if !s.UserHasPartnerFirmAccess(firmID) {
		return PartnerFirm{}, fmt.Errorf("firm access denied")
	}
	firm, err := scanPartnerFirmRow(s.pool.QueryRow(ctx, `
		select
			id, name, coalesce(trade_name, ''), coalesce(gstin, ''), coalesce(billing_address, ''),
			coalesce(city, ''), coalesce(owner_name, ''), coalesce(phone, ''),
			coalesce(email, ''), coalesce(status, 'ACTIVE'),
			to_char(created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
			to_char(updated_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
		from partner_firms
		where id = $1
	`, firmID))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return PartnerFirm{}, fmt.Errorf("firm not found")
		}
		return PartnerFirm{}, err
	}
	return firm, nil
}

func (s *Store) CreatePartnerFirm(input CreatePartnerFirmInput) (PartnerFirm, error) {
	ctx := context.Background()
	currentUser, err := s.currentUser(ctx)
	if err != nil {
		return PartnerFirm{}, err
	}
	name := strings.TrimSpace(input.Name)
	if name == "" {
		return PartnerFirm{}, fmt.Errorf("name is required")
	}
	if strings.TrimSpace(input.BillingAddress) == "" || strings.TrimSpace(input.City) == "" ||
		strings.TrimSpace(input.OwnerName) == "" || strings.TrimSpace(input.Phone) == "" || strings.TrimSpace(input.Email) == "" {
		return PartnerFirm{}, fmt.Errorf("billingAddress, city, ownerName, phone, and email are required")
	}
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return PartnerFirm{}, err
	}
	defer tx.Rollback(ctx)

	var firmID int64
	if err := tx.QueryRow(ctx, `
		insert into partner_firms (
			name, trade_name, gstin, billing_address, city, owner_name, phone, email, status
		)
		values ($1, nullif($2, ''), nullif($3, ''), $4, $5, $6, $7, $8, 'ACTIVE')
		returning id
	`, name, strings.TrimSpace(input.TradeName), normalizeGSTIN(input.GSTIN), strings.TrimSpace(input.BillingAddress),
		strings.TrimSpace(input.City), strings.TrimSpace(input.OwnerName), strings.TrimSpace(input.Phone), strings.TrimSpace(input.Email)).Scan(&firmID); err != nil {
		return PartnerFirm{}, err
	}

	if _, err := tx.Exec(ctx, `
		insert into partner_firm_memberships (user_id, firm_id, role, status, joined_at)
		values ($1, $2, 'OWNER', 'ACTIVE', now())
	`, currentUser.ID, firmID); err != nil {
		return PartnerFirm{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return PartnerFirm{}, err
	}
	return s.GetPartnerFirm(strconv.FormatInt(firmID, 10))
}

func (s *Store) UpdatePartnerFirm(firmID string, input UpdatePartnerFirmInput) (PartnerFirm, error) {
	ctx := context.Background()
	if !s.UserHasPartnerFirmAccess(firmID) {
		return PartnerFirm{}, fmt.Errorf("firm access denied")
	}
	name := strings.TrimSpace(input.Name)
	if name == "" {
		return PartnerFirm{}, fmt.Errorf("name is required")
	}
	if strings.TrimSpace(input.BillingAddress) == "" || strings.TrimSpace(input.City) == "" ||
		strings.TrimSpace(input.OwnerName) == "" || strings.TrimSpace(input.Phone) == "" || strings.TrimSpace(input.Email) == "" {
		return PartnerFirm{}, fmt.Errorf("billingAddress, city, ownerName, phone, and email are required")
	}
	status := strings.TrimSpace(input.Status)
	if status == "" {
		status = "ACTIVE"
	}
	if status != "ACTIVE" && status != "INACTIVE" {
		return PartnerFirm{}, fmt.Errorf("status must be ACTIVE or INACTIVE")
	}
	tag, err := s.pool.Exec(ctx, `
		update partner_firms
		set
			name = $2,
			trade_name = nullif($3, ''),
			gstin = nullif($4, ''),
			billing_address = $5,
			city = $6,
			owner_name = $7,
			phone = $8,
			email = $9,
			status = $10,
			updated_at = now()
		where id = $1
	`, firmID, name, strings.TrimSpace(input.TradeName), normalizeGSTIN(input.GSTIN), strings.TrimSpace(input.BillingAddress),
		strings.TrimSpace(input.City), strings.TrimSpace(input.OwnerName), strings.TrimSpace(input.Phone),
		strings.TrimSpace(input.Email), status)
	if err != nil {
		return PartnerFirm{}, err
	}
	if tag.RowsAffected() == 0 {
		return PartnerFirm{}, fmt.Errorf("firm not found")
	}
	return s.GetPartnerFirm(firmID)
}

func (s *Store) UserHasPartnerFirmAccess(firmID string) bool {
	ctx := context.Background()
	var exists bool
	if err := s.pool.QueryRow(ctx, `
		select exists(
			select 1
			from partner_firm_memberships
			where user_id = $1::bigint and firm_id = $2::bigint and status = 'ACTIVE'
		)
	`, s.currentUserID, firmID).Scan(&exists); err != nil {
		return false
	}
	return exists
}

func (s *Store) CurrentUserPartnerFirmRole(firmID string) (PartnerFirmRole, bool) {
	ctx := context.Background()
	var role PartnerFirmRole
	if err := s.pool.QueryRow(ctx, `
		select role
		from partner_firm_memberships
		where user_id = $1::bigint and firm_id = $2::bigint and status = 'ACTIVE'
		order by case role when 'OWNER' then 1 when 'ACCOUNTANT' then 2 when 'DELIVERY_PARTNER' then 3 when 'STAFF' then 4 else 5 end
		limit 1
	`, s.currentUserID, firmID).Scan(&role); err != nil {
		return "", false
	}
	return role, true
}

func (s *Store) UserHasPartnerFinanceAccess(firmID string) bool {
	role, ok := s.CurrentUserPartnerFirmRole(firmID)
	return ok && (role == PartnerFirmRoleOwner || role == PartnerFirmRoleAccountant)
}

func (s *Store) ActivatePartnerFirmInvitesForPhone(userID int64, phone string) error {
	ctx := context.Background()
	normalizedPhone, err := normalizePhone(phone)
	if err != nil {
		return err
	}
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, `
		update partner_firm_invites
		set status = 'EXPIRED'
		where phone = $1 and status = 'PENDING' and expires_at <= now()
	`, normalizedPhone); err != nil {
		return err
	}

	rows, err := tx.Query(ctx, `
		select id, firm_id, role
		from partner_firm_invites
		where phone = $1 and status = 'PENDING' and expires_at > now()
		order by created_at asc
	`, normalizedPhone)
	if err != nil {
		return err
	}
	defer rows.Close()

	type pendingInvite struct {
		ID     string
		FirmID int64
		Role   PartnerFirmRole
	}
	var invites []pendingInvite
	for rows.Next() {
		var invite pendingInvite
		if err := rows.Scan(&invite.ID, &invite.FirmID, &invite.Role); err != nil {
			return err
		}
		invites = append(invites, invite)
	}
	if err := rows.Err(); err != nil {
		return err
	}

	for _, invite := range invites {
		var membershipExists bool
		if err := tx.QueryRow(ctx, `
			select exists(
				select 1
				from partner_firm_memberships
				where user_id = $1::bigint and firm_id = $2::bigint and role = $3
			)
		`, userID, invite.FirmID, invite.Role).Scan(&membershipExists); err != nil {
			return err
		}
		if !membershipExists {
			if _, err := tx.Exec(ctx, `
				insert into partner_firm_memberships (user_id, firm_id, role, status, joined_at)
				values ($1, $2, $3, 'ACTIVE', now())
			`, userID, invite.FirmID, invite.Role); err != nil {
				return err
			}
		}
		if _, err := tx.Exec(ctx, `
			update partner_firm_invites
			set status = 'ACCEPTED', accepted_at = now()
			where id = $1
		`, invite.ID); err != nil {
			return err
		}
	}

	return tx.Commit(ctx)
}

func (s *Store) GetPartnerFirmMemberships(firmID string) ([]PartnerFirmMembership, error) {
	ctx := context.Background()
	rows, err := s.pool.Query(ctx, `
		select m.user_id, m.firm_id, u.name, u.phone, m.role, m.status,
		       to_char(m.joined_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
		from partner_firm_memberships m
		join users u on u.id = m.user_id
		where m.firm_id = $1::bigint
		order by
			case m.role
				when 'OWNER' then 1
				when 'ACCOUNTANT' then 2
				when 'DELIVERY_PARTNER' then 3
				when 'STAFF' then 4
				else 5
			end,
			u.name asc
	`, firmID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []PartnerFirmMembership
	for rows.Next() {
		var item PartnerFirmMembership
		if err := rows.Scan(&item.UserID, &item.FirmID, &item.Name, &item.Phone, &item.Role, &item.Status, &item.JoinedAt); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return ensurePartnerFirmMemberships(items), rows.Err()
}

func (s *Store) GetPartnerFirmInvites(firmID string) ([]PartnerFirmInvite, error) {
	ctx := context.Background()
	if _, err := s.pool.Exec(ctx, `
		update partner_firm_invites
		set status = 'EXPIRED'
		where firm_id = $1::bigint and status = 'PENDING' and expires_at <= now()
	`, firmID); err != nil {
		return nil, err
	}

	rows, err := s.pool.Query(ctx, `
		select id, firm_id, phone, role, status, invited_by,
		       to_char(expires_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
		       coalesce(to_char(accepted_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), ''),
		       to_char(created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
		from partner_firm_invites
		where firm_id = $1::bigint and status = 'PENDING'
		order by created_at desc
	`, firmID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []PartnerFirmInvite
	for rows.Next() {
		var item PartnerFirmInvite
		if err := rows.Scan(&item.ID, &item.FirmID, &item.Phone, &item.Role, &item.Status, &item.InvitedBy, &item.ExpiresAt, &item.AcceptedAt, &item.CreatedAt); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return ensurePartnerFirmInvites(items), rows.Err()
}

func (s *Store) CreatePartnerFirmInvite(firmID string, input CreatePartnerFirmInviteInput) (CreatePartnerFirmInviteResult, error) {
	ctx := context.Background()
	phone, err := normalizePhone(input.Phone)
	role := input.Role
	if err != nil {
		return CreatePartnerFirmInviteResult{}, err
	}
	switch role {
	case PartnerFirmRoleStaff, PartnerFirmRoleAccountant, PartnerFirmRoleDeliveryPartner:
	default:
		return CreatePartnerFirmInviteResult{}, fmt.Errorf("role must be STAFF, ACCOUNTANT, or DELIVERY_PARTNER")
	}

	var existingUserID string
	err = s.pool.QueryRow(ctx, `select id from users where phone = $1`, phone).Scan(&existingUserID)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return CreatePartnerFirmInviteResult{}, err
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return CreatePartnerFirmInviteResult{}, err
	}
	defer tx.Rollback(ctx)

	if existingUserID != "" {
		var membership PartnerFirmMembership
		var membershipExists bool
		if err := tx.QueryRow(ctx, `
			select exists(
				select 1
				from partner_firm_memberships
				where user_id = $1::bigint and firm_id = $2::bigint and role = $3
			)
		`, existingUserID, firmID, role).Scan(&membershipExists); err != nil {
			return CreatePartnerFirmInviteResult{}, err
		}
		if membershipExists {
			return CreatePartnerFirmInviteResult{}, fmt.Errorf("user already has this role in the firm")
		}

		if err := tx.QueryRow(ctx, `
			insert into partner_firm_memberships (user_id, firm_id, role, status, joined_at)
			values ($1, $2, $3, 'ACTIVE', now())
			returning user_id, firm_id, (select coalesce(name, '') from users where id = $1), (select phone from users where id = $1),
			          role, status,
			          to_char(joined_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
		`, existingUserID, firmID, role).Scan(
			&membership.UserID, &membership.FirmID, &membership.Name, &membership.Phone, &membership.Role,
			&membership.Status, &membership.JoinedAt,
		); err != nil {
			return CreatePartnerFirmInviteResult{}, err
		}
		if err := tx.Commit(ctx); err != nil {
			return CreatePartnerFirmInviteResult{}, err
		}
		return CreatePartnerFirmInviteResult{Kind: "membership", Membership: &membership}, nil
	}

	var invite PartnerFirmInvite
	expiresAt := time.Now().UTC().Add(7 * 24 * time.Hour)
	if err := tx.QueryRow(ctx, `
		insert into partner_firm_invites (id, firm_id, phone, role, status, invited_by, expires_at)
		values ($1, $2, $3, $4, 'PENDING', $5, $6)
		returning id, firm_id, phone, role, status, invited_by,
		          to_char(expires_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
		          '',
		          to_char(created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
	`, nextID("pfinv"), firmID, phone, role, s.currentUserID, expiresAt).Scan(
		&invite.ID, &invite.FirmID, &invite.Phone, &invite.Role, &invite.Status, &invite.InvitedBy, &invite.ExpiresAt, &invite.AcceptedAt, &invite.CreatedAt,
	); err != nil {
		return CreatePartnerFirmInviteResult{}, err
	}
	if err := tx.Commit(ctx); err != nil {
		return CreatePartnerFirmInviteResult{}, err
	}
	return CreatePartnerFirmInviteResult{Kind: "invite", Invite: &invite}, nil
}

func (s *Store) RemovePartnerFirmMembership(firmID, userID string, role PartnerFirmRole) error {
	ctx := context.Background()

	var existingRole PartnerFirmRole
	err := s.pool.QueryRow(ctx, `
		select role
		from partner_firm_memberships
		where firm_id = $1::bigint and user_id = $2::bigint and role = $3
	`, firmID, userID, role).Scan(&existingRole)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return fmt.Errorf("membership not found")
		}
		return err
	}
	if existingRole == PartnerFirmRoleOwner {
		return fmt.Errorf("owner membership cannot be removed")
	}

	tag, err := s.pool.Exec(ctx, `
		delete from partner_firm_memberships
		where firm_id = $1::bigint and user_id = $2::bigint and role = $3
	`, firmID, userID, role)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("membership not found")
	}
	return nil
}

func (s *Store) RevokePartnerFirmInvite(firmID, inviteID string, role PartnerFirmRole) error {
	ctx := context.Background()
	tag, err := s.pool.Exec(ctx, `
		delete from partner_firm_invites
		where firm_id = $1::bigint and id = $2 and role = $3 and status = 'PENDING'
	`, firmID, inviteID, role)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("pending invite not found")
	}
	return nil
}

func (s *Store) GetPartnerFirmBrands(firmID string) ([]PartnerBrand, error) {
	ctx := context.Background()
	rows, err := s.pool.Query(ctx, `
		select b.id, b.name, coalesce(count(i.id), 0)::int as item_count
		from partner_firm_brands fb
		join partner_brands b on b.id = fb.brand_id
		left join partner_product_catalog i on i.brand_id = b.id
		where fb.firm_id = $1::bigint
		group by b.id, b.name
		order by b.name asc
	`, firmID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []PartnerBrand
	for rows.Next() {
		var item PartnerBrand
		if err := rows.Scan(&item.ID, &item.Name, &item.ItemCount); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return ensurePartnerBrands(items), nil
}

func (s *Store) CreatePartnerFirmBrand(firmID string, input CreatePartnerFirmBrandInput) (PartnerBrand, error) {
	ctx := context.Background()
	requestedBrandID := strings.TrimSpace(input.BrandID)
	brandName := strings.TrimSpace(input.BrandName)

	if requestedBrandID == "" && brandName == "" {
		return PartnerBrand{}, fmt.Errorf("brandId or brandName is required")
	}

	var brandID int64
	if requestedBrandID != "" {
		parsedBrandID, err := strconv.ParseInt(requestedBrandID, 10, 64)
		if err != nil || parsedBrandID <= 0 {
			return PartnerBrand{}, fmt.Errorf("invalid brand id")
		}
		brandID = parsedBrandID
		var exists bool
		if err := s.pool.QueryRow(ctx, `
			select exists(
				select 1
				from partner_firm_brands fb
				where fb.firm_id = $1::bigint and fb.brand_id = $2::bigint
			)
		`, firmID, brandID).Scan(&exists); err != nil {
			return PartnerBrand{}, err
		}
		if !exists {
			return PartnerBrand{}, fmt.Errorf("brands cannot be reused across firms")
		}
	} else {
		var duplicateExists bool
		if err := s.pool.QueryRow(ctx, `
			select exists(
				select 1
				from partner_firm_brands fb
				join partner_brands b on b.id = fb.brand_id
				where fb.firm_id = $1::bigint and lower(b.name) = lower($2)
			)
		`, firmID, brandName).Scan(&duplicateExists); err != nil {
			return PartnerBrand{}, err
		}
		if duplicateExists {
			return PartnerBrand{}, fmt.Errorf("this brand is already mapped to the active firm")
		}

		if err := s.pool.QueryRow(ctx, `
			insert into partner_brands (name)
			values ($1)
			returning id
		`, brandName).Scan(&brandID); err != nil {
			return PartnerBrand{}, err
		}
	}

	if _, err := s.pool.Exec(ctx, `
		insert into partner_firm_brands (firm_id, brand_id)
		values ($1::bigint, $2)
		on conflict (firm_id, brand_id) do nothing
	`, firmID, brandID); err != nil {
		return PartnerBrand{}, err
	}

	var brand PartnerBrand
	if err := s.pool.QueryRow(ctx, `
		select b.id, b.name, coalesce(count(i.id), 0)::int as item_count
		from partner_brands b
		left join partner_product_catalog i on i.brand_id = b.id
		where b.id = $1
		group by b.id, b.name
	`, brandID).Scan(&brand.ID, &brand.Name, &brand.ItemCount); err != nil {
		return PartnerBrand{}, err
	}
	return brand, nil
}

func (s *Store) DeletePartnerFirmBrand(firmID, brandID string) (bool, error) {
	ctx := context.Background()
	tag, err := s.pool.Exec(ctx, `
		delete from partner_firm_brands
		where firm_id = $1::bigint and brand_id = $2::bigint
	`, firmID, brandID)
	if err != nil {
		return false, err
	}
	return tag.RowsAffected() > 0, nil
}

func (s *Store) HasPartnerFirmBrand(firmID, brandID string) bool {
	ctx := context.Background()
	var exists bool
	if err := s.pool.QueryRow(ctx, `
		select exists(
			select 1
			from partner_firm_brands
			where firm_id = $1::bigint and brand_id = $2::bigint
		)
	`, firmID, brandID).Scan(&exists); err != nil {
		return false
	}
	return exists
}

func (s *Store) GetPartnerBrandItems(firmID, brandID string) ([]PartnerCatalogItem, error) {
	ctx := context.Background()
	rows, err := s.pool.Query(ctx, `
		select c.id, c.brand_id, c.name, coalesce(c.description, ''), coalesce(c.hsn_code, ''), c.sku,
		       coalesce(c.default_mrp, 0), coalesce(c.default_discount_percentage, 0)::float8, c.status,
		       to_char(c.updated_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
		from partner_product_catalog c
		join partner_firm_brands fb on fb.brand_id = c.brand_id and fb.firm_id = $1::bigint
		where c.brand_id = $2::bigint
		order by c.name asc
	`, firmID, brandID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []PartnerCatalogItem
	for rows.Next() {
		var item PartnerCatalogItem
		if err := rows.Scan(
			&item.ID,
			&item.BrandID,
			&item.Name,
			&item.Description,
			&item.HSNCode,
			&item.SKU,
			&item.DefaultMRP,
			&item.DefaultDiscountPercentage,
			&item.Status,
			&item.UpdatedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return ensurePartnerCatalogItems(items), nil
}

func (s *Store) CreatePartnerBrandItem(firmID, brandID string, input CreatePartnerBrandItemInput) (PartnerCatalogItem, error) {
	ctx := context.Background()
	name := strings.TrimSpace(input.Name)
	description := strings.TrimSpace(input.Description)
	sku := strings.TrimSpace(input.SKU)
	hsnCode := strings.TrimSpace(input.HSNCode)
	defaultMRP := input.DefaultMRP
	defaultDiscountPercentage := input.DefaultDiscountPercentage
	status := strings.ToUpper(strings.TrimSpace(input.Status))
	if status == "" {
		status = "ACTIVE"
	}
	if status != "ACTIVE" && status != "INACTIVE" {
		return PartnerCatalogItem{}, fmt.Errorf("status must be ACTIVE or INACTIVE")
	}

	var exists bool
	if err := s.pool.QueryRow(ctx, `
		select exists(
			select 1 from partner_firm_brands
			where firm_id = $1::bigint and brand_id = $2::bigint
		)
	`, firmID, brandID).Scan(&exists); err != nil {
		return PartnerCatalogItem{}, err
	}
	if !exists {
		return PartnerCatalogItem{}, fmt.Errorf("brand mapping not found")
	}
	if sku == "" {
		return PartnerCatalogItem{}, fmt.Errorf("sku is required")
	}
	if defaultMRP <= 0 {
		return PartnerCatalogItem{}, fmt.Errorf("defaultMrp must be greater than zero")
	}
	if defaultDiscountPercentage < 0 || defaultDiscountPercentage > 100 {
		return PartnerCatalogItem{}, fmt.Errorf("Default Buy Margin must be between 0 and 100")
	}
	if hsnCode != "" && !regexp.MustCompile(`^\d+$`).MatchString(hsnCode) {
		return PartnerCatalogItem{}, fmt.Errorf("hsnCode must contain digits only")
	}
	if err := s.pool.QueryRow(ctx, `
		select exists(
			select 1 from partner_product_catalog
			where brand_id = $1::bigint and lower(sku) = lower($2)
		)
	`, brandID, sku).Scan(&exists); err != nil {
		return PartnerCatalogItem{}, err
	}
	if exists {
		return PartnerCatalogItem{}, fmt.Errorf("sku %q already exists for this brand", sku)
	}

	id := nextID("pcat")
	var item PartnerCatalogItem
	if err := s.pool.QueryRow(ctx, `
		insert into partner_product_catalog (
			id, brand_id, name, description, hsn_code, sku, default_mrp, default_discount_percentage, status
		)
		values ($1, $2, $3, nullif($4, ''), nullif($5, ''), $6, $7, $8, $9)
		returning id, brand_id, name, coalesce(description, ''), coalesce(hsn_code, ''), sku,
		          default_mrp, default_discount_percentage::float8, status,
		          to_char(updated_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
	`, id, brandID, name, description, hsnCode, sku, defaultMRP, defaultDiscountPercentage, status).Scan(
		&item.ID,
		&item.BrandID,
		&item.Name,
		&item.Description,
		&item.HSNCode,
		&item.SKU,
		&item.DefaultMRP,
		&item.DefaultDiscountPercentage,
		&item.Status,
		&item.UpdatedAt,
	); err != nil {
		return PartnerCatalogItem{}, err
	}
	return item, nil
}

func (s *Store) UpdatePartnerBrandItem(firmID, brandID, itemID string, patch UpdatePartnerBrandItemInput) (PartnerCatalogItem, error) {
	ctx := context.Background()
	var current PartnerCatalogItem
	err := s.pool.QueryRow(ctx, `
		select c.id, c.brand_id, c.name, coalesce(c.description, ''), coalesce(c.hsn_code, ''), c.sku,
		       coalesce(c.default_mrp, 0), coalesce(c.default_discount_percentage, 0)::float8, c.status,
		       to_char(c.updated_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
		from partner_product_catalog c
		join partner_firm_brands fb on fb.brand_id = c.brand_id and fb.firm_id = $1::bigint
		where c.id = $2 and c.brand_id = $3::bigint
	`, firmID, itemID, brandID).Scan(
		&current.ID,
		&current.BrandID,
		&current.Name,
		&current.Description,
		&current.HSNCode,
		&current.SKU,
		&current.DefaultMRP,
		&current.DefaultDiscountPercentage,
		&current.Status,
		&current.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return PartnerCatalogItem{}, fmt.Errorf("item not found")
		}
		return PartnerCatalogItem{}, err
	}

	if patch.Name != nil {
		current.Name = strings.TrimSpace(*patch.Name)
	}
	if patch.Description != nil {
		current.Description = strings.TrimSpace(*patch.Description)
	}
	if patch.SKU != nil {
		return PartnerCatalogItem{}, fmt.Errorf("SKU cannot be changed. Create a new item for a different SKU.")
	}
	if patch.HSNCode != nil {
		current.HSNCode = strings.TrimSpace(*patch.HSNCode)
	}
	if patch.DefaultMRP != nil {
		current.DefaultMRP = *patch.DefaultMRP
	}
	if patch.DefaultDiscountPercentage != nil {
		current.DefaultDiscountPercentage = *patch.DefaultDiscountPercentage
	}
	if patch.Status != nil {
		status := strings.ToUpper(strings.TrimSpace(*patch.Status))
		if status != "ACTIVE" && status != "INACTIVE" {
			return PartnerCatalogItem{}, fmt.Errorf("status must be ACTIVE or INACTIVE")
		}
		current.Status = status
	}
	if current.HSNCode != "" && !regexp.MustCompile(`^\d+$`).MatchString(current.HSNCode) {
		return PartnerCatalogItem{}, fmt.Errorf("hsnCode must contain digits only")
	}
	if current.DefaultMRP <= 0 {
		return PartnerCatalogItem{}, fmt.Errorf("defaultMrp must be greater than zero")
	}
	if current.DefaultDiscountPercentage < 0 || current.DefaultDiscountPercentage > 100 {
		return PartnerCatalogItem{}, fmt.Errorf("Default Buy Margin must be between 0 and 100")
	}

	if _, err := s.pool.Exec(ctx, `
		update partner_product_catalog
		set name = $2,
		    description = nullif($3, ''),
		    hsn_code = nullif($4, ''),
		    default_mrp = $5,
		    default_discount_percentage = $6,
		    status = $7,
		    updated_at = now()
		where id = $1
	`, itemID, current.Name, current.Description, current.HSNCode, current.DefaultMRP, current.DefaultDiscountPercentage, current.Status); err != nil {
		return PartnerCatalogItem{}, err
	}

	items, err := s.GetPartnerBrandItems(firmID, brandID)
	if err != nil {
		return PartnerCatalogItem{}, err
	}
	for _, item := range items {
		if item.ID == itemID {
			return item, nil
		}
	}
	return PartnerCatalogItem{}, fmt.Errorf("item not found")
}

func (s *Store) GetPartnerClients(firmID, query string) ([]PartnerClient, error) {
	ctx := context.Background()
	search := strings.TrimSpace(query)

	rows, err := s.pool.Query(ctx, `
		select
			b.id,
			b.firm_id,
			b.business_name,
			coalesce(c.phone, ''),
			coalesce(b.gstin, ''),
			coalesce(o.address, b.billing_address, ''),
			coalesce(o.status, 'INACTIVE')
		from partner_client_businesses b
		left join partner_client_contacts c
		  on c.firm_id = b.firm_id
		 and c.client_business_id = b.id
		 and c.is_primary = true
		left join partner_client_outlets o
		  on o.firm_id = b.firm_id
		 and o.client_business_id = b.id
		 and o.is_primary = true
		where b.firm_id = $1::bigint
		  and (
			$2 = ''
			or lower(b.business_name) like lower('%' || $2 || '%')
			or coalesce(c.phone, '') like ('%' || $2 || '%')
		  )
		order by b.business_name asc
	`, firmID, search)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []PartnerClient
	for rows.Next() {
		var item PartnerClient
		if err := rows.Scan(
			&item.ID,
			&item.FirmID,
			&item.Name,
			&item.Phone,
			&item.GSTIN,
			&item.Address,
			&item.Status,
		); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return ensurePartnerClients(items), nil
}

func (s *Store) GetPartnerClientBusinesses(firmID, query string) ([]PartnerClientBusiness, error) {
	ctx := context.Background()
	search := strings.TrimSpace(query)

	rows, err := s.pool.Query(ctx, `
		select
			id,
			firm_id,
			business_name,
			coalesce(gstin, ''),
			coalesce(billing_name, ''),
			coalesce(billing_address, '')
		from partner_client_businesses
		where firm_id = $1::bigint
		order by business_name asc
	`, firmID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var businesses []PartnerClientBusiness
	indexByID := make(map[string]int)
	for rows.Next() {
		var item PartnerClientBusiness
		if err := rows.Scan(
			&item.ID,
			&item.FirmID,
			&item.BusinessName,
			&item.GSTIN,
			&item.BillingName,
			&item.BillingAddress,
		); err != nil {
			return nil, err
		}
		item.Contacts = []PartnerClientContact{}
		item.Outlets = []PartnerClientOutlet{}
		businesses = append(businesses, item)
		indexByID[item.ID] = len(businesses) - 1
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	if len(businesses) == 0 {
		return []PartnerClientBusiness{}, nil
	}

	businessContactRows, err := s.pool.Query(ctx, `
		select id, firm_id, client_business_id, name, phone, is_primary, sort_order
		from partner_client_contacts
		where firm_id = $1::bigint
		order by client_business_id asc, is_primary desc, sort_order asc, created_at asc
	`, firmID)
	if err != nil {
		return nil, err
	}
	defer businessContactRows.Close()

	for businessContactRows.Next() {
		var contact PartnerClientContact
		if err := businessContactRows.Scan(
			&contact.ID,
			&contact.FirmID,
			&contact.ClientBusinessID,
			&contact.Name,
			&contact.Phone,
			&contact.IsPrimary,
			&contact.SortOrder,
		); err != nil {
			return nil, err
		}
		idx, ok := indexByID[contact.ClientBusinessID]
		if !ok {
			continue
		}
		businesses[idx].Contacts = append(businesses[idx].Contacts, contact)
	}
	if err := businessContactRows.Err(); err != nil {
		return nil, err
	}

	outletRows, err := s.pool.Query(ctx, `
		select
			id,
			firm_id,
			client_business_id,
			outlet_name,
			coalesce(address, ''),
			is_primary,
			status
		from partner_client_outlets
		where firm_id = $1::bigint
		order by client_business_id asc, is_primary desc, outlet_name asc
	`, firmID)
	if err != nil {
		return nil, err
	}
	defer outletRows.Close()

	for outletRows.Next() {
		var outlet PartnerClientOutlet
		if err := outletRows.Scan(
			&outlet.ID,
			&outlet.FirmID,
			&outlet.ClientBusinessID,
			&outlet.OutletName,
			&outlet.Address,
			&outlet.IsPrimary,
			&outlet.Status,
		); err != nil {
			return nil, err
		}
		outlet.Contacts = []PartnerOutletContact{}
		idx, ok := indexByID[outlet.ClientBusinessID]
		if !ok {
			continue
		}
		if search != "" {
			searchLower := strings.ToLower(search)
			if !strings.Contains(strings.ToLower(businesses[idx].BusinessName), searchLower) &&
				!strings.Contains(strings.ToLower(outlet.OutletName), searchLower) &&
				!strings.Contains(strings.ToLower(outlet.Address), searchLower) {
				continue
			}
		}
		businesses[idx].Outlets = append(businesses[idx].Outlets, outlet)
	}
	if err := outletRows.Err(); err != nil {
		return nil, err
	}

	outletIndexByID := make(map[string][2]int)
	for businessIndex, business := range businesses {
		for outletIndex, outlet := range business.Outlets {
			outletIndexByID[outlet.ID] = [2]int{businessIndex, outletIndex}
		}
	}

	outletContactRows, err := s.pool.Query(ctx, `
		select id, firm_id, outlet_id, name, phone, is_primary, sort_order
		from partner_client_outlet_contacts
		where firm_id = $1::bigint
		order by outlet_id asc, is_primary desc, sort_order asc, created_at asc
	`, firmID)
	if err != nil {
		return nil, err
	}
	defer outletContactRows.Close()

	for outletContactRows.Next() {
		var contact PartnerOutletContact
		if err := outletContactRows.Scan(
			&contact.ID,
			&contact.FirmID,
			&contact.OutletID,
			&contact.Name,
			&contact.Phone,
			&contact.IsPrimary,
			&contact.SortOrder,
		); err != nil {
			return nil, err
		}
		indexes, ok := outletIndexByID[contact.OutletID]
		if !ok {
			continue
		}
		businesses[indexes[0]].Outlets[indexes[1]].Contacts = append(businesses[indexes[0]].Outlets[indexes[1]].Contacts, contact)
	}
	if err := outletContactRows.Err(); err != nil {
		return nil, err
	}

	filtered := make([]PartnerClientBusiness, 0, len(businesses))
	for _, business := range businesses {
		business.OutletCount = len(business.Outlets)
		if search != "" && !matchesPartnerClientBusinessSearch(business, search) {
			continue
		}
		filtered = append(filtered, business)
	}
	if filtered == nil {
		return []PartnerClientBusiness{}, nil
	}
	return filtered, nil
}

func normalizeGSTIN(value string) string {
	return strings.ToUpper(strings.TrimSpace(value))
}

var gstinPattern = regexp.MustCompile(`^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][A-Z0-9]Z[A-Z0-9]$`)

func validGSTIN(value string) bool {
	normalized := normalizeGSTIN(value)
	return normalized != "" && gstinPattern.MatchString(normalized)
}

func matchesPartnerClientBusinessSearch(business PartnerClientBusiness, search string) bool {
	search = strings.TrimSpace(search)
	if search == "" {
		return true
	}
	searchLower := strings.ToLower(search)
	if strings.Contains(strings.ToLower(business.BusinessName), searchLower) ||
		strings.Contains(strings.ToLower(business.BillingAddress), searchLower) ||
		strings.Contains(strings.ToLower(business.GSTIN), searchLower) {
		return true
	}
	for _, contact := range business.Contacts {
		if strings.Contains(strings.ToLower(contact.Name), searchLower) || strings.Contains(contact.Phone, search) {
			return true
		}
	}
	for _, outlet := range business.Outlets {
		if strings.Contains(strings.ToLower(outlet.OutletName), searchLower) ||
			strings.Contains(strings.ToLower(outlet.Address), searchLower) {
			return true
		}
		for _, contact := range outlet.Contacts {
			if strings.Contains(strings.ToLower(contact.Name), searchLower) || strings.Contains(contact.Phone, search) {
				return true
			}
		}
	}
	return false
}

func normalizePartnerContactInputs(inputs []PartnerClientContactInput) ([]PartnerClientContactInput, error) {
	contacts := make([]PartnerClientContactInput, 0, len(inputs))
	for _, input := range inputs {
		name := strings.TrimSpace(input.Name)
		phone := strings.TrimSpace(input.Phone)
		if name == "" && phone == "" {
			continue
		}
		if name == "" || phone == "" {
			return nil, fmt.Errorf("each contact must include name and phone")
		}
		contacts = append(contacts, PartnerClientContactInput{Name: name, Phone: phone})
	}
	if len(contacts) == 0 {
		return nil, fmt.Errorf("at least one contact is required")
	}
	return contacts, nil
}

func normalizePartnerOutletContactInputs(inputs []PartnerClientContactInput, fallbackName, fallbackPhone string) ([]PartnerClientContactInput, error) {
	contacts, err := normalizePartnerContactInputs(inputs)
	if err == nil {
		return contacts, nil
	}
	name := strings.TrimSpace(fallbackName)
	phone := strings.TrimSpace(fallbackPhone)
	if name != "" && phone != "" {
		return []PartnerClientContactInput{{Name: name, Phone: phone}}, nil
	}
	return nil, err
}

func validPartnerClientStatus(value string) bool {
	switch strings.TrimSpace(value) {
	case "ACTIVE", "INACTIVE":
		return true
	default:
		return false
	}
}

func canTransitionPartnerOrderStatus(current, next string) bool {
	if strings.TrimSpace(current) == strings.TrimSpace(next) {
		return true
	}
	switch strings.TrimSpace(current) {
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

func canEditPartnerOrder(order PartnerOrder) bool {
	return order.Status == "DRAFT" || order.Status == "PLACED" || order.Status == "CONFIRMED" || order.Status == "PACKED"
}

func validPartnerOrderSource(value string) bool {
	switch strings.ToUpper(strings.TrimSpace(value)) {
	case "MANUAL", "WHATSAPP", "PHONE", "EMAIL", "SALES_REP", "OTHER":
		return true
	default:
		return false
	}
}

func resolveSellerMarginPercentage(value *float64, fallback float64) (float64, error) {
	if value == nil {
		return fallback, nil
	}
	if *value < 0 || *value > 100 {
		return 0, fmt.Errorf("sellerMarginPercentage must be between 0 and 100")
	}
	return *value, nil
}

func validPartnerSupplierStatus(value string) bool {
	switch strings.TrimSpace(value) {
	case "ACTIVE", "INACTIVE":
		return true
	default:
		return false
	}
}

func (s *Store) ValidatePartnerBusinessGSTIN(firmID, gstin, excludeBusinessID string) (PartnerGSTINValidation, error) {
	ctx := context.Background()
	normalized := normalizeGSTIN(gstin)
	if normalized == "" {
		return PartnerGSTINValidation{Exists: false}, nil
	}
	var result PartnerGSTINValidation
	err := s.pool.QueryRow(ctx, `
		select id, business_name
		from partner_client_businesses
		where firm_id = $1::bigint
		  and upper(trim(coalesce(gstin, ''))) = $2
		  and ($3 = '' or id <> $3)
		limit 1
	`, firmID, normalized, strings.TrimSpace(excludeBusinessID)).Scan(&result.BusinessID, &result.BusinessName)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return PartnerGSTINValidation{Exists: false}, nil
		}
		return PartnerGSTINValidation{}, err
	}
	result.Exists = true
	return result, nil
}

func (s *Store) CreatePartnerClientBusiness(firmID string, input CreatePartnerClientBusinessInput) (PartnerClientBusiness, error) {
	ctx := context.Background()
	businessName := strings.TrimSpace(input.BusinessName)
	if businessName == "" {
		return PartnerClientBusiness{}, fmt.Errorf("businessName is required")
	}
	contacts, err := normalizePartnerContactInputs(input.Contacts)
	if err != nil {
		return PartnerClientBusiness{}, err
	}
	validation, err := s.ValidatePartnerBusinessGSTIN(firmID, input.GSTIN, "")
	if err != nil {
		return PartnerClientBusiness{}, err
	}
	if validation.Exists {
		return PartnerClientBusiness{}, fmt.Errorf("this GSTIN already exists under business %s. You can add a new outlet under it instead", validation.BusinessName)
	}
	if strings.TrimSpace(input.GSTIN) != "" && !validGSTIN(input.GSTIN) {
		return PartnerClientBusiness{}, fmt.Errorf("gstin must be a valid 15-character GSTIN")
	}
	businessID := nextID("pbiz")
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return PartnerClientBusiness{}, err
	}
	defer tx.Rollback(ctx)
	if _, err := tx.Exec(ctx, `
		insert into partner_client_businesses (
			id, firm_id, business_name, gstin, billing_name, billing_address
		) values ($1, $2, $3, nullif($4, ''), $5, nullif($6, ''))
	`, businessID, firmID, businessName, normalizeGSTIN(input.GSTIN), businessName, strings.TrimSpace(input.BillingAddress)); err != nil {
		return PartnerClientBusiness{}, err
	}
	for index, contact := range contacts {
		if _, err := tx.Exec(ctx, `
			insert into partner_client_contacts (
				id, firm_id, client_business_id, name, phone, is_primary, sort_order
			) values ($1, $2, $3, $4, $5, $6, $7)
		`, nextID("pbc"), firmID, businessID, contact.Name, contact.Phone, index == 0, index); err != nil {
			return PartnerClientBusiness{}, err
		}
	}
	if err := tx.Commit(ctx); err != nil {
		return PartnerClientBusiness{}, err
	}

	items, err := s.GetPartnerClientBusinesses(firmID, "")
	if err != nil {
		return PartnerClientBusiness{}, err
	}
	for _, item := range items {
		if item.ID == businessID {
			return item, nil
		}
	}
	return PartnerClientBusiness{}, fmt.Errorf("client not found")
}

func (s *Store) UpdatePartnerClientBusiness(firmID, businessID string, input UpdatePartnerClientBusinessInput) (PartnerClientBusiness, error) {
	ctx := context.Background()
	if strings.TrimSpace(input.BusinessName) == "" {
		return PartnerClientBusiness{}, fmt.Errorf("businessName is required")
	}
	contacts, err := normalizePartnerContactInputs(input.Contacts)
	if err != nil {
		return PartnerClientBusiness{}, err
	}
	validation, err := s.ValidatePartnerBusinessGSTIN(firmID, input.GSTIN, businessID)
	if err != nil {
		return PartnerClientBusiness{}, err
	}
	if validation.Exists {
		return PartnerClientBusiness{}, fmt.Errorf("this GSTIN already exists under business %s. You can add a new outlet under it instead", validation.BusinessName)
	}
	if strings.TrimSpace(input.GSTIN) != "" && !validGSTIN(input.GSTIN) {
		return PartnerClientBusiness{}, fmt.Errorf("gstin must be a valid 15-character GSTIN")
	}
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return PartnerClientBusiness{}, err
	}
	defer tx.Rollback(ctx)
	if _, err := tx.Exec(ctx, `
		update partner_client_businesses
		set business_name = $3,
		    gstin = nullif($4, ''),
		    billing_address = nullif($5, ''),
		    updated_at = now()
		where firm_id = $1::bigint and id = $2
	`, firmID, businessID, strings.TrimSpace(input.BusinessName), normalizeGSTIN(input.GSTIN), strings.TrimSpace(input.BillingAddress)); err != nil {
		return PartnerClientBusiness{}, err
	}
	if _, err := tx.Exec(ctx, `
		delete from partner_client_contacts
		where firm_id = $1::bigint and client_business_id = $2
	`, firmID, businessID); err != nil {
		return PartnerClientBusiness{}, err
	}
	for index, contact := range contacts {
		if _, err := tx.Exec(ctx, `
			insert into partner_client_contacts (
				id, firm_id, client_business_id, name, phone, is_primary, sort_order
			) values ($1, $2, $3, $4, $5, $6, $7)
		`, nextID("pbc"), firmID, businessID, contact.Name, contact.Phone, index == 0, index); err != nil {
			return PartnerClientBusiness{}, err
		}
	}
	if err := tx.Commit(ctx); err != nil {
		return PartnerClientBusiness{}, err
	}
	items, err := s.GetPartnerClientBusinesses(firmID, "")
	if err != nil {
		return PartnerClientBusiness{}, err
	}
	for _, item := range items {
		if item.ID == businessID {
			return item, nil
		}
	}
	return PartnerClientBusiness{}, fmt.Errorf("client not found")
}

func (s *Store) ArchivePartnerClientBusiness(firmID, businessID string) (PartnerClientBusiness, error) {
	ctx := context.Background()
	result, err := s.pool.Exec(ctx, `
		update partner_client_outlets
		set status = 'INACTIVE', updated_at = now()
		where firm_id = $1::bigint and client_business_id = $2
	`, firmID, businessID)
	if err != nil {
		return PartnerClientBusiness{}, err
	}
	if result.RowsAffected() == 0 {
		var exists bool
		if err := s.pool.QueryRow(ctx, `
			select exists(
				select 1
				from partner_client_businesses
				where firm_id = $1::bigint and id = $2
			)
		`, firmID, businessID).Scan(&exists); err != nil {
			return PartnerClientBusiness{}, err
		}
		if !exists {
			return PartnerClientBusiness{}, fmt.Errorf("client not found")
		}
	}
	items, err := s.GetPartnerClientBusinesses(firmID, "")
	if err != nil {
		return PartnerClientBusiness{}, err
	}
	for _, item := range items {
		if item.ID == businessID {
			return item, nil
		}
	}
	return PartnerClientBusiness{}, fmt.Errorf("client not found")
}

func (s *Store) AddPartnerClientOutlet(firmID, businessID string, input CreatePartnerClientOutletInput) (PartnerClientBusiness, error) {
	ctx := context.Background()
	outletName := strings.TrimSpace(input.OutletName)
	if outletName == "" {
		return PartnerClientBusiness{}, fmt.Errorf("outletName is required")
	}
	contacts, err := normalizePartnerContactInputs(input.Contacts)
	if err != nil {
		return PartnerClientBusiness{}, err
	}
	outletID := nextID("pout")
	if _, err := s.pool.Exec(ctx, `
		insert into partner_client_outlets (
			id, firm_id, client_business_id, outlet_name, address, is_primary, status
		) values ($1, $2, $3, $4, nullif($5, ''), false, 'ACTIVE')
	`, outletID, firmID, businessID, outletName, strings.TrimSpace(input.Address)); err != nil {
		return PartnerClientBusiness{}, err
	}
	for index, contact := range contacts {
		if _, err := s.pool.Exec(ctx, `
			insert into partner_client_outlet_contacts (
				id, firm_id, outlet_id, name, phone, is_primary, sort_order
			) values ($1, $2, $3, $4, $5, $6, $7)
		`, nextID("poc"), firmID, outletID, contact.Name, contact.Phone, index == 0, index); err != nil {
			return PartnerClientBusiness{}, err
		}
	}
	items, err := s.GetPartnerClientBusinesses(firmID, "")
	if err != nil {
		return PartnerClientBusiness{}, err
	}
	for _, item := range items {
		if item.ID == businessID {
			return item, nil
		}
	}
	return PartnerClientBusiness{}, fmt.Errorf("client not found")
}

func (s *Store) UpdatePartnerClientOutlet(firmID, businessID, outletID string, input UpdatePartnerClientOutletInput) (PartnerClientBusiness, error) {
	ctx := context.Background()
	if strings.TrimSpace(input.OutletName) == "" {
		return PartnerClientBusiness{}, fmt.Errorf("outletName is required")
	}
	contacts, err := normalizePartnerContactInputs(input.Contacts)
	if err != nil {
		return PartnerClientBusiness{}, err
	}
	if !validPartnerClientStatus(input.Status) {
		return PartnerClientBusiness{}, fmt.Errorf("status must be ACTIVE or INACTIVE")
	}
	if _, err := s.pool.Exec(ctx, `
		update partner_client_outlets
		set outlet_name = $4,
		    address = nullif($5, ''),
		    status = $6,
		    updated_at = now()
		where firm_id = $1::bigint and client_business_id = $2 and id = $3
	`, firmID, businessID, outletID, strings.TrimSpace(input.OutletName), strings.TrimSpace(input.Address), strings.TrimSpace(input.Status)); err != nil {
		return PartnerClientBusiness{}, err
	}
	if _, err := s.pool.Exec(ctx, `
		delete from partner_client_outlet_contacts
		where firm_id = $1::bigint and outlet_id = $2
	`, firmID, outletID); err != nil {
		return PartnerClientBusiness{}, err
	}
	for index, contact := range contacts {
		if _, err := s.pool.Exec(ctx, `
			insert into partner_client_outlet_contacts (
				id, firm_id, outlet_id, name, phone, is_primary, sort_order
			) values ($1, $2, $3, $4, $5, $6, $7)
		`, nextID("poc"), firmID, outletID, contact.Name, contact.Phone, index == 0, index); err != nil {
			return PartnerClientBusiness{}, err
		}
	}
	items, err := s.GetPartnerClientBusinesses(firmID, "")
	if err != nil {
		return PartnerClientBusiness{}, err
	}
	for _, item := range items {
		if item.ID == businessID {
			return item, nil
		}
	}
	return PartnerClientBusiness{}, fmt.Errorf("client not found")
}

func (s *Store) ArchivePartnerClientOutlet(firmID, businessID, outletID string) (PartnerClientBusiness, error) {
	ctx := context.Background()
	var current UpdatePartnerClientOutletInput
	if err := s.pool.QueryRow(ctx, `
		select outlet_name, coalesce(address, '')
		from partner_client_outlets
		where firm_id = $1::bigint and client_business_id = $2 and id = $3
	`, firmID, businessID, outletID).Scan(&current.OutletName, &current.Address); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return PartnerClientBusiness{}, fmt.Errorf("client outlet not found")
		}
		return PartnerClientBusiness{}, err
	}
	rows, err := s.pool.Query(ctx, `
		select name, phone
		from partner_client_outlet_contacts
		where firm_id = $1::bigint and outlet_id = $2
		order by is_primary desc, sort_order asc, created_at asc
	`, firmID, outletID)
	if err != nil {
		return PartnerClientBusiness{}, err
	}
	defer rows.Close()
	for rows.Next() {
		var contact PartnerClientContactInput
		if err := rows.Scan(&contact.Name, &contact.Phone); err != nil {
			return PartnerClientBusiness{}, err
		}
		current.Contacts = append(current.Contacts, contact)
	}
	if err := rows.Err(); err != nil {
		return PartnerClientBusiness{}, err
	}
	current.Status = "INACTIVE"
	return s.UpdatePartnerClientOutlet(firmID, businessID, outletID, current)
}

func (s *Store) GetPartnerSuppliers(firmID, query string) ([]PartnerSupplier, error) {
	ctx := context.Background()
	search := strings.TrimSpace(query)
	rows, err := s.pool.Query(ctx, `
		select id, firm_id, supplier_name, coalesce(gstin, ''), coalesce(phone, ''), coalesce(address, ''), status,
		       to_char(created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
		       to_char(updated_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
		from partner_suppliers
		where firm_id = $1::bigint
		  and ($2 = '' or lower(supplier_name) like lower('%' || $2 || '%') or coalesce(phone, '') like ('%' || $2 || '%'))
		order by supplier_name asc
	`, firmID, search)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []PartnerSupplier
	for rows.Next() {
		var item PartnerSupplier
		if err := rows.Scan(&item.ID, &item.FirmID, &item.SupplierName, &item.GSTIN, &item.Phone, &item.Address, &item.Status, &item.CreatedAt, &item.UpdatedAt); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	if items == nil {
		return []PartnerSupplier{}, nil
	}
	return items, rows.Err()
}

func (s *Store) ValidatePartnerSupplierGSTIN(firmID, gstin, excludeSupplierID string) (PartnerSupplierGSTINValidation, error) {
	ctx := context.Background()
	normalized := normalizeGSTIN(gstin)
	if normalized == "" {
		return PartnerSupplierGSTINValidation{Exists: false}, nil
	}
	var result PartnerSupplierGSTINValidation
	err := s.pool.QueryRow(ctx, `
		select id, supplier_name
		from partner_suppliers
		where firm_id = $1::bigint
		  and upper(trim(coalesce(gstin, ''))) = $2
		  and ($3 = '' or id <> $3)
		limit 1
	`, firmID, normalized, strings.TrimSpace(excludeSupplierID)).Scan(&result.SupplierID, &result.SupplierName)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return PartnerSupplierGSTINValidation{Exists: false}, nil
		}
		return PartnerSupplierGSTINValidation{}, err
	}
	result.Exists = true
	return result, nil
}

func (s *Store) CreatePartnerSupplier(firmID string, input CreatePartnerSupplierInput) (PartnerSupplier, error) {
	ctx := context.Background()
	name := strings.TrimSpace(input.SupplierName)
	if name == "" {
		return PartnerSupplier{}, fmt.Errorf("supplierName is required")
	}
	validation, err := s.ValidatePartnerSupplierGSTIN(firmID, input.GSTIN, "")
	if err != nil {
		return PartnerSupplier{}, err
	}
	if validation.Exists {
		return PartnerSupplier{}, fmt.Errorf("this GSTIN already exists under supplier %s", validation.SupplierName)
	}
	if strings.TrimSpace(input.GSTIN) != "" && !validGSTIN(input.GSTIN) {
		return PartnerSupplier{}, fmt.Errorf("gstin must be a valid 15-character GSTIN")
	}
	id := nextID("psup")
	if _, err := s.pool.Exec(ctx, `
		insert into partner_suppliers (id, firm_id, supplier_name, gstin, phone, address, status)
		values ($1, $2, $3, nullif($4, ''), nullif($5, ''), nullif($6, ''), 'ACTIVE')
	`, id, firmID, name, normalizeGSTIN(input.GSTIN), strings.TrimSpace(input.Phone), strings.TrimSpace(input.Address)); err != nil {
		return PartnerSupplier{}, err
	}
	items, err := s.GetPartnerSuppliers(firmID, "")
	if err != nil {
		return PartnerSupplier{}, err
	}
	for _, item := range items {
		if item.ID == id {
			return item, nil
		}
	}
	return PartnerSupplier{}, fmt.Errorf("supplier not found")
}

func (s *Store) UpdatePartnerSupplier(firmID, supplierID string, input UpdatePartnerSupplierInput) (PartnerSupplier, error) {
	ctx := context.Background()
	name := strings.TrimSpace(input.SupplierName)
	if name == "" {
		return PartnerSupplier{}, fmt.Errorf("supplierName is required")
	}
	if !validPartnerSupplierStatus(input.Status) {
		return PartnerSupplier{}, fmt.Errorf("status must be ACTIVE or INACTIVE")
	}
	validation, err := s.ValidatePartnerSupplierGSTIN(firmID, input.GSTIN, supplierID)
	if err != nil {
		return PartnerSupplier{}, err
	}
	if validation.Exists {
		return PartnerSupplier{}, fmt.Errorf("this GSTIN already exists under supplier %s", validation.SupplierName)
	}
	if strings.TrimSpace(input.GSTIN) != "" && !validGSTIN(input.GSTIN) {
		return PartnerSupplier{}, fmt.Errorf("gstin must be a valid 15-character GSTIN")
	}
	if _, err := s.pool.Exec(ctx, `
		update partner_suppliers
		set supplier_name = $3,
		    gstin = nullif($4, ''),
		    phone = nullif($5, ''),
		    address = nullif($6, ''),
		    status = $7,
		    updated_at = now()
		where firm_id = $1::bigint and id = $2
	`, firmID, supplierID, name, normalizeGSTIN(input.GSTIN), strings.TrimSpace(input.Phone), strings.TrimSpace(input.Address), input.Status); err != nil {
		return PartnerSupplier{}, err
	}
	items, err := s.GetPartnerSuppliers(firmID, "")
	if err != nil {
		return PartnerSupplier{}, err
	}
	for _, item := range items {
		if item.ID == supplierID {
			return item, nil
		}
	}
	return PartnerSupplier{}, fmt.Errorf("supplier not found")
}

func (s *Store) ArchivePartnerSupplier(firmID, supplierID string) (PartnerSupplier, error) {
	ctx := context.Background()
	var current UpdatePartnerSupplierInput
	if err := s.pool.QueryRow(ctx, `
		select supplier_name, coalesce(gstin, ''), coalesce(phone, ''), coalesce(address, '')
		from partner_suppliers
		where firm_id = $1::bigint and id = $2
	`, firmID, supplierID).Scan(&current.SupplierName, &current.GSTIN, &current.Phone, &current.Address); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return PartnerSupplier{}, fmt.Errorf("supplier not found")
		}
		return PartnerSupplier{}, err
	}
	current.Status = "INACTIVE"
	return s.UpdatePartnerSupplier(firmID, supplierID, current)
}

func partnerPayableStatus(finalTotal, paidAmount float64, dueDate string) string {
	outstanding := math.Max(roundCurrency(finalTotal-paidAmount), 0)
	if outstanding <= 0 {
		return "PAID"
	}
	if strings.TrimSpace(dueDate) != "" {
		if parsed, err := time.Parse("2006-01-02", strings.TrimSpace(dueDate)); err == nil {
			today := time.Now().UTC().Truncate(24 * time.Hour)
			if parsed.Before(today) {
				return "OVERDUE"
			}
		}
	}
	if paidAmount > 0 {
		return "PARTIALLY_PAID"
	}
	return "UNPAID"
}

func (s *Store) GetPartnerSupplierInvoices(firmID string, filters GetPartnerSupplierInvoicesInput) ([]PartnerSupplierInvoice, error) {
	ctx := context.Background()
	rows, err := s.pool.Query(ctx, `
		with paid as (
			select firm_id, supplier_invoice_id, coalesce(sum(amount), 0)::float8 as paid_amount
			from partner_supplier_payment_allocations
			where firm_id = $1::bigint
			group by firm_id, supplier_invoice_id
		)
		select
			i.id, i.firm_id, i.supplier_id, s.supplier_name,
			coalesce(i.purchase_id, ''), coalesce(p.purchase_number, ''),
			coalesce(i.grn_id, ''), coalesce(g.grn_number, ''),
			i.invoice_number, coalesce(i.invoice_date::text, ''), coalesce(i.due_date::text, ''),
			i.taxable_amount::float8, i.gst_amount::float8,
			coalesce(nullif(i.final_total_amount, 0), i.total_amount)::float8,
			coalesce(paid.paid_amount, 0)::float8,
			i.status, i.payable_status,
			to_char(i.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
			coalesce(cu.name, ''),
			coalesce(to_char(i.finalized_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), ''),
			coalesce(fu.name, ''),
			coalesce(to_char(i.cancelled_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), ''),
			coalesce(canu.name, '')
		from partner_supplier_invoices i
		join partner_suppliers s on s.firm_id = i.firm_id and s.id = i.supplier_id
		left join partner_purchases p on p.firm_id = i.firm_id and p.id = i.purchase_id
		left join partner_goods_receipts g on g.firm_id = i.firm_id and g.id = i.grn_id
		left join paid on paid.firm_id = i.firm_id and paid.supplier_invoice_id = i.id
		left join users cu on cu.id = i.created_by
		left join users fu on fu.id = i.finalized_by
		left join users canu on canu.id = i.cancelled_by
		where i.firm_id = $1::bigint
		  and ($2 = '' or i.supplier_id = $2)
		  and ($3 = '' or i.invoice_date >= $3::date)
		  and ($4 = '' or i.invoice_date <= $4::date)
		  and ($5 = '' or s.supplier_name ilike '%' || $5 || '%' or i.invoice_number ilike '%' || $5 || '%' or coalesce(p.purchase_number, '') ilike '%' || $5 || '%')
		order by i.invoice_date desc, i.created_at desc
	`, firmID, strings.TrimSpace(filters.SupplierID), strings.TrimSpace(filters.FromDate), strings.TrimSpace(filters.ToDate), strings.TrimSpace(filters.Search))
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := []PartnerSupplierInvoice{}
	statusFilter := strings.ToUpper(strings.TrimSpace(filters.Status))
	for rows.Next() {
		var item PartnerSupplierInvoice
		if err := rows.Scan(
			&item.ID, &item.FirmID, &item.SupplierID, &item.SupplierName,
			&item.PurchaseID, &item.PurchaseNumber, &item.GRNID, &item.GRNNumber,
			&item.InvoiceNumber, &item.InvoiceDate, &item.DueDate,
			&item.TaxableAmount, &item.GSTAmount, &item.FinalTotalAmount,
			&item.PaidAmount, &item.Status, &item.PayableStatus,
			&item.CreatedAt, &item.CreatedByName, &item.FinalizedAt, &item.FinalizedByName,
			&item.CancelledAt, &item.CancelledByName,
		); err != nil {
			return nil, err
		}
		item.OutstandingAmount = math.Max(roundCurrency(item.FinalTotalAmount-item.PaidAmount), 0)
		if item.Status == "FINALIZED" {
			item.PayableStatus = partnerPayableStatus(item.FinalTotalAmount, item.PaidAmount, item.DueDate)
		}
		if statusFilter != "" && statusFilter != "ALL" && item.PayableStatus != statusFilter && item.Status != statusFilter {
			continue
		}
		if filters.OverdueOnly && item.PayableStatus != "OVERDUE" {
			continue
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (s *Store) GetPartnerSupplierInvoiceByID(firmID, invoiceID string) (PartnerSupplierInvoice, error) {
	items, err := s.GetPartnerSupplierInvoices(firmID, GetPartnerSupplierInvoicesInput{})
	if err != nil {
		return PartnerSupplierInvoice{}, err
	}
	for _, item := range items {
		if item.ID == invoiceID {
			return item, nil
		}
	}
	return PartnerSupplierInvoice{}, fmt.Errorf("supplier invoice not found")
}

func (s *Store) GetPartnerPayablesSummary(firmID string, filters GetPartnerSupplierInvoicesInput) (PartnerPayablesSummary, error) {
	invoices, err := s.GetPartnerSupplierInvoices(firmID, filters)
	if err != nil {
		return PartnerPayablesSummary{}, err
	}
	out := PartnerPayablesSummary{Invoices: invoices}
	today := time.Now().UTC().Format("2006-01-02")
	for _, invoice := range invoices {
		if invoice.Status != "FINALIZED" {
			continue
		}
		out.TotalPayables = roundCurrency(out.TotalPayables + invoice.OutstandingAmount)
		if invoice.PayableStatus == "OVERDUE" {
			out.OverduePayables = roundCurrency(out.OverduePayables + invoice.OutstandingAmount)
		}
		if invoice.DueDate == today && invoice.OutstandingAmount > 0 {
			out.InvoicesDueToday++
		}
	}
	return out, nil
}

func (s *Store) CreatePartnerSupplierInvoice(firmID string, input CreatePartnerSupplierInvoiceInput) (PartnerSupplierInvoice, error) {
	ctx := context.Background()
	supplierID := strings.TrimSpace(input.SupplierID)
	invoiceNumber := strings.TrimSpace(input.InvoiceNumber)
	if supplierID == "" || invoiceNumber == "" || strings.TrimSpace(input.InvoiceDate) == "" {
		return PartnerSupplierInvoice{}, fmt.Errorf("supplier, invoice number, and invoice date are required")
	}
	if input.FinalTotalAmount <= 0 {
		return PartnerSupplierInvoice{}, fmt.Errorf("final total must be greater than zero")
	}
	if input.TaxableAmount < 0 || input.GSTAmount < 0 {
		return PartnerSupplierInvoice{}, fmt.Errorf("taxable and GST amounts cannot be negative")
	}
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return PartnerSupplierInvoice{}, err
	}
	defer tx.Rollback(ctx)
	var supplierName, supplierStatus string
	if err := tx.QueryRow(ctx, `
		select supplier_name, status
		from partner_suppliers
		where firm_id = $1::bigint and id = $2
	`, firmID, supplierID).Scan(&supplierName, &supplierStatus); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return PartnerSupplierInvoice{}, fmt.Errorf("supplier not found")
		}
		return PartnerSupplierInvoice{}, err
	}
	if supplierStatus != "ACTIVE" {
		return PartnerSupplierInvoice{}, fmt.Errorf("supplier must be active")
	}
	purchaseID := strings.TrimSpace(input.PurchaseID)
	grnID := strings.TrimSpace(input.GRNID)
	if purchaseID != "" {
		var purchaseSupplierID string
		if err := tx.QueryRow(ctx, `select supplier_id from partner_purchases where firm_id = $1::bigint and id = $2`, firmID, purchaseID).Scan(&purchaseSupplierID); err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return PartnerSupplierInvoice{}, fmt.Errorf("purchase not found")
			}
			return PartnerSupplierInvoice{}, err
		}
		if purchaseSupplierID != supplierID {
			return PartnerSupplierInvoice{}, fmt.Errorf("purchase belongs to a different supplier")
		}
	}
	if grnID != "" {
		var grnSupplierID, grnPurchaseID string
		if err := tx.QueryRow(ctx, `select supplier_id, purchase_id from partner_goods_receipts where firm_id = $1::bigint and id = $2`, firmID, grnID).Scan(&grnSupplierID, &grnPurchaseID); err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return PartnerSupplierInvoice{}, fmt.Errorf("GRN not found")
			}
			return PartnerSupplierInvoice{}, err
		}
		if grnSupplierID != supplierID {
			return PartnerSupplierInvoice{}, fmt.Errorf("GRN belongs to a different supplier")
		}
		if purchaseID == "" {
			purchaseID = grnPurchaseID
		} else if purchaseID != grnPurchaseID {
			return PartnerSupplierInvoice{}, fmt.Errorf("GRN belongs to a different purchase")
		}
	}
	status := "DRAFT"
	payableStatus := "UNPAID"
	var finalizedAt any
	var finalizedBy any
	if input.Finalize {
		status = "FINALIZED"
		payableStatus = partnerPayableStatus(input.FinalTotalAmount, 0, input.DueDate)
		finalizedAt = time.Now().UTC()
		finalizedBy = s.currentUserID
	}
	invoiceID := nextID("psinv")
	if _, err := tx.Exec(ctx, `
		insert into partner_supplier_invoices (
			id, firm_id, supplier_id, purchase_id, grn_id, invoice_number, invoice_date, due_date,
			taxable_amount, gst_amount, final_total_amount, total_amount, paid_amount, outstanding_amount,
			status, payable_status, finalized_at, finalized_by, created_by
		) values ($1, $2, $3, nullif($4, ''), nullif($5, ''), $6, $7::date, nullif($8, '')::date,
		          $9, $10, $11, $11, 0, $11, $12, $13, $14, $15, $16)
	`, invoiceID, firmID, supplierID, purchaseID, grnID, invoiceNumber, strings.TrimSpace(input.InvoiceDate), strings.TrimSpace(input.DueDate), roundCurrency(input.TaxableAmount), roundCurrency(input.GSTAmount), roundCurrency(input.FinalTotalAmount), status, payableStatus, finalizedAt, finalizedBy, s.currentUserID); err != nil {
		return PartnerSupplierInvoice{}, err
	}
	if status == "FINALIZED" {
		if err := s.insertPartnerSupplierLedgerEntryTx(ctx, tx, firmID, supplierID, strings.TrimSpace(input.InvoiceDate), "SUPPLIER_INVOICE", invoiceID, invoiceNumber, "Supplier invoice finalized", 0, roundCurrency(input.FinalTotalAmount)); err != nil {
			return PartnerSupplierInvoice{}, err
		}
	}
	if err := s.insertPartnerAuditLogTx(ctx, tx, firmID, "SUPPLIER_INVOICE", invoiceID, "CREATE", nil, map[string]any{
		"supplierId":    supplierID,
		"supplierName":  supplierName,
		"invoiceNumber": invoiceNumber,
		"status":        status,
		"amount":        roundCurrency(input.FinalTotalAmount),
	}); err != nil {
		return PartnerSupplierInvoice{}, err
	}
	if err := tx.Commit(ctx); err != nil {
		return PartnerSupplierInvoice{}, err
	}
	return s.GetPartnerSupplierInvoiceByID(firmID, invoiceID)
}

func (s *Store) FinalizePartnerSupplierInvoice(firmID, invoiceID string) (PartnerSupplierInvoice, error) {
	ctx := context.Background()
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return PartnerSupplierInvoice{}, err
	}
	defer tx.Rollback(ctx)
	var supplierID, invoiceNumber, invoiceDate, dueDate, status string
	var amount float64
	if err := tx.QueryRow(ctx, `
		select supplier_id, invoice_number, invoice_date::text, coalesce(due_date::text, ''), status,
		       coalesce(nullif(final_total_amount, 0), total_amount)::float8
		from partner_supplier_invoices
		where firm_id = $1::bigint and id = $2
		for update
	`, firmID, invoiceID).Scan(&supplierID, &invoiceNumber, &invoiceDate, &dueDate, &status, &amount); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return PartnerSupplierInvoice{}, fmt.Errorf("supplier invoice not found")
		}
		return PartnerSupplierInvoice{}, err
	}
	if status == "FINALIZED" {
		if err := tx.Commit(ctx); err != nil {
			return PartnerSupplierInvoice{}, err
		}
		return s.GetPartnerSupplierInvoiceByID(firmID, invoiceID)
	}
	if status == "CANCELLED" {
		return PartnerSupplierInvoice{}, fmt.Errorf("cancelled supplier invoices cannot be finalized")
	}
	payableStatus := partnerPayableStatus(amount, 0, dueDate)
	if _, err := tx.Exec(ctx, `
		update partner_supplier_invoices
		set status = 'FINALIZED', payable_status = $3, finalized_at = now(), finalized_by = $4, updated_at = now()
		where firm_id = $1::bigint and id = $2
	`, firmID, invoiceID, payableStatus, s.currentUserID); err != nil {
		return PartnerSupplierInvoice{}, err
	}
	if err := s.insertPartnerSupplierLedgerEntryTx(ctx, tx, firmID, supplierID, invoiceDate, "SUPPLIER_INVOICE", invoiceID, invoiceNumber, "Supplier invoice finalized", 0, roundCurrency(amount)); err != nil {
		return PartnerSupplierInvoice{}, err
	}
	if err := s.insertPartnerAuditLogTx(ctx, tx, firmID, "SUPPLIER_INVOICE", invoiceID, "FINALIZE", map[string]any{"status": status}, map[string]any{"status": "FINALIZED"}); err != nil {
		return PartnerSupplierInvoice{}, err
	}
	if err := tx.Commit(ctx); err != nil {
		return PartnerSupplierInvoice{}, err
	}
	return s.GetPartnerSupplierInvoiceByID(firmID, invoiceID)
}

func (s *Store) CreatePartnerSupplierPayment(firmID string, input CreatePartnerSupplierPaymentInput) (PartnerSupplierPayment, error) {
	ctx := context.Background()
	invoiceID := strings.TrimSpace(input.SupplierInvoiceID)
	mode := strings.ToUpper(strings.TrimSpace(input.PaymentMode))
	if invoiceID == "" || strings.TrimSpace(input.PaymentDate) == "" || mode == "" {
		return PartnerSupplierPayment{}, fmt.Errorf("supplier invoice, payment date, and payment mode are required")
	}
	if input.Amount <= 0 {
		return PartnerSupplierPayment{}, fmt.Errorf("amount must be greater than zero")
	}
	switch mode {
	case "CASH", "UPI", "BANK_TRANSFER", "CHEQUE", "OTHER":
	default:
		return PartnerSupplierPayment{}, fmt.Errorf("unsupported payment mode")
	}
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return PartnerSupplierPayment{}, err
	}
	defer tx.Rollback(ctx)
	var supplierID, invoiceNumber, invoiceDate, status, dueDate string
	var finalTotal float64
	if err := tx.QueryRow(ctx, `
		select supplier_id, invoice_number, invoice_date::text, status, coalesce(due_date::text, ''),
		       coalesce(nullif(final_total_amount, 0), total_amount)::float8
		from partner_supplier_invoices
		where firm_id = $1::bigint and id = $2
		for update
	`, firmID, invoiceID).Scan(&supplierID, &invoiceNumber, &invoiceDate, &status, &dueDate, &finalTotal); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return PartnerSupplierPayment{}, fmt.Errorf("supplier invoice not found")
		}
		return PartnerSupplierPayment{}, err
	}
	if status != "FINALIZED" {
		return PartnerSupplierPayment{}, fmt.Errorf("payments can only be recorded against finalized supplier invoices")
	}
	var paid float64
	if err := tx.QueryRow(ctx, `select coalesce(sum(amount), 0)::float8 from partner_supplier_payment_allocations where firm_id = $1::bigint and supplier_invoice_id = $2`, firmID, invoiceID).Scan(&paid); err != nil {
		return PartnerSupplierPayment{}, err
	}
	outstanding := math.Max(roundCurrency(finalTotal-paid), 0)
	if roundCurrency(input.Amount) > outstanding {
		return PartnerSupplierPayment{}, fmt.Errorf("amount cannot exceed outstanding balance")
	}
	paymentID := nextID("pspay")
	if _, err := tx.Exec(ctx, `
		insert into partner_supplier_payments (
			id, firm_id, supplier_id, payment_date, amount, payment_mode, reference_number, notes, created_by
		) values ($1, $2, $3, $4::date, $5, $6, nullif($7, ''), nullif($8, ''), $9)
	`, paymentID, firmID, supplierID, strings.TrimSpace(input.PaymentDate), roundCurrency(input.Amount), mode, strings.TrimSpace(input.ReferenceNumber), strings.TrimSpace(input.Notes), s.currentUserID); err != nil {
		return PartnerSupplierPayment{}, err
	}
	if _, err := tx.Exec(ctx, `
		insert into partner_supplier_payment_allocations (id, firm_id, payment_id, supplier_invoice_id, amount)
		values ($1, $2, $3, $4, $5)
	`, nextID("pspal"), firmID, paymentID, invoiceID, roundCurrency(input.Amount)); err != nil {
		return PartnerSupplierPayment{}, err
	}
	nextPaid := roundCurrency(paid + input.Amount)
	nextStatus := partnerPayableStatus(finalTotal, nextPaid, dueDate)
	if _, err := tx.Exec(ctx, `
		update partner_supplier_invoices
		set paid_amount = $3, outstanding_amount = $4, payable_status = $5, updated_at = now()
		where firm_id = $1::bigint and id = $2
	`, firmID, invoiceID, nextPaid, math.Max(roundCurrency(finalTotal-nextPaid), 0), nextStatus); err != nil {
		return PartnerSupplierPayment{}, err
	}
	if err := s.insertPartnerSupplierLedgerEntryTx(ctx, tx, firmID, supplierID, input.PaymentDate, "SUPPLIER_PAYMENT", paymentID, firstNonEmpty(strings.TrimSpace(input.ReferenceNumber), paymentID), "Payment recorded for "+invoiceNumber, roundCurrency(input.Amount), 0); err != nil {
		return PartnerSupplierPayment{}, err
	}
	if err := s.insertPartnerAuditLogTx(ctx, tx, firmID, "SUPPLIER_INVOICE", invoiceID, "PAYMENT_RECORDED", nil, map[string]any{
		"paymentId": paymentID,
		"amount":    roundCurrency(input.Amount),
	}); err != nil {
		return PartnerSupplierPayment{}, err
	}
	if err := s.insertPartnerAuditLogTx(ctx, tx, firmID, "SUPPLIER_PAYMENT", paymentID, "CREATE", nil, map[string]any{
		"supplierInvoiceId": invoiceID,
		"invoiceNumber":     invoiceNumber,
		"amount":            roundCurrency(input.Amount),
	}); err != nil {
		return PartnerSupplierPayment{}, err
	}
	_ = invoiceDate
	if err := tx.Commit(ctx); err != nil {
		return PartnerSupplierPayment{}, err
	}
	payments, err := s.GetPartnerSupplierPayments(firmID, GetPartnerSupplierPaymentsInput{SupplierInvoiceID: invoiceID})
	if err != nil {
		return PartnerSupplierPayment{}, err
	}
	for _, item := range payments {
		if item.ID == paymentID {
			return item, nil
		}
	}
	return PartnerSupplierPayment{}, fmt.Errorf("supplier payment not found")
}

func (s *Store) GetPartnerSupplierPayments(firmID string, filters GetPartnerSupplierPaymentsInput) ([]PartnerSupplierPayment, error) {
	ctx := context.Background()
	rows, err := s.pool.Query(ctx, `
		select
			p.id, p.firm_id, p.supplier_id, s.supplier_name,
			p.payment_date::text, p.payment_mode, coalesce(p.reference_number, ''),
			to_char(p.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
			coalesce(u.name, ''), p.amount::float8, coalesce(p.notes, '')
		from partner_supplier_payments p
		join partner_suppliers s on s.firm_id = p.firm_id and s.id = p.supplier_id
		left join users u on u.id = p.created_by
		where p.firm_id = $1::bigint
		  and ($2 = '' or p.supplier_id = $2)
		  and ($3 = '' or p.payment_date >= $3::date)
		  and ($4 = '' or p.payment_date <= $4::date)
		  and ($5 = '' or s.supplier_name ilike '%' || $5 || '%' or p.reference_number ilike '%' || $5 || '%')
		  and ($6 = '' or exists (
		  	select 1 from partner_supplier_payment_allocations pa
		  	where pa.firm_id = p.firm_id and pa.payment_id = p.id and pa.supplier_invoice_id = $6
		  ))
		order by p.payment_date desc, p.created_at desc
	`, firmID, strings.TrimSpace(filters.SupplierID), strings.TrimSpace(filters.FromDate), strings.TrimSpace(filters.ToDate), strings.TrimSpace(filters.Search), strings.TrimSpace(filters.SupplierInvoiceID))
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := []PartnerSupplierPayment{}
	indexByID := map[string]int{}
	for rows.Next() {
		var item PartnerSupplierPayment
		if err := rows.Scan(
			&item.ID, &item.FirmID, &item.SupplierID, &item.SupplierName,
			&item.PaymentDate, &item.Mode, &item.ReferenceNumber, &item.CreatedAt,
			&item.RecordedByName, &item.Amount, &item.Notes,
		); err != nil {
			return nil, err
		}
		item.Allocations = []PartnerSupplierPaymentAllocation{}
		items = append(items, item)
		indexByID[item.ID] = len(items) - 1
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	allocationRows, err := s.pool.Query(ctx, `
		select pa.id, pa.payment_id, pa.supplier_invoice_id, i.invoice_number, i.invoice_date::text,
		       coalesce(nullif(i.final_total_amount, 0), i.total_amount)::float8, pa.amount::float8
		from partner_supplier_payment_allocations pa
		join partner_supplier_invoices i on i.firm_id = pa.firm_id and i.id = pa.supplier_invoice_id
		where pa.firm_id = $1::bigint
		order by pa.created_at asc
	`, firmID)
	if err != nil {
		return nil, err
	}
	defer allocationRows.Close()
	for allocationRows.Next() {
		var allocation PartnerSupplierPaymentAllocation
		if err := allocationRows.Scan(&allocation.ID, &allocation.PaymentID, &allocation.SupplierInvoiceID, &allocation.InvoiceNumber, &allocation.InvoiceDate, &allocation.InvoiceAmount, &allocation.Amount); err != nil {
			return nil, err
		}
		if idx, ok := indexByID[allocation.PaymentID]; ok {
			items[idx].AllocatedAmount = roundCurrency(items[idx].AllocatedAmount + allocation.Amount)
			items[idx].Allocations = append(items[idx].Allocations, allocation)
		}
	}
	if err := allocationRows.Err(); err != nil {
		return nil, err
	}
	invoices, err := s.GetPartnerSupplierInvoices(firmID, GetPartnerSupplierInvoicesInput{})
	if err != nil {
		return nil, err
	}
	dueByInvoice := map[string]float64{}
	for _, invoice := range invoices {
		dueByInvoice[invoice.ID] = invoice.OutstandingAmount
	}
	for i := range items {
		items[i].UnallocatedAmount = math.Max(roundCurrency(items[i].Amount-items[i].AllocatedAmount), 0)
		for j := range items[i].Allocations {
			items[i].Allocations[j].InvoiceOutstanding = dueByInvoice[items[i].Allocations[j].SupplierInvoiceID]
		}
	}
	return items, nil
}

func (s *Store) insertPartnerSupplierLedgerEntryTx(ctx context.Context, tx pgx.Tx, firmID, supplierID, entryDate, entryType, referenceID, referenceNumber, description string, debit, credit float64) error {
	entryType = strings.ToUpper(strings.TrimSpace(entryType))
	if strings.TrimSpace(supplierID) == "" || strings.TrimSpace(referenceID) == "" || entryType == "" {
		return nil
	}
	var exists bool
	if err := tx.QueryRow(ctx, `
		select exists(
			select 1
			from partner_supplier_ledger_entries
			where firm_id = $1::bigint and reference_id = $2 and entry_type = $3
		)
	`, firmID, referenceID, entryType).Scan(&exists); err != nil {
		return err
	}
	if exists {
		return nil
	}
	var previousBalance float64
	if err := tx.QueryRow(ctx, `
		select coalesce((
			select running_balance
			from partner_supplier_ledger_entries
			where firm_id = $1::bigint and supplier_id = $2
			order by entry_date desc, created_at desc
			limit 1
		), 0)::float8
	`, firmID, supplierID).Scan(&previousBalance); err != nil {
		return err
	}
	if strings.TrimSpace(entryDate) == "" {
		entryDate = time.Now().UTC().Format("2006-01-02")
	}
	runningBalance := roundCurrency(previousBalance + roundCurrency(credit) - roundCurrency(debit))
	_, err := tx.Exec(ctx, `
		insert into partner_supplier_ledger_entries (
			id, firm_id, supplier_id, entry_date, entry_type, reference_id, reference_number,
			description, debit, credit, running_balance
		) values ($1, $2, $3, $4::date, $5, $6, $7, $8, $9, $10, $11)
	`, nextID("psled"), firmID, supplierID, entryDate, entryType, referenceID, strings.TrimSpace(referenceNumber), strings.TrimSpace(description), roundCurrency(debit), roundCurrency(credit), runningBalance)
	return err
}

func (s *Store) GetPartnerSupplierLedger(firmID string, filters GetPartnerSupplierLedgerInput) ([]PartnerSupplierLedgerEntry, error) {
	ctx := context.Background()
	rows, err := s.pool.Query(ctx, `
		select
			e.id, e.firm_id, e.supplier_id, s.supplier_name, e.entry_date::text, e.entry_type,
			e.entry_type, e.reference_id, e.reference_number, e.description,
			e.debit::float8, e.credit::float8, e.running_balance::float8,
			to_char(e.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
		from partner_supplier_ledger_entries e
		join partner_suppliers s on s.firm_id = e.firm_id and s.id = e.supplier_id
		where e.firm_id = $1::bigint
		  and ($2 = '' or e.supplier_id = $2)
		  and ($3 = '' or e.entry_date >= $3::date)
		  and ($4 = '' or e.entry_date <= $4::date)
		order by e.entry_date asc, e.created_at asc
	`, firmID, strings.TrimSpace(filters.SupplierID), strings.TrimSpace(filters.FromDate), strings.TrimSpace(filters.ToDate))
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := []PartnerSupplierLedgerEntry{}
	for rows.Next() {
		var item PartnerSupplierLedgerEntry
		if err := rows.Scan(
			&item.ID, &item.FirmID, &item.SupplierID, &item.SupplierName, &item.EntryDate, &item.Type,
			&item.ReferenceType, &item.ReferenceID, &item.ReferenceNumber, &item.Description,
			&item.DebitAmount, &item.CreditAmount, &item.RunningBalance, &item.CreatedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (s *Store) GetPartnerDashboard(firmID string) (PartnerDashboardStats, error) {
	ctx := context.Background()
	var stats PartnerDashboardStats
	if err := s.pool.QueryRow(ctx, `
		select
			(select count(*) from partner_firm_brands where firm_id = $1::bigint),
			(select count(*)
			 from partner_product_catalog i
			 join partner_firm_brands fb on fb.brand_id = i.brand_id
			 where fb.firm_id = $1::bigint),
			(select count(*) from partner_client_businesses where firm_id = $1::bigint),
			(select count(*) from partner_client_outlets where firm_id = $1::bigint),
			(select count(*) from partner_suppliers where firm_id = $1::bigint),
			(select count(*) from partner_orders where firm_id = $1::bigint and status not in ('CANCELLED', 'DELIVERED')),
			0,
			(select coalesce(sum(quantity), 0) from partner_firm_inventory_items where firm_id = $1::bigint)
	`, firmID).Scan(
		&stats.MappedBrandsCount,
		&stats.ItemCount,
		&stats.ClientBusinessCount,
		&stats.OutletCount,
		&stats.SupplierCount,
		&stats.OpenOrdersCount,
		&stats.UnpaidInvoicesCount,
		&stats.CurrentStockQtyTotal,
	); err != nil {
		return PartnerDashboardStats{}, err
	}

	rows, err := s.pool.Query(ctx, `
		select
			id,
			title,
			subtitle,
			created_at,
			activity_type,
			activity_action,
			reference,
			subject,
			party,
			location,
			status,
			quantity_delta,
			impact_text,
			href
		from (
			select
				'order_' || o.id as id,
				'Order ' || o.order_number || ' created' as title,
				trim(both ' ' from concat(
					case when cb.business_name <> '' then 'Client: ' || cb.business_name else '' end,
					case when co.outlet_name <> '' then ' Outlet: ' || co.outlet_name else '' end
				)) as subtitle,
				o.created_at,
				'ORDER' as activity_type,
				'CREATE' as activity_action,
				o.order_number as reference,
				'' as subject,
				coalesce(cb.business_name, '') as party,
				coalesce(co.outlet_name, '') as location,
				o.status as status,
				0 as quantity_delta,
				'' as impact_text,
				'/partners/orders/' || o.id as href
			from partner_orders o
			join partner_client_businesses cb on cb.id = o.client_business_id and cb.firm_id = o.firm_id
			join partner_client_outlets co on co.id = o.client_outlet_id and co.client_business_id = o.client_business_id and co.firm_id = o.firm_id
			where o.firm_id = $1::bigint

			union all

			select
				'receipt_' || r.id as id,
				case
					when r.status = 'VOIDED' then 'Receipt voided for ' || c.name
					else 'Inventory inward recorded for ' || c.name
				end as title,
				case
					when coalesce(s.supplier_name, '') <> '' then 'Supplier: ' || s.supplier_name
					when coalesce(r.note, '') <> '' then r.note
					else ''
				end as subtitle,
				coalesce(r.voided_at, r.created_at) as created_at,
				'INVENTORY' as activity_type,
				case when r.status = 'VOIDED' then 'VOID_RECEIPT' else 'RECEIPT' end as activity_action,
				r.id as reference,
				c.name as subject,
				coalesce(s.supplier_name, '') as party,
				'' as location,
				r.status as status,
				case when r.status = 'VOIDED' then -r.quantity else r.quantity end as quantity_delta,
				(case when r.status = 'VOIDED' then '-' else '+' end) || r.quantity::text || ' units' as impact_text,
				'/partners/history' as href
			from partner_inventory_receipts r
			join partner_firm_inventory_items i on i.item_id = r.item_id and i.firm_id = r.firm_id
			join partner_product_catalog c on c.id = i.catalog_item_id
			left join partner_suppliers s on s.id = r.supplier_id and s.firm_id = r.firm_id
			where r.firm_id = $1::bigint

			union all

			select
				'adjustment_' || a.id as id,
				'Inventory adjusted for ' || c.name as title,
				coalesce(a.note, '') as subtitle,
				a.created_at,
				'INVENTORY' as activity_type,
				'ADJUSTMENT' as activity_action,
				a.id as reference,
				c.name as subject,
				'' as party,
				'' as location,
				'' as status,
				(a.quantity_to - a.quantity_from) as quantity_delta,
				(case when (a.quantity_to - a.quantity_from) > 0 then '+' else '' end) || (a.quantity_to - a.quantity_from)::text || ' units' as impact_text,
				'/partners/history' as href
			from partner_inventory_adjustments a
			join partner_firm_inventory_items i on i.item_id = a.item_id and i.firm_id = a.firm_id
			join partner_product_catalog c on c.id = i.catalog_item_id
			where a.firm_id = $1::bigint
		) a
		order by created_at desc
		limit 5
	`, firmID)
	if err != nil {
		return PartnerDashboardStats{}, err
	}
	defer rows.Close()
	for rows.Next() {
		var activity PartnerDashboardActivity
		var createdAt time.Time
		if err := rows.Scan(
			&activity.ID,
			&activity.Title,
			&activity.Subtitle,
			&createdAt,
			&activity.Type,
			&activity.Action,
			&activity.Reference,
			&activity.Subject,
			&activity.Party,
			&activity.Location,
			&activity.Status,
			&activity.QuantityDelta,
			&activity.ImpactText,
			&activity.Href,
		); err != nil {
			return PartnerDashboardStats{}, err
		}
		activity.CreatedAt = createdAt.Format(time.RFC3339)
		stats.RecentActivity = append(stats.RecentActivity, activity)
	}
	return stats, rows.Err()
}

func (s *Store) GetPartnerOrders(firmID string) ([]PartnerOrder, error) {
	ctx := context.Background()
	rows, err := s.pool.Query(ctx, `
		select
			o.id, o.firm_id, o.order_number, o.client_business_id, b.business_name,
			o.client_outlet_id, coalesce(co.outlet_name, ''), o.order_date::text, coalesce(o.source, 'MANUAL'), o.status,
			to_char(o.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
			coalesce(u.name, ''), coalesce(to_char(o.confirmed_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), ''),
			coalesce(o.dispatch_date::text, ''), coalesce(o.transport_name, ''), coalesce(o.vehicle_number, ''),
			coalesce(o.driver_phone, ''), coalesce(o.dispatch_notes, ''),
			coalesce(to_char(o.dispatched_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), ''),
			coalesce(o.delivered_date::text, ''), coalesce(o.delivery_recipient_name, ''), coalesce(o.delivery_proof_reference, ''),
			coalesce(o.delivery_notes, ''),
			coalesce(to_char(o.delivered_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), ''),
			coalesce(to_char(o.cancelled_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), ''),
			coalesce((
				select i.id
				from partner_invoices i
				where i.firm_id = o.firm_id and i.order_id = o.id and i.status <> 'CANCELLED'
				order by i.created_at desc
				limit 1
			), ''),
			coalesce((
				select i.invoice_number
				from partner_invoices i
				where i.firm_id = o.firm_id and i.order_id = o.id and i.status <> 'CANCELLED'
				order by i.created_at desc
				limit 1
			), ''),
			coalesce(o.notes, '')
		from partner_orders o
		join partner_client_businesses b on b.id = o.client_business_id and b.firm_id = o.firm_id
		join partner_client_outlets co on co.id = o.client_outlet_id and co.client_business_id = o.client_business_id and co.firm_id = o.firm_id
		left join users u on u.id = o.created_by
			where o.firm_id = $1::bigint
		order by o.order_date desc, o.created_at desc
	`, firmID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []PartnerOrder
	indexByID := map[string]int{}
	for rows.Next() {
		var item PartnerOrder
		if err := rows.Scan(
			&item.ID, &item.FirmID, &item.OrderNumber, &item.ClientBusinessID, &item.ClientBusinessName,
			&item.ClientOutletID, &item.ClientOutletName, &item.OrderDate, &item.Source, &item.Status, &item.CreatedAt,
			&item.CreatedByName, &item.ConfirmedAt, &item.DispatchDate, &item.TransportName, &item.VehicleNumber,
			&item.DriverPhone, &item.DispatchNotes, &item.DispatchedAt, &item.DeliveredDate, &item.DeliveryRecipientName,
			&item.DeliveryProofReference, &item.DeliveryNotes, &item.DeliveredAt, &item.CancelledAt,
			&item.LinkedInvoiceID, &item.LinkedInvoiceNumber, &item.Notes,
		); err != nil {
			return nil, err
		}
		item.Items = []PartnerOrderItem{}
		item.RequestedItems = []PartnerOrderItem{}
		item.BillableLines = []PartnerOrderBillableLine{}
		item.UnfulfilledItems = []PartnerUnfulfilledOrderItem{}
		items = append(items, item)
		indexByID[item.ID] = len(items) - 1
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	if len(items) == 0 {
		return []PartnerOrder{}, nil
	}
	requestedRows, err := s.pool.Query(ctx, `
		select
			id, order_id, brand_id, catalog_item_id, item_code, item_name, unit, requested_quantity,
			mrp::float8, discount_percentage::float8
		from partner_order_requested_items
		where firm_id = $1::bigint
		order by created_at asc
	`, firmID)
	if err != nil {
		return nil, err
	}
	defer requestedRows.Close()
	for requestedRows.Next() {
		var line PartnerOrderItem
		if err := requestedRows.Scan(
			&line.ID, &line.OrderID, &line.BrandID, &line.ItemID, &line.ItemCode, &line.ItemName, &line.Unit, &line.Quantity,
			&line.MRP, &line.DiscountPercentage,
		); err != nil {
			return nil, err
		}
		line.CatalogItemID = line.ItemID
		idx, ok := indexByID[line.OrderID]
		if !ok {
			continue
		}
		items[idx].RequestedItems = append(items[idx].RequestedItems, line)
	}
	if err := requestedRows.Err(); err != nil {
		return nil, err
	}
	billableRows, err := s.pool.Query(ctx, `
		select id, order_id, catalog_item_id, item_code, item_name, quantity,
		       mrp::float8, seller_margin_percentage::float8, rate::float8, line_total::float8
		from partner_order_billable_lines
		where firm_id = $1::bigint
		order by created_at asc
	`, firmID)
	if err != nil {
		return nil, err
	}
	defer billableRows.Close()
	for billableRows.Next() {
		var line PartnerOrderBillableLine
		if err := billableRows.Scan(
			&line.ID, &line.OrderID, &line.CatalogItemID, &line.ItemCode, &line.ItemName, &line.Quantity,
			&line.MRP, &line.SellerMarginPercentage, &line.Rate, &line.LineTotal,
		); err != nil {
			return nil, err
		}
		idx, ok := indexByID[line.OrderID]
		if !ok {
			continue
		}
		items[idx].BillableLines = append(items[idx].BillableLines, line)
	}
	if err := billableRows.Err(); err != nil {
		return nil, err
	}
	itemRows, err := s.pool.Query(ctx, `
		select
			oi.id, oi.order_id, coalesce(oi.billable_line_id, ''), oi.item_id, coalesce(fi.catalog_item_id, oi.item_id), oi.item_code, oi.item_name, oi.unit, oi.quantity,
			packed_quantity, dispatched_quantity, delivered_quantity, returned_quantity, cancelled_quantity, coalesce(short_reason, ''),
			oi.mrp::float8, oi.discount_percentage::float8
		from partner_order_items oi
		left join partner_firm_inventory_items fi on fi.firm_id = oi.firm_id and fi.item_id = oi.item_id
		where oi.firm_id = $1::bigint
		order by oi.created_at asc
	`, firmID)
	if err != nil {
		return nil, err
	}
	defer itemRows.Close()
	for itemRows.Next() {
		var line PartnerOrderItem
		if err := itemRows.Scan(
			&line.ID, &line.OrderID, &line.BillableLineID, &line.ItemID, &line.CatalogItemID, &line.ItemCode, &line.ItemName, &line.Unit, &line.Quantity,
			&line.PackedQuantity, &line.DispatchedQuantity, &line.DeliveredQuantity, &line.ReturnedQuantity, &line.CancelledQuantity, &line.ShortReason,
			&line.MRP, &line.DiscountPercentage,
		); err != nil {
			return nil, err
		}
		idx, ok := indexByID[line.OrderID]
		if !ok {
			continue
		}
		items[idx].Items = append(items[idx].Items, line)
	}
	if err := itemRows.Err(); err != nil {
		return nil, err
	}
	unfulfilledRows, err := s.pool.Query(ctx, `
		select
			id, firm_id, client_business_id, client_outlet_id, source_order_id, source_order_line_id,
			brand_id, catalog_item_id, item_code, item_name, requested_quantity, fulfilled_quantity,
			open_quantity, status, reason,
			to_char(created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
			to_char(updated_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
			coalesce(to_char(cleared_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), '')
		from partner_unfulfilled_order_items
		where firm_id = $1::bigint
		order by created_at desc
	`, firmID)
	if err != nil {
		return nil, err
	}
	defer unfulfilledRows.Close()
	for unfulfilledRows.Next() {
		var line PartnerUnfulfilledOrderItem
		if err := unfulfilledRows.Scan(
			&line.ID, &line.FirmID, &line.ClientBusinessID, &line.ClientOutletID, &line.SourceOrderID, &line.SourceOrderLineID,
			&line.BrandID, &line.CatalogItemID, &line.ItemCode, &line.ItemName, &line.RequestedQuantity, &line.FulfilledQuantity,
			&line.OpenQuantity, &line.Status, &line.Reason, &line.CreatedAt, &line.UpdatedAt, &line.ClearedAt,
		); err != nil {
			return nil, err
		}
		idx, ok := indexByID[line.SourceOrderID]
		if !ok {
			continue
		}
		items[idx].UnfulfilledItems = append(items[idx].UnfulfilledItems, line)
	}
	if err := unfulfilledRows.Err(); err != nil {
		return nil, err
	}
	for idx := range items {
		if len(items[idx].RequestedItems) > 0 {
			items[idx].ItemCount = len(items[idx].RequestedItems)
			for _, line := range items[idx].RequestedItems {
				items[idx].TotalQuantity += line.Quantity
			}
			if items[idx].Status == "DRAFT" || items[idx].Status == "PLACED" || len(items[idx].Items) == 0 {
				items[idx].Items = append([]PartnerOrderItem{}, items[idx].RequestedItems...)
			}
			continue
		}
		items[idx].ItemCount = len(items[idx].Items)
		for _, line := range items[idx].Items {
			items[idx].TotalQuantity += line.Quantity
		}
	}
	return items, nil
}

func (s *Store) CreatePartnerOrder(firmID string, input CreatePartnerOrderInput) (PartnerOrder, error) {
	ctx := context.Background()
	if strings.TrimSpace(input.ClientBusinessID) == "" || strings.TrimSpace(input.ClientOutletID) == "" {
		return PartnerOrder{}, fmt.Errorf("clientBusinessId and clientOutletId are required")
	}
	if len(input.Items) == 0 {
		return PartnerOrder{}, fmt.Errorf("items are required")
	}
	status := strings.ToUpper(strings.TrimSpace(input.Status))
	if status == "" {
		status = "DRAFT"
	}
	if status != "DRAFT" && status != "PLACED" {
		return PartnerOrder{}, fmt.Errorf("status must be DRAFT or PLACED")
	}
	source := strings.ToUpper(strings.TrimSpace(input.Source))
	if source == "" {
		source = "MANUAL"
	}
	if !validPartnerOrderSource(source) {
		return PartnerOrder{}, fmt.Errorf("source is invalid")
	}
	orderDate := strings.TrimSpace(input.OrderDate)
	if orderDate == "" {
		orderDate = time.Now().UTC().Format("2006-01-02")
	}
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return PartnerOrder{}, err
	}
	defer tx.Rollback(ctx)
	orderID := nextID("porder")
	var orderNumber string
	if err := tx.QueryRow(ctx, `
		select 'ORD-' || lpad((coalesce(count(*), 0) + 1001)::text, 4, '0')
		from partner_orders
		where firm_id = $1::bigint
	`, firmID).Scan(&orderNumber); err != nil {
		return PartnerOrder{}, err
	}
	if _, err := tx.Exec(ctx, `
		insert into partner_orders (id, firm_id, client_business_id, client_outlet_id, order_number, order_date, source, status, notes, created_by)
		values ($1, $2, $3, $4, $5, $6::date, $7, $8, nullif($9, ''), $10)
	`, orderID, firmID, input.ClientBusinessID, input.ClientOutletID, orderNumber, orderDate, source, status, strings.TrimSpace(input.Notes), s.currentUserID); err != nil {
		return PartnerOrder{}, err
	}
	seen := map[string]struct{}{}
	for _, line := range input.Items {
		if line.Quantity <= 0 {
			return PartnerOrder{}, fmt.Errorf("quantity must be positive")
		}
		if _, exists := seen[strings.TrimSpace(line.ItemID)]; exists {
			return PartnerOrder{}, fmt.Errorf("duplicate items are not allowed")
		}
		seen[strings.TrimSpace(line.ItemID)] = struct{}{}
		var item PartnerCatalogItem
		err := tx.QueryRow(ctx, `
			select c.id, c.brand_id, c.name, coalesce(c.description, ''), coalesce(c.hsn_code, ''), c.sku,
			       coalesce(c.default_mrp, 0), coalesce(c.default_discount_percentage, 0)::float8, c.status,
			       to_char(c.updated_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
			from partner_product_catalog c
			join partner_firm_brands fb on fb.brand_id = c.brand_id and fb.firm_id = $1::bigint
			where c.id = $2
		`, firmID, line.ItemID).Scan(&item.ID, &item.BrandID, &item.Name, &item.Description, &item.HSNCode, &item.SKU, &item.DefaultMRP, &item.DefaultDiscountPercentage, &item.Status, &item.UpdatedAt)
		if err != nil {
			return PartnerOrder{}, err
		}
		if item.Status != "ACTIVE" {
			return PartnerOrder{}, fmt.Errorf("item %s is inactive", item.Name)
		}
		sellerMarginPercentage, err := resolveSellerMarginPercentage(input.SellerMarginPercentage, item.DefaultDiscountPercentage)
		if err != nil {
			return PartnerOrder{}, err
		}
		requestedLineID := nextID("pori")
		if _, err := tx.Exec(ctx, `
			insert into partner_order_requested_items (
				id, firm_id, order_id, brand_id, catalog_item_id, item_code, item_name, unit,
				requested_quantity, mrp, discount_percentage
			)
			values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		`, requestedLineID, firmID, orderID, item.BrandID, item.ID, item.SKU, item.Name, "", line.Quantity, item.DefaultMRP, sellerMarginPercentage); err != nil {
			return PartnerOrder{}, err
		}
		if _, err := tx.Exec(ctx, `
			insert into partner_order_items (id, firm_id, order_id, item_id, item_code, item_name, unit, quantity, mrp, discount_percentage)
			values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		`, nextID("poitem"), firmID, orderID, item.ID, item.SKU, item.Name, "", line.Quantity, item.DefaultMRP, sellerMarginPercentage); err != nil {
			return PartnerOrder{}, err
		}
	}
	if err := tx.Commit(ctx); err != nil {
		return PartnerOrder{}, err
	}
	orders, err := s.GetPartnerOrders(firmID)
	if err != nil {
		return PartnerOrder{}, err
	}
	for _, order := range orders {
		if order.ID == orderID {
			return order, nil
		}
	}
	return PartnerOrder{}, fmt.Errorf("order not found")
}

func (s *Store) GetPartnerOrderByID(firmID, orderID string) (PartnerOrder, error) {
	items, err := s.GetPartnerOrders(firmID)
	if err != nil {
		return PartnerOrder{}, err
	}
	for _, item := range items {
		if item.ID == orderID {
			return item, nil
		}
	}
	return PartnerOrder{}, fmt.Errorf("order not found")
}

func (s *Store) UpdatePartnerOrder(firmID, orderID string, input UpdatePartnerOrderInput) (PartnerOrder, error) {
	current, err := s.GetPartnerOrderByID(firmID, orderID)
	if err != nil {
		return PartnerOrder{}, err
	}
	if !canEditPartnerOrder(current) {
		return PartnerOrder{}, fmt.Errorf("order can only be edited before dispatch")
	}
	if strings.TrimSpace(input.ClientBusinessID) == "" || strings.TrimSpace(input.ClientOutletID) == "" {
		return PartnerOrder{}, fmt.Errorf("clientBusinessId and clientOutletId are required")
	}
	if len(input.Items) == 0 {
		return PartnerOrder{}, fmt.Errorf("items are required")
	}
	source := strings.ToUpper(strings.TrimSpace(input.Source))
	if source == "" {
		source = "MANUAL"
	}
	if !validPartnerOrderSource(source) {
		return PartnerOrder{}, fmt.Errorf("source is invalid")
	}

	nextItems := make([]PartnerOrderItem, 0, len(input.Items))
	seen := map[string]struct{}{}
	for _, line := range input.Items {
		itemID := strings.TrimSpace(line.ItemID)
		if itemID == "" {
			return PartnerOrder{}, fmt.Errorf("itemId is required")
		}
		if line.Quantity <= 0 {
			return PartnerOrder{}, fmt.Errorf("quantity must be positive")
		}
		if _, exists := seen[itemID]; exists {
			return PartnerOrder{}, fmt.Errorf("duplicate items are not allowed")
		}
		seen[itemID] = struct{}{}
		var item PartnerCatalogItem
		err := s.pool.QueryRow(context.Background(), `
			select c.id, c.brand_id, c.name, coalesce(c.description, ''), coalesce(c.hsn_code, ''), c.sku,
			       coalesce(c.default_mrp, 0), coalesce(c.default_discount_percentage, 0)::float8, c.status,
			       to_char(c.updated_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
			from partner_product_catalog c
			join partner_firm_brands fb on fb.brand_id = c.brand_id and fb.firm_id = $1::bigint
			where c.id = $2
		`, firmID, itemID).Scan(&item.ID, &item.BrandID, &item.Name, &item.Description, &item.HSNCode, &item.SKU, &item.DefaultMRP, &item.DefaultDiscountPercentage, &item.Status, &item.UpdatedAt)
		if err != nil {
			return PartnerOrder{}, err
		}
		if item.Status != "ACTIVE" {
			return PartnerOrder{}, fmt.Errorf("item %s is inactive", item.Name)
		}
		sellerMarginPercentage, err := resolveSellerMarginPercentage(input.SellerMarginPercentage, item.DefaultDiscountPercentage)
		if err != nil {
			return PartnerOrder{}, err
		}
		nextItems = append(nextItems, PartnerOrderItem{
			ItemID:             item.ID,
			ItemCode:           item.SKU,
			ItemName:           item.Name,
			Unit:               "",
			Quantity:           line.Quantity,
			MRP:                float64(item.DefaultMRP),
			DiscountPercentage: sellerMarginPercentage,
		})
	}

	ctx := context.Background()
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return PartnerOrder{}, err
	}
	defer tx.Rollback(ctx)

	reallocateOrder := current.Status == "CONFIRMED" || current.Status == "PACKED"
	if reallocateOrder {
		lines, err := loadPartnerOrderTransitionLines(ctx, tx, firmID, orderID)
		if err != nil {
			return PartnerOrder{}, err
		}
		for _, line := range lines {
			if line.DispatchedQuantity > 0 || line.DeliveredQuantity > 0 || line.ReturnedQuantity > 0 || line.CancelledQuantity > 0 {
				return PartnerOrder{}, fmt.Errorf("order cannot be edited after dispatch has started")
			}
			if line.Quantity > 0 {
				if err := s.applyPartnerOrderInventoryDeltaTx(ctx, tx, firmID, line.ItemID, line.Quantity, "Order edit reallocation: "+orderID); err != nil {
					return PartnerOrder{}, err
				}
			}
		}
		if err := s.cancelDraftPartnerOrderInvoicesTx(ctx, tx, firmID, orderID, "ORDER_EDITED_REGENERATE_INVOICE"); err != nil {
			return PartnerOrder{}, err
		}
	}

	if _, err := tx.Exec(ctx, `
		update partner_orders
		set client_business_id = $3,
		    client_outlet_id = $4,
		    source = $5,
		    notes = nullif($6, ''),
		    updated_at = now()
		where firm_id = $1::bigint and id = $2
	`, firmID, orderID, strings.TrimSpace(input.ClientBusinessID), strings.TrimSpace(input.ClientOutletID), source, strings.TrimSpace(input.Notes)); err != nil {
		return PartnerOrder{}, err
	}
	if _, err := tx.Exec(ctx, `
		delete from partner_order_items
		where firm_id = $1::bigint and order_id = $2
	`, firmID, orderID); err != nil {
		return PartnerOrder{}, err
	}
	if _, err := tx.Exec(ctx, `
		delete from partner_order_requested_items
		where firm_id = $1::bigint and order_id = $2
	`, firmID, orderID); err != nil {
		return PartnerOrder{}, err
	}
	for _, line := range nextItems {
		if _, err := tx.Exec(ctx, `
			insert into partner_order_requested_items (
				id, firm_id, order_id, brand_id, catalog_item_id, item_code, item_name, unit,
				requested_quantity, mrp, discount_percentage
			)
			select $1, $2, $3, c.brand_id, c.id, c.sku, c.name, $4, $5, $6, $7
			from partner_product_catalog c
			where c.id = $8
		`, nextID("pori"), firmID, orderID, line.Unit, line.Quantity, line.MRP, line.DiscountPercentage, line.ItemID); err != nil {
			return PartnerOrder{}, err
		}
		if !reallocateOrder {
			if _, err := tx.Exec(ctx, `
				insert into partner_order_items (id, firm_id, order_id, item_id, item_code, item_name, unit, quantity, mrp, discount_percentage)
				values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
			`, nextID("poitem"), firmID, orderID, line.ItemID, line.ItemCode, line.ItemName, line.Unit, line.Quantity, line.MRP, line.DiscountPercentage); err != nil {
				return PartnerOrder{}, err
			}
		}
	}
	if reallocateOrder {
		if err := s.confirmPartnerOrderTx(ctx, tx, firmID, orderID, nil, nil, nil); err != nil {
			return PartnerOrder{}, err
		}
		quantityStatus := "CONFIRMED"
		if current.Status == "PACKED" {
			lines, err := loadPartnerOrderTransitionLines(ctx, tx, firmID, orderID)
			if err != nil {
				return PartnerOrder{}, err
			}
			if err := packPartnerOrderTx(ctx, tx, firmID, orderID, lines, nil); err != nil {
				return PartnerOrder{}, err
			}
			quantityStatus = "PACKED"
		}
		_ = quantityStatus
		if err := s.insertPartnerAuditLogTx(ctx, tx, firmID, "ORDER", orderID, "EDIT", map[string]any{
			"status": current.Status,
		}, map[string]any{
			"status": current.Status,
		}); err != nil {
			return PartnerOrder{}, err
		}
	}
	if err := tx.Commit(ctx); err != nil {
		return PartnerOrder{}, err
	}
	return s.GetPartnerOrderByID(firmID, orderID)
}

func (s *Store) UpdatePartnerOrderStatus(firmID, orderID, nextStatus string) (PartnerOrder, error) {
	return s.UpdatePartnerOrderStatusWithInput(firmID, orderID, UpdatePartnerOrderStatusInput{Status: nextStatus})
}

type partnerOrderTransitionLine struct {
	ID                 string
	ItemID             string
	ItemName           string
	Quantity           int
	PackedQuantity     int
	DispatchedQuantity int
	DeliveredQuantity  int
	ReturnedQuantity   int
	CancelledQuantity  int
	ShortReason        string
}

func (s *Store) UpdatePartnerOrderStatusWithInput(firmID, orderID string, input UpdatePartnerOrderStatusInput) (PartnerOrder, error) {
	ctx := context.Background()
	var currentStatus string
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return PartnerOrder{}, err
	}
	defer tx.Rollback(ctx)

	if err := tx.QueryRow(ctx, `
		select status
		from partner_orders
		where firm_id = $1::bigint and id = $2
		for update
	`, firmID, orderID).Scan(&currentStatus); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return PartnerOrder{}, fmt.Errorf("order not found")
		}
		return PartnerOrder{}, err
	}
	nextStatus := strings.ToUpper(strings.TrimSpace(input.Status))
	if !canTransitionPartnerOrderStatus(currentStatus, nextStatus) {
		return PartnerOrder{}, fmt.Errorf("cannot move order from %s to %s", currentStatus, nextStatus)
	}

	lines, err := loadPartnerOrderTransitionLines(ctx, tx, firmID, orderID)
	if err != nil {
		return PartnerOrder{}, err
	}
	if len(lines) == 0 && nextStatus != "DRAFT" && nextStatus != "CANCELLED" {
		return PartnerOrder{}, fmt.Errorf("order items are required")
	}
	quantityByItem, err := partnerOrderTransitionQuantities(input.Items)
	if err != nil {
		return PartnerOrder{}, err
	}

	switch nextStatus {
	case "CONFIRMED":
		if err := s.confirmPartnerOrderTx(ctx, tx, firmID, orderID, input.Items, input.SellerMarginPercentage, input.RequestedItems); err != nil {
			return PartnerOrder{}, err
		}
	case "DRAFT":
		if currentStatus != "DRAFT" {
			if err := s.revertConfirmedPartnerOrderToDraftTx(ctx, tx, firmID, orderID, currentStatus, lines); err != nil {
				return PartnerOrder{}, err
			}
		}
	case "PACKED":
		if err := packPartnerOrderTx(ctx, tx, firmID, orderID, lines, input.PackedItems); err != nil {
			return PartnerOrder{}, err
		}
	case "DISPATCHED":
		if err := s.dispatchPartnerOrderTx(ctx, tx, firmID, orderID, lines, input.DispatchDetails, input.DispatchedItems); err != nil {
			return PartnerOrder{}, err
		}
		invoiceDate := strings.TrimSpace(input.DispatchDetails.DispatchDate)
		if invoiceDate == "" {
			invoiceDate = time.Now().UTC().Format("2006-01-02")
		}
		if _, _, err := s.ensurePartnerOrderInvoiceTx(ctx, tx, firmID, orderID, invoiceDate, invoiceDate, "Draft invoice generated at dispatch", "DRAFT", "DISPATCHED"); err != nil {
			return PartnerOrder{}, err
		}
	case "DELIVERED", "PARTIALLY_DELIVERED":
		if len(input.DeliveredItems) > 0 || input.DeliveryDetails != (PartnerOrderDeliveryDetailsInput{}) {
			if err := markPartnerOrderDeliveredWithInputTx(ctx, tx, firmID, orderID, lines, input.DeliveryDetails, input.DeliveredItems, nextStatus); err != nil {
				return PartnerOrder{}, err
			}
		} else if err := markPartnerOrderDeliveredTx(ctx, tx, firmID, orderID, lines, quantityByItem, nextStatus); err != nil {
			return PartnerOrder{}, err
		}
	case "RETURNED", "PARTIALLY_RETURNED":
		resolvedStatus, err := s.returnPartnerOrderTx(ctx, tx, firmID, orderID, lines, quantityByItem, nextStatus, input.Note)
		if err != nil {
			return PartnerOrder{}, err
		}
		nextStatus = resolvedStatus
	case "CANCELLED":
		if err := s.cancelPartnerOrderTx(ctx, tx, firmID, orderID, currentStatus, lines, input.Note); err != nil {
			return PartnerOrder{}, err
		}
	}

	query := `
		update partner_orders
		set status = $3,
		    confirmed_at = case when $3 = 'CONFIRMED' then now() when $3 = 'DRAFT' then null else confirmed_at end,
		    dispatched_at = case when $3 = 'DISPATCHED' then now() else dispatched_at end,
		    delivered_at = case when $3 in ('DELIVERED', 'PARTIALLY_DELIVERED') then now() else delivered_at end,
		    cancelled_at = case when $3 = 'CANCELLED' then now() else cancelled_at end,
		    updated_at = now()
		where firm_id = $1::bigint and id = $2
	`
	if _, err := tx.Exec(ctx, query, firmID, orderID, nextStatus); err != nil {
		return PartnerOrder{}, err
	}
	if err := s.insertPartnerAuditLogTx(ctx, tx, firmID, "ORDER", orderID, "STATUS_CHANGE", map[string]any{
		"status": currentStatus,
	}, map[string]any{
		"status": nextStatus,
		"note":   strings.TrimSpace(input.Note),
	}); err != nil {
		return PartnerOrder{}, err
	}
	if err := tx.Commit(ctx); err != nil {
		return PartnerOrder{}, err
	}
	return s.GetPartnerOrderByID(firmID, orderID)
}

func loadPartnerOrderTransitionLines(ctx context.Context, tx pgx.Tx, firmID, orderID string) ([]partnerOrderTransitionLine, error) {
	rows, err := tx.Query(ctx, `
		select id, item_id, item_name, quantity, packed_quantity, dispatched_quantity, delivered_quantity, returned_quantity, cancelled_quantity, coalesce(short_reason, '')
		from partner_order_items
		where firm_id = $1::bigint and order_id = $2
		order by created_at asc
		for update
	`, firmID, orderID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	lines := []partnerOrderTransitionLine{}
	for rows.Next() {
		var line partnerOrderTransitionLine
		if err := rows.Scan(
			&line.ID,
			&line.ItemID,
			&line.ItemName,
			&line.Quantity,
			&line.PackedQuantity,
			&line.DispatchedQuantity,
			&line.DeliveredQuantity,
			&line.ReturnedQuantity,
			&line.CancelledQuantity,
			&line.ShortReason,
		); err != nil {
			return nil, err
		}
		lines = append(lines, line)
	}
	return lines, rows.Err()
}

type partnerOrderStockAllocation struct {
	ItemID             string
	CatalogItemID      string
	BrandID            string
	ItemName           string
	ItemCode           string
	MRP                float64
	DiscountPercentage float64
	AvailableQuantity  int
	Quantity           int
}

type partnerOrderBillableDraft struct {
	ID                     string
	CatalogItemID          string
	ItemCode               string
	ItemName               string
	MRP                    float64
	SellerMarginPercentage float64
	Quantity               int
	Rate                   float64
	LineTotal              float64
}

type partnerOrderRequestedLine struct {
	ID                 string
	BrandID            string
	CatalogItemID      string
	ItemCode           string
	ItemName           string
	Unit               string
	RequestedQuantity  int
	MRP                float64
	DiscountPercentage float64
}

func (s *Store) confirmPartnerOrderTx(ctx context.Context, tx pgx.Tx, firmID, orderID string, inputs []CreatePartnerOrderLineInput, sellerMarginPercentage *float64, requestedMarginInputs []PartnerOrderStatusRequestedInput) error {
	var clientBusinessID, clientOutletID string
	if err := tx.QueryRow(ctx, `
		select client_business_id, client_outlet_id
		from partner_orders
		where firm_id = $1::bigint and id = $2
	`, firmID, orderID).Scan(&clientBusinessID, &clientOutletID); err != nil {
		return err
	}

	requestedLines, err := loadPartnerOrderRequestedLinesTx(ctx, tx, firmID, orderID)
	if err != nil {
		return err
	}
	if len(requestedLines) == 0 {
		return fmt.Errorf("order requested items are required")
	}
	if sellerMarginPercentage != nil {
		resolvedSellerMargin, err := resolveSellerMarginPercentage(sellerMarginPercentage, 0)
		if err != nil {
			return err
		}
		if _, err := tx.Exec(ctx, `
			update partner_order_requested_items
			set discount_percentage = $3
			where firm_id = $1::bigint and order_id = $2
		`, firmID, orderID, resolvedSellerMargin); err != nil {
			return err
		}
		for idx := range requestedLines {
			requestedLines[idx].DiscountPercentage = resolvedSellerMargin
		}
	}
	if len(requestedMarginInputs) > 0 {
		requestedMarginByCatalog := map[string]float64{}
		for _, input := range requestedMarginInputs {
			catalogItemID := strings.TrimSpace(input.ItemID)
			if catalogItemID == "" {
				return fmt.Errorf("requested itemId is required")
			}
			resolvedSellerMargin, err := resolveSellerMarginPercentage(&input.SellerMarginPercentage, 0)
			if err != nil {
				return err
			}
			requestedMarginByCatalog[catalogItemID] = resolvedSellerMargin
		}
		for idx := range requestedLines {
			resolvedSellerMargin, ok := requestedMarginByCatalog[requestedLines[idx].CatalogItemID]
			if !ok {
				continue
			}
			if _, err := tx.Exec(ctx, `
				update partner_order_requested_items
				set discount_percentage = $4
				where firm_id = $1::bigint and order_id = $2 and catalog_item_id = $3
			`, firmID, orderID, requestedLines[idx].CatalogItemID, resolvedSellerMargin); err != nil {
				return err
			}
			requestedLines[idx].DiscountPercentage = resolvedSellerMargin
		}
	}

	requiredByCatalog := map[string]int{}
	lineByCatalog := map[string]partnerOrderRequestedLine{}
	for _, line := range requestedLines {
		requiredByCatalog[line.CatalogItemID] += line.RequestedQuantity
		lineByCatalog[line.CatalogItemID] = line
	}

	if len(inputs) == 0 {
		var autoInputs []CreatePartnerOrderLineInput
		for _, line := range requestedLines {
			remaining := line.RequestedQuantity
			rows, err := tx.Query(ctx, `
				select item_id, quantity
				from partner_firm_inventory_items
				where firm_id = $1::bigint and catalog_item_id = $2 and status = 'ACTIVE' and quantity > 0
				order by updated_at asc, item_id asc
				for update
			`, firmID, line.CatalogItemID)
			if err != nil {
				return err
			}
			for rows.Next() {
				var itemID string
				var available int
				if err := rows.Scan(&itemID, &available); err != nil {
					rows.Close()
					return err
				}
				if remaining <= 0 {
					continue
				}
				quantity := available
				if quantity > remaining {
					quantity = remaining
				}
				autoInputs = append(autoInputs, CreatePartnerOrderLineInput{ItemID: itemID, Quantity: quantity})
				remaining -= quantity
			}
			if err := rows.Err(); err != nil {
				rows.Close()
				return err
			}
			rows.Close()
		}
		inputs = autoInputs
	}

	allocatedByCatalog := map[string]int{}
	allocations := make([]partnerOrderStockAllocation, 0, len(inputs))
	seen := map[string]struct{}{}
	for _, input := range inputs {
		itemID := strings.TrimSpace(input.ItemID)
		if itemID == "" {
			return fmt.Errorf("itemId is required")
		}
		if input.Quantity <= 0 {
			return fmt.Errorf("quantity must be positive")
		}
		if _, exists := seen[itemID]; exists {
			return fmt.Errorf("duplicate item code allocations are not allowed")
		}
		seen[itemID] = struct{}{}

		var allocation partnerOrderStockAllocation
		if err := tx.QueryRow(ctx, `
			select i.item_id, i.catalog_item_id, c.brand_id, c.name, c.sku,
			       i.mrp::float8, i.discount_percentage::float8, i.quantity
			from partner_firm_inventory_items i
			join partner_product_catalog c on c.id = i.catalog_item_id
			join partner_firm_brands fb on fb.brand_id = c.brand_id and fb.firm_id = i.firm_id
			where i.firm_id = $1::bigint and i.item_id = $2 and i.status = 'ACTIVE'
			for update
		`, firmID, itemID).Scan(
			&allocation.ItemID,
			&allocation.CatalogItemID,
			&allocation.BrandID,
			&allocation.ItemName,
			&allocation.ItemCode,
			&allocation.MRP,
			&allocation.DiscountPercentage,
			&allocation.AvailableQuantity,
		); err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return fmt.Errorf("stock item code not found")
			}
			return err
		}
		if _, ok := requiredByCatalog[allocation.CatalogItemID]; !ok {
			return fmt.Errorf("stock item code %s does not belong to this order", allocation.ItemCode)
		}
		if input.Quantity > allocation.AvailableQuantity {
			return fmt.Errorf("only %d available for %s", allocation.AvailableQuantity, allocation.ItemCode)
		}
		allocation.Quantity = input.Quantity
		allocatedByCatalog[allocation.CatalogItemID] += input.Quantity
		if allocatedByCatalog[allocation.CatalogItemID] > requiredByCatalog[allocation.CatalogItemID] {
			requested := lineByCatalog[allocation.CatalogItemID]
			return fmt.Errorf("allocated quantity exceeds requested quantity for %s", requested.ItemName)
		}
		allocations = append(allocations, allocation)
	}

	if _, err := tx.Exec(ctx, `
		delete from partner_order_items
		where firm_id = $1::bigint and order_id = $2
	`, firmID, orderID); err != nil {
		return err
	}
	if _, err := tx.Exec(ctx, `
		delete from partner_order_billable_lines
		where firm_id = $1::bigint and order_id = $2
	`, firmID, orderID); err != nil {
		return err
	}
	if _, err := tx.Exec(ctx, `
		delete from partner_unfulfilled_order_items
		where firm_id = $1::bigint and source_order_id = $2
	`, firmID, orderID); err != nil {
		return err
	}
	billableByKey := map[string]*partnerOrderBillableDraft{}
	billableByAllocationItemID := map[string]string{}
	for _, allocation := range allocations {
		requested := lineByCatalog[allocation.CatalogItemID]
		sellerMargin := requested.DiscountPercentage
		rate := allocation.MRP * (1 - sellerMargin/100)
		key := fmt.Sprintf("%s|%.2f|%.2f", allocation.CatalogItemID, allocation.MRP, sellerMargin)
		billable, ok := billableByKey[key]
		if !ok {
			billable = &partnerOrderBillableDraft{
				ID:                     nextID("pobl"),
				CatalogItemID:          allocation.CatalogItemID,
				ItemCode:               requested.ItemCode,
				ItemName:               requested.ItemName,
				MRP:                    allocation.MRP,
				SellerMarginPercentage: sellerMargin,
				Rate:                   rate,
			}
			billableByKey[key] = billable
		}
		billable.Quantity += allocation.Quantity
		billable.LineTotal += float64(allocation.Quantity) * rate
		billableByAllocationItemID[allocation.ItemID] = billable.ID
	}
	for _, billable := range billableByKey {
		if _, err := tx.Exec(ctx, `
			insert into partner_order_billable_lines (
				id, firm_id, order_id, catalog_item_id, item_code, item_name,
				mrp, seller_margin_percentage, quantity, rate, line_total
			) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		`, billable.ID, firmID, orderID, billable.CatalogItemID, billable.ItemCode, billable.ItemName, billable.MRP, billable.SellerMarginPercentage, billable.Quantity, billable.Rate, billable.LineTotal); err != nil {
			return err
		}
	}
	for _, allocation := range allocations {
		if err := s.updatePartnerInventoryQuantityTx(
			ctx,
			tx,
			firmID,
			allocation.ItemID,
			allocation.AvailableQuantity,
			allocation.AvailableQuantity-allocation.Quantity,
			"Order confirmed: "+orderID,
		); err != nil {
			return err
		}
		if _, err := tx.Exec(ctx, `
			insert into partner_order_items (id, firm_id, order_id, billable_line_id, item_id, item_code, item_name, unit, quantity, mrp, discount_percentage)
			values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		`, nextID("poitem"), firmID, orderID, billableByAllocationItemID[allocation.ItemID], allocation.ItemID, allocation.ItemCode, allocation.ItemName, "", allocation.Quantity, allocation.MRP, allocation.DiscountPercentage); err != nil {
			return err
		}
	}
	for _, line := range requestedLines {
		fulfilled := allocatedByCatalog[line.CatalogItemID]
		openQuantity := line.RequestedQuantity - fulfilled
		if openQuantity > 0 {
			if _, err := tx.Exec(ctx, `
				insert into partner_unfulfilled_order_items (
					id, firm_id, client_business_id, client_outlet_id, source_order_id, source_order_line_id,
					brand_id, catalog_item_id, item_code, item_name, requested_quantity, fulfilled_quantity,
					open_quantity, status, reason
				) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'OPEN', 'INSUFFICIENT_STOCK')
			`, nextID("puoi"), firmID, clientBusinessID, clientOutletID, orderID, line.ID, line.BrandID, line.CatalogItemID, line.ItemCode, line.ItemName, line.RequestedQuantity, fulfilled, openQuantity); err != nil {
				return err
			}
		}
		if fulfilled > 0 {
			if err := clearPartnerUnfulfilledDemandTx(ctx, tx, firmID, clientBusinessID, clientOutletID, line.CatalogItemID, orderID, fulfilled); err != nil {
				return err
			}
		}
	}

	return nil
}

func loadPartnerOrderRequestedLinesTx(ctx context.Context, tx pgx.Tx, firmID, orderID string) ([]partnerOrderRequestedLine, error) {
	rows, err := tx.Query(ctx, `
		select id, brand_id, catalog_item_id, item_code, item_name, unit, requested_quantity,
		       mrp::float8, discount_percentage::float8
		from partner_order_requested_items
		where firm_id = $1::bigint and order_id = $2
		order by created_at asc
		for update
	`, firmID, orderID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var lines []partnerOrderRequestedLine
	for rows.Next() {
		var line partnerOrderRequestedLine
		if err := rows.Scan(
			&line.ID, &line.BrandID, &line.CatalogItemID, &line.ItemCode, &line.ItemName, &line.Unit,
			&line.RequestedQuantity, &line.MRP, &line.DiscountPercentage,
		); err != nil {
			return nil, err
		}
		lines = append(lines, line)
	}
	return lines, rows.Err()
}

func clearPartnerUnfulfilledDemandTx(ctx context.Context, tx pgx.Tx, firmID, clientBusinessID, clientOutletID, catalogItemID, clearingOrderID string, quantity int) error {
	if quantity <= 0 {
		return nil
	}
	type unfulfilledDemandRow struct {
		ID           string
		OpenQuantity int
	}
	rows, err := tx.Query(ctx, `
		select id, open_quantity
		from partner_unfulfilled_order_items
		where firm_id = $1::bigint
		  and client_business_id = $2
		  and client_outlet_id = $3
		  and catalog_item_id = $4
		  and source_order_id <> $5
		  and status in ('OPEN', 'PARTIALLY_CLEARED')
		  and open_quantity > 0
		order by created_at asc
		for update
	`, firmID, clientBusinessID, clientOutletID, catalogItemID, clearingOrderID)
	if err != nil {
		return err
	}
	demandRows := []unfulfilledDemandRow{}
	for rows.Next() {
		var row unfulfilledDemandRow
		if err := rows.Scan(&row.ID, &row.OpenQuantity); err != nil {
			rows.Close()
			return err
		}
		demandRows = append(demandRows, row)
	}
	if err := rows.Err(); err != nil {
		rows.Close()
		return err
	}
	rows.Close()

	remaining := quantity
	for _, row := range demandRows {
		if remaining <= 0 {
			continue
		}
		cleared := row.OpenQuantity
		if cleared > remaining {
			cleared = remaining
		}
		nextOpen := row.OpenQuantity - cleared
		status := "PARTIALLY_CLEARED"
		if nextOpen == 0 {
			status = "CLEARED"
		}
		if _, err := tx.Exec(ctx, `
			update partner_unfulfilled_order_items
			set fulfilled_quantity = fulfilled_quantity + $2,
			    open_quantity = $3,
			    status = $4,
			    cleared_at = case when $4 = 'CLEARED' then now() else cleared_at end,
			    updated_at = now()
			where firm_id = $1::bigint and id = $5
		`, firmID, cleared, nextOpen, status, row.ID); err != nil {
			return err
		}
		remaining -= cleared
	}
	return nil
}

func partnerOrderTransitionQuantities(inputs []CreatePartnerOrderLineInput) (map[string]int, error) {
	if len(inputs) == 0 {
		return nil, nil
	}
	quantities := map[string]int{}
	for _, input := range inputs {
		itemID := strings.TrimSpace(input.ItemID)
		if itemID == "" {
			return nil, fmt.Errorf("itemId is required")
		}
		if input.Quantity < 0 {
			return nil, fmt.Errorf("quantity cannot be negative")
		}
		if _, exists := quantities[itemID]; exists {
			return nil, fmt.Errorf("duplicate items are not allowed")
		}
		quantities[itemID] = input.Quantity
	}
	return quantities, nil
}

func partnerOrderTransitionLineKey(orderItemID, itemID string) string {
	if strings.TrimSpace(orderItemID) != "" {
		return "order:" + strings.TrimSpace(orderItemID)
	}
	return "item:" + strings.TrimSpace(itemID)
}

func indexPartnerOrderTransitionLines(lines []partnerOrderTransitionLine) map[string]partnerOrderTransitionLine {
	index := map[string]partnerOrderTransitionLine{}
	for _, line := range lines {
		index["order:"+line.ID] = line
		index["item:"+line.ItemID] = line
	}
	return index
}

func packPartnerOrderTx(ctx context.Context, tx pgx.Tx, firmID, orderID string, lines []partnerOrderTransitionLine, inputs []PartnerOrderPackedItemInput) error {
	lineByKey := indexPartnerOrderTransitionLines(lines)
	targetByLineID := map[string]PartnerOrderPackedItemInput{}
	if len(inputs) == 0 {
		for _, line := range lines {
			targetByLineID[line.ID] = PartnerOrderPackedItemInput{OrderItemID: line.ID, PackedQuantity: line.Quantity}
		}
	} else {
		for _, input := range inputs {
			key := partnerOrderTransitionLineKey(input.OrderItemID, input.ItemID)
			line, ok := lineByKey[key]
			if !ok {
				return fmt.Errorf("packed item does not belong to this order")
			}
			if _, exists := targetByLineID[line.ID]; exists {
				return fmt.Errorf("duplicate packed item rows are not allowed")
			}
			targetByLineID[line.ID] = input
		}
	}
	for _, line := range lines {
		input, ok := targetByLineID[line.ID]
		if !ok {
			input = PartnerOrderPackedItemInput{OrderItemID: line.ID, PackedQuantity: line.Quantity}
		}
		if input.PackedQuantity < 0 {
			return fmt.Errorf("packed quantity cannot be negative for %s", line.ItemName)
		}
		if input.PackedQuantity > line.Quantity {
			return fmt.Errorf("packed quantity exceeds allocated quantity for %s", line.ItemName)
		}
		shortReason := strings.TrimSpace(input.ShortReason)
		if input.PackedQuantity < line.Quantity && shortReason == "" {
			return fmt.Errorf("short reason is required for %s", line.ItemName)
		}
		if _, err := tx.Exec(ctx, `
			update partner_order_items
			set packed_quantity = $3,
			    short_reason = nullif($4, '')
			where firm_id = $1::bigint and order_id = $2 and id = $5
		`, firmID, orderID, input.PackedQuantity, shortReason, line.ID); err != nil {
			return err
		}
	}
	return nil
}

func markPartnerOrderDeliveredTx(ctx context.Context, tx pgx.Tx, firmID, orderID string, lines []partnerOrderTransitionLine, quantities map[string]int, nextStatus string) error {
	if nextStatus == "PARTIALLY_DELIVERED" && len(quantities) == 0 {
		return fmt.Errorf("delivered item quantities are required for partial delivery")
	}
	anyDelivered := false
	anyShort := false
	for _, line := range lines {
		target := line.DispatchedQuantity - line.ReturnedQuantity
		if target < 0 {
			target = 0
		}
		if quantities != nil {
			value, ok := quantities[line.ItemID]
			if !ok {
				value = line.DeliveredQuantity
			}
			target = value
		}
		maxDeliverable := line.DispatchedQuantity - line.ReturnedQuantity
		if target < line.DeliveredQuantity {
			return fmt.Errorf("delivered quantity cannot be reduced for %s", line.ItemName)
		}
		if target > maxDeliverable {
			return fmt.Errorf("delivered quantity exceeds dispatched quantity for %s", line.ItemName)
		}
		if target > 0 {
			anyDelivered = true
		}
		if target < maxDeliverable {
			anyShort = true
		}
		if _, err := tx.Exec(ctx, `
			update partner_order_items
			set delivered_quantity = $3
			where firm_id = $1::bigint and order_id = $2 and item_id = $4
		`, firmID, orderID, target, line.ItemID); err != nil {
			return err
		}
	}
	if !anyDelivered {
		return fmt.Errorf("at least one item must be delivered")
	}
	if nextStatus == "DELIVERED" && anyShort {
		return fmt.Errorf("all dispatched quantities must be delivered")
	}
	if nextStatus == "PARTIALLY_DELIVERED" && !anyShort {
		return fmt.Errorf("use DELIVERED when all dispatched quantities are delivered")
	}
	return nil
}

func markPartnerOrderDeliveredWithInputTx(ctx context.Context, tx pgx.Tx, firmID, orderID string, lines []partnerOrderTransitionLine, details PartnerOrderDeliveryDetailsInput, inputs []PartnerOrderDeliveredItemInput, nextStatus string) error {
	if len(inputs) == 0 {
		return markPartnerOrderDeliveredTx(ctx, tx, firmID, orderID, lines, nil, nextStatus)
	}
	lineByKey := indexPartnerOrderTransitionLines(lines)
	inputByLineID := map[string]PartnerOrderDeliveredItemInput{}
	for _, input := range inputs {
		line, ok := lineByKey[partnerOrderTransitionLineKey(input.OrderItemID, input.ItemID)]
		if !ok {
			return fmt.Errorf("delivered item does not belong to this order")
		}
		if _, exists := inputByLineID[line.ID]; exists {
			return fmt.Errorf("duplicate delivered item rows are not allowed")
		}
		inputByLineID[line.ID] = input
	}
	anyDelivered := false
	anyShort := false
	for _, line := range lines {
		input, ok := inputByLineID[line.ID]
		targetDelivered := line.DispatchedQuantity - line.ReturnedQuantity
		targetReturned := line.ReturnedQuantity
		if ok {
			targetDelivered = input.DeliveredQuantity
			targetReturned = input.ReturnedQuantity
		}
		if targetDelivered < line.DeliveredQuantity {
			return fmt.Errorf("delivered quantity cannot be reduced for %s", line.ItemName)
		}
		if targetReturned < line.ReturnedQuantity {
			return fmt.Errorf("returned quantity cannot be reduced for %s", line.ItemName)
		}
		if targetDelivered < 0 || targetReturned < 0 {
			return fmt.Errorf("quantities cannot be negative for %s", line.ItemName)
		}
		if targetDelivered+targetReturned > line.DispatchedQuantity {
			return fmt.Errorf("delivered and returned quantities exceed dispatched quantity for %s", line.ItemName)
		}
		if targetDelivered > 0 {
			anyDelivered = true
		}
		if targetDelivered+targetReturned < line.DispatchedQuantity {
			anyShort = true
		}
		if _, err := tx.Exec(ctx, `
			update partner_order_items
			set delivered_quantity = $3,
			    returned_quantity = $4
			where firm_id = $1::bigint and order_id = $2 and id = $5
		`, firmID, orderID, targetDelivered, targetReturned, line.ID); err != nil {
			return err
		}
	}
	if !anyDelivered {
		return fmt.Errorf("at least one item must be delivered")
	}
	if nextStatus == "DELIVERED" && anyShort {
		return fmt.Errorf("all dispatched quantities must be delivered or returned")
	}
	if _, err := tx.Exec(ctx, `
		update partner_orders
		set delivered_date = nullif($3, '')::date,
		    delivery_recipient_name = nullif($4, ''),
		    delivery_proof_reference = nullif($5, ''),
		    delivery_notes = nullif($6, ''),
		    updated_at = now()
		where firm_id = $1::bigint and id = $2
	`, firmID, orderID, strings.TrimSpace(details.DeliveredDate), strings.TrimSpace(details.RecipientName), strings.TrimSpace(details.ProofReference), strings.TrimSpace(details.Notes)); err != nil {
		return err
	}
	return nil
}

func (s *Store) dispatchPartnerOrderTx(ctx context.Context, tx pgx.Tx, firmID, orderID string, lines []partnerOrderTransitionLine, details PartnerOrderDispatchDetailsInput, inputs []PartnerOrderDispatchedItemInput) error {
	lineByKey := indexPartnerOrderTransitionLines(lines)
	inputByLineID := map[string]PartnerOrderDispatchedItemInput{}
	for _, input := range inputs {
		line, ok := lineByKey[partnerOrderTransitionLineKey(input.OrderItemID, input.ItemID)]
		if !ok {
			return fmt.Errorf("dispatched item does not belong to this order")
		}
		if _, exists := inputByLineID[line.ID]; exists {
			return fmt.Errorf("duplicate dispatched item rows are not allowed")
		}
		inputByLineID[line.ID] = input
	}
	anyDispatched := false
	for _, line := range lines {
		if line.DispatchedQuantity > 0 {
			return fmt.Errorf("order line %s is already dispatched", line.ItemName)
		}
		maxDispatchable := line.PackedQuantity
		if maxDispatchable == 0 {
			maxDispatchable = line.Quantity
		}
		target := maxDispatchable
		if input, ok := inputByLineID[line.ID]; ok {
			target = input.DispatchedQuantity
		}
		if target < 0 {
			return fmt.Errorf("dispatch quantity cannot be negative for %s", line.ItemName)
		}
		if target > maxDispatchable {
			return fmt.Errorf("dispatch quantity exceeds packed quantity for %s", line.ItemName)
		}
		if target > 0 {
			anyDispatched = true
		}
		if _, err := tx.Exec(ctx, `
			update partner_order_items
			set dispatched_quantity = $3
			where firm_id = $1::bigint and order_id = $2 and id = $4
		`, firmID, orderID, target, line.ID); err != nil {
			return err
		}
	}
	if !anyDispatched {
		return fmt.Errorf("at least one item must be dispatched")
	}
	if _, err := tx.Exec(ctx, `
		update partner_orders
		set dispatch_date = nullif($3, '')::date,
		    transport_name = nullif($4, ''),
		    vehicle_number = nullif($5, ''),
		    driver_phone = nullif($6, ''),
		    dispatch_notes = nullif($7, ''),
		    updated_at = now()
		where firm_id = $1::bigint and id = $2
	`, firmID, orderID, strings.TrimSpace(details.DispatchDate), strings.TrimSpace(details.TransportName), strings.TrimSpace(details.VehicleNumber), strings.TrimSpace(details.DriverPhone), strings.TrimSpace(details.Notes)); err != nil {
		return err
	}
	return nil
}

type partnerOrderInventoryRow struct {
	ItemID   string
	Quantity int
}

func (s *Store) returnPartnerOrderTx(ctx context.Context, tx pgx.Tx, firmID, orderID string, lines []partnerOrderTransitionLine, quantities map[string]int, requestedStatus, note string) (string, error) {
	if requestedStatus == "PARTIALLY_RETURNED" && len(quantities) == 0 {
		return "", fmt.Errorf("returned item quantities are required for partial return")
	}
	allReturned := true
	anyReturned := false
	for _, line := range lines {
		target := line.DispatchedQuantity
		if quantities != nil {
			value, ok := quantities[line.ItemID]
			if !ok {
				value = line.ReturnedQuantity
			}
			target = value
		}
		if target < line.ReturnedQuantity {
			return "", fmt.Errorf("returned quantity cannot be reduced for %s", line.ItemName)
		}
		if target > line.DispatchedQuantity {
			return "", fmt.Errorf("returned quantity exceeds dispatched quantity for %s", line.ItemName)
		}
		delta := target - line.ReturnedQuantity
		if delta > 0 {
			anyReturned = true
			if err := s.applyPartnerOrderInventoryDeltaTx(ctx, tx, firmID, line.ItemID, delta, firstNonEmpty(strings.TrimSpace(note), "Order return: "+orderID)); err != nil {
				return "", err
			}
		}
		if target < line.DispatchedQuantity {
			allReturned = false
		}
		if _, err := tx.Exec(ctx, `
			update partner_order_items
			set returned_quantity = $3
			where firm_id = $1::bigint and order_id = $2 and item_id = $4
		`, firmID, orderID, target, line.ItemID); err != nil {
			return "", err
		}
	}
	if !anyReturned && requestedStatus == "PARTIALLY_RETURNED" {
		return "", fmt.Errorf("at least one returned quantity is required")
	}
	if requestedStatus == "RETURNED" && !allReturned {
		return "", fmt.Errorf("all dispatched quantities must be returned")
	}
	if allReturned {
		return "RETURNED", nil
	}
	return "PARTIALLY_RETURNED", nil
}

type partnerOrderReturnLineRow struct {
	OrderItemID     string
	ItemID          string
	ItemName        string
	DispatchedQty   int
	ReturnedQty     int
	InvoiceLineID   string
	Rate            float64
	InvoiceItemCode string
	InvoiceItemName string
	RequestedQty    int
	RequestedReason string
	CreditAmount    float64
}

func (s *Store) GetPartnerOrderReturns(firmID, orderID string) ([]PartnerSalesReturn, error) {
	ctx := context.Background()
	rows, err := s.pool.Query(ctx, `
		select
			r.id, r.firm_id, r.return_number, r.order_id, coalesce(o.order_number, ''),
			r.invoice_id, coalesce(i.invoice_number, ''), coalesce(r.credit_note_id, ''), coalesce(cn.credit_note_number, ''),
			r.client_business_id, b.business_name, r.client_outlet_id, coalesce(co.outlet_name, ''),
			r.return_date::text, r.status, coalesce(r.notes, ''),
			to_char(r.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), coalesce(u.name, ''),
			coalesce(to_char(r.cancelled_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), '')
		from partner_sales_returns r
		join partner_orders o on o.firm_id = r.firm_id and o.id = r.order_id
		join partner_invoices i on i.firm_id = r.firm_id and i.id = r.invoice_id
		left join partner_credit_notes cn on cn.firm_id = r.firm_id and cn.id = r.credit_note_id
		join partner_client_businesses b on b.firm_id = r.firm_id and b.id = r.client_business_id
		join partner_client_outlets co on co.firm_id = r.firm_id and co.client_business_id = r.client_business_id and co.id = r.client_outlet_id
		left join users u on u.id = r.created_by
		where r.firm_id = $1::bigint and r.order_id = $2
		order by r.return_date desc, r.created_at desc
	`, firmID, orderID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := []PartnerSalesReturn{}
	indexByID := map[string]int{}
	for rows.Next() {
		var item PartnerSalesReturn
		if err := rows.Scan(
			&item.ID, &item.FirmID, &item.ReturnNumber, &item.OrderID, &item.OrderNumber,
			&item.InvoiceID, &item.InvoiceNumber, &item.CreditNoteID, &item.CreditNoteNumber,
			&item.ClientBusinessID, &item.ClientBusinessName, &item.ClientOutletID, &item.ClientOutletName,
			&item.ReturnDate, &item.Status, &item.Notes, &item.CreatedAt, &item.CreatedByName, &item.CancelledAt,
		); err != nil {
			return nil, err
		}
		item.Lines = []PartnerSalesReturnLine{}
		items = append(items, item)
		indexByID[item.ID] = len(items) - 1
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	if len(items) == 0 {
		return []PartnerSalesReturn{}, nil
	}
	lineRows, err := s.pool.Query(ctx, `
		select id, sales_return_id, order_item_id, coalesce(invoice_line_id, ''), item_id, item_name,
		       returned_quantity, accepted_quantity, credit_amount::float8, coalesce(reason, '')
		from partner_sales_return_lines
		where firm_id = $1::bigint
		order by created_at asc
	`, firmID)
	if err != nil {
		return nil, err
	}
	defer lineRows.Close()
	for lineRows.Next() {
		var line PartnerSalesReturnLine
		if err := lineRows.Scan(
			&line.ID, &line.SalesReturnID, &line.OrderItemID, &line.InvoiceLineID, &line.ItemID, &line.ItemName,
			&line.ReturnedQuantity, &line.AcceptedQuantity, &line.CreditAmount, &line.Reason,
		); err != nil {
			return nil, err
		}
		idx, ok := indexByID[line.SalesReturnID]
		if !ok {
			continue
		}
		items[idx].Lines = append(items[idx].Lines, line)
		items[idx].TotalQuantity += line.AcceptedQuantity
		items[idx].TotalCreditAmount += line.CreditAmount
	}
	return items, lineRows.Err()
}

func (s *Store) CreatePartnerOrderReturn(firmID, orderID string, input CreatePartnerOrderReturnInput) (CreatePartnerOrderReturnResponse, error) {
	ctx := context.Background()
	returnDate := strings.TrimSpace(input.ReturnDate)
	if returnDate == "" {
		returnDate = time.Now().UTC().Format("2006-01-02")
	}
	returnNote := strings.TrimSpace(input.Note)
	if returnNote == "" {
		return CreatePartnerOrderReturnResponse{}, fmt.Errorf("return note is required")
	}
	if len(input.Lines) == 0 {
		return CreatePartnerOrderReturnResponse{}, fmt.Errorf("return lines are required")
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return CreatePartnerOrderReturnResponse{}, err
	}
	defer tx.Rollback(ctx)

	var orderStatus, clientBusinessID, clientOutletID string
	if err := tx.QueryRow(ctx, `
		select status, client_business_id, client_outlet_id
		from partner_orders
		where firm_id = $1::bigint and id = $2
		for update
	`, firmID, orderID).Scan(&orderStatus, &clientBusinessID, &clientOutletID); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return CreatePartnerOrderReturnResponse{}, fmt.Errorf("order not found")
		}
		return CreatePartnerOrderReturnResponse{}, err
	}
	switch orderStatus {
	case "DISPATCHED", "DELIVERED", "PARTIALLY_DELIVERED", "PARTIALLY_RETURNED":
	default:
		return CreatePartnerOrderReturnResponse{}, fmt.Errorf("returns can only be created after dispatch")
	}

	var invoiceID, invoiceNumber, invoiceStatus string
	var invoiceAmount float64
	if err := tx.QueryRow(ctx, `
		select id, invoice_number, status, amount::float8
		from partner_invoices
		where firm_id = $1::bigint and order_id = $2 and status <> 'CANCELLED'
		order by created_at desc
		limit 1
		for update
	`, firmID, orderID).Scan(&invoiceID, &invoiceNumber, &invoiceStatus, &invoiceAmount); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return CreatePartnerOrderReturnResponse{}, fmt.Errorf("issued invoice is required before creating a return")
		}
		return CreatePartnerOrderReturnResponse{}, err
	}
	if invoiceStatus != "FINALIZED" {
		return CreatePartnerOrderReturnResponse{}, fmt.Errorf("finalized invoice is required before creating a return")
	}

	lineByID := map[string]*partnerOrderReturnLineRow{}
	rows, err := tx.Query(ctx, `
		select
			oi.id, oi.item_id, oi.item_name, oi.dispatched_quantity, oi.returned_quantity,
			coalesce(ii.id, ''), coalesce(nullif(ii.rate, 0), bl.rate, 0)::float8,
			coalesce(ii.item_code, oi.item_code), coalesce(ii.item_name, oi.item_name)
		from partner_order_items oi
		left join partner_order_billable_lines bl
			on bl.firm_id = oi.firm_id and bl.order_id = oi.order_id and bl.id = oi.billable_line_id
		left join partner_invoice_items ii
			on ii.firm_id = oi.firm_id
			and ii.invoice_id = $3
			and (
				(coalesce(oi.billable_line_id, '') <> '' and ii.order_billable_line_id = oi.billable_line_id)
				or (coalesce(oi.billable_line_id, '') = '' and ii.item_id = oi.item_id)
			)
		where oi.firm_id = $1::bigint and oi.order_id = $2
		for update of oi
	`, firmID, orderID, invoiceID)
	if err != nil {
		return CreatePartnerOrderReturnResponse{}, err
	}
	for rows.Next() {
		var line partnerOrderReturnLineRow
		if err := rows.Scan(
			&line.OrderItemID, &line.ItemID, &line.ItemName, &line.DispatchedQty, &line.ReturnedQty,
			&line.InvoiceLineID, &line.Rate, &line.InvoiceItemCode, &line.InvoiceItemName,
		); err != nil {
			rows.Close()
			return CreatePartnerOrderReturnResponse{}, err
		}
		lineByID[line.OrderItemID] = &line
	}
	if err := rows.Err(); err != nil {
		rows.Close()
		return CreatePartnerOrderReturnResponse{}, err
	}
	rows.Close()

	selected := []*partnerOrderReturnLineRow{}
	seen := map[string]struct{}{}
	for _, reqLine := range input.Lines {
		orderItemID := strings.TrimSpace(reqLine.OrderItemID)
		if orderItemID == "" {
			return CreatePartnerOrderReturnResponse{}, fmt.Errorf("orderItemId is required")
		}
		if _, exists := seen[orderItemID]; exists {
			return CreatePartnerOrderReturnResponse{}, fmt.Errorf("duplicate return lines are not allowed")
		}
		seen[orderItemID] = struct{}{}
		if reqLine.Quantity <= 0 {
			return CreatePartnerOrderReturnResponse{}, fmt.Errorf("return quantity must be positive")
		}
		line, ok := lineByID[orderItemID]
		if !ok {
			return CreatePartnerOrderReturnResponse{}, fmt.Errorf("return line does not belong to this order")
		}
		available := line.DispatchedQty - line.ReturnedQty
		if reqLine.Quantity > available {
			return CreatePartnerOrderReturnResponse{}, fmt.Errorf("only %d can be returned for %s", available, line.ItemName)
		}
		if line.Rate <= 0 {
			return CreatePartnerOrderReturnResponse{}, fmt.Errorf("invoice rate is missing for %s", line.ItemName)
		}
		line.RequestedQty = reqLine.Quantity
		line.RequestedReason = returnNote
		line.CreditAmount = math.Round(float64(reqLine.Quantity)*line.Rate*100) / 100
		selected = append(selected, line)
	}
	if len(selected) == 0 {
		return CreatePartnerOrderReturnResponse{}, fmt.Errorf("return lines are required")
	}

	returnID := nextID("psr")
	var returnNumber string
	if err := tx.QueryRow(ctx, `
		select 'SR-' || lpad((coalesce(count(*), 0) + 1001)::text, 4, '0')
		from partner_sales_returns
		where firm_id = $1::bigint
	`, firmID).Scan(&returnNumber); err != nil {
		return CreatePartnerOrderReturnResponse{}, err
	}
	if _, err := tx.Exec(ctx, `
		insert into partner_sales_returns (
			id, firm_id, return_number, order_id, invoice_id, client_business_id, client_outlet_id,
			return_date, status, notes, created_by
		) values ($1, $2, $3, $4, $5, $6, $7, $8::date, 'ISSUED', nullif($9, ''), $10)
	`, returnID, firmID, returnNumber, orderID, invoiceID, clientBusinessID, clientOutletID, returnDate, returnNote, s.currentUserID); err != nil {
		return CreatePartnerOrderReturnResponse{}, err
	}

	creditNoteID := nextID("pcn")
	var creditNoteNumber string
	if err := tx.QueryRow(ctx, `
		select 'CN-' || lpad((coalesce(count(*), 0) + 1001)::text, 4, '0')
		from partner_credit_notes
		where firm_id = $1::bigint
	`, firmID).Scan(&creditNoteNumber); err != nil {
		return CreatePartnerOrderReturnResponse{}, err
	}

	var totalCredit float64
	for _, line := range selected {
		totalCredit += line.CreditAmount
		if _, err := tx.Exec(ctx, `
			insert into partner_sales_return_lines (
				id, firm_id, sales_return_id, order_item_id, invoice_line_id, item_id, item_name,
				returned_quantity, accepted_quantity, credit_amount, reason
			) values ($1, $2, $3, $4, nullif($5, ''), $6, $7, $8, $8, $9, nullif($10, ''))
		`, nextID("psrl"), firmID, returnID, line.OrderItemID, line.InvoiceLineID, line.ItemID, line.ItemName, line.RequestedQty, line.CreditAmount, line.RequestedReason); err != nil {
			return CreatePartnerOrderReturnResponse{}, err
		}
		if err := s.applyPartnerOrderInventoryDeltaTx(ctx, tx, firmID, line.ItemID, line.RequestedQty, returnNote); err != nil {
			return CreatePartnerOrderReturnResponse{}, err
		}
		if _, err := tx.Exec(ctx, `
			update partner_order_items
			set returned_quantity = returned_quantity + $3
			where firm_id = $1::bigint and id = $2
		`, firmID, line.OrderItemID, line.RequestedQty); err != nil {
			return CreatePartnerOrderReturnResponse{}, err
		}
	}
	var existingCredits, existingDebits float64
	if err := tx.QueryRow(ctx, `select coalesce(sum(total_amount), 0)::float8 from partner_credit_notes where firm_id = $1::bigint and related_invoice_id = $2 and status = 'ISSUED'`, firmID, invoiceID).Scan(&existingCredits); err != nil {
		return CreatePartnerOrderReturnResponse{}, err
	}
	if err := tx.QueryRow(ctx, `select coalesce(sum(total_amount), 0)::float8 from partner_debit_notes where firm_id = $1::bigint and related_invoice_id = $2 and status = 'ISSUED'`, firmID, invoiceID).Scan(&existingDebits); err != nil {
		return CreatePartnerOrderReturnResponse{}, err
	}
	if roundCurrency(totalCredit) > math.Max(roundCurrency(invoiceAmount-existingCredits+existingDebits), 0) {
		return CreatePartnerOrderReturnResponse{}, fmt.Errorf("return credit cannot exceed invoice balance")
	}

	if _, err := tx.Exec(ctx, `
		insert into partner_credit_notes (
			id, firm_id, client_business_id, client_outlet_id, related_invoice_id, sales_return_id,
			credit_note_number, credit_date, note, status, has_stock_return, total_amount, created_by
		) values ($1, $2, $3, $4, $5, $6, $7, $8::date, nullif($9, ''), 'ISSUED', true, $10, $11)
	`, creditNoteID, firmID, clientBusinessID, clientOutletID, invoiceID, returnID, creditNoteNumber, returnDate, returnNote, totalCredit, s.currentUserID); err != nil {
		return CreatePartnerOrderReturnResponse{}, err
	}
	for _, line := range selected {
		if _, err := tx.Exec(ctx, `
			insert into partner_credit_note_lines (
				id, firm_id, credit_note_id, item_id, item_name, quantity, amount, reference_invoice_line_id
			) values ($1, $2, $3, $4, $5, $6, $7, nullif($8, ''))
		`, nextID("pcnl"), firmID, creditNoteID, line.ItemID, line.ItemName, line.RequestedQty, line.CreditAmount, line.InvoiceLineID); err != nil {
			return CreatePartnerOrderReturnResponse{}, err
		}
	}
	if _, err := tx.Exec(ctx, `
		update partner_sales_returns
		set credit_note_id = $3
		where firm_id = $1::bigint and id = $2
	`, firmID, returnID, creditNoteID); err != nil {
		return CreatePartnerOrderReturnResponse{}, err
	}

	resolvedStatus, err := resolvePartnerOrderJourneyStatusAfterReturnTx(ctx, tx, firmID, orderID)
	if err != nil {
		return CreatePartnerOrderReturnResponse{}, err
	}
	nextStatus := orderStatus
	if resolvedStatus == "RETURNED" {
		nextStatus = "RETURNED"
	} else if orderStatus == "PARTIALLY_RETURNED" || orderStatus == "RETURNED" {
		nextStatus = resolvedStatus
	}
	if _, err := tx.Exec(ctx, `
		update partner_orders
		set status = $3,
		    updated_at = now()
		where firm_id = $1::bigint and id = $2
	`, firmID, orderID, nextStatus); err != nil {
		return CreatePartnerOrderReturnResponse{}, err
	}

	if err := s.insertPartnerAuditLogTx(ctx, tx, firmID, "SALES_RETURN", returnID, "CREATE", nil, map[string]any{
		"returnNumber":     returnNumber,
		"creditNoteNumber": creditNoteNumber,
		"totalAmount":      totalCredit,
	}); err != nil {
		return CreatePartnerOrderReturnResponse{}, err
	}
	if err := s.insertPartnerAuditLogTx(ctx, tx, firmID, "CREDIT_NOTE", creditNoteID, "CREATE", nil, map[string]any{
		"creditNoteNumber": creditNoteNumber,
		"relatedInvoiceID": invoiceID,
		"salesReturnID":    returnID,
		"totalAmount":      totalCredit,
	}); err != nil {
		return CreatePartnerOrderReturnResponse{}, err
	}
	if err := s.insertPartnerClientLedgerEntryTx(ctx, tx, firmID, clientBusinessID, returnDate, "CREDIT_NOTE", creditNoteID, creditNoteNumber, "Credit note issued for return", 0, totalCredit); err != nil {
		return CreatePartnerOrderReturnResponse{}, err
	}
	if err := s.insertPartnerAuditLogTx(ctx, tx, firmID, "ORDER", orderID, "RETURN", map[string]any{
		"status": orderStatus,
	}, map[string]any{
		"status":           nextStatus,
		"returnNumber":     returnNumber,
		"creditNoteNumber": creditNoteNumber,
	}); err != nil {
		return CreatePartnerOrderReturnResponse{}, err
	}
	if err := tx.Commit(ctx); err != nil {
		return CreatePartnerOrderReturnResponse{}, err
	}

	returns, err := s.GetPartnerOrderReturns(firmID, orderID)
	if err != nil {
		return CreatePartnerOrderReturnResponse{}, err
	}
	var salesReturn PartnerSalesReturn
	for _, item := range returns {
		if item.ID == returnID {
			salesReturn = item
			break
		}
	}
	if salesReturn.ID == "" {
		return CreatePartnerOrderReturnResponse{}, fmt.Errorf("sales return not found")
	}
	creditNotes, err := s.GetPartnerCreditNotes(firmID)
	if err != nil {
		return CreatePartnerOrderReturnResponse{}, err
	}
	var creditNote PartnerCreditNote
	for _, item := range creditNotes {
		if item.ID == creditNoteID {
			creditNote = item
			break
		}
	}
	if creditNote.ID == "" {
		return CreatePartnerOrderReturnResponse{}, fmt.Errorf("credit note not found")
	}
	order, err := s.GetPartnerOrderByID(firmID, orderID)
	if err != nil {
		return CreatePartnerOrderReturnResponse{}, err
	}
	_ = invoiceNumber
	return CreatePartnerOrderReturnResponse{SalesReturn: salesReturn, CreditNote: creditNote, Order: order}, nil
}

func resolvePartnerOrderJourneyStatusAfterReturnTx(ctx context.Context, tx pgx.Tx, firmID, orderID string) (string, error) {
	var dispatchedQuantity, returnedQuantity, deliveredQuantity int
	if err := tx.QueryRow(ctx, `
		select
			coalesce(sum(dispatched_quantity), 0)::int,
			coalesce(sum(returned_quantity), 0)::int,
			coalesce(sum(delivered_quantity), 0)::int
		from partner_order_items
		where firm_id = $1::bigint and order_id = $2
	`, firmID, orderID).Scan(&dispatchedQuantity, &returnedQuantity, &deliveredQuantity); err != nil {
		return "", err
	}
	openReturnable := dispatchedQuantity - returnedQuantity
	if openReturnable <= 0 && dispatchedQuantity > 0 {
		return "RETURNED", nil
	}
	if deliveredQuantity >= openReturnable && deliveredQuantity > 0 {
		return "DELIVERED", nil
	}
	if deliveredQuantity > 0 {
		return "PARTIALLY_DELIVERED", nil
	}
	return "DISPATCHED", nil
}

func (s *Store) VoidPartnerOrderReturn(firmID, orderID, returnID string) (VoidPartnerOrderReturnResponse, error) {
	ctx := context.Background()
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return VoidPartnerOrderReturnResponse{}, err
	}
	defer tx.Rollback(ctx)

	var salesReturn PartnerSalesReturn
	if err := tx.QueryRow(ctx, `
		select
			r.id, r.firm_id, r.return_number, r.order_id, r.invoice_id, coalesce(i.invoice_number, ''),
			coalesce(r.credit_note_id, ''), coalesce(cn.credit_note_number, ''),
			r.client_business_id, b.business_name, r.client_outlet_id, coalesce(co.outlet_name, ''),
			r.return_date::text, r.status, coalesce(r.notes, '')
		from partner_sales_returns r
		join partner_invoices i on i.firm_id = r.firm_id and i.id = r.invoice_id
		left join partner_credit_notes cn on cn.firm_id = r.firm_id and cn.id = r.credit_note_id
		join partner_client_businesses b on b.firm_id = r.firm_id and b.id = r.client_business_id
		join partner_client_outlets co on co.firm_id = r.firm_id and co.client_business_id = r.client_business_id and co.id = r.client_outlet_id
		where r.firm_id = $1::bigint and r.order_id = $2 and r.id = $3
		for update of r
	`, firmID, orderID, returnID).Scan(
		&salesReturn.ID, &salesReturn.FirmID, &salesReturn.ReturnNumber, &salesReturn.OrderID, &salesReturn.InvoiceID, &salesReturn.InvoiceNumber,
		&salesReturn.CreditNoteID, &salesReturn.CreditNoteNumber,
		&salesReturn.ClientBusinessID, &salesReturn.ClientBusinessName, &salesReturn.ClientOutletID, &salesReturn.ClientOutletName,
		&salesReturn.ReturnDate, &salesReturn.Status, &salesReturn.Notes,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return VoidPartnerOrderReturnResponse{}, fmt.Errorf("return not found")
		}
		return VoidPartnerOrderReturnResponse{}, err
	}
	if salesReturn.Status == "CANCELLED" {
		return VoidPartnerOrderReturnResponse{}, fmt.Errorf("return is already voided")
	}
	if salesReturn.CreditNoteID == "" {
		return VoidPartnerOrderReturnResponse{}, fmt.Errorf("credit note is required to void this return")
	}

	var creditNoteStatus string
	if err := tx.QueryRow(ctx, `
		select status
		from partner_credit_notes
		where firm_id = $1::bigint and id = $2
		for update
	`, firmID, salesReturn.CreditNoteID).Scan(&creditNoteStatus); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return VoidPartnerOrderReturnResponse{}, fmt.Errorf("credit note not found")
		}
		return VoidPartnerOrderReturnResponse{}, err
	}
	if creditNoteStatus == "CANCELLED" {
		return VoidPartnerOrderReturnResponse{}, fmt.Errorf("credit note is already voided")
	}

	rows, err := tx.Query(ctx, `
		select id, sales_return_id, order_item_id, coalesce(invoice_line_id, ''), item_id, item_name,
		       returned_quantity, accepted_quantity, credit_amount::float8, coalesce(reason, '')
		from partner_sales_return_lines
		where firm_id = $1::bigint and sales_return_id = $2
		order by created_at asc
	`, firmID, returnID)
	if err != nil {
		return VoidPartnerOrderReturnResponse{}, err
	}
	var lines []PartnerSalesReturnLine
	for rows.Next() {
		var line PartnerSalesReturnLine
		if err := rows.Scan(
			&line.ID, &line.SalesReturnID, &line.OrderItemID, &line.InvoiceLineID, &line.ItemID, &line.ItemName,
			&line.ReturnedQuantity, &line.AcceptedQuantity, &line.CreditAmount, &line.Reason,
		); err != nil {
			rows.Close()
			return VoidPartnerOrderReturnResponse{}, err
		}
		lines = append(lines, line)
	}
	if err := rows.Err(); err != nil {
		rows.Close()
		return VoidPartnerOrderReturnResponse{}, err
	}
	rows.Close()
	if len(lines) == 0 {
		return VoidPartnerOrderReturnResponse{}, fmt.Errorf("return lines are required")
	}

	for _, line := range lines {
		var currentReturned int
		if err := tx.QueryRow(ctx, `
			select returned_quantity
			from partner_order_items
			where firm_id = $1::bigint and order_id = $2 and id = $3
			for update
		`, firmID, orderID, line.OrderItemID).Scan(&currentReturned); err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return VoidPartnerOrderReturnResponse{}, fmt.Errorf("return line does not belong to this order")
			}
			return VoidPartnerOrderReturnResponse{}, err
		}
		if currentReturned < line.AcceptedQuantity {
			return VoidPartnerOrderReturnResponse{}, fmt.Errorf("returned quantity cannot be reversed for %s", line.ItemName)
		}
		if err := s.applyPartnerOrderInventoryDeltaTx(ctx, tx, firmID, line.ItemID, -line.AcceptedQuantity, "Void return: "+salesReturn.ReturnNumber); err != nil {
			return VoidPartnerOrderReturnResponse{}, err
		}
		if _, err := tx.Exec(ctx, `
			update partner_order_items
			set returned_quantity = returned_quantity - $4
			where firm_id = $1::bigint and order_id = $2 and id = $3
		`, firmID, orderID, line.OrderItemID, line.AcceptedQuantity); err != nil {
			return VoidPartnerOrderReturnResponse{}, err
		}
	}

	if _, err := tx.Exec(ctx, `
		update partner_sales_returns
		set status = 'CANCELLED',
		    cancelled_at = now()
		where firm_id = $1::bigint and id = $2
	`, firmID, returnID); err != nil {
		return VoidPartnerOrderReturnResponse{}, err
	}
	if _, err := tx.Exec(ctx, `
		update partner_credit_notes
		set status = 'CANCELLED',
		    cancelled_at = now(),
		    updated_at = now()
		where firm_id = $1::bigint and id = $2
	`, firmID, salesReturn.CreditNoteID); err != nil {
		return VoidPartnerOrderReturnResponse{}, err
	}
	var reversalAmount float64
	for _, line := range lines {
		reversalAmount = roundCurrency(reversalAmount + line.CreditAmount)
	}
	if err := s.insertPartnerClientLedgerEntryTx(ctx, tx, firmID, salesReturn.ClientBusinessID, salesReturn.ReturnDate, "CREDIT_NOTE_VOID", salesReturn.CreditNoteID, salesReturn.CreditNoteNumber, "Credit note voided", reversalAmount, 0); err != nil {
		return VoidPartnerOrderReturnResponse{}, err
	}

	nextStatus, err := resolvePartnerOrderJourneyStatusAfterReturnTx(ctx, tx, firmID, orderID)
	if err != nil {
		return VoidPartnerOrderReturnResponse{}, err
	}
	if _, err := tx.Exec(ctx, `
		update partner_orders
		set status = $3,
		    updated_at = now()
		where firm_id = $1::bigint and id = $2
	`, firmID, orderID, nextStatus); err != nil {
		return VoidPartnerOrderReturnResponse{}, err
	}

	salesReturn.Lines = lines
	for _, line := range lines {
		salesReturn.TotalQuantity += line.AcceptedQuantity
		salesReturn.TotalCreditAmount += line.CreditAmount
	}
	if err := s.insertPartnerAuditLogTx(ctx, tx, firmID, "SALES_RETURN", returnID, "VOID", map[string]any{
		"status": "ISSUED",
	}, map[string]any{
		"status": "CANCELLED",
	}); err != nil {
		return VoidPartnerOrderReturnResponse{}, err
	}
	if err := s.insertPartnerAuditLogTx(ctx, tx, firmID, "CREDIT_NOTE", salesReturn.CreditNoteID, "VOID", map[string]any{
		"status": creditNoteStatus,
	}, map[string]any{
		"status": "CANCELLED",
	}); err != nil {
		return VoidPartnerOrderReturnResponse{}, err
	}
	if err := s.insertPartnerAuditLogTx(ctx, tx, firmID, "ORDER", orderID, "RETURN_REVERSED", nil, map[string]any{
		"status":       nextStatus,
		"returnNumber": salesReturn.ReturnNumber,
	}); err != nil {
		return VoidPartnerOrderReturnResponse{}, err
	}
	if err := tx.Commit(ctx); err != nil {
		return VoidPartnerOrderReturnResponse{}, err
	}

	returns, err := s.GetPartnerOrderReturns(firmID, orderID)
	if err != nil {
		return VoidPartnerOrderReturnResponse{}, err
	}
	for _, item := range returns {
		if item.ID == returnID {
			salesReturn = item
			break
		}
	}
	creditNotes, err := s.GetPartnerCreditNotes(firmID)
	if err != nil {
		return VoidPartnerOrderReturnResponse{}, err
	}
	var creditNote PartnerCreditNote
	for _, item := range creditNotes {
		if item.ID == salesReturn.CreditNoteID {
			creditNote = item
			break
		}
	}
	order, err := s.GetPartnerOrderByID(firmID, orderID)
	if err != nil {
		return VoidPartnerOrderReturnResponse{}, err
	}
	return VoidPartnerOrderReturnResponse{SalesReturn: salesReturn, CreditNote: creditNote, Order: order}, nil
}

func (s *Store) cancelPartnerOrderTx(ctx context.Context, tx pgx.Tx, firmID, orderID, currentStatus string, lines []partnerOrderTransitionLine, note string) error {
	if err := s.cancelDraftPartnerOrderInvoicesTx(ctx, tx, firmID, orderID, "ORDER_CANCELLED_BEFORE_DISPATCH"); err != nil {
		return err
	}
	stockDeducted := currentStatus == "CONFIRMED" || currentStatus == "PACKED" || currentStatus == "DISPATCHED" || currentStatus == "PARTIALLY_DELIVERED" || currentStatus == "DELIVERED" || currentStatus == "PARTIALLY_RETURNED"
	for _, line := range lines {
		if stockDeducted {
			delta := line.Quantity - line.ReturnedQuantity
			if delta > 0 {
				if err := s.applyPartnerOrderInventoryDeltaTx(ctx, tx, firmID, line.ItemID, delta, firstNonEmpty(strings.TrimSpace(note), "Order cancellation return: "+orderID)); err != nil {
					return err
				}
			}
			if line.DispatchedQuantity > 0 {
				line.ReturnedQuantity = line.DispatchedQuantity
			}
		}
		if _, err := tx.Exec(ctx, `
			update partner_order_items
			set returned_quantity = $3,
			    cancelled_quantity = quantity
			where firm_id = $1::bigint and order_id = $2 and item_id = $4
		`, firmID, orderID, line.ReturnedQuantity, line.ItemID); err != nil {
			return err
		}
	}
	return nil
}

func (s *Store) revertConfirmedPartnerOrderToDraftTx(ctx context.Context, tx pgx.Tx, firmID, orderID, currentStatus string, lines []partnerOrderTransitionLine) error {
	if currentStatus != "CONFIRMED" && currentStatus != "PACKED" {
		return fmt.Errorf("only confirmed or packed orders can be reverted to draft")
	}
	if err := s.cancelDraftPartnerOrderInvoicesTx(ctx, tx, firmID, orderID, "ORDER_REVERTED_TO_DRAFT"); err != nil {
		return err
	}
	for _, line := range lines {
		if line.DispatchedQuantity > 0 || line.DeliveredQuantity > 0 || line.ReturnedQuantity > 0 || line.CancelledQuantity > 0 {
			return fmt.Errorf("order cannot be reverted after dispatch has started")
		}
		if line.Quantity > 0 {
			if err := s.applyPartnerOrderInventoryDeltaTx(ctx, tx, firmID, line.ItemID, line.Quantity, "Order reverted to draft: "+orderID); err != nil {
				return err
			}
		}
	}
	if _, err := tx.Exec(ctx, `
		delete from partner_order_items
		where firm_id = $1::bigint and order_id = $2
	`, firmID, orderID); err != nil {
		return err
	}
	if _, err := tx.Exec(ctx, `
		delete from partner_order_billable_lines
		where firm_id = $1::bigint and order_id = $2
	`, firmID, orderID); err != nil {
		return err
	}
	if _, err := tx.Exec(ctx, `
		delete from partner_unfulfilled_order_items
		where firm_id = $1::bigint and source_order_id = $2
	`, firmID, orderID); err != nil {
		return err
	}
	return nil
}

func (s *Store) cancelDraftPartnerOrderInvoicesTx(ctx context.Context, tx pgx.Tx, firmID, orderID, reason string) error {
	rows, err := tx.Query(ctx, `
		select id, status
		from partner_invoices
		where firm_id = $1::bigint and order_id = $2 and status <> 'CANCELLED'
		for update
	`, firmID, orderID)
	if err != nil {
		return err
	}

	type invoiceRow struct {
		ID     string
		Status string
	}
	var invoices []invoiceRow
	for rows.Next() {
		var invoice invoiceRow
		if err := rows.Scan(&invoice.ID, &invoice.Status); err != nil {
			rows.Close()
			return err
		}
		invoices = append(invoices, invoice)
	}
	if err := rows.Err(); err != nil {
		rows.Close()
		return err
	}
	rows.Close()
	for _, invoice := range invoices {
		if invoice.Status != "DRAFT" {
			return fmt.Errorf("invoice is finalized; use return or credit note flow instead of cancelling this order")
		}
		if _, err := tx.Exec(ctx, `
			update partner_invoices
			set status = 'CANCELLED',
			    updated_at = now()
			where firm_id = $1::bigint and id = $2
		`, firmID, invoice.ID); err != nil {
			return err
		}
		if err := s.insertPartnerAuditLogTx(ctx, tx, firmID, "INVOICE", invoice.ID, "CANCEL", map[string]any{
			"status": invoice.Status,
		}, map[string]any{
			"status": "CANCELLED",
			"reason": reason,
		}); err != nil {
			return err
		}
	}
	return nil
}

func (s *Store) applyPartnerOrderInventoryDeltaTx(ctx context.Context, tx pgx.Tx, firmID, itemID string, delta int, note string) error {
	if delta == 0 {
		return nil
	}
	rows, err := tx.Query(ctx, `
		select item_id, quantity
		from partner_firm_inventory_items
		where firm_id = $1::bigint
		  and (item_id = $2 or catalog_item_id = $2)
		order by
		  case when item_id = $2 then 0 else 1 end,
		  updated_at asc
		for update
	`, firmID, itemID)
	if err != nil {
		return err
	}
	defer rows.Close()

	var inventoryRows []partnerOrderInventoryRow
	for rows.Next() {
		var row partnerOrderInventoryRow
		if err := rows.Scan(&row.ItemID, &row.Quantity); err != nil {
			return err
		}
		inventoryRows = append(inventoryRows, row)
	}
	if err := rows.Err(); err != nil {
		return err
	}
	if len(inventoryRows) == 0 {
		return fmt.Errorf("inventory item not found")
	}

	if delta < 0 {
		required := -delta
		available := 0
		for _, row := range inventoryRows {
			available += row.Quantity
		}
		if available < required {
			return fmt.Errorf("only %d available", available)
		}
		remaining := required
		for _, row := range inventoryRows {
			if remaining == 0 {
				break
			}
			consume := row.Quantity
			if consume > remaining {
				consume = remaining
			}
			if consume == 0 {
				continue
			}
			nextQty := row.Quantity - consume
			if err := s.updatePartnerInventoryQuantityTx(ctx, tx, firmID, row.ItemID, row.Quantity, nextQty, note); err != nil {
				return err
			}
			remaining -= consume
		}
		return nil
	}

	row := inventoryRows[0]
	nextQty := row.Quantity + delta
	return s.updatePartnerInventoryQuantityTx(ctx, tx, firmID, row.ItemID, row.Quantity, nextQty, note)
}

func (s *Store) updatePartnerInventoryQuantityTx(ctx context.Context, tx pgx.Tx, firmID, itemID string, currentQty, nextQty int, note string) error {
	if nextQty < 0 {
		return fmt.Errorf("quantity exceeds available stock")
	}
	if _, err := tx.Exec(ctx, `
		update partner_firm_inventory_items
		set quantity = $3,
		    updated_at = now()
		where firm_id = $1::bigint and item_id = $2
	`, firmID, itemID, nextQty); err != nil {
		return err
	}
	_, err := tx.Exec(ctx, `
		insert into partner_inventory_adjustments (
			id, firm_id, item_id, quantity_from, quantity_to, note, created_by
		) values ($1, $2, $3, $4, $5, $6, $7)
	`, nextID("padj"), firmID, itemID, currentQty, nextQty, note, s.currentUserID)
	return err
}

func (s *Store) GetPartnerInvoices(firmID string) ([]PartnerInvoice, error) {
	ctx := context.Background()
	rows, err := s.pool.Query(ctx, `
		select
			i.id, i.firm_id, coalesce(i.order_id, ''), i.invoice_number, i.client_business_id, b.business_name,
			i.client_outlet_id, coalesce(o.outlet_name, ''), i.invoice_date::text, i.due_date::text, i.status,
			to_char(i.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), coalesce(u.name, ''),
			i.amount::float8, coalesce(i.dispatch_reference, ''),
			coalesce(i.firm_name, f.name, ''), coalesce(i.firm_gstin, f.gstin, ''), coalesce(i.firm_billing_address, f.billing_address, ''), coalesce(i.firm_state, f.state, f.city, ''),
			coalesce(i.bill_to_name, ''), coalesce(i.bill_to_gstin, ''), coalesce(i.bill_to_address, ''),
			coalesce(i.client_gstin, i.bill_to_gstin, b.gstin, ''), coalesce(i.client_billing_address, i.bill_to_address, b.billing_address, ''), coalesce(i.client_state, b.state, ''),
			coalesce(i.deliver_to_name, ''), '', coalesce(i.deliver_to_address, ''),
			'', '', coalesce(i.outlet_shipping_address, i.deliver_to_address, o.address, ''), coalesce(i.outlet_contact_name, ''), coalesce(i.outlet_contact_phone, ''),
			coalesce(i.place_of_supply, ''), coalesce(i.payment_terms, ''),
			i.subtotal_amount::float8, i.discount_amount::float8, i.taxable_amount::float8, i.cgst_amount::float8, i.sgst_amount::float8,
			i.igst_amount::float8, i.round_off_amount::float8, i.additional_charges_amount::float8, i.final_total_amount::float8,
			coalesce(i.notes, '')
		from partner_invoices i
		join partner_firms f on f.id = i.firm_id
		join partner_client_businesses b on b.id = i.client_business_id and b.firm_id = i.firm_id
		join partner_client_outlets o on o.id = i.client_outlet_id and o.client_business_id = i.client_business_id and o.firm_id = i.firm_id
		left join users u on u.id = i.created_by
		where i.firm_id = $1::bigint
		order by i.invoice_date desc, i.created_at desc
	`, firmID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []PartnerInvoice
	indexByID := map[string]int{}
	for rows.Next() {
		var item PartnerInvoice
		if err := rows.Scan(
			&item.ID, &item.FirmID, &item.OrderID, &item.InvoiceNumber, &item.ClientBusinessID, &item.ClientBusinessName,
			&item.ClientOutletID, &item.ClientOutletName, &item.InvoiceDate, &item.DueDate, &item.Status, &item.CreatedAt, &item.CreatedByName,
			&item.Amount, &item.DispatchReference, &item.FirmName, &item.FirmGSTIN, &item.FirmBillingAddress, &item.FirmState,
			&item.BillToName, &item.BillToGSTIN, &item.BillToAddress, &item.ClientGSTIN, &item.ClientBillingAddress, &item.ClientState,
			&item.DeliverToName, &item.DeliverToLocality, &item.DeliverToAddress, &item.DeliverToManagerName, &item.DeliverToManagerPhone,
			&item.OutletShippingAddress, &item.OutletContactName, &item.OutletContactPhone, &item.PlaceOfSupply, &item.PaymentTerms,
			&item.SubtotalAmount, &item.DiscountAmount, &item.TaxableAmount, &item.CGSTAmount, &item.SGSTAmount, &item.IGSTAmount,
			&item.RoundOffAmount, &item.AdditionalCharges, &item.FinalTotalAmount, &item.Notes,
		); err != nil {
			return nil, err
		}
		if item.FinalTotalAmount == 0 && item.Amount > 0 {
			item.FinalTotalAmount = item.Amount
		}
		item.Items = []PartnerInvoiceItem{}
		items = append(items, item)
		indexByID[item.ID] = len(items) - 1
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	if len(items) == 0 {
		return []PartnerInvoice{}, nil
	}
	itemRows, err := s.pool.Query(ctx, `
		select id, invoice_id, coalesce(order_billable_line_id, ''), item_id, item_code, item_name,
		       coalesce(sku, item_code), coalesce(hsn_sac, ''), quantity, coalesce(unit, ''),
		       mrp::float8, discount_percentage::float8, sell_margin_percentage::float8, rate::float8,
		       discount_amount::float8, taxable_value::float8, gst_percentage::float8,
		       cgst_percentage::float8, sgst_percentage::float8, igst_percentage::float8,
		       cgst_amount::float8, sgst_amount::float8, igst_amount::float8, total_tax_amount::float8,
		       line_total::float8
		from partner_invoice_items
		where firm_id = $1::bigint
		order by created_at asc
	`, firmID)
	if err != nil {
		return nil, err
	}
	defer itemRows.Close()
	for itemRows.Next() {
		var line PartnerInvoiceItem
		if err := itemRows.Scan(
			&line.ID, &line.InvoiceID, &line.BillableLineID, &line.ItemID, &line.ItemCode, &line.ItemName,
			&line.SKU, &line.HSNSAC, &line.Quantity, &line.Unit, &line.MRP, &line.DiscountPercentage, &line.SellMarginPercent,
			&line.Rate, &line.DiscountAmount, &line.TaxableValue, &line.GSTPercentage, &line.CGSTPercentage, &line.SGSTPercentage,
			&line.IGSTPercentage, &line.CGSTAmount, &line.SGSTAmount, &line.IGSTAmount, &line.TotalTaxAmount, &line.LineTotal,
		); err != nil {
			return nil, err
		}
		idx, ok := indexByID[line.InvoiceID]
		if !ok {
			continue
		}
		items[idx].Items = append(items[idx].Items, line)
	}
	if err := itemRows.Err(); err != nil {
		return nil, err
	}
	paidByInvoice, creditByInvoice, debitByInvoice, err := s.partnerInvoiceFinancialAdjustments(ctx, firmID)
	if err != nil {
		return nil, err
	}
	for i := range items {
		adjustedTotal := roundCurrency(items[i].Amount - creditByInvoice[items[i].ID] + debitByInvoice[items[i].ID])
		if adjustedTotal < 0 {
			adjustedTotal = 0
		}
		items[i].PaidAmount = paidByInvoice[items[i].ID]
		items[i].DueAmount = math.Max(roundCurrency(adjustedTotal-items[i].PaidAmount), 0)
		items[i].PaymentStatus = partnerInvoicePaymentStatus(adjustedTotal, items[i].PaidAmount, items[i].DueAmount, items[i].DueDate)
	}
	return items, nil
}

type partnerInvoiceHeaderSnapshot struct {
	FirmName              string
	FirmGSTIN             string
	FirmBillingAddress    string
	FirmState             string
	ClientBusinessID      string
	ClientOutletID        string
	BillToName            string
	BillToGSTIN           string
	BillToAddress         string
	ClientGSTIN           string
	ClientBillingAddress  string
	ClientState           string
	DeliverToName         string
	DeliverToAddress      string
	OutletShippingAddress string
	OutletContactName     string
	OutletContactPhone    string
	PlaceOfSupply         string
	PaymentTerms          string
	DispatchReference     string
}

type partnerInvoiceTotals struct {
	Subtotal   float64
	Discount   float64
	Taxable    float64
	CGST       float64
	SGST       float64
	IGST       float64
	RoundOff   float64
	Additional float64
	FinalTotal float64
}

func roundCurrency(value float64) float64 {
	return math.Round(value*100) / 100
}

func normalizeState(value string) string {
	return strings.ToUpper(strings.TrimSpace(value))
}

func buildPaymentTerms(days int) string {
	if days <= 0 {
		return "Due on receipt"
	}
	if days == 1 {
		return "Due in 1 day"
	}
	return fmt.Sprintf("Due in %d days", days)
}

func dueDateForInvoice(invoiceDate string, termsDays int) string {
	if strings.TrimSpace(invoiceDate) == "" || termsDays <= 0 {
		return invoiceDate
	}
	parsed, err := time.Parse("2006-01-02", invoiceDate)
	if err != nil {
		return invoiceDate
	}
	return parsed.AddDate(0, 0, termsDays).Format("2006-01-02")
}

func calculatePartnerInvoiceLine(line PartnerInvoiceItem, sellerState, placeOfSupply string) PartnerInvoiceItem {
	line.SellMarginPercent = line.DiscountPercentage
	line.DiscountAmount = roundCurrency(float64(line.Quantity) * math.Max(line.MRP-line.Rate, 0))
	line.TaxableValue = roundCurrency(float64(line.Quantity) * line.Rate)
	line.CGSTPercentage = 0
	line.SGSTPercentage = 0
	line.IGSTPercentage = 0
	line.CGSTAmount = 0
	line.SGSTAmount = 0
	line.IGSTAmount = 0
	if line.GSTPercentage > 0 && line.TaxableValue > 0 {
		if normalizeState(sellerState) != "" && normalizeState(sellerState) == normalizeState(placeOfSupply) {
			line.CGSTPercentage = roundCurrency(line.GSTPercentage / 2)
			line.SGSTPercentage = roundCurrency(line.GSTPercentage / 2)
			line.CGSTAmount = roundCurrency(line.TaxableValue * line.CGSTPercentage / 100)
			line.SGSTAmount = roundCurrency(line.TaxableValue * line.SGSTPercentage / 100)
		} else {
			line.IGSTPercentage = line.GSTPercentage
			line.IGSTAmount = roundCurrency(line.TaxableValue * line.IGSTPercentage / 100)
		}
	}
	line.TotalTaxAmount = roundCurrency(line.CGSTAmount + line.SGSTAmount + line.IGSTAmount)
	line.LineTotal = roundCurrency(line.TaxableValue + line.TotalTaxAmount)
	return line
}

func addPartnerInvoiceTotals(totals partnerInvoiceTotals, line PartnerInvoiceItem) partnerInvoiceTotals {
	totals.Subtotal = roundCurrency(totals.Subtotal + float64(line.Quantity)*line.MRP)
	totals.Discount = roundCurrency(totals.Discount + line.DiscountAmount)
	totals.Taxable = roundCurrency(totals.Taxable + line.TaxableValue)
	totals.CGST = roundCurrency(totals.CGST + line.CGSTAmount)
	totals.SGST = roundCurrency(totals.SGST + line.SGSTAmount)
	totals.IGST = roundCurrency(totals.IGST + line.IGSTAmount)
	totals.FinalTotal = roundCurrency(totals.Taxable + totals.CGST + totals.SGST + totals.IGST + totals.Additional + totals.RoundOff)
	return totals
}

func partnerInvoicePaymentStatus(total, paid, outstanding float64, dueDate string) string {
	total = roundCurrency(total)
	paid = roundCurrency(paid)
	outstanding = roundCurrency(outstanding)
	if outstanding > 0 && strings.TrimSpace(dueDate) != "" {
		if parsed, err := time.Parse("2006-01-02", dueDate); err == nil {
			today := time.Now().UTC().Truncate(24 * time.Hour)
			if parsed.Before(today) {
				return "OVERDUE"
			}
		}
	}
	if paid <= 0 {
		return "UNPAID"
	}
	if outstanding <= 0 || paid >= total {
		return "PAID"
	}
	return "PARTIALLY_PAID"
}

func partnerAgingBucket(ageDays int) string {
	if ageDays <= 30 {
		return "0-30"
	}
	if ageDays <= 60 {
		return "31-60"
	}
	if ageDays <= 90 {
		return "61-90"
	}
	return "90+"
}

func (s *Store) partnerInvoiceFinancialAdjustments(ctx context.Context, firmID string) (map[string]float64, map[string]float64, map[string]float64, error) {
	paidByInvoice := map[string]float64{}
	creditByInvoice := map[string]float64{}
	debitByInvoice := map[string]float64{}

	rows, err := s.pool.Query(ctx, `
		select invoice_id, coalesce(sum(amount), 0)::float8
		from partner_payment_allocations
		where firm_id = $1::bigint
		group by invoice_id
	`, firmID)
	if err != nil {
		return nil, nil, nil, err
	}
	for rows.Next() {
		var invoiceID string
		var amount float64
		if err := rows.Scan(&invoiceID, &amount); err != nil {
			rows.Close()
			return nil, nil, nil, err
		}
		paidByInvoice[invoiceID] = roundCurrency(amount)
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		return nil, nil, nil, err
	}

	rows, err = s.pool.Query(ctx, `
		select related_invoice_id, coalesce(sum(total_amount), 0)::float8
		from partner_credit_notes
		where firm_id = $1::bigint and status = 'ISSUED' and related_invoice_id is not null
		group by related_invoice_id
	`, firmID)
	if err != nil {
		return nil, nil, nil, err
	}
	for rows.Next() {
		var invoiceID string
		var amount float64
		if err := rows.Scan(&invoiceID, &amount); err != nil {
			rows.Close()
			return nil, nil, nil, err
		}
		creditByInvoice[invoiceID] = roundCurrency(amount)
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		return nil, nil, nil, err
	}

	rows, err = s.pool.Query(ctx, `
		select related_invoice_id, coalesce(sum(total_amount), 0)::float8
		from partner_debit_notes
		where firm_id = $1::bigint and status = 'ISSUED' and related_invoice_id is not null
		group by related_invoice_id
	`, firmID)
	if err != nil {
		return nil, nil, nil, err
	}
	for rows.Next() {
		var invoiceID string
		var amount float64
		if err := rows.Scan(&invoiceID, &amount); err != nil {
			rows.Close()
			return nil, nil, nil, err
		}
		debitByInvoice[invoiceID] = roundCurrency(amount)
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		return nil, nil, nil, err
	}
	return paidByInvoice, creditByInvoice, debitByInvoice, nil
}

func (s *Store) insertPartnerClientLedgerEntryTx(
	ctx context.Context,
	tx pgx.Tx,
	firmID string,
	clientBusinessID string,
	entryDate string,
	entryType string,
	referenceID string,
	referenceNumber string,
	description string,
	debit float64,
	credit float64,
) error {
	entryType = strings.ToUpper(strings.TrimSpace(entryType))
	if strings.TrimSpace(clientBusinessID) == "" || strings.TrimSpace(referenceID) == "" || entryType == "" {
		return nil
	}
	var exists bool
	if err := tx.QueryRow(ctx, `
		select exists(
			select 1
			from partner_client_ledger_entries
			where firm_id = $1::bigint and reference_id = $2 and entry_type = $3
		)
	`, firmID, referenceID, entryType).Scan(&exists); err != nil {
		return err
	}
	if exists {
		return nil
	}
	var previousBalance float64
	if err := tx.QueryRow(ctx, `
		select coalesce((
			select running_balance
			from partner_client_ledger_entries
			where firm_id = $1::bigint and client_business_id = $2
			order by entry_date desc, created_at desc
			limit 1
		), 0)::float8
	`, firmID, clientBusinessID).Scan(&previousBalance); err != nil {
		return err
	}
	runningBalance := roundCurrency(previousBalance + roundCurrency(debit) - roundCurrency(credit))
	if strings.TrimSpace(entryDate) == "" {
		entryDate = time.Now().UTC().Format("2006-01-02")
	}
	if _, err := tx.Exec(ctx, `
		insert into partner_client_ledger_entries (
			id, firm_id, client_business_id, entry_date, entry_type, reference_id, reference_number,
			description, debit, credit, running_balance
		) values ($1, $2, $3, $4::date, $5, $6, $7, $8, $9, $10, $11)
	`, nextID("pled"), firmID, clientBusinessID, entryDate, entryType, referenceID, strings.TrimSpace(referenceNumber), strings.TrimSpace(description), roundCurrency(debit), roundCurrency(credit), runningBalance); err != nil {
		return err
	}
	return nil
}

func (s *Store) nextPartnerInvoiceNumberTx(ctx context.Context, tx pgx.Tx, firmID string) (string, error) {
	var prefix string
	var sequence int
	if err := tx.QueryRow(ctx, `
		select coalesce(nullif(invoice_number_prefix, ''), 'INV'), invoice_number_next_sequence
		from partner_firms
		where id = $1
		for update
	`, firmID).Scan(&prefix, &sequence); err != nil {
		return "", err
	}
	if sequence <= 0 {
		sequence = 1
	}
	if _, err := tx.Exec(ctx, `
		update partner_firms
		set invoice_number_next_sequence = $2,
		    updated_at = now()
		where id = $1
	`, firmID, sequence+1); err != nil {
		return "", err
	}
	return fmt.Sprintf("%s/%d/%04d", strings.Trim(strings.TrimSpace(prefix), "/"), time.Now().UTC().Year(), sequence), nil
}

func (s *Store) CreatePartnerInvoice(firmID string, input CreatePartnerInvoiceInput) (PartnerInvoice, error) {
	ctx := context.Background()
	orderID := strings.TrimSpace(input.OrderID)
	if orderID == "" {
		return PartnerInvoice{}, fmt.Errorf("orderId is required")
	}
	dueDate := strings.TrimSpace(input.DueDate)
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return PartnerInvoice{}, err
	}
	defer tx.Rollback(ctx)
	invoiceID := nextID("pinv")
	invoiceNumber, err := s.nextPartnerInvoiceNumberTx(ctx, tx, firmID)
	if err != nil {
		return PartnerInvoice{}, err
	}
	var existingInvoiceID string
	var orderStatus string
	var clientBusinessID string
	var clientOutletID string
	if err := tx.QueryRow(ctx, `
		select
			coalesce((
				select i.id
				from partner_invoices i
				where i.firm_id = o.firm_id and i.order_id = o.id and i.status <> 'CANCELLED'
				order by i.created_at desc
				limit 1
			), ''),
			o.status,
			o.client_business_id,
			o.client_outlet_id
		from partner_orders o
		where o.firm_id = $1::bigint and o.id = $2
	`, firmID, orderID).Scan(&existingInvoiceID, &orderStatus, &clientBusinessID, &clientOutletID); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return PartnerInvoice{}, fmt.Errorf("order not found")
		}
		return PartnerInvoice{}, err
	}
	if existingInvoiceID != "" {
		return PartnerInvoice{}, fmt.Errorf("invoice already exists for this order")
	}
	if orderStatus != "DISPATCHED" && orderStatus != "DELIVERED" && orderStatus != "PARTIALLY_DELIVERED" && orderStatus != "RETURNED" && orderStatus != "PARTIALLY_RETURNED" {
		return PartnerInvoice{}, fmt.Errorf("invoice can only be generated at dispatch or after dispatch")
	}
	var header partnerInvoiceHeaderSnapshot
	var paymentTermsDays int
	if err := tx.QueryRow(ctx, `
		select
			coalesce(f.trade_name, f.name),
			coalesce(f.gstin, ''),
			coalesce(f.billing_address, ''),
			coalesce(f.state, f.city, ''),
			coalesce(b.billing_name, b.business_name),
			coalesce(b.gstin, ''),
			coalesce(b.billing_address, ''),
			coalesce(b.state, ''),
			coalesce(o.outlet_name, ''),
			coalesce(o.address, ''),
			coalesce((
				select c.name
				from partner_client_contacts c
				where c.firm_id = b.firm_id and c.client_business_id = b.id and c.is_primary
				order by c.sort_order asc, c.created_at asc
				limit 1
			), ''),
			coalesce((
				select c.phone
				from partner_client_contacts c
				where c.firm_id = b.firm_id and c.client_business_id = b.id and c.is_primary
				order by c.sort_order asc, c.created_at asc
				limit 1
			), ''),
			coalesce(nullif(b.state, ''), f.state, f.city, ''),
			coalesce(f.default_payment_terms_days, 0)
		from partner_firms f
		join partner_client_businesses b on b.firm_id = f.id and b.id = $2
		join partner_client_outlets o on o.id = $3 and o.client_business_id = b.id and o.firm_id = b.firm_id
		where f.id = $1
	`, firmID, clientBusinessID, clientOutletID).Scan(
		&header.FirmName, &header.FirmGSTIN, &header.FirmBillingAddress, &header.FirmState,
		&header.BillToName, &header.BillToGSTIN, &header.BillToAddress, &header.ClientState,
		&header.DeliverToName, &header.DeliverToAddress, &header.OutletContactName, &header.OutletContactPhone,
		&header.PlaceOfSupply, &paymentTermsDays,
	); err != nil {
		return PartnerInvoice{}, err
	}
	header.ClientGSTIN = header.BillToGSTIN
	header.ClientBillingAddress = header.BillToAddress
	header.OutletShippingAddress = header.DeliverToAddress
	header.PaymentTerms = buildPaymentTerms(paymentTermsDays)
	if dueDate == "" {
		dueDate = dueDateForInvoice(strings.TrimSpace(input.InvoiceDate), paymentTermsDays)
	}
	if _, err := tx.Exec(ctx, `
		insert into partner_invoices (
			id, firm_id, order_id, client_business_id, client_outlet_id, invoice_number, invoice_date, due_date,
			bill_to_name, bill_to_gstin, bill_to_address, deliver_to_name, deliver_to_address,
			firm_name, firm_gstin, firm_billing_address, firm_state, client_gstin, client_billing_address, client_state,
			outlet_shipping_address, outlet_contact_name, outlet_contact_phone, place_of_supply, payment_terms,
			amount, status, notes, created_by
		) values ($1, $2, nullif($3, ''), $4, $5, $6, $7::date, $8::date, $9, nullif($10, ''), nullif($11, ''), $12, nullif($13, ''),
		          nullif($14, ''), nullif($15, ''), nullif($16, ''), nullif($17, ''), nullif($18, ''), nullif($19, ''), nullif($20, ''),
		          nullif($21, ''), nullif($22, ''), nullif($23, ''), nullif($24, ''), nullif($25, ''),
		          0, 'DRAFT', nullif($26, ''), $27)
	`, invoiceID, firmID, orderID, clientBusinessID, clientOutletID, invoiceNumber, strings.TrimSpace(input.InvoiceDate), dueDate,
		header.BillToName, header.BillToGSTIN, header.BillToAddress, header.DeliverToName, header.DeliverToAddress,
		header.FirmName, header.FirmGSTIN, header.FirmBillingAddress, header.FirmState, header.ClientGSTIN, header.ClientBillingAddress, header.ClientState,
		header.OutletShippingAddress, header.OutletContactName, header.OutletContactPhone, header.PlaceOfSupply, header.PaymentTerms,
		strings.TrimSpace(input.Notes), s.currentUserID); err != nil {
		return PartnerInvoice{}, err
	}

	lineRows, err := tx.Query(ctx, `
		select
			bl.id, bl.catalog_item_id, bl.item_code, bl.item_name,
			coalesce(pc.sku, bl.item_code), coalesce(pc.hsn_code, ''), coalesce(pc.unit, ''),
			coalesce(pc.gst_percentage, 0)::float8,
			coalesce(sum(case
				when $3 in ('DISPATCHED', 'DELIVERED', 'PARTIALLY_DELIVERED', 'RETURNED', 'PARTIALLY_RETURNED') then oi.dispatched_quantity
				when $3 = 'PACKED' then oi.packed_quantity
				else oi.quantity
			end), bl.quantity)::int as invoice_quantity,
			bl.mrp::float8, bl.seller_margin_percentage::float8, bl.rate::float8
		from partner_order_billable_lines bl
		join partner_product_catalog pc on pc.id = bl.catalog_item_id
		left join partner_order_items oi
			on oi.firm_id = bl.firm_id and oi.order_id = bl.order_id and oi.billable_line_id = bl.id
		where bl.firm_id = $1::bigint and bl.order_id = $2
		group by bl.id, bl.catalog_item_id, bl.item_code, bl.item_name, pc.sku, pc.hsn_code, pc.unit, pc.gst_percentage, bl.quantity, bl.mrp, bl.seller_margin_percentage, bl.rate, bl.created_at
		order by bl.created_at asc
	`, firmID, orderID, orderStatus)
	if err != nil {
		return PartnerInvoice{}, err
	}
	invoiceLines := []PartnerInvoiceItem{}
	for lineRows.Next() {
		var billableLineID string
		var line PartnerInvoiceItem
		if err := lineRows.Scan(
			&billableLineID, &line.ItemID, &line.ItemCode, &line.ItemName, &line.SKU, &line.HSNSAC, &line.Unit, &line.GSTPercentage,
			&line.Quantity, &line.MRP, &line.DiscountPercentage, &line.Rate,
		); err != nil {
			lineRows.Close()
			return PartnerInvoice{}, err
		}
		if line.Quantity <= 0 {
			continue
		}
		line.BillableLineID = billableLineID
		line = calculatePartnerInvoiceLine(line, header.FirmState, header.PlaceOfSupply)
		invoiceLines = append(invoiceLines, line)
	}
	lineRows.Close()
	if err := lineRows.Err(); err != nil {
		return PartnerInvoice{}, err
	}
	if len(invoiceLines) == 0 {
		return PartnerInvoice{}, fmt.Errorf("billable lines are required")
	}
	var totals partnerInvoiceTotals
	for _, line := range invoiceLines {
		if _, err := tx.Exec(ctx, `
			insert into partner_invoice_items (
				id, firm_id, invoice_id, order_billable_line_id, item_id, item_code, item_name,
				sku, hsn_sac, unit, quantity, mrp, discount_percentage, sell_margin_percentage, rate,
				discount_amount, taxable_value, gst_percentage, cgst_percentage, sgst_percentage, igst_percentage,
				cgst_amount, sgst_amount, igst_amount, total_tax_amount, line_total
			)
			values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
		`, nextID("piln"), firmID, invoiceID, line.BillableLineID, line.ItemID, line.ItemCode, line.ItemName,
			line.SKU, line.HSNSAC, line.Unit, line.Quantity, line.MRP, line.DiscountPercentage, line.SellMarginPercent, line.Rate,
			line.DiscountAmount, line.TaxableValue, line.GSTPercentage, line.CGSTPercentage, line.SGSTPercentage, line.IGSTPercentage,
			line.CGSTAmount, line.SGSTAmount, line.IGSTAmount, line.TotalTaxAmount, line.LineTotal); err != nil {
			return PartnerInvoice{}, err
		}
		totals = addPartnerInvoiceTotals(totals, line)
	}
	if _, err := tx.Exec(ctx, `
		update partner_invoices
		set amount = $2,
		    subtotal_amount = $3,
		    discount_amount = $4,
		    taxable_amount = $5,
		    cgst_amount = $6,
		    sgst_amount = $7,
		    igst_amount = $8,
		    round_off_amount = $9,
		    additional_charges_amount = $10,
		    final_total_amount = $2,
		    updated_at = now()
		where id = $1
	`, invoiceID, totals.FinalTotal, totals.Subtotal, totals.Discount, totals.Taxable, totals.CGST, totals.SGST, totals.IGST, totals.RoundOff, totals.Additional); err != nil {
		return PartnerInvoice{}, err
	}
	if err := s.insertPartnerAuditLogTx(ctx, tx, firmID, "INVOICE", invoiceID, "CREATE", nil, map[string]any{
		"invoiceNumber": invoiceNumber,
		"status":        "DRAFT",
		"amount":        totals.FinalTotal,
	}); err != nil {
		return PartnerInvoice{}, err
	}
	if err := tx.Commit(ctx); err != nil {
		return PartnerInvoice{}, err
	}
	invoices, err := s.GetPartnerInvoices(firmID)
	if err != nil {
		return PartnerInvoice{}, err
	}
	for _, invoice := range invoices {
		if invoice.ID == invoiceID {
			return invoice, nil
		}
	}
	return PartnerInvoice{}, fmt.Errorf("invoice not found")
}

func (s *Store) ensurePartnerOrderInvoiceTx(ctx context.Context, tx pgx.Tx, firmID, orderID, invoiceDate, dueDate, notes, targetStatus, quantityStatus string) (string, string, error) {
	targetStatus = strings.ToUpper(strings.TrimSpace(targetStatus))
	if targetStatus == "" {
		targetStatus = "DRAFT"
	}
	if targetStatus != "DRAFT" && targetStatus != "FINALIZED" {
		return "", "", fmt.Errorf("invoice status must be DRAFT or FINALIZED")
	}
	quantityStatus = strings.ToUpper(strings.TrimSpace(quantityStatus))
	if quantityStatus == "" {
		quantityStatus = targetStatus
	}
	if strings.TrimSpace(invoiceDate) == "" {
		invoiceDate = time.Now().UTC().Format("2006-01-02")
	}
	if strings.TrimSpace(dueDate) == "" {
		dueDate = invoiceDate
	}

	var invoiceID, invoiceNumber, currentStatus string
	err := tx.QueryRow(ctx, `
		select id, invoice_number, status
		from partner_invoices
		where firm_id = $1::bigint and order_id = $2 and status <> 'CANCELLED'
		order by created_at desc
		limit 1
		for update
	`, firmID, orderID).Scan(&invoiceID, &invoiceNumber, &currentStatus)
	if err == nil {
		switch currentStatus {
		case "DRAFT":
			if err := s.syncPartnerOrderInvoiceItemsTx(ctx, tx, firmID, invoiceID, orderID, quantityStatus); err != nil {
				return "", "", err
			}
			if _, err := tx.Exec(ctx, `
				update partner_invoices
				set status = $3,
				    invoice_date = case when $3 = 'FINALIZED' then $4::date else invoice_date end,
				    due_date = case when $3 = 'FINALIZED' then $5::date else due_date end,
				    updated_at = now()
				where firm_id = $1::bigint and id = $2
			`, firmID, invoiceID, targetStatus, invoiceDate, dueDate); err != nil {
				return "", "", err
			}
			if targetStatus == "FINALIZED" {
				if err := s.insertPartnerAuditLogTx(ctx, tx, firmID, "INVOICE", invoiceID, "FINALIZE", map[string]any{
					"status": "DRAFT",
				}, map[string]any{
					"status": "FINALIZED",
				}); err != nil {
					return "", "", err
				}
			}
			return invoiceID, invoiceNumber, nil
		case "FINALIZED":
			return invoiceID, invoiceNumber, nil
		default:
			return "", "", fmt.Errorf("invoice %s cannot be modified", currentStatus)
		}
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return "", "", err
	}

	invoiceID = nextID("pinv")
	invoiceNumber, err = s.nextPartnerInvoiceNumberTx(ctx, tx, firmID)
	if err != nil {
		return "", "", err
	}

	var clientBusinessID, clientOutletID string
	if err := tx.QueryRow(ctx, `
		select client_business_id, client_outlet_id
		from partner_orders
		where firm_id = $1::bigint and id = $2
		for update
	`, firmID, orderID).Scan(&clientBusinessID, &clientOutletID); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return "", "", fmt.Errorf("order not found")
		}
		return "", "", err
	}

	var header partnerInvoiceHeaderSnapshot
	var paymentTermsDays int
	if err := tx.QueryRow(ctx, `
		select
			coalesce(f.trade_name, f.name),
			coalesce(f.gstin, ''),
			coalesce(f.billing_address, ''),
			coalesce(f.state, f.city, ''),
			coalesce(b.billing_name, b.business_name),
			coalesce(b.gstin, ''),
			coalesce(b.billing_address, ''),
			coalesce(b.state, ''),
			coalesce(o.outlet_name, ''),
			coalesce(o.address, ''),
			coalesce((
				select c.name
				from partner_client_contacts c
				where c.firm_id = b.firm_id and c.client_business_id = b.id and c.is_primary
				order by c.sort_order asc, c.created_at asc
				limit 1
			), ''),
			coalesce((
				select c.phone
				from partner_client_contacts c
				where c.firm_id = b.firm_id and c.client_business_id = b.id and c.is_primary
				order by c.sort_order asc, c.created_at asc
				limit 1
			), ''),
			coalesce(nullif(b.state, ''), f.state, f.city, ''),
			coalesce(f.default_payment_terms_days, 0)
		from partner_firms f
		join partner_client_businesses b on b.firm_id = f.id and b.id = $2
		join partner_client_outlets o on o.id = $3 and o.client_business_id = b.id and o.firm_id = b.firm_id
		where f.id = $1
	`, firmID, clientBusinessID, clientOutletID).Scan(
		&header.FirmName, &header.FirmGSTIN, &header.FirmBillingAddress, &header.FirmState,
		&header.BillToName, &header.BillToGSTIN, &header.BillToAddress, &header.ClientState,
		&header.DeliverToName, &header.DeliverToAddress, &header.OutletContactName, &header.OutletContactPhone,
		&header.PlaceOfSupply, &paymentTermsDays,
	); err != nil {
		return "", "", err
	}
	header.ClientGSTIN = header.BillToGSTIN
	header.ClientBillingAddress = header.BillToAddress
	header.OutletShippingAddress = header.DeliverToAddress
	header.PaymentTerms = buildPaymentTerms(paymentTermsDays)
	if strings.TrimSpace(dueDate) == strings.TrimSpace(invoiceDate) {
		dueDate = dueDateForInvoice(invoiceDate, paymentTermsDays)
	}
	if _, err := tx.Exec(ctx, `
		insert into partner_invoices (
			id, firm_id, order_id, client_business_id, client_outlet_id, invoice_number, invoice_date, due_date,
			bill_to_name, bill_to_gstin, bill_to_address, deliver_to_name, deliver_to_address,
			firm_name, firm_gstin, firm_billing_address, firm_state, client_gstin, client_billing_address, client_state,
			outlet_shipping_address, outlet_contact_name, outlet_contact_phone, place_of_supply, payment_terms,
			amount, status, notes, created_by
		) values ($1, $2, $3, $4, $5, $6, $7::date, $8::date, $9, nullif($10, ''), nullif($11, ''), $12, nullif($13, ''),
		          nullif($14, ''), nullif($15, ''), nullif($16, ''), nullif($17, ''), nullif($18, ''), nullif($19, ''), nullif($20, ''),
		          nullif($21, ''), nullif($22, ''), nullif($23, ''), nullif($24, ''), nullif($25, ''),
		          0, $26, nullif($27, ''), $28)
	`, invoiceID, firmID, orderID, clientBusinessID, clientOutletID, invoiceNumber, invoiceDate, dueDate,
		header.BillToName, header.BillToGSTIN, header.BillToAddress, header.DeliverToName, header.DeliverToAddress,
		header.FirmName, header.FirmGSTIN, header.FirmBillingAddress, header.FirmState, header.ClientGSTIN, header.ClientBillingAddress, header.ClientState,
		header.OutletShippingAddress, header.OutletContactName, header.OutletContactPhone, header.PlaceOfSupply, header.PaymentTerms,
		targetStatus, strings.TrimSpace(notes), s.currentUserID); err != nil {
		return "", "", err
	}
	if err := s.syncPartnerOrderInvoiceItemsTx(ctx, tx, firmID, invoiceID, orderID, quantityStatus); err != nil {
		return "", "", err
	}
	if err := s.insertPartnerAuditLogTx(ctx, tx, firmID, "INVOICE", invoiceID, "CREATE", nil, map[string]any{
		"invoiceNumber": invoiceNumber,
		"status":        targetStatus,
	}); err != nil {
		return "", "", err
	}
	return invoiceID, invoiceNumber, nil
}

func (s *Store) syncPartnerOrderInvoiceItemsTx(ctx context.Context, tx pgx.Tx, firmID, invoiceID, orderID, orderStatus string) error {
	var sellerState, placeOfSupply string
	if err := tx.QueryRow(ctx, `
		select coalesce(firm_state, ''), coalesce(place_of_supply, '')
		from partner_invoices
		where firm_id = $1::bigint and id = $2
	`, firmID, invoiceID).Scan(&sellerState, &placeOfSupply); err != nil {
		return err
	}
	if _, err := tx.Exec(ctx, `
		delete from partner_invoice_items
		where firm_id = $1::bigint and invoice_id = $2
	`, firmID, invoiceID); err != nil {
		return err
	}

	lineRows, err := tx.Query(ctx, `
		select
			bl.id, bl.catalog_item_id, bl.item_code, bl.item_name,
			coalesce(pc.sku, bl.item_code), coalesce(pc.hsn_code, ''), coalesce(pc.unit, ''),
			coalesce(pc.gst_percentage, 0)::float8,
			coalesce(sum(case
				when $3 in ('DISPATCHED', 'DELIVERED', 'PARTIALLY_DELIVERED', 'RETURNED', 'PARTIALLY_RETURNED') then oi.dispatched_quantity
				when $3 = 'PACKED' then oi.packed_quantity
				else oi.quantity
			end), bl.quantity)::int as invoice_quantity,
			bl.mrp::float8, bl.seller_margin_percentage::float8, bl.rate::float8
		from partner_order_billable_lines bl
		join partner_product_catalog pc on pc.id = bl.catalog_item_id
		left join partner_order_items oi
			on oi.firm_id = bl.firm_id and oi.order_id = bl.order_id and oi.billable_line_id = bl.id
		where bl.firm_id = $1::bigint and bl.order_id = $2
		group by bl.id, bl.catalog_item_id, bl.item_code, bl.item_name, pc.sku, pc.hsn_code, pc.unit, pc.gst_percentage, bl.quantity, bl.mrp, bl.seller_margin_percentage, bl.rate, bl.created_at
		order by bl.created_at asc
	`, firmID, orderID, orderStatus)
	if err != nil {
		return err
	}
	invoiceLines := []PartnerInvoiceItem{}
	for lineRows.Next() {
		var billableLineID string
		var line PartnerInvoiceItem
		if err := lineRows.Scan(
			&billableLineID, &line.ItemID, &line.ItemCode, &line.ItemName, &line.SKU, &line.HSNSAC, &line.Unit, &line.GSTPercentage,
			&line.Quantity, &line.MRP, &line.DiscountPercentage, &line.Rate,
		); err != nil {
			lineRows.Close()
			return err
		}
		if line.Quantity <= 0 {
			continue
		}
		line.BillableLineID = billableLineID
		line = calculatePartnerInvoiceLine(line, sellerState, placeOfSupply)
		invoiceLines = append(invoiceLines, line)
	}
	lineRows.Close()
	if err := lineRows.Err(); err != nil {
		return err
	}
	if len(invoiceLines) == 0 {
		return fmt.Errorf("billable lines are required")
	}
	var totals partnerInvoiceTotals
	for _, line := range invoiceLines {
		if _, err := tx.Exec(ctx, `
			insert into partner_invoice_items (
				id, firm_id, invoice_id, order_billable_line_id, item_id, item_code, item_name,
				sku, hsn_sac, unit, quantity, mrp, discount_percentage, sell_margin_percentage, rate,
				discount_amount, taxable_value, gst_percentage, cgst_percentage, sgst_percentage, igst_percentage,
				cgst_amount, sgst_amount, igst_amount, total_tax_amount, line_total
			)
			values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
		`, nextID("piln"), firmID, invoiceID, line.BillableLineID, line.ItemID, line.ItemCode, line.ItemName,
			line.SKU, line.HSNSAC, line.Unit, line.Quantity, line.MRP, line.DiscountPercentage, line.SellMarginPercent, line.Rate,
			line.DiscountAmount, line.TaxableValue, line.GSTPercentage, line.CGSTPercentage, line.SGSTPercentage, line.IGSTPercentage,
			line.CGSTAmount, line.SGSTAmount, line.IGSTAmount, line.TotalTaxAmount, line.LineTotal); err != nil {
			return err
		}
		totals = addPartnerInvoiceTotals(totals, line)
	}
	_, err = tx.Exec(ctx, `
		update partner_invoices
		set amount = $3,
		    subtotal_amount = $4,
		    discount_amount = $5,
		    taxable_amount = $6,
		    cgst_amount = $7,
		    sgst_amount = $8,
		    igst_amount = $9,
		    round_off_amount = $10,
		    additional_charges_amount = $11,
		    final_total_amount = $3,
		    updated_at = now()
		where firm_id = $1::bigint and id = $2
	`, firmID, invoiceID, totals.FinalTotal, totals.Subtotal, totals.Discount, totals.Taxable, totals.CGST, totals.SGST, totals.IGST, totals.RoundOff, totals.Additional)
	return err
}

func (s *Store) GetPartnerInvoiceByID(firmID, invoiceID string) (PartnerInvoice, error) {
	items, err := s.GetPartnerInvoices(firmID)
	if err != nil {
		return PartnerInvoice{}, err
	}
	for _, item := range items {
		if item.ID == invoiceID {
			return item, nil
		}
	}
	return PartnerInvoice{}, fmt.Errorf("invoice not found")
}

func (s *Store) FinalizePartnerInvoice(firmID, invoiceID string) (PartnerInvoice, error) {
	ctx := context.Background()
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return PartnerInvoice{}, err
	}
	defer tx.Rollback(ctx)

	var currentStatus, orderID, clientBusinessID, invoiceNumber, invoiceDate string
	var amount float64
	if err := tx.QueryRow(ctx, `
		select status, coalesce(order_id, ''), client_business_id, invoice_number, invoice_date::text, amount::float8
		from partner_invoices
		where firm_id = $1::bigint and id = $2
		for update
	`, firmID, invoiceID).Scan(&currentStatus, &orderID, &clientBusinessID, &invoiceNumber, &invoiceDate, &amount); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return PartnerInvoice{}, fmt.Errorf("invoice not found")
		}
		return PartnerInvoice{}, err
	}
	if currentStatus == "FINALIZED" {
		if err := tx.Commit(ctx); err != nil {
			return PartnerInvoice{}, err
		}
		return s.GetPartnerInvoiceByID(firmID, invoiceID)
	}
	if currentStatus != "DRAFT" {
		return PartnerInvoice{}, fmt.Errorf("only draft invoices can be finalized")
	}
	if strings.TrimSpace(orderID) != "" {
		var orderStatus string
		if err := tx.QueryRow(ctx, `
			select status
			from partner_orders
			where firm_id = $1::bigint and id = $2
		`, firmID, orderID).Scan(&orderStatus); err != nil {
			return PartnerInvoice{}, err
		}
		if orderStatus != "DISPATCHED" && orderStatus != "DELIVERED" && orderStatus != "PARTIALLY_DELIVERED" && orderStatus != "RETURNED" && orderStatus != "PARTIALLY_RETURNED" {
			return PartnerInvoice{}, fmt.Errorf("invoice can only be finalized at dispatch or after dispatch")
		}
		if err := s.syncPartnerOrderInvoiceItemsTx(ctx, tx, firmID, invoiceID, orderID, orderStatus); err != nil {
			return PartnerInvoice{}, err
		}
	}
	if _, err := tx.Exec(ctx, `
		update partner_invoices
		set status = 'FINALIZED',
		    updated_at = now()
		where firm_id = $1::bigint and id = $2
	`, firmID, invoiceID); err != nil {
		return PartnerInvoice{}, err
	}
	if err := s.insertPartnerAuditLogTx(ctx, tx, firmID, "INVOICE", invoiceID, "FINALIZE", map[string]any{
		"status": currentStatus,
	}, map[string]any{
		"status": "FINALIZED",
	}); err != nil {
		return PartnerInvoice{}, err
	}
	if err := s.insertPartnerClientLedgerEntryTx(ctx, tx, firmID, clientBusinessID, invoiceDate, "INVOICE", invoiceID, invoiceNumber, "Invoice finalized", amount, 0); err != nil {
		return PartnerInvoice{}, err
	}
	if err := tx.Commit(ctx); err != nil {
		return PartnerInvoice{}, err
	}
	return s.GetPartnerInvoiceByID(firmID, invoiceID)
}

func (s *Store) CancelPartnerInvoice(firmID, invoiceID string) (PartnerInvoice, error) {
	ctx := context.Background()
	invoice, err := s.GetPartnerInvoiceByID(firmID, invoiceID)
	if err != nil {
		return PartnerInvoice{}, err
	}
	if invoice.Status == "CANCELLED" {
		return invoice, nil
	}
	if invoice.Status != "DRAFT" {
		return PartnerInvoice{}, fmt.Errorf("finalized invoices cannot be cancelled directly; use credit note or return flow")
	}
	if invoice.PaidAmount > 0 {
		return PartnerInvoice{}, fmt.Errorf("paid or partially paid invoices cannot be cancelled")
	}
	if _, err := s.pool.Exec(ctx, `
		update partner_invoices
		set status = 'CANCELLED', updated_at = now()
		where firm_id = $1::bigint and id = $2
	`, firmID, invoiceID); err != nil {
		return PartnerInvoice{}, err
	}
	_ = s.insertPartnerAuditLog(firmID, "INVOICE", invoiceID, "CANCEL", map[string]any{"status": invoice.Status}, map[string]any{"status": "CANCELLED"})
	return s.GetPartnerInvoiceByID(firmID, invoiceID)
}

func (s *Store) GetPartnerPurchases(firmID string) ([]PartnerPurchase, error) {
	ctx := context.Background()
	rows, err := s.pool.Query(ctx, `
		select
			p.id, p.firm_id, p.purchase_number, p.supplier_id, s.supplier_name,
			coalesce(p.supplier_invoice_number, ''), coalesce(p.supplier_invoice_date::text, ''), p.purchase_date::text,
			coalesce(p.expected_inward_date::text, ''), p.status, to_char(p.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), coalesce(cu.name, ''),
			coalesce(to_char(p.ordered_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), ''), coalesce(ou.name, ''),
			coalesce(to_char(p.posted_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), ''), coalesce(pu.name, ''),
			coalesce(to_char(p.cancelled_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), ''), coalesce(p.notes, '')
		from partner_purchases p
		join partner_suppliers s on s.id = p.supplier_id and s.firm_id = p.firm_id
		left join users cu on cu.id = p.created_by
		left join users ou on ou.id = p.ordered_by
		left join users pu on pu.id = p.posted_by
		where p.firm_id = $1::bigint
		order by p.purchase_date desc, p.created_at desc
	`, firmID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []PartnerPurchase
	indexByID := map[string]int{}
	for rows.Next() {
		var item PartnerPurchase
		if err := rows.Scan(
			&item.ID, &item.FirmID, &item.PurchaseNumber, &item.SupplierID, &item.SupplierName,
			&item.SupplierInvoiceNumber, &item.SupplierInvoiceDate, &item.PurchaseDate, &item.ExpectedInwardDate, &item.Status, &item.CreatedAt,
			&item.CreatedByName, &item.OrderedAt, &item.OrderedByName, &item.PostedAt, &item.PostedByName, &item.CancelledAt, &item.Notes,
		); err != nil {
			return nil, err
		}
		if item.Status == "POSTED" {
			item.Status = "RECEIVED"
		}
		item.StockPosted = item.Status == "RECEIVED"
		item.Items = []PartnerPurchaseItem{}
		items = append(items, item)
		indexByID[item.ID] = len(items) - 1
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	if len(items) == 0 {
		return []PartnerPurchase{}, nil
	}
	lineRows, err := s.pool.Query(ctx, `
		select id, purchase_id, item_id, item_code, item_name, coalesce(sku, ''), quantity,
		       coalesce(received_quantity, 0), coalesce(damaged_quantity, 0), cost_price::float8,
		       discount_percentage::float8, tax_percentage::float8, line_total::float8
		from partner_purchase_items
		where firm_id = $1::bigint
		order by created_at asc
	`, firmID)
	if err != nil {
		return nil, err
	}
	defer lineRows.Close()
	for lineRows.Next() {
		var line PartnerPurchaseItem
		if err := lineRows.Scan(
			&line.ID, &line.PurchaseID, &line.ItemID, &line.ItemCode, &line.ItemName, &line.SKU, &line.Quantity,
			&line.ReceivedQuantity, &line.DamagedQuantity, &line.CostPrice, &line.DiscountPercentage, &line.TaxPercentage, &line.LineTotal,
		); err != nil {
			return nil, err
		}
		idx, ok := indexByID[line.PurchaseID]
		if !ok {
			continue
		}
		items[idx].Items = append(items[idx].Items, line)
		items[idx].LineCount = len(items[idx].Items)
		items[idx].TotalQuantity += line.Quantity
		items[idx].ReceivedQuantity += line.ReceivedQuantity
		items[idx].DamagedQuantity += line.DamagedQuantity
		items[idx].TotalAmount += line.LineTotal
	}
	return items, lineRows.Err()
}

func (s *Store) GetPartnerPurchaseByID(firmID, purchaseID string) (PartnerPurchase, error) {
	items, err := s.GetPartnerPurchases(firmID)
	if err != nil {
		return PartnerPurchase{}, err
	}
	for _, item := range items {
		if item.ID == purchaseID {
			return item, nil
		}
	}
	return PartnerPurchase{}, fmt.Errorf("purchase not found")
}

func (s *Store) GetPartnerGoodsReceipts(firmID, purchaseID string) ([]PartnerGoodsReceipt, error) {
	ctx := context.Background()
	rows, err := s.pool.Query(ctx, `
		select g.id, g.firm_id, g.purchase_id, g.grn_number, g.supplier_id, s.supplier_name,
		       g.received_date::text, coalesce(g.notes, ''),
		       to_char(g.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), coalesce(u.name, '')
		from partner_goods_receipts g
		join partner_suppliers s on s.firm_id = g.firm_id and s.id = g.supplier_id
		left join users u on u.id = g.created_by
		where g.firm_id = $1::bigint and g.purchase_id = $2
		order by g.received_date desc, g.created_at desc
	`, firmID, purchaseID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := []PartnerGoodsReceipt{}
	indexByID := map[string]int{}
	for rows.Next() {
		var item PartnerGoodsReceipt
		if err := rows.Scan(
			&item.ID, &item.FirmID, &item.PurchaseID, &item.GRNNumber, &item.SupplierID, &item.SupplierName,
			&item.ReceivedDate, &item.Notes, &item.CreatedAt, &item.CreatedByName,
		); err != nil {
			return nil, err
		}
		item.Items = []PartnerGoodsReceiptItem{}
		items = append(items, item)
		indexByID[item.ID] = len(items) - 1
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	if len(items) == 0 {
		return []PartnerGoodsReceipt{}, nil
	}
	lineRows, err := s.pool.Query(ctx, `
		select gi.id, gi.grn_id, gi.purchase_item_id, gi.item_id, coalesce(pi.item_name, ''), coalesce(pi.sku, ''),
		       gi.ordered_quantity, gi.received_quantity, gi.damaged_quantity, coalesce(gi.notes, '')
		from partner_goods_receipt_items gi
		left join partner_purchase_items pi on pi.firm_id = gi.firm_id and pi.id = gi.purchase_item_id
		where gi.firm_id = $1::bigint
		  and gi.grn_id = any($2)
		order by gi.created_at asc
	`, firmID, goodsReceiptIDs(items))
	if err != nil {
		return nil, err
	}
	defer lineRows.Close()
	for lineRows.Next() {
		var line PartnerGoodsReceiptItem
		if err := lineRows.Scan(
			&line.ID, &line.GRNID, &line.PurchaseItemID, &line.ItemID, &line.ItemName, &line.SKU,
			&line.OrderedQuantity, &line.ReceivedQuantity, &line.DamagedQuantity, &line.Notes,
		); err != nil {
			return nil, err
		}
		idx, ok := indexByID[line.GRNID]
		if !ok {
			continue
		}
		items[idx].Items = append(items[idx].Items, line)
	}
	return items, lineRows.Err()
}

func goodsReceiptIDs(items []PartnerGoodsReceipt) []string {
	ids := make([]string, 0, len(items))
	for _, item := range items {
		ids = append(ids, item.ID)
	}
	return ids
}

func (s *Store) CreatePartnerPurchase(firmID string, input CreatePartnerPurchaseInput) (PartnerPurchase, error) {
	ctx := context.Background()
	if strings.TrimSpace(input.SupplierID) == "" || strings.TrimSpace(input.PurchaseNumber) == "" || strings.TrimSpace(input.PurchaseDate) == "" {
		return PartnerPurchase{}, fmt.Errorf("supplierId, purchaseNumber, and purchaseDate are required")
	}
	if len(input.Items) == 0 {
		return PartnerPurchase{}, fmt.Errorf("items are required")
	}
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return PartnerPurchase{}, err
	}
	defer tx.Rollback(ctx)

	var supplierStatus string
	if err := tx.QueryRow(ctx, `
		select status
		from partner_suppliers
		where firm_id = $1::bigint and id = $2
	`, firmID, strings.TrimSpace(input.SupplierID)).Scan(&supplierStatus); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return PartnerPurchase{}, fmt.Errorf("supplier not found")
		}
		return PartnerPurchase{}, err
	}
	if supplierStatus != "ACTIVE" {
		return PartnerPurchase{}, fmt.Errorf("supplier must be active")
	}

	purchaseID := nextID("ppur")
	if _, err := tx.Exec(ctx, `
		insert into partner_purchases (
			id, firm_id, supplier_id, purchase_number, supplier_invoice_number, supplier_invoice_date,
			purchase_date, expected_inward_date, status, notes, created_by
		) values ($1, $2, $3, $4, nullif($5, ''), nullif($6, '')::date, $7::date, nullif($8, '')::date, 'DRAFT', nullif($9, ''), $10)
	`, purchaseID, firmID, input.SupplierID, strings.TrimSpace(input.PurchaseNumber), strings.TrimSpace(input.SupplierInvoiceNumber), strings.TrimSpace(input.SupplierInvoiceDate), strings.TrimSpace(input.PurchaseDate), strings.TrimSpace(input.ExpectedInwardDate), strings.TrimSpace(input.Notes), s.currentUserID); err != nil {
		return PartnerPurchase{}, err
	}
	for _, line := range input.Items {
		if line.Quantity <= 0 || line.CostPrice < 0 {
			return PartnerPurchase{}, fmt.Errorf("quantity must be positive and costPrice cannot be negative")
		}
		var catalogItemID, itemCode, itemName, sku string
		err := tx.QueryRow(ctx, `
			select c.id, c.sku, c.name, c.sku
			from partner_product_catalog c
			join partner_firm_brands fb on fb.brand_id = c.brand_id
			where fb.firm_id = $1::bigint and c.id = $2 and c.status = 'ACTIVE'
		`, firmID, strings.TrimSpace(line.ItemID)).Scan(&catalogItemID, &itemCode, &itemName, &sku)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				err = tx.QueryRow(ctx, `
					select c.id, c.sku, c.name, c.sku
					from partner_firm_inventory_items i
					join partner_product_catalog c on c.id = i.catalog_item_id
					where i.firm_id = $1::bigint and i.item_id = $2 and c.status = 'ACTIVE'
				`, firmID, strings.TrimSpace(line.ItemID)).Scan(&catalogItemID, &itemCode, &itemName, &sku)
				if errors.Is(err, pgx.ErrNoRows) {
					return PartnerPurchase{}, fmt.Errorf("catalog item not found")
				}
				if err != nil {
					return PartnerPurchase{}, err
				}
			} else {
				return PartnerPurchase{}, err
			}
		}
		lineTotal := float64(line.Quantity) * line.CostPrice * (1 - line.DiscountPercentage/100) * (1 + line.TaxPercentage/100)
		if _, err := tx.Exec(ctx, `
			insert into partner_purchase_items (
				id, firm_id, purchase_id, item_id, item_code, item_name, sku, quantity, cost_price, discount_percentage, tax_percentage, line_total
			) values ($1, $2, $3, $4, $5, $6, nullif($7, ''), $8, $9, $10, $11, $12)
		`, nextID("ppit"), firmID, purchaseID, catalogItemID, itemCode, itemName, sku, line.Quantity, line.CostPrice, line.DiscountPercentage, line.TaxPercentage, lineTotal); err != nil {
			return PartnerPurchase{}, err
		}
	}
	if err := tx.Commit(ctx); err != nil {
		return PartnerPurchase{}, err
	}
	return s.GetPartnerPurchaseByID(firmID, purchaseID)
}

func (s *Store) OrderPartnerPurchase(firmID, purchaseID string) (PartnerPurchase, error) {
	ctx := context.Background()
	purchase, err := s.GetPartnerPurchaseByID(firmID, purchaseID)
	if err != nil {
		return PartnerPurchase{}, err
	}
	if purchase.Status == "ORDERED" || purchase.Status == "PARTIALLY_RECEIVED" || purchase.Status == "RECEIVED" {
		return purchase, nil
	}
	if purchase.Status == "CANCELLED" {
		return PartnerPurchase{}, fmt.Errorf("cancelled purchases cannot be ordered")
	}
	if _, err := s.pool.Exec(ctx, `
		update partner_purchases
		set status = 'ORDERED', ordered_at = now(), ordered_by = $3, updated_at = now()
		where firm_id = $1::bigint and id = $2 and status = 'DRAFT'
	`, firmID, purchaseID, s.currentUserID); err != nil {
		return PartnerPurchase{}, err
	}
	_ = s.insertPartnerAuditLog(firmID, "PURCHASE", purchaseID, "ORDER", map[string]any{"status": purchase.Status}, map[string]any{
		"status":         "ORDERED",
		"purchaseNumber": purchase.PurchaseNumber,
	})
	return s.GetPartnerPurchaseByID(firmID, purchaseID)
}

func (s *Store) ReceivePartnerPurchase(firmID, purchaseID string, input ReceivePartnerPurchaseInput) (PartnerPurchase, error) {
	ctx := context.Background()
	purchase, err := s.GetPartnerPurchaseByID(firmID, purchaseID)
	if err != nil {
		return PartnerPurchase{}, err
	}
	if purchase.Status == "DRAFT" {
		return PartnerPurchase{}, fmt.Errorf("purchase must be ordered before receiving stock")
	}
	if purchase.Status == "CANCELLED" {
		return PartnerPurchase{}, fmt.Errorf("cancelled purchases cannot be received")
	}
	if purchase.Status == "RECEIVED" {
		return PartnerPurchase{}, fmt.Errorf("purchase is already fully received")
	}
	receivedDate := strings.TrimSpace(input.ReceivedDate)
	if receivedDate == "" {
		receivedDate = time.Now().UTC().Format("2006-01-02")
	}
	if _, err := time.Parse("2006-01-02", receivedDate); err != nil {
		return PartnerPurchase{}, fmt.Errorf("receivedDate must be in YYYY-MM-DD format")
	}
	if len(input.Items) == 0 {
		return PartnerPurchase{}, fmt.Errorf("items are required")
	}
	linesByID := make(map[string]PartnerPurchaseItem, len(purchase.Items))
	linesByItemID := make(map[string]PartnerPurchaseItem, len(purchase.Items))
	for _, line := range purchase.Items {
		linesByID[line.ID] = line
		linesByItemID[line.ItemID] = line
	}
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return PartnerPurchase{}, err
	}
	defer tx.Rollback(ctx)

	grnID := nextID("pgrn")
	grnNumber := fmt.Sprintf("GRN-%s-%s", time.Now().UTC().Format("20060102"), strings.TrimPrefix(grnID, "pgrn_"))
	if _, err := tx.Exec(ctx, `
		insert into partner_goods_receipts (
			id, firm_id, purchase_id, grn_number, supplier_id, received_date, notes, created_by
		) values ($1, $2, $3, $4, $5, $6::date, nullif($7, ''), $8)
	`, grnID, firmID, purchaseID, grnNumber, purchase.SupplierID, receivedDate, strings.TrimSpace(input.Notes), s.currentUserID); err != nil {
		return PartnerPurchase{}, err
	}

	anyReceived := false
	for _, receiptLine := range input.Items {
		line := PartnerPurchaseItem{}
		if strings.TrimSpace(receiptLine.PurchaseItemID) != "" {
			line = linesByID[strings.TrimSpace(receiptLine.PurchaseItemID)]
		} else {
			line = linesByItemID[strings.TrimSpace(receiptLine.ItemID)]
		}
		if line.ID == "" {
			return PartnerPurchase{}, fmt.Errorf("purchase item not found")
		}
		if receiptLine.ReceivedQuantity < 0 || receiptLine.DamagedQuantity < 0 {
			return PartnerPurchase{}, fmt.Errorf("received and damaged quantities cannot be negative")
		}
		accountedQuantity := receiptLine.ReceivedQuantity + receiptLine.DamagedQuantity
		if accountedQuantity <= 0 {
			return PartnerPurchase{}, fmt.Errorf("received or damaged quantity is required")
		}
		remaining := line.Quantity - line.ReceivedQuantity - line.DamagedQuantity
		if accountedQuantity > remaining {
			return PartnerPurchase{}, fmt.Errorf("received quantity exceeds remaining quantity for %s", line.ItemName)
		}
		inventoryItemID := ""
		if err := tx.QueryRow(ctx, `
			select item_id
			from partner_firm_inventory_items
			where firm_id = $1::bigint and item_id = $2
		`, firmID, line.ItemID).Scan(&inventoryItemID); err != nil {
			if !errors.Is(err, pgx.ErrNoRows) {
				return PartnerPurchase{}, err
			}
		}
		if inventoryItemID == "" {
			var defaultMRP int
			var defaultDiscount float64
			if err := tx.QueryRow(ctx, `
				select c.default_mrp, c.default_discount_percentage::float8
				from partner_product_catalog c
				join partner_firm_brands fb on fb.brand_id = c.brand_id
				where fb.firm_id = $1::bigint and c.id = $2 and c.status = 'ACTIVE'
			`, firmID, line.ItemID).Scan(&defaultMRP, &defaultDiscount); err != nil {
				if errors.Is(err, pgx.ErrNoRows) {
					return PartnerPurchase{}, fmt.Errorf("catalog item not found for %s", line.ItemName)
				}
				return PartnerPurchase{}, err
			}
			if err := tx.QueryRow(ctx, `
				select item_id
				from partner_firm_inventory_items
				where firm_id = $1::bigint and catalog_item_id = $2 and mrp = $3 and discount_percentage = $4
				limit 1
			`, firmID, line.ItemID, defaultMRP, defaultDiscount).Scan(&inventoryItemID); err != nil {
				if !errors.Is(err, pgx.ErrNoRows) {
					return PartnerPurchase{}, err
				}
			}
			if inventoryItemID == "" {
				inventoryItemID = nextID("pfi")
				if _, err := tx.Exec(ctx, `
					insert into partner_firm_inventory_items (
						item_id, firm_id, catalog_item_id, mrp, discount_percentage, status, quantity
					) values ($1, $2, $3, $4, $5, 'ACTIVE', 0)
				`, inventoryItemID, firmID, line.ItemID, defaultMRP, defaultDiscount); err != nil {
					return PartnerPurchase{}, err
				}
			}
		}
		if _, err := tx.Exec(ctx, `
			insert into partner_goods_receipt_items (
				id, firm_id, grn_id, purchase_item_id, item_id, ordered_quantity, received_quantity, damaged_quantity, notes
			) values ($1, $2, $3, $4, $5, $6, $7, $8, nullif($9, ''))
		`, nextID("pgri"), firmID, grnID, line.ID, inventoryItemID, line.Quantity, receiptLine.ReceivedQuantity, receiptLine.DamagedQuantity, strings.TrimSpace(receiptLine.Notes)); err != nil {
			return PartnerPurchase{}, err
		}
		if _, err := tx.Exec(ctx, `
			update partner_purchase_items
			set received_quantity = received_quantity + $4,
			    damaged_quantity = damaged_quantity + $5
			where firm_id = $1::bigint and purchase_id = $2 and id = $3
		`, firmID, purchaseID, line.ID, receiptLine.ReceivedQuantity, receiptLine.DamagedQuantity); err != nil {
			return PartnerPurchase{}, err
		}
		if receiptLine.ReceivedQuantity <= 0 {
			continue
		}
		anyReceived = true
		if _, err := tx.Exec(ctx, `
			update partner_firm_inventory_items
			set quantity = quantity + $3,
			    updated_at = now()
			where firm_id = $1::bigint and item_id = $2
		`, firmID, inventoryItemID, receiptLine.ReceivedQuantity); err != nil {
			return PartnerPurchase{}, err
		}
		note := fmt.Sprintf("GRN %s for purchase %s", grnNumber, purchase.PurchaseNumber)
		if strings.TrimSpace(input.Notes) != "" {
			note = note + ": " + strings.TrimSpace(input.Notes)
		}
		if _, err := tx.Exec(ctx, `
			insert into partner_stock_entries (
				id, firm_id, item_id, quantity_delta, reason_type, reference_type, reference_id, note, created_by, unit_cost, created_at
			) values ($1, $2, $3, $4, 'PURCHASE', 'PURCHASE', $5, $6, $7, $8, now())
		`, nextID("pstock"), firmID, inventoryItemID, receiptLine.ReceivedQuantity, grnID, note, s.currentUserID, line.CostPrice); err != nil {
			return PartnerPurchase{}, err
		}
		if _, err := tx.Exec(ctx, `
			insert into partner_inventory_receipts (
				id, firm_id, item_id, supplier_id, quantity, received_at, note, created_by
			) values ($1, $2, $3, $4, $5, $6::date, nullif($7, ''), $8)
		`, nextID("prec"), firmID, inventoryItemID, purchase.SupplierID, receiptLine.ReceivedQuantity, receivedDate, note, s.currentUserID); err != nil {
			return PartnerPurchase{}, err
		}
	}

	var totalOrdered, totalAccounted int
	if err := tx.QueryRow(ctx, `
		select coalesce(sum(quantity), 0)::int,
		       coalesce(sum(received_quantity + damaged_quantity), 0)::int
		from partner_purchase_items
		where firm_id = $1::bigint and purchase_id = $2
	`, firmID, purchaseID).Scan(&totalOrdered, &totalAccounted); err != nil {
		return PartnerPurchase{}, err
	}
	nextStatus := "PARTIALLY_RECEIVED"
	if totalAccounted >= totalOrdered {
		nextStatus = "RECEIVED"
	}
	if _, err := tx.Exec(ctx, `
		update partner_purchases
		set status = $3,
		    posted_at = case when $3 = 'RECEIVED' then coalesce(posted_at, now()) else posted_at end,
		    posted_by = case when $3 = 'RECEIVED' then coalesce(posted_by, $4) else posted_by end,
		    updated_at = now()
		where firm_id = $1::bigint and id = $2
	`, firmID, purchaseID, nextStatus, s.currentUserID); err != nil {
		return PartnerPurchase{}, err
	}
	if err := s.insertPartnerAuditLogTx(ctx, tx, firmID, "PURCHASE", purchaseID, "RECEIVE", map[string]any{"status": purchase.Status}, map[string]any{
		"status":         nextStatus,
		"purchaseNumber": purchase.PurchaseNumber,
		"grnNumber":      grnNumber,
		"stockReceived":  anyReceived,
	}); err != nil {
		return PartnerPurchase{}, err
	}
	if err := tx.Commit(ctx); err != nil {
		return PartnerPurchase{}, err
	}
	return s.GetPartnerPurchaseByID(firmID, purchaseID)
}

func (s *Store) CancelPartnerPurchase(firmID, purchaseID string) (PartnerPurchase, error) {
	ctx := context.Background()
	purchase, err := s.GetPartnerPurchaseByID(firmID, purchaseID)
	if err != nil {
		return PartnerPurchase{}, err
	}
	if purchase.Status == "PARTIALLY_RECEIVED" || purchase.Status == "RECEIVED" {
		return PartnerPurchase{}, fmt.Errorf("received purchases cannot be cancelled")
	}
	if _, err := s.pool.Exec(ctx, `
		update partner_purchases
		set status = 'CANCELLED', cancelled_at = now(), updated_at = now()
		where firm_id = $1::bigint and id = $2
	`, firmID, purchaseID); err != nil {
		return PartnerPurchase{}, err
	}
	return s.GetPartnerPurchaseByID(firmID, purchaseID)
}

func (s *Store) GetPartnerStockLedger(firmID, itemID string, filters PartnerStockLedgerFilters) ([]PartnerStockLedgerEntry, error) {
	ctx := context.Background()
	query := strings.TrimSpace(filters.Query)
	rows, err := s.pool.Query(ctx, `
		select id, firm_id, item_id, quantity_delta, reason_type, coalesce(reference_type, ''), coalesce(reference_id, ''), coalesce(note, ''),
		       to_char(created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), coalesce(unit_cost::float8, 0)
		from partner_stock_entries
		where firm_id = $1::bigint and item_id = $2
		  and ($3 = '' or reason_type = $3)
		  and ($4 = '' or coalesce(reference_type, '') = $4)
		  and ($5 = '' or created_at::date >= $5::date)
		  and ($6 = '' or created_at::date <= $6::date)
		  and ($7 = '' or coalesce(note, '') ilike '%' || $7 || '%' or coalesce(reference_type, '') ilike '%' || $7 || '%' or coalesce(reference_id, '') ilike '%' || $7 || '%')
		order by created_at desc
	`, firmID, itemID, strings.TrimSpace(filters.ReasonType), strings.TrimSpace(filters.ReferenceType), strings.TrimSpace(filters.FromDate), strings.TrimSpace(filters.ToDate), query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []PartnerStockLedgerEntry
	for rows.Next() {
		var item PartnerStockLedgerEntry
		if err := rows.Scan(&item.ID, &item.FirmID, &item.ItemID, &item.QuantityDelta, &item.ReasonType, &item.ReferenceType, &item.ReferenceID, &item.Note, &item.CreatedAt, &item.UnitCost); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	if items == nil {
		return []PartnerStockLedgerEntry{}, nil
	}
	return items, rows.Err()
}

func (s *Store) GetPartnerStockLedgerByReference(firmID, referenceType, referenceID string) ([]PartnerStockLedgerEntry, error) {
	ctx := context.Background()
	rows, err := s.pool.Query(ctx, `
		select id, firm_id, item_id, quantity_delta, reason_type, coalesce(reference_type, ''), coalesce(reference_id, ''), coalesce(note, ''),
		       to_char(created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), coalesce(unit_cost::float8, 0)
		from partner_stock_entries
		where firm_id = $1::bigint and reference_type = $2 and reference_id = $3
		order by created_at desc
	`, firmID, strings.TrimSpace(referenceType), strings.TrimSpace(referenceID))
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []PartnerStockLedgerEntry
	for rows.Next() {
		var item PartnerStockLedgerEntry
		if err := rows.Scan(&item.ID, &item.FirmID, &item.ItemID, &item.QuantityDelta, &item.ReasonType, &item.ReferenceType, &item.ReferenceID, &item.Note, &item.CreatedAt, &item.UnitCost); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	if items == nil {
		return []PartnerStockLedgerEntry{}, nil
	}
	return items, rows.Err()
}

func (s *Store) GetPartnerReceivablesSummary(firmID string, filters GetPartnerReceivablesSummaryInput) (PartnerReceivablesSummary, error) {
	invoices, err := s.GetPartnerInvoices(firmID)
	if err != nil {
		return PartnerReceivablesSummary{}, err
	}
	search := strings.ToLower(strings.TrimSpace(filters.Search))
	status := strings.ToUpper(strings.TrimSpace(filters.Status))
	businessMap := map[string]*PartnerReceivableBusinessSummary{}
	dueToday := 0
	today := time.Now().UTC().Format("2006-01-02")

	for _, invoice := range invoices {
		if invoice.Status == "DRAFT" || invoice.Status == "CANCELLED" {
			continue
		}
		if strings.TrimSpace(filters.FromDate) != "" && invoice.InvoiceDate < filters.FromDate {
			continue
		}
		if strings.TrimSpace(filters.ToDate) != "" && invoice.InvoiceDate > filters.ToDate {
			continue
		}
		if search != "" && !strings.Contains(strings.ToLower(invoice.ClientBusinessName), search) &&
			!strings.Contains(strings.ToLower(invoice.InvoiceNumber), search) &&
			!strings.Contains(strings.ToLower(invoice.ClientOutletName), search) {
			continue
		}
		outstanding := roundCurrency(invoice.DueAmount)
		ageDays := partnerAgeDays(firstNonEmpty(invoice.DueDate, invoice.InvoiceDate), time.Now().UTC())
		isOverdue := invoice.PaymentStatus == "OVERDUE"
		if filters.OverdueOnly && !isOverdue {
			continue
		}
		switch status {
		case "OUTSTANDING":
			if outstanding <= 0 {
				continue
			}
		case "OVERDUE":
			if !isOverdue {
				continue
			}
		case "UNPAID", "PARTIALLY_PAID", "PAID":
			if invoice.PaymentStatus != status {
				continue
			}
		}
		if outstanding > 0 && firstNonEmpty(invoice.DueDate, invoice.InvoiceDate) == today {
			dueToday++
		}
		summary := businessMap[invoice.ClientBusinessID]
		if summary == nil {
			summary = &PartnerReceivableBusinessSummary{
				BusinessID:         invoice.ClientBusinessID,
				BusinessName:       invoice.ClientBusinessName,
				LatestActivityDate: invoice.InvoiceDate,
				Outlets:            []PartnerReceivableOutletSummary{},
				Invoices:           []PartnerReceivableInvoiceSummary{},
			}
			businessMap[invoice.ClientBusinessID] = summary
		}
		summary.TotalInvoiced = roundCurrency(summary.TotalInvoiced + invoice.Amount)
		summary.TotalPaid = roundCurrency(summary.TotalPaid + invoice.PaidAmount)
		summary.Outstanding = roundCurrency(summary.Outstanding + outstanding)
		if invoice.InvoiceDate > summary.LatestActivityDate {
			summary.LatestActivityDate = invoice.InvoiceDate
		}
		if isOverdue {
			switch {
			case ageDays <= 30:
				summary.Overdue0To30 = roundCurrency(summary.Overdue0To30 + outstanding)
			case ageDays <= 60:
				summary.Overdue31To60 = roundCurrency(summary.Overdue31To60 + outstanding)
			case ageDays <= 90:
				summary.Overdue61To90 = roundCurrency(summary.Overdue61To90 + outstanding)
			default:
				summary.Overdue90Plus = roundCurrency(summary.Overdue90Plus + outstanding)
			}
		}
		summary.Invoices = append(summary.Invoices, PartnerReceivableInvoiceSummary{
			InvoiceID:     invoice.ID,
			InvoiceNumber: invoice.InvoiceNumber,
			ClientID:      invoice.ClientBusinessID,
			ClientName:    invoice.ClientBusinessName,
			OutletID:      invoice.ClientOutletID,
			OutletName:    invoice.ClientOutletName,
			InvoiceDate:   invoice.InvoiceDate,
			DueDate:       firstNonEmpty(invoice.DueDate, invoice.InvoiceDate),
			Amount:        invoice.Amount,
			PaidAmount:    invoice.PaidAmount,
			Outstanding:   outstanding,
			AgeDays:       int(math.Max(float64(ageDays), 0)),
			AgingBucket:   partnerAgingBucket(int(math.Max(float64(ageDays), 0))),
			Status:        map[bool]string{true: "OVERDUE", false: "CURRENT"}[isOverdue],
			PaymentStatus: invoice.PaymentStatus,
		})
	}

	out := PartnerReceivablesSummary{Businesses: []PartnerReceivableBusinessSummary{}, InvoicesDueToday: dueToday}
	for _, summary := range businessMap {
		outletMap := map[string]*PartnerReceivableOutletSummary{}
		for _, invoice := range summary.Invoices {
			outlet := outletMap[invoice.OutletID]
			if outlet == nil {
				outlet = &PartnerReceivableOutletSummary{OutletID: invoice.OutletID, OutletName: invoice.OutletName}
				outletMap[invoice.OutletID] = outlet
			}
			outlet.TotalInvoiced = roundCurrency(outlet.TotalInvoiced + invoice.Amount)
			outlet.TotalPaid = roundCurrency(outlet.TotalPaid + invoice.PaidAmount)
			outlet.Outstanding = roundCurrency(outlet.Outstanding + invoice.Outstanding)
		}
		for _, outlet := range outletMap {
			summary.Outlets = append(summary.Outlets, *outlet)
		}
		summary.OutletCount = len(summary.Outlets)
		out.TotalReceivables = roundCurrency(out.TotalReceivables + summary.Outstanding)
		out.OverdueReceivables = roundCurrency(out.OverdueReceivables + summary.Overdue0To30 + summary.Overdue31To60 + summary.Overdue61To90 + summary.Overdue90Plus)
		if summary.Outstanding > 0 {
			out.ClientsWithDues++
		}
		out.Businesses = append(out.Businesses, *summary)
	}
	return out, nil
}

func (s *Store) GetPartnerPayments(firmID string, filters GetPartnerPaymentsInput) ([]PartnerPayment, error) {
	ctx := context.Background()
	rows, err := s.pool.Query(ctx, `
		select
			p.id, p.firm_id, coalesce(p.reference_number, p.id), p.client_business_id, b.business_name,
			p.payment_date::text, p.payment_mode, coalesce(p.reference_number, ''), 'ACTIVE',
			to_char(p.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
			coalesce(u.name, ''), coalesce(p.collected_by::text, ''), coalesce(cu.name, ''),
			p.amount::float8, coalesce(p.notes, '')
		from partner_payments p
		join partner_client_businesses b on b.firm_id = p.firm_id and b.id = p.client_business_id
		left join users u on u.id = p.created_by
		left join users cu on cu.id = p.collected_by
		where p.firm_id = $1::bigint
		  and ($2 = '' or p.client_business_id = $2)
		  and ($3 = '' or p.payment_date >= $3::date)
		  and ($4 = '' or p.payment_date <= $4::date)
		  and ($5 = '' or b.business_name ilike '%' || $5 || '%' or p.reference_number ilike '%' || $5 || '%')
		  and ($6 = '' or exists (
		  	select 1 from partner_payment_allocations pa
		  	where pa.firm_id = p.firm_id and pa.payment_id = p.id and pa.invoice_id = $6
		  ))
		order by p.payment_date desc, p.created_at desc
	`, firmID, strings.TrimSpace(filters.ClientBusinessID), strings.TrimSpace(filters.FromDate), strings.TrimSpace(filters.ToDate), strings.TrimSpace(filters.Search), strings.TrimSpace(filters.InvoiceID))
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := []PartnerPayment{}
	indexByID := map[string]int{}
	for rows.Next() {
		var item PartnerPayment
		if err := rows.Scan(
			&item.ID, &item.FirmID, &item.PaymentReference, &item.ClientBusinessID, &item.ClientBusinessName,
			&item.PaymentDate, &item.Mode, &item.ReferenceNumber, &item.Status, &item.CreatedAt, &item.RecordedByName,
			&item.CollectedByUserID, &item.CollectedByName, &item.Amount, &item.Notes,
		); err != nil {
			return nil, err
		}
		item.Allocations = []PartnerPaymentAllocation{}
		items = append(items, item)
		indexByID[item.ID] = len(items) - 1
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	allocationRows, err := s.pool.Query(ctx, `
		select pa.id, pa.payment_id, pa.invoice_id, i.invoice_number, i.invoice_date::text, i.amount::float8, pa.amount::float8
		from partner_payment_allocations pa
		join partner_invoices i on i.firm_id = pa.firm_id and i.id = pa.invoice_id
		where pa.firm_id = $1::bigint
		order by pa.created_at asc
	`, firmID)
	if err != nil {
		return nil, err
	}
	defer allocationRows.Close()
	for allocationRows.Next() {
		var allocation PartnerPaymentAllocation
		if err := allocationRows.Scan(&allocation.ID, &allocation.PaymentID, &allocation.InvoiceID, &allocation.InvoiceNumber, &allocation.InvoiceDate, &allocation.InvoiceAmount, &allocation.Amount); err != nil {
			return nil, err
		}
		if idx, ok := indexByID[allocation.PaymentID]; ok {
			items[idx].AllocatedAmount = roundCurrency(items[idx].AllocatedAmount + allocation.Amount)
			items[idx].Allocations = append(items[idx].Allocations, allocation)
		}
	}
	if err := allocationRows.Err(); err != nil {
		return nil, err
	}
	invoices, err := s.GetPartnerInvoices(firmID)
	if err != nil {
		return nil, err
	}
	dueByInvoice := map[string]float64{}
	for _, invoice := range invoices {
		dueByInvoice[invoice.ID] = invoice.DueAmount
	}
	for i := range items {
		items[i].UnallocatedAmount = math.Max(roundCurrency(items[i].Amount-items[i].AllocatedAmount), 0)
		for j := range items[i].Allocations {
			items[i].Allocations[j].InvoiceDueAmount = dueByInvoice[items[i].Allocations[j].InvoiceID]
		}
	}
	return items, nil
}

func (s *Store) CreatePartnerPayment(firmID string, input CreatePartnerPaymentInput) (PartnerPayment, error) {
	ctx := context.Background()
	invoiceID := strings.TrimSpace(input.InvoiceID)
	mode := strings.ToUpper(strings.TrimSpace(input.PaymentMode))
	if invoiceID == "" || strings.TrimSpace(input.PaymentDate) == "" || mode == "" {
		return PartnerPayment{}, fmt.Errorf("invoice, payment date, and payment mode are required")
	}
	if input.Amount <= 0 {
		return PartnerPayment{}, fmt.Errorf("amount must be greater than zero")
	}
	switch mode {
	case "CASH", "UPI", "BANK_TRANSFER", "CHEQUE", "OTHER":
	default:
		return PartnerPayment{}, fmt.Errorf("unsupported payment mode")
	}
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return PartnerPayment{}, err
	}
	defer tx.Rollback(ctx)
	var clientBusinessID, invoiceNumber, invoiceDate, status string
	var invoiceAmount float64
	if err := tx.QueryRow(ctx, `
		select client_business_id, invoice_number, invoice_date::text, status, amount::float8
		from partner_invoices
		where firm_id = $1::bigint and id = $2
		for update
	`, firmID, invoiceID).Scan(&clientBusinessID, &invoiceNumber, &invoiceDate, &status, &invoiceAmount); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return PartnerPayment{}, fmt.Errorf("invoice not found")
		}
		return PartnerPayment{}, err
	}
	if status != "FINALIZED" {
		return PartnerPayment{}, fmt.Errorf("payments can only be recorded against finalized invoices")
	}
	var paid, credits, debits float64
	if err := tx.QueryRow(ctx, `select coalesce(sum(amount), 0)::float8 from partner_payment_allocations where firm_id = $1::bigint and invoice_id = $2`, firmID, invoiceID).Scan(&paid); err != nil {
		return PartnerPayment{}, err
	}
	if err := tx.QueryRow(ctx, `select coalesce(sum(total_amount), 0)::float8 from partner_credit_notes where firm_id = $1::bigint and related_invoice_id = $2 and status = 'ISSUED'`, firmID, invoiceID).Scan(&credits); err != nil {
		return PartnerPayment{}, err
	}
	if err := tx.QueryRow(ctx, `select coalesce(sum(total_amount), 0)::float8 from partner_debit_notes where firm_id = $1::bigint and related_invoice_id = $2 and status = 'ISSUED'`, firmID, invoiceID).Scan(&debits); err != nil {
		return PartnerPayment{}, err
	}
	outstanding := math.Max(roundCurrency(invoiceAmount-credits+debits-paid), 0)
	if roundCurrency(input.Amount) > outstanding {
		return PartnerPayment{}, fmt.Errorf("amount cannot exceed outstanding balance")
	}
	paymentID := nextID("ppay")
	allocationID := nextID("ppal")
	if _, err := tx.Exec(ctx, `
		insert into partner_payments (
			id, firm_id, client_business_id, payment_date, amount, payment_mode, reference_number,
			collected_by, notes, created_by
		) values ($1, $2, $3, $4::date, $5, $6, nullif($7, ''), nullif($8, ''), nullif($9, ''), $10)
	`, paymentID, firmID, clientBusinessID, strings.TrimSpace(input.PaymentDate), roundCurrency(input.Amount), mode, strings.TrimSpace(input.ReferenceNumber), strings.TrimSpace(input.CollectedByUserID), strings.TrimSpace(input.Notes), s.currentUserID); err != nil {
		return PartnerPayment{}, err
	}
	if _, err := tx.Exec(ctx, `
		insert into partner_payment_allocations (id, firm_id, payment_id, invoice_id, amount)
		values ($1, $2, $3, $4, $5)
	`, allocationID, firmID, paymentID, invoiceID, roundCurrency(input.Amount)); err != nil {
		return PartnerPayment{}, err
	}
	if _, err := tx.Exec(ctx, `
		insert into partner_invoice_payments (id, firm_id, invoice_id, payment_id, amount)
		values ($1, $2, $3, $4, $5)
	`, nextID("pip"), firmID, invoiceID, paymentID, roundCurrency(input.Amount)); err != nil {
		return PartnerPayment{}, err
	}
	if err := s.insertPartnerClientLedgerEntryTx(ctx, tx, firmID, clientBusinessID, input.PaymentDate, "PAYMENT", paymentID, firstNonEmpty(strings.TrimSpace(input.ReferenceNumber), paymentID), "Payment recorded for "+invoiceNumber, 0, roundCurrency(input.Amount)); err != nil {
		return PartnerPayment{}, err
	}
	if err := s.insertPartnerAuditLogTx(ctx, tx, firmID, "INVOICE", invoiceID, "PAYMENT_RECORDED", nil, map[string]any{
		"paymentId": paymentID,
		"amount":    roundCurrency(input.Amount),
	}); err != nil {
		return PartnerPayment{}, err
	}
	if err := s.insertPartnerAuditLogTx(ctx, tx, firmID, "PAYMENT", paymentID, "CREATE", nil, map[string]any{
		"invoiceId":     invoiceID,
		"invoiceNumber": invoiceNumber,
		"amount":        roundCurrency(input.Amount),
	}); err != nil {
		return PartnerPayment{}, err
	}
	_ = invoiceDate
	if err := tx.Commit(ctx); err != nil {
		return PartnerPayment{}, err
	}
	payments, err := s.GetPartnerPayments(firmID, GetPartnerPaymentsInput{InvoiceID: invoiceID})
	if err != nil {
		return PartnerPayment{}, err
	}
	for _, item := range payments {
		if item.ID == paymentID {
			return item, nil
		}
	}
	return PartnerPayment{}, fmt.Errorf("payment not found")
}

func (s *Store) GetPartnerClientLedger(firmID string, filters GetPartnerClientLedgerInput) ([]PartnerClientLedgerEntry, error) {
	ctx := context.Background()
	rows, err := s.pool.Query(ctx, `
		select
			e.id, e.firm_id, e.client_business_id, b.business_name, e.entry_date::text, e.entry_type,
			e.entry_type, e.reference_id, e.reference_number, e.description,
			e.debit::float8, e.credit::float8, e.running_balance::float8,
			to_char(e.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
		from partner_client_ledger_entries e
		join partner_client_businesses b on b.firm_id = e.firm_id and b.id = e.client_business_id
		where e.firm_id = $1::bigint
		  and ($2 = '' or e.client_business_id = $2)
		  and ($3 = '' or e.entry_date >= $3::date)
		  and ($4 = '' or e.entry_date <= $4::date)
		order by e.entry_date asc, e.created_at asc
	`, firmID, strings.TrimSpace(filters.ClientBusinessID), strings.TrimSpace(filters.FromDate), strings.TrimSpace(filters.ToDate))
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := []PartnerClientLedgerEntry{}
	for rows.Next() {
		var item PartnerClientLedgerEntry
		if err := rows.Scan(
			&item.ID, &item.FirmID, &item.ClientBusinessID, &item.ClientBusinessName, &item.EntryDate, &item.Type,
			&item.ReferenceType, &item.ReferenceID, &item.ReferenceNumber, &item.Description,
			&item.DebitAmount, &item.CreditAmount, &item.RunningBalance, &item.CreatedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (s *Store) GetPartnerCreditNotes(firmID string) ([]PartnerCreditNote, error) {
	ctx := context.Background()
	rows, err := s.pool.Query(ctx, `
		select
			n.id, n.firm_id, n.credit_note_number, coalesce(n.sales_return_id, ''), n.client_business_id, b.business_name,
			n.client_outlet_id, coalesce(o.outlet_name, ''), coalesce(n.related_invoice_id, ''), coalesce(i.invoice_number, ''),
			n.credit_date::text, coalesce(n.note, ''), n.status, n.has_stock_return, n.total_amount::float8,
			to_char(n.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), coalesce(u.name, ''),
			coalesce(to_char(n.cancelled_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), '')
		from partner_credit_notes n
		join partner_client_businesses b on b.id = n.client_business_id and b.firm_id = n.firm_id
		join partner_client_outlets o on o.id = n.client_outlet_id and o.client_business_id = n.client_business_id and o.firm_id = n.firm_id
		left join partner_invoices i on i.id = n.related_invoice_id and i.firm_id = n.firm_id
		left join users u on u.id = n.created_by
		where n.firm_id = $1::bigint
		order by n.credit_date desc, n.created_at desc
	`, firmID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := []PartnerCreditNote{}
	indexByID := map[string]int{}
	for rows.Next() {
		var item PartnerCreditNote
		if err := rows.Scan(
			&item.ID, &item.FirmID, &item.CreditNoteNumber, &item.SalesReturnID, &item.ClientBusinessID, &item.ClientBusinessName,
			&item.ClientOutletID, &item.ClientOutletName, &item.RelatedInvoiceID, &item.RelatedInvoiceNumber,
			&item.CreditDate, &item.Note, &item.Status, &item.HasStockReturn, &item.TotalAmount,
			&item.CreatedAt, &item.CreatedByName, &item.CancelledAt,
		); err != nil {
			return nil, err
		}
		item.Lines = []PartnerCreditNoteLine{}
		items = append(items, item)
		indexByID[item.ID] = len(items) - 1
	}
	lineRows, err := s.pool.Query(ctx, `
		select id, credit_note_id, coalesce(item_id, ''), coalesce(item_name, ''), coalesce(quantity, 0), amount::float8, coalesce(reference_invoice_line_id, '')
		from partner_credit_note_lines
		where firm_id = $1::bigint
		order by created_at asc
	`, firmID)
	if err != nil {
		return nil, err
	}
	defer lineRows.Close()
	for lineRows.Next() {
		var line PartnerCreditNoteLine
		if err := lineRows.Scan(&line.ID, &line.CreditNoteID, &line.ItemID, &line.ItemName, &line.Quantity, &line.Amount, &line.ReferenceInvoiceLineID); err != nil {
			return nil, err
		}
		if idx, ok := indexByID[line.CreditNoteID]; ok {
			items[idx].Lines = append(items[idx].Lines, line)
		}
	}
	return items, lineRows.Err()
}

func (s *Store) CreatePartnerCreditNote(firmID string, input CreatePartnerCreditNoteInput) (PartnerCreditNote, error) {
	ctx := context.Background()
	if strings.TrimSpace(input.ClientBusinessID) == "" || strings.TrimSpace(input.ClientOutletID) == "" || strings.TrimSpace(input.CreditDate) == "" {
		return PartnerCreditNote{}, fmt.Errorf("clientBusinessId, clientOutletId, and creditDate are required")
	}
	if len(input.Lines) == 0 {
		return PartnerCreditNote{}, fmt.Errorf("lines are required")
	}
	status := firstNonEmpty(input.Status, "ISSUED")
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return PartnerCreditNote{}, err
	}
	defer tx.Rollback(ctx)
	noteID := nextID("pcn")
	var noteNumber string
	if err := tx.QueryRow(ctx, `
		select 'CN-' || lpad((coalesce(count(*), 0) + 1001)::text, 4, '0')
		from partner_credit_notes
		where firm_id = $1::bigint
	`, firmID).Scan(&noteNumber); err != nil {
		return PartnerCreditNote{}, err
	}
	var total float64
	for _, line := range input.Lines {
		if line.Amount < 0 {
			return PartnerCreditNote{}, fmt.Errorf("credit note line amount cannot be negative")
		}
		total += line.Amount
	}
	if invoiceID := strings.TrimSpace(input.RelatedInvoiceID); invoiceID != "" {
		var invoiceStatus, invoiceClientBusinessID, invoiceClientOutletID string
		var invoiceAmount, existingCredits, existingDebits float64
		if err := tx.QueryRow(ctx, `
			select status, client_business_id, client_outlet_id, amount::float8
			from partner_invoices
			where firm_id = $1::bigint and id = $2
			for update
		`, firmID, invoiceID).Scan(&invoiceStatus, &invoiceClientBusinessID, &invoiceClientOutletID, &invoiceAmount); err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return PartnerCreditNote{}, fmt.Errorf("related invoice not found")
			}
			return PartnerCreditNote{}, err
		}
		if invoiceStatus != "FINALIZED" {
			return PartnerCreditNote{}, fmt.Errorf("credit notes can only be issued against finalized invoices")
		}
		if invoiceClientBusinessID != strings.TrimSpace(input.ClientBusinessID) || invoiceClientOutletID != strings.TrimSpace(input.ClientOutletID) {
			return PartnerCreditNote{}, fmt.Errorf("credit note client must match the related invoice")
		}
		if err := tx.QueryRow(ctx, `select coalesce(sum(total_amount), 0)::float8 from partner_credit_notes where firm_id = $1::bigint and related_invoice_id = $2 and status = 'ISSUED'`, firmID, invoiceID).Scan(&existingCredits); err != nil {
			return PartnerCreditNote{}, err
		}
		if err := tx.QueryRow(ctx, `select coalesce(sum(total_amount), 0)::float8 from partner_debit_notes where firm_id = $1::bigint and related_invoice_id = $2 and status = 'ISSUED'`, firmID, invoiceID).Scan(&existingDebits); err != nil {
			return PartnerCreditNote{}, err
		}
		if status == "ISSUED" && roundCurrency(total) > math.Max(roundCurrency(invoiceAmount-existingCredits+existingDebits), 0) {
			return PartnerCreditNote{}, fmt.Errorf("credit note amount cannot exceed invoice balance")
		}
	}
	if _, err := tx.Exec(ctx, `
		insert into partner_credit_notes (
			id, firm_id, client_business_id, client_outlet_id, related_invoice_id, credit_note_number, credit_date, note, status, has_stock_return, total_amount, created_by
		) values ($1, $2, $3, $4, nullif($5, ''), $6, $7::date, nullif($8, ''), $9, $10, $11, $12)
	`, noteID, firmID, input.ClientBusinessID, input.ClientOutletID, strings.TrimSpace(input.RelatedInvoiceID), noteNumber, input.CreditDate, strings.TrimSpace(input.Note), status, input.HasStockReturn, total, s.currentUserID); err != nil {
		return PartnerCreditNote{}, err
	}
	for _, line := range input.Lines {
		var itemName string
		if strings.TrimSpace(line.ItemID) != "" {
			if err := tx.QueryRow(ctx, `
				select c.name
				from partner_firm_inventory_items i
				join partner_product_catalog c on c.id = i.catalog_item_id
				where i.firm_id = $1::bigint and i.item_id = $2
			`, firmID, strings.TrimSpace(line.ItemID)).Scan(&itemName); err != nil {
				return PartnerCreditNote{}, err
			}
		}
		if _, err := tx.Exec(ctx, `
			insert into partner_credit_note_lines (id, firm_id, credit_note_id, item_id, item_name, quantity, amount, reference_invoice_line_id)
			values ($1, $2, $3, nullif($4, ''), nullif($5, ''), nullif($6, 0), $7, nullif($8, ''))
		`, nextID("pcnl"), firmID, noteID, strings.TrimSpace(line.ItemID), itemName, line.Quantity, line.Amount, strings.TrimSpace(line.ReferenceInvoiceLineID)); err != nil {
			return PartnerCreditNote{}, err
		}
		if input.HasStockReturn && status == "ISSUED" && strings.TrimSpace(line.ItemID) != "" && line.Quantity > 0 {
			if _, err := tx.Exec(ctx, `
				insert into partner_stock_entries (id, firm_id, item_id, quantity_delta, reason_type, reference_type, reference_id, note, created_by, created_at)
				values ($1, $2, $3, $4, 'RETURN_IN', $5, $6, nullif($7, ''), $8, $9::timestamptz)
			`, nextID("pstock"), firmID, strings.TrimSpace(line.ItemID), line.Quantity, firstNonEmpty(map[bool]string{true: "INVOICE", false: "RETURN"}[strings.TrimSpace(input.RelatedInvoiceID) != ""], "RETURN"), firstNonEmpty(strings.TrimSpace(input.RelatedInvoiceID), noteID), strings.TrimSpace(input.Note), s.currentUserID, partnerActionTimestamp(input.CreditDate)); err != nil {
				return PartnerCreditNote{}, err
			}
		}
	}
	if status == "ISSUED" {
		if err := s.insertPartnerClientLedgerEntryTx(ctx, tx, firmID, input.ClientBusinessID, input.CreditDate, "CREDIT_NOTE", noteID, noteNumber, "Credit note issued", 0, total); err != nil {
			return PartnerCreditNote{}, err
		}
	}
	if err := s.insertPartnerAuditLogTx(ctx, tx, firmID, "CREDIT_NOTE", noteID, "CREATE", nil, map[string]any{
		"creditNoteNumber": noteNumber,
		"status":           status,
		"totalAmount":      total,
	}); err != nil {
		return PartnerCreditNote{}, err
	}
	if err := tx.Commit(ctx); err != nil {
		return PartnerCreditNote{}, err
	}
	items, err := s.GetPartnerCreditNotes(firmID)
	if err != nil {
		return PartnerCreditNote{}, err
	}
	for _, item := range items {
		if item.ID == noteID {
			return item, nil
		}
	}
	return PartnerCreditNote{}, fmt.Errorf("credit note not found")
}

func (s *Store) GetPartnerDebitNotes(firmID string) ([]PartnerDebitNote, error) {
	ctx := context.Background()
	rows, err := s.pool.Query(ctx, `
		select
			n.id, n.firm_id, n.debit_note_number, n.client_business_id, b.business_name,
			n.client_outlet_id, coalesce(o.outlet_name, ''), coalesce(n.related_invoice_id, ''), coalesce(i.invoice_number, ''),
			n.debit_date::text, coalesce(n.note, ''), n.status, n.total_amount::float8,
			to_char(n.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), coalesce(u.name, ''),
			coalesce(to_char(n.cancelled_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), '')
		from partner_debit_notes n
		join partner_client_businesses b on b.id = n.client_business_id and b.firm_id = n.firm_id
		join partner_client_outlets o on o.id = n.client_outlet_id and o.client_business_id = n.client_business_id and o.firm_id = n.firm_id
		left join partner_invoices i on i.id = n.related_invoice_id and i.firm_id = n.firm_id
		left join users u on u.id = n.created_by
		where n.firm_id = $1::bigint
		order by n.debit_date desc, n.created_at desc
	`, firmID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := []PartnerDebitNote{}
	indexByID := map[string]int{}
	for rows.Next() {
		var item PartnerDebitNote
		if err := rows.Scan(
			&item.ID, &item.FirmID, &item.DebitNoteNumber, &item.ClientBusinessID, &item.ClientBusinessName,
			&item.ClientOutletID, &item.ClientOutletName, &item.RelatedInvoiceID, &item.RelatedInvoiceNumber,
			&item.DebitDate, &item.Note, &item.Status, &item.TotalAmount, &item.CreatedAt, &item.CreatedByName, &item.CancelledAt,
		); err != nil {
			return nil, err
		}
		item.Lines = []PartnerDebitNoteLine{}
		items = append(items, item)
		indexByID[item.ID] = len(items) - 1
	}
	lineRows, err := s.pool.Query(ctx, `
		select id, debit_note_id, coalesce(item_id, ''), coalesce(item_name, ''), description, amount::float8
		from partner_debit_note_lines
		where firm_id = $1::bigint
		order by created_at asc
	`, firmID)
	if err != nil {
		return nil, err
	}
	defer lineRows.Close()
	for lineRows.Next() {
		var line PartnerDebitNoteLine
		if err := lineRows.Scan(&line.ID, &line.DebitNoteID, &line.ItemID, &line.ItemName, &line.Description, &line.Amount); err != nil {
			return nil, err
		}
		if idx, ok := indexByID[line.DebitNoteID]; ok {
			items[idx].Lines = append(items[idx].Lines, line)
		}
	}
	return items, lineRows.Err()
}

func (s *Store) CreatePartnerDebitNote(firmID string, input CreatePartnerDebitNoteInput) (PartnerDebitNote, error) {
	ctx := context.Background()
	if strings.TrimSpace(input.ClientBusinessID) == "" || strings.TrimSpace(input.ClientOutletID) == "" || strings.TrimSpace(input.DebitDate) == "" {
		return PartnerDebitNote{}, fmt.Errorf("clientBusinessId, clientOutletId, and debitDate are required")
	}
	if len(input.Lines) == 0 {
		return PartnerDebitNote{}, fmt.Errorf("lines are required")
	}
	status := firstNonEmpty(input.Status, "ISSUED")
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return PartnerDebitNote{}, err
	}
	defer tx.Rollback(ctx)
	noteID := nextID("pdn")
	var noteNumber string
	if err := tx.QueryRow(ctx, `
		select 'DN-' || lpad((coalesce(count(*), 0) + 1001)::text, 4, '0')
		from partner_debit_notes
		where firm_id = $1::bigint
	`, firmID).Scan(&noteNumber); err != nil {
		return PartnerDebitNote{}, err
	}
	var total float64
	for _, line := range input.Lines {
		if line.Amount < 0 || strings.TrimSpace(line.Description) == "" {
			return PartnerDebitNote{}, fmt.Errorf("description is required and amount cannot be negative")
		}
		total += line.Amount
	}
	if invoiceID := strings.TrimSpace(input.RelatedInvoiceID); invoiceID != "" {
		var invoiceStatus, invoiceClientBusinessID, invoiceClientOutletID string
		if err := tx.QueryRow(ctx, `
			select status, client_business_id, client_outlet_id
			from partner_invoices
			where firm_id = $1::bigint and id = $2
			for update
		`, firmID, invoiceID).Scan(&invoiceStatus, &invoiceClientBusinessID, &invoiceClientOutletID); err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return PartnerDebitNote{}, fmt.Errorf("related invoice not found")
			}
			return PartnerDebitNote{}, err
		}
		if invoiceStatus != "FINALIZED" {
			return PartnerDebitNote{}, fmt.Errorf("debit notes can only be issued against finalized invoices")
		}
		if invoiceClientBusinessID != strings.TrimSpace(input.ClientBusinessID) || invoiceClientOutletID != strings.TrimSpace(input.ClientOutletID) {
			return PartnerDebitNote{}, fmt.Errorf("debit note client must match the related invoice")
		}
	}
	if _, err := tx.Exec(ctx, `
		insert into partner_debit_notes (
			id, firm_id, client_business_id, client_outlet_id, related_invoice_id, debit_note_number, debit_date, note, status, total_amount, created_by
		) values ($1, $2, $3, $4, nullif($5, ''), $6, $7::date, nullif($8, ''), $9, $10, $11)
	`, noteID, firmID, input.ClientBusinessID, input.ClientOutletID, strings.TrimSpace(input.RelatedInvoiceID), noteNumber, input.DebitDate, strings.TrimSpace(input.Note), status, total, s.currentUserID); err != nil {
		return PartnerDebitNote{}, err
	}
	for _, line := range input.Lines {
		var itemName string
		if strings.TrimSpace(line.ItemID) != "" {
			_ = tx.QueryRow(ctx, `
				select c.name
				from partner_firm_inventory_items i
				join partner_product_catalog c on c.id = i.catalog_item_id
				where i.firm_id = $1::bigint and i.item_id = $2
			`, firmID, strings.TrimSpace(line.ItemID)).Scan(&itemName)
		}
		if _, err := tx.Exec(ctx, `
			insert into partner_debit_note_lines (id, firm_id, debit_note_id, item_id, item_name, description, amount)
			values ($1, $2, $3, nullif($4, ''), nullif($5, ''), $6, $7)
		`, nextID("pdnl"), firmID, noteID, strings.TrimSpace(line.ItemID), itemName, strings.TrimSpace(line.Description), line.Amount); err != nil {
			return PartnerDebitNote{}, err
		}
	}
	if status == "ISSUED" {
		if err := s.insertPartnerClientLedgerEntryTx(ctx, tx, firmID, input.ClientBusinessID, input.DebitDate, "DEBIT_NOTE", noteID, noteNumber, "Debit note issued", total, 0); err != nil {
			return PartnerDebitNote{}, err
		}
	}
	if err := s.insertPartnerAuditLogTx(ctx, tx, firmID, "DEBIT_NOTE", noteID, "CREATE", nil, map[string]any{
		"debitNoteNumber": noteNumber,
		"status":          status,
		"totalAmount":     total,
	}); err != nil {
		return PartnerDebitNote{}, err
	}
	if err := tx.Commit(ctx); err != nil {
		return PartnerDebitNote{}, err
	}
	items, err := s.GetPartnerDebitNotes(firmID)
	if err != nil {
		return PartnerDebitNote{}, err
	}
	for _, item := range items {
		if item.ID == noteID {
			return item, nil
		}
	}
	return PartnerDebitNote{}, fmt.Errorf("debit note not found")
}

func (s *Store) GetPartnerAuditLogs(firmID string, filters GetPartnerAuditLogsInput) ([]PartnerAuditLog, error) {
	ctx := context.Background()
	rows, err := s.pool.Query(ctx, `
		select l.id, l.firm_id, l.user_id, coalesce(u.name, ''), l.entity_type, l.entity_id, l.action, coalesce(l.reference_label, ''),
		       coalesce(l.before_state::text, ''), coalesce(l.after_state::text, ''),
		       to_char(l.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
		from partner_audit_logs l
		left join users u on u.id = l.user_id
		where l.firm_id = $1::bigint
		  and ($2 = '' or l.entity_type = $2)
		  and ($3 = '' or l.created_at::date >= $3::date)
		  and ($4 = '' or l.created_at::date <= $4::date)
		  and ($5 = '' or l.user_id = $5::bigint)
		order by l.created_at desc
	`, firmID, strings.TrimSpace(filters.EntityType), strings.TrimSpace(filters.FromDate), strings.TrimSpace(filters.ToDate), strings.TrimSpace(filters.UserID))
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := []PartnerAuditLog{}
	for rows.Next() {
		var item PartnerAuditLog
		if err := rows.Scan(&item.ID, &item.FirmID, &item.UserID, &item.UserName, &item.EntityType, &item.EntityID, &item.Action, &item.ReferenceLabel, &item.BeforeState, &item.AfterState, &item.CreatedAt); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (s *Store) GetPartnerGlobalSearch(firmID, query string) ([]PartnerGlobalSearchResult, error) {
	term := "%" + strings.ToLower(strings.TrimSpace(query)) + "%"
	if strings.TrimSpace(query) == "" {
		return []PartnerGlobalSearchResult{}, nil
	}
	ctx := context.Background()
	rows, err := s.pool.Query(ctx, `
		select id, type, title, subtitle, href
		from (
				select b.id, 'CLIENT' as type, b.business_name as title, coalesce(b.billing_address, '') as subtitle,
				       '/partners/clients' as href
				from partner_client_businesses b
				where b.firm_id = $1::bigint and lower(b.business_name) like $2
				union all
				select o.id, 'ORDER', o.order_number, coalesce(b.business_name, ''), '/partners/orders/' || o.id
				from partner_orders o
			left join partner_client_businesses b on b.id = o.client_business_id and b.firm_id = o.firm_id
			where o.firm_id = $1::bigint and (lower(o.order_number) like $2 or lower(coalesce(b.business_name, '')) like $2)
			union all
			select bi.id, 'ITEM', bi.name, coalesce(br.name, ''), '/partners/items'
			from partner_product_catalog bi
			join partner_brands br on br.id = bi.brand_id
			join partner_firm_brands fb on fb.brand_id = bi.brand_id and fb.firm_id = $1::bigint
			where lower(bi.name) like $2 or lower(coalesce(bi.sku, '')) like $2
		) q
		limit 10
	`, firmID, term)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := []PartnerGlobalSearchResult{}
	for rows.Next() {
		var item PartnerGlobalSearchResult
		if err := rows.Scan(&item.ID, &item.Type, &item.Title, &item.Subtitle, &item.Href); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (s *Store) GetPartnerSalesReport(firmID string, filters GetPartnerSalesReportInput) ([]PartnerSalesReportRow, error) {
	invoices, err := s.GetPartnerInvoices(firmID)
	if err != nil {
		return nil, err
	}
	itemMeta, err := s.getPartnerItemMeta(firmID)
	if err != nil {
		return nil, err
	}
	rows := []PartnerSalesReportRow{}
	for _, invoice := range invoices {
		if invoice.Status == "CANCELLED" || !matchesDateRange(invoice.InvoiceDate, strings.TrimSpace(filters.FromDate), strings.TrimSpace(filters.ToDate)) {
			continue
		}
		if filters.ClientBusinessID != "" && invoice.ClientBusinessID != filters.ClientBusinessID {
			continue
		}
		if filters.ClientOutletID != "" && invoice.ClientOutletID != filters.ClientOutletID {
			continue
		}
		for _, line := range invoice.Items {
			meta := itemMeta[line.ItemID]
			if filters.BrandID != "" && meta.BrandID != filters.BrandID {
				continue
			}
			if filters.ItemID != "" && line.ItemID != filters.ItemID {
				continue
			}
			rows = append(rows, PartnerSalesReportRow{
				InvoiceID:          invoice.ID,
				InvoiceNumber:      invoice.InvoiceNumber,
				InvoiceDate:        invoice.InvoiceDate,
				ClientBusinessID:   invoice.ClientBusinessID,
				ClientBusinessName: invoice.ClientBusinessName,
				ClientOutletID:     invoice.ClientOutletID,
				ClientOutletName:   invoice.ClientOutletName,
				BrandID:            meta.BrandID,
				BrandName:          meta.BrandName,
				ItemID:             line.ItemID,
				ItemName:           line.ItemName,
				QuantitySold:       line.Quantity,
				InvoiceValue:       line.LineTotal,
				PaymentReceived:    allocatedShare(invoice.PaidAmount, invoice.Amount, line.LineTotal),
				Outstanding:        allocatedShare(invoice.DueAmount, invoice.Amount, line.LineTotal),
			})
		}
	}
	return rows, nil
}

func (s *Store) GetPartnerStockMovementReport(firmID string, filters GetPartnerStockMovementReportInput) ([]PartnerStockMovementReportRow, error) {
	ctx := context.Background()
	rows, err := s.pool.Query(ctx, `
		select
			i.item_id, c.name, b.id, b.name,
			coalesce(sum(case when se.created_at::date < nullif($2, '')::date then se.quantity_delta else 0 end), 0)::int as opening_stock,
			coalesce(sum(case when se.created_at::date >= nullif($2, '')::date and se.created_at::date <= coalesce(nullif($3, '')::date, se.created_at::date) and se.reason_type = 'PURCHASE' then se.quantity_delta else 0 end), 0)::int,
			coalesce(sum(case when se.created_at::date >= nullif($2, '')::date and se.created_at::date <= coalesce(nullif($3, '')::date, se.created_at::date) and se.reason_type = 'RETURN_IN' then se.quantity_delta else 0 end), 0)::int,
			coalesce(sum(case when se.created_at::date >= nullif($2, '')::date and se.created_at::date <= coalesce(nullif($3, '')::date, se.created_at::date) and se.reason_type = 'SALE' then abs(se.quantity_delta) else 0 end), 0)::int,
			coalesce(sum(case when se.created_at::date >= nullif($2, '')::date and se.created_at::date <= coalesce(nullif($3, '')::date, se.created_at::date) and se.reason_type = 'RETURN_OUT' then abs(se.quantity_delta) else 0 end), 0)::int,
			coalesce(sum(case when se.created_at::date >= nullif($2, '')::date and se.created_at::date <= coalesce(nullif($3, '')::date, se.created_at::date) and se.reason_type = 'DAMAGE' then abs(se.quantity_delta) else 0 end), 0)::int,
			coalesce(sum(case when se.created_at::date >= nullif($2, '')::date and se.created_at::date <= coalesce(nullif($3, '')::date, se.created_at::date) and se.reason_type = 'ADJUSTMENT' then se.quantity_delta else 0 end), 0)::int,
			coalesce(sum(se.quantity_delta), 0)::int as closing_stock
		from partner_firm_inventory_items i
		join partner_product_catalog c on c.id = i.catalog_item_id
		join partner_brands b on b.id = c.brand_id
		join partner_firm_brands fb on fb.brand_id = c.brand_id and fb.firm_id = i.firm_id
		left join partner_stock_entries se on se.firm_id = i.firm_id and se.item_id = i.item_id
		where i.firm_id = $1::bigint
		  and ($4 = '' or b.id = $4)
		  and ($5 = '' or i.item_id = $5)
		group by i.item_id, c.name, b.id, b.name
		order by b.name asc, c.name asc
	`, firmID, strings.TrimSpace(filters.FromDate), strings.TrimSpace(filters.ToDate), strings.TrimSpace(filters.BrandID), strings.TrimSpace(filters.ItemID))
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := []PartnerStockMovementReportRow{}
	for rows.Next() {
		var item PartnerStockMovementReportRow
		if err := rows.Scan(&item.ItemID, &item.ItemName, &item.BrandID, &item.BrandName, &item.OpeningStock, &item.PurchaseInward, &item.ReturnIn, &item.Sale, &item.ReturnOut, &item.Damage, &item.Adjustment, &item.ClosingStock); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (s *Store) GetPartnerClientPurchaseHistory(firmID string, filters GetPartnerSalesReportInput) ([]PartnerClientPurchaseHistoryRow, error) {
	sales, err := s.GetPartnerSalesReport(firmID, filters)
	if err != nil {
		return nil, err
	}
	items := make([]PartnerClientPurchaseHistoryRow, 0, len(sales))
	for _, row := range sales {
		items = append(items, PartnerClientPurchaseHistoryRow{
			ClientBusinessID:   row.ClientBusinessID,
			ClientBusinessName: row.ClientBusinessName,
			ClientOutletID:     row.ClientOutletID,
			ClientOutletName:   row.ClientOutletName,
			InvoiceID:          row.InvoiceID,
			InvoiceNumber:      row.InvoiceNumber,
			InvoiceDate:        row.InvoiceDate,
			ItemID:             row.ItemID,
			ItemName:           row.ItemName,
			Quantity:           row.QuantitySold,
			Amount:             row.InvoiceValue,
		})
	}
	return items, nil
}

func (s *Store) CreatePartnerStockAction(firmID string, input CreatePartnerStockActionInput) (PartnerStockLedgerEntry, error) {
	ctx := context.Background()
	actionType := strings.TrimSpace(input.ActionType)
	quantity := input.Quantity
	if actionType == "ADJUSTMENT" && input.QuantityDelta != 0 {
		if input.QuantityDelta < 0 {
			quantity = -input.QuantityDelta
		} else {
			quantity = input.QuantityDelta
		}
	}
	if strings.TrimSpace(input.ItemID) == "" || quantity <= 0 || strings.TrimSpace(input.ActionDate) == "" {
		return PartnerStockLedgerEntry{}, fmt.Errorf("actionType, itemId, quantity, and actionDate are required")
	}

	var reasonType string
	var referenceType string
	referenceID := strings.TrimSpace(input.ReferenceID)
	note := strings.TrimSpace(input.Note)
	quantityDelta := quantity

	switch actionType {
	case "PURCHASE_INWARD":
		return PartnerStockLedgerEntry{}, fmt.Errorf("purchase inward must be received through purchases and GRNs")
	case "RETURN_IN":
		reasonType = "RETURN_IN"
		referenceType = firstNonEmpty(strings.TrimSpace(input.ReferenceType), "RETURN")
		if strings.TrimSpace(input.InvoiceID) != "" {
			referenceType = "INVOICE"
			referenceID = strings.TrimSpace(input.InvoiceID)
		}
		if strings.TrimSpace(input.ClientBusinessID) == "" {
			return PartnerStockLedgerEntry{}, fmt.Errorf("clientBusinessId is required for return-in")
		}
	case "RETURN_OUT":
		reasonType = "RETURN_OUT"
		referenceType = firstNonEmpty(strings.TrimSpace(input.ReferenceType), "RETURN")
		if strings.TrimSpace(input.PurchaseID) != "" {
			referenceType = "PURCHASE"
			referenceID = strings.TrimSpace(input.PurchaseID)
		}
		if strings.TrimSpace(input.SupplierID) == "" {
			return PartnerStockLedgerEntry{}, fmt.Errorf("supplierId is required for return-out")
		}
		quantityDelta = -quantity
	case "DAMAGE":
		reasonType = "DAMAGE"
		referenceType = firstNonEmpty(strings.TrimSpace(input.ReferenceType), "DAMAGE")
		quantityDelta = -quantity
		if strings.TrimSpace(input.DamageCategory) != "" {
			if note != "" {
				note = strings.TrimSpace(input.DamageCategory) + ": " + note
			} else {
				note = strings.TrimSpace(input.DamageCategory)
			}
		}
	case "ADJUSTMENT":
		reasonType = "ADJUSTMENT"
		referenceType = "MANUAL"
		if note == "" {
			return PartnerStockLedgerEntry{}, fmt.Errorf("note is required for manual adjustments")
		}
		if input.QuantityDelta == 0 {
			return PartnerStockLedgerEntry{}, fmt.Errorf("quantityDelta is required for manual adjustments")
		}
		quantityDelta = input.QuantityDelta
	default:
		return PartnerStockLedgerEntry{}, fmt.Errorf("unsupported stock action type")
	}
	if referenceType != "" && referenceID == "" {
		referenceID = nextID(strings.ToLower(reasonType))
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return PartnerStockLedgerEntry{}, err
	}
	defer tx.Rollback(ctx)

	var currentQty int
	if err := tx.QueryRow(ctx, `
		select quantity
		from partner_firm_inventory_items
		where firm_id = $1::bigint and item_id = $2
		for update
	`, firmID, input.ItemID).Scan(&currentQty); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return PartnerStockLedgerEntry{}, fmt.Errorf("stock item not found")
		}
		return PartnerStockLedgerEntry{}, err
	}
	if quantityDelta < 0 && currentQty+quantityDelta < 0 {
		return PartnerStockLedgerEntry{}, fmt.Errorf("quantity exceeds available stock")
	}
	if strings.TrimSpace(input.SupplierID) != "" {
		var supplierStatus string
		if err := tx.QueryRow(ctx, `select status from partner_suppliers where firm_id = $1::bigint and id = $2`, firmID, strings.TrimSpace(input.SupplierID)).Scan(&supplierStatus); err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return PartnerStockLedgerEntry{}, fmt.Errorf("supplier not found")
			}
			return PartnerStockLedgerEntry{}, err
		}
		if supplierStatus == "INACTIVE" {
			return PartnerStockLedgerEntry{}, fmt.Errorf("inactive suppliers cannot be used for new stock actions")
		}
	}
	if strings.TrimSpace(input.ClientBusinessID) != "" {
		var exists bool
		if err := tx.QueryRow(ctx, `
			select exists(
				select 1
				from partner_client_businesses
				where firm_id = $1::bigint and id = $2
			)
		`, firmID, strings.TrimSpace(input.ClientBusinessID)).Scan(&exists); err != nil {
			return PartnerStockLedgerEntry{}, err
		}
		if !exists {
			return PartnerStockLedgerEntry{}, fmt.Errorf("client not found")
		}
	}

	if _, err := tx.Exec(ctx, `
		update partner_firm_inventory_items
		set quantity = quantity + $3,
		    updated_at = now()
		where firm_id = $1::bigint and item_id = $2
	`, firmID, input.ItemID, quantityDelta); err != nil {
		return PartnerStockLedgerEntry{}, err
	}
	if _, err := tx.Exec(ctx, `
		insert into partner_stock_entries (
			id, firm_id, item_id, quantity_delta, reason_type, reference_type, reference_id, note, created_by, created_at
		) values ($1, $2, $3, $4, $5, nullif($6, ''), nullif($7, ''), nullif($8, ''), $9, $10::timestamptz)
	`, nextID("pstock"), firmID, input.ItemID, quantityDelta, reasonType, referenceType, referenceID, note, s.currentUserID, partnerActionTimestamp(input.ActionDate)); err != nil {
		return PartnerStockLedgerEntry{}, err
	}
	if err := s.insertPartnerAuditLogTx(ctx, tx, firmID, "STOCK", referenceID, actionType, nil, map[string]any{
		"actionType":    actionType,
		"itemId":        input.ItemID,
		"quantityDelta": quantityDelta,
		"reasonType":    reasonType,
		"referenceType": referenceType,
		"referenceId":   referenceID,
		"actionDate":    input.ActionDate,
	}); err != nil {
		return PartnerStockLedgerEntry{}, err
	}
	if err := tx.Commit(ctx); err != nil {
		return PartnerStockLedgerEntry{}, err
	}

	items, err := s.GetPartnerStockLedger(firmID, input.ItemID, PartnerStockLedgerFilters{})
	if err != nil {
		return PartnerStockLedgerEntry{}, err
	}
	if len(items) == 0 {
		return PartnerStockLedgerEntry{}, fmt.Errorf("stock ledger entry not found")
	}
	return items[0], nil
}

func (s *Store) CreatePartnerStockAdjustment(firmID string, input CreatePartnerStockAdjustmentInput) (PartnerStockLedgerEntry, error) {
	ctx := context.Background()
	if strings.TrimSpace(input.ItemID) == "" || input.QuantityDelta == 0 {
		return PartnerStockLedgerEntry{}, fmt.Errorf("itemId and non-zero quantityDelta are required")
	}
	reasonType := strings.ToUpper(strings.TrimSpace(input.ReasonType))
	if reasonType == "" {
		reasonType = "ADJUSTMENT"
	}
	referenceType := strings.ToUpper(strings.TrimSpace(input.ReferenceType))
	if referenceType == "" {
		referenceType = "MANUAL"
	}
	if reasonType != "ADJUSTMENT" || referenceType != "MANUAL" {
		return PartnerStockLedgerEntry{}, fmt.Errorf("inventory adjustments are only for manual corrections; receive supplier stock through purchases and GRNs")
	}
	if strings.TrimSpace(input.Note) == "" {
		return PartnerStockLedgerEntry{}, fmt.Errorf("note is required for manual adjustments")
	}
	var currentQty int
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return PartnerStockLedgerEntry{}, err
	}
	defer tx.Rollback(ctx)
	if err := tx.QueryRow(ctx, `
		select quantity
		from partner_firm_inventory_items
		where firm_id = $1::bigint and item_id = $2
		for update
	`, firmID, input.ItemID).Scan(&currentQty); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return PartnerStockLedgerEntry{}, fmt.Errorf("stock item not found")
		}
		return PartnerStockLedgerEntry{}, err
	}
	if input.QuantityDelta < 0 && currentQty+input.QuantityDelta < 0 {
		return PartnerStockLedgerEntry{}, fmt.Errorf("quantity exceeds available stock")
	}
	if _, err := tx.Exec(ctx, `
		update partner_firm_inventory_items
		set quantity = quantity + $3,
		    updated_at = now()
		where firm_id = $1::bigint and item_id = $2
	`, firmID, input.ItemID, input.QuantityDelta); err != nil {
		return PartnerStockLedgerEntry{}, err
	}
	if _, err := tx.Exec(ctx, `
		insert into partner_stock_entries (
			id, firm_id, item_id, quantity_delta, reason_type, reference_type, reference_id, note, created_by
		) values ($1, $2, $3, $4, $5, nullif($6, ''), nullif($7, ''), nullif($8, ''), $9)
	`, nextID("pstock"), firmID, input.ItemID, input.QuantityDelta, reasonType, referenceType, strings.TrimSpace(input.ReferenceID), strings.TrimSpace(input.Note), s.currentUserID); err != nil {
		return PartnerStockLedgerEntry{}, err
	}
	if err := s.insertPartnerAuditLogTx(ctx, tx, firmID, "STOCK", input.ItemID, "ADJUSTMENT", nil, map[string]any{
		"itemId":        input.ItemID,
		"quantityDelta": input.QuantityDelta,
		"reasonType":    reasonType,
		"referenceType": referenceType,
		"referenceId":   strings.TrimSpace(input.ReferenceID),
		"note":          strings.TrimSpace(input.Note),
	}); err != nil {
		return PartnerStockLedgerEntry{}, err
	}
	if err := tx.Commit(ctx); err != nil {
		return PartnerStockLedgerEntry{}, err
	}
	items, err := s.GetPartnerStockLedger(firmID, input.ItemID, PartnerStockLedgerFilters{})
	if err != nil {
		return PartnerStockLedgerEntry{}, err
	}
	if len(items) == 0 {
		return PartnerStockLedgerEntry{}, fmt.Errorf("stock ledger entry not found")
	}
	return items[0], nil
}

func (s *Store) GetPartnerStock(firmID, brandID string) ([]PartnerStockRow, error) {
	ctx := context.Background()
	rows, err := s.pool.Query(ctx, `
		select i.item_id, i.catalog_item_id, c.name, c.sku, b.id, b.name, c.sku,
		       i.mrp::float8, i.discount_percentage::float8, i.quantity,
		       to_char(i.updated_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
		from partner_firm_inventory_items i
		join partner_product_catalog c on c.id = i.catalog_item_id
		join partner_brands b on b.id = c.brand_id
		join partner_firm_brands fb on fb.brand_id = b.id and fb.firm_id = i.firm_id
		where i.firm_id = $1::bigint
		  and ($2 = '' or b.id = $2::bigint)
		order by b.name asc, c.name asc, i.mrp asc, i.discount_percentage asc
	`, firmID, strings.TrimSpace(brandID))
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []PartnerStockRow
	for rows.Next() {
		var item PartnerStockRow
		if err := rows.Scan(
			&item.ItemID,
			&item.CatalogItemID,
			&item.ItemName,
			&item.ItemCode,
			&item.BrandID,
			&item.BrandName,
			&item.SKU,
			&item.MRP,
			&item.DiscountPercentage,
			&item.CurrentStockQty,
			&item.LastUpdated,
		); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return ensurePartnerStockRows(items), nil
}

func (s *Store) GetPartnerInventory(firmID, brandID string) ([]PartnerInventoryItem, error) {
	ctx := context.Background()
	rows, err := s.pool.Query(ctx, `
		select i.firm_id, i.item_id, i.catalog_item_id, c.brand_id, c.name, c.sku,
		       i.mrp, i.discount_percentage::float8, i.status, i.quantity,
		       to_char(i.updated_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
		       coalesce(r.supplier_id, ''), coalesce(s.supplier_name, ''),
		       coalesce(to_char(r.received_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), '')
		from partner_firm_inventory_items i
		join partner_product_catalog c on c.id = i.catalog_item_id
		join partner_firm_brands fb on fb.firm_id = i.firm_id and fb.brand_id = c.brand_id
		left join lateral (
			select supplier_id, received_at
			from partner_inventory_receipts
			where firm_id = i.firm_id and item_id = i.item_id
			  and status = 'POSTED'
			order by received_at desc, created_at desc
			limit 1
		) r on true
		left join partner_suppliers s on s.id = r.supplier_id and s.firm_id = i.firm_id
		where i.firm_id = $1::bigint
		  and ($2 = '' or c.brand_id = $2::bigint)
		order by c.name asc, i.mrp asc, i.discount_percentage asc
	`, firmID, strings.TrimSpace(brandID))
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []PartnerInventoryItem
	for rows.Next() {
		var item PartnerInventoryItem
		if err := rows.Scan(
			&item.FirmID,
			&item.ItemID,
			&item.CatalogItemID,
			&item.BrandID,
			&item.ItemName,
			&item.SKU,
			&item.MRP,
			&item.DiscountPercentage,
			&item.Status,
			&item.Quantity,
			&item.UpdatedAt,
			&item.LastSupplierID,
			&item.LastSupplierName,
			&item.LastReceivedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return ensurePartnerInventoryItems(items), nil
}

func (s *Store) UpdatePartnerInventoryItem(firmID, itemID string, input UpdatePartnerInventoryItemInput) (PartnerInventoryItem, error) {
	ctx := context.Background()
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return PartnerInventoryItem{}, err
	}
	defer tx.Rollback(ctx)

	var current PartnerInventoryItem
	if err := tx.QueryRow(ctx, `
		select i.firm_id, i.item_id, i.catalog_item_id, c.brand_id, c.name, c.sku,
		       i.mrp, i.discount_percentage::float8, i.status, i.quantity,
		       to_char(i.updated_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
		from partner_firm_inventory_items i
		join partner_product_catalog c on c.id = i.catalog_item_id
		where i.firm_id = $1::bigint and i.item_id = $2
	`, firmID, itemID).Scan(
		&current.FirmID,
		&current.ItemID,
		&current.CatalogItemID,
		&current.BrandID,
		&current.ItemName,
		&current.SKU,
		&current.MRP,
		&current.DiscountPercentage,
		&current.Status,
		&current.Quantity,
		&current.UpdatedAt,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return PartnerInventoryItem{}, fmt.Errorf("inventory item not found")
		}
		return PartnerInventoryItem{}, err
	}

	originalQuantity := current.Quantity
	note := strings.TrimSpace(input.Note)
	if input.Quantity != nil {
		if *input.Quantity < 0 {
			return PartnerInventoryItem{}, fmt.Errorf("quantity cannot be negative")
		}
		current.Quantity = *input.Quantity
	}
	if input.Status != nil {
		status := strings.ToUpper(strings.TrimSpace(*input.Status))
		if status != "ACTIVE" && status != "INACTIVE" {
			return PartnerInventoryItem{}, fmt.Errorf("status must be ACTIVE or INACTIVE")
		}
		current.Status = status
	}
	if (current.Quantity != originalQuantity || input.Status != nil) && note == "" {
		return PartnerInventoryItem{}, fmt.Errorf("note is required")
	}

	if _, err := tx.Exec(ctx, `
		update partner_firm_inventory_items
		set quantity = $3,
		    status = $4,
		    updated_at = now()
		where firm_id = $1::bigint and item_id = $2
	`, firmID, itemID, current.Quantity, current.Status); err != nil {
		return PartnerInventoryItem{}, err
	}
	if current.Quantity != originalQuantity {
		if _, err := tx.Exec(ctx, `
			insert into partner_inventory_adjustments (
				id, firm_id, item_id, quantity_from, quantity_to, note, created_by
			) values ($1, $2, $3, $4, $5, $6, $7)
		`, nextID("padj"), firmID, itemID, originalQuantity, current.Quantity, note, s.currentUserID); err != nil {
			return PartnerInventoryItem{}, err
		}
		if _, err := tx.Exec(ctx, `
			insert into partner_stock_entries (
				id, firm_id, item_id, quantity_delta, reason_type, reference_type, reference_id, note, created_by
			) values ($1, $2, $3, $4, 'ADJUSTMENT', 'MANUAL', $5, $6, $7)
		`, nextID("pstock"), firmID, itemID, current.Quantity-originalQuantity, nextID("manual"), note, s.currentUserID); err != nil {
			return PartnerInventoryItem{}, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return PartnerInventoryItem{}, err
	}

	items, err := s.GetPartnerInventory(firmID, current.BrandID)
	if err != nil {
		return PartnerInventoryItem{}, err
	}
	for _, item := range items {
		if item.ItemID == itemID {
			return item, nil
		}
	}
	return PartnerInventoryItem{}, fmt.Errorf("inventory item not found after update")
}

func (s *Store) GetPartnerInventoryHistory(firmID string, filters PartnerInventoryHistoryFilters) ([]PartnerInventoryHistoryEntry, error) {
	ctx := context.Background()
	rows, err := s.pool.Query(ctx, `
		with supply_inward_line_totals as (
			select
				r.supply_inward_id,
				r.item_id,
				i.catalog_item_id,
				c.name as item_name,
				c.sku,
				sum(r.quantity)::int as quantity
			from partner_inventory_receipts r
			join partner_firm_inventory_items i on i.firm_id = r.firm_id and i.item_id = r.item_id
			join partner_product_catalog c on c.id = i.catalog_item_id
			where r.firm_id = $1::bigint
			  and r.supply_inward_id is not null
			group by r.supply_inward_id, r.item_id, i.catalog_item_id, c.name, c.sku
		),
		grn_line_totals as (
			select
				g.id as grn_id,
				g.firm_id,
				g.grn_number,
				g.received_date,
				g.notes,
				g.supplier_id,
				s.supplier_name,
				p.purchase_number,
				c.brand_id,
				gi.item_id,
				i.catalog_item_id,
				c.name as item_name,
				c.sku,
				sum(gi.received_quantity)::int as quantity
			from partner_goods_receipts g
			join partner_goods_receipt_items gi on gi.firm_id = g.firm_id and gi.grn_id = g.id
			join partner_purchases p on p.firm_id = g.firm_id and p.id = g.purchase_id
			join partner_suppliers s on s.firm_id = g.firm_id and s.id = g.supplier_id
			join partner_firm_inventory_items i on i.firm_id = gi.firm_id and i.item_id = gi.item_id
			join partner_product_catalog c on c.id = i.catalog_item_id
			where g.firm_id = $1::bigint
			  and gi.received_quantity > 0
			group by g.id, g.firm_id, g.grn_number, g.received_date, g.notes, g.supplier_id, s.supplier_name, p.purchase_number, c.brand_id, gi.item_id, i.catalog_item_id, c.name, c.sku
		),
		grn_rows as (
			select
				lt.grn_id || ':' || lt.brand_id::text as id,
				lt.firm_id,
				lt.brand_id,
				''::text as item_id,
				''::text as catalog_item_id,
				''::text as item_name,
				''::text as sku,
				'GOODS_RECEIPT'::text as event_type,
				coalesce(sum(lt.quantity), 0)::int as quantity_delta,
				0::int as quantity_from,
				0::int as quantity_to,
				lt.supplier_id,
				lt.supplier_name,
				trim(both ' ' from lt.grn_number || ' · ' || lt.purchase_number || coalesce(' · ' || nullif(lt.notes, ''), '')) as note,
				'POSTED'::text as status,
				''::text as reverted_at,
				''::text as revert_reason,
				lt.received_date::timestamptz as event_time,
				jsonb_agg(
					jsonb_build_object(
						'itemId', lt.item_id,
						'catalogItemId', lt.catalog_item_id,
						'itemName', lt.item_name,
						'sku', lt.sku,
						'quantity', lt.quantity
					)
					order by lt.item_name asc, lt.sku asc
				) as items_json,
				false as can_revert,
				lower(
					coalesce(lt.supplier_name, '') || ' ' ||
					coalesce(lt.grn_number, '') || ' ' ||
					coalesce(lt.purchase_number, '') || ' ' ||
					coalesce(lt.notes, '') || ' ' ||
					coalesce(string_agg(lt.item_name || ' ' || lt.sku, ' ' order by lt.item_name asc, lt.sku asc), '')
				) as search_text
			from grn_line_totals lt
			group by lt.grn_id, lt.firm_id, lt.brand_id, lt.supplier_id, lt.supplier_name, lt.grn_number, lt.purchase_number, lt.notes, lt.received_date
		),
		supply_inward_rows as (
			select
				si.id,
				si.firm_id,
				si.brand_id,
				''::text as item_id,
				''::text as catalog_item_id,
				''::text as item_name,
				''::text as sku,
				'SUPPLY_INWARD'::text as event_type,
				coalesce(sum(lt.quantity), 0)::int as quantity_delta,
				0::int as quantity_from,
				0::int as quantity_to,
				si.supplier_id,
				s.supplier_name,
				coalesce(si.note, '') as note,
				si.status,
				coalesce(to_char(si.reverted_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), '') as reverted_at,
				coalesce(si.revert_reason, '') as revert_reason,
				si.created_at as event_time,
				jsonb_agg(
					jsonb_build_object(
						'itemId', lt.item_id,
						'catalogItemId', lt.catalog_item_id,
						'itemName', lt.item_name,
						'sku', lt.sku,
						'quantity', lt.quantity
					)
					order by lt.item_name asc, lt.sku asc
				) as items_json,
				case
					when si.status <> 'POSTED' then false
					else bool_and(fi.quantity >= lt.quantity)
				end as can_revert,
				lower(
					coalesce(s.supplier_name, '') || ' ' ||
					coalesce(si.note, '') || ' ' ||
					coalesce(string_agg(lt.item_name || ' ' || lt.sku, ' ' order by lt.item_name asc, lt.sku asc), '')
				) as search_text
			from partner_supply_inwards si
			join partner_suppliers s on s.firm_id = si.firm_id and s.id = si.supplier_id
			join supply_inward_line_totals lt on lt.supply_inward_id = si.id
			join partner_firm_inventory_items fi on fi.firm_id = si.firm_id and fi.item_id = lt.item_id
			where si.firm_id = $1::bigint
			group by si.id, si.firm_id, si.brand_id, si.supplier_id, s.supplier_name, si.note, si.status, si.reverted_at, si.revert_reason, si.received_at
		),
		adjustment_rows as (
			select
				a.id,
				a.firm_id,
				c.brand_id,
				i.item_id,
				i.catalog_item_id,
				c.name as item_name,
				c.sku,
				'ADJUSTMENT'::text as event_type,
				(a.quantity_to - a.quantity_from) as quantity_delta,
				a.quantity_from,
				a.quantity_to,
				''::text as supplier_id,
				''::text as supplier_name,
				coalesce(a.note, '') as note,
				''::text as status,
				''::text as reverted_at,
				''::text as revert_reason,
				a.created_at as event_time,
				'[]'::jsonb as items_json,
				false as can_revert,
				lower(coalesce(c.name, '') || ' ' || coalesce(c.sku, '') || ' ' || coalesce(a.note, '')) as search_text
			from partner_inventory_adjustments a
			join partner_firm_inventory_items i on i.firm_id = a.firm_id and i.item_id = a.item_id
			join partner_product_catalog c on c.id = i.catalog_item_id
			where a.firm_id = $1::bigint
		),
		history as (
			select * from grn_rows
			union all
			select * from supply_inward_rows
			union all
			select * from adjustment_rows
		)
		select
			id,
			firm_id,
			brand_id,
			item_id,
			catalog_item_id,
			item_name,
			sku,
			event_type,
			quantity_delta,
			quantity_from,
			quantity_to,
			coalesce(supplier_id, ''),
			coalesce(supplier_name, ''),
			note,
			coalesce(status, ''),
			can_revert,
			reverted_at,
			revert_reason,
			to_char(event_time at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
			items_json::text
		from history
		where ($2 = '' or brand_id = $2::bigint)
		  and ($3 = '' or event_time::date >= $3::date)
		  and ($4 = '' or event_time::date <= $4::date)
		  and ($5 = '' or search_text like lower('%' || $5 || '%'))
		order by event_time desc, id desc
	`, firmID, strings.TrimSpace(filters.BrandID), strings.TrimSpace(filters.FromDate), strings.TrimSpace(filters.ToDate), strings.TrimSpace(filters.Query))
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []PartnerInventoryHistoryEntry
	for rows.Next() {
		var item PartnerInventoryHistoryEntry
		var itemsJSON string
		if err := rows.Scan(
			&item.ID,
			&item.FirmID,
			&item.BrandID,
			&item.ItemID,
			&item.CatalogItemID,
			&item.ItemName,
			&item.SKU,
			&item.EventType,
			&item.QuantityDelta,
			&item.QuantityFrom,
			&item.QuantityTo,
			&item.SupplierID,
			&item.SupplierName,
			&item.Note,
			&item.Status,
			&item.CanRevert,
			&item.RevertedAt,
			&item.RevertReason,
			&item.EventAt,
			&itemsJSON,
		); err != nil {
			return nil, err
		}
		if strings.TrimSpace(itemsJSON) != "" && strings.TrimSpace(itemsJSON) != "null" {
			if err := json.Unmarshal([]byte(itemsJSON), &item.Items); err != nil {
				return nil, err
			}
		}
		items = append(items, item)
	}
	if rows.Err() != nil {
		return nil, rows.Err()
	}
	if items == nil {
		return []PartnerInventoryHistoryEntry{}, nil
	}
	return items, nil
}

func (s *Store) RevertPartnerSupplyInward(firmID, supplyInwardID, reason string) (PartnerInventoryHistoryEntry, error) {
	ctx := context.Background()
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return PartnerInventoryHistoryEntry{}, err
	}
	defer tx.Rollback(ctx)

	var currentStatus string
	if err := tx.QueryRow(ctx, `
		select status
		from partner_supply_inwards
		where firm_id = $1::bigint and id = $2
	`, firmID, supplyInwardID).Scan(&currentStatus); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return PartnerInventoryHistoryEntry{}, fmt.Errorf("supply inward not found")
		}
		return PartnerInventoryHistoryEntry{}, err
	}
	if currentStatus != "POSTED" {
		return PartnerInventoryHistoryEntry{}, fmt.Errorf("supply inward is already reverted")
	}

	type lineCheck struct {
		ItemID          string
		RevertQuantity  int
		CurrentQuantity int
	}
	rows, err := tx.Query(ctx, `
		select
			r.item_id,
			sum(r.quantity)::int as revert_quantity,
			i.quantity as current_quantity
		from partner_inventory_receipts r
		join partner_firm_inventory_items i on i.firm_id = r.firm_id and i.item_id = r.item_id
		where r.firm_id = $1::bigint and r.supply_inward_id = $2
		group by r.item_id, i.quantity
	`, firmID, supplyInwardID)
	if err != nil {
		return PartnerInventoryHistoryEntry{}, err
	}
	defer rows.Close()

	var checks []lineCheck
	for rows.Next() {
		var item lineCheck
		if err := rows.Scan(&item.ItemID, &item.RevertQuantity, &item.CurrentQuantity); err != nil {
			return PartnerInventoryHistoryEntry{}, err
		}
		if item.CurrentQuantity-item.RevertQuantity < 0 {
			return PartnerInventoryHistoryEntry{}, fmt.Errorf("cannot revert supply inward because one or more items would become negative")
		}
		checks = append(checks, item)
	}
	if rows.Err() != nil {
		return PartnerInventoryHistoryEntry{}, rows.Err()
	}
	if len(checks) == 0 {
		return PartnerInventoryHistoryEntry{}, fmt.Errorf("supply inward has no lines")
	}

	now := time.Now().UTC()
	revertReason := strings.TrimSpace(reason)

	for _, item := range checks {
		if _, err := tx.Exec(ctx, `
			update partner_firm_inventory_items
			set quantity = quantity - $3,
			    updated_at = now()
			where firm_id = $1::bigint and item_id = $2
		`, firmID, item.ItemID, item.RevertQuantity); err != nil {
			return PartnerInventoryHistoryEntry{}, err
		}
		if _, err := tx.Exec(ctx, `
			insert into partner_stock_entries (
				id, firm_id, item_id, quantity_delta, reason_type, reference_type, reference_id, note, created_by, created_at
			) values ($1, $2, $3, $4, 'CANCEL', 'SUPPLY_INWARD', $5, nullif($6, ''), $7, $8)
		`, nextID("pstock"), firmID, item.ItemID, -item.RevertQuantity, supplyInwardID, revertReason, s.currentUserID, now); err != nil {
			return PartnerInventoryHistoryEntry{}, err
		}
	}

	if _, err := tx.Exec(ctx, `
		update partner_inventory_receipts
		set status = 'VOIDED',
		    voided_at = $3,
		    void_reason = nullif($4, '')
		where firm_id = $1::bigint and supply_inward_id = $2
	`, firmID, supplyInwardID, now, revertReason); err != nil {
		return PartnerInventoryHistoryEntry{}, err
	}

	if _, err := tx.Exec(ctx, `
		update partner_supply_inwards
		set status = 'REVERTED',
		    reverted_at = $3,
		    revert_reason = nullif($4, '')
		where firm_id = $1::bigint and id = $2
	`, firmID, supplyInwardID, now, revertReason); err != nil {
		return PartnerInventoryHistoryEntry{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return PartnerInventoryHistoryEntry{}, err
	}

	items, err := s.GetPartnerInventoryHistory(firmID, PartnerInventoryHistoryFilters{})
	if err != nil {
		return PartnerInventoryHistoryEntry{}, err
	}
	for _, item := range items {
		if item.ID == supplyInwardID && item.EventType == "SUPPLY_INWARD" {
			return item, nil
		}
	}
	return PartnerInventoryHistoryEntry{}, fmt.Errorf("supply inward not found after revert")
}

func (s *Store) CreateEntity(input CreateEntityInput) (Client, error) {
	ctx := context.Background()
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return Client{}, err
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, `
		insert into users (id, name, phone)
		values ($1, $2, $3)
		on conflict (id) do update set name = excluded.name, phone = excluded.phone, updated_at = now()
	`, s.currentUserID, strings.TrimSpace(input.OwnerName), strings.TrimSpace(input.OwnerPhone)); err != nil {
		return Client{}, err
	}

	clientID := nextID("client")
	imagesJSON, err := json.Marshal(input.Images)
	if err != nil {
		return Client{}, err
	}

	if _, err := tx.Exec(ctx, `
		insert into entities (id, name, client_type, address, location_lat, location_lng, images)
		values ($1, $2, $3, $4, $5, $6, $7::jsonb)
	`, clientID, strings.TrimSpace(input.Name), input.ClientType, input.Address, input.Location.Lat, input.Location.Lng, string(imagesJSON)); err != nil {
		return Client{}, err
	}

	if _, err := tx.Exec(ctx, `
		insert into entity_members (user_id, entity_id, role, status, joined_at)
		values ($1, $2, 'OWNER', 'ACTIVE', now())
		on conflict (user_id, entity_id) do update set role = 'OWNER', status = 'ACTIVE', joined_at = now()
	`, s.currentUserID, clientID); err != nil {
		return Client{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return Client{}, err
	}

	return Client{
		ID:         clientID,
		Name:       strings.TrimSpace(input.Name),
		ClientType: input.ClientType,
	}, nil
}

func (s *Store) GetMembers(entityID string) ([]EntityMember, error) {
	ctx := context.Background()
	rows, err := s.pool.Query(ctx, `
		select m.user_id, m.entity_id, u.name, coalesce(u.avatar_url, ''), u.phone, m.role, m.status, m.joined_at
		from entity_members m
		join users u on u.id = m.user_id
		where m.entity_id = $1
		order by
		  case m.role
		    when 'OWNER' then 1
		    when 'MANAGER' then 2
		    when 'STAFF' then 3
		    when 'ACCOUNT_MANAGER' then 4
		    else 5
		  end,
		  m.joined_at asc
	`, entityID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []EntityMember
	for rows.Next() {
		item, err := scanMember(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return ensureMembers(items), nil
}

func (s *Store) CurrentUserRole(entityID string) (EntityRole, bool) {
	ctx := context.Background()
	var role EntityRole
	err := s.pool.QueryRow(ctx, `
		select role
		from entity_members
		where user_id = $1::bigint and entity_id = $2 and status = 'ACTIVE'
	`, s.currentUserID, entityID).Scan(&role)
	if err != nil {
		return "", false
	}
	return role, true
}

func (s *Store) HasEntityAccess(entityID string) bool {
	_, ok := s.CurrentUserRole(entityID)
	return ok
}

func (s *Store) RemoveMember(entityID, userID string) (bool, error) {
	ctx := context.Background()
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return false, err
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, `
		delete from staff_service_capabilities
		where entity_id = $1 and user_id = $2::bigint
	`, entityID, userID); err != nil {
		return false, err
	}

	tag, err := tx.Exec(ctx, `
		delete from entity_members
		where entity_id = $1 and user_id = $2::bigint
	`, entityID, userID)
	if err != nil {
		return false, err
	}
	if err := tx.Commit(ctx); err != nil {
		return false, err
	}
	return tag.RowsAffected() > 0, nil
}

func (s *Store) GetInvites(entityID string) ([]Invite, error) {
	ctx := context.Background()
	if _, err := s.pool.Exec(ctx, `
		update entity_invites
		set status = 'EXPIRED'
		where entity_id = $1 and status = 'PENDING' and expires_at <= now()
	`, entityID); err != nil {
		return nil, err
	}

	rows, err := s.pool.Query(ctx, `
		select id, entity_id, phone, role, token, status, expires_at, created_at
		from entity_invites
		where entity_id = $1
		order by created_at desc
	`, entityID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []Invite
	for rows.Next() {
		item, err := scanInvite(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return ensureInvites(items), nil
}

func (s *Store) CreateInvite(input CreateInviteInput) (Invite, error) {
	if input.Role == RoleAccountManager {
		return Invite{}, fmt.Errorf("account managers are internal Zistributo users and cannot be invited from this page")
	}
	if input.Role == RoleOwner {
		return Invite{}, fmt.Errorf("owner invites are not supported")
	}

	ctx := context.Background()
	id := nextID("inv")
	token := nextID("invite")
	var invite Invite
	err := s.pool.QueryRow(ctx, `
		insert into entity_invites (id, entity_id, phone, role, token, status, expires_at)
		values ($1, $2, $3, $4, $5, 'PENDING', now() + interval '7 days')
		returning id, entity_id, phone, role, token, status, expires_at, created_at
	`, id, input.EntityID, strings.TrimSpace(input.Phone), input.Role, token).Scan(
		&invite.ID, &invite.EntityID, &invite.Phone, &invite.Role, &invite.Token, &invite.Status, &invite.ExpiresAt, &invite.CreatedAt,
	)
	if err != nil {
		return Invite{}, err
	}
	return invite, nil
}

func (s *Store) AcceptInvite(token string) (EntityMember, error) {
	ctx := context.Background()
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return EntityMember{}, err
	}
	defer tx.Rollback(ctx)

	currentUser, err := s.currentUserTx(ctx, tx)
	if err != nil {
		return EntityMember{}, err
	}

	var invite Invite
	err = tx.QueryRow(ctx, `
		select id, entity_id, phone, role, token, status, expires_at, created_at
		from entity_invites
		where token = $1
		for update
	`, token).Scan(
		&invite.ID, &invite.EntityID, &invite.Phone, &invite.Role, &invite.Token, &invite.Status, &invite.ExpiresAt, &invite.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return EntityMember{}, fmt.Errorf("this invite is no longer available")
		}
		return EntityMember{}, err
	}

	if invite.Status != InviteStatusPending {
		return EntityMember{}, fmt.Errorf("this invite is no longer available")
	}
	expiresAt, err := time.Parse(time.RFC3339Nano, invite.ExpiresAt)
	if err != nil {
		expiresAt, _ = time.Parse(time.RFC3339, invite.ExpiresAt)
	}
	if !expiresAt.After(time.Now()) {
		if _, err := tx.Exec(ctx, `update entity_invites set status = 'EXPIRED' where id = $1`, invite.ID); err != nil {
			return EntityMember{}, err
		}
		return EntityMember{}, fmt.Errorf("this invite is no longer available")
	}
	if invite.Phone != currentUser.Phone {
		return EntityMember{}, fmt.Errorf("this invite was sent to a different phone number")
	}

	if _, err := tx.Exec(ctx, `update entity_invites set status = 'ACCEPTED' where id = $1`, invite.ID); err != nil {
		return EntityMember{}, err
	}

	if _, err := tx.Exec(ctx, `
		insert into entity_members (user_id, entity_id, role, status, joined_at)
		values ($1, $2, $3, 'ACTIVE', now())
		on conflict (user_id, entity_id) do update set role = excluded.role, status = 'ACTIVE', joined_at = now()
	`, currentUser.ID, invite.EntityID, invite.Role); err != nil {
		return EntityMember{}, err
	}

	var member EntityMember
	err = tx.QueryRow(ctx, `
		select m.user_id, m.entity_id, u.name, coalesce(u.avatar_url, ''), u.phone, m.role, m.status, m.joined_at
		from entity_members m
		join users u on u.id = m.user_id
		where m.user_id = $1::bigint and m.entity_id = $2
	`, currentUser.ID, invite.EntityID).Scan(
		&member.UserID, &member.EntityID, &member.Name, &member.AvatarURL, &member.Phone, &member.Role, &member.Status, &member.JoinedAt,
	)
	if err != nil {
		return EntityMember{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return EntityMember{}, err
	}

	return member, nil
}

func (s *Store) RevokeInvite(inviteID string) (bool, error) {
	ctx := context.Background()
	tag, err := s.pool.Exec(ctx, `delete from entity_invites where id = $1`, inviteID)
	if err != nil {
		return false, err
	}
	return tag.RowsAffected() > 0, nil
}

func (s *Store) EntityIDForInvite(inviteID string) string {
	ctx := context.Background()
	var entityID string
	if err := s.pool.QueryRow(ctx, `select entity_id from entity_invites where id = $1`, inviteID).Scan(&entityID); err != nil {
		return ""
	}
	return entityID
}

func (s *Store) GetServiceCategories(clientID string) ([]ServiceCategory, error) {
	ctx := context.Background()
	rows, err := s.pool.Query(ctx, `
		select id, entity_id, name, coalesce(parent_id, ''), coalesce(sort_order, 999)
		from service_categories
		where entity_id = $1
		order by coalesce(sort_order, 999) asc, name asc
	`, clientID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []ServiceCategory
	for rows.Next() {
		var item ServiceCategory
		if err := rows.Scan(&item.ID, &item.ClientID, &item.Name, &item.ParentID, &item.SortOrder); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return ensureServiceCategories(items), nil
}

func (s *Store) CreateServiceCategory(input CreateServiceCategoryInput) (ServiceCategory, error) {
	ctx := context.Background()
	id := nextID("cat")
	sortOrder := 999
	if input.SortOrder != nil {
		sortOrder = *input.SortOrder
	}

	var parentID any
	if strings.TrimSpace(input.ParentID) != "" {
		parentID = strings.TrimSpace(input.ParentID)
		parent, err := s.getServiceCategory(ctx, input.ParentID)
		if err != nil {
			return ServiceCategory{}, err
		}
		if parent.ClientID != input.ClientID {
			return ServiceCategory{}, fmt.Errorf("parent category does not belong to client")
		}
	}

	var item ServiceCategory
	err := s.pool.QueryRow(ctx, `
		insert into service_categories (id, entity_id, name, parent_id, sort_order)
		values ($1, $2, $3, $4, $5)
		returning id, entity_id, name, coalesce(parent_id, ''), coalesce(sort_order, 999)
	`, id, input.ClientID, strings.TrimSpace(input.Name), parentID, sortOrder).Scan(
		&item.ID, &item.ClientID, &item.Name, &item.ParentID, &item.SortOrder,
	)
	if err != nil {
		return ServiceCategory{}, err
	}
	return item, nil
}

func (s *Store) UpdateServiceCategory(id string, patch UpdateServiceCategoryInput) (ServiceCategory, error) {
	ctx := context.Background()
	item, err := s.getServiceCategory(ctx, id)
	if err != nil {
		return ServiceCategory{}, err
	}
	if patch.Name != nil {
		item.Name = strings.TrimSpace(*patch.Name)
	}
	if patch.ParentID != nil {
		item.ParentID = strings.TrimSpace(*patch.ParentID)
	}
	if patch.SortOrder != nil {
		item.SortOrder = *patch.SortOrder
	}

	if item.ParentID == item.ID {
		return ServiceCategory{}, fmt.Errorf("category cannot be its own parent")
	}
	if item.ParentID != "" {
		descendants, err := s.getServiceCategoryDescendantIDs(ctx, id)
		if err != nil {
			return ServiceCategory{}, err
		}
		for _, descendantID := range descendants {
			if descendantID == item.ParentID {
				return ServiceCategory{}, fmt.Errorf("category cannot move inside its own subtree")
			}
		}
	}

	var parentID any
	if item.ParentID != "" {
		parentID = item.ParentID
		parent, err := s.getServiceCategory(ctx, item.ParentID)
		if err != nil {
			return ServiceCategory{}, err
		}
		if parent.ClientID != item.ClientID {
			return ServiceCategory{}, fmt.Errorf("parent category does not belong to client")
		}
	}
	if _, err := s.pool.Exec(ctx, `
		update service_categories
		set name = $2, parent_id = $3, sort_order = $4, updated_at = now()
		where id = $1
	`, id, item.Name, parentID, item.SortOrder); err != nil {
		return ServiceCategory{}, err
	}
	if err := s.syncServiceCategoryPaths(ctx, id); err != nil {
		return ServiceCategory{}, err
	}
	return item, nil
}

func (s *Store) DeleteServiceCategory(id string) error {
	ctx := context.Background()
	descendants, err := s.getServiceCategoryDescendantIDs(ctx, id)
	if err != nil {
		return err
	}
	if len(descendants) == 0 {
		return nil
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, `
		delete from services
		where category_id = any($1)
	`, descendants); err != nil {
		return err
	}
	if _, err := tx.Exec(ctx, `
		delete from service_categories
		where id = $1
	`, id); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func (s *Store) GetServices(clientID string) ([]Service, error) {
	ctx := context.Background()
	rows, err := s.pool.Query(ctx, `
		select id, entity_id, coalesce(category_id, ''), name, coalesce(category_path, ''), coalesce(description, ''),
		       coalesce(price, 0), coalesce(duration_minutes, 0), to_char(updated_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), active
		from services
		where entity_id = $1
		order by category_path asc, name asc
	`, clientID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []Service
	for rows.Next() {
		var item Service
		if err := rows.Scan(
			&item.ID,
			&item.ClientID,
			&item.CategoryID,
			&item.Name,
			&item.CategoryPath,
			&item.Description,
			&item.Price,
			&item.DurationMinutes,
			&item.UpdatedAt,
			&item.Active,
		); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return ensureServices(items), nil
}

func (s *Store) CreateService(input CreateServiceInput) (Service, error) {
	ctx := context.Background()
	id := nextID("svc")
	categoryID, categoryPath, err := s.resolveServiceCategory(ctx, strings.TrimSpace(input.ClientID), strings.TrimSpace(input.CategoryID), strings.TrimSpace(input.CategoryPath))
	if err != nil {
		return Service{}, err
	}

	var price any
	var duration any
	if input.Price != nil {
		price = *input.Price
	}
	if input.DurationMinutes != nil {
		duration = *input.DurationMinutes
	}
	var description any
	if strings.TrimSpace(input.Description) != "" {
		description = strings.TrimSpace(input.Description)
	}
	var categoryIDValue any
	if categoryID != "" {
		categoryIDValue = categoryID
	}
	var categoryPathValue any
	if categoryPath != "" {
		categoryPathValue = categoryPath
	}

	var item Service
	err = s.pool.QueryRow(ctx, `
		insert into services (id, entity_id, category_id, name, category_path, description, price, duration_minutes, active)
		values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		returning id, entity_id, coalesce(category_id, ''), name, coalesce(category_path, ''), coalesce(description, ''),
		          coalesce(price, 0), coalesce(duration_minutes, 0), to_char(updated_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), active
	`, id, input.ClientID, categoryIDValue, strings.TrimSpace(input.Name), categoryPathValue, description, price, duration, input.Active).Scan(
		&item.ID, &item.ClientID, &item.CategoryID, &item.Name, &item.CategoryPath, &item.Description, &item.Price, &item.DurationMinutes, &item.UpdatedAt, &item.Active,
	)
	if err != nil {
		return Service{}, err
	}
	return item, nil
}

func (s *Store) UpdateService(id string, patch UpdateServiceInput) (Service, error) {
	ctx := context.Background()
	item, err := s.getService(ctx, id)
	if err != nil {
		return Service{}, err
	}
	if patch.Name != nil {
		item.Name = strings.TrimSpace(*patch.Name)
	}
	if patch.Description != nil {
		item.Description = strings.TrimSpace(*patch.Description)
	}
	if patch.Price != nil {
		item.Price = *patch.Price
	}
	if patch.DurationMinutes != nil {
		item.DurationMinutes = *patch.DurationMinutes
	}
	if patch.Active != nil {
		item.Active = *patch.Active
	}

	nextCategoryID := item.CategoryID
	nextCategoryPath := item.CategoryPath
	if patch.CategoryID != nil || patch.CategoryPath != nil {
		categoryIDInput := nextCategoryID
		if patch.CategoryID != nil {
			categoryIDInput = strings.TrimSpace(*patch.CategoryID)
		}
		categoryPathInput := nextCategoryPath
		if patch.CategoryPath != nil {
			categoryPathInput = strings.TrimSpace(*patch.CategoryPath)
		}
		categoryID, categoryPath, err := s.resolveServiceCategory(ctx, item.ClientID, categoryIDInput, categoryPathInput)
		if err != nil {
			return Service{}, err
		}
		nextCategoryID = categoryID
		nextCategoryPath = categoryPath
	}
	item.CategoryID = nextCategoryID
	item.CategoryPath = nextCategoryPath

	var categoryIDValue any
	if item.CategoryID != "" {
		categoryIDValue = item.CategoryID
	}
	var categoryPathValue any
	if item.CategoryPath != "" {
		categoryPathValue = item.CategoryPath
	}
	var description any
	if item.Description != "" {
		description = item.Description
	}
	var price any = item.Price
	if item.Price == 0 {
		price = nil
	}
	var duration any = item.DurationMinutes
	if item.DurationMinutes == 0 {
		duration = nil
	}

	if _, err := s.pool.Exec(ctx, `
		update services
		set category_id = $2, name = $3, category_path = $4, description = $5, price = $6, duration_minutes = $7, active = $8, updated_at = now()
		where id = $1
	`, id, categoryIDValue, item.Name, categoryPathValue, description, price, duration, item.Active); err != nil {
		return Service{}, err
	}
	updated, err := s.getService(ctx, id)
	if err != nil {
		return Service{}, err
	}
	return updated, nil
}

func (s *Store) DeleteService(id string) error {
	ctx := context.Background()
	tag, err := s.pool.Exec(ctx, `delete from services where id = $1`, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("service not found")
	}
	return nil
}

func (s *Store) ClientIDForService(id string) string {
	ctx := context.Background()
	var clientID string
	if err := s.pool.QueryRow(ctx, `select entity_id from services where id = $1`, id).Scan(&clientID); err != nil {
		return ""
	}
	return clientID
}

func (s *Store) ClientIDForServiceCategory(id string) string {
	ctx := context.Background()
	var clientID string
	if err := s.pool.QueryRow(ctx, `select entity_id from service_categories where id = $1`, id).Scan(&clientID); err != nil {
		return ""
	}
	return clientID
}

func (s *Store) GetStaffCapabilities(entityID string) ([]StaffServiceCapability, error) {
	ctx := context.Background()
	rows, err := s.pool.Query(ctx, `
		select entity_id, user_id, service_id, is_enabled
		from staff_service_capabilities
		where entity_id = $1
		order by user_id asc, service_id asc
	`, entityID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []StaffServiceCapability
	for rows.Next() {
		var item StaffServiceCapability
		if err := rows.Scan(&item.EntityID, &item.UserID, &item.ServiceID, &item.IsEnabled); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return ensureStaffCapabilities(items), nil
}

func (s *Store) UpdateStaffCapabilities(userID string, input UpdateStaffCapabilitiesInput) ([]StaffServiceCapability, error) {
	ctx := context.Background()
	numericUserID, err := strconv.ParseInt(strings.TrimSpace(userID), 10, 64)
	if err != nil || numericUserID <= 0 {
		return nil, fmt.Errorf("invalid user id")
	}
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, `
		delete from staff_service_capabilities
		where entity_id = $1 and user_id = $2::bigint
	`, input.EntityID, userID); err != nil {
		return nil, err
	}

	for _, serviceID := range input.ServiceIDs {
		if _, err := tx.Exec(ctx, `
			insert into staff_service_capabilities (entity_id, user_id, service_id, is_enabled)
			values ($1, $2, $3, true)
		`, input.EntityID, userID, serviceID); err != nil {
			return nil, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	var items []StaffServiceCapability
	for _, serviceID := range input.ServiceIDs {
		items = append(items, StaffServiceCapability{
			EntityID:  input.EntityID,
			UserID:    numericUserID,
			ServiceID: serviceID,
			IsEnabled: true,
		})
	}
	return items, nil
}

func (s *Store) GetDayEntries(clientID, fromDate, toDate string) ([]DayEntry, error) {
	ctx := context.Background()
	rows, err := s.pool.Query(ctx, `
		select id, coalesce(visit_id, ''), entity_id, date::text, coalesce(start_time, ''), service_id, staff_id::text, staff_ids,
		       price_override, coalesce(customer_name, ''), coalesce(customer_phone, ''), coalesce(note, ''), status, payment_status, paid_amount
		from day_entries
		where entity_id = $1
		  and ($2 = '' or date >= $2::date)
		  and ($3 = '' or date <= $3::date)
		order by date asc, start_time asc, created_at asc
	`, clientID, fromDate, toDate)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []DayEntry
	for rows.Next() {
		item, err := scanDayEntry(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return ensureDayEntries(items), nil
}

func (s *Store) CreateDayEntry(input CreateDayEntryInput) (DayEntry, error) {
	ctx := context.Background()
	total, err := s.resolveEntryAmount(ctx, input.ServiceID, input.PriceOverride)
	if err != nil {
		return DayEntry{}, err
	}
	paymentStatus := computePaymentStatus(input.PaidAmount, total)
	id := nextID("de")
	staffIDsJSON, err := json.Marshal(input.StaffIDs)
	if err != nil {
		return DayEntry{}, err
	}

	var item DayEntry
	err = s.pool.QueryRow(ctx, `
		insert into day_entries (
			id, visit_id, entity_id, date, start_time, service_id, staff_id, staff_ids, price_override,
			customer_name, customer_phone, note, status, payment_status, paid_amount
		) values (
			$1, nullif($2, ''), $3, $4::date, nullif($5, ''), $6, $7::bigint, $8::jsonb, $9,
			nullif($10, ''), nullif($11, ''), nullif($12, ''), $13, $14, $15
		)
		returning id, coalesce(visit_id, ''), entity_id, date::text, coalesce(start_time, ''), service_id, staff_id::text, staff_ids,
		          price_override, coalesce(customer_name, ''), coalesce(customer_phone, ''), coalesce(note, ''), status, payment_status, paid_amount
	`, id, input.VisitID, input.ClientID, input.Date, input.StartTime, input.ServiceID, input.StaffID, string(staffIDsJSON),
		input.PriceOverride, input.CustomerName, input.CustomerPhone, input.Note, input.Status, paymentStatus, input.PaidAmount).Scan(
		&item.ID, &item.VisitID, &item.ClientID, &item.Date, &item.StartTime, &item.ServiceID, &item.StaffID,
		newJSONScanner(&item.StaffIDs), &item.PriceOverride, &item.CustomerName, &item.CustomerPhone, &item.Note,
		&item.Status, &item.PaymentStatus, &item.PaidAmount,
	)
	if err != nil {
		return DayEntry{}, err
	}
	return normalizeDayEntry(item), nil
}

func (s *Store) UpdateDayEntry(id string, patch UpdateDayEntryInput) (DayEntry, error) {
	ctx := context.Background()
	item, err := s.getDayEntry(ctx, id)
	if err != nil {
		return DayEntry{}, err
	}

	if patch.VisitID != nil {
		item.VisitID = *patch.VisitID
	}
	if patch.ClientID != nil {
		item.ClientID = *patch.ClientID
	}
	if patch.Date != nil {
		item.Date = *patch.Date
	}
	if patch.StartTime != nil {
		item.StartTime = *patch.StartTime
	}
	if patch.ServiceID != nil {
		item.ServiceID = *patch.ServiceID
	}
	if patch.StaffID != nil {
		item.StaffID = *patch.StaffID
	}
	if patch.StaffIDs != nil {
		item.StaffIDs = patch.StaffIDs
	}
	if patch.PriceOverride != nil {
		item.PriceOverride = cloneIntPtr(patch.PriceOverride)
	}
	if patch.CustomerName != nil {
		item.CustomerName = *patch.CustomerName
	}
	if patch.CustomerPhone != nil {
		item.CustomerPhone = *patch.CustomerPhone
	}
	if patch.Note != nil {
		item.Note = *patch.Note
	}
	if patch.Status != nil {
		item.Status = DayEntryStatus(*patch.Status)
	}
	if patch.PaidAmount != nil {
		item.PaidAmount = *patch.PaidAmount
	}

	total, err := s.resolveEntryAmount(ctx, item.ServiceID, item.PriceOverride)
	if err != nil {
		return DayEntry{}, err
	}
	item.PaymentStatus = computePaymentStatus(item.PaidAmount, total)

	staffIDsJSON, err := json.Marshal(item.StaffIDs)
	if err != nil {
		return DayEntry{}, err
	}

	var visitID any
	if item.VisitID != "" {
		visitID = item.VisitID
	}
	var startTime any
	if item.StartTime != "" {
		startTime = item.StartTime
	}
	var customerName any
	if item.CustomerName != "" {
		customerName = item.CustomerName
	}
	var customerPhone any
	if item.CustomerPhone != "" {
		customerPhone = item.CustomerPhone
	}
	var note any
	if item.Note != "" {
		note = item.Note
	}

	if _, err := s.pool.Exec(ctx, `
		update day_entries
		set visit_id = $2, entity_id = $3, date = $4::date, start_time = $5, service_id = $6, staff_id = $7::bigint, staff_ids = $8::jsonb,
		    price_override = $9, customer_name = $10, customer_phone = $11, note = $12, status = $13, payment_status = $14,
		    paid_amount = $15, updated_at = now()
		where id = $1
	`, id, visitID, item.ClientID, item.Date, startTime, item.ServiceID, item.StaffID, string(staffIDsJSON), item.PriceOverride,
		customerName, customerPhone, note, item.Status, item.PaymentStatus, item.PaidAmount); err != nil {
		return DayEntry{}, err
	}

	return normalizeDayEntry(item), nil
}

func (s *Store) DeleteDayEntry(id string) (bool, error) {
	ctx := context.Background()
	tag, err := s.pool.Exec(ctx, `delete from day_entries where id = $1`, id)
	if err != nil {
		return false, err
	}
	return tag.RowsAffected() > 0, nil
}

func (s *Store) ClientIDForDayEntry(id string) string {
	ctx := context.Background()
	var clientID string
	if err := s.pool.QueryRow(ctx, `select entity_id from day_entries where id = $1`, id).Scan(&clientID); err != nil {
		return ""
	}
	return clientID
}

func (s *Store) CreatePayment(input CreatePaymentInput) (PaymentRecord, error) {
	ctx := context.Background()
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return PaymentRecord{}, err
	}
	defer tx.Rollback(ctx)

	entry, err := s.getDayEntryTx(ctx, tx, input.DayEntryID)
	if err != nil {
		return PaymentRecord{}, err
	}

	total, err := s.resolveEntryAmountTx(ctx, tx, entry.ServiceID, entry.PriceOverride)
	if err != nil {
		return PaymentRecord{}, err
	}

	entry.PaidAmount += input.Amount
	entry.PaymentStatus = computePaymentStatus(entry.PaidAmount, total)

	if _, err := tx.Exec(ctx, `
		update day_entries
		set paid_amount = $2, payment_status = $3, updated_at = now()
		where id = $1
	`, entry.ID, entry.PaidAmount, entry.PaymentStatus); err != nil {
		return PaymentRecord{}, err
	}

	id := nextID("pay")
	var payment PaymentRecord
	err = tx.QueryRow(ctx, `
		insert into payment_records (id, day_entry_id, entity_id, amount, mode, note)
		values ($1, $2, $3, $4, $5, nullif($6, ''))
		returning id, day_entry_id, entity_id, amount, mode, coalesce(note, ''), created_at
	`, id, input.DayEntryID, input.ClientID, input.Amount, input.Mode, input.Note).Scan(
		&payment.ID, &payment.DayEntryID, &payment.ClientID, &payment.Amount, &payment.Mode, &payment.Note, &payment.CreatedAt,
	)
	if err != nil {
		return PaymentRecord{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return PaymentRecord{}, err
	}
	return payment, nil
}

func (s *Store) ensureCurrentUser(ctx context.Context) error {
	if _, err := s.pool.Exec(ctx, `
		insert into users (id, name, phone)
		values ($1, $2, $3)
		on conflict (id) do update
		set name = excluded.name, phone = excluded.phone, updated_at = now()
	`, s.currentUserID, s.currentUserName, s.currentUserPhone); err != nil {
		return err
	}
	_, err := s.pool.Exec(ctx, `
		select setval(pg_get_serial_sequence('users', 'id'), coalesce((select max(id) from users), 1), true)
	`)
	return err
}

func (s *Store) seedDemoData(ctx context.Context) error {
	var count int
	if err := s.pool.QueryRow(ctx, `select count(*) from entities`).Scan(&count); err != nil {
		return err
	}
	if count > 0 {
		return nil
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	users := []struct {
		id, name, phone, avatarURL string
	}{
		{s.currentUserID, s.currentUserName, s.currentUserPhone, "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80"},
		{"usr_manager_1", "Riya Mehta", "9876500001", "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80"},
		{"usr_staff_1", "Arjun Nair", "9876500002", "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80"},
		{"usr_account_manager_1", "Maya Singh", "9876500003", "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80"},
	}

	for _, user := range users {
		if _, err := tx.Exec(ctx, `
			insert into users (id, name, phone, avatar_url)
			values ($1, $2, $3, $4)
			on conflict (id) do update
			set name = excluded.name, phone = excluded.phone, avatar_url = excluded.avatar_url,
			    updated_at = now()
		`, user.id, user.name, user.phone, user.avatarURL); err != nil {
			return err
		}
	}

	entityImages, _ := json.Marshal([]string{})
	if _, err := tx.Exec(ctx, `
		insert into entities (id, name, client_type, address, location_lat, location_lng, images)
		values
			('client_1', 'Serenity Spa & Wellness', 'SPA', '12 MG Road, Bengaluru', 12.9716, 77.5946, $1::jsonb),
			('client_2', 'Pulse Fitness Studio', 'FITNESS', '22 Indiranagar, Bengaluru', 12.9784, 77.6408, $1::jsonb)
	`, string(entityImages)); err != nil {
		return err
	}

	memberStatements := []struct {
		userID, entityID string
		role             EntityRole
		joinedAt         time.Time
	}{
		{s.currentUserID, "client_1", RoleOwner, time.Date(2026, 2, 1, 10, 0, 0, 0, time.UTC)},
		{"usr_manager_1", "client_1", RoleManager, time.Date(2026, 2, 3, 10, 0, 0, 0, time.UTC)},
		{"usr_staff_1", "client_1", RoleStaff, time.Date(2026, 2, 5, 10, 0, 0, 0, time.UTC)},
		{"usr_account_manager_1", "client_1", RoleAccountManager, time.Date(2026, 2, 6, 10, 0, 0, 0, time.UTC)},
	}
	for _, member := range memberStatements {
		if _, err := tx.Exec(ctx, `
			insert into entity_members (user_id, entity_id, role, status, joined_at)
			values ($1, $2, $3, 'ACTIVE', $4)
		`, member.userID, member.entityID, member.role, member.joinedAt); err != nil {
			return err
		}
	}

	if _, err := tx.Exec(ctx, `
		insert into entity_invites (id, entity_id, phone, role, token, status, expires_at, created_at)
		values
			('inv_1', 'client_1', '9876500008', 'STAFF', 'invite_staff_pending', 'PENDING', '2026-03-07T10:00:00Z', '2026-02-28T10:00:00Z'),
			('inv_2', 'client_2', $1, 'MANAGER', 'invite_current_user_client2', 'PENDING', '2026-03-07T12:00:00Z', '2026-02-28T12:00:00Z')
	`, s.currentUserPhone); err != nil {
		return err
	}

	services := []struct {
		id, entityID, name, category string
		price, duration              int
		active                       bool
	}{
		{"svc_1", "client_1", "Men Haircut", "Hair Services > Haircuts & Styling", 30, 30, true},
		{"svc_2", "client_1", "Global color", "Hair Services > Coloring", 80, 60, true},
		{"svc_3", "client_1", "Classic Manicure", "Nail Care > Manicure", 50, 45, true},
		{"svc_4", "client_1", "Hydra Glow Facial", "Skin Services > Facials", 25, 30, true},
		{"svc_5", "client_1", "Hair Spa", "Hair Services > Treatments", 90, 60, true},
		{"svc_6", "client_1", "Luxe Pedicure", "Nail Care > Pedicure", 35, 40, true},
		{"svc_7", "client_1", "Women Haircut", "Hair Services > Haircuts & Styling", 45, 45, true},
		{"svc_8", "client_1", "Blowout - Standard", "Hair Services > Haircuts & Styling", 40, 40, true},
		{"svc_9", "client_1", "Blowout - Luxury", "Hair Services > Haircuts & Styling", 60, 60, true},
		{"svc_10", "client_1", "Root touch-up", "Hair Services > Coloring", 50, 50, true},
		{"svc_11", "client_1", "Keratin", "Hair Services > Treatments", 120, 120, true},
	}
	for _, service := range services {
		if _, err := tx.Exec(ctx, `
			insert into services (id, entity_id, name, category_path, price, duration_minutes, active)
			values ($1, $2, $3, $4, $5, $6, $7)
		`, service.id, service.entityID, service.name, service.category, service.price, service.duration, service.active); err != nil {
			return err
		}
	}

	if _, err := tx.Exec(ctx, `
		insert into staff_service_capabilities (entity_id, user_id, service_id, is_enabled)
		values
			('client_1', 'usr_staff_1', 'svc_1', true),
			('client_1', 'usr_staff_1', 'svc_2', true),
			('client_1', 'usr_staff_1', 'svc_4', true)
	`); err != nil {
		return err
	}

	emptyJSON, _ := json.Marshal([]string{"usr_staff_1"})
	if _, err := tx.Exec(ctx, `
		insert into day_entries (
			id, visit_id, entity_id, date, start_time, service_id, staff_id, staff_ids,
			price_override, customer_name, customer_phone, note, status, payment_status, paid_amount
		) values
			('de_1', 'visit_1', 'client_1', '2026-02-28', '10:00', 'svc_5', 'usr_staff_1', $1::jsonb, null, 'Suresh Iyer', '9898989890', 'Shoulder focus', 'in_progress', 'partial', 40),
			('de_1b', 'visit_1', 'client_1', '2026-02-28', '10:00', 'svc_3', 'usr_staff_1', $1::jsonb, null, 'Suresh Iyer', '9898989890', 'Add-on cleanup', 'planned', 'unpaid', 0),
			('de_2', 'visit_2', 'client_1', '2026-02-28', '11:00', 'svc_4', 'usr_staff_1', $1::jsonb, null, 'Anita Desai', '9787878787', 'Walk-in', 'planned', 'unpaid', 0),
			('de_3', 'visit_3', 'client_1', '2026-02-28', '12:30', 'svc_1', 'usr_staff_1', $1::jsonb, null, 'Neha Gupta', '9676767676', 'Regular customer', 'done', 'paid', 30),
			('de_4', 'visit_4', 'client_1', '2026-02-28', '14:00', 'svc_3', 'usr_staff_1', $1::jsonb, null, 'Lakshmi Rao', '9565656565', 'Remaining balance', 'done', 'partial', 20)
	`, string(emptyJSON)); err != nil {
		return err
	}

	return tx.Commit(ctx)
}

type sharedPartnerBrand struct {
	BrandID string
	Name    string
	FirmIDs []string
}

type partnerBrandItemClone struct {
	ID                 string
	Name               string
	Description        string
	HSNCode            string
	SKU                string
	Unit               string
	MRP                float64
	DiscountPercentage float64
	Status             string
	CreatedAt          time.Time
	UpdatedAt          time.Time
}

func (s *Store) ensurePartnerBrandIsolation(ctx context.Context) error {
	return nil
}

func (s *Store) ensurePartnerOutletContacts(ctx context.Context) error {
	return nil
}

func (s *Store) ensurePartnerDemoData(ctx context.Context) error {
	return nil
}

func (s *Store) currentUser(ctx context.Context) (User, error) {
	var user User
	err := s.pool.QueryRow(ctx, `
		select id, name, phone, coalesce(to_char(birth_date, 'YYYY-MM-DD'), '')
		from users
		where id = $1
	`, s.currentUserID).Scan(&user.ID, &user.Name, &user.Phone, &user.BirthDate)
	return user, err
}

func (s *Store) currentUserTx(ctx context.Context, tx pgx.Tx) (User, error) {
	var user User
	err := tx.QueryRow(ctx, `select id, name, phone, coalesce(to_char(birth_date, 'YYYY-MM-DD'), '') from users where id = $1`, s.currentUserID).Scan(&user.ID, &user.Name, &user.Phone, &user.BirthDate)
	return user, err
}

func (s *Store) getServiceCategory(ctx context.Context, id string) (ServiceCategory, error) {
	var item ServiceCategory
	err := s.pool.QueryRow(ctx, `
		select id, entity_id, name, coalesce(parent_id, ''), coalesce(sort_order, 999)
		from service_categories
		where id = $1
	`, id).Scan(&item.ID, &item.ClientID, &item.Name, &item.ParentID, &item.SortOrder)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ServiceCategory{}, fmt.Errorf("category not found")
		}
		return ServiceCategory{}, err
	}
	return item, nil
}

func (s *Store) getService(ctx context.Context, id string) (Service, error) {
	var item Service
	err := s.pool.QueryRow(ctx, `
		select id, entity_id, coalesce(category_id, ''), name, coalesce(category_path, ''), coalesce(description, ''),
		       coalesce(price, 0), coalesce(duration_minutes, 0), to_char(updated_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), active
		from services
		where id = $1
	`, id).Scan(&item.ID, &item.ClientID, &item.CategoryID, &item.Name, &item.CategoryPath, &item.Description, &item.Price, &item.DurationMinutes, &item.UpdatedAt, &item.Active)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Service{}, fmt.Errorf("service not found")
		}
		return Service{}, err
	}
	return item, nil
}

func (s *Store) buildCategoryPath(ctx context.Context, categoryID string) (string, error) {
	if categoryID == "" {
		return "", nil
	}

	path := []string{}
	seen := map[string]bool{}
	currentID := categoryID
	for currentID != "" {
		if seen[currentID] {
			return "", fmt.Errorf("cyclic category tree")
		}
		seen[currentID] = true
		category, err := s.getServiceCategory(ctx, currentID)
		if err != nil {
			return "", err
		}
		path = append([]string{category.Name}, path...)
		currentID = category.ParentID
	}
	return strings.Join(path, " > "), nil
}

func (s *Store) resolveCategoryIDByPath(ctx context.Context, clientID, path string) (string, error) {
	parts := strings.Split(path, ">")
	parentID := ""
	for _, part := range parts {
		name := strings.TrimSpace(part)
		if name == "" {
			continue
		}
		var categoryID string
		err := s.pool.QueryRow(ctx, `
			select id
			from service_categories
			where entity_id = $1 and lower(name) = lower($2) and coalesce(parent_id, '') = $3
			limit 1
		`, clientID, name, parentID).Scan(&categoryID)
		if err != nil {
			if !errors.Is(err, pgx.ErrNoRows) {
				return "", err
			}
			input := CreateServiceCategoryInput{
				ClientID: clientID,
				Name:     name,
				ParentID: parentID,
			}
			category, createErr := s.CreateServiceCategory(input)
			if createErr != nil {
				return "", createErr
			}
			categoryID = category.ID
		}
		parentID = categoryID
	}
	return parentID, nil
}

func (s *Store) resolveServiceCategory(ctx context.Context, clientID, categoryID, categoryPath string) (string, string, error) {
	if categoryID != "" {
		category, err := s.getServiceCategory(ctx, categoryID)
		if err != nil {
			return "", "", err
		}
		if category.ClientID != clientID {
			return "", "", fmt.Errorf("category does not belong to client")
		}
		path, err := s.buildCategoryPath(ctx, categoryID)
		if err != nil {
			return "", "", err
		}
		return categoryID, path, nil
	}
	if categoryPath != "" {
		resolvedID, err := s.resolveCategoryIDByPath(ctx, clientID, categoryPath)
		if err != nil {
			return "", "", err
		}
		path, err := s.buildCategoryPath(ctx, resolvedID)
		if err != nil {
			return "", "", err
		}
		return resolvedID, path, nil
	}
	return "", "", nil
}

func (s *Store) getServiceCategoryDescendantIDs(ctx context.Context, categoryID string) ([]string, error) {
	rows, err := s.pool.Query(ctx, `
		with recursive descendants as (
			select id
			from service_categories
			where id = $1
			union all
			select child.id
			from service_categories child
			join descendants d on child.parent_id = d.id
		)
		select id from descendants
	`, categoryID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var ids []string
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}
	return ids, rows.Err()
}

func (s *Store) syncServiceCategoryPaths(ctx context.Context, categoryID string) error {
	descendants, err := s.getServiceCategoryDescendantIDs(ctx, categoryID)
	if err != nil {
		return err
	}
	for _, descendantID := range descendants {
		path, err := s.buildCategoryPath(ctx, descendantID)
		if err != nil {
			return err
		}
		if _, err := s.pool.Exec(ctx, `
			update services
			set category_path = nullif($2, ''), updated_at = now()
			where category_id = $1
		`, descendantID, path); err != nil {
			return err
		}
	}
	return nil
}

func (s *Store) ensureServiceCatalogBackfill(ctx context.Context) error {
	rows, err := s.pool.Query(ctx, `
		select id, entity_id, coalesce(category_path, '')
		from services
		where coalesce(category_path, '') <> '' and category_id is null
	`)
	if err != nil {
		return err
	}
	defer rows.Close()

	type serviceCategorySeed struct {
		serviceID string
		clientID  string
		path      string
	}
	var pending []serviceCategorySeed
	for rows.Next() {
		var item serviceCategorySeed
		if err := rows.Scan(&item.serviceID, &item.clientID, &item.path); err != nil {
			return err
		}
		pending = append(pending, item)
	}
	if err := rows.Err(); err != nil {
		return err
	}

	for _, item := range pending {
		categoryID, path, err := s.resolveServiceCategory(ctx, item.clientID, "", item.path)
		if err != nil {
			return err
		}
		if _, err := s.pool.Exec(ctx, `
			update services
			set category_id = $2, category_path = nullif($3, '')
			where id = $1
		`, item.serviceID, categoryID, path); err != nil {
			return err
		}
	}
	return nil
}

func (s *Store) getDayEntry(ctx context.Context, id string) (DayEntry, error) {
	row := s.pool.QueryRow(ctx, `
		select id, coalesce(visit_id, ''), entity_id, date::text, coalesce(start_time, ''), service_id, staff_id::text, staff_ids,
		       price_override, coalesce(customer_name, ''), coalesce(customer_phone, ''), coalesce(note, ''), status, payment_status, paid_amount
		from day_entries
		where id = $1
	`, id)
	return scanDayEntryRow(row)
}

func (s *Store) getDayEntryTx(ctx context.Context, tx pgx.Tx, id string) (DayEntry, error) {
	row := tx.QueryRow(ctx, `
		select id, coalesce(visit_id, ''), entity_id, date::text, coalesce(start_time, ''), service_id, staff_id::text, staff_ids,
		       price_override, coalesce(customer_name, ''), coalesce(customer_phone, ''), coalesce(note, ''), status, payment_status, paid_amount
		from day_entries
		where id = $1
		for update
	`, id)
	return scanDayEntryRow(row)
}

func (s *Store) resolveEntryAmount(ctx context.Context, serviceID string, priceOverride *int) (int, error) {
	if priceOverride != nil {
		return *priceOverride, nil
	}
	var price int
	err := s.pool.QueryRow(ctx, `select coalesce(price, 0) from services where id = $1`, serviceID).Scan(&price)
	return price, err
}

func (s *Store) resolveEntryAmountTx(ctx context.Context, tx pgx.Tx, serviceID string, priceOverride *int) (int, error) {
	if priceOverride != nil {
		return *priceOverride, nil
	}
	var price int
	err := tx.QueryRow(ctx, `select coalesce(price, 0) from services where id = $1`, serviceID).Scan(&price)
	return price, err
}

func (s *Store) getPartnerStockRowTx(ctx context.Context, tx pgx.Tx, firmID, itemID string) (PartnerStockRow, error) {
	var item PartnerStockRow
	err := tx.QueryRow(ctx, `
		select i.item_id, i.catalog_item_id, c.name, c.sku, b.id, b.name, c.sku,
		       i.mrp::float8, i.discount_percentage::float8, i.quantity,
		       to_char(i.updated_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
		from partner_firm_inventory_items i
		join partner_product_catalog c on c.id = i.catalog_item_id
		join partner_brands b on b.id = c.brand_id
		join partner_firm_brands fb on fb.brand_id = c.brand_id and fb.firm_id = i.firm_id
		where i.firm_id = $1::bigint and i.item_id = $2
	`, firmID, itemID).Scan(
		&item.ItemID,
		&item.CatalogItemID,
		&item.ItemName,
		&item.ItemCode,
		&item.BrandID,
		&item.BrandName,
		&item.SKU,
		&item.MRP,
		&item.DiscountPercentage,
		&item.CurrentStockQty,
		&item.LastUpdated,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return PartnerStockRow{}, fmt.Errorf("stock item not found")
		}
		return PartnerStockRow{}, err
	}
	return item, nil
}

func scanMember(row interface{ Scan(dest ...any) error }) (EntityMember, error) {
	var item EntityMember
	var joinedAt time.Time
	err := row.Scan(&item.UserID, &item.EntityID, &item.Name, &item.AvatarURL, &item.Phone, &item.Role, &item.Status, &joinedAt)
	if err != nil {
		return EntityMember{}, err
	}
	item.JoinedAt = joinedAt.Format(time.RFC3339)
	if item.AvatarURL == "" {
		item.AvatarURL = ""
	}
	return item, nil
}

func scanInvite(row interface{ Scan(dest ...any) error }) (Invite, error) {
	var item Invite
	var expiresAt time.Time
	var createdAt time.Time
	err := row.Scan(&item.ID, &item.EntityID, &item.Phone, &item.Role, &item.Token, &item.Status, &expiresAt, &createdAt)
	if err != nil {
		return Invite{}, err
	}
	item.ExpiresAt = expiresAt.Format(time.RFC3339)
	item.CreatedAt = createdAt.Format(time.RFC3339)
	return item, nil
}

func scanDayEntry(rows interface{ Scan(dest ...any) error }) (DayEntry, error) {
	return scanDayEntryRow(rows)
}

func scanPartnerFirm(rows interface{ Scan(dest ...any) error }, item *PartnerFirm) error {
	next, err := scanPartnerFirmRow(rows)
	if err != nil {
		return err
	}
	*item = next
	return nil
}

func scanPartnerFirmRow(row interface{ Scan(dest ...any) error }) (PartnerFirm, error) {
	var item PartnerFirm
	err := row.Scan(
		&item.ID,
		&item.Name,
		&item.TradeName,
		&item.GSTIN,
		&item.BillingAddress,
		&item.City,
		&item.OwnerName,
		&item.Phone,
		&item.Email,
		&item.Status,
		&item.CreatedAt,
		&item.UpdatedAt,
	)
	if err != nil {
		return PartnerFirm{}, err
	}
	return item, nil
}

func scanDayEntryRow(row interface{ Scan(dest ...any) error }) (DayEntry, error) {
	var item DayEntry
	var staffIDs []string
	err := row.Scan(
		&item.ID,
		&item.VisitID,
		&item.ClientID,
		&item.Date,
		&item.StartTime,
		&item.ServiceID,
		&item.StaffID,
		newJSONScanner(&staffIDs),
		&item.PriceOverride,
		&item.CustomerName,
		&item.CustomerPhone,
		&item.Note,
		&item.Status,
		&item.PaymentStatus,
		&item.PaidAmount,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return DayEntry{}, fmt.Errorf("day entry not found")
		}
		return DayEntry{}, err
	}
	item.StaffIDs = staffIDs
	return normalizeDayEntry(item), nil
}

func normalizeDayEntry(item DayEntry) DayEntry {
	if item.VisitID == "" {
		item.VisitID = ""
	}
	if item.StartTime == "" {
		item.StartTime = ""
	}
	if item.CustomerName == "" {
		item.CustomerName = ""
	}
	if item.CustomerPhone == "" {
		item.CustomerPhone = ""
	}
	if item.Note == "" {
		item.Note = ""
	}
	if item.StaffIDs == nil {
		item.StaffIDs = []string{}
	}
	return item
}

type jsonScanner[T any] struct {
	target *T
}

func newJSONScanner[T any](target *T) *jsonScanner[T] {
	return &jsonScanner[T]{target: target}
}

func (s *jsonScanner[T]) Scan(src any) error {
	if src == nil {
		var zero T
		*s.target = zero
		return nil
	}
	switch v := src.(type) {
	case []byte:
		return json.Unmarshal(v, s.target)
	case string:
		return json.Unmarshal([]byte(v), s.target)
	default:
		return fmt.Errorf("unsupported json scan type %T", src)
	}
}

func cloneIntPtr(v *int) *int {
	if v == nil {
		return nil
	}
	out := *v
	return &out
}

func ensureClients(items []Client) []Client {
	if items == nil {
		return []Client{}
	}
	return items
}

func ensureMembers(items []EntityMember) []EntityMember {
	if items == nil {
		return []EntityMember{}
	}
	return items
}

func ensureInvites(items []Invite) []Invite {
	if items == nil {
		return []Invite{}
	}
	return items
}

func ensureServices(items []Service) []Service {
	if items == nil {
		return []Service{}
	}
	return items
}

func ensureServiceCategories(items []ServiceCategory) []ServiceCategory {
	if items == nil {
		return []ServiceCategory{}
	}
	return items
}

func ensureStaffCapabilities(items []StaffServiceCapability) []StaffServiceCapability {
	if items == nil {
		return []StaffServiceCapability{}
	}
	return items
}

func ensureDayEntries(items []DayEntry) []DayEntry {
	if items == nil {
		return []DayEntry{}
	}
	return items
}

func ensurePartnerFirms(items []PartnerFirm) []PartnerFirm {
	if items == nil {
		return []PartnerFirm{}
	}
	return items
}

func ensurePartnerFirmMemberships(items []PartnerFirmMembership) []PartnerFirmMembership {
	if items == nil {
		return []PartnerFirmMembership{}
	}
	return items
}

func ensurePartnerCatalogItems(items []PartnerCatalogItem) []PartnerCatalogItem {
	if items == nil {
		return []PartnerCatalogItem{}
	}
	return items
}

func ensurePartnerInventoryItems(items []PartnerInventoryItem) []PartnerInventoryItem {
	if items == nil {
		return []PartnerInventoryItem{}
	}
	return items
}

func ensurePartnerFirmInvites(items []PartnerFirmInvite) []PartnerFirmInvite {
	if items == nil {
		return []PartnerFirmInvite{}
	}
	return items
}

func ensurePartnerBrands(items []PartnerBrand) []PartnerBrand {
	if items == nil {
		return []PartnerBrand{}
	}
	return items
}

func ensurePartnerItems(items []PartnerItem) []PartnerItem {
	if items == nil {
		return []PartnerItem{}
	}
	return items
}

func ensurePartnerClients(items []PartnerClient) []PartnerClient {
	if items == nil {
		return []PartnerClient{}
	}
	return items
}

func ensurePartnerStockRows(items []PartnerStockRow) []PartnerStockRow {
	if items == nil {
		return []PartnerStockRow{}
	}
	return items
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return strings.TrimSpace(value)
		}
	}
	return ""
}

func allocatedShare(part, total, lineAmount float64) float64 {
	if total <= 0 || lineAmount <= 0 || part <= 0 {
		return 0
	}
	value := (part / total) * lineAmount
	if value < 0 {
		return 0
	}
	return value
}

type partnerItemMeta struct {
	BrandID   string
	BrandName string
}

func (s *Store) getPartnerItemMeta(firmID string) (map[string]partnerItemMeta, error) {
	ctx := context.Background()
	rows, err := s.pool.Query(ctx, `
		select i.item_id, b.id, b.name
		from partner_firm_inventory_items i
		join partner_product_catalog c on c.id = i.catalog_item_id
		join partner_brands b on b.id = c.brand_id
		join partner_firm_brands fb on fb.brand_id = c.brand_id and fb.firm_id = i.firm_id
		where i.firm_id = $1::bigint
	`, firmID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := map[string]partnerItemMeta{}
	for rows.Next() {
		var itemID string
		var meta partnerItemMeta
		if err := rows.Scan(&itemID, &meta.BrandID, &meta.BrandName); err != nil {
			return nil, err
		}
		items[itemID] = meta
	}
	return items, rows.Err()
}

func (s *Store) insertPartnerAuditLog(firmID, entityType, entityID, action string, beforeState, afterState any) error {
	ctx := context.Background()
	_, err := s.pool.Exec(ctx, `
		insert into partner_audit_logs (
			id, firm_id, user_id, entity_type, entity_id, action, reference_label, before_state, after_state
		) values ($1, $2, $3, $4, $5, $6, nullif($7, ''), $8::jsonb, $9::jsonb)
	`,
		nextID("paudit"),
		firmID,
		s.currentUserID,
		entityType,
		entityID,
		action,
		buildPartnerAuditReferenceLabel(entityType, action, afterState),
		marshalAuditState(beforeState),
		marshalAuditState(afterState),
	)
	return err
}

func (s *Store) insertPartnerAuditLogTx(ctx context.Context, tx pgx.Tx, firmID, entityType, entityID, action string, beforeState, afterState any) error {
	_, err := tx.Exec(ctx, `
		insert into partner_audit_logs (
			id, firm_id, user_id, entity_type, entity_id, action, reference_label, before_state, after_state
		) values ($1, $2, $3, $4, $5, $6, nullif($7, ''), $8::jsonb, $9::jsonb)
	`,
		nextID("paudit"),
		firmID,
		s.currentUserID,
		entityType,
		entityID,
		action,
		buildPartnerAuditReferenceLabel(entityType, action, afterState),
		marshalAuditState(beforeState),
		marshalAuditState(afterState),
	)
	return err
}

func marshalAuditState(value any) string {
	if value == nil {
		return "{}"
	}
	blob, err := json.Marshal(value)
	if err != nil || len(blob) == 0 {
		return "{}"
	}
	return string(blob)
}

func buildPartnerAuditReferenceLabel(entityType, action string, state any) string {
	values, ok := state.(map[string]any)
	if !ok {
		return firstNonEmpty(entityType, action)
	}
	switch entityType {
	case "INVOICE":
		return firstNonEmpty(stringValue(values["invoiceNumber"]), "Invoice "+action)
	case "PURCHASE":
		return firstNonEmpty(stringValue(values["purchaseNumber"]), "Purchase "+action)
	case "CREDIT_NOTE":
		return firstNonEmpty(stringValue(values["creditNoteNumber"]), "Credit note "+action)
	case "DEBIT_NOTE":
		return firstNonEmpty(stringValue(values["debitNoteNumber"]), "Debit note "+action)
	default:
		return firstNonEmpty(stringValue(values["referenceId"]), entityType+" "+action)
	}
}

func stringValue(value any) string {
	switch typed := value.(type) {
	case string:
		return strings.TrimSpace(typed)
	default:
		return ""
	}
}

func matchesDateRange(value, fromDate, toDate string) bool {
	if strings.TrimSpace(value) == "" {
		return false
	}
	if fromDate != "" && value < fromDate {
		return false
	}
	if toDate != "" && value > toDate {
		return false
	}
	return true
}

func partnerAgeDays(dueDate string, now time.Time) int {
	parsed, err := time.Parse("2006-01-02", strings.TrimSpace(dueDate))
	if err != nil {
		return 0
	}
	start := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	target := time.Date(parsed.Year(), parsed.Month(), parsed.Day(), 0, 0, 0, 0, start.Location())
	return int(start.Sub(target).Hours() / 24)
}

func partnerActionTimestamp(actionDate string) string {
	if _, err := time.Parse("2006-01-02", strings.TrimSpace(actionDate)); err == nil {
		return strings.TrimSpace(actionDate) + "T12:00:00Z"
	}
	return time.Now().UTC().Format(time.RFC3339)
}

func computePaymentStatus(paidAmount, total int) PaymentStatus {
	if paidAmount <= 0 || total <= 0 {
		return PaymentStatusUnpaid
	}
	if paidAmount >= total {
		return PaymentStatusPaid
	}
	return PaymentStatusPartial
}

func normalizePhone(value string) (string, error) {
	return backendphone.NormalizeE164(value)
}

func generateOTPCode(length int) (string, error) {
	if length <= 0 {
		return "", fmt.Errorf("otp length must be positive")
	}
	var builder strings.Builder
	for range length {
		n, err := rand.Int(rand.Reader, big.NewInt(10))
		if err != nil {
			return "", err
		}
		builder.WriteByte(byte('0' + n.Int64()))
	}
	return builder.String(), nil
}

func generateSessionToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

func hashToken(token string) string {
	sum := sha256.Sum256([]byte(strings.TrimSpace(token)))
	return hex.EncodeToString(sum[:])
}

func buildPartnerSKU(name string) string {
	base := strings.ToUpper(strings.Join(strings.Fields(strings.TrimSpace(name)), "-"))
	if base == "" {
		base = "ITEM"
	}
	id := nextID("sku")
	if len(id) > 6 {
		id = id[len(id)-6:]
	}
	return base + "-" + strings.ToUpper(id)
}

func buildPartnerConfigSKU(baseSKU, name string, mrp, discount float64) string {
	base := strings.ToUpper(strings.TrimSpace(baseSKU))
	if base == "" {
		base = strings.ToUpper(strings.Join(strings.Fields(strings.TrimSpace(name)), "-"))
	}
	base = regexp.MustCompile(`[^A-Z0-9]+`).ReplaceAllString(base, "-")
	base = strings.Trim(base, "-")
	if base == "" {
		base = "ITEM"
	}
	return fmt.Sprintf("%s-M%d-D%d", base, int(mrp+0.5), int(discount+0.5))
}

func nextID(prefix string) string {
	buf := make([]byte, 12)
	if _, err := rand.Read(buf); err != nil {
		return fmt.Sprintf("%s_%d", prefix, time.Now().UnixNano())
	}
	return prefix + "_" + hex.EncodeToString(buf)
}
