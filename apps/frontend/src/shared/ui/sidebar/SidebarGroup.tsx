import type { LucideIcon } from "lucide-react";
import { cn } from "@shared/lib/cn";
import { SidebarItem } from "./SidebarItem";

export type SidebarGroupItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
};

export function isSidebarGroupItemActive(pathname: string, item: SidebarGroupItem) {
  if (item.end) return pathname === item.to;
  return pathname === item.to || pathname.startsWith(`${item.to}/`);
}

type SidebarGroupProps = {
  label: string;
  items: SidebarGroupItem[];
  collapsed?: boolean;
  pathname: string;
  onNavigate: (to: string) => void;
};

export function SidebarGroup({ label, items, collapsed = false, pathname, onNavigate }: SidebarGroupProps) {
  if (collapsed) {
    return (
      <section aria-label={label} className="grid w-full justify-items-center gap-1.5">
        {items.map((item) => (
          <SidebarItem
            key={item.to}
            icon={item.icon}
            label={item.label}
            active={isSidebarGroupItemActive(pathname, item)}
            collapsed
            onSelect={() => onNavigate(item.to)}
          />
        ))}
      </section>
    );
  }

  return (
    <section className={cn("grid w-full gap-2")}>
      <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <div className="grid gap-1">
        {items.map((item) => (
          <SidebarItem
            key={item.to}
            icon={item.icon}
            label={item.label}
            active={isSidebarGroupItemActive(pathname, item)}
            collapsed={collapsed}
            onSelect={() => onNavigate(item.to)}
          />
        ))}
      </div>
    </section>
  );
}
