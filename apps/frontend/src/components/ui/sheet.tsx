import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export function Sheet({
  open,
  title,
  onClose,
  children,
  className,
  headerClassName,
  bodyClassName,
  hideHeader = false,
}: React.PropsWithChildren<{
  open: boolean;
  title: string;
  onClose: () => void;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  hideHeader?: boolean;
}>) {
  if (!open) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 bg-slate-900/45" onClick={onClose}>
      <aside
        className={[
          "absolute right-0 top-0 h-full w-full max-w-full overflow-auto bg-white shadow-2xl sm:max-w-[32rem] lg:max-w-[40vw]",
          className ?? "",
        ].join(" ")}
        onClick={(e) => e.stopPropagation()}
      >
        {!hideHeader ? (
          <div
            className={[
              "sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 pb-3 pt-4 sm:px-5 sm:pt-5",
              headerClassName ?? "",
            ].join(" ")}
          >
            <h2 className="truncate text-lg font-semibold text-slate-900">{title}</h2>
            <button
              type="button"
              aria-label="Close drawer"
              className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null}
        <div
          className={[
            hideHeader ? "" : "px-4 py-4 sm:px-5",
            bodyClassName ?? "",
          ].join(" ")}
        >
          {children}
        </div>
      </aside>
    </div>,
    document.body
  );
}
