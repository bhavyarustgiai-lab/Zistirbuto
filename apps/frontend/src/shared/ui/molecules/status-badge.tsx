import type { ReactNode } from "react";
import { AppBadge } from "@shared/ui/atoms/app-badge";
import { cn } from "@shared/lib/cn";

type StatusBadgeProps = {
  children: ReactNode;
  className?: string;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
};

const toneClassNames: Record<NonNullable<StatusBadgeProps["tone"]>, string> = {
  neutral: "border-slate-200 bg-slate-100 text-slate-600",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  danger: "border-rose-200 bg-rose-50 text-rose-700",
  info: "border-sky-200 bg-sky-50 text-sky-700",
};

export function StatusBadge({ children, className, tone = "neutral" }: StatusBadgeProps) {
  return (
    <AppBadge tone="neutral" className={cn("rounded-full px-2 py-0.5 text-xs", toneClassNames[tone], className)}>
      {children}
    </AppBadge>
  );
}
