import { CheckCircle2, CreditCard, Printer } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@components/ui/button";
import { Tooltip } from "@components/ui/tooltip";
import type { PartnerInvoice } from "@shared/types/domain";
import { canFinalizeInvoiceRole, formatDate } from "../utils";
import type { PartnerFinanceRole } from "../types";
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";
import { PaymentStatusBadge } from "@features/partners/finance/payments/components/PaymentStatusBadge";
import { invoiceOutstanding } from "@features/partners/finance/payments/utils";

type Props = {
  invoice: PartnerInvoice;
  role: PartnerFinanceRole;
  roleLoading?: boolean;
  busy?: boolean;
  onFinalize: () => void;
  onPreview: () => void;
  onRecordPayment?: () => void;
};

export function InvoiceDetailHeader({ invoice, role, roleLoading, busy, onFinalize, onPreview, onRecordPayment }: Props) {
  const canFinalize = invoice.status === "DRAFT" && canFinalizeInvoiceRole(role);
  const showDisabledFinalize = invoice.status === "DRAFT" && !canFinalize;
  const outstanding = invoiceOutstanding(invoice);

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">{invoice.invoiceNumber}</h1>
          <InvoiceStatusBadge status={invoice.status} />
          <PaymentStatusBadge status={invoice.paymentStatus} />
        </div>
        <div className="grid gap-1 text-sm text-slate-500">
          <p>
            {invoice.clientBusinessName} · {invoice.clientOutletName}
          </p>
          <p>
            Invoice date {formatDate(invoice.invoiceDate)}
            {invoice.dueDate ? ` · Due ${formatDate(invoice.dueDate)}` : ""}
          </p>
          {invoice.orderId ? (
            <p>
              Order reference{" "}
              <Link className="font-medium text-brand-600 hover:underline" to={`/partners/orders/${invoice.orderId}`}>
                {invoice.dispatchReference || invoice.orderId}
              </Link>
            </p>
          ) : null}
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center lg:justify-end">
        {canFinalize ? (
          <Button type="button" className="h-10 px-3 text-sm" disabled={busy} onClick={onFinalize}>
            <CheckCircle2 className="mr-1.5 h-4 w-4" />
            Finalize Invoice
          </Button>
        ) : showDisabledFinalize ? (
          <Tooltip content={roleLoading ? "Checking finance permission" : "Only owners and accountants can finalize invoices"}>
            <span>
              <Button type="button" className="h-10 px-3 text-sm" disabled>
                <CheckCircle2 className="mr-1.5 h-4 w-4" />
                Finalize Invoice
              </Button>
            </span>
          </Tooltip>
        ) : null}
        {invoice.status === "FINALIZED" && outstanding > 0 && canFinalizeInvoiceRole(role) && onRecordPayment ? (
          <Button type="button" className="h-10 px-3 text-sm" disabled={busy} onClick={onRecordPayment}>
            <CreditCard className="mr-1.5 h-4 w-4" />
            Record Payment
          </Button>
        ) : null}
        {invoice.status === "FINALIZED" || invoice.status === "DRAFT" ? (
          <Button type="button" variant="outline" className="h-10 px-3 text-sm" onClick={onPreview}>
            <Printer className="mr-1.5 h-4 w-4" />
            Print Invoice
          </Button>
        ) : null}
      </div>
    </div>
  );
}
