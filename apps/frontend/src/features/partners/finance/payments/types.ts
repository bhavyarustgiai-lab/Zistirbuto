import type { PartnerInvoice, PartnerPaymentMode } from "@shared/types/domain";

export type PaymentFilters = {
  search: string;
  fromDate: string;
  toDate: string;
};

export type PaymentEntryValues = {
  paymentDate: string;
  invoiceId: string;
  amount: string;
  paymentMode: PartnerPaymentMode | "";
  referenceNumber: string;
  collectedByUserId: string;
  notes: string;
};

export type PaymentEntryErrors = Partial<Record<keyof PaymentEntryValues | "form", string>>;

export type PayableInvoice = PartnerInvoice & {
  outstandingAmount: number;
};
