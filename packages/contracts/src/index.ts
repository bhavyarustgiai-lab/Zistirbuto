import { z } from "zod";

export * from "./partners/orders";

export const IdSchema = z.string().uuid();

export const StaffSchema = z.object({
  id: IdSchema,
  salonId: IdSchema,
  name: z.string().min(1),
  phone: z.string().optional(),
  active: z.boolean(),
  createdAt: z.string().datetime()
});

export const ServiceSchema = z.object({
  id: IdSchema,
  salonId: IdSchema,
  name: z.string().min(1),
  priceCents: z.number().int().nonnegative(),
  durationMinutes: z.number().int().positive(),
  active: z.boolean(),
  createdAt: z.string().datetime()
});

export const DayEntrySchema = z.object({
  id: IdSchema,
  salonId: IdSchema,
  customerName: z.string().min(1),
  staffId: IdSchema,
  serviceId: IdSchema,
  status: z.enum(["open", "done", "cancelled"]),
  scheduledAt: z.string().datetime(),
  notes: z.string().optional(),
  createdAt: z.string().datetime()
});

export const HealthResponseSchema = z.object({
  ok: z.literal(true)
});

export const PartnerUserSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
});

export const PartnerFirmSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
});

export const PartnerBrandSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  itemCount: z.number().int().nonnegative().optional(),
});

export const PartnerCatalogItemSchema = z.object({
  id: z.string().min(1),
  brandId: z.number().int().positive(),
  name: z.string().min(1),
  description: z.string().optional().or(z.literal("")),
  hsnCode: z.string().optional().or(z.literal("")),
  sku: z.string().min(1),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  updatedAt: z.string().datetime().optional(),
});

export const PartnerItemSchema = z.object({
  id: z.string().min(1),
  brandId: z.number().int().positive(),
  itemCode: z.string().min(1),
  name: z.string().min(1),
  sku: z.string().min(1),
  unit: z.string(),
  mrp: z.number().nonnegative(),
  discountPercentage: z.number().min(0).max(100),
  currentStockQty: z.number().int(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  updatedAt: z.string().datetime().optional(),
});

export const PartnerClientSchema = z.object({
  id: z.string().min(1),
  firmId: z.number().int().positive(),
  name: z.string().min(1),
  phone: z.string().min(1),
  gstin: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]),
});

export const PartnerClientOutletSchema = z.object({
  id: z.string().min(1),
  firmId: z.number().int().positive(),
  clientBusinessId: z.string().min(1),
  outletName: z.string().min(1),
  locality: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  managerName: z.string().optional().or(z.literal("")),
  managerPhone: z.string().optional().or(z.literal("")),
  isPrimary: z.boolean(),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]),
});

export const PartnerClientBusinessSchema = z.object({
  id: z.string().min(1),
  firmId: z.number().int().positive(),
  businessName: z.string().min(1),
  gstin: z.string().optional().or(z.literal("")),
  ownerName: z.string().optional().or(z.literal("")),
  ownerPhone: z.string().optional().or(z.literal("")),
  billingName: z.string().optional().or(z.literal("")),
  billingAddress: z.string().optional().or(z.literal("")),
  outletCount: z.number().int().nonnegative(),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]),
  outlets: z.array(PartnerClientOutletSchema),
});

export const PartnerGSTINValidationSchema = z.object({
  exists: z.boolean(),
  businessId: z.string().optional().or(z.literal("")),
  businessName: z.string().optional().or(z.literal("")),
});

export const PartnerStockRowSchema = z.object({
  itemId: z.string().min(1),
  itemName: z.string().min(1),
  itemCode: z.string().min(1),
  brandId: z.number().int().positive(),
  brandName: z.string().min(1),
  sku: z.string().min(1),
  unit: z.string().min(1),
  mrp: z.number().nonnegative(),
  discountPercentage: z.number().min(0).max(100),
  currentStockQty: z.number().int(),
  lastUpdated: z.string().datetime(),
});

export const PartnerStockLedgerEntrySchema = z.object({
  id: z.string().min(1),
  firmId: z.number().int().positive(),
  itemId: z.string().min(1),
  quantityDelta: z.number().int(),
  reasonType: z.enum([
    "OPENING_STOCK",
    "PURCHASE",
    "SALE",
    "RETURN_IN",
    "RETURN_OUT",
    "DAMAGE",
    "ADJUSTMENT",
  ]),
  referenceType: z.string().optional().or(z.literal("")),
  referenceId: z.string().optional().or(z.literal("")),
  note: z.string().optional().or(z.literal("")),
  createdAt: z.string().datetime(),
  unitCost: z.number().nonnegative().optional(),
});

