import type { PropsWithChildren } from "react";

export function FormRow({ label, children }: PropsWithChildren<{ label: string }>) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}
