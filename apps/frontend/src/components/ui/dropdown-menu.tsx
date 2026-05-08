import * as React from "react";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@shared/lib/cn";

export type MenuItem = {
  id?: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
  keepOpenOnSelect?: boolean;
};

export function DropdownMenu({
  items,
  trigger,
  align = "right",
  contentClassName
}: {
  items: MenuItem[];
  trigger?: React.ReactNode;
  align?: "left" | "right";
  contentClassName?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      {trigger ? (
        <div
          role="button"
          tabIndex={0}
          className="rounded-lg"
          onClick={() => setOpen((v) => !v)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setOpen((v) => !v);
            }
          }}
        >
          {trigger}
        </div>
      ) : (
        <button type="button" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" onClick={() => setOpen((v) => !v)}>
          <MoreHorizontal className="h-4 w-4" />
        </button>
      )}
      {open ? (
        <div className={cn(
          "absolute top-9 z-30 w-40 rounded-xl border border-slate-200 bg-white p-1 shadow-lg",
          align === "right" ? "right-0" : "left-0",
          contentClassName
        )}>
          {items.map((item, index) => (
            <button
              key={item.id ?? `${item.label}_${index}`}
              className={cn(
                "block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100",
                item.destructive ? "text-rose-600" : "text-slate-700",
                item.disabled ? "cursor-not-allowed opacity-50 hover:bg-white" : ""
              )}
              disabled={item.disabled}
              onClick={() => {
                item.onClick();
                if (!item.keepOpenOnSelect) {
                  setOpen(false);
                }
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