export const PartnerStockLedgerFiltersSchema = z.object({
  reasonType: z.enum([
    "OPENING_STOCK",
    "PURCHASE",
    "SALE",
    "RETURN_IN",
    "RETURN_OUT",
    "DAMAGE",
    "ADJUSTMENT",
  ]).optional().or(z.literal("")),
  referenceType: z.enum([
    "PURCHASE",
    "INVOICE",
    "ORDER",
    "PAYMENT",
    "MANUAL",
    "RETURN",
    "DAMAGE",
  ]).optional().or(z.literal("")),
  fromDate: z.string().optional().or(z.literal("")),
  toDate: z.string().optional().or(z.literal("")),
  query: z.string().optional().or(z.literal("")),
});

export const PartnerOrderItemSchema = z.object({
  id: z.string().min(1),
  orderId: z.string().min(1),
  itemId: z.string().min(1),
  itemCode: z.string().min(1),
  itemName: z.string().min(1),
  unit: z.string().min(1),
  quantity: z.number().int().positive(),
  packedQuantity: z.number().int().nonnegative().optional(),
  dispatchedQuantity: z.number().int().nonnegative().optional(),
  deliveredQuantity: z.number().int().nonnegative().optional(),
  returnedQuantity: z.number().int().nonnegative().optional(),
  cancelledQuantity: z.number().int().nonnegative().optional(),
  shortReason: z.string().optional().or(z.literal("")),
  mrp: z.number().nonnegative(),
  discountPercentage: z.number().min(0).max(100),
});

export const PartnerOrderSchema = z.object({
  id: z.string().min(1),
  firmId: z.number().int().positive(),
  orderNumber: z.string().min(1),
  clientBusinessId: z.string().min(1),
  clientBusinessName: z.string().min(1),
  clientOutletId: z.string().min(1),
  clientOutletName: z.string().min(1),
  orderDate: z.string().min(1),
  status: z.enum([
    "DRAFT",
    "PLACED",
    "CONFIRMED",
    "PACKED",
    "DISPATCHED",
    "DELIVERED",
    "PARTIALLY_DELIVERED",
    "CANCELLED",
    "RETURNED",
    "PARTIALLY_RETURNED",
  ]),
  createdAt: z.string().optional().or(z.literal("")),
  createdByName: z.string().optional().or(z.literal("")),
  confirmedAt: z.string().optional().or(z.literal("")),
  dispatchDate: z.string().optional().or(z.literal("")),
  transportName: z.string().optional().or(z.literal("")),
  vehicleNumber: z.string().optional().or(z.literal("")),
  driverPhone: z.string().optional().or(z.literal("")),
  dispatchNotes: z.string().optional().or(z.literal("")),
  dispatchedAt: z.string().optional().or(z.literal("")),
  deliveredDate: z.string().optional().or(z.literal("")),
  deliveryRecipientName: z.string().optional().or(z.literal("")),
  deliveryProofReference: z.string().optional().or(z.literal("")),
  deliveryNotes: z.string().optional().or(z.literal("")),
  deliveredAt: z.string().optional().or(z.literal("")),
  cancelledAt: z.string().optional().or(z.literal("")),
  linkedInvoiceId: z.string().optional().or(z.literal("")),
  linkedInvoiceNumber: z.string().optional().or(z.literal("")),
  itemCount: z.number().int().nonnegative(),
  totalQuantity: z.number().int().nonnegative(),
  notes: z.string().optional().or(z.literal("")),
  items: z.array(PartnerOrderItemSchema),
});

export const PartnerInvoiceItemSchema = z.object({
  id: z.string().min(1),
  invoiceId: z.string().min(1),
  billableLineId: z.string().optional().or(z.literal("")),
  itemId: z.string().min(1),
  itemCode: z.string().min(1),
  itemName: z.string().min(1),
  quantity: z.number().int().positive(),
  mrp: z.number().nonnegative(),
  discountPercentage: z.number().min(0).max(100),
  rate: z.number().nonnegative(),
  lineTotal: z.number().nonnegative(),
});

export const PartnerInvoiceSchema = z.object({
  id: z.string().min(1),
  firmId: z.number().int().positive(),
  orderId: z.string().optional().or(z.literal("")),
  invoiceNumber: z.string().min(1),
  clientBusinessId: z.string().min(1),
  clientBusinessName: z.string().min(1),
  clientOutletId: z.string().min(1),
  clientOutletName: z.string().min(1),
  invoiceDate: z.string().min(1),
  dueDate: z.string().optional().or(z.literal("")),
  status: z.enum(["DRAFT", "FINALIZED", "CANCELLED"]),
  paymentStatus: z.enum(["UNPAID", "PARTIALLY_PAID", "PAID", "OVERDUE"]).optional(),
  createdAt: z.string().optional().or(z.literal("")),
  createdByName: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  amount: z.number().nonnegative(),
  paidAmount: z.number().nonnegative(),
  dueAmount: z.number().nonnegative(),
  billToName: z.string().min(1),
  billToGstin: z.string().optional().or(z.literal("")),
  billToAddress: z.string().optional().or(z.literal("")),
  deliverToName: z.string().min(1),
  deliverToLocality: z.string().optional().or(z.literal("")),
  deliverToAddress: z.string().optional().or(z.literal("")),
  deliverToManagerName: z.string().optional().or(z.literal("")),
  deliverToManagerPhone: z.string().optional().or(z.literal("")),
  items: z.array(PartnerInvoiceItemSchema),
});

