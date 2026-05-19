import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@app/ToastProvider";
import { useAppState } from "@app/providers/AppStateProvider";
import {
  usePartnerBrandItems,
  usePartnerBrands,
  usePartnerPurchases,
  usePartnerSuppliers,
} from "@entities/partners/hooks";
import { PartnerBrandSelector } from "@features/partners/brands/PartnerBrandSelector";
import { usePartnerBrandSelection } from "@features/partners/brands/usePartnerBrandSelection";
import { PurchaseOrderBuilder } from "@features/partners/purchases/components/PurchaseOrderBuilder";
import {
  PartnersPageHeader,
  PartnersPageShell,
} from "@features/partners/layout/PartnersPageLayout";
import { EmptyState } from "@shared/ui/molecules/empty-state";
import { ErrorState } from "@shared/ui/molecules/error-state";
import { LoadingState } from "@shared/ui/molecules/loading-state";

export function PartnerPurchaseCreatePage() {
  const { activePartnerFirmId } = useAppState();
  const navigate = useNavigate();
  const { push } = useToast();
  const brands = usePartnerBrands(activePartnerFirmId);
  const suppliers = usePartnerSuppliers(activePartnerFirmId, "");
  const purchases = usePartnerPurchases(activePartnerFirmId);
  const { brandId, brandOptions, setBrandId } = usePartnerBrandSelection(
    activePartnerFirmId,
    brands.items,
  );
  const catalog = usePartnerBrandItems(activePartnerFirmId, brandId);
  const selectedBrand = useMemo(
    () => brands.items.find((brand) => String(brand.id) === brandId) ?? null,
    [brandId, brands.items],
  );

  if (!activePartnerFirmId) {
    return <EmptyState>Select a firm to create purchase orders.</EmptyState>;
  }

  return (
    <PartnersPageShell>
      <PartnersPageHeader
        eyebrow={
          <Link
            to={`/partners/supply/purchases${brandId ? `?brand=${encodeURIComponent(brandId)}` : ""}`}
            className="inline-flex w-fit shrink-0 items-center rounded-lg px-1 py-1 text-sm font-medium text-slate-600 hover:text-slate-950"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to purchases
          </Link>
        }
        title="Create purchase order"
        actions={
          <PartnerBrandSelector value={brandId} onValueChange={setBrandId} options={brandOptions} />
        }
      />
      {!selectedBrand ? (
        <EmptyState
          title="No brands mapped yet."
          description="Add a brand before creating purchase orders."
        />
      ) : catalog.loading || suppliers.loading ? (
        <LoadingState label="Loading purchase setup..." />
      ) : catalog.error ? (
        <ErrorState message={catalog.error.message} onRetry={catalog.refresh} />
      ) : suppliers.error ? (
        <ErrorState
          message={suppliers.error.message}
          onRetry={suppliers.refresh}
        />
      ) : (
        <PurchaseOrderBuilder
          brandName={selectedBrand.name}
          suppliers={suppliers.items}
          catalogItems={catalog.items}
          onCancel={() =>
            navigate(
              `/partners/supply/purchases?brand=${encodeURIComponent(brandId)}`,
            )
          }
          onSubmit={async (input) => {
            const created = await purchases.create(input);
            push({
              title: "Purchase order created",
              description: `${input.purchaseNumber} has been saved as a draft.`,
              tone: "success",
            });
            navigate(
              created?.id
                ? `/partners/supply/purchases/${encodeURIComponent(created.id)}`
                : `/partners/supply/purchases?brand=${encodeURIComponent(brandId)}`,
            );
            return created;
          }}
        />
      )}
    </PartnersPageShell>
  );
}
