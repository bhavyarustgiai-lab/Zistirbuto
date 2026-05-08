export type ClientType = "SALON" | "SPA" | "FITNESS";

export type Client = {
  id: string;
  name: string;
  clientType: ClientType;
};

export type EntityRole = "OWNER" | "MANAGER" | "STAFF" | "ACCOUNT_MANAGER";
export type EntityMemberStatus = "ACTIVE" | "INVITED";
export type InviteStatus = "PENDING" | "ACCEPTED" | "EXPIRED";

export type EntityMember = {
  userId: number;
  entityId: string;
  name: string;
  avatarUrl?: string;
  phone: string;
  role: EntityRole;
  status: EntityMemberStatus;
  joinedAt: string;
};

export type Invite = {
  id: string;
  entityId: string;
  phone: string;
  role: EntityRole;
  token: string;
  status: InviteStatus;
  expiresAt: string;
  createdAt: string;
};

export type Service = {
  id: string;
  clientId: string;
  categoryId?: string;
  name: string;
  categoryPath?: string;
  description?: string;
  price?: number;
  durationMinutes?: number;
  updatedAt?: string;
  active: boolean;
};

export type ServiceCategory = {
  id: string;
  clientId: string;
  name: string;
  parentId?: string | null;
  sortOrder?: number;
};

export type StaffServiceCapability = {
  entityId: string;
  userId: number;
  serviceId: string;
  isEnabled: boolean;
};

export type DayEntryStatus =
  | "planned"
  | "in_progress"
  | "done"
  | "billed"
  | "cancelled";
export type PaymentStatus = "paid" | "unpaid" | "partial";
export type PaymentMode = "cash" | "upi" | "card" | "mixed";

export type DayEntry = {
  id: string;
  visitId?: string;
  clientId: string;
  date: string;
  startTime?: string;
  serviceId: string;
  staffId: string;
  staffIds?: string[];
  priceOverride?: number;
  customerName?: string;
  customerPhone?: string;
  note?: string;
  status: DayEntryStatus;
  paymentStatus: PaymentStatus;
  paidAmount?: number;
};

export type PaymentRecord = {
  id: string;
  dayEntryId: string;
  clientId: string;
  amount: number;
  mode: PaymentMode;
  note?: string;
  createdAt: string;
};

export type PartnerFirm = {
  id: number;
  name: string;
  tradeName?: string;
  gstin?: string;
  billingAddress?: string;
  city?: string;
  ownerName?: string;
  phone?: string;
  email?: string;
  status?: "ACTIVE" | "INACTIVE";
  createdAt?: string;
  updatedAt?: string;
};

export type PartnerFirmRole =
  | "OWNER"
  | "STAFF"
  | "ACCOUNTANT"
  | "DELIVERY_PARTNER";

export type PartnerFirmMembershipStatus = "ACTIVE" | "SUSPENDED";
export type PartnerFirmInviteStatus = "PENDING" | "ACCEPTED" | "EXPIRED";

export type PartnerFirmMembership = {
  userId: number;
  firmId: number;
  name: string;
  phone: string;
  role: PartnerFirmRole;
  status: PartnerFirmMembershipStatus;
  joinedAt: string;
};

export type PartnerFirmInvite = {
  id: string;
  firmId: number;
  phone: string;
  role: PartnerFirmRole;
  status: PartnerFirmInviteStatus;
  invitedBy: number;
  expiresAt: string;
  acceptedAt?: string;
  createdAt: string;
};

export type PartnerBrand = {
  id: number;
  name: string;
  itemCount: number;
};

export type PartnerCatalogItem = {
  id: string;
  brandId: number;
  name: string;
  description?: string;
  hsnCode?: string;
  sku: string;
  defaultMrp: number;
  defaultDiscountPercentage: number;
  status: "ACTIVE" | "INACTIVE";
  updatedAt: string;
};

