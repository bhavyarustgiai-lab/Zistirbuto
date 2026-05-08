import type { ReactNode } from "react";
import { Card } from "@components/ui/card";
import { cn } from "@shared/lib/cn";

type DataTableProps = {
  children: ReactNode;
  className?: string;
};

export function DataTable({ children, className }: DataTableProps) {
  return <Card className={cn("overflow-visible rounded-lg", className)}>{children}</Card>;
}
