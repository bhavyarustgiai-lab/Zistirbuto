import { useEffect, useState } from "react";
import type { EntityMember, EntityRole, Invite } from "@shared/types/domain";
import {
  acceptInvite,
  createInvite,
  getInvites,
  getMembers,
  removeMember,
  revokeInvite,
} from "@entities/members/api";

export function useMembers(entityId: string) {
  const [items, setItems] = useState<EntityMember[]>([]);

  const refresh = async () => {
    if (!entityId) {
      setItems([]);
      return;
    }
    setItems(await getMembers(entityId));
  };

  useEffect(() => {
    void refresh();
  }, [entityId]);

  return {
    items,
    refresh,
    remove: async (userId: number) => {
      await removeMember(entityId, userId);
      await refresh();
    },
  };
}

export function useInvites(entityId: string) {
  const [items, setItems] = useState<Invite[]>([]);

  const refresh = async () => {
    if (!entityId) {
      setItems([]);
      return;
    }
    setItems(await getInvites(entityId));
  };

  useEffect(() => {
    void refresh();
  }, [entityId]);

  return {
    items,
    refresh,
    create: async (phone: string, role: EntityRole) => {
      const invite = await createInvite(entityId, phone, role);
      await refresh();
      return invite;
    },
    revoke: async (inviteId: string) => {
      await revokeInvite(inviteId);
      await refresh();
    },
    accept: async (token: string) => {
      const member = await acceptInvite(token);
      await refresh();
      return member;
    },
  };
}
