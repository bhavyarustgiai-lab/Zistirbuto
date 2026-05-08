import type { PartnerFirm, PartnerInvoice } from "@shared/types/domain";
import {
  fallbackText,
  formatCurrency,
  formatDate,
  formatNumber,
  formatPercent,
  getInvoiceFinalTotal,
  getInvoiceOutstanding,
  getInvoiceTaxableAmount,
  getInvoiceTaxTotal,
  getLineDiscountAmount,
  getLineTaxableAmount,
} from "../utils";

type Props = {
  invoice: PartnerInvoice;
  firm?: PartnerFirm;
};

function value(text?: string | null) {
  return text?.trim() || fallbackText;
}

export function InvoicePrintView({ invoice, firm }: Props) {
  const sellerName = invoice.firmName || firm?.tradeName || firm?.name;
  const sellerGstin = invoice.firmGstin || firm?.gstin;
  const sellerAddress = invoice.firmBillingAddress || firm?.billingAddress;

  return (
    <div className="invoice-print-scope bg-white text-slate-950">
      <style>
        {`
          @media print {
            body * { visibility: hidden; }
            .invoice-print-scope, .invoice-print-scope * { visibility: visible; }
            .invoice-print-scope { position: absolute; inset: 0 auto auto 0; width: 100%; padding: 0; }
            .invoice-no-print { display: none !important; }
            @page { size: A4 landscape; margin: 10mm; }
          }
        `}
      </style>
      <div className="mx-auto grid max-w-[1120px] gap-4 p-5 text-[12px] leading-5 print:max-w-none print:p-0">
        <header className="flex items-start justify-between gap-6 border-b border-slate-300 pb-3">
          <div>
            <p className="text-xl font-semibold tracking-normal">Tax Invoice</p>
            <p className="mt-1 text-slate-600">Computer generated invoice</p>
          </div>
          <div className="text-right">
            <p className="text-base font-semibold">{invoice.invoiceNumber}</p>
            <p>Invoice date: {formatDate(invoice.invoiceDate)}</p>
            <p>Due date: {formatDate(invoice.dueDate || invoice.invoiceDate)}</p>
            <p>Status: {invoice.status}</p>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-4">
          <div className="rounded border border-slate-300 p-3">
            <p className="mb-2 text-[11px] font-semibold uppercase text-slate-500">Seller</p>
            <p className="font-semibold">{value(sellerName)}</p>
            <p>GSTIN: {value(sellerGstin)}</p>
            <p>{value(sellerAddress)}</p>
          </div>
          <div className="rounded border border-slate-300 p-3">
            <p className="mb-2 text-[11px] font-semibold uppercase text-slate-500">Buyer</p>
            <p className="font-semibold">{value(invoice.billToName || invoice.clientBusinessName)}</p>
            <p>GSTIN: {value(invoice.billToGstin || invoice.clientGstin)}</p>
            <p>{value(invoice.billToAddress || invoice.clientBillingAddress)}</p>
            <p className="mt-2">Ship to: {value(invoice.deliverToName || invoice.clientOutletName)}</p>
            <p>{value(invoice.deliverToAddress || invoice.outletShippingAddress)}</p>
            <p>Place of supply: {value(invoice.placeOfSupply || invoice.clientState)}</p>
          </div>
        </section>

        <section className="grid grid-cols-4 gap-3 rounded border border-slate-300 p-3">
          <div>
            <p className="text-[11px] uppercase text-slate-500">Client</p>
            <p className="font-medium">{invoice.clientBusinessName}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase text-slate-500">Outlet</p>
            <p className="font-medium">{invoice.clientOutletName}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase text-slate-500">Order Ref</p>
            <p className="font-medium">{value(invoice.dispatchReference || invoice.orderId)}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase text-slate-500">Payment Terms</p>
            <p className="font-medium">{value(invoice.paymentTerms)}</p>
          </div>
        </section>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-[11px]">
            <thead>
              <tr className="border border-slate-300 bg-slate-100">
                <th className="border border-slate-300 px-2 py-1.5">Item</th>
                <th className="border border-slate-300 px-2 py-1.5">SKU</th>
                <th className="border border-slate-300 px-2 py-1.5">HSN/SAC</th>
                <th className="border border-slate-300 px-2 py-1.5 text-right">Qty</th>
                <th className="border border-slate-300 px-2 py-1.5">Unit</th>
                <th className="border border-slate-300 px-2 py-1.5 text-right">MRP</th>
                <th className="border border-slate-300 px-2 py-1.5 text-right">Sell %</th>
                <th className="border border-slate-300 px-2 py-1.5 text-right">Rate</th>
                <th className="border border-slate-300 px-2 py-1.5 text-right">Discount</th>
                <th className="border border-slate-300 px-2 py-1.5 text-right">Taxable</th>
                <th className="border border-slate-300 px-2 py-1.5 text-right">GST %</th>
                <th className="border border-slate-300 px-2 py-1.5 text-right">CGST</th>
                <th className="border border-slate-300 px-2 py-1.5 text-right">SGST</th>
                <th className="border border-slate-300 px-2 py-1.5 text-right">IGST</th>
                <th className="border border-slate-300 px-2 py-1.5 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item) => (
                <tr key={item.id}>
                  <td className="border border-slate-300 px-2 py-1.5 font-medium">{item.itemName}</td>
                  <td className="border border-slate-300 px-2 py-1.5">{value(item.sku || item.itemCode)}</td>
                  <td className="border border-slate-300 px-2 py-1.5">{value(item.hsnSac)}</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-right">{formatNumber(item.quantity)}</td>
                  <td className="border border-slate-300 px-2 py-1.5">{value(item.unit)}</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-right">{formatCurrency(item.mrp)}</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-right">{formatPercent(item.sellMarginPercentage ?? item.discountPercentage)}</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-right">{formatCurrency(item.rate)}</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-right">{formatCurrency(getLineDiscountAmount(item))}</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-right">{formatCurrency(getLineTaxableAmount(item))}</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-right">{formatPercent(item.gstPercentage)}</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-right">{formatCurrency(item.cgstAmount)}</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-right">{formatCurrency(item.sgstAmount)}</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-right">{formatCurrency(item.igstAmount)}</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-right font-medium">{formatCurrency(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <section className="ml-auto grid w-full max-w-sm gap-1 rounded border border-slate-300 p-3">
          <SummaryRow label="Subtotal" value={formatCurrency(invoice.subtotalAmount)} />
          <SummaryRow label="Discount" value={formatCurrency(invoice.discountAmount)} />
          <SummaryRow label="Taxable Amount" value={formatCurrency(getInvoiceTaxableAmount(invoice))} />
          <SummaryRow label="CGST" value={formatCurrency(invoice.cgstAmount)} />
          <SummaryRow label="SGST" value={formatCurrency(invoice.sgstAmount)} />
          <SummaryRow label="IGST" value={formatCurrency(invoice.igstAmount)} />
          <SummaryRow label="Total GST" value={formatCurrency(getInvoiceTaxTotal(invoice))} />
          <SummaryRow label="Round Off" value={formatCurrency(invoice.roundOffAmount)} />
          <SummaryRow label="Additional Charges" value={formatCurrency(invoice.additionalChargesAmount)} />
          <SummaryRow label="Final Total" value={formatCurrency(getInvoiceFinalTotal(invoice))} strong />
          <SummaryRow label="Paid Amount" value={formatCurrency(invoice.paidAmount)} />
          <SummaryRow label="Outstanding Amount" value={formatCurrency(getInvoiceOutstanding(invoice))} />
        </section>

        {invoice.notes ? (
          <section className="rounded border border-slate-300 p-3">
            <p className="text-[11px] font-semibold uppercase text-slate-500">Notes / Terms</p>
            <p className="mt-1">{invoice.notes}</p>
          </section>
        ) : null}
      </div>
    </div>
  );
}

function SummaryRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={strong ? "flex justify-between gap-4 border-t border-slate-300 pt-1 font-semibold" : "flex justify-between gap-4"}>
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
