import { useEffect, useMemo, useState } from "react";
import type { PartnerOrder } from "@shared/types/domain";
import { AppButton } from "@shared/ui/atoms/app-button";
import { AppInput } from "@shared/ui/atoms/app-input";
import { Dialog } from "@components/ui/dialog";
import { Textarea } from "@components/ui/textarea";

type OrderDeliveryDialogProps = {
  open: boolean;
  order: PartnerOrder;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (input: {
    deliveryDetails: {
      deliveredDate?: string;
      recipientName?: string;
      proofReference?: string;
      notes?: string;
    };
    deliveredItems: Array<{ orderItemId: string; itemId: string; deliveredQuantity: number; returnedQuantity?: number }>;
  }) => Promise<void>;
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function digitsOnly(value: string) {
  return value.replace(/\D+/g, "");
}

function formatNumber(value: number) {
  return value.toLocaleString("en-IN");
}

export function OrderDeliveryDialog({ open, order, loading = false, onClose, onSubmit }: OrderDeliveryDialogProps) {
  const [deliveredDate, setDeliveredDate] = useState(today());
  const [recipientName, setRecipientName] = useState("");
  const [proofReference, setProofReference] = useState("");
  const [notes, setNotes] = useState("");
  const [deliveredQuantities, setDeliveredQuantities] = useState<Record<string, string>>({});
  const [returnedQuantities, setReturnedQuantities] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setDeliveredDate(order.deliveredDate || today());
    setRecipientName(order.deliveryRecipientName || "");
    setProofReference(order.deliveryProofReference || "");
    setNotes(order.deliveryNotes || "");
    setDeliveredQuantities(Object.fromEntries(order.items.map((line) => [line.id, String(Math.max((line.dispatchedQuantity ?? 0) - (line.returnedQuantity ?? 0), 0))])));
    setReturnedQuantities(Object.fromEntries(order.items.map((line) => [line.id, String(line.returnedQuantity ?? 0)])));
    setErrors({});
  }, [open, order]);

  const rows = useMemo(
    () =>
      order.items.map((line) => ({
        line,
        dispatchedQuantity: line.dispatchedQuantity ?? 0,
        deliveredQuantity: Number.parseInt(deliveredQuantities[line.id] || "0", 10) || 0,
        returnedQuantity: Number.parseInt(returnedQuantities[line.id] || "0", 10) || 0,
      })),
    [deliveredQuantities, order.items, returnedQuantities],
  );

  function clearError(lineId: string) {
    setErrors((current) => {
      const next = { ...current };
      delete next[lineId];
      delete next.form;
      return next;
    });
  }

  function validate() {
    const nextErrors: Record<string, string> = {};
    for (const row of rows) {
      if (row.deliveredQuantity + row.returnedQuantity > row.dispatchedQuantity) {
        nextErrors[row.line.id] = "Delivered + returned cannot exceed dispatched.";
      }
    }
    if (!rows.some((row) => row.deliveredQuantity > 0)) {
      nextErrors.form = "Deliver at least one item.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function submit() {
    if (!validate()) return;
    await onSubmit({
      deliveryDetails: {
        deliveredDate,
        recipientName,
        proofReference,
        notes,
      },
      deliveredItems: rows.map((row) => ({
        orderItemId: row.line.id,
        itemId: row.line.itemId,
        deliveredQuantity: row.deliveredQuantity,
        returnedQuantity: row.returnedQuantity,
      })),
    });
  }

  return (
    <Dialog open={open} title="Deliver order" onClose={onClose} panelClassName="max-w-5xl" bodyClassName="grid gap-4">
      <div className="grid gap-3 md:grid-cols-3">
        <label className="grid gap-1 text-sm text-slate-700">
          Delivered date
          <AppInput type="date" value={deliveredDate} disabled={loading} onChange={(event) => setDeliveredDate(event.target.value)} />
        </label>
        <label className="grid gap-1 text-sm text-slate-700">
          Recipient name
          <AppInput value={recipientName} disabled={loading} onChange={(event) => setRecipientName(event.target.value)} />
        </label>
        <label className="grid gap-1 text-sm text-slate-700">
          Proof/reference
          <AppInput value={proofReference} disabled={loading} onChange={(event) => setProofReference(event.target.value)} />
        </label>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr className="border-b border-slate-200">
              <th className="px-3 py-3">Item</th>
              <th className="px-3 py-3 text-right">Dispatched</th>
              <th className="px-3 py-3 text-right">Delivered</th>
              <th className="px-3 py-3 text-right">Returned</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.line.id} className="border-b border-slate-100 text-slate-700">
                <td className="px-3 py-3">
                  <div className="font-medium text-slate-900">{row.line.itemName}</div>
                  <div className="text-xs text-slate-500">{row.line.itemCode}</div>
                </td>
                <td className="px-3 py-3 text-right tabular-nums">{formatNumber(row.dispatchedQuantity)}</td>
                <td className="px-3 py-3">
                  <div className="ml-auto w-28">
                    <AppInput
                      aria-label={`Delivered quantity for ${row.line.itemName}`}
                      inputMode="numeric"
                      value={deliveredQuantities[row.line.id] ?? ""}
                      disabled={loading}
                      className="h-9 text-right tabular-nums"
                      onFocus={(event) => event.currentTarget.select()}
                      onChange={(event) => {
                        setDeliveredQuantities((current) => ({ ...current, [row.line.id]: digitsOnly(event.target.value) }));
                        clearError(row.line.id);
                      }}
                    />
                  </div>
                </td>
                <td className="px-3 py-3">
                  <div className="ml-auto w-28">
                    <AppInput
                      aria-label={`Returned quantity for ${row.line.itemName}`}
                      inputMode="numeric"
                      value={returnedQuantities[row.line.id] ?? ""}
                      disabled={loading}
                      className="h-9 text-right tabular-nums"
                      onFocus={(event) => event.currentTarget.select()}
                      onChange={(event) => {
                        setReturnedQuantities((current) => ({ ...current, [row.line.id]: digitsOnly(event.target.value) }));
                        clearError(row.line.id);
                      }}
                    />
                    {errors[row.line.id] ? <p className="mt-1 text-right text-xs text-rose-600">{errors[row.line.id]}</p> : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Textarea value={notes} disabled={loading} placeholder="Delivery notes" onChange={(event) => setNotes(event.target.value)} />
      {errors.form ? <p className="text-sm text-rose-600">{errors.form}</p> : null}

      <div className="flex justify-end gap-2 border-t border-slate-200 pt-3">
        <AppButton variant="ghost" disabled={loading} onClick={onClose}>
          Cancel
        </AppButton>
        <AppButton disabled={loading} onClick={() => void submit()}>
          {loading ? "Saving..." : "Mark Delivered"}
        </AppButton>
      </div>
    </Dialog>
  );
}
