import { useMemo, useState } from "react";
import { CheckCircle2, Eye, Plus, Search, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@app/ToastProvider";
import { useAppState } from "@app/providers/AppStateProvider";
import { usePartnerBrands, usePartnerInventory, usePartnerSupplierReturns } from "@entities/partners/hooks";
import { PartnerBrandSelector } from "@features/partners/brands/PartnerBrandSelector";
import { usePartnerBrandSelection } from "@features/partners/brands/usePartnerBrandSelection";
import { PartnerStatusBadge } from "@features/partners/PartnerStatusBadge";
import { CancelSupplierReturnDialog } from "@features/partners/supplier-returns/CancelSupplierReturnDialog";
import {
  PartnersPageFilters,
  PartnersPageHeader,
  PartnersPageShell,
  PartnersTableCard,
} from "@features/partners/layout/PartnersPageLayout";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import type { PartnerSupplierReturn } from "@shared/types/domain";
import { EmptyState } from "@shared/ui/molecules/empty-state";
import { ErrorState } from "@shared/ui/molecules/error-state";
import { LoadingState } from "@shared/ui/molecules/loading-state";

const reasonLabels: Record<string, string> = {
  DAMAGED: "Damaged",
  WRONG_ITEM: "Wrong item",
  EXPIRED: "Expired",
  EXCESS_STOCK: "Excess stock",
  OTHER: "Other",
};

const viewOptions = [
  { value: "PLACED", label: "Placed" },
  { value: "COMPLETED", label: "Completed" },
];

function isInteractiveTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && Boolean(target.closest("a,button,input,select,textarea"));
}

function formatDate(value: string) {
  return value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-";
}

