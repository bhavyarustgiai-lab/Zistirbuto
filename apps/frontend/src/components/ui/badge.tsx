import * as React from "react";
import { cn } from "@shared/lib/cn";

type Tone = "planned" | "done" | "cancelled" | "paid" | "unpaid" | "partial" | "neutral" | "active" | "inactive" | "archived";

const toneClasses: Record<Tone, string> = {
  planned: "border-orange-300 bg-orange-50 text-orange-700",
  done: "border-emerald-300 bg-emerald-50 text-emerald-700",
  cancelled: "border-rose-300 bg-rose-50 text-rose-700",
  paid: "border-emerald-300 bg-emerald-50 text-emerald-700",
  unpaid: "border-slate-300 bg-slate-50 text-slate-600",
  partial: "border-orange-300 bg-orange-50 text-orange-700",
  neutral: "border-slate-300 bg-white text-slate-600",
  active: "border-emerald-300 bg-emerald-50 text-emerald-700",
  inactive: "border-slate-300 bg-slate-100 text-slate-500",
  archived: "border-amber-300 bg-amber-50 text-amber-700"
};

export function Badge({
  className,
  tone = "neutral",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { tone?: Tone }) {
  return <div className={cn("inline-flex items-center rounded-lg border px-2 py-0.5 text-sm font-medium", toneClasses[tone], className)} {...props} />;
}
