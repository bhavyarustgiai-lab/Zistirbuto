import { Badge } from "@components/ui/badge";

const toneMap: Record<string, React.ComponentProps<typeof Badge>["tone"]> = {
  DRAFT: "neutral",
  QUEUED: "neutral",
  RUNNING: "partial",
  PLACED: "neutral",
  CONFIRMED: "planned",
  PACKED: "planned",
  DISPATCHED: "planned",
  PARTIALLY_DELIVERED: "partial",
  DELIVERED: "done",
  CANCELLED: "cancelled",
  RETURNED: "cancelled",
  PARTIALLY_RETURNED: "partial",
  FINALIZED: "paid",
  ACTIVE: "active",
  REVERSED: "cancelled",
  POSTED: "done",
  ORDERED: "neutral",
  PARTIALLY_RECEIVED: "neutral",
  RECEIVED: "done",
  COMPLETED: "done",
  FAILED: "cancelled",
  INACTIVE: "inactive",
  ARCHIVED: "archived",
  ISSUED: "done",
  VOIDED: "cancelled",
  PAID: "paid",
  PARTIALLY_PAID: "partial",
  UNPAID: "unpaid",
  OVERDUE: "cancelled",
  CURRENT: "neutral",
  IN_REVIEW: "partial",
  "IN REVIEW": "partial",
};

const labelMap: Record<string, string> = {
  DRAFT: "Draft",
  PLACED: "Placed",
  CONFIRMED: "Confirmed",
  PACKED: "Packed",
  DISPATCHED: "Dispatched",
  PARTIALLY_DELIVERED: "Partially delivered",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURNED: "Returned",
  PARTIALLY_RETURNED: "Partially returned",
  ORDERED: "Placed",
  PARTIALLY_RECEIVED: "Placed",
  RECEIVED: "Received",
  COMPLETED: "Completed",
  FINALIZED: "Finalized",
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  ARCHIVED: "Archived",
  ISSUED: "Issued",
  VOIDED: "Voided",
  PAID: "Paid",
  PARTIALLY_PAID: "Partially paid",
  UNPAID: "Unpaid",
  OVERDUE: "Overdue",
  CURRENT: "Current",
  IN_REVIEW: "In review",
  "IN REVIEW": "In review",
  QUEUED: "Queued",
  RUNNING: "Running",
  FAILED: "Failed",
};

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function PartnerStatusBadge({ status }: { status: string }) {
  return (
    <Badge tone={toneMap[status] ?? "neutral"} className="h-7 rounded-full px-2.5 text-xs font-semibold">
      {labelMap[status] ?? formatStatus(status)}
    </Badge>
  );
}
