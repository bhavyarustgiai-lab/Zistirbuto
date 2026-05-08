import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@components/ui/button";
import { cn } from "@shared/lib/cn";

type SidebarHeaderProps = {
  collapsed?: boolean;
  showCollapseToggle?: boolean;
  onToggleCollapsed?: () => void;
};

export function SidebarHeader({
  collapsed = false,
  showCollapseToggle = true,
  onToggleCollapsed,
}: SidebarHeaderProps) {
  return (
    <div
      className={cn(
        "sticky top-0 z-20 flex h-16 items-center border-b border-slate-200/70 bg-white/95 px-3 backdrop-blur",
        collapsed ? "justify-center" : "justify-end",
      )}
    >
      {showCollapseToggle ? (
        <Button
          type="button"
          variant="ghost"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="!h-9 w-9 shrink-0 rounded-lg !px-0 text-muted-foreground transition-[background-color,color,box-shadow] hover:bg-muted hover:text-slate-950 focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-[inset_0_0_0_2px_rgba(79,70,229,0.22)]"
          onClick={onToggleCollapsed}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      ) : null}
    </div>
  );
}
