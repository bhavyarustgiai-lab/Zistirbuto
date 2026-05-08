import type { PartnerOrderStatus } from "@shared/types/domain";
import { Button } from "@components/ui/button";

type Props = {
  status: PartnerOrderStatus;
  busy?: boolean;
  canEdit?: boolean;
  onConfirm: () => Promise<void>;
  onPack: () => Promise<void>;
  onDispatch: () => Promise<void>;
  onDeliver?: () => Promise<void>;
  onEdit: () => void;
  onCancel: () => void;
};

export function OrderStatusActions({ status, busy, canEdit = false, onConfirm, onPack, onDispatch, onDeliver, onEdit, onCancel }: Props) {
  if (status === "CANCELLED" || status === "DELIVERED" || status === "RETURNED" || status === "PARTIALLY_RETURNED") {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === "DRAFT" || status === "PLACED" ? (
        <>
          {canEdit ? (
            <Button variant="outline" className="h-10 px-3 text-sm" disabled={busy} onClick={onEdit}>
              Edit Order
            </Button>
          ) : null}
          <Button className="h-10 px-3 text-sm" disabled={busy} onClick={() => void onConfirm()}>
            Confirm Order
          </Button>
          <Button variant="outline" className="h-10 px-3 text-sm" disabled={busy} onClick={onCancel}>
            Cancel Order
          </Button>
        </>
      ) : null}
      {status === "CONFIRMED" ? (
        <>
          <Button variant="outline" className="h-10 px-3 text-sm" disabled={busy} onClick={onCancel}>
            Cancel Order
          </Button>
          <Button className="h-10 px-3 text-sm" disabled={busy} onClick={() => void onPack()}>
            Mark Packed
          </Button>
        </>
      ) : null}
      {status === "PACKED" ? (
        <>
          <Button variant="outline" className="h-10 px-3 text-sm" disabled={busy} onClick={onCancel}>
            Cancel Order
          </Button>
          <Button className="h-10 px-3 text-sm" disabled={busy} onClick={() => void onDispatch()}>
            Mark Dispatched
          </Button>
        </>
      ) : null}
      {status === "DISPATCHED" || status === "PARTIALLY_DELIVERED" ? (
        <>
          <Button variant="outline" className="h-10 px-3 text-sm" disabled={busy} onClick={onCancel}>
            Cancel / Return
          </Button>
          {onDeliver ? (
            <Button className="h-10 px-3 text-sm" disabled={busy} onClick={() => void onDeliver()}>
              Mark Delivered
            </Button>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
