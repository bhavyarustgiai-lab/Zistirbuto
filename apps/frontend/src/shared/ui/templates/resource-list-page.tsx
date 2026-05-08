import type { ReactNode } from "react";
import { PageHeader } from "@shared/ui/organisms/page-header";

type ResourceListPageProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  filters?: ReactNode;
  children: ReactNode;
};

export function ResourceListPage({ title, description, actions, filters, children }: ResourceListPageProps) {
  return (
    <div className="grid gap-5">
      <PageHeader title={title} description={description} actions={actions} />
      {filters}
      {children}
    </div>
  );
}
