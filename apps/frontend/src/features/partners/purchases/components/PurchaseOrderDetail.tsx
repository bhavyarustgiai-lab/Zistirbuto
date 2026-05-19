import { ArrowLeft, PackageCheck, Pencil, Plus, Printer, Send, Trash2, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@components/ui/button";
import { Card, CardContent } from "@components/ui/card";
import { Input } from "@components/ui/input";
import { Select } from "@components/ui/select";
import { Textarea } from "@components/ui/textarea";
import { DocumentPrintDialog } from "@features/partners/documents/components/DocumentPrintDialog";
import { GRNPrintView } from "@features/partners/documents/components/GRNPrintView";
import { PartnerFieldLabel } from "@features/partners/PartnerFieldLabel";
import type { PartnerCatalogItem, PartnerGoodsReceipt, PartnerPurchase, PartnerSupplier } from "@shared/types/domain";
import { PurchaseStatusBadge } from "./PurchaseStatusBadge";
import { formatDate, formatMoney } from "../utils";

type EditablePurchaseLine = {
  id: string;
  itemId: string;
  quantity: string;
  costPrice: string;
  discountPercentage: string;
  taxPercentage: string;
};

type Props = {
  purchase: PartnerPurchase;
  receipts: PartnerGoodsReceipt[];
  catalogItems: PartnerCatalogItem[];
  suppliers: PartnerSupplier[];
  onOrder: () => void;
  onReceive: () => void;
  onSaveSupplierDetails: (input: { supplierId: string; supplierInvoiceNumber?: string }) => Promise<void>;
  onSaveItems: (
    items: Array<{ itemId: string; quantity: number; costPrice: number; discountPercentage?: number; taxPercentage?: number }>,
    notes?: string,
  ) => Promise<void>;
  onCancel: () => void;
  isMutating?: boolean;
};

function decimalOnly(value: string) {
  const cleaned = value.replace(/[^\d.]/g, "");
  const [integerPart, ...decimalParts] = cleaned.split(".");
  return decimalParts.length > 0 ? `${integerPart}.${decimalParts.join("")}` : integerPart;
}

function toNumber(value: string) {
  const parsed = Number.parseFloat(value || "0");
  return Number.isFinite(parsed) ? parsed : 0;
}

function lineTotal(line: EditablePurchaseLine) {
  const quantity = Number.parseInt(line.quantity || "0", 10);
  const costPrice = toNumber(line.costPrice);
  const discount = toNumber(line.discountPercentage);
  const tax = toNumber(line.taxPercentage);
  if (!quantity || quantity <= 0 || costPrice < 0) return 0;
  return quantity * costPrice * (1 - discount / 100) * (1 + tax / 100);
}

function makeEditableLines(purchase: PartnerPurchase): EditablePurchaseLine[] {
  return purchase.items.map((item) => ({
    id: item.id,
    itemId: item.itemId,
    quantity: String(item.quantity),
    costPrice: String(item.costPrice),
    discountPercentage: String(item.discountPercentage ?? 0),
    taxPercentage: String(item.taxPercentage ?? 0),
  }));
}

function makeNewLine(catalogItems: PartnerCatalogItem[]): EditablePurchaseLine {
  return {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    itemId: catalogItems.find((item) => item.status === "ACTIVE")?.id ?? "",
    quantity: "1",
    costPrice: "",
    discountPercentage: "",
    taxPercentage: "",
  };
}

function ReadOnlyField({ value, placeholder = "-" }: { value?: string; placeholder?: string }) {
  return (
    <div className="flex h-12 min-w-0 items-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-950">
      <span className="truncate">{value || placeholder}</span>
    </div>
  );
}

export function PurchaseOrderDetail({
  purchase,
  receipts,
  catalogItems,
  suppliers,
  onOrder,
  onReceive,
  onSaveSupplierDetails,
  onSaveItems,
  onCancel,
  isMutating,
}: Props) {
  const canReceive = purchase.status === "PLACED";
  const canEdit = (purchase.status === "DRAFT" || purchase.status === "PLACED") && purchase.receivedQuantity === 0 && purchase.damagedQuantity === 0;
  const [printingReceipt, setPrintingReceipt] = useState<PartnerGoodsReceipt | null>(null);
  const [editingItems, setEditingItems] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(false);
  const [supplierId, setSupplierId] = useState(purchase.supplierId);
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState(purchase.supplierInvoiceNumber ?? "");
  const [editableNotes, setEditableNotes] = useState(purchase.notes ?? "");
  const [editableLines, setEditableLines] = useState<EditablePurchaseLine[]>(() => makeEditableLines(purchase));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [savingItems, setSavingItems] = useState(false);
  const [supplierFieldErrors, setSupplierFieldErrors] = useState<Record<string, string>>({});
  const [supplierFormError, setSupplierFormError] = useState("");
  const [savingSupplier, setSavingSupplier] = useState(false);

  const activeCatalogItems = useMemo(() => catalogItems.filter((item) => item.status === "ACTIVE"), [catalogItems]);
  const activeSuppliers = useMemo(() => suppliers.filter((supplier) => supplier.status === "ACTIVE"), [suppliers]);
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
  const editableTotal = useMemo(() => editableLines.reduce((sum, line) => sum + lineTotal(line), 0), [editableLines]);

  useEffect(() => {
    if (!editingItems) {
      setEditableLines(makeEditableLines(purchase));
      setEditableNotes(purchase.notes ?? "");
      setFieldErrors({});
      setFormError("");
    }
  }, [editingItems, purchase]);

  useEffect(() => {
    if (!editingSupplier) {
      setSupplierId(purchase.supplierId);
      setSupplierInvoiceNumber(purchase.supplierInvoiceNumber ?? "");
      setSupplierFieldErrors({});
      setSupplierFormError("");
    }
  }, [editingSupplier, purchase]);

  const updateLine = (lineId: string, patch: Partial<EditablePurchaseLine>) => {
    setEditableLines((current) => current.map((line) => (line.id === lineId ? { ...line, ...patch } : line)));
  };

  const saveItemChanges = async () => {
    const nextErrors: Record<string, string> = {};
    if (editableLines.length === 0) nextErrors.items = "Add at least one item.";
    const seen = new Set<string>();
    const items = editableLines.map((line, index) => {
      const quantity = Number.parseInt(line.quantity || "0", 10);
      const costPrice = toNumber(line.costPrice);
      const discountPercentage = toNumber(line.discountPercentage);
      const taxPercentage = toNumber(line.taxPercentage);
      if (!line.itemId) nextErrors[`items.${index}.itemId`] = "Item is required.";
      if (line.itemId && seen.has(line.itemId)) nextErrors[`items.${index}.itemId`] = "This item is already added.";
      if (line.itemId) seen.add(line.itemId);
      if (!quantity || quantity <= 0) nextErrors[`items.${index}.quantity`] = "Qty must be positive.";
      if (line.costPrice.trim() === "" || !Number.isFinite(costPrice) || costPrice < 0) nextErrors[`items.${index}.costPrice`] = "Cost is required.";
      if (line.discountPercentage.trim() === "") {
        nextErrors[`items.${index}.discountPercentage`] = "Discount is required.";
      } else if (discountPercentage < 0 || discountPercentage > 100) {
        nextErrors[`items.${index}.discountPercentage`] = "Discount must be 0 to 100.";
      }
      if (line.taxPercentage.trim() === "") {
        nextErrors[`items.${index}.taxPercentage`] = "GST is required.";
      } else if (taxPercentage < 0 || taxPercentage > 100) {
        nextErrors[`items.${index}.taxPercentage`] = "GST must be 0 to 100.";
      }
      return { itemId: line.itemId, quantity, costPrice, discountPercentage, taxPercentage };
    });
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setSavingItems(true);
    setFormError("");
    try {
      await onSaveItems(items, editableNotes.trim() || undefined);
      setEditingItems(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong, please try again later");
    } finally {
      setSavingItems(false);
    }
  };

  const saveSupplierDetails = async () => {
    const nextErrors: Record<string, string> = {};
    if (!supplierId) nextErrors.supplierId = "Business name is required.";
    setSupplierFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setSavingSupplier(true);
    setSupplierFormError("");
    try {
      await onSaveSupplierDetails({
        supplierId,
        supplierInvoiceNumber: supplierInvoiceNumber.trim() || undefined,
      });
      setEditingSupplier(false);
    } catch (err) {
      setSupplierFormError(err instanceof Error ? err.message : "Something went wrong, please try again later");
    } finally {
      setSavingSupplier(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link to="/partners/supply/purchases" className="mb-3 inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">{purchase.purchaseNumber}</h1>
            <PurchaseStatusBadge status={purchase.status} />
          </div>
          <p className="mt-1 text-sm text-slate-500">PO {formatDate(purchase.purchaseDate)}</p>
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          {purchase.status === "DRAFT" ? (
            <Button className="h-10 px-3 text-sm" disabled={isMutating} onClick={onOrder}>
              <Send className="mr-1 h-4 w-4" />
              Mark Placed
            </Button>
          ) : null}
          {canReceive ? (
            <Button variant="outline" className="h-10 px-3 text-sm" disabled={isMutating} onClick={onReceive}>
              <PackageCheck className="mr-1 h-4 w-4" />
              Record stock inward
            </Button>
          ) : null}
          {purchase.status === "DRAFT" || purchase.status === "PLACED" ? (
            <Button variant="outline" className="h-10 px-3 text-sm text-rose-700" disabled={isMutating} onClick={onCancel}>
              <XCircle className="mr-1 h-4 w-4" />
              Cancel PO
            </Button>
          ) : null}
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="grid gap-4 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-950">Supplier details</h2>
            </div>
            {!editingSupplier && canEdit ? (
              <Button
                variant="outline"
                className="h-10 w-full px-3 text-sm sm:w-auto"
                disabled={isMutating || editingItems || activeSuppliers.length === 0}
                onClick={() => {
                  setSupplierId(purchase.supplierId);
                  setSupplierInvoiceNumber(purchase.supplierInvoiceNumber ?? "");
                  setEditingSupplier(true);
                }}
              >
                <Pencil className="mr-1 h-4 w-4" />
                Edit details
              </Button>
            ) : null}
          </div>
          <div className="grid min-w-0 gap-4 md:grid-cols-2 [&>*]:min-w-0">
            <div className="min-w-0">
              <PartnerFieldLabel>Business name</PartnerFieldLabel>
              {editingSupplier ? (
                <>
                  <Select
                    value={supplierId}
                    onValueChange={setSupplierId}
                    options={supplierOptions}
                    searchable
                    searchPlaceholder="Search suppliers..."
                  />
                  {supplierFieldErrors.supplierId ? <p className="mt-1 text-xs text-rose-600">{supplierFieldErrors.supplierId}</p> : null}
                </>
              ) : (
                <ReadOnlyField value={purchase.supplierName} />
              )}
            </div>
            <div className="min-w-0">
              <PartnerFieldLabel required={false}>Invoice No</PartnerFieldLabel>
              {editingSupplier ? (
                <Input value={supplierInvoiceNumber} onChange={(event) => setSupplierInvoiceNumber(event.target.value)} className="h-12 bg-white" />
              ) : (
                <ReadOnlyField value={purchase.supplierInvoiceNumber} />
              )}
            </div>
          </div>
          {editingSupplier ? (
            <div className="grid justify-end gap-2 sm:flex sm:items-center">
              {supplierFormError ? <p className="text-sm text-rose-600 sm:mr-2">{supplierFormError}</p> : null}
              <Button
                variant="ghost"
                className="h-10 px-3 text-sm"
                disabled={savingSupplier}
                onClick={() => {
                  setSupplierId(purchase.supplierId);
                  setSupplierInvoiceNumber(purchase.supplierInvoiceNumber ?? "");
                  setSupplierFieldErrors({});
                  setSupplierFormError("");
                  setEditingSupplier(false);
                }}
              >
                Cancel
              </Button>
              <Button className="h-10 px-4 text-sm" disabled={savingSupplier || activeSuppliers.length === 0} onClick={() => void saveSupplierDetails()}>
                {savingSupplier ? "Saving..." : "Save changes"}
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="min-w-0 overflow-hidden border-slate-200 shadow-sm">
        <CardContent className="grid min-w-0 gap-4 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-950">Items</h2>
              <p className="mt-1 text-sm text-slate-500">Purchase order lines</p>
            </div>
            {editingItems ? (
              <Button
                variant="outline"
                className="h-10 w-full px-3 text-sm sm:w-auto"
                disabled={activeCatalogItems.length === 0}
                onClick={() => setEditableLines((current) => [...current, makeNewLine(activeCatalogItems)])}
              >
                <Plus className="mr-1 h-4 w-4" />
                Add line
              </Button>
            ) : canEdit ? (
              <Button
                variant="outline"
                className="h-10 w-full px-3 text-sm sm:w-auto"
                disabled={isMutating || editingSupplier || activeCatalogItems.length === 0}
                onClick={() => {
                  setEditableLines(makeEditableLines(purchase));
                  setEditableNotes(purchase.notes ?? "");
                  setEditingItems(true);
                }}
              >
                <Pencil className="mr-1 h-4 w-4" />
                Edit items
              </Button>
            ) : null}
          </div>
          <div className="max-w-full overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[980px] table-fixed text-sm">
              <colgroup>
                <col className={editingItems ? "w-[34%]" : "w-[36%]"} />
                <col className="w-[10%]" />
                <col className="w-[14%]" />
                <col className="w-[12%]" />
                <col className="w-[10%]" />
                <col className="w-[14%]" />
                {editingItems ? <col className="w-[6rem]" /> : null}
              </colgroup>
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr className="border-b border-slate-200">
                  <th className="border-r border-slate-200 px-5 py-3 font-medium last:border-r-0">Item</th>
                  <th className="border-r border-slate-200 px-4 py-3 text-right font-medium last:border-r-0">Quantity</th>
                  <th className="border-r border-slate-200 px-4 py-3 text-right font-medium last:border-r-0">Cost</th>
                  <th className="border-r border-slate-200 px-4 py-3 text-right font-medium last:border-r-0">Discount %</th>
                  <th className="border-r border-slate-200 px-4 py-3 text-right font-medium last:border-r-0">GST %</th>
                  <th className="border-r border-slate-200 px-5 py-3 text-right font-medium last:border-r-0">Line total</th>
                  {editingItems ? <th className="px-4 py-3 text-right font-medium">Actions</th> : null}
                </tr>
              </thead>
              <tbody>
                {editingItems
                  ? editableLines.map((line, index) => (
                      <tr key={line.id} className="border-b border-slate-100 text-slate-800 last:border-b-0">
                        <td className="border-r border-slate-200 px-5 py-4 align-middle last:border-r-0">
                          <Select
                            value={line.itemId}
                            onValueChange={(value) => updateLine(line.id, { itemId: value })}
                            className="w-full"
                            options={itemOptions}
                            searchable
                            searchPlaceholder="Search items..."
                          />
                          {fieldErrors[`items.${index}.itemId`] ? <p className="mt-1 text-xs text-rose-600">{fieldErrors[`items.${index}.itemId`]}</p> : null}
                        </td>
                        <td className="border-r border-slate-200 px-4 py-4 align-middle last:border-r-0">
                          <Input
                            value={line.quantity}
                            onChange={(event) => updateLine(line.id, { quantity: event.target.value.replace(/\D/g, "") })}
                            className="h-10 w-full text-right tabular-nums"
                            inputMode="numeric"
                          />
                          {fieldErrors[`items.${index}.quantity`] ? <p className="mt-1 text-right text-xs text-rose-600">{fieldErrors[`items.${index}.quantity`]}</p> : null}
                        </td>
                        <td className="border-r border-slate-200 px-4 py-4 align-middle last:border-r-0">
                          <Input
                            value={line.costPrice}
                            onChange={(event) => updateLine(line.id, { costPrice: decimalOnly(event.target.value) })}
                            className="h-10 w-full text-right tabular-nums"
                            inputMode="decimal"
                          />
                          {fieldErrors[`items.${index}.costPrice`] ? <p className="mt-1 text-right text-xs text-rose-600">{fieldErrors[`items.${index}.costPrice`]}</p> : null}
                        </td>
                        <td className="border-r border-slate-200 px-4 py-4 align-middle last:border-r-0">
                          <Input
                            value={line.discountPercentage}
                            onChange={(event) => updateLine(line.id, { discountPercentage: decimalOnly(event.target.value) })}
                            className="h-10 w-full text-right tabular-nums"
                            inputMode="decimal"
                          />
                          {fieldErrors[`items.${index}.discountPercentage`] ? (
                            <p className="mt-1 text-right text-xs text-rose-600">{fieldErrors[`items.${index}.discountPercentage`]}</p>
                          ) : null}
                        </td>
                        <td className="border-r border-slate-200 px-4 py-4 align-middle last:border-r-0">
                          <Input
                            value={line.taxPercentage}
                            onChange={(event) => updateLine(line.id, { taxPercentage: decimalOnly(event.target.value) })}
                            className="h-10 w-full text-right tabular-nums"
                            inputMode="decimal"
                          />
                          {fieldErrors[`items.${index}.taxPercentage`] ? <p className="mt-1 text-right text-xs text-rose-600">{fieldErrors[`items.${index}.taxPercentage`]}</p> : null}
                        </td>
                        <td className="border-r border-slate-200 px-5 py-4 text-right align-middle font-medium tabular-nums text-slate-950 last:border-r-0">
                          {formatMoney(lineTotal(line))}
                        </td>
                        <td className="px-4 py-4 text-right align-middle">
                          <Button
                            variant="outline"
                            className="h-9 px-3 text-sm text-rose-700 hover:bg-rose-50 hover:text-rose-700"
                            disabled={editableLines.length === 1}
                            onClick={() => setEditableLines((current) => current.filter((candidate) => candidate.id !== line.id))}
                            aria-label="Remove line"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  : purchase.items.map((item) => (
                      <tr key={item.id} className="border-b border-slate-100 text-slate-800 last:border-b-0">
                        <td className="border-r border-slate-200 px-5 py-4 align-middle last:border-r-0">
                          <div className="truncate font-medium text-slate-950">{item.itemName}</div>
                          <div className="mt-1 truncate text-xs text-slate-500">SKU {item.sku || "-"}</div>
                        </td>
                        <td className="border-r border-slate-200 px-4 py-4 text-right align-middle tabular-nums last:border-r-0">{item.quantity}</td>
                        <td className="border-r border-slate-200 px-4 py-4 text-right align-middle tabular-nums last:border-r-0">{formatMoney(item.costPrice)}</td>
                        <td className="border-r border-slate-200 px-4 py-4 text-right align-middle tabular-nums last:border-r-0">{item.discountPercentage ?? 0}</td>
                        <td className="border-r border-slate-200 px-4 py-4 text-right align-middle tabular-nums last:border-r-0">{item.taxPercentage ?? 0}</td>
                        <td className="px-5 py-4 text-right align-middle font-medium tabular-nums text-slate-950">{formatMoney(item.lineTotal)}</td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
          {fieldErrors.items ? <p className="text-sm text-rose-600">{fieldErrors.items}</p> : null}
          <div className="ml-auto grid w-full max-w-sm gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
            <div className="flex justify-between gap-4 text-base font-semibold text-slate-950">
              <span>Total</span>
              <span className="tabular-nums">{formatMoney(editingItems ? editableTotal : purchase.totalAmount)}</span>
            </div>
          </div>
          <div>
            <PartnerFieldLabel required={false}>Notes</PartnerFieldLabel>
            {editingItems ? (
              <Textarea
                value={editableNotes}
                onChange={(event) => setEditableNotes(event.target.value)}
                className="min-h-28 bg-white"
                placeholder="Internal purchase note"
              />
            ) : (
              <div className="min-h-28 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950">
                {purchase.notes ? <p className="whitespace-pre-wrap">{purchase.notes}</p> : <span className="text-slate-400">No notes added</span>}
              </div>
            )}
          </div>
          {editingItems ? (
            <div className="grid justify-end gap-2 sm:flex sm:items-center">
              {formError ? <p className="text-sm text-rose-600 sm:mr-2">{formError}</p> : null}
              <Button
                variant="ghost"
                className="h-10 px-3 text-sm"
                disabled={savingItems}
                onClick={() => {
                  setEditableLines(makeEditableLines(purchase));
                  setEditableNotes(purchase.notes ?? "");
                  setFieldErrors({});
                  setFormError("");
                  setEditingItems(false);
                }}
              >
                Cancel
              </Button>
              <Button className="h-10 px-4 text-sm" disabled={savingItems || activeCatalogItems.length === 0} onClick={() => void saveItemChanges()}>
                {savingItems ? "Saving..." : "Save changes"}
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <p className="text-sm font-semibold text-slate-950">GRNs</p>
          {receipts.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">No receipts recorded yet.</p>
          ) : (
            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {receipts.map((receipt) => (
                <div key={receipt.id} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-slate-900">{receipt.grnNumber}</p>
                    <p className="text-xs text-slate-500">{formatDate(receipt.receivedDate)}</p>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {receipt.items.reduce((sum, item) => sum + item.receivedQuantity, 0)} received ·{" "}
                    {receipt.items.reduce((sum, item) => sum + item.damagedQuantity, 0)} damaged
                  </p>
                  <Button variant="ghost" className="mt-2 h-8 px-2 text-xs" onClick={() => setPrintingReceipt(receipt)}>
                    <Printer className="mr-1 h-3.5 w-3.5" />
                    Print GRN
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <DocumentPrintDialog
        open={Boolean(printingReceipt)}
        title={printingReceipt?.grnNumber ? `Print ${printingReceipt.grnNumber}` : "Print GRN"}
        onClose={() => setPrintingReceipt(null)}
      >
        {printingReceipt ? <GRNPrintView receipt={printingReceipt} purchase={purchase} /> : null}
      </DocumentPrintDialog>
    </div>
  );
}
