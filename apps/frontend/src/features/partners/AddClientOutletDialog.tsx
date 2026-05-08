import { Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@components/ui/button";
import { Card, CardContent } from "@components/ui/card";
import { Drawer } from "@components/ui/drawer";
import { FormMessage } from "@components/ui/form-message";
import { Input } from "@components/ui/input";
import { Separator } from "@components/ui/separator";
import { Textarea } from "@components/ui/textarea";
import { ClientContactFields, type ClientContactFormValue } from "@features/partners/ClientContactFields";
import { validateContacts, type ContactFieldError } from "@features/partners/contactValidation";
import { PartnerFieldLabel } from "@features/partners/PartnerFieldLabel";
import { StatusDialog } from "@shared/ui/molecules/status-dialog";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: {
    outletName: string;
    address?: string;
    contacts: ClientContactFormValue[];
  }) => Promise<void>;
};

type OutletDraft = {
  id: string;
  outletName: string;
  address: string;
  contacts: ClientContactFormValue[];
};

type OutletDraftErrors = {
  outletName?: string;
  contactError?: string;
  contactFieldErrors: ContactFieldError[];
};

function makeOutletDraft(): OutletDraft {
  return {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    outletName: "",
    address: "",
    contacts: [{ name: "", phone: "" }],
  };
}

function makeEmptyErrors(): OutletDraftErrors {
  return {
    outletName: "",
    contactError: "",
    contactFieldErrors: [],
  };
}

