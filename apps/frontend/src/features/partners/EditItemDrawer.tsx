import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@components/ui/button";
import { Card, CardContent } from "@components/ui/card";
import { Drawer } from "@components/ui/drawer";
import { FormMessage } from "@components/ui/form-message";
import { Input } from "@components/ui/input";
import { Select } from "@components/ui/select";
import { Separator } from "@components/ui/separator";
import { Textarea } from "@components/ui/textarea";
import type { PartnerCatalogItem } from "@shared/types/domain";
import { PartnerFieldLabel } from "@features/partners/PartnerFieldLabel";

type Props = {
  open: boolean;
  item: PartnerCatalogItem | null;
  onClose: () => void;
  onSubmit: (patch: {
    name: string;
    description?: string;
    hsnCode?: string;
    defaultMrp?: number;
    defaultDiscountPercentage?: number;
    status?: "ACTIVE" | "INACTIVE";
  }) => Promise<void>;
};

type FormState = {
  name: string;
  description: string;
  sku: string;
  hsnCode: string;
  defaultMrp: string;
  defaultDiscountPercentage: string;
  status: "ACTIVE" | "INACTIVE";
};

function emptyForm(): FormState {
  return {
    name: "",
    description: "",
    sku: "",
    hsnCode: "",
    defaultMrp: "",
    defaultDiscountPercentage: "",
    status: "ACTIVE",
  };
}

function digitsOnly(value: string) {
  return value.replace(/\D+/g, "");
}

function decimalNumberOnly(value: string) {
  const cleaned = value.replace(/[^\d.]/g, "");
  const [integerPart, ...decimalParts] = cleaned.split(".");
  return decimalParts.length > 0 ? `${integerPart}.${decimalParts.join("")}` : integerPart;
}

