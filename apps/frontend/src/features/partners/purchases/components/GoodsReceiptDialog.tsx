import { useEffect, useMemo, useState } from "react";
import { Button } from "@components/ui/button";
import { Dialog } from "@components/ui/dialog";
import { Input } from "@components/ui/input";
import { Textarea } from "@components/ui/textarea";
import { PartnerFieldLabel } from "@features/partners/PartnerFieldLabel";
import type { PartnerPurchase } from "@shared/types/domain";
import { remainingQuantity } from "../utils";

type ReceiptLine = {
  purchaseItemId: string;
  receivedQuantity: string;
  damagedQuantity: string;
  notes: string;
};

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
  const [lines, setLines] = useState<ReceiptLine[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !purchase) return;
    setReceivedDate(new Date().toISOString().slice(0, 10));
    setNotes("");
    setLines(
      purchase.items
        .map((item) => ({
          purchaseItemId: item.id,
          receivedQuantity: String(remainingQuantity(item.quantity, item.receivedQuantity, item.damagedQuantity)),
          damagedQuantity: "0",
          notes: "",
        }))
        .filter((line) => Number(line.receivedQuantity) > 0),
    );
    setFieldErrors({});
    setFormError("");
    setSaving(false);
  }, [open, purchase]);

  const lineById = useMemo(() => {
    const map = new Map<string, PartnerPurchase["items"][number]>();
    purchase?.items.forEach((item) => map.set(item.id, item));
    return map;
  }, [purchase]);

  if (!purchase) return null;

  const updateLine = (purchaseItemId: string, patch: Partial<ReceiptLine>) => {
    setLines((current) => current.map((line) => (line.purchaseItemId === purchaseItemId ? { ...line, ...patch } : line)));
  };

  return (
    <Dialog open={open} onClose={onClose} title={`Receive stock for ${purchase.purchaseNumber}`} panelClassName="max-w-5xl">
      <div className="grid gap-4">
        <div className="grid gap-3 md:grid-cols-[180px_minmax(0,1fr)]">
          <div>
            <PartnerFieldLabel>Received date</PartnerFieldLabel>
            <Input type="date" value={receivedDate} onChange={(event) => setReceivedDate(event.target.value)} />
            {fieldErrors.receivedDate ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.receivedDate}</p> : null}
          </div>
          <div>
            <PartnerFieldLabel required={false}>GRN notes</PartnerFieldLabel>
            <Input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Optional receiving note" />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr className="border-b border-slate-200">
                <th className="px-4 py-3 font-medium">Item</th>
                <th className="px-3 py-3 text-right font-medium">Ordered</th>
                <th className="px-3 py-3 text-right font-medium">Received</th>
                <th className="px-3 py-3 text-right font-medium">Remaining</th>
                <th className="px-3 py-3 text-right font-medium">Receive</th>
                <th className="px-3 py-3 text-right font-medium">Damaged</th>
                <th className="px-4 py-3 font-medium">Line note</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => {
                const item = lineById.get(line.purchaseItemId);
                if (!item) return null;
                const remaining = remainingQuantity(item.quantity, item.receivedQuantity, item.damagedQuantity);
                return (
                  <tr key={line.purchaseItemId} className="border-b border-slate-100 last:border-b-0">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-950">{item.itemName}</div>
                      <div className="text-xs text-slate-500">SKU {item.sku || "-"}</div>
                    </td>
                    <td className="px-3 py-3 text-right">{item.quantity}</td>
                    <td className="px-3 py-3 text-right">{item.receivedQuantity}</td>
                    <td className="px-3 py-3 text-right">{remaining}</td>
                    <td className="px-3 py-3">
                      <Input
                        value={line.receivedQuantity}
                        onChange={(event) => updateLine(line.purchaseItemId, { receivedQuantity: event.target.value.replace(/\D/g, "") })}
                        className="ml-auto h-9 w-20 text-right"
                        inputMode="numeric"
                      />
                      {fieldErrors[`${line.purchaseItemId}:received`] ? (
                        <p className="mt-1 text-right text-xs text-rose-600">{fieldErrors[`${line.purchaseItemId}:received`]}</p>
                      ) : null}
                    </td>
                    <td className="px-3 py-3">
                      <Input
                        value={line.damagedQuantity}
                        onChange={(event) => updateLine(line.purchaseItemId, { damagedQuantity: event.target.value.replace(/\D/g, "") })}
                        className="ml-auto h-9 w-20 text-right"
                        inputMode="numeric"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Input value={line.notes} onChange={(event) => updateLine(line.purchaseItemId, { notes: event.target.value })} className="h-9" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div>
          <PartnerFieldLabel required={false}>Additional notes</PartnerFieldLabel>
          <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Damages, shortages, or supplier remarks" />
        </div>

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
                nextErrors.receivedDate = "Received date is required.";
              }
              const items = lines.map((line) => {
                const item = lineById.get(line.purchaseItemId);
                const receivedQuantity = Number.parseInt(line.receivedQuantity || "0", 10);
                const damagedQuantity = Number.parseInt(line.damagedQuantity || "0", 10);
                const remaining = item ? remainingQuantity(item.quantity, item.receivedQuantity, item.damagedQuantity) : 0;
                if (receivedQuantity + damagedQuantity <= 0) {
                  nextErrors[`${line.purchaseItemId}:received`] = "Enter a quantity.";
                } else if (receivedQuantity + damagedQuantity > remaining) {
                  nextErrors[`${line.purchaseItemId}:received`] = "Exceeds remaining.";
                }
                return {
                  purchaseItemId: line.purchaseItemId,
                  receivedQuantity,
                  damagedQuantity,
                  notes: line.notes.trim() || undefined,
                };
              });
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
            {saving ? "Receiving..." : "Create GRN"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
