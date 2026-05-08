import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@shared/lib/cn";

type CheckboxProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
  disabled?: boolean;
};

export function Checkbox({ checked, onCheckedChange, className, disabled }: CheckboxProps) {
  return (
    <button
      type="button"
      aria-checked={checked}
      role="checkbox"
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "inline-flex h-4 w-4 items-center justify-center rounded border transition",
        checked ? "border-brand-500 bg-brand-500 text-white" : "border-slate-300 bg-white text-transparent",
        disabled ? "cursor-not-allowed opacity-50" : "hover:border-brand-400",
        className
      )}
    >
      <Check className="h-3 w-3" />
    </button>
  );
}
