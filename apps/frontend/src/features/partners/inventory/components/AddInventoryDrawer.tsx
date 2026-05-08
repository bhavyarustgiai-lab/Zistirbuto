import { Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  usePartnerBrandItems,
  usePartnerSuppliers,
} from "@entities/partners/hooks";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Select } from "@components/ui/select";
import { Separator } from "@components/ui/separator";
import { Textarea } from "@components/ui/textarea";
import { todayISO } from "@shared/lib/date";
import { cn } from "@shared/lib/cn";
import { AppButton } from "@shared/ui/atoms/app-button";
import { AppInput } from "@shared/ui/atoms/app-input";
import { EmptyState } from "@shared/ui/molecules/empty-state";
import { ErrorState } from "@shared/ui/molecules/error-state";
import { FormField } from "@shared/ui/molecules/form-field";
import { LoadingState } from "@shared/ui/molecules/loading-state";
import { StatusDialog } from "@shared/ui/molecules/status-dialog";
import { ResourceFormDialog } from "@shared/ui/templates/resource-form-dialog";
import type { PartnerInventoryCreateInput } from "@shared/types/domain";
import type { InventoryDraftItem, InventoryFormErrors } from "../types";
import {
  decimalNumberOnly,
  digitsOnly,
  fieldKey,
  formatReceiveDate,
  inventoryErrorsFromApiError,
  makeInventoryDraft,
  userFacingInventoryError,
  validateInventoryDraft,
} from "../utils";

type Props = {
  open: boolean;
  onClose: () => void;
  firmId: number | string;
  brandId: string;
  onSubmitBatch: (inputs: PartnerInventoryCreateInput[]) => Promise<void>;
};

type InventoryDrawerBodyProps = {
  brandId: string;
  loading: boolean;
  error: Error | null;
  hasCatalogItems: boolean;
  hasActiveSuppliers: boolean;
  onRetry: () => void;
  children: ReactNode;
};

