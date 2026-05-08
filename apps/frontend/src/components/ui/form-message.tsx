import * as React from "react";
import { cn } from "@shared/lib/cn";

export function FormMessage({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("pt-2 text-xs font-medium text-rose-600", className)}
      {...props}
    />
  );
}
