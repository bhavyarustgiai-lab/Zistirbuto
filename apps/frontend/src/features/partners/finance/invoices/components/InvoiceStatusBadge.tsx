import { Badge } from "@components/ui/badge";
import type { PartnerInvoiceStatus } from "@shared/types/domain";
import { invoiceStatusLabel } from "../utils";

type Props = {
  status: PartnerInvoiceStatus;
};

export function InvoiceStatusBadge({ status }: Props) {
  const tone = status === "FINALIZED" ? "done" : status === "CANCELLED" ? "cancelled" : "neutral";
  return <Badge tone={tone}>{invoiceStatusLabel(status)}</Badge>;
}
