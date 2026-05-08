import type { PartnerCatalogItem, PartnerClientBusiness, PartnerOrder } from "@shared/types/domain";
import { OrderForm } from "@features/partners/orders/components/OrderForm";
import type { UpdatePartnerOrderInput } from "@features/partners/orders/types";

type Props = {
  open: boolean;
  order: PartnerOrder | null;
  businesses: PartnerClientBusiness[];
  catalogItems: PartnerCatalogItem[];
  brandNamesById: Map<number, string>;
  catalogLoading?: boolean;
  catalogError?: string;
  onRetryCatalog?: () => void;
  onClose: () => void;
  onSubmit: (input: UpdatePartnerOrderInput) => Promise<void>;
};

export function EditOrderDrawer({
  open,
  order,
  businesses,
  catalogItems,
  brandNamesById,
  catalogLoading,
  catalogError,
  onRetryCatalog,
  onClose,
  onSubmit,
}: Props) {
  return (
    <OrderForm
      open={open}
      mode="edit"
      order={order}
      businesses={businesses}
      catalogItems={catalogItems}
      brandNamesById={brandNamesById}
      catalogLoading={catalogLoading}
      catalogError={catalogError}
      onRetryCatalog={onRetryCatalog}
      onClose={onClose}
      onSubmit={(input) => onSubmit(input as UpdatePartnerOrderInput)}
    />
  );
}
