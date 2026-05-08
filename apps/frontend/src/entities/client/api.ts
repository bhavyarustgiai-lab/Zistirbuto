import { env } from "@shared/config/env";
import { http } from "@shared/api/http";
import { mockDb } from "@shared/api/mockDb";
const looseMockDb = mockDb as any;
import type { Client, ClientType, EntityMember, EntityRole } from "@shared/types/domain";

export type MeResponse = {
  user: { id: number; name: string; phone: string; birthDate?: string };
  clients: { id: string; name: string; clientType: "SALON" | "SPA" | "FITNESS" }[];
  currentClientId: string;
  memberships: EntityMember[];
  currentEntityRole?: EntityRole;
};

export async function getMe(): Promise<MeResponse> {
  if (env.useMocks) {
    return looseMockDb.getMe();
  }
  return http<MeResponse>("/me");
}

export type CreateEntityInput = {
  ownerName: string;
  ownerPhone: string;
  name: string;
  clientType: ClientType;
  address: string;
  location: { lat: number; lng: number };
  images: string[];
};

export async function createEntity(input: CreateEntityInput): Promise<Client> {
  if (env.useMocks) {
    return looseMockDb.createEntity(input);
  }
  return http<Client>("/entities", { method: "POST", body: JSON.stringify(input) });
}
