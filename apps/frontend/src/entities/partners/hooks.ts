import { useCallback, useEffect, useState } from "react";
import type {
  PartnerAuditLog,
  PartnerBrand,
  PartnerCatalogItem,
  PartnerClient,
  PartnerClientBusiness,
  PartnerClientPurchaseHistoryRow,
  PartnerCreditNote,
  PartnerDashboardStats,
  PartnerDebitNote,
  PartnerFirm,
  PartnerGlobalSearchResult,
  PartnerGoodsReceipt,
  PartnerInventoryCreateInput,
  PartnerInventoryHistoryEntry,
  PartnerInventoryItem,
  PartnerInventoryUpdateInput,
  PartnerInvoice,
  PartnerClientLedgerEntry,
  PartnerOrder,
  PartnerPayment,
  PartnerPaymentMode,
  PartnerPayablesSummary,
  PartnerReceivablesSummary,
  PartnerPurchase,
  PartnerSalesReportRow,
  PartnerStockMovementReportRow,
  PartnerSupplier,
  PartnerSupplierInvoice,
  PartnerSupplierLedgerEntry,
  PartnerSupplierPayment,
  PartnerSupplierGSTINValidation,
  PartnerGSTINValidation,
  PartnerStockActionInput,
  PartnerStockLedgerEntry,
  PartnerStockLedgerFilters,
  PartnerStockReasonType,
  PartnerStockRow,
} from "@shared/types/domain";
import {
  addPartnerClientOutlet,
  archivePartnerClientOutlet,
  archivePartnerSupplier,
  createPartnerClientBusiness,
  createPartnerCreditNote,
  createPartnerDebitNote,
  createPartnerFirmBrand,
  createPartnerInvoice,
  createPartnerOrder,
  createPartnerPayment,
  createPartnerSupplierInvoice,
  createPartnerSupplierPayment,
  updatePartnerOrder,
  createPartnerPurchase,
  createPartnerStockAction,
  createPartnerSupplier,
  createPartnerStockAdjustment,
  cancelPartnerPurchase,
  cancelPartnerInvoice,
  createPartnerInventory,
  finalizePartnerInvoice,
  finalizePartnerSupplierInvoice,
  createPartnerFirm,
  deletePartnerFirmBrand,
  getPartnerAuditLogs,
  getPartnerBrandItems,
  getPartnerClientBusinesses,
  getPartnerClientPurchaseHistory,
  getPartnerClients,
  getPartnerCreditNotes,
  getPartnerClientLedger,
  getPartnerDashboard,
  getPartnerDebitNotes,
  getPartnerInvoiceById,
  getPartnerFirmBrands,
  getPartnerFirm,
  getPartnerGlobalSearch,
  getPartnerGoodsReceipts,
  getPartnerInvoices,
  getPartnerPayments,
  getPartnerPayables,
  getPartnerSupplierInvoices,
  getPartnerSupplierLedger,
  getPartnerSupplierPayments,
  getPartnerInventory,
  getPartnerInventoryHistory,
  revertPartnerSupplyInward,
  getPartnerOrderById,
  getPartnerOrders,
  getPartnerReceivablesSummary,
  getPartnerPurchaseById,
  getPartnerPurchases,
  getPartnerSalesReport,
  getPartnerStockMovementReport,
  getPartnerSuppliers,
  getPartnersMe,
  getPartnerStockLedger,
  getPartnerStockLedgerByReference,
  getPartnerStock,
  orderPartnerPurchase,
  receivePartnerPurchase,
  updatePartnerInventory,
  type PartnerMeResponse,
  type PartnerFirmInput,
  type PartnerFirmUpdateInput,
  updatePartnerOrderStatus,
  updatePartnerFirm,
  updatePartnerClientBusiness,
  updatePartnerClientOutlet,
  updatePartnerSupplier,
  validatePartnerBusinessGSTIN,
  validatePartnerSupplierGSTIN,
} from "@entities/partners/api";
import type { UpdatePartnerOrderStatusInput } from "@features/partners/orders/types";

export function usePartnersMe() {
  const [data, setData] = useState<PartnerMeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const next = await getPartnersMe();
    setData(next);
    return next;
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  return { data, loading, refresh };
}

