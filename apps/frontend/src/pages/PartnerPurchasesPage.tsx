import { useMemo, useState } from "react";
import { Plus, RotateCcw, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "@app/providers/AppStateProvider";
import { usePartnerBrandItems, usePartnerBrands, usePartnerPurchases } from "@entities/partners/hooks";
import { PartnerBrandSelector } from "@features/partners/brands/PartnerBrandSelector";
import { usePartnerBrandSelection } from "@features/partners/brands/usePartnerBrandSelection";
import { CancelPurchaseDialog } from "@features/partners/purchases/components/CancelPurchaseDialog";
import { GoodsReceiptDialog } from "@features/partners/purchases/components/GoodsReceiptDialog";
import { PurchaseDateRangePicker } from "@features/partners/purchases/components/PurchaseDateRangePicker";
import { PurchaseOrderTable } from "@features/partners/purchases/components/PurchaseOrderTable";
import {
  PartnersPageFilters,
  PartnersPageHeader,
  PartnersPageShell,
  PartnersTableCard,
} from "@features/partners/layout/PartnersPageLayout";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { EmptyState } from "@shared/ui/molecules/empty-state";
import { ErrorState } from "@shared/ui/molecules/error-state";
import { LoadingState } from "@shared/ui/molecules/loading-state";
import { todayISO } from "@shared/lib/date";
import type { PartnerPurchase } from "@shared/types/domain";

const viewOptions = [
  { value: "DRAFT", label: "Draft" },
  { value: "PLACED", label: "Placed" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const openViews = new Set(["DRAFT", "PLACED"]);

function offsetDateISO(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export function PartnerPurchasesPage() {
  const { activePartnerFirmId } = useAppState();
  const navigate = useNavigate();
  const purchases = usePartnerPurchases(activePartnerFirmId);
  const brands = usePartnerBrands(activePartnerFirmId);
  const { brandId, brandOptions, setBrandId } = usePartnerBrandSelection(
    activePartnerFirmId,
    brands.items,
  );
  const catalog = usePartnerBrandItems(activePartnerFirmId, brandId);
  const [search, setSearch] = useState("");
  const [view, setView] = useState("DRAFT");
  const [fromDate, setFromDate] = useState(offsetDateISO(-90));
  const [toDate, setToDate] = useState(todayISO());
  const [receivingPurchase, setReceivingPurchase] = useState<PartnerPurchase | null>(null);
  const [cancellingPurchase, setCancellingPurchase] = useState<PartnerPurchase | null>(null);
  const [mutating, setMutating] = useState(false);
  const [actionError, setActionError] = useState("");

  const selectedCatalogItemIds = useMemo(
    () => new Set(catalog.items.map((item) => item.id)),
    [catalog.items],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return purchases.items.filter((purchase) => {
      const matchesBrand =
        !brandId ||
        purchase.items.some((item) => selectedCatalogItemIds.has(item.itemId));
      const matchesStatus = purchase.status === view;
      const matchesDate =
        openViews.has(view) ||
        ((!fromDate || purchase.purchaseDate >= fromDate) &&
          (!toDate || purchase.purchaseDate <= toDate));
      const matchesSearch =
        !term ||
        [purchase.purchaseNumber, purchase.supplierName, purchase.supplierInvoiceNumber ?? ""].some((value) =>
          value.toLowerCase().includes(term),
        );
      return matchesBrand && matchesStatus && matchesDate && matchesSearch;
    });
  }, [brandId, fromDate, purchases.items, search, selectedCatalogItemIds, toDate, view]);

  if (!activePartnerFirmId) {
    return <EmptyState>Select a firm to view purchases.</EmptyState>;
  }

  return (
    <PartnersPageShell>
      <PartnersPageHeader
        title="Purchases"
        description="Create purchase orders and receive stock through GRNs."
        actions={
          <PartnerBrandSelector value={brandId} onValueChange={setBrandId} options={brandOptions} />
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {viewOptions.map((option) => (
            <Button
              key={option.value}
              variant={view === option.value ? "default" : "outline"}
              className="h-10 px-4 text-sm"
              onClick={() => setView(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button
            className="h-11 w-full px-4 text-sm sm:w-auto"
            disabled={!brandId}
            onClick={() => navigate(`/partners/supply/purchases/new?brand=${encodeURIComponent(brandId)}`)}
          >
            <Plus className="mr-1 h-4 w-4" />
            Create PO
          </Button>
          <Button
            variant="outline"
            className="h-11 w-full px-4 text-sm sm:w-auto"
            disabled={!brandId}
            onClick={() => navigate(`/partners/supply/supplier-returns?brand=${encodeURIComponent(brandId)}`)}
          >
            <RotateCcw className="mr-1 h-4 w-4" />
            Returns
          </Button>
        </div>
      </div>

      <PartnersPageFilters className={openViews.has(view) ? "md:grid-cols-[minmax(0,1fr)]" : "md:grid-cols-[minmax(0,1fr)_320px]"}>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="Search PO, supplier, or invoice" />
        </div>
        {!openViews.has(view) ? (
          <PurchaseDateRangePicker
            fromDate={fromDate}
            toDate={toDate}
            onChange={(range) => {
              setFromDate(range.fromDate);
              setToDate(range.toDate);
            }}
          />
        ) : null}
      </PartnersPageFilters>

      {actionError ? <ErrorState title="Action failed" message={actionError} onRetry={() => setActionError("")} /> : null}

      <PartnersTableCard>
        {purchases.isLoading || catalog.loading ? (
          <LoadingState label="Loading purchases..." />
        ) : purchases.error ? (
          <div className="p-6">
            <ErrorState message={purchases.error} onRetry={purchases.refresh} />
          </div>
        ) : purchases.items.length === 0 ? (
          <div className="p-8">
            <EmptyState title="No purchase orders yet." description="Create a PO when replenishing stock from suppliers." />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8">
            <EmptyState title="No purchase orders match the current filters." />
          </div>
        ) : (
          <PurchaseOrderTable
            purchases={filtered}
            isMutating={mutating}
            onReceive={setReceivingPurchase}
            onOrder={async (purchaseId) => {
              setMutating(true);
              setActionError("");
              try {
                await purchases.order(purchaseId);
              } catch (err) {
                setActionError(err instanceof Error ? err.message : "Something went wrong, please try again later");
              } finally {
                setMutating(false);
              }
            }}
            onCancel={setCancellingPurchase}
          />
        )}
      </PartnersTableCard>

      <CancelPurchaseDialog
        open={Boolean(cancellingPurchase)}
        purchase={cancellingPurchase}
        loading={mutating}
        onClose={() => setCancellingPurchase(null)}
        onCancel={async (input) => {
          if (!cancellingPurchase) return;
          setMutating(true);
          setActionError("");
          try {
            await purchases.cancel(cancellingPurchase.id, input);
            setCancellingPurchase(null);
          } catch (err) {
            setActionError(err instanceof Error ? err.message : "Something went wrong, please try again later");
          } finally {
            setMutating(false);
          }
        }}
      />

      <GoodsReceiptDialog
        open={Boolean(receivingPurchase)}
        purchase={receivingPurchase}
        onClose={() => setReceivingPurchase(null)}
        onSubmit={async (input) => {
          if (!receivingPurchase) return;
          await purchases.receive(receivingPurchase.id, input);
        }}
      />
    </PartnersPageShell>
  );
}
