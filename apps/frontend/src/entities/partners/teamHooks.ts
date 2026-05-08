import { useEffect, useState } from "react";
import type { PartnerFirmInvite, PartnerFirmMembership, PartnerFirmRole } from "@shared/types/domain";
import {
  createPartnerFirmMembership,
  getPartnerFirmInvites,
  getPartnerFirmMemberships,
  removePartnerFirmMembershipByRole,
  revokePartnerFirmInviteByRole,
} from "@entities/partners/api";

export function usePartnerFirmMemberships(firmId: number | string) {
  const [items, setItems] = useState<PartnerFirmMembership[]>([]);

  const refresh = async () => {
    if (!firmId) {
      setItems([]);
      return;
    }
    setItems((await getPartnerFirmMemberships(firmId)) ?? []);
  };

  useEffect(() => {
    void refresh();
  }, [firmId]);

  return {
    items,
    refresh,
    remove: async (userId: number, role: PartnerFirmRole) => {
      await removePartnerFirmMembershipByRole(firmId, userId, role);
      await refresh();
    },
  };
}

export function usePartnerFirmInvites(firmId: number | string) {
  const [items, setItems] = useState<PartnerFirmInvite[]>([]);

  const refresh = async () => {
    if (!firmId) {
      setItems([]);
      return;
    }
    setItems((await getPartnerFirmInvites(firmId)) ?? []);
  };

  useEffect(() => {
    void refresh();
  }, [firmId]);

  return {
    items,
    refresh,
    create: async (phone: string, role: Exclude<PartnerFirmRole, "OWNER">) => {
      const result = await createPartnerFirmMembership(firmId, { phone, role });
      await refresh();
      return result;
    },
    revoke: async (inviteId: string, role: PartnerFirmRole) => {
      await revokePartnerFirmInviteByRole(firmId, inviteId, role);
      await refresh();
    },
  };
}
