import type { PartnerOrder, PartnerOrderStatus } from "@shared/types/domain";

export type EffectivePartnerOrderStatus = PartnerOrderStatus;

export function getEffectiveOrderStatus(
  order: Pick<PartnerOrder, "status" | "linkedInvoiceId" | "deliveredAt" | "cancelledAt">,
): EffectivePartnerOrderStatus {
  if (order.status === "CANCELLED" || order.cancelledAt) {
    return "CANCELLED";
  }
  if (order.status === "DELIVERED" || order.deliveredAt) {
    return "DELIVERED";
  }
  return order.status;
}
