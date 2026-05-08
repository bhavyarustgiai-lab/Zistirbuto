import { useMemo, useState } from "react";
import { ChevronDown, Search, Trash2, UserPlus, Users } from "lucide-react";
import { useAppState } from "@app/providers/AppStateProvider";
import { useToast } from "@app/ToastProvider";
import { useInvites, useMembers } from "@entities/members/hooks";
import { Avatar, AvatarFallback, AvatarImage } from "@components/ui/avatar";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { Card, CardContent } from "@components/ui/card";
import { Collapsible } from "@components/ui/collapsible";
import { Dialog } from "@components/ui/dialog";
import { Input } from "@components/ui/input";
import { Select } from "@components/ui/select";
import { Tooltip } from "@components/ui/tooltip";
import {
  arePhonesEqual,
  formatPhone,
  getPhoneValidationMessage,
  isValidPhoneLocalNumber,
  parsePhoneValue,
} from "@shared/lib/phone";
import { PhoneInput } from "@shared/ui/molecules/PhoneInput";
import type { EntityMember, EntityRole, Invite } from "@shared/types/domain";
import { cn } from "@shared/lib/cn";

type RoleBucketItem = {
  id: string;
  type: "member" | "invite";
  role: EntityRole;
  name?: string;
  avatarUrl?: string;
  phone: string;
  userId?: number;
  joinedAt?: string;
  expiresAt?: string;
  token?: string;
  inviteId?: string;
};

type RoleBuckets = Record<EntityRole, RoleBucketItem[]>;

type DeleteTarget = { open: false } | { open: true; item: RoleBucketItem };

const ROLE_SECTIONS: Array<{ key: EntityRole; label: string }> = [
  { key: "OWNER", label: "Owner" },
  { key: "MANAGER", label: "Manager" },
  { key: "STAFF", label: "Staff" },
  { key: "ACCOUNT_MANAGER", label: "Account Manager" },
];

const ROLE_SURFACE: Record<
  EntityRole,
  {
    container: string;
    badge: string;
  }
> = {
  OWNER: {
    container: "border-amber-200/80 bg-amber-50/70",
    badge: "bg-amber-100 text-amber-700",
  },
  MANAGER: {
    container: "border-sky-200/80 bg-sky-50/70",
    badge: "bg-sky-100 text-sky-700",
  },
  STAFF: {
    container: "border-emerald-200/80 bg-emerald-50/70",
    badge: "bg-emerald-100 text-emerald-700",
  },
  ACCOUNT_MANAGER: {
    container: "border-fuchsia-200/80 bg-fuchsia-50/70",
    badge: "bg-fuchsia-100 text-fuchsia-700",
  },
};

function getInitials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatDateLabel(value?: string) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function buildRoleBuckets(
  members: EntityMember[],
  invites: Invite[],
): RoleBuckets {
  return {
    OWNER: members
      .filter((member) => member.role === "OWNER" && member.status === "ACTIVE")
      .map((member) => ({
        id: `member_${member.entityId}_${member.userId}`,
        type: "member" as const,
        role: member.role,
        name: member.name,
        avatarUrl: member.avatarUrl,
        phone: member.phone,
        userId: member.userId,
        joinedAt: member.joinedAt,
      })),
    MANAGER: [
      ...members
        .filter(
          (member) => member.role === "MANAGER" && member.status === "ACTIVE",
        )
        .map((member) => ({
          id: `member_${member.entityId}_${member.userId}`,
          type: "member" as const,
          role: member.role,
          name: member.name,
          avatarUrl: member.avatarUrl,
          phone: member.phone,
          userId: member.userId,
          joinedAt: member.joinedAt,
        })),
      ...invites
        .filter(
          (invite) => invite.role === "MANAGER" && invite.status === "PENDING",
        )
        .map((invite) => ({
          id: `invite_${invite.id}`,
          type: "invite" as const,
          role: invite.role,
          phone: invite.phone,
          expiresAt: invite.expiresAt,
          token: invite.token,
          inviteId: invite.id,
        })),
    ],
    STAFF: [
      ...members
        .filter(
          (member) => member.role === "STAFF" && member.status === "ACTIVE",
        )
        .map((member) => ({
          id: `member_${member.entityId}_${member.userId}`,
          type: "member" as const,
          role: member.role,
          name: member.name,
          avatarUrl: member.avatarUrl,
          phone: member.phone,
          userId: member.userId,
          joinedAt: member.joinedAt,
        })),
      ...invites
        .filter(
          (invite) => invite.role === "STAFF" && invite.status === "PENDING",
        )
        .map((invite) => ({
          id: `invite_${invite.id}`,
          type: "invite" as const,
          role: invite.role,
          phone: invite.phone,
          expiresAt: invite.expiresAt,
          token: invite.token,
          inviteId: invite.id,
        })),
    ],
    ACCOUNT_MANAGER: [
      ...members
        .filter(
          (member) =>
            member.role === "ACCOUNT_MANAGER" && member.status === "ACTIVE",
        )
        .map((member) => ({
          id: `member_${member.entityId}_${member.userId}`,
          type: "member" as const,
          role: member.role,
          name: member.name,
          avatarUrl: member.avatarUrl,
          phone: member.phone,
          userId: member.userId,
          joinedAt: member.joinedAt,
        })),
      ...invites
        .filter(
          (invite) =>
            invite.role === "ACCOUNT_MANAGER" && invite.status === "PENDING",
        )
        .map((invite) => ({
          id: `invite_${invite.id}`,
          type: "invite" as const,
          role: invite.role,
          phone: invite.phone,
          expiresAt: invite.expiresAt,
          token: invite.token,
          inviteId: invite.id,
        })),
    ],
  };
}

