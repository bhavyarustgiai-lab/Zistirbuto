import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { createEntity, type CreateEntityInput, getMe } from "@entities/client/api";
import { createPartnerFirm, getPartnersMe, updatePartnerFirm, type PartnerFirmInput, type PartnerFirmUpdateInput } from "@entities/partners/api";
import { logout, requestLoginOtp, updateProfile, verifyLoginOtp, type AuthUser, type RequestLoginOtpInput, type RequestLoginOtpResponse, type UpdateProfileInput, type VerifyLoginOtpInput, type VerifyLoginOtpResponse } from "@entities/auth/api";
import { ApiError } from "@shared/api/http";
import type { Client, EntityMember, EntityRole, PartnerFirm } from "@shared/types/domain";

const PARTNER_ACTIVE_FIRM_STORAGE_KEY = "zistributo.partners.activeFirmId";

type AppState = {
  loading: boolean;
  clients: Client[];
  currentClientId: string;
  currentUser: AuthUser | null;
  memberships: EntityMember[];
  partnerFirms: PartnerFirm[];
  partnerUserEmail?: string;
  activePartnerFirmId: number;
  currentEntityRole?: EntityRole;
  setCurrentClientId: (id: string) => void;
  setActivePartnerFirmId: (id: number) => void;
  createPartnerFirm: (input: PartnerFirmInput) => Promise<PartnerFirm>;
  updatePartnerFirm: (firmId: number, input: PartnerFirmUpdateInput) => Promise<PartnerFirm>;
  createEntity: (input: CreateEntityInput) => Promise<Client>;
  requestLoginOtp: (input: RequestLoginOtpInput) => Promise<RequestLoginOtpResponse>;
  verifyLoginOtp: (input: VerifyLoginOtpInput) => Promise<VerifyLoginOtpResponse>;
  updateProfile: (input: UpdateProfileInput) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AppStateContext = createContext<AppState | null>(null);

function isSessionLoadFailure(error: unknown) {
  if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
    return true;
  }
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  return (
    message.includes("authentication") ||
    message.includes("unauthorized") ||
    message.includes("forbidden") ||
    message.includes("failed to fetch") ||
    message.includes("networkerror") ||
    message.includes("load failed")
  );
}

function uniquePartnerFirms(firms: PartnerFirm[]) {
  const seen = new Set<number>();
  return firms.filter((firm) => {
    if (seen.has(firm.id)) return false;
    seen.add(firm.id);
    return true;
  });
}

