import { Button } from "@components/ui/button";
import { Dialog } from "@components/ui/dialog";

type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

export function ConfirmArchiveDialog({ open, title, message, confirmLabel, onClose, onConfirm }: Props) {
  return (
    <Dialog open={open} onClose={onClose} title={title}>
      <div className="grid gap-4">
        <p className="text-sm text-slate-600">{message}</p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" className="h-10 px-3 text-sm" onClick={onClose}>Cancel</Button>
          <Button
            variant="destructive"
            className="h-10 px-3 text-sm"
            onClick={async () => {
              await onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