export function usePartnerFirm(firmId: number | string) {
  const [item, setItem] = useState<PartnerFirm | null>(null);

  const refresh = useCallback(async () => {
    if (!firmId) {
      setItem(null);
      return null;
    }
    const next = await getPartnerFirm(firmId);
    setItem(next);
    return next;
  }, [firmId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    item,
    refresh,
    create: async (input: PartnerFirmInput) => {
      const next = await createPartnerFirm(input);
      setItem(next);
      return next;
    },
    update: async (input: PartnerFirmUpdateInput) => {
      if (!firmId) {
        throw new Error("Firm ID is required");
      }
      const next = await updatePartnerFirm(firmId, input);
      setItem(next);
      return next;
    },
  };
}

export function usePartnerDashboard(firmId: number | string) {
  const [data, setData] = useState<PartnerDashboardStats | null>(null);

  const refresh = useCallback(async () => {
    if (!firmId) {
      setData(null);
      return null;
    }
    const next = await getPartnerDashboard(firmId);
    setData(next);
    return next;
  }, [firmId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, refresh };
}

export function usePartnerBrands(firmId: number | string) {
  const [items, setItems] = useState<PartnerBrand[]>([]);

  const refresh = useCallback(async () => {
    if (!firmId) {
      setItems([]);
      return [] as PartnerBrand[];
    }
    const next = await getPartnerFirmBrands(firmId);
    setItems(next);
    return next;
  }, [firmId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    items,
    refresh,
    add: async (input: { brandId?: string; brandName?: string }) => {
      await createPartnerFirmBrand(firmId, input);
      await refresh();
    },
    remove: async (brandId: number | string) => {
      await deletePartnerFirmBrand(firmId, brandId);
      await refresh();
    },
  };
}

export function usePartnerBrandItems(firmId: number | string, brandId: number | string) {
  const [items, setItems] = useState<PartnerCatalogItem[]>([]);
  const [loading, setLoading] = useState(() => Boolean(firmId && brandId));
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!firmId || !brandId) {
      setItems([]);
      setError(null);
      setLoading(false);
      return [] as PartnerCatalogItem[];
    }
    setLoading(true);
    setError(null);
    try {
      const next = await getPartnerBrandItems(firmId, brandId);
      setItems(next);
      return next;
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : "";
      if (message.includes("brand mapping not found")) {
        setItems([]);
        setError(null);
        return [] as PartnerCatalogItem[];
      }
      setError(error instanceof Error ? error : new Error("Failed to load catalog items"));
      throw error;
    } finally {
      setLoading(false);
    }
  }, [firmId, brandId]);

  useEffect(() => {
    void refresh().catch(() => undefined);
  }, [refresh]);

  return { items, loading, error, refresh };
}

export function usePartnerCatalogItems(firmId: number | string, brandIds: Array<number | string>) {
  const brandKey = brandIds.join("\u0001");
  const [items, setItems] = useState<PartnerCatalogItem[]>([]);
  const [loading, setLoading] = useState(() => Boolean(firmId && brandIds.length > 0));
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    const nextBrandIds = brandKey ? brandKey.split("\u0001").filter(Boolean) : [];
    if (!firmId || nextBrandIds.length === 0) {
      setItems([]);
      setError(null);
      setLoading(false);
      return [] as PartnerCatalogItem[];
    }
    setLoading(true);
    setError(null);
    try {
      const groupedItems = await Promise.all(nextBrandIds.map((brandId) => getPartnerBrandItems(firmId, brandId)));
      const next = groupedItems.flat().sort((left, right) => left.name.localeCompare(right.name) || left.sku.localeCompare(right.sku));
      setItems(next);
      return next;
    } catch (err) {
      const nextError = err instanceof Error ? err : new Error("Failed to load catalog items");
      setError(nextError);
      throw nextError;
    } finally {
      setLoading(false);
    }
  }, [brandKey, firmId]);

  useEffect(() => {
    void refresh().catch(() => undefined);
  }, [refresh]);

  return { items, loading, error, refresh };
}