export function AddClientOutletDialog({ open, onClose, onSubmit }: Props) {
  const [outlets, setOutlets] = useState<OutletDraft[]>([makeOutletDraft()]);
  const [errors, setErrors] = useState<Record<string, OutletDraftErrors>>({});
  const [saving, setSaving] = useState(false);
  const [statusDialog, setStatusDialog] = useState<{ tone: "success" | "error"; title: string; description?: string } | null>(null);

  useEffect(() => {
    if (!open) {
      setOutlets([makeOutletDraft()]);
      setErrors({});
      setSaving(false);
    }
  }, [open]);

  const updateOutlet = (id: string, patch: Partial<OutletDraft>) => {
    setOutlets((current) => current.map((outlet) => (outlet.id === id ? { ...outlet, ...patch } : outlet)));
    setErrors((current) => {
      const next = { ...current };
      if (next[id]) {
        next[id] = makeEmptyErrors();
      }
      return next;
    });
  };

  const addOutletBlock = () => {
    setOutlets((current) => [...current, makeOutletDraft()]);
  };

  const removeOutletBlock = (id: string) => {
    setOutlets((current) => current.filter((outlet) => outlet.id !== id));
    setErrors((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  };

  return (
    <>
    <Drawer
      open={open}
      onClose={onClose}
      title="Add outlets"
      hideHeader
      className="md:w-[46vw] lg:max-w-[46vw]"
      bodyClassName="h-full px-0 py-0"
    >
      <div className="flex h-screen flex-col bg-slate-50/80">
        <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="px-5 py-5 sm:px-6">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-[28px] font-semibold tracking-tight text-slate-950">Add outlets</h2>
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
            {outlets.map((outlet, index) => {
              const outletErrors = errors[outlet.id] ?? makeEmptyErrors();
              return (
                <Card key={outlet.id} className="overflow-hidden rounded-3xl border-slate-200/90 shadow-sm">
                  <CardContent className="space-y-6 bg-white p-5">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-lg font-semibold tracking-tight text-slate-950">Outlet {index + 1}</h3>
                      {outlets.length > 1 ? (
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-10 rounded-2xl px-3 text-slate-500"
                          onClick={() => removeOutletBlock(outlet.id)}
                        >
                          <Trash2 className="mr-1.5 h-4 w-4" />
                          Remove
                        </Button>
                      ) : null}
                    </div>

                    <div>
                      <PartnerFieldLabel className="mb-2 text-sm font-semibold text-slate-800">Outlet name</PartnerFieldLabel>
                      <Input
                        value={outlet.outletName}
                        onChange={(event) => updateOutlet(outlet.id, { outletName: event.target.value })}
                        placeholder="Enter outlet name"
                        className={`h-12 rounded-2xl bg-white text-[15px] ${outletErrors.outletName ? "border-rose-300 ring-2 ring-rose-100" : "border-slate-200"}`}
                      />
                      {outletErrors.outletName ? <FormMessage>{outletErrors.outletName}</FormMessage> : null}
                    </div>

                    <Separator className="bg-slate-100" />

                    <div>
                      <PartnerFieldLabel className="mb-2 text-sm font-semibold text-slate-800" required={false}>Address</PartnerFieldLabel>
                      <Textarea
                        value={outlet.address}
                        onChange={(event) => updateOutlet(outlet.id, { address: event.target.value })}
                        className="min-h-[132px] rounded-2xl border-slate-200 bg-white px-4 py-3 text-[15px]"
                        placeholder="Enter the complete outlet address"
                      />
                    </div>

                    <Separator className="bg-slate-100" />

                    <ClientContactFields
                      contacts={outlet.contacts}
                      onChange={(contacts) => updateOutlet(outlet.id, { contacts })}
                      title="Outlet contacts"
                      error={outletErrors.contactError}
                      fieldErrors={outletErrors.contactFieldErrors}
                      requireIfPresent
                      onAddBlocked={() =>
                        setErrors((current) => ({
                          ...current,
                          [outlet.id]: {
                            ...(current[outlet.id] ?? makeEmptyErrors()),
                            contactError: "Complete the current contact name and phone number before adding another contact.",
                          },
                        }))
                      }
                    />
                  </CardContent>
                </Card>
              );
            })}

            <Button
              type="button"
              variant="outline"
              className="h-11 w-full rounded-2xl border-dashed border-slate-300 bg-white text-sm font-semibold text-slate-700 shadow-sm"
              onClick={addOutletBlock}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add another outlet
            </Button>
          </div>
        </div>

        <div className="sticky bottom-0 z-20 border-t border-slate-200 bg-white/95 px-5 py-4 backdrop-blur sm:px-6">
          <div className="flex justify-end">
            <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row sm:justify-end">
              <Button variant="ghost" className="h-11 w-full rounded-2xl px-5 text-sm font-medium whitespace-nowrap sm:w-auto" onClick={onClose}>
                Cancel
              </Button>
              <Button
                className="h-11 w-full rounded-2xl px-6 text-sm font-semibold whitespace-nowrap shadow-lg shadow-brand-500/20 sm:min-w-[160px] sm:w-auto"
                disabled={saving}
                onClick={async () => {
                  const nextErrors: Record<string, OutletDraftErrors> = {};
                  const validPayloads: Array<{ outletName: string; address?: string; contacts: ClientContactFormValue[] }> = [];

                  outlets.forEach((outlet) => {
                    const outletErrors = makeEmptyErrors();

                    if (!outlet.outletName.trim()) {
                      outletErrors.outletName = "Outlet name is required.";
                    }

                    const contactValidation = validateContacts(outlet.contacts, { requireAtLeastOne: true });
                    if (contactValidation.sectionError || contactValidation.fieldErrors.some((item) => item.name || item.phone)) {
                      outletErrors.contactError = contactValidation.sectionError;
                      outletErrors.contactFieldErrors = contactValidation.fieldErrors;
                    }

                    if (outletErrors.outletName || outletErrors.contactError || outletErrors.contactFieldErrors.some((item) => item.name || item.phone)) {
                      nextErrors[outlet.id] = outletErrors;
                      return;
                    }

                    validPayloads.push({
                      outletName: outlet.outletName.trim(),
                      address: outlet.address.trim() || undefined,
                      contacts: contactValidation.validContacts,
                    });
                  });

                  setErrors(nextErrors);
                  if (Object.keys(nextErrors).length > 0) {
                    return;
                  }

                  setSaving(true);
                  try {
                    for (const payload of validPayloads) {
                      await onSubmit(payload);
                    }
                    onClose();
                    setStatusDialog({
                      tone: "success",
                      title: validPayloads.length === 1 ? "Outlet added successfully" : "Outlets added successfully",
                    });
                  } catch (err) {
                    setStatusDialog({
                      tone: "error",
                      title: "Outlet creation failed",
                      description: err instanceof Error ? err.message : "Failed to add outlets",
                    });
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                Add outlets
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
