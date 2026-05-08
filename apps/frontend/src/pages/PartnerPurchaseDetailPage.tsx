import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppState } from "@app/providers/AppStateProvider";
import { usePartnerPurchase } from "@entities/partners/hooks";
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
  const purchase = usePartnerPurchase(activePartnerFirmId, purchaseId);
  const [showReceive, setShowReceive] = useState(false);
  const [mutating, setMutating] = useState(false);
  const [actionError, setActionError] = useState("");

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
            isMutating={mutating}
            onReceive={() => setShowReceive(true)}
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
            onCancel={async () => {
              setMutating(true);
              setActionError("");
              try {
                await purchase.cancel();
                navigate("/partners/purchases");
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
            }}
          />
        </>
      )}
    </PartnersPageShell>
  );
}
