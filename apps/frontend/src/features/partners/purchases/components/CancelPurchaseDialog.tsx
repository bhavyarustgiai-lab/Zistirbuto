import { useEffect, useState } from "react";
import { Button } from "@components/ui/button";
import { Dialog } from "@components/ui/dialog";
import { Textarea } from "@components/ui/textarea";
import { PartnerFieldLabel } from "@features/partners/PartnerFieldLabel";
import type { PartnerPurchase } from "@shared/types/domain";

type CancelPurchaseDialogProps = {
  open: boolean;
  purchase: PartnerPurchase | null;
  loading?: boolean;
  onClose: () => void;
  onCancel: (input: { reason: string }) => Promise<void>;
};

export function CancelPurchaseDialog({
  open,
  purchase,
  loading = false,
  onClose,
  onCancel,
}: CancelPurchaseDialogProps) {
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
    <Dialog open={open} onClose={onClose} title="Cancel purchase order">
      <div className="grid gap-4">
        <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <p className="font-medium text-rose-950">
            {purchase?.purchaseNumber ?? "Purchase order"}
          </p>
          <p className="mt-1">
            Cancelling a PO needs a reason so the team can understand why this order was closed.
            {purchase?.status === "PLACED"
              ? " Supplier payments or advances are handled separately in Payables and will not be changed by this action."
              : ""}
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
            placeholder="Example: Supplier cannot fulfil the order; new PO will be created."
          />
          {error ? <p className="mt-1 text-sm text-rose-600">{error}</p> : null}
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" className="h-10 px-3 text-sm" disabled={loading} onClick={onClose}>
            Keep PO
          </Button>
          <Button variant="destructive" className="h-10 px-3 text-sm" disabled={loading} onClick={() => void submit()}>
            {loading ? "Cancelling..." : "Cancel PO"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
