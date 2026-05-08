import { Dialog } from "@components/ui/dialog";
import { AppButton } from "@shared/ui/atoms/app-button";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive,
  loading,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} title={title} onClose={onClose}>
      <div className="grid gap-4">
        <p className="text-sm text-slate-600">{description}</p>
        <div className="flex justify-end gap-2">
          <AppButton variant="ghost" className="h-10 px-3 text-sm" disabled={loading} onClick={onClose}>
            {cancelLabel}
          </AppButton>
          <AppButton
            variant={destructive ? "destructive" : "default"}
            className="h-10 px-3 text-sm"
            disabled={loading}
            onClick={onConfirm}
          >
            {loading ? "Working..." : confirmLabel}
          </AppButton>
        </div>
      </div>
    </Dialog>
  );
}
