import { useEffect, useState } from "react";
import { Button } from "@components/ui/button";
import { Dialog } from "@components/ui/dialog";
import { Textarea } from "@components/ui/textarea";
import { PartnerFieldLabel } from "@features/partners/PartnerFieldLabel";
import type { PartnerSupplierReturn } from "@shared/types/domain";

type CancelSupplierReturnDialogProps = {
  open: boolean;
  supplierReturn: PartnerSupplierReturn | null;
  loading?: boolean;
  onClose: () => void;
  onCancel: (input: { reason: string }) => Promise<void>;
};

export function CancelSupplierReturnDialog({
  open,
  supplierReturn,
  loading = false,
  onClose,
  onCancel,
}: CancelSupplierReturnDialogProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setReason("");
      setError("");
    }
  }, [open]);

  async function submit() {
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      setError("Cancellation reason is required.");
      return;
    }
    setError("");
    await onCancel({ reason: trimmedReason });
  }

  return (
    <Dialog open={open} onClose={onClose} title="Cancel return">
      <div className="grid gap-4">
        <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <p className="font-medium text-rose-950">{supplierReturn?.returnNumber ?? "Supplier return"}</p>
          <p className="mt-1">
            Cancelling a return needs a reason so the team can understand why this return was closed.
            {supplierReturn?.status === "PLACED" ? " Reserved stock will be released back to available inventory." : ""}
          </p>
        </div>

        <div>
          <PartnerFieldLabel>Cancellation reason</PartnerFieldLabel>
          <Textarea
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
              if (error) setError("");
            }}
            placeholder="Example: Supplier refused pickup; return will be recreated later."
          />
          {error ? <p className="mt-1 text-sm text-rose-600">{error}</p> : null}
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" className="h-10 px-3 text-sm" disabled={loading} onClick={onClose}>
            Keep return
          </Button>
          <Button variant="destructive" className="h-10 px-3 text-sm" disabled={loading} onClick={() => void submit()}>
            {loading ? "Cancelling..." : "Cancel return"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
