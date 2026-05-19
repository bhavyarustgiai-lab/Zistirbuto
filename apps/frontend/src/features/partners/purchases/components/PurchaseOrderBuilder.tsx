import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@components/ui/button";
import { Card, CardContent } from "@components/ui/card";
import { Input } from "@components/ui/input";
import { Select } from "@components/ui/select";
import { Textarea } from "@components/ui/textarea";
import { PartnerFieldLabel } from "@features/partners/PartnerFieldLabel";
import type {
  PartnerCatalogItem,
  PartnerPurchase,
  PartnerSupplier,
} from "@shared/types/domain";

type PurchaseLine = {
  id: string;
  itemId: string;
  quantity: string;
  costPrice: string;
  discountPercentage: string;
  taxPercentage: string;
};

type PurchaseOrderBuilderProps = {
  brandName: string;
  suppliers: PartnerSupplier[];
  catalogItems: PartnerCatalogItem[];
  initialPurchase?: PartnerPurchase | null;
  submitLabel?: string;
  savingLabel?: string;
  onCancel: () => void;
  onSubmit: (input: {
    supplierId: string;
    purchaseNumber: string;
    supplierInvoiceNumber?: string;
    notes?: string;
    items: Array<{
      itemId: string;
      quantity: number;
      costPrice: number;
      discountPercentage?: number;
      taxPercentage?: number;
    }>;
  }) => Promise<PartnerPurchase | void>;
};

function makeLine(catalogItems: PartnerCatalogItem[]): PurchaseLine {
  return {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    itemId: catalogItems.find((item) => item.status === "ACTIVE")?.id ?? "",
    quantity: "1",
    costPrice: "",
    discountPercentage: "",
    taxPercentage: "",
  };
}

function makeLinesFromPurchase(purchase: PartnerPurchase): PurchaseLine[] {
  return purchase.items.map((item) => ({
    id: item.id,
    itemId: item.itemId,
    quantity: String(item.quantity),
    costPrice: String(item.costPrice),
    discountPercentage: String(item.discountPercentage ?? 0),
    taxPercentage: String(item.taxPercentage ?? 0),
  }));
}

function decimalOnly(value: string) {
  const cleaned = value.replace(/[^\d.]/g, "");
  const [integerPart, ...decimalParts] = cleaned.split(".");
  return decimalParts.length > 0
    ? `${integerPart}.${decimalParts.join("")}`
    : integerPart;
}

function toNumber(value: string) {
  const parsed = Number.parseFloat(value || "0");
  return Number.isFinite(parsed) ? parsed : 0;
}

function lineTotal(line: PurchaseLine) {
  const quantity = Number.parseInt(line.quantity || "0", 10);
  const costPrice = toNumber(line.costPrice);
  const discount = toNumber(line.discountPercentage);
  const tax = toNumber(line.taxPercentage);
  if (!quantity || quantity <= 0 || costPrice < 0) return 0;
  return quantity * costPrice * (1 - discount / 100) * (1 + tax / 100);
}

function money(value: number) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
    style: "currency",
    currency: "INR",
  }).format(value);
}

function generatePurchaseNumber() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replaceAll("-", "");
  const time = now.toTimeString().slice(0, 8).replaceAll(":", "");
  const millis = String(now.getMilliseconds()).padStart(3, "0");
  return `PO-${date}-${time}${millis}`;
}

