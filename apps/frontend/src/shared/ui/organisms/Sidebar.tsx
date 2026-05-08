import { Archive, CalendarDays, CalendarHeart, LogOut, Scissors, ShieldCheck, Users } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { Select } from "@components/ui/select";
import { Button } from "@components/ui/button";
import { useAppState } from "@app/providers/AppStateProvider";

export function Sidebar() {
  const navigate = useNavigate();
  const { clients, currentClientId, currentEntityRole, currentUser, setCurrentClientId, logout } = useAppState();
  const current = clients.find((client) => client.id === currentClientId);

  const links = [
    { to: "/clients/appointments", label: "Today", icon: CalendarDays },
    { to: "/clients/staff", label: "Staff", icon: Users },
    { to: "/clients/services", label: "Services", icon: Scissors },
    { to: "/clients/stock", label: "Stock", icon: Archive },
    ...(currentEntityRole === "STAFF"
      ? []
      : [{ to: "/clients/users", label: "Users", icon: ShieldCheck }]),
  ];

  return (
    <aside className="sticky top-0 flex h-screen flex-col overflow-hidden border-r border-slate-200 bg-slate-50">
      <div className="border-b border-slate-200 p-5">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-brand-500 p-2 text-white">
            <CalendarHeart className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">Zistributo</h1>
        </div>
      </div>

      <div className="border-b border-slate-200 p-4">
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-sm font-medium text-slate-900">{current?.name ?? "Select client"}</p>
          <p className="text-sm text-slate-500">{current?.clientType ?? "-"}</p>
          <div className="mt-2">
            <Select
              value={currentClientId}
              onValueChange={(value) => {
                if (value === "__add_entity__") {
                  navigate("/clients/entities/onboard");
                  return;
                }
                setCurrentClientId(value);
              }}
              options={[
                ...clients.map((client) => ({ value: client.id, label: client.name })),
                { value: "__add_entity__", label: "+ Add entity" },
              ]}
            />
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `mb-1 flex items-center gap-2 rounded-xl px-3 py-2 text-lg ${
                isActive ? "bg-indigo-50 text-brand-500" : "text-slate-700 hover:bg-slate-100"
              }`
            }
          >
            <link.icon className="h-5 w-5" />
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="shrink-0 border-t border-slate-200 p-3">
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="truncate text-sm font-medium text-slate-900">
            {currentUser?.name ?? "User"}
          </p>
          <p className="truncate text-xs text-slate-500">{currentUser?.phone ?? ""}</p>
          <div className="mt-2 flex items-center justify-between">
            <div className="text-xs text-slate-400">Zistributo v1.0</div>
            <Button
              variant="ghost"
              className="h-7 rounded-lg px-2 text-xs text-slate-600"
              onClick={async () => {
                await logout();
                navigate("/login", { replace: true });
              }}
            >
              <LogOut className="mr-1 h-3.5 w-3.5" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}
