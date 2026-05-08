import { useMemo, useState } from "react";
import { MoreHorizontal, RotateCcw, Truck } from "lucide-react";
import type { PartnerOrderStatus } from "@shared/types/domain";
import { AppButton } from "@shared/ui/atoms/app-button";
import { ConfirmDialog } from "@shared/ui/molecules/confirm-dialog";
import { EmptyState } from "@shared/ui/molecules/empty-state";
import { StatusDialog } from "@shared/ui/molecules/status-dialog";
import { DataTable } from "@shared/ui/organisms/data-table";
import { DropdownMenu } from "@components/ui/dropdown-menu";
import { OrderReturnDialog } from "./OrderReturnDialog";
import type {
  CreatePartnerOrderReturnInput,
  PartnerOrder,
  PartnerOrderQueueStage,
} from "../types";
import {
  canCancelOrder,
  canDispatchOrder,
  canPackOrder,
  canReturnOrder,
  getOrderStageMeta,
  getPrimaryActionLabel,
  getQueueStage,
  orderQueueStages,
  parseOrderTimestamp,
} from "../utils";

type OrderListProps = {
  orders: PartnerOrder[];
  stageFilter: PartnerOrderQueueStage;
  search: string;
  selectedBrandIds: string[];
  allBrandIds: string[];
  itemBrandById: Map<string, string>;
  brandNamesById: Map<string, string>;
  outletAddressById: Map<string, string>;
  onOpenOrder: (orderId: string) => void;
  onStatusChange: (
    orderId: string,
    status: PartnerOrderStatus,
  ) => Promise<void>;
  onCreateReturn: (
    orderId: string,
    input: CreatePartnerOrderReturnInput,
  ) => Promise<void>;
};

function nextPrimaryStatus(order: PartnerOrder): PartnerOrderStatus | null {
  if (canPackOrder(order)) return "PACKED";
  if (canDispatchOrder(order)) return "DISPATCHED";
  if (getQueueStage(order) === "DISPATCHED") return "DELIVERED";
  return null;
}

function getEmptyCopy(stage: PartnerOrderQueueStage) {
  switch (stage) {
    case "DRAFT":
      return "No draft orders yet.";
    case "CONFIRMED":
      return "No confirmed orders waiting to be packed.";
    case "PACKED":
      return "No packed orders waiting for dispatch.";
    case "DISPATCHED":
      return "No dispatched orders waiting for delivery.";
  }
}

function formatOrderDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getOrderBrandNames(
  order: PartnerOrder,
  itemBrandById: Map<string, string>,
  brandNamesById: Map<string, string>,
) {
  const sourceLines = order.requestedItems?.length
    ? order.requestedItems
    : order.items;
  const names = new Set<string>();
  for (const item of sourceLines) {
    const brandId = itemBrandById.get(item.catalogItemId || item.itemId);
    if (!brandId) continue;
    names.add(brandNamesById.get(brandId) ?? brandId);
  }
  return [...names];
}

function formatBrandNames(names: string[]) {
  if (names.length === 0) return "-";
  if (names.length <= 2) return names.join(", ");
  return `${names.slice(0, 2).join(", ")} +${names.length - 2}`;
}

