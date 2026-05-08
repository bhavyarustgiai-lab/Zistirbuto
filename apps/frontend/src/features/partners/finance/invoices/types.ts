import type { PartnerFirmRole, PartnerInvoice, PartnerInvoiceStatus } from "@shared/types/domain";

export type InvoiceStatusFilter = "ALL" | PartnerInvoiceStatus;

export type InvoiceListFilters = {
  search: string;
  status: InvoiceStatusFilter;
  fromDate: string;
  toDate: string;
};

export type InvoiceFinalizeResult = {
  invoice: PartnerInvoice;
  message: string;
};

export type PartnerFinanceRole = PartnerFirmRole | "";
