import { Badge } from "@components/ui/badge";

const toneMap: Record<string, React.ComponentProps<typeof Badge>["tone"]> = {
  DRAFT: "neutral",
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
  ORDERED: "planned",
  PARTIALLY_RECEIVED: "partial",
  RECEIVED: "done",
  INACTIVE: "inactive",
  ARCHIVED: "archived",
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
  ORDERED: "Ordered",
  PARTIALLY_RECEIVED: "Partially received",
  RECEIVED: "Received",
};

export function PartnerStatusBadge({ status }: { status: string }) {
  return <Badge tone={toneMap[status] ?? "neutral"}>{labelMap[status] ?? status}</Badge>;
}
