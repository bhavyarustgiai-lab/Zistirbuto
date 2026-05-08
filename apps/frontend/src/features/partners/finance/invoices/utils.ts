import type {
  PartnerFirmMembership,
  PartnerFirmRole,
  PartnerInvoice,
  PartnerInvoiceItem,
  PartnerInvoiceStatus,
} from "@shared/types/domain";
import type { InvoiceListFilters } from "./types";

export const fallbackText = "-";

export function formatCurrency(value?: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallbackText;
  return value.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });
}

export function formatNumber(value?: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallbackText;
  return value.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

export function formatPercent(value?: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallbackText;
  return `${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}%`;
}

export function formatDate(value?: string | null) {
  if (!value) return fallbackText;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function getInvoiceTaxTotal(invoice: PartnerInvoice) {
  const explicit =
    (invoice.cgstAmount ?? 0) +
    (invoice.sgstAmount ?? 0) +
    (invoice.igstAmount ?? 0);
  if (explicit > 0) return explicit;
  const fromLines = invoice.items.reduce((sum, item) => sum + (item.totalTaxAmount ?? 0), 0);
  return fromLines || undefined;
}

export function getInvoiceFinalTotal(invoice: PartnerInvoice) {
  return invoice.finalTotalAmount ?? invoice.amount;
}

export function getInvoiceOutstanding(invoice: PartnerInvoice) {
  return invoice.dueAmount ?? Math.max(getInvoiceFinalTotal(invoice) - (invoice.paidAmount ?? 0), 0);
}

export function getInvoiceTaxableAmount(invoice: PartnerInvoice) {
  return invoice.taxableAmount ?? invoice.items.reduce((sum, item) => sum + (item.taxableValue ?? item.rate * item.quantity), 0);
}

export function getLineTaxableAmount(item: PartnerInvoiceItem) {
  return item.taxableValue ?? item.rate * item.quantity;
}

export function getLineDiscountAmount(item: PartnerInvoiceItem) {
  return item.discountAmount ?? Math.max(item.mrp * item.quantity - item.rate * item.quantity, 0);
}

export function filterInvoices(invoices: PartnerInvoice[], filters: InvoiceListFilters) {
  const term = filters.search.trim().toLowerCase();
  return invoices.filter((invoice) => {
    if (filters.status !== "ALL" && invoice.status !== filters.status) return false;
    if (filters.fromDate && invoice.invoiceDate < filters.fromDate) return false;
    if (filters.toDate && invoice.invoiceDate > filters.toDate) return false;
    if (!term) return true;
    return [
      invoice.invoiceNumber,
      invoice.clientBusinessName,
      invoice.clientOutletName,
      invoice.orderId ?? "",
      invoice.dispatchReference ?? "",
    ].some((value) => value.toLowerCase().includes(term));
  });
}

export function canFinalizeInvoiceRole(role: PartnerFirmRole | "") {
  return role === "OWNER" || role === "ACCOUNTANT";
}

export function findCurrentPartnerRole(
  memberships: PartnerFirmMembership[],
  firmId: number | string,
  userId?: number | string,
): PartnerFirmRole | "" {
  if (!firmId || !userId) return "";
  return memberships.find(
    (membership) =>
      membership.firmId === Number(firmId) &&
      membership.userId === Number(userId) &&
      membership.status === "ACTIVE" &&
      canFinalizeInvoiceRole(membership.role),
  )?.role ?? memberships.find(
    (membership) =>
      membership.firmId === Number(firmId) &&
      membership.userId === Number(userId) &&
      membership.status === "ACTIVE",
  )?.role ?? "";
}

export function invoiceStatusLabel(status: PartnerInvoiceStatus) {
  if (status === "DRAFT") return "Draft";
  if (status === "FINALIZED") return "Finalized";
  return "Cancelled";
}
