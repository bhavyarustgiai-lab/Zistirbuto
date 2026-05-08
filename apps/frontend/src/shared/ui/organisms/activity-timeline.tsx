import type { ReactNode } from "react";

type ActivityTimelineProps = {
  items?: Array<{ id: string; title: ReactNode; description?: ReactNode; timestamp?: ReactNode }>;
};

export function ActivityTimeline({ items = [] }: ActivityTimelineProps) {
  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <div key={item.id} className="grid gap-1 border-l-2 border-slate-200 pl-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-slate-900">{item.title}</p>
            {item.timestamp ? <span className="text-xs text-slate-400">{item.timestamp}</span> : null}
          </div>
          {item.description ? <p className="text-sm text-slate-500">{item.description}</p> : null}
        </div>
      ))}
    </div>
  );
}