export type PartnerItem = {
  id: string;
  brandId: number;
  itemCode: string;
  name: string;
  description?: string;
  hsnCode?: string;
  sku: string;
  mrp: number;
  discountPercentage: number;
  currentStockQty: number;
  status: "ACTIVE" | "INACTIVE";
  updatedAt: string;
};

export type PartnerClientStatus = "ACTIVE" | "INACTIVE";
export type PartnerOrderStatus =
  | "DRAFT"
  | "PLACED"
  | "CONFIRMED"
  | "PACKED"
  | "DISPATCHED"
  | "DELIVERED"
  | "PARTIALLY_DELIVERED"
  | "CANCELLED"
  | "RETURNED"
  | "PARTIALLY_RETURNED";
export type PartnerOrderSource = "MANUAL" | "WHATSAPP" | "PHONE" | "EMAIL" | "SALES_REP" | "OTHER";
export type PartnerInvoiceStatus =
  | "DRAFT"
  | "FINALIZED"
  | "CANCELLED";
export type PartnerInvoicePaymentStatus = "UNPAID" | "PARTIALLY_PAID" | "PAID" | "OVERDUE";
export type PartnerPaymentMode = "CASH" | "UPI" | "BANK_TRANSFER" | "CHEQUE" | "OTHER";
export type PartnerSupplierInvoiceStatus = "DRAFT" | "FINALIZED" | "CANCELLED";
export type PartnerPayableStatus = "UNPAID" | "PARTIALLY_PAID" | "PAID" | "OVERDUE";
export type PartnerSupplierStatus = "ACTIVE" | "INACTIVE";
export type PartnerPurchaseStatus = "DRAFT" | "ORDERED" | "PARTIALLY_RECEIVED" | "RECEIVED" | "CANCELLED";
export type PartnerStockReasonType =
  | "OPENING_STOCK"
  | "PURCHASE"
  | "SALE"
  | "RETURN_IN"
  | "RETURN_OUT"
  | "DAMAGE"
  | "ADJUSTMENT";
export type PartnerStockReferenceType =
  | "PURCHASE"
  | "INVOICE"
  | "ORDER"
  | "MANUAL"
  | "RETURN"
  | "DAMAGE";
export type PartnerReceivableStatus = "CURRENT" | "OVERDUE";
export type PartnerReceivablesFilterStatus = "ALL" | "OUTSTANDING" | "OVERDUE";
export type PartnerStockActionType =
  | "PURCHASE_INWARD"
  | "RETURN_IN"
  | "RETURN_OUT"
  | "DAMAGE"
  | "ADJUSTMENT";
export type PartnerDamageCategory =
  | "DAMAGED"
  | "EXPIRED"
  | "LEAKAGE"
  | "BREAKAGE"
  | "MISSING"
  | "OTHER";
export type PartnerCreditNoteStatus = "DRAFT" | "ISSUED" | "CANCELLED";
export type PartnerDebitNoteStatus = "DRAFT" | "ISSUED" | "CANCELLED";
export type PartnerAuditEntityType =
  | "ORDER"
  | "INVOICE"
  | "PAYMENT"
  | "SUPPLIER_INVOICE"
  | "SUPPLIER_PAYMENT"
  | "PURCHASE"
  | "STOCK"
  | "CREDIT_NOTE"
  | "DEBIT_NOTE"
  | "SALES_RETURN";

export type PartnerClient = {
  id: string;
  firmId: number;
  name: string;
  phone: string;
  gstin?: string;
  address?: string;
  status: "ACTIVE" | "INACTIVE";
};

export type PartnerClientOutlet = {
  id: string;
  firmId: number;
  clientBusinessId: string;
  outletName: string;
  address?: string;
  contacts: PartnerOutletContact[];
  isPrimary: boolean;
  status: PartnerClientStatus;
};

export type PartnerOutletContact = {
  id: string;
  firmId: number;
  outletId: string;
  name: string;
  phone: string;
  isPrimary: boolean;
  sortOrder: number;
};

