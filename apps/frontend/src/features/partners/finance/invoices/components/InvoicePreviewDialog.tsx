import { Printer } from "lucide-react";
import { Dialog } from "@components/ui/dialog";
import { Button } from "@components/ui/button";
import type { PartnerFirm, PartnerInvoice } from "@shared/types/domain";
import { InvoicePrintView } from "./InvoicePrintView";

type Props = {
  invoice: PartnerInvoice | null;
  firm?: PartnerFirm;
  open: boolean;
  onClose: () => void;
};

export function InvoicePreviewDialog({ invoice, firm, open, onClose }: Props) {
  if (!invoice) return null;

  return (
    <Dialog
      open={open}
      title={`Invoice preview ${invoice.invoiceNumber}`}
      onClose={onClose}
      panelClassName="max-w-[min(1180px,calc(100vw-1.5rem))] p-0"
      bodyClassName="max-h-[calc(100vh-6rem)]"
    >
      <div className="invoice-no-print sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-950">{invoice.invoiceNumber}</p>
          <p className="text-xs text-slate-500">Printable GST preview</p>
        </div>
        <Button type="button" className="h-9 px-3 text-sm" onClick={() => window.print()}>
          <Printer className="mr-1.5 h-4 w-4" />
          Print Invoice
        </Button>
      </div>
      <InvoicePrintView invoice={invoice} firm={firm} />
    </Dialog>
  );
}