export function EditItemDrawer({ open, item, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shakingField, setShakingField] = useState("");
  const refs = useRef<Record<string, HTMLInputElement | HTMLTextAreaElement | null>>({});

  useEffect(() => {
    if (!open || !item) {
      setForm(emptyForm());
      setSaving(false);
      setErrors({});
      setShakingField("");
      return;
    }
    setForm({
      name: item.name,
      description: item.description ?? "",
      sku: item.sku ?? "",
      hsnCode: item.hsnCode ?? "",
      defaultMrp: item.defaultMrp ? String(item.defaultMrp) : "",
      defaultDiscountPercentage:
        item.defaultDiscountPercentage != null ? String(item.defaultDiscountPercentage) : "",
      status: item.status ?? "ACTIVE",
    });
    setErrors({});
    setShakingField("");
  }, [open, item]);

  const focusProblemField = (key: string) => {
    const element = refs.current[key];
    if (!element) return;
    element.scrollIntoView({ behavior: "smooth", block: "center" });
    element.focus();
    setShakingField(key);
    window.setTimeout(() => {
      setShakingField((prev) => (prev === key ? "" : prev));
    }, 350);
  };

  const withErrorStyle = (field: string) =>
    [
      errors[field] ? "border-rose-400 ring-rose-200" : "",
      shakingField === field ? "field-shake" : "",
    ].join(" ");

  return (
    <Drawer open={open} onClose={onClose} title="Edit item" hideHeader className="md:w-[46vw] lg:max-w-[46vw]" bodyClassName="h-full px-0 py-0">
      <div className="flex h-screen flex-col bg-slate-50/80">
        <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="px-5 py-5 sm:px-6">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-[28px] font-semibold tracking-tight text-slate-950">Edit item</h2>
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
          <Card className="overflow-hidden rounded-3xl border-slate-200/90 shadow-sm">
            <CardContent className="space-y-6 bg-white p-5">
            <div>
              <PartnerFieldLabel className="mb-2 text-sm font-semibold text-slate-800">Item name</PartnerFieldLabel>
              <Input
                ref={(node) => {
                  refs.current.name = node;
                }}
                value={form.name}
                className={["h-12 rounded-2xl bg-white text-[15px]", withErrorStyle("name")].join(" ")}
                onChange={(event) => {
                  const next = event.target.value;
                  setForm((prev) => ({ ...prev, name: next }));
                  setErrors((prev) => {
                    if (!prev.name) return prev;
                    const copy = { ...prev };
                    delete copy.name;
                    return copy;
                  });
                }}
              />
              {errors.name ? <FormMessage>{errors.name}</FormMessage> : null}
            </div>

            <Separator className="bg-slate-100" />

            <div>
              <PartnerFieldLabel className="mb-2 text-sm font-semibold text-slate-800" required={false}>Description (optional)</PartnerFieldLabel>
              <Textarea
                ref={(node) => {
                  refs.current.description = node;
                }}
                value={form.description}
                className={["min-h-[132px] rounded-2xl border-slate-200 bg-white px-4 py-3 text-[15px]", withErrorStyle("description")].join(" ")}
                onChange={(event) => {
                  const next = event.target.value;
                  setForm((prev) => ({ ...prev, description: next }));
                }}
              />
              {errors.description ? <FormMessage>{errors.description}</FormMessage> : null}
            </div>

            <Separator className="bg-slate-100" />

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <PartnerFieldLabel className="mb-2 text-sm font-semibold text-slate-800" required={false}>SKU code</PartnerFieldLabel>
                <Input
                  value={form.sku}
                  readOnly
                  aria-readonly="true"
                  className="h-12 cursor-not-allowed rounded-2xl border-slate-200 bg-slate-50 text-[15px] text-slate-600 focus:border-slate-300 focus:shadow-none"
                />
                <p className="mt-1 text-xs text-slate-500">SKU cannot be edited. Create a new item for a different SKU.</p>
              </div>
              <div>
                <PartnerFieldLabel className="mb-2 text-sm font-semibold text-slate-800" required={false}>HSN code (optional)</PartnerFieldLabel>
                <Input
                  ref={(node) => {
                    refs.current.hsnCode = node;
                  }}
                  value={form.hsnCode}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className={["h-12 rounded-2xl bg-white text-[15px]", withErrorStyle("hsnCode")].join(" ")}
                  onChange={(event) => {
                    const next = digitsOnly(event.target.value);
                    setForm((prev) => ({ ...prev, hsnCode: next }));
                  }}
                />
                {errors.hsnCode ? <FormMessage>{errors.hsnCode}</FormMessage> : null}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <PartnerFieldLabel className="mb-2 text-sm font-semibold text-slate-800">Default MRP</PartnerFieldLabel>
                <Input
                  ref={(node) => {
                    refs.current.defaultMrp = node;
                  }}
                  value={form.defaultMrp}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className={["h-12 rounded-2xl bg-white text-[15px]", withErrorStyle("defaultMrp")].join(" ")}
                  onChange={(event) => {
                    const next = digitsOnly(event.target.value);
                    setForm((prev) => ({ ...prev, defaultMrp: next }));
                    setErrors((prev) => {
                      if (!prev.defaultMrp) return prev;
                      const copy = { ...prev };
                      delete copy.defaultMrp;
                      return copy;
                    });
                  }}
                />
                {errors.defaultMrp ? <FormMessage>{errors.defaultMrp}</FormMessage> : null}
              </div>
              <div>
                <PartnerFieldLabel className="mb-2 text-sm font-semibold text-slate-800">Default Buy Margin %</PartnerFieldLabel>
                <Input
                  ref={(node) => {
                    refs.current.defaultDiscountPercentage = node;
                  }}
                  value={form.defaultDiscountPercentage}
                  inputMode="decimal"
                  pattern="[0-9]*[.]?[0-9]*"
                  className={["h-12 rounded-2xl bg-white text-[15px]", withErrorStyle("defaultDiscountPercentage")].join(" ")}
                  onChange={(event) => {
                    const next = decimalNumberOnly(event.target.value);
                    setForm((prev) => ({ ...prev, defaultDiscountPercentage: next }));
                    setErrors((prev) => {
                      if (!prev.defaultDiscountPercentage) return prev;
                      const copy = { ...prev };
                      delete copy.defaultDiscountPercentage;
                      return copy;
                    });
                  }}
                />
                {errors.defaultDiscountPercentage ? <FormMessage>{errors.defaultDiscountPercentage}</FormMessage> : null}
              </div>
            </div>

            <div>
              <PartnerFieldLabel className="mb-2 text-sm font-semibold text-slate-800">Status</PartnerFieldLabel>
              <Select
                value={form.status}
                onValueChange={(value) => {
                  setForm((prev) => ({ ...prev, status: value as "ACTIVE" | "INACTIVE" }));
                }}
                options={[
                  { value: "ACTIVE", label: "Active" },
                  { value: "INACTIVE", label: "Inactive" },
                ]}
                className="rounded-2xl"
              />
            </div>

            <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
              Catalog stores product identity and fallback buying terms. Add inventory pre-fills MRP and Buy Margin from here, but each inward row can be changed.
            </p>
            </CardContent>
          </Card>
        </div>

        <div className="sticky bottom-0 z-20 border-t border-slate-200 bg-white/95 px-5 py-4 backdrop-blur sm:px-6">
          <div className="flex justify-end">
            <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" className="h-11 w-full rounded-2xl px-5 text-sm font-medium whitespace-nowrap sm:w-auto" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              className="h-11 w-full rounded-2xl px-6 text-sm font-semibold whitespace-nowrap shadow-lg shadow-brand-500/20 sm:min-w-[160px] sm:w-auto"
              disabled={saving}
              onClick={async () => {
                const nextErrors: Record<string, string> = {};
                const name = form.name.trim();
                const defaultMrp = Number.parseInt(form.defaultMrp, 10);
                const defaultDiscountPercentage = Number.parseFloat(form.defaultDiscountPercentage || "0");

                if (form.hsnCode.trim() && !/^\d+$/.test(form.hsnCode.trim())) {
                  nextErrors.hsnCode = "HSN code must contain digits only.";
                }
                if (!name) {
                  nextErrors.name = "Item name is required.";
                }
                if (!Number.isInteger(defaultMrp) || defaultMrp <= 0) {
                  nextErrors.defaultMrp = "Default MRP must be a non-zero integer.";
                }
                if (!Number.isFinite(defaultDiscountPercentage) || defaultDiscountPercentage < 0 || defaultDiscountPercentage > 100) {
                  nextErrors.defaultDiscountPercentage = "Default Buy Margin must be between 0 and 100.";
                }

                if (Object.keys(nextErrors).length > 0) {
                  setErrors(nextErrors);
                  focusProblemField(Object.keys(nextErrors)[0]);
                  return;
                }

                setSaving(true);
                setErrors({});
                try {
                  await onSubmit({
                    name,
                    description: form.description.trim() || undefined,
                    hsnCode: form.hsnCode.trim() || undefined,
                    defaultMrp,
                    defaultDiscountPercentage,
                    status: form.status,
                  });
                  onClose();
                } catch (err) {
                  const message = err instanceof Error ? err.message : "Failed to update item";
                  if (message.toLowerCase().includes("hsn")) {
                    setErrors({ hsnCode: message });
                    focusProblemField("hsnCode");
                  } else {
                    setErrors({ name: message });
                    focusProblemField("name");
                  }
                } finally {
                  setSaving(false);
                }
              }}
            >
              Save
            </Button>
            </div>
          </div>
        </div>
      </div>
    </Drawer>
  );
}
