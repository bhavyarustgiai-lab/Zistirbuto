import type { PartnerAuditLog } from "@shared/types/domain";
import { ActivityTimeline } from "@features/partners/activity/ActivityTimeline";

type Props = {
  items: PartnerAuditLog[];
};

export function InvoiceActivity({ items }: Props) {
  if (items.length === 0) return null;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-slate-950">Activity</p>
      <div className="mt-3">
        <ActivityTimeline items={items} emptyLabel="No invoice activity has been recorded yet." />
      </div>
    </section>
  );
}
