import { PartnerStatusBadge } from "@features/partners/PartnerStatusBadge";

export type JobStatus = "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";

export function JobStatusBadge({ status }: { status: JobStatus }) {
  return <PartnerStatusBadge status={status} />;
}
