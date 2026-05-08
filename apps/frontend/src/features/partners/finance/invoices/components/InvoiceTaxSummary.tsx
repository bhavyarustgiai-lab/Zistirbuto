import { Card, CardContent } from "@components/ui/card";
import type { PartnerInvoice } from "@shared/types/domain";
import {
  formatCurrency,
  getInvoiceFinalTotal,
  getInvoiceOutstanding,
  getInvoiceTaxableAmount,
} from "../utils";

type Props = {
  invoice: PartnerInvoice;
};

export function InvoiceTaxSummary({ invoice }: Props) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="grid gap-2 p-4">
        <p className="mb-1 text-sm font-semibold text-slate-950">Tax and totals</p>
        <SummaryRow label="Subtotal" value={formatCurrency(invoice.subtotalAmount)} />
        <SummaryRow label="Discount" value={formatCurrency(invoice.discountAmount)} />
        <SummaryRow label="Taxable Amount" value={formatCurrency(getInvoiceTaxableAmount(invoice))} />
        <SummaryRow label="CGST" value={formatCurrency(invoice.cgstAmount)} />
        <SummaryRow label="SGST" value={formatCurrency(invoice.sgstAmount)} />
        <SummaryRow label="IGST" value={formatCurrency(invoice.igstAmount)} />
        <SummaryRow label="Round Off" value={formatCurrency(invoice.roundOffAmount)} />
        <SummaryRow label="Additional Charges" value={formatCurrency(invoice.additionalChargesAmount)} />
        <SummaryRow label="Final Total" value={formatCurrency(getInvoiceFinalTotal(invoice))} strong />
        <SummaryRow label="Paid Amount" value={formatCurrency(invoice.paidAmount)} />
        <SummaryRow label="Outstanding Amount" value={formatCurrency(getInvoiceOutstanding(invoice))} />
      </CardContent>
    </Card>
  );
}

function SummaryRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={strong ? "flex justify-between gap-4 border-t border-slate-200 pt-2 text-sm font-semibold text-slate-950" : "flex justify-between gap-4 text-sm text-slate-700"}>
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
