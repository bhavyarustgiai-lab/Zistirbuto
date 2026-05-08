import { useEffect, useState } from "react";
import type { PartnerClientOutlet } from "@shared/types/domain";
import { Button } from "@components/ui/button";
import { Drawer } from "@components/ui/drawer";
import { Input } from "@components/ui/input";
import { Select } from "@components/ui/select";
import { Textarea } from "@components/ui/textarea";
import { PartnerFieldLabel } from "@features/partners/PartnerFieldLabel";
import { ClientContactFields, type ClientContactFormValue } from "@features/partners/ClientContactFields";
import { validateContacts, type ContactFieldError } from "@features/partners/contactValidation";
import { StatusDialog } from "@shared/ui/molecules/status-dialog";

type Props = {
  open: boolean;
  outlet: PartnerClientOutlet | null;
  onClose: () => void;
  onSubmit: (input: {
    outletName: string;
    address?: string;
    contacts: ClientContactFormValue[];
    status: "ACTIVE" | "INACTIVE";
  }) => Promise<void>;
};

export function EditClientOutletDialog({ open, outlet, onClose, onSubmit }: Props) {
  const [form, setForm] = useState({
    outletName: "",
    address: "",
    contacts: [{ name: "", phone: "" }],
    status: "ACTIVE" as "ACTIVE" | "INACTIVE",
  });
  const [saving, setSaving] = useState(false);
  const [statusDialog, setStatusDialog] = useState<{ tone: "success" | "error"; title: string; description?: string } | null>(null);
  const [outletNameError, setOutletNameError] = useState("");
  const [contactError, setContactError] = useState("");
  const [contactFieldErrors, setContactFieldErrors] = useState<ContactFieldError[]>([]);

  useEffect(() => {
    if (!open || !outlet) {
      setSaving(false);
      setOutletNameError("");
      setContactError("");
      setContactFieldErrors([]);
      return;
    }
    setForm({
      outletName: outlet.outletName,
      address: outlet.address || "",
      contacts:
        (outlet.contacts ?? []).length > 0
          ? (outlet.contacts ?? []).map((contact) => ({ name: contact.name, phone: contact.phone }))
          : [{ name: "", phone: "" }],
      status: outlet.status,
    });
    setSaving(false);
    setOutletNameError("");
    setContactError("");
    setContactFieldErrors([]);
  }, [open, outlet]);

  return (
    <>
    <Drawer
      open={open}
      onClose={onClose}
      title="Edit outlet"
      className="md:w-[42vw]"
      bodyClassName="h-full px-0 py-0"
    >
      <div className="flex h-[calc(100vh-88px)] flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          <section className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-slate-900">Outlet Details</h3>
              <p className="text-sm text-slate-500">Update this outlet's delivery, contact, and operational status information.</p>
            </div>

            <div className="grid gap-3">
              <div>
                <PartnerFieldLabel>Outlet name</PartnerFieldLabel>
                <Input
                  value={form.outletName}
                  onChange={(event) => {
                    setForm((prev) => ({ ...prev, outletName: event.target.value }));
                    setOutletNameError("");
                  }}
                  className={outletNameError ? "border-rose-300 ring-2 ring-rose-100" : ""}
                />
                {outletNameError ? <p className="mt-1 text-xs text-rose-600">{outletNameError}</p> : null}
              </div>
              <div>
                <PartnerFieldLabel required={false}>Address</PartnerFieldLabel>
                <Textarea value={form.address} onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))} className="min-h-[96px]" />
              </div>
              <div>
                <PartnerFieldLabel>Status</PartnerFieldLabel>
                <Select
                  value={form.status}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, status: value as typeof form.status }))}
                  options={[
                    { value: "ACTIVE", label: "Active" },
                    { value: "INACTIVE", label: "Inactive" },
                  ]}
                />
              </div>
            </div>
          </section>

          <ClientContactFields
            contacts={form.contacts}
            onChange={(contacts) => {
              setForm((prev) => ({ ...prev, contacts }));
              setContactError("");
              setContactFieldErrors([]);
            }}
            title="Outlet contacts"
            error={contactError}
            fieldErrors={contactFieldErrors}
            requireIfPresent
            onAddBlocked={() => setContactError("Complete the current contact name and phone number before adding another contact.")}
          />
        </div>

        <div className="border-t border-slate-200 bg-white px-4 py-3">
          <div className="flex justify-end gap-2">
            <Button variant="ghost" className="h-10 px-3 text-sm" onClick={onClose}>Cancel</Button>
          <Button
            className="h-10 px-3 text-sm"
            disabled={saving}
            onClick={async () => {
              setOutletNameError("");
              setContactError("");
              setContactFieldErrors([]);
              if (!form.outletName.trim()) {
                setOutletNameError("Outlet name is required.");
                return;
              }
              const contactValidation = validateContacts(form.contacts, { requireAtLeastOne: true });
              if (contactValidation.sectionError || contactValidation.fieldErrors.some((item) => item.name || item.phone)) {
                setContactError(contactValidation.sectionError);
                setContactFieldErrors(contactValidation.fieldErrors);
                return;
              }
              setSaving(true);
              try {
                await onSubmit({
                  outletName: form.outletName.trim(),
                  address: form.address.trim() || undefined,
                  contacts: contactValidation.validContacts,
                  status: form.status,
                });
                onClose();
                setStatusDialog({ tone: "success", title: "Outlet updated successfully" });
              } catch (err) {
                setStatusDialog({
                  tone: "error",
                  title: "Outlet update failed",
                  description: err instanceof Error ? err.message : "Failed to update outlet",
                });
              } finally {
                setSaving(false);
              }
            }}
          >
            Save Changes
          </Button>
          </div>
        </div>
      </div>
    </Drawer>
    <StatusDialog
      open={Boolean(statusDialog)}
      tone={statusDialog?.tone ?? "success"}
      title={statusDialog?.title ?? ""}
      description={statusDialog?.description}
      onClose={() => setStatusDialog(null)}
    />
    </>
  );
}
