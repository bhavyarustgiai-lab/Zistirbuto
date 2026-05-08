import type { DayEntry } from "@shared/types/domain";
import { env } from "@shared/config/env";
import { http } from "@shared/api/http";
import { mockDb } from "@shared/api/mockDb";

export async function getDayEntries(clientId: string, fromDate: string, toDate: string) {
  if (env.useMocks) {
    return mockDb.getDayEntries(clientId, fromDate, toDate);
  }
  return http<DayEntry[]>(`/day-entries?clientId=${clientId}&from=${fromDate}&to=${toDate}`);
}

export async function createDayEntry(input: Omit<DayEntry, "id" | "paymentStatus">) {
  if (env.useMocks) {
    return mockDb.createDayEntry(input);
  }
  return http<DayEntry>("/day-entries", { method: "POST", body: JSON.stringify(input) });
}

export async function updateDayEntry(id: string, patch: Partial<DayEntry>) {
  if (env.useMocks) {
    return mockDb.updateDayEntry(id, patch);
  }
  return http<DayEntry>(`/day-entries/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
}

export async function deleteDayEntry(id: string) {
  if (env.useMocks) {
    return mockDb.deleteDayEntry(id);
  }
  return http(`/day-entries/${id}`, { method: "DELETE" });
}
