import { CreditCard, Send } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@components/ui/button";
import type { PartnerSupplierInvoice } from "@shared/types/domain";
import { formatDate, formatMoney } from "../utils";
import { PayableStatusBadge } from "./PayableStatusBadge";

type Props = {
  invoices: PartnerSupplierInvoice[];
  onFinalize: (invoiceId: string) => void;
  onRecordPayment: (invoice: PartnerSupplierInvoice) => void;
  isMutating?: boolean;
};

export function PayablesTable({ invoices, onFinalize, onRecordPayment, isMutating }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1040px] text-sm">
        <thead className="bg-slate-50/80 text-left text-slate-500">
          <tr className="border-b border-slate-200">
            <th className="px-5 py-3 font-medium">Supplier</th>
            <th className="px-4 py-3 font-medium">Invoice No</th>
            <th className="px-4 py-3 font-medium">Invoice Date</th>
            <th className="px-4 py-3 font-medium">Due Date</th>
            <th className="px-4 py-3 text-right font-medium">Total</th>
            <th className="px-4 py-3 text-right font-medium">Paid</th>
            <th className="px-4 py-3 text-right font-medium">Outstanding</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-5 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            <tr key={invoice.id} className="border-b border-slate-100 text-slate-800 last:border-b-0">
              <td className="px-5 py-4">
                <Link to={`/partners/suppliers/${invoice.supplierId}/ledger`} className="font-medium text-slate-950 hover:text-slate-700">
                  {invoice.supplierName}
                </Link>
                <div className="mt-1 text-xs text-slate-500">{invoice.purchaseNumber || invoice.grnNumber || "No PO/GRN link"}</div>
              </td>
              <td className="px-4 py-4">{invoice.invoiceNumber}</td>
              <td className="px-4 py-4">{formatDate(invoice.invoiceDate)}</td>
              <td className="px-4 py-4">{formatDate(invoice.dueDate)}</td>
              <td className="px-4 py-4 text-right">{formatMoney(invoice.finalTotalAmount)}</td>
              <td className="px-4 py-4 text-right">{formatMoney(invoice.paidAmount)}</td>
              <td className="px-4 py-4 text-right font-medium text-slate-950">{formatMoney(invoice.outstandingAmount)}</td>
              <td className="px-4 py-4">
                <PayableStatusBadge status={invoice.status === "FINALIZED" ? invoice.payableStatus : invoice.status} />
              </td>
              <td className="px-5 py-4">
                <div className="flex justify-end gap-1">
                  {invoice.status === "DRAFT" ? (
                    <Button variant="ghost" className="h-9 px-2 text-sm" disabled={isMutating} onClick={() => onFinalize(invoice.id)}>
                      <Send className="mr-1 h-4 w-4" />
                      Finalize
                    </Button>
                  ) : null}
                  {invoice.status === "FINALIZED" && invoice.outstandingAmount > 0 ? (
                    <Button variant="ghost" className="h-9 px-2 text-sm" disabled={isMutating} onClick={() => onRecordPayment(invoice)}>
                      <CreditCard className="mr-1 h-4 w-4" />
                      Pay
                    </Button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
