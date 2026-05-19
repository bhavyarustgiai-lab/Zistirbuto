import { Eye, PackageCheck, Send, XCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@components/ui/button";
import type { PartnerPurchase } from "@shared/types/domain";
import { formatDate, formatMoney } from "../utils";

type Props = {
  purchases: PartnerPurchase[];
  onOrder: (purchaseId: string) => void;
  onReceive: (purchase: PartnerPurchase) => void;
  onCancel: (purchase: PartnerPurchase) => void;
  isMutating?: boolean;
};

function isInteractiveTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && Boolean(target.closest("a,button,input,select,textarea"));
}

export function PurchaseOrderTable({ purchases, onOrder, onReceive, onCancel, isMutating }: Props) {
  const navigate = useNavigate();

  function openPurchase(purchaseId: string) {
    navigate(`/partners/supply/purchases/${purchaseId}`);
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] text-sm">
        <thead className="bg-slate-50/80 text-left text-slate-500">
          <tr className="border-b border-slate-200">
            <th className="px-5 py-3 font-medium">PO No</th>
            <th className="px-4 py-3 font-medium">Supplier</th>
            <th className="px-4 py-3 font-medium">PO Date</th>
            <th className="px-4 py-3 text-right font-medium">Amount</th>
            <th className="px-5 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {purchases.map((purchase) => (
            <tr
              key={purchase.id}
              className="cursor-pointer border-b border-slate-100 text-slate-800 last:border-b-0 hover:bg-slate-50"
              role="button"
              tabIndex={0}
              onClick={(event) => {
                if (isInteractiveTarget(event.target)) return;
                openPurchase(purchase.id);
              }}
              onKeyDown={(event) => {
                if (event.key !== "Enter" && event.key !== " ") return;
                if (isInteractiveTarget(event.target)) return;
                event.preventDefault();
                openPurchase(purchase.id);
              }}
            >
              <td className="px-5 py-4">
                <Link to={`/partners/supply/purchases/${purchase.id}`} className="font-medium text-slate-950 hover:text-slate-700">
                  {purchase.purchaseNumber}
                </Link>
              </td>
              <td className="px-4 py-4">{purchase.supplierName}</td>
              <td className="px-4 py-4">{formatDate(purchase.purchaseDate)}</td>
              <td className="px-4 py-4 text-right font-medium text-slate-950">{formatMoney(purchase.totalAmount)}</td>
              <td className="px-5 py-4" onClick={(event) => event.stopPropagation()}>
                <div className="flex justify-end gap-1">
                  <Link
                    to={`/partners/supply/purchases/${purchase.id}`}
                    className="inline-flex h-9 items-center justify-center rounded-xl bg-transparent px-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                  >
                    <Eye className="mr-1 h-4 w-4" />
                    View
                  </Link>
                  {purchase.status === "DRAFT" ? (
                    <Button variant="ghost" className="h-9 px-2 text-sm" disabled={isMutating} onClick={() => onOrder(purchase.id)}>
                      <Send className="mr-1 h-4 w-4" />
                      Place
                    </Button>
                  ) : null}
                  {purchase.status === "PLACED" ? (
                    <Button variant="ghost" className="h-9 px-2 text-sm" disabled={isMutating} onClick={() => onReceive(purchase)}>
                      <PackageCheck className="mr-1 h-4 w-4" />
                      Inward
                    </Button>
                  ) : null}
                  {purchase.status === "DRAFT" || purchase.status === "PLACED" ? (
                    <Button
                      variant="ghost"
                      className="h-9 px-2 text-sm text-rose-700 hover:bg-rose-50 hover:text-rose-700"
                      disabled={isMutating}
                      onClick={() => onCancel(purchase)}
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
