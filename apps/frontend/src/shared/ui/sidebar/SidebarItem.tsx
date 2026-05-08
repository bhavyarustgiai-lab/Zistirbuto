import type { LucideIcon } from "lucide-react";
import { Button } from "@components/ui/button";
import { Tooltip } from "@components/ui/tooltip";
import { cn } from "@shared/lib/cn";

type SidebarItemProps = {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  collapsed?: boolean;
  onSelect: () => void;
};

export function SidebarItem({ icon: Icon, label, active = false, collapsed = false, onSelect }: SidebarItemProps) {
  const button = (
    <Button
      type="button"
      variant="ghost"
      aria-current={active ? "page" : undefined}
      aria-label={collapsed ? label : undefined}
      onClick={onSelect}
      className={cn(
        "group relative !h-10 w-full !justify-start gap-3 rounded-lg !px-3 text-left !text-sm font-medium text-slate-600 transition-[background-color,color,box-shadow] hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-[inset_0_0_0_2px_rgba(79,70,229,0.22)]",
        active && "bg-slate-100 text-slate-950 shadow-sm hover:bg-slate-100 hover:text-slate-950",
        collapsed && "mx-auto !h-10 w-10 !justify-center !px-0",
      )}
    >
      <span
        className={cn(
          "absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-transparent transition-colors",
          active && !collapsed && "bg-brand-600",
        )}
      />
      <Icon className={cn("h-[18px] w-[18px] shrink-0 transition-colors", active ? "text-slate-800" : "text-slate-500 group-hover:text-slate-800")} />
      {!collapsed ? <span className="truncate">{label}</span> : null}
    </Button>
  );

  if (!collapsed) return button;

  return (
    <Tooltip content={label} side="right" className="w-full justify-center">
      {button}
    </Tooltip>
  );
}
