import { PartnerStatusBadge } from "@features/partners/PartnerStatusBadge";
import type { PartnerInvoiceStatus } from "@shared/types/domain";

type Props = {
  status: PartnerInvoiceStatus;
};

export function InvoiceStatusBadge({ status }: Props) {
  return <PartnerStatusBadge status={status} />;
}
