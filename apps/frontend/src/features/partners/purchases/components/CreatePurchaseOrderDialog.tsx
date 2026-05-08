import { Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@components/ui/button";
import { Dialog } from "@components/ui/dialog";
import { Input } from "@components/ui/input";
import { Select } from "@components/ui/select";
import { Textarea } from "@components/ui/textarea";
import { PartnerFieldLabel } from "@features/partners/PartnerFieldLabel";
import type { PartnerStockRow, PartnerSupplier } from "@shared/types/domain";

type PurchaseLine = {
  itemId: string;
  quantity: string;
  costPrice: string;
  discountPercentage: string;
  taxPercentage: string;
};

type Props = {
  open: boolean;
  suppliers: PartnerSupplier[];
  stockRows: PartnerStockRow[];
  onClose: () => void;
  onSubmit: (input: {
    supplierId: string;
    purchaseNumber: string;
    supplierInvoiceNumber?: string;
    supplierInvoiceDate?: string;
    purchaseDate: string;
    expectedInwardDate?: string;
    notes?: string;
    items: Array<{ itemId: string; quantity: number; costPrice: number; discountPercentage?: number; taxPercentage?: number }>;
  }) => Promise<void>;
};

function defaultLine(stockRows: PartnerStockRow[]): PurchaseLine {
  return {
    itemId: stockRows[0]?.itemId ?? "",
    quantity: "1",
    costPrice: "",
    discountPercentage: "0",
    taxPercentage: "0",
  };
}

export function CreatePurchaseOrderDialog({ open, suppliers, stockRows, onClose, onSubmit }: Props) {
  const [supplierId, setSupplierId] = useState("");
  const [purchaseNumber, setPurchaseNumber] = useState("");
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState("");
  const [supplierInvoiceDate, setSupplierInvoiceDate] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));
  const [expectedInwardDate, setExpectedInwardDate] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<PurchaseLine[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSupplierId(suppliers.find((supplier) => supplier.status === "ACTIVE")?.id ?? "");
    setPurchaseNumber(`PO-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}`);
    setSupplierInvoiceNumber("");
    setSupplierInvoiceDate("");
    setPurchaseDate(new Date().toISOString().slice(0, 10));
    setExpectedInwardDate("");
    setNotes("");
    setLines([defaultLine(stockRows)]);
    setFieldErrors({});
    setFormError("");
    setSaving(false);
  }, [open, stockRows, suppliers]);

  const supplierOptions = useMemo(
    () => suppliers.filter((supplier) => supplier.status === "ACTIVE").map((supplier) => ({ value: supplier.id, label: supplier.supplierName })),
    [suppliers],
  );
  const itemOptions = useMemo(
    () => stockRows.map((item) => ({ value: item.itemId, label: `${item.itemName} · ${item.sku}` })),
    [stockRows],
  );

  const updateLine = (index: number, patch: Partial<PurchaseLine>) => {
    setLines((current) => current.map((line, lineIndex) => (lineIndex === index ? { ...line, ...patch } : line)));
  };

  return (
    <Dialog open={open} onClose={onClose} title="Create purchase order" panelClassName="max-w-5xl">
      <div className="grid gap-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <PartnerFieldLabel>Supplier</PartnerFieldLabel>
            <Select value={supplierId} onValueChange={setSupplierId} options={supplierOptions} />
            {fieldErrors.supplierId ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.supplierId}</p> : null}
          </div>
          <div>
            <PartnerFieldLabel>PO number</PartnerFieldLabel>
            <Input value={purchaseNumber} onChange={(event) => setPurchaseNumber(event.target.value)} />
            {fieldErrors.purchaseNumber ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.purchaseNumber}</p> : null}
          </div>
          <div>
            <PartnerFieldLabel>PO date</PartnerFieldLabel>
            <Input type="date" value={purchaseDate} onChange={(event) => setPurchaseDate(event.target.value)} />
            {fieldErrors.purchaseDate ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.purchaseDate}</p> : null}
          </div>
          <div>
            <PartnerFieldLabel required={false}>Expected inward</PartnerFieldLabel>
            <Input type="date" value={expectedInwardDate} onChange={(event) => setExpectedInwardDate(event.target.value)} />
          </div>
          <div>
            <PartnerFieldLabel required={false}>Supplier invoice no</PartnerFieldLabel>
            <Input value={supplierInvoiceNumber} onChange={(event) => setSupplierInvoiceNumber(event.target.value)} />
          </div>
          <div>
            <PartnerFieldLabel required={false}>Supplier invoice date</PartnerFieldLabel>
            <Input type="date" value={supplierInvoiceDate} onChange={(event) => setSupplierInvoiceDate(event.target.value)} />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr className="border-b border-slate-200">
                <th className="px-4 py-3 font-medium">Item</th>
                <th className="px-3 py-3 text-right font-medium">Qty</th>
                <th className="px-3 py-3 text-right font-medium">Cost</th>
                <th className="px-3 py-3 text-right font-medium">Discount %</th>
                <th className="px-3 py-3 text-right font-medium">Tax %</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, index) => (
                <tr key={`${line.itemId}-${index}`} className="border-b border-slate-100 last:border-b-0">
                  <td className="px-4 py-3">
                    <Select value={line.itemId} onValueChange={(value) => updateLine(index, { itemId: value })} options={itemOptions} />
                    {fieldErrors[`items.${index}.itemId`] ? <p className="mt-1 text-xs text-rose-600">{fieldErrors[`items.${index}.itemId`]}</p> : null}
                  </td>
                  <td className="px-3 py-3">
                    <Input value={line.quantity} onChange={(event) => updateLine(index, { quantity: event.target.value.replace(/\D/g, "") })} className="ml-auto w-20 text-right" inputMode="numeric" />
                    {fieldErrors[`items.${index}.quantity`] ? <p className="mt-1 text-right text-xs text-rose-600">{fieldErrors[`items.${index}.quantity`]}</p> : null}
                  </td>
                  <td className="px-3 py-3">
                    <Input value={line.costPrice} onChange={(event) => updateLine(index, { costPrice: event.target.value.replace(/[^\d.]/g, "") })} className="ml-auto w-24 text-right" inputMode="decimal" />
                    {fieldErrors[`items.${index}.costPrice`] ? <p className="mt-1 text-right text-xs text-rose-600">{fieldErrors[`items.${index}.costPrice`]}</p> : null}
                  </td>
                  <td className="px-3 py-3">
                    <Input value={line.discountPercentage} onChange={(event) => updateLine(index, { discountPercentage: event.target.value.replace(/[^\d.]/g, "") })} className="ml-auto w-20 text-right" inputMode="decimal" />
                  </td>
                  <td className="px-3 py-3">
                    <Input value={line.taxPercentage} onChange={(event) => updateLine(index, { taxPercentage: event.target.value.replace(/[^\d.]/g, "") })} className="ml-auto w-20 text-right" inputMode="decimal" />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" className="h-9 px-2 text-sm" disabled={lines.length === 1} onClick={() => setLines((current) => current.filter((_, lineIndex) => lineIndex !== index))}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Button variant="outline" className="h-10 w-fit px-3 text-sm" onClick={() => setLines((current) => [...current, defaultLine(stockRows)])}>
          <Plus className="mr-1 h-4 w-4" />
          Add line
        </Button>

        <div>
          <PartnerFieldLabel required={false}>Notes</PartnerFieldLabel>
          <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Internal purchase note" />
        </div>

        {formError ? <p className="text-sm text-rose-600">{formError}</p> : null}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" className="h-10 px-3 text-sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="h-10 px-3 text-sm"
            disabled={saving}
            onClick={async () => {
              const nextErrors: Record<string, string> = {};
              if (!supplierId) nextErrors.supplierId = "Supplier is required.";
              if (!purchaseNumber.trim()) nextErrors.purchaseNumber = "PO number is required.";
              if (!purchaseDate) nextErrors.purchaseDate = "PO date is required.";
              const items = lines.map((line, index) => {
                const quantity = Number.parseInt(line.quantity || "0", 10);
                const costPrice = Number.parseFloat(line.costPrice || "0");
                if (!line.itemId) nextErrors[`items.${index}.itemId`] = "Item is required.";
                if (!quantity || quantity <= 0) nextErrors[`items.${index}.quantity`] = "Qty must be positive.";
                if (!Number.isFinite(costPrice) || costPrice < 0) nextErrors[`items.${index}.costPrice`] = "Cost is required.";
                return {
                  itemId: line.itemId,
                  quantity,
                  costPrice,
                  discountPercentage: Number.parseFloat(line.discountPercentage || "0"),
                  taxPercentage: Number.parseFloat(line.taxPercentage || "0"),
                };
              });
              setFieldErrors(nextErrors);
              if (Object.keys(nextErrors).length > 0) return;
              setSaving(true);
              setFormError("");
              try {
                await onSubmit({
                  supplierId,
                  purchaseNumber: purchaseNumber.trim(),
                  supplierInvoiceNumber: supplierInvoiceNumber.trim() || undefined,
                  supplierInvoiceDate: supplierInvoiceDate || undefined,
                  purchaseDate,
                  expectedInwardDate: expectedInwardDate || undefined,
                  notes: notes.trim() || undefined,
                  items,
                });
                onClose();
              } catch (err) {
                setFormError(err instanceof Error ? err.message : "Something went wrong, please try again later");
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? "Creating..." : "Create PO"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
