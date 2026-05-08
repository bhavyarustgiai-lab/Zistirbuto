import type { PartnerClientLedgerEntry } from "@shared/types/domain";
import { EmptyState } from "@shared/ui/molecules/empty-state";
import { LoadingState } from "@shared/ui/molecules/loading-state";
import { ErrorState } from "@shared/ui/molecules/error-state";
import { formatCurrency, formatDate } from "@features/partners/finance/invoices/utils";
import { ledgerTypeLabel } from "../utils";

export function LedgerTable({
  entries,
  loading,
  error,
  onRetry,
}: {
  entries: PartnerClientLedgerEntry[];
  loading: boolean;
  error: Error | null;
  onRetry: () => void;
}) {
  if (loading) return <LoadingState label="Loading ledger..." />;
  if (error) return <ErrorState message={error.message} onRetry={onRetry} />;
  if (entries.length === 0) return <div className="p-8"><EmptyState description="No ledger entries yet." /></div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[960px] text-sm">
        <thead className="text-left text-slate-500">
          <tr className="border-b border-slate-200">
            <th className="px-3 py-3">Date</th>
            <th className="px-3 py-3">Type</th>
            <th className="px-3 py-3">Reference</th>
            <th className="px-3 py-3">Description</th>
            <th className="px-3 py-3 text-right">Debit</th>
            <th className="px-3 py-3 text-right">Credit</th>
            <th className="px-3 py-3 text-right">Balance</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id} className="border-b border-slate-100 text-slate-800 hover:bg-slate-50">
              <td className="px-3 py-3">{formatDate(entry.entryDate)}</td>
              <td className="px-3 py-3">{ledgerTypeLabel(entry.type)}</td>
              <td className="px-3 py-3 font-medium text-slate-950">{entry.referenceNumber}</td>
              <td className="px-3 py-3">{entry.description}</td>
              <td className="px-3 py-3 text-right tabular-nums">{entry.debitAmount ? formatCurrency(entry.debitAmount) : "-"}</td>
              <td className="px-3 py-3 text-right tabular-nums">{entry.creditAmount ? formatCurrency(entry.creditAmount) : "-"}</td>
              <td className="px-3 py-3 text-right font-medium tabular-nums text-slate-950">{formatCurrency(entry.runningBalance)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
