import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { useAppState } from "@app/providers/AppStateProvider";
import { usePartnerReceivables } from "@entities/partners/hooks";
import { Button } from "@components/ui/button";
import { Card, CardContent } from "@components/ui/card";
import { Input } from "@components/ui/input";
import { Select } from "@components/ui/select";
import { EmptyState } from "@shared/ui/molecules/EmptyState";
import { ErrorState } from "@shared/ui/molecules/error-state";
import { LoadingState } from "@shared/ui/molecules/loading-state";
import { ReceivablesSummaryTable } from "@features/partners/ReceivablesSummaryTable";
import { ExportJobDialog } from "@features/partners/jobs/components/ExportJobDialog";
import {
  PartnersPageFilters,
  PartnersPageHeader,
  PartnersPageShell,
  PartnersSummaryCardGrid,
  PartnersTableCard,
} from "@features/partners/layout/PartnersPageLayout";

function formatMoney(value: number) {
  return value.toLocaleString("en-IN");
}

export function PartnersReceivablesPage() {
  const { activePartnerFirmId } = useAppState();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"ALL" | "OUTSTANDING" | "OVERDUE" | "UNPAID" | "PARTIALLY_PAID" | "PAID">("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [expandedBusinessId, setExpandedBusinessId] = useState("");
  const [exportOpen, setExportOpen] = useState(false);
  const receivables = usePartnerReceivables(activePartnerFirmId, {
    search,
    status,
    fromDate,
    toDate,
    overdueOnly: status === "OVERDUE",
  });

  const cards = useMemo(() => {
    const data = receivables.data;
    return [
      { label: "Total receivables", value: formatMoney(data?.totalReceivables ?? 0) },
      { label: "Overdue receivables", value: formatMoney(data?.overdueReceivables ?? 0) },
      { label: "Invoices due today", value: String(data?.invoicesDueToday ?? 0) },
      { label: "Clients with outstanding", value: String(data?.clientsWithDues ?? 0) },
    ];
  }, [receivables.data]);

  function exportCsv() {
    if (!receivables.data) return;
    const rows = receivables.data.businesses.flatMap((business) =>
      business.invoices.map((invoice) => [
        invoice.invoiceNumber,
        invoice.clientName || business.businessName,
        invoice.outletName,
        invoice.invoiceDate,
        invoice.dueDate,
        invoice.amount,
        invoice.paidAmount,
        invoice.outstanding,
        invoice.paymentStatus || invoice.status,
        invoice.status === "OVERDUE" ? invoice.agingBucket || "0-30" : "Current",
      ]),
    );
    const header = ["Invoice No", "Client", "Outlet", "Invoice Date", "Due Date", "Total", "Paid", "Outstanding", "Payment Status", "Aging Bucket"];
    const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "receivables.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (!activePartnerFirmId) {
    return <EmptyState>Select a firm to view receivables.</EmptyState>;
  }

  return (
    <PartnersPageShell>
      <PartnersPageHeader
        title="Receivables"
        description="Outstanding client dues grouped by business, outlet, invoice total, paid amount, due date, and aging."
        actions={
          <Button
            type="button"
            variant="outline"
            className="h-10 px-3 text-sm"
            disabled={!receivables.data || receivables.data.businesses.length === 0}
            onClick={() => setExportOpen(true)}
          >
            <Download className="mr-1.5 h-4 w-4" />
            Export CSV
          </Button>
        }
      />

      <PartnersSummaryCardGrid className="xl:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label} className="border-slate-200 shadow-sm">
            <CardContent className="flex min-h-[120px] flex-col justify-between p-4 sm:min-h-[132px] sm:pt-6">
              <p className="text-sm text-slate-500">{card.label}</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </PartnersSummaryCardGrid>

      <PartnersPageFilters className="md:grid-cols-2 xl:grid xl:grid-cols-[minmax(260px,1.3fr)_220px_180px_180px] xl:items-center">
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search client or invoice" />
        <Select
          value={status}
          onValueChange={(value) => setStatus(value as "ALL" | "OUTSTANDING" | "OVERDUE" | "UNPAID" | "PARTIALLY_PAID" | "PAID")}
          options={[
            { value: "ALL", label: "All statuses" },
            { value: "OUTSTANDING", label: "Outstanding only" },
            { value: "OVERDUE", label: "Overdue only" },
            { value: "UNPAID", label: "Unpaid" },
            { value: "PARTIALLY_PAID", label: "Partially paid" },
            { value: "PAID", label: "Paid" },
          ]}
        />
        <Input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
        <Input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
      </PartnersPageFilters>

      <PartnersTableCard>
        {receivables.loading ? (
          <LoadingState label="Loading receivables..." />
        ) : receivables.error ? (
          <div className="p-6">
            <ErrorState message={receivables.error.message} onRetry={() => void receivables.refresh().catch(() => undefined)} />
          </div>
        ) : !receivables.data || receivables.data.businesses.length === 0 ? (
          <div className="p-8">
            <EmptyState>No receivable activity matches the current filters.</EmptyState>
          </div>
        ) : (
          <div className="p-0">
            <ReceivablesSummaryTable
              data={receivables.data}
              expandedBusinessId={expandedBusinessId}
              onToggle={(businessId) => setExpandedBusinessId((current) => (current === businessId ? "" : businessId))}
            />
          </div>
        )}
      </PartnersTableCard>
      <ExportJobDialog
        open={exportOpen}
        title="Export Receivables"
        description="Generating receivables export. You can continue working while this is prepared."
        completedLabel="Receivables export is ready."
        onClose={() => setExportOpen(false)}
        onDownload={() => exportCsv()}
      />
    </PartnersPageShell>
  );
}
