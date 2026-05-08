import { Button } from "@components/ui/button";
import { Dialog } from "@components/ui/dialog";
import { StockLedgerFilterBar } from "@features/partners/StockLedgerFilterBar";
import type { PartnerStockLedgerFilters } from "@shared/types/domain";
import type { PartnerStockLedgerEntry } from "@shared/types/domain";

type Props = {
  open: boolean;
  title: string;
  entries: PartnerStockLedgerEntry[];
  filters: PartnerStockLedgerFilters;
  onFiltersChange: (next: PartnerStockLedgerFilters) => void;
  onClose: () => void;
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function StockLedgerDialog({ open, title, entries, filters, onFiltersChange, onClose }: Props) {
  return (
    <Dialog open={open} onClose={onClose} title={title}>
      <div className="grid gap-3">
        <StockLedgerFilterBar filters={filters} onChange={onFiltersChange} />
        {entries.length === 0 ? (
          <p className="text-sm text-slate-500">No stock ledger history for this item yet.</p>
        ) : (
          <div className="max-h-[420px] overflow-y-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[700px] text-sm">
              <thead className="text-left text-slate-500">
                <tr className="border-b border-slate-200">
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Reason</th>
                  <th className="px-3 py-2">Qty</th>
                  <th className="px-3 py-2">Reference</th>
                  <th className="px-3 py-2">Note</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-b border-slate-100 text-slate-800">
                    <td className="px-3 py-2">{formatDate(entry.createdAt)}</td>
                    <td className="px-3 py-2">{entry.reasonType.replace(/_/g, " ")}</td>
                    <td className="px-3 py-2 font-medium">{entry.quantityDelta > 0 ? `+${entry.quantityDelta}` : entry.quantityDelta}</td>
                    <td className="px-3 py-2">{entry.referenceType && entry.referenceId ? `${entry.referenceType} · ${entry.referenceId}` : "-"}</td>
                    <td className="px-3 py-2">{entry.note || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end">
          <Button variant="ghost" className="h-10 px-3 text-sm" onClick={onClose}>Close</Button>
        </div>
      </div>
    </Dialog>
  );
}
