import { Fragment, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, PencilLine, Plus, Search } from "lucide-react";
import { useAppState } from "@app/providers/AppStateProvider";
import { usePartnerClientBusinesses } from "@entities/partners/hooks";
import type { PartnerClientBusiness, PartnerClientOutlet } from "@shared/types/domain";
import { Button } from "@components/ui/button";
import { Collapsible } from "@components/ui/collapsible";
import { Input } from "@components/ui/input";
import { EmptyState } from "@shared/ui/molecules/EmptyState";
import { AddClientOutletDialog } from "@features/partners/AddClientOutletDialog";
import { PartnerStatusBadge } from "@features/partners/PartnerStatusBadge";
import { CreateClientBusinessDialog } from "@features/partners/CreateClientBusinessDialog";
import { EditClientBusinessDialog } from "@features/partners/EditClientBusinessDialog";
import { EditClientOutletDialog } from "@features/partners/EditClientOutletDialog";
import { ExportCsvButton } from "@features/partners/ExportCsvButton";
import {
  PartnersPageFilters,
  PartnersPageHeader,
  PartnersPageShell,
  PartnersTableCard,
} from "@features/partners/layout/PartnersPageLayout";

function getBusinessSecondaryLine(business: PartnerClientBusiness) {
  return business.billingAddress?.trim() || "";
}

function getOutletSecondaryLine(outlet: PartnerClientOutlet) {
  return outlet.address || "-";
}

function getPrimaryBusinessContact(business: PartnerClientBusiness) {
  const contacts = Array.isArray(business.contacts) ? business.contacts : [];
  return contacts.find((contact) => contact.isPrimary) ?? contacts[0] ?? null;
}

function getOutletContacts(outlet: PartnerClientOutlet) {
  if (Array.isArray(outlet.contacts) && outlet.contacts.length > 0) {
    return outlet.contacts;
  }
  return [];
}

function formatContactLines(contacts: Array<{ name: string; phone: string }>) {
  return contacts
    .filter((contact) => contact.name?.trim() || contact.phone?.trim())
    .map((contact) => ({
      name: contact.name?.trim() || "-",
      phone: contact.phone?.trim() || "-",
    }));
}

