import { Fragment, useMemo, useState } from "react";
import type { PartnerOrder, PartnerStockRow } from "@shared/types/domain";
import { Button } from "@components/ui/button";
import { Separator } from "@components/ui/separator";
import { AppButton } from "@shared/ui/atoms/app-button";
import { OrderItemExpandedRow } from "./OrderItemExpandedRow";
import { OrderItemRow } from "./OrderItemRow";

export type OrderSimpleAllocationLineView = {
  line: PartnerOrder["items"][number];
  stockRows: PartnerStockRow[];
  availableQuantity: number;
};

type AllocationTotals = {
  mrpCost: number;
  marginDiscount: number;
  payable: number;
};

type AllocationSummary = {
  itemCount: number;
  requiredQuantity: number;
  allocatedQuantity: number;
  backorderQuantity: number;
};

type OrderSimpleAllocationTableProps = {
  lineViews: OrderSimpleAllocationLineView[];
  sellMargins: Record<string, string>;
  allocatedQuantities: Record<string, string>;
  sellMarginErrors: Record<string, string>;
  allocationErrors: Record<string, string>;
  totals: AllocationTotals;
  summary: AllocationSummary;
  busy?: boolean;
  hasInvalidFields?: boolean;
  getAllocationKey: (catalogItemId: string, inventoryItemId: string) => string;
  getAllocatedQuantity: (view: OrderSimpleAllocationLineView) => number;
  getSellMarginError: (view: OrderSimpleAllocationLineView) => string;
  getAllocationError: (view: OrderSimpleAllocationLineView, row: PartnerStockRow) => string;
  onSellMarginChange: (catalogItemId: string, value: string) => void;
  onAllocationChange: (allocationKey: string, value: string) => void;
  onClearSellMarginError: (catalogItemId: string) => void;
  onClearAllocationError: (allocationKey: string) => void;
  onAutoAllocateAll: () => void;
  onCancel?: () => void;
  onConfirm: () => void;
};

function formatNumber(value: number) {
  return value.toLocaleString("en-IN");
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

export function OrderSimpleAllocationTable({
  lineViews,
  sellMargins,
  allocatedQuantities,
  sellMarginErrors,
  allocationErrors,
  totals,
  summary,
  busy = false,
  hasInvalidFields = false,
  getAllocationKey,
  getAllocatedQuantity,
  getSellMarginError,
  getAllocationError,
  onSellMarginChange,
  onAllocationChange,
  onClearSellMarginError,
  onClearAllocationError,
  onAutoAllocateAll,
  onCancel,
  onConfirm,
}: OrderSimpleAllocationTableProps) {
  const [expandedLineIds, setExpandedLineIds] = useState<Set<string>>(new Set());

  const allocationErrorByLineId = useMemo(() => {
    const next = new Map<string, boolean>();
    for (const view of lineViews) {
      next.set(
        view.line.id,
        view.stockRows.some((row) => {
          const key = getAllocationKey(view.line.itemId, row.itemId);
          return Boolean(allocationErrors[key] || getAllocationError(view, row));
        }),
      );
    }
    return next;
  }, [allocationErrors, getAllocationError, getAllocationKey, lineViews]);

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

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
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
        <Button
          type="button"
          variant="outline"
          className="h-9 rounded-xl px-3 text-sm"
          disabled={busy}
          onClick={onAutoAllocateAll}
        >
          Recalculate Allocation
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr className="border-b border-slate-200">
              <th className="px-4 py-3">Item</th>
              <th className="px-3 py-3 text-right">Qty</th>
              <th className="px-3 py-3 text-right">Available</th>
              <th className="px-3 py-3 text-right">Sell %</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {lineViews.map((view) => {
              const catalogItemId = view.line.itemId;
              const expanded = expandedLineIds.has(view.line.id);
              const lineAllocationErrors = Object.fromEntries(
                view.stockRows.map((row) => {
                  const key = getAllocationKey(catalogItemId, row.itemId);
                  return [key, allocationErrors[key] || getAllocationError(view, row)];
                }),
              );

              return (
                <Fragment key={view.line.id}>
                  <OrderItemRow
                    line={view.line}
                    availableQuantity={view.availableQuantity}
                    allocatedQuantity={getAllocatedQuantity(view)}
                    sellMarginValue={sellMargins[catalogItemId] ?? ""}
                    sellMarginError={sellMarginErrors[catalogItemId] || getSellMarginError(view)}
                    hasBatchError={allocationErrorByLineId.get(view.line.id)}
                    expanded={expanded}
                    disabled={busy}
                    onToggleExpanded={() => toggleExpanded(view.line.id)}
                    onSellMarginChange={(value) => {
                      onSellMarginChange(catalogItemId, value);
                      onClearSellMarginError(catalogItemId);
                    }}
                  />
                  {expanded ? (
                    <OrderItemExpandedRow
                      line={view.line}
                      stockRows={view.stockRows}
                      allocationValues={allocatedQuantities}
                      allocationErrors={lineAllocationErrors}
                      disabled={busy}
                      getAllocationKey={getAllocationKey}
                      onAllocationChange={(key, value) => {
                        onAllocationChange(key, value);
                        onClearAllocationError(key);
                      }}
                    />
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 sm:ml-auto sm:w-[360px]">
        <div className="flex items-center justify-between gap-4 text-sm text-slate-600">
          <span>Subtotal</span>
          <span className="font-medium tabular-nums text-slate-900">{formatMoney(totals.mrpCost)}</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-sm text-slate-600">
          <span>Margin Discount</span>
          <span className="font-medium tabular-nums text-slate-900">-{formatMoney(totals.marginDiscount)}</span>
        </div>
        <Separator />
        <div className="flex items-center justify-between gap-4 text-base">
          <span className="font-semibold text-slate-900">Total Payable</span>
          <span className="font-semibold tabular-nums text-slate-950">{formatMoney(totals.payable)}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
        <p className="text-sm text-slate-500">Unallocated quantities will be recorded as backorders.</p>
        <div className="flex items-center gap-2">
          {onCancel ? (
            <Button type="button" variant="ghost" className="h-10 px-4 text-sm" disabled={busy} onClick={onCancel}>
              Cancel
            </Button>
          ) : null}
          <AppButton className="h-10 px-4 text-sm" disabled={busy || hasInvalidFields} onClick={onConfirm}>
            {busy ? "Confirming..." : "Confirm Order"}
          </AppButton>
        </div>
      </div>
    </div>
  );
}
