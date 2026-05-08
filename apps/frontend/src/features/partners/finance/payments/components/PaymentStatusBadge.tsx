import { Badge } from "@components/ui/badge";
import type { PartnerInvoicePaymentStatus } from "@shared/types/domain";
import { formatPaymentStatus } from "../utils";

export function PaymentStatusBadge({ status }: { status?: PartnerInvoicePaymentStatus }) {
  const tone = status === "PAID" ? "paid" : status === "PARTIALLY_PAID" ? "partial" : status === "OVERDUE" ? "cancelled" : "unpaid";
  return <Badge tone={tone}>{formatPaymentStatus(status)}</Badge>;
}
