import { CheckCircle2, Eye, Printer } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@components/ui/button";
import { Tooltip } from "@components/ui/tooltip";
import { EmptyState } from "@shared/ui/molecules/empty-state";
import { LoadingState } from "@shared/ui/molecules/loading-state";
import { ErrorState } from "@shared/ui/molecules/error-state";
import type { PartnerInvoice } from "@shared/types/domain";
import {
  formatCurrency,
  formatDate,
  getInvoiceFinalTotal,
  getInvoiceOutstanding,
  getInvoiceTaxableAmount,
  getInvoiceTaxTotal,
} from "../utils";
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";

type Props = {
  invoices: PartnerInvoice[];
  loading: boolean;
  error: Error | null;
  canFinalize: boolean;
  finalizingInvoiceId?: string;
  onRetry: () => void;
  onPreview: (invoice: PartnerInvoice) => void;
  onFinalize: (invoice: PartnerInvoice) => void;
};

export function InvoiceList({
  invoices,
  loading,
  error,
  canFinalize,
  finalizingInvoiceId,
  onRetry,
  onPreview,
  onFinalize,
}: Props) {
  if (loading) return <LoadingState label="Loading invoices..." />;
  if (error) return <ErrorState message={error.message} onRetry={onRetry} />;
  if (invoices.length === 0) {
    return (
      <div className="p-8">
        <EmptyState
          title="No invoices yet."
          description="Invoices are created when orders are dispatched."
        />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1280px] text-sm">
        <thead className="text-left text-slate-500">
          <tr className="border-b border-slate-200">
            <th className="px-3 py-3">Invoice No</th>
            <th className="px-3 py-3">Invoice Date</th>
            <th className="px-3 py-3">Client</th>
            <th className="px-3 py-3">Outlet</th>
            <th className="px-3 py-3">Order Ref</th>
            <th className="px-3 py-3 text-right">Taxable Amount</th>
            <th className="px-3 py-3 text-right">GST</th>
            <th className="px-3 py-3 text-right">Total</th>
            <th className="px-3 py-3 text-right">Outstanding</th>
            <th className="px-3 py-3">Status</th>
            <th className="px-3 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => {
            const canFinalizeRow = canFinalize && invoice.status === "DRAFT";
            return (
              <tr key={invoice.id} className="border-b border-slate-100 text-slate-800 hover:bg-slate-50">
                <td className="px-3 py-3 font-medium text-slate-950">
                  <Link className="hover:text-brand-600" to={`/partners/invoices/${invoice.id}`}>
                    {invoice.invoiceNumber}
                  </Link>
                </td>
                <td className="px-3 py-3">{formatDate(invoice.invoiceDate)}</td>
                <td className="px-3 py-3">{invoice.clientBusinessName}</td>
                <td className="px-3 py-3">{invoice.clientOutletName}</td>
                <td className="px-3 py-3">
                  {invoice.orderId ? (
                    <Link className="text-brand-600 hover:underline" to={`/partners/orders/${invoice.orderId}`}>
                      {invoice.dispatchReference || invoice.orderId}
                    </Link>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="px-3 py-3 text-right tabular-nums">{formatCurrency(getInvoiceTaxableAmount(invoice))}</td>
                <td className="px-3 py-3 text-right tabular-nums">{formatCurrency(getInvoiceTaxTotal(invoice))}</td>
                <td className="px-3 py-3 text-right font-medium tabular-nums text-slate-950">{formatCurrency(getInvoiceFinalTotal(invoice))}</td>
                <td className="px-3 py-3 text-right tabular-nums">{formatCurrency(getInvoiceOutstanding(invoice))}</td>
                <td className="px-3 py-3"><InvoiceStatusBadge status={invoice.status} /></td>
                <td className="px-3 py-3">
                  <div className="flex justify-end gap-1.5">
                    <Tooltip content="View invoice">
                      <Link
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100"
                        aria-label={`View invoice ${invoice.invoiceNumber}`}
                        to={`/partners/invoices/${invoice.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Tooltip>
                    <Tooltip content="Print invoice">
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-9 w-9 rounded-lg px-0"
                        aria-label={`Print invoice ${invoice.invoiceNumber}`}
                        onClick={() => onPreview(invoice)}
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                    </Tooltip>
                    {canFinalizeRow ? (
                      <Tooltip content="Finalize invoice">
                        <Button
                          type="button"
                          variant="outline"
                          className="h-9 w-9 rounded-lg px-0"
                          aria-label={`Finalize invoice ${invoice.invoiceNumber}`}
                          disabled={finalizingInvoiceId === invoice.id}
                          onClick={() => onFinalize(invoice)}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      </Tooltip>
                    ) : null}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
