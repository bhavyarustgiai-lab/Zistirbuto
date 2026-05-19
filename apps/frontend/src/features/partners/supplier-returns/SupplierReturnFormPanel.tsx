import { useEffect, useMemo, useState } from "react";
import { Plus, RotateCcw, Trash2 } from "lucide-react";
import { Select } from "@components/ui/select";
import { Textarea } from "@components/ui/textarea";
import { FormField } from "@shared/ui/molecules/form-field";
import { ErrorState } from "@shared/ui/molecules/error-state";
import { LoadingState } from "@shared/ui/molecules/loading-state";
import { EmptyState } from "@shared/ui/molecules/empty-state";
import { AppButton } from "@shared/ui/atoms/app-button";
import { AppInput } from "@shared/ui/atoms/app-input";
import { cn } from "@shared/lib/cn";
import { todayISO } from "@shared/lib/date";
import type {
  CreatePartnerSupplierReturnInput,
  PartnerInventoryItem,
  PartnerSupplier,
  PartnerSupplierReturn,
  PartnerSupplierReturnReason,
} from "@shared/types/domain";

type ReturnLine = {
  id: string;
  catalogItemId: string;
  reason: PartnerSupplierReturnReason;
};

type ReturnLineView = {
  line: ReturnLine;
  itemName: string;
  sku: string;
  stockLots: PartnerInventoryItem[];
  availableQuantity: number;
};

type Props = {
  brandId: string;
  suppliers: PartnerSupplier[];
  inventoryItems: PartnerInventoryItem[];
  initialReturn?: PartnerSupplierReturn | null;
  submitLabel?: string;
  savingLabel?: string;
  inventoryLoading?: boolean;
  inventoryError?: string;
  saving?: boolean;
  onRetryInventory?: () => void;
  onCancel: () => void;
  onSubmit: (input: CreatePartnerSupplierReturnInput) => Promise<void>;
};

const reasonOptions: Array<{ value: PartnerSupplierReturnReason; label: string }> = [
  { value: "DAMAGED", label: "Damaged" },
  { value: "WRONG_ITEM", label: "Wrong item" },
  { value: "EXPIRED", label: "Expired" },
  { value: "EXCESS_STOCK", label: "Excess stock" },
  { value: "OTHER", label: "Other" },
];

const numberFormatter = new Intl.NumberFormat("en-IN");

function makeLine(): ReturnLine {
  return {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    catalogItemId: "",
    reason: "DAMAGED",
  };
}

function digitsOnly(value: string) {
  return value.replace(/\D+/g, "");
}

function numberValue(value: number | undefined) {
  return Number.isFinite(value) ? Number(value) : 0;
}

function availableQuantity(item: PartnerInventoryItem) {
  return item.availableQuantity ?? Math.max(item.quantity - (item.reservedQuantity ?? 0), 0);
}

function formatPercent(value: number | undefined) {
  return `${numberValue(value)}%`;
}

function allocationKey(lineId: string, inventoryItemId: string) {
  return `${lineId}:${inventoryItemId}`;
}

function buildLineViews(lines: ReturnLine[], returnableItems: PartnerInventoryItem[]) {
  return lines.map<ReturnLineView>((line) => {
    const stockLots = returnableItems
      .filter((item) => item.catalogItemId === line.catalogItemId)
      .sort(
        (left, right) =>
          numberValue(left.mrp) - numberValue(right.mrp) ||
          numberValue(left.discountPercentage) - numberValue(right.discountPercentage) ||
          numberValue(left.taxPercentage) - numberValue(right.taxPercentage),
      );
    const firstLot = stockLots[0];
    return {
      line,
      itemName: firstLot?.itemName ?? "",
      sku: firstLot?.sku ?? "",
      stockLots,
      availableQuantity: stockLots.reduce((sum, item) => sum + availableQuantity(item), 0),
    };
  });
}

function getAllocatedQuantity(view: ReturnLineView, allocatedQuantities: Record<string, string>) {
  return view.stockLots.reduce((sum, lot) => {
    const quantity = Number.parseInt(allocatedQuantities[allocationKey(view.line.id, lot.itemId)] || "0", 10) || 0;
    return sum + quantity;
  }, 0);
}

