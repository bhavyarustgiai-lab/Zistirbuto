import { useEffect, useMemo, useState } from "react";
import type { PartnerOrder } from "@shared/types/domain";
import { AppButton } from "@shared/ui/atoms/app-button";
import { AppInput } from "@shared/ui/atoms/app-input";
import { Dialog } from "@components/ui/dialog";
import { Textarea } from "@components/ui/textarea";

type OrderDispatchDialogProps = {
  open: boolean;
  order: PartnerOrder;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (input: {
    dispatchDetails: {
      dispatchDate?: string;
      transportName?: string;
      vehicleNumber?: string;
      driverPhone?: string;
      notes?: string;
    };
    dispatchedItems: Array<{ orderItemId: string; itemId: string; dispatchedQuantity: number }>;
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

export function OrderDispatchDialog({ open, order, loading = false, onClose, onSubmit }: OrderDispatchDialogProps) {
  const [dispatchDate, setDispatchDate] = useState(today());
  const [transportName, setTransportName] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setDispatchDate(order.dispatchDate || today());
    setTransportName(order.transportName || "");
    setVehicleNumber(order.vehicleNumber || "");
    setDriverPhone(order.driverPhone || "");
    setNotes(order.dispatchNotes || "");
    setQuantities(Object.fromEntries(order.items.map((line) => [line.id, String(line.packedQuantity ?? line.quantity)])));
    setErrors({});
  }, [open, order]);

  const rows = useMemo(
    () =>
      order.items.map((line) => ({
        line,
        packedQuantity: line.packedQuantity ?? line.quantity,
        dispatchQuantity: Number.parseInt(quantities[line.id] || "0", 10) || 0,
      })),
    [order.items, quantities],
  );

  function validate() {
    const nextErrors: Record<string, string> = {};
    for (const row of rows) {
      const rawValue = quantities[row.line.id] ?? "";
      if (!rawValue.trim()) {
        nextErrors[row.line.id] = "Enter dispatch quantity.";
        continue;
      }
      if (row.dispatchQuantity < 0 || row.dispatchQuantity > row.packedQuantity) {
        nextErrors[row.line.id] = "Cannot exceed packed quantity.";
      }
    }
    if (!rows.some((row) => row.dispatchQuantity > 0)) {
      nextErrors.form = "Dispatch at least one item.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function submit() {
    if (!validate()) return;
    await onSubmit({
      dispatchDetails: {
        dispatchDate,
        transportName,
        vehicleNumber,
        driverPhone,
        notes,
      },
      dispatchedItems: rows.map((row) => ({
        orderItemId: row.line.id,
        itemId: row.line.itemId,
        dispatchedQuantity: row.dispatchQuantity,
      })),
    });
  }

  return (
    <Dialog open={open} title="Dispatch order" onClose={onClose} panelClassName="max-w-5xl" bodyClassName="grid gap-4">
      <div className="grid gap-3 md:grid-cols-4">
        <label className="grid gap-1 text-sm text-slate-700">
          Dispatch date
          <AppInput type="date" value={dispatchDate} disabled={loading} onChange={(event) => setDispatchDate(event.target.value)} />
        </label>
        <label className="grid gap-1 text-sm text-slate-700">
          Transport / partner
          <AppInput value={transportName} disabled={loading} onChange={(event) => setTransportName(event.target.value)} />
        </label>
        <label className="grid gap-1 text-sm text-slate-700">
          Vehicle number
          <AppInput value={vehicleNumber} disabled={loading} onChange={(event) => setVehicleNumber(event.target.value)} />
        </label>
        <label className="grid gap-1 text-sm text-slate-700">
          Driver phone
          <AppInput value={driverPhone} disabled={loading} onChange={(event) => setDriverPhone(event.target.value)} />
        </label>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full min-w-[680px] text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr className="border-b border-slate-200">
              <th className="px-3 py-3">Item</th>
              <th className="px-3 py-3 text-right">Packed Qty</th>
              <th className="px-3 py-3 text-right">Dispatch Qty</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.line.id} className="border-b border-slate-100 text-slate-700">
                <td className="px-3 py-3">
                  <div className="font-medium text-slate-900">{row.line.itemName}</div>
                  <div className="text-xs text-slate-500">{row.line.itemCode}</div>
                </td>
                <td className="px-3 py-3 text-right tabular-nums">{formatNumber(row.packedQuantity)}</td>
                <td className="px-3 py-3">
                  <div className="ml-auto w-28">
                    <AppInput
                      aria-label={`Dispatch quantity for ${row.line.itemName}`}
                      inputMode="numeric"
                      value={quantities[row.line.id] ?? ""}
                      disabled={loading}
                      className="h-9 text-right tabular-nums"
                      onFocus={(event) => event.currentTarget.select()}
                      onChange={(event) => {
                        setQuantities((current) => ({ ...current, [row.line.id]: digitsOnly(event.target.value) }));
                        setErrors((current) => {
                          const next = { ...current };
                          delete next[row.line.id];
                          delete next.form;
                          return next;
                        });
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

      <Textarea value={notes} disabled={loading} placeholder="Dispatch notes" onChange={(event) => setNotes(event.target.value)} />
      {errors.form ? <p className="text-sm text-rose-600">{errors.form}</p> : null}

      <div className="flex justify-end gap-2 border-t border-slate-200 pt-3">
        <AppButton variant="ghost" disabled={loading} onClick={onClose}>
          Cancel
        </AppButton>
        <AppButton disabled={loading} onClick={() => void submit()}>
          {loading ? "Saving..." : "Dispatch"}
        </AppButton>
      </div>
    </Dialog>
  );
}
