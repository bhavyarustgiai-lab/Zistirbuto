import { useMemo, useState } from "react";
import {
  ChevronRight,
  Search,
  Settings2,
  Sparkles,
  Users2,
} from "lucide-react";
import { useAppState } from "@app/providers/AppStateProvider";
import { useToast } from "@app/ToastProvider";
import { useServices } from "@entities/service/hooks";
import { type StaffMember } from "@entities/staffCapabilities/api";
import {
  useStaffCapabilities,
  useStaffMembers,
} from "@entities/staffCapabilities/hooks";
import { StaffServicesDrawer } from "@features/staff-capabilities/StaffServicesDrawer";
import { Avatar, AvatarFallback, AvatarImage } from "@components/ui/avatar";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@components/ui/card";
import { Input } from "@components/ui/input";
import { ScrollArea } from "@components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@components/ui/tabs";
import { cn } from "@shared/lib/cn";
import type { Service } from "@shared/types/domain";

type StaffFilter = "all" | "has_services" | "no_services";

function getInitials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "S";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function StaffPage() {
  const { currentClientId, currentEntityRole } = useAppState();
  const { push } = useToast();
  const membersApi = useStaffMembers(currentClientId);
  const capabilitiesApi = useStaffCapabilities(currentClientId);
  const servicesApi = useServices(currentClientId);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<StaffFilter>("all");
  const [selectedMember, setSelectedMember] = useState<StaffMember>();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const canEdit =
    currentEntityRole === "OWNER" ||
    currentEntityRole === "MANAGER" ||
    currentEntityRole === "ACCOUNT_MANAGER";

  const enabledCapabilitiesByUser = useMemo(() => {
    return capabilitiesApi.items.reduce<Record<string, string[]>>(
      (acc, item) => {
        if (!item.isEnabled) return acc;
        if (!acc[item.userId]) acc[item.userId] = [];
        acc[item.userId].push(item.serviceId);
        return acc;
      },
      {},
    );
  }, [capabilitiesApi.items]);

  const serviceById = useMemo(
    () =>
      Object.fromEntries(
        servicesApi.items.map((service) => [service.id, service]),
      ),
    [servicesApi.items],
  );

  const visibleMembers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return membersApi.items.filter((member) => {
      const matchesQuery =
        !normalized ||
        member.name.toLowerCase().includes(normalized) ||
        member.phone.toLowerCase().includes(normalized);
      if (!matchesQuery) return false;
      const count = enabledCapabilitiesByUser[member.userId]?.length ?? 0;
      if (filter === "has_services") return count > 0;
      if (filter === "no_services") return count === 0;
      return true;
    });
  }, [enabledCapabilitiesByUser, filter, membersApi.items, query]);

  const selectedServiceIds = selectedMember
    ? (enabledCapabilitiesByUser[selectedMember.userId] ?? [])
    : [];

  const openDrawer = (member: StaffMember) => {
    setSelectedMember(member);
    setDrawerOpen(true);
  };

  return (
    <section className="grid gap-4 py-0">
      <StaffHeader />

      <StaffFiltersBar
        query={query}
        onQueryChange={setQuery}
        filter={filter}
        onFilterChange={setFilter}
      />

      <StaffList
        members={visibleMembers}
        serviceById={serviceById}
        enabledCapabilitiesByUser={enabledCapabilitiesByUser}
        canEdit={canEdit}
        onOpenMember={openDrawer}
      />

      <StaffServicesDrawer
        open={drawerOpen}
        member={selectedMember}
        services={servicesApi.items}
        selectedServiceIds={selectedServiceIds}
        canEdit={canEdit}
        saving={saving}
        onClose={() => setDrawerOpen(false)}
        onSave={async (serviceIds) => {
          if (!selectedMember) return;
          setSaving(true);
          try {
            await capabilitiesApi.update(selectedMember.userId, serviceIds);
            push({
              title: "Staff services updated",
              description: selectedMember.name,
              tone: "success",
            });
            setDrawerOpen(false);
          } catch (error) {
            push({
              title: "Unable to update services",
              description:
                error instanceof Error ? error.message : "Unknown error",
              tone: "error",
            });
          } finally {
            setSaving(false);
          }
        }}
      />
    </section>
  );
}

function StaffHeader() {
  return (
    <Card className="overflow-hidden border-none bg-[radial-gradient(circle_at_top_left,_rgba(244,114,182,0.12),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(56,189,248,0.10),_transparent_28%),linear-gradient(135deg,_#fffafc,_#f8fbff)] shadow-sm">
      <CardContent className="p-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            Manage staff
          </h1>
          <CardDescription className="text-sm text-slate-500">
            Assign which services each staff member can perform.
          </CardDescription>
        </div>
      </CardContent>
    </Card>
  );
}

