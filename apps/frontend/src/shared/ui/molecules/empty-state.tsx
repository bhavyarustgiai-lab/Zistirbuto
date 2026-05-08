import type { ReactNode } from "react";
import { EmptyState as ExistingEmptyState } from "@shared/ui/molecules/EmptyState";

type EmptyStateProps = {
  title?: string;
  description?: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
};

export function EmptyState({ title, description, children, action }: EmptyStateProps) {
  return (
    <div className="grid justify-items-center gap-3 text-center">
      <ExistingEmptyState>{children ?? description ?? title ?? "Nothing to show yet."}</ExistingEmptyState>
      {action}
    </div>
  );
}
