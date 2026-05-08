import {
  ArrowRight,
  Boxes,
  CreditCard,
  PackageSearch,
  Store,
  Truck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@components/ui/card";

const partnerFeatureBlocks = [
  "Demand Signal Dashboard",
  "Credit Risk Controls",
  "Smart Replenishment",
  "Dispatch SLA Tracking",
  "Retailer Performance Insights",
];

const partnerFlow = [
  "Retailer inventory drops below threshold",
  "Partner receives consolidated demand signal",
  "Order is split by route and stock availability",
  "Dispatch team fulfills and tracks deliveries",
  "Invoice + credit ledger auto-updated",
  "Collections and margin analytics stay in sync",
];

export function PartnersPage() {
  return (
    <main className="min-h-screen bg-[#f4f5f8] text-slate-950">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-6">
        <Card className="overflow-hidden border-none bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.14),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(56,189,248,0.12),_transparent_24%),linear-gradient(135deg,_#fbfffd,_#f8fbff)] shadow-sm">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col gap-10">
              <div className="flex items-center justify-end">
                <div className="hidden items-center gap-3 md:flex">
                  <Link
                    to="/"
                    className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 text-base font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Home
                  </Link>
                  <Link
                    to="/clients"
                    className="inline-flex h-11 items-center justify-center rounded-2xl bg-brand-500 px-4 text-base font-medium text-white transition hover:bg-brand-600"
                  >
                    Clients
                  </Link>
                </div>
              </div>

              <div className="grid gap-8 lg:grid-cols-[1.2fr_.8fr] lg:items-end">
                <div className="max-w-3xl">
                  <p className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Partner Command Center
                  </p>
                  <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 md:text-6xl">
                    Control demand, inventory, and credit across your retailer
                    network.
                  </h1>
                  <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
                    Zistributo for partners gives distributors one operational
                    system to plan stock, process orders, manage fulfillment,
                    and track collections in real time.
                  </p>
                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <Link
                      to="/"
                      className="inline-flex h-12 items-center justify-center rounded-2xl bg-brand-500 px-6 text-base font-medium text-white transition hover:bg-brand-600"
                    >
                      Back to Home
                    </Link>
                    <Link
                      to="/clients"
                      className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 text-base font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      Explore Client Side
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
                  <Card className="rounded-3xl border-emerald-200/80 bg-white/80 shadow-sm">
                    <CardContent className="flex items-start gap-3 p-5">
                      <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                        <Boxes className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Inventory</p>
                        <p className="mt-1 text-lg font-semibold text-slate-950">
                          Batch-aware inventory and demand visibility.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="rounded-3xl border-sky-200/80 bg-white/80 shadow-sm">
                    <CardContent className="flex items-start gap-3 p-5">
                      <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
                        <Truck className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Fulfillment</p>
                        <p className="mt-1 text-lg font-semibold text-slate-950">
                          From reorder to dispatch with operational control.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="rounded-3xl border-amber-200/80 bg-white/80 shadow-sm md:col-span-2 lg:col-span-1">
                    <CardContent className="flex items-start gap-3 p-5">
                      <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
                        <CreditCard className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">
                          Credit & Billing
                        </p>
                        <p className="mt-1 text-lg font-semibold text-slate-950">
                          Credits, collections, and billing in one workflow.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <section className="grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
          <Card className="rounded-3xl border-slate-200/80 shadow-sm">
            <CardContent className="p-6 md:p-7">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                The Problem
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                Distribution is fragmented across calls, chats, and spreadsheets.
              </h2>
              <div className="mt-6 grid gap-4 text-sm leading-7 text-slate-600">
                <p>Demand planning is reactive and often inaccurate.</p>
                <p>
                  Dispatch teams work without clear route or priority visibility.
                </p>
                <p>Retailer credit cycles are hard to monitor at scale.</p>
                <p>Collections, invoices, and margins rarely stay aligned.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-slate-200/80 shadow-sm">
            <CardContent className="p-6 md:p-7">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                The Solution
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                One partner workspace for supply, dispatch, and collections.
              </h2>
              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <div className="rounded-3xl border border-sky-200/80 bg-sky-50/70 p-5">
                  <p className="text-lg font-semibold text-slate-950">
                    Operations
                  </p>
                  <div className="mt-4 grid gap-2 text-sm text-slate-600">
                    <p>Forecast demand by retailer and category</p>
                    <p>Track inventory by batch and shelf life</p>
                    <p>Plan dispatch by route and urgency</p>
                    <p>Monitor order to delivery cycle time</p>
                  </div>
                </div>
                <div className="rounded-3xl border border-emerald-200/80 bg-emerald-50/70 p-5">
                  <p className="text-lg font-semibold text-slate-950">
                    Finance
                  </p>
                  <div className="mt-4 grid gap-2 text-sm text-slate-600">
                    <p>Define credit limits per retailer</p>
                    <p>Auto-generate invoices from fulfilled orders</p>
                    <p>Track collections and overdue accounts</p>
                    <p>Measure contribution and payment behavior</p>
                  </div>
                </div>
              </div>
              <p className="mt-6 text-base font-medium text-slate-700">
                Execution and finance stay connected in real-time.
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
          <Card className="rounded-3xl border-slate-200/80 shadow-sm">
            <CardContent className="p-6 md:p-7">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                How It Works
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                Signal to settlement, in one connected partner loop.
              </h2>
              <div className="mt-6 grid gap-3">
                {partnerFlow.map((step, index) => (
                  <div
                    key={step}
                    className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white px-4 py-3"
                  >
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                      {index + 1}
                    </div>
                    <p className="text-sm font-medium text-slate-700">
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6">
            <Card className="rounded-3xl border-slate-200/80 shadow-sm">
              <CardContent className="p-6 md:p-7">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Core Features
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  {partnerFeatureBlocks.map((feature) => (
                    <div
                      key={feature}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
                    >
                      {feature}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-slate-200/80 shadow-sm">
              <CardContent className="p-6 md:p-7">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Why Partners Choose It
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                  Built for distributor operations, not generic retail workflows.
                </h2>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  Zistributo aligns teams across planning, warehouse, dispatch,
                  and collections so partner businesses can scale with tighter
                  control and better working capital performance.
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-slate-200/80 shadow-sm">
              <CardContent className="p-6 md:p-7">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Ecosystem Fit
                </p>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="inline-flex rounded-xl bg-slate-100 p-2 text-slate-700">
                      <Store className="h-4 w-4" />
                    </div>
                    <p className="mt-3 text-sm font-medium text-slate-700">
                      Stronger retailer relationships with better service levels.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="inline-flex rounded-xl bg-slate-100 p-2 text-slate-700">
                      <PackageSearch className="h-4 w-4" />
                    </div>
                    <p className="mt-3 text-sm font-medium text-slate-700">
                      Better inventory turns from sharper demand visibility.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <Card className="rounded-3xl border-none bg-slate-950 text-white shadow-sm">
          <CardContent className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between md:p-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                Final CTA
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                Ready to run your distribution network with full visibility?
              </h2>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to="/clients"
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-white px-6 text-base font-medium text-slate-950 transition hover:bg-slate-100"
              >
                Explore Client Side
              </Link>
              <Link
                to="/"
                className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-700 px-6 text-base font-medium text-white transition hover:bg-slate-900"
              >
                Back to Home
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
