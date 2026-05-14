import { env } from "@shared/config/env";
import { http } from "@shared/api/http";
import { mockDb } from "@shared/api/mockDb";
import {
  createPartnerOrderForFirm,
  getPartnerOrder as getPartnerOrderFromFeature,
  listPartnerOrders,
  updatePartnerOrderForFirm,
  updatePartnerOrderStatusForFirm,
} from "@features/partners/orders/api";
import type { UpdatePartnerOrderStatusInput } from "@features/partners/orders/types";
import type {
  PartnerAuditLog,
  PartnerBrand,
  PartnerClient,
  PartnerClientBusiness,
  PartnerClientPurchaseHistoryRow,
  PartnerCreditNote,
  PartnerDashboardStats,
  PartnerDebitNote,
  PartnerFirm,
  PartnerFirmInvite,
  PartnerFirmMembership,
  PartnerFirmRole,
  PartnerCatalogItem,
  PartnerInventoryHistoryEntry,
  PartnerInventoryItem,
  PartnerInventoryUpdateInput,
  PartnerGSTINValidation,
  PartnerGlobalSearchResult,
  PartnerGoodsReceipt,
  PartnerInvoice,
  PartnerClientLedgerEntry,
  PartnerOrder,
  PartnerPayment,
  PartnerPaymentMode,
  PartnerReceivablesSummary,
  PartnerSalesReportRow,
  PartnerPurchase,
  PartnerPayablesSummary,
  PartnerStockMovementReportRow,
  PartnerSupplier,
  PartnerSupplierInvoice,
  PartnerSupplierLedgerEntry,
  PartnerSupplierPayment,
  PartnerSupplierGSTINValidation,
  PartnerStockActionInput,
  PartnerStockLedgerEntry,
  PartnerStockLedgerFilters,
  PartnerStockReasonType,
  PartnerStockRow,
} from "@shared/types/domain";

const looseMockDb = mockDb as any;
type NumericIdParam = number | string;

export type PartnerMeResponse = {
  user: { id: number; name: string; phone: string; email?: string };
  firms: PartnerFirm[];
  activeFirmId: number;
};

export type PartnerFirmInput = {
  name: string;
  tradeName?: string;
  gstin?: string;
  billingAddress: string;
  city: string;
  ownerName: string;
  phone: string;
  email: string;
};

export type PartnerFirmUpdateInput = PartnerFirmInput & {
  status?: "ACTIVE" | "INACTIVE";
};

export type CreatePartnerFirmMembershipInput = {
  phone: string;
  role: Exclude<PartnerFirmRole, "OWNER">;
};

export type CreatePartnerFirmMembershipResult = {
  kind: "membership" | "invite";
  membership?: PartnerFirmMembership;
  invite?: PartnerFirmInvite;
};

export async function getPartnersMe() {
  if (env.useMocks) {
    return looseMockDb.getPartnersMe();
  }
  return http<PartnerMeResponse>("/partners/me");
}

export async function getPartnerFirm(firmId: NumericIdParam) {
  if (env.useMocks) {
    return looseMockDb.getPartnerFirm(firmId);
  }
  return http<PartnerFirm>(`/partners/firms/${encodeURIComponent(firmId)}`);
}

