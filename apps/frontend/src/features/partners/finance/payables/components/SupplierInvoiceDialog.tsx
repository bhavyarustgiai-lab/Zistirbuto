import { useEffect, useState } from "react";
import { Button } from "@components/ui/button";
import { Dialog } from "@components/ui/dialog";
import { Input } from "@components/ui/input";
import { Select } from "@components/ui/select";
import { PartnerFieldLabel } from "@features/partners/PartnerFieldLabel";
import type { PartnerSupplier } from "@shared/types/domain";

type Props = {
  open: boolean;
  suppliers: PartnerSupplier[];
  onClose: () => void;
  onSubmit: (input: {
    supplierId: string;
    invoiceNumber: string;
    invoiceDate: string;
    dueDate?: string;
    taxableAmount: number;
    gstAmount: number;
    finalTotalAmount: number;
    finalize?: boolean;
  }) => Promise<void>;
};

export function SupplierInvoiceDialog({ open, suppliers, onClose, onSubmit }: Props) {
  const [supplierId, setSupplierId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState("");
  const [taxableAmount, setTaxableAmount] = useState("");
  const [gstAmount, setGstAmount] = useState("");
  const [finalize, setFinalize] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSupplierId(suppliers.find((supplier) => supplier.status === "ACTIVE")?.id ?? "");
    setInvoiceNumber("");
    setInvoiceDate(new Date().toISOString().slice(0, 10));
    setDueDate("");
    setTaxableAmount("");
    setGstAmount("");
    setFinalize(true);
    setFieldErrors({});
    setFormError("");
    setSaving(false);
  }, [open, suppliers]);

  const finalTotal = (Number.parseFloat(taxableAmount || "0") || 0) + (Number.parseFloat(gstAmount || "0") || 0);

  return (
    <Dialog open={open} onClose={onClose} title="Add supplier invoice">
      <div className="grid gap-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <PartnerFieldLabel>Supplier</PartnerFieldLabel>
            <Select
              value={supplierId}
              onValueChange={setSupplierId}
              options={suppliers.filter((supplier) => supplier.status === "ACTIVE").map((supplier) => ({ value: supplier.id, label: supplier.supplierName }))}
            />
            {fieldErrors.supplierId ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.supplierId}</p> : null}
          </div>
          <div>
            <PartnerFieldLabel>Invoice number</PartnerFieldLabel>
            <Input value={invoiceNumber} onChange={(event) => setInvoiceNumber(event.target.value)} />
            {fieldErrors.invoiceNumber ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.invoiceNumber}</p> : null}
          </div>
          <div>
            <PartnerFieldLabel>Invoice date</PartnerFieldLabel>
            <Input type="date" value={invoiceDate} onChange={(event) => setInvoiceDate(event.target.value)} />
            {fieldErrors.invoiceDate ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.invoiceDate}</p> : null}
          </div>
          <div>
            <PartnerFieldLabel required={false}>Due date</PartnerFieldLabel>
            <Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
          </div>
          <div>
            <PartnerFieldLabel>Taxable amount</PartnerFieldLabel>
            <Input value={taxableAmount} onChange={(event) => setTaxableAmount(event.target.value.replace(/[^\d.]/g, ""))} inputMode="decimal" />
            {fieldErrors.taxableAmount ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.taxableAmount}</p> : null}
          </div>
          <div>
            <PartnerFieldLabel>GST amount</PartnerFieldLabel>
            <Input value={gstAmount} onChange={(event) => setGstAmount(event.target.value.replace(/[^\d.]/g, ""))} inputMode="decimal" />
          </div>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <span className="text-sm text-slate-600">Final total</span>
          <span className="font-semibold text-slate-950">₹{finalTotal.toLocaleString("en-IN")}</span>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={finalize} onChange={(event) => setFinalize(event.target.checked)} />
          Finalize immediately
        </label>
        {formError ? <p className="text-sm text-rose-600">{formError}</p> : null}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" className="h-10 px-3 text-sm" onClick={onClose}>Cancel</Button>
          <Button
            className="h-10 px-3 text-sm"
            disabled={saving}
            onClick={async () => {
              const taxable = Number.parseFloat(taxableAmount || "0");
              const gst = Number.parseFloat(gstAmount || "0");
              const nextErrors: Record<string, string> = {};
              if (!supplierId) nextErrors.supplierId = "Supplier is required.";
              if (!invoiceNumber.trim()) nextErrors.invoiceNumber = "Invoice number is required.";
              if (!invoiceDate) nextErrors.invoiceDate = "Invoice date is required.";
              if (!Number.isFinite(taxable) || taxable < 0) nextErrors.taxableAmount = "Enter a valid taxable amount.";
              if (taxable + gst <= 0) nextErrors.taxableAmount = "Final total must be greater than zero.";
              setFieldErrors(nextErrors);
              if (Object.keys(nextErrors).length > 0) return;
              setSaving(true);
              setFormError("");
              try {
                await onSubmit({
                  supplierId,
                  invoiceNumber: invoiceNumber.trim(),
                  invoiceDate,
                  dueDate: dueDate || undefined,
                  taxableAmount: taxable,
                  gstAmount: gst,
                  finalTotalAmount: taxable + gst,
                  finalize,
                });
                onClose();
              } catch (err) {
                setFormError(err instanceof Error ? err.message : "Something went wrong, please try again later");
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? "Saving..." : "Save Invoice"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
