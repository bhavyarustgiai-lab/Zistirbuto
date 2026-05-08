import type { PaymentRecord } from "@shared/types/domain";
import { env } from "@shared/config/env";
import { http } from "@shared/api/http";
import { mockDb } from "@shared/api/mockDb";

export async function createPaymentRecord(input: Omit<PaymentRecord, "id" | "createdAt">) {
  if (env.useMocks) {
    return mockDb.createPaymentRecord(input);
  }
  return http<PaymentRecord>("/payments", { method: "POST", body: JSON.stringify(input) });
}
