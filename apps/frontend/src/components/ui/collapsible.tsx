import * as React from "react";
import { cn } from "@shared/lib/cn";

export function Collapsible({
  open,
  children,
  className,
}: React.PropsWithChildren<{ open: boolean; className?: string }>) {
  return (
    <div
      data-state={open ? "open" : "closed"}
      className={cn(
        "grid transition-[grid-template-rows,opacity] duration-200 ease-out",
        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        className,
      )}
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}