export function usePartnerClients(firmId: number | string, search: string) {
  const [items, setItems] = useState<PartnerClient[]>([]);

  const refresh = useCallback(async () => {
    if (!firmId) {
      setItems([]);
      return [] as PartnerClient[];
    }
    const next = await getPartnerClients(firmId, search);
    setItems(next);
    return next;
  }, [firmId, search]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { items, refresh };
}

export function usePartnerClientBusinesses(firmId: number | string, search: string) {
  const [items, setItems] = useState<PartnerClientBusiness[]>([]);

  const refresh = useCallback(async () => {
    if (!firmId) {
      setItems([]);
      return [] as PartnerClientBusiness[];
    }
    const next = await getPartnerClientBusinesses(firmId, search);
    setItems(next);
    return next;
  }, [firmId, search]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    items,
    refresh,
    createBusiness: async (input: {
      businessName: string;
      gstin?: string;
      billingAddress?: string;
      contacts: Array<{ name: string; phone: string }>;
    }) => {
      await createPartnerClientBusiness(firmId, input);
      await refresh();
    },
    addOutlet: async (
      businessId: string,
      input: {
        outletName: string;
        address?: string;
        contacts: Array<{ name: string; phone: string }>;
      },
    ) => {
      await addPartnerClientOutlet(firmId, businessId, input);
      await refresh();
    },
    updateBusiness: async (
      businessId: string,
      input: {
        businessName: string;
        gstin?: string;
        billingAddress?: string;
        contacts: Array<{ name: string; phone: string }>;
      },
    ) => {
      await updatePartnerClientBusiness(firmId, businessId, input);
      await refresh();
    },
    updateOutlet: async (
      businessId: string,
      outletId: string,
      input: {
        outletName: string;
        address?: string;
        contacts: Array<{ name: string; phone: string }>;
        status: "ACTIVE" | "INACTIVE";
      },
    ) => {
      await updatePartnerClientOutlet(firmId, businessId, outletId, input);
      await refresh();
    },
    archiveOutlet: async (businessId: string, outletId: string) => {
      await archivePartnerClientOutlet(firmId, businessId, outletId);
      await refresh();
    },
    validateGSTIN: async (gstin: string, excludeBusinessId = "") => {
      if (!firmId) {
        return { exists: false } as PartnerGSTINValidation;
      }
      return validatePartnerBusinessGSTIN(firmId, gstin, excludeBusinessId);
    },
  };
}

export function usePartnerOrders(firmId: number | string) {
  const [items, setItems] = useState<PartnerOrder[]>([]);

  const refresh = useCallback(async () => {
    if (!firmId) {
      setItems([]);
      return [] as PartnerOrder[];
    }
    const next = await getPartnerOrders(firmId);
    setItems(next);
    return next;
  }, [firmId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    items,
    refresh,
    create: async (input: {
      clientBusinessId: string;
      clientOutletId: string;
      orderDate?: string;
      notes?: string;
      items: Array<{ itemId: string; quantity: number }>;
    }) => {
      await createPartnerOrder(firmId, input);
      await refresh();
    },
    update: async (
      orderId: string,
      input: {
        clientBusinessId: string;
        clientOutletId: string;
        notes?: string;
        items: Array<{ itemId: string; quantity: number }>;
      },
    ) => {
      await updatePartnerOrder(firmId, orderId, input);
      await refresh();
    },
    updateStatus: async (
      orderId: string,
      status: PartnerOrder["status"],
      input: Omit<UpdatePartnerOrderStatusInput, "status"> = {},
    ) => {
      await updatePartnerOrderStatus(firmId, orderId, status, input);
      await refresh();
    },
  };
}

export function usePartnerOrder(firmId: number | string, orderId: string) {
  const [item, setItem] = useState<PartnerOrder | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!firmId || !orderId) {
      setItem(null);
      setError(null);
      return null;
    }
    try {
      setError(null);
      const next = await getPartnerOrderById(firmId, orderId);
      setItem(next);
      return next;
    } catch (err) {
      const nextError = err instanceof Error ? err : new Error("Failed to load order");
      setError(nextError);
      throw nextError;
    }
  }, [firmId, orderId]);

  useEffect(() => {
    void refresh().catch(() => undefined);
  }, [refresh]);

  return {
    item,
    error,
    refresh,
    update: async (input: {
      clientBusinessId: string;
      clientOutletId: string;
      notes?: string;
      items: Array<{ itemId: string; quantity: number }>;
    }) => {
      const next = await updatePartnerOrder(firmId, orderId, input);
      setItem(next);
      return next;
    },
    updateStatus: async (
      status: PartnerOrder["status"],
      input: Omit<UpdatePartnerOrderStatusInput, "status"> = {},
    ) => {
      const next = await updatePartnerOrderStatus(firmId, orderId, status, input);
      setItem(next);
      return next;
    },
  };
}

