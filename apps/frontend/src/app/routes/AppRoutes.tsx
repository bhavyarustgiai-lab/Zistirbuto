import { Navigate, Route, Routes } from "react-router-dom";
import { useAppState } from "@app/providers/AppStateProvider";
import { EntityOnboardingPage } from "@pages/EntityOnboardingPage";
import { InviteAcceptPage } from "@pages/InviteAcceptPage";
import { ServicesPage } from "@pages/ServicesPage";
import { StaffPage } from "@pages/StaffPage";
import { StockPage } from "@pages/StockPage";
import { TodayPage } from "@pages/TodayPage";
import { UsersPage } from "@pages/UsersPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route index element={<Navigate to="appointments" replace />} />
      <Route path="appointments" element={<TodayPage />} />
      <Route path="today" element={<Navigate to="../appointments" replace />} />
      <Route path="staff" element={<StaffPage />} />
      <Route path="services" element={<ServicesPage />} />
      <Route path="stock" element={<StockPage />} />
      <Route path="users" element={<UsersRouteGuard />} />
      <Route path="invite/:token" element={<InviteAcceptPage />} />
      <Route path="entities/onboard" element={<EntityOnboardingPage />} />
      <Route path="*" element={<Navigate to="appointments" replace />} />
    </Routes>
  );
}

function UsersRouteGuard() {
  const { currentEntityRole } = useAppState();

  if (currentEntityRole === "STAFF") {
    return <Navigate to="/clients/appointments" replace />;
  }

  return <UsersPage />;
}
