import type { PartnerInvoice, PartnerInvoicePaymentStatus, PartnerPaymentMode } from "@shared/types/domain";
import type { PaymentEntryErrors, PaymentEntryValues } from "./types";

export const paymentModeOptions: Array<{ value: PartnerPaymentMode; label: string }> = [
  { value: "CASH", label: "Cash" },
  { value: "UPI", label: "UPI" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "OTHER", label: "Other" },
];

export function formatPaymentMode(mode: string) {
  return paymentModeOptions.find((option) => option.value === mode)?.label ?? mode;
}

export function formatPaymentStatus(status?: PartnerInvoicePaymentStatus) {
  if (status === "PARTIALLY_PAID") return "Partially paid";
  if (status === "PAID") return "Paid";
  if (status === "OVERDUE") return "Overdue";
  return "Unpaid";
}

export function invoiceOutstanding(invoice: PartnerInvoice) {
  return invoice.dueAmount ?? Math.max((invoice.finalTotalAmount ?? invoice.amount) - (invoice.paidAmount ?? 0), 0);
}

export function validatePaymentEntry(values: PaymentEntryValues, invoice?: PartnerInvoice | null) {
  const errors: PaymentEntryErrors = {};
  const amount = Number(values.amount);
  if (!values.paymentDate) errors.paymentDate = "Payment date is required.";
  if (!values.invoiceId) errors.invoiceId = "Invoice is required.";
  if (!values.paymentMode) errors.paymentMode = "Payment mode is required.";
  if (!Number.isFinite(amount) || amount <= 0) {
    errors.amount = "Amount must be greater than zero.";
  } else if (invoice && amount > invoiceOutstanding(invoice)) {
    errors.amount = "Amount cannot exceed outstanding.";
  }
  return errors;
}
