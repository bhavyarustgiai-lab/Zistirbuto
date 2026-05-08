import type {
  PartnerOrdersCreateRequest,
  PartnerOrdersDetailResponse,
  PartnerOrderReturnCreateRequest,
  PartnerSalesReturn,
  PartnerOrdersListResponse,
  PartnerOrdersStatusRequest,
  PartnerOrdersUpdateRequest,
  PartnerOrdersFieldError,
} from "@zistributo/contracts";

export type PartnerOrder = PartnerOrdersListResponse[number];
export type PartnerOrderDetail = PartnerOrdersDetailResponse;
export type CreatePartnerOrderInput = PartnerOrdersCreateRequest;
export type UpdatePartnerOrderInput = PartnerOrdersUpdateRequest;
export type UpdatePartnerOrderStatusInput = PartnerOrdersStatusRequest;
export type CreatePartnerOrderReturnInput = PartnerOrderReturnCreateRequest;
export type PartnerOrderReturn = PartnerSalesReturn;
export type PartnerOrderFieldError = PartnerOrdersFieldError;
export type PartnerOrderQueueStage = "DRAFT" | "CONFIRMED" | "PACKED" | "DISPATCHED";
export type PartnerOrderAllocationStatus = "DRAFT" | "READY_TO_PACK" | "PARTIAL" | "BLOCKED" | "PACKED" | "DISPATCHED";

export type PartnerOrdersLoadState = {
  loading: boolean;
  error: string;
  unauthorized: boolean;
};
