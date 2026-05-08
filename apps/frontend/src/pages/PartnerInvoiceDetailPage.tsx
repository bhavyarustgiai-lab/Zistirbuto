import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAppState } from "@app/providers/AppStateProvider";
import { useToast } from "@app/ToastProvider";
import { EmptyState } from "@shared/ui/molecules/EmptyState";
import { LoadingState } from "@shared/ui/molecules/loading-state";
import { ErrorState } from "@shared/ui/molecules/error-state";
import { PartnersPageShell } from "@features/partners/layout/PartnersPageLayout";
import { usePartnerAuditLogs } from "@entities/partners/hooks";
import {
  useCurrentPartnerFinanceRole,
  useFinanceInvoice,
} from "@features/partners/finance/invoices/hooks";
import { InvoiceDetailHeader } from "@features/partners/finance/invoices/components/InvoiceDetailHeader";
import { InvoiceSummaryPanel } from "@features/partners/finance/invoices/components/InvoiceSummaryPanel";
import { InvoiceLineItemsTable } from "@features/partners/finance/invoices/components/InvoiceLineItemsTable";
import { InvoiceTaxSummary } from "@features/partners/finance/invoices/components/InvoiceTaxSummary";
import { InvoicePreviewDialog } from "@features/partners/finance/invoices/components/InvoicePreviewDialog";
import { FinalizeInvoiceDialog } from "@features/partners/finance/invoices/components/FinalizeInvoiceDialog";
import { InvoiceActivity } from "@features/partners/finance/invoices/components/InvoiceActivity";
import { PaymentEntryDialog } from "@features/partners/finance/payments/components/PaymentEntryDialog";
import { usePartnerPayments } from "@features/partners/finance/payments/hooks";
import type { PartnerPaymentMode } from "@shared/types/domain";

export function PartnerInvoiceDetailPage() {
  const { invoiceId = "" } = useParams();
  const { activePartnerFirmId, partnerFirms, currentUser } = useAppState();
  const { push } = useToast();
  const invoice = useFinanceInvoice(activePartnerFirmId, invoiceId);
  const role = useCurrentPartnerFinanceRole(activePartnerFirmId, currentUser?.id);
  const audit = usePartnerAuditLogs(activePartnerFirmId, { entityType: "INVOICE" });
  const payments = usePartnerPayments(activePartnerFirmId, { invoiceId });
  const [previewOpen, setPreviewOpen] = useState(false);
  const [finalizeOpen, setFinalizeOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [recordingPayment, setRecordingPayment] = useState(false);
  const [finalizeError, setFinalizeError] = useState("");
  const [paymentError, setPaymentError] = useState("");

  const activeFirm = partnerFirms.find((firm) => firm.id === activePartnerFirmId);
  const invoiceAudit = useMemo(
    () => audit.items.filter((item) => item.entityId === invoiceId),
    [audit.items, invoiceId],
  );

  async function finalizeInvoice() {
    setFinalizing(true);
    setFinalizeError("");
    try {
      const next = await invoice.finalize();
      setFinalizeOpen(false);
      push({ tone: "success", title: "Invoice finalized", description: next.invoiceNumber });
      await invoice.refresh().catch(() => undefined);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong, please try again later";
      setFinalizeError(message);
      push({ tone: "error", title: "Invoice finalization failed", description: message });
    } finally {
      setFinalizing(false);
    }
  }

  async function recordPayment(input: {
    invoiceId: string;
    paymentDate: string;
    amount: number;
    paymentMode: PartnerPaymentMode;
    referenceNumber?: string;
    collectedByUserId?: string;
    notes?: string;
  }) {
    setRecordingPayment(true);
    setPaymentError("");
    try {
      const payment = await payments.create(input);
      await invoice.refresh().catch(() => undefined);
      setPaymentOpen(false);
      push({ tone: "success", title: "Payment recorded", description: payment.paymentReference });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong, please try again later";
      setPaymentError(message);
      push({ tone: "error", title: "Payment failed", description: message });
    } finally {
      setRecordingPayment(false);
    }
  }

  if (!activePartnerFirmId) {
    return <EmptyState>Select a firm to view invoices.</EmptyState>;
  }

  if (invoice.loading) {
    return <LoadingState label="Loading invoice..." />;
  }

  if (invoice.error) {
    return <ErrorState message={invoice.error.message} onRetry={() => void invoice.refresh().catch(() => undefined)} />;
  }

  if (!invoice.item) {
    return <EmptyState>Invoice not found.</EmptyState>;
  }

  return (
    <PartnersPageShell>
      <div>
        <Link
          to="/partners/invoices"
          className="inline-flex h-9 items-center rounded-lg px-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Invoices
        </Link>
      </div>

      <InvoiceDetailHeader
        invoice={invoice.item}
        role={role.role}
        roleLoading={role.loading}
        busy={finalizing}
        onFinalize={() => {
          setFinalizeError("");
          setFinalizeOpen(true);
        }}
        onPreview={() => setPreviewOpen(true)}
        onRecordPayment={() => {
          setPaymentError("");
          setPaymentOpen(true);
        }}
      />

      <InvoiceSummaryPanel invoice={invoice.item} firm={activeFirm} />

      <section className="grid gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-950">Line items</h2>
        </div>
        <InvoiceLineItemsTable items={invoice.item.items} />
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">
          <p className="font-semibold text-slate-950">Source</p>
          {invoice.item.orderId ? (
            <p className="mt-2">
              Created from order{" "}
              <Link className="font-medium text-brand-600 hover:underline" to={`/partners/orders/${invoice.item.orderId}`}>
                {invoice.item.dispatchReference || invoice.item.orderId}
              </Link>
            </p>
          ) : (
            <p className="mt-2 text-slate-500">No source order reference is attached.</p>
          )}
          {invoice.item.notes ? <p className="mt-3 text-slate-600">Notes: {invoice.item.notes}</p> : null}
        </div>
        <InvoiceTaxSummary invoice={invoice.item} />
      </div>

      <InvoiceActivity items={invoiceAudit} />

      <InvoicePreviewDialog
        invoice={invoice.item}
        firm={activeFirm}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />
      <PaymentEntryDialog
        open={paymentOpen}
        invoices={[invoice.item]}
        initialInvoiceId={invoice.item.id}
        loading={recordingPayment}
        error={paymentError}
        onClose={() => {
          if (!recordingPayment) setPaymentOpen(false);
        }}
        onSubmit={recordPayment}
      />
      <FinalizeInvoiceDialog
        invoice={invoice.item}
        open={finalizeOpen}
        loading={finalizing}
        error={finalizeError}
        onClose={() => {
          if (!finalizing) setFinalizeOpen(false);
        }}
        onConfirm={() => void finalizeInvoice()}
      />
    </PartnersPageShell>
  );
}
