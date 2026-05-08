import { z } from "zod";

export const PartnerOrderStatusSchema = z.enum([
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
]);

export const PartnerOrderSourceSchema = z.enum(["MANUAL", "WHATSAPP", "PHONE", "EMAIL", "SALES_REP", "OTHER"]);

export const PartnerOrdersFieldErrorSchema = z.object({
  field: z.string().min(1),
  message: z.string().min(1),
});

export const PartnerOrdersErrorResponseSchema = z.object({
  error: z.string().min(1),
  fieldErrors: z.array(PartnerOrdersFieldErrorSchema).optional(),
});

export const PartnerOrdersLineRequestSchema = z.object({
  itemId: z.string().min(1, "Item is required"),
  quantity: z.number().int().positive("Quantity must be positive"),
});

export const PartnerOrdersStatusRequestedItemSchema = z.object({
  itemId: z.string().min(1, "Item is required"),
  sellerMarginPercentage: z.number().min(0).max(100),
});

export const PartnerOrdersPackedItemSchema = z.object({
  orderItemId: z.string().optional().or(z.literal("")),
  itemId: z.string().optional().or(z.literal("")),
  packedQuantity: z.number().int().nonnegative(),
  shortReason: z.string().optional().or(z.literal("")),
});

export const PartnerOrdersDispatchedItemSchema = z.object({
  orderItemId: z.string().optional().or(z.literal("")),
  itemId: z.string().optional().or(z.literal("")),
  dispatchedQuantity: z.number().int().nonnegative(),
});

export const PartnerOrdersDeliveredItemSchema = z.object({
  orderItemId: z.string().optional().or(z.literal("")),
  itemId: z.string().optional().or(z.literal("")),
  deliveredQuantity: z.number().int().nonnegative(),
  returnedQuantity: z.number().int().nonnegative().optional(),
});

