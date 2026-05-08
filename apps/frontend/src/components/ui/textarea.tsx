import * as React from "react";
import { cn } from "@shared/lib/cn";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "min-h-24 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:shadow-[inset_0_0_0_1px_rgba(79,70,229,0.35)]",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";
