import type { ReactNode } from "react";
import { cn } from "@shared/lib/cn";

type FilterBarProps = {
  children: ReactNode;
  className?: string;
};

export function FilterBar({ children, className }: FilterBarProps) {
  return <div className={cn("grid gap-3 rounded-lg border border-slate-200 bg-white p-3", className)}>{children}</div>;
}
