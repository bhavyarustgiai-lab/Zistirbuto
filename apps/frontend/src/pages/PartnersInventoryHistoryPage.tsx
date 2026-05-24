import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useAppState } from "@app/providers/AppStateProvider";
import { usePartnerBrands, usePartnerInventoryHistory } from "@entities/partners/hooks";
import { PartnerBrandSelector } from "@features/partners/brands/PartnerBrandSelector";
import { usePartnerBrandSelection } from "@features/partners/brands/usePartnerBrandSelection";
import { ExportCsvButton } from "@features/partners/ExportCsvButton";
import {
  PartnersPageFilters,
  PartnersPageHeader,
  PartnersPageShell,
  PartnersTableCard,
} from "@features/partners/layout/PartnersPageLayout";
import { EmptyState } from "@shared/ui/molecules/EmptyState";
import { Input } from "@components/ui/input";
import { todayISO } from "@shared/lib/date";

function offsetDateISO(days: number) {
  const now = new Date();
  now.setDate(now.getDate() + days);
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatQuantityDelta(value: number) {
  if (value > 0) return `+${value}`;
  return String(value);
}

export function PartnersInventoryHistoryPage() {
  const { activePartnerFirmId } = useAppState();
  const brands = usePartnerBrands(activePartnerFirmId);
  const {
    brandId: selectedBrandId,
    brandOptions,
    setBrandId: setSelectedBrandId,
  } = usePartnerBrandSelection(activePartnerFirmId, brands.items);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState(offsetDateISO(-1));
  const [toDate, setToDate] = useState(todayISO());

  const history = usePartnerInventoryHistory(activePartnerFirmId, {
    brandId: selectedBrandId,
    fromDate,
    toDate,
    query: search,
  });

  const rows = useMemo(
    () =>
      (history.items ?? []).map((item) => ({
        ...item,
        activityLabel:
          item.eventType === "ADJUSTMENT" ? "Manual adjustment" : "Goods received",
        sourceLabel:
          item.eventType !== "ADJUSTMENT"
            ? item.supplierName || "-"
            : `${item.quantityFrom ?? 0} -> ${item.quantityTo ?? 0}`,
      })),
    [history.items],
  );

  if (!activePartnerFirmId) {
    return <EmptyState>Select a firm to view history.</EmptyState>;
  }

  return (
    <PartnersPageShell>
      <PartnersPageHeader
        title="History"
        description="Review GRN receipts and manual stock adjustments."
        actions={
          <PartnerBrandSelector value={selectedBrandId} onValueChange={setSelectedBrandId} options={brandOptions} />
        }
      />

      <PartnersPageFilters className="xl:grid-cols-[minmax(0,1fr)_minmax(320px,380px)_auto]">
        <div className="relative w-full">
          <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
            placeholder="Search item, SKU, supplier, or note"
          />
        </div>
        <div className="flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3">
          <Input
            type="date"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
            className="h-9 min-w-0 border-0 bg-transparent px-0 text-[15px] shadow-none focus-visible:ring-0"
          />
          <span className="shrink-0 text-sm font-medium text-slate-400">to</span>
          <Input
            type="date"
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
            className="h-9 min-w-0 border-0 bg-transparent px-0 text-[15px] shadow-none focus-visible:ring-0"
          />
        </div>
        <ExportCsvButton
          filename="inventory-history.csv"
          headers={["Date & Time", "Items", "Activity", "Source", "Quantity", "Note", "Status"]}
          rows={rows.map((item) => [
            formatDateTime(item.eventAt),
            item.eventType === "GOODS_RECEIPT"
              ? (item.items ?? []).map((line) => `${line.itemName} (${line.sku}) x ${line.quantity}`).join(" | ")
              : `${item.itemName ?? ""} (${item.sku ?? ""})`,
            item.activityLabel,
            item.sourceLabel,
            formatQuantityDelta(item.quantityDelta),
            item.note ?? "",
            item.status ?? "",
          ])}
        />
      </PartnersPageFilters>

      <PartnersTableCard>
        {!selectedBrandId ? (
          <div className="p-8">
            <EmptyState>Select a brand to view history.</EmptyState>
          </div>
        ) : rows.length === 0 ? (
          <div className="p-8">
            <EmptyState>No history entries match the selected date range.</EmptyState>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] text-sm">
              <thead className="bg-slate-50/80 text-left text-slate-500">
                <tr className="border-b border-slate-200">
                  <th className="px-4 py-3 font-medium">Date & time</th>
                  <th className="px-4 py-3 font-medium">Item</th>
                  <th className="px-4 py-3 font-medium">Activity</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 text-right font-medium">Quantity</th>
                  <th className="px-4 py-3 font-medium">Note</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((item) => (
                  <tr key={`${item.eventType}_${item.id}`} className="border-b border-slate-100 text-slate-800 last:border-b-0">
                    <td className="px-4 py-4 whitespace-nowrap text-slate-600">{formatDateTime(item.eventAt)}</td>
                    <td className="px-4 py-4">
                      {item.eventType === "GOODS_RECEIPT" ? (
                        <div className="space-y-2">
                          {(item.items ?? []).map((line) => (
                            <div key={`${item.id}_${line.itemId}_${line.sku}`}>
                              <div className="font-medium text-slate-950">{line.itemName}</div>
                              <div className="mt-1 text-xs text-slate-500">
                                SKU {line.sku} · Qty {line.quantity}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <>
                          <div className="font-medium text-slate-950">{item.itemName}</div>
                          <div className="mt-1 text-xs text-slate-500">SKU {item.sku}</div>
                        </>
                      )}
                    </td>
                    <td className="px-4 py-4">{item.activityLabel}</td>
                    <td className="px-4 py-4">
                      <div className="text-slate-900">{item.sourceLabel}</div>
                      {item.eventType === "GOODS_RECEIPT" && item.status ? (
                        <div className="mt-1 text-xs text-slate-500">{item.status}</div>
                      ) : null}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className={item.quantityDelta >= 0 ? "font-semibold text-emerald-700" : "font-semibold text-rose-700"}>
                        {formatQuantityDelta(item.quantityDelta)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {item.note || "-"}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="text-slate-300">-</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PartnersTableCard>
    </PartnersPageShell>
  );
}
