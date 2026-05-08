import { useEffect, useState } from "react";
import type { StaffServiceCapability } from "@shared/types/domain";
import {
  getStaffCapabilities,
  getStaffMembers,
  type StaffMember,
  updateStaffCapabilities,
} from "@entities/staffCapabilities/api";

export function useStaffMembers(entityId: string) {
  const [items, setItems] = useState<StaffMember[]>([]);

  const refresh = async () => {
    if (!entityId) {
      setItems([]);
      return;
    }
    setItems(await getStaffMembers(entityId));
  };

  useEffect(() => {
    void refresh();
  }, [entityId]);

  return { items, refresh };
}

export function useStaffCapabilities(entityId: string) {
  const [items, setItems] = useState<StaffServiceCapability[]>([]);

  const refresh = async () => {
    if (!entityId) {
      setItems([]);
      return;
    }
    setItems(await getStaffCapabilities(entityId));
  };

  useEffect(() => {
    void refresh();
  }, [entityId]);

  return {
    items,
    refresh,
    update: async (userId: number, serviceIds: string[]) => {
      const updated = await updateStaffCapabilities(entityId, userId, serviceIds);
      setItems((prev) => {
        const rest = prev.filter((item) => !(item.entityId === entityId && item.userId === userId));
        return [...updated, ...rest];
      });
      return updated;
    },
  };
}
