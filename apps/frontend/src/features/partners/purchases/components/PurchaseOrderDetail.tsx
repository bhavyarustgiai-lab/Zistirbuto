import { ArrowLeft, PackageCheck, Printer, Send, XCircle } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@components/ui/button";
import { Card, CardContent } from "@components/ui/card";
import { DocumentPrintDialog } from "@features/partners/documents/components/DocumentPrintDialog";
import { GRNPrintView } from "@features/partners/documents/components/GRNPrintView";
import type { PartnerGoodsReceipt, PartnerPurchase } from "@shared/types/domain";
import { PurchaseStatusBadge } from "./PurchaseStatusBadge";
import { formatDate, formatMoney, remainingQuantity } from "../utils";

type Props = {
  purchase: PartnerPurchase;
  receipts: PartnerGoodsReceipt[];
  onOrder: () => void;
  onReceive: () => void;
  onCancel: () => void;
  isMutating?: boolean;
};

export function PurchaseOrderDetail({ purchase, receipts, onOrder, onReceive, onCancel, isMutating }: Props) {
  const canReceive = purchase.status === "ORDERED" || purchase.status === "PARTIALLY_RECEIVED";
  const [printingReceipt, setPrintingReceipt] = useState<PartnerGoodsReceipt | null>(null);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link to="/partners/purchases" className="mb-3 inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Purchases
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">{purchase.purchaseNumber}</h1>
            <PurchaseStatusBadge status={purchase.status} />
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {purchase.supplierName} · PO {formatDate(purchase.purchaseDate)} · Expected {formatDate(purchase.expectedInwardDate)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {purchase.status === "DRAFT" ? (
            <Button className="h-10 px-3 text-sm" disabled={isMutating} onClick={onOrder}>
              <Send className="mr-1 h-4 w-4" />
              Mark Ordered
            </Button>
          ) : null}
          {canReceive ? (
            <Button className="h-10 px-3 text-sm" disabled={isMutating} onClick={onReceive}>
              <PackageCheck className="mr-1 h-4 w-4" />
              Receive Stock
            </Button>
          ) : null}
          {purchase.status === "DRAFT" || purchase.status === "ORDERED" ? (
            <Button variant="outline" className="h-10 px-3 text-sm text-rose-700" disabled={isMutating} onClick={onCancel}>
              <XCircle className="mr-1 h-4 w-4" />
              Cancel PO
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase text-slate-500">Ordered</p>
            <p className="mt-1 text-xl font-semibold text-slate-950">{purchase.totalQuantity}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase text-slate-500">Received</p>
            <p className="mt-1 text-xl font-semibold text-slate-950">{purchase.receivedQuantity}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase text-slate-500">Damaged</p>
            <p className="mt-1 text-xl font-semibold text-slate-950">{purchase.damagedQuantity}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase text-slate-500">Amount</p>
            <p className="mt-1 text-xl font-semibold text-slate-950">{formatMoney(purchase.totalAmount)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[940px] text-sm">
            <thead className="bg-slate-50/80 text-left text-slate-500">
              <tr className="border-b border-slate-200">
                <th className="px-5 py-3 font-medium">Item</th>
                <th className="px-4 py-3 text-right font-medium">Qty</th>
                <th className="px-4 py-3 text-right font-medium">Received</th>
                <th className="px-4 py-3 text-right font-medium">Damaged</th>
                <th className="px-4 py-3 text-right font-medium">Remaining</th>
                <th className="px-4 py-3 text-right font-medium">Cost</th>
                <th className="px-4 py-3 text-right font-medium">Tax %</th>
                <th className="px-5 py-3 text-right font-medium">Line Total</th>
              </tr>
            </thead>
            <tbody>
              {purchase.items.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 text-slate-800 last:border-b-0">
                  <td className="px-5 py-4">
                    <div className="font-medium text-slate-950">{item.itemName}</div>
                    <div className="mt-1 text-xs text-slate-500">SKU {item.sku || "-"}</div>
                  </td>
                  <td className="px-4 py-4 text-right">{item.quantity}</td>
                  <td className="px-4 py-4 text-right">{item.receivedQuantity}</td>
                  <td className="px-4 py-4 text-right">{item.damagedQuantity}</td>
                  <td className="px-4 py-4 text-right">{remainingQuantity(item.quantity, item.receivedQuantity, item.damagedQuantity)}</td>
                  <td className="px-4 py-4 text-right">{formatMoney(item.costPrice)}</td>
                  <td className="px-4 py-4 text-right">{item.taxPercentage ?? 0}%</td>
                  <td className="px-5 py-4 text-right font-medium text-slate-950">{formatMoney(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-4">
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="space-y-3 p-4 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-slate-500">Supplier invoice</span>
                <span className="font-medium text-slate-900">{purchase.supplierInvoiceNumber || "-"}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-500">Invoice date</span>
                <span className="font-medium text-slate-900">{formatDate(purchase.supplierInvoiceDate)}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-500">Created by</span>
                <span className="font-medium text-slate-900">{purchase.createdByName || "-"}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-500">Ordered by</span>
                <span className="font-medium text-slate-900">{purchase.orderedByName || "-"}</span>
              </div>
              {purchase.notes ? <p className="border-t border-slate-100 pt-3 text-slate-600">{purchase.notes}</p> : null}
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-4">
              <p className="text-sm font-semibold text-slate-950">GRNs</p>
              {receipts.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">No receipts recorded yet.</p>
              ) : (
                <div className="mt-3 space-y-3">
                  {receipts.map((receipt) => (
                    <div key={receipt.id} className="rounded-xl border border-slate-200 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium text-slate-900">{receipt.grnNumber}</p>
                        <p className="text-xs text-slate-500">{formatDate(receipt.receivedDate)}</p>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {receipt.items.reduce((sum, item) => sum + item.receivedQuantity, 0)} received ·{" "}
                        {receipt.items.reduce((sum, item) => sum + item.damagedQuantity, 0)} damaged
                      </p>
                      <Button variant="ghost" className="mt-2 h-8 px-2 text-xs" onClick={() => setPrintingReceipt(receipt)}>
                        <Printer className="mr-1 h-3.5 w-3.5" />
                        Print GRN
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <DocumentPrintDialog
        open={Boolean(printingReceipt)}
        title={printingReceipt?.grnNumber ? `Print ${printingReceipt.grnNumber}` : "Print GRN"}
        onClose={() => setPrintingReceipt(null)}
      >
        {printingReceipt ? <GRNPrintView receipt={printingReceipt} purchase={purchase} /> : null}
      </DocumentPrintDialog>
    </div>
  );
}
