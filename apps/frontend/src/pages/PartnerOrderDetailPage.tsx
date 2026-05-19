import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "@app/ToastProvider";
import { useAppState } from "@app/providers/AppStateProvider";
import {
  usePartnerAuditLogs,
  usePartnerBrands,
  usePartnerCatalogItems,
  usePartnerClientBusinesses,
  usePartnerInvoices,
  usePartnerOrder,
  usePartnerStock,
} from "@entities/partners/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Separator } from "@components/ui/separator";
import { EmptyState } from "@shared/ui/molecules/EmptyState";
import { ErrorState } from "@shared/ui/molecules/error-state";
import { LoadingState } from "@shared/ui/molecules/loading-state";
import { StatusDialog } from "@shared/ui/molecules/status-dialog";
import { ConfirmArchiveDialog } from "@features/partners/ConfirmArchiveDialog";
import { EditOrderDrawer } from "@features/partners/EditOrderDrawer";
import { DraftOrderConfirmationTable } from "@features/partners/orders/components/DraftOrderConfirmationTable";
import { OrderActivityTimeline } from "@features/partners/orders/components/OrderActivityTimeline";
import { OrderDeliveryDialog } from "@features/partners/orders/components/OrderDeliveryDialog";
import { OrderDetailHeader } from "@features/partners/orders/components/OrderDetailHeader";
import { OrderOperationalLinesTable } from "@features/partners/orders/components/OrderOperationalLinesTable";
import { OrderReturnDialog } from "@features/partners/orders/components/OrderReturnDialog";
import { OrderReturnsTable } from "@features/partners/orders/components/OrderReturnsTable";
import { usePartnerOrderReturnsResource } from "@features/partners/orders/hooks";
import type { PartnerOrderReturn } from "@features/partners/orders/types";
import type { PartnerInvoice } from "@shared/types/domain";
import { printPartnerInvoice, printPartnerPackagingSlip } from "@features/partners/orders/components/orderPrintDocuments";
import { canPackOrder } from "@features/partners/orders/utils";
import { getEffectiveOrderStatus } from "@features/partners/orderStatus";

function todayISODate() {
  return new Date().toISOString().slice(0, 10);
}

