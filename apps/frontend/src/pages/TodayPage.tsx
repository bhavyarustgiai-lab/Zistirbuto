import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Clock3,
  ChevronDown,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useAppState } from "@app/providers/AppStateProvider";
import { useDayEntries } from "@entities/day-entry/hooks";
import { createPaymentRecord } from "@entities/payment-record/api";
import { useServices } from "@entities/service/hooks";
import { useStaffMembers } from "@entities/staffCapabilities/hooks";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { Card, CardContent } from "@components/ui/card";
import { Dialog } from "@components/ui/dialog";
import { DropdownMenu } from "@components/ui/dropdown-menu";
import { Drawer } from "@components/ui/drawer";
import { Input } from "@components/ui/input";
import { ScrollArea } from "@components/ui/scroll-area";
import { Select } from "@components/ui/select";
import { Separator } from "@components/ui/separator";
import { Tooltip } from "@components/ui/tooltip";
import type {
  DayEntry,
  DayEntryStatus,
  PaymentMode,
  PaymentStatus,
  Service,
} from "@shared/types/domain";
import { makeId } from "@shared/lib/id";
import { todayISO, toLongDate } from "@shared/lib/date";

type VisitStatus = "planned" | "started" | "completed";
type RegisterTab = "planned" | "started" | "completed";

type Visit = {
  id: string;
  date: string;
  customerName: string;
  customerPhone?: string;
  note?: string;
  status: VisitStatus;
  startTime?: string;
  entries: DayEntry[];
  totalAmount: number;
  paidAmount: number;
  paymentStatus: PaymentStatus;
  staffLabel: string;
};

type VisitEditorItem = {
  id?: string;
  serviceId: string;
  staffIds: string[];
  startTime: string;
  priceOverride?: number;
  durationMinutes?: number;
  note: string;
};

type VisitEditorValue = {
  customerName: string;
  customerPhone: string;
  action: "planned" | "start" | "complete";
  items: VisitEditorItem[];
};

type DiscountMode = "percent" | "absolute";
type ServiceOption = Pick<
  Service,
  "id" | "name" | "categoryPath" | "price" | "durationMinutes" | "active"
>;

const registerStatusMeta: Record<
  RegisterTab,
  {
    label: string;
    hint: string;
    segmentClassName: string;
    buttonClassName: string;
    textClassName: string;
  }
> = {
  planned: {
    label: "Planned",
    hint: "Queued next",
    segmentClassName: "bg-amber-400",
    buttonClassName:
      "border-amber-200 bg-amber-50/80 data-[active=true]:border-amber-400 data-[active=true]:bg-amber-100",
    textClassName: "text-amber-700",
  },
  started: {
    label: "Started",
    hint: "In the chair",
    segmentClassName: "bg-sky-500",
    buttonClassName:
      "border-sky-200 bg-sky-50/80 data-[active=true]:border-sky-500 data-[active=true]:bg-sky-100",
    textClassName: "text-sky-700",
  },
  completed: {
    label: "Completed",
    hint: "Ready to bill",
    segmentClassName: "bg-emerald-500",
    buttonClassName:
      "border-emerald-200 bg-emerald-50/80 data-[active=true]:border-emerald-500 data-[active=true]:bg-emerald-100",
    textClassName: "text-emerald-700",
  },
};

