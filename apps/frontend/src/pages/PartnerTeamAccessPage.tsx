import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { UserPlus, Users, UserX } from "lucide-react";
import { useAppState } from "@app/providers/AppStateProvider";
import { useToast } from "@app/ToastProvider";
import { usePartnerFirmInvites, usePartnerFirmMemberships } from "@entities/partners/teamHooks";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Select } from "@components/ui/select";
import { formatPhone, getPhoneValidationMessage, isValidPhoneLocalNumber, parsePhoneValue } from "@shared/lib/phone";
import { EmptyState } from "@shared/ui/molecules/EmptyState";
import { PhoneInput } from "@shared/ui/molecules/PhoneInput";
import type { PartnerFirmInvite, PartnerFirmMembership, PartnerFirmRole } from "@shared/types/domain";

const roleOptions: Array<{ value: Exclude<PartnerFirmRole, "OWNER">; label: string }> = [
  { value: "STAFF", label: "Staff" },
  { value: "ACCOUNTANT", label: "Accountant" },
  { value: "DELIVERY_PARTNER", label: "Delivery partner" },
];

type MemberCard = {
  userId: number;
  name: string;
  phone: string;
  joinedAt: string;
  isCurrentUser: boolean;
};

type InviteCard = {
  inviteId: string;
  phone: string;
  createdAt: string;
  expiresAt: string;
  role: PartnerFirmRole;
};

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function roleLabel(role: PartnerFirmRole) {
  switch (role) {
    case "DELIVERY_PARTNER":
      return "Delivery partner";
    case "ACCOUNTANT":
      return "Accountant";
    case "STAFF":
      return "Staff";
    case "OWNER":
      return "Owner";
  }
}

function roleTone(role: PartnerFirmRole) {
  switch (role) {
    case "OWNER":
      return "paid";
    case "ACCOUNTANT":
      return "planned";
    case "DELIVERY_PARTNER":
      return "neutral";
    case "STAFF":
      return "active";
  }
}

function roleSortWeight(role: PartnerFirmRole) {
  switch (role) {
    case "OWNER":
      return 1;
    case "ACCOUNTANT":
      return 2;
    case "DELIVERY_PARTNER":
      return 3;
    case "STAFF":
      return 4;
  }
}

function groupMembersByRole(items: PartnerFirmMembership[], currentUserId?: number) {
  const grouped: Record<PartnerFirmRole, MemberCard[]> = {
    OWNER: [],
    ACCOUNTANT: [],
    DELIVERY_PARTNER: [],
    STAFF: [],
  };

  for (const item of items.filter((entry) => entry.status === "ACTIVE")) {
    grouped[item.role].push({
      userId: item.userId,
      name: item.name,
      phone: item.phone,
      joinedAt: item.joinedAt,
      isCurrentUser: item.userId === currentUserId,
    });
  }

  for (const role of Object.keys(grouped) as PartnerFirmRole[]) {
    grouped[role].sort((a, b) => {
      if (a.isCurrentUser && !b.isCurrentUser) return -1;
      if (!a.isCurrentUser && b.isCurrentUser) return 1;
      return a.name.localeCompare(b.name);
    });
  }

  return grouped;
}

