import type { ReactNode } from "react";
import { ScrollArea } from "@components/ui/scroll-area";
import { cn } from "@shared/lib/cn";

type SidebarProps = {
  collapsed?: boolean;
  inSheet?: boolean;
  children: ReactNode;
};

export function Sidebar({ collapsed = false, inSheet = false, children }: SidebarProps) {
  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden bg-white/95 text-slate-950 shadow-[inset_-1px_0_0_rgba(15,23,42,0.08)] backdrop-blur",
        collapsed ? "w-20" : "w-72",
        inSheet && "w-full shadow-none",
      )}
    >
      {children}
    </div>
  );
}

export function SidebarBody({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <ScrollArea className={cn("min-h-0 flex-1 px-4 py-5", className)}>
      {children}
    </ScrollArea>
  );
}
