import { useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import { useParams } from "react-router-dom";
import { useAppState } from "@app/providers/AppStateProvider";
import { usePartnerSupplierLedger, usePartnerSuppliers } from "@entities/partners/hooks";
import { SupplierLedgerTable } from "@features/partners/finance/supplier-ledger/components/SupplierLedgerTable";
import { formatMoney } from "@features/partners/finance/payables/utils";
import { ExportJobDialog } from "@features/partners/jobs/components/ExportJobDialog";
import {
  PartnersPageFilters,
  PartnersPageHeader,
  PartnersPageShell,
  PartnersTableCard,
} from "@features/partners/layout/PartnersPageLayout";
import { Button } from "@components/ui/button";
import { Card, CardContent } from "@components/ui/card";
import { Input } from "@components/ui/input";
import { Select } from "@components/ui/select";
import { EmptyState } from "@shared/ui/molecules/empty-state";
import { ErrorState } from "@shared/ui/molecules/error-state";
import { LoadingState } from "@shared/ui/molecules/loading-state";

export function PartnerSupplierLedgerPage() {
  const { activePartnerFirmId } = useAppState();
  const { supplierId = "" } = useParams();
  const [selectedSupplierId, setSelectedSupplierId] = useState(supplierId);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [exportOpen, setExportOpen] = useState(false);
  const suppliers = usePartnerSuppliers(activePartnerFirmId, "");
  const ledger = usePartnerSupplierLedger(activePartnerFirmId, { supplierId: selectedSupplierId, fromDate, toDate });
  const selectedSupplier = suppliers.items.find((supplier) => supplier.id === selectedSupplierId);
  const balance = ledger.items.at(-1)?.runningBalance ?? 0;
  const totalDebits = useMemo(() => ledger.items.reduce((sum, entry) => sum + entry.debitAmount, 0), [ledger.items]);
  const totalCredits = useMemo(() => ledger.items.reduce((sum, entry) => sum + entry.creditAmount, 0), [ledger.items]);

  function exportCsv() {
    const rows = [
      ["Date", "Type", "Reference", "Description", "Debit", "Credit", "Balance"],
      ...ledger.items.map((entry) => [entry.entryDate, entry.type, entry.referenceNumber, entry.description, entry.debitAmount, entry.creditAmount, entry.runningBalance]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `supplier-ledger-${selectedSupplier?.supplierName || "all"}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (!activePartnerFirmId) {
    return <EmptyState>Select a firm to view supplier ledger.</EmptyState>;
  }

  return (
    <PartnersPageShell>
      <PartnersPageHeader
        title="Supplier Ledger"
        description="Supplier-wise running balance for invoices and payments."
        actions={
          <Button
            variant="outline"
            className="h-11 px-3 text-sm"
            disabled={ledger.items.length === 0}
            onClick={() => setExportOpen(true)}
          >
            <Download className="mr-1 h-4 w-4" />
            Export CSV
          </Button>
        }
      />

      <div className="grid gap-3 md:grid-cols-3">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase text-slate-500">Balance</p>
            <p className="mt-1 text-xl font-semibold text-slate-950">{formatMoney(balance)}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase text-slate-500">Debits</p>
            <p className="mt-1 text-xl font-semibold text-slate-950">{formatMoney(totalDebits)}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase text-slate-500">Credits</p>
            <p className="mt-1 text-xl font-semibold text-slate-950">{formatMoney(totalCredits)}</p>
          </CardContent>
        </Card>
      </div>

      <PartnersPageFilters className="md:grid-cols-[minmax(0,1fr)_160px_160px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
          <Select
            value={selectedSupplierId}
            onValueChange={setSelectedSupplierId}
            options={[{ value: "", label: "All suppliers" }, ...suppliers.items.map((supplier) => ({ value: supplier.id, label: supplier.supplierName }))]}
          />
        </div>
        <Input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
        <Input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
      </PartnersPageFilters>

      <PartnersTableCard>
        {ledger.loading ? (
          <LoadingState label="Loading supplier ledger..." />
        ) : ledger.error ? (
          <div className="p-6">
            <ErrorState message={ledger.error.message} onRetry={() => void ledger.refresh()} />
          </div>
        ) : ledger.items.length === 0 ? (
          <div className="p-8">
            <EmptyState title="No supplier ledger entries yet." description="Finalized supplier invoices and payments will appear here." />
          </div>
        ) : (
          <SupplierLedgerTable entries={ledger.items} />
        )}
      </PartnersTableCard>
      <ExportJobDialog
        open={exportOpen}
        title="Export Supplier Ledger"
        description="Generating supplier ledger export. You can continue working while this is prepared."
        completedLabel="Supplier ledger export is ready."
        onClose={() => setExportOpen(false)}
        onDownload={() => exportCsv()}
      />
    </PartnersPageShell>
  );
}