export type PartnerClientContact = {
  id: string;
  firmId: number;
  clientBusinessId: string;
  name: string;
  phone: string;
  isPrimary: boolean;
  sortOrder: number;
};

export type PartnerClientBusiness = {
  id: string;
  firmId: number;
  businessName: string;
  gstin?: string;
  billingName?: string;
  billingAddress?: string;
  contacts: PartnerClientContact[];
  outletCount: number;
  outlets: PartnerClientOutlet[];
};

export type PartnerGSTINValidation = {
  exists: boolean;
  businessId?: string;
  businessName?: string;
};

export type PartnerStockRow = {
  itemId: string;
  catalogItemId?: string;
  itemName: string;
  itemCode: string;
  brandId: number;
  brandName: string;
  sku: string;
  mrp: number;
  discountPercentage: number;
  currentStockQty: number;
  lastUpdated: string;
};

export type PartnerInventoryItem = {
  firmId: number;
  itemId: string;
  catalogItemId: string;
  brandId: number;
  itemName: string;
  sku: string;
  mrp: number;
  discountPercentage: number;
  status: "ACTIVE" | "INACTIVE";
  quantity: number;
  updatedAt: string;
  lastSupplierId?: string;
  lastSupplierName?: string;
  lastReceivedAt?: string;
};

export type PartnerInventoryReceipt = {
  id: string;
  firmId: number;
  supplyInwardId?: string;
  itemId: string;
  supplierId: string;
  supplierName: string;
  quantity: number;
  receivedAt: string;
  note?: string;
  status: "POSTED" | "VOIDED";
  voidedAt?: string;
  voidReason?: string;
  createdAt: string;
};

export type PartnerInventoryHistoryEntry = {
  id: string;
  firmId: number;
  brandId: number;
  itemId?: string;
  catalogItemId?: string;
  itemName?: string;
  sku?: string;
  eventType: "SUPPLY_INWARD" | "ADJUSTMENT";
  quantityDelta: number;
  quantityFrom?: number;
  quantityTo?: number;
  supplierId?: string;
  supplierName?: string;
  note?: string;
  status?: "POSTED" | "REVERTED";
  canRevert?: boolean;
  revertedAt?: string;
  revertReason?: string;
  eventAt: string;
  items?: PartnerInventoryHistoryLine[];
};

export type PartnerInventoryHistoryLine = {
  itemId: string;
  catalogItemId: string;
  itemName: string;
  sku: string;
  quantity: number;
};

export type PartnerStockLedgerEntry = {
  id: string;
  firmId: number;
  itemId: string;
  quantityDelta: number;
  reasonType: PartnerStockReasonType;
  referenceType?: PartnerStockReferenceType | string;
  referenceId?: string;
  note?: string;
  createdAt: string;
  unitCost?: number;
};

export type PartnerStockLedgerFilters = {
  reasonType?: PartnerStockReasonType | "";
  referenceType?: PartnerStockReferenceType | "";
  fromDate?: string;
  toDate?: string;
  query?: string;
};

export type PartnerOrderItem = {
  id: string;
  orderId: string;
  billableLineId?: string;
  itemId: string;
  brandId?: number;
  catalogItemId?: string;
  itemCode: string;
  itemName: string;
  unit: string;
  quantity: number;
  packedQuantity?: number;
  dispatchedQuantity?: number;
  deliveredQuantity?: number;
  returnedQuantity?: number;
  cancelledQuantity?: number;
  shortReason?: string;
  mrp: number;
  discountPercentage: number;
};

export type PartnerOrderBillableLine = {
  id: string;
  orderId: string;
  catalogItemId: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  mrp: number;
  sellerMarginPercentage: number;
  rate: number;
  lineTotal: number;
};