export function usePartnerInvoices(firmId: number | string) {
  const [items, setItems] = useState<PartnerInvoice[]>([]);

  const refresh = useCallback(async () => {
    if (!firmId) {
      setItems([]);
      return [] as PartnerInvoice[];
    }
    const next = await getPartnerInvoices(firmId);
    setItems(next);
    return next;
  }, [firmId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    items,
    refresh,
    create: async (input: {
      orderId?: string;
      clientBusinessId: string;
      clientOutletId: string;
      invoiceDate: string;
      dueDate?: string;
      notes?: string;
      items?: Array<{ itemId: string; quantity: number }>;
    }) => {
      const next = await createPartnerInvoice(firmId, input);
      await refresh();
      return next;
    },
    cancel: async (invoiceId: string) => {
      await cancelPartnerInvoice(firmId, invoiceId);
      await refresh();
    },
    finalize: async (invoiceId: string) => {
      const next = await finalizePartnerInvoice(firmId, invoiceId);
      await refresh();
      return next;
    },
  };
}

export function usePartnerReceivables(
  firmId: number | string,
  filters: { search?: string; status?: "ALL" | "OUTSTANDING" | "OVERDUE" | "UNPAID" | "PARTIALLY_PAID" | "PAID"; fromDate?: string; toDate?: string; overdueOnly?: boolean },
) {
  const [data, setData] = useState<PartnerReceivablesSummary | null>(null);
  const [loading, setLoading] = useState(Boolean(firmId));
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!firmId) {
      setData(null);
      setLoading(false);
      setError(null);
      return null;
    }
    setLoading(true);
    setError(null);
    try {
      const next = await getPartnerReceivablesSummary(firmId, filters);
      setData(next);
      return next;
    } catch (err) {
      const nextError = err instanceof Error ? err : new Error("Failed to load receivables");
      setError(nextError);
      throw nextError;
    } finally {
      setLoading(false);
    }
  }, [firmId, filters.fromDate, filters.overdueOnly, filters.search, filters.status, filters.toDate]);

  useEffect(() => {
    void refresh().catch(() => undefined);
  }, [refresh]);

  return { data, loading, error, refresh };
}

export function usePartnerPayments(
  firmId: number | string,
  filters: { search?: string; clientBusinessId?: string; invoiceId?: string; fromDate?: string; toDate?: string } = {},
) {
  const [items, setItems] = useState<PartnerPayment[]>([]);
  const [loading, setLoading] = useState(Boolean(firmId));
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!firmId) {
      setItems([]);
      setLoading(false);
      setError(null);
      return [] as PartnerPayment[];
    }
    setLoading(true);
    setError(null);
    try {
      const next = await getPartnerPayments(firmId, filters);
      setItems(next);
      return next;
    } catch (err) {
      const nextError = err instanceof Error ? err : new Error("Failed to load payments");
      setError(nextError);
      throw nextError;
    } finally {
      setLoading(false);
    }
  }, [firmId, filters.clientBusinessId, filters.fromDate, filters.invoiceId, filters.search, filters.toDate]);

  useEffect(() => {
    void refresh().catch(() => undefined);
  }, [refresh]);

  return {
    items,
    loading,
    error,
    refresh,
    create: async (input: {
      invoiceId: string;
      paymentDate: string;
      amount: number;
      paymentMode: PartnerPaymentMode;
      referenceNumber?: string;
      collectedByUserId?: string;
      notes?: string;
    }) => {
      const next = await createPartnerPayment(firmId, input);
      await refresh();
      return next;
    },
  };
}

export function usePartnerClientLedger(
  firmId: number | string,
  filters: { clientBusinessId?: string; fromDate?: string; toDate?: string } = {},
) {
  const [items, setItems] = useState<PartnerClientLedgerEntry[]>([]);
  const [loading, setLoading] = useState(Boolean(firmId));
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!firmId) {
      setItems([]);
      setLoading(false);
      setError(null);
      return [] as PartnerClientLedgerEntry[];
    }
    setLoading(true);
    setError(null);
    try {
      const next = await getPartnerClientLedger(firmId, filters);
      setItems(next);
      return next;
    } catch (err) {
      const nextError = err instanceof Error ? err : new Error("Failed to load client ledger");
      setError(nextError);
      throw nextError;
    } finally {
      setLoading(false);
    }
  }, [firmId, filters.clientBusinessId, filters.fromDate, filters.toDate]);

  useEffect(() => {
    void refresh().catch(() => undefined);
  }, [refresh]);

  return { items, loading, error, refresh };
}

