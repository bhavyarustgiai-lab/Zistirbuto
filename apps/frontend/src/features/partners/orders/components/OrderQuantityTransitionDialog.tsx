import { useEffect, useMemo, useState } from "react";
import { Dialog } from "@components/ui/dialog";
import { Textarea } from "@components/ui/textarea";
import { AppButton } from "@shared/ui/atoms/app-button";
import { AppInput } from "@shared/ui/atoms/app-input";
import { FormField } from "@shared/ui/molecules/form-field";
import type { PartnerOrder } from "../types";

type Mode = "partial-delivery" | "return";

type Props = {
  open: boolean;
  mode: Mode;
  order: PartnerOrder;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (input: { note?: string; items: Array<{ itemId: string; quantity: number }> }) => Promise<void>;
};

type DraftLine = {
  itemId: string;
  label: string;
  quantity: string;
  max: number;
};

function digitsOnly(value: string) {
  return value.replace(/\D+/g, "");
}

function lineMax(line: PartnerOrder["items"][number], mode: Mode) {
  const dispatched = line.dispatchedQuantity ?? 0;
  const returned = line.returnedQuantity ?? 0;
  if (mode === "return") {
    return Math.max(0, dispatched - returned);
  }
  return Math.max(0, dispatched - returned);
}

export function OrderQuantityTransitionDialog({ open, mode, order, loading, onClose, onSubmit }: Props) {
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const copy = useMemo(
    () =>
      mode === "return"
        ? {
            title: "Record return",
            noteLabel: "Return note",
            submitLabel: "Record return",
            helper: "Enter returned quantities. Use full quantities to close the order as returned.",
          }
        : {
            title: "Record partial delivery",
            noteLabel: "Delivery note",
            submitLabel: "Save partial delivery",
            helper: "Enter delivered quantities for each dispatched line.",
          },
    [mode],
  );

  useEffect(() => {
    if (!open) return;
    setLines(
      order.items.map((line) => {
        const max = lineMax(line, mode);
        return {
          itemId: line.itemId,
          label: `${line.itemName} · ${line.itemCode}`,
          quantity: "",
          max,
        };
      }),
    );
    setNote("");
    setError("");
  }, [mode, open, order.items]);

  async function submit() {
    const items = lines
      .map((line) => ({
        itemId: line.itemId,
        quantity: Number.parseInt(line.quantity || "0", 10),
        max: line.max,
      }))
      .filter((line) => line.quantity > 0);

    if (items.length === 0) {
      setError("Enter at least one quantity.");
      return;
    }
    const invalid = items.find((line) => !Number.isInteger(line.quantity) || line.quantity < 0 || line.quantity > line.max);
    if (invalid) {
      setError("Quantities must be between zero and the available dispatched quantity.");
      return;
    }

    setError("");
    await onSubmit({
      note: note.trim() || undefined,
      items: items.map(({ itemId, quantity }) => ({ itemId, quantity })),
    });
  }

  return (
    <Dialog open={open} title={copy.title} onClose={onClose} panelClassName="max-w-2xl">
      <div className="grid gap-4">
        <p className="text-sm text-slate-600">{copy.helper}</p>
        <div className="grid gap-3">
          {lines.map((line) => (
            <div key={line.itemId} className="grid gap-2 rounded-lg border border-slate-200 p-3 md:grid-cols-[minmax(0,1fr)_150px]">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">{line.label}</p>
                <p className="mt-1 text-xs text-slate-500">Available: {line.max}</p>
              </div>
              <AppInput
                value={line.quantity}
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="0"
                disabled={loading || line.max === 0}
                onChange={(event) => {
                  const quantity = digitsOnly(event.target.value);
                  setLines((prev) => prev.map((item) => (item.itemId === line.itemId ? { ...item, quantity } : item)));
                  setError("");
                }}
              />
            </div>
          ))}
        </div>
        <FormField label={copy.noteLabel} htmlFor="order-transition-note" required={false}>
          <Textarea
            id="order-transition-note"
            value={note}
            disabled={loading}
            onChange={(event) => setNote(event.target.value)}
            className="min-h-[88px]"
          />
        </FormField>
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        <div className="flex justify-end gap-2">
          <AppButton variant="ghost" className="h-10 px-3 text-sm" disabled={loading} onClick={onClose}>
            Cancel
          </AppButton>
          <AppButton className="h-10 px-3 text-sm" disabled={loading} onClick={() => void submit()}>
            {loading ? "Working..." : copy.submitLabel}
          </AppButton>
        </div>
      </div>
    </Dialog>
  );
}
