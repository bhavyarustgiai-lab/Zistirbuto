import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "@app/providers/AppStateProvider";
import { usePartnerOrdersResource } from "@features/partners/orders/hooks";
import { AppInput } from "@shared/ui/atoms/app-input";
import { EmptyState } from "@shared/ui/molecules/empty-state";
import { ErrorState } from "@shared/ui/molecules/error-state";
import { LoadingState } from "@shared/ui/molecules/loading-state";
import { DataTable } from "@shared/ui/organisms/data-table";
import { ResourceListPage } from "@shared/ui/templates/resource-list-page";
import { PartnersPageShell } from "@features/partners/layout/PartnersPageLayout";

type BackorderRow = {
  id: string;
  clientName: string;
  outletName: string;
  itemCode: string;
  itemName: string;
  openQuantity: number;
  orderId: string;
  orderNumber: string;
  createdAt: string;
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

export function PartnersBackordersPage() {
  const navigate = useNavigate();
  const { activePartnerFirmId } = useAppState();
  const orders = usePartnerOrdersResource(activePartnerFirmId);
  const [search, setSearch] = useState("");

  const rows = useMemo<BackorderRow[]>(
    () =>
      orders.items.flatMap((order) =>
        (order.unfulfilledItems ?? [])
          .filter((item) => item.openQuantity > 0 && item.status !== "CANCELLED")
          .map((item) => ({
            id: item.id,
            clientName: order.clientBusinessName,
            outletName: order.clientOutletName,
            itemCode: item.itemCode,
            itemName: item.itemName,
            openQuantity: item.openQuantity,
            orderId: order.id,
            orderNumber: order.orderNumber,
            createdAt: item.createdAt,
          })),
      ),
    [orders.items],
  );

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((row) =>
      [row.clientName, row.outletName, row.itemCode, row.itemName, row.orderNumber].some((value) => value.toLowerCase().includes(query)),
    );
  }, [rows, search]);

  if (!activePartnerFirmId) {
    return (
      <PartnersPageShell>
        <EmptyState>Select a firm to view backorders.</EmptyState>
      </PartnersPageShell>
    );
  }

  return (
    <PartnersPageShell>
      <ResourceListPage
        title="Backorders"
        description="Open unfulfilled demand by client, outlet, and item."
        filters={
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <AppInput value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="Search by client, outlet, item, or order" />
          </div>
        }
      >
        {orders.loading ? (
          <LoadingState label="Loading backorders..." />
        ) : orders.error ? (
          <ErrorState title="Failed to load backorders" message={orders.error} onRetry={() => void orders.refresh().catch(() => undefined)} />
        ) : filteredRows.length === 0 ? (
          <DataTable>
            <div className="p-8">
              <EmptyState>No open backorders found.</EmptyState>
            </div>
          </DataTable>
        ) : (
          <DataTable>
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <table className="w-full min-w-[980px] text-sm">
                <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  <tr className="border-b border-slate-200">
                    <th className="px-3 py-3">Client</th>
                    <th className="px-3 py-3">Outlet</th>
                    <th className="px-3 py-3">Item</th>
                    <th className="px-3 py-3 text-right">Pending Qty</th>
                    <th className="px-3 py-3">Original Order</th>
                    <th className="px-3 py-3">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => (
                    <tr key={row.id} className="cursor-pointer border-b border-slate-100 text-slate-700 hover:bg-slate-50" onClick={() => navigate(`/partners/sales/orders/${row.orderId}`)}>
                      <td className="px-3 py-3 font-medium text-slate-900">{row.clientName}</td>
                      <td className="px-3 py-3">{row.outletName}</td>
                      <td className="px-3 py-3">
                        <div className="font-medium text-slate-900">{row.itemName}</div>
                        <div className="text-xs text-slate-500">{row.itemCode}</div>
                      </td>
                      <td className="px-3 py-3 text-right font-medium tabular-nums text-rose-600">{row.openQuantity.toLocaleString("en-IN")}</td>
                      <td className="px-3 py-3 font-medium text-slate-900">{row.orderNumber}</td>
                      <td className="px-3 py-3 text-slate-600">{formatDate(row.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DataTable>
        )}
      </ResourceListPage>
    </PartnersPageShell>
  );
}
