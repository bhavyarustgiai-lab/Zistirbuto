import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { PartnersLayout } from "@app/layout/PartnersLayout";
import { useAppState } from "@app/providers/AppStateProvider";
import { PartnersRoutes } from "@app/routes/PartnersRoutes";
import { LoginPage } from "@pages/LoginPage";
import { ProfileSetupPage } from "@pages/ProfileSetupPage";
import { Spinner } from "@shared/ui/atoms/Spinner";
import { ErrorState } from "@shared/ui/molecules/error-state";

export function App() {
  const location = useLocation();
  const { loading, currentUser, partnerFirms, partnerLoadError, refresh } = useAppState();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f4f5f8]">
        <Spinner />
      </div>
    );
  }

  const isPartnerWorkspace = location.pathname.startsWith("/partners");
  const isAuthRoute = location.pathname.startsWith("/login");
  const isProfileSetupRoute = location.pathname.startsWith("/signup");
  const needsProfileSetup = Boolean(currentUser && !currentUser.name.trim());

  if (!currentUser && !isAuthRoute) {
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

  if (currentUser && isPartnerWorkspace && partnerLoadError) {
    return (
      <section className="grid min-h-screen place-items-center bg-[#f4f5f8] p-6">
        <div className="w-full max-w-xl">
          <ErrorState
            title="Partner workspace unavailable"
            message="Your login session is active, but the partner workspace could not load. Please retry after the backend schema is fixed."
            onRetry={() => void refresh()}
          />
        </div>
      </section>
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
      <Route path="/" element={<Navigate to="/partners" replace />} />
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
      <Route path="*" element={<Navigate to="/partners" replace />} />
    </Routes>
  );
}

function PartnerWorkspace() {
  return (
    <PartnersLayout>
      <PartnersRoutes />
    </PartnersLayout>
  );
}
