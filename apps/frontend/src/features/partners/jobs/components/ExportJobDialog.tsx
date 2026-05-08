import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Download, Loader2 } from "lucide-react";
import { Button } from "@components/ui/button";
import { Dialog } from "@components/ui/dialog";
import { JobStatusBadge, type JobStatus } from "./JobStatusBadge";

type ExportFormat = "CSV" | "PDF";

type Props = {
  open: boolean;
  title: string;
  description: string;
  completedLabel?: string;
  formats?: ExportFormat[];
  onClose: () => void;
  onDownload: (format: ExportFormat) => void;
};

export function ExportJobDialog({
  open,
  title,
  description,
  completedLabel = "Your export is ready.",
  formats = ["CSV"],
  onClose,
  onDownload,
}: Props) {
  const [status, setStatus] = useState<JobStatus>("QUEUED");
  const [error, setError] = useState("");
  const canDownload = status === "COMPLETED";

  useEffect(() => {
    if (!open) return undefined;
    setStatus("QUEUED");
    setError("");
    const queuedTimer = window.setTimeout(() => setStatus("RUNNING"), 450);
    const completedTimer = window.setTimeout(() => setStatus("COMPLETED"), 1200);
    return () => {
      window.clearTimeout(queuedTimer);
      window.clearTimeout(completedTimer);
    };
  }, [open]);

  const icon = useMemo(() => {
    if (status === "FAILED") return <AlertCircle className="h-5 w-5 text-rose-600" />;
    if (status === "COMPLETED") return <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
    return <Loader2 className="h-5 w-5 animate-spin text-slate-500" />;
  }, [status]);

  function handleDownload(format: ExportFormat) {
    try {
      onDownload(format);
    } catch {
      setStatus("FAILED");
      setError("Export could not be downloaded. Please try again.");
    }
  }

  return (
    <Dialog open={open} title={title} onClose={onClose} panelClassName="max-w-md">
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="mt-0.5">{icon}</div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-slate-950">
                {status === "COMPLETED" ? completedLabel : "Generating export..."}
              </p>
              <JobStatusBadge status={status} />
            </div>
            <p className="mt-1 text-sm leading-5 text-slate-600">{description}</p>
            {error ? <p className="mt-2 text-sm text-rose-600">{error}</p> : null}
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" className="h-9 px-3 text-sm" onClick={onClose}>
            Close
          </Button>
          {formats.map((format) => (
            <Button
              key={format}
              type="button"
              className="h-9 px-3 text-sm"
              disabled={!canDownload}
              onClick={() => handleDownload(format)}
            >
              <Download className="mr-1.5 h-4 w-4" />
              Download {format}
            </Button>
          ))}
        </div>
      </div>
    </Dialog>
  );
}
