import { useCallback, useEffect, useMemo, useState } from "react";
import type { PartnerFirmMembership, PartnerInvoice } from "@shared/types/domain";
import { financeInvoicesApi } from "./api";
import { findCurrentPartnerRole } from "./utils";

const fallbackError = "Something went wrong, please try again later";

function toError(error: unknown, message = fallbackError) {
  return error instanceof Error ? error : new Error(message);
}

export function useFinanceInvoices(firmId: number | string) {
  const [items, setItems] = useState<PartnerInvoice[]>([]);
  const [loading, setLoading] = useState(Boolean(firmId));
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!firmId) {
      setItems([]);
      setLoading(false);
      setError(null);
      return [] as PartnerInvoice[];
    }
    setLoading(true);
    setError(null);
    try {
      const next = await financeInvoicesApi.list(firmId);
      setItems(next);
      return next;
    } catch (err) {
      const nextError = toError(err);
      setError(nextError);
      throw nextError;
    } finally {
      setLoading(false);
    }
  }, [firmId]);

  useEffect(() => {
    void refresh().catch(() => undefined);
  }, [refresh]);

  return { items, loading, error, refresh };
}

export function useFinanceInvoice(firmId: number | string, invoiceId: string) {
  const [item, setItem] = useState<PartnerInvoice | null>(null);
  const [loading, setLoading] = useState(Boolean(firmId && invoiceId));
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!firmId || !invoiceId) {
      setItem(null);
      setLoading(false);
      setError(null);
      return null;
    }
    setLoading(true);
    setError(null);
    try {
      const next = await financeInvoicesApi.detail(firmId, invoiceId);
      setItem(next);
      return next;
    } catch (err) {
      const nextError = toError(err);
      setError(nextError);
      throw nextError;
    } finally {
      setLoading(false);
    }
  }, [firmId, invoiceId]);

  const finalize = useCallback(async () => {
    if (!firmId || !invoiceId) throw new Error("Invoice is not available.");
    const next = await financeInvoicesApi.finalize(firmId, invoiceId);
    setItem(next);
    return next;
  }, [firmId, invoiceId]);

  useEffect(() => {
    void refresh().catch(() => undefined);
  }, [refresh]);

  return { item, loading, error, refresh, finalize };
}

export function useCurrentPartnerFinanceRole(firmId: number | string, userId?: number | string) {
  const [items, setItems] = useState<PartnerFirmMembership[]>([]);
  const [loading, setLoading] = useState(Boolean(firmId && userId));

  const refresh = useCallback(async () => {
    if (!firmId || !userId) {
      setItems([]);
      setLoading(false);
      return [] as PartnerFirmMembership[];
    }
    setLoading(true);
    try {
      const next = await financeInvoicesApi.memberships(firmId);
      setItems(next);
      return next;
    } finally {
      setLoading(false);
    }
  }, [firmId, userId]);

  useEffect(() => {
    void refresh().catch(() => undefined);
  }, [refresh]);

  const role = useMemo(() => findCurrentPartnerRole(items, firmId, userId), [firmId, items, userId]);

  return { role, loading, refresh };
}
