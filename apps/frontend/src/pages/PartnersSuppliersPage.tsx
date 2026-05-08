import { useMemo, useState } from "react";
import { PencilLine, Plus, Search, Trash2 } from "lucide-react";
import { useAppState } from "@app/providers/AppStateProvider";
import { usePartnerSuppliers } from "@entities/partners/hooks";
import type { PartnerSupplierStatus } from "@shared/types/domain";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { EmptyState } from "@shared/ui/molecules/EmptyState";
import { ConfirmArchiveDialog } from "@features/partners/ConfirmArchiveDialog";
import { SupplierFormDialog } from "@features/partners/SupplierFormDialog";
import {
  PartnersPageFilters,
  PartnersPageHeader,
  PartnersPageShell,
  PartnersTableCard,
} from "@features/partners/layout/PartnersPageLayout";

function tone(status: PartnerSupplierStatus) {
  if (status === "ACTIVE") return "active";
  return "inactive";
}

export function PartnersSuppliersPage() {
  const { activePartnerFirmId } = useAppState();
  const [search, setSearch] = useState("");
  const [editingSupplierId, setEditingSupplierId] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [archiveSupplierId, setArchiveSupplierId] = useState("");
  const suppliers = usePartnerSuppliers(activePartnerFirmId, search);
  const editingSupplier = useMemo(
    () => suppliers.items.find((supplier) => supplier.id === editingSupplierId) ?? null,
    [editingSupplierId, suppliers.items],
  );
  const archiveSupplier = useMemo(
    () => suppliers.items.find((supplier) => supplier.id === archiveSupplierId) ?? null,
    [archiveSupplierId, suppliers.items],
  );

  if (!activePartnerFirmId) {
    return <EmptyState>Select a firm to view suppliers.</EmptyState>;
  }

  return (
    <PartnersPageShell>
      <PartnersPageHeader
        title="Suppliers"
        description="Manage upstream vendors and GSTIN-safe supplier records per firm."
        actions={
          <Button className="h-11 w-full px-4 text-sm sm:w-auto" onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Create Supplier
          </Button>
        }
      />

      <PartnersPageFilters>
        <div className="relative w-full lg:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="Search supplier or phone" />
        </div>
      </PartnersPageFilters>

      <PartnersTableCard>
        {suppliers.items.length === 0 ? (
          <div className="p-8">
            <EmptyState>No suppliers yet for this firm.</EmptyState>
          </div>
        ) : (
          <div>
            <div className="grid gap-3 p-3 md:hidden">
              {suppliers.items.map((supplier) => (
                <div key={supplier.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900">{supplier.supplierName}</p>
                      <p className="mt-1 text-sm text-slate-600">{supplier.phone || "-"}</p>
                      <p className="text-xs text-slate-500">{supplier.gstin || "GSTIN not set"}</p>
                    </div>
                    <Badge tone={tone(supplier.status)}>{supplier.status}</Badge>
                  </div>

                  <div className="mt-4 grid gap-3">
                    <p className="text-sm text-slate-700">{supplier.address || "-"}</p>
                    <p className="text-xs text-slate-500">Updated {supplier.updatedAt || "-"}</p>
                  </div>

                  <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <Button variant="ghost" className="h-9 justify-start px-2 text-sm sm:w-auto" onClick={() => setEditingSupplierId(supplier.id)}>
                      <PencilLine className="mr-1 h-4 w-4" />
                      Edit
                    </Button>
                    {supplier.status === "INACTIVE" ? (
                      <Button
                        variant="ghost"
                        className="h-9 justify-start px-2 text-sm text-emerald-700 hover:bg-emerald-50 hover:text-emerald-700 sm:w-auto"
                        onClick={() =>
                          void suppliers.update(supplier.id, {
                            supplierName: supplier.supplierName,
                            gstin: supplier.gstin,
                            phone: supplier.phone,
                            address: supplier.address,
                            status: "ACTIVE",
                          })
                        }
                      >
                        Activate
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        className="h-9 justify-start px-2 text-sm text-amber-700 hover:bg-amber-50 hover:text-amber-700 sm:w-auto"
                        onClick={() => setArchiveSupplierId(supplier.id)}
                      >
                        <Trash2 className="mr-1 h-4 w-4" />
                        Deactivate
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[1040px] text-sm">
              <thead className="text-left text-slate-500">
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="px-5 py-3">Supplier</th>
                  <th className="px-4 py-3">GSTIN</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Address</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Updated</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.items.map((supplier) => (
                  <tr key={supplier.id} className="border-b border-slate-100 text-slate-800 last:border-b-0">
                    <td className="px-5 py-4 font-medium text-slate-900">{supplier.supplierName}</td>
                    <td className="px-4 py-4">{supplier.gstin || "-"}</td>
                    <td className="px-4 py-4">{supplier.phone || "-"}</td>
                    <td className="px-4 py-4">{supplier.address || "-"}</td>
                    <td className="px-4 py-4">
                      <Badge tone={tone(supplier.status)}>{supplier.status}</Badge>
                    </td>
                    <td className="px-4 py-4">{supplier.updatedAt || "-"}</td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" className="h-9 px-2 text-sm" onClick={() => setEditingSupplierId(supplier.id)}>
                          <PencilLine className="mr-1 h-4 w-4" />
                          Edit
                        </Button>
                        {supplier.status === "INACTIVE" ? (
                          <Button
                            variant="ghost"
                            className="h-9 px-2 text-sm text-emerald-700 hover:bg-emerald-50 hover:text-emerald-700"
                            onClick={() =>
                              void suppliers.update(supplier.id, {
                                supplierName: supplier.supplierName,
                                gstin: supplier.gstin,
                                phone: supplier.phone,
                                address: supplier.address,
                                status: "ACTIVE",
                              })
                            }
                          >
                            Activate
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            className="h-9 px-2 text-sm text-amber-700 hover:bg-amber-50 hover:text-amber-700"
                            onClick={() => setArchiveSupplierId(supplier.id)}
                          >
                            <Trash2 className="mr-1 h-4 w-4" />
                            Deactivate
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
        )}
      </PartnersTableCard>

      <SupplierFormDialog
        open={showCreateDialog}
        supplier={null}
        onClose={() => setShowCreateDialog(false)}
        onValidateGSTIN={(gstin) => suppliers.validateGSTIN(gstin)}
        onSubmit={suppliers.create}
      />

      <SupplierFormDialog
        open={Boolean(editingSupplier)}
        supplier={editingSupplier}
        onClose={() => setEditingSupplierId("")}
        onValidateGSTIN={(gstin, excludeSupplierId) => suppliers.validateGSTIN(gstin, excludeSupplierId)}
        onSubmit={async (input) => {
          if (!editingSupplier) return;
          await suppliers.update(editingSupplier.id, {
            supplierName: input.supplierName,
            gstin: input.gstin,
            phone: input.phone,
            address: input.address,
            status: input.status || editingSupplier.status,
          });
        }}
      />

      <ConfirmArchiveDialog
        open={Boolean(archiveSupplier)}
        title="Deactivate supplier"
        message={`Deactivate ${archiveSupplier?.supplierName}? Historical purchases remain available, but this supplier will disappear from new purchase selectors.`}
        confirmLabel="Deactivate Supplier"
        onClose={() => setArchiveSupplierId("")}
        onConfirm={async () => {
          if (!archiveSupplier) return;
          await suppliers.archive(archiveSupplier.id);
        }}
      />
    </PartnersPageShell>
  );
}
