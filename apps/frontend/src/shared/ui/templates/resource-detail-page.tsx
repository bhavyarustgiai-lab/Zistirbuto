import type { ReactNode } from "react";
import { PageHeader } from "@shared/ui/organisms/page-header";

type ResourceDetailPageProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function ResourceDetailPage({ title, description, actions, children }: ResourceDetailPageProps) {
  return (
    <div className="grid gap-5">
      <PageHeader title={title} description={description} actions={actions} />
      {children}
    </div>
  );
}