export function AddInventoryDrawer({
  open,
  onClose,
  firmId,
  brandId,
  onSubmitBatch,
}: Props) {
  const catalogItems = usePartnerBrandItems(firmId, brandId);
  const suppliers = usePartnerSuppliers(firmId, "");
  const [rows, setRows] = useState<InventoryDraftItem[]>([]);
  const [errors, setErrors] = useState<InventoryFormErrors>({});
  const [saving, setSaving] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [receivedAt, setReceivedAt] = useState(todayISO());
  const [note, setNote] = useState("");
  const [statusDialog, setStatusDialog] = useState<{ tone: "success" | "error"; title: string; description?: string } | null>(null);

  useEffect(() => {
    if (!open) {
      resetForm([]);
      return;
    }
    resetForm([makeInventoryDraft()]);
  }, [open, brandId]);

  const itemOptions = useMemo(
    () =>
      catalogItems.items.map((item) => ({
        value: item.id,
        label: `${item.name} · ${item.sku}`,
      })),
    [catalogItems.items],
  );

  const supplierOptions = useMemo(
    () =>
      suppliers.items
        .filter((item) => item.status === "ACTIVE")
        .map((item) => ({ value: item.id, label: item.supplierName })),
    [suppliers.items],
  );

  const loading = catalogItems.loading || suppliers.loading;
  const loadError = catalogItems.error ?? suppliers.error;
  const canSubmit =
    !saving &&
    !loading &&
    !loadError &&
    rows.length > 0 &&
    catalogItems.items.length > 0 &&
    supplierOptions.length > 0;

  function resetForm(nextRows: InventoryDraftItem[]) {
    setRows(nextRows);
    setErrors({});
    setSaving(false);
    setSupplierId("");
    setReceivedAt(todayISO());
    setNote("");
  }

  function updateRow(rowId: string, patch: Partial<InventoryDraftItem>) {
    setRows((current) =>
      current.map((item) =>
        item.rowId === rowId ? { ...item, ...patch } : item,
      ),
    );
    setErrors((current) => clearRowErrors(current, rowId));
  }

  async function retryData() {
    await Promise.all([catalogItems.refresh(), suppliers.refresh()]).catch(
      () => undefined,
    );
  }

  async function submit() {
    const validation = validateInventoryDraft(
      rows,
      supplierId,
      receivedAt,
      note,
    );
    setErrors(validation.errors);
    if (!validation.valid) {
      return;
    }

    setSaving(true);
    try {
      await onSubmitBatch(validation.payload);
      setStatusDialog({
        tone: "success",
        title: "Inventory posted",
        description: `${validation.payload.length} inventory row${
          validation.payload.length === 1 ? "" : "s"
        } recorded.`,
      });
      onClose();
    } catch (error) {
      const fieldErrors = inventoryErrorsFromApiError(error, rows);
      const message = userFacingInventoryError(error);
      setErrors(Object.keys(fieldErrors).length > 0 ? fieldErrors : {});
      if (Object.keys(fieldErrors).length === 0) {
        setStatusDialog({
          tone: "error",
          title: "Post inventory failed",
          description: message || "Something went wrong, please try again later",
        });
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
    <ResourceFormDialog
      open={open}
      onClose={onClose}
      title="Add inventory"
      className="md:w-[46vw] lg:max-w-[46vw]"
      bodyClassName="h-full px-0 py-0"
    >
      <div className="flex h-[calc(100vh-73px)] flex-col bg-slate-50/80">
        <InventoryDrawerBody
          brandId={brandId}
          loading={loading}
          error={loadError}
          hasCatalogItems={catalogItems.items.length > 0}
          hasActiveSuppliers={supplierOptions.length > 0}
          onRetry={() => void retryData()}
        >
          <div className="space-y-5">
            <ReceiptFields
              supplierId={supplierId}
              supplierOptions={supplierOptions}
              receivedAt={receivedAt}
              note={note}
              saving={saving}
              errors={errors}
              onSupplierChange={(value) => {
                setSupplierId(value);
                setErrors((current) => {
                  const next = { ...current };
                  delete next.supplierId;
                  delete next.submit;
                  return next;
                });
              }}
              onReceivedAtChange={(value) => {
                setReceivedAt(value);
                setErrors((current) => {
                  const next = { ...current };
                  delete next.receivedAt;
                  delete next.submit;
                  return next;
                });
              }}
              onNoteChange={setNote}
            />

            {rows.map((row, index) => (
              <InventoryDraftRow
                key={row.rowId}
                row={row}
                index={index}
                totalRows={rows.length}
                saving={saving}
                errors={errors}
                itemOptions={itemOptions}
                onRemove={() =>
                  setRows((current) =>
                    current.filter((item) => item.rowId !== row.rowId),
                  )
                }
                onUpdate={(patch) => updateRow(row.rowId, patch)}
                onCatalogItemChange={(value) => {
                  const selectedItem = catalogItems.items.find(
                    (item) => item.id === value,
                  );
                  updateRow(row.rowId, {
                    catalogItemId: value,
                    mrp: selectedItem?.defaultMrp
                      ? String(selectedItem.defaultMrp)
                      : "",
                    discountPercentage:
                      selectedItem?.defaultDiscountPercentage != null
                        ? String(selectedItem.defaultDiscountPercentage)
                        : "",
                  });
                }}
              />
            ))}

            <Button
              type="button"
              variant="outline"
              className="h-11 w-full rounded-2xl border-dashed border-slate-300 bg-white text-sm font-semibold text-slate-700 shadow-sm"
              disabled={saving}
              onClick={() =>
                setRows((current) => [...current, makeInventoryDraft()])
              }
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add another inventory row
            </Button>

          </div>
        </InventoryDrawerBody>

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
                className="h-11 w-full rounded-2xl px-6 text-sm font-semibold whitespace-nowrap shadow-lg shadow-brand-500/20 sm:w-auto sm:min-w-[168px]"
                disabled={!canSubmit}
                onClick={() => void submit()}
              >
                {saving ? "Posting..." : "Post inventory"}
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

function InventoryDrawerBody({
  brandId,
  loading,
  error,
  hasCatalogItems,
  hasActiveSuppliers,
  onRetry,
  children,
}: InventoryDrawerBodyProps) {
  return (
    <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
      {!brandId ? (
        <EmptyState description="Select a brand first." />
      ) : loading ? (
        <LoadingState label="Loading inventory setup..." />
      ) : error ? (
        <ErrorState
          title="Inventory setup unavailable"
          message={userFacingInventoryError(error)}
          onRetry={onRetry}
        />
      ) : !hasCatalogItems ? (
        <EmptyState description="Add catalog items for this brand before adding inventory." />
      ) : !hasActiveSuppliers ? (
        <EmptyState description="Add an active supplier before posting inventory." />
      ) : (
        children
      )}
    </div>
  );
}

type ReceiptFieldsProps = {
  supplierId: string;
  supplierOptions: Array<{ value: string; label: string }>;
  receivedAt: string;
  note: string;
  saving: boolean;
  errors: InventoryFormErrors;
  onSupplierChange: (value: string) => void;
  onReceivedAtChange: (value: string) => void;
  onNoteChange: (value: string) => void;
};

function ReceiptFields({
  supplierId,
  supplierOptions,
  receivedAt,
  note,
  saving,
  errors,
  onSupplierChange,
  onReceivedAtChange,
  onNoteChange,
}: ReceiptFieldsProps) {
  return (
    <Card className="overflow-hidden rounded-3xl border-slate-200/90 shadow-sm">
      <CardContent className="space-y-5 bg-white p-5">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <FormField
            label="Supplier"
            error={errors.supplierId}
            className="content-start"
            required
          >
            <Select
              value={supplierId}
              disabled={saving}
              onValueChange={onSupplierChange}
              options={[
                { value: "", label: "Select supplier" },
                ...supplierOptions,
              ]}
              className="rounded-2xl"
              searchable
              searchPlaceholder="Search suppliers"
              emptyMessage="No suppliers found."
            />
          </FormField>

          <FormField
            label="Received date"
            htmlFor="inventory-received-at"
            error={errors.receivedAt}
            helperText={`This inward will be recorded against ${formatReceiveDate(
              receivedAt,
            )}.`}
            className="content-start"
          >
            <AppInput
              id="inventory-received-at"
              type="date"
              value={receivedAt}
              disabled={saving}
              onChange={(event) => onReceivedAtChange(event.target.value)}
              className={cn(
                "h-12 rounded-2xl border-slate-200 bg-white text-[15px]",
                errors.receivedAt ? "border-rose-300 ring-2 ring-rose-100" : "",
              )}
            />
          </FormField>
        </div>

        <FormField
          label="Receipt note"
          htmlFor="inventory-receipt-note"
          helperText="Optional invoice number, batch note, or receipt context."
        >
          <Textarea
            id="inventory-receipt-note"
            value={note}
            disabled={saving}
            onChange={(event) => onNoteChange(event.target.value)}
            className="min-h-[112px] rounded-2xl border-slate-200 bg-white px-4 py-3 text-[15px]"
          />
        </FormField>
      </CardContent>
    </Card>
  );
}

type InventoryDraftRowProps = {
  row: InventoryDraftItem;
  index: number;
  totalRows: number;
  saving: boolean;
  errors: InventoryFormErrors;
  itemOptions: Array<{ value: string; label: string }>;
  onRemove: () => void;
  onUpdate: (patch: Partial<InventoryDraftItem>) => void;
  onCatalogItemChange: (value: string) => void;
};

function InventoryDraftRow({
  row,
  index,
  totalRows,
  saving,
  errors,
  itemOptions,
  onRemove,
  onUpdate,
  onCatalogItemChange,
}: InventoryDraftRowProps) {
  const catalogItemError = errors[fieldKey(row.rowId, "catalogItemId")];
  const mrpError = errors[fieldKey(row.rowId, "mrp")];
  const discountError = errors[fieldKey(row.rowId, "discountPercentage")];
  const quantityError = errors[fieldKey(row.rowId, "quantity")];

  return (
    <Card className="overflow-hidden rounded-3xl border-slate-200/90 shadow-sm">
      <CardHeader className="border-b border-slate-100 bg-white px-5 py-5">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-lg font-semibold tracking-tight text-slate-950">
            Inventory row {index + 1}
          </CardTitle>
          {totalRows > 1 ? (
            <Button
              type="button"
              variant="ghost"
              className="h-10 rounded-2xl px-3 text-slate-500"
              disabled={saving}
              onClick={onRemove}
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              Remove
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-5 bg-white p-5">
        <FormField label="Catalog item" error={catalogItemError} required>
          <Select
            value={row.catalogItemId}
            disabled={saving}
            onValueChange={onCatalogItemChange}
            options={[{ value: "", label: "Select item" }, ...itemOptions]}
            className="rounded-2xl"
            searchable
            searchPlaceholder="Search catalog items"
            emptyMessage="No catalog items found."
          />
        </FormField>

        <div className="grid gap-4 xl:grid-cols-2">
          <FormField label="MRP" error={mrpError} required>
            <AppInput
              value={row.mrp}
              disabled={saving}
              onChange={(event) =>
                onUpdate({ mrp: digitsOnly(event.target.value) })
              }
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Enter MRP"
              className={fieldInputClassName(Boolean(mrpError))}
            />
          </FormField>

          <FormField
            label="Buy Margin (%)"
            error={discountError}
            required
          >
            <AppInput
              value={row.discountPercentage}
              disabled={saving}
              onChange={(event) =>
                onUpdate({
                  discountPercentage: decimalNumberOnly(event.target.value),
                })
              }
              inputMode="decimal"
              pattern="[0-9]*[.]?[0-9]*"
              placeholder="Enter buy margin"
              className={fieldInputClassName(Boolean(discountError))}
            />
          </FormField>
        </div>

        <Separator className="bg-slate-100" />

        <FormField label="Quantity" error={quantityError} required>
          <AppInput
            value={row.quantity}
            disabled={saving}
            onChange={(event) =>
              onUpdate({ quantity: digitsOnly(event.target.value) })
            }
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Enter inward quantity"
            className={fieldInputClassName(Boolean(quantityError))}
          />
        </FormField>
      </CardContent>
    </Card>
  );
}

function fieldInputClassName(hasError: boolean) {
  return cn(
    "h-12 rounded-2xl bg-white text-[15px]",
    hasError ? "border-rose-300 ring-2 ring-rose-100" : "border-slate-200",
  );
}

function clearRowErrors(errors: InventoryFormErrors, rowId: string) {
  const next = { ...errors };
  for (const key of Object.keys(next)) {
    if (key.startsWith(`${rowId}.`)) {
      delete next[key];
    }
  }
  delete next.submit;
  return next;
}
