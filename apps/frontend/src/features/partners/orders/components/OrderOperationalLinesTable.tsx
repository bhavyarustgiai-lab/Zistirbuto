import { Fragment, useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { PartnerOrderStatus } from "@shared/types/domain";
import { Button } from "@components/ui/button";
import { Separator } from "@components/ui/separator";
import { StatusBadge } from "@shared/ui/molecules/status-badge";
import { EmptyState } from "@shared/ui/molecules/empty-state";
import { cn } from "@shared/lib/cn";
import type { PartnerOrder } from "../types";

type OrderLine = PartnerOrder["items"][number];

type OrderOperationalLinesTableProps = {
  order: PartnerOrder;
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatNumber(value: number) {
  return value.toLocaleString("en-IN");
}

function isPackedStage(status: PartnerOrderStatus) {
  return ["PACKED", "DISPATCHED", "DELIVERED", "PARTIALLY_DELIVERED", "RETURNED", "PARTIALLY_RETURNED"].includes(status);
}

function getPackedQuantity(line: OrderLine, status: PartnerOrderStatus) {
  if (line.packedQuantity !== undefined) {
    return line.packedQuantity;
  }
  return isPackedStage(status) ? line.quantity : 0;
}

function getLineStatus(
  status: PartnerOrderStatus,
  requestedQuantity: number,
  allocatedQuantity: number,
  backorderQuantity: number,
  dispatchedQuantity: number,
  deliveredQuantity: number,
  returnedQuantity: number,
) {
  if (backorderQuantity > 0 && allocatedQuantity === 0) {
    return { label: "Backorder", tone: "danger" as const };
  }
  if (backorderQuantity > 0) {
    return { label: "Partial", tone: "warning" as const };
  }
  if (dispatchedQuantity > 0) {
    const openAfterReturn = Math.max(dispatchedQuantity - returnedQuantity, 0);
    if (returnedQuantity >= dispatchedQuantity) {
      return { label: "Returned", tone: "danger" as const };
    }
    if (returnedQuantity > 0 && deliveredQuantity >= openAfterReturn) {
      return { label: "Delivered / returned", tone: "warning" as const };
    }
    if (returnedQuantity > 0) {
      return { label: "Dispatched / returned", tone: "warning" as const };
    }
    if (deliveredQuantity >= dispatchedQuantity) {
      return { label: "Delivered", tone: "success" as const };
    }
    if (deliveredQuantity > 0) {
      return { label: "Partial delivery", tone: "warning" as const };
    }
    return { label: "Dispatched", tone: "neutral" as const };
  }
  if (status === "DELIVERED") {
    return { label: "Delivered", tone: "success" as const };
  }
  if (status === "PARTIALLY_DELIVERED") {
    return { label: "Partial delivery", tone: "warning" as const };
  }
  if (status === "RETURNED") {
    return { label: "Returned", tone: "danger" as const };
  }
  if (status === "DISPATCHED" || status === "PARTIALLY_RETURNED") {
    return { label: "Dispatched", tone: "neutral" as const };
  }
  if (status === "PACKED") {
    return { label: "Packed", tone: "neutral" as const };
  }
  if (allocatedQuantity >= requestedQuantity) {
    return { label: "Ready", tone: "success" as const };
  }
  return { label: "Open", tone: "neutral" as const };
}

export function OrderOperationalLinesTable({ order }: OrderOperationalLinesTableProps) {
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [expandedLineIds, setExpandedLineIds] = useState<Set<string>>(new Set());
  const requestedLines = order.requestedItems?.length ? order.requestedItems : order.items;
  const billableLines = order.billableLines ?? [];

  const allocationsByCatalog = useMemo(() => {
    const grouped = new Map<string, OrderLine[]>();
    for (const line of order.items) {
      const catalogItemId = line.catalogItemId || line.itemId;
      grouped.set(catalogItemId, [...(grouped.get(catalogItemId) ?? []), line]);
    }
    return grouped;
  }, [order.items]);

  const backorderByCatalog = useMemo(() => {
    const grouped = new Map<string, number>();
    for (const line of order.unfulfilledItems ?? []) {
      if (line.status === "CANCELLED" || line.openQuantity <= 0) continue;
      grouped.set(line.catalogItemId, (grouped.get(line.catalogItemId) ?? 0) + line.openQuantity);
    }
    return grouped;
  }, [order.unfulfilledItems]);

  const summary = useMemo(() => {
    let requiredQuantity = 0;
    let allocatedQuantity = 0;
    let backorderQuantity = 0;

    for (const line of requestedLines) {
      const catalogItemId = line.catalogItemId || line.itemId;
      const allocations = allocationsByCatalog.get(catalogItemId) ?? [];
      const allocated = allocations.reduce((sum, allocation) => sum + allocation.quantity, 0);
      requiredQuantity += line.quantity;
      allocatedQuantity += allocated;
      backorderQuantity += Math.max(backorderByCatalog.get(catalogItemId) ?? 0, line.quantity - allocated, 0);
    }

    return {
      itemCount: requestedLines.length,
      requiredQuantity,
      allocatedQuantity,
      backorderQuantity,
    };
  }, [allocationsByCatalog, backorderByCatalog, requestedLines]);

  const financialSummary = useMemo(() => {
    const subtotal = billableLines.reduce((sum, line) => sum + line.mrp * line.quantity, 0);
    const payable = billableLines.reduce((sum, line) => sum + line.lineTotal, 0);
    return {
      subtotal,
      discount: Math.max(subtotal - payable, 0),
      payable,
    };
  }, [billableLines]);

  function toggleExpanded(lineId: string) {
    setExpandedLineIds((current) => {
      const next = new Set(current);
      if (next.has(lineId)) {
        next.delete(lineId);
      } else {
        next.add(lineId);
      }
      return next;
    });
  }

  if (requestedLines.length === 0) {
    return <EmptyState>No order lines were found for this order.</EmptyState>;
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
        <span>
          Items: <span className="font-semibold tabular-nums text-slate-900">{formatNumber(summary.itemCount)}</span>
        </span>
        <span>
          Required: <span className="font-semibold tabular-nums text-slate-900">{formatNumber(summary.requiredQuantity)}</span>
        </span>
        <span>
          Allocated: <span className="font-semibold tabular-nums text-slate-900">{formatNumber(summary.allocatedQuantity)}</span>
        </span>
        <span>
          Backorder:{" "}
          <span className={summary.backorderQuantity > 0 ? "font-semibold tabular-nums text-rose-600" : "font-semibold tabular-nums text-slate-900"}>
            {formatNumber(summary.backorderQuantity)}
          </span>
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr className="border-b border-slate-200">
              <th className="px-4 py-3">Item</th>
              <th className="px-3 py-3 text-right">Qty</th>
              <th className="px-3 py-3 text-right">Allocated</th>
              <th className="px-3 py-3 text-right">Sell %</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {requestedLines.map((line) => {
              const catalogItemId = line.catalogItemId || line.itemId;
              const allocations = allocationsByCatalog.get(catalogItemId) ?? [];
              const allocatedQuantity = allocations.reduce((sum, allocation) => sum + allocation.quantity, 0);
              const packedQuantity = allocations.reduce((sum, allocation) => sum + getPackedQuantity(allocation, order.status), 0);
              const dispatchedQuantity = allocations.reduce((sum, allocation) => sum + (allocation.dispatchedQuantity ?? 0), 0);
              const deliveredQuantity = allocations.reduce((sum, allocation) => sum + (allocation.deliveredQuantity ?? 0), 0);
              const returnedQuantity = allocations.reduce((sum, allocation) => sum + (allocation.returnedQuantity ?? 0), 0);
              const backorderQuantity = Math.max(backorderByCatalog.get(catalogItemId) ?? 0, line.quantity - allocatedQuantity, 0);
              const lineStatus = getLineStatus(
                order.status,
                line.quantity,
                allocatedQuantity,
                backorderQuantity,
                dispatchedQuantity,
                deliveredQuantity,
                returnedQuantity,
              );
              const expanded = expandedLineIds.has(line.id);

              return (
                <Fragment key={line.id}>
                  <tr className={cn("border-b border-slate-100 bg-white text-slate-900 transition-colors hover:bg-slate-50/60", expanded && "bg-slate-50/50")}>
                    <td className="px-4 py-4">
                      <div className="font-medium text-slate-950">{line.itemName}</div>
                      <div className="mt-1 text-xs text-slate-500">SKU: {line.itemCode}</div>
                    </td>
                    <td className="px-3 py-4 text-right font-medium tabular-nums text-slate-900">
                      {formatNumber(line.quantity)}
                    </td>
                    <td className="px-3 py-4 text-right tabular-nums text-slate-900">
                      <div>{formatNumber(allocatedQuantity)} / {formatNumber(line.quantity)}</div>
                      {backorderQuantity > 0 ? (
                        <div className="mt-1 text-xs font-medium tabular-nums text-rose-600">
                          Backorder: {formatNumber(backorderQuantity)}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-3 py-4 text-right tabular-nums text-slate-900">{line.discountPercentage}%</td>
                    <td className="px-3 py-4">
                      <StatusBadge tone={lineStatus.tone}>{lineStatus.label}</StatusBadge>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        aria-label={`${expanded ? "Hide" : "Show"} inventory breakdown for ${line.itemName}`}
                        className="h-9 rounded-xl px-2.5 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                        onClick={() => toggleExpanded(line.id)}
                      >
                        {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </Button>
                    </td>
                  </tr>

                  {expanded ? (
                    <tr className="border-b border-slate-100 bg-slate-50/40">
                      <td colSpan={6} className="px-4 py-3">
                        <div className="ml-2 border-l border-slate-200 pl-4">
                          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                              Inventory breakdown
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                              <span>Packed: {formatNumber(packedQuantity)}</span>
                              <span>Dispatched: {formatNumber(dispatchedQuantity)}</span>
                              {deliveredQuantity > 0 ? <span>Delivered: {formatNumber(deliveredQuantity)}</span> : null}
                              {returnedQuantity > 0 ? <span>Returned: {formatNumber(returnedQuantity)}</span> : null}
                            </div>
                          </div>

                          {allocations.length > 0 ? (
                            <table className="w-full text-sm">
                              <thead className="text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                                <tr>
                                  <th className="py-2 pr-3">Batch</th>
                                  <th className="px-3 py-2 text-right">MRP</th>
                                  <th className="px-3 py-2 text-right">Buy %</th>
                                  <th className="px-3 py-2 text-right">Allocated</th>
                                  <th className="px-3 py-2 text-right">Packed</th>
                                  <th className="px-3 py-2 text-right">Dispatched</th>
                                  <th className="px-3 py-2 text-right">Delivered</th>
                                  <th className="py-2 pl-3 text-right">Returned</th>
                                </tr>
                              </thead>
                              <tbody>
                                {allocations.map((allocation) => (
                                  <tr key={`${line.id}:${allocation.id}`} className="border-t border-slate-100 text-slate-600">
                                    <td className="py-2.5 pr-3">
                                      <div className="font-medium text-slate-700">{allocation.itemCode}</div>
                                      {allocation.shortReason ? (
                                        <div className="text-xs text-slate-400">Short: {allocation.shortReason}</div>
                                      ) : null}
                                    </td>
                                    <td className="px-3 py-2.5 text-right tabular-nums">{formatMoney(allocation.mrp)}</td>
                                    <td className="px-3 py-2.5 text-right tabular-nums">{allocation.discountPercentage}%</td>
                                    <td className="px-3 py-2.5 text-right tabular-nums">{formatNumber(allocation.quantity)}</td>
                                    <td className="px-3 py-2.5 text-right tabular-nums">{formatNumber(getPackedQuantity(allocation, order.status))}</td>
                                    <td className="px-3 py-2.5 text-right tabular-nums">{formatNumber(allocation.dispatchedQuantity ?? 0)}</td>
                                    <td className="px-3 py-2.5 text-right tabular-nums">{formatNumber(allocation.deliveredQuantity ?? 0)}</td>
                                    <td className="py-2.5 pl-3 text-right tabular-nums">{formatNumber(allocation.returnedQuantity ?? 0)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <div className="py-2 text-sm text-slate-500">
                              No inventory has been allocated for this item.
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <p className="text-sm text-slate-600">Unallocated quantities are recorded as backorders.</p>
        <div className="grid gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
          <div className="flex items-center justify-between gap-4 text-sm text-slate-600">
            <span>Subtotal</span>
            <span className="font-medium tabular-nums text-slate-900">{formatMoney(financialSummary.subtotal)}</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-sm text-slate-600">
            <span>Margin Discount</span>
            <span className="font-medium tabular-nums text-slate-900">-{formatMoney(financialSummary.discount)}</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-sm text-slate-600">
            <span>GST</span>
            <span className="text-slate-500">Not calculated</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4 text-base">
            <span className="font-semibold text-slate-900">Total Payable</span>
            <span className="font-semibold tabular-nums text-slate-950">{formatMoney(financialSummary.payable)}</span>
          </div>
          {billableLines.length > 0 ? (
            <Button variant="outline" className="h-9 text-sm" onClick={() => setShowInvoicePreview((current) => !current)}>
              {showInvoicePreview ? "Hide Invoice Preview" : "View Invoice Preview"}
            </Button>
          ) : null}
        </div>
      </div>

      {showInvoicePreview ? (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
              <tr className="border-b border-slate-200">
                <th className="px-3 py-3">Item</th>
                <th className="px-3 py-3 text-right">MRP</th>
                <th className="px-3 py-3 text-right">Sell %</th>
                <th className="px-3 py-3 text-right">Rate</th>
                <th className="px-3 py-3 text-right">Qty</th>
                <th className="px-3 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {billableLines.map((line) => (
                <tr key={line.id} className="border-b border-slate-100 text-slate-700">
                  <td className="px-3 py-3">
                    <div className="font-medium text-slate-900">{line.itemName}</div>
                    <div className="text-xs text-slate-500">{line.itemCode}</div>
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">{formatMoney(line.mrp)}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{line.sellerMarginPercentage}%</td>
                  <td className="px-3 py-3 text-right tabular-nums">{formatMoney(line.rate)}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{formatNumber(line.quantity)}</td>
                  <td className="px-3 py-3 text-right tabular-nums font-medium text-slate-900">{formatMoney(line.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