export function PartnerSupplierReturnsPage() {
  const { activePartnerFirmId } = useAppState();
  const navigate = useNavigate();
  const { push } = useToast();
  const brands = usePartnerBrands(activePartnerFirmId);
  const { brandId, brandOptions, setBrandId } = usePartnerBrandSelection(activePartnerFirmId, brands.items);
  const inventory = usePartnerInventory(activePartnerFirmId, brandId);
  const returns = usePartnerSupplierReturns(activePartnerFirmId, brandId);
  const [search, setSearch] = useState("");
  const [view, setView] = useState("PLACED");
  const [completingReturnId, setCompletingReturnId] = useState("");
  const [mutatingReturnId, setMutatingReturnId] = useState("");
  const [cancellingReturn, setCancellingReturn] = useState<PartnerSupplierReturn | null>(null);
  const [actionError, setActionError] = useState("");

  const filteredReturns = useMemo(() => {
    const term = search.trim().toLowerCase();
    return returns.items.filter((item) => {
      if (item.status !== view) return false;
      return !term || [
        item.returnNumber,
        item.supplierName,
        item.note ?? "",
        ...item.items.flatMap((line) => [line.itemName, line.sku ?? "", reasonLabels[line.reason] ?? line.reason]),
      ]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [returns.items, search, view]);

  if (!activePartnerFirmId) {
    return <EmptyState>Select a firm to manage returns.</EmptyState>;
  }

  return (
    <PartnersPageShell>
      <PartnersPageHeader
        title="Returns"
        description="Review stock returned to supplier businesses."
        actions={
          <PartnerBrandSelector value={brandId} onValueChange={setBrandId} options={brandOptions} />
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {viewOptions.map((option) => (
            <Button
              key={option.value}
              variant={view === option.value ? "default" : "outline"}
              className="h-10 px-4 text-sm"
              onClick={() => setView(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
        <Button
          className="h-11 w-full px-4 text-sm sm:w-auto"
          disabled={!brandId}
          onClick={() => navigate(`/partners/supply/supplier-returns/new?brand=${encodeURIComponent(brandId)}`)}
        >
          <Plus className="mr-1 h-4 w-4" />
          Create return
        </Button>
      </div>

      {actionError ? <ErrorState title="Action failed" message={actionError} onRetry={() => setActionError("")} /> : null}

      <CancelSupplierReturnDialog
        open={Boolean(cancellingReturn)}
        supplierReturn={cancellingReturn}
        loading={Boolean(cancellingReturn && mutatingReturnId === cancellingReturn.id)}
        onClose={() => setCancellingReturn(null)}
        onCancel={async (input) => {
          if (!cancellingReturn) return;
          setMutatingReturnId(cancellingReturn.id);
          setActionError("");
          try {
            const cancelled = await returns.cancel(cancellingReturn.id, input);
            await inventory.refresh();
            push({ title: "Return cancelled", description: cancelled.returnNumber, tone: "success" });
            setCancellingReturn(null);
          } catch (err) {
            setActionError(err instanceof Error ? err.message : "Something went wrong, please try again later");
          } finally {
            setMutatingReturnId("");
          }
        }}
      />

      <PartnersPageFilters>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
            placeholder="Search return, business, item, or note"
          />
        </div>
      </PartnersPageFilters>

      <PartnersTableCard>
        {returns.isLoading ? (
          <LoadingState label="Loading returns..." />
        ) : returns.error ? (
          <div className="p-6">
            <ErrorState message={returns.error} onRetry={returns.refresh} />
          </div>
        ) : filteredReturns.length === 0 ? (
          <div className="p-8">
            <EmptyState title="No returns yet." description="Create a return when available stock is sent back to a supplier business." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[840px] text-sm">
                  <thead className="bg-slate-50 text-left text-slate-500">
                    <tr className="border-b border-slate-200">
                      <th className="px-5 py-3 font-medium">Return No</th>
                      <th className="px-4 py-3 font-medium">Business name</th>
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 text-right font-medium">Items</th>
                      <th className="px-4 py-3 text-right font-medium">Qty</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium">Reason</th>
                      <th className="px-5 py-3 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReturns.map((item) => (
                      <tr
                        key={item.id}
                        className="cursor-pointer border-b border-slate-100 last:border-b-0 hover:bg-slate-50"
                        role="button"
                        tabIndex={0}
                        onClick={(event) => {
                          if (isInteractiveTarget(event.target)) return;
                          navigate(`/partners/supply/supplier-returns/${encodeURIComponent(item.id)}`);
                        }}
                        onKeyDown={(event) => {
                          if (event.key !== "Enter" && event.key !== " ") return;
                          if (isInteractiveTarget(event.target)) return;
                          event.preventDefault();
                          navigate(`/partners/supply/supplier-returns/${encodeURIComponent(item.id)}`);
                        }}
                      >
                        <td className="px-5 py-4 font-medium text-slate-950">{item.returnNumber}</td>
                        <td className="px-4 py-4">{item.supplierName}</td>
                        <td className="px-4 py-4">{formatDate(item.returnDate)}</td>
                        <td className="px-4 py-4 text-right">{item.lineCount}</td>
                        <td className="px-4 py-4 text-right tabular-nums">{item.totalQuantity}</td>
                        <td className="px-4 py-4">
                          <PartnerStatusBadge status={item.status} />
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          {item.items.map((line) => reasonLabels[line.reason] ?? line.reason).join(", ")}
                        </td>
                        <td className="px-5 py-4 text-right" onClick={(event) => event.stopPropagation()}>
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button
                              variant="outline"
                              className="h-9 px-3 text-sm"
                              onClick={() => navigate(`/partners/supply/supplier-returns/${encodeURIComponent(item.id)}`)}
                            >
                              <Eye className="mr-1 h-4 w-4" />
                              View
                            </Button>
                            {item.status === "PLACED" ? (
                              <Button
                                variant="outline"
                                className="h-9 px-3 text-sm text-rose-700"
                                disabled={mutatingReturnId === item.id}
                                onClick={() => {
                                  setCancellingReturn(item);
                                }}
                              >
                                <XCircle className="mr-1 h-4 w-4" />
                                Cancel
                              </Button>
                            ) : null}
                            {item.status === "PLACED" ? (
                              <Button
                                variant="outline"
                                className="h-9 px-3 text-sm"
                                disabled={completingReturnId === item.id}
                                onClick={async () => {
                                  setCompletingReturnId(item.id);
                                  setActionError("");
                                  try {
                                    const completed = await returns.complete(item.id);
                                    await inventory.refresh();
                                    push({
                                      title: "Return completed",
                                      description: `${completed.returnNumber} moved stock out.`,
                                      tone: "success",
                                    });
                                  } catch (err) {
                                    setActionError(err instanceof Error ? err.message : "Something went wrong, please try again later");
                                  } finally {
                                    setCompletingReturnId("");
                                  }
                                }}
                              >
                                <CheckCircle2 className="mr-1 h-4 w-4" />
                                {completingReturnId === item.id ? "Completing..." : "Mark complete"}
                              </Button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
            </table>
          </div>
        )}
      </PartnersTableCard>

    </PartnersPageShell>
  );
}
