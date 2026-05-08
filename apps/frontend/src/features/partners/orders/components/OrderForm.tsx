import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { PartnerCatalogItem, PartnerClientBusiness } from "@shared/types/domain";
import { ApiError } from "@shared/api/http";
import { AppButton } from "@shared/ui/atoms/app-button";
import { AppInput } from "@shared/ui/atoms/app-input";
import { FormField } from "@shared/ui/molecules/form-field";
import { EmptyState } from "@shared/ui/molecules/empty-state";
import { ErrorState } from "@shared/ui/molecules/error-state";
import { LoadingState } from "@shared/ui/molecules/loading-state";
import { StatusDialog } from "@shared/ui/molecules/status-dialog";
import { ResourceFormDialog } from "@shared/ui/templates/resource-form-dialog";
import { Card, CardContent } from "@components/ui/card";
import { Select } from "@components/ui/select";
import { Textarea } from "@components/ui/textarea";
import type { CreatePartnerOrderInput, PartnerOrder, UpdatePartnerOrderInput } from "../types";

type OrderFormProps = {
  open: boolean;
  mode?: "create" | "edit";
  order?: PartnerOrder | null;
  businesses: PartnerClientBusiness[];
  catalogItems: PartnerCatalogItem[];
  brandNamesById: Map<number, string>;
  catalogLoading?: boolean;
  catalogError?: string;
  onRetryCatalog?: () => void;
  onClose: () => void;
  onSubmit: (input: CreatePartnerOrderInput | UpdatePartnerOrderInput) => Promise<void>;
};

type DraftLine = {
  id: string;
  itemId: string;
  quantity: string;
};

type FormErrors = Partial<Record<"clientBusinessId" | "clientOutletId" | "sellerMarginPercentage" | "items" | "server", string>>;
type OrderSource = NonNullable<CreatePartnerOrderInput["source"]>;

function makeLine(): DraftLine {
  return { id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, itemId: "", quantity: "" };
}

function digitsOnly(value: string) {
  return value.replace(/\D+/g, "");
}

function percentageOnly(value: string) {
  const cleaned = value.replace(/[^\d.]/g, "");
  const [whole, ...parts] = cleaned.split(".");
  return parts.length > 0 ? `${whole}.${parts.join("").slice(0, 2)}` : whole;
}

function emptyState() {
  return {
    businessId: "",
    outletId: "",
    source: "MANUAL" as OrderSource,
    sellerMarginPercentage: "",
    notes: "",
    lines: [makeLine()],
  };
}

function stateFromOrder(order: PartnerOrder | null | undefined) {
  if (!order) return emptyState();
  const sourceLines = order.requestedItems?.length ? order.requestedItems : order.items;
  return {
    businessId: order.clientBusinessId,
    outletId: order.clientOutletId,
    source: (order.source || "MANUAL") as OrderSource,
    sellerMarginPercentage: String((order.requestedItems?.[0] ?? order.items[0])?.discountPercentage ?? ""),
    notes: order.notes || "",
    lines: sourceLines.map((line) => ({
      id: line.id,
      itemId: line.catalogItemId || line.itemId,
      quantity: String(line.quantity),
    })),
  };
}

function fieldErrorsFromApiError(error: unknown): FormErrors {
  if (error instanceof ApiError && error.fieldErrors.length > 0) {
    return Object.fromEntries(error.fieldErrors.map((item) => [item.field, item.message])) as FormErrors;
  }
  return {};
}

