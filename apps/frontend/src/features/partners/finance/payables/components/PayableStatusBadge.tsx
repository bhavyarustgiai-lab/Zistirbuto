import { PartnerStatusBadge } from "@features/partners/PartnerStatusBadge";
import type { PartnerPayableStatus, PartnerSupplierInvoiceStatus } from "@shared/types/domain";

type Status = PartnerPayableStatus | PartnerSupplierInvoiceStatus;

export function PayableStatusBadge({ status }: { status: Status }) {
  return <PartnerStatusBadge status={status} />;
}
