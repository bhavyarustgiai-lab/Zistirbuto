import { PartnerStatusBadge } from "@features/partners/PartnerStatusBadge";
import type { PartnerInvoicePaymentStatus } from "@shared/types/domain";

export function PaymentStatusBadge({ status }: { status?: PartnerInvoicePaymentStatus }) {
  return <PartnerStatusBadge status={status ?? "UNPAID"} />;
}