export const PartnerPaymentAllocationSchema = z.object({
  id: z.string().min(1),
  paymentId: z.string().min(1),
  invoiceId: z.string().min(1),
  invoiceNumber: z.string().min(1),
  invoiceDate: z.string().optional().or(z.literal("")),
  invoiceAmount: z.number().nonnegative().optional(),
  invoiceDueAmount: z.number().nonnegative().optional(),
  amount: z.number().positive(),
});

export const PartnerPaymentSchema = z.object({
  id: z.string().min(1),
  firmId: z.number().int().positive(),
  paymentReference: z.string().min(1),
  clientBusinessId: z.string().min(1),
  clientBusinessName: z.string().min(1),
  clientOutletId: z.string().optional().or(z.literal("")),
  clientOutletName: z.string().optional().or(z.literal("")),
  paymentDate: z.string().min(1),
  mode: z.enum(["CASH", "UPI", "BANK_TRANSFER", "CHEQUE", "OTHER"]),
  status: z.enum(["ACTIVE", "REVERSED"]).optional(),
  createdAt: z.string().optional().or(z.literal("")),
  recordedByName: z.string().optional().or(z.literal("")),
  collectedByUserId: z.string().optional().or(z.literal("")),
  collectedByName: z.string().optional().or(z.literal("")),
  amount: z.number().positive(),
  allocatedAmount: z.number().nonnegative(),
  unallocatedAmount: z.number().nonnegative(),
  notes: z.string().optional().or(z.literal("")),
  reversedAt: z.string().optional().or(z.literal("")),
  reversedByName: z.string().optional().or(z.literal("")),
  reversalReason: z.string().optional().or(z.literal("")),
  allocations: z.array(PartnerPaymentAllocationSchema),
});

export const PartnerClientLedgerEntrySchema = z.object({
  id: z.string().min(1),
  firmId: z.number().int().positive(),
  clientBusinessId: z.string().min(1),
  clientBusinessName: z.string().optional().or(z.literal("")),
  entryDate: z.string().min(1),
  type: z.enum(["INVOICE", "PAYMENT", "CREDIT_NOTE", "CREDIT_NOTE_VOID", "DEBIT_NOTE"]),
  referenceType: z.string().min(1),
  referenceId: z.string().min(1),
  referenceNumber: z.string().min(1),
  description: z.string().min(1),
  debitAmount: z.number().nonnegative(),
  creditAmount: z.number().nonnegative(),
  runningBalance: z.number(),
  createdAt: z.string().optional().or(z.literal("")),
});

export const PartnerSupplierSchema = z.object({
  id: z.string().min(1),
  firmId: z.number().int().positive(),
  supplierName: z.string().min(1),
  gstin: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]),
  createdAt: z.string().optional().or(z.literal("")),
  updatedAt: z.string().optional().or(z.literal("")),
});

export const PartnerSupplierGSTINValidationSchema = z.object({
  exists: z.boolean(),
  supplierId: z.string().optional().or(z.literal("")),
  supplierName: z.string().optional().or(z.literal("")),
});

export const PartnerSupplierInvoiceSchema = z.object({
  id: z.string().min(1),
  firmId: z.number().int().positive(),
  supplierId: z.string().min(1),
  supplierName: z.string().min(1),
  purchaseId: z.string().optional().or(z.literal("")),
  purchaseNumber: z.string().optional().or(z.literal("")),
  grnId: z.string().optional().or(z.literal("")),
  grnNumber: z.string().optional().or(z.literal("")),
  invoiceNumber: z.string().min(1),
  invoiceDate: z.string().min(1),
  dueDate: z.string().optional().or(z.literal("")),
  taxableAmount: z.number().nonnegative(),
  gstAmount: z.number().nonnegative(),
  finalTotalAmount: z.number().nonnegative(),
  paidAmount: z.number().nonnegative(),
  outstandingAmount: z.number().nonnegative(),
  status: z.enum(["DRAFT", "FINALIZED", "CANCELLED"]),
  payableStatus: z.enum(["UNPAID", "PARTIALLY_PAID", "PAID", "OVERDUE"]),
  createdAt: z.string().optional().or(z.literal("")),
  createdByName: z.string().optional().or(z.literal("")),
  finalizedAt: z.string().optional().or(z.literal("")),
  finalizedByName: z.string().optional().or(z.literal("")),
  cancelledAt: z.string().optional().or(z.literal("")),
  cancelledByName: z.string().optional().or(z.literal("")),
});

