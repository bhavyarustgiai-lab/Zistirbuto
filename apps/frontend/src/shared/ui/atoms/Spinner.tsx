import type { HTMLAttributes } from "react";
import { cn } from "@shared/lib/cn";

export function Spinner({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn("inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-brand-500", className)}
      {...props}
    />
  );
}
