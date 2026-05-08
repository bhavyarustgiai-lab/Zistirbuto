import { PartnerStatusBadge } from "@features/partners/PartnerStatusBadge";
import type { PartnerPurchaseStatus } from "@shared/types/domain";

export function PurchaseStatusBadge({ status }: { status: PartnerPurchaseStatus }) {
  return <PartnerStatusBadge status={status} />;
}
