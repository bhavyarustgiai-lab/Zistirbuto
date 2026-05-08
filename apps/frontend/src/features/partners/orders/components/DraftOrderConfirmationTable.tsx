import { useEffect, useMemo, useState } from "react";
import type { PartnerStockRow } from "@shared/types/domain";
import type { PartnerOrder } from "../types";
import { ErrorState } from "@shared/ui/molecules/error-state";
import { LoadingState } from "@shared/ui/molecules/loading-state";
import { OrderSimpleAllocationTable, type OrderSimpleAllocationLineView } from "./OrderSimpleAllocationTable";

type DraftOrderConfirmationTableProps = {
  order: PartnerOrder;
  stockRows: PartnerStockRow[];
  stockLoading?: boolean;
  stockError?: string;
  busy?: boolean;
  onRetryStock?: () => void;
  onCancel?: () => void;
  onConfirm: (input: {
    items: Array<{ itemId: string; quantity: number }>;
    requestedItems: Array<{ itemId: string; sellerMarginPercentage: number }>;
  }) => Promise<void>;
};

function getAllocationKey(catalogItemId: string, inventoryItemId: string) {
  return `${catalogItemId}:${inventoryItemId}`;
}

function buildAutoAllocations(lines: OrderSimpleAllocationLineView[]) {
  const nextAllocations: Record<string, string> = {};
  for (const view of lines) {
    let remainingQuantity = view.line.quantity;
    for (const row of view.stockRows) {
      const quantity = Math.min(remainingQuantity, row.currentStockQty);
      nextAllocations[getAllocationKey(view.line.itemId, row.itemId)] = String(quantity);
      remainingQuantity -= quantity;
    }
  }
  return nextAllocations;
}

function buildInventoryAllocations(lines: OrderSimpleAllocationLineView[], allocatedQuantities: Record<string, string>) {
  const allocations: Array<{ itemId: string; quantity: number }> = [];
  for (const line of lines) {
    for (const row of line.stockRows) {
      const quantity = Number.parseInt(allocatedQuantities[getAllocationKey(line.line.itemId, row.itemId)] || "0", 10) || 0;
      if (quantity > 0) {
        allocations.push({ itemId: row.itemId, quantity });
      }
    }
  }
  return allocations;
}

function getAllocatedQuantity(view: OrderSimpleAllocationLineView, allocatedQuantities: Record<string, string>) {
  return view.stockRows.reduce((sum, row) => {
    const quantity = Number.parseInt(allocatedQuantities[getAllocationKey(view.line.itemId, row.itemId)] || "0", 10) || 0;
    return sum + quantity;
  }, 0);
}

