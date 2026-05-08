import type { ComponentType } from "react";
import { Clock } from "lucide-react";

type Props = {
  icon?: ComponentType<{ className?: string }>;
  title: string;
  meta: string;
  time: string;
};

export function ActivityTimelineItem({ icon: Icon = Clock, title, meta, time }: Props) {
  return (
    <div className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-3 text-sm">
      <div className="flex justify-center">
        <span className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500">
          <Icon className="h-3.5 w-3.5" />
        </span>
      </div>
      <div className="min-w-0 border-b border-slate-100 pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-medium text-slate-950">{title}</p>
          <p className="text-xs text-slate-500">{time}</p>
        </div>
        <p className="mt-1 text-xs text-slate-500">{meta}</p>
      </div>
    </div>
  );
}