function StaffFiltersBar({
  query,
  onQueryChange,
  filter,
  onFilterChange,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  filter: StaffFilter;
  onFilterChange: (value: StaffFilter) => void;
}) {
  return (
    <Card className="border-slate-200/80 shadow-sm">
      <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
        <div className="relative min-w-[280px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
          <Input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search staff by name or phone"
            className="h-11 rounded-2xl border-slate-200 bg-slate-50 pl-9"
          />
        </div>

        <Tabs
          value={filter}
          onValueChange={(value) => onFilterChange(value as StaffFilter)}
        >
          <TabsList className="rounded-2xl bg-slate-100 p-1">
            <TabsTrigger value="all" className="rounded-xl px-4">
              All
            </TabsTrigger>
            <TabsTrigger value="has_services" className="rounded-xl px-4">
              Has services
            </TabsTrigger>
            <TabsTrigger value="no_services" className="rounded-xl px-4">
              No services
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function StaffList({
  members,
  serviceById,
  enabledCapabilitiesByUser,
  canEdit,
  onOpenMember,
}: {
  members: StaffMember[];
  serviceById: Record<string, Service>;
  enabledCapabilitiesByUser: Record<string, string[]>;
  canEdit: boolean;
  onOpenMember: (member: StaffMember) => void;
}) {
  return (
    <Card className="min-h-[420px] border-slate-200/80 shadow-sm">
      <CardContent className="p-0">
        {members.length === 0 ? (
          <StaffEmptyState />
        ) : (
          <ScrollArea className="max-h-[calc(100vh-18.5rem)]">
            <div className="p-3">
              <div className="space-y-2">
                {members.map((member) => {
                  const assignedIds =
                    enabledCapabilitiesByUser[member.userId] ?? [];
                  const assignedServices = assignedIds
                    .map((serviceId) => serviceById[serviceId])
                    .filter(Boolean) as Service[];
                  const previewServices = assignedServices.slice(0, 4);
                  const remainingCount = Math.max(
                    assignedServices.length - previewServices.length,
                    0,
                  );

                  return (
                    <button
                      key={member.userId}
                      type="button"
                      className="flex w-full items-center gap-4 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-left transition hover:bg-slate-50/80 focus:outline-none focus:ring-2 focus:ring-brand-300/60"
                      onClick={() => onOpenMember(member)}
                    >
                      <Avatar className="h-11 w-11 shrink-0">
                        {member.avatarUrl ? (
                          <AvatarImage
                            src={member.avatarUrl}
                            alt={member.name}
                          />
                        ) : null}
                        <AvatarFallback>
                          {getInitials(member.name || member.phone)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3">
                          <p className="truncate text-sm font-semibold text-slate-950">
                            {member.name || member.phone}
                          </p>
                          <Badge className="hidden rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] text-slate-600 sm:inline-flex">
                            {assignedServices.length} assigned
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-slate-500">
                          {member.phone}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {previewServices.length === 0 ? (
                            <span className="text-xs text-slate-500">
                              No services assigned
                            </span>
                          ) : (
                            <>
                              {previewServices.map((service) => (
                                <span
                                  key={service.id}
                                  className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                                >
                                  {service.name}
                                </span>
                              ))}
                              {remainingCount > 0 ? (
                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                                  +{remainingCount} more
                                </span>
                              ) : null}
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <Button
                          variant="ghost"
                          className="hidden rounded-xl text-slate-600 md:inline-flex"
                          disabled={!canEdit}
                          onClick={(event) => {
                            event.stopPropagation();
                            onOpenMember(member);
                          }}
                        >
                          <Settings2 className="mr-2 h-4 w-4" />
                          Assign
                        </Button>
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

function StaffEmptyState() {
  return (
    <div className="grid min-h-[340px] place-items-center px-6 py-12">
      <div className="max-w-md text-center">
        <div className="mx-auto inline-flex rounded-3xl bg-slate-100 p-4 text-slate-400">
          <Users2 className="h-8 w-8" />
        </div>
        <p className="mt-4 text-base font-medium text-slate-800">
          No staff users found
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          No staff users found for this entity. Invite staff from the Users page
          first.
        </p>
        <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-500">
          <Sparkles className="h-3.5 w-3.5" />
          Staff assignments appear here once members are available
        </div>
      </div>
    </div>
  );
}