function FieldLabel({ children }: { children: string }) {
  return <span className="block h-5 text-sm font-medium text-slate-700">{children}</span>;
}

export function SupplierReturnFormPanel({
  brandId,
  suppliers,
  inventoryItems,
  initialReturn = null,
  submitLabel = "Create return",
  savingLabel = "Creating...",
  inventoryLoading = false,
  inventoryError = "",
  saving = false,
  onRetryInventory,
  onCancel,
  onSubmit,
}: Props) {
  const [supplierId, setSupplierId] = useState("");
  const [returnDate, setReturnDate] = useState(initialReturn?.returnDate ?? todayISO());
  const [note, setNote] = useState(initialReturn?.note ?? "");
  const [lines, setLines] = useState<ReturnLine[]>([makeLine()]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [allocationErrors, setAllocationErrors] = useState<Record<string, string>>({});
  const [allocatedQuantities, setAllocatedQuantities] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");

  const activeSuppliers = useMemo(() => suppliers.filter((supplier) => supplier.status === "ACTIVE"), [suppliers]);
  const supplierOptions = useMemo(
    () => activeSuppliers.map((supplier) => ({ value: supplier.id, label: supplier.supplierName })),
    [activeSuppliers],
  );
  const returnableItems = useMemo(
    () => {
      const ownQuantities = new Map<string, number>();
      if (initialReturn?.status === "PLACED") {
        for (const item of initialReturn.items) {
          ownQuantities.set(item.itemId, (ownQuantities.get(item.itemId) ?? 0) + item.quantity);
        }
      }
      return inventoryItems
        .filter((item) => item.status === "ACTIVE" && availableQuantity(item) + (ownQuantities.get(item.itemId) ?? 0) > 0)
        .map((item) => ({
          ...item,
          availableQuantity: availableQuantity(item) + (ownQuantities.get(item.itemId) ?? 0),
        }));
    },
    [initialReturn, inventoryItems],
  );
  const productOptions = useMemo(() => {
    const grouped = new Map<string, { itemName: string; sku: string; available: number; lotCount: number }>();
    for (const item of returnableItems) {
      const current = grouped.get(item.catalogItemId) ?? {
        itemName: item.itemName,
        sku: item.sku,
        available: 0,
        lotCount: 0,
      };
      current.available += availableQuantity(item);
      current.lotCount += 1;
      grouped.set(item.catalogItemId, current);
    }
    return [...grouped.entries()]
      .sort((left, right) => left[1].itemName.localeCompare(right[1].itemName))
      .map(([value, item]) => ({
        value,
        label: `${item.itemName} · ${item.sku}`,
        description: `${numberFormatter.format(item.available)} available across ${item.lotCount} lot${item.lotCount === 1 ? "" : "s"}`,
      }));
  }, [returnableItems]);
  const productById = useMemo(() => new Map(productOptions.map((option) => [option.value, option])), [productOptions]);
  const lineViews = useMemo(() => buildLineViews(lines, returnableItems), [lines, returnableItems]);

  useEffect(() => {
    setSupplierId((current) => current || initialReturn?.supplierId || activeSuppliers[0]?.id || "");
  }, [activeSuppliers, initialReturn]);

  useEffect(() => {
    if (supplierId || !activeSuppliers[0]?.id) return;
    setSupplierId(activeSuppliers[0].id);
  }, [activeSuppliers, supplierId]);

  useEffect(() => {
    if (!initialReturn || inventoryItems.length === 0) return;
    setSupplierId(initialReturn.supplierId);
    setReturnDate(initialReturn.returnDate);
    setNote(initialReturn.note ?? "");
    const catalogByItem = new Map(inventoryItems.map((item) => [item.itemId, item.catalogItemId]));
    const lineByCatalog = new Map<string, ReturnLine>();
    const nextAllocations: Record<string, string> = {};
    for (const item of initialReturn.items) {
      const catalogItemId = catalogByItem.get(item.itemId);
      if (!catalogItemId) continue;
      let line = lineByCatalog.get(catalogItemId);
      if (!line) {
        line = {
          id: `${catalogItemId}_${Math.random().toString(36).slice(2, 8)}`,
          catalogItemId,
          reason: item.reason,
        };
        lineByCatalog.set(catalogItemId, line);
      }
      nextAllocations[allocationKey(line.id, item.itemId)] = String(item.quantity);
    }
    const nextLines = [...lineByCatalog.values()];
    setLines(nextLines.length > 0 ? nextLines : [makeLine()]);
    setAllocatedQuantities(nextAllocations);
  }, [initialReturn, inventoryItems]);

  function updateLine(lineId: string, patch: Partial<ReturnLine>) {
    setLines((current) => current.map((line) => (line.id === lineId ? { ...line, ...patch } : line)));
    setFieldErrors((current) => {
      const next = { ...current };
      delete next.items;
      return next;
    });
  }

  function getAllocationError(view: ReturnLineView, lot: PartnerInventoryItem) {
    const rawValue = allocatedQuantities[allocationKey(view.line.id, lot.itemId)] ?? "";
    const quantity = Number.parseInt(rawValue || "0", 10) || 0;
    if (rawValue.trim() && quantity < 0) return "Enter a valid quantity.";
    if (quantity > availableQuantity(lot)) return "Exceeds available.";
    return "";
  }

  function validateForm() {
    const nextFieldErrors: Record<string, string> = {};
    const nextAllocationErrors: Record<string, string> = {};
    if (!supplierId) nextFieldErrors.supplierId = "Business name is required.";
    if (!brandId) nextFieldErrors.brandId = "Brand is required.";
    if (!returnDate) nextFieldErrors.returnDate = "Return date is required.";
    if (lines.length === 0) nextFieldErrors.items = "Add at least one item.";

    const seen = new Set<string>();
    for (const [index, line] of lines.entries()) {
      const view = lineViews[index];
      const allocatedQuantity = view ? getAllocatedQuantity(view, allocatedQuantities) : 0;
      if (!line.catalogItemId) nextFieldErrors[`items.${index}.catalogItemId`] = "Item is required.";
      if (line.catalogItemId && seen.has(line.catalogItemId)) nextFieldErrors[`items.${index}.catalogItemId`] = "This item is already added.";
      if (line.catalogItemId) seen.add(line.catalogItemId);
      if (line.catalogItemId && allocatedQuantity <= 0) nextAllocationErrors[line.id] = "Add return quantity against at least one stock lot.";
      for (const lot of view?.stockLots ?? []) {
        const error = getAllocationError(view, lot);
        if (error) nextAllocationErrors[allocationKey(line.id, lot.itemId)] = error;
      }
    }

    setFieldErrors(nextFieldErrors);
    setAllocationErrors(nextAllocationErrors);
    return Object.keys(nextFieldErrors).length === 0 && Object.keys(nextAllocationErrors).length === 0;
  }

  async function submit() {
    if (!validateForm()) return;
    setFormError("");
    try {
      const items = lineViews.flatMap((view) =>
        view.stockLots
          .map((lot) => ({
            itemId: lot.itemId,
            quantity: Number.parseInt(allocatedQuantities[allocationKey(view.line.id, lot.itemId)] || "0", 10) || 0,
            reason: view.line.reason,
          }))
          .filter((item) => item.quantity > 0),
      );
      await onSubmit({
        supplierId,
        brandId,
        returnDate,
        note: note.trim() || undefined,
        items,
      });
      onCancel();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong, please try again later");
    }
  }

  return (
    <div className="grid gap-5">
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-4 lg:grid-cols-2">
          <FormField label="Business name" required error={fieldErrors.supplierId}>
            <Select value={supplierId} onValueChange={setSupplierId} options={supplierOptions} searchable searchPlaceholder="Search businesses..." disabled={saving} />
          </FormField>
          <FormField label="Return date" required error={fieldErrors.returnDate}>
            <AppInput type="date" value={returnDate} disabled={saving} onChange={(event) => setReturnDate(event.target.value)} />
          </FormField>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-base font-semibold text-slate-900">Return lines</p>
            {fieldErrors.items ? <p className="mt-1 text-sm text-rose-600">{fieldErrors.items}</p> : null}
          </div>
          <AppButton
            variant="outline"
            className="h-10 px-3 text-sm"
            disabled={saving || inventoryLoading || productOptions.length === 0}
            onClick={() => setLines((current) => [...current, makeLine()])}
          >
            <Plus className="mr-1 h-4 w-4" />
            Add line
          </AppButton>
        </div>

        {inventoryLoading ? <LoadingState label="Loading available stock..." /> : null}
        {inventoryError ? <ErrorState title="Stock unavailable" message={inventoryError} onRetry={onRetryInventory} /> : null}
        {!inventoryLoading && !inventoryError && productOptions.length === 0 ? (
          <EmptyState title="No returnable stock." description="Returns can only be created from stock lots currently available." />
        ) : null}

        {!inventoryLoading && !inventoryError && productOptions.length > 0 ? (
          <div className="grid gap-4">
            {lines.map((line, index) => {
              const product = productById.get(line.catalogItemId);
              const view = lineViews[index];
              const allocatedQuantity = view ? getAllocatedQuantity(view, allocatedQuantities) : 0;
              return (
                <div key={line.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="grid min-w-0 gap-3 xl:grid-cols-[minmax(360px,1fr)_220px_44px]">
                    <div className="min-w-0 space-y-2">
                      <FieldLabel>{`Item ${index + 1}`}</FieldLabel>
                      <Select
                        value={line.catalogItemId}
                        disabled={saving}
                        onValueChange={(value) => {
                          updateLine(line.id, { catalogItemId: value });
                          setAllocatedQuantities((current) => {
                            const next = { ...current };
                            for (const key of Object.keys(next)) {
                              if (key.startsWith(`${line.id}:`)) delete next[key];
                            }
                            return next;
                          });
                        }}
                        options={productOptions}
                        className="min-w-0"
                        searchable
                        searchPlaceholder="Search items"
                      />
                      {fieldErrors[`items.${index}.catalogItemId`] ? (
                        <p className="text-xs text-rose-600">{fieldErrors[`items.${index}.catalogItemId`]}</p>
                      ) : product ? (
                        <p className="text-xs text-slate-500">{product.description}</p>
                      ) : null}
                    </div>
                    <div className="min-w-0 space-y-2">
                      <FieldLabel>Reason</FieldLabel>
                      <Select
                        value={line.reason}
                        disabled={saving}
                        onValueChange={(value) => updateLine(line.id, { reason: value as PartnerSupplierReturnReason })}
                        options={reasonOptions}
                      />
                    </div>
                    <div className="flex items-start pt-7">
                      <AppButton
                        variant="ghost"
                        className="h-11 w-11 px-0 text-rose-600 hover:bg-rose-50"
                        disabled={saving || lines.length === 1}
                        aria-label={`Remove line ${index + 1}`}
                        onClick={() => {
                          setLines((current) => current.filter((candidate) => candidate.id !== line.id));
                          setAllocatedQuantities((current) => {
                            const next = { ...current };
                            for (const key of Object.keys(next)) {
                              if (key.startsWith(`${line.id}:`)) delete next[key];
                            }
                            return next;
                          });
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </AppButton>
                    </div>
                  </div>

                  {view?.stockLots.length ? (
                    <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
                      <table className="w-full min-w-[760px] table-fixed text-sm">
                        <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                          <tr className="border-b border-slate-200">
                            <th className="w-[34%] px-4 py-3">Stock lot</th>
                            <th className="w-[13%] px-3 py-3 text-right">Cost</th>
                            <th className="w-[13%] px-3 py-3 text-right">Available</th>
                            <th className="w-[12%] px-3 py-3 text-right">Buy %</th>
                            <th className="w-[10%] px-3 py-3 text-right">GST</th>
                            <th className="w-[18%] px-4 py-3 text-right">Return qty</th>
                          </tr>
                        </thead>
                        <tbody>
                          {view.stockLots.map((lot) => {
                            const key = allocationKey(line.id, lot.itemId);
                            const error = allocationErrors[key] || getAllocationError(view, lot);
                            return (
                              <tr key={key} className="border-b border-slate-100 last:border-b-0">
                                <td className="px-4 py-3">
                                  <div className="truncate font-medium text-slate-800">{lot.itemName}</div>
                                  <div className="mt-1 truncate text-xs text-slate-500">{lot.sku}</div>
                                </td>
                                <td className="px-3 py-3 text-right tabular-nums text-slate-700">{numberFormatter.format(numberValue(lot.mrp))}</td>
                                <td className="px-3 py-3 text-right tabular-nums text-slate-700">{numberFormatter.format(availableQuantity(lot))}</td>
                                <td className="px-3 py-3 text-right tabular-nums text-slate-700">{formatPercent(lot.discountPercentage)}</td>
                                <td className="px-3 py-3 text-right tabular-nums text-slate-700">{formatPercent(lot.taxPercentage)}</td>
                                <td className="px-4 py-3">
                                  <div className="ml-auto w-28">
                                    <AppInput
                                      aria-label={`Return ${lot.itemName} from ${lot.sku}`}
                                      inputMode="numeric"
                                      value={allocatedQuantities[key] ?? ""}
                                      disabled={saving}
                                      className={cn(
                                        "h-10 rounded-xl bg-white text-right text-sm tabular-nums shadow-sm",
                                        error ? "border-rose-300 focus-visible:ring-2 focus-visible:ring-rose-200" : "border-slate-300 focus-visible:ring-2 focus-visible:ring-brand-100",
                                      )}
                                      onChange={(event) => {
                                        setAllocatedQuantities((current) => ({ ...current, [key]: digitsOnly(event.target.value) }));
                                        setAllocationErrors((current) => {
                                          const next = { ...current };
                                          delete next[key];
                                          delete next[line.id];
                                          return next;
                                        });
                                      }}
                                      onFocus={(event) => event.target.select()}
                                    />
                                    {error ? <p className="mt-1 text-right text-xs text-rose-600">{error}</p> : null}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                        <span className="text-slate-500">Available across lots: {numberFormatter.format(view.availableQuantity)}</span>
                        <span className={cn("font-semibold tabular-nums", allocationErrors[line.id] ? "text-rose-600" : "text-slate-900")}>
                          Return quantity: {numberFormatter.format(allocatedQuantity)}
                        </span>
                      </div>
                    </div>
                  ) : null}
                  {allocationErrors[line.id] ? <p className="mt-2 text-sm text-rose-600">{allocationErrors[line.id]}</p> : null}
                </div>
              );
            })}
          </div>
        ) : null}

        {formError ? <div className="mt-4"><ErrorState title="Return failed" message={formError} onRetry={() => setFormError("")} /></div> : null}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <FormField label="Note">
          <Textarea
            value={note}
            disabled={saving}
            placeholder="Optional return note"
            onChange={(event) => setNote(event.target.value)}
            className="min-h-[112px] rounded-2xl border-slate-200 bg-white px-4 py-3 text-[15px]"
          />
        </FormField>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row sm:justify-end">
          <AppButton variant="ghost" className="h-11 w-full rounded-2xl px-5 text-sm font-medium whitespace-nowrap sm:w-auto" disabled={saving} onClick={onCancel}>
            Cancel
          </AppButton>
          <AppButton
            className="h-11 w-full rounded-2xl px-6 text-sm font-semibold whitespace-nowrap shadow-lg shadow-brand-500/20 sm:w-auto sm:min-w-[156px]"
            disabled={saving || inventoryLoading || productOptions.length === 0}
            onClick={() => void submit()}
          >
            <RotateCcw className="mr-1 h-4 w-4" />
            {saving ? savingLabel : submitLabel}
          </AppButton>
        </div>
      </div>
    </div>
  );
}
