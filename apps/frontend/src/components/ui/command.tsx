import * as React from "react";
import { Check, Search } from "lucide-react";
import { cn } from "@shared/lib/cn";
import { Input } from "@components/ui/input";
import { ScrollArea } from "@components/ui/scroll-area";

export type CommandItem = {
  value: string;
  label: string;
  meta?: string;
};

type CommandProps = {
  value: string;
  onValueChange: (value: string) => void;
  items: CommandItem[];
  onSelect: (value: string) => void;
  placeholder?: string;
  emptyText?: string;
  className?: string;
  autoFocus?: boolean;
  inputRef?: React.Ref<HTMLInputElement>;
};

export function Command({
  value,
  onValueChange,
  items,
  onSelect,
  placeholder = "Search...",
  emptyText = "No results",
  className,
  autoFocus,
  inputRef
}: CommandProps) {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setActiveIndex(0);
  }, [value, items.length]);

  React.useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", onMouseDown);
    return () => window.removeEventListener("mousedown", onMouseDown);
  }, []);

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
        <Input
          ref={inputRef}
          value={value}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            onValueChange(event.target.value);
            setOpen(true);
          }}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="pl-9"
          onKeyDown={(event) => {
            if (items.length === 0) return;
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActiveIndex((prev) => (prev + 1) % items.length);
            }
            if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
            }
            if (event.key === "Enter") {
              event.preventDefault();
              onSelect(items[activeIndex]?.value ?? items[0].value);
              setOpen(false);
            }
          }}
        />
      </div>

      {open ? (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-20">
          <ScrollArea className="max-h-52 rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
            {items.length === 0 ? (
              <p className="px-3 py-2 text-sm text-slate-500">{emptyText}</p>
            ) : (
              items.map((item, index) => {
                const active = index === activeIndex;
                return (
                  <button
                    key={item.value}
                    type="button"
                    className={cn(
                      "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition",
                      active ? "bg-slate-100 text-slate-900" : "text-slate-700 hover:bg-slate-50"
                    )}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => {
                      onSelect(item.value);
                      setOpen(false);
                    }}
                  >
                    <span>{item.label}</span>
                    <span className="flex items-center gap-2 text-slate-500">
                      {item.meta ? <span>{item.meta}</span> : null}
                      {active ? <Check className="h-4 w-4" /> : null}
                    </span>
                  </button>
                );
              })
            )}
          </ScrollArea>
        </div>
      ) : null}
    </div>
  );
}
