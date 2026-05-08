import type { PartnerOrderQueueStage } from "../types";
import { getOrderStageMeta } from "../utils";
import { StatusBadge } from "@shared/ui/molecules/status-badge";

type OrderStatusBadgeProps = {
  stage: PartnerOrderQueueStage;
};

export function OrderStatusBadge({ stage }: OrderStatusBadgeProps) {
  const meta = getOrderStageMeta(stage);
  return <StatusBadge className={meta.pillClassName}>{meta.label}</StatusBadge>;
}
