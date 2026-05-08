import * as React from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { cn } from "@shared/lib/cn";
import { Input } from "@components/ui/input";

export type SelectOption = { label: string; value: string; description?: string; disabled?: boolean };

type Props = {
  value: string;
  options: SelectOption[];
  onValueChange: (v: string) => void;
  className?: string;
  id?: string;
  disabled?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
};

export function Select({
  value,
  options,
  onValueChange,
  className,
  id,
  disabled,
  searchable = false,
  searchPlaceholder = "Search...",
  emptyMessage = "No options found.",
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [menuPosition, setMenuPosition] = React.useState<React.CSSProperties>({});
  const ref = React.useRef<HTMLDivElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);
  const selected = React.useMemo(() => options.find((option) => option.value === value), [options, value]);
  const filteredOptions = React.useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!searchable || !term) {
      return options;
    }
    return options.filter((option) =>
      [option.label, option.value, option.description ?? ""].some((candidate) => candidate.toLowerCase().includes(term)),
    );
  }, [options, query, searchable]);
  const listMaxHeight = React.useMemo(() => {
    if (typeof menuPosition.maxHeight !== "number") {
      return undefined;
    }
    return Math.max(120, menuPosition.maxHeight - (searchable ? 52 : 0));
  }, [menuPosition.maxHeight, searchable]);

  React.useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!ref.current?.contains(target) && !menuRef.current?.contains(target)) {
        setOpen(false);
        setQuery("");
      }
    };
    window.addEventListener("mousedown", onMouseDown);
    return () => window.removeEventListener("mousedown", onMouseDown);
  }, []);

  React.useEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      const trigger = ref.current;
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      const viewportPadding = 12;
      const availableBelow = window.innerHeight - rect.bottom - viewportPadding;
      const availableAbove = rect.top - viewportPadding;
      const opensAbove = availableBelow < 260 && availableAbove > availableBelow;
      const maxHeight = Math.max(
        180,
        Math.min(360, opensAbove ? availableAbove : availableBelow),
      );

      setMenuPosition({
        position: "fixed",
        left: rect.left,
        top: opensAbove ? undefined : rect.bottom + 4,
        bottom: opensAbove ? window.innerHeight - rect.top + 4 : undefined,
        width: rect.width,
        maxHeight,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  React.useEffect(() => {
    if (!open || !searchable) return;
    window.requestAnimationFrame(() => searchRef.current?.focus());
  }, [open, searchable]);

  const menu = open && typeof document !== "undefined" ? createPortal(
    <div
      ref={menuRef}
      className="z-[80] overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-xl"
      style={menuPosition}
    >
      {searchable ? (
        <div className="p-1">
          <Input
            ref={searchRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setOpen(false);
                setQuery("");
              }
            }}
            placeholder={searchPlaceholder}
            autoComplete="off"
            className="h-9 rounded-lg text-sm"
          />
        </div>
      ) : null}
      <div className="overflow-y-auto" style={{ maxHeight: listMaxHeight }}>
        {filteredOptions.length > 0 ? (
          filteredOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={cn(
                "block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100",
                option.value === value ? "bg-indigo-50 text-brand-500" : "text-slate-700",
                option.disabled ? "cursor-not-allowed opacity-50 hover:bg-white" : ""
              )}
              disabled={option.disabled}
              onClick={() => {
                onValueChange(option.value);
                setOpen(false);
                setQuery("");
              }}
            >
              <span className="block truncate">{option.label}</span>
              {option.description ? (
                <span className={cn("mt-0.5 block truncate text-xs", option.value === value ? "text-brand-500/80" : "text-slate-500")}>
                  {option.description}
                </span>
              ) : null}
            </button>
          ))
        ) : (
          <p className="px-3 py-2 text-sm text-slate-500">{emptyMessage}</p>
        )}
      </div>
    </div>,
    document.body,
  ) : null;

  return (
    <div className={cn("relative min-w-0", className)} ref={ref}>
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => {
          setOpen((prev) => !prev);
          setQuery("");
        }}
        className="flex h-11 w-full min-w-0 items-center justify-between rounded-xl border border-slate-300 bg-white px-3 text-left text-sm text-slate-900 outline-none ring-brand-500/30 transition focus:ring disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="block min-w-0 flex-1 truncate pr-3">{selected?.label ?? "Select"}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
      </button>
      {menu}
    </div>
  );
}
