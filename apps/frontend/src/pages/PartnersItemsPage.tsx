import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useToast } from "@app/ToastProvider";
import { useAppState } from "@app/providers/AppStateProvider";
import {
  createPartnerBrandItem,
  updatePartnerBrandItem,
} from "@entities/partners/api";
import {
  usePartnerBrandItems,
  usePartnerBrands,
} from "@entities/partners/hooks";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Select } from "@components/ui/select";
import { Badge } from "@components/ui/badge";
import { EmptyState } from "@shared/ui/molecules/EmptyState";
import { CreateItemsDrawer } from "@features/partners/CreateItemsDrawer";
import { EditItemDrawer } from "@features/partners/EditItemDrawer";
import {
  PartnersPageHeader,
  PartnersPageShell,
  PartnersTableCard,
} from "@features/partners/layout/PartnersPageLayout";
import type { PartnerCatalogItem } from "@shared/types/domain";

export function PartnersItemsPage() {
  const { activePartnerFirmId } = useAppState();
  const { push } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const brands = usePartnerBrands(activePartnerFirmId);
  const queryBrandId = searchParams.get("brand") ?? "";
  const [brandId, setBrandId] = useState("");
  const [search, setSearch] = useState("");
  const [showCreateDrawer, setShowCreateDrawer] = useState(false);
  const [editingItem, setEditingItem] = useState<PartnerCatalogItem | null>(null);
  const items = usePartnerBrandItems(activePartnerFirmId, brandId);
  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.items.filter((item) => {
      if (!query) return true;
      return item.name.toLowerCase().includes(query) || item.sku.toLowerCase().includes(query);
    });
  }, [items.items, search]);

  useEffect(() => {
    if (!brands.items.length) {
      setBrandId("");
      return;
    }
    const nextBrandId =
      queryBrandId && brands.items.some((brand) => String(brand.id) === queryBrandId)
        ? queryBrandId
        : brands.items[0]?.id
          ? String(brands.items[0].id)
          : "";

    setBrandId((current) => (current === nextBrandId ? current : nextBrandId));
    if (nextBrandId && queryBrandId !== nextBrandId) {
      const next = new URLSearchParams(searchParams);
      next.set("brand", nextBrandId);
      setSearchParams(next, { replace: true });
    }
  }, [brands.items, queryBrandId, searchParams, setSearchParams]);

  function handleBrandChange(nextBrandId: string) {
    setBrandId(nextBrandId);
    const next = new URLSearchParams(searchParams);
    next.set("brand", nextBrandId);
    setSearchParams(next, { replace: true });
  }

  if (!activePartnerFirmId) {
    return <EmptyState>Select a firm to manage items.</EmptyState>;
  }

  return (
    <PartnersPageShell>
      <PartnersPageHeader
        title="Catalog"
        description="Manage the selected brand catalog one brand at a time."
        actions={
          <div className="w-full sm:min-w-[280px] lg:w-[280px]">
            <Select
              value={brandId}
              onValueChange={handleBrandChange}
              options={brands.items.map((brand) => ({
                value: String(brand.id),
                label: brand.name,
              }))}
            />
          </div>
        }
      />

      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by item name or SKU"
          className="h-10 w-full md:max-w-[360px]"
        />
        <Button
          className="h-10 w-full px-3 text-sm md:w-auto"
          disabled={!brandId}
          onClick={() => setShowCreateDrawer(true)}
        >
          <Plus className="mr-1 h-4 w-4" />
          Create Item
        </Button>
      </div>

      <PartnersTableCard>
        {!brandId ? (
          <div className="p-8">
            <EmptyState>Select a brand to view items.</EmptyState>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-8">
            <EmptyState>{items.items.length === 0 ? "No items found for this brand." : "No items match this search."}</EmptyState>
          </div>
        ) : (
          <div>
            <div className="grid gap-3 p-3 md:hidden">
              {filteredItems.map((item) => (
                    <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900">{item.sku}</p>
                          <p className="mt-1 text-sm text-slate-700">{item.name}</p>
                        </div>
                        <Button
                          variant="ghost"
                          className="h-9 px-2 text-slate-700 hover:bg-slate-100"
                          onClick={() => setEditingItem(item)}
                          aria-label={`Edit ${item.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        <p className="text-sm text-slate-700">Description: {item.description?.trim() || "-"}</p>
                        <p className="text-sm text-slate-700">HSN code: {item.hsnCode?.trim() || "-"}</p>
                        <p className="text-sm text-slate-700">Default MRP: {item.defaultMrp || "-"}</p>
                        <p className="text-sm text-slate-700">Default Buy Margin: {item.defaultDiscountPercentage ?? 0}%</p>
                        <div className="sm:col-span-2">
                          <Badge tone={item.status === "ACTIVE" ? "active" : "inactive"}>
                            {item.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
            </div>

            <div className="hidden overflow-x-auto bg-white md:block">
              <table className="w-full min-w-[1120px] text-sm">
                <thead className="text-left text-slate-500">
                  <tr className="border-b border-slate-200">
                    <th className="px-3 py-2">SKU</th>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Description</th>
                    <th className="px-3 py-2">HSN code</th>
                    <th className="px-3 py-2 text-right">Default MRP</th>
                    <th className="px-3 py-2 text-right">Default Buy Margin</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-slate-100 text-slate-800"
                    >
                      <td className="px-3 py-2 align-middle font-medium text-slate-700">
                        {item.sku}
                      </td>
                      <td className="px-3 py-2 align-middle font-medium text-slate-900">
                        {item.name}
                      </td>
                      <td className="px-3 py-2 align-middle text-slate-700">
                        {item.description?.trim() || "-"}
                      </td>
                      <td className="px-3 py-2 align-middle text-slate-700">
                        {item.hsnCode?.trim() || "-"}
                      </td>
                      <td className="px-3 py-2 text-right align-middle text-slate-700">
                        {item.defaultMrp || "-"}
                      </td>
                      <td className="px-3 py-2 text-right align-middle text-slate-700">
                        {item.defaultDiscountPercentage ?? 0}%
                      </td>
                      <td className="px-3 py-2 align-middle text-slate-700">
                        <Badge tone={item.status === "ACTIVE" ? "active" : "inactive"}>
                          {item.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 align-middle">
                        <Button
                          variant="ghost"
                          className="h-9 px-2 text-slate-700 hover:bg-slate-100"
                          onClick={() => setEditingItem(item)}
                          aria-label={`Edit ${item.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </PartnersTableCard>

      <CreateItemsDrawer
        open={showCreateDrawer}
        onClose={() => setShowCreateDrawer(false)}
        existingSkus={items.items.map((item) => item.sku)}
        onSubmit={async (rows) => {
          if (!brandId) {
            throw new Error("Select a brand first.");
          }
          for (const row of rows) {
            await createPartnerBrandItem(activePartnerFirmId, brandId, row);
          }
          await Promise.all([items.refresh(), brands.refresh()]);
          push({
            title: rows.length === 1 ? "Item created" : "Items created",
            description: rows.length === 1 ? "The catalog item has been added." : `${rows.length} catalog items have been added.`,
            tone: "success",
          });
        }}
      />

      <EditItemDrawer
        open={Boolean(editingItem)}
        item={editingItem}
        onClose={() => setEditingItem(null)}
        onSubmit={async (patch) => {
          if (!editingItem) {
            throw new Error("Item not selected.");
          }
          await updatePartnerBrandItem(
            activePartnerFirmId,
            brandId,
            editingItem.id,
            patch,
          );
          await items.refresh();
          push({
            title: "Item saved",
            description: "The catalog item has been updated.",
            tone: "success",
          });
        }}
      />
    </PartnersPageShell>
  );
}