export function OrderForm({
  open,
  mode = "create",
  order,
  businesses,
  catalogItems,
  brandNamesById,
  catalogLoading = false,
  catalogError = "",
  onRetryCatalog,
  onClose,
  onSubmit,
}: OrderFormProps) {
  const [businessId, setBusinessId] = useState("");
  const [outletId, setOutletId] = useState("");
  const [source, setSource] = useState<OrderSource>("MANUAL");
  const [sellerMarginPercentage, setSellerMarginPercentage] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([makeLine()]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [statusDialog, setStatusDialog] = useState<{ tone: "success" | "error"; title: string; description?: string } | null>(null);

  useEffect(() => {
    const next = open ? stateFromOrder(order) : emptyState();
    setBusinessId(next.businessId);
    setOutletId(next.outletId);
    setSource(next.source);
    setSellerMarginPercentage(next.sellerMarginPercentage);
    setNotes(next.notes);
    setLines(next.lines);
    setSaving(false);
    setErrors({});
  }, [open, order]);

  const businessOptions = useMemo(
    () =>
      businesses
        .filter((business) => business.outlets.some((outlet) => outlet.status === "ACTIVE"))
        .map((business) => ({ value: business.id, label: business.businessName })),
    [businesses],
  );
  const outletOptions = useMemo(
    () =>
      (businesses.find((business) => business.id === businessId)?.outlets ?? [])
        .filter((outlet) => outlet.status === "ACTIVE")
        .map((outlet) => ({
          value: outlet.id,
          label: outlet.outletName,
          description: outlet.address?.trim() || "Address not added",
        })),
    [businessId, businesses],
  );
  const itemOptions = useMemo(
    () =>
      catalogItems
        .filter((item) => item.status === "ACTIVE")
        .map((item) => ({
          value: item.id,
          label: [item.name, brandNamesById.get(item.brandId), item.sku].filter(Boolean).join(" · "),
        })),
    [brandNamesById, catalogItems],
  );
  const sourceOptions = [
    { value: "MANUAL", label: "Manual" },
    { value: "WHATSAPP", label: "WhatsApp" },
    { value: "PHONE", label: "Phone call" },
    { value: "EMAIL", label: "Email" },
    { value: "SALES_REP", label: "Sales rep" },
    { value: "OTHER", label: "Other" },
  ];
  useEffect(() => {
    const firstOutlet = outletOptions[0]?.value ?? "";
    setOutletId((prev) => (outletOptions.some((option) => option.value === prev) ? prev : firstOutlet));
  }, [outletOptions]);

  function validate() {
    const nextErrors: FormErrors = {};
    const parsedLines = lines
      .map((line) => ({ itemId: line.itemId, quantity: Number.parseInt(line.quantity, 10) }))
      .filter((line) => line.itemId || Number.isFinite(line.quantity));

    if (!businessId) nextErrors.clientBusinessId = "Select a client.";
    if (!outletId) nextErrors.clientOutletId = "Select an outlet.";
    const parsedSellerMargin = Number.parseFloat(sellerMarginPercentage);
    if (sellerMarginPercentage.trim() === "" || !Number.isFinite(parsedSellerMargin) || parsedSellerMargin < 0 || parsedSellerMargin > 100) {
      nextErrors.sellerMarginPercentage = "Use 0-100.";
    }
    if (parsedLines.length === 0) {
      nextErrors.items = "Add at least one order line.";
    } else if (parsedLines.some((line) => !line.itemId || !Number.isFinite(line.quantity) || line.quantity <= 0)) {
      nextErrors.items = "Each order line needs an item and a positive quantity.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return null;
    return {
      clientBusinessId: businessId,
      clientOutletId: outletId,
      source,
      sellerMarginPercentage: parsedSellerMargin,
      notes: notes.trim() || undefined,
      items: parsedLines.map((line) => ({ itemId: line.itemId, quantity: line.quantity })),
    };
  }

  async function submit() {
    const input = validate();
    if (!input) return;
    setSaving(true);
    setErrors({});
    try {
      await onSubmit(input);
      onClose();
      setStatusDialog({
        tone: "success",
        title: mode === "edit" ? "Order updated successfully" : "Order created successfully",
      });
    } catch (err) {
      const fieldErrors = fieldErrorsFromApiError(err);
      const message = err instanceof Error ? err.message : mode === "edit" ? "Failed to update order" : "Failed to create order";
      setErrors({
        ...fieldErrors,
        server: undefined,
      });
      if (Object.keys(fieldErrors).length === 0) {
        setStatusDialog({
          tone: "error",
          title: mode === "edit" ? "Order update failed" : "Order creation failed",
          description: message,
        });
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <ResourceFormDialog
        open={open}
        onClose={onClose}
        title={mode === "edit" ? "Edit order" : "Create order"}
        className="md:w-[46vw] lg:max-w-[46vw]"
        bodyClassName="h-full px-0 py-0"
      >
      <div className="flex h-[calc(100vh-73px)] flex-col bg-slate-50/80">
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <div className="grid gap-5">
            <Card className="overflow-hidden rounded-3xl border-slate-200/90 shadow-sm">
              <CardContent className="space-y-5 bg-white p-5">
                <div className="grid gap-4 xl:grid-cols-2">
                  <FormField label="Client" error={errors.clientBusinessId} className="content-start" required>
                    <Select id="order-business" value={businessId} onValueChange={setBusinessId} options={businessOptions} disabled={saving} searchable searchPlaceholder="Search clients" />
                  </FormField>
                  <FormField label="Outlet" error={errors.clientOutletId} className="content-start" required>
                    <Select id="order-outlet" value={outletId} onValueChange={setOutletId} options={outletOptions} disabled={saving || !businessId} searchable searchPlaceholder="Search outlets" />
                  </FormField>
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                  <FormField label="Order source" className="content-start" required>
                    <Select id="order-source" value={source} onValueChange={(value) => setSource(value as OrderSource)} options={sourceOptions} disabled={saving} />
                  </FormField>
                  <FormField label="Seller Margin (%)" error={errors.sellerMarginPercentage} className="content-start" required>
                    <AppInput
                      inputMode="decimal"
                      value={sellerMarginPercentage}
                      disabled={saving}
                      onChange={(event) => setSellerMarginPercentage(percentageOnly(event.target.value))}
                    />
                  </FormField>
                </div>

                <FormField label="Notes" htmlFor="order-notes">
                  <Textarea
                    id="order-notes"
                    value={notes}
                    disabled={saving}
                    placeholder="Optional internal context for fulfillment."
                    onChange={(event) => setNotes(event.target.value)}
                    className="min-h-[112px] rounded-2xl border-slate-200 bg-white px-4 py-3 text-[15px]"
                  />
                </FormField>
              </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-3xl border-slate-200/90 shadow-sm">
              <CardContent className="bg-white p-5">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Order lines</p>
                  {errors.items ? <p className="mt-1 text-sm text-rose-600">{errors.items}</p> : null}
                </div>
                <AppButton
                  variant="outline"
                  className="h-9 px-3 text-sm"
                  disabled={saving || catalogLoading || itemOptions.length === 0}
                  onClick={() => setLines((prev) => [...prev, makeLine()])}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add line
                </AppButton>
              </div>

              {catalogLoading ? <LoadingState label="Loading catalog items..." /> : null}
              {catalogError ? <ErrorState title="Catalog unavailable" message={catalogError} onRetry={onRetryCatalog} /> : null}
              {!catalogLoading && !catalogError && itemOptions.length === 0 ? (
                <EmptyState>Add active catalog items before creating orders.</EmptyState>
              ) : null}

              <div className="grid gap-3">
                {lines.map((line, index) => (
                  <div key={line.id} className="grid min-w-0 gap-2 rounded-lg border border-slate-200 p-3 md:grid-cols-[minmax(0,1fr)_140px_auto]">
                    <FormField label={`Item ${index + 1}`} className="min-w-0">
                      <Select
                        value={line.itemId}
                        disabled={saving || catalogLoading || itemOptions.length === 0}
                        onValueChange={(value) => {
                          setLines((prev) => prev.map((item) => (item.id === line.id ? { ...item, itemId: value } : item)));
                        }}
                        options={itemOptions}
                        className="min-w-0"
                        searchable
                        searchPlaceholder="Search items"
                      />
                    </FormField>
                    <FormField label="Quantity" className="min-w-0">
                      <AppInput
                        inputMode="numeric"
                        value={line.quantity}
                        disabled={saving}
                        onChange={(event) => {
                          setLines((prev) => prev.map((item) => (item.id === line.id ? { ...item, quantity: digitsOnly(event.target.value) } : item)));
                        }}
                      />
                    </FormField>
                    <div className="flex items-end">
                      <AppButton
                        variant="ghost"
                        className="h-11 px-2 text-rose-600 hover:bg-rose-50"
                        disabled={saving || lines.length === 1}
                        aria-label={`Remove line ${index + 1}`}
                        onClick={() => setLines((prev) => prev.filter((item) => item.id !== line.id))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </AppButton>
                    </div>
                  </div>
                ))}
              </div>
              </CardContent>
            </Card>

          </div>
        </div>

        <div className="sticky bottom-0 z-20 border-t border-slate-200 bg-white/95 px-5 py-4 backdrop-blur sm:px-6">
          <div className="flex justify-end">
            <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row sm:justify-end">
              <AppButton variant="ghost" className="h-11 w-full rounded-2xl px-5 text-sm font-medium whitespace-nowrap sm:w-auto" disabled={saving} onClick={onClose}>
                Cancel
              </AppButton>
              <AppButton className="h-11 w-full rounded-2xl px-6 text-sm font-semibold whitespace-nowrap shadow-lg shadow-brand-500/20 sm:w-auto sm:min-w-[156px]" disabled={saving} onClick={() => void submit()}>
                {saving ? (mode === "edit" ? "Saving..." : "Creating...") : mode === "edit" ? "Save Changes" : "Create Order"}
              </AppButton>
            </div>
          </div>
        </div>
      </div>
      </ResourceFormDialog>
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
