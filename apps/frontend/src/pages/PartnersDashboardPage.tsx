import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Circle } from "lucide-react";
import { useAppState } from "@app/providers/AppStateProvider";
import { usePartnerDashboard } from "@entities/partners/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { RecentActivityList } from "@features/partners/RecentActivityList";
import { EmptyState } from "@shared/ui/molecules/EmptyState";

export function PartnersDashboardPage() {
  const { activePartnerFirmId, partnerFirms } = useAppState();
  const dashboard = usePartnerDashboard(activePartnerFirmId);
  const activeFirm = partnerFirms.find(
    (firm) => firm.id === activePartnerFirmId,
  );

  if (!activePartnerFirmId) {
    return (
      <EmptyState>Select a firm to view the distributor dashboard.</EmptyState>
    );
  }

  const statCards = [
    { label: "Mapped brands", value: dashboard.data?.mappedBrandsCount ?? 0 },
    { label: "Catalog items", value: dashboard.data?.itemCount ?? 0 },
    {
      label: "Clients",
      value: dashboard.data?.clientBusinessCount ?? 0,
    },
    { label: "Outlets", value: dashboard.data?.outletCount ?? 0 },
    { label: "Open orders", value: dashboard.data?.openOrdersCount ?? 0 },
    {
      label: "Outstanding receivables",
      value: dashboard.data?.unpaidInvoicesCount ?? 0,
    },
    {
      label: "Current stock qty",
      value: dashboard.data?.currentStockQtyTotal ?? 0,
    },
  ];
  const setupSteps = [
    {
      label: "Map brands",
      href: "/partners/products/brands",
      done: (dashboard.data?.mappedBrandsCount ?? 0) > 0,
    },
    {
      label: "Add catalog items",
      href: "/partners/products/catalog",
      done: (dashboard.data?.itemCount ?? 0) > 0,
    },
    {
      label: "Add clients",
      href: "/partners/sales/clients",
      done: (dashboard.data?.clientBusinessCount ?? 0) > 0,
    },
    {
      label: "Add suppliers",
      href: "/partners/supply/suppliers",
      done: (dashboard.data?.supplierCount ?? 0) > 0,
    },
  ];
  const showSetupCard = setupSteps.some((step) => !step.done);

  return (
    <section className="grid gap-4">
      {showSetupCard ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Next setup steps</CardTitle>
            <p className="text-sm text-slate-500">
              Finish the core firm setup so the workspace is ready for daily
              distributor operations.
            </p>
          </CardHeader>
          <CardContent className="overflow-x-auto pb-5">
            <div className="flex min-w-max items-start gap-0">
              {setupSteps.map((step, index) => (
                <div key={step.label} className="flex items-start">
                  <Link
                    to={step.href}
                    className={`group min-w-[220px] rounded-2xl border px-4 py-4 transition ${
                      step.done
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {step.done ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <Circle className="h-5 w-5 text-slate-300 transition group-hover:text-slate-400" />
                      )}
                      <span className="text-sm font-semibold">
                        {step.label}
                      </span>
                    </div>
                    <p
                      className={`mt-2 text-xs ${step.done ? "text-emerald-700" : "text-slate-500"}`}
                    >
                      {step.done ? "Completed" : "Open section"}
                    </p>
                  </Link>

                  {index < setupSteps.length - 1 ? (
                    <div className="flex h-[84px] w-12 items-center justify-center">
                      <div
                        className={`h-px w-full ${step.done ? "bg-emerald-300" : "bg-slate-200"}`}
                      />
                      <ArrowRight
                        className={`-ml-2 h-4 w-4 shrink-0 ${step.done ? "text-emerald-400" : "text-slate-300"}`}
                      />
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-brand-100 bg-gradient-to-br from-white via-white to-indigo-50">
        <CardHeader className="p-5 sm:p-6">
          <CardTitle>Distributor Dashboard</CardTitle>
          <p className="text-sm text-slate-500">
            Operational snapshot across catalog, clients, orders, receivables,
            and stock.
          </p>
        </CardHeader>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.label}>
            <CardContent className="p-4 sm:p-5">
              <p className="text-sm text-slate-500">{card.label}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900 sm:text-3xl">
                {card.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Recent activity</CardTitle>
          <p className="text-sm text-slate-500">
            Key order, collection, and stock updates across this firm.
          </p>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          {(dashboard.data?.recentActivity ?? []).length === 0 ? (
            <EmptyState>No recent activity yet.</EmptyState>
          ) : (
            <RecentActivityList items={dashboard.data?.recentActivity ?? []} />
          )}
        </CardContent>
      </Card>
    </section>
  );
}
