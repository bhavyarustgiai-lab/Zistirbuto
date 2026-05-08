import { ArrowLeft, Printer } from "lucide-react";
import type { PartnerOrderStatus } from "@shared/types/domain";
import { Button } from "@components/ui/button";
import { PartnerStatusBadge } from "@features/partners/PartnerStatusBadge";

type OrderDetailHeaderProps = {
  orderNumber: string;
  status: PartnerOrderStatus;
  clientName: string;
  outletName: string;
  busy?: boolean;
  canEdit?: boolean;
  canPack?: boolean;
  onBack: () => void;
  onEdit: () => void;
  onRevertToDraft?: () => void;
  onCancel: () => void;
  onPack: () => void;
  onDispatch: () => void;
  onDeliver: () => void;
  onReturn: () => void;
  canGenerateInvoice?: boolean;
  canPrintDocuments?: boolean;
  canPrintInvoice?: boolean;
  linkedInvoiceNumber?: string;
  onGenerateInvoice?: () => void;
  onPrintInvoice?: () => void;
  onPrintPackagingSlip?: () => void;
};

export function OrderDetailHeader({
  orderNumber,
  status,
  clientName,
  outletName,
  busy = false,
  canEdit = false,
  canPack = true,
  onBack,
  onEdit,
  onRevertToDraft,
  onCancel,
  onPack,
  onDispatch,
  onDeliver,
  onReturn,
  canGenerateInvoice = false,
  canPrintDocuments = false,
  canPrintInvoice = false,
  linkedInvoiceNumber = "",
  onGenerateInvoice,
  onPrintInvoice,
  onPrintPackagingSlip,
}: OrderDetailHeaderProps) {
  const isDraft = status === "DRAFT" || status === "PLACED";

  return (
    <div className="sticky top-0 z-20 -mx-1 border-b border-slate-200 bg-slate-50/95 px-1 py-3 backdrop-blur supports-[backdrop-filter]:bg-slate-50/80">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="ghost"
            className="h-10 w-10 shrink-0 rounded-xl p-0 text-slate-700 hover:bg-slate-100"
            aria-label="Back to orders"
            onClick={onBack}
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2.25} />
          </Button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold text-slate-950">{orderNumber}</h1>
              <PartnerStatusBadge status={status} />
            </div>
            <p className="mt-1 truncate text-sm text-slate-600">
              {clientName} · {outletName}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {canPrintDocuments && onPrintPackagingSlip ? (
            <Button variant="outline" className="h-10 px-3 text-sm" disabled={busy} onClick={onPrintPackagingSlip}>
              <Printer className="mr-1 h-4 w-4" />
              Print Packaging Slip
            </Button>
          ) : null}
          {canPrintDocuments ? (
            canPrintInvoice && onPrintInvoice ? (
              <Button variant="outline" className="h-10 px-3 text-sm" disabled={busy} onClick={onPrintInvoice}>
                <Printer className="mr-1 h-4 w-4" />
                Print Invoice
              </Button>
            ) : canGenerateInvoice && onGenerateInvoice ? (
              <Button variant="outline" className="h-10 px-3 text-sm" disabled={busy} onClick={onGenerateInvoice}>
                Generate Invoice
              </Button>
            ) : linkedInvoiceNumber ? (
              <Button variant="outline" className="h-10 px-3 text-sm" disabled>
                Invoice {linkedInvoiceNumber}
              </Button>
            ) : null
          ) : null}
          {isDraft ? (
            <>
              {canEdit ? (
                <Button variant="outline" className="h-10 px-3 text-sm" disabled={busy} onClick={onEdit}>
                  Edit Order
                </Button>
              ) : null}
              <Button variant="outline" className="h-10 px-3 text-sm text-rose-600 hover:bg-rose-50 hover:text-rose-700" disabled={busy} onClick={onCancel}>
                Cancel Order
              </Button>
            </>
          ) : null}
          {status === "CONFIRMED" ? (
            <>
              {onRevertToDraft ? (
                <Button variant="outline" className="h-10 px-3 text-sm" disabled={busy} onClick={onRevertToDraft}>
                  Revert to Draft
                </Button>
              ) : null}
              <Button variant="outline" className="h-10 px-3 text-sm text-rose-600 hover:bg-rose-50 hover:text-rose-700" disabled={busy} onClick={onCancel}>
                Cancel Order
              </Button>
              {canPack ? (
                <Button className="h-10 px-3 text-sm" disabled={busy} onClick={onPack}>
                  {busy ? "Updating..." : "Mark Packed"}
                </Button>
              ) : null}
            </>
          ) : null}
          {status === "PACKED" ? (
            <>
              {onRevertToDraft ? (
                <Button variant="outline" className="h-10 px-3 text-sm" disabled={busy} onClick={onRevertToDraft}>
                  Revert to Draft
                </Button>
              ) : null}
              <Button variant="outline" className="h-10 px-3 text-sm text-rose-600 hover:bg-rose-50 hover:text-rose-700" disabled={busy} onClick={onCancel}>
                Cancel Order
              </Button>
              <Button className="h-10 px-3 text-sm" disabled={busy} onClick={onDispatch}>
                {busy ? "Updating..." : "Dispatch"}
              </Button>
            </>
          ) : null}
          {status === "DISPATCHED" || status === "PARTIALLY_RETURNED" ? (
            <>
              <Button variant="outline" className="h-10 px-3 text-sm" disabled={busy} onClick={onReturn}>
                Create Return
              </Button>
              <Button className="h-10 px-3 text-sm" disabled={busy} onClick={onDeliver}>
                {busy ? "Updating..." : "Mark Delivered"}
              </Button>
            </>
          ) : null}
          {status === "PARTIALLY_DELIVERED" || status === "DELIVERED" ? (
            <>
              <Button variant="outline" className="h-10 px-3 text-sm" disabled={busy} onClick={onReturn}>
                Create Return
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