export const PartnerSupplierPaymentAllocationSchema = z.object({
  id: z.string().min(1),
  paymentId: z.string().min(1),
  supplierInvoiceId: z.string().min(1),
  invoiceNumber: z.string().min(1),
  invoiceDate: z.string().optional().or(z.literal("")),
  invoiceAmount: z.number().nonnegative().optional(),
  invoiceOutstanding: z.number().nonnegative().optional(),
  amount: z.number().positive(),
});

export const PartnerSupplierPaymentSchema = z.object({
  id: z.string().min(1),
  firmId: z.number().int().positive(),
  supplierId: z.string().min(1),
  supplierName: z.string().min(1),
  paymentDate: z.string().min(1),
  mode: z.enum(["CASH", "UPI", "BANK_TRANSFER", "CHEQUE", "OTHER"]),
  referenceNumber: z.string().optional().or(z.literal("")),
  createdAt: z.string().optional().or(z.literal("")),
  recordedByName: z.string().optional().or(z.literal("")),
  amount: z.number().positive(),
  allocatedAmount: z.number().nonnegative(),
  unallocatedAmount: z.number().nonnegative(),
  notes: z.string().optional().or(z.literal("")),
  allocations: z.array(PartnerSupplierPaymentAllocationSchema),
});

export const CreatePartnerSupplierPaymentRequestSchema = z.object({
  supplierInvoiceId: z.string().optional().or(z.literal("")),
  supplierId: z.string().optional().or(z.literal("")),
  paymentDate: z.string().min(1),
  amount: z.number().positive(),
  paymentMode: z.enum(["CASH", "UPI", "BANK_TRANSFER", "CHEQUE", "OTHER"]),
  referenceNumber: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
}).refine((input) => Boolean(input.supplierInvoiceId || input.supplierId), {
  message: "supplierInvoiceId or supplierId is required",
});

export const PartnerSupplierLedgerEntrySchema = z.object({
  id: z.string().min(1),
  firmId: z.number().int().positive(),
  supplierId: z.string().min(1),
  supplierName: z.string().optional().or(z.literal("")),
  entryDate: z.string().min(1),
  type: z.string().min(1),
  referenceType: z.string().min(1),
  referenceId: z.string().min(1),
  referenceNumber: z.string().min(1),
  description: z.string().min(1),
  debitAmount: z.number().nonnegative(),
  creditAmount: z.number().nonnegative(),
  runningBalance: z.number(),
  createdAt: z.string().optional().or(z.literal("")),
});

export const PartnerPayablesSummarySchema = z.object({
  totalPayables: z.number().nonnegative(),
  overduePayables: z.number().nonnegative(),
  invoicesDueToday: z.number().int().nonnegative(),
  invoices: z.array(PartnerSupplierInvoiceSchema),
});

export const PartnerPurchaseItemSchema = z.object({
  id: z.string().min(1),
  purchaseId: z.string().min(1),
  itemId: z.string().min(1),
  itemCode: z.string().min(1),
  itemName: z.string().min(1),
  sku: z.string().optional().or(z.literal("")),
  quantity: z.number().int().positive(),
  receivedQuantity: z.number().int().nonnegative(),
  damagedQuantity: z.number().int().nonnegative(),
  costPrice: z.number().nonnegative(),
  discountPercentage: z.number().min(0).max(100).optional(),
  taxPercentage: z.number().min(0).max(100).optional(),
  lineTotal: z.number().nonnegative(),
});

export const PartnerPurchaseSchema = z.object({
  id: z.string().min(1),
  firmId: z.number().int().positive(),
  purchaseNumber: z.string().min(1),
  supplierId: z.string().min(1),
  supplierName: z.string().min(1),
  supplierInvoiceNumber: z.string().optional().or(z.literal("")),
  purchaseDate: z.string().min(1),
  status: z.enum(["DRAFT", "PLACED", "COMPLETED", "CANCELLED"]),
  createdAt: z.string().optional().or(z.literal("")),
  createdByName: z.string().optional().or(z.literal("")),
  orderedAt: z.string().optional().or(z.literal("")),
  orderedByName: z.string().optional().or(z.literal("")),
  postedAt: z.string().optional().or(z.literal("")),
  postedByName: z.string().optional().or(z.literal("")),
  cancelledAt: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  lineCount: z.number().int().nonnegative(),
  totalQuantity: z.number().int().nonnegative(),
  receivedQuantity: z.number().int().nonnegative(),
  damagedQuantity: z.number().int().nonnegative(),
  totalAmount: z.number().nonnegative(),
  stockPosted: z.boolean(),
  items: z.array(PartnerPurchaseItemSchema),
});

