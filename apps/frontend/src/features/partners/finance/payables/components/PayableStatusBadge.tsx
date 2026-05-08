import { Badge } from "@components/ui/badge";
import type { PartnerPayableStatus, PartnerSupplierInvoiceStatus } from "@shared/types/domain";
import { payableStatusLabel } from "../utils";

type Status = PartnerPayableStatus | PartnerSupplierInvoiceStatus;

export function PayableStatusBadge({ status }: { status: Status }) {
  const tone =
    status === "PAID"
      ? "paid"
      : status === "PARTIALLY_PAID" || status === "OVERDUE"
        ? "partial"
        : status === "CANCELLED"
          ? "cancelled"
          : status === "FINALIZED"
            ? "done"
            : "unpaid";
  return <Badge tone={tone}>{payableStatusLabel(status)}</Badge>;
}
