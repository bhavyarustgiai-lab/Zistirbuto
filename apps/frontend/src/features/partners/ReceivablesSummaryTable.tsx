import { Link } from "react-router-dom";
import { PartnerStatusBadge } from "@features/partners/PartnerStatusBadge";
import type { PartnerReceivablesSummary } from "@shared/types/domain";
import { formatCurrency } from "@features/partners/finance/invoices/utils";
import { PaymentStatusBadge } from "@features/partners/finance/payments/components/PaymentStatusBadge";

type Props = {
  data: PartnerReceivablesSummary;
  expandedBusinessId: string;
  onToggle: (businessId: string) => void;
};

export function ReceivablesSummaryTable({ data }: Props) {
  const rows = data.businesses.flatMap((business) =>
    business.invoices.map((invoice) => ({
      ...invoice,
      clientName: invoice.clientName || business.businessName,
    })),
  );

  return (
    <div>
      <div className="grid gap-3 p-3 md:hidden">
        {rows.map((invoice) => (
          <div key={invoice.invoiceId} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link className="font-medium text-brand-600 hover:underline" to={`/partners/finance/invoices/${invoice.invoiceId}`}>
                  {invoice.invoiceNumber}
                </Link>
                <p className="mt-1 text-sm text-slate-600">{invoice.clientName}</p>
                <p className="text-xs text-slate-500">{invoice.outletName}</p>
              </div>
              <PaymentStatusBadge status={invoice.paymentStatus} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <Metric label="Total" value={formatCurrency(invoice.amount)} />
              <Metric label="Paid" value={formatCurrency(invoice.paidAmount)} />
              <Metric label="Outstanding" value={formatCurrency(invoice.outstanding)} strong />
              <Metric label="Aging" value={invoice.status === "OVERDUE" ? invoice.agingBucket || "0-30" : "Current"} />
            </div>
          </div>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white md:block">
        <table className="w-full min-w-[1240px] text-sm">
          <thead className="text-left text-slate-500">
            <tr className="border-b border-slate-200">
              <th className="px-3 py-3">Invoice No</th>
              <th className="px-3 py-3">Client</th>
              <th className="px-3 py-3">Outlet</th>
              <th className="px-3 py-3">Invoice Date</th>
              <th className="px-3 py-3">Due Date</th>
              <th className="px-3 py-3 text-right">Total</th>
              <th className="px-3 py-3 text-right">Paid</th>
              <th className="px-3 py-3 text-right">Outstanding</th>
              <th className="px-3 py-3">Payment Status</th>
              <th className="px-3 py-3">Aging Bucket</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((invoice) => (
              <tr key={invoice.invoiceId} className="border-b border-slate-100 text-slate-800 hover:bg-slate-50">
                <td className="px-3 py-3 font-medium">
                  <Link className="text-brand-600 hover:underline" to={`/partners/finance/invoices/${invoice.invoiceId}`}>
                    {invoice.invoiceNumber}
                  </Link>
                </td>
                <td className="px-3 py-3">{invoice.clientName}</td>
                <td className="px-3 py-3">{invoice.outletName}</td>
                <td className="px-3 py-3">{invoice.invoiceDate}</td>
                <td className="px-3 py-3">{invoice.dueDate}</td>
                <td className="px-3 py-3 text-right tabular-nums">{formatCurrency(invoice.amount)}</td>
                <td className="px-3 py-3 text-right tabular-nums">{formatCurrency(invoice.paidAmount)}</td>
                <td className="px-3 py-3 text-right font-medium tabular-nums text-slate-950">{formatCurrency(invoice.outstanding)}</td>
                <td className="px-3 py-3"><PaymentStatusBadge status={invoice.paymentStatus} /></td>
                <td className="px-3 py-3">
                  <PartnerStatusBadge status={invoice.status === "OVERDUE" ? "OVERDUE" : "CURRENT"} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Metric({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className={strong ? "mt-1 font-semibold text-slate-950" : "mt-1 text-slate-800"}>{value}</p>
    </div>
  );
}