export function AppStateProvider({ children }: PropsWithChildren) {
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [currentClientId, setCurrentClientId] = useState("");
  const [currentUser, setCurrentUser] = useState<AppState["currentUser"]>(null);
  const [memberships, setMemberships] = useState<EntityMember[]>([]);
  const [partnerFirms, setPartnerFirms] = useState<PartnerFirm[]>([]);
  const [partnerUserEmail, setPartnerUserEmail] = useState("");
  const [activePartnerFirmId, setActivePartnerFirmIdState] = useState(() => {
    if (typeof window === "undefined") return 0;
    const stored = Number(window.localStorage.getItem(PARTNER_ACTIVE_FIRM_STORAGE_KEY) ?? "0");
    return Number.isFinite(stored) ? stored : 0;
  });

  const setActivePartnerFirmId = useCallback((id: number) => {
    setActivePartnerFirmIdState(id);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(PARTNER_ACTIVE_FIRM_STORAGE_KEY, String(id));
    }
  }, []);

  const resetSessionState = useCallback(() => {
    setCurrentUser(null);
    setClients([]);
    setMemberships([]);
    setPartnerFirms([]);
    setPartnerUserEmail("");
    setActivePartnerFirmIdState(0);
    setCurrentClientId("");
  }, []);

  const refresh = useCallback(async () => {
    try {
      const [res, partnersRes] = await Promise.all([getMe(), getPartnersMe()]);
      setClients(res.clients);
      setCurrentClientId((prev) => {
        if (prev && res.clients.some((client) => client.id === prev)) {
          return prev;
        }
        return res.currentClientId;
      });
      setCurrentUser(res.user);
      setMemberships(res.memberships);
      const firms = uniquePartnerFirms(partnersRes.firms);
      setPartnerFirms(firms);
      setPartnerUserEmail(partnersRes.user.email ?? "");
      setActivePartnerFirmIdState((prev) => {
        const existing = prev || (typeof window !== "undefined"
          ? Number(window.localStorage.getItem(PARTNER_ACTIVE_FIRM_STORAGE_KEY) ?? "0")
          : 0);
        if (existing && firms.some((firm) => firm.id === existing)) {
          return existing;
        }
        const next = partnersRes.activeFirmId || firms[0]?.id || 0;
        if (typeof window !== "undefined") {
          window.localStorage.setItem(PARTNER_ACTIVE_FIRM_STORAGE_KEY, String(next));
        }
        return next;
      });
    } catch (error) {
      if (isSessionLoadFailure(error)) {
        resetSessionState();
        return;
      }
      throw error;
    }
  }, [resetSessionState]);

  useEffect(() => {
    refresh()
      .catch((error) => {
        console.error("Failed to load app session", error);
        resetSessionState();
      })
      .finally(() => setLoading(false));
  }, [refresh, resetSessionState]);

  const handleCreateEntity = useCallback(async (input: CreateEntityInput) => {
    const next = await createEntity(input);
    await refresh();
    setCurrentClientId(next.id);
    return next;
  }, [refresh]);

  const handleCreatePartnerFirm = useCallback(async (input: PartnerFirmInput) => {
    const next = await createPartnerFirm(input);
    await refresh();
    setActivePartnerFirmId(next.id);
    return next;
  }, [refresh, setActivePartnerFirmId]);

  const handleUpdatePartnerFirm = useCallback(async (firmId: number, input: PartnerFirmUpdateInput) => {
    const next = await updatePartnerFirm(firmId, input);
    await refresh();
    return next;
  }, [refresh]);

  const handleRequestLoginOtp = useCallback((input: RequestLoginOtpInput) => {
    return requestLoginOtp(input);
  }, []);

  const handleVerifyLoginOtp = useCallback(async (input: VerifyLoginOtpInput) => {
    const result = await verifyLoginOtp(input);
    await refresh();
    return result;
  }, [refresh]);

  const handleUpdateProfile = useCallback(async (input: UpdateProfileInput) => {
    await updateProfile(input);
    await refresh();
  }, [refresh]);

  const handleLogout = useCallback(async () => {
    await logout();
    resetSessionState();
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(PARTNER_ACTIVE_FIRM_STORAGE_KEY);
    }
  }, [resetSessionState]);

  const currentEntityRole = useMemo(
    () => memberships.find((membership) => membership.entityId === currentClientId)?.role,
    [currentClientId, memberships]
  );

  const value = useMemo(
    () => ({
      loading,
      clients,
      currentClientId,
      currentUser,
      memberships,
      partnerFirms,
      partnerUserEmail,
      activePartnerFirmId,
      currentEntityRole,
      setCurrentClientId,
      setActivePartnerFirmId,
      createPartnerFirm: handleCreatePartnerFirm,
      updatePartnerFirm: handleUpdatePartnerFirm,
      createEntity: handleCreateEntity,
      requestLoginOtp: handleRequestLoginOtp,
      verifyLoginOtp: handleVerifyLoginOtp,
      updateProfile: handleUpdateProfile,
      logout: handleLogout,
      refresh
    }),
    [
      loading,
      clients,
      currentClientId,
      currentUser,
      memberships,
      partnerFirms,
      partnerUserEmail,
      activePartnerFirmId,
      currentEntityRole,
      handleCreateEntity,
      handleCreatePartnerFirm,
      handleUpdatePartnerFirm,
      handleRequestLoginOtp,
      handleVerifyLoginOtp,
      handleUpdateProfile,
      handleLogout,
      refresh,
      setActivePartnerFirmId
    ]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) {
    throw new Error("useAppState must be used in AppStateProvider");
  }
  return ctx;
}
