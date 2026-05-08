import { Card, CardContent } from "@components/ui/card";
import type { PartnerFirm, PartnerInvoice } from "@shared/types/domain";
import { fallbackText } from "../utils";

type Props = {
  invoice: PartnerInvoice;
  firm?: PartnerFirm;
};

function value(text?: string | null) {
  return text?.trim() || fallbackText;
}

export function InvoiceSummaryPanel({ invoice, firm }: Props) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Seller</p>
          <div className="mt-3 grid gap-1 text-sm text-slate-700">
            <p className="font-medium text-slate-950">{value(invoice.firmName || firm?.tradeName || firm?.name)}</p>
            <p>GSTIN: {value(invoice.firmGstin || firm?.gstin)}</p>
            <p>{value(invoice.firmBillingAddress || firm?.billingAddress)}</p>
          </div>
        </CardContent>
      </Card>
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Buyer</p>
          <div className="mt-3 grid gap-1 text-sm text-slate-700">
            <p className="font-medium text-slate-950">{value(invoice.billToName || invoice.clientBusinessName)}</p>
            <p>GSTIN: {value(invoice.billToGstin || invoice.clientGstin)}</p>
            <p>{value(invoice.billToAddress || invoice.clientBillingAddress)}</p>
            <p className="pt-2">Outlet: {value(invoice.deliverToName || invoice.clientOutletName)}</p>
            <p>Shipping: {value(invoice.deliverToAddress || invoice.outletShippingAddress)}</p>
            <p>Place of supply: {value(invoice.placeOfSupply || invoice.clientState)}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
