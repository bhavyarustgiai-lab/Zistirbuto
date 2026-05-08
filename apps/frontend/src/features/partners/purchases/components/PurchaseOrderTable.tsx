import { Eye, PackageCheck, Send, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@components/ui/button";
import type { PartnerPurchase } from "@shared/types/domain";
import { PurchaseStatusBadge } from "./PurchaseStatusBadge";
import { formatDate, formatMoney } from "../utils";

type Props = {
  purchases: PartnerPurchase[];
  onOrder: (purchaseId: string) => void;
  onReceive: (purchase: PartnerPurchase) => void;
  onCancel: (purchaseId: string) => void;
  isMutating?: boolean;
};

export function PurchaseOrderTable({ purchases, onOrder, onReceive, onCancel, isMutating }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1080px] text-sm">
        <thead className="bg-slate-50/80 text-left text-slate-500">
          <tr className="border-b border-slate-200">
            <th className="px-5 py-3 font-medium">PO No</th>
            <th className="px-4 py-3 font-medium">Supplier</th>
            <th className="px-4 py-3 font-medium">PO Date</th>
            <th className="px-4 py-3 font-medium">Expected</th>
            <th className="px-4 py-3 text-right font-medium">Items</th>
            <th className="px-4 py-3 text-right font-medium">Ordered</th>
            <th className="px-4 py-3 text-right font-medium">Received</th>
            <th className="px-4 py-3 text-right font-medium">Damaged</th>
            <th className="px-4 py-3 text-right font-medium">Amount</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-5 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {purchases.map((purchase) => (
            <tr key={purchase.id} className="border-b border-slate-100 text-slate-800 last:border-b-0">
              <td className="px-5 py-4">
                <Link to={`/partners/purchases/${purchase.id}`} className="font-medium text-slate-950 hover:text-slate-700">
                  {purchase.purchaseNumber}
                </Link>
                <div className="mt-1 text-xs text-slate-500">{purchase.supplierInvoiceNumber || "Supplier invoice not linked"}</div>
              </td>
              <td className="px-4 py-4">{purchase.supplierName}</td>
              <td className="px-4 py-4">{formatDate(purchase.purchaseDate)}</td>
              <td className="px-4 py-4">{formatDate(purchase.expectedInwardDate)}</td>
              <td className="px-4 py-4 text-right">{purchase.lineCount}</td>
              <td className="px-4 py-4 text-right">{purchase.totalQuantity}</td>
              <td className="px-4 py-4 text-right">{purchase.receivedQuantity}</td>
              <td className="px-4 py-4 text-right">{purchase.damagedQuantity}</td>
              <td className="px-4 py-4 text-right font-medium text-slate-950">{formatMoney(purchase.totalAmount)}</td>
              <td className="px-4 py-4">
                <PurchaseStatusBadge status={purchase.status} />
              </td>
              <td className="px-5 py-4">
                <div className="flex justify-end gap-1">
                  <Link
                    to={`/partners/purchases/${purchase.id}`}
                    className="inline-flex h-9 items-center justify-center rounded-xl bg-transparent px-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                  >
                    <Eye className="mr-1 h-4 w-4" />
                    View
                  </Link>
                  {purchase.status === "DRAFT" ? (
                    <Button variant="ghost" className="h-9 px-2 text-sm" disabled={isMutating} onClick={() => onOrder(purchase.id)}>
                      <Send className="mr-1 h-4 w-4" />
                      Order
                    </Button>
                  ) : null}
                  {purchase.status === "ORDERED" || purchase.status === "PARTIALLY_RECEIVED" ? (
                    <Button variant="ghost" className="h-9 px-2 text-sm" disabled={isMutating} onClick={() => onReceive(purchase)}>
                      <PackageCheck className="mr-1 h-4 w-4" />
                      Receive
                    </Button>
                  ) : null}
                  {purchase.status === "DRAFT" || purchase.status === "ORDERED" ? (
                    <Button
                      variant="ghost"
                      className="h-9 px-2 text-sm text-rose-700 hover:bg-rose-50 hover:text-rose-700"
                      disabled={isMutating}
                      onClick={() => onCancel(purchase.id)}
                    >
                      <XCircle className="mr-1 h-4 w-4" />
                      Cancel
                    </Button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
