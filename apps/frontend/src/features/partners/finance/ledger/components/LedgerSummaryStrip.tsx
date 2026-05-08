import type { PartnerClientLedgerEntry } from "@shared/types/domain";
import { formatCurrency } from "@features/partners/finance/invoices/utils";

export function LedgerSummaryStrip({ entries }: { entries: PartnerClientLedgerEntry[] }) {
  const debit = entries.reduce((sum, item) => sum + item.debitAmount, 0);
  const credit = entries.reduce((sum, item) => sum + item.creditAmount, 0);
  const balance = entries.at(-1)?.runningBalance ?? 0;
  return (
    <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-3">
      <Summary label="Debit" value={formatCurrency(debit)} />
      <Summary label="Credit" value={formatCurrency(credit)} />
      <Summary label="Balance" value={formatCurrency(balance)} />
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-950">{value}</p>
    </div>
  );
}
