import type { PropsWithChildren, Ref } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Building2, Menu, LogOut, Plus } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppState } from "@app/providers/AppStateProvider";
import { Button } from "@components/ui/button";
import { Select } from "@components/ui/select";
import { Sheet } from "@components/ui/sheet";
import { partnerSidebarSections } from "@features/partners/sidebar/config";
import { cn } from "@shared/lib/cn";
import { Sidebar, SidebarBody } from "@shared/ui/sidebar/Sidebar";
import { SidebarGroup } from "@shared/ui/sidebar/SidebarGroup";
import { SidebarHeader } from "@shared/ui/sidebar/SidebarHeader";

const SIDEBAR_COLLAPSED_STORAGE_KEY = "zistributo:partners-sidebar-collapsed";

function readStoredCollapsed() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === "true";
}

export function PartnersLayout({ children }: PropsWithChildren) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(readStoredCollapsed);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const mobileAccountMenuRef = useRef<HTMLDivElement>(null);
  const desktopAccountMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const {
    currentUser,
    partnerFirms,
    activePartnerFirmId,
    setActivePartnerFirmId,
    logout,
  } = useAppState();

  const hasFirms = partnerFirms.length > 0;
  const onboardingMode =
    location.pathname === "/partners/onboarding/firm" && !hasFirms;

  useEffect(() => {
    window.localStorage.setItem(
      SIDEBAR_COLLAPSED_STORAGE_KEY,
      String(sidebarCollapsed),
    );
  }, [sidebarCollapsed]);

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        !mobileAccountMenuRef.current?.contains(target) &&
        !desktopAccountMenuRef.current?.contains(target)
      ) {
        setAccountMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", closeOnOutsideClick);
    return () => window.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  const userInitial = useMemo(() => {
    const name = currentUser?.name.trim();
    return name ? name.charAt(0).toUpperCase() : "?";
  }, [currentUser?.name]);

  const navigateFromSidebar = (to: string, closeSheet = false) => {
    navigate(to);
    if (closeSheet) setSidebarOpen(false);
  };

  const handleLogout = async () => {
    setAccountMenuOpen(false);
    await logout();
    navigate("/login", { replace: true });
  };

  const renderAccountMenu = ({
    ref,
  }: {
    ref: Ref<HTMLDivElement>;
  }) => (
    <div ref={ref} className="relative">
      <Button
        type="button"
        variant="ghost"
        aria-label="Open profile menu"
        aria-expanded={accountMenuOpen}
        className="h-10 w-10 rounded-lg border border-slate-200 bg-slate-50 px-2 text-slate-700 hover:bg-slate-100"
        onClick={() => setAccountMenuOpen((current) => !current)}
      >
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-900 text-xs font-semibold text-white">
          {userInitial}
        </span>
      </Button>

      {accountMenuOpen ? (
        <div className="absolute right-0 top-[calc(100%+8px)] z-40 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
          <div className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-900 text-sm font-semibold text-white">
              {userInitial}
            </span>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-semibold text-slate-950">
                {currentUser?.name || "Profile"}
              </p>
              <p className="truncate text-xs text-slate-500">
                {currentUser?.phone ?? "-"}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="mt-2 flex h-10 w-full items-center rounded-lg px-3 text-left text-sm font-medium text-rose-600 hover:bg-rose-50"
            onClick={() => void handleLogout()}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </button>
        </div>
      ) : null}
    </div>
  );

  const renderSidebar = ({
    collapsed,
    inSheet = false,
  }: {
    collapsed: boolean;
    inSheet?: boolean;
  }) => (
    <Sidebar collapsed={collapsed} inSheet={inSheet}>
      <SidebarHeader
        collapsed={collapsed}
        showCollapseToggle={!inSheet}
        onToggleCollapsed={() => setSidebarCollapsed((current) => !current)}
      />

      {hasFirms ? (
        <SidebarBody>
          <nav
            aria-label="Partner navigation"
            className={cn(
              "grid gap-7",
              collapsed && "justify-items-center gap-3",
            )}
          >
            {partnerSidebarSections.map((section) => (
              <div
                key={section.label}
                className={cn(
                  "w-full",
                  collapsed && "grid justify-items-center",
                )}
              >
                <SidebarGroup
                  label={section.label}
                  items={section.items}
                  collapsed={collapsed}
                  pathname={location.pathname}
                  onNavigate={(to) => navigateFromSidebar(to, inSheet)}
                />
              </div>
            ))}
          </nav>
        </SidebarBody>
      ) : (
        <div className={cn("grid gap-3 p-4", collapsed && "px-3")}>
          <div
            className={cn(
              "rounded-lg border border-dashed border-slate-300 bg-muted/30 p-4",
              collapsed && "p-2 text-center",
            )}
          >
            <p className="text-sm font-medium text-slate-900">
              {collapsed ? "No firms" : "No firms yet"}
            </p>
            {!collapsed ? (
              <p className="mt-1 text-sm text-slate-500">
                Create your distributor firm to unlock brands, catalog, orders,
                and billing workflows.
              </p>
            ) : null}
          </div>
        </div>
      )}
    </Sidebar>
  );

  return (
    <div
      className={cn(
        "grid h-screen grid-cols-1 grid-rows-[auto_minmax(0,1fr)] overflow-hidden bg-[#f4f5f8] lg:grid-rows-[5rem_minmax(0,1fr)]",
        sidebarCollapsed
          ? "lg:grid-cols-[5rem_minmax(0,1fr)]"
          : "lg:grid-cols-[18rem_minmax(0,1fr)]",
      )}
    >
      <aside className="hidden min-h-0 lg:col-start-1 lg:row-start-2 lg:block">
        {renderSidebar({ collapsed: sidebarCollapsed })}
      </aside>

      <Sheet
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        title="Navigation"
        className="sm:max-w-[22rem]"
      >
        {renderSidebar({ collapsed: false, inSheet: true })}
      </Sheet>

      <header className="row-start-1 flex min-h-20 min-w-0 items-center border-b border-slate-200 bg-white px-3 py-2 md:px-6 lg:col-span-2 lg:col-start-1 lg:row-start-1">
        <div className="grid w-full min-w-0 gap-2 md:flex md:items-center md:justify-between md:gap-3">
          <div className="flex min-w-0 items-center justify-between gap-2 md:flex-1 md:justify-start md:gap-3">
            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="outline"
                aria-label="Open navigation"
                className="h-10 rounded-lg px-3 lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="h-12 min-w-0 rounded-xl !px-2.5 text-left hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-[inset_0_0_0_2px_rgba(79,70,229,0.22)]"
                onClick={() => navigateFromSidebar("/partners")}
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-500/10 text-brand-600 ring-1 ring-brand-500/15">
                  <Building2 className="h-5 w-5" />
                </span>
                <span className="ml-3 min-w-0 leading-tight">
                  <span className="block truncate text-sm font-semibold text-slate-950">
                    Zistributo
                  </span>
                  <span className="hidden truncate text-xs font-medium text-muted-foreground sm:block">
                    Partners Workspace
                  </span>
                </span>
              </Button>
            </div>

            <div className="flex shrink-0 items-center gap-1.5 md:hidden">
              {renderAccountMenu({ ref: mobileAccountMenuRef })}
            </div>
          </div>

          <div className="grid min-w-0 gap-2 md:flex md:flex-1 md:items-center md:justify-between md:gap-3">
            {hasFirms ? (
              <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 md:flex md:flex-1">
                <div className="min-w-0 md:min-w-[12rem] md:max-w-[16.25rem] md:flex-1 xl:max-w-[20rem]">
                  <Select
                    value={
                      activePartnerFirmId ? String(activePartnerFirmId) : ""
                    }
                    options={partnerFirms.map((firm) => ({
                      value: String(firm.id),
                      label: firm.name,
                    }))}
                    onValueChange={(id) => setActivePartnerFirmId(Number(id))}
                  />
                </div>
                <div className="flex shrink-0 items-center">
                  <Button
                    variant="outline"
                    aria-label="Create firm"
                    className="h-10 whitespace-nowrap rounded-lg px-3 text-sm"
                    onClick={() => navigate("/partners/onboarding/firm")}
                  >
                    <Plus className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">New firm</span>
                  </Button>
                </div>
              </div>
            ) : null}

            <div className="hidden shrink-0 items-center md:flex">
              {renderAccountMenu({ ref: desktopAccountMenuRef })}
            </div>
          </div>
        </div>
      </header>

      <main className="row-start-2 min-h-0 min-w-0 overflow-y-auto px-4 py-4 md:px-6 md:py-5 lg:col-start-2 lg:row-start-2 xl:px-8 xl:py-6">
        {children}
      </main>
    </div>
  );
}
