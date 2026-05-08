import type { PropsWithChildren } from "react";
import { cn } from "@shared/lib/cn";

export function PartnerFieldLabel({
  children,
  size = "sm",
  className,
  required = true,
}: PropsWithChildren<{ size?: "sm" | "xs"; className?: string; required?: boolean }>) {
  return (
    <p
      className={cn(
        size === "xs"
          ? "mb-1 text-xs font-medium text-slate-600"
          : "mb-1 text-sm font-medium text-slate-800",
        className,
      )}
    >
      {children}
      {required ? <span className="ml-1 text-rose-500">*</span> : null}
    </p>
  );
}