export function PartnersClientsPage() {
  const { activePartnerFirmId } = useAppState();
  const [search, setSearch] = useState("");
  const [expandedBusinessIds, setExpandedBusinessIds] = useState<Record<string, boolean>>({});
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [addingOutletForId, setAddingOutletForId] = useState("");
  const [editingBusinessId, setEditingBusinessId] = useState("");
  const [editingOutlet, setEditingOutlet] = useState<{ businessId: string; outletId: string } | null>(null);
  const businesses = usePartnerClientBusinesses(activePartnerFirmId, search);
  const editingBusiness = useMemo(
    () => businesses.items.find((business) => business.id === editingBusinessId) ?? null,
    [businesses.items, editingBusinessId],
  );
  const editingOutletRecord = useMemo(() => {
    if (!editingOutlet) {
      return null;
    }
    const business = businesses.items.find((item) => item.id === editingOutlet.businessId);
    const outlet = business?.outlets.find((item) => item.id === editingOutlet.outletId) ?? null;
    return outlet ? { business, outlet } : null;
  }, [businesses.items, editingOutlet]);

  if (!activePartnerFirmId) {
    return <EmptyState>Select a firm to view clients.</EmptyState>;
  }

  return (
    <PartnersPageShell>
      <PartnersPageHeader
        title="Clients"
        description="Manage outlet groups as one business with one or more delivery outlets."
        actions={
          <>
            <ExportCsvButton
              filename="clients.csv"
              headers={["Business", "GSTIN", "Primary Contact Phone", "Outlet Count"]}
              rows={businesses.items.map((business) => [business.businessName, business.gstin, getPrimaryBusinessContact(business)?.phone ?? "", business.outletCount])}
            />
            <Button className="h-11 w-full px-4 text-sm sm:w-auto" onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-1 h-4 w-4" />
              Create Client
            </Button>
          </>
        }
      />

      <PartnersPageFilters>
        <div className="relative w-full lg:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
          <Input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
            placeholder="Search business, outlet, or phone"
            name="partners-clients-search"
            autoComplete="new-password"
            spellCheck={false}
          />
        </div>
      </PartnersPageFilters>

      <PartnersTableCard>
        {businesses.items.length === 0 ? (
          <div className="p-8">
            <EmptyState>No clients found for this firm.</EmptyState>
          </div>
        ) : (
          <div>
            <div className="grid gap-3 p-3 md:hidden">
              {businesses.items.map((business) => {
                const isExpanded = Boolean(expandedBusinessIds[business.id]);

                return (
                  <div key={business.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <button
                      type="button"
                      className="flex w-full items-start justify-between gap-3 text-left"
                      onClick={() =>
                        setExpandedBusinessIds((prev) => ({ ...prev, [business.id]: !prev[business.id] }))
                      }
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900">{business.businessName}</p>
                        <p className="mt-1 text-xs text-slate-500">{getBusinessSecondaryLine(business)}</p>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                      ) : (
                        <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                      )}
                    </button>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-500">Business</p>
                        <p className="mt-1 text-sm text-slate-800">{business.businessName}</p>
                        {business.gstin ? <p className="mt-1 text-xs text-slate-500">GSTIN: {business.gstin}</p> : null}
                        {getBusinessSecondaryLine(business) ? <p className="mt-1 text-xs text-slate-500">{getBusinessSecondaryLine(business)}</p> : null}
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-500">Contacts</p>
                        {formatContactLines(business.contacts).length === 0 ? (
                          <p className="mt-1 text-sm text-slate-800">-</p>
                        ) : (
                          <div className="mt-1 space-y-1">
                            {formatContactLines(business.contacts).map((contact, index) => (
                              <p key={`${contact.name}-${contact.phone}-${index}`} className="text-sm text-slate-800">
                                {contact.name} {contact.phone}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-500">Status</p>
                        <div className="mt-1 text-sm text-slate-400">-</div>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-500">Actions</p>
                        <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                          <Button variant="ghost" className="h-9 justify-start px-2 text-sm sm:w-auto" onClick={() => setEditingBusinessId(business.id)}>
                            <PencilLine className="mr-1 h-4 w-4" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            className="h-9 justify-start px-2 text-sm sm:w-auto"
                            onClick={() => {
                              setExpandedBusinessIds((prev) => ({ ...prev, [business.id]: true }));
                              setAddingOutletForId(business.id);
                            }}
                          >
                            <Plus className="mr-1 h-4 w-4" />
                            Add outlets
                          </Button>
                        </div>
                      </div>
                      <div className="sm:col-span-2">
                        <p className="text-xs uppercase tracking-wide text-slate-500">Outlets</p>
                        <p className="mt-1 text-sm text-slate-800">{business.outletCount}</p>
                      </div>
                    </div>

                    <Collapsible open={isExpanded}>
                      <div className="mt-4 space-y-3 border-t border-slate-200 pt-4">
                        {business.outlets.length === 0 ? (
                          <p className="text-sm text-slate-500">No outlets added yet.</p>
                        ) : (
                          business.outlets.map((outlet) => (
                            <div key={outlet.id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                              <div className="grid gap-3 sm:grid-cols-2">
                                <div className="min-w-0">
                                  <p className="text-xs uppercase tracking-wide text-slate-500">Business</p>
                                  <p className="mt-1 font-medium text-slate-900">{outlet.outletName}</p>
                                  <p className="mt-1 text-xs text-slate-500">{getOutletSecondaryLine(outlet)}</p>
                                </div>
                                <div>
                                  <p className="text-xs uppercase tracking-wide text-slate-500">Contacts</p>
                                  {formatContactLines(getOutletContacts(outlet)).length === 0 ? (
                                    <p className="mt-1 text-sm text-slate-800">-</p>
                                  ) : (
                                    <div className="mt-1 space-y-1">
                                      {formatContactLines(getOutletContacts(outlet)).map((contact, index) => (
                                        <p key={`${contact.name}-${contact.phone}-${index}`} className="text-sm text-slate-800">
                                          {contact.name} {contact.phone}
                                        </p>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <p className="text-xs uppercase tracking-wide text-slate-500">Status</p>
                                  <div className="mt-1">
                                    <PartnerStatusBadge status={outlet.status} />
                                  </div>
                                </div>
                                <div>
                                  <p className="text-xs uppercase tracking-wide text-slate-500">Actions</p>
                                  <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                                    <Button
                                      variant="ghost"
                                      className="h-9 justify-start px-2 text-sm sm:w-auto"
                                      onClick={() => setEditingOutlet({ businessId: business.id, outletId: outlet.id })}
                                    >
                                      <PencilLine className="mr-1 h-4 w-4" />
                                      Edit
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </Collapsible>
                  </div>
                );
              })}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[1140px] text-sm">
                <thead className="text-left text-slate-500">
                  <tr className="border-b border-slate-200 bg-slate-50/80">
                    <th className="px-4 py-3">Business</th>
                    <th className="px-4 py-3">Contacts</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {businesses.items.map((business) => {
                    const isExpanded = Boolean(expandedBusinessIds[business.id]);

                    return (
                      <Fragment key={business.id}>
                        <tr className="border-b border-slate-100 text-slate-800">
                          <td className="px-4 py-3.5 align-top">
                            <button
                              type="button"
                              className="flex items-start gap-2 text-left"
                              onClick={() =>
                                setExpandedBusinessIds((prev) => ({ ...prev, [business.id]: !prev[business.id] }))
                              }
                            >
                              {isExpanded ? (
                                <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                              ) : (
                                <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                              )}
                              <span className="min-w-0">
                                <span className="block font-medium text-slate-900">{business.businessName}</span>
                                {getBusinessSecondaryLine(business) ? (
                                  <span className="mt-0.5 block text-xs text-slate-500">{getBusinessSecondaryLine(business)}</span>
                                ) : null}
                                {business.gstin ? <span className="mt-0.5 block text-xs text-slate-500">GSTIN: {business.gstin}</span> : null}
                              </span>
                            </button>
                          </td>
                          <td className="px-4 py-3.5 align-top">
                            {formatContactLines(business.contacts).length === 0 ? (
                              <div>-</div>
                            ) : (
                              <div className="space-y-1">
                                {formatContactLines(business.contacts).map((contact, index) => (
                                  <div key={`${contact.name}-${contact.phone}-${index}`} className="leading-5">
                                    {contact.name} {contact.phone}
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3.5 align-top">
                          <span className="text-slate-400">-</span>
                          </td>
                          <td className="px-4 py-3.5 align-top">
                            <div className="flex flex-wrap gap-1">
                              <Button variant="ghost" className="h-8 px-2 text-sm" onClick={() => setEditingBusinessId(business.id)}>
                                <PencilLine className="mr-1 h-4 w-4" />
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                className="h-8 px-2 text-sm"
                                onClick={() => {
                                  setExpandedBusinessIds((prev) => ({ ...prev, [business.id]: true }));
                                  setAddingOutletForId(business.id);
                                }}
                              >
                                <Plus className="mr-1 h-4 w-4" />
                                Add outlets
                              </Button>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && business.outlets.length === 0 ? (
                          <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500">
                            <td className="px-4 py-3.5 pl-12" colSpan={4}>
                              No outlets added yet.
                            </td>
                          </tr>
                        ) : null}
                        {isExpanded
                          ? business.outlets.map((outlet) => (
                              <tr key={outlet.id} className="border-b border-slate-100 bg-slate-50/50 text-slate-800">
                                <td className="px-4 py-3.5 align-top">
                                  <div className="pl-11">
                                    <div className="min-w-0">
                                      <div className="font-medium text-slate-900">{outlet.outletName}</div>
                                      <div className="mt-0.5 text-xs text-slate-500">{getOutletSecondaryLine(outlet)}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3.5 align-top">
                                  {formatContactLines(getOutletContacts(outlet)).length === 0 ? (
                                    <div>-</div>
                                  ) : (
                                    <div className="space-y-1">
                                      {formatContactLines(getOutletContacts(outlet)).map((contact, index) => (
                                        <div key={`${contact.name}-${contact.phone}-${index}`} className="leading-5">
                                          {contact.name} {contact.phone}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </td>
                                <td className="px-4 py-3.5 align-top">
                                  <PartnerStatusBadge status={outlet.status} />
                                </td>
                                <td className="px-4 py-3.5 align-top">
                                  <div className="flex flex-wrap gap-1">
                                    <Button
                                      variant="ghost"
                                      className="h-8 px-2 text-sm"
                                      onClick={() => setEditingOutlet({ businessId: business.id, outletId: outlet.id })}
                                    >
                                      <PencilLine className="mr-1 h-4 w-4" />
                                      Edit
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          : null}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </PartnersTableCard>

      <CreateClientBusinessDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSubmit={businesses.createBusiness}
        onValidateGSTIN={(gstin) => businesses.validateGSTIN(gstin)}
        onAddOutletUnderExisting={(businessId) => {
          setExpandedBusinessIds((prev) => ({ ...prev, [businessId]: true }));
          setAddingOutletForId(businessId);
        }}
      />

      <AddClientOutletDialog
        open={Boolean(addingOutletForId)}
        onClose={() => setAddingOutletForId("")}
        onSubmit={async (input) => {
          if (!addingOutletForId) {
            return;
          }
          await businesses.addOutlet(addingOutletForId, input);
        }}
      />

      <EditClientBusinessDialog
        open={Boolean(editingBusiness)}
        business={editingBusiness}
        onClose={() => setEditingBusinessId("")}
        onValidateGSTIN={(gstin, excludeBusinessId) => businesses.validateGSTIN(gstin, excludeBusinessId)}
        onSubmit={async (input) => {
          if (!editingBusiness) {
            return;
          }
          await businesses.updateBusiness(editingBusiness.id, input);
        }}
      />

      <EditClientOutletDialog
        open={Boolean(editingOutletRecord)}
        outlet={editingOutletRecord?.outlet ?? null}
        onClose={() => setEditingOutlet(null)}
        onSubmit={async (input) => {
          if (!editingOutletRecord?.business || !editingOutletRecord.outlet) {
            return;
          }
          await businesses.updateOutlet(editingOutletRecord.business.id, editingOutletRecord.outlet.id, input);
        }}
      />
    </PartnersPageShell>
  );
}
