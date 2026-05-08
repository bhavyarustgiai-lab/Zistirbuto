import { useEffect, useMemo, useState } from "react";
import { Select } from "@components/ui/select";
import { Textarea } from "@components/ui/textarea";
import { cn } from "@shared/lib/cn";
import { AppButton } from "@shared/ui/atoms/app-button";
import { AppInput } from "@shared/ui/atoms/app-input";
import { EmptyState } from "@shared/ui/molecules/empty-state";
import { FormField } from "@shared/ui/molecules/form-field";
import { StatusDialog } from "@shared/ui/molecules/status-dialog";
import { ResourceFormDialog } from "@shared/ui/templates/resource-form-dialog";
import type { PartnerInventoryItem } from "@shared/types/domain";

type Props = {
  open: boolean;
  items: PartnerInventoryItem[];
  initialItemId?: string;
  onClose: () => void;
  onSubmit: (itemId: string, quantity: number, status: "ACTIVE" | "INACTIVE", note: string) => Promise<void>;
};

function digitsOnly(value: string) {
  return value.replace(/\D+/g, "");
}

export function EditInventoryDrawer({ open, items, initialItemId = "", onClose, onSubmit }: Props) {
  const [quantity, setQuantity] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [quantityError, setQuantityError] = useState("");
  const [noteError, setNoteError] = useState("");
  const [statusDialog, setStatusDialog] = useState<{ tone: "success" | "error"; title: string; description?: string } | null>(null);

  const selectedItem = useMemo(
    () => items.find((item) => item.itemId === initialItemId) ?? items[0] ?? null,
    [initialItemId, items],
  );

  useEffect(() => {
    if (!open || !selectedItem) {
      setQuantity("");
      setStatus("ACTIVE");
      setNote("");
      setSaving(false);
      setQuantityError("");
      setNoteError("");
      return;
    }
    setQuantity(String(selectedItem.quantity));
    setStatus(selectedItem.status);
    setNote("");
    setQuantityError("");
    setNoteError("");
  }, [open, selectedItem]);

  async function submit() {
    if (!selectedItem) return;
    const parsedQuantity = Number.parseInt(quantity, 10);
    setQuantityError("");
    setNoteError("");
    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 0) {
      setQuantityError("Quantity must be a non-negative integer.");
      return;
    }
    if (!note.trim()) {
      setNoteError("Adjustment note is required.");
      return;
    }
    setSaving(true);
    try {
      await onSubmit(selectedItem.itemId, parsedQuantity, status, note.trim());
      onClose();
      setStatusDialog({ tone: "success", title: "Inventory updated successfully" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update inventory";
      setStatusDialog({ tone: "error", title: "Update inventory failed", description: message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
    <ResourceFormDialog
      open={open}
      onClose={onClose}
      title="Adjust inventory"
      className="md:w-[38vw] lg:max-w-[38vw]"
      bodyClassName="h-full px-0 py-0"
    >
      <div className="flex h-[calc(100vh-73px)] flex-col bg-slate-50/80">
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {!selectedItem ? (
            <EmptyState description="Select an inventory row to adjust." />
          ) : (
            <div className="space-y-5">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <FormField label="Item" required={false}>
                  <AppInput
                    value={`${selectedItem.itemName} · ${selectedItem.sku}`}
                    disabled
                    className="h-12 rounded-2xl border-slate-200 bg-slate-50 text-[15px] disabled:opacity-100"
                  />
                </FormField>

                <div className="mt-5 grid gap-4 xl:grid-cols-2">
                  <FormField label="Quantity" error={quantityError} required>
                    <AppInput
                      value={quantity}
                      disabled={saving}
                      onChange={(event) => {
                        setQuantity(digitsOnly(event.target.value));
                        setQuantityError("");
                      }}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="Enter quantity"
                      className={cn(
                        "h-12 rounded-2xl bg-white text-[15px]",
                        quantityError ? "border-rose-300 ring-2 ring-rose-100" : "border-slate-200",
                      )}
                    />
                  </FormField>

                  <FormField label="Status" required>
                    <Select
                      value={status}
                      disabled={saving}
                      onValueChange={(value) => {
                        setStatus(value as "ACTIVE" | "INACTIVE");
                      }}
                      options={[
                        { value: "ACTIVE", label: "Active" },
                        { value: "INACTIVE", label: "Inactive" },
                      ]}
                      className="rounded-2xl"
                    />
                  </FormField>
                </div>

                <FormField
                  label="Adjustment note"
                  error={noteError}
                  className="mt-5"
                  required
                >
                  <Textarea
                    value={note}
                    disabled={saving}
                    onChange={(event) => {
                      setNote(event.target.value);
                      setNoteError("");
                    }}
                    className={cn(
                      "min-h-[132px] rounded-2xl border bg-white px-4 py-3 text-[15px]",
                      noteError ? "border-rose-300 ring-2 ring-rose-100" : "border-slate-200",
                    )}
                    placeholder="Explain why the stock quantity or operational status is being corrected."
                  />
                </FormField>
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 z-20 border-t border-slate-200 bg-white/95 px-5 py-4 backdrop-blur sm:px-6">
          <div className="flex justify-end">
            <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row sm:justify-end">
              <AppButton
                type="button"
                variant="ghost"
                className="h-11 w-full rounded-2xl px-5 text-sm font-medium whitespace-nowrap sm:w-auto"
                disabled={saving}
                onClick={onClose}
              >
                Cancel
              </AppButton>
              <AppButton
                type="button"
                className="h-11 w-full rounded-2xl px-6 text-sm font-semibold whitespace-nowrap shadow-lg shadow-brand-500/20 sm:min-w-[168px] sm:w-auto"
                disabled={saving || !selectedItem}
                onClick={() => void submit()}
              >
                {saving ? "Saving..." : "Save adjustment"}
              </AppButton>
            </div>
          </div>
        </div>
      </div>
    </ResourceFormDialog>
    <StatusDialog
      open={Boolean(statusDialog)}
      tone={statusDialog?.tone ?? "success"}
      title={statusDialog?.title ?? ""}
      description={statusDialog?.description}
      onClose={() => setStatusDialog(null)}
    />
    </>
  );
}
