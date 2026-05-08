import type { PartnerAuditLog } from "@shared/types/domain";
import { ActivityTimeline } from "@features/partners/activity/ActivityTimeline";

type OrderActivityTimelineProps = {
  items: PartnerAuditLog[];
};

export function OrderActivityTimeline({ items }: OrderActivityTimelineProps) {
  return <ActivityTimeline items={items} emptyLabel="No order activity has been recorded yet." />;
}
