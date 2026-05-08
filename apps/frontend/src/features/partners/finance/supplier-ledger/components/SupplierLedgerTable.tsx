import type { PartnerSupplierLedgerEntry } from "@shared/types/domain";
import { formatDate, formatMoney } from "../../payables/utils";

export function SupplierLedgerTable({ entries }: { entries: PartnerSupplierLedgerEntry[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] text-sm">
        <thead className="bg-slate-50/80 text-left text-slate-500">
          <tr className="border-b border-slate-200">
            <th className="px-5 py-3 font-medium">Date</th>
            <th className="px-4 py-3 font-medium">Type</th>
            <th className="px-4 py-3 font-medium">Reference</th>
            <th className="px-4 py-3 font-medium">Description</th>
            <th className="px-4 py-3 text-right font-medium">Debit</th>
            <th className="px-4 py-3 text-right font-medium">Credit</th>
            <th className="px-5 py-3 text-right font-medium">Balance</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id} className="border-b border-slate-100 text-slate-800 last:border-b-0">
              <td className="px-5 py-4">{formatDate(entry.entryDate)}</td>
              <td className="px-4 py-4">{entry.type.replaceAll("_", " ")}</td>
              <td className="px-4 py-4">{entry.referenceNumber}</td>
              <td className="px-4 py-4">{entry.description}</td>
              <td className="px-4 py-4 text-right">{entry.debitAmount ? formatMoney(entry.debitAmount) : "-"}</td>
              <td className="px-4 py-4 text-right">{entry.creditAmount ? formatMoney(entry.creditAmount) : "-"}</td>
              <td className="px-5 py-4 text-right font-medium text-slate-950">{formatMoney(entry.runningBalance)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