export async function createPartnerFirm(input: PartnerFirmInput) {
  if (env.useMocks) {
    return looseMockDb.createPartnerFirm(input);
  }
  return http<PartnerFirm>("/partners/firms", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updatePartnerFirm(firmId: NumericIdParam, input: PartnerFirmUpdateInput) {
  if (env.useMocks) {
    return looseMockDb.updatePartnerFirm(firmId, input);
  }
  return http<PartnerFirm>(`/partners/firms/${encodeURIComponent(firmId)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function getPartnerFirmMemberships(firmId: NumericIdParam) {
  if (env.useMocks) {
    return looseMockDb.getPartnerFirmMemberships(firmId);
  }
  return http<PartnerFirmMembership[]>(`/partners/firms/${encodeURIComponent(firmId)}/memberships`);
}

export async function getPartnerFirmInvites(firmId: NumericIdParam) {
  if (env.useMocks) {
    return looseMockDb.getPartnerFirmInvites(firmId);
  }
  return http<PartnerFirmInvite[]>(`/partners/firms/${encodeURIComponent(firmId)}/invites`);
}

export async function createPartnerFirmMembership(
  firmId: NumericIdParam,
  input: CreatePartnerFirmMembershipInput,
) {
  if (env.useMocks) {
    return looseMockDb.createPartnerFirmMembership(firmId, input);
  }
  return http<CreatePartnerFirmMembershipResult>(`/partners/firms/${encodeURIComponent(firmId)}/memberships`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function removePartnerFirmMembership(firmId: NumericIdParam, userId: NumericIdParam) {
  return removePartnerFirmMembershipByRole(firmId, userId, "STAFF");
}

export async function removePartnerFirmMembershipByRole(firmId: NumericIdParam, userId: NumericIdParam, role: PartnerFirmRole) {
  if (env.useMocks) {
    return looseMockDb.removePartnerFirmMembership(firmId, userId, role);
  }
  return http<{ ok: true }>(`/partners/firms/${encodeURIComponent(firmId)}/memberships/${encodeURIComponent(userId)}?role=${encodeURIComponent(role)}`, {
    method: "DELETE",
  });
}

export async function revokePartnerFirmInvite(firmId: NumericIdParam, inviteId: string) {
  return revokePartnerFirmInviteByRole(firmId, inviteId, "STAFF");
}

export async function revokePartnerFirmInviteByRole(firmId: NumericIdParam, inviteId: string, role: PartnerFirmRole) {
  if (env.useMocks) {
    return looseMockDb.revokePartnerFirmInvite(firmId, inviteId, role);
  }
  return http<{ ok: true }>(`/partners/firms/${encodeURIComponent(firmId)}/invites/${encodeURIComponent(inviteId)}/revoke?role=${encodeURIComponent(role)}`, {
    method: "POST",
  });
}

export async function getPartnerDashboard(firmId: NumericIdParam) {
  if (env.useMocks) {
    return looseMockDb.getPartnerDashboard(firmId);
  }
  return http<PartnerDashboardStats>(`/partners/firms/${encodeURIComponent(firmId)}/dashboard`);
}

export async function getPartnerFirmBrands(firmId: NumericIdParam) {
  if (env.useMocks) {
    return looseMockDb.getPartnerFirmBrands(firmId);
  }
  return http<PartnerBrand[]>(`/partners/firms/${encodeURIComponent(firmId)}/brands`);
}

export async function createPartnerFirmBrand(firmId: NumericIdParam, input: { brandId?: NumericIdParam; brandName?: string }) {
  if (env.useMocks) {
    return looseMockDb.createPartnerFirmBrand(firmId, input);
  }
  return http<PartnerBrand>(`/partners/firms/${encodeURIComponent(firmId)}/brands`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function deletePartnerFirmBrand(firmId: NumericIdParam, brandId: NumericIdParam) {
  if (env.useMocks) {
    return looseMockDb.deletePartnerFirmBrand(firmId, brandId);
  }
  return http<{ ok: true }>(`/partners/firms/${encodeURIComponent(firmId)}/brands/${encodeURIComponent(brandId)}`, {
    method: "DELETE",
  });
}

export async function getPartnerBrandItems(firmId: NumericIdParam, brandId: NumericIdParam) {
  if (env.useMocks) {
    return looseMockDb.getPartnerBrandItems(firmId, brandId);
  }
  return http<PartnerCatalogItem[]>(`/partners/firms/${encodeURIComponent(firmId)}/brands/${encodeURIComponent(brandId)}/items`);
}

export async function createPartnerBrandItem(
  firmId: NumericIdParam,
  brandId: NumericIdParam,
  input: {
    name: string;
    description?: string;
    sku?: string;
    hsnCode?: string;
    status?: "ACTIVE" | "INACTIVE";
  }
) {
  if (env.useMocks) {
    return looseMockDb.createPartnerBrandItem(firmId, brandId, input);
  }
  return http<PartnerCatalogItem>(`/partners/firms/${encodeURIComponent(firmId)}/brands/${encodeURIComponent(brandId)}/items`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updatePartnerBrandItem(
  firmId: NumericIdParam,
  brandId: NumericIdParam,
  itemId: string,
  patch: {
    name?: string;
    description?: string;
    hsnCode?: string;
    status?: "ACTIVE" | "INACTIVE";
  }
) {
  if (env.useMocks) {
    return looseMockDb.updatePartnerBrandItem(firmId, brandId, itemId, patch);
  }
  return http<PartnerCatalogItem>(`/partners/firms/${encodeURIComponent(firmId)}/brands/${encodeURIComponent(brandId)}/items/${encodeURIComponent(itemId)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function getPartnerClients(firmId: NumericIdParam, search = "") {
  if (env.useMocks) {
    return looseMockDb.getPartnerClients(firmId, search);
  }
  const query = search.trim() ? `?q=${encodeURIComponent(search.trim())}` : "";
  return http<PartnerClient[]>(`/partners/firms/${encodeURIComponent(firmId)}/clients${query}`);
}

export async function getPartnerClientBusinesses(firmId: NumericIdParam, search = "") {
  if (env.useMocks) {
    return looseMockDb.getPartnerClientBusinesses(firmId, search);
  }
  const query = search.trim() ? `?q=${encodeURIComponent(search.trim())}` : "";
  return http<PartnerClientBusiness[]>(`/partners/firms/${encodeURIComponent(firmId)}/client-businesses${query}`);
}

export async function createPartnerClientBusiness(
  firmId: NumericIdParam,
  input: {
    businessName: string;
    gstin?: string;
    billingAddress?: string;
    contacts: Array<{ name: string; phone: string }>;
  },
) {
  if (env.useMocks) {
    return looseMockDb.createPartnerClientBusiness(firmId, input);
  }
  return http<PartnerClientBusiness>(`/partners/firms/${encodeURIComponent(firmId)}/client-businesses`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function validatePartnerBusinessGSTIN(
  firmId: NumericIdParam,
  gstin: string,
  excludeBusinessId = "",
) {
  if (env.useMocks) {
    return looseMockDb.validatePartnerBusinessGSTIN(firmId, gstin, excludeBusinessId);
  }
  const params = new URLSearchParams();
  params.set("gstin", gstin);
  if (excludeBusinessId) {
    params.set("excludeBusinessId", excludeBusinessId);
  }
  return http<PartnerGSTINValidation>(
    `/partners/firms/${encodeURIComponent(firmId)}/client-businesses/validate-gstin?${params.toString()}`,
  );
}

export async function addPartnerClientOutlet(
  firmId: NumericIdParam,
  businessId: string,
  input: {
    outletName: string;
    address?: string;
    contacts: Array<{ name: string; phone: string }>;
  },
) {
  if (env.useMocks) {
    return looseMockDb.addPartnerClientOutlet(firmId, businessId, input);
  }
  return http<PartnerClientBusiness>(`/partners/firms/${encodeURIComponent(firmId)}/client-businesses/${encodeURIComponent(businessId)}/outlets`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updatePartnerClientBusiness(
  firmId: NumericIdParam,
  businessId: string,
  input: {
    businessName: string;
    gstin?: string;
    billingAddress?: string;
    contacts: Array<{ name: string; phone: string }>;
  },
) {
  if (env.useMocks) {
    return looseMockDb.updatePartnerClientBusiness(firmId, businessId, input);
  }
  return http<PartnerClientBusiness>(
    `/partners/firms/${encodeURIComponent(firmId)}/client-businesses/${encodeURIComponent(businessId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );
}

export async function archivePartnerClientBusiness(firmId: NumericIdParam, businessId: string) {
  if (env.useMocks) {
    return looseMockDb.archivePartnerClientBusiness(firmId, businessId);
  }
  return http<PartnerClientBusiness>(
    `/partners/firms/${encodeURIComponent(firmId)}/client-businesses/${encodeURIComponent(businessId)}/archive`,
    { method: "POST" },
  );
}

export async function updatePartnerClientOutlet(
  firmId: NumericIdParam,
  businessId: string,
  outletId: string,
  input: {
    outletName: string;
    address?: string;
    contacts: Array<{ name: string; phone: string }>;
    status: "ACTIVE" | "INACTIVE";
  },
) {
  if (env.useMocks) {
    return looseMockDb.updatePartnerClientOutlet(firmId, businessId, outletId, input);
  }
  return http<PartnerClientBusiness>(
    `/partners/firms/${encodeURIComponent(firmId)}/client-businesses/${encodeURIComponent(businessId)}/outlets/${encodeURIComponent(outletId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );
}

export async function archivePartnerClientOutlet(firmId: NumericIdParam, businessId: string, outletId: string) {
  if (env.useMocks) {
    return looseMockDb.archivePartnerClientOutlet(firmId, businessId, outletId);
  }
  return http<PartnerClientBusiness>(
    `/partners/firms/${encodeURIComponent(firmId)}/client-businesses/${encodeURIComponent(businessId)}/outlets/${encodeURIComponent(outletId)}/archive`,
    { method: "POST" },
  );
}

export async function getPartnerOrders(firmId: NumericIdParam) {
  return listPartnerOrders(firmId);
}

export async function getPartnerOrderById(firmId: NumericIdParam, orderId: string) {
  return getPartnerOrderFromFeature(firmId, orderId);
}

export async function createPartnerOrder(
  firmId: NumericIdParam,
  input: {
    clientBusinessId: string;
    clientOutletId: string;
    orderDate?: string;
    notes?: string;
    items: Array<{ itemId: string; quantity: number }>;
  },
) {
  return createPartnerOrderForFirm(firmId, input);
}

export async function updatePartnerOrder(
  firmId: NumericIdParam,
  orderId: string,
  input: {
    clientBusinessId: string;
    clientOutletId: string;
    notes?: string;
    items: Array<{ itemId: string; quantity: number }>;
  },
) {
  return updatePartnerOrderForFirm(firmId, orderId, input);
}

export async function updatePartnerOrderStatus(
  firmId: NumericIdParam,
  orderId: string,
  status: PartnerOrder["status"],
  input: Omit<UpdatePartnerOrderStatusInput, "status"> = {},
) {
  return updatePartnerOrderStatusForFirm(firmId, orderId, { ...input, status });
}

export async function getPartnerInvoices(firmId: NumericIdParam) {
  if (env.useMocks) {
    return looseMockDb.getPartnerInvoices(firmId);
  }
  return http<PartnerInvoice[]>(`/partners/firms/${encodeURIComponent(firmId)}/invoices`);
}

export async function getPartnerInvoiceById(firmId: NumericIdParam, invoiceId: string) {
  if (env.useMocks) {
    return looseMockDb.getPartnerInvoiceById(firmId, invoiceId);
  }
  return http<PartnerInvoice>(`/partners/firms/${encodeURIComponent(firmId)}/invoices/${encodeURIComponent(invoiceId)}`);
}

export async function createPartnerInvoice(
  firmId: NumericIdParam,
  input: {
    orderId?: string;
    clientBusinessId: string;
    clientOutletId: string;
    invoiceDate: string;
    dueDate?: string;
    notes?: string;
    items?: Array<{ itemId: string; quantity: number }>;
  },
) {
  if (env.useMocks) {
    return looseMockDb.createPartnerInvoice(firmId, input);
  }
  return http<PartnerInvoice>(`/partners/firms/${encodeURIComponent(firmId)}/invoices`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function cancelPartnerInvoice(firmId: NumericIdParam, invoiceId: string) {
  if (env.useMocks) {
    return looseMockDb.cancelPartnerInvoice(firmId, invoiceId);
  }
  return http<PartnerInvoice>(`/partners/firms/${encodeURIComponent(firmId)}/invoices/${encodeURIComponent(invoiceId)}/cancel`, {
    method: "POST",
  });
}

export async function finalizePartnerInvoice(firmId: NumericIdParam, invoiceId: string) {
  if (env.useMocks) {
    return looseMockDb.finalizePartnerInvoice(firmId, invoiceId);
  }
  return http<PartnerInvoice>(`/partners/firms/${encodeURIComponent(firmId)}/invoices/${encodeURIComponent(invoiceId)}/finalize`, {
    method: "POST",
  });
}

export async function getPartnerPayments(
  firmId: NumericIdParam,
  filters: { search?: string; clientBusinessId?: string; invoiceId?: string; fromDate?: string; toDate?: string } = {},
) {
  if (env.useMocks) {
    return looseMockDb.getPartnerPayments(firmId, filters);
  }
  const params = new URLSearchParams();
  if (filters.search?.trim()) params.set("q", filters.search.trim());
  if (filters.clientBusinessId) params.set("clientBusinessId", filters.clientBusinessId);
  if (filters.invoiceId) params.set("invoiceId", filters.invoiceId);
  if (filters.fromDate) params.set("fromDate", filters.fromDate);
  if (filters.toDate) params.set("toDate", filters.toDate);
  const query = params.toString();
  return http<PartnerPayment[]>(`/partners/firms/${encodeURIComponent(firmId)}/payments${query ? `?${query}` : ""}`);
}

export async function createPartnerPayment(
  firmId: NumericIdParam,
  input: {
    invoiceId: string;
    paymentDate: string;
    amount: number;
    paymentMode: PartnerPaymentMode;
    referenceNumber?: string;
    collectedByUserId?: NumericIdParam;
    notes?: string;
  },
) {
  if (env.useMocks) {
    return looseMockDb.createPartnerPayment(firmId, input);
  }
  return http<PartnerPayment>(`/partners/firms/${encodeURIComponent(firmId)}/payments`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getPartnerClientLedger(
  firmId: NumericIdParam,
  filters: { clientBusinessId?: string; fromDate?: string; toDate?: string } = {},
) {
  if (env.useMocks) {
    return looseMockDb.getPartnerClientLedger(firmId, filters);
  }
  const params = new URLSearchParams();
  if (filters.clientBusinessId) params.set("clientBusinessId", filters.clientBusinessId);
  if (filters.fromDate) params.set("fromDate", filters.fromDate);
  if (filters.toDate) params.set("toDate", filters.toDate);
  const query = params.toString();
  return http<PartnerClientLedgerEntry[]>(`/partners/firms/${encodeURIComponent(firmId)}/client-ledger${query ? `?${query}` : ""}`);
}

export async function getPartnerPayables(
  firmId: NumericIdParam,
  filters: { search?: string; supplierId?: string; status?: string; fromDate?: string; toDate?: string; overdueOnly?: boolean } = {},
) {
  if (env.useMocks) {
    return looseMockDb.getPartnerPayables(firmId, filters);
  }
  const query = new URLSearchParams();
  if (filters.search) query.set("q", filters.search);
  if (filters.supplierId) query.set("supplierId", filters.supplierId);
  if (filters.status) query.set("status", filters.status);
  if (filters.fromDate) query.set("fromDate", filters.fromDate);
  if (filters.toDate) query.set("toDate", filters.toDate);
  if (filters.overdueOnly) query.set("overdueOnly", "true");
  return http<PartnerPayablesSummary>(`/partners/firms/${encodeURIComponent(firmId)}/payables${query.toString() ? `?${query.toString()}` : ""}`);
}

export async function getPartnerSupplierInvoices(
  firmId: NumericIdParam,
  filters: { search?: string; supplierId?: string; status?: string; fromDate?: string; toDate?: string; overdueOnly?: boolean } = {},
) {
  if (env.useMocks) {
    return looseMockDb.getPartnerSupplierInvoices(firmId, filters);
  }
  const query = new URLSearchParams();
  if (filters.search) query.set("q", filters.search);
  if (filters.supplierId) query.set("supplierId", filters.supplierId);
  if (filters.status) query.set("status", filters.status);
  if (filters.fromDate) query.set("fromDate", filters.fromDate);
  if (filters.toDate) query.set("toDate", filters.toDate);
  if (filters.overdueOnly) query.set("overdueOnly", "true");
  return http<PartnerSupplierInvoice[]>(`/partners/firms/${encodeURIComponent(firmId)}/supplier-invoices${query.toString() ? `?${query.toString()}` : ""}`);
}

export async function createPartnerSupplierInvoice(
  firmId: NumericIdParam,
  input: {
    supplierId: string;
    purchaseId?: string;
    grnId?: string;
    invoiceNumber: string;
    invoiceDate: string;
    dueDate?: string;
    taxableAmount: number;
    gstAmount: number;
    finalTotalAmount: number;
    finalize?: boolean;
  },
) {
  if (env.useMocks) {
    return looseMockDb.createPartnerSupplierInvoice(firmId, input);
  }
  return http<PartnerSupplierInvoice>(`/partners/firms/${encodeURIComponent(firmId)}/supplier-invoices`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function finalizePartnerSupplierInvoice(firmId: NumericIdParam, supplierInvoiceId: string) {
  if (env.useMocks) {
    return looseMockDb.finalizePartnerSupplierInvoice(firmId, supplierInvoiceId);
  }
  return http<PartnerSupplierInvoice>(
    `/partners/firms/${encodeURIComponent(firmId)}/supplier-invoices/${encodeURIComponent(supplierInvoiceId)}/finalize`,
    { method: "POST" },
  );
}

export async function getPartnerSupplierPayments(
  firmId: NumericIdParam,
  filters: { search?: string; supplierId?: string; supplierInvoiceId?: string; fromDate?: string; toDate?: string } = {},
) {
  if (env.useMocks) {
    return looseMockDb.getPartnerSupplierPayments(firmId, filters);
  }
  const query = new URLSearchParams();
  if (filters.search) query.set("q", filters.search);
  if (filters.supplierId) query.set("supplierId", filters.supplierId);
  if (filters.supplierInvoiceId) query.set("supplierInvoiceId", filters.supplierInvoiceId);
  if (filters.fromDate) query.set("fromDate", filters.fromDate);
  if (filters.toDate) query.set("toDate", filters.toDate);
  return http<PartnerSupplierPayment[]>(`/partners/firms/${encodeURIComponent(firmId)}/supplier-payments${query.toString() ? `?${query.toString()}` : ""}`);
}

export async function createPartnerSupplierPayment(
  firmId: NumericIdParam,
  input: {
    supplierInvoiceId: string;
    paymentDate: string;
    amount: number;
    paymentMode: PartnerPaymentMode;
    referenceNumber?: string;
    notes?: string;
  },
) {
  if (env.useMocks) {
    return looseMockDb.createPartnerSupplierPayment(firmId, input);
  }
  return http<PartnerSupplierPayment>(`/partners/firms/${encodeURIComponent(firmId)}/supplier-payments`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getPartnerSupplierLedger(
  firmId: NumericIdParam,
  filters: { supplierId?: string; fromDate?: string; toDate?: string } = {},
) {
  if (env.useMocks) {
    return looseMockDb.getPartnerSupplierLedger(firmId, filters);
  }
  const query = new URLSearchParams();
  if (filters.supplierId) query.set("supplierId", filters.supplierId);
  if (filters.fromDate) query.set("fromDate", filters.fromDate);
  if (filters.toDate) query.set("toDate", filters.toDate);
  return http<PartnerSupplierLedgerEntry[]>(`/partners/firms/${encodeURIComponent(firmId)}/supplier-ledger${query.toString() ? `?${query.toString()}` : ""}`);
}

export async function getPartnerReceivablesSummary(
  firmId: NumericIdParam,
  filters: { search?: string; status?: "ALL" | "OUTSTANDING" | "OVERDUE" | "UNPAID" | "PARTIALLY_PAID" | "PAID"; fromDate?: string; toDate?: string; overdueOnly?: boolean },
) {
  if (env.useMocks) {
    return looseMockDb.getPartnerReceivablesSummary(firmId, filters);
  }
  const params = new URLSearchParams();
  if (filters.search?.trim()) params.set("q", filters.search.trim());
  if (filters.status && filters.status !== "ALL") params.set("status", filters.status);
  if (filters.fromDate) params.set("fromDate", filters.fromDate);
  if (filters.toDate) params.set("toDate", filters.toDate);
  if (filters.overdueOnly) params.set("overdueOnly", "true");
  const query = params.toString();
  return http<PartnerReceivablesSummary>(`/partners/firms/${encodeURIComponent(firmId)}/receivables${query ? `?${query}` : ""}`);
}

export async function getPartnerCreditNotes(firmId: NumericIdParam) {
  if (env.useMocks) {
    return looseMockDb.getPartnerCreditNotes(firmId);
  }
  return http<PartnerCreditNote[]>(`/partners/firms/${encodeURIComponent(firmId)}/credit-notes`);
}

export async function createPartnerCreditNote(
  firmId: NumericIdParam,
  input: {
    clientBusinessId: string;
    clientOutletId: string;
    relatedInvoiceId?: string;
    creditDate: string;
    note?: string;
    status?: "DRAFT" | "ISSUED" | "CANCELLED";
    hasStockReturn: boolean;
    lines: Array<{ itemId?: string; quantity?: number; amount: number; referenceInvoiceLineId?: string }>;
  },
) {
  if (env.useMocks) {
    return looseMockDb.createPartnerCreditNote(firmId, input);
  }
  return http<PartnerCreditNote>(`/partners/firms/${encodeURIComponent(firmId)}/credit-notes`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getPartnerDebitNotes(firmId: NumericIdParam) {
  if (env.useMocks) {
    return looseMockDb.getPartnerDebitNotes(firmId);
  }
  return http<PartnerDebitNote[]>(`/partners/firms/${encodeURIComponent(firmId)}/debit-notes`);
}

export async function createPartnerDebitNote(
  firmId: NumericIdParam,
  input: {
    clientBusinessId: string;
    clientOutletId: string;
    relatedInvoiceId?: string;
    debitDate: string;
    note?: string;
    status?: "DRAFT" | "ISSUED" | "CANCELLED";
    lines: Array<{ itemId?: string; description: string; amount: number }>;
  },
) {
  if (env.useMocks) {
    return looseMockDb.createPartnerDebitNote(firmId, input);
  }
  return http<PartnerDebitNote>(`/partners/firms/${encodeURIComponent(firmId)}/debit-notes`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getPartnerSalesReport(
  firmId: NumericIdParam,
  filters: { fromDate?: string; toDate?: string; brandId?: NumericIdParam; itemId?: string; clientBusinessId?: string; clientOutletId?: string },
) {
  if (env.useMocks) {
    return looseMockDb.getPartnerSalesReport(firmId, filters);
  }
  const params = new URLSearchParams();
  if (filters.fromDate) params.set("fromDate", filters.fromDate);
  if (filters.toDate) params.set("toDate", filters.toDate);
  if (filters.brandId) params.set("brandId", String(filters.brandId));
  if (filters.itemId) params.set("itemId", filters.itemId);
  if (filters.clientBusinessId) params.set("clientBusinessId", filters.clientBusinessId);
  if (filters.clientOutletId) params.set("clientOutletId", filters.clientOutletId);
  return http<PartnerSalesReportRow[]>(
    `/partners/firms/${encodeURIComponent(firmId)}/reports/sales${params.toString() ? `?${params.toString()}` : ""}`,
  );
}

export async function getPartnerStockMovementReport(
  firmId: NumericIdParam,
  filters: { fromDate?: string; toDate?: string; brandId?: NumericIdParam; itemId?: string },
) {
  if (env.useMocks) {
    return looseMockDb.getPartnerStockMovementReport(firmId, filters);
  }
  const params = new URLSearchParams();
  if (filters.fromDate) params.set("fromDate", filters.fromDate);
  if (filters.toDate) params.set("toDate", filters.toDate);
  if (filters.brandId) params.set("brandId", String(filters.brandId));
  if (filters.itemId) params.set("itemId", filters.itemId);
  return http<PartnerStockMovementReportRow[]>(
    `/partners/firms/${encodeURIComponent(firmId)}/reports/stock-movement${params.toString() ? `?${params.toString()}` : ""}`,
  );
}

export async function getPartnerClientPurchaseHistory(
  firmId: NumericIdParam,
  filters: { fromDate?: string; toDate?: string; itemId?: string; clientBusinessId?: string; clientOutletId?: string },
) {
  if (env.useMocks) {
    return looseMockDb.getPartnerClientPurchaseHistory(firmId, filters);
  }
  const params = new URLSearchParams();
  if (filters.fromDate) params.set("fromDate", filters.fromDate);
  if (filters.toDate) params.set("toDate", filters.toDate);
  if (filters.itemId) params.set("itemId", filters.itemId);
  if (filters.clientBusinessId) params.set("clientBusinessId", filters.clientBusinessId);
  if (filters.clientOutletId) params.set("clientOutletId", filters.clientOutletId);
  return http<PartnerClientPurchaseHistoryRow[]>(
    `/partners/firms/${encodeURIComponent(firmId)}/reports/client-history${params.toString() ? `?${params.toString()}` : ""}`,
  );
}

export async function getPartnerAuditLogs(
  firmId: NumericIdParam,
  filters: { entityType?: string; fromDate?: string; toDate?: string; userId?: NumericIdParam },
) {
  if (env.useMocks) {
    return looseMockDb.getPartnerAuditLogs(firmId, filters);
  }
  const params = new URLSearchParams();
  if (filters.entityType) params.set("entityType", filters.entityType);
  if (filters.fromDate) params.set("fromDate", filters.fromDate);
  if (filters.toDate) params.set("toDate", filters.toDate);
  if (filters.userId) params.set("userId", String(filters.userId));
  return http<PartnerAuditLog[]>(
    `/partners/firms/${encodeURIComponent(firmId)}/audit${params.toString() ? `?${params.toString()}` : ""}`,
  );
}

export async function getPartnerGlobalSearch(firmId: NumericIdParam, query: string) {
  if (env.useMocks) {
    return looseMockDb.getPartnerGlobalSearch(firmId, query);
  }
  const params = new URLSearchParams();
  params.set("q", query);
  return http<PartnerGlobalSearchResult[]>(`/partners/firms/${encodeURIComponent(firmId)}/search?${params.toString()}`);
}

export async function getPartnerSuppliers(firmId: NumericIdParam, search = "") {
  if (env.useMocks) {
    return looseMockDb.getPartnerSuppliers(firmId, search);
  }
  const query = search.trim() ? `?q=${encodeURIComponent(search.trim())}` : "";
  return http<PartnerSupplier[]>(`/partners/firms/${encodeURIComponent(firmId)}/suppliers${query}`);
}

export async function validatePartnerSupplierGSTIN(firmId: NumericIdParam, gstin: string, excludeSupplierId = "") {
  if (env.useMocks) {
    return looseMockDb.validatePartnerSupplierGSTIN(firmId, gstin, excludeSupplierId);
  }
  const params = new URLSearchParams();
  params.set("gstin", gstin);
  if (excludeSupplierId) {
    params.set("excludeSupplierId", excludeSupplierId);
  }
  return http<PartnerSupplierGSTINValidation>(
    `/partners/firms/${encodeURIComponent(firmId)}/suppliers/validate-gstin?${params.toString()}`,
  );
}

export async function createPartnerSupplier(
  firmId: NumericIdParam,
  input: { supplierName: string; gstin?: string; phone?: string; address?: string },
) {
  if (env.useMocks) {
    return looseMockDb.createPartnerSupplier(firmId, input);
  }
  return http<PartnerSupplier>(`/partners/firms/${encodeURIComponent(firmId)}/suppliers`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updatePartnerSupplier(
  firmId: NumericIdParam,
  supplierId: string,
  input: { supplierName: string; gstin?: string; phone?: string; address?: string; status: "ACTIVE" | "INACTIVE" },
) {
  if (env.useMocks) {
    return looseMockDb.updatePartnerSupplier(firmId, supplierId, input);
  }
  return http<PartnerSupplier>(`/partners/firms/${encodeURIComponent(firmId)}/suppliers/${encodeURIComponent(supplierId)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function archivePartnerSupplier(firmId: NumericIdParam, supplierId: string) {
  if (env.useMocks) {
    return looseMockDb.archivePartnerSupplier(firmId, supplierId);
  }
  return http<PartnerSupplier>(`/partners/firms/${encodeURIComponent(firmId)}/suppliers/${encodeURIComponent(supplierId)}/archive`, {
    method: "POST",
  });
}

export async function getPartnerPurchases(firmId: NumericIdParam) {
  if (env.useMocks) {
    return looseMockDb.getPartnerPurchases(firmId);
  }
  return http<PartnerPurchase[]>(`/partners/firms/${encodeURIComponent(firmId)}/purchases`);
}

export async function getPartnerPurchaseById(firmId: NumericIdParam, purchaseId: string) {
  if (env.useMocks) {
    return looseMockDb.getPartnerPurchaseById(firmId, purchaseId);
  }
  return http<PartnerPurchase>(`/partners/firms/${encodeURIComponent(firmId)}/purchases/${encodeURIComponent(purchaseId)}`);
}

export async function createPartnerPurchase(
  firmId: NumericIdParam,
  input: {
    supplierId: string;
    purchaseNumber: string;
    supplierInvoiceNumber?: string;
    supplierInvoiceDate?: string;
    purchaseDate: string;
    expectedInwardDate?: string;
    notes?: string;
    items: Array<{ itemId: string; quantity: number; costPrice: number; discountPercentage?: number; taxPercentage?: number }>;
  },
) {
  if (env.useMocks) {
    return looseMockDb.createPartnerPurchase(firmId, input);
  }
  return http<PartnerPurchase>(`/partners/firms/${encodeURIComponent(firmId)}/purchases`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function orderPartnerPurchase(firmId: NumericIdParam, purchaseId: string) {
  if (env.useMocks) {
    return looseMockDb.orderPartnerPurchase(firmId, purchaseId);
  }
  return http<PartnerPurchase>(`/partners/firms/${encodeURIComponent(firmId)}/purchases/${encodeURIComponent(purchaseId)}/order`, {
    method: "POST",
  });
}

export async function getPartnerGoodsReceipts(firmId: NumericIdParam, purchaseId: string) {
  if (env.useMocks) {
    return looseMockDb.getPartnerGoodsReceipts(firmId, purchaseId);
  }
  return http<PartnerGoodsReceipt[]>(
    `/partners/firms/${encodeURIComponent(firmId)}/purchases/${encodeURIComponent(purchaseId)}/receipts`,
  );
}

export async function receivePartnerPurchase(
  firmId: NumericIdParam,
  purchaseId: string,
  input: {
    receivedDate: string;
    notes?: string;
    items: Array<{ purchaseItemId?: string; itemId?: string; receivedQuantity: number; damagedQuantity?: number; notes?: string }>;
  },
) {
  if (env.useMocks) {
    return looseMockDb.receivePartnerPurchase(firmId, purchaseId, input);
  }
  return http<PartnerPurchase>(`/partners/firms/${encodeURIComponent(firmId)}/purchases/${encodeURIComponent(purchaseId)}/receipts`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function cancelPartnerPurchase(firmId: NumericIdParam, purchaseId: string) {
  if (env.useMocks) {
    return looseMockDb.cancelPartnerPurchase(firmId, purchaseId);
  }
  return http<PartnerPurchase>(`/partners/firms/${encodeURIComponent(firmId)}/purchases/${encodeURIComponent(purchaseId)}/cancel`, {
    method: "POST",
  });
}


export async function getPartnerStock(firmId: NumericIdParam, brandId: NumericIdParam | "" = "") {
  if (env.useMocks) {
    return looseMockDb.getPartnerStock(firmId, brandId);
  }
  const query = brandId ? `?brandId=${encodeURIComponent(brandId)}` : "";
  return http<PartnerStockRow[]>(`/partners/firms/${encodeURIComponent(firmId)}/stock${query}`);
}

export async function getPartnerStockLedgerByReference(firmId: NumericIdParam, referenceType: string, referenceId: string) {
  if (env.useMocks) {
    return looseMockDb.getPartnerStockLedgerByReference(firmId, referenceType, referenceId);
  }
  const params = new URLSearchParams();
  params.set("referenceType", referenceType);
  params.set("referenceId", referenceId);
  return http<PartnerStockLedgerEntry[]>(
    `/partners/firms/${encodeURIComponent(firmId)}/stock/reference-ledger?${params.toString()}`,
  );
}

export async function getPartnerStockLedger(firmId: NumericIdParam, itemId: string, filters: PartnerStockLedgerFilters = {}) {
  if (env.useMocks) {
    return looseMockDb.getPartnerStockLedger(firmId, itemId, filters);
  }
  const params = new URLSearchParams();
  if (filters.reasonType) params.set("reasonType", filters.reasonType);
  if (filters.referenceType) params.set("referenceType", filters.referenceType);
  if (filters.fromDate) params.set("fromDate", filters.fromDate);
  if (filters.toDate) params.set("toDate", filters.toDate);
  if (filters.query?.trim()) params.set("q", filters.query.trim());
  return http<PartnerStockLedgerEntry[]>(
    `/partners/firms/${encodeURIComponent(firmId)}/stock/${encodeURIComponent(itemId)}/ledger${params.toString() ? `?${params.toString()}` : ""}`,
  );
}

export async function createPartnerStockAdjustment(
  firmId: NumericIdParam,
  input: {
    itemId: string;
    quantityDelta: number;
    reasonType: PartnerStockReasonType;
    referenceType?: string;
    referenceId?: string;
    note?: string;
  },
) {
  if (env.useMocks) {
    return looseMockDb.createPartnerStockAdjustment(firmId, input);
  }
  return http<PartnerStockLedgerEntry>(`/partners/firms/${encodeURIComponent(firmId)}/stock/adjustments`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function createPartnerStockAction(firmId: NumericIdParam, input: PartnerStockActionInput) {
  if (env.useMocks) {
    return looseMockDb.createPartnerStockAction(firmId, input);
  }
  return http<PartnerStockLedgerEntry>(`/partners/firms/${encodeURIComponent(firmId)}/stock/actions`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getPartnerInventory(firmId: NumericIdParam, brandId: NumericIdParam | "" = "") {
  if (env.useMocks) {
    return looseMockDb.getPartnerInventory(firmId, brandId);
  }
  const query = brandId ? `?brandId=${encodeURIComponent(brandId)}` : "";
  return http<PartnerInventoryItem[]>(`/partners/firms/${encodeURIComponent(firmId)}/inventory${query}`);
}

export async function getPartnerInventoryHistory(
  firmId: NumericIdParam,
  filters: { brandId?: NumericIdParam; fromDate?: string; toDate?: string; query?: string } = {},
) {
  if (env.useMocks) {
    return looseMockDb.getPartnerInventoryHistory(firmId, filters);
  }
  const params = new URLSearchParams();
  if (filters.brandId) params.set("brandId", String(filters.brandId));
  if (filters.fromDate) params.set("fromDate", filters.fromDate);
  if (filters.toDate) params.set("toDate", filters.toDate);
  if (filters.query?.trim()) params.set("q", filters.query.trim());
  return http<PartnerInventoryHistoryEntry[]>(
    `/partners/firms/${encodeURIComponent(firmId)}/inventory/history${params.toString() ? `?${params.toString()}` : ""}`,
  );
}

export async function revertPartnerSupplyInward(firmId: NumericIdParam, supplyInwardId: string, reason = "") {
  if (env.useMocks) {
    return looseMockDb.revertPartnerSupplyInward(firmId, supplyInwardId, reason);
  }
  return http<PartnerInventoryHistoryEntry>(
    `/partners/firms/${encodeURIComponent(firmId)}/inventory/supply-inwards/${encodeURIComponent(supplyInwardId)}/revert`,
    {
      method: "POST",
      body: JSON.stringify({ reason }),
    },
  );
}

export async function updatePartnerInventory(firmId: NumericIdParam, itemId: string, input: PartnerInventoryUpdateInput) {
  if (env.useMocks) {
    return looseMockDb.updatePartnerInventory(firmId, itemId, input);
  }
  return http<PartnerInventoryItem>(`/partners/firms/${encodeURIComponent(firmId)}/inventory/${encodeURIComponent(itemId)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
