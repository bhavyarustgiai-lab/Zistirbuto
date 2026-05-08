import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@shared/lib/cn";

export function Dialog({
  open,
  title,
  onClose,
  children,
  panelClassName,
  bodyClassName,
  hideHeader = false,
}: React.PropsWithChildren<{
  open: boolean;
  title: string;
  onClose: () => void;
  panelClassName?: string;
  bodyClassName?: string;
  hideHeader?: boolean;
}>) {
  if (!open) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/45 p-3 sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={hideHeader ? title : undefined}
        className={cn(
          "flex max-h-[calc(100vh-1.5rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white p-4 shadow-2xl sm:max-h-[calc(100vh-2rem)] sm:p-5",
          panelClassName,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {!hideHeader ? (
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="truncate text-lg font-semibold text-slate-900">{title}</h2>
            <button
              type="button"
              aria-label="Close dialog"
              className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null}
        <div className={cn("min-h-0 overflow-y-auto", bodyClassName)}>{children}</div>
      </div>
    </div>,
    document.body
  );
}
