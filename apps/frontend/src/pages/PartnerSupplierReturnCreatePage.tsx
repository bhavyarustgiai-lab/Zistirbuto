import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@app/ToastProvider";
import { useAppState } from "@app/providers/AppStateProvider";
import { usePartnerBrands, usePartnerInventory, usePartnerSupplierReturns, usePartnerSuppliers } from "@entities/partners/hooks";
import { PartnerBrandSelector } from "@features/partners/brands/PartnerBrandSelector";
import { usePartnerBrandSelection } from "@features/partners/brands/usePartnerBrandSelection";
import { SupplierReturnFormPanel } from "@features/partners/supplier-returns/SupplierReturnFormPanel";
import { PartnersPageHeader, PartnersPageShell } from "@features/partners/layout/PartnersPageLayout";
import { EmptyState } from "@shared/ui/molecules/empty-state";
import { ErrorState } from "@shared/ui/molecules/error-state";
import { LoadingState } from "@shared/ui/molecules/loading-state";

export function PartnerSupplierReturnCreatePage() {
  const { activePartnerFirmId } = useAppState();
  const navigate = useNavigate();
  const { push } = useToast();
  const brands = usePartnerBrands(activePartnerFirmId);
  const { brandId, brandOptions, setBrandId } = usePartnerBrandSelection(activePartnerFirmId, brands.items);
  const selectedBrand = useMemo(() => brands.items.find((brand) => String(brand.id) === brandId) ?? null, [brandId, brands.items]);
  const suppliers = usePartnerSuppliers(activePartnerFirmId, "");
  const inventory = usePartnerInventory(activePartnerFirmId, brandId);
  const returns = usePartnerSupplierReturns(activePartnerFirmId, brandId);

  if (!activePartnerFirmId) {
    return <EmptyState>Select a firm to create returns.</EmptyState>;
  }

  return (
    <PartnersPageShell>
      <PartnersPageHeader
        eyebrow={
          <Link
            to={`/partners/supply/supplier-returns${brandId ? `?brand=${encodeURIComponent(brandId)}` : ""}`}
            className="inline-flex w-fit shrink-0 items-center rounded-lg px-1 py-1 text-sm font-medium text-slate-600 hover:text-slate-950"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to returns
          </Link>
        }
        title="Create return"
        actions={
          <PartnerBrandSelector value={brandId} onValueChange={setBrandId} options={brandOptions} />
        }
      />
      {!selectedBrand ? (
        <EmptyState title="No brands mapped yet." description="Add a brand before creating supplier returns." />
      ) : inventory.loading || suppliers.loading ? (
        <LoadingState label="Loading return setup..." />
      ) : suppliers.error ? (
        <ErrorState message={suppliers.error.message} onRetry={suppliers.refresh} />
      ) : (
        <SupplierReturnFormPanel
          brandId={brandId}
          suppliers={suppliers.items}
          inventoryItems={inventory.items}
          inventoryLoading={inventory.loading}
          submitLabel="Create return"
          savingLabel="Creating..."
          onRetryInventory={() => void inventory.refresh()}
          onCancel={() => navigate(`/partners/supply/supplier-returns?brand=${encodeURIComponent(brandId)}`)}
          onSubmit={async (input) => {
            const created = await returns.create(input);
            push({
              title: "Return created",
              description: `${created.returnNumber} has reserved inventory for supplier pickup.`,
              tone: "success",
            });
            navigate(`/partners/supply/supplier-returns/${encodeURIComponent(created.id)}`);
          }}
        />
      )}
    </PartnersPageShell>
  );
}
