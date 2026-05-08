import { useCallback, useEffect, useState } from "react";
import type { PartnerOrderStatus } from "@shared/types/domain";
import {
  createPartnerOrderReturnForFirm,
  createPartnerOrderForFirm,
  getPartnerOrder,
  listPartnerOrderReturns,
  listPartnerOrders,
  updatePartnerOrderForFirm,
  updatePartnerOrderStatusForFirm,
  voidPartnerOrderReturnForFirm,
} from "./api";
import type {
  CreatePartnerOrderInput,
  CreatePartnerOrderReturnInput,
  PartnerOrder,
  PartnerOrderReturn,
  UpdatePartnerOrderInput,
  UpdatePartnerOrderStatusInput,
} from "./types";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Request failed";
}

function isUnauthorizedError(error: unknown) {
  return error instanceof Error && /authentication required|firm access denied|unauthorized|forbidden/i.test(error.message);
}

export function usePartnerOrdersResource(firmId: number | string) {
  const [items, setItems] = useState<PartnerOrder[]>([]);
  const [loading, setLoading] = useState(Boolean(firmId));
  const [error, setError] = useState("");
  const [unauthorized, setUnauthorized] = useState(false);

  const refresh = useCallback(async () => {
    if (!firmId) {
      setItems([]);
      setLoading(false);
      setError("");
      setUnauthorized(false);
      return [] as PartnerOrder[];
    }
    setLoading(true);
    setError("");
    setUnauthorized(false);
    try {
      const next = await listPartnerOrders(firmId);
      setItems(next);
      return next;
    } catch (err) {
      setError(getErrorMessage(err));
      setUnauthorized(isUnauthorizedError(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [firmId]);

  useEffect(() => {
    void refresh().catch(() => undefined);
  }, [refresh]);

  return {
    items,
    loading,
    error,
    unauthorized,
    refresh,
    create: async (input: CreatePartnerOrderInput) => {
      const next = await createPartnerOrderForFirm(firmId, input);
      await refresh();
      return next;
    },
    update: async (orderId: string, input: UpdatePartnerOrderInput) => {
      const next = await updatePartnerOrderForFirm(firmId, orderId, input);
      await refresh();
      return next;
    },
    updateStatus: async (orderId: string, status: PartnerOrderStatus, input: Omit<UpdatePartnerOrderStatusInput, "status"> = {}) => {
      const next = await updatePartnerOrderStatusForFirm(firmId, orderId, { ...input, status });
      await refresh();
      return next;
    },
    createReturn: async (orderId: string, input: CreatePartnerOrderReturnInput) => {
      const next = await createPartnerOrderReturnForFirm(firmId, orderId, input);
      await refresh();
      return next;
    },
  };
}

export function usePartnerOrderResource(firmId: number | string, orderId: string) {
  const [item, setItem] = useState<PartnerOrder | null>(null);
  const [loading, setLoading] = useState(Boolean(firmId && orderId));
  const [error, setError] = useState("");
  const [unauthorized, setUnauthorized] = useState(false);

  const refresh = useCallback(async () => {
    if (!firmId || !orderId) {
      setItem(null);
      setLoading(false);
      setError("");
      setUnauthorized(false);
      return null;
    }
    setLoading(true);
    setError("");
    setUnauthorized(false);
    try {
      const next = await getPartnerOrder(firmId, orderId);
      setItem(next);
      return next;
    } catch (err) {
      setError(getErrorMessage(err));
      setUnauthorized(isUnauthorizedError(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [firmId, orderId]);

  useEffect(() => {
    void refresh().catch(() => undefined);
  }, [refresh]);

  return {
    item,
    loading,
    error,
    unauthorized,
    refresh,
    update: async (input: UpdatePartnerOrderInput) => {
      const next = await updatePartnerOrderForFirm(firmId, orderId, input);
      setItem(next);
      return next;
    },
    updateStatus: async (status: PartnerOrderStatus, input: Omit<UpdatePartnerOrderStatusInput, "status"> = {}) => {
      const next = await updatePartnerOrderStatusForFirm(firmId, orderId, { ...input, status });
      setItem(next);
      return next;
    },
  };
}

export function usePartnerOrderReturnsResource(firmId: number | string, orderId: string) {
  const [items, setItems] = useState<PartnerOrderReturn[]>([]);
  const [loading, setLoading] = useState(Boolean(firmId && orderId));
  const [error, setError] = useState("");
  const [unauthorized, setUnauthorized] = useState(false);

  const refresh = useCallback(async () => {
    if (!firmId || !orderId) {
      setItems([]);
      setLoading(false);
      setError("");
      setUnauthorized(false);
      return [] as PartnerOrderReturn[];
    }
    setLoading(true);
    setError("");
    setUnauthorized(false);
    try {
      const next = await listPartnerOrderReturns(firmId, orderId);
      setItems(next);
      return next;
    } catch (err) {
      setError(getErrorMessage(err));
      setUnauthorized(isUnauthorizedError(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [firmId, orderId]);

  useEffect(() => {
    void refresh().catch(() => undefined);
  }, [refresh]);

  return {
    items,
    loading,
    error,
    unauthorized,
    refresh,
    create: async (input: CreatePartnerOrderReturnInput) => {
      const next = await createPartnerOrderReturnForFirm(firmId, orderId, input);
      setItems((current) => [next.salesReturn, ...current.filter((item) => item.id !== next.salesReturn.id)]);
      return next;
    },
    voidReturn: async (returnId: string) => {
      const next = await voidPartnerOrderReturnForFirm(firmId, orderId, returnId);
      setItems((current) => current.map((item) => (item.id === next.salesReturn.id ? next.salesReturn : item)));
      return next;
    },
  };
}
