import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { Button } from "@components/ui/button";
import { Card, CardContent } from "@components/ui/card";
import { Drawer } from "@components/ui/drawer";
import { FormMessage } from "@components/ui/form-message";
import { Input } from "@components/ui/input";
import { Select } from "@components/ui/select";
import { Separator } from "@components/ui/separator";
import { Textarea } from "@components/ui/textarea";
import { PartnerFieldLabel } from "@features/partners/PartnerFieldLabel";
import { StatusDialog } from "@shared/ui/molecules/status-dialog";

type ItemDraft = {
  id: string;
  name: string;
  description: string;
  sku: string;
  hsnCode: string;
  defaultMrp: string;
  defaultDiscountPercentage: string;
  status: "ACTIVE" | "INACTIVE";
};

type Props = {
  open: boolean;
  onClose: () => void;
  existingSkus: string[];
  onSubmit: (
    rows: Array<{
      name: string;
      description?: string;
      sku?: string;
      hsnCode?: string;
      defaultMrp?: number;
      defaultDiscountPercentage?: number;
      status?: "ACTIVE" | "INACTIVE";
    }>,
  ) => Promise<void>;
};

function makeRow(): ItemDraft {
  return {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
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

function fieldKey(rowId: string, field: "name" | "description" | "sku" | "hsnCode" | "defaultMrp" | "defaultDiscountPercentage") {
  return `${rowId}.${field}`;
}

export function CreateItemsDrawer({ open, onClose, onSubmit, existingSkus }: Props) {
  const [rows, setRows] = useState<ItemDraft[]>([makeRow()]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shakingField, setShakingField] = useState("");
  const [statusDialog, setStatusDialog] = useState<{ tone: "success" | "error"; title: string; description?: string } | null>(null);
  const fieldRefs = useRef<Record<string, HTMLInputElement | HTMLTextAreaElement | null>>({});

  useEffect(() => {
    if (!open) {
      setRows([makeRow()]);
      setSaving(false);
      setErrors({});
      setShakingField("");
    }
  }, [open]);

  const hasAtLeastOneRow = useMemo(
    () => rows.length > 0,
    [rows],
  );

  const focusProblemField = (key: string) => {
    const element = fieldRefs.current[key];
    if (!element) return;
    element.scrollIntoView({ behavior: "smooth", block: "center" });
    element.focus();
    setShakingField(key);
    window.setTimeout(() => {
      setShakingField((prev) => (prev === key ? "" : prev));
    }, 350);
  };

  return (
    <>
    <Drawer
      open={open}
      onClose={onClose}
      title="Create new items"
      hideHeader
      className="md:w-[46vw] lg:max-w-[46vw]"
      bodyClassName="h-full px-0 py-0"
    >
      <div className="flex h-screen flex-col bg-slate-50/80">
        <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="px-5 py-5 sm:px-6">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-[28px] font-semibold tracking-tight text-slate-950">Create items</h2>
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
            {rows.map((row, index) => (
              <Card key={row.id} className="overflow-hidden rounded-3xl border-slate-200/90 shadow-sm">
                <CardContent className="space-y-6 bg-white p-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold tracking-tight text-slate-950">Item {index + 1}</h3>
                  {rows.length > 1 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-10 rounded-2xl px-3 text-slate-500"
                      onClick={() => {
                        setRows((prev) => prev.filter((current) => current.id !== row.id));
                      }}
                    >
                      <Trash2 className="mr-1.5 h-4 w-4" />
                      Remove
                    </Button>
                  ) : null}
                </div>

                <div className="space-y-5">
                  <div>
                    <PartnerFieldLabel className="mb-2 text-sm font-semibold text-slate-800">Item name</PartnerFieldLabel>
                    <Input
                      ref={(node) => {
                        fieldRefs.current[fieldKey(row.id, "name")] = node;
                      }}
                      value={row.name}
                      placeholder="e.g. Repair Shampoo 300ml"
                      className={[
                        "h-12 rounded-2xl bg-white text-[15px]",
                        errors[fieldKey(row.id, "name")] ? "border-rose-300 ring-2 ring-rose-100" : "border-slate-200",
                        shakingField === fieldKey(row.id, "name") ? "field-shake" : "",
                      ].join(" ")}
                      onChange={(event) => {
                        const next = event.target.value;
                        setErrors((prev) => {
                          if (!prev[fieldKey(row.id, "name")]) return prev;
                          const copy = { ...prev };
                          delete copy[fieldKey(row.id, "name")];
                          return copy;
                        });
                        setRows((prev) =>
                          prev.map((current) => (current.id === row.id ? { ...current, name: next } : current)),
                        );
                      }}
                    />
                    {errors[fieldKey(row.id, "name")] ? <FormMessage>{errors[fieldKey(row.id, "name")]}</FormMessage> : null}
                  </div>

                  <Separator className="bg-slate-100" />

                  <div>
                    <PartnerFieldLabel className="mb-2 text-sm font-semibold text-slate-800" required={false}>Description (optional)</PartnerFieldLabel>
                    <Textarea
                      ref={(node) => {
                        fieldRefs.current[fieldKey(row.id, "description")] = node;
                      }}
                      value={row.description}
                      placeholder="Optional"
                      className={[
                        "min-h-[132px] rounded-2xl border-slate-200 bg-white px-4 py-3 text-[15px]",
                        errors[fieldKey(row.id, "description")] ? "border-rose-300 ring-2 ring-rose-100" : "",
                        shakingField === fieldKey(row.id, "description") ? "field-shake" : "",
                      ].join(" ")}
                      onChange={(event) => {
                        const next = event.target.value;
                        setRows((prev) =>
                          prev.map((current) => (current.id === row.id ? { ...current, description: next } : current)),
                        );
                      }}
                    />
                    {errors[fieldKey(row.id, "description")] ? <FormMessage>{errors[fieldKey(row.id, "description")]}</FormMessage> : null}
                  </div>

                  <Separator className="bg-slate-100" />

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <PartnerFieldLabel className="mb-2 text-sm font-semibold text-slate-800">SKU code</PartnerFieldLabel>
                      <Input
                        ref={(node) => {
                          fieldRefs.current[fieldKey(row.id, "sku")] = node;
                        }}
                        value={row.sku}
                        placeholder="Enter SKU code"
                        className={[
                          "h-12 rounded-2xl bg-white text-[15px]",
                          errors[fieldKey(row.id, "sku")] ? "border-rose-300 ring-2 ring-rose-100" : "border-slate-200",
                          shakingField === fieldKey(row.id, "sku") ? "field-shake" : "",
                        ].join(" ")}
                        onChange={(event) => {
                          const next = event.target.value;
                          setErrors((prev) => {
                            if (!prev[fieldKey(row.id, "sku")]) return prev;
                            const copy = { ...prev };
                            delete copy[fieldKey(row.id, "sku")];
                            return copy;
                          });
                          setRows((prev) =>
                            prev.map((current) => (current.id === row.id ? { ...current, sku: next } : current)),
                          );
                        }}
                      />
                      {errors[fieldKey(row.id, "sku")] ? <FormMessage>{errors[fieldKey(row.id, "sku")]}</FormMessage> : null}
                    </div>
                    <div>
                      <PartnerFieldLabel className="mb-2 text-sm font-semibold text-slate-800" required={false}>HSN code (optional)</PartnerFieldLabel>
                      <Input
                        ref={(node) => {
                          fieldRefs.current[fieldKey(row.id, "hsnCode")] = node;
                        }}
                        value={row.hsnCode}
                        placeholder="Optional"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        className={[
                          "h-12 rounded-2xl bg-white text-[15px]",
                          errors[fieldKey(row.id, "hsnCode")] ? "border-rose-300 ring-2 ring-rose-100" : "border-slate-200",
                          shakingField === fieldKey(row.id, "hsnCode") ? "field-shake" : "",
                        ].join(" ")}
                        onChange={(event) => {
                          const next = event.target.value.replace(/\D+/g, "");
                          setRows((prev) =>
                            prev.map((current) => (current.id === row.id ? { ...current, hsnCode: next } : current)),
                          );
                        }}
                      />
                      {errors[fieldKey(row.id, "hsnCode")] ? <FormMessage>{errors[fieldKey(row.id, "hsnCode")]}</FormMessage> : null}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <PartnerFieldLabel className="mb-2 text-sm font-semibold text-slate-800">Default MRP</PartnerFieldLabel>
                      <Input
                        ref={(node) => {
                          fieldRefs.current[fieldKey(row.id, "defaultMrp")] = node;
                        }}
                        value={row.defaultMrp}
                        placeholder="Enter default MRP"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        className={[
                          "h-12 rounded-2xl bg-white text-[15px]",
                          errors[fieldKey(row.id, "defaultMrp")] ? "border-rose-300 ring-2 ring-rose-100" : "border-slate-200",
                          shakingField === fieldKey(row.id, "defaultMrp") ? "field-shake" : "",
                        ].join(" ")}
                        onChange={(event) => {
                          const next = digitsOnly(event.target.value);
                          setErrors((prev) => {
                            if (!prev[fieldKey(row.id, "defaultMrp")]) return prev;
                            const copy = { ...prev };
                            delete copy[fieldKey(row.id, "defaultMrp")];
                            return copy;
                          });
                          setRows((prev) =>
                            prev.map((current) => (current.id === row.id ? { ...current, defaultMrp: next } : current)),
                          );
                        }}
                      />
                      {errors[fieldKey(row.id, "defaultMrp")] ? <FormMessage>{errors[fieldKey(row.id, "defaultMrp")]}</FormMessage> : null}
                    </div>
                    <div>
                      <PartnerFieldLabel className="mb-2 text-sm font-semibold text-slate-800">Default Buy Margin %</PartnerFieldLabel>
                      <Input
                        ref={(node) => {
                          fieldRefs.current[fieldKey(row.id, "defaultDiscountPercentage")] = node;
                        }}
                        value={row.defaultDiscountPercentage}
                        placeholder="Enter default buy margin"
                        inputMode="decimal"
                        pattern="[0-9]*[.]?[0-9]*"
                        className={[
                          "h-12 rounded-2xl bg-white text-[15px]",
                          errors[fieldKey(row.id, "defaultDiscountPercentage")] ? "border-rose-300 ring-2 ring-rose-100" : "border-slate-200",
                          shakingField === fieldKey(row.id, "defaultDiscountPercentage") ? "field-shake" : "",
                        ].join(" ")}
                        onChange={(event) => {
                          const next = decimalNumberOnly(event.target.value);
                          setErrors((prev) => {
                            if (!prev[fieldKey(row.id, "defaultDiscountPercentage")]) return prev;
                            const copy = { ...prev };
                            delete copy[fieldKey(row.id, "defaultDiscountPercentage")];
                            return copy;
                          });
                          setRows((prev) =>
                            prev.map((current) => (current.id === row.id ? { ...current, defaultDiscountPercentage: next } : current)),
                          );
                        }}
                      />
                      {errors[fieldKey(row.id, "defaultDiscountPercentage")] ? <FormMessage>{errors[fieldKey(row.id, "defaultDiscountPercentage")]}</FormMessage> : null}
                    </div>
                  </div>

                  <div>
                    <PartnerFieldLabel className="mb-2 text-sm font-semibold text-slate-800">Status</PartnerFieldLabel>
                    <Select
                      value={row.status}
                      onValueChange={(value) => {
                        setRows((prev) =>
                          prev.map((current) => (current.id === row.id ? { ...current, status: value as "ACTIVE" | "INACTIVE" } : current)),
                        );
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

                </div>
                </CardContent>
              </Card>
            ))}

            <Button
              type="button"
              variant="outline"
              className="h-11 w-full rounded-2xl border-dashed border-slate-300 bg-white text-sm font-semibold text-slate-700 shadow-sm"
              onClick={() => {
                setRows((prev) => [...prev, makeRow()]);
              }}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add another item
            </Button>
          </div>
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
              disabled={saving || !hasAtLeastOneRow}
              onClick={async () => {
                const nextErrors: Record<string, string> = {};
                const payload: Array<{
                  name: string;
                  description?: string;
                  sku?: string;
                  hsnCode?: string;
                  defaultMrp?: number;
                  defaultDiscountPercentage?: number;
                  status?: "ACTIVE" | "INACTIVE";
                }> = [];
                const existingSkuSet = new Set(existingSkus.map((sku) => sku.trim().toLowerCase()).filter(Boolean));
                const batchSkus = new Map<string, string[]>();

                for (const row of rows) {
                  const name = row.name.trim();
                  const description = row.description.trim();
                  const sku = row.sku.trim();
                  const hsnCode = row.hsnCode.trim();
                  const defaultMrp = Number.parseInt(row.defaultMrp, 10);
                  const defaultDiscountPercentage = Number.parseFloat(row.defaultDiscountPercentage || "0");
                  const normalizedSku = sku.toLowerCase();
                  if (!sku) {
                    nextErrors[fieldKey(row.id, "sku")] = "SKU code is required.";
                  } else {
                    batchSkus.set(normalizedSku, [...(batchSkus.get(normalizedSku) ?? []), row.id]);
                    if (existingSkuSet.has(normalizedSku)) {
                      nextErrors[fieldKey(row.id, "sku")] =
                        "This SKU code already exists. Please update that item or enter a new SKU code";
                    }
                  }
                  if (hsnCode && !/^\d+$/.test(hsnCode)) {
                    nextErrors[fieldKey(row.id, "hsnCode")] = "HSN code must contain digits only.";
                  }
                  if (!Number.isInteger(defaultMrp) || defaultMrp <= 0) {
                    nextErrors[fieldKey(row.id, "defaultMrp")] = "Default MRP must be a non-zero integer.";
                  }
                  if (!Number.isFinite(defaultDiscountPercentage) || defaultDiscountPercentage < 0 || defaultDiscountPercentage > 100) {
                    nextErrors[fieldKey(row.id, "defaultDiscountPercentage")] = "Default Buy Margin must be between 0 and 100.";
                  }

                  if (!name) {
                    nextErrors[fieldKey(row.id, "name")] = "Item name is required.";
                  }

                  if (
                    !nextErrors[fieldKey(row.id, "name")] &&
                    !nextErrors[fieldKey(row.id, "sku")] &&
                    !nextErrors[fieldKey(row.id, "defaultMrp")] &&
                    !nextErrors[fieldKey(row.id, "defaultDiscountPercentage")]
                  ) {
                    payload.push({
                      name,
                      description: description || undefined,
                      sku,
                      hsnCode: hsnCode || undefined,
                      defaultMrp,
                      defaultDiscountPercentage,
                      status: row.status,
                    });
                  }
                }

                for (const ids of batchSkus.values()) {
                  if (ids.length < 2) continue;
                  for (const id of ids) {
                    nextErrors[fieldKey(id, "sku")] =
                      "This SKU code already exists. Please update that item or enter a new SKU code";
                  }
                }

                if (payload.length === 0) {
                  if (Object.keys(nextErrors).length === 0) {
                    nextErrors[fieldKey(rows[0].id, "sku")] = "Add at least one item.";
                  }
                }

                if (Object.keys(nextErrors).length > 0) {
                  setErrors(nextErrors);
                  const firstField = Object.keys(nextErrors)[0];
                  focusProblemField(firstField);
                  return;
                }

                setSaving(true);
                setErrors({});
                try {
                  await onSubmit(payload);
                  onClose();
                  setStatusDialog({
                    tone: "success",
                    title: "Catalog items created successfully",
                    description: `${payload.length} item${payload.length === 1 ? "" : "s"} created.`,
                  });
                } catch (err) {
                  const message = err instanceof Error ? err.message : "Failed to create items";
                  const duplicateSkuMatch = message.match(/sku \"(.+)\" already exists/i);
                  if (duplicateSkuMatch?.[1]) {
                    const normalized = duplicateSkuMatch[1].trim().toLowerCase();
                    const row = rows.find((entry) => entry.sku.trim().toLowerCase() === normalized);
                    if (row) {
                      const key = fieldKey(row.id, "sku");
                      setErrors({ [key]: "This SKU code already exists. Please update that item or enter a new SKU code" });
                      focusProblemField(key);
                      return;
                    }
                  }
                  setStatusDialog({ tone: "error", title: "Catalog item creation failed", description: message });
                } finally {
                  setSaving(false);
                }
              }}
            >
              Create items
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
