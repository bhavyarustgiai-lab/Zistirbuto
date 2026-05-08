import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@shared/lib/cn";

export type MultiSelectOption = {
  label: string;
  value: string;
};

type Props = {
  value: string[];
  options: MultiSelectOption[];
  onValueChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
};

export function MultiSelect({
  value,
  options,
  onValueChange,
  placeholder = "Select",
  className,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", onMouseDown);
    return () => window.removeEventListener("mousedown", onMouseDown);
  }, []);

  const selectedOptions = React.useMemo(
    () => options.filter((option) => value.includes(option.value)),
    [options, value],
  );

  const label = React.useMemo(() => {
    if (selectedOptions.length === 0) {
      return placeholder;
    }
    if (selectedOptions.length === options.length) {
      return "All brands";
    }
    if (selectedOptions.length === 1) {
      return selectedOptions[0]?.label ?? placeholder;
    }
    return `${selectedOptions.length} brands`;
  }, [options.length, placeholder, selectedOptions]);

  return (
    <div className={cn("relative", className)} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-11 w-full items-center justify-between rounded-xl border border-slate-300 bg-white px-3 text-left text-sm text-slate-900 outline-none ring-brand-500/30 transition focus:ring"
      >
        <span className="truncate pr-3">{label}</span>
        <ChevronDown className="h-4 w-4 text-slate-500" />
      </button>
      {open ? (
        <div className="absolute right-0 z-20 mt-1 w-full min-w-[240px] rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
          {options.map((option) => {
            const selected = value.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm",
                  selected ? "bg-indigo-50 text-brand-500" : "text-slate-700 hover:bg-slate-100",
                )}
                onClick={() => {
                  onValueChange(
                    selected
                      ? value.filter((item) => item !== option.value)
                      : [...value, option.value],
                  );
                }}
              >
                <span>{option.label}</span>
                <Check className={cn("h-4 w-4", selected ? "opacity-100" : "opacity-0")} />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