export type PartnerUnfulfilledOrderItem = {
  id: string;
  firmId: number;
  clientBusinessId: string;
  clientOutletId: string;
  sourceOrderId: string;
  sourceOrderLineId: string;
  brandId: number;
  catalogItemId: string;
  itemCode: string;
  itemName: string;
  requestedQuantity: number;
  fulfilledQuantity: number;
  openQuantity: number;
  status: "OPEN" | "PARTIALLY_CLEARED" | "CLEARED" | "CANCELLED";
  reason: string;
  createdAt: string;
  updatedAt: string;
  clearedAt?: string;
};

export type PartnerOrder = {
  id: string;
  firmId: number;
  orderNumber: string;
  clientBusinessId: string;
  clientBusinessName: string;
  clientOutletId: string;
  clientOutletName: string;
  orderDate: string;
  source?: PartnerOrderSource;
  status: PartnerOrderStatus;
  createdAt?: string;
  createdByName?: string;
  confirmedAt?: string;
  dispatchDate?: string;
  transportName?: string;
  vehicleNumber?: string;
  driverPhone?: string;
  dispatchNotes?: string;
  dispatchedAt?: string;
  deliveredDate?: string;
  deliveryRecipientName?: string;
  deliveryProofReference?: string;
  deliveryNotes?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  linkedInvoiceId?: string;
  linkedInvoiceNumber?: string;
  itemCount: number;
  totalQuantity: number;
  notes?: string;
  items: PartnerOrderItem[];
  requestedItems?: PartnerOrderItem[];
  billableLines?: PartnerOrderBillableLine[];
  unfulfilledItems?: PartnerUnfulfilledOrderItem[];
};

export type PartnerInvoiceItem = {
  id: string;
  invoiceId: string;
  billableLineId?: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  sku?: string;
  hsnSac?: string;
  quantity: number;
  unit?: string;
  mrp: number;
  discountPercentage: number;
  sellMarginPercentage?: number;
  rate: number;
  discountAmount?: number;
  taxableValue?: number;
  gstPercentage?: number;
  cgstPercentage?: number;
  sgstPercentage?: number;
  igstPercentage?: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  totalTaxAmount?: number;
  lineTotal: number;
};

export type PartnerInvoice = {
  id: string;
  firmId: number;
  orderId?: string;
  invoiceNumber: string;
  clientBusinessId: string;
  clientBusinessName: string;
  clientOutletId: string;
  clientOutletName: string;
  invoiceDate: string;
  dueDate?: string;
  status: PartnerInvoiceStatus;
  paymentStatus?: PartnerInvoicePaymentStatus;
  createdAt?: string;
  createdByName?: string;
  notes?: string;
  amount: number;
  paidAmount: number;
  dueAmount: number;
  dispatchReference?: string;
  firmName?: string;
  firmGstin?: string;
  firmBillingAddress?: string;
  firmState?: string;
  billToName: string;
  billToGstin?: string;
  billToAddress?: string;
  clientGstin?: string;
  clientBillingAddress?: string;
  clientState?: string;
  deliverToName: string;
  deliverToLocality?: string;
  deliverToAddress?: string;
  deliverToManagerName?: string;
  deliverToManagerPhone?: string;
  outletShippingAddress?: string;
  outletContactName?: string;
  outletContactPhone?: string;
  placeOfSupply?: string;
  paymentTerms?: string;
  subtotalAmount?: number;
  discountAmount?: number;
  taxableAmount?: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  roundOffAmount?: number;
  additionalChargesAmount?: number;
  finalTotalAmount?: number;
  items: PartnerInvoiceItem[];
};

export type PartnerPaymentAllocation = {
  id: string;
  paymentId: string;
  invoiceId: string;
  invoiceNumber: string;
  invoiceDate?: string;
  invoiceAmount?: number;
  invoiceDueAmount?: number;
  amount: number;
};

