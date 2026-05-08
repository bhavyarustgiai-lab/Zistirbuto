import * as React from "react";
import { cn } from "@shared/lib/cn";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:shadow-[inset_0_0_0_1px_rgba(79,70,229,0.35)]",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
