import { env } from "@shared/config/env";
import { http } from "@shared/api/http";
import { mockDb } from "@shared/api/mockDb";
const looseMockDb = mockDb as any;
import type { EntityMember, EntityRole, Invite } from "@shared/types/domain";

export async function getMembers(entityId: string) {
  if (env.useMocks) {
    return looseMockDb.getMembers(entityId);
  }
  return http<EntityMember[]>(`/members?entityId=${entityId}`);
}

export async function getInvites(entityId: string) {
  if (env.useMocks) {
    return looseMockDb.getInvites(entityId);
  }
  return http<Invite[]>(`/invites?entityId=${entityId}`);
}

export async function createInvite(entityId: string, phone: string, role: EntityRole) {
  if (env.useMocks) {
    return looseMockDb.createInvite({ entityId, phone, role });
  }
  return http<Invite>("/invites", {
    method: "POST",
    body: JSON.stringify({ entityId, phone, role }),
  });
}

export async function acceptInvite(token: string) {
  if (env.useMocks) {
    return looseMockDb.acceptInvite(token);
  }
  return http<EntityMember>("/invites/accept", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export async function revokeInvite(inviteId: string) {
  if (env.useMocks) {
    return looseMockDb.revokeInvite(inviteId);
  }
  return http<{ ok: true }>(`/invites/${inviteId}/revoke`, { method: "POST" });
}

export async function removeMember(entityId: string, userId: number | string) {
  if (env.useMocks) {
    return looseMockDb.removeMember(entityId, userId);
  }
  return http<{ ok: true }>(`/members/${userId}?entityId=${entityId}`, { method: "DELETE" });
}
