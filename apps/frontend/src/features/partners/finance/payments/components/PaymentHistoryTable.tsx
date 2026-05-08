import { Link } from "react-router-dom";
import type { PartnerPayment } from "@shared/types/domain";
import { EmptyState } from "@shared/ui/molecules/empty-state";
import { LoadingState } from "@shared/ui/molecules/loading-state";
import { ErrorState } from "@shared/ui/molecules/error-state";
import { formatCurrency, formatDate } from "@features/partners/finance/invoices/utils";
import { formatPaymentMode } from "../utils";

type Props = {
  payments: PartnerPayment[];
  loading: boolean;
  error: Error | null;
  onRetry: () => void;
};

export function PaymentHistoryTable({ payments, loading, error, onRetry }: Props) {
  if (loading) return <LoadingState label="Loading payments..." />;
  if (error) return <ErrorState message={error.message} onRetry={onRetry} />;
  if (payments.length === 0) {
    return <div className="p-8"><EmptyState description="No payments recorded yet." /></div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px] text-sm">
        <thead className="text-left text-slate-500">
          <tr className="border-b border-slate-200">
            <th className="px-3 py-3">Payment Date</th>
            <th className="px-3 py-3">Reference</th>
            <th className="px-3 py-3">Client</th>
            <th className="px-3 py-3">Invoice</th>
            <th className="px-3 py-3">Mode</th>
            <th className="px-3 py-3 text-right">Amount</th>
            <th className="px-3 py-3">Recorded By</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => (
            <tr key={payment.id} className="border-b border-slate-100 text-slate-800 hover:bg-slate-50">
              <td className="px-3 py-3">{formatDate(payment.paymentDate)}</td>
              <td className="px-3 py-3 font-medium text-slate-950">{payment.paymentReference}</td>
              <td className="px-3 py-3">{payment.clientBusinessName}</td>
              <td className="px-3 py-3">
                {payment.allocations[0] ? (
                  <Link className="text-brand-600 hover:underline" to={`/partners/invoices/${payment.allocations[0].invoiceId}`}>
                    {payment.allocations[0].invoiceNumber}
                  </Link>
                ) : "-"}
              </td>
              <td className="px-3 py-3">{formatPaymentMode(payment.mode)}</td>
              <td className="px-3 py-3 text-right font-medium tabular-nums text-slate-950">{formatCurrency(payment.amount)}</td>
              <td className="px-3 py-3">{payment.recordedByName || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