export type PartnerPayment = {
  id: string;
  firmId: number;
  paymentReference: string;
  clientBusinessId: string;
  clientBusinessName: string;
  clientOutletId?: string;
  clientOutletName?: string;
  paymentDate: string;
  mode: PartnerPaymentMode;
  referenceNumber?: string;
  status?: "ACTIVE" | "REVERSED";
  createdAt?: string;
  recordedByName?: string;
  collectedByUserId?: number;
  collectedByName?: string;
  amount: number;
  allocatedAmount: number;
  unallocatedAmount: number;
  notes?: string;
  allocations: PartnerPaymentAllocation[];
};

export type PartnerClientLedgerEntry = {
  id: string;
  firmId: number;
  clientBusinessId: string;
  clientBusinessName?: string;
  entryDate: string;
  type: "INVOICE" | "PAYMENT" | "CREDIT_NOTE" | "CREDIT_NOTE_VOID" | "DEBIT_NOTE";
  referenceType: string;
  referenceId: string;
  referenceNumber: string;
  description: string;
  debitAmount: number;
  creditAmount: number;
  runningBalance: number;
  createdAt?: string;
};

export type PartnerDashboardStats = {
  mappedBrandsCount: number;
  itemCount: number;
  clientBusinessCount: number;
  outletCount: number;
  supplierCount: number;
  openOrdersCount: number;
  unpaidInvoicesCount: number;
  currentStockQtyTotal: number;
  recentActivity: Array<{
    id: string;
    title: string;
    subtitle: string;
    createdAt: string;
    type?: string;
    action?: string;
    reference?: string;
    subject?: string;
    party?: string;
    location?: string;
    status?: string;
    quantityDelta?: number;
    impactText?: string;
    href?: string;
  }>;
};

export type PartnerSupplier = {
  id: string;
  firmId: number;
  supplierName: string;
  gstin?: string;
  phone?: string;
  address?: string;
  status: PartnerSupplierStatus;
  createdAt?: string;
  updatedAt?: string;
};

export type PartnerSupplierGSTINValidation = {
  exists: boolean;
  supplierId?: string;
  supplierName?: string;
};

export type PartnerSupplierInvoice = {
  id: string;
  firmId: number;
  supplierId: string;
  supplierName: string;
  purchaseId?: string;
  purchaseNumber?: string;
  grnId?: string;
  grnNumber?: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  taxableAmount: number;
  gstAmount: number;
  finalTotalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  status: PartnerSupplierInvoiceStatus;
  payableStatus: PartnerPayableStatus;
  createdAt?: string;
  createdByName?: string;
  finalizedAt?: string;
  finalizedByName?: string;
  cancelledAt?: string;
  cancelledByName?: string;
};

export type PartnerSupplierPaymentAllocation = {
  id: string;
  paymentId: string;
  supplierInvoiceId: string;
  invoiceNumber: string;
  invoiceDate?: string;
  invoiceAmount?: number;
  invoiceOutstanding?: number;
  amount: number;
};

export type PartnerSupplierPayment = {
  id: string;
  firmId: number;
  supplierId: string;
  supplierName: string;
  paymentDate: string;
  mode: PartnerPaymentMode;
  referenceNumber?: string;
  createdAt?: string;
  recordedByName?: string;
  amount: number;
  allocatedAmount: number;
  unallocatedAmount: number;
  notes?: string;
  allocations: PartnerSupplierPaymentAllocation[];
};

export type PartnerSupplierLedgerEntry = {
  id: string;
  firmId: number;
  supplierId: string;
  supplierName?: string;
  entryDate: string;
  type: string;
  referenceType: string;
  referenceId: string;
  referenceNumber: string;
  description: string;
  debitAmount: number;
  creditAmount: number;
  runningBalance: number;
  createdAt?: string;
};

export type PartnerPayablesSummary = {
  totalPayables: number;
  overduePayables: number;
  invoicesDueToday: number;
  invoices: PartnerSupplierInvoice[];
};