export const PartnerOrdersDispatchDetailsSchema = z.object({
  dispatchDate: z.string().optional().or(z.literal("")),
  transportName: z.string().optional().or(z.literal("")),
  vehicleNumber: z.string().optional().or(z.literal("")),
  driverPhone: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export const PartnerOrdersDeliveryDetailsSchema = z.object({
  deliveredDate: z.string().optional().or(z.literal("")),
  recipientName: z.string().optional().or(z.literal("")),
  proofReference: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export const PartnerOrdersCreateRequestSchema = z.object({
  clientBusinessId: z.string().min(1, "Client is required"),
  clientOutletId: z.string().min(1, "Outlet is required"),
  orderDate: z.string().optional(),
  source: PartnerOrderSourceSchema.optional(),
  sellerMarginPercentage: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
  items: z.array(PartnerOrdersLineRequestSchema).min(1, "Add at least one order line"),
});

export const PartnerOrdersUpdateRequestSchema = z.object({
  clientBusinessId: z.string().min(1, "Client is required"),
  clientOutletId: z.string().min(1, "Outlet is required"),
  source: PartnerOrderSourceSchema.optional(),
  sellerMarginPercentage: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
  items: z.array(PartnerOrdersLineRequestSchema).min(1, "Add at least one order line"),
});

export const PartnerOrdersStatusRequestSchema = z.object({
  status: PartnerOrderStatusSchema,
  sellerMarginPercentage: z.number().min(0).max(100).optional(),
  note: z.string().optional(),
  items: z.array(PartnerOrdersLineRequestSchema).optional(),
  requestedItems: z.array(PartnerOrdersStatusRequestedItemSchema).optional(),
  packedItems: z.array(PartnerOrdersPackedItemSchema).optional(),
  dispatchDetails: PartnerOrdersDispatchDetailsSchema.optional(),
  dispatchedItems: z.array(PartnerOrdersDispatchedItemSchema).optional(),
  deliveryDetails: PartnerOrdersDeliveryDetailsSchema.optional(),
  deliveredItems: z.array(PartnerOrdersDeliveredItemSchema).optional(),
});

export const PartnerOrdersItemSchema = z.object({
  id: z.string().min(1),
  orderId: z.string().min(1),
  billableLineId: z.string().optional().or(z.literal("")),
  itemId: z.string().min(1),
  brandId: z.number().int().positive().optional(),
  catalogItemId: z.string().optional().or(z.literal("")),
  itemCode: z.string().min(1),
  itemName: z.string().min(1),
  unit: z.string(),
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

export const PartnerOrdersBillableLineSchema = z.object({
  id: z.string().min(1),
  orderId: z.string().min(1),
  catalogItemId: z.string().min(1),
  itemCode: z.string().min(1),
  itemName: z.string().min(1),
  quantity: z.number().int().positive(),
  mrp: z.number().nonnegative(),
  sellerMarginPercentage: z.number().min(0).max(100),
  rate: z.number().nonnegative(),
  lineTotal: z.number().nonnegative(),
});

export const PartnerOrdersUnfulfilledItemSchema = z.object({
  id: z.string().min(1),
  firmId: z.number().int().positive(),
  clientBusinessId: z.string().min(1),
  clientOutletId: z.string().min(1),
  sourceOrderId: z.string().min(1),
  sourceOrderLineId: z.string().min(1),
  brandId: z.number().int().positive(),
  catalogItemId: z.string().min(1),
  itemCode: z.string().min(1),
  itemName: z.string().min(1),
  requestedQuantity: z.number().int().positive(),
  fulfilledQuantity: z.number().int().nonnegative(),
  openQuantity: z.number().int().nonnegative(),
  status: z.enum(["OPEN", "PARTIALLY_CLEARED", "CLEARED", "CANCELLED"]),
  reason: z.string().min(1),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  clearedAt: z.string().optional().or(z.literal("")),
});

export const PartnerOrderReturnLineRequestSchema = z.object({
  orderItemId: z.string().min(1, "Order line is required"),
  quantity: z.number().int().positive("Return quantity must be positive"),
});

export const PartnerOrderReturnCreateRequestSchema = z.object({
  returnDate: z.string().min(1, "Return date is required"),
  note: z.string().min(1, "Return note is required"),
  lines: z.array(PartnerOrderReturnLineRequestSchema).min(1, "Add at least one return line"),
});

export const PartnerSalesReturnLineSchema = z.object({
  id: z.string().min(1),
  salesReturnId: z.string().min(1),
  orderItemId: z.string().min(1),
  invoiceLineId: z.string().optional().or(z.literal("")),
  itemId: z.string().min(1),
  itemName: z.string().min(1),
  returnedQuantity: z.number().int().positive(),
  acceptedQuantity: z.number().int().positive(),
  creditAmount: z.number().nonnegative(),
  reason: z.string().optional().or(z.literal("")),
});

export const PartnerSalesReturnSchema = z.object({
  id: z.string().min(1),
  firmId: z.number().int().positive(),
  returnNumber: z.string().min(1),
  orderId: z.string().min(1),
  orderNumber: z.string().optional().or(z.literal("")),
  invoiceId: z.string().min(1),
  invoiceNumber: z.string().optional().or(z.literal("")),
  creditNoteId: z.string().optional().or(z.literal("")),
  creditNoteNumber: z.string().optional().or(z.literal("")),
  clientBusinessId: z.string().min(1),
  clientBusinessName: z.string().min(1),
  clientOutletId: z.string().min(1),
  clientOutletName: z.string().min(1),
  returnDate: z.string().min(1),
  status: z.enum(["ISSUED", "CANCELLED"]),
  notes: z.string().optional().or(z.literal("")),
  totalQuantity: z.number().int().nonnegative(),
  totalCreditAmount: z.number().nonnegative(),
  createdAt: z.string().optional().or(z.literal("")),
  createdByName: z.string().optional().or(z.literal("")),
  cancelledAt: z.string().optional().or(z.literal("")),
  lines: z.array(PartnerSalesReturnLineSchema),
});

export const PartnerOrdersOrderSchema = z.object({
  id: z.string().min(1),
  firmId: z.number().int().positive(),
  orderNumber: z.string().min(1),
  clientBusinessId: z.string().min(1),
  clientBusinessName: z.string().min(1),
  clientOutletId: z.string().min(1),
  clientOutletName: z.string().min(1),
  orderDate: z.string().min(1),
  source: PartnerOrderSourceSchema.optional(),
  status: PartnerOrderStatusSchema,
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
  items: z.array(PartnerOrdersItemSchema),
  requestedItems: z.array(PartnerOrdersItemSchema).optional(),
  billableLines: z.array(PartnerOrdersBillableLineSchema).optional(),
  unfulfilledItems: z.array(PartnerOrdersUnfulfilledItemSchema).optional(),
});

export const PartnerOrdersListResponseSchema = z.array(PartnerOrdersOrderSchema);
export const PartnerOrdersDetailResponseSchema = PartnerOrdersOrderSchema;
export const PartnerOrderReturnsListResponseSchema = z.array(PartnerSalesReturnSchema);
export const PartnerOrderReturnCreditNoteSummarySchema = z.object({
  id: z.string().min(1),
  creditNoteNumber: z.string().min(1),
  status: z.enum(["DRAFT", "ISSUED", "CANCELLED"]),
  totalAmount: z.number().nonnegative(),
});
export const PartnerOrderReturnActionResponseSchema = z.object({
  salesReturn: PartnerSalesReturnSchema,
  creditNote: PartnerOrderReturnCreditNoteSummarySchema,
  order: PartnerOrdersOrderSchema,
});

export type PartnerOrdersFieldError = z.infer<typeof PartnerOrdersFieldErrorSchema>;
export type PartnerOrdersErrorResponse = z.infer<typeof PartnerOrdersErrorResponseSchema>;
export type PartnerOrdersCreateRequest = z.infer<typeof PartnerOrdersCreateRequestSchema>;
export type PartnerOrdersUpdateRequest = z.infer<typeof PartnerOrdersUpdateRequestSchema>;
export type PartnerOrdersStatusRequest = z.infer<typeof PartnerOrdersStatusRequestSchema>;
export type PartnerOrdersListResponse = z.infer<typeof PartnerOrdersListResponseSchema>;
export type PartnerOrdersDetailResponse = z.infer<typeof PartnerOrdersDetailResponseSchema>;
export type PartnerOrderReturnCreateRequest = z.infer<typeof PartnerOrderReturnCreateRequestSchema>;
export type PartnerSalesReturnLine = z.infer<typeof PartnerSalesReturnLineSchema>;
export type PartnerSalesReturn = z.infer<typeof PartnerSalesReturnSchema>;
export type PartnerOrderReturnsListResponse = z.infer<typeof PartnerOrderReturnsListResponseSchema>;
export type PartnerOrderReturnActionResponse = z.infer<typeof PartnerOrderReturnActionResponseSchema>;