export function DraftOrderConfirmationTable({
  order,
  stockRows,
  stockLoading = false,
  stockError = "",
  busy = false,
  onRetryStock,
  onCancel,
  onConfirm,
}: DraftOrderConfirmationTableProps) {
  const requestedLines = order.requestedItems?.length ? order.requestedItems : order.items;
  const [sellMargins, setSellMargins] = useState<Record<string, string>>({});
  const [allocatedQuantities, setAllocatedQuantities] = useState<Record<string, string>>({});
  const [sellMarginErrors, setSellMarginErrors] = useState<Record<string, string>>({});
  const [allocationErrors, setAllocationErrors] = useState<Record<string, string>>({});

  const lineViews = useMemo<OrderSimpleAllocationLineView[]>(
    () =>
      requestedLines.map((line) => {
        const catalogItemId = line.catalogItemId || line.itemId;
        const matchingStock = stockRows
          .filter((row) => row.catalogItemId === catalogItemId)
          .sort((left, right) => left.mrp - right.mrp || left.discountPercentage - right.discountPercentage || left.itemCode.localeCompare(right.itemCode));
        const availableQuantity = matchingStock.reduce((sum, row) => sum + row.currentStockQty, 0);
        return {
          line: { ...line, itemId: catalogItemId },
          stockRows: matchingStock,
          availableQuantity,
        };
      }),
    [requestedLines, stockRows],
  );

  useEffect(() => {
    const nextMargins: Record<string, string> = {};
    for (const view of lineViews) {
      nextMargins[view.line.itemId] = String(view.line.discountPercentage ?? 0);
    }
    setSellMargins(nextMargins);
    setAllocatedQuantities(buildAutoAllocations(lineViews));
    setSellMarginErrors({});
    setAllocationErrors({});
  }, [order.id, lineViews]);

  function getSellMarginError(view: OrderSimpleAllocationLineView) {
    const rawValue = sellMargins[view.line.itemId] ?? "";
    const sellMargin = Number.parseFloat(rawValue);
    if (!rawValue.trim() || !Number.isFinite(sellMargin) || sellMargin < 0 || sellMargin > 100) {
      return "Use 0-100.";
    }
    return "";
  }

  function getAllocationError(view: OrderSimpleAllocationLineView, row: PartnerStockRow) {
    const rawValue = allocatedQuantities[getAllocationKey(view.line.itemId, row.itemId)] ?? "";
    const allocated = Number.parseInt(rawValue || "0", 10);
    if (!rawValue.trim() || !Number.isFinite(allocated) || allocated < 0) {
      return "Enter a valid quantity.";
    }
    if (allocated > row.currentStockQty) {
      return "Exceeds available.";
    }
    if (getAllocatedQuantity(view, allocatedQuantities) > view.line.quantity) {
      return "Exceeds requested.";
    }
    return "";
  }

  function validate() {
    const nextSellMarginErrors: Record<string, string> = {};
    const nextAllocationErrors: Record<string, string> = {};

    for (const view of lineViews) {
      const sellMarginError = getSellMarginError(view);
      if (sellMarginError) {
        nextSellMarginErrors[view.line.itemId] = sellMarginError;
      }
      for (const row of view.stockRows) {
        const allocationError = getAllocationError(view, row);
        if (allocationError) {
          nextAllocationErrors[getAllocationKey(view.line.itemId, row.itemId)] = allocationError;
        }
      }
    }

    setSellMarginErrors(nextSellMarginErrors);
    setAllocationErrors(nextAllocationErrors);
    return Object.keys(nextSellMarginErrors).length === 0 && Object.keys(nextAllocationErrors).length === 0;
  }

  const hasInvalidFields = useMemo(
    () => lineViews.some((view) => Boolean(getSellMarginError(view) || view.stockRows.some((row) => getAllocationError(view, row)))),
    [allocatedQuantities, lineViews, sellMargins],
  );

  const totals = useMemo(() => {
    let mrpCost = 0;
    let marginDiscount = 0;

    for (const view of lineViews) {
      const sellMargin = Number.parseFloat(sellMargins[view.line.itemId] ?? "0");
      const validSellMargin = Number.isFinite(sellMargin) ? sellMargin : 0;
      for (const row of view.stockRows) {
        const quantity = Number.parseInt(allocatedQuantities[getAllocationKey(view.line.itemId, row.itemId)] || "0", 10) || 0;
        const lineMrpCost = quantity * row.mrp;
        mrpCost += lineMrpCost;
        marginDiscount += lineMrpCost * (validSellMargin / 100);
      }
    }

    return {
      mrpCost,
      marginDiscount,
      payable: mrpCost - marginDiscount,
    };
  }, [allocatedQuantities, lineViews, sellMargins]);

  const summary = useMemo(() => {
    const requiredQuantity = lineViews.reduce((sum, view) => sum + view.line.quantity, 0);
    const allocatedQuantity = lineViews.reduce((sum, view) => sum + getAllocatedQuantity(view, allocatedQuantities), 0);
    return {
      itemCount: lineViews.length,
      requiredQuantity,
      allocatedQuantity,
      backorderQuantity: Math.max(requiredQuantity - allocatedQuantity, 0),
    };
  }, [allocatedQuantities, lineViews]);

  function autoAllocateAll() {
    setAllocatedQuantities(buildAutoAllocations(lineViews));
    setAllocationErrors({});
  }

  async function submit() {
    if (!validate()) return;
    await onConfirm({
      items: buildInventoryAllocations(lineViews, allocatedQuantities),
      requestedItems: lineViews.map((view) => ({
        itemId: view.line.itemId,
        sellerMarginPercentage: Number.parseFloat(sellMargins[view.line.itemId] ?? "0"),
      })),
    });
  }

  if (stockLoading) {
    return <LoadingState label="Loading available stock..." />;
  }

  if (stockError) {
    return <ErrorState title="Stock unavailable" message={stockError} onRetry={onRetryStock} />;
  }

  return (
    <OrderSimpleAllocationTable
      lineViews={lineViews}
      sellMargins={sellMargins}
      allocatedQuantities={allocatedQuantities}
      sellMarginErrors={sellMarginErrors}
      allocationErrors={allocationErrors}
      totals={totals}
      summary={summary}
      busy={busy}
      hasInvalidFields={hasInvalidFields}
      getAllocationKey={getAllocationKey}
      getAllocatedQuantity={(view) => getAllocatedQuantity(view, allocatedQuantities)}
      getSellMarginError={getSellMarginError}
      getAllocationError={getAllocationError}
      onSellMarginChange={(catalogItemId, value) => setSellMargins((current) => ({ ...current, [catalogItemId]: value }))}
      onAllocationChange={(allocationKey, value) => setAllocatedQuantities((current) => ({ ...current, [allocationKey]: value }))}
      onClearSellMarginError={(catalogItemId) => {
        setSellMarginErrors((current) => {
          const next = { ...current };
          delete next[catalogItemId];
          return next;
        });
      }}
      onClearAllocationError={(allocationKey) => {
        setAllocationErrors((current) => {
          const next = { ...current };
          delete next[allocationKey];
          return next;
        });
      }}
      onAutoAllocateAll={autoAllocateAll}
      onCancel={onCancel}
      onConfirm={() => void submit()}
    />
  );
}