export function usePartnerCreditNotes(firmId: number | string) {
  const [items, setItems] = useState<PartnerCreditNote[]>([]);

  const refresh = useCallback(async () => {
    if (!firmId) {
      setItems([]);
      return [] as PartnerCreditNote[];
    }
    const next = await getPartnerCreditNotes(firmId);
    setItems(next);
    return next;
  }, [firmId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    items,
    refresh,
    create: async (input: {
      clientBusinessId: string;
      clientOutletId: string;
      relatedInvoiceId?: string;
      creditDate: string;
      note?: string;
      status?: "DRAFT" | "ISSUED" | "CANCELLED";
      hasStockReturn: boolean;
      lines: Array<{ itemId?: string; quantity?: number; amount: number; referenceInvoiceLineId?: string }>;
    }) => {
      await createPartnerCreditNote(firmId, input);
      await refresh();
    },
  };
}

export function usePartnerDebitNotes(firmId: number | string) {
  const [items, setItems] = useState<PartnerDebitNote[]>([]);

  const refresh = useCallback(async () => {
    if (!firmId) {
      setItems([]);
      return [] as PartnerDebitNote[];
    }
    const next = await getPartnerDebitNotes(firmId);
    setItems(next);
    return next;
  }, [firmId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    items,
    refresh,
    create: async (input: {
      clientBusinessId: string;
      clientOutletId: string;
      relatedInvoiceId?: string;
      debitDate: string;
      note?: string;
      status?: "DRAFT" | "ISSUED" | "CANCELLED";
      lines: Array<{ itemId?: string; description: string; amount: number }>;
    }) => {
      await createPartnerDebitNote(firmId, input);
      await refresh();
    },
  };
}

export function usePartnerSalesReport(
  firmId: number | string,
  filters: { fromDate?: string; toDate?: string; brandId?: string; itemId?: string; clientBusinessId?: string; clientOutletId?: string },
) {
  const [items, setItems] = useState<PartnerSalesReportRow[]>([]);

  const refresh = useCallback(async () => {
    if (!firmId) {
      setItems([]);
      return [] as PartnerSalesReportRow[];
    }
    const next = await getPartnerSalesReport(firmId, filters);
    setItems(next);
    return next;
  }, [firmId, filters.brandId, filters.clientBusinessId, filters.clientOutletId, filters.fromDate, filters.itemId, filters.toDate]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { items, refresh };
}

export function usePartnerStockMovementReport(
  firmId: number | string,
  filters: { fromDate?: string; toDate?: string; brandId?: string; itemId?: string },
) {
  const [items, setItems] = useState<PartnerStockMovementReportRow[]>([]);

  const refresh = useCallback(async () => {
    if (!firmId) {
      setItems([]);
      return [] as PartnerStockMovementReportRow[];
    }
    const next = await getPartnerStockMovementReport(firmId, filters);
    setItems(next);
    return next;
  }, [firmId, filters.brandId, filters.fromDate, filters.itemId, filters.toDate]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { items, refresh };
}

export function usePartnerClientPurchaseHistory(
  firmId: number | string,
  filters: { fromDate?: string; toDate?: string; itemId?: string; clientBusinessId?: string; clientOutletId?: string },
) {
  const [items, setItems] = useState<PartnerClientPurchaseHistoryRow[]>([]);

  const refresh = useCallback(async () => {
    if (!firmId) {
      setItems([]);
      return [] as PartnerClientPurchaseHistoryRow[];
    }
    const next = await getPartnerClientPurchaseHistory(firmId, filters);
    setItems(next);
    return next;
  }, [firmId, filters.clientBusinessId, filters.clientOutletId, filters.fromDate, filters.itemId, filters.toDate]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { items, refresh };
}

export function usePartnerAuditLogs(
  firmId: number | string,
  filters: { entityType?: string; fromDate?: string; toDate?: string; userId?: number | string },
) {
  const [items, setItems] = useState<PartnerAuditLog[]>([]);

  const refresh = useCallback(async () => {
    if (!firmId) {
      setItems([]);
      return [] as PartnerAuditLog[];
    }
    const next = await getPartnerAuditLogs(firmId, filters);
    setItems(next);
    return next;
  }, [firmId, filters.entityType, filters.fromDate, filters.toDate, filters.userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { items, refresh };
}

export function usePartnerGlobalSearch(firmId: number | string, query: string) {
  const [items, setItems] = useState<PartnerGlobalSearchResult[]>([]);

  const refresh = useCallback(async () => {
    if (!firmId || !query.trim()) {
      setItems([]);
      return [] as PartnerGlobalSearchResult[];
    }
    const next = await getPartnerGlobalSearch(firmId, query);
    setItems(next);
    return next;
  }, [firmId, query]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { items, refresh };
}

export function usePartnerInvoice(firmId: number | string, invoiceId: string) {
  const [item, setItem] = useState<PartnerInvoice | null>(null);

  const refresh = useCallback(async () => {
    if (!firmId || !invoiceId) {
      setItem(null);
      return null;
    }
    const next = await getPartnerInvoiceById(firmId, invoiceId);
    setItem(next);
    return next;
  }, [firmId, invoiceId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    item,
    refresh,
    cancel: async () => {
      const next = await cancelPartnerInvoice(firmId, invoiceId);
      setItem(next);
      return next;
    },
    finalize: async () => {
      const next = await finalizePartnerInvoice(firmId, invoiceId);
      setItem(next);
      return next;
    },
  };
}

export function usePartnerSuppliers(firmId: number | string, search: string) {
  const [items, setItems] = useState<PartnerSupplier[]>([]);
  const [loading, setLoading] = useState(() => Boolean(firmId));
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!firmId) {
      setItems([]);
      setError(null);
      setLoading(false);
      return [] as PartnerSupplier[];
    }
    setLoading(true);
    setError(null);
    try {
      const next = await getPartnerSuppliers(firmId, search);
      setItems(next);
      return next;
    } catch (error) {
      setError(error instanceof Error ? error : new Error("Failed to load suppliers"));
      throw error;
    } finally {
      setLoading(false);
    }
  }, [firmId, search]);

  useEffect(() => {
    void refresh().catch(() => undefined);
  }, [refresh]);

  return {
    items,
    loading,
    error,
    refresh,
    create: async (input: { supplierName: string; gstin?: string; phone?: string; address?: string }) => {
      await createPartnerSupplier(firmId, input);
      await refresh();
    },
    update: async (
      supplierId: string,
      input: { supplierName: string; gstin?: string; phone?: string; address?: string; status: "ACTIVE" | "INACTIVE" },
    ) => {
      await updatePartnerSupplier(firmId, supplierId, input);
      await refresh();
    },
    archive: async (supplierId: string) => {
      await archivePartnerSupplier(firmId, supplierId);
      await refresh();
    },
    validateGSTIN: async (gstin: string, excludeSupplierId = "") => {
      if (!firmId) {
        return { exists: false } as PartnerSupplierGSTINValidation;
      }
      return validatePartnerSupplierGSTIN(firmId, gstin, excludeSupplierId);
    },
  };
}

export function usePartnerPayables(
  firmId: number | string,
  filters: { search?: string; supplierId?: string; status?: string; fromDate?: string; toDate?: string; overdueOnly?: boolean } = {},
) {
  const [data, setData] = useState<PartnerPayablesSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!firmId) {
      setData(null);
      return null;
    }
    setLoading(true);
    setError(null);
    try {
      const next = await getPartnerPayables(firmId, filters);
      setData(next);
      return next;
    } catch (err) {
      const nextError = err instanceof Error ? err : new Error("Failed to load payables");
      setError(nextError);
      return null;
    } finally {
      setLoading(false);
    }
  }, [firmId, filters.search, filters.supplierId, filters.status, filters.fromDate, filters.toDate, filters.overdueOnly]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    data,
    loading,
    error,
    refresh,
    createInvoice: async (input: {
      supplierId: string;
      purchaseId?: string;
      grnId?: string;
      invoiceNumber: string;
      invoiceDate: string;
      dueDate?: string;
      taxableAmount: number;
      gstAmount: number;
      finalTotalAmount: number;
      finalize?: boolean;
    }) => {
      const next = await createPartnerSupplierInvoice(firmId, input);
      await refresh();
      return next;
    },
    finalizeInvoice: async (supplierInvoiceId: string) => {
      const next = await finalizePartnerSupplierInvoice(firmId, supplierInvoiceId);
      await refresh();
      return next;
    },
    recordPayment: async (input: {
      supplierInvoiceId: string;
      paymentDate: string;
      amount: number;
      paymentMode: PartnerPaymentMode;
      referenceNumber?: string;
      notes?: string;
    }) => {
      const next = await createPartnerSupplierPayment(firmId, input);
      await refresh();
      return next;
    },
  };
}

export function usePartnerSupplierInvoices(
  firmId: number | string,
  filters: { search?: string; supplierId?: string; status?: string; fromDate?: string; toDate?: string; overdueOnly?: boolean } = {},
) {
  const [items, setItems] = useState<PartnerSupplierInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!firmId) {
      setItems([]);
      return [] as PartnerSupplierInvoice[];
    }
    setLoading(true);
    setError(null);
    try {
      const next = await getPartnerSupplierInvoices(firmId, filters);
      setItems(next);
      return next;
    } catch (err) {
      const nextError = err instanceof Error ? err : new Error("Failed to load supplier invoices");
      setError(nextError);
      return [] as PartnerSupplierInvoice[];
    } finally {
      setLoading(false);
    }
  }, [firmId, filters.search, filters.supplierId, filters.status, filters.fromDate, filters.toDate, filters.overdueOnly]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { items, loading, error, refresh };
}

export function usePartnerSupplierPayments(
  firmId: number | string,
  filters: { search?: string; supplierId?: string; supplierInvoiceId?: string; fromDate?: string; toDate?: string } = {},
) {
  const [items, setItems] = useState<PartnerSupplierPayment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!firmId) {
      setItems([]);
      return [] as PartnerSupplierPayment[];
    }
    setLoading(true);
    setError(null);
    try {
      const next = await getPartnerSupplierPayments(firmId, filters);
      setItems(next);
      return next;
    } catch (err) {
      const nextError = err instanceof Error ? err : new Error("Failed to load supplier payments");
      setError(nextError);
      return [] as PartnerSupplierPayment[];
    } finally {
      setLoading(false);
    }
  }, [firmId, filters.search, filters.supplierId, filters.supplierInvoiceId, filters.fromDate, filters.toDate]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { items, loading, error, refresh };
}

