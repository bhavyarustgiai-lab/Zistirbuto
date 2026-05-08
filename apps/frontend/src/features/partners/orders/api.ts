import { env } from "@shared/config/env";
import { http } from "@shared/api/http";
import { mockDb } from "@shared/api/mockDb";
import type {
  CreatePartnerOrderReturnInput,
  CreatePartnerOrderInput,
  PartnerOrder,
  PartnerOrderReturn,
  UpdatePartnerOrderInput,
  UpdatePartnerOrderStatusInput,
} from "./types";
import type { PartnerCreditNote } from "@shared/types/domain";

const looseMockDb = mockDb as any;
type NumericIdParam = number | string;

function systemOrderDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function listPartnerOrders(firmId: NumericIdParam) {
  if (env.useMocks) {
    return looseMockDb.getPartnerOrders(firmId);
  }
  return http<PartnerOrder[]>(`/partners/firms/${encodeURIComponent(firmId)}/orders`);
}

export async function getPartnerOrder(firmId: NumericIdParam, orderId: string) {
  if (env.useMocks) {
    return looseMockDb.getPartnerOrderById(firmId, orderId);
  }
  return http<PartnerOrder>(`/partners/firms/${encodeURIComponent(firmId)}/orders/${encodeURIComponent(orderId)}`);
}

export async function createPartnerOrderForFirm(firmId: NumericIdParam, input: CreatePartnerOrderInput) {
  const payload = { ...input, orderDate: input.orderDate || systemOrderDate() };
  if (env.useMocks) {
    return looseMockDb.createPartnerOrder(firmId, payload);
  }
  return http<PartnerOrder>(`/partners/firms/${encodeURIComponent(firmId)}/orders`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updatePartnerOrderForFirm(firmId: NumericIdParam, orderId: string, input: UpdatePartnerOrderInput) {
  if (env.useMocks) {
    return looseMockDb.updatePartnerOrder(firmId, orderId, input);
  }
  return http<PartnerOrder>(`/partners/firms/${encodeURIComponent(firmId)}/orders/${encodeURIComponent(orderId)}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function updatePartnerOrderStatusForFirm(
  firmId: NumericIdParam,
  orderId: string,
  input: UpdatePartnerOrderStatusInput,
) {
  if (env.useMocks) {
    return looseMockDb.updatePartnerOrderStatus(firmId, orderId, input.status, input);
  }
  return http<PartnerOrder>(`/partners/firms/${encodeURIComponent(firmId)}/orders/${encodeURIComponent(orderId)}/status`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export type CreatePartnerOrderReturnResponse = {
  salesReturn: PartnerOrderReturn;
  creditNote: PartnerCreditNote;
  order: PartnerOrder;
};

export type VoidPartnerOrderReturnResponse = CreatePartnerOrderReturnResponse;

export async function listPartnerOrderReturns(firmId: NumericIdParam, orderId: string) {
  if (env.useMocks) {
    return looseMockDb.getPartnerOrderReturns(firmId, orderId);
  }
  return http<PartnerOrderReturn[]>(
    `/partners/firms/${encodeURIComponent(firmId)}/orders/${encodeURIComponent(orderId)}/returns`,
  );
}

export async function createPartnerOrderReturnForFirm(
  firmId: NumericIdParam,
  orderId: string,
  input: CreatePartnerOrderReturnInput,
) {
  if (env.useMocks) {
    return looseMockDb.createPartnerOrderReturn(firmId, orderId, input);
  }
  return http<CreatePartnerOrderReturnResponse>(
    `/partners/firms/${encodeURIComponent(firmId)}/orders/${encodeURIComponent(orderId)}/returns`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export async function voidPartnerOrderReturnForFirm(firmId: NumericIdParam, orderId: string, returnId: string) {
  if (env.useMocks) {
    return looseMockDb.voidPartnerOrderReturn(firmId, orderId, returnId);
  }
  return http<VoidPartnerOrderReturnResponse>(
    `/partners/firms/${encodeURIComponent(firmId)}/orders/${encodeURIComponent(orderId)}/returns/${encodeURIComponent(returnId)}/void`,
    {
      method: "POST",
    },
  );
}