export function OrderList({
  orders,
  stageFilter,
  search,
  selectedBrandIds,
  allBrandIds,
  itemBrandById,
  brandNamesById,
  outletAddressById,
  onOpenOrder,
  onStatusChange,
  onCreateReturn,
}: OrderListProps) {
  const [pendingOrderId, setPendingOrderId] = useState("");
  const [cancelOrder, setCancelOrder] = useState<PartnerOrder | null>(null);
  const [returnOrder, setReturnOrder] = useState<PartnerOrder | null>(null);
  const [statusDialog, setStatusDialog] = useState<{
    tone: "error";
    title: string;
    description?: string;
  } | null>(null);

  const effectiveBrandIds =
    selectedBrandIds.length > 0 ? selectedBrandIds : allBrandIds;
  const activeOrders = useMemo(() => {
    const deduped = new Map<string, PartnerOrder>();
    for (const order of orders) {
      if (getQueueStage(order) == null) continue;
      const existing = deduped.get(order.id);
      if (
        !existing ||
        parseOrderTimestamp(order).getTime() >
          parseOrderTimestamp(existing).getTime()
      ) {
        deduped.set(order.id, order);
      }
    }
    return [...deduped.values()].sort(
      (a, b) =>
        parseOrderTimestamp(b).getTime() - parseOrderTimestamp(a).getTime(),
    );
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    return activeOrders.filter((order) => {
      const stage = getQueueStage(order);
      if (!stage || stage !== stageFilter) return false;
      if (effectiveBrandIds.length > 0) {
        const sourceLines = order.requestedItems?.length
          ? order.requestedItems
          : order.items;
        const orderBrandIds = new Set(
          sourceLines
            .map((item) => itemBrandById.get(item.catalogItemId || item.itemId))
            .filter((brandId): brandId is string => Boolean(brandId)),
        );
        if (
          orderBrandIds.size > 0 &&
          !effectiveBrandIds.some((brandId) => orderBrandIds.has(brandId))
        ) {
          return false;
        }
      }
      if (!query) return true;
      const outletAddress = outletAddressById.get(order.clientOutletId) ?? "";
      return (
        order.orderNumber.toLowerCase().includes(query) ||
        order.clientBusinessName.toLowerCase().includes(query) ||
        order.clientOutletName.toLowerCase().includes(query) ||
        outletAddress.toLowerCase().includes(query)
      );
    });
  }, [
    activeOrders,
    effectiveBrandIds,
    itemBrandById,
    outletAddressById,
    search,
    stageFilter,
  ]);

  const groupedOrders = useMemo(
    () =>
      orderQueueStages
        .map((stage) => ({
          stage,
          items: filteredOrders.filter(
            (order) => getQueueStage(order) === stage,
          ),
        }))
        .filter((section) => section.stage === stageFilter),
    [filteredOrders, stageFilter],
  );

  async function runStatusChange(
    order: PartnerOrder,
    status: PartnerOrderStatus,
  ) {
    setPendingOrderId(order.id);
    try {
      await onStatusChange(order.id, status);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update order";
      setStatusDialog({
        tone: "error",
        title: "Order action failed",
        description: message,
      });
      throw err;
    } finally {
      setPendingOrderId("");
    }
  }

  async function runCreateReturn(
    order: PartnerOrder,
    input: CreatePartnerOrderReturnInput,
  ) {
    setPendingOrderId(order.id);
    try {
      await onCreateReturn(order.id, input);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create return";
      setStatusDialog({
        tone: "error",
        title: "Return creation failed",
        description: message,
      });
      throw err;
    } finally {
      setPendingOrderId("");
    }
  }

  return (
    <>
      <DataTable>
        {filteredOrders.length === 0 ? (
          <div className="p-8">
            <EmptyState>
              {search || selectedBrandIds.length > 0
                ? "No active orders match the current filters."
                : getEmptyCopy(stageFilter)}
            </EmptyState>
          </div>
        ) : (
          <div className="grid gap-5 p-3 sm:p-4">
            {groupedOrders.map((section) => {
              const meta = getOrderStageMeta(section.stage);
              return (
                <section key={section.stage} className="grid gap-2.5">
                  <div className="flex items-center justify-between gap-3 px-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-semibold text-slate-900">
                        {meta.label}
                      </h2>
                      <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-slate-100 px-2 text-xs font-medium text-slate-600">
                        {section.items.length}
                      </span>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                    <table className="w-full min-w-[900px] text-sm">
                      <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                        <tr className="border-b border-slate-200">
                          <th className="px-3 py-3">Order ID</th>
                          <th className="px-3 py-3">Date</th>
                          <th className="px-3 py-3">Client</th>
                          <th className="px-3 py-3">Salon</th>
                          <th className="px-3 py-3">Brand</th>
                          <th className="px-3 py-3 text-right">Next Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {section.items.map((order) => {
                          const primaryStatus = nextPrimaryStatus(order);
                          const confirmedWithoutAllocation =
                            section.stage === "CONFIRMED" &&
                            !canPackOrder(order);
                          const brandNames = getOrderBrandNames(
                            order,
                            itemBrandById,
                            brandNamesById,
                          );
                          const outletAddress =
                            outletAddressById.get(order.clientOutletId) ?? "";
                          const pending = pendingOrderId === order.id;
                          return (
                            <tr
                              key={order.id}
                              className="cursor-pointer border-b border-slate-100 text-slate-700 transition hover:bg-slate-50"
                              tabIndex={0}
                              onClick={() => onOpenOrder(order.id)}
                              onKeyDown={(event) => {
                                if (
                                  event.key === "Enter" ||
                                  event.key === " "
                                ) {
                                  event.preventDefault();
                                  onOpenOrder(order.id);
                                }
                              }}
                            >
                              <td className="px-3 py-3 font-semibold text-slate-900">
                                {order.orderNumber}
                              </td>
                              <td className="px-3 py-3 text-slate-600">
                                {formatOrderDate(order.orderDate)}
                              </td>
                              <td className="px-3 py-3 font-medium text-slate-900">
                                {order.clientBusinessName}
                              </td>
                              <td className="px-3 py-3">
                                <div className="font-medium text-slate-900">
                                  {order.clientOutletName}
                                </div>
                                {outletAddress ? (
                                  <div className="mt-1 max-w-[280px] truncate text-xs text-slate-500">
                                    {outletAddress}
                                  </div>
                                ) : null}
                              </td>
                              <td className="px-3 py-3 text-slate-700">
                                {formatBrandNames(brandNames)}
                              </td>
                              <td className="px-3 py-3">
                                <div
                                  className="flex items-center justify-end gap-2"
                                  onClick={(event) => event.stopPropagation()}
                                >
                                  {section.stage === "DRAFT" ? (
                                    <AppButton
                                      variant="outline"
                                      className="h-9 px-3 text-sm"
                                      disabled={pending}
                                      onClick={() => onOpenOrder(order.id)}
                                    >
                                      Review / Confirm
                                    </AppButton>
                                  ) : primaryStatus ? (
                                    <AppButton
                                      className="h-9 px-3 text-sm"
                                      disabled={pending}
                                      onClick={() =>
                                        void runStatusChange(
                                          order,
                                          primaryStatus,
                                        ).catch(() => undefined)
                                      }
                                    >
                                      {canDispatchOrder(order) ? (
                                        <Truck className="mr-1 h-4 w-4" />
                                      ) : null}
                                      {pending
                                        ? "Updating..."
                                        : getPrimaryActionLabel(order)}
                                    </AppButton>
                                  ) : confirmedWithoutAllocation ? (
                                    <AppButton
                                      variant="outline"
                                      className="h-9 px-3 text-sm text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                      disabled={pending}
                                      onClick={() => setCancelOrder(order)}
                                    >
                                      Cancel Order
                                    </AppButton>
                                  ) : null}

                                  {canReturnOrder(order) ? (
                                    <AppButton
                                      variant="outline"
                                      className="h-9 px-3 text-sm"
                                      disabled={pending}
                                      onClick={() => setReturnOrder(order)}
                                    >
                                      <RotateCcw className="mr-1 h-4 w-4" />
                                      Create Return
                                    </AppButton>
                                  ) : null}

                                  {canCancelOrder(order) &&
                                  !confirmedWithoutAllocation ? (
                                    <DropdownMenu
                                      trigger={
                                        <AppButton
                                          variant="ghost"
                                          className="h-9 w-9 p-0"
                                          disabled={pending}
                                          aria-label={`More actions for ${order.orderNumber}`}
                                        >
                                          <MoreHorizontal className="h-4 w-4" />
                                        </AppButton>
                                      }
                                      items={[
                                        {
                                          label: "Cancel order",
                                          destructive: true,
                                          disabled: pending,
                                          onClick: () => setCancelOrder(order),
                                        },
                                      ]}
                                    />
                                  ) : null}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </DataTable>
      <ConfirmDialog
        open={Boolean(cancelOrder)}
        title="Cancel order"
        description={
          cancelOrder ? "Are you sure you want to cancel this order?" : ""
        }
        confirmLabel="Cancel Order"
        destructive
        loading={Boolean(cancelOrder && pendingOrderId === cancelOrder.id)}
        onClose={() => setCancelOrder(null)}
        onConfirm={() => {
          if (!cancelOrder) return;
          void runStatusChange(cancelOrder, "CANCELLED")
            .then(() => setCancelOrder(null))
            .catch(() => undefined);
        }}
      />
      {returnOrder ? (
        <OrderReturnDialog
          open={Boolean(returnOrder)}
          order={returnOrder}
          loading={pendingOrderId === returnOrder.id}
          onClose={() => setReturnOrder(null)}
          onSubmit={async (input) => {
            await runCreateReturn(returnOrder, input);
            setReturnOrder(null);
          }}
        />
      ) : null}
      <StatusDialog
        open={Boolean(statusDialog)}
        tone={statusDialog?.tone ?? "success"}
        title={statusDialog?.title ?? ""}
        description={statusDialog?.description}
        onClose={() => setStatusDialog(null)}
      />
    </>
  );
}
