import type { PartnerOrder, PartnerOrderAllocationStatus, PartnerOrderQueueStage } from "./types";

export const orderQueueStages: PartnerOrderQueueStage[] = ["DRAFT", "CONFIRMED", "PACKED", "DISPATCHED"];

export function parseOrderTimestamp(order: PartnerOrder) {
  const value = order.createdAt || `${order.orderDate}T00:00:00`;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date(order.orderDate) : date;
}

export function formatCreatedTime(order: PartnerOrder) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(parseOrderTimestamp(order));
}

export function isNewOrder(order: PartnerOrder) {
  const left = parseOrderTimestamp(order);
  const right = new Date();
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate();
}

export function deriveOrderSource(order: PartnerOrder) {
  const note = (order.notes || "").toLowerCase();
  if (note.includes("salon")) return "Outlet";
  if (!order.createdByName) return "Outlet";
  return "Distributor";
}

export function getEffectiveOrderStatus(order: PartnerOrder) {
  if (order.status === "DRAFT" || order.status === "PLACED") return "DRAFT";
  return order.status;
}

export function getQueueStage(order: PartnerOrder): PartnerOrderQueueStage | null {
  const status = getEffectiveOrderStatus(order);
  if (status === "CANCELLED" || status === "DELIVERED" || status === "RETURNED" || status === "PARTIALLY_DELIVERED") {
    return null;
  }
  if (status === "PACKED") {
    return "PACKED";
  }
  if (status === "DISPATCHED" || status === "PARTIALLY_RETURNED") {
    return "DISPATCHED";
  }
  if (status === "CONFIRMED") {
    return "CONFIRMED";
  }
  return "DRAFT";
}

export function getOpenBackorderQuantity(order: PartnerOrder) {
  return (order.unfulfilledItems ?? [])
    .filter((item) => item.status !== "CANCELLED" && item.openQuantity > 0)
    .reduce((sum, item) => sum + item.openQuantity, 0);
}

export function getOrderFulfillmentStats(order: PartnerOrder) {
  const stage = getQueueStage(order);
  const requestedLines = order.requestedItems?.length ? order.requestedItems : order.items;
  const requestedQuantity = requestedLines.reduce((sum, line) => sum + line.quantity, 0) || order.totalQuantity;
  const allocatedQuantity = stage === "DRAFT" ? 0 : order.items.reduce((sum, line) => sum + line.quantity, 0);
  const openBackorderQuantity = getOpenBackorderQuantity(order);
  const backorderQuantity = Math.max(openBackorderQuantity, requestedQuantity - allocatedQuantity, 0);

  return {
    requestedQuantity,
    allocatedQuantity,
    backorderQuantity,
  };
}

export function getOrderAllocationStatus(order: PartnerOrder): PartnerOrderAllocationStatus {
  const stage = getQueueStage(order);
  if (stage === "DRAFT") return "DRAFT";
  if (stage === "PACKED") return "PACKED";
  if (stage === "DISPATCHED") return "DISPATCHED";

  const stats = getOrderFulfillmentStats(order);
  if (stats.allocatedQuantity >= stats.requestedQuantity && stats.backorderQuantity === 0) {
    return "READY_TO_PACK";
  }
  if (stats.allocatedQuantity > 0 && stats.backorderQuantity > 0) {
    return "PARTIAL";
  }
  return "BLOCKED";
}

export function getOrderAllocationStatusMeta(status: PartnerOrderAllocationStatus) {
  switch (status) {
    case "DRAFT":
      return {
        label: "Draft",
        tone: "neutral" as const,
      };
    case "READY_TO_PACK":
      return {
        label: "Ready to Pack",
        tone: "success" as const,
      };
    case "PARTIAL":
      return {
        label: "Partial",
        tone: "warning" as const,
      };
    case "BLOCKED":
      return {
        label: "Blocked",
        tone: "danger" as const,
      };
    case "PACKED":
      return {
        label: "Packed",
        tone: "neutral" as const,
      };
    case "DISPATCHED":
      return {
        label: "Dispatched",
        tone: "neutral" as const,
      };
  }
}

export function getOrderStageMeta(stage: PartnerOrderQueueStage) {
  switch (stage) {
    case "DRAFT":
      return {
        label: "Draft",
        pillClassName: "border-sky-100 bg-sky-50 text-sky-700",
        sectionClassName: "border-l-sky-400",
      };
    case "CONFIRMED":
      return {
        label: "Confirmed",
        pillClassName: "border-amber-100 bg-amber-50 text-amber-700",
        sectionClassName: "border-l-amber-400",
      };
    case "PACKED":
      return {
        label: "Packed",
        pillClassName: "border-violet-100 bg-violet-50 text-violet-700",
        sectionClassName: "border-l-violet-400",
      };
    case "DISPATCHED":
      return {
        label: "Dispatched",
        pillClassName: "border-slate-200 bg-slate-100 text-slate-600",
        sectionClassName: "border-l-slate-300",
      };
  }
}

export function canConfirmOrder(order: PartnerOrder) {
  return getQueueStage(order) === "DRAFT";
}

export function hasAllocatedOrderItems(order: PartnerOrder) {
  return (order.items ?? []).some((line) => Boolean(line.billableLineId) && line.quantity > 0);
}

export function canPackOrder(order: PartnerOrder) {
  return getQueueStage(order) === "CONFIRMED" && hasAllocatedOrderItems(order);
}

export function canDispatchOrder(order: PartnerOrder) {
  return getQueueStage(order) === "PACKED";
}

export function canCancelOrder(order: PartnerOrder) {
  const stage = getQueueStage(order);
  return stage === "DRAFT" || stage === "CONFIRMED" || stage === "PACKED";
}

export function canReturnOrder(order: PartnerOrder) {
  const status = getEffectiveOrderStatus(order);
  return status === "DISPATCHED" || status === "PARTIALLY_DELIVERED" || status === "DELIVERED" || status === "PARTIALLY_RETURNED";
}

export function getPrimaryActionLabel(order: PartnerOrder) {
  const stage = getQueueStage(order);
  if (stage === "DRAFT") return "Open Order";
  if (stage === "CONFIRMED") return canPackOrder(order) ? "Mark Packed" : "Cancel Order";
  if (stage === "PACKED") return "Mark Dispatched";
  if (stage === "DISPATCHED") return "Mark Delivered";
  return "Open Order";
}