export const PartnerSupplierReturnReasonSchema = z.enum(["DAMAGED", "WRONG_ITEM", "EXPIRED", "EXCESS_STOCK", "OTHER"]);

export const PartnerSupplierReturnItemSchema = z.object({
  id: z.string().min(1),
  supplierReturnId: z.string().min(1),
  itemId: z.string().min(1),
  itemName: z.string().min(1),
  sku: z.string().optional().or(z.literal("")),
  mrp: z.number().nonnegative(),
  discountPercentage: z.number().nonnegative(),
  taxPercentage: z.number().nonnegative(),
  quantity: z.number().int().positive(),
  reason: PartnerSupplierReturnReasonSchema,
  note: z.string().optional().or(z.literal("")),
});

export const PartnerSupplierReturnSchema = z.object({
  id: z.string().min(1),
  firmId: z.number().int().positive(),
  returnNumber: z.string().min(1),
  supplierId: z.string().min(1),
  supplierName: z.string().min(1),
  brandId: z.number().int().positive(),
  brandName: z.string().min(1),
  returnDate: z.string().min(1),
  status: z.enum(["PLACED", "COMPLETED", "CANCELLED"]),
  note: z.string().optional().or(z.literal("")),
  createdAt: z.string().optional().or(z.literal("")),
  createdByName: z.string().optional().or(z.literal("")),
  lineCount: z.number().int().nonnegative(),
  totalQuantity: z.number().int().nonnegative(),
  items: z.array(PartnerSupplierReturnItemSchema),
});

export const CreatePartnerSupplierReturnRequestSchema = z.object({
  supplierId: z.string().min(1),
  brandId: z.union([z.string().min(1), z.number().int().positive()]),
  returnDate: z.string().min(1),
  note: z.string().optional().or(z.literal("")),
  items: z.array(z.object({
    itemId: z.string().min(1),
    quantity: z.number().int().positive(),
    reason: PartnerSupplierReturnReasonSchema,
    note: z.string().optional().or(z.literal("")),
  })).min(1),
});

export const CancelPartnerPurchaseRequestSchema = z.object({
  reason: z.string().trim().min(1),
});

export const UpdatePartnerPurchaseRequestSchema = z.object({
  supplierId: z.string().min(1),
  supplierInvoiceNumber: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  items: z.array(z.object({
    itemId: z.string().min(1),
    quantity: z.number().int().positive(),
    costPrice: z.number().nonnegative(),
    discountPercentage: z.number().min(0).max(100).optional(),
    taxPercentage: z.number().min(0).max(100).optional(),
  })).min(1),
});

export const PartnerGoodsReceiptItemSchema = z.object({
  id: z.string().min(1),
  grnId: z.string().min(1),
  purchaseItemId: z.string().min(1),
  itemId: z.string().min(1),
  itemName: z.string().min(1),
  sku: z.string().optional().or(z.literal("")),
  orderedQuantity: z.number().int().nonnegative(),
  receivedQuantity: z.number().int().nonnegative(),
  damagedQuantity: z.number().int().nonnegative(),
  notes: z.string().optional().or(z.literal("")),
});

export const PartnerGoodsReceiptSchema = z.object({
  id: z.string().min(1),
  firmId: z.number().int().positive(),
  purchaseId: z.string().min(1),
  grnNumber: z.string().min(1),
  supplierId: z.string().min(1),
  supplierName: z.string().min(1),
  receivedDate: z.string().min(1),
  notes: z.string().optional().or(z.literal("")),
  createdAt: z.string().optional().or(z.literal("")),
  createdByName: z.string().optional().or(z.literal("")),
  items: z.array(PartnerGoodsReceiptItemSchema),
});

export const PartnerDashboardStatsSchema = z.object({
  mappedBrandsCount: z.number().int().nonnegative(),
  itemCount: z.number().int().nonnegative(),
  clientBusinessCount: z.number().int().nonnegative(),
  outletCount: z.number().int().nonnegative(),
  openOrdersCount: z.number().int().nonnegative(),
  unpaidInvoicesCount: z.number().int().nonnegative(),
  currentStockQtyTotal: z.number().int().nonnegative(),
  recentActivity: z.array(z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    subtitle: z.string().min(1),
    createdAt: z.string().datetime(),
  })),
});