export function PartnerOrderDetailPage() {
  const navigate = useNavigate();
  const { push } = useToast();
  const { orderId = "" } = useParams();
  const { activePartnerFirmId, partnerFirms } = useAppState();
  const order = usePartnerOrder(activePartnerFirmId, orderId);
  const brands = usePartnerBrands(activePartnerFirmId);
  const businesses = usePartnerClientBusinesses(activePartnerFirmId, "");
  const catalog = usePartnerCatalogItems(activePartnerFirmId, brands.items.map((brand) => brand.id));
  const stock = usePartnerStock(activePartnerFirmId, "");
  const invoices = usePartnerInvoices(activePartnerFirmId);
  const returns = usePartnerOrderReturnsResource(activePartnerFirmId, orderId);
  const auditLogs = usePartnerAuditLogs(activePartnerFirmId, { entityType: "ORDER" });
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showRevertDialog, setShowRevertDialog] = useState(false);
  const [showEditDrawer, setShowEditDrawer] = useState(false);
  const [showDeliveryDialog, setShowDeliveryDialog] = useState(false);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [returnToVoid, setReturnToVoid] = useState<PartnerOrderReturn | null>(null);
  const [statusDialog, setStatusDialog] = useState<{ tone: "success" | "error"; title: string; description?: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const lineCount = order.item?.requestedItems?.length || order.item?.items.length || 0;
  const activeFirm = useMemo(
    () => partnerFirms.find((firm) => firm.id === activePartnerFirmId),
    [activePartnerFirmId, partnerFirms],
  );
  const firmName = activeFirm?.name ?? "-";
  const brandNamesById = useMemo(() => new Map(brands.items.map((brand) => [brand.id, brand.name])), [brands.items]);

  if (!activePartnerFirmId) {
    return <EmptyState>Select a firm to view order details.</EmptyState>;
  }
  if (order.error) {
    return (
      <ErrorState
        title="Failed to load order"
        message={order.error.message}
        onRetry={() => void order.refresh().catch(() => undefined)}
      />
    );
  }
  if (!order.item) {
    return <EmptyState>Order not found.</EmptyState>;
  }

  const currentOrder = order.item;
  const effectiveStatus = getEffectiveOrderStatus(currentOrder);
  const canPackCurrentOrder = canPackOrder(currentOrder);
  const canEdit = effectiveStatus === "DRAFT" || effectiveStatus === "PLACED" || effectiveStatus === "CONFIRMED" || effectiveStatus === "PACKED";
  const isNewOrderState = effectiveStatus === "DRAFT" || effectiveStatus === "PLACED";
  const selectedBusiness = businesses.items.find((business) => business.id === currentOrder.clientBusinessId);
  const selectedOutlet = selectedBusiness?.outlets.find((outlet) => outlet.id === currentOrder.clientOutletId);
  const clientPhone = selectedBusiness?.contacts.find((contact) => contact.isPrimary)?.phone ?? selectedBusiness?.contacts[0]?.phone ?? "-";
  const outletPhone = selectedOutlet?.contacts.find((contact) => contact.isPrimary)?.phone ?? selectedOutlet?.contacts[0]?.phone ?? "-";
  const orderActivity = auditLogs.items.filter((item) => item.entityId === currentOrder.id);
  const canPrintDocuments = !isNewOrderState && effectiveStatus !== "CANCELLED";
  const linkedInvoice = invoices.items.find((invoice) => {
    if (currentOrder.linkedInvoiceId && invoice.id === currentOrder.linkedInvoiceId) return true;
    return invoice.orderId === currentOrder.id && invoice.status !== "CANCELLED";
  });
  const canGenerateInvoice = canPrintDocuments && !linkedInvoice && !currentOrder.linkedInvoiceId;

  function invoiceInputForOrder(targetOrder: typeof currentOrder) {
    return {
      orderId: targetOrder.id,
      clientBusinessId: targetOrder.clientBusinessId,
      clientOutletId: targetOrder.clientOutletId,
      invoiceDate: todayISODate(),
      dueDate: todayISODate(),
      notes: `Generated from ${targetOrder.orderNumber}`,
    };
  }

  async function createInvoiceForOrder(targetOrder: typeof currentOrder) {
    return invoices.create(invoiceInputForOrder(targetOrder));
  }

  async function generateInvoice() {
    setBusy(true);
    try {
      const invoice = await createInvoiceForOrder(currentOrder);
      await order.refresh();
      await auditLogs.refresh().catch(() => undefined);
      push({ tone: "success", title: "Invoice generated", description: invoice.invoiceNumber });
    } catch (err) {
      setStatusDialog({
        tone: "error",
        title: "Invoice generation failed",
        description: err instanceof Error ? err.message : "Something went wrong, please try again later",
      });
    } finally {
      setBusy(false);
    }
  }

  async function resolveLinkedInvoice() {
    const localInvoice = invoices.items.find((invoice) => {
      if (currentOrder.linkedInvoiceId && invoice.id === currentOrder.linkedInvoiceId) return true;
      return invoice.orderId === currentOrder.id && invoice.status !== "CANCELLED";
    });
    if (localInvoice) return localInvoice;

    const refreshedInvoices = await invoices.refresh();
    return refreshedInvoices.find((invoice: PartnerInvoice) => {
      if (currentOrder.linkedInvoiceId && invoice.id === currentOrder.linkedInvoiceId) return true;
      return invoice.orderId === currentOrder.id && invoice.status !== "CANCELLED";
    });
  }

  async function printInvoice() {
    setBusy(true);
    try {
      let invoice = await resolveLinkedInvoice();
      if (!invoice && canGenerateInvoice) {
        invoice = await createInvoiceForOrder(currentOrder);
        await order.refresh();
        await auditLogs.refresh().catch(() => undefined);
      }
      if (!invoice) {
        throw new Error("Invoice is not generated for this order yet.");
      }
      printPartnerInvoice({
        firm: activeFirm,
        invoice,
        order: currentOrder,
        business: selectedBusiness,
        outlet: selectedOutlet,
      });
    } catch (err) {
      setStatusDialog({
        tone: "error",
        title: "Invoice print failed",
        description: err instanceof Error ? err.message : "Something went wrong, please try again later",
      });
    } finally {
      setBusy(false);
    }
  }

  function printPackagingSlip() {
    try {
      printPartnerPackagingSlip({
        firm: activeFirm,
        order: currentOrder,
        business: selectedBusiness,
        outlet: selectedOutlet,
      });
    } catch (err) {
      setStatusDialog({
        tone: "error",
        title: "Packaging slip print failed",
        description: err instanceof Error ? err.message : "Something went wrong, please try again later",
      });
    }
  }

  async function markPacked() {
    setBusy(true);
    try {
      const updated = await order.updateStatus("PACKED");
      push({ tone: "success", title: "Order packed", description: updated.orderNumber });
      await auditLogs.refresh().catch(() => undefined);
    } catch (err) {
      setStatusDialog({
        tone: "error",
        title: "Packing failed",
        description: err instanceof Error ? err.message : "Something went wrong, please try again later",
      });
    } finally {
      setBusy(false);
    }
  }

  async function markDispatched() {
    setBusy(true);
    try {
      const updated = await order.updateStatus("DISPATCHED", {
        dispatchDetails: {
          dispatchDate: todayISODate(),
        },
      });
      push({ tone: "success", title: "Order dispatched", description: updated.orderNumber });
      await invoices.refresh().catch(() => undefined);
      await auditLogs.refresh().catch(() => undefined);
    } catch (err) {
      setStatusDialog({
        tone: "error",
        title: "Dispatch failed",
        description: err instanceof Error ? err.message : "Something went wrong, please try again later",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="grid gap-4">
      <OrderDetailHeader
        orderNumber={currentOrder.orderNumber}
        status={effectiveStatus}
        clientName={currentOrder.clientBusinessName}
        outletName={currentOrder.clientOutletName}
        busy={busy}
        canEdit={canEdit}
        canPack={canPackCurrentOrder}
        onBack={() => navigate("/partners/sales/orders")}
        onEdit={() => setShowEditDrawer(true)}
        onRevertToDraft={() => setShowRevertDialog(true)}
        onCancel={() => setShowCancelDialog(true)}
        onPack={() => void markPacked()}
        onDispatch={() => void markDispatched()}
        onDeliver={() => setShowDeliveryDialog(true)}
        onReturn={() => setShowReturnDialog(true)}
        canGenerateInvoice={canGenerateInvoice}
        canPrintDocuments={canPrintDocuments}
        canPrintInvoice={Boolean(linkedInvoice || currentOrder.linkedInvoiceId)}
        linkedInvoiceNumber={currentOrder.linkedInvoiceNumber}
        onGenerateInvoice={() => void generateInvoice()}
        onPrintInvoice={() => void printInvoice()}
        onPrintPackagingSlip={printPackagingSlip}
      />

      <Card>
        <CardContent className="grid gap-5 p-5">
          <div className="grid gap-5">
            <div className="grid gap-4 text-sm text-slate-700 md:grid-cols-2 xl:grid-cols-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Order</p>
                <p className="mt-1 font-medium text-slate-900">{currentOrder.orderNumber}</p>
                <p className="mt-1 text-slate-600">{currentOrder.orderDate}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Firm Details</p>
                <p className="mt-1 font-medium text-slate-900">{firmName}</p>
                <p className="mt-1 text-slate-600">GST: {activeFirm?.gstin || "-"}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Client Details</p>
                <p className="mt-1 font-medium text-slate-900">{currentOrder.clientBusinessName}</p>
                <p className="mt-1 text-slate-600">GST: {selectedBusiness?.gstin || "-"}</p>
                <p className="mt-1 text-slate-600">Phone: {clientPhone}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Outlet Details</p>
                <p className="mt-1 font-medium text-slate-900">{currentOrder.clientOutletName}</p>
                <p className="mt-1 text-slate-600">{selectedOutlet?.address || "-"}</p>
                <p className="mt-1 text-slate-600">Phone: {outletPhone}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Creator Details</p>
                <p className="mt-1 font-medium text-slate-900">{currentOrder.createdByName || "-"}</p>
              </div>
            </div>

          </div>

          <Separator />

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            <p className="font-medium text-slate-900">Notes</p>
            <p className="mt-1">{currentOrder.notes || "-"}</p>
          </div>
        </CardContent>
      </Card>

      {isNewOrderState ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Order lines</CardTitle>
            <div className="flex gap-2 text-sm text-slate-500">
              <span>{lineCount} lines</span>
              <span>{currentOrder.totalQuantity} units</span>
            </div>
          </CardHeader>
          <CardContent>
            <DraftOrderConfirmationTable
              order={currentOrder}
              stockRows={stock.items}
              busy={busy}
              onRetryStock={() => void stock.refresh().catch(() => undefined)}
              onCancel={() => setShowCancelDialog(true)}
              onConfirm={async (input) => {
                setBusy(true);
                try {
                  const updated = await order.updateStatus("CONFIRMED", input);
                  await order.refresh();
                  await invoices.refresh().catch(() => undefined);
                  await auditLogs.refresh().catch(() => undefined);
                  push({
                    tone: "success",
                    title: "Order confirmed and draft invoice generated",
                    description: updated.orderNumber,
                  });
                } catch (err) {
                  setStatusDialog({
                    tone: "error",
                    title: "Order confirmation failed",
                    description: err instanceof Error ? err.message : "Something went wrong, please try again later",
                  });
                } finally {
                  setBusy(false);
                }
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Operational Lines</CardTitle>
            <div className="flex gap-2 text-sm text-slate-500">
              <span>{lineCount} lines</span>
              <span>{currentOrder.totalQuantity} units</span>
            </div>
          </CardHeader>
          <CardContent>
            <OrderOperationalLinesTable order={currentOrder} />
          </CardContent>
        </Card>
      )}

      <ConfirmArchiveDialog
        open={showCancelDialog}
        title="Cancel order"
        message="Are you sure you want to cancel this order?"
        confirmLabel="Cancel Order"
        onClose={() => setShowCancelDialog(false)}
        onConfirm={async () => {
          setBusy(true);
          try {
            const updated = await order.updateStatus("CANCELLED");
            push({ tone: "success", title: "Order cancelled", description: updated.orderNumber });
            setShowCancelDialog(false);
          } catch (err) {
            setStatusDialog({
              tone: "error",
              title: "Order cancellation failed",
              description: err instanceof Error ? err.message : "Something went wrong, please try again later",
            });
          } finally {
            setBusy(false);
          }
        }}
      />

      <ConfirmArchiveDialog
        open={showRevertDialog}
        title="Revert to draft"
        message="Revert this order to draft? Allocated stock will be returned and the draft invoice will be cancelled."
        confirmLabel="Revert to Draft"
        onClose={() => setShowRevertDialog(false)}
        onConfirm={async () => {
          setBusy(true);
          try {
            const updated = await order.updateStatus("DRAFT");
            push({ tone: "success", title: "Order reverted to draft", description: updated.orderNumber });
            setShowRevertDialog(false);
            await invoices.refresh().catch(() => undefined);
            await auditLogs.refresh().catch(() => undefined);
            setShowEditDrawer(true);
          } catch (err) {
            setStatusDialog({
              tone: "error",
              title: "Revert to draft failed",
              description: err instanceof Error ? err.message : "Something went wrong, please try again later",
            });
          } finally {
            setBusy(false);
          }
        }}
      />

      <EditOrderDrawer
        open={showEditDrawer}
        order={currentOrder}
        businesses={businesses.items}
        catalogItems={catalog.items}
        brandNamesById={brandNamesById}
        catalogLoading={catalog.loading}
        catalogError={catalog.error?.message ?? ""}
        onRetryCatalog={() => void catalog.refresh().catch(() => undefined)}
        onClose={() => setShowEditDrawer(false)}
        onSubmit={async (input) => {
          await order.update(input);
          await invoices.refresh().catch(() => undefined);
          await auditLogs.refresh().catch(() => undefined);
        }}
      />

      <OrderReturnDialog
        open={showReturnDialog}
        order={currentOrder}
        loading={busy}
        onClose={() => setShowReturnDialog(false)}
        onSubmit={async (input) => {
          setBusy(true);
          try {
            const result = await returns.create(input);
            push({
              tone: "success",
              title: "Return created",
              description: `${result.salesReturn.returnNumber} created. Credit Note ${result.creditNote.creditNoteNumber} issued.`,
            });
            setShowReturnDialog(false);
            await order.refresh();
            await returns.refresh().catch(() => undefined);
            await invoices.refresh().catch(() => undefined);
            await auditLogs.refresh().catch(() => undefined);
          } catch (err) {
            setStatusDialog({
              tone: "error",
              title: "Return creation failed",
              description: err instanceof Error ? err.message : "Something went wrong, please try again later",
            });
          } finally {
            setBusy(false);
          }
        }}
      />

      <OrderDeliveryDialog
        open={showDeliveryDialog}
        order={currentOrder}
        loading={busy}
        onClose={() => setShowDeliveryDialog(false)}
        onSubmit={async (input) => {
          setBusy(true);
          try {
            const updated = await order.updateStatus("DELIVERED", input);
            push({ tone: "success", title: "Order delivered", description: updated.orderNumber });
            setShowDeliveryDialog(false);
            await auditLogs.refresh().catch(() => undefined);
          } catch (err) {
            setStatusDialog({
              tone: "error",
              title: "Delivery failed",
              description: err instanceof Error ? err.message : "Something went wrong, please try again later",
            });
          } finally {
            setBusy(false);
          }
        }}
      />

      <ConfirmArchiveDialog
        open={Boolean(returnToVoid)}
        title="Void return"
        message={`Void ${returnToVoid?.returnNumber ?? "this return"}? This will reverse returned stock, cancel the linked credit note, and restore the order journey from the remaining delivered/dispatched quantities.`}
        confirmLabel="Void Return"
        onClose={() => setReturnToVoid(null)}
        onConfirm={async () => {
          if (!returnToVoid) return;
          setBusy(true);
          try {
            const result = await returns.voidReturn(returnToVoid.id);
            push({
              tone: "success",
              title: "Return voided",
              description: `${result.salesReturn.returnNumber} voided. Credit Note ${result.creditNote.creditNoteNumber} cancelled.`,
            });
            setReturnToVoid(null);
            await order.refresh();
            await returns.refresh().catch(() => undefined);
            await invoices.refresh().catch(() => undefined);
            await auditLogs.refresh().catch(() => undefined);
          } catch (err) {
            setStatusDialog({
              tone: "error",
              title: "Return void failed",
              description: err instanceof Error ? err.message : "Something went wrong, please try again later",
            });
          } finally {
            setBusy(false);
          }
        }}
      />

      <Card>
        <CardHeader>
          <CardTitle>Returns</CardTitle>
        </CardHeader>
        <CardContent>
          {returns.loading ? (
            <LoadingState label="Loading returns..." />
          ) : returns.error ? (
            <ErrorState
              title="Failed to load returns"
              message={returns.error}
              onRetry={() => void returns.refresh().catch(() => undefined)}
            />
          ) : (
            <OrderReturnsTable returns={returns.items} voidingReturnId={busy && returnToVoid ? returnToVoid.id : ""} onVoidReturn={setReturnToVoid} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activity timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <OrderActivityTimeline items={orderActivity} />
        </CardContent>
      </Card>

      <StatusDialog
        open={Boolean(statusDialog)}
        tone={statusDialog?.tone ?? "success"}
        title={statusDialog?.title ?? ""}
        description={statusDialog?.description}
        onClose={() => setStatusDialog(null)}
      />
    </section>
  );
}
