import { useMemo, useState } from "react";
import { ArrowUpRight, Package2, Plus, Search, Warehouse } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAppState } from "@app/providers/AppStateProvider";
import { usePartnerBrands, usePartnerStock } from "@entities/partners/hooks";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { EmptyState } from "@shared/ui/molecules/EmptyState";
import { AddBrandMappingDialog } from "@features/partners/AddBrandMappingDialog";
import {
  PartnersPageFilters,
  PartnersPageHeader,
  PartnersPageShell,
} from "@features/partners/layout/PartnersPageLayout";
import { cn } from "@shared/lib/cn";

function formatRelativeTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const minutes = Math.round((Date.now() - date.getTime()) / (1000 * 60));
  if (minutes < 60) return `${Math.max(minutes, 1)} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short" }).format(date);
}

export function PartnersBrandsPage() {
  const navigate = useNavigate();
  const { activePartnerFirmId } = useAppState();
  const brands = usePartnerBrands(activePartnerFirmId);
  const stock = usePartnerStock(activePartnerFirmId, "");
  const [search, setSearch] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);

  const existingBrandNames = useMemo(
    () => brands.items.map((item) => item.name),
    [brands.items],
  );

  const stockSummaryByBrand = useMemo(() => {
    const summary = new Map<number, { units: number; lastUpdated: string }>();

    for (const row of stock.items) {
      const existing = summary.get(row.brandId);
      const nextUpdated =
        !existing?.lastUpdated || new Date(row.lastUpdated).getTime() > new Date(existing.lastUpdated).getTime()
          ? row.lastUpdated
          : existing.lastUpdated;

      summary.set(row.brandId, {
        units: (existing?.units ?? 0) + row.currentStockQty,
        lastUpdated: nextUpdated,
      });
    }

    return summary;
  }, [stock.items]);

  const filteredBrands = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return brands.items;
    return brands.items.filter((brand) => brand.name.toLowerCase().includes(query));
  }, [brands.items, search]);

  if (!activePartnerFirmId) {
    return <EmptyState>Select a firm to manage brand mappings.</EmptyState>;
  }

  return (
    <PartnersPageShell>
      <PartnersPageHeader
        title="Brands"
        description="Manage brand catalogs mapped to this distributor firm."
        actions={
          <Button className="h-11 w-full px-4 text-sm sm:w-auto" onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Add brand
          </Button>
        }
      />

      <PartnersPageFilters className="xl:grid-cols-[minmax(0,1fr)]">
        <div className="relative w-full lg:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
            placeholder="Search brands..."
          />
        </div>
      </PartnersPageFilters>

      {brands.items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm">
          <p className="text-base font-semibold text-slate-900">No brands mapped yet.</p>
          <p className="mt-2 text-sm text-slate-500">Map brands to start building your product catalog.</p>
          <div className="mt-5">
            <Button className="h-10 px-4 text-sm" onClick={() => setShowAddDialog(true)}>
              <Plus className="mr-1 h-4 w-4" />
              Add brand
            </Button>
          </div>
        </div>
      ) : filteredBrands.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm">
          <p className="text-base font-semibold text-slate-900">No brands match this search.</p>
          <p className="mt-2 text-sm text-slate-500">Try a different name or clear the search to view all mapped brands.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filteredBrands.map((brand) => {
            const stockSummary = stockSummaryByBrand.get(brand.id);
            const hasStock = stockSummary != null;
            const catalogHref = `/partners/items?brand=${encodeURIComponent(String(brand.id))}`;
            const stockHref = `/partners/stock?brand=${encodeURIComponent(String(brand.id))}`;

            return (
              <div
                key={brand.id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(catalogHref)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    navigate(catalogHref);
                  }
                }}
                className="group rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-slate-900">{brand.name}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {brand.itemCount} {brand.itemCount === 1 ? "item" : "items"}
                      {hasStock ? ` • ${stockSummary.units} units in stock` : ""}
                    </p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-slate-500" />
                </div>

                <div className="mt-4">
                  <p className="text-xs text-slate-500">
                    {hasStock && stockSummary.lastUpdated ? `Last updated ${formatRelativeTime(stockSummary.lastUpdated)}` : "No stock updates yet"}
                  </p>
                </div>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Link
                    to={catalogHref}
                    onClick={(event) => event.stopPropagation()}
                    className={cn(
                      "inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 sm:flex-1",
                    )}
                  >
                    <Package2 className="h-4 w-4 shrink-0" />
                    <span>View catalog</span>
                  </Link>
                  <Link
                    to={stockHref}
                    onClick={(event) => event.stopPropagation()}
                    className={cn(
                      "inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-100 sm:flex-1",
                    )}
                  >
                    <Warehouse className="h-4 w-4 shrink-0" />
                    <span>View stock</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AddBrandMappingDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        existingBrandNames={existingBrandNames}
        onSubmit={async (input) => {
          await brands.add({ brandName: input.brandName });
        }}
      />
    </PartnersPageShell>
  );
}
