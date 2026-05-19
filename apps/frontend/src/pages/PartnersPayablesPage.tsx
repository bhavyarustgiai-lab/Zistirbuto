import { useMemo, useState } from "react";
import { CreditCard, Plus, Search } from "lucide-react";
import { useAppState } from "@app/providers/AppStateProvider";
import { usePartnerPayables, usePartnerSuppliers } from "@entities/partners/hooks";
import { PayablesTable } from "@features/partners/finance/payables/components/PayablesTable";
import { SupplierInvoiceDialog } from "@features/partners/finance/payables/components/SupplierInvoiceDialog";
import { SupplierPaymentDialog } from "@features/partners/finance/payables/components/SupplierPaymentDialog";
import { formatMoney } from "@features/partners/finance/payables/utils";
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
import type { PartnerSupplierInvoice } from "@shared/types/domain";

const statusOptions = [
  { value: "ALL", label: "All statuses" },
  { value: "UNPAID", label: "Unpaid" },
  { value: "PARTIALLY_PAID", label: "Partially paid" },
  { value: "PAID", label: "Paid" },
  { value: "OVERDUE", label: "Overdue" },
  { value: "DRAFT", label: "Draft" },
];

export function PartnersPayablesPage() {
  const { activePartnerFirmId } = useAppState();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentInvoice, setPaymentInvoice] = useState<PartnerSupplierInvoice | null>(null);
  const [mutating, setMutating] = useState(false);
  const [actionError, setActionError] = useState("");
  const payables = usePartnerPayables(activePartnerFirmId, { search, status });
  const suppliers = usePartnerSuppliers(activePartnerFirmId, "");

  const summary = useMemo(
    () => [
      { label: "Total Payables", value: formatMoney(payables.data?.totalPayables ?? 0) },
      { label: "Overdue Payables", value: formatMoney(payables.data?.overduePayables ?? 0) },
      { label: "Due Today", value: String(payables.data?.invoicesDueToday ?? 0) },
    ],
    [payables.data],
  );

  if (!activePartnerFirmId) {
    return <EmptyState>Select a firm to view payables.</EmptyState>;
  }

  return (
    <PartnersPageShell>
      <PartnersPageHeader
        title="Payables"
        description="Track supplier invoices, outstanding amounts, and supplier payments."
        actions={
          <>
            <Button variant="outline" className="h-11 w-full px-4 text-sm sm:w-auto" onClick={() => {
              setPaymentInvoice(null);
              setShowPaymentDialog(true);
            }}>
              <CreditCard className="mr-1 h-4 w-4" />
              Record Supplier Payment
            </Button>
            <Button className="h-11 w-full px-4 text-sm sm:w-auto" onClick={() => setShowInvoiceDialog(true)}>
              <Plus className="mr-1 h-4 w-4" />
              Add Supplier Invoice
            </Button>
          </>
        }
      />

      <div className="grid gap-3 md:grid-cols-3">
        {summary.map((item) => (
          <Card key={item.label} className="border-slate-200 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs font-medium uppercase text-slate-500">{item.label}</p>
              <p className="mt-1 text-xl font-semibold text-slate-950">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <PartnersPageFilters className="md:grid-cols-[minmax(0,1fr)_220px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="Search supplier or invoice" />
        </div>
        <Select value={status} onValueChange={setStatus} options={statusOptions} />
      </PartnersPageFilters>

      {actionError ? <ErrorState title="Action failed" message={actionError} onRetry={() => setActionError("")} /> : null}

      <PartnersTableCard>
        {payables.loading ? (
          <LoadingState label="Loading payables..." />
        ) : payables.error ? (
          <div className="p-6">
            <ErrorState message={payables.error.message} onRetry={() => void payables.refresh()} />
          </div>
        ) : !payables.data || payables.data.invoices.length === 0 ? (
          <div className="p-8">
            <EmptyState title="No supplier invoices yet." description="Add supplier invoices for payables, or record supplier payments as advances." />
          </div>
        ) : (
          <PayablesTable
            invoices={payables.data.invoices}
            isMutating={mutating}
            onRecordPayment={(invoice) => {
              setPaymentInvoice(invoice);
              setShowPaymentDialog(true);
            }}
            onFinalize={async (invoiceId) => {
              setMutating(true);
              setActionError("");
              try {
                await payables.finalizeInvoice(invoiceId);
              } catch (err) {
                setActionError(err instanceof Error ? err.message : "Something went wrong, please try again later");
              } finally {
                setMutating(false);
              }
            }}
          />
        )}
      </PartnersTableCard>

      <SupplierInvoiceDialog
        open={showInvoiceDialog}
        suppliers={suppliers.items}
        onClose={() => setShowInvoiceDialog(false)}
        onSubmit={async (input) => {
          await payables.createInvoice(input);
        }}
      />
      <SupplierPaymentDialog
        open={showPaymentDialog}
        invoice={paymentInvoice}
        suppliers={suppliers.items}
        onClose={() => {
          setShowPaymentDialog(false);
          setPaymentInvoice(null);
        }}
        onSubmit={async (input) => {
          await payables.recordPayment(input);
        }}
      />
    </PartnersPageShell>
  );
}
