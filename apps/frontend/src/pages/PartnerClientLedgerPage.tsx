import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { useParams } from "react-router-dom";
import { useAppState } from "@app/providers/AppStateProvider";
import { Button } from "@components/ui/button";
import { EmptyState } from "@shared/ui/molecules/EmptyState";
import {
  PartnersPageHeader,
  PartnersPageShell,
  PartnersTableCard,
} from "@features/partners/layout/PartnersPageLayout";
import { usePartnerClientBusinesses } from "@entities/partners/hooks";
import { usePartnerClientLedger } from "@features/partners/finance/ledger/hooks";
import { LedgerFilters } from "@features/partners/finance/ledger/components/LedgerFilters";
import { LedgerSummaryStrip } from "@features/partners/finance/ledger/components/LedgerSummaryStrip";
import { LedgerTable } from "@features/partners/finance/ledger/components/LedgerTable";
import { ExportJobDialog } from "@features/partners/jobs/components/ExportJobDialog";

export function PartnerClientLedgerPage() {
  const { clientId = "" } = useParams();
  const { activePartnerFirmId } = useAppState();
  const clients = usePartnerClientBusinesses(activePartnerFirmId, "");
  const [filters, setFilters] = useState({ clientBusinessId: clientId, fromDate: "", toDate: "" });
  const [exportOpen, setExportOpen] = useState(false);
  const ledger = usePartnerClientLedger(activePartnerFirmId, filters);
  const selectedClient = useMemo(
    () => clients.items.find((client) => client.id === filters.clientBusinessId),
    [clients.items, filters.clientBusinessId],
  );

  function exportCsv() {
    const header = ["Date", "Type", "Reference", "Description", "Debit", "Credit", "Balance"];
    const rows = ledger.items.map((entry) => [
      entry.entryDate,
      entry.type,
      entry.referenceNumber,
      entry.description,
      String(entry.debitAmount),
      String(entry.creditAmount),
      String(entry.runningBalance),
    ]);
    const csv = [header, ...rows].map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `client-ledger-${selectedClient?.businessName || "all"}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (!activePartnerFirmId) {
    return <EmptyState>Select a firm to view client ledger.</EmptyState>;
  }

  return (
    <PartnersPageShell>
      <PartnersPageHeader
        title="Client Ledger"
        description="Track invoice debits, payment credits, notes, and running balance by client."
        actions={
          <Button
            type="button"
            variant="outline"
            className="h-10 px-3 text-sm"
            onClick={() => setExportOpen(true)}
            disabled={ledger.items.length === 0}
          >
            <Download className="mr-1.5 h-4 w-4" />
            Export CSV
          </Button>
        }
      />
      <LedgerFilters value={filters} clients={clients.items} onChange={setFilters} />
      <LedgerSummaryStrip entries={ledger.items} />
      <PartnersTableCard>
        <LedgerTable
          entries={ledger.items}
          loading={ledger.loading}
          error={ledger.error}
          onRetry={() => void ledger.refresh().catch(() => undefined)}
        />
      </PartnersTableCard>
      <ExportJobDialog
        open={exportOpen}
        title="Export Client Ledger"
        description="Generating ledger export. You can continue working while this is prepared."
        completedLabel="Client ledger export is ready."
        onClose={() => setExportOpen(false)}
        onDownload={() => exportCsv()}
      />
    </PartnersPageShell>
  );
}
