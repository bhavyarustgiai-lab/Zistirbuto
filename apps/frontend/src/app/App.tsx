import { useEffect, useRef } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AppLayout } from "@app/layout/AppLayout";
import { PartnersLayout } from "@app/layout/PartnersLayout";
import { useAppState } from "@app/providers/AppStateProvider";
import { AppRoutes } from "@app/routes/AppRoutes";
import { PartnersRoutes } from "@app/routes/PartnersRoutes";
import { EntityOnboardingPage } from "@pages/EntityOnboardingPage";
import { HomePage } from "@pages/HomePage";
import { InviteAcceptPage } from "@pages/InviteAcceptPage";
import { LoginPage } from "@pages/LoginPage";
import { ProfileSetupPage } from "@pages/ProfileSetupPage";
import { Spinner } from "@shared/ui/atoms/Spinner";

export function App() {
  const location = useLocation();
  const { loading, clients, currentUser, partnerFirms, refresh } = useAppState();
  const routeKey = `${location.pathname}${location.search}`;
  const lastRefreshedRouteKeyRef = useRef(routeKey);

  useEffect(() => {
    if (loading) {
      lastRefreshedRouteKeyRef.current = routeKey;
      return;
    }

    if (lastRefreshedRouteKeyRef.current === routeKey) return;

    lastRefreshedRouteKeyRef.current = routeKey;
    void refresh().catch((error) => {
      console.error("Failed to refresh app state after route change", error);
    });
  }, [loading, refresh, routeKey]);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f4f5f8]">
        <Spinner />
      </div>
    );
  }

  const isClientWorkspace = location.pathname.startsWith("/clients");
  const isPartnerWorkspace = location.pathname.startsWith("/partners");
  const isInviteRoute =
    location.pathname.startsWith("/invite/") ||
    location.pathname.startsWith("/clients/invite/");
  const isAuthRoute = location.pathname.startsWith("/login");
  const isProfileSetupRoute = location.pathname.startsWith("/signup");
  const needsProfileSetup = Boolean(currentUser && !currentUser.name.trim());

  if (!currentUser && (isClientWorkspace || isPartnerWorkspace || isInviteRoute) && !isAuthRoute) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  if (currentUser && needsProfileSetup && !isProfileSetupRoute) {
    return (
      <Routes>
        <Route path="/signup" element={<ProfileSetupPage />} />
        <Route path="*" element={<Navigate to="/signup" replace />} />
      </Routes>
    );
  }

  if (currentUser && clients.length === 0 && isClientWorkspace && !isInviteRoute) {
    return (
      <Routes>
        <Route
          path="/clients/entities/onboard"
          element={<EntityOnboardingPage />}
        />
        <Route
          path="*"
          element={<Navigate to="/clients/entities/onboard" replace />}
        />
      </Routes>
    );
  }

  if (
    currentUser &&
    isPartnerWorkspace &&
    partnerFirms.length === 0 &&
    location.pathname !== "/partners/onboarding/firm"
  ) {
    return (
      <Routes>
        <Route path="/partners/onboarding/firm" element={<PartnerWorkspace />} />
        <Route path="*" element={<Navigate to="/partners/onboarding/firm" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/partners/*" element={<PartnerWorkspace />} />
      <Route
        path="/login"
        element={
          currentUser ? (
            <Navigate to={needsProfileSetup ? "/signup" : "/partners"} replace />
          ) : (
            <LoginPage />
          )
        }
      />
      <Route
        path="/signup"
        element={
          currentUser ? (
            needsProfileSetup ? <ProfileSetupPage /> : <Navigate to="/partners" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route path="/invite/:token" element={<InviteAcceptPage />} />
      <Route path="/clients/*" element={<ClientWorkspace />} />
      <Route path="*" element={<Navigate to={isClientWorkspace ? "/clients/appointments" : "/"} replace />} />
    </Routes>
  );
}

function ClientWorkspace() {
  return (
    <AppLayout>
      <AppRoutes />
    </AppLayout>
  );
}

function PartnerWorkspace() {
  return (
    <PartnersLayout>
      <PartnersRoutes />
    </PartnersLayout>
  );
}
