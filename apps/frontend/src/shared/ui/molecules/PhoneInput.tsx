import { ChevronDown, Smartphone } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@shared/lib/cn";
import {
  PHONE_COUNTRY_OPTIONS,
  buildPhoneValue,
  formatPhoneLocalNumber,
  getPhoneCountryMeta,
  normalizePhoneLocalNumber,
  parsePhoneValue,
  type SupportedPhoneCountry,
} from "@shared/lib/phone";

type Props = {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  autoComplete?: string;
};

const FLAG_LABEL: Record<SupportedPhoneCountry, string> = {
  IN: "🇮🇳",
  US: "🇺🇸",
};

export function PhoneInput({
  id,
  name,
  value,
  onChange,
  placeholder,
  className,
  disabled = false,
  autoComplete = "tel-national",
}: Props) {
  const parsed = parsePhoneValue(value);
  const meta = getPhoneCountryMeta(parsed.country);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", onMouseDown);
    return () => window.removeEventListener("mousedown", onMouseDown);
  }, []);

  const displayValue = useMemo(
    () => `(${meta.dialCode}) ${formatPhoneLocalNumber(parsed.country, parsed.localNumber)}`.trim(),
    [meta.dialCode, parsed.country, parsed.localNumber],
  );

  const updateCountry = (country: SupportedPhoneCountry) => {
    onChange(buildPhoneValue(country, parsed.localNumber));
    setOpen(false);
  };

  const updateLocalNumber = (nextValue: string) => {
    const withoutDialCode = nextValue.replace(/^\(\+\d+\)\s*/, "");
    onChange(buildPhoneValue(parsed.country, normalizePhoneLocalNumber(withoutDialCode, parsed.country)));
  };

  return (
    <div
      ref={rootRef}
      className={cn(
        "relative flex h-11 items-center rounded-2xl border border-slate-300 bg-white px-2.5 transition",
        focused && !disabled ? "border-brand-500 ring-2 ring-brand-500/15" : "",
        disabled ? "opacity-60" : "hover:border-slate-400",
        className,
      )}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex h-8 min-w-[90px] shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2.5 text-left transition",
          disabled ? "cursor-not-allowed bg-slate-100" : "hover:border-slate-300 hover:bg-slate-100",
        )}
      >
        <span className="text-lg leading-none">{FLAG_LABEL[parsed.country]}</span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
            {meta.flag}
          </div>
        </div>
        <ChevronDown className="h-4 w-4 text-slate-500" />
      </button>

      <div className="min-w-0 flex-1 px-3">
        <input
          id={id}
          name={name}
          value={displayValue}
          onChange={(event) => updateLocalNumber(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder ?? `(${meta.dialCode}) ${formatPhoneLocalNumber(parsed.country, meta.example)}`}
          inputMode="numeric"
          autoComplete={autoComplete}
          disabled={disabled}
          className="h-10 w-full border-0 bg-transparent p-0 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
        />
      </div>

      <div className="flex h-9 w-9 shrink-0 items-center justify-center text-slate-400">
        <Smartphone className="h-4.5 w-4.5 stroke-[1.8]" />
      </div>

      {open ? (
        <div className="absolute left-0 top-[calc(100%+8px)] z-30 min-w-[220px] rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
          {PHONE_COUNTRY_OPTIONS.map((option) => {
            const optionMeta = getPhoneCountryMeta(option.value as SupportedPhoneCountry);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => updateCountry(option.value as SupportedPhoneCountry)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-slate-50",
                  option.value === parsed.country ? "bg-slate-50" : "",
                )}
              >
                <span className="text-xl leading-none">{FLAG_LABEL[option.value as SupportedPhoneCountry]}</span>
                <div>
                  <div className="text-sm font-semibold text-slate-900">{option.label}</div>
                  <div className="text-xs text-slate-500">{optionMeta.example}</div>
                </div>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
