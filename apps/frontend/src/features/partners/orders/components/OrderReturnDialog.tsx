import { useEffect, useMemo, useState } from "react";
import { Drawer } from "@components/ui/drawer";
import { Textarea } from "@components/ui/textarea";
import { AppButton } from "@shared/ui/atoms/app-button";
import { AppInput } from "@shared/ui/atoms/app-input";
import { FormField } from "@shared/ui/molecules/form-field";
import type { CreatePartnerOrderReturnInput, PartnerOrder } from "../types";

type OrderReturnDialogProps = {
  open: boolean;
  order: PartnerOrder;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (input: CreatePartnerOrderReturnInput) => Promise<void>;
};

type DraftLine = {
  orderItemId: string;
  itemName: string;
  itemCode: string;
  returnableQuantity: number;
  quantity: string;
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

export function OrderReturnDialog({ open, order, loading = false, onClose, onSubmit }: OrderReturnDialogProps) {
  const [returnDate, setReturnDate] = useState(today());
  const [note, setNote] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setReturnDate(today());
    setNote("");
    setErrors({});
    setLines(
      order.items.map((line) => ({
        orderItemId: line.id,
        itemName: line.itemName,
        itemCode: line.itemCode,
        returnableQuantity: Math.max((line.dispatchedQuantity ?? 0) - (line.returnedQuantity ?? 0), 0),
        quantity: "",
      })),
    );
  }, [open, order.items]);

  const activeLines = useMemo(() => lines.filter((line) => line.returnableQuantity > 0), [lines]);

  function patchLine(orderItemId: string, patch: Partial<DraftLine>) {
    setLines((current) => current.map((line) => (line.orderItemId === orderItemId ? { ...line, ...patch } : line)));
    setErrors((current) => {
      const next = { ...current };
      delete next[orderItemId];
      delete next.form;
      return next;
    });
  }

  function validate() {
    const nextErrors: Record<string, string> = {};
    if (!returnDate) nextErrors.form = "Return date is required.";
    if (!note.trim()) nextErrors.note = "Return note is required.";
    const selected = activeLines
      .map((line) => ({ ...line, parsedQuantity: Number.parseInt(line.quantity || "0", 10) || 0 }))
      .filter((line) => line.parsedQuantity > 0);
    if (selected.length === 0) {
      nextErrors.form = "Enter at least one returned quantity.";
    }
    for (const line of selected) {
      if (line.parsedQuantity > line.returnableQuantity) {
        nextErrors[line.orderItemId] = `Maximum returnable quantity is ${formatNumber(line.returnableQuantity)}.`;
      }
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function submit() {
    if (!validate()) return;
    try {
      await onSubmit({
        returnDate,
        note: note.trim(),
        lines: activeLines
          .map((line) => ({
            orderItemId: line.orderItemId,
            quantity: Number.parseInt(line.quantity || "0", 10) || 0,
          }))
          .filter((line) => line.quantity > 0),
      });
    } catch {
      // Parent components surface API failures through their status dialog.
    }
  }

  return (
    <Drawer
      open={open}
      title="Create return"
      onClose={onClose}
      className="sm:max-w-[44rem] lg:max-w-[52rem]"
      bodyClassName="flex h-[calc(100%-4rem)] flex-col px-0 py-0"
    >
      <div className="grid gap-4 overflow-y-auto px-4 py-4 sm:px-5">
        <div className="grid gap-3">
          <FormField label="Return date" htmlFor="order-return-date" required>
            <AppInput
              id="order-return-date"
              type="date"
              value={returnDate}
              disabled={loading}
              className="max-w-[220px]"
              onChange={(event) => setReturnDate(event.target.value)}
            />
          </FormField>
          <FormField label="Return note" htmlFor="order-return-note" required error={errors.note}>
            <Textarea
              id="order-return-note"
              value={note}
              disabled={loading}
              className="min-h-[42px]"
              onChange={(event) => {
                setNote(event.target.value);
                setErrors((current) => {
                  const next = { ...current };
                  delete next.note;
                  delete next.form;
                  return next;
                });
              }}
            />
          </FormField>
        </div>

        <div className="grid gap-2">
          <h3 className="text-sm font-semibold text-slate-900">Items</h3>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                <tr className="border-b border-slate-200">
                  <th className="px-3 py-3">Item</th>
                  <th className="px-3 py-3">Batch / Source</th>
                  <th className="px-3 py-3 text-right">Returnable</th>
                  <th className="px-3 py-3 text-right">Return Qty</th>
                </tr>
              </thead>
              <tbody>
                {activeLines.map((line) => (
                  <tr key={line.orderItemId} className="border-b border-slate-100 text-slate-700">
                    <td className="px-3 py-3">
                      <div className="font-medium text-slate-900">{line.itemName}</div>
                      <div className="text-xs text-slate-500">{line.itemCode}</div>
                    </td>
                    <td className="px-3 py-3 text-slate-600">{line.itemCode}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{formatNumber(line.returnableQuantity)}</td>
                    <td className="px-3 py-3">
                      <div className="ml-auto w-28">
                        <AppInput
                          aria-label={`Return quantity for ${line.itemName}`}
                          inputMode="numeric"
                          value={line.quantity}
                          disabled={loading}
                          className="h-9 text-right tabular-nums"
                          onFocus={(event) => event.currentTarget.select()}
                          onChange={(event) => patchLine(line.orderItemId, { quantity: digitsOnly(event.target.value) })}
                        />
                        {errors[line.orderItemId] ? <p className="mt-1 text-right text-xs text-rose-600">{errors[line.orderItemId]}</p> : null}
                      </div>
                    </td>
                  </tr>
                ))}
                {activeLines.length === 0 ? (
                  <tr>
                    <td className="px-3 py-6 text-center text-sm text-slate-500" colSpan={4}>
                      All dispatched quantities have already been returned.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        {errors.form ? <p className="text-sm text-rose-600">{errors.form}</p> : null}
      </div>

      <div className="mt-auto flex justify-end gap-2 border-t border-slate-200 bg-white px-4 py-3 sm:px-5">
        <AppButton variant="ghost" className="h-10 px-3 text-sm" disabled={loading} onClick={onClose}>
          Cancel
        </AppButton>
        <AppButton className="h-10 px-3 text-sm" disabled={loading || activeLines.length === 0} onClick={() => void submit()}>
          {loading ? "Creating..." : "Create Return"}
        </AppButton>
      </div>
    </Drawer>
  );
}
