import type { ComponentProps } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ClipboardList,
  CreditCard,
  PackagePlus,
  Receipt,
  ReceiptText,
  Scroll,
  ShoppingCart,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@components/ui/badge";
import { cn } from "@shared/lib/cn";
import type { PartnerDashboardStats } from "@shared/types/domain";
import { mapPartnerRecentActivity, type PartnerRecentActivityCategory } from "@features/partners/recentActivity";

type Props = {
  items: PartnerDashboardStats["recentActivity"];
};

const activityStyles: Record<
  PartnerRecentActivityCategory,
  { icon: LucideIcon; iconClassName: string; badgeTone: ComponentProps<typeof Badge>["tone"] }
> = {
  ORDER: {
    icon: ShoppingCart,
    iconClassName: "bg-sky-50 text-sky-700 ring-sky-100",
    badgeTone: "neutral",
  },
  INVOICE: {
    icon: Receipt,
    iconClassName: "bg-violet-50 text-violet-700 ring-violet-100",
    badgeTone: "neutral",
  },
  PAYMENT: {
    icon: CreditCard,
    iconClassName: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    badgeTone: "paid",
  },
  PURCHASE: {
    icon: ClipboardList,
    iconClassName: "bg-amber-50 text-amber-700 ring-amber-100",
    badgeTone: "planned",
  },
  INVENTORY: {
    icon: PackagePlus,
    iconClassName: "bg-indigo-50 text-indigo-700 ring-indigo-100",
    badgeTone: "active",
  },
  CREDIT_NOTE: {
    icon: ReceiptText,
    iconClassName: "bg-teal-50 text-teal-700 ring-teal-100",
    badgeTone: "done",
  },
  DEBIT_NOTE: {
    icon: Scroll,
    iconClassName: "bg-orange-50 text-orange-700 ring-orange-100",
    badgeTone: "planned",
  },
  OTHER: {
    icon: Receipt,
    iconClassName: "bg-slate-100 text-slate-700 ring-slate-200",
    badgeTone: "neutral",
  },
};

export function RecentActivityList({ items }: Props) {
  return (
    <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
      {items.map((item) => {
        const activity = mapPartnerRecentActivity(item);
        const style = activityStyles[activity.category];
        const Icon = style.icon;
        const content = (
          <div
            className={cn(
              "flex gap-3 px-4 py-3 transition-colors",
              activity.href ? "group hover:bg-slate-50/80" : "",
            )}
          >
            <div className={cn("mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1", style.iconClassName)}>
              <Icon className="h-4 w-4" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold leading-5 text-slate-900">{activity.title}</p>
                    <Badge tone={style.badgeTone} className="rounded-md px-1.5 py-0 text-[11px] font-medium">
                      {activity.categoryLabel}
                    </Badge>
                  </div>
                  {activity.subtitle ? <p className="mt-1 text-sm leading-5 text-slate-500">{activity.subtitle}</p> : null}
                  {activity.impactText ? <p className="mt-1 text-sm font-medium leading-5 text-slate-700">{activity.impactText}</p> : null}
                </div>

                <p className="shrink-0 whitespace-nowrap pt-0.5 text-xs text-slate-400">{activity.timestampText}</p>
              </div>
            </div>
          </div>
        );

        return (
          activity.href ? <Link key={activity.id} to={activity.href}>{content}</Link> : <div key={activity.id}>{content}</div>
        );
      })}
    </div>
  );
}
