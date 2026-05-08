import type { PartnerPayableStatus, PartnerPaymentMode, PartnerSupplierInvoiceStatus } from "@shared/types/domain";

export const supplierPaymentModeOptions: Array<{ value: PartnerPaymentMode; label: string }> = [
  { value: "CASH", label: "Cash" },
  { value: "UPI", label: "UPI" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "OTHER", label: "Other" },
];

export function formatMoney(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function formatDate(value?: string) {
  return value ? value.slice(0, 10) : "-";
}

export function payableStatusLabel(status: PartnerPayableStatus | PartnerSupplierInvoiceStatus) {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