export const PartnerReceivableInvoiceSummarySchema = z.object({
  invoiceId: z.string().min(1),
  invoiceNumber: z.string().min(1),
  clientId: z.string().optional().or(z.literal("")),
  clientName: z.string().optional().or(z.literal("")),
  outletId: z.string().min(1),
  outletName: z.string().min(1),
  invoiceDate: z.string().min(1),
  dueDate: z.string().min(1),
  amount: z.number().nonnegative(),
  paidAmount: z.number().nonnegative(),
  outstanding: z.number().nonnegative(),
  ageDays: z.number().int().nonnegative(),
  agingBucket: z.string().optional().or(z.literal("")),
  status: z.enum(["CURRENT", "OVERDUE"]),
  paymentStatus: z.enum(["UNPAID", "PARTIALLY_PAID", "PAID", "OVERDUE"]).optional(),
});

export const PartnerReceivablePaymentSummarySchema = z.object({
  paymentId: z.string().min(1),
  paymentReference: z.string().min(1),
  paymentDate: z.string().min(1),
  amount: z.number().nonnegative(),
  allocatedAmount: z.number().nonnegative(),
  status: z.enum(["ACTIVE", "REVERSED"]),
});

export const PartnerReceivableOutletSummarySchema = z.object({
  outletId: z.string().min(1),
  outletName: z.string().min(1),
  totalInvoiced: z.number().nonnegative(),
  totalPaid: z.number().nonnegative(),
  outstanding: z.number().nonnegative(),
});

export const PartnerReceivableBusinessSummarySchema = z.object({
  businessId: z.string().min(1),
  businessName: z.string().min(1),
  outletCount: z.number().int().nonnegative(),
  totalInvoiced: z.number().nonnegative(),
  totalPaid: z.number().nonnegative(),
  outstanding: z.number().nonnegative(),
  overdue0To30: z.number().nonnegative(),
  overdue31To60: z.number().nonnegative(),
  overdue61To90: z.number().nonnegative(),
  overdue90Plus: z.number().nonnegative(),
  latestActivityDate: z.string().min(1),
  outlets: z.array(PartnerReceivableOutletSummarySchema),
  invoices: z.array(PartnerReceivableInvoiceSummarySchema),
  payments: z.array(PartnerReceivablePaymentSummarySchema).optional(),
});

export const PartnerReceivablesSummarySchema = z.object({
  totalReceivables: z.number().nonnegative(),
  overdueReceivables: z.number().nonnegative(),
  invoicesDueToday: z.number().int().nonnegative().optional(),
  clientsWithDues: z.number().int().nonnegative(),
  businesses: z.array(PartnerReceivableBusinessSummarySchema),
});

export const PartnerStockActionInputSchema = z.object({
  actionType: z.enum(["RETURN_IN", "RETURN_OUT", "DAMAGE", "ADJUSTMENT"]),
  itemId: z.string().min(1),
  quantity: z.number().int().positive().optional(),
  quantityDelta: z.number().int().optional(),
  actionDate: z.string().min(1),
  note: z.string().optional().or(z.literal("")),
  referenceId: z.string().optional().or(z.literal("")),
  referenceType: z.enum(["PURCHASE", "INVOICE", "ORDER", "PAYMENT", "MANUAL", "RETURN", "SUPPLIER_RETURN", "DAMAGE"]).optional(),
  clientBusinessId: z.string().optional().or(z.literal("")),
  clientOutletId: z.string().optional().or(z.literal("")),
  supplierId: z.string().optional().or(z.literal("")),
  invoiceId: z.string().optional().or(z.literal("")),
  purchaseId: z.string().optional().or(z.literal("")),
  damageCategory: z.enum(["DAMAGED", "EXPIRED", "LEAKAGE", "BREAKAGE", "MISSING", "OTHER"]).optional(),
});

export const PartnerCreditNoteLineSchema = z.object({
  id: z.string().min(1),
  creditNoteId: z.string().min(1),
  itemId: z.string().optional().or(z.literal("")),
  itemName: z.string().optional().or(z.literal("")),
  quantity: z.number().int().nonnegative().optional(),
  amount: z.number().nonnegative(),
  referenceInvoiceLineId: z.string().optional().or(z.literal("")),
});

export const PartnerCreditNoteSchema = z.object({
  id: z.string().min(1),
  firmId: z.number().int().positive(),
  creditNoteNumber: z.string().min(1),
  salesReturnId: z.string().optional().or(z.literal("")),
  clientBusinessId: z.string().min(1),
  clientBusinessName: z.string().min(1),
  clientOutletId: z.string().min(1),
  clientOutletName: z.string().min(1),
  relatedInvoiceId: z.string().optional().or(z.literal("")),
  relatedInvoiceNumber: z.string().optional().or(z.literal("")),
  creditDate: z.string().min(1),
  note: z.string().optional().or(z.literal("")),
  status: z.enum(["DRAFT", "ISSUED", "CANCELLED"]),
  hasStockReturn: z.boolean(),
  totalAmount: z.number().nonnegative(),
  createdAt: z.string().optional().or(z.literal("")),
  createdByName: z.string().optional().or(z.literal("")),
  cancelledAt: z.string().optional().or(z.literal("")),
  lines: z.array(PartnerCreditNoteLineSchema),
});

