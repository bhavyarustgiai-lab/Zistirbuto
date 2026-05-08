import * as React from "react";
import { cn } from "@shared/lib/cn";

export function ScrollArea({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("overflow-auto", className)} {...props} />;
}
