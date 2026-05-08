import { Dialog } from "@components/ui/dialog";
import { Button } from "@components/ui/button";
import type { PartnerInvoice } from "@shared/types/domain";

type Props = {
  invoice: PartnerInvoice | null;
  open: boolean;
  loading: boolean;
  error?: string;
  onClose: () => void;
  onConfirm: () => void;
};

export function FinalizeInvoiceDialog({ invoice, open, loading, error, onClose, onConfirm }: Props) {
  return (
    <Dialog open={open} title="Finalize this invoice?" onClose={onClose}>
      <div className="grid gap-4">
        <div className="grid gap-2 text-sm leading-6 text-slate-600">
          <p>
            After finalization, invoice line items, taxes, and totals will be locked.
            Corrections must be handled through credit or debit notes.
          </p>
          {invoice ? (
            <p className="font-medium text-slate-900">
              {invoice.invoiceNumber} · {invoice.clientBusinessName}
            </p>
          ) : null}
        </div>
        {error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">
            {error}
          </div>
        ) : null}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" className="h-10 px-3 text-sm" disabled={loading} onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" className="h-10 px-3 text-sm" disabled={loading} onClick={onConfirm}>
            {loading ? "Finalizing..." : "Finalize Invoice"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
