import { useEffect, useState } from "react";
import type { DayEntry } from "@shared/types/domain";
import { createDayEntry, deleteDayEntry, getDayEntries, updateDayEntry } from "@entities/day-entry/api";

export function useDayEntries(clientId: string, fromDate: string, toDate: string) {
  const [items, setItems] = useState<DayEntry[]>([]);

  const refresh = async () => {
    setItems(await getDayEntries(clientId, fromDate, toDate));
  };

  useEffect(() => {
    void refresh();
  }, [clientId, fromDate, toDate]);

  return {
    items,
    refresh,
    create: async (input: Omit<DayEntry, "id" | "paymentStatus">) => {
      await createDayEntry(input);
      await refresh();
    },
    update: async (id: string, patch: Partial<DayEntry>) => {
      await updateDayEntry(id, patch);
      await refresh();
    },
    remove: async (id: string) => {
      await deleteDayEntry(id);
      await refresh();
    }
  };
}
