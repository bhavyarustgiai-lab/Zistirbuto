import type { PartnerOrder, PartnerStockRow } from "@shared/types/domain";
import { AppInput } from "@shared/ui/atoms/app-input";
import { cn } from "@shared/lib/cn";

type OrderItemExpandedRowProps = {
  line: PartnerOrder["items"][number];
  stockRows: PartnerStockRow[];
  allocationValues: Record<string, string>;
  allocationErrors: Record<string, string>;
  disabled?: boolean;
  getAllocationKey: (catalogItemId: string, inventoryItemId: string) => string;
  onAllocationChange: (key: string, value: string) => void;
};

function digitsOnly(value: string) {
  return value.replace(/\D+/g, "");
}

function formatNumber(value: number) {
  return value.toLocaleString("en-IN");
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function OrderItemExpandedRow({
  line,
  stockRows,
  allocationValues,
  allocationErrors,
  disabled = false,
  getAllocationKey,
  onAllocationChange,
}: OrderItemExpandedRowProps) {
  return (
    <tr className="border-b border-slate-100 bg-slate-50/40">
      <td colSpan={6} className="px-4 py-3">
        <div className="ml-2 border-l border-slate-200 pl-4">
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
            Inventory breakdown
          </div>
          {stockRows.length > 0 ? (
            <table className="w-full text-sm">
              <thead className="text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="py-2 pr-3">Batch</th>
                  <th className="px-3 py-2 text-right">MRP</th>
                  <th className="px-3 py-2 text-right">Available</th>
                  <th className="px-3 py-2 text-right">Buy %</th>
                  <th className="py-2 pl-3 text-right">Allocate</th>
                </tr>
              </thead>
              <tbody>
                {stockRows.map((row) => {
                  const allocationKey = getAllocationKey(line.itemId, row.itemId);
                  const error = allocationErrors[allocationKey];
                  return (
                    <tr key={allocationKey} className="border-t border-slate-100">
                      <td className="py-2.5 pr-3">
                        <div className="font-medium text-slate-700">{row.itemCode}</div>
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-slate-600">
                        {formatMoney(row.mrp)}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-slate-600">
                        {formatNumber(row.currentStockQty)}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-slate-600">
                        {row.discountPercentage}%
                      </td>
                      <td className="py-2.5 pl-3">
                        <div className="ml-auto w-24">
                          <AppInput
                            aria-label={`Allocate ${line.itemName} from ${row.itemCode}`}
                            inputMode="numeric"
                            value={allocationValues[allocationKey] ?? ""}
                            disabled={disabled}
                            className={cn(
                              "h-9 rounded-xl bg-white text-right text-sm tabular-nums shadow-sm",
                              error
                                ? "border-rose-300 focus-visible:ring-2 focus-visible:ring-rose-200"
                                : "border-slate-300 focus-visible:ring-2 focus-visible:ring-brand-100",
                            )}
                            onChange={(event) => onAllocationChange(allocationKey, digitsOnly(event.target.value))}
                            onFocus={(event) => event.target.select()}
                          />
                          {error ? <p className="mt-1 text-right text-xs text-rose-600">{error}</p> : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="py-2 text-sm text-slate-500">
              No inventory batches are available for this item.
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}
