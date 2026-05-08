import type { PropsWithChildren } from "react";

export function EmptyState({ children }: PropsWithChildren) {
  return <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">{children}</div>;
}
