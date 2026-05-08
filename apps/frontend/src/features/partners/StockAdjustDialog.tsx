import { useEffect, useMemo, useState } from "react";
import type { PartnerStockRow } from "@shared/types/domain";
import { Dialog } from "@components/ui/dialog";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Select } from "@components/ui/select";
import { PartnerFieldLabel } from "@features/partners/PartnerFieldLabel";

type Props = {
  open: boolean;
  onClose: () => void;
  stockRows: PartnerStockRow[];
  onSubmit: (input: { itemId: string; quantityDelta: number; note?: string }) => Promise<void>;
};

export function StockAdjustDialog({ open, onClose, stockRows, onSubmit }: Props) {
  const [itemId, setItemId] = useState("");
  const [quantityDelta, setQuantityDelta] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setItemId("");
      setQuantityDelta("");
      setNote("");
      setSaving(false);
      setError("");
      return;
    }
    setItemId((prev) => prev || stockRows[0]?.itemId || "");
  }, [open, stockRows]);

  const options = useMemo(
    () => stockRows.map((row) => ({ value: row.itemId, label: `${row.itemName} (${row.brandName})` })),
    [stockRows],
  );

  return (
    <Dialog open={open} onClose={onClose} title="Adjust Stock">
      <div className="grid gap-3">
        <div>
          <PartnerFieldLabel>Item</PartnerFieldLabel>
          <Select value={itemId} onValueChange={setItemId} options={options} />
        </div>

        <div>
          <PartnerFieldLabel>Quantity change</PartnerFieldLabel>
          <Input
            value={quantityDelta}
            onChange={(event) => setQuantityDelta(event.target.value)}
            placeholder="Use positive to add, negative to reduce"
            inputMode="numeric"
          />
        </div>

        <div>
          <PartnerFieldLabel>Reason note</PartnerFieldLabel>
          <Input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Explain the manual correction"
          />
        </div>

        {error ? <p className="text-sm text-rose-600">{error}</p> : null}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose} className="h-10 px-3 text-sm">Cancel</Button>
          <Button
            className="h-10 px-3 text-sm"
            disabled={saving}
            onClick={async () => {
              const delta = Number.parseInt(quantityDelta, 10);
              if (!itemId) {
                setError("Item is required.");
                return;
              }
              if (!Number.isFinite(delta) || delta === 0) {
                setError("Quantity change must be a non-zero whole number.");
                return;
              }
              if (!note.trim()) {
                setError("Reason note is required.");
                return;
              }

              setSaving(true);
              setError("");
              try {
                await onSubmit({ itemId, quantityDelta: delta, note: note.trim() });
                onClose();
              } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to update stock");
              } finally {
                setSaving(false);
              }
            }}
          >
            Record Adjustment
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
