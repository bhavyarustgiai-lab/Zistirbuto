import { Printer } from "lucide-react";
import { useState } from "react";
import { Button } from "@components/ui/button";
import { PartnerStatusBadge } from "@features/partners/PartnerStatusBadge";
import { CreditNotePrintView } from "@features/partners/documents/components/CreditNotePrintView";
import { DocumentPrintDialog } from "@features/partners/documents/components/DocumentPrintDialog";
import { EmptyState } from "@shared/ui/molecules/empty-state";
import type { PartnerOrderReturn } from "../types";

type OrderReturnsTableProps = {
  returns: PartnerOrderReturn[];
  voidingReturnId?: string;
  onVoidReturn?: (item: PartnerOrderReturn) => void;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatItemQuantity(value: number) {
  return value.toLocaleString("en-IN");
}

export function OrderReturnsTable({ returns, voidingReturnId = "", onVoidReturn }: OrderReturnsTableProps) {
  const [printingReturn, setPrintingReturn] = useState<PartnerOrderReturn | null>(null);

  if (returns.length === 0) {
    return <EmptyState>No returns have been created for this order.</EmptyState>;
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full min-w-[1040px] text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr className="border-b border-slate-200">
              <th className="px-3 py-3">Return No.</th>
              <th className="px-3 py-3">Date</th>
              <th className="px-3 py-3">Returned items</th>
              <th className="px-3 py-3">Credit Note No.</th>
              <th className="px-3 py-3 text-right">Credit amount</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {returns.map((item) => (
              <tr key={item.id} className="border-b border-slate-100 text-slate-700">
                <td className="px-3 py-3 font-medium text-slate-900">{item.returnNumber}</td>
                <td className="px-3 py-3">{formatDate(item.returnDate)}</td>
                <td className="px-3 py-3">
                  <div className="grid gap-1.5">
                    {(item.lines ?? []).length > 0 ? (
                      item.lines.map((line) => (
                        <div key={line.id} className="flex items-start justify-between gap-4 rounded-md py-0.5">
                          <span className="min-w-0">
                            <span className="block font-medium text-slate-900">{line.itemName}</span>
                          </span>
                          <span className="shrink-0 text-right tabular-nums text-slate-600">
                            {formatItemQuantity(line.acceptedQuantity)} returned
                          </span>
                        </div>
                      ))
                    ) : (
                      <span className="text-slate-500">No item details available</span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-3 font-medium text-slate-900">{item.creditNoteNumber || "-"}</td>
                <td className="px-3 py-3 text-right tabular-nums">{formatCurrency(item.totalCreditAmount)}</td>
                <td className="px-3 py-3">
                  <PartnerStatusBadge status={item.status} />
                </td>
                <td className="px-3 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    {item.creditNoteNumber ? (
                      <Button variant="ghost" className="h-8 px-2 text-xs" onClick={() => setPrintingReturn(item)}>
                        <Printer className="mr-1 h-3.5 w-3.5" />
                        Print
                      </Button>
                    ) : null}
                    {onVoidReturn && item.status === "ISSUED" ? (
                      <Button
                        variant="outline"
                        className="h-8"
                        disabled={Boolean(voidingReturnId)}
                        onClick={() => onVoidReturn(item)}
                      >
                        {voidingReturnId === item.id ? "Voiding..." : "Void Return"}
                      </Button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <DocumentPrintDialog
        open={Boolean(printingReturn)}
        title={printingReturn?.creditNoteNumber ? `Print ${printingReturn.creditNoteNumber}` : "Print Credit Note"}
        onClose={() => setPrintingReturn(null)}
      >
        {printingReturn ? <CreditNotePrintView note={printingReturn} /> : null}
      </DocumentPrintDialog>
    </>
  );
}
