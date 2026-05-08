import {
  finalizePartnerInvoice,
  getPartnerInvoiceById,
  getPartnerInvoices,
  getPartnerFirmMemberships,
} from "@entities/partners/api";

export const financeInvoicesApi = {
  list: getPartnerInvoices,
  detail: getPartnerInvoiceById,
  finalize: finalizePartnerInvoice,
  memberships: getPartnerFirmMemberships,
};
