import type { ReactNode } from "react";
import { Printer } from "lucide-react";
import { Button } from "@components/ui/button";
import { Dialog } from "@components/ui/dialog";

type Props = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

export function DocumentPrintDialog({ open, title, onClose, children }: Props) {
  return (
    <Dialog open={open} title={title} onClose={onClose} panelClassName="max-w-5xl" bodyClassName="bg-slate-100">
      <div className="document-no-print sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
        <p className="text-sm font-medium text-slate-900">{title}</p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" className="h-9 px-3 text-sm" disabled>
            Download PDF later
          </Button>
          <Button type="button" className="h-9 px-3 text-sm" onClick={() => window.print()}>
            <Printer className="mr-1 h-4 w-4" />
            Print
          </Button>
        </div>
      </div>
      <div className="p-4">{children}</div>
    </Dialog>
  );
}
