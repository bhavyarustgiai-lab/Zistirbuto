import type { PartnerCreditNote, PartnerSalesReturn } from "@shared/types/domain";

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value || 0);
}

function value(text?: string | null) {
  return text?.trim() || "-";
}

type PrintableCreditNote = PartnerCreditNote | PartnerSalesReturn;
type PrintableCreditNoteLine = {
  id: string;
  itemName?: string;
  quantity?: number;
  amount: number;
};

function isReturnNote(note: PrintableCreditNote): note is PartnerSalesReturn {
  return "returnNumber" in note;
}

export function CreditNotePrintView({ note }: { note: PrintableCreditNote }) {
  const creditNoteNumber = isReturnNote(note) ? note.creditNoteNumber || note.returnNumber : note.creditNoteNumber;
  const creditDate = isReturnNote(note) ? note.returnDate : note.creditDate;
  const relatedInvoiceNumber = isReturnNote(note) ? note.invoiceNumber : note.relatedInvoiceNumber;
  const salesReturnID = isReturnNote(note) ? note.returnNumber : note.salesReturnId;
  const totalAmount = isReturnNote(note) ? note.totalCreditAmount : note.totalAmount;
  const noteText = isReturnNote(note) ? note.notes : note.note;
  const lines: PrintableCreditNoteLine[] = isReturnNote(note)
    ? note.lines.map((line) => ({
        id: line.id,
        itemName: line.itemName || line.itemId,
        quantity: line.acceptedQuantity,
        amount: line.creditAmount,
      }))
    : note.lines.map((line) => ({
        id: line.id,
        itemName: line.itemName || line.itemId,
        quantity: line.quantity,
        amount: line.amount,
      }));

  return (
    <div className="credit-note-print-scope bg-white text-slate-950">
      <style>
        {`
          @media print {
            body * { visibility: hidden; }
            .credit-note-print-scope, .credit-note-print-scope * { visibility: visible; }
            .credit-note-print-scope { position: absolute; inset: 0 auto auto 0; width: 100%; }
            .document-no-print { display: none !important; }
            @page { size: A4; margin: 12mm; }
          }
        `}
      </style>
      <div className="mx-auto grid max-w-[820px] gap-4 p-5 text-[12px] leading-5 print:max-w-none print:p-0">
        <header className="flex items-start justify-between gap-6 border-b border-slate-300 pb-3">
          <div>
            <p className="text-xl font-semibold tracking-normal">Credit Note</p>
            <p className="mt-1 text-slate-600">Return / invoice adjustment</p>
          </div>
          <div className="text-right">
            <p className="text-base font-semibold">{creditNoteNumber}</p>
            <p>Credit date: {creditDate}</p>
            <p>Status: {note.status}</p>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-4">
          <div className="rounded border border-slate-300 p-3">
            <p className="mb-1 text-[11px] font-semibold uppercase text-slate-500">Client</p>
            <p className="font-semibold">{note.clientBusinessName}</p>
            <p>Outlet: {value(note.clientOutletName)}</p>
          </div>
          <div className="rounded border border-slate-300 p-3">
            <p className="mb-1 text-[11px] font-semibold uppercase text-slate-500">Original Reference</p>
            <p>Invoice: {value(relatedInvoiceNumber)}</p>
            <p>Return: {value(salesReturnID)}</p>
          </div>
        </section>

        <table className="w-full border-collapse text-left text-[11px]">
          <thead>
            <tr className="border border-slate-300 bg-slate-100">
              <th className="border border-slate-300 px-2 py-1.5">Item</th>
              <th className="border border-slate-300 px-2 py-1.5 text-right">Qty</th>
              <th className="border border-slate-300 px-2 py-1.5 text-right">Amount Reduced</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr key={line.id}>
                <td className="border border-slate-300 px-2 py-1.5 font-medium">{value(line.itemName)}</td>
                <td className="border border-slate-300 px-2 py-1.5 text-right">{line.quantity || "-"}</td>
                <td className="border border-slate-300 px-2 py-1.5 text-right">{formatMoney(line.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <section className="ml-auto grid w-full max-w-xs gap-1 rounded border border-slate-300 p-3">
          <div className="flex justify-between gap-4 font-semibold">
            <span>Total credit</span>
            <span>{formatMoney(totalAmount)}</span>
          </div>
        </section>

        {noteText ? (
          <section className="rounded border border-slate-300 p-3">
            <p className="text-[11px] font-semibold uppercase text-slate-500">Note</p>
            <p className="mt-1">{noteText}</p>
          </section>
        ) : null}
      </div>
    </div>
  );
}
