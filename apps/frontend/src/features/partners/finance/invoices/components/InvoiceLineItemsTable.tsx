import type { PartnerInvoiceItem } from "@shared/types/domain";
import {
  fallbackText,
  formatCurrency,
  formatNumber,
  formatPercent,
  getLineDiscountAmount,
  getLineTaxableAmount,
} from "../utils";

type Props = {
  items: PartnerInvoiceItem[];
};

function value(text?: string | null) {
  return text?.trim() || fallbackText;
}

export function InvoiceLineItemsTable({ items }: Props) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full min-w-[1420px] text-sm">
        <thead className="text-left text-slate-500">
          <tr className="border-b border-slate-200">
            <th className="px-3 py-3">Item</th>
            <th className="px-3 py-3">SKU</th>
            <th className="px-3 py-3">HSN/SAC</th>
            <th className="px-3 py-3 text-right">Qty</th>
            <th className="px-3 py-3">Unit</th>
            <th className="px-3 py-3 text-right">MRP</th>
            <th className="px-3 py-3 text-right">Sell %</th>
            <th className="px-3 py-3 text-right">Rate</th>
            <th className="px-3 py-3 text-right">Discount</th>
            <th className="px-3 py-3 text-right">Taxable</th>
            <th className="px-3 py-3 text-right">GST %</th>
            <th className="px-3 py-3 text-right">CGST</th>
            <th className="px-3 py-3 text-right">SGST</th>
            <th className="px-3 py-3 text-right">IGST</th>
            <th className="px-3 py-3 text-right">Line Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-slate-100 text-slate-800">
              <td className="px-3 py-3 font-medium text-slate-950">{item.itemName}</td>
              <td className="px-3 py-3">{value(item.sku || item.itemCode)}</td>
              <td className="px-3 py-3">{value(item.hsnSac)}</td>
              <td className="px-3 py-3 text-right tabular-nums">{formatNumber(item.quantity)}</td>
              <td className="px-3 py-3">{value(item.unit)}</td>
              <td className="px-3 py-3 text-right tabular-nums">{formatCurrency(item.mrp)}</td>
              <td className="px-3 py-3 text-right tabular-nums">{formatPercent(item.sellMarginPercentage ?? item.discountPercentage)}</td>
              <td className="px-3 py-3 text-right tabular-nums">{formatCurrency(item.rate)}</td>
              <td className="px-3 py-3 text-right tabular-nums">{formatCurrency(getLineDiscountAmount(item))}</td>
              <td className="px-3 py-3 text-right tabular-nums">{formatCurrency(getLineTaxableAmount(item))}</td>
              <td className="px-3 py-3 text-right tabular-nums">{formatPercent(item.gstPercentage)}</td>
              <td className="px-3 py-3 text-right tabular-nums">{formatCurrency(item.cgstAmount)}</td>
              <td className="px-3 py-3 text-right tabular-nums">{formatCurrency(item.sgstAmount)}</td>
              <td className="px-3 py-3 text-right tabular-nums">{formatCurrency(item.igstAmount)}</td>
              <td className="px-3 py-3 text-right font-medium tabular-nums text-slate-950">{formatCurrency(item.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
