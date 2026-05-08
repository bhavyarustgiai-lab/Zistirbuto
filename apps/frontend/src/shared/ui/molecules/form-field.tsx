import type { ReactNode } from "react";
import { cn } from "@shared/lib/cn";

type FormFieldProps = {
  label: string;
  htmlFor?: string;
  required?: boolean;
  helperText?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function FormField({ label, htmlFor, required, helperText, error, children, className }: FormFieldProps) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-slate-700">
        {label}
        {required ? <span className="ml-0.5 text-rose-600">*</span> : null}
      </label>
      {children}
      {error ? (
        <p className="text-sm text-rose-600" role="alert">
          {error}
        </p>
      ) : helperText ? (
        <p className="text-sm text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
}