export function UsersPage() {
  const { currentClientId, currentEntityRole, currentUser } = useAppState();
  const { push } = useToast();
  const membersApi = useMembers(currentClientId);
  const invitesApi = useInvites(currentClientId);

  const [invitePhone, setInvitePhone] = useState("");
  const [role, setRole] = useState<EntityRole>("STAFF");
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>({
    open: false,
  });
  const [deleting, setDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | EntityRole>("ALL");
  const [collapsedSections, setCollapsedSections] = useState<
    Record<EntityRole, boolean>
  >({
    OWNER: false,
    MANAGER: false,
    STAFF: false,
    ACCOUNT_MANAGER: true,
  });

  const canInvite = currentEntityRole === "OWNER";
  const canManageUsers =
    currentEntityRole === "OWNER" || currentEntityRole === "ACCOUNT_MANAGER";

  const buckets = useMemo(
    () => buildRoleBuckets(membersApi.items, invitesApi.items),
    [invitesApi.items, membersApi.items],
  );

  const totalMembers = membersApi.items.filter(
    (member) => member.status === "ACTIVE",
  ).length;
  const totalInvites = invitesApi.items.filter(
    (invite) => invite.status === "PENDING",
  ).length;
  const totalRoster = totalMembers + totalInvites;

  const filteredBuckets = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const sortItems = (items: RoleBucketItem[]) =>
      [...items].sort((a, b) => {
        const aTime = new Date(a.joinedAt ?? a.expiresAt ?? 0).getTime();
        const bTime = new Date(b.joinedAt ?? b.expiresAt ?? 0).getTime();
        return bTime - aTime;
      });

    const next = {} as RoleBuckets;
    for (const section of ROLE_SECTIONS) {
      const baseItems =
        roleFilter === "ALL" || roleFilter === section.key
          ? buckets[section.key]
          : [];

      next[section.key] = sortItems(
        baseItems.filter((item) => {
          if (!query) return true;
          const haystack = [
            item.name,
            item.phone,
            item.type === "invite" ? "pending invite" : "active",
            section.label,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return haystack.includes(query);
        }),
      );
    }
    return next;
  }, [buckets, roleFilter, searchQuery]);

  const visibleSections = ROLE_SECTIONS.filter(
    (section) => roleFilter === "ALL" || roleFilter === section.key,
  );
  const hasAnyResults = visibleSections.some(
    (section) => filteredBuckets[section.key].length > 0,
  );

  const handleInvite = async () => {
    if (!canInvite) return;
    const parsedPhone = parsePhoneValue(invitePhone);
    if (!isValidPhoneLocalNumber(parsedPhone.country, parsedPhone.localNumber)) {
      push({
        title: "Invite could not be sent",
        description: getPhoneValidationMessage(parsedPhone.country),
        tone: "error",
      });
      return;
    }

    setSubmitting(true);
    try {
      await invitesApi.create(invitePhone, role);
      setInvitePhone("");
      setRole("STAFF");
      push({
        title: "Invite created",
        description: "Tap the pending invite row to copy its link.",
        tone: "success",
      });
    } catch (error) {
      push({
        title: "Invite failed",
        description:
          error instanceof Error
            ? error.message
            : "Unable to create invite right now.",
        tone: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRowClick = async (item: RoleBucketItem) => {
    if (item.type !== "invite" || !item.token) return;
    const inviteLink = `${window.location.origin}/invite/${item.token}`;
    await navigator.clipboard.writeText(inviteLink);
    push({
      title: "Invite link copied",
      description: inviteLink,
      tone: "success",
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget.open || !canManageUsers) return;
    setDeleting(true);
    try {
      if (deleteTarget.item.type === "member" && deleteTarget.item.userId) {
        await membersApi.remove(deleteTarget.item.userId);
        push({
          title: "User removed",
          description: deleteTarget.item.phone,
          tone: "success",
        });
      }
      if (deleteTarget.item.type === "invite" && deleteTarget.item.inviteId) {
        await invitesApi.revoke(deleteTarget.item.inviteId);
        push({
          title: "Invite revoked",
          description: deleteTarget.item.phone,
          tone: "success",
        });
      }
      setDeleteTarget({ open: false });
    } catch (error) {
      push({
        title: "Delete failed",
        description:
          error instanceof Error
            ? error.message
            : "Unable to complete this action.",
        tone: "error",
      });
    } finally {
      setDeleting(false);
    }
  };

  const inviteRoles =
    currentEntityRole === "OWNER"
      ? [
          { value: "OWNER", label: "Owner" },
          { value: "MANAGER", label: "Manager" },
          { value: "STAFF", label: "Staff" },
          { value: "ACCOUNT_MANAGER", label: "Account Manager" },
        ]
      : [
          { value: "MANAGER", label: "Manager" },
          { value: "STAFF", label: "Staff" },
          { value: "ACCOUNT_MANAGER", label: "Account Manager" },
        ];

  if (currentEntityRole === "STAFF") {
    return (
      <section className="py-6">
        <Card className="rounded-3xl border-slate-200/80 shadow-sm">
          <CardContent className="p-6 text-sm text-slate-500">
            Users access is not available for staff.
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="grid gap-6 py-6">
      <Card className="overflow-hidden border-none bg-[radial-gradient(circle_at_top_left,_rgba(244,114,182,0.14),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(56,189,248,0.12),_transparent_28%),linear-gradient(135deg,_#fffafc,_#f8fbff)] shadow-sm">
        <CardContent className="flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                Users
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Manage access, invites, and team roles across this workspace.
              </p>
            </div>
          </div>
          <Button
            className="h-11 rounded-2xl px-5 shadow-[0_10px_30px_rgba(79,70,229,0.20)]"
            onClick={() => {
              document.getElementById("entity-invite-phone")?.scrollIntoView({
                behavior: "smooth",
                block: "center",
              });
            }}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Invite User
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[180px_180px_minmax(0,1fr)]">
        <Card className="rounded-3xl border-slate-200/80 shadow-sm">
          <CardContent className="flex h-full flex-col justify-center p-4">
            <p className="text-sm text-slate-500">Total Users</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
              {totalMembers}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-slate-200/80 shadow-sm">
          <CardContent className="flex h-full flex-col justify-center p-4">
            <p className="text-sm text-slate-500">Pending Invites</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
              {totalInvites}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-slate-200/80 bg-white shadow-sm">
          <CardContent className="grid gap-4 p-5">
            <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-950">
                  Invite user
                </h2>
              </div>
              {!canInvite ? (
                <Badge className="w-fit rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                  Only owners can invite
                </Badge>
              ) : null}
            </div>
            <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_180px_130px]">
              <PhoneInput
                id="entity-invite-phone"
                value={invitePhone}
                onChange={setInvitePhone}
                placeholder="Phone number"
                disabled={!canInvite || submitting}
                className="rounded-2xl border border-slate-200 bg-white p-3"
              />
              <Select
                value={role}
                onValueChange={(value) => setRole(value as EntityRole)}
                options={inviteRoles}
                className="rounded-2xl"
              />
              <Button
                className="h-10 rounded-2xl"
                disabled={!canInvite || submitting}
                onClick={() => void handleInvite()}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                {submitting ? "Inviting..." : "Invite"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl border-slate-200/80 shadow-sm">
        <CardContent className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_220px] md:p-5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search users"
              className="h-11 rounded-2xl border-slate-200 bg-white pl-10"
            />
          </div>
          <Select
            value={roleFilter}
            onValueChange={(value) =>
              setRoleFilter(value as "ALL" | EntityRole)
            }
            options={[
              { value: "ALL", label: "All roles" },
              ...ROLE_SECTIONS.map((section) => ({
                value: section.key,
                label: section.label,
              })),
            ]}
            className="rounded-2xl"
          />
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {!hasAnyResults ? (
          <Card className="rounded-3xl border-slate-200/80 shadow-sm">
            <CardContent className="p-8 text-center">
              <p className="text-base font-medium text-slate-900">
                No matching users found.
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Try changing the search or role filter to see more people.
              </p>
            </CardContent>
          </Card>
        ) : null}

        {visibleSections.map((section) => {
          const items = filteredBuckets[section.key];
          const isCollapsed = collapsedSections[section.key];
          const roleSurface = ROLE_SURFACE[section.key];

          return (
            <Card
              key={section.key}
              className={cn(
                "overflow-hidden rounded-3xl border shadow-sm",
                roleSurface.container,
              )}
            >
              <CardContent className="p-0">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left"
                  onClick={() =>
                    setCollapsedSections((prev) => ({
                      ...prev,
                      [section.key]: !prev[section.key],
                    }))
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <p className="text-lg font-semibold text-slate-950">
                      {section.label}
                    </p>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-sm font-semibold",
                        roleSurface.badge,
                      )}
                    >
                      {items.length}
                    </span>
                  </div>
                  <ChevronDown
                    className={cn(
                      "h-5 w-5 text-slate-500 transition-transform",
                      isCollapsed ? "" : "rotate-180",
                    )}
                  />
                </button>

                <Collapsible open={!isCollapsed}>
                  <div className="grid gap-2.5 px-4 pb-4 pt-1">
                    {items.length === 0 ? (
                      <div className="rounded-[24px] border border-dashed border-slate-200/80 bg-white/80 px-4 py-6 text-sm text-slate-500">
                        No users or invites in {section.label.toLowerCase()}{" "}
                        yet.
                      </div>
                    ) : (
                      items.map((item) => {
                        const isCurrentUser =
                          item.type === "member" &&
                          arePhonesEqual(item.phone, currentUser?.phone ?? "");
                        const isOwnerMember =
                          item.type === "member" && item.role === "OWNER";
                        const deleteDisabled = !canManageUsers || isOwnerMember;
                        const deleteTooltip = isOwnerMember
                          ? "Owner access cannot be removed from here"
                          : "Only owner can manage users";
                        const title =
                          item.type === "member"
                            ? (item.name ?? formatPhone(item.phone))
                            : formatPhone(item.phone);
                        const metadata =
                          item.type === "member"
                            ? `${formatPhone(item.phone)} · Joined ${formatDateLabel(
                                item.joinedAt,
                              )}`
                            : `Invite pending · Expires ${formatDateLabel(
                                item.expiresAt,
                              )}`;

                        const deleteButton = (
                          <Button
                            variant="ghost"
                            className="h-10 w-10 rounded-full p-0 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                            disabled={deleteDisabled}
                            onClick={(event) => {
                              event.stopPropagation();
                              if (deleteDisabled) return;
                              setDeleteTarget({ open: true, item });
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        );

                        return (
                          <div
                            key={item.id}
                            className={cn(
                              "flex flex-col gap-2 rounded-[22px] border border-slate-200/80 bg-white px-4 py-3 transition sm:flex-row sm:items-center sm:justify-between",
                              item.type === "invite"
                                ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-sm"
                                : "hover:-translate-y-0.5 hover:shadow-sm",
                              isCurrentUser
                                ? "ring-2 ring-brand-100"
                                : "ring-1 ring-transparent",
                            )}
                            onClick={() => void handleRowClick(item)}
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <Avatar className="h-10 w-10 border border-slate-200 bg-slate-50">
                                {item.type === "member" && item.avatarUrl ? (
                                  <AvatarImage
                                    src={item.avatarUrl}
                                    alt={item.name ?? item.phone}
                                  />
                                ) : null}
                                <AvatarFallback className="bg-slate-100 text-sm font-semibold text-slate-700">
                                  {getInitials(
                                    item.type === "member"
                                      ? (item.name ?? item.phone)
                                      : item.phone,
                                  )}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="truncate text-sm font-semibold text-slate-950">
                                    {title}
                                  </p>
                                  {isCurrentUser ? (
                                    <Badge className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-700">
                                      You
                                    </Badge>
                                  ) : null}
                                  {item.type === "invite" ? (
                                    <Badge className="rounded-full bg-sky-100 px-2.5 py-0.5 text-[11px] font-medium text-sky-700">
                                      Invite Sent
                                    </Badge>
                                  ) : null}
                                  {item.type === "member" ? (
                                    <Badge className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">
                                      Active
                                    </Badge>
                                  ) : (
                                    <Badge className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                                      Pending
                                    </Badge>
                                  )}
                                </div>
                                <p className="mt-0.5 truncate text-sm text-slate-500">
                                  {metadata}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-2 sm:justify-end">
                              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                                {section.label}
                              </p>
                              {deleteDisabled ? (
                                <Tooltip content={deleteTooltip} align="end">
                                  <span>{deleteButton}</span>
                                </Tooltip>
                              ) : (
                                deleteButton
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </Collapsible>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog
        open={deleteTarget.open}
        title={
          deleteTarget.open
            ? `Delete ${
                deleteTarget.item.type === "member" ? "user" : "invite"
              }`
            : "Delete"
        }
        onClose={() => setDeleteTarget({ open: false })}
      >
        <div className="grid gap-4">
          <p className="text-sm text-slate-600">
            {deleteTarget.open && deleteTarget.item.type === "member"
              ? `Remove ${deleteTarget.item.phone} from this entity?`
              : `Delete the pending invite for ${
                  deleteTarget.open ? deleteTarget.item.phone : "this user"
                }?`}
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget({ open: false })}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleting}
              onClick={() => void handleDelete()}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </Dialog>
    </section>
  );
}
