import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "@app/ToastProvider";
import { useAppState } from "@app/providers/AppStateProvider";
import {
  usePartnerBrands,
  usePartnerCatalogItems,
  usePartnerPurchase,
  usePartnerSuppliers,
} from "@entities/partners/hooks";
import { CancelPurchaseDialog } from "@features/partners/purchases/components/CancelPurchaseDialog";
import { GoodsReceiptDialog } from "@features/partners/purchases/components/GoodsReceiptDialog";
import { PurchaseOrderDetail } from "@features/partners/purchases/components/PurchaseOrderDetail";
import { PartnersPageShell } from "@features/partners/layout/PartnersPageLayout";
import { EmptyState } from "@shared/ui/molecules/empty-state";
import { ErrorState } from "@shared/ui/molecules/error-state";
import { LoadingState } from "@shared/ui/molecules/loading-state";

export function PartnerPurchaseDetailPage() {
  const { activePartnerFirmId } = useAppState();
  const { purchaseId = "" } = useParams();
  const navigate = useNavigate();
  const { push } = useToast();
  const purchase = usePartnerPurchase(activePartnerFirmId, purchaseId);
  const brands = usePartnerBrands(activePartnerFirmId);
  const brandIds = useMemo(() => brands.items.map((brand) => brand.id), [brands.items]);
  const catalog = usePartnerCatalogItems(activePartnerFirmId, brandIds);
  const suppliers = usePartnerSuppliers(activePartnerFirmId, "");
  const [showReceive, setShowReceive] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [mutating, setMutating] = useState(false);
  const [actionError, setActionError] = useState("");

  const firstPurchaseItemId = purchase.item?.items[0]?.itemId ?? "";
  const selectedCatalogItem = useMemo(
    () => catalog.items.find((item) => item.id === firstPurchaseItemId) ?? null,
    [catalog.items, firstPurchaseItemId],
  );
  const editCatalogItems = useMemo(
    () =>
      selectedCatalogItem
        ? catalog.items.filter((item) => item.brandId === selectedCatalogItem.brandId)
        : catalog.items,
    [catalog.items, selectedCatalogItem],
  );

  if (!activePartnerFirmId) {
    return <EmptyState>Select a firm to view purchase details.</EmptyState>;
  }

  return (
    <PartnersPageShell>
      {purchase.isLoading ? (
        <LoadingState label="Loading purchase order..." />
      ) : purchase.error ? (
        <ErrorState message={purchase.error} onRetry={purchase.refresh} />
      ) : !purchase.item ? (
        <EmptyState title="Purchase order not found." />
      ) : (
        <>
          {actionError ? <ErrorState title="Action failed" message={actionError} onRetry={() => setActionError("")} /> : null}
          <PurchaseOrderDetail
            purchase={purchase.item}
            receipts={purchase.receipts}
            catalogItems={editCatalogItems}
            suppliers={suppliers.items}
            isMutating={mutating}
            onReceive={() => setShowReceive(true)}
            onSaveSupplierDetails={async (input) => {
              if (!purchase.item) return;
              await purchase.update({
                supplierId: input.supplierId,
                supplierInvoiceNumber: input.supplierInvoiceNumber,
                notes: purchase.item.notes,
                items: purchase.item.items.map((item) => ({
                  itemId: item.itemId,
                  quantity: item.quantity,
                  costPrice: item.costPrice,
                  discountPercentage: item.discountPercentage,
                  taxPercentage: item.taxPercentage,
                })),
              });
              push({
                title: "Supplier details updated",
                description: "Purchase order supplier details have been saved.",
                tone: "success",
              });
            }}
            onSaveItems={async (items, notes) => {
              if (!purchase.item) return;
              await purchase.update({
                supplierId: purchase.item.supplierId,
                supplierInvoiceNumber: purchase.item.supplierInvoiceNumber,
                notes,
                items,
              });
              push({
                title: "Purchase order updated",
                description: "Item lines have been saved.",
                tone: "success",
              });
            }}
            onOrder={async () => {
              setMutating(true);
              setActionError("");
              try {
                await purchase.order();
              } catch (err) {
                setActionError(err instanceof Error ? err.message : "Something went wrong, please try again later");
              } finally {
                setMutating(false);
              }
            }}
            onCancel={() => setShowCancel(true)}
          />
          <CancelPurchaseDialog
            open={showCancel}
            purchase={purchase.item}
            loading={mutating}
            onClose={() => setShowCancel(false)}
            onCancel={async (input) => {
              setMutating(true);
              setActionError("");
              try {
                await purchase.cancel(input);
                setShowCancel(false);
                navigate("/partners/supply/purchases");
              } catch (err) {
                setActionError(err instanceof Error ? err.message : "Something went wrong, please try again later");
              } finally {
                setMutating(false);
              }
            }}
          />
          <GoodsReceiptDialog
            open={showReceive}
            purchase={purchase.item}
            onClose={() => setShowReceive(false)}
            onSubmit={async (input) => {
              await purchase.receive(input);
              setShowReceive(false);
            }}
          />
        </>
      )}
    </PartnersPageShell>
  );
}
