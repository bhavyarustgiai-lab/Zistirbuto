import { useEffect, useMemo, useState } from "react";
import { Button } from "@components/ui/button";
import { Dialog } from "@components/ui/dialog";
import { Input } from "@components/ui/input";
import { Textarea } from "@components/ui/textarea";
import { PartnerFieldLabel } from "@features/partners/PartnerFieldLabel";
import type { PartnerPurchase } from "@shared/types/domain";
import { formatMoney } from "../utils";

type Props = {
  open: boolean;
  purchase: PartnerPurchase | null;
  onClose: () => void;
  onSubmit: (input: {
    receivedDate: string;
    notes?: string;
    items: Array<{ purchaseItemId: string; receivedQuantity: number; damagedQuantity?: number; notes?: string }>;
  }) => Promise<void>;
};

export function GoodsReceiptDialog({ open, purchase, onClose, onSubmit }: Props) {
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !purchase) return;
    setReceivedDate(new Date().toISOString().slice(0, 10));
    setNotes("");
    setFieldErrors({});
    setFormError("");
    setSaving(false);
  }, [open, purchase]);

  const pendingItems = useMemo(
    () =>
      (purchase?.items ?? []).map((item) => ({
        ...item,
        inwardQuantity: Math.max(item.quantity - item.receivedQuantity - item.damagedQuantity, 0),
      })),
    [purchase?.items],
  );
  const inwardTotal = useMemo(
    () =>
      pendingItems.reduce((sum, item) => {
        const proratedLineTotal = item.quantity > 0 ? (item.lineTotal * item.inwardQuantity) / item.quantity : 0;
        return sum + proratedLineTotal;
      }, 0),
    [pendingItems],
  );

  if (!purchase) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Record stock inward for ${purchase.purchaseNumber}`}
      panelClassName="!max-w-[72rem]"
    >
      <div className="grid gap-4">
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Edit items and quantities before recording inward. This will add the listed quantities to stock and mark the purchase order completed.
        </div>

        <div className="grid gap-3 md:grid-cols-[180px_minmax(0,1fr)]">
          <div>
            <PartnerFieldLabel>Inward date</PartnerFieldLabel>
            <Input type="date" value={receivedDate} onChange={(event) => setReceivedDate(event.target.value)} />
            {fieldErrors.receivedDate ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.receivedDate}</p> : null}
          </div>
          <div>
            <PartnerFieldLabel required={false}>Inward note</PartnerFieldLabel>
            <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Optional stock inward remarks" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 text-sm">
          <div className="hidden grid-cols-[minmax(0,1fr)_6.5rem_8rem_7rem_6rem_10rem] gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-500 md:grid">
            <span>Item</span>
            <span className="text-right">Quantity</span>
            <span className="text-right">Cost</span>
            <span className="text-right">Discount %</span>
            <span className="text-right">GST %</span>
            <span className="text-right">Line total</span>
          </div>
          <div className="divide-y divide-slate-100">
            {pendingItems.map((item) => {
              const inwardLineTotal = item.quantity > 0 ? (item.lineTotal * item.inwardQuantity) / item.quantity : 0;
              return (
                <div
                  key={item.id}
                  className="grid gap-3 px-4 py-3 md:grid-cols-[minmax(0,1fr)_6.5rem_8rem_7rem_6rem_10rem] md:items-center md:gap-4"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium text-slate-950">{item.itemName}</div>
                    <div className="truncate text-xs text-slate-500">SKU {item.sku || "-"}</div>
                  </div>
                  <div className="flex items-center justify-between gap-3 md:block md:text-right">
                    <span className="text-xs font-medium text-slate-500 md:hidden">Quantity</span>
                    <span className="tabular-nums text-slate-950">{item.inwardQuantity}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 md:block md:text-right">
                    <span className="text-xs font-medium text-slate-500 md:hidden">Cost</span>
                    <span className="tabular-nums text-slate-950">{formatMoney(item.costPrice)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 md:block md:text-right">
                    <span className="text-xs font-medium text-slate-500 md:hidden">Discount %</span>
                    <span className="tabular-nums text-slate-950">{item.discountPercentage ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 md:block md:text-right">
                    <span className="text-xs font-medium text-slate-500 md:hidden">GST %</span>
                    <span className="tabular-nums text-slate-950">{item.taxPercentage ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 md:block md:text-right">
                    <span className="text-xs font-medium text-slate-500 md:hidden">Line total</span>
                    <span className="font-medium tabular-nums text-slate-950">{formatMoney(inwardLineTotal)}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="grid gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3 md:grid-cols-[minmax(0,1fr)_10rem] md:items-center">
            <span className="font-semibold text-slate-950">Total</span>
            <span className="text-right text-base font-semibold tabular-nums text-slate-950">{formatMoney(inwardTotal)}</span>
          </div>
        </div>

        {fieldErrors.items ? <p className="text-sm text-rose-600">{fieldErrors.items}</p> : null}
        {formError ? <p className="text-sm text-rose-600">{formError}</p> : null}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" className="h-10 px-3 text-sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="h-10 px-3 text-sm"
            disabled={saving}
            onClick={async () => {
              const nextErrors: Record<string, string> = {};
              if (!receivedDate) {
                nextErrors.receivedDate = "Inward date is required.";
              }
              const items = pendingItems
                .map((item) => ({
                  purchaseItemId: item.id,
                  receivedQuantity: item.inwardQuantity,
                  damagedQuantity: 0,
                }))
                .filter((item) => item.receivedQuantity > 0);
              if (items.length === 0) {
                nextErrors.items = "No pending stock quantity is available to record inward.";
              }
              setFieldErrors(nextErrors);
              if (Object.keys(nextErrors).length > 0) return;
              setSaving(true);
              setFormError("");
              try {
                await onSubmit({ receivedDate, notes: notes.trim() || undefined, items });
                onClose();
              } catch (err) {
                setFormError(err instanceof Error ? err.message : "Something went wrong, please try again later");
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? "Recording..." : "Record stock inward"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
