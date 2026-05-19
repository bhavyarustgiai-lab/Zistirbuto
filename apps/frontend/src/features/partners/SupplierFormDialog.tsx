import { useEffect, useState } from "react";
import type { PartnerSupplier } from "@shared/types/domain";
import { Button } from "@components/ui/button";
import { Dialog } from "@components/ui/dialog";
import { Input } from "@components/ui/input";
import { Select } from "@components/ui/select";
import { Textarea } from "@components/ui/textarea";
import { PartnerFieldLabel } from "@features/partners/PartnerFieldLabel";
import { getGSTINValidationMessage, isValidGSTIN, normalizeGSTINInput } from "@shared/lib/gstin";
import { getPhoneValidationMessage, isValidPhoneValue, parsePhoneValue } from "@shared/lib/phone";
import { PhoneInput } from "@shared/ui/molecules/PhoneInput";
import { StatusDialog } from "@shared/ui/molecules/status-dialog";

type Props = {
  open: boolean;
  supplier: PartnerSupplier | null;
  onClose: () => void;
  onValidateGSTIN: (gstin: string, excludeSupplierId?: string) => Promise<{ exists: boolean; supplierId?: string; supplierName?: string }>;
  onSubmit: (input: { supplierName: string; gstin?: string; phone?: string; address?: string; status?: "ACTIVE" | "INACTIVE" }) => Promise<void>;
};

export function SupplierFormDialog({ open, supplier, onClose, onValidateGSTIN, onSubmit }: Props) {
  const [form, setForm] = useState({
    supplierName: "",
    gstin: "",
    phone: "",
    address: "",
    status: "ACTIVE" as "ACTIVE" | "INACTIVE",
  });
  const [saving, setSaving] = useState(false);
  const [supplierNameError, setSupplierNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [gstinError, setGSTINError] = useState("");
  const [gstinValidation, setGSTINValidation] = useState<{ exists: boolean; supplierId?: string; supplierName?: string } | null>(null);
  const [statusDialog, setStatusDialog] = useState<{ tone: "success" | "error"; title: string; description?: string } | null>(null);

  useEffect(() => {
    if (!open) {
      setSaving(false);
      setSupplierNameError("");
      setPhoneError("");
      setGSTINError("");
      setGSTINValidation(null);
      return;
    }
    setForm({
      supplierName: supplier?.supplierName || "",
      gstin: supplier?.gstin || "",
      phone: supplier?.phone || "",
      address: supplier?.address || "",
      status: supplier?.status || "ACTIVE",
    });
    setSaving(false);
    setSupplierNameError("");
    setPhoneError("");
    setGSTINError("");
    setGSTINValidation(null);
  }, [open, supplier]);

  return (
    <>
    <Dialog open={open} onClose={onClose} title={supplier ? "Edit Supplier" : "Create Supplier"}>
      <div className="grid gap-3">
        <div className="grid gap-2 md:grid-cols-2">
          <div>
            <PartnerFieldLabel>Business name</PartnerFieldLabel>
            <Input
              value={form.supplierName}
              onChange={(event) => {
                setForm((prev) => ({ ...prev, supplierName: event.target.value }));
                setSupplierNameError("");
              }}
            />
            {supplierNameError ? <p className="pt-1 text-xs text-rose-600">{supplierNameError}</p> : null}
          </div>
          <div>
            <PartnerFieldLabel required={false}>GSTIN</PartnerFieldLabel>
            <Input
              value={form.gstin}
              maxLength={15}
              placeholder="15-character GSTIN"
              onChange={(event) => {
                const value = normalizeGSTINInput(event.target.value);
                setForm((prev) => ({ ...prev, gstin: value }));
                setGSTINError("");
                const trimmed = value.trim();
                if (!trimmed) {
                  setGSTINValidation(null);
                  return;
                }
                if (!isValidGSTIN(trimmed)) {
                  setGSTINValidation(null);
                  return;
                }
                void onValidateGSTIN(trimmed, supplier?.id).then(setGSTINValidation);
              }}
              onBlur={() => {
                if (form.gstin.trim() && !isValidGSTIN(form.gstin)) {
                  setGSTINError(getGSTINValidationMessage());
                }
              }}
            />
            {gstinError ? <p className="pt-1 text-xs text-rose-600">{gstinError}</p> : null}
            {!gstinError && gstinValidation?.exists ? (
              <p className="pt-1 text-xs text-amber-700">This GSTIN already exists under business {gstinValidation.supplierName}.</p>
            ) : null}
          </div>
          {supplier ? (
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
          ) : null}
        </div>
        <div>
          <PartnerFieldLabel required={false}>Phone</PartnerFieldLabel>
          <PhoneInput
            value={form.phone}
            onChange={(value) => {
              setForm((prev) => ({ ...prev, phone: value }));
              setPhoneError("");
            }}
            placeholder="Phone number"
          />
          {phoneError ? <p className="pt-1 text-xs text-rose-600">{phoneError}</p> : null}
        </div>
        <div>
          <PartnerFieldLabel required={false}>Address</PartnerFieldLabel>
          <Textarea value={form.address} onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))} className="min-h-[90px]" />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" className="h-10 px-3 text-sm" onClick={onClose}>Cancel</Button>
          <Button
            className="h-10 px-3 text-sm"
            disabled={saving}
            onClick={async () => {
              if (!form.supplierName.trim()) {
                setSupplierNameError("Business name is required.");
                return;
              }
              if (gstinValidation?.exists) {
                setGSTINError(`This GSTIN already exists under business ${gstinValidation.supplierName}.`);
                return;
              }
              if (form.gstin.trim() && !isValidGSTIN(form.gstin)) {
                setGSTINError(getGSTINValidationMessage());
                return;
              }
              if (form.phone.trim()) {
                const parsedPhone = parsePhoneValue(form.phone);
                if (!isValidPhoneValue(form.phone)) {
                  setPhoneError(getPhoneValidationMessage(parsedPhone.country));
                  return;
                }
              }
              setSaving(true);
              setSupplierNameError("");
              setPhoneError("");
              setGSTINError("");
              try {
                await onSubmit({
                  supplierName: form.supplierName.trim(),
                  gstin: normalizeGSTINInput(form.gstin) || undefined,
                  phone: form.phone.trim() || undefined,
                  address: form.address.trim() || undefined,
                  status: supplier ? form.status : undefined,
                });
                onClose();
                setStatusDialog({ tone: "success", title: supplier ? "Supplier updated successfully" : "Supplier created successfully" });
              } catch (err) {
                const message = err instanceof Error ? err.message : "Failed to save supplier";
                const normalizedMessage = message.toLowerCase();
                if (normalizedMessage.includes("gstin")) {
                  setGSTINError(message);
                } else if (normalizedMessage.includes("phone")) {
                  setPhoneError(message);
                } else if (normalizedMessage.includes("suppliername") || normalizedMessage.includes("supplier name") || normalizedMessage.includes("business name")) {
                  setSupplierNameError(message);
                } else {
                  setStatusDialog({ tone: "error", title: "Supplier save failed", description: message });
                }
              } finally {
                setSaving(false);
              }
            }}
          >
            {supplier ? "Save Changes" : "Create Supplier"}
          </Button>
        </div>
      </div>
    </Dialog>
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