export type PartnerPurchaseItem = {
  id: string;
  purchaseId: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  sku?: string;
  quantity: number;
  receivedQuantity: number;
  damagedQuantity: number;
  costPrice: number;
  discountPercentage?: number;
  taxPercentage?: number;
  lineTotal: number;
};

export type PartnerPurchase = {
  id: string;
  firmId: number;
  purchaseNumber: string;
  supplierId: string;
  supplierName: string;
  supplierInvoiceNumber?: string;
  supplierInvoiceDate?: string;
  purchaseDate: string;
  expectedInwardDate?: string;
  status: PartnerPurchaseStatus;
  createdAt?: string;
  createdByName?: string;
  orderedAt?: string;
  orderedByName?: string;
  postedAt?: string;
  postedByName?: string;
  cancelledAt?: string;
  notes?: string;
  lineCount: number;
  totalQuantity: number;
  receivedQuantity: number;
  damagedQuantity: number;
  totalAmount: number;
  stockPosted: boolean;
  items: PartnerPurchaseItem[];
};

export type PartnerGoodsReceiptItem = {
  id: string;
  grnId: string;
  purchaseItemId: string;
  itemId: string;
  itemName: string;
  sku?: string;
  orderedQuantity: number;
  receivedQuantity: number;
  damagedQuantity: number;
  notes?: string;
};

export type PartnerGoodsReceipt = {
  id: string;
  firmId: number;
  purchaseId: string;
  grnNumber: string;
  supplierId: string;
  supplierName: string;
  receivedDate: string;
  notes?: string;
  createdAt?: string;
  createdByName?: string;
  items: PartnerGoodsReceiptItem[];
};

export type PartnerCreditNoteLine = {
  id: string;
  creditNoteId: string;
  itemId?: string;
  itemName?: string;
  quantity?: number;
  amount: number;
  referenceInvoiceLineId?: string;
};

export type PartnerCreditNote = {
  id: string;
  firmId: number;
  creditNoteNumber: string;
  salesReturnId?: string;
  clientBusinessId: string;
  clientBusinessName: string;
  clientOutletId: string;
  clientOutletName: string;
  relatedInvoiceId?: string;
  relatedInvoiceNumber?: string;
  creditDate: string;
  note?: string;
  status: PartnerCreditNoteStatus;
  hasStockReturn: boolean;
  totalAmount: number;
  createdAt?: string;
  createdByName?: string;
  cancelledAt?: string;
  lines: PartnerCreditNoteLine[];
};

export type PartnerSalesReturnLine = {
  id: string;
  salesReturnId: string;
  orderItemId: string;
  invoiceLineId?: string;
  itemId: string;
  itemName: string;
  returnedQuantity: number;
  acceptedQuantity: number;
  creditAmount: number;
  reason?: string;
};

export type PartnerSalesReturn = {
  id: string;
  firmId: number;
  returnNumber: string;
  orderId: string;
  orderNumber?: string;
  invoiceId: string;
  invoiceNumber?: string;
  creditNoteId?: string;
  creditNoteNumber?: string;
  clientBusinessId: string;
  clientBusinessName: string;
  clientOutletId: string;
  clientOutletName: string;
  returnDate: string;
  status: "ISSUED" | "CANCELLED";
  notes?: string;
  totalQuantity: number;
  totalCreditAmount: number;
  createdAt?: string;
  createdByName?: string;
  cancelledAt?: string;
  lines: PartnerSalesReturnLine[];
};

export type PartnerDebitNoteLine = {
  id: string;
  debitNoteId: string;
  itemId?: string;
  itemName?: string;
  description: string;
  amount: number;
};

export type PartnerDebitNote = {
  id: string;
  firmId: number;
  debitNoteNumber: string;
  clientBusinessId: string;
  clientBusinessName: string;
  clientOutletId: string;
  clientOutletName: string;
  relatedInvoiceId?: string;
  relatedInvoiceNumber?: string;
  debitDate: string;
  note?: string;
  status: PartnerDebitNoteStatus;
  totalAmount: number;
  createdAt?: string;
  createdByName?: string;
  cancelledAt?: string;
  lines: PartnerDebitNoteLine[];
};

