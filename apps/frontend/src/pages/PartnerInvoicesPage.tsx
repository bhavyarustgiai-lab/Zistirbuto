import { useMemo, useState } from "react";
import { useAppState } from "@app/providers/AppStateProvider";
import { useToast } from "@app/ToastProvider";
import { Button } from "@components/ui/button";
import { EmptyState } from "@shared/ui/molecules/EmptyState";
import type { PartnerInvoice } from "@shared/types/domain";
import {
  PartnersPageHeader,
  PartnersPageShell,
  PartnersTableCard,
} from "@features/partners/layout/PartnersPageLayout";
import {
  useCurrentPartnerFinanceRole,
  useFinanceInvoices,
} from "@features/partners/finance/invoices/hooks";
import { InvoiceFilters } from "@features/partners/finance/invoices/components/InvoiceFilters";
import { InvoiceList } from "@features/partners/finance/invoices/components/InvoiceList";
import { InvoicePreviewDialog } from "@features/partners/finance/invoices/components/InvoicePreviewDialog";
import { FinalizeInvoiceDialog } from "@features/partners/finance/invoices/components/FinalizeInvoiceDialog";
import { canFinalizeInvoiceRole, filterInvoices } from "@features/partners/finance/invoices/utils";
import type { InvoiceListFilters } from "@features/partners/finance/invoices/types";
import { financeInvoicesApi } from "@features/partners/finance/invoices/api";

const defaultFilters: InvoiceListFilters = {
  search: "",
  status: "ALL",
  fromDate: "",
  toDate: "",
};

export function PartnerInvoicesPage() {
  const { activePartnerFirmId, partnerFirms, currentUser } = useAppState();
  const { push } = useToast();
  const invoices = useFinanceInvoices(activePartnerFirmId);
  const role = useCurrentPartnerFinanceRole(activePartnerFirmId, currentUser?.id);
  const [filters, setFilters] = useState(defaultFilters);
  const [previewInvoice, setPreviewInvoice] = useState<PartnerInvoice | null>(null);
  const [finalizeInvoice, setFinalizeInvoice] = useState<PartnerInvoice | null>(null);
  const [finalizingInvoiceId, setFinalizingInvoiceId] = useState("");
  const [finalizeError, setFinalizeError] = useState("");

  const activeFirm = partnerFirms.find((firm) => firm.id === activePartnerFirmId);
  const visibleInvoices = useMemo(() => filterInvoices(invoices.items, filters), [filters, invoices.items]);
  const canFinalize = canFinalizeInvoiceRole(role.role);

  async function finalizeSelectedInvoice() {
    if (!activePartnerFirmId || !finalizeInvoice) return;
    setFinalizingInvoiceId(finalizeInvoice.id);
    setFinalizeError("");
    try {
      const next = await financeInvoicesApi.finalize(activePartnerFirmId, finalizeInvoice.id);
      await invoices.refresh();
      setFinalizeInvoice(null);
      push({ tone: "success", title: "Invoice finalized", description: next.invoiceNumber });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong, please try again later";
      setFinalizeError(message);
      push({ tone: "error", title: "Invoice finalization failed", description: message });
    } finally {
      setFinalizingInvoiceId("");
    }
  }

  if (!activePartnerFirmId) {
    return <EmptyState>Select a firm to view invoices.</EmptyState>;
  }

  return (
    <PartnersPageShell>
      <PartnersPageHeader
        title="Invoices"
        description="Review generated invoices, finalize drafts, and print GST-ready invoice copies."
        actions={
          <Button type="button" variant="outline" className="h-10 px-3 text-sm" onClick={() => invoices.refresh()}>
            Refresh
          </Button>
        }
      />

      <InvoiceFilters filters={filters} onChange={setFilters} />

      <PartnersTableCard>
        <InvoiceList
          invoices={visibleInvoices}
          loading={invoices.loading}
          error={invoices.error}
          canFinalize={canFinalize}
          finalizingInvoiceId={finalizingInvoiceId}
          onRetry={() => void invoices.refresh().catch(() => undefined)}
          onPreview={setPreviewInvoice}
          onFinalize={(invoice) => {
            setFinalizeError("");
            setFinalizeInvoice(invoice);
          }}
        />
      </PartnersTableCard>

      <InvoicePreviewDialog
        invoice={previewInvoice}
        firm={activeFirm}
        open={Boolean(previewInvoice)}
        onClose={() => setPreviewInvoice(null)}
      />
      <FinalizeInvoiceDialog
        invoice={finalizeInvoice}
        open={Boolean(finalizeInvoice)}
        loading={Boolean(finalizingInvoiceId)}
        error={finalizeError}
        onClose={() => {
          if (!finalizingInvoiceId) setFinalizeInvoice(null);
        }}
        onConfirm={() => void finalizeSelectedInvoice()}
      />
    </PartnersPageShell>
  );
}
