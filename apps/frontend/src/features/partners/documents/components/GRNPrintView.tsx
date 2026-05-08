import type { PartnerGoodsReceipt, PartnerPurchase } from "@shared/types/domain";

type Props = {
  receipt: PartnerGoodsReceipt;
  purchase?: PartnerPurchase | null;
};

function value(text?: string | null) {
  return text?.trim() || "-";
}

function formatDate(value?: string) {
  return value ? value.slice(0, 10) : "-";
}

export function GRNPrintView({ receipt, purchase }: Props) {
  return (
    <div className="grn-print-scope bg-white text-slate-950">
      <style>
        {`
          @media print {
            body * { visibility: hidden; }
            .grn-print-scope, .grn-print-scope * { visibility: visible; }
            .grn-print-scope { position: absolute; inset: 0 auto auto 0; width: 100%; }
            .document-no-print { display: none !important; }
            @page { size: A4; margin: 12mm; }
          }
        `}
      </style>
      <div className="mx-auto grid max-w-[820px] gap-4 p-5 text-[12px] leading-5 print:max-w-none print:p-0">
        <header className="flex items-start justify-between gap-6 border-b border-slate-300 pb-3">
          <div>
            <p className="text-xl font-semibold tracking-normal">Goods Receipt Note</p>
            <p className="mt-1 text-slate-600">Warehouse inward document</p>
          </div>
          <div className="text-right">
            <p className="text-base font-semibold">{receipt.grnNumber}</p>
            <p>Received date: {formatDate(receipt.receivedDate)}</p>
            <p>PO ref: {value(purchase?.purchaseNumber)}</p>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-4">
          <div className="rounded border border-slate-300 p-3">
            <p className="mb-1 text-[11px] font-semibold uppercase text-slate-500">Supplier</p>
            <p className="font-semibold">{receipt.supplierName}</p>
          </div>
          <div className="rounded border border-slate-300 p-3">
            <p className="mb-1 text-[11px] font-semibold uppercase text-slate-500">Purchase</p>
            <p className="font-semibold">{value(purchase?.purchaseNumber)}</p>
            <p>Expected inward: {formatDate(purchase?.expectedInwardDate)}</p>
          </div>
        </section>

        <table className="w-full border-collapse text-left text-[11px]">
          <thead>
            <tr className="border border-slate-300 bg-slate-100">
              <th className="border border-slate-300 px-2 py-1.5">Item</th>
              <th className="border border-slate-300 px-2 py-1.5">SKU</th>
              <th className="border border-slate-300 px-2 py-1.5 text-right">Ordered</th>
              <th className="border border-slate-300 px-2 py-1.5 text-right">Received</th>
              <th className="border border-slate-300 px-2 py-1.5 text-right">Damaged</th>
              <th className="border border-slate-300 px-2 py-1.5">Notes</th>
            </tr>
          </thead>
          <tbody>
            {receipt.items.map((item) => (
              <tr key={item.id}>
                <td className="border border-slate-300 px-2 py-1.5 font-medium">{item.itemName}</td>
                <td className="border border-slate-300 px-2 py-1.5">{value(item.sku)}</td>
                <td className="border border-slate-300 px-2 py-1.5 text-right">{item.orderedQuantity}</td>
                <td className="border border-slate-300 px-2 py-1.5 text-right">{item.receivedQuantity}</td>
                <td className="border border-slate-300 px-2 py-1.5 text-right">{item.damagedQuantity}</td>
                <td className="border border-slate-300 px-2 py-1.5">{value(item.notes)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {receipt.notes ? (
          <section className="rounded border border-slate-300 p-3">
            <p className="text-[11px] font-semibold uppercase text-slate-500">GRN Notes</p>
            <p className="mt-1">{receipt.notes}</p>
          </section>
        ) : null}

        <footer className="mt-4 grid grid-cols-3 gap-4 text-slate-600">
          <p>Received by: __________________</p>
          <p>Checked by: __________________</p>
          <p>Supplier sign: __________________</p>
        </footer>
      </div>
    </div>
  );
}