function toCurrency(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function calcEntryAmount(
  entry: DayEntry,
  priceByServiceId: Record<string, number | undefined>,
) {
  return entry.priceOverride ?? priceByServiceId[entry.serviceId] ?? 0;
}

function deriveVisitStatus(entries: DayEntry[]): VisitStatus {
  if (
    entries.every(
      (entry) => entry.status === "done" || entry.status === "billed",
    )
  ) {
    return "completed";
  }
  if (entries.some((entry) => entry.status === "in_progress")) {
    return "started";
  }
  if (entries.every((entry) => entry.status === "planned")) return "planned";
  return "started";
}

function shiftISODate(days: number) {
  const base = new Date(`${todayISO()}T00:00:00`);
  base.setDate(base.getDate() + days);
  return base.toISOString().slice(0, 10);
}

function getDefaultStartTime(date: string) {
  if (date !== todayISO()) return "10:00";
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(Math.floor(now.getMinutes() / 5) * 5).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function getStatusKeyForVisit(status: VisitStatus): RegisterTab {
  return status;
}

export function TodayPage() {
  const { currentClientId } = useAppState();
  const [dateMode, setDateMode] = useState<"today" | "yesterday" | "custom">(
    "today",
  );
  const [customDate, setCustomDate] = useState(todayISO());
  const selectedDate =
    dateMode === "today"
      ? todayISO()
      : dateMode === "yesterday"
        ? shiftISODate(-1)
        : customDate;

  const dayEntryApi = useDayEntries(
    currentClientId,
    selectedDate,
    selectedDate,
  );
  const serviceApi = useServices(currentClientId);
  const staffApi = useStaffMembers(currentClientId);

  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedVisitId, setSelectedVisitId] = useState<string | undefined>();
  const [editorMode, setEditorMode] = useState<
    "new" | "edit" | "start" | "complete"
  >(
    "edit",
  );
  const [registerTab, setRegisterTab] = useState<RegisterTab>("started");

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentTargetVisitId, setPaymentTargetVisitId] = useState<
    string | undefined
  >();
  const [completionOpen, setCompletionOpen] = useState(false);
  const [completionVisitId, setCompletionVisitId] = useState<
    string | undefined
  >();

  const priceByServiceId = useMemo(
    () =>
      Object.fromEntries(
        serviceApi.items.map((service) => [service.id, service.price]),
      ) as Record<string, number | undefined>,
    [serviceApi.items],
  );

  const staffById = useMemo(
    () =>
      Object.fromEntries(
        staffApi.items.map((member) => [member.userId, member]),
      ),
    [staffApi.items],
  );

  const activeServices = useMemo(
    () => serviceApi.items.filter((service) => service.active),
    [serviceApi.items],
  );
  const popularServices = useMemo(() => {
    const counts = new Map<string, number>();
    for (const entry of dayEntryApi.items) {
      counts.set(entry.serviceId, (counts.get(entry.serviceId) ?? 0) + 1);
    }
    return [...activeServices]
      .sort(
        (a, b) =>
          (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0) ||
          a.name.localeCompare(b.name),
      )
      .slice(0, 6);
  }, [activeServices, dayEntryApi.items]);

  const visits = useMemo(() => {
    const grouped = new Map<string, DayEntry[]>();
    for (const entry of dayEntryApi.items) {
      if (entry.status === "cancelled") continue;
      const key = entry.visitId ?? entry.id;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(entry);
    }

    const rows: Visit[] = Array.from(grouped.entries()).map(
      ([visitId, entries]) => {
        const sorted = [...entries].sort((a, b) =>
          (a.startTime ?? "99:99").localeCompare(b.startTime ?? "99:99"),
        );
        const totalAmount = sorted.reduce(
          (sum, entry) => sum + calcEntryAmount(entry, priceByServiceId),
          0,
        );
        const paidAmount = sorted.reduce(
          (sum, entry) => sum + (entry.paidAmount ?? 0),
          0,
        );
        const paymentStatus: PaymentStatus =
          paidAmount <= 0
            ? "unpaid"
            : paidAmount >= totalAmount
              ? "paid"
              : "partial";

        const staffNames = Array.from(
          new Set(
            sorted
              .flatMap((entry) =>
                entry.staffIds?.length ? entry.staffIds : [entry.staffId],
              )
              .map((id) => staffById[id]?.name)
              .filter(Boolean),
          ),
        ) as string[];

        return {
          id: visitId,
          date: sorted[0]?.date ?? selectedDate,
          customerName: sorted[0]?.customerName || "Walk-in",
          customerPhone: sorted[0]?.customerPhone,
          note: sorted.find((entry) => entry.note)?.note,
          status: deriveVisitStatus(sorted),
          startTime: sorted[0]?.startTime,
          entries: sorted,
          totalAmount,
          paidAmount,
          paymentStatus,
          staffLabel: staffNames.join(", ") || "Unassigned",
        };
      },
    );

    return rows.sort((a, b) =>
      (a.startTime ?? "99:99").localeCompare(b.startTime ?? "99:99"),
    );
  }, [dayEntryApi.items, priceByServiceId, selectedDate, staffById]);

  const selectedVisit = visits.find((visit) => visit.id === selectedVisitId);
  const paymentTargetVisit = visits.find(
    (visit) => visit.id === paymentTargetVisitId,
  );
  const completionTargetVisit = visits.find(
    (visit) => visit.id === completionVisitId,
  );

  const openPrintableBill = (visit: Visit) => {
    const serviceById = Object.fromEntries(
      serviceApi.items.map((service) => [service.id, service]),
    ) as Record<string, Service | undefined>;
    const rows = visit.entries.map((entry) => {
      const service = serviceById[entry.serviceId];
      return {
        name: service?.name ?? "Service",
        amount: calcEntryAmount(entry, priceByServiceId),
        staff:
          (entry.staffIds?.length ? entry.staffIds : [entry.staffId])
            .map((id) => staffById[id]?.name)
            .filter(Boolean)
            .join(", ") || "Unassigned",
        startTime: entry.startTime ?? "--:--",
      };
    });

    const total = rows.reduce((sum, row) => sum + row.amount, 0);
    const billWindow = window.open("", "_blank", "noopener,noreferrer");
    if (!billWindow) return;

    const rowsHtml = rows
      .map(
        (row) => `
          <tr>
            <td>${escapeHtml(row.name)}</td>
            <td>${escapeHtml(row.staff)}</td>
            <td>${escapeHtml(row.startTime)}</td>
            <td class="amount">${escapeHtml(toCurrency(row.amount))}</td>
          </tr>
        `,
      )
      .join("");

    billWindow.document.write(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Bill - ${escapeHtml(visit.customerName || "Walk-in")}</title>
    <style>
      body {
        margin: 0;
        background: #f8fafc;
        color: #0f172a;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      .page {
        max-width: 840px;
        margin: 0 auto;
        padding: 32px 24px 48px;
      }
      .card {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 24px;
        padding: 24px;
      }
      .topbar {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 24px;
        margin-bottom: 24px;
      }
      .brand {
        font-size: 28px;
        font-weight: 700;
        margin: 0;
      }
      .subtle {
        color: #64748b;
        font-size: 14px;
        margin-top: 6px;
      }
      .print-button {
        border: 0;
        border-radius: 999px;
        background: #4f46e5;
        color: white;
        padding: 12px 18px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 20px;
      }
      th, td {
        text-align: left;
        padding: 12px 0;
        border-bottom: 1px solid #e2e8f0;
        font-size: 14px;
      }
      th {
        color: #64748b;
        font-weight: 600;
      }
      .amount {
        text-align: right;
        font-weight: 600;
      }
      .summary {
        display: flex;
        justify-content: flex-end;
        margin-top: 18px;
      }
      .summary-row {
        min-width: 220px;
        display: flex;
        justify-content: space-between;
        gap: 24px;
        font-size: 16px;
        font-weight: 700;
      }
      @media print {
        body {
          background: white;
        }
        .page {
          max-width: none;
          padding: 0;
        }
        .card {
          border: 0;
          border-radius: 0;
          padding: 0;
        }
        .print-button {
          display: none;
        }
      }
    </style>
  </head>
  <body>
    <div class="page">
      <div class="card">
        <div class="topbar">
          <div>
            <h1 class="brand">Zistributo</h1>
            <div class="subtle">${escapeHtml(toLongDate(visit.date))}</div>
            <div class="subtle">Customer: ${escapeHtml(visit.customerName || "Walk-in")}</div>
            <div class="subtle">Phone: ${escapeHtml(visit.customerPhone || "-")}</div>
          </div>
          <button class="print-button" onclick="window.print()">Print Bill</button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Service</th>
              <th>Staff</th>
              <th>Time</th>
              <th class="amount">Amount</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
        <div class="summary">
          <div class="summary-row">
            <span>Total</span>
            <span>${escapeHtml(toCurrency(total))}</span>
          </div>
        </div>
      </div>
    </div>
  </body>
</html>`);
    billWindow.document.close();
  };

  const groupedVisits = useMemo(
    () => ({
      started: visits.filter((visit) => visit.status === "started"),
      completed: visits.filter((visit) => visit.status === "completed"),
      planned: visits.filter((visit) => visit.status === "planned"),
    }),
    [visits],
  );
  const registerStats = useMemo(
    () =>
      (["planned", "started", "completed"] as RegisterTab[]).map(
        (key) => ({
          key,
          count: groupedVisits[key].length,
          share:
            visits.length > 0
              ? Math.round((groupedVisits[key].length / visits.length) * 100)
              : 0,
          ...registerStatusMeta[key],
        }),
      ),
    [groupedVisits, visits.length],
  );

  return (
    <section className="relative flex h-[calc(100vh-2.5rem)] min-h-[640px] flex-col gap-4 pb-24">
      <Card className="overflow-hidden border-none bg-[radial-gradient(circle_at_top_left,_rgba(244,114,182,0.14),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(56,189,248,0.12),_transparent_28%),linear-gradient(135deg,_#fffafc,_#f8fbff)] shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col gap-5">
            <div className="space-y-2">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                  Today
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Manage today&apos;s register, walk-ins, and active visits.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={dateMode === "today" ? "default" : "outline"}
                onClick={() => setDateMode("today")}
                className="h-10 rounded-2xl px-5 text-sm"
              >
                Today
              </Button>
              <Button
                variant={dateMode === "yesterday" ? "default" : "outline"}
                onClick={() => setDateMode("yesterday")}
                className="h-10 rounded-2xl px-5 text-sm"
              >
                Yesterday
              </Button>
              <Button
                variant={dateMode === "custom" ? "default" : "outline"}
                onClick={() => setDateMode("custom")}
                className="h-10 rounded-2xl px-5 text-sm"
              >
                Custom
              </Button>
              {dateMode === "custom" ? (
                <Input
                  type="date"
                  value={customDate}
                  onChange={(event) => setCustomDate(event.target.value)}
                  className="h-10 w-[170px] rounded-2xl"
                />
              ) : null}
              </div>
              <Button
                onClick={() => {
                  setSelectedVisitId(undefined);
                  setEditorMode("new");
                  setEditorOpen(true);
                }}
                className="h-10 rounded-2xl px-5 text-sm shadow-[0_10px_30px_rgba(79,70,229,0.20)]"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Visit
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <CardContent className="flex min-h-0 flex-1 flex-col p-0">
          <div className="border-b border-slate-200 px-4 py-4">
            <StatusOverview
              activeStatus={registerTab}
              stats={registerStats}
              total={visits.length}
              onSelect={setRegisterTab}
            />
          </div>

          <ScrollArea className="min-h-0 flex-1">
            <VisitRows
              visits={groupedVisits[registerTab]}
              onEdit={(visitId) => {
                setSelectedVisitId(visitId);
                setEditorMode("edit");
                setEditorOpen(true);
              }}
              primaryActionForVisit={(visitId) => {
                const visit = visits.find((item) => item.id === visitId);
                const visitStatus = visit
                  ? getStatusKeyForVisit(visit.status)
                  : "planned";
                if (visitStatus === "planned") {
                  return {
                    label: "Mark Started",
                    onClick: () => {
                      setSelectedVisitId(visitId);
                      setEditorMode("start");
                      setEditorOpen(true);
                    },
                  };
                }
                if (visitStatus === "started") {
                  return {
                    label: "Complete the visit",
                    icon: <ArrowRight className="ml-2 h-4 w-4" />,
                    onClick: () => {
                      setCompletionVisitId(visitId);
                      setCompletionOpen(true);
                    },
                  };
                }
                if (visitStatus === "completed") {
                  return {
                    label: "Generate Bill",
                    onClick: () => {
                      if (visit) openPrintableBill(visit);
                    },
                  };
                }
                return undefined;
              }}
            />
          </ScrollArea>
        </CardContent>
      </Card>

      <VisitEditorDrawer
        open={editorOpen}
        mode={editorMode}
        visit={selectedVisit}
        dateLabel={selectedDate}
        services={serviceApi.items}
        popularServices={popularServices}
        staff={staffApi.items.map((member) => ({
          id: String(member.userId),
          name: member.name || member.phone,
          active: member.status === "ACTIVE",
        }))}
        onClose={() => setEditorOpen(false)}
        onSubmit={async (value) => {
          const visitId = selectedVisit?.id ?? makeId("visit");
          const action =
            editorMode === "complete"
              ? "complete"
              : editorMode === "start"
                ? "start"
                : value.action;
          const statusForEntries: DayEntryStatus =
            action === "complete"
              ? "done"
              : action === "start"
                ? "in_progress"
                : "planned";

          const existingById = new Map(
            (selectedVisit?.entries ?? []).map((entry) => [entry.id, entry]),
          );
          const keptIds = new Set<string>();

          for (const item of value.items) {
            const patchBase = {
              visitId,
              serviceId: item.serviceId,
              staffId: item.staffIds[0] ?? "",
              staffIds: item.staffIds,
              startTime: item.startTime,
              note: item.note,
              customerName: value.customerName,
              customerPhone: value.customerPhone,
              status: statusForEntries,
              priceOverride: item.priceOverride,
              date: selectedDate,
              clientId: currentClientId,
            };

            if (item.id && existingById.has(item.id)) {
              keptIds.add(item.id);
              await dayEntryApi.update(item.id, patchBase);
            } else {
              await dayEntryApi.create(patchBase);
            }
          }

          if (selectedVisit) {
            for (const entry of selectedVisit.entries) {
              if (!keptIds.has(entry.id)) {
                await dayEntryApi.remove(entry.id);
              }
            }
          }

          await dayEntryApi.refresh();
          setEditorOpen(false);
          setRegisterTab(
            statusForEntries === "in_progress"
              ? "started"
              : statusForEntries === "done"
                ? "completed"
                : "planned",
          );
        }}
      />

      <CompleteVisitDrawer
        open={completionOpen}
        visit={completionTargetVisit}
        services={serviceApi.items}
        title="Complete the visit"
        submitLabel="Confirm"
        submittingLabel="Confirming..."
        onClose={() => setCompletionOpen(false)}
        onSubmit={async (payload) => {
          if (!completionTargetVisit) return;
          for (const item of payload.entries) {
            await dayEntryApi.update(item.id, {
              status: "done",
              priceOverride: item.finalAmount,
            });
          }
          await dayEntryApi.refresh();
          setCompletionOpen(false);
          setRegisterTab("completed");
        }}
      />

      <RecordPaymentDialog
        open={paymentOpen}
        visit={paymentTargetVisit}
        onClose={() => setPaymentOpen(false)}
        onSubmit={async (payload) => {
          if (!paymentTargetVisit) return;

          let remainingToAllocate = payload.amount;
          const entriesByDue = [...paymentTargetVisit.entries]
            .map((entry) => {
              const total = calcEntryAmount(entry, priceByServiceId);
              const paid = entry.paidAmount ?? 0;
              return { entry, due: Math.max(total - paid, 0) };
            })
            .filter((item) => item.due > 0);

          for (const item of entriesByDue) {
            if (remainingToAllocate <= 0) break;
            const allocation = Math.min(item.due, remainingToAllocate);
            if (allocation <= 0) continue;

            await createPaymentRecord({
              clientId: currentClientId,
              dayEntryId: item.entry.id,
              amount: allocation,
              mode: payload.mode,
              note: payload.note,
            });

            remainingToAllocate -= allocation;
          }

          await dayEntryApi.refresh();
          setPaymentOpen(false);
        }}
      />
    </section>
  );
}

function StatusOverview({
  activeStatus,
  stats,
  total,
  onSelect,
}: {
  activeStatus: RegisterTab;
  stats: Array<{
    key: RegisterTab;
    label: string;
    hint: string;
    count: number;
    share: number;
    segmentClassName: string;
    buttonClassName: string;
    textClassName: string;
  }>;
  total: number;
  onSelect: (value: RegisterTab) => void;
}) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-6 xl:grid-cols-4">
        {stats.map((stat) => (
          <button
            key={stat.key}
            type="button"
            data-active={activeStatus === stat.key}
            className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 ${stat.buttonClassName}`}
            onClick={() => onSelect(stat.key)}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {stat.label}
                </p>
                <p className="mt-1 text-xs text-slate-500">{stat.hint}</p>
              </div>
              <div
                className={`rounded-full px-2.5 py-1 text-sm font-semibold ${stat.textClassName} bg-white/90`}
              >
                {stat.count}
              </div>
            </div>
            <p
              className={`mt-3 text-xs font-medium uppercase tracking-[0.18em] ${stat.textClassName}`}
            >
              {stat.share}% of today
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

function VisitRows({
  visits,
  onEdit,
  primaryActionForVisit,
}: {
  visits: Visit[];
  onEdit: (visitId: string) => void;
  primaryActionForVisit: (visitId: string) =>
    | {
        label: string;
        onClick: () => void;
        icon?: JSX.Element;
      }
    | undefined;
}) {
  return (
    <section>
      {visits.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-slate-400">
          No visits in this lane.
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {visits.map((visit) => {
            const primaryAction = primaryActionForVisit(visit.id);

            return (
              <div
                key={visit.id}
                className="flex w-full items-start justify-between gap-3 px-5 py-4 text-left transition hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold text-slate-900 sm:text-xl">
                    {visit.customerName || "Walk-in"}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {visit.entries.length} service
                    {visit.entries.length > 1 ? "s" : ""} · {visit.staffLabel}
                    {visit.startTime ? ` · ${visit.startTime}` : ""}
                  </p>
                </div>

                <div className="ml-auto flex shrink-0 items-center gap-2">
                  <Button
                    variant="outline"
                    className="h-9 rounded-full px-3"
                    onClick={() => onEdit(visit.id)}
                  >
                    Edit
                  </Button>
                  {primaryAction ? (
                    <Button
                      className="h-9 rounded-full px-3"
                      onClick={primaryAction.onClick}
                    >
                      {primaryAction.label}
                      {primaryAction.icon}
                    </Button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function ServiceSearchInput({
  services,
  value,
  onValueChange,
  onSelect,
  placeholder,
  autoFocus,
  inputRef,
  inputClassName,
  disabled,
}: {
  services: ServiceOption[];
  value: string;
  onValueChange: (value: string) => void;
  onSelect: (service: ServiceOption) => void;
  placeholder: string;
  autoFocus?: boolean;
  inputRef?: React.Ref<HTMLInputElement>;
  inputClassName?: string;
  disabled?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const filteredServices = useMemo(() => {
    const query = value.trim().toLowerCase();
    if (!query) return services.slice(0, 8);
    return services.filter((service) => {
      const category = service.categoryPath?.toLowerCase() ?? "";
      return (
        service.name.toLowerCase().includes(query) || category.includes(query)
      );
    });
  }, [services, value]);

  useEffect(() => {
    setActiveIndex(0);
  }, [value, filteredServices.length]);

  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", handleMouseDown);
    return () => window.removeEventListener("mousedown", handleMouseDown);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
        <Input
          ref={inputRef}
          value={value}
          disabled={disabled}
          onFocus={() => {
            if (disabled) return;
            setOpen(true);
          }}
          onChange={(event) => {
            if (disabled) return;
            onValueChange(event.target.value);
            setOpen(true);
          }}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={["pl-9", inputClassName ?? ""].join(" ")}
          onKeyDown={(event) => {
            if (disabled) return;
            if (filteredServices.length === 0) return;
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setOpen(true);
              setActiveIndex((prev) => (prev + 1) % filteredServices.length);
            }
            if (event.key === "ArrowUp") {
              event.preventDefault();
              setOpen(true);
              setActiveIndex(
                (prev) =>
                  (prev - 1 + filteredServices.length) %
                  filteredServices.length,
              );
            }
            if (event.key === "Enter" && open) {
              event.preventDefault();
              const nextService =
                filteredServices[activeIndex] ?? filteredServices[0];
              if (!nextService) return;
              onSelect(nextService);
              setOpen(false);
            }
          }}
        />
      </div>

      {open && !disabled ? (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          {filteredServices.length === 0 ? (
            <p className="px-3 py-3 text-sm text-slate-500">
              No matching services
            </p>
          ) : (
            filteredServices.slice(0, 8).map((service, index) => {
              const active = index === activeIndex;

              return (
                <button
                  key={service.id}
                  type="button"
                  className={`flex w-full items-center justify-between gap-3 px-3 py-3 text-left transition ${
                    active ? "bg-slate-100" : "hover:bg-slate-50"
                  }`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => {
                    onSelect(service);
                    setOpen(false);
                  }}
                >
                  <span className="min-w-0 truncate text-sm font-semibold text-slate-900">
                    {service.name}
                  </span>
                  <span className="shrink-0 text-sm font-semibold text-slate-600">
                    {toCurrency(service.price ?? 0)}
                  </span>
                </button>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
}

function VisitEditorDrawer({
  open,
  mode,
  visit,
  dateLabel,
  services,
  popularServices,
  staff,
  onClose,
  onSubmit,
}: {
  open: boolean;
  mode: "new" | "edit" | "start" | "complete";
  visit?: Visit;
  dateLabel: string;
  services: ServiceOption[];
  popularServices: ServiceOption[];
  staff: Array<{ id: string; name: string; active: boolean }>;
  onClose: () => void;
  onSubmit: (value: VisitEditorValue) => Promise<void>;
}) {
  type VisitFlowStage = "draft" | "planned" | "started";
  const activeServices = services.filter((service) => service.active);
  const defaultStaffId =
    staff.find((member) => member.active)?.id ?? staff[0]?.id ?? "";

  const [customerName, setCustomerName] = useState("");
  const [customerPhoneDraft, setCustomerPhoneDraft] = useState("");
  const [serviceQuery, setServiceQuery] = useState("");
  const [items, setItems] = useState<VisitEditorItem[]>(
    visit?.entries.map((entry) => ({
      id: entry.id,
      serviceId: entry.serviceId,
      staffIds: entry.staffIds?.length ? entry.staffIds : [entry.staffId],
      startTime: entry.startTime ?? "10:00",
      priceOverride: entry.priceOverride,
      durationMinutes:
        services.find((service) => service.id === entry.serviceId)
          ?.durationMinutes ?? 30,
      note: entry.note ?? "",
    })) ?? [],
  );
  const [removingItems, setRemovingItems] = useState<string[]>([]);
  const [addedItemId, setAddedItemId] = useState<string>("");
  const [submitAction, setSubmitAction] =
    useState<VisitEditorValue["action"]>("planned");
  const [saving, setSaving] = useState(false);
  const [visitStage, setVisitStage] = useState<VisitFlowStage>("draft");
  const formRef = useRef<HTMLFormElement>(null);
  const customerNameInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (!open) return;
    setCustomerName(visit?.customerName ?? "");
    setCustomerPhoneDraft(visit?.customerPhone ?? "");
    setItems(
      visit?.entries.map((entry) => ({
        id: entry.id,
        serviceId: entry.serviceId,
        staffIds: entry.staffIds?.length ? entry.staffIds : [entry.staffId],
        startTime: entry.startTime ?? "10:00",
        priceOverride: entry.priceOverride,
        durationMinutes:
          services.find((service) => service.id === entry.serviceId)
            ?.durationMinutes ?? 30,
        note: entry.note ?? "",
      })) ?? [],
    );
    setServiceQuery("");
    setRemovingItems([]);
    setAddedItemId("");
    setSubmitAction(
      mode === "complete"
        ? "complete"
        : mode === "start"
          ? "start"
          : mode === "edit" && visit?.status === "completed"
            ? "complete"
            : "planned",
    );
    setVisitStage(
      mode === "complete" || mode === "start" || visit?.status === "started"
        ? "started"
        : visit?.status === "planned"
          ? "planned"
          : "draft",
    );
    window.setTimeout(() => {
      if (visit?.customerName) {
        searchInputRef.current?.focus();
      } else {
        customerNameInputRef.current?.focus();
      }
    }, 10);
  }, [open, visit, services, mode]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key !== "Enter") return;
      event.preventDefault();
      if (!customerName.trim() || items.length === 0 || saving) return;
      setSubmitAction(
        mode === "complete"
          ? "complete"
          : mode === "start"
            ? "start"
            : mode === "edit" && visit?.status === "completed"
              ? "complete"
            : visitStage === "started"
              ? "complete"
              : "start",
      );
      formRef.current?.requestSubmit();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [customerName, items.length, mode, open, saving, visit?.status, visitStage]);

  const serviceById = useMemo(
    () => Object.fromEntries(services.map((service) => [service.id, service])),
    [services],
  );
  const activeStaff = useMemo(
    () => staff.filter((member) => member.active),
    [staff],
  );
  const canSave = items.length > 0 && customerName.trim().length > 0;
  const subtitleDate = toLongDate(visit?.date ?? dateLabel);
  const isEditingPlannedVisit = mode === "edit" && visitStage === "planned";
  const isEditingStartedVisit = mode === "edit" && visitStage === "started";
  const isEditingCompletedVisit =
    mode === "edit" && visit?.status === "completed";
  const isEditingExistingVisit =
    isEditingPlannedVisit || isEditingStartedVisit || isEditingCompletedVisit;
  const areServicesLocked = isEditingCompletedVisit;
  const servicesLockedReason =
    "Once the visit is marked completed, you cannot edit the service name";
  const primaryAction =
    mode === "complete"
      ? "complete"
      : mode === "start"
        ? "start"
        : isEditingCompletedVisit
          ? "complete"
        : isEditingPlannedVisit
          ? "planned"
        : isEditingStartedVisit
          ? "start"
        : visitStage === "started"
          ? "complete"
          : "start";
  const secondaryAction =
    isEditingExistingVisit || mode === "start" || mode === "complete"
      ? undefined
      : mode === "new" || mode === "edit"
        ? "planned"
        : undefined;
  const drawerTitle =
    mode === "start"
      ? "Mark Started"
      : mode === "complete"
        ? "Mark Completed"
        : mode === "edit"
          ? "Edit Visit"
          : "New Visit";
  const primaryLabel =
    mode === "start"
      ? "Confirm Started"
      : mode === "complete"
        ? "Confirm Completed"
        : isEditingExistingVisit
          ? "Save Visit"
        : primaryAction === "complete"
          ? "Complete & Bill"
          : "Start Visit";
  const secondaryLabel = "Save as Planned";

  const addService = (service: ServiceOption) => {
    const nextId = makeId("line");
    const nextItem: VisitEditorItem = {
      id: nextId,
      serviceId: service.id,
      staffIds: defaultStaffId ? [defaultStaffId] : [],
      startTime:
        items[items.length - 1]?.startTime ?? getDefaultStartTime(dateLabel),
      priceOverride: undefined,
      durationMinutes: service.durationMinutes ?? 30,
      note: "",
    };
    setItems((prev) => [...prev, nextItem]);
    setServiceQuery("");
    setVisitStage((current) =>
      current === "started"
        ? current
        : current === "planned"
          ? current
          : "draft",
    );
    setAddedItemId(nextId);
    window.setTimeout(
      () =>
        rowRefs.current[nextId]?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        }),
      50,
    );
    window.setTimeout(() => setAddedItemId(""), 1000);
  };

  const removeService = (rowId: string, rowIndex: number) => {
    setRemovingItems((prev) => [...prev, rowId]);
    window.setTimeout(() => {
      setItems((prev) => prev.filter((_, index) => index !== rowIndex));
      setRemovingItems((prev) => prev.filter((id) => id !== rowId));
    }, 180);
  };

  return (
    <Drawer
      open={open}
      title={drawerTitle}
      onClose={onClose}
      hideHeader
      className="bg-slate-50"
      bodyClassName="h-full"
    >
      <form
        ref={formRef}
        className="flex h-full min-h-0 flex-col"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!canSave) return;
          setSaving(true);
          try {
            await onSubmit({
              customerName: customerName.trim(),
              customerPhone: customerPhoneDraft.trim(),
              action: submitAction,
              items,
            });
          } finally {
            setSaving(false);
          }
        }}
      >
        <div className="sticky top-0 z-20 bg-slate-50/95 px-5 pb-4 pt-5 backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-950">
                {drawerTitle}
              </h2>
              <p className="mt-1 text-sm text-slate-500">{subtitleDate}</p>
            </div>
            <button
              type="button"
              aria-label="Close drawer"
              className="rounded-full p-2 text-slate-500 transition hover:bg-white hover:text-slate-700"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-6 px-5 py-5">
            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                CUSTOMER DETAILS
              </h3>
              <div className="rounded-[28px] bg-white p-3 shadow-sm ring-1 ring-slate-200/70 transition-all duration-200">
                <div className="grid gap-3">
                  <label className="grid gap-1.5 text-sm">
                    <span className="font-medium text-slate-700">
                      Customer Name
                    </span>
                    <Input
                      ref={customerNameInputRef}
                      value={customerName}
                      onChange={(event) => setCustomerName(event.target.value)}
                      placeholder="Customer name"
                      className="h-12 rounded-2xl border-slate-200 bg-slate-50 text-sm"
                    />
                  </label>
                  <label className="grid gap-1.5 text-sm">
                    <span className="font-medium text-slate-700">Phone</span>
                    <Input
                      value={customerPhoneDraft}
                      onChange={(event) =>
                        setCustomerPhoneDraft(event.target.value)
                      }
                      placeholder="Phone number"
                      className="h-12 rounded-2xl border-slate-200 bg-slate-50 text-sm"
                    />
                  </label>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Services
                  </h3>
                </div>
                <div className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200/70">
                  {items.length}
                </div>
              </div>
              <ServiceSearchInput
                services={activeServices}
                value={serviceQuery}
                onValueChange={setServiceQuery}
                onSelect={addService}
                placeholder="Add service"
                inputRef={searchInputRef}
                autoFocus={Boolean(customerName.trim())}
                inputClassName="h-12 rounded-2xl border-slate-200 bg-white text-sm shadow-sm"
                disabled={areServicesLocked}
              />
              {areServicesLocked ? (
                <Tooltip content={servicesLockedReason} className="w-fit">
                  <p tabIndex={0} className="text-sm text-slate-500 outline-none">
                    Service selection is locked after completion.
                  </p>
                </Tooltip>
              ) : null}
              {items.length === 0 ? (
                <div className="rounded-3xl bg-white px-4 py-8 text-center shadow-sm ring-1 ring-slate-200/70">
                  <p className="text-sm font-medium text-slate-700">
                    Add the first service to start building this visit.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item, index) => {
                    const service = serviceById[item.serviceId];
                    const rowId = item.id ?? `row_${index}`;
                    const removing = removingItems.includes(rowId);
                    const added = addedItemId === rowId;
                    return (
                      <Card
                        key={rowId}
                        className={[
                          "rounded-3xl border-none bg-white shadow-sm ring-1 ring-slate-200/70 transition-all duration-200",
                          added ? "translate-y-0 ring-brand-300" : "",
                          removing
                            ? "max-h-0 -translate-y-2 overflow-hidden opacity-0"
                            : "max-h-[320px] overflow-visible opacity-100",
                        ].join(" ")}
                      >
                        <CardContent
                          className="grid gap-4 px-4 py-4"
                          ref={(node) => {
                            rowRefs.current[rowId] = node;
                          }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-base font-semibold text-slate-950">
                                {service?.name ?? "Service"}
                              </p>
                              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                                <span className="inline-flex items-center gap-1.5">
                                  <Clock3 className="h-4 w-4" />
                                  {item.durationMinutes ??
                                    service?.durationMinutes ??
                                    30}{" "}
                                  min
                                </span>
                              </div>
                            </div>
                            {areServicesLocked ? (
                              <Tooltip
                                content={servicesLockedReason}
                                className="shrink-0"
                                align="end"
                              >
                                <span
                                  tabIndex={0}
                                  className="inline-flex rounded-full p-2 text-slate-300 outline-none"
                                >
                                  <Trash2 className="h-5 w-5" />
                                </span>
                              </Tooltip>
                            ) : (
                              <button
                                type="button"
                                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-rose-600"
                                onClick={() => removeService(rowId, index)}
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            )}
                          </div>

                          <div className="grid gap-3 text-sm">
                            <label className="grid gap-2 text-sm">
                              <span className="font-medium text-slate-500">
                                Start Time
                              </span>
                              <Input
                                type="time"
                                value={item.startTime}
                                onChange={(event) =>
                                  setItems((prev) =>
                                    prev.map((row, rowIndex) =>
                                      rowIndex === index
                                        ? {
                                            ...row,
                                            startTime: event.target.value,
                                          }
                                        : row,
                                    ),
                                  )
                                }
                                className="h-11 rounded-2xl border-slate-200 bg-slate-50"
                              />
                            </label>
                            <span className="font-medium text-slate-500">
                              Staff
                            </span>
                            <DropdownMenu
                              align="left"
                              contentClassName="w-full min-w-[240px] max-w-[320px]"
                              trigger={
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="h-11 w-full justify-between rounded-2xl border-slate-200 bg-slate-50 px-3 text-sm font-normal text-slate-700"
                                >
                                  <span className="truncate text-left">
                                    {item.staffIds.length > 0
                                      ? activeStaff
                                          .filter((member) =>
                                            item.staffIds.includes(member.id),
                                          )
                                          .map((member) => member.name)
                                          .join(", ")
                                      : "Assign staff (optional)"}
                                  </span>
                                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-slate-400" />
                                </Button>
                              }
                              items={activeStaff.map((member) => {
                                const selected = item.staffIds.includes(
                                  member.id,
                                );
                                return {
                                  id: `${rowId}_${member.id}`,
                                  label: `${selected ? "✓ " : ""}${member.name}`,
                                  keepOpenOnSelect: true,
                                  onClick: () =>
                                    setItems((prev) =>
                                      prev.map((row, rowIndex) => {
                                        if (rowIndex !== index) return row;
                                        const has = row.staffIds.includes(
                                          member.id,
                                        );
                                        return {
                                          ...row,
                                          staffIds: has
                                            ? row.staffIds.filter(
                                                (staffId) =>
                                                  staffId !== member.id,
                                              )
                                            : [...row.staffIds, member.id],
                                        };
                                      }),
                                    ),
                                };
                              })}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </ScrollArea>

        <div className="sticky bottom-0 z-20 -mx-0 bg-white/95 px-5 py-4 backdrop-blur ring-1 ring-slate-200/70">
          {!canSave ? (
            <p className="text-sm text-slate-500">
              Add at least one service and customer name to continue.
            </p>
          ) : null}

          <div
            className={`grid gap-2 ${canSave ? "grid-cols-2" : "grid-cols-1"}`}
          >
            {canSave && secondaryAction ? (
              <Button
                type="submit"
                variant="outline"
                className="h-12 rounded-2xl border-slate-200 bg-white text-sm font-semibold shadow-sm"
                disabled={saving}
                onClick={() => setSubmitAction(secondaryAction)}
              >
                {saving && submitAction === secondaryAction
                  ? "Saving..."
                  : secondaryLabel}
              </Button>
            ) : null}
            <Button
              type="submit"
              className="h-12 rounded-2xl text-sm font-semibold shadow-[0_10px_30px_rgba(79,70,229,0.20)]"
              disabled={!canSave || saving}
              onClick={() => setSubmitAction(primaryAction)}
            >
              {saving && submitAction === primaryAction
                ? "Saving..."
                : primaryLabel}
            </Button>
          </div>
        </div>
      </form>
    </Drawer>
  );
}

function CompleteVisitDrawer({
  open,
  visit,
  services,
  title,
  submitLabel,
  submittingLabel,
  onClose,
  onSubmit,
}: {
  open: boolean;
  visit?: Visit;
  services: Array<{
    id: string;
    name: string;
    price?: number;
    durationMinutes?: number;
    active: boolean;
  }>;
  title: string;
  submitLabel: string;
  submittingLabel: string;
  onClose: () => void;
  onSubmit: (payload: {
    entries: Array<{ id: string; finalAmount: number }>;
  }) => Promise<void>;
}) {
  const [lineDiscount, setLineDiscount] = useState<
    Record<string, { mode: DiscountMode; value: string }>
  >({});
  const [totalDiscount, setTotalDiscount] = useState<{
    mode: DiscountMode;
    value: string;
  }>({ mode: "absolute", value: "" });
  const [saving, setSaving] = useState(false);
  const TAX_RATE = 0.18;

  useEffect(() => {
    if (!open || !visit) return;
    const initial: Record<string, { mode: DiscountMode; value: string }> = {};
    for (const entry of visit.entries) {
      initial[entry.id] = { mode: "absolute", value: "" };
    }
    setLineDiscount(initial);
    setTotalDiscount({ mode: "absolute", value: "" });
  }, [open, visit]);

  const serviceById = useMemo(
    () => Object.fromEntries(services.map((item) => [item.id, item])),
    [services],
  );

  const lineRows = useMemo(() => {
    if (!visit) return [];
    return visit.entries.map((entry) => {
      const base =
        entry.priceOverride ?? serviceById[entry.serviceId]?.price ?? 0;
      const current = lineDiscount[entry.id] ?? { mode: "absolute", value: "" };
      const currentValue = Number(current.value || 0);
      const discountAmount =
        current.mode === "percent" ? (base * currentValue) / 100 : currentValue;
      const appliedDiscount = Math.max(0, Math.min(base, discountAmount));
      return {
        entryId: entry.id,
        serviceName: serviceById[entry.serviceId]?.name ?? "Service",
        base,
        lineDiscount: appliedDiscount,
        afterLineDiscount: base - appliedDiscount,
      };
    });
  }, [lineDiscount, serviceById, visit]);

  const subtotal = lineRows.reduce((sum, row) => sum + row.base, 0);
  const subtotalAfterLine = lineRows.reduce(
    (sum, row) => sum + row.afterLineDiscount,
    0,
  );
  const totalDiscountNumeric = Number(totalDiscount.value || 0);
  const totalDiscountAmountRaw =
    totalDiscount.mode === "percent"
      ? (subtotalAfterLine * totalDiscountNumeric) / 100
      : totalDiscountNumeric;
  const totalDiscountAmount = Math.max(
    0,
    Math.min(subtotalAfterLine, totalDiscountAmountRaw),
  );
  const taxable = Math.max(0, subtotalAfterLine - totalDiscountAmount);
  const taxes = taxable * TAX_RATE;
  const netTotal = taxable + taxes;
  const overallDiscount = subtotal - taxable;

  return (
    <Drawer open={open} title={title} onClose={onClose}>
      <form
        className="flex h-[calc(100vh-8.5rem)] min-h-0 flex-col gap-3 overflow-hidden"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!visit) return;
          const totalAfterLine = lineRows.reduce(
            (sum, row) => sum + row.afterLineDiscount,
            0,
          );
          const distributed = lineRows.map((row) => {
            const share =
              totalAfterLine > 0
                ? (row.afterLineDiscount / totalAfterLine) * totalDiscountAmount
                : 0;
            const finalAmount = Math.max(0, row.afterLineDiscount - share);
            return {
              id: row.entryId,
              finalAmount: Number(finalAmount.toFixed(2)),
            };
          });
          setSaving(true);
          try {
            await onSubmit({ entries: distributed });
          } finally {
            setSaving(false);
          }
        }}
      >
        <ScrollArea className="min-h-0 flex-1 pr-1">
          <Card>
            <CardContent className="p-0">
              <div className="grid grid-cols-[2fr_1fr_2fr_1fr] gap-2 border-b border-slate-200 px-3 py-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                <span>Service Name</span>
                <span>Price</span>
                <span>Discount</span>
                <span>Final Price</span>
              </div>
              {lineRows.map((row) => {
                const mode = (lineDiscount[row.entryId] ?? { mode: "absolute" })
                  .mode;
                const inputValue = lineDiscount[row.entryId]?.value ?? "";
                const share =
                  subtotalAfterLine > 0
                    ? (row.afterLineDiscount / subtotalAfterLine) *
                      totalDiscountAmount
                    : 0;
                const finalPrice = Math.max(0, row.afterLineDiscount - share);
                return (
                  <div
                    key={row.entryId}
                    className="grid grid-cols-[2fr_1fr_2fr_1fr] items-center gap-2 border-b border-slate-100 px-3 py-2 last:border-b-0"
                  >
                    <p className="truncate text-sm text-slate-900">
                      {row.serviceName}
                    </p>
                    <p className="text-sm text-slate-700">
                      {toCurrency(row.base)}
                    </p>
                    <div className="grid grid-cols-[1fr_1fr] gap-2">
                      <Select
                        value={mode}
                        onValueChange={(value) =>
                          setLineDiscount((prev) => ({
                            ...prev,
                            [row.entryId]: {
                              ...(prev[row.entryId] ?? { value: "" }),
                              mode: value as DiscountMode,
                            },
                          }))
                        }
                        options={[
                          { value: "absolute", label: "Absolute" },
                          { value: "percent", label: "Percent" },
                        ]}
                      />
                      <Input
                        type="number"
                        min={0}
                        max={mode === "percent" ? 100 : undefined}
                        value={inputValue}
                        onChange={(event) => {
                          const rawText = event.target.value;
                          if (rawText === "") {
                            setLineDiscount((prev) => ({
                              ...prev,
                              [row.entryId]: {
                                ...(prev[row.entryId] ?? { mode: "absolute" }),
                                value: "",
                              },
                            }));
                            return;
                          }
                          const raw = Number(rawText);
                          const next =
                            mode === "percent"
                              ? Math.min(100, Math.max(0, raw))
                              : Math.max(0, raw);
                          setLineDiscount((prev) => ({
                            ...prev,
                            [row.entryId]: {
                              ...(prev[row.entryId] ?? { mode: "absolute" }),
                              value: String(next),
                            },
                          }));
                        }}
                        className="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                    </div>
                    <p className="text-sm font-medium text-slate-900">
                      {toCurrency(Number(finalPrice.toFixed(2)))}
                    </p>
                  </div>
                );
              })}
              <div className="grid grid-cols-[2fr_1fr_2fr_1fr] items-center gap-2 border-t border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-sm font-semibold text-slate-900">Summary</p>
                <p className="text-sm font-medium text-slate-700">
                  {toCurrency(subtotal)}
                </p>
                <div className="grid grid-cols-[1fr_1fr] gap-2">
                  <Select
                    value={totalDiscount.mode}
                    onValueChange={(value) =>
                      setTotalDiscount((prev) => ({
                        ...prev,
                        mode: value as DiscountMode,
                      }))
                    }
                    options={[
                      { value: "absolute", label: "Absolute" },
                      { value: "percent", label: "Percent" },
                    ]}
                  />
                  <Input
                    type="number"
                    min={0}
                    max={totalDiscount.mode === "percent" ? 100 : undefined}
                    value={totalDiscount.value}
                    onChange={(event) => {
                      const rawText = event.target.value;
                      if (rawText === "") {
                        setTotalDiscount((prev) => ({ ...prev, value: "" }));
                        return;
                      }
                      const raw = Number(rawText);
                      const next =
                        totalDiscount.mode === "percent"
                          ? Math.min(100, Math.max(0, raw))
                          : Math.max(0, raw);
                      setTotalDiscount((prev) => ({
                        ...prev,
                        value: String(next),
                      }));
                    }}
                    className="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                </div>
                <p className="text-sm font-semibold text-slate-900">
                  {toCurrency(taxable)}
                </p>
              </div>
            </CardContent>
          </Card>
        </ScrollArea>

        <div className="mt-auto -mx-5 border-t border-slate-200 bg-white px-5 py-2">
          <div className="grid gap-1 pb-2 text-sm">
            <div className="flex items-center justify-between text-slate-600">
              <span>Subtotal</span>
              <span>{toCurrency(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Discount</span>
              <span>{toCurrency(overallDiscount)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Taxes (18%)</span>
              <span>{toCurrency(taxes)}</span>
            </div>
            <div className="flex items-center justify-between text-base font-semibold text-slate-900">
              <span>Net Total</span>
              <span>{toCurrency(netTotal)}</span>
            </div>
          </div>
          <Separator className="mb-2" />
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!visit || saving}>
              {saving ? submittingLabel : submitLabel}
            </Button>
          </div>
        </div>
      </form>
    </Drawer>
  );
}

function RecordPaymentDialog({
  open,
  visit,
  onClose,
  onSubmit,
}: {
  open: boolean;
  visit?: Visit;
  onClose: () => void;
  onSubmit: (payload: {
    amount: number;
    mode: PaymentMode;
    note: string;
  }) => Promise<void>;
}) {
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<PaymentMode>("cash");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const remaining = Math.max(
    (visit?.totalAmount ?? 0) - (visit?.paidAmount ?? 0),
    0,
  );

  useEffect(() => {
    if (!open) return;
    setAmount("");
    setMode("cash");
    setNote("");
  }, [open, visit?.id]);

  return (
    <Dialog open={open} title="Record Payment" onClose={onClose}>
      <form
        className="grid gap-3"
        onSubmit={async (event) => {
          event.preventDefault();
          const numericAmount = Number(amount || 0);
          if (!visit || numericAmount <= 0) return;

          setSaving(true);
          try {
            await onSubmit({ amount: numericAmount, mode, note });
            setAmount("");
            setNote("");
            setMode("cash");
          } finally {
            setSaving(false);
          }
        }}
      >
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
          <p className="flex items-center justify-between text-slate-600">
            <span>Total</span>
            <strong className="text-slate-900">
              {toCurrency(visit?.totalAmount ?? 0)}
            </strong>
          </p>
          <p className="mt-1 flex items-center justify-between text-slate-600">
            <span>Paid so far</span>
            <strong className="text-slate-900">
              {toCurrency(visit?.paidAmount ?? 0)}
            </strong>
          </p>
          <p className="mt-1 flex items-center justify-between text-slate-600">
            <span>Remaining</span>
            <strong className="text-rose-600">{toCurrency(remaining)}</strong>
          </p>
        </div>

        <label className="grid gap-1.5 text-sm">
          <span className="font-medium text-slate-700">Amount</span>
          <Input
            type="number"
            min={0}
            max={remaining}
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </label>

        <label className="grid gap-1.5 text-sm">
          <span className="font-medium text-slate-700">Mode</span>
          <Select
            value={mode}
            onValueChange={(value) => setMode(value as PaymentMode)}
            options={[
              { value: "cash", label: "Cash" },
              { value: "upi", label: "UPI" },
              { value: "card", label: "Card" },
              { value: "mixed", label: "Mixed" },
            ]}
          />
        </label>

        <label className="grid gap-1.5 text-sm">
          <span className="font-medium text-slate-700">Note</span>
          <Input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Optional"
          />
        </label>

        <div className="mt-1 flex items-center justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving || !visit}>
            {saving ? "Saving..." : "Add Payment"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
