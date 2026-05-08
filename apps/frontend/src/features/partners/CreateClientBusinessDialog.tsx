import { FileBadge2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Drawer } from "@components/ui/drawer";
import { Input } from "@components/ui/input";
import { Separator } from "@components/ui/separator";
import { Textarea } from "@components/ui/textarea";
import { ClientContactFields, type ClientContactFormValue } from "@features/partners/ClientContactFields";
import { validateContacts, type ContactFieldError } from "@features/partners/contactValidation";
import { PartnerFieldLabel } from "@features/partners/PartnerFieldLabel";
import { getGSTINValidationMessage, isValidGSTIN, normalizeGSTINInput } from "@shared/lib/gstin";
import { StatusDialog } from "@shared/ui/molecules/status-dialog";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: {
    businessName: string;
    gstin?: string;
    billingAddress?: string;
    contacts: ClientContactFormValue[];
  }) => Promise<void>;
  onValidateGSTIN: (gstin: string) => Promise<{ exists: boolean; businessId?: string; businessName?: string }>;
  onAddOutletUnderExisting: (businessId: string) => void;
};

export function CreateClientBusinessDialog({ open, onClose, onSubmit, onValidateGSTIN, onAddOutletUnderExisting }: Props) {
  const [form, setForm] = useState({
    businessName: "",
    gstin: "",
    billingAddress: "",
    contacts: [{ name: "", phone: "" }],
  });
  const [saving, setSaving] = useState(false);
  const [statusDialog, setStatusDialog] = useState<{ tone: "success" | "error"; title: string; description?: string } | null>(null);
  const [businessNameError, setBusinessNameError] = useState("");
  const [gstinError, setGSTINError] = useState("");
  const [contactError, setContactError] = useState("");
  const [contactFieldErrors, setContactFieldErrors] = useState<ContactFieldError[]>([]);
  const [gstinValidation, setGSTINValidation] = useState<{ exists: boolean; businessId?: string; businessName?: string } | null>(null);

  useEffect(() => {
    if (!open) {
      setForm({
        businessName: "",
        gstin: "",
        billingAddress: "",
        contacts: [{ name: "", phone: "" }],
      });
      setSaving(false);
      setBusinessNameError("");
      setGSTINError("");
      setContactError("");
      setContactFieldErrors([]);
      setGSTINValidation(null);
    }
  }, [open]);

  return (
    <>
    <Drawer
      open={open}
      onClose={onClose}
      title="Create Client"
      hideHeader
      className="md:w-[46vw] lg:max-w-[46vw]"
      bodyClassName="h-full px-0 py-0"
    >
      <div className="flex h-screen flex-col bg-slate-50/80">
        <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="px-5 py-5 sm:px-6">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-[28px] font-semibold tracking-tight text-slate-950">Create Client</h2>
              </div>
              <Button
                type="button"
                variant="ghost"
                className="h-11 w-11 shrink-0 rounded-2xl p-0 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                onClick={onClose}
                aria-label="Close drawer"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <div className="mx-auto space-y-5">
            <Card className="overflow-hidden rounded-3xl border-slate-200/90 shadow-sm">
              <CardHeader className="border-b border-slate-100 bg-white px-5 py-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                    <FileBadge2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-lg font-semibold tracking-tight text-slate-950">Legal Entity Details</CardTitle>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6 bg-white p-5">
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,0.9fr)]">
                  <div>
                    <PartnerFieldLabel className="mb-2 text-sm font-semibold text-slate-800">Business name</PartnerFieldLabel>
                    <Input
                      value={form.businessName}
                      placeholder="Enter registered business name"
                      className={`h-12 rounded-2xl bg-white text-[15px] ${businessNameError ? "border-rose-300 ring-2 ring-rose-100" : "border-slate-200"}`}
                      onChange={(event) => {
                        setForm((prev) => ({ ...prev, businessName: event.target.value }));
                        setBusinessNameError("");
                      }}
                    />
                    {businessNameError ? <p className="pt-2 text-xs font-medium text-rose-600">{businessNameError}</p> : null}
                  </div>
                  <div>
                    <PartnerFieldLabel className="mb-2 text-sm font-semibold text-slate-800" required={false}>
                      GSTIN
                    </PartnerFieldLabel>
                    <Input
                      value={form.gstin}
                      maxLength={15}
                      placeholder="15-character GSTIN"
                      className={`h-12 rounded-2xl bg-white text-[15px] uppercase ${gstinError ? "border-rose-300 ring-2 ring-rose-100" : "border-slate-200"}`}
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
                        void onValidateGSTIN(trimmed).then(setGSTINValidation);
                      }}
                      onBlur={() => {
                        if (form.gstin.trim() && !isValidGSTIN(form.gstin)) {
                          setGSTINError(getGSTINValidationMessage());
                        }
                      }}
                    />
                    {gstinError ? <p className="pt-2 text-xs font-medium text-rose-600">{gstinError}</p> : null}
                    {!gstinError && gstinValidation?.exists ? (
                      <p className="pt-2 text-xs font-medium text-amber-700">
                        This GSTIN already exists under business {gstinValidation.businessName}.
                      </p>
                    ) : null}
                  </div>
                </div>

                <Separator className="bg-slate-100" />

                <div>
                  <PartnerFieldLabel className="mb-2 text-sm font-semibold text-slate-800" required={false}>
                    Business address
                  </PartnerFieldLabel>
                  <Textarea
                    value={form.billingAddress}
                    onChange={(event) => setForm((prev) => ({ ...prev, billingAddress: event.target.value }))}
                    className="min-h-[132px] rounded-2xl border-slate-200 bg-white px-4 py-3 text-[15px]"
                    placeholder="Enter the complete registered business address"
                  />
                </div>

                <Separator className="bg-slate-100" />

                <ClientContactFields
                  contacts={form.contacts}
                  onChange={(contacts) => {
                    setForm((prev) => ({ ...prev, contacts }));
                    setContactError("");
                    setContactFieldErrors([]);
                  }}
                  title="Contact details"
                  error={contactError}
                  fieldErrors={contactFieldErrors}
                  allowRemoveFirst
                  requireIfPresent
                  onAddBlocked={() => setContactError("Complete the current contact name and phone number before adding another contact.")}
                />
              </CardContent>
            </Card>

            {gstinValidation?.exists ? (
              <Card className="rounded-3xl border-amber-200 bg-amber-50/80 shadow-sm">
                <CardContent className="p-5">
                  <p className="text-sm font-semibold text-amber-950">
                    This GSTIN already exists under business {gstinValidation.businessName}.
                  </p>
                  <p className="mt-1 text-sm leading-6 text-amber-800">
                    If this is another operating location for the same client, add an outlet under the existing business instead of creating a duplicate legal entity.
                  </p>
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      className="h-10 rounded-2xl border-amber-300 bg-white px-4 text-sm font-semibold text-amber-900"
                      onClick={() => {
                        if (gstinValidation.businessId) {
                          onClose();
                          onAddOutletUnderExisting(gstinValidation.businessId);
                        }
                      }}
                    >
                      Add outlet under existing business
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>

        <div className="sticky bottom-0 z-20 border-t border-slate-200 bg-white/95 px-5 py-4 backdrop-blur sm:px-6">
          <div className="flex justify-end">
            <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row sm:justify-end">
              <Button variant="ghost" className="h-11 w-full rounded-2xl px-5 text-sm font-medium whitespace-nowrap sm:w-auto" onClick={onClose}>
                Cancel
              </Button>
          <Button
            className="h-11 w-full rounded-2xl px-6 text-sm font-semibold whitespace-nowrap shadow-lg shadow-brand-500/20 sm:min-w-[168px] sm:w-auto"
            disabled={saving}
            onClick={async () => {
              setBusinessNameError("");
              setGSTINError("");
              setContactError("");
              setContactFieldErrors([]);
              if (!form.businessName.trim()) {
                setBusinessNameError("Business name is required.");
                return;
              }
              if (gstinValidation?.exists) {
                setGSTINError(`This GSTIN already exists under business ${gstinValidation.businessName}.`);
                return;
              }
              if (form.gstin.trim() && !isValidGSTIN(form.gstin)) {
                setGSTINError(getGSTINValidationMessage());
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
                  businessName: form.businessName.trim(),
                  gstin: normalizeGSTINInput(form.gstin) || undefined,
                  billingAddress: form.billingAddress.trim() || undefined,
                  contacts: contactValidation.validContacts,
                });
                onClose();
                setStatusDialog({ tone: "success", title: "Client created successfully" });
              } catch (err) {
                setStatusDialog({
                  tone: "error",
                  title: "Client creation failed",
                  description: err instanceof Error ? err.message : "Failed to create client",
                });
              } finally {
                setSaving(false);
              }
            }}
          >
            Create Client
          </Button>
            </div>
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
