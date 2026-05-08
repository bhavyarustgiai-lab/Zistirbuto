import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useAppState } from "@app/providers/AppStateProvider";
import { useToast } from "@app/ToastProvider";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { EmptyState } from "@shared/ui/molecules/EmptyState";
import {
  PartnersPageFilters,
  PartnersPageHeader,
  PartnersPageShell,
  PartnersTableCard,
} from "@features/partners/layout/PartnersPageLayout";
import { useFinanceInvoices, useCurrentPartnerFinanceRole } from "@features/partners/finance/invoices/hooks";
import { canFinalizeInvoiceRole } from "@features/partners/finance/invoices/utils";
import { usePartnerPayments } from "@features/partners/finance/payments/hooks";
import { PaymentEntryDialog } from "@features/partners/finance/payments/components/PaymentEntryDialog";
import { PaymentHistoryTable } from "@features/partners/finance/payments/components/PaymentHistoryTable";
import { PaymentSummaryStrip } from "@features/partners/finance/payments/components/PaymentSummaryStrip";
import { invoiceOutstanding } from "@features/partners/finance/payments/utils";
import type { PartnerPaymentMode } from "@shared/types/domain";

export function PartnersPaymentsPage() {
  const { activePartnerFirmId, currentUser } = useAppState();
  const { push } = useToast();
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordError, setRecordError] = useState("");
  const payments = usePartnerPayments(activePartnerFirmId, { search, fromDate, toDate });
  const invoices = useFinanceInvoices(activePartnerFirmId);
  const role = useCurrentPartnerFinanceRole(activePartnerFirmId, currentUser?.id);

  const payableInvoices = useMemo(
    () => invoices.items.filter((invoice) => invoice.status === "FINALIZED" && invoiceOutstanding(invoice) > 0),
    [invoices.items],
  );
  const canRecord = canFinalizeInvoiceRole(role.role);

  async function recordPayment(input: {
    invoiceId: string;
    paymentDate: string;
    amount: number;
    paymentMode: PartnerPaymentMode;
    referenceNumber?: string;
    collectedByUserId?: string;
    notes?: string;
  }) {
    setRecording(true);
    setRecordError("");
    try {
      const payment = await payments.create(input);
      await invoices.refresh().catch(() => undefined);
      setDialogOpen(false);
      push({ tone: "success", title: "Payment recorded", description: payment.paymentReference });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong, please try again later";
      setRecordError(message);
      push({ tone: "error", title: "Payment failed", description: message });
    } finally {
      setRecording(false);
    }
  }

  if (!activePartnerFirmId) {
    return <EmptyState>Select a firm to view payments.</EmptyState>;
  }

  return (
    <PartnersPageShell>
      <PartnersPageHeader
        title="Payments"
        description="Record collections against finalized invoices and keep outstanding balances current."
        actions={
          <Button type="button" className="h-10 px-3 text-sm" disabled={!canRecord} onClick={() => setDialogOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Record Payment
          </Button>
        }
      />
      <PaymentSummaryStrip payments={payments.items} />
      <PartnersPageFilters className="md:grid-cols-3 xl:grid xl:grid-cols-[minmax(260px,1fr)_180px_180px]">
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search client or reference" />
        <Input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} aria-label="From date" />
        <Input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} aria-label="To date" />
      </PartnersPageFilters>
      <PartnersTableCard>
        <PaymentHistoryTable
          payments={payments.items}
          loading={payments.loading}
          error={payments.error}
          onRetry={() => void payments.refresh().catch(() => undefined)}
        />
      </PartnersTableCard>
      <PaymentEntryDialog
        open={dialogOpen}
        invoices={payableInvoices}
        loading={recording}
        error={recordError}
        onClose={() => !recording && setDialogOpen(false)}
        onSubmit={recordPayment}
      />
    </PartnersPageShell>
  );
}