export const PartnerDebitNoteLineSchema = z.object({
  id: z.string().min(1),
  debitNoteId: z.string().min(1),
  itemId: z.string().optional().or(z.literal("")),
  itemName: z.string().optional().or(z.literal("")),
  description: z.string().min(1),
  amount: z.number().nonnegative(),
});

export const PartnerDebitNoteSchema = z.object({
  id: z.string().min(1),
  firmId: z.number().int().positive(),
  debitNoteNumber: z.string().min(1),
  clientBusinessId: z.string().min(1),
  clientBusinessName: z.string().min(1),
  clientOutletId: z.string().min(1),
  clientOutletName: z.string().min(1),
  relatedInvoiceId: z.string().optional().or(z.literal("")),
  relatedInvoiceNumber: z.string().optional().or(z.literal("")),
  debitDate: z.string().min(1),
  note: z.string().optional().or(z.literal("")),
  status: z.enum(["DRAFT", "ISSUED", "CANCELLED"]),
  totalAmount: z.number().nonnegative(),
  createdAt: z.string().optional().or(z.literal("")),
  createdByName: z.string().optional().or(z.literal("")),
  cancelledAt: z.string().optional().or(z.literal("")),
  lines: z.array(PartnerDebitNoteLineSchema),
});

export const PartnerAuditLogSchema = z.object({
  id: z.string().min(1),
  firmId: z.number().int().positive(),
  userId: z.number().int().positive(),
  userName: z.string().min(1),
  entityType: z.enum(["ORDER", "INVOICE", "PAYMENT", "PURCHASE", "STOCK", "CREDIT_NOTE", "DEBIT_NOTE", "SALES_RETURN"]),
  entityId: z.string().min(1),
  action: z.string().min(1),
  referenceLabel: z.string().optional().or(z.literal("")),
  beforeState: z.string().optional().or(z.literal("")),
  afterState: z.string().optional().or(z.literal("")),
  createdAt: z.string().datetime(),
});

export const PartnerGlobalSearchResultSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["CLIENT", "INVOICE", "ITEM", "ORDER"]),
  title: z.string().min(1),
  subtitle: z.string().min(1),
  href: z.string().min(1),
});

export const PartnerSalesReportRowSchema = z.object({
  invoiceId: z.string().min(1),
  invoiceNumber: z.string().min(1),
  invoiceDate: z.string().min(1),
  clientBusinessId: z.string().min(1),
  clientBusinessName: z.string().min(1),
  clientOutletId: z.string().min(1),
  clientOutletName: z.string().min(1),
  brandId: z.number().int().positive(),
  brandName: z.string().min(1),
  itemId: z.string().min(1),
  itemName: z.string().min(1),
  quantitySold: z.number().int().nonnegative(),
  invoiceValue: z.number().nonnegative(),
  paymentReceived: z.number().nonnegative(),
  outstanding: z.number().nonnegative(),
});

export const PartnerStockMovementReportRowSchema = z.object({
  itemId: z.string().min(1),
  itemName: z.string().min(1),
  brandId: z.number().int().positive(),
  brandName: z.string().min(1),
  openingStock: z.number().int(),
  purchaseInward: z.number().int(),
  returnIn: z.number().int(),
  sale: z.number().int(),
  returnOut: z.number().int(),
  damage: z.number().int(),
  adjustment: z.number().int(),
  closingStock: z.number().int(),
});

export const PartnerClientPurchaseHistoryRowSchema = z.object({
  clientBusinessId: z.string().min(1),
  clientBusinessName: z.string().min(1),
  clientOutletId: z.string().min(1),
  clientOutletName: z.string().min(1),
  invoiceId: z.string().min(1),
  invoiceNumber: z.string().min(1),
  invoiceDate: z.string().min(1),
  itemId: z.string().min(1),
  itemName: z.string().min(1),
  quantity: z.number().int().nonnegative(),
  amount: z.number().nonnegative(),
});

export const PartnerMeResponseSchema = z.object({
  user: PartnerUserSchema,
  firms: z.array(PartnerFirmSchema),
  activeFirmId: z.string().min(1),
});

export const PartnerStockUpdateInputSchema = z.object({
  itemId: z.string().min(1),
  quantityDelta: z.number().int(),
  mrp: z.number().nonnegative().optional(),
  discountPercentage: z.number().min(0).max(100).optional(),
  note: z.string().max(240).optional(),
});

