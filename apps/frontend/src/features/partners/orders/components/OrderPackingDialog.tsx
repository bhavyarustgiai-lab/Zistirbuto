import { useEffect, useMemo, useState } from "react";
import type { PartnerOrder } from "@shared/types/domain";
import { AppButton } from "@shared/ui/atoms/app-button";
import { AppInput } from "@shared/ui/atoms/app-input";
import { Dialog } from "@components/ui/dialog";
import { Select } from "@components/ui/select";

type OrderPackingDialogProps = {
  open: boolean;
  order: PartnerOrder;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (input: {
    packedItems: Array<{ orderItemId: string; itemId: string; packedQuantity: number; shortReason?: string }>;
  }) => Promise<void>;
};

const shortReasonOptions = [
  { value: "", label: "No short reason" },
  { value: "DAMAGED", label: "Damaged" },
  { value: "MISSING", label: "Missing" },
  { value: "NOT_AVAILABLE", label: "Not available" },
  { value: "OTHER", label: "Other" },
];

function digitsOnly(value: string) {
  return value.replace(/\D+/g, "");
}

function formatNumber(value: number) {
  return value.toLocaleString("en-IN");
}

export function OrderPackingDialog({ open, order, loading = false, onClose, onSubmit }: OrderPackingDialogProps) {
  const [packedValues, setPackedValues] = useState<Record<string, string>>({});
  const [shortReasons, setShortReasons] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setPackedValues(Object.fromEntries(order.items.map((line) => [line.id, String(line.packedQuantity || line.quantity)])));
    setShortReasons(Object.fromEntries(order.items.map((line) => [line.id, line.shortReason || ""])));
    setErrors({});
  }, [open, order.items]);

  const rows = useMemo(
    () =>
      order.items.map((line) => {
        const packedQuantity = Number.parseInt(packedValues[line.id] || "0", 10) || 0;
        return {
          line,
          packedQuantity,
          shortQuantity: Math.max(line.quantity - packedQuantity, 0),
        };
      }),
    [order.items, packedValues],
  );

  function validate() {
    const nextErrors: Record<string, string> = {};
    for (const row of rows) {
      const rawValue = packedValues[row.line.id] ?? "";
      if (!rawValue.trim()) {
        nextErrors[row.line.id] = "Enter packed quantity.";
        continue;
      }
      if (row.packedQuantity < 0 || row.packedQuantity > row.line.quantity) {
        nextErrors[row.line.id] = "Cannot exceed allocated quantity.";
        continue;
      }
      if (row.shortQuantity > 0 && !shortReasons[row.line.id]) {
        nextErrors[row.line.id] = "Reason required for short quantity.";
      }
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function submit() {
    if (!validate()) return;
    await onSubmit({
      packedItems: rows.map((row) => ({
        orderItemId: row.line.id,
        itemId: row.line.itemId,
        packedQuantity: row.packedQuantity,
        shortReason: shortReasons[row.line.id] || undefined,
      })),
    });
  }

  return (
    <Dialog open={open} title="Pack order" onClose={onClose} panelClassName="max-w-4xl" bodyClassName="grid gap-4">
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr className="border-b border-slate-200">
              <th className="px-3 py-3">Item</th>
              <th className="px-3 py-3 text-right">Allocated</th>
              <th className="px-3 py-3 text-right">Packed</th>
              <th className="px-3 py-3 text-right">Short</th>
              <th className="px-3 py-3">Reason</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.line.id} className="border-b border-slate-100 text-slate-700">
                <td className="px-3 py-3">
                  <div className="font-medium text-slate-900">{row.line.itemName}</div>
                  <div className="text-xs text-slate-500">{row.line.itemCode}</div>
                </td>
                <td className="px-3 py-3 text-right tabular-nums">{formatNumber(row.line.quantity)}</td>
                <td className="px-3 py-3">
                  <div className="ml-auto w-28">
                    <AppInput
                      aria-label={`Packed quantity for ${row.line.itemName}`}
                      inputMode="numeric"
                      value={packedValues[row.line.id] ?? ""}
                      disabled={loading}
                      className="h-9 text-right tabular-nums"
                      onFocus={(event) => event.currentTarget.select()}
                      onChange={(event) => {
                        setPackedValues((current) => ({ ...current, [row.line.id]: digitsOnly(event.target.value) }));
                        setErrors((current) => {
                          const next = { ...current };
                          delete next[row.line.id];
                          return next;
                        });
                      }}
                    />
                    {errors[row.line.id] ? <p className="mt-1 text-right text-xs text-rose-600">{errors[row.line.id]}</p> : null}
                  </div>
                </td>
                <td className={row.shortQuantity > 0 ? "px-3 py-3 text-right font-medium tabular-nums text-rose-600" : "px-3 py-3 text-right tabular-nums text-slate-500"}>
                  {formatNumber(row.shortQuantity)}
                </td>
                <td className="px-3 py-3">
                  <Select
                    value={shortReasons[row.line.id] ?? ""}
                    options={shortReasonOptions}
                    disabled={loading || row.shortQuantity === 0}
                    onValueChange={(value) => setShortReasons((current) => ({ ...current, [row.line.id]: value }))}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end gap-2 border-t border-slate-200 pt-3">
        <AppButton variant="ghost" disabled={loading} onClick={onClose}>
          Cancel
        </AppButton>
        <AppButton disabled={loading} onClick={() => void submit()}>
          {loading ? "Saving..." : "Mark Packed"}
        </AppButton>
      </div>
    </Dialog>
  );
}