export function usePartnerSupplierLedger(
  firmId: number | string,
  filters: { supplierId?: string; fromDate?: string; toDate?: string } = {},
) {
  const [items, setItems] = useState<PartnerSupplierLedgerEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!firmId) {
      setItems([]);
      return [] as PartnerSupplierLedgerEntry[];
    }
    setLoading(true);
    setError(null);
    try {
      const next = await getPartnerSupplierLedger(firmId, filters);
      setItems(next);
      return next;
    } catch (err) {
      const nextError = err instanceof Error ? err : new Error("Failed to load supplier ledger");
      setError(nextError);
      return [] as PartnerSupplierLedgerEntry[];
    } finally {
      setLoading(false);
    }
  }, [firmId, filters.supplierId, filters.fromDate, filters.toDate]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { items, loading, error, refresh };
}

export function usePartnerPurchases(firmId: number | string) {
  const [items, setItems] = useState<PartnerPurchase[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!firmId) {
      setItems([]);
      return [] as PartnerPurchase[];
    }
    setIsLoading(true);
    setError("");
    try {
      const next = await getPartnerPurchases(firmId);
      setItems(next);
      return next;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong, please try again later";
      setError(message);
      return [] as PartnerPurchase[];
    } finally {
      setIsLoading(false);
    }
  }, [firmId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    items,
    isLoading,
    error,
    refresh,
    create: async (input: {
      supplierId: string;
      purchaseNumber: string;
      supplierInvoiceNumber?: string;
      supplierInvoiceDate?: string;
      purchaseDate: string;
      expectedInwardDate?: string;
      notes?: string;
      items: Array<{ itemId: string; quantity: number; costPrice: number; discountPercentage?: number; taxPercentage?: number }>;
    }) => {
      await createPartnerPurchase(firmId, input);
      await refresh();
    },
    order: async (purchaseId: string) => {
      await orderPartnerPurchase(firmId, purchaseId);
      await refresh();
    },
    receive: async (
      purchaseId: string,
      input: {
        receivedDate: string;
        notes?: string;
        items: Array<{ purchaseItemId?: string; itemId?: string; receivedQuantity: number; damagedQuantity?: number; notes?: string }>;
      },
    ) => {
      await receivePartnerPurchase(firmId, purchaseId, input);
      await refresh();
    },
    cancel: async (purchaseId: string) => {
      await cancelPartnerPurchase(firmId, purchaseId);
      await refresh();
    },
  };
}

