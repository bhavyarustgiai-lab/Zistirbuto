import {
  ArrowRight,
  Boxes,
  CreditCard,
  ShieldCheck,
  Sparkles,
  Truck,
  Warehouse,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@components/ui/card";

const operatingSignals = [
  "Live stock visibility across brands and batches",
  "Order desk workflows for teams, approvals, and exceptions",
  "Credit, receivables, and payment tracking in one ledger",
  "Dispatch readiness tied to actual inventory availability",
];

const controlLayers = [
  {
    title: "Inventory Control",
    description:
      "Track fast-moving SKUs, aging stock, inward receipts, and sell-through without juggling spreadsheets.",
    icon: Warehouse,
    tone: "bg-emerald-100 text-emerald-700",
  },
  {
    title: "Order Operations",
    description:
      "Move from incoming demand to confirmed dispatch with one shared workflow for sales and ops.",
    icon: Boxes,
    tone: "bg-sky-100 text-sky-700",
  },
  {
    title: "Collections",
    description:
      "Keep credit exposure, invoice status, payment follow-up, and partner history visible in real time.",
    icon: CreditCard,
    tone: "bg-amber-100 text-amber-700",
  },
];

const executionFlow = [
  "Capture retailer demand and repeat orders in one place",
  "Reserve stock against actual inventory and buying rules",
  "Route orders for billing, dispatch, and follow-up",
  "Track dues, collections, and account health continuously",
];

export function HomePage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#eef4f0_0%,#f7f4ee_44%,#f5f6f8_100%)] text-slate-950">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-6">
        <Card className="overflow-hidden border-none bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(245,158,11,0.16),_transparent_24%),linear-gradient(135deg,_rgba(255,255,255,0.96),_rgba(247,250,248,0.92))] shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <CardContent className="p-6 md:p-8 lg:p-10">
            <div className="flex flex-col gap-10">
              <div className="flex items-center justify-between gap-4">
                <div className="inline-flex items-center gap-3">
                  <div className="rounded-2xl bg-slate-950 p-3 text-white shadow-lg shadow-slate-950/15">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold tracking-tight">
                      Zistributo
                    </p>
                    <p className="text-sm text-slate-500">
                      Distributor operating system for the beauty supply chain
                    </p>
                  </div>
                </div>
                <div className="hidden items-center gap-3 md:flex">
                  <Link
                    to="/login"
                    className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-300 bg-white/80 px-4 text-base font-medium text-slate-700 transition hover:bg-white"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/partners"
                    className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-4 text-base font-medium text-white transition hover:bg-slate-800"
                  >
                    Open Partners App
                  </Link>
                </div>
              </div>

              <div className="grid gap-8 lg:grid-cols-[1.1fr_.9fr] lg:items-end">
                <div className="max-w-3xl">
                  <p className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">
                    Built For Distributors
                  </p>
                  <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 md:text-6xl">
                    Run inventory, orders, dispatch, and collections from one
                    distributor command center.
                  </h1>
                  <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
                    Zistributo is now focused on the partner application only.
                    Give your distribution team a single workspace for stock
                    control, account visibility, fulfillment execution, and
                    receivables management.
                  </p>
                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <Link
                      to="/partners"
                      className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-950 px-6 text-base font-medium text-white transition hover:bg-slate-800"
                    >
                      Launch Partners Workspace
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                    <Link
                      to="/login"
                      className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-300 bg-white/80 px-6 text-base font-medium text-slate-700 transition hover:bg-white"
                    >
                      Sign In To Continue
                    </Link>
                  </div>
                </div>

                <div className="grid gap-4">
                  <Card className="rounded-[28px] border-slate-200/80 bg-white/85 shadow-sm">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                            Operating Signals
                          </p>
                          <p className="mt-2 text-2xl font-semibold text-slate-950">
                            Distributor-first visibility
                          </p>
                        </div>
                        <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                          <ShieldCheck className="h-5 w-5" />
                        </div>
                      </div>
                      <div className="mt-5 grid gap-3">
                        {operatingSignals.map((signal) => (
                          <div
                            key={signal}
                            className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-sm font-medium text-slate-700"
                          >
                            {signal}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-3">
                    <Card className="rounded-[28px] border-emerald-200/80 bg-emerald-50/80 shadow-sm">
                      <CardContent className="p-5">
                        <p className="text-sm text-emerald-700">Stock</p>
                        <p className="mt-2 text-3xl font-semibold text-slate-950">
                          Live
                        </p>
                        <p className="mt-2 text-sm text-slate-600">
                          Batch and availability aligned to orders.
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="rounded-[28px] border-sky-200/80 bg-sky-50/80 shadow-sm">
                      <CardContent className="p-5">
                        <p className="text-sm text-sky-700">Dispatch</p>
                        <p className="mt-2 text-3xl font-semibold text-slate-950">
                          Ready
                        </p>
                        <p className="mt-2 text-sm text-slate-600">
                          Orders move with clear operational ownership.
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="rounded-[28px] border-amber-200/80 bg-amber-50/80 shadow-sm">
                      <CardContent className="p-5">
                        <p className="text-sm text-amber-700">Receivables</p>
                        <p className="mt-2 text-3xl font-semibold text-slate-950">
                          Clear
                        </p>
                        <p className="mt-2 text-sm text-slate-600">
                          Credit and collection risk stays visible.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <section className="grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
          <Card className="rounded-[32px] border-slate-200/80 bg-white/85 shadow-sm">
            <CardContent className="p-6 md:p-7">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                Why Change
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                Generic tools break once distributor operations get real.
              </h2>
              <div className="mt-6 grid gap-4 text-sm leading-7 text-slate-600">
                <p>Orders arrive through calls and chats with no clean handoff.</p>
                <p>Inventory teams work without one trusted live stock picture.</p>
                <p>Credit and collections are tracked outside the actual order flow.</p>
                <p>Management gets reports after the problem, not during it.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[32px] border-slate-200/80 bg-slate-950 text-white shadow-sm">
            <CardContent className="p-6 md:p-7">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                What You Get
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                One workspace for commercial teams, warehouse teams, and finance.
              </h2>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {controlLayers.map(({ title, description, icon: Icon, tone }) => (
                  <div
                    key={title}
                    className="rounded-[28px] border border-white/10 bg-white/5 p-5"
                  >
                    <div className={`inline-flex rounded-2xl p-3 ${tone}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="mt-4 text-lg font-semibold">{title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      {description}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-[.95fr_1.05fr]">
          <Card className="rounded-[32px] border-slate-200/80 bg-white/85 shadow-sm">
            <CardContent className="p-6 md:p-7">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                Execution Loop
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                From demand capture to payment follow-up, without context loss.
              </h2>
              <div className="mt-6 grid gap-3">
                {executionFlow.map((step, index) => (
                  <div
                    key={step}
                    className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-3"
                  >
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-950 text-sm font-semibold text-white">
                      {index + 1}
                    </div>
                    <p className="text-sm font-medium text-slate-700">{step}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[32px] border-none bg-[linear-gradient(135deg,rgba(217,247,233,0.9),rgba(255,248,220,0.92))] shadow-sm">
            <CardContent className="flex h-full flex-col justify-between p-6 md:p-7">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-800">
                  Partners Application
                </p>
                <h2 className="mt-3 max-w-xl text-3xl font-semibold tracking-tight text-slate-950">
                  The partners app is now the primary product surface.
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-7 text-slate-700">
                  Public entry, sign-in flow, and navigation now point into the
                  distributor workspace. The client application remains available
                  only when someone directly visits its routes.
                </p>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[28px] border border-white/70 bg-white/70 p-5 backdrop-blur">
                  <div className="inline-flex rounded-2xl bg-white p-3 text-slate-950 shadow-sm">
                    <Truck className="h-5 w-5" />
                  </div>
                  <p className="mt-4 text-lg font-semibold text-slate-950">
                    Dispatch-aware workflows
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Align sales, warehouse, and delivery against the same order
                    state.
                  </p>
                </div>
                <div className="rounded-[28px] border border-white/70 bg-white/70 p-5 backdrop-blur">
                  <div className="inline-flex rounded-2xl bg-white p-3 text-slate-950 shadow-sm">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <p className="mt-4 text-lg font-semibold text-slate-950">
                    Finance tied to execution
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Credit, invoices, and collections stay connected to the
                    actual supply flow.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </section>
    </main>
  );
}
