import { getMembers } from "@entities/members/api";
import { env } from "@shared/config/env";
import { http } from "@shared/api/http";
import { mockDb } from "@shared/api/mockDb";
import type { EntityMember, StaffServiceCapability } from "@shared/types/domain";

const looseMockDb = mockDb as any;

export async function getStaffMembers(entityId: string) {
  const members = await getMembers(entityId);
  return members.filter((member: EntityMember) => member.role === "STAFF" && member.status === "ACTIVE");
}

export async function getStaffCapabilities(entityId: string) {
  if (env.useMocks) {
    return looseMockDb.getStaffCapabilities(entityId);
  }
  return http<StaffServiceCapability[]>(`/staff-capabilities?entityId=${entityId}`);
}

export async function updateStaffCapabilities(entityId: string, userId: number | string, serviceIds: string[]) {
  if (env.useMocks) {
    return looseMockDb.updateStaffCapabilities(entityId, userId, serviceIds);
  }
  return http<StaffServiceCapability[]>(`/staff-capabilities/${userId}`, {
    method: "PUT",
    body: JSON.stringify({ entityId, serviceIds }),
  });
}

export type StaffMember = EntityMember;
