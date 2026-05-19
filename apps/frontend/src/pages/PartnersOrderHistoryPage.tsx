import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppState } from "@app/providers/AppStateProvider";
import { usePartnerBrands, usePartnerOrders, usePartnerStock } from "@entities/partners/hooks";
import type { PartnerOrder } from "@shared/types/domain";
import { Input } from "@components/ui/input";
import { MultiSelect } from "@components/ui/multi-select";
import { Select } from "@components/ui/select";
import { EmptyState } from "@shared/ui/molecules/EmptyState";
import { PartnerStatusBadge } from "@features/partners/PartnerStatusBadge";
import { getEffectiveOrderStatus } from "@features/partners/orderStatus";
import {
  PartnersPageFilters,
  PartnersPageHeader,
  PartnersPageShell,
  PartnersTableCard,
} from "@features/partners/layout/PartnersPageLayout";

type HistoryFilter = "ALL" | "DISPATCHED" | "DELIVERED" | "CANCELLED" | "RETURNED";

function toISODate(value: Date) {
  return new Date(value.getTime() - value.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function parseOrderTimestamp(order: PartnerOrder) {
  const value = order.createdAt || `${order.orderDate}T00:00:00`;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date(order.orderDate) : date;
}

function formatDateTime(order: PartnerOrder) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(parseOrderTimestamp(order));
}

function isHistoricalOrder(order: PartnerOrder) {
  const status = getEffectiveOrderStatus(order);
  return (
    status === "CANCELLED" ||
    status === "DISPATCHED" ||
    status === "DELIVERED" ||
    status === "PARTIALLY_DELIVERED" ||
    status === "RETURNED" ||
    status === "PARTIALLY_RETURNED"
  );
}

export function PartnersOrderHistoryPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { activePartnerFirmId } = useAppState();
  const brands = usePartnerBrands(activePartnerFirmId);
  const orders = usePartnerOrders(activePartnerFirmId);
  const stock = usePartnerStock(activePartnerFirmId, "");
  const defaultEnd = toISODate(new Date());
  const defaultStart = toISODate(new Date(Date.now() - 24 * 60 * 60 * 1000));
  const [fromDate, setFromDate] = useState(defaultStart);
  const [toDate, setToDate] = useState(defaultEnd);
  const [search, setSearch] = useState("");
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>("ALL");
  const selectedBrandIds = useMemo(
    () =>
      (searchParams.get("brands") ?? "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    [searchParams],
  );
  const effectiveBrandIds = selectedBrandIds.length > 0 ? selectedBrandIds : brands.items.map((brand) => String(brand.id));
  const itemBrandById = useMemo(
    () => new Map(stock.items.flatMap((item) => [[item.itemId, String(item.brandId)], [item.catalogItemId || item.itemId, String(item.brandId)]])),
    [stock.items],
  );

  const filteredOrders = useMemo(
    () =>
      [...orders.items]
        .filter((order) => {
          if (!isHistoricalOrder(order)) {
            return false;
          }
          const date = parseOrderTimestamp(order);
          const from = new Date(`${fromDate}T00:00:00`);
          const to = new Date(`${toDate}T23:59:59`);
          if (date < from || date > to) {
            return false;
          }

          if (historyFilter === "DISPATCHED" && getEffectiveOrderStatus(order) !== "DISPATCHED") {
            return false;
          }
          if (historyFilter === "DELIVERED" && getEffectiveOrderStatus(order) !== "DELIVERED") {
            return false;
          }
          if (historyFilter === "CANCELLED" && getEffectiveOrderStatus(order) !== "CANCELLED") {
            return false;
          }
          if (
            historyFilter === "RETURNED" &&
            getEffectiveOrderStatus(order) !== "RETURNED" &&
            getEffectiveOrderStatus(order) !== "PARTIALLY_RETURNED"
          ) {
            return false;
          }
          if (effectiveBrandIds.length > 0) {
            const orderBrandIds = new Set(
              order.items
                .map((item) => itemBrandById.get(item.catalogItemId || item.itemId))
                .filter((brandId): brandId is string => Boolean(brandId)),
            );
            if (orderBrandIds.size > 0 && !effectiveBrandIds.some((brandId) => orderBrandIds.has(brandId))) {
              return false;
            }
          }
          const query = search.trim().toLowerCase();
          if (!query) {
            return true;
          }

          return (
            order.orderNumber.toLowerCase().includes(query) ||
            order.clientBusinessName.toLowerCase().includes(query) ||
            order.clientOutletName.toLowerCase().includes(query)
          );
        })
        .sort((a, b) => parseOrderTimestamp(b).getTime() - parseOrderTimestamp(a).getTime()),
    [effectiveBrandIds, fromDate, historyFilter, itemBrandById, orders.items, search, toDate],
  );

  if (!activePartnerFirmId) {
    return <EmptyState>Select a firm to view order history.</EmptyState>;
  }

  return (
    <PartnersPageShell>
      <PartnersPageHeader
        title="Order history"
        description="Review completed, cancelled, and dispatched order records within the selected date range."
        actions={
          <>
            <div className="w-full sm:min-w-[280px] lg:w-[280px]">
              <MultiSelect
                value={effectiveBrandIds}
                options={brands.items.map((brand) => ({ value: String(brand.id), label: brand.name }))}
                onValueChange={(value) => {
                  const next = new URLSearchParams(searchParams);
                  if (value.length === 0 || value.length === brands.items.length) {
                    next.delete("brands");
                  } else {
                    next.set("brands", value.join(","));
                  }
                  setSearchParams(next, { replace: true });
                }}
                placeholder="Select brands"
              />
            </div>
            <Input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className="h-11 w-full sm:w-[170px]" />
            <Input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} className="h-11 w-full sm:w-[170px]" />
          </>
        }
      />

      <PartnersPageFilters className="xl:grid-cols-[minmax(0,1fr)_220px]">
        <div className="relative w-full">
          <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
            placeholder="Search by order number, client, or outlet"
          />
        </div>
        <div className="w-full">
          <Select
            value={historyFilter}
            onValueChange={(value) => setHistoryFilter(value as HistoryFilter)}
            options={[
              { value: "ALL", label: "All history" },
              { value: "DISPATCHED", label: "Dispatched" },
              { value: "DELIVERED", label: "Delivered" },
              { value: "CANCELLED", label: "Cancelled" },
              { value: "RETURNED", label: "Returned" },
            ]}
          />
        </div>
      </PartnersPageFilters>

      <PartnersTableCard>
        {filteredOrders.length === 0 ? (
          <div className="p-8">
            <EmptyState>No historical orders match the current filters.</EmptyState>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] text-sm">
              <thead className="text-left text-slate-500">
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="px-4 py-3">Order #</th>
                  <th className="px-4 py-3">Outlet</th>
                  <th className="px-4 py-3">Outlet</th>
                  <th className="px-4 py-3 text-right">Items</th>
                  <th className="px-4 py-3 text-right">Quantity</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created time</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="cursor-pointer border-b border-slate-100 text-slate-800 hover:bg-slate-50"
                    onClick={() => navigate(`/partners/sales/orders/${order.id}`)}
                  >
                    <td className="px-4 py-4 font-medium text-slate-900">{order.orderNumber}</td>
                    <td className="px-4 py-4">{order.clientBusinessName}</td>
                    <td className="px-4 py-4">{order.clientOutletName}</td>
                    <td className="px-4 py-4 text-right">{order.itemCount}</td>
                    <td className="px-4 py-4 text-right">{order.totalQuantity}</td>
                    <td className="px-4 py-4"><PartnerStatusBadge status={getEffectiveOrderStatus(order)} /></td>
                    <td className="px-4 py-4 whitespace-nowrap text-slate-600">{formatDateTime(order)}</td>
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
