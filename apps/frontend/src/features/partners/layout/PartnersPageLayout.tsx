import type { PropsWithChildren, ReactNode } from "react";
import { Card } from "@components/ui/card";
import { cn } from "@shared/lib/cn";

export function PartnersPageShell({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  return <section className={cn("grid w-full max-w-none gap-4 md:gap-5 xl:gap-6", className)}>{children}</section>;
}

export function PartnersPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 md:gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0 space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">{title}</h1>
        {description ? <p className="max-w-3xl text-sm leading-6 text-slate-500">{description}</p> : null}
      </div>
      {actions ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center lg:justify-end [&>*]:w-full sm:[&>*]:w-auto">
          {actions}
        </div>
      ) : null}
    </div>
  );
}

export function PartnersPageFilters({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={cn(
        "grid gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-5 md:grid-cols-2 xl:flex xl:flex-wrap xl:items-center [&>*]:min-w-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PartnersSummaryCardGrid({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <div className={cn("grid gap-3 sm:grid-cols-2 xl:grid-cols-3", className)}>{children}</div>;
}

export function PartnersTableCard({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  return <Card className={cn("overflow-hidden border-slate-200 shadow-sm", className)}>{children}</Card>;
}