function groupInvitesByRole(items: PartnerFirmInvite[]) {
  const grouped: Record<PartnerFirmRole, InviteCard[]> = {
    OWNER: [],
    ACCOUNTANT: [],
    DELIVERY_PARTNER: [],
    STAFF: [],
  };

  for (const item of items.filter((entry) => entry.status === "PENDING")) {
    grouped[item.role].push({
      inviteId: item.id,
      phone: item.phone,
      createdAt: item.createdAt,
      expiresAt: item.expiresAt,
      role: item.role,
    });
  }

  for (const role of Object.keys(grouped) as PartnerFirmRole[]) {
    grouped[role].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  return grouped;
}

export function PartnerTeamAccessPage() {
  const { activePartnerFirmId, partnerFirms, currentUser } = useAppState();
  const { push } = useToast();
  const membershipsApi = usePartnerFirmMemberships(activePartnerFirmId);
  const invitesApi = usePartnerFirmInvites(activePartnerFirmId);
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<Exclude<PartnerFirmRole, "OWNER">>("STAFF");
  const [submitting, setSubmitting] = useState(false);
  const [busyKey, setBusyKey] = useState("");
  const [inviteError, setInviteError] = useState("");

  if (!activePartnerFirmId) {
    return <Navigate to="/partners/onboarding/firm" replace />;
  }

  const activeFirm = partnerFirms.find((firm) => firm.id === activePartnerFirmId);
  if (!activeFirm) {
    return <EmptyState>Firm not found.</EmptyState>;
  }

  const membersByRole = useMemo(
    () => groupMembersByRole(membershipsApi.items, currentUser?.id),
    [currentUser?.id, membershipsApi.items],
  );
  const invitesByRole = useMemo(() => groupInvitesByRole(invitesApi.items), [invitesApi.items]);
  const canManage = membersByRole.OWNER.some((item) => item.userId === currentUser?.id);
  const roleSections = (Object.keys(membersByRole) as PartnerFirmRole[])
    .sort((a, b) => roleSortWeight(a) - roleSortWeight(b))
    .map((role) => ({ role, items: membersByRole[role] }))
    .filter((section) => section.items.length > 0);
  const inviteSections = (Object.keys(invitesByRole) as PartnerFirmRole[])
    .sort((a, b) => roleSortWeight(a) - roleSortWeight(b))
    .map((role) => ({ role, items: invitesByRole[role] }))
    .filter((section) => section.items.length > 0);

  async function handleInvite() {
    const parsedPhone = parsePhoneValue(phone);
    if (!isValidPhoneLocalNumber(parsedPhone.country, parsedPhone.localNumber)) {
      setInviteError(getPhoneValidationMessage(parsedPhone.country));
      return;
    }
    setInviteError("");
    setSubmitting(true);
    try {
      const result = await invitesApi.create(phone, role);
      await Promise.all([membershipsApi.refresh(), invitesApi.refresh()]);
      setPhone("");
      push({
        title: result.kind === "membership" ? "Role added" : "Invite sent",
        description:
          result.kind === "membership"
            ? `${formatPhone(phone)} now also has ${roleLabel(role).toLowerCase()} access.`
            : `${formatPhone(phone)} has been invited as ${roleLabel(role).toLowerCase()}.`,
        tone: "success",
      });
    } catch (error) {
      setInviteError(error instanceof Error ? error.message : "Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemoveRole(member: MemberCard, roleToRemove: PartnerFirmRole) {
    if (!window.confirm(`Remove ${roleLabel(roleToRemove).toLowerCase()} access for ${member.name}?`)) {
      return;
    }
    setBusyKey(`member:${member.userId}:${roleToRemove}`);
    try {
      await membershipsApi.remove(member.userId, roleToRemove);
      push({
        title: "Access removed",
        description: `${member.name} no longer has ${roleLabel(roleToRemove).toLowerCase()} access.`,
        tone: "success",
      });
    } catch (error) {
      push({
        title: "Unable to remove access",
        description: error instanceof Error ? error.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setBusyKey("");
    }
  }

  async function handleRevokeRole(invite: InviteCard, roleToRevoke: PartnerFirmRole) {
    if (!window.confirm(`Revoke ${roleLabel(roleToRevoke).toLowerCase()} invite for ${formatPhone(invite.phone)}?`)) {
      return;
    }
    setBusyKey(`invite:${invite.phone}:${roleToRevoke}`);
    try {
      await invitesApi.revoke(invite.inviteId, roleToRevoke);
      push({
        title: "Invite revoked",
        description: `${roleLabel(roleToRevoke)} invite for ${formatPhone(invite.phone)} has been removed.`,
        tone: "success",
      });
    } catch (error) {
      push({
        title: "Unable to revoke invite",
        description: error instanceof Error ? error.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setBusyKey("");
    }
  }

  return (
    <section className="grid gap-4">
      {canManage ? (
        <Card className="border-slate-200 bg-white">
          <CardHeader className="p-5 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserPlus className="h-5 w-5 text-brand-500" />
              Invite a team member
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 pt-0">
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px_auto]">
              <PhoneInput
                value={phone}
                onChange={(value) => {
                  setPhone(value);
                  if (inviteError) {
                    setInviteError("");
                  }
                }}
                placeholder="Phone number"
                disabled={submitting}
              />
              <Select
                value={role}
                onValueChange={(value) => {
                  setRole(value as Exclude<PartnerFirmRole, "OWNER">);
                  if (inviteError) {
                    setInviteError("");
                  }
                }}
                options={roleOptions}
              />
              <Button className="h-10 rounded-lg px-4 text-sm" onClick={handleInvite} disabled={submitting}>
                {submitting ? "Processing..." : "Add access"}
              </Button>
            </div>
            <div className="min-h-[1.25rem]">
              {inviteError ? <p className="text-sm text-rose-600">{inviteError}</p> : null}
            </div>
            <p className="text-xs text-slate-500">
              If the phone number already belongs to a user, the selected role is added immediately. Otherwise, a pending invite is created and auto-resolved after OTP sign-in.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="border-slate-200 bg-white">
          <CardHeader className="p-5 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-brand-500" />
              Members
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 pt-0">
            {roleSections.length === 0 ? (
              <EmptyState>No active team members yet.</EmptyState>
            ) : (
              roleSections.map((section) => (
                <div key={section.role} className="grid gap-3">
                  <div className="flex items-center gap-2 px-1">
                    <Badge tone={roleTone(section.role)}>{roleLabel(section.role)}</Badge>
                    <p className="text-sm text-slate-500">
                      {section.items.length} member{section.items.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  {section.items.map((member) => (
                    <div
                      key={`${section.role}:${member.userId}`}
                      className={`flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
                        member.isCurrentUser
                          ? "border-sky-200 bg-sky-50/70"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900">
                            {member.name}
                            {member.isCurrentUser ? <span className="ml-2 text-xs font-medium text-sky-700">(You)</span> : null}
                          </p>
                        </div>
                        <p className="mt-1 text-sm text-slate-600">{formatPhone(member.phone)}</p>
                        <p className="mt-1 text-xs text-slate-500">Joined {formatDate(member.joinedAt)}</p>
                      </div>
                      {canManage && section.role !== "OWNER" ? (
                        <Button
                          variant="outline"
                          className="h-9 rounded-lg px-3 text-sm"
                          onClick={() => handleRemoveRole(member, section.role)}
                          disabled={busyKey === `member:${member.userId}:${section.role}`}
                        >
                          <UserX className="mr-1 h-4 w-4" />
                          Remove
                        </Button>
                      ) : null}
                    </div>
                  ))}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardHeader className="p-5 sm:p-6">
            <CardTitle className="text-lg">Pending invites</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 pt-0">
            {inviteSections.length === 0 ? (
              <EmptyState>No pending invites for this firm.</EmptyState>
            ) : (
              inviteSections.map((section) => (
                <div key={section.role} className="grid gap-3">
                  <div className="flex items-center gap-2 px-1">
                    <Badge tone={roleTone(section.role)}>{roleLabel(section.role)}</Badge>
                    <p className="text-sm text-slate-500">
                      {section.items.length} invite{section.items.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  {section.items.map((invite) => (
                    <div key={invite.inviteId} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">{formatPhone(invite.phone)}</p>
                        <p className="mt-1 text-sm text-slate-600">Pending invite</p>
                        <p className="mt-1 text-xs text-slate-500">
                          Sent {formatDate(invite.createdAt)} · Expires {formatDate(invite.expiresAt)}
                        </p>
                      </div>
                      {canManage ? (
                        <Button
                          variant="outline"
                          className="h-9 rounded-lg px-3 text-sm"
                          onClick={() => handleRevokeRole(invite, section.role)}
                          disabled={busyKey === `invite:${invite.phone}:${section.role}`}
                        >
                          <UserX className="mr-1 h-4 w-4" />
                          Remove
                        </Button>
                      ) : null}
                    </div>
                  ))}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
