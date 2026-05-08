import { CheckCircle2, XCircle } from "lucide-react";
import { Dialog } from "@components/ui/dialog";
import { AppButton } from "@shared/ui/atoms/app-button";
import { cn } from "@shared/lib/cn";

type StatusDialogTone = "success" | "error";

type StatusDialogProps = {
  open: boolean;
  tone: StatusDialogTone;
  title: string;
  description?: string;
  actionLabel?: string;
  onClose: () => void;
};

export function StatusDialog({
  open,
  tone,
  title,
  description,
  actionLabel = "OK",
  onClose,
}: StatusDialogProps) {
  const Icon = tone === "success" ? CheckCircle2 : XCircle;
  return (
    <Dialog open={open} title={title} onClose={onClose} hideHeader panelClassName="max-w-md">
      <div className="grid justify-items-center gap-4 py-6 text-center">
        <span
          className={cn(
            "inline-flex h-14 w-14 items-center justify-center rounded-full border",
            tone === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-600"
              : "border-rose-200 bg-rose-50 text-rose-600",
          )}
        >
          <Icon className="h-7 w-7" />
        </span>
        <div className="grid max-w-sm justify-items-center gap-2">
          <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
          {description ? <p className="text-sm leading-6 text-slate-600">{description}</p> : null}
        </div>
        <div className="flex w-full justify-center pt-1">
          <AppButton className="h-10 min-w-24 px-4 text-sm" onClick={onClose}>
            {actionLabel}
          </AppButton>
        </div>
      </div>
    </Dialog>
  );
}
