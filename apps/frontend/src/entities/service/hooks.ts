import { useEffect, useState } from "react";
import type { Service } from "@shared/types/domain";
import { createService, getServices, updateService } from "@entities/service/api";

export function useServices(clientId: string) {
  const [items, setItems] = useState<Service[]>([]);

  const refresh = async () => {
    setItems(await getServices(clientId));
  };

  useEffect(() => {
    void refresh();
  }, [clientId]);

  return {
    items,
    refresh,
    create: async (input: Omit<Service, "id">) => {
      await createService(input);
      await refresh();
    },
    update: async (id: string, patch: Partial<Service>) => {
      await updateService(id, patch);
      await refresh();
    }
  };
}
