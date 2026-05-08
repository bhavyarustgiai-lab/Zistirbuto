import { Badge } from "@components/ui/badge";

export type JobStatus = "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";

const labelByStatus: Record<JobStatus, string> = {
  QUEUED: "Queued",
  RUNNING: "Running",
  COMPLETED: "Completed",
  FAILED: "Failed",
};

const toneByStatus: Record<JobStatus, "neutral" | "partial" | "done" | "cancelled"> = {
  QUEUED: "neutral",
  RUNNING: "partial",
  COMPLETED: "done",
  FAILED: "cancelled",
};

export function JobStatusBadge({ status }: { status: JobStatus }) {
  return (
    <Badge tone={toneByStatus[status]} className="h-7 rounded-full px-2.5 text-xs">
      {labelByStatus[status]}
    </Badge>
  );
}