export type PartnerAuditLog = {
  id: string;
  firmId: number;
  userId: number;
  userName: string;
  entityType: PartnerAuditEntityType;
  entityId: string;
  action: string;
  referenceLabel?: string;
  beforeState?: string;
  afterState?: string;
  createdAt: string;
};

export type PartnerGlobalSearchResult = {
  id: string;
  type: "CLIENT" | "INVOICE" | "ITEM" | "ORDER";
  title: string;
  subtitle: string;
  href: string;
};

export type PartnerSalesReportRow = {
  invoiceId: string;
  invoiceNumber: string;
  invoiceDate: string;
  clientBusinessId: string;
  clientBusinessName: string;
  clientOutletId: string;
  clientOutletName: string;
  brandId: number;
  brandName: string;
  itemId: string;
  itemName: string;
  quantitySold: number;
  invoiceValue: number;
  paymentReceived: number;
  outstanding: number;
};

export type PartnerStockMovementReportRow = {
  itemId: string;
  itemName: string;
  brandId: number;
  brandName: string;
  openingStock: number;
  purchaseInward: number;
  returnIn: number;
  sale: number;
  returnOut: number;
  damage: number;
  adjustment: number;
  closingStock: number;
};

export type PartnerClientPurchaseHistoryRow = {
  clientBusinessId: string;
  clientBusinessName: string;
  clientOutletId: string;
  clientOutletName: string;
  invoiceId: string;
  invoiceNumber: string;
  invoiceDate: string;
  itemId: string;
  itemName: string;
  quantity: number;
  amount: number;
};

export type PartnerReceivableInvoiceSummary = {
  invoiceId: string;
  invoiceNumber: string;
  clientId?: string;
  clientName?: string;
  outletId: string;
  outletName: string;
  invoiceDate: string;
  dueDate: string;
  amount: number;
  paidAmount: number;
  outstanding: number;
  ageDays: number;
  agingBucket?: string;
  status: PartnerReceivableStatus;
  paymentStatus?: PartnerInvoicePaymentStatus;
};

export type PartnerReceivableOutletSummary = {
  outletId: string;
  outletName: string;
  totalInvoiced: number;
  totalPaid: number;
  outstanding: number;
};

export type PartnerReceivableBusinessSummary = {
  businessId: string;
  businessName: string;
  outletCount: number;
  totalInvoiced: number;
  totalPaid: number;
  outstanding: number;
  overdue0To30: number;
  overdue31To60: number;
  overdue61To90: number;
  overdue90Plus: number;
  latestActivityDate: string;
  outlets: PartnerReceivableOutletSummary[];
  invoices: PartnerReceivableInvoiceSummary[];
};

export type PartnerReceivablesSummary = {
  totalReceivables: number;
  overdueReceivables: number;
  invoicesDueToday?: number;
  clientsWithDues: number;
  businesses: PartnerReceivableBusinessSummary[];
};

export type PartnerStockActionInput = {
  actionType: PartnerStockActionType;
  itemId: string;
  quantity?: number;
  quantityDelta?: number;
  actionDate: string;
  note?: string;
  referenceId?: string;
  referenceType?: PartnerStockReferenceType;
  clientBusinessId?: string;
  clientOutletId?: string;
  supplierId?: string;
  invoiceId?: string;
  purchaseId?: string;
  damageCategory?: PartnerDamageCategory;
};

export type PartnerInventoryCreateInput = {
  supplierId: string;
  receivedAt?: string;
  catalogItemId: string;
  mrp: number;
  discountPercentage: number;
  status?: "ACTIVE" | "INACTIVE";
  quantity: number;
  note?: string;
};

export type PartnerInventoryUpdateInput = {
  status?: "ACTIVE" | "INACTIVE";
  quantity?: number;
  note?: string;
};
