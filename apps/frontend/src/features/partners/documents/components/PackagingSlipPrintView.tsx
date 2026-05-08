import type { PartnerClientBusiness, PartnerClientOutlet, PartnerFirm } from "@shared/types/domain";
import type { PartnerOrder } from "@features/partners/orders/types";

type Props = {
  firm?: PartnerFirm;
  order: PartnerOrder;
  business?: PartnerClientBusiness;
  outlet?: PartnerClientOutlet;
};

function value(text?: string | null) {
  return text?.trim() || "-";
}

export function PackagingSlipPrintView({ firm, order, business, outlet }: Props) {
  const lines = order.requestedItems?.length ? order.requestedItems : order.items;

  return (
    <div className="packaging-slip-print-scope bg-white text-slate-950">
      <style>
        {`
          @media print {
            body * { visibility: hidden; }
            .packaging-slip-print-scope, .packaging-slip-print-scope * { visibility: visible; }
            .packaging-slip-print-scope { position: absolute; inset: 0 auto auto 0; width: 100%; }
            .document-no-print { display: none !important; }
            @page { size: A4; margin: 10mm; }
          }
        `}
      </style>
      <div className="mx-auto grid max-w-[820px] gap-4 p-5 text-[12px] leading-5 print:max-w-none print:p-0">
        <header className="flex items-start justify-between gap-6 border-b border-slate-300 pb-3">
          <div>
            <p className="text-xl font-semibold tracking-normal">Packaging Slip</p>
            <p className="mt-1 text-slate-600">Warehouse pick and pack document</p>
          </div>
          <div className="text-right">
            <p className="text-base font-semibold">{order.orderNumber}</p>
            <p>Dispatch date: {value(order.dispatchedAt?.slice(0, 10))}</p>
            <p>Status: {order.status}</p>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-4">
          <div className="rounded border border-slate-300 p-3">
            <p className="mb-1 text-[11px] font-semibold uppercase text-slate-500">Firm</p>
            <p className="font-semibold">{value(firm?.tradeName || firm?.name)}</p>
            <p>{value(firm?.billingAddress)}</p>
          </div>
          <div className="rounded border border-slate-300 p-3">
            <p className="mb-1 text-[11px] font-semibold uppercase text-slate-500">Client / Outlet</p>
            <p className="font-semibold">{value(business?.businessName || order.clientBusinessName)}</p>
            <p>{value(outlet?.outletName || order.clientOutletName)}</p>
            <p>{value(outlet?.address)}</p>
          </div>
        </section>

        <table className="w-full border-collapse text-left text-[11px]">
          <thead>
            <tr className="border border-slate-300 bg-slate-100">
              <th className="border border-slate-300 px-2 py-1.5">Item</th>
              <th className="border border-slate-300 px-2 py-1.5">SKU / Source</th>
              <th className="border border-slate-300 px-2 py-1.5 text-right">Ordered</th>
              <th className="border border-slate-300 px-2 py-1.5 text-right">Packed</th>
              <th className="border border-slate-300 px-2 py-1.5 text-right">Checked</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr key={line.id}>
                <td className="border border-slate-300 px-2 py-1.5 font-medium">{line.itemName}</td>
                <td className="border border-slate-300 px-2 py-1.5">{value(line.itemCode)}</td>
                <td className="border border-slate-300 px-2 py-1.5 text-right">{line.quantity}</td>
                <td className="border border-slate-300 px-2 py-1.5 text-right">{line.quantity}</td>
                <td className="border border-slate-300 px-2 py-1.5 text-right">□</td>
              </tr>
            ))}
          </tbody>
        </table>

        <footer className="mt-4 grid grid-cols-3 gap-4 text-slate-600">
          <p>Picked by: __________________</p>
          <p>Packed by: __________________</p>
          <p>Checked by: __________________</p>
        </footer>
      </div>
    </div>
  );
}
