import { ChevronDown, ChevronRight } from "lucide-react";
import type { PartnerOrder } from "@shared/types/domain";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { AppInput } from "@shared/ui/atoms/app-input";
import { cn } from "@shared/lib/cn";

type AllocationStatus = "ready" | "partial" | "backorder";

type OrderItemRowProps = {
  line: PartnerOrder["items"][number];
  availableQuantity: number;
  allocatedQuantity: number;
  sellMarginValue: string;
  sellMarginError?: string;
  hasBatchError?: boolean;
  expanded?: boolean;
  disabled?: boolean;
  onToggleExpanded: () => void;
  onSellMarginChange: (value: string) => void;
};

function percentageOnly(value: string) {
  const cleaned = value.replace(/[^\d.]/g, "");
  const [whole, ...parts] = cleaned.split(".");
  return parts.length > 0 ? `${whole}.${parts.join("").slice(0, 2)}` : whole;
}

function formatNumber(value: number) {
  return value.toLocaleString("en-IN");
}

function getStatus(allocatedQuantity: number, requestedQuantity: number): AllocationStatus {
  if (allocatedQuantity === requestedQuantity) return "ready";
  if (allocatedQuantity > 0) return "partial";
  return "backorder";
}

function AllocationBadge({ status }: { status: AllocationStatus }) {
  if (status === "ready") {
    return (
      <Badge tone="active" className="gap-1 rounded-full px-2 text-xs">
        <span aria-hidden="true">✓</span>
        Ready
      </Badge>
    );
  }
  if (status === "partial") {
    return (
      <Badge tone="partial" className="gap-1 rounded-full px-2 text-xs">
        <span aria-hidden="true">!</span>
        Partial
      </Badge>
    );
  }
  return (
    <Badge tone="cancelled" className="gap-1 rounded-full px-2 text-xs">
      <span aria-hidden="true">×</span>
      Backorder
    </Badge>
  );
}

export function OrderItemRow({
  line,
  availableQuantity,
  allocatedQuantity,
  sellMarginValue,
  sellMarginError,
  hasBatchError = false,
  expanded = false,
  disabled = false,
  onToggleExpanded,
  onSellMarginChange,
}: OrderItemRowProps) {
  const backorderQuantity = Math.max(line.quantity - allocatedQuantity, 0);
  const status = getStatus(allocatedQuantity, line.quantity);

  return (
    <tr
      className={cn(
        "border-b border-slate-100 bg-white transition-colors hover:bg-slate-50/60",
        expanded && "bg-slate-50/50",
      )}
    >
      <td className="px-4 py-4">
        <div className="min-w-0">
          <div className="font-medium text-slate-950">{line.itemName}</div>
          <div className="mt-1 text-xs text-slate-500">SKU: {line.itemCode}</div>
        </div>
      </td>
      <td className="px-3 py-4 text-right font-medium tabular-nums text-slate-900">
        {formatNumber(line.quantity)}
      </td>
      <td className="px-3 py-4 text-right tabular-nums text-slate-700">
        {formatNumber(availableQuantity)}
      </td>
      <td className="px-3 py-4">
        <div className="ml-auto w-20">
          <AppInput
            aria-label={`Sell margin for ${line.itemName}`}
            inputMode="decimal"
            value={sellMarginValue}
            disabled={disabled}
            className={cn(
              "h-9 rounded-xl bg-white text-right text-sm tabular-nums shadow-sm",
              sellMarginError
                ? "border-rose-300 focus-visible:ring-2 focus-visible:ring-rose-200"
                : "border-slate-300 focus-visible:ring-2 focus-visible:ring-brand-100",
            )}
            onChange={(event) => onSellMarginChange(percentageOnly(event.target.value))}
            onFocus={(event) => event.target.select()}
          />
          {sellMarginError ? (
            <p className="mt-1 text-right text-xs text-rose-600">{sellMarginError}</p>
          ) : null}
        </div>
      </td>
      <td className="px-3 py-4">
        <div className="flex flex-col items-start gap-1">
          <AllocationBadge status={status} />
          <span className="text-xs tabular-nums text-slate-500">
            {formatNumber(allocatedQuantity)} / {formatNumber(line.quantity)}
          </span>
          {backorderQuantity > 0 ? (
            <span className="text-xs font-medium tabular-nums text-rose-600">
              Backorder: {formatNumber(backorderQuantity)}
            </span>
          ) : null}
        </div>
      </td>
      <td className="px-4 py-4 text-right">
        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            aria-label={`${expanded ? "Hide" : "Show"} inventory breakdown for ${line.itemName}`}
            className={cn(
              "h-9 rounded-xl px-2.5 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-950",
              hasBatchError && "text-rose-600 hover:text-rose-700",
            )}
            onClick={onToggleExpanded}
          >
            {hasBatchError ? <span className="mr-1 text-xs">Check</span> : null}
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>
      </td>
    </tr>
  );
}
