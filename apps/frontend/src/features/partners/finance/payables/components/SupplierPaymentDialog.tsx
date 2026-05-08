import { useEffect, useState } from "react";
import { Button } from "@components/ui/button";
import { Dialog } from "@components/ui/dialog";
import { Input } from "@components/ui/input";
import { Select } from "@components/ui/select";
import { Textarea } from "@components/ui/textarea";
import { PartnerFieldLabel } from "@features/partners/PartnerFieldLabel";
import type { PartnerPaymentMode, PartnerSupplierInvoice } from "@shared/types/domain";
import { formatMoney, supplierPaymentModeOptions } from "../utils";

type Props = {
  open: boolean;
  invoice: PartnerSupplierInvoice | null;
  onClose: () => void;
  onSubmit: (input: {
    supplierInvoiceId: string;
    paymentDate: string;
    amount: number;
    paymentMode: PartnerPaymentMode;
    referenceNumber?: string;
    notes?: string;
  }) => Promise<void>;
};

export function SupplierPaymentDialog({ open, invoice, onClose, onSubmit }: Props) {
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState<PartnerPaymentMode>("BANK_TRANSFER");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !invoice) return;
    setPaymentDate(new Date().toISOString().slice(0, 10));
    setAmount(String(invoice.outstandingAmount || ""));
    setPaymentMode("BANK_TRANSFER");
    setReferenceNumber("");
    setNotes("");
    setFieldErrors({});
    setFormError("");
    setSaving(false);
  }, [open, invoice]);

  if (!invoice) return null;

  return (
    <Dialog open={open} onClose={onClose} title={`Record payment for ${invoice.invoiceNumber}`}>
      <div className="grid gap-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
          Outstanding: <span className="font-semibold text-slate-950">{formatMoney(invoice.outstandingAmount)}</span>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <PartnerFieldLabel>Payment date</PartnerFieldLabel>
            <Input type="date" value={paymentDate} onChange={(event) => setPaymentDate(event.target.value)} />
            {fieldErrors.paymentDate ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.paymentDate}</p> : null}
          </div>
          <div>
            <PartnerFieldLabel>Amount</PartnerFieldLabel>
            <Input value={amount} onChange={(event) => setAmount(event.target.value.replace(/[^\d.]/g, ""))} inputMode="decimal" />
            {fieldErrors.amount ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.amount}</p> : null}
          </div>
          <div>
            <PartnerFieldLabel>Mode</PartnerFieldLabel>
            <Select value={paymentMode} onValueChange={(value) => setPaymentMode(value as PartnerPaymentMode)} options={supplierPaymentModeOptions} />
          </div>
          <div>
            <PartnerFieldLabel required={false}>Reference number</PartnerFieldLabel>
            <Input value={referenceNumber} onChange={(event) => setReferenceNumber(event.target.value)} />
          </div>
        </div>
        <div>
          <PartnerFieldLabel required={false}>Notes</PartnerFieldLabel>
          <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
        </div>
        {formError ? <p className="text-sm text-rose-600">{formError}</p> : null}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" className="h-10 px-3 text-sm" onClick={onClose}>Cancel</Button>
          <Button
            className="h-10 px-3 text-sm"
            disabled={saving}
            onClick={async () => {
              const parsedAmount = Number.parseFloat(amount || "0");
              const nextErrors: Record<string, string> = {};
              if (!paymentDate) nextErrors.paymentDate = "Payment date is required.";
              if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) nextErrors.amount = "Amount must be greater than zero.";
              if (parsedAmount > invoice.outstandingAmount) nextErrors.amount = "Amount cannot exceed outstanding.";
              setFieldErrors(nextErrors);
              if (Object.keys(nextErrors).length > 0) return;
              setSaving(true);
              setFormError("");
              try {
                await onSubmit({
                  supplierInvoiceId: invoice.id,
                  paymentDate,
                  amount: parsedAmount,
                  paymentMode,
                  referenceNumber: referenceNumber.trim() || undefined,
                  notes: notes.trim() || undefined,
                });
                onClose();
              } catch (err) {
                setFormError(err instanceof Error ? err.message : "Something went wrong, please try again later");
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? "Recording..." : "Record Payment"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
