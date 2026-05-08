import type { HTMLAttributes } from "react";
import { Badge } from "@components/ui/badge";

export type AppBadgeProps = HTMLAttributes<HTMLDivElement> & {
  tone?: "planned" | "done" | "cancelled" | "paid" | "unpaid" | "partial" | "neutral" | "active" | "inactive" | "archived";
};

export function AppBadge(props: AppBadgeProps) {
  return <Badge {...props} />;
}
