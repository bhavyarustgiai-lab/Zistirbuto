import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { useAppState } from "@app/providers/AppStateProvider";
import { usePartnerPurchases, usePartnerStock, usePartnerSuppliers } from "@entities/partners/hooks";
import { CreatePurchaseOrderDialog } from "@features/partners/purchases/components/CreatePurchaseOrderDialog";
import { GoodsReceiptDialog } from "@features/partners/purchases/components/GoodsReceiptDialog";
import { PurchaseOrderTable } from "@features/partners/purchases/components/PurchaseOrderTable";
import {
  PartnersPageFilters,
  PartnersPageHeader,
  PartnersPageShell,
  PartnersTableCard,
} from "@features/partners/layout/PartnersPageLayout";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Select } from "@components/ui/select";
import { EmptyState } from "@shared/ui/molecules/empty-state";
import { ErrorState } from "@shared/ui/molecules/error-state";
import { LoadingState } from "@shared/ui/molecules/loading-state";
import type { PartnerPurchase } from "@shared/types/domain";

const statusOptions = [
  { value: "ALL", label: "All statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "ORDERED", label: "Ordered" },
  { value: "PARTIALLY_RECEIVED", label: "Partially received" },
  { value: "RECEIVED", label: "Received" },
  { value: "CANCELLED", label: "Cancelled" },
];

export function PartnerPurchasesPage() {
  const { activePartnerFirmId } = useAppState();
  const purchases = usePartnerPurchases(activePartnerFirmId);
  const suppliers = usePartnerSuppliers(activePartnerFirmId, "");
  const stock = usePartnerStock(activePartnerFirmId, "");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [showCreate, setShowCreate] = useState(false);
  const [receivingPurchase, setReceivingPurchase] = useState<PartnerPurchase | null>(null);
  const [mutating, setMutating] = useState(false);
  const [actionError, setActionError] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return purchases.items.filter((purchase) => {
      const matchesStatus = status === "ALL" || purchase.status === status;
      const matchesSearch =
        !term ||
        [purchase.purchaseNumber, purchase.supplierName, purchase.supplierInvoiceNumber ?? "", purchase.status].some((value) =>
          value.toLowerCase().includes(term),
        );
      return matchesStatus && matchesSearch;
    });
  }, [purchases.items, search, status]);

  if (!activePartnerFirmId) {
    return <EmptyState>Select a firm to view purchases.</EmptyState>;
  }

  return (
    <PartnersPageShell>
      <PartnersPageHeader
        title="Purchases"
        description="Create purchase orders, track expected inward, and receive stock through GRNs."
        actions={
          <Button className="h-11 w-full px-4 text-sm sm:w-auto" onClick={() => setShowCreate(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Create PO
          </Button>
        }
      />

      <PartnersPageFilters className="md:grid-cols-[minmax(0,1fr)_220px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="Search PO, supplier, invoice, or status" />
        </div>
        <Select value={status} onValueChange={setStatus} options={statusOptions} />
      </PartnersPageFilters>

      {actionError ? <ErrorState title="Action failed" message={actionError} onRetry={() => setActionError("")} /> : null}

      <PartnersTableCard>
        {purchases.isLoading ? (
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
            onCancel={async (purchaseId) => {
              setMutating(true);
              setActionError("");
              try {
                await purchases.cancel(purchaseId);
              } catch (err) {
                setActionError(err instanceof Error ? err.message : "Something went wrong, please try again later");
              } finally {
                setMutating(false);
              }
            }}
          />
        )}
      </PartnersTableCard>

      <CreatePurchaseOrderDialog
        open={showCreate}
        suppliers={suppliers.items}
        stockRows={stock.items}
        onClose={() => setShowCreate(false)}
        onSubmit={purchases.create}
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
