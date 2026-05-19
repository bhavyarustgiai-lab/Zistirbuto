import { useEffect, useRef, useState } from "react";
import { CalendarDays } from "lucide-react";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { PartnerFieldLabel } from "@features/partners/PartnerFieldLabel";

type PurchaseDateRangePickerProps = {
  fromDate: string;
  toDate: string;
  onChange: (range: { fromDate: string; toDate: string }) => void;
};

function offsetDateISO(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function formatDate(value: string) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function PurchaseDateRangePicker({
  fromDate,
  toDate,
  onChange,
}: PurchaseDateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function closeOnOutsideClick(event: MouseEvent) {
      if (!panelRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    window.addEventListener("mousedown", closeOnOutsideClick);
    return () => window.removeEventListener("mousedown", closeOnOutsideClick);
  }, [open]);

  const label =
    fromDate && toDate
      ? `${formatDate(fromDate)} - ${formatDate(toDate)}`
      : "Select date range";

  return (
    <div ref={panelRef} className="relative w-full md:w-[320px]">
      <Button
        variant="outline"
        className="h-11 w-full justify-start px-3 text-left text-sm"
        onClick={() => setOpen((current) => !current)}
      >
        <CalendarDays className="mr-2 h-4 w-4 text-slate-500" />
        <span className="truncate">{label}</span>
      </Button>
      {open ? (
        <div className="absolute right-0 z-30 mt-2 grid w-full min-w-[320px] gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <PartnerFieldLabel>From</PartnerFieldLabel>
              <Input
                type="date"
                value={fromDate}
                onChange={(event) =>
                  onChange({ fromDate: event.target.value, toDate })
                }
              />
            </div>
            <div>
              <PartnerFieldLabel>To</PartnerFieldLabel>
              <Input
                type="date"
                value={toDate}
                onChange={(event) =>
                  onChange({ fromDate, toDate: event.target.value })
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              className="h-9 px-2 text-xs"
              onClick={() => onChange({ fromDate: offsetDateISO(-30), toDate: offsetDateISO(0) })}
            >
              30 days
            </Button>
            <Button
              variant="outline"
              className="h-9 px-2 text-xs"
              onClick={() => onChange({ fromDate: offsetDateISO(-90), toDate: offsetDateISO(0) })}
            >
              90 days
            </Button>
            <Button
              className="h-9 px-2 text-xs"
              onClick={() => setOpen(false)}
            >
              Apply
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