export type Staff = z.infer<typeof StaffSchema>;
export type Service = z.infer<typeof ServiceSchema>;
export type DayEntry = z.infer<typeof DayEntrySchema>;
export type HealthResponse = z.infer<typeof HealthResponseSchema>;
export type PartnerUser = z.infer<typeof PartnerUserSchema>;
export type PartnerFirm = z.infer<typeof PartnerFirmSchema>;
export type PartnerBrand = z.infer<typeof PartnerBrandSchema>;
export type PartnerCatalogItem = z.infer<typeof PartnerCatalogItemSchema>;
export type PartnerItem = z.infer<typeof PartnerItemSchema>;
export type PartnerClient = z.infer<typeof PartnerClientSchema>;
export type PartnerClientOutlet = z.infer<typeof PartnerClientOutletSchema>;
export type PartnerClientBusiness = z.infer<typeof PartnerClientBusinessSchema>;
export type PartnerGSTINValidation = z.infer<typeof PartnerGSTINValidationSchema>;
export type PartnerStockRow = z.infer<typeof PartnerStockRowSchema>;
export type PartnerStockLedgerEntry = z.infer<typeof PartnerStockLedgerEntrySchema>;
export type PartnerStockLedgerFilters = z.infer<typeof PartnerStockLedgerFiltersSchema>;
export type PartnerOrderItem = z.infer<typeof PartnerOrderItemSchema>;
export type PartnerOrder = z.infer<typeof PartnerOrderSchema>;
export type PartnerInvoiceItem = z.infer<typeof PartnerInvoiceItemSchema>;
export type PartnerInvoice = z.infer<typeof PartnerInvoiceSchema>;
export type PartnerPaymentAllocation = z.infer<typeof PartnerPaymentAllocationSchema>;
export type PartnerPayment = z.infer<typeof PartnerPaymentSchema>;
export type PartnerClientLedgerEntry = z.infer<typeof PartnerClientLedgerEntrySchema>;
export type PartnerSupplier = z.infer<typeof PartnerSupplierSchema>;
export type PartnerSupplierGSTINValidation = z.infer<typeof PartnerSupplierGSTINValidationSchema>;
export type PartnerSupplierInvoice = z.infer<typeof PartnerSupplierInvoiceSchema>;
export type PartnerSupplierPaymentAllocation = z.infer<typeof PartnerSupplierPaymentAllocationSchema>;
export type PartnerSupplierPayment = z.infer<typeof PartnerSupplierPaymentSchema>;
export type PartnerSupplierLedgerEntry = z.infer<typeof PartnerSupplierLedgerEntrySchema>;
export type PartnerPayablesSummary = z.infer<typeof PartnerPayablesSummarySchema>;
export type PartnerPurchaseItem = z.infer<typeof PartnerPurchaseItemSchema>;
export type PartnerPurchase = z.infer<typeof PartnerPurchaseSchema>;
export type PartnerGoodsReceiptItem = z.infer<typeof PartnerGoodsReceiptItemSchema>;
export type PartnerGoodsReceipt = z.infer<typeof PartnerGoodsReceiptSchema>;
export type PartnerDashboardStats = z.infer<typeof PartnerDashboardStatsSchema>;
export type PartnerReceivableInvoiceSummary = z.infer<typeof PartnerReceivableInvoiceSummarySchema>;
export type PartnerReceivablePaymentSummary = z.infer<typeof PartnerReceivablePaymentSummarySchema>;
export type PartnerReceivableOutletSummary = z.infer<typeof PartnerReceivableOutletSummarySchema>;
export type PartnerReceivableBusinessSummary = z.infer<typeof PartnerReceivableBusinessSummarySchema>;
export type PartnerReceivablesSummary = z.infer<typeof PartnerReceivablesSummarySchema>;
export type PartnerCreditNoteLine = z.infer<typeof PartnerCreditNoteLineSchema>;
export type PartnerCreditNote = z.infer<typeof PartnerCreditNoteSchema>;
export type PartnerDebitNoteLine = z.infer<typeof PartnerDebitNoteLineSchema>;
export type PartnerDebitNote = z.infer<typeof PartnerDebitNoteSchema>;
export type PartnerAuditLog = z.infer<typeof PartnerAuditLogSchema>;
export type PartnerGlobalSearchResult = z.infer<typeof PartnerGlobalSearchResultSchema>;
export type PartnerSalesReportRow = z.infer<typeof PartnerSalesReportRowSchema>;
export type PartnerStockMovementReportRow = z.infer<typeof PartnerStockMovementReportRowSchema>;
export type PartnerClientPurchaseHistoryRow = z.infer<typeof PartnerClientPurchaseHistoryRowSchema>;
export type PartnerMeResponse = z.infer<typeof PartnerMeResponseSchema>;
export type PartnerStockUpdateInput = z.infer<typeof PartnerStockUpdateInputSchema>;
export type PartnerStockActionInput = z.infer<typeof PartnerStockActionInputSchema>;
