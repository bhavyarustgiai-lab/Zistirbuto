import type { ServiceCategory } from "@shared/types/domain";
import { env } from "@shared/config/env";
import { http } from "@shared/api/http";
import { mockDb } from "@shared/api/mockDb";

export async function getServiceCategories(clientId: string) {
  if (env.useMocks) {
    return mockDb.getServiceCategories(clientId);
  }
  return http<ServiceCategory[]>(`/service-categories?clientId=${clientId}`);
}

export async function createServiceCategory(
  input: Omit<ServiceCategory, "id">,
) {
  if (env.useMocks) {
    return mockDb.createServiceCategory(input);
  }
  return http<ServiceCategory>("/service-categories", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateServiceCategory(
  id: string,
  patch: Partial<ServiceCategory>,
) {
  if (env.useMocks) {
    return mockDb.updateServiceCategory(id, patch);
  }
  return http<ServiceCategory>(`/service-categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function deleteServiceCategory(id: string) {
  if (env.useMocks) {
    return mockDb.deleteServiceCategory(id);
  }
  return http<{ ok: true }>(`/service-categories/${id}`, {
    method: "DELETE",
  });
}
