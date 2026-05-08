import type { Service } from "@shared/types/domain";
import { env } from "@shared/config/env";
import { http } from "@shared/api/http";
import { mockDb } from "@shared/api/mockDb";

export async function getServices(clientId: string) {
  if (env.useMocks) {
    return mockDb.getServices(clientId);
  }
  return http<Service[]>(`/services?clientId=${clientId}`);
}

export async function createService(input: Omit<Service, "id">) {
  if (env.useMocks) {
    return mockDb.createService(input);
  }
  return http<Service>("/services", { method: "POST", body: JSON.stringify(input) });
}

export async function updateService(id: string, patch: Partial<Service>) {
  if (env.useMocks) {
    return mockDb.updateService(id, patch);
  }
  return http<Service>(`/services/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
}

export async function deleteService(id: string) {
  if (env.useMocks) {
    return mockDb.deleteService(id);
  }
  return http<{ ok: true }>(`/services/${id}`, { method: "DELETE" });
}