export function usePartnerPurchase(firmId: number | string, purchaseId: string) {
  const [item, setItem] = useState<PartnerPurchase | null>(null);
  const [receipts, setReceipts] = useState<PartnerGoodsReceipt[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!firmId || !purchaseId) {
      setItem(null);
      setReceipts([]);
      return null;
    }
    setIsLoading(true);
    setError("");
    try {
      const [next, nextReceipts] = await Promise.all([
        getPartnerPurchaseById(firmId, purchaseId),
        getPartnerGoodsReceipts(firmId, purchaseId),
      ]);
      setItem(next);
      setReceipts(nextReceipts);
      return next;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong, please try again later";
      setError(message);
      setItem(null);
      setReceipts([]);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [firmId, purchaseId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    item,
    receipts,
    isLoading,
    error,
    refresh,
    order: async () => {
      const next = await orderPartnerPurchase(firmId, purchaseId);
      setItem(next);
      return next;
    },
    receive: async (input: {
      receivedDate: string;
      notes?: string;
      items: Array<{ purchaseItemId?: string; itemId?: string; receivedQuantity: number; damagedQuantity?: number; notes?: string }>;
    }) => {
      const next = await receivePartnerPurchase(firmId, purchaseId, input);
      setItem(next);
      const nextReceipts = await getPartnerGoodsReceipts(firmId, purchaseId);
      setReceipts(nextReceipts);
      return next;
    },
    cancel: async () => {
      const next = await cancelPartnerPurchase(firmId, purchaseId);
      setItem(next);
      return next;
    },
  };
}

export function usePartnerStock(firmId: number | string, brandId: number | string) {
  const [items, setItems] = useState<PartnerStockRow[]>([]);

  const refresh = useCallback(async () => {
    if (!firmId) {
      setItems([]);
      return [] as PartnerStockRow[];
    }
    const next = await getPartnerStock(firmId, brandId);
    setItems(next);
    return next;
  }, [firmId, brandId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    items,
    refresh,
  };
}

export function usePartnerInventory(firmId: number | string, brandId: number | string) {
  const [items, setItems] = useState<PartnerInventoryItem[]>([]);

  const refresh = useCallback(async () => {
    if (!firmId) {
      setItems([]);
      return [] as PartnerInventoryItem[];
    }
    const next = await getPartnerInventory(firmId, brandId);
    setItems(next);
    return next;
  }, [firmId, brandId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    items,
    refresh,
    createBatch: async (input: PartnerInventoryCreateInput[]) => {
      await createPartnerInventory(firmId, input);
      await refresh();
    },
    update: async (itemId: string, input: PartnerInventoryUpdateInput) => {
      await updatePartnerInventory(firmId, itemId, input);
      await refresh();
    },
  };
}

export function usePartnerInventoryHistory(
  firmId: number | string,
  filters: { brandId?: string; fromDate?: string; toDate?: string; query?: string } = {},
) {
  const [items, setItems] = useState<PartnerInventoryHistoryEntry[]>([]);

  const refresh = useCallback(async () => {
    if (!firmId) {
      setItems([]);
      return [] as PartnerInventoryHistoryEntry[];
    }
    const next = await getPartnerInventoryHistory(firmId, filters);
    const safeNext = Array.isArray(next) ? next : [];
    setItems(safeNext);
    return safeNext;
  }, [filters.brandId, filters.fromDate, filters.query, filters.toDate, firmId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    items,
    refresh,
    revertSupplyInward: async (supplyInwardId: string, reason = "") => {
      await revertPartnerSupplyInward(firmId, supplyInwardId, reason);
      await refresh();
    },
  };
}

export function usePartnerStockLedger(firmId: number | string, itemId: string, filters: PartnerStockLedgerFilters = {}) {
  const [items, setItems] = useState<PartnerStockLedgerEntry[]>([]);

  const refresh = useCallback(async () => {
    if (!firmId || !itemId) {
      setItems([]);
      return [] as PartnerStockLedgerEntry[];
    }
    const next = await getPartnerStockLedger(firmId, itemId, filters);
    setItems(next);
    return next;
  }, [firmId, filters.fromDate, filters.query, filters.reasonType, filters.referenceType, filters.toDate, itemId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    items,
    refresh,
    createAdjustment: async (input: {
      itemId: string;
      quantityDelta: number;
      reasonType: PartnerStockReasonType;
      referenceType?: string;
      referenceId?: string;
      note?: string;
    }) => {
      await createPartnerStockAdjustment(firmId, input);
      await refresh();
    },
    createAction: async (input: PartnerStockActionInput) => {
      await createPartnerStockAction(firmId, input);
      await refresh();
    },
  };
}

export function usePartnerStockLedgerByReference(firmId: number | string, referenceType: string, referenceId: string) {
  const [items, setItems] = useState<PartnerStockLedgerEntry[]>([]);

  const refresh = useCallback(async () => {
    if (!firmId || !referenceType || !referenceId) {
      setItems([]);
      return [] as PartnerStockLedgerEntry[];
    }
    const next = await getPartnerStockLedgerByReference(firmId, referenceType, referenceId);
    setItems(next);
    return next;
  }, [firmId, referenceType, referenceId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { items, refresh };
}
