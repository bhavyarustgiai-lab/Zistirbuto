import { useMemo, useState, type ReactNode } from "react";
import { Dialog } from "@components/ui/dialog";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Select } from "@components/ui/select";
import { Textarea } from "@components/ui/textarea";
import type { PartnerInvoice, PartnerPaymentMode } from "@shared/types/domain";
import { formatCurrency } from "@features/partners/finance/invoices/utils";
import { invoiceOutstanding, paymentModeOptions, validatePaymentEntry } from "../utils";
import type { PaymentEntryErrors, PaymentEntryValues } from "../types";

type Props = {
  open: boolean;
  invoices: PartnerInvoice[];
  initialInvoiceId?: string;
  loading: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (values: {
    invoiceId: string;
    paymentDate: string;
    amount: number;
    paymentMode: PartnerPaymentMode;
    referenceNumber?: string;
    collectedByUserId?: string;
    notes?: string;
  }) => Promise<void>;
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function PaymentEntryDialog({ open, invoices, initialInvoiceId = "", loading, error, onClose, onSubmit }: Props) {
  const [values, setValues] = useState<PaymentEntryValues>({
    paymentDate: today(),
    invoiceId: initialInvoiceId,
    amount: "",
    paymentMode: "",
    referenceNumber: "",
    collectedByUserId: "",
    notes: "",
  });
  const [errors, setErrors] = useState<PaymentEntryErrors>({});
  const selectedInvoice = useMemo(() => invoices.find((invoice) => invoice.id === values.invoiceId), [invoices, values.invoiceId]);

  async function submit() {
    const nextErrors = validatePaymentEntry(values, selectedInvoice);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !values.paymentMode) return;
    await onSubmit({
      invoiceId: values.invoiceId,
      paymentDate: values.paymentDate,
      amount: Number(values.amount),
      paymentMode: values.paymentMode,
      referenceNumber: values.referenceNumber.trim(),
      collectedByUserId: values.collectedByUserId.trim(),
      notes: values.notes.trim(),
    });
    setValues((current) => ({ ...current, amount: "", referenceNumber: "", notes: "" }));
  }

  return (
    <Dialog open={open} title="Record Payment" onClose={onClose} panelClassName="max-w-2xl">
      <div className="grid gap-4">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Payment Date" error={errors.paymentDate}>
            <Input type="date" value={values.paymentDate} onChange={(event) => setValues({ ...values, paymentDate: event.target.value })} />
          </Field>
          <Field label="Invoice" error={errors.invoiceId}>
            <Select
              value={values.invoiceId}
              onValueChange={(invoiceId) => setValues({ ...values, invoiceId })}
              searchable
              searchPlaceholder="Search invoice"
              options={invoices.map((invoice) => ({
                value: invoice.id,
                label: `${invoice.invoiceNumber} · ${invoice.clientBusinessName}`,
                description: `${formatCurrency(invoiceOutstanding(invoice))} outstanding`,
                disabled: invoiceOutstanding(invoice) <= 0,
              }))}
            />
          </Field>
          <Field label="Amount" error={errors.amount} helper={selectedInvoice ? `Outstanding ${formatCurrency(invoiceOutstanding(selectedInvoice))}` : undefined}>
            <Input
              value={values.amount}
              onChange={(event) => setValues({ ...values, amount: event.target.value.replace(/[^\d.]/g, "") })}
              placeholder="0.00"
            />
          </Field>
          <Field label="Payment Mode" error={errors.paymentMode}>
            <Select
              value={values.paymentMode}
              onValueChange={(paymentMode) => setValues({ ...values, paymentMode: paymentMode as PartnerPaymentMode })}
              options={paymentModeOptions}
            />
          </Field>
          <Field label="Reference Number">
            <Input value={values.referenceNumber} onChange={(event) => setValues({ ...values, referenceNumber: event.target.value })} placeholder="UTR, cheque no, receipt no" />
          </Field>
          <Field label="Collected By">
            <Input value={values.collectedByUserId} onChange={(event) => setValues({ ...values, collectedByUserId: event.target.value })} placeholder="Current user by default" />
          </Field>
          <div className="md:col-span-2">
            <Field label="Notes">
              <Textarea value={values.notes} onChange={(event) => setValues({ ...values, notes: event.target.value })} rows={3} />
            </Field>
          </div>
        </div>
        {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div> : null}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" className="h-10 px-3 text-sm" disabled={loading} onClick={onClose}>Cancel</Button>
          <Button type="button" className="h-10 px-3 text-sm" disabled={loading} onClick={() => void submit()}>
            {loading ? "Recording..." : "Record Payment"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

function Field({ label, error, helper, children }: { label: string; error?: string; helper?: string; children: ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      {children}
      {error ? <span className="text-xs text-rose-600">{error}</span> : helper ? <span className="text-xs text-slate-500">{helper}</span> : null}
    </label>
  );
}
