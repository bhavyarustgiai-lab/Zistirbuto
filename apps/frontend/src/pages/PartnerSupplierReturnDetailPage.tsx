import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Pencil, XCircle } from "lucide-react";
import { useToast } from "@app/ToastProvider";
import { useAppState } from "@app/providers/AppStateProvider";
import { usePartnerInventory, usePartnerSupplierReturn, usePartnerSuppliers } from "@entities/partners/hooks";
import { PartnerStatusBadge } from "@features/partners/PartnerStatusBadge";
import { CancelSupplierReturnDialog } from "@features/partners/supplier-returns/CancelSupplierReturnDialog";
import { SupplierReturnFormPanel } from "@features/partners/supplier-returns/SupplierReturnFormPanel";
import { PartnersPageShell } from "@features/partners/layout/PartnersPageLayout";
import { Button } from "@components/ui/button";
import { Card, CardContent } from "@components/ui/card";
import { EmptyState } from "@shared/ui/molecules/empty-state";
import { ErrorState } from "@shared/ui/molecules/error-state";
import { LoadingState } from "@shared/ui/molecules/loading-state";

const numberFormatter = new Intl.NumberFormat("en-IN");

function formatDate(value: string) {
  return value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-";
}

export function PartnerSupplierReturnDetailPage() {
  const { activePartnerFirmId } = useAppState();
  const { returnId = "" } = useParams();
  const { push } = useToast();
  const supplierReturn = usePartnerSupplierReturn(activePartnerFirmId, returnId);
  const suppliers = usePartnerSuppliers(activePartnerFirmId, "");
  const brandId = supplierReturn.item ? String(supplierReturn.item.brandId) : "";
  const inventory = usePartnerInventory(activePartnerFirmId, brandId);
  const [editing, setEditing] = useState(false);
  const [mutating, setMutating] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [actionError, setActionError] = useState("");

  if (!activePartnerFirmId) {
    return <EmptyState>Select a firm to view return details.</EmptyState>;
  }

  if (supplierReturn.isLoading || (supplierReturn.item && inventory.loading)) {
    return <LoadingState label="Loading supplier return..." />;
  }
  if (supplierReturn.error) {
    return <ErrorState message={supplierReturn.error} onRetry={supplierReturn.refresh} />;
  }
  if (!supplierReturn.item) {
    return <EmptyState title="Supplier return not found." />;
  }

  const item = supplierReturn.item;
  const canEdit = item.status === "PLACED";
  const canCancel = item.status === "PLACED";
  const canComplete = item.status === "PLACED";

  async function runAction(action: () => Promise<void>) {
    setMutating(true);
    setActionError("");
    try {
      await action();
      await inventory.refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Something went wrong, please try again later");
    } finally {
      setMutating(false);
    }
  }

  return (
    <PartnersPageShell>
      <div className="space-y-5">
        {actionError ? <ErrorState title="Action failed" message={actionError} onRetry={() => setActionError("")} /> : null}
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Link to={`/partners/supply/supplier-returns?brand=${encodeURIComponent(String(item.brandId))}`} className="mb-3 inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Link>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-950">{item.returnNumber}</h1>
              <PartnerStatusBadge status={item.status} />
            </div>
            <p className="mt-1 text-sm text-slate-500">Return {formatDate(item.returnDate)}</p>
          </div>
          {!editing ? (
            <div className="flex flex-wrap gap-2 lg:justify-end">
              {canComplete ? (
                <Button variant="outline" className="h-10 px-3 text-sm" disabled={mutating} onClick={() => void runAction(async () => {
                  const completed = await supplierReturn.complete();
                  push({ title: "Return completed", description: `${completed.returnNumber} moved stock out.`, tone: "success" });
                })}>
                  <CheckCircle2 className="mr-1 h-4 w-4" />
                  Mark complete
                </Button>
              ) : null}
              {canCancel ? (
                <Button variant="outline" className="h-10 px-3 text-sm text-rose-700" disabled={mutating} onClick={() => setShowCancel(true)}>
                  <XCircle className="mr-1 h-4 w-4" />
                  Cancel
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>

        <CancelSupplierReturnDialog
          open={showCancel}
          supplierReturn={item}
          loading={mutating}
          onClose={() => setShowCancel(false)}
          onCancel={async (input) => {
            await runAction(async () => {
              const cancelled = await supplierReturn.cancel(input);
              setShowCancel(false);
              push({ title: "Return cancelled", description: cancelled.returnNumber, tone: "success" });
            });
          }}
        />

        {editing ? (
          <SupplierReturnFormPanel
            brandId={brandId}
            suppliers={suppliers.items}
            inventoryItems={inventory.items}
            inventoryLoading={inventory.loading}
            initialReturn={item}
            submitLabel="Save changes"
            savingLabel="Saving..."
            saving={mutating}
            onRetryInventory={() => void inventory.refresh()}
            onCancel={() => setEditing(false)}
            onSubmit={async (input) => {
              setMutating(true);
              try {
                const updated = await supplierReturn.update(input);
                push({ title: "Return updated", description: updated.returnNumber, tone: "success" });
                setEditing(false);
              } finally {
                setMutating(false);
              }
            }}
          />
        ) : (
          <>
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="grid gap-4 p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <h2 className="text-base font-semibold text-slate-950">Supplier details</h2>
                  {canEdit ? (
                    <Button variant="outline" className="h-10 w-full px-3 text-sm sm:w-auto" disabled={mutating} onClick={() => setEditing(true)}>
                      <Pencil className="mr-1 h-4 w-4" />
                      Edit
                    </Button>
                  ) : null}
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-slate-700">Business name</p>
                    <div className="mt-1 flex h-12 items-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-950">{item.supplierName}</div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">Return date</p>
                    <div className="mt-1 flex h-12 items-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-950">{formatDate(item.returnDate)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="min-w-0 overflow-hidden border-slate-200 shadow-sm">
              <CardContent className="grid gap-4 p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-slate-950">Items</h2>
                    <p className="mt-1 text-sm text-slate-500">Supplier return lines</p>
                  </div>
                  {canEdit ? (
                    <Button variant="outline" className="h-10 w-full px-3 text-sm sm:w-auto" disabled={mutating} onClick={() => setEditing(true)}>
                      <Pencil className="mr-1 h-4 w-4" />
                      Edit items
                    </Button>
                  ) : null}
                </div>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full min-w-[860px] table-fixed text-sm">
                    <thead className="bg-slate-50 text-left text-slate-500">
                      <tr className="border-b border-slate-200">
                        <th className="w-[34%] px-5 py-3 font-medium">Stock lot</th>
                        <th className="w-[13%] px-4 py-3 text-right font-medium">Cost</th>
                        <th className="w-[12%] px-4 py-3 text-right font-medium">Buy %</th>
                        <th className="w-[10%] px-4 py-3 text-right font-medium">GST</th>
                        <th className="w-[13%] px-4 py-3 text-right font-medium">Qty</th>
                        <th className="w-[18%] px-5 py-3 font-medium">Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {item.items.map((line) => (
                        <tr key={line.id} className="border-b border-slate-100 last:border-b-0">
                          <td className="px-5 py-4">
                            <div className="truncate font-medium text-slate-950">{line.itemName}</div>
                            <div className="mt-1 truncate text-xs text-slate-500">SKU {line.sku || "-"}</div>
                          </td>
                          <td className="px-4 py-4 text-right tabular-nums">{numberFormatter.format(line.mrp)}</td>
                          <td className="px-4 py-4 text-right tabular-nums">{line.discountPercentage}</td>
                          <td className="px-4 py-4 text-right tabular-nums">{line.taxPercentage}</td>
                          <td className="px-4 py-4 text-right tabular-nums">{line.quantity}</td>
                          <td className="px-5 py-4">{line.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="ml-auto grid w-full max-w-sm gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                  <div className="flex justify-between gap-4 text-base font-semibold text-slate-950">
                    <span>Total quantity</span>
                    <span className="tabular-nums">{numberFormatter.format(item.totalQuantity)}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">Notes</p>
                  <div className="mt-1 min-h-28 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950">
                    {item.note ? <p className="whitespace-pre-wrap">{item.note}</p> : <span className="text-slate-400">No notes added</span>}
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </PartnersPageShell>
  );
}