export function PurchaseOrderBuilder({
  brandName,
  suppliers,
  catalogItems,
  initialPurchase,
  submitLabel = "Create PO",
  savingLabel = "Creating...",
  onCancel,
  onSubmit,
}: PurchaseOrderBuilderProps) {
  const [supplierId, setSupplierId] = useState(initialPurchase?.supplierId ?? "");
  const [purchaseNumber] = useState(() => initialPurchase?.purchaseNumber ?? generatePurchaseNumber());
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState(initialPurchase?.supplierInvoiceNumber ?? "");
  const [notes, setNotes] = useState(initialPurchase?.notes ?? "");
  const [lines, setLines] = useState<PurchaseLine[]>(() =>
    initialPurchase ? makeLinesFromPurchase(initialPurchase) : [makeLine(catalogItems)],
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const activeSuppliers = useMemo(
    () => suppliers.filter((supplier) => supplier.status === "ACTIVE"),
    [suppliers],
  );
  const activeCatalogItems = useMemo(
    () => catalogItems.filter((item) => item.status === "ACTIVE"),
    [catalogItems],
  );
  const activeCatalogIds = useMemo(
    () => new Set(activeCatalogItems.map((item) => item.id)),
    [activeCatalogItems],
  );

  useEffect(() => {
    setSupplierId((current) => current || activeSuppliers[0]?.id || "");
  }, [activeSuppliers]);

  useEffect(() => {
    setLines((current) => {
      if (current.length === 0) return [makeLine(activeCatalogItems)];
      return current.map((line) =>
        line.itemId && activeCatalogIds.has(line.itemId)
          ? line
          : { ...line, itemId: activeCatalogItems[0]?.id ?? "" },
      );
    });
  }, [activeCatalogIds, activeCatalogItems]);

  const supplierOptions = useMemo(
    () =>
      activeSuppliers.map((supplier) => ({
        value: supplier.id,
        label: supplier.supplierName,
      })),
    [activeSuppliers],
  );

  const itemOptions = useMemo(
    () =>
      activeCatalogItems.map((item) => ({
        value: item.id,
        label: `${item.name} · ${item.sku}`,
      })),
    [activeCatalogItems],
  );

  const itemById = useMemo(
    () => new Map(activeCatalogItems.map((item) => [item.id, item])),
    [activeCatalogItems],
  );

  const totals = useMemo(() => {
    return lines.reduce(
      (acc, line) => {
        const quantity = Number.parseInt(line.quantity || "0", 10) || 0;
        return {
          lines: acc.lines + (line.itemId ? 1 : 0),
          quantity: acc.quantity + quantity,
          amount: acc.amount + lineTotal(line),
        };
      },
      { lines: 0, quantity: 0, amount: 0 },
    );
  }, [lines]);

  const updateLine = (lineId: string, patch: Partial<PurchaseLine>) => {
    setLines((current) =>
      current.map((line) =>
        line.id === lineId ? { ...line, ...patch } : line,
      ),
    );
  };

  const addLine = () => {
    setLines((current) => [...current, makeLine(activeCatalogItems)]);
  };

  const submit = async () => {
    const nextErrors: Record<string, string> = {};
    if (!supplierId) nextErrors.supplierId = "Supplier is required.";
    if (lines.length === 0) nextErrors.items = "Add at least one item.";

    const seen = new Set<string>();
    const items = lines.map((line, index) => {
      const quantity = Number.parseInt(line.quantity || "0", 10);
      const costPrice = toNumber(line.costPrice);
      const discountPercentage = toNumber(line.discountPercentage);
      const taxPercentage = toNumber(line.taxPercentage);
      if (!line.itemId)
        nextErrors[`items.${index}.itemId`] = "Item is required.";
      if (line.itemId && seen.has(line.itemId))
        nextErrors[`items.${index}.itemId`] = "This item is already added.";
      if (line.itemId) seen.add(line.itemId);
      if (!quantity || quantity <= 0)
        nextErrors[`items.${index}.quantity`] = "Qty must be positive.";
      if (line.costPrice.trim() === "" || !Number.isFinite(costPrice) || costPrice < 0)
        nextErrors[`items.${index}.costPrice`] = "Cost is required.";
      if (line.discountPercentage.trim() === "")
        nextErrors[`items.${index}.discountPercentage`] =
          "Discount is required.";
      else if (discountPercentage < 0 || discountPercentage > 100)
        nextErrors[`items.${index}.discountPercentage`] =
          "Discount must be 0 to 100.";
      if (line.taxPercentage.trim() === "")
        nextErrors[`items.${index}.taxPercentage`] = "GST is required.";
      else if (taxPercentage < 0 || taxPercentage > 100)
        nextErrors[`items.${index}.taxPercentage`] = "GST must be 0 to 100.";
      return {
        itemId: line.itemId,
        quantity,
        costPrice,
        discountPercentage,
        taxPercentage,
      };
    });

    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    setFormError("");
    try {
      await onSubmit({
        supplierId,
        purchaseNumber,
        supplierInvoiceNumber: supplierInvoiceNumber.trim() || undefined,
        notes: notes.trim() || undefined,
        items,
      });
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Something went wrong, please try again later",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid min-w-0 gap-4">
      <div className="grid min-w-0 gap-4">
        <Card className="min-w-0 overflow-hidden border-slate-200 shadow-sm">
          <CardContent className="grid min-w-0 gap-4 p-4 sm:p-5">
            <div className="grid min-w-0 gap-4 md:grid-cols-2 [&>*]:min-w-0">
              <div className="min-w-0">
                <PartnerFieldLabel>Supplier</PartnerFieldLabel>
                <Select
                  value={supplierId}
                  onValueChange={setSupplierId}
                  options={supplierOptions}
                  searchable
                  searchPlaceholder="Search suppliers..."
                />
                {fieldErrors.supplierId ? (
                  <p className="mt-1 text-xs text-rose-600">
                    {fieldErrors.supplierId}
                  </p>
                ) : null}
              </div>
              <div className="min-w-0">
                <PartnerFieldLabel required={false}>
                  Supplier invoice no
                </PartnerFieldLabel>
                <Input
                  value={supplierInvoiceNumber}
                  onChange={(event) =>
                    setSupplierInvoiceNumber(event.target.value)
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0 overflow-hidden border-slate-200 shadow-sm">
          <CardContent className="grid min-w-0 gap-4 p-4 sm:p-5">
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-950">
                  Items
                </h2>
                <p className="mt-1 text-sm text-slate-500">Add catalog items</p>
              </div>
              <Button
                variant="outline"
                className="h-10 w-full px-3 text-sm sm:w-auto"
                onClick={addLine}
                disabled={activeCatalogItems.length === 0}
              >
                <Plus className="mr-1 h-4 w-4" />
                Add line
              </Button>
            </div>

            {activeCatalogItems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
                No active catalog items are available for this brand.
              </div>
            ) : (
              <>
                <div className="hidden max-w-full overflow-x-auto rounded-xl border border-slate-200 lg:block">
                  <table className="w-full min-w-[1120px] table-fixed border-collapse text-sm">
                    <colgroup>
                      <col className="w-[38%]" />
                      <col className="w-[88px]" />
                      <col className="w-[128px]" />
                      <col className="w-[116px]" />
                      <col className="w-[104px]" />
                      <col className="w-[132px]" />
                      <col className="w-[120px]" />
                    </colgroup>
                    <thead className="bg-slate-50 text-left text-slate-500">
                      <tr className="border-b border-slate-200">
                        <th className="border-r border-slate-200 px-4 py-3 font-medium last:border-r-0">Item</th>
                        <th className="border-r border-slate-200 px-3 py-3 text-right font-medium last:border-r-0">
                          Qty
                        </th>
                        <th className="border-r border-slate-200 px-3 py-3 text-right font-medium last:border-r-0">
                          Cost
                        </th>
                        <th className="border-r border-slate-200 px-3 py-3 text-right font-medium last:border-r-0">
                          Discount %
                        </th>
                        <th className="border-r border-slate-200 px-3 py-3 text-right font-medium last:border-r-0">
                          GST %
                        </th>
                        <th className="border-r border-slate-200 px-3 py-3 text-right font-medium last:border-r-0">
                          Line total
                        </th>
                        <th className="border-r border-slate-200 px-4 py-3 text-right font-medium last:border-r-0">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {lines.map((line, index) => (
                        <tr
                          key={line.id}
                          className="border-b border-slate-100 last:border-b-0"
                        >
                          <td className="border-r border-slate-200 px-4 py-3 align-middle last:border-r-0">
                            <Select
                              value={line.itemId}
                              onValueChange={(value) =>
                                updateLine(line.id, { itemId: value })
                              }
                              className="w-full"
                              options={itemOptions}
                              searchable
                              searchPlaceholder="Search items..."
                            />
                            {fieldErrors[`items.${index}.itemId`] ? (
                              <p className="mt-1 text-xs text-rose-600">
                                {fieldErrors[`items.${index}.itemId`]}
                              </p>
                            ) : null}
                          </td>
                          <td className="border-r border-slate-200 px-3 py-3 align-middle last:border-r-0">
                            <Input
                              value={line.quantity}
                              onChange={(event) =>
                                updateLine(line.id, {
                                  quantity: event.target.value.replace(
                                    /\D/g,
                                    "",
                                  ),
                                })
                              }
                              className="h-10 w-full text-right tabular-nums"
                              inputMode="numeric"
                            />
                            {fieldErrors[`items.${index}.quantity`] ? (
                              <p className="mt-1 text-right text-xs text-rose-600">
                                {fieldErrors[`items.${index}.quantity`]}
                              </p>
                            ) : null}
                          </td>
                          <td className="border-r border-slate-200 px-3 py-3 align-middle last:border-r-0">
                            <Input
                              value={line.costPrice}
                              onChange={(event) =>
                                updateLine(line.id, {
                                  costPrice: decimalOnly(event.target.value),
                                })
                              }
                              className="h-10 w-full text-right tabular-nums"
                              inputMode="decimal"
                            />
                            {fieldErrors[`items.${index}.costPrice`] ? (
                              <p className="mt-1 text-right text-xs text-rose-600">
                                {fieldErrors[`items.${index}.costPrice`]}
                              </p>
                            ) : null}
                          </td>
                          <td className="border-r border-slate-200 px-3 py-3 align-middle last:border-r-0">
                            <Input
                              value={line.discountPercentage}
                              onChange={(event) =>
                                updateLine(line.id, {
                                  discountPercentage: decimalOnly(
                                    event.target.value,
                                  ),
                                })
                              }
                              className="h-10 w-full text-right tabular-nums"
                              inputMode="decimal"
                            />
                            {fieldErrors[
                              `items.${index}.discountPercentage`
                            ] ? (
                              <p className="mt-1 text-right text-xs text-rose-600">
                                {
                                  fieldErrors[
                                    `items.${index}.discountPercentage`
                                  ]
                                }
                              </p>
                            ) : null}
                          </td>
                          <td className="border-r border-slate-200 px-3 py-3 align-middle last:border-r-0">
                            <Input
                              value={line.taxPercentage}
                              onChange={(event) =>
                                updateLine(line.id, {
                                  taxPercentage: decimalOnly(
                                    event.target.value,
                                  ),
                                })
                              }
                              onKeyDown={(event) => {
                                if (
                                  event.key === "Enter" &&
                                  index === lines.length - 1
                                )
                                  addLine();
                              }}
                              className="h-10 w-full text-right tabular-nums"
                              inputMode="decimal"
                            />
                            {fieldErrors[`items.${index}.taxPercentage`] ? (
                              <p className="mt-1 text-right text-xs text-rose-600">
                                {fieldErrors[`items.${index}.taxPercentage`]}
                              </p>
                            ) : null}
                          </td>
                          <td className="whitespace-nowrap border-r border-slate-200 px-3 py-3 text-right font-medium tabular-nums text-slate-900 align-middle last:border-r-0">
                            {money(lineTotal(line))}
                          </td>
                          <td className="border-r border-slate-200 px-4 py-3 text-right align-middle last:border-r-0">
                            <Button
                              variant="outline"
                              className="h-9 px-3 text-sm text-rose-700 hover:bg-rose-50 hover:text-rose-700"
                              disabled={lines.length === 1}
                              onClick={() =>
                                setLines((current) =>
                                  current.filter(
                                    (candidate) => candidate.id !== line.id,
                                  ),
                                )
                              }
                              aria-label="Remove line"
                            >
                              <Trash2 className="mr-1 h-4 w-4" />
                              Delete
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="grid gap-3 lg:hidden">
                  {lines.map((line, index) => {
                    const item = itemById.get(line.itemId);
                    return (
                      <div
                        key={line.id}
                        className="grid gap-3 rounded-xl border border-slate-200 bg-white p-3"
                      >
                        <div>
                          <PartnerFieldLabel>Item</PartnerFieldLabel>
                          <Select
                            value={line.itemId}
                            onValueChange={(value) =>
                              updateLine(line.id, { itemId: value })
                            }
                            options={itemOptions}
                            searchable
                            searchPlaceholder="Search items..."
                          />
                          {fieldErrors[`items.${index}.itemId`] ? (
                            <p className="mt-1 text-xs text-rose-600">
                              {fieldErrors[`items.${index}.itemId`]}
                            </p>
                          ) : null}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <PartnerFieldLabel>Qty</PartnerFieldLabel>
                            <Input
                              value={line.quantity}
                              onChange={(event) =>
                                updateLine(line.id, {
                                  quantity: event.target.value.replace(
                                    /\D/g,
                                    "",
                                  ),
                                })
                              }
                              inputMode="numeric"
                            />
                            {fieldErrors[`items.${index}.quantity`] ? (
                              <p className="mt-1 text-xs text-rose-600">
                                {fieldErrors[`items.${index}.quantity`]}
                              </p>
                            ) : null}
                          </div>
                          <div>
                            <PartnerFieldLabel>Cost</PartnerFieldLabel>
                            <Input
                              value={line.costPrice}
                              onChange={(event) =>
                                updateLine(line.id, {
                                  costPrice: decimalOnly(event.target.value),
                                })
                              }
                              inputMode="decimal"
                            />
                            {fieldErrors[`items.${index}.costPrice`] ? (
                              <p className="mt-1 text-xs text-rose-600">
                                {fieldErrors[`items.${index}.costPrice`]}
                              </p>
                            ) : null}
                          </div>
                          <div>
                            <PartnerFieldLabel>Discount %</PartnerFieldLabel>
                            <Input
                              value={line.discountPercentage}
                              onChange={(event) =>
                                updateLine(line.id, {
                                  discountPercentage: decimalOnly(
                                    event.target.value,
                                  ),
                                })
                              }
                              inputMode="decimal"
                            />
                          </div>
                          <div>
                            <PartnerFieldLabel>GST %</PartnerFieldLabel>
                            <Input
                              value={line.taxPercentage}
                              onChange={(event) =>
                                updateLine(line.id, {
                                  taxPercentage: decimalOnly(
                                    event.target.value,
                                  ),
                                })
                              }
                              inputMode="decimal"
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-900">
                              {item?.name ?? "Select item"}
                            </p>
                            <p className="text-xs text-slate-500">
                              Line total {money(lineTotal(line))}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            className="h-9 px-3 text-sm text-rose-700 hover:bg-rose-50 hover:text-rose-700"
                            disabled={lines.length === 1}
                            onClick={() =>
                              setLines((current) =>
                                current.filter(
                                  (candidate) => candidate.id !== line.id,
                                ),
                              )
                            }
                            aria-label="Remove line"
                          >
                            <Trash2 className="mr-1 h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="grid min-w-0 gap-4">
                  <div className="ml-auto grid max-w-sm gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                    <div className="flex justify-between gap-4 text-base font-semibold text-slate-950">
                      <span>Total</span>
                      <span className="tabular-nums">{money(totals.amount)}</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <PartnerFieldLabel required={false}>Notes</PartnerFieldLabel>
                    <Textarea
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      placeholder="Internal purchase note"
                    />
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="flex flex-col gap-3 p-4 sm:items-end sm:p-5">
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button
              variant="ghost"
              className="h-10 px-3 text-sm"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button
              className="h-10 px-4 text-sm"
              disabled={saving || activeCatalogItems.length === 0}
              onClick={() => void submit()}
            >
              {saving ? savingLabel : submitLabel}
            </Button>
          </div>
          {formError ? (
            <p className="text-sm text-rose-600 sm:basis-full">{formError}</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
