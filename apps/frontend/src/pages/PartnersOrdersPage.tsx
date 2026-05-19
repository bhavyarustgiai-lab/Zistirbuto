import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@app/ToastProvider";
import { useAppState } from "@app/providers/AppStateProvider";
import { usePartnerBrands, usePartnerCatalogItems, usePartnerClientBusinesses } from "@entities/partners/hooks";
import { usePartnerOrdersResource } from "@features/partners/orders/hooks";
import type { CreatePartnerOrderInput, PartnerOrderQueueStage } from "@features/partners/orders/types";
import { OrderForm } from "@features/partners/orders/components/OrderForm";
import { OrderList } from "@features/partners/orders/components/OrderList";
import { AppButton } from "@shared/ui/atoms/app-button";
import { AppInput } from "@shared/ui/atoms/app-input";
import { EmptyState } from "@shared/ui/molecules/empty-state";
import { ErrorState } from "@shared/ui/molecules/error-state";
import { LoadingState } from "@shared/ui/molecules/loading-state";
import { FilterBar } from "@shared/ui/organisms/filter-bar";
import { ResourceListPage } from "@shared/ui/templates/resource-list-page";
import { MultiSelect } from "@components/ui/multi-select";
import { Tabs, TabsList, TabsTrigger } from "@components/ui/tabs";
import { PartnersPageShell } from "@features/partners/layout/PartnersPageLayout";

export function PartnersOrdersPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { push } = useToast();
  const { activePartnerFirmId } = useAppState();
  const brands = usePartnerBrands(activePartnerFirmId);
  const orders = usePartnerOrdersResource(activePartnerFirmId);
  const businesses = usePartnerClientBusinesses(activePartnerFirmId, "");
  const catalog = usePartnerCatalogItems(activePartnerFirmId, brands.items.map((brand) => brand.id));
  const [showCreateDrawer, setShowCreateDrawer] = useState(false);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<PartnerOrderQueueStage>("DRAFT");

  const selectedBrandIds = useMemo(
    () =>
      (searchParams.get("brands") ?? "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    [searchParams],
  );
  const effectiveBrandIds = selectedBrandIds.length > 0 ? selectedBrandIds : brands.items.map((brand) => String(brand.id));
  const brandNamesById = useMemo(() => new Map(brands.items.map((brand) => [String(brand.id), brand.name])), [brands.items]);
  const formBrandNamesById = useMemo(() => new Map(brands.items.map((brand) => [brand.id, brand.name])), [brands.items]);
  const itemBrandById = useMemo(() => new Map(catalog.items.map((item) => [item.id, String(item.brandId)])), [catalog.items]);
  const outletAddressById = useMemo(
    () =>
      new Map(
        businesses.items.flatMap((business) =>
          business.outlets.map((outlet) => [outlet.id, outlet.address ?? ""] as const),
        ),
      ),
    [businesses.items],
  );
  async function createOrder(input: CreatePartnerOrderInput) {
    const created = await orders.create(input);
    push({ tone: "success", title: "Order created", description: created.orderNumber });
  }

  if (!activePartnerFirmId) {
    return (
      <PartnersPageShell>
        <EmptyState>Select a firm to view orders.</EmptyState>
      </PartnersPageShell>
    );
  }

  return (
    <PartnersPageShell>
      <ResourceListPage
        title="Orders"
        description="Run active outlet orders as a focused operational queue."
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
            <AppButton className="h-11 w-full px-4 text-sm sm:w-auto" onClick={() => setShowCreateDrawer(true)}>
              <Plus className="mr-1 h-4 w-4" />
              Create Order
            </AppButton>
          </>
        }
        filters={
          <div className="grid gap-3">
            <Tabs value={stageFilter} onValueChange={(value) => setStageFilter(value as PartnerOrderQueueStage)}>
              <TabsList>
                <TabsTrigger value="DRAFT">Draft</TabsTrigger>
                <TabsTrigger value="CONFIRMED">Confirmed</TabsTrigger>
                <TabsTrigger value="PACKED">Packed</TabsTrigger>
                <TabsTrigger value="DISPATCHED">Dispatched</TabsTrigger>
              </TabsList>
            </Tabs>
            <FilterBar>
              <div className="relative w-full">
                <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <AppInput
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="pl-9"
                  placeholder="Search by order number, client, or outlet"
                />
              </div>
            </FilterBar>
          </div>
        }
      >
        {orders.loading ? (
          <LoadingState label="Loading orders..." />
        ) : orders.error ? (
          <ErrorState
            title={orders.unauthorized ? "Orders unavailable" : "Failed to load orders"}
            message={orders.unauthorized ? "You do not have access to this firm or your session has expired." : orders.error}
            onRetry={() => void orders.refresh().catch(() => undefined)}
          />
        ) : (
          <OrderList
            orders={orders.items}
            stageFilter={stageFilter}
            search={search}
            selectedBrandIds={selectedBrandIds}
            allBrandIds={brands.items.map((brand) => String(brand.id))}
            itemBrandById={itemBrandById}
            brandNamesById={brandNamesById}
            outletAddressById={outletAddressById}
            onOpenOrder={(orderId) => navigate(`/partners/sales/orders/${orderId}`)}
            onStatusChange={async (orderId, status) => {
              const updated = await orders.updateStatus(orderId, status);
              push({ tone: "success", title: "Order updated", description: `${updated.orderNumber} is now ${updated.status.toLowerCase()}.` });
            }}
            onCreateReturn={async (orderId, input) => {
              const result = await orders.createReturn(orderId, input);
              push({
                tone: "success",
                title: "Return created",
                description: `${result.salesReturn.returnNumber} created. Credit Note ${result.creditNote.creditNoteNumber} issued.`,
              });
            }}
          />
        )}
      </ResourceListPage>

      <OrderForm
        open={showCreateDrawer}
        businesses={businesses.items}
        catalogItems={catalog.items}
        brandNamesById={formBrandNamesById}
        catalogLoading={catalog.loading}
        catalogError={catalog.error?.message ?? ""}
        onRetryCatalog={() => void catalog.refresh().catch(() => undefined)}
        onClose={() => setShowCreateDrawer(false)}
        onSubmit={createOrder}
      />
    </PartnersPageShell>
  );
}
