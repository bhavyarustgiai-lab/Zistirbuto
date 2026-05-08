import { useEffect, useMemo, useState } from "react";
import { ClipboardList, Pencil, Search } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useAppState } from "@app/providers/AppStateProvider";
import { usePartnerBrands, usePartnerInventory } from "@entities/partners/hooks";
import { EditInventoryDrawer } from "@features/partners/EditInventoryDrawer";
import { ExportCsvButton } from "@features/partners/ExportCsvButton";
import {
  PartnersPageFilters,
  PartnersPageHeader,
  PartnersPageShell,
  PartnersSummaryCardGrid,
  PartnersTableCard,
} from "@features/partners/layout/PartnersPageLayout";
import { Button } from "@components/ui/button";
import { Card, CardContent } from "@components/ui/card";
import { EmptyState } from "@shared/ui/molecules/EmptyState";
import { Input } from "@components/ui/input";
import { Select } from "@components/ui/select";

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function statusClassName(status: "ACTIVE" | "INACTIVE") {
  return status === "ACTIVE"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-slate-200 bg-slate-100 text-slate-600";
}

export function PartnersStockPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { activePartnerFirmId } = useAppState();
  const brands = usePartnerBrands(activePartnerFirmId);
  const queryBrandId = searchParams.get("brand") ?? "";
  const [selectedBrandId, setSelectedBrandId] = useState("");
  const [search, setSearch] = useState("");
  const [showEditDrawer, setShowEditDrawer] = useState(false);
  const [editingItemId, setEditingItemId] = useState("");
  const inventory = usePartnerInventory(activePartnerFirmId, selectedBrandId);

  const brandOptions = useMemo(
    () => brands.items.map((brand) => ({ value: String(brand.id), label: brand.name })),
    [brands.items],
  );

  useEffect(() => {
    if (!brands.items.length) {
      setSelectedBrandId("");
      return;
    }
    const nextBrandId =
      queryBrandId && brands.items.some((brand) => String(brand.id) === queryBrandId)
        ? queryBrandId
        : brands.items[0]?.id
          ? String(brands.items[0].id)
          : "";

    setSelectedBrandId((current) => (current === nextBrandId ? current : nextBrandId));
    if (nextBrandId && queryBrandId !== nextBrandId) {
      const next = new URLSearchParams(searchParams);
      next.set("brand", nextBrandId);
      setSearchParams(next, { replace: true });
    }
  }, [brands.items, queryBrandId, searchParams, setSearchParams]);

  function handleBrandChange(nextBrandId: string) {
    setSelectedBrandId(nextBrandId);
    const next = new URLSearchParams(searchParams);
    next.set("brand", nextBrandId);
    setSearchParams(next, { replace: true });
  }

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return inventory.items;
    }
    return inventory.items.filter((item) =>
      [item.itemName, item.sku, item.lastSupplierName ?? "", item.status].some((value) =>
        value.toLowerCase().includes(term),
      ),
    );
  }, [inventory.items, search]);

  const summary = useMemo(() => {
    const activeItems = filteredItems.filter((item) => item.status === "ACTIVE").length;
    const inactiveItems = filteredItems.filter((item) => item.status === "INACTIVE").length;
    const totalQuantity = filteredItems.reduce((sum, item) => sum + item.quantity, 0);
    const inventoryValue = filteredItems.reduce((sum, item) => sum + item.quantity * item.mrp, 0);
    return { activeItems, inactiveItems, totalQuantity, inventoryValue };
  }, [filteredItems]);

  if (!activePartnerFirmId) {
    return <EmptyState>Select a firm to view inventory.</EmptyState>;
  }

  return (
    <PartnersPageShell>
      <PartnersPageHeader
        title="Inventory"
        description="Track available stock by brand. Supplier inward is handled through purchases and GRNs."
        actions={
          <div className="w-full sm:min-w-[320px] lg:w-[320px]">
            <Select value={selectedBrandId} onValueChange={handleBrandChange} options={brandOptions} />
          </div>
        }
      />

      <PartnersSummaryCardGrid className="xl:grid-cols-4">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="space-y-1 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Active SKUs</p>
            <p className="text-2xl font-semibold tracking-tight text-slate-950">{summary.activeItems}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="space-y-1 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Inactive SKUs</p>
            <p className="text-2xl font-semibold tracking-tight text-slate-950">{summary.inactiveItems}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="space-y-1 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Quantity</p>
            <p className="text-2xl font-semibold tracking-tight text-slate-950">{summary.totalQuantity}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="space-y-1 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Inventory Value</p>
            <p className="text-2xl font-semibold tracking-tight text-slate-950">{formatMoney(summary.inventoryValue)}</p>
          </CardContent>
        </Card>
      </PartnersSummaryCardGrid>

      <PartnersPageFilters className="md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] xl:grid-cols-none xl:flex xl:flex-wrap">
        <div className="relative w-full xl:min-w-[340px] xl:flex-1">
          <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
            placeholder="Search item, SKU, or status"
          />
        </div>
        <div className="grid gap-3 md:grid-cols-3 xl:flex xl:flex-wrap xl:justify-end">
          <ExportCsvButton
            filename="inventory.csv"
            headers={["Item Name", "SKU Code", "MRP", "Buy Margin", "Status", "Quantity"]}
            rows={filteredItems.map((item) => [item.itemName, item.sku, item.mrp, item.discountPercentage, item.status, item.quantity])}
          />
          <Button
            variant="outline"
            className="h-11 w-full px-3 text-sm sm:w-auto"
            disabled={filteredItems.length === 0}
            onClick={() => {
              setEditingItemId(filteredItems[0]?.itemId ?? "");
              setShowEditDrawer(true);
            }}
          >
            <Pencil className="mr-1 h-4 w-4" />
            Adjust stock
          </Button>
          <Link
            to="/partners/purchases"
            className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-brand-500 px-3 text-sm font-medium text-white transition hover:bg-brand-600 sm:w-auto"
          >
            <ClipboardList className="mr-1 h-4 w-4" />
            Receive stock
          </Link>
        </div>
      </PartnersPageFilters>

      <PartnersTableCard>
        {inventory.items.length === 0 ? (
          <div className="px-6 py-10">
            <EmptyState>No stock rows available for this brand. Receive stock from purchases or use adjustments for corrections.</EmptyState>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="px-6 py-10">
            <EmptyState>No inventory rows match the current search.</EmptyState>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-sm">
              <thead className="bg-slate-50/80 text-left text-slate-500">
                <tr className="border-b border-slate-200">
                  <th className="px-5 py-3 font-medium">Item</th>
                  <th className="px-4 py-3 text-right font-medium">MRP</th>
                  <th className="px-4 py-3 text-right font-medium">Buy Margin</th>
                  <th className="px-4 py-3 text-right font-medium">Quantity</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.itemId} className="border-b border-slate-100 text-slate-800 last:border-b-0">
                    <td className="px-5 py-4">
                      <div className="min-w-0">
                        <div className="font-medium text-slate-950">{item.itemName}</div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                          <span>SKU {item.sku}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">{formatMoney(item.mrp)}</td>
                    <td className="px-4 py-4 text-right">{item.discountPercentage}%</td>
                    <td className="px-4 py-4 text-right">
                      <div className="font-semibold text-slate-950">{item.quantity}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${statusClassName(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          className="h-9 px-3 text-slate-700 hover:bg-slate-100"
                          onClick={() => {
                            setEditingItemId(item.itemId);
                            setShowEditDrawer(true);
                          }}
                        >
                          <Pencil className="mr-1 h-4 w-4" />
                          Adjust
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PartnersTableCard>

      <EditInventoryDrawer
        open={showEditDrawer}
        items={inventory.items}
        initialItemId={editingItemId}
        onClose={() => {
          setShowEditDrawer(false);
          setEditingItemId("");
        }}
        onSubmit={async (itemId, quantity, status, note) => {
          await inventory.update(itemId, { quantity, status, note });
        }}
      />
    </PartnersPageShell>
  );
}
