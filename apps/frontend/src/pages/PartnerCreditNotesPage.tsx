import { useMemo, useState } from "react";
import { Printer, Search } from "lucide-react";
import { useAppState } from "@app/providers/AppStateProvider";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { EmptyState } from "@shared/ui/molecules/EmptyState";
import { PartnerStatusBadge } from "@features/partners/PartnerStatusBadge";
import { DocumentPrintDialog } from "@features/partners/documents/components/DocumentPrintDialog";
import { CreditNotePrintView } from "@features/partners/documents/components/CreditNotePrintView";
import {
  PartnersPageFilters,
  PartnersPageHeader,
  PartnersPageShell,
  PartnersTableCard,
} from "@features/partners/layout/PartnersPageLayout";
import { usePartnerCreditNotes } from "@entities/partners/hooks";
import type { PartnerCreditNote } from "@shared/types/domain";

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);
}

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

export function PartnerCreditNotesPage() {
  const { activePartnerFirmId } = useAppState();
  const creditNotes = usePartnerCreditNotes(activePartnerFirmId);
  const [query, setQuery] = useState("");
  const [printingNote, setPrintingNote] = useState<PartnerCreditNote | null>(null);

  const rows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return creditNotes.items;
    return creditNotes.items.filter((note) =>
      [
        note.creditNoteNumber,
        note.clientBusinessName,
        note.clientOutletName,
        note.relatedInvoiceNumber,
        note.salesReturnId,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedQuery)),
    );
  }, [creditNotes.items, query]);

  if (!activePartnerFirmId) {
    return <EmptyState>Select a firm to view credit notes.</EmptyState>;
  }

  return (
    <PartnersPageShell>
      <PartnersPageHeader
        title="Credit Notes"
        description="Issued invoice and return adjustments that reduce client balances."
      />

      <PartnersPageFilters className="md:grid-cols-[minmax(260px,1fr)]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="pl-9"
            placeholder="Search credit note, client, outlet, or invoice"
          />
        </div>
      </PartnersPageFilters>

      <PartnersTableCard>
        {rows.length === 0 ? (
          <div className="p-8">
            <EmptyState>No credit notes found. Credit notes are created from returns or invoice corrections.</EmptyState>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead className="bg-slate-50 text-left text-xs font-medium uppercase text-slate-500">
                <tr className="border-b border-slate-200">
                  <th className="px-4 py-3">Credit Note</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Outlet</th>
                  <th className="px-4 py-3">Invoice Ref</th>
                  <th className="px-4 py-3 text-right">Amount Reduced</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((note) => (
                  <tr key={note.id} className="border-b border-slate-100 text-slate-800 last:border-b-0">
                    <td className="px-4 py-3 font-medium text-slate-950">{note.creditNoteNumber}</td>
                    <td className="px-4 py-3">{formatDate(note.creditDate)}</td>
                    <td className="px-4 py-3">{note.clientBusinessName}</td>
                    <td className="px-4 py-3">{note.clientOutletName || "-"}</td>
                    <td className="px-4 py-3">{note.relatedInvoiceNumber || "-"}</td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums text-slate-950">{formatMoney(note.totalAmount)}</td>
                    <td className="px-4 py-3">
                      <PartnerStatusBadge status={note.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button type="button" variant="ghost" className="h-8 px-2 text-xs" onClick={() => setPrintingNote(note)}>
                        <Printer className="mr-1.5 h-3.5 w-3.5" />
                        Print
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PartnersTableCard>

      <DocumentPrintDialog
        open={Boolean(printingNote)}
        title={printingNote?.creditNoteNumber ? `Print ${printingNote.creditNoteNumber}` : "Print Credit Note"}
        onClose={() => setPrintingNote(null)}
      >
        {printingNote ? <CreditNotePrintView note={printingNote} /> : null}
      </DocumentPrintDialog>
    </PartnersPageShell>
  );
}
