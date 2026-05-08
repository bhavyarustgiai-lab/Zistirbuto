import { useEffect, useMemo, useState } from "react";
import type { PartnerFirm } from "@shared/types/domain";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { Command } from "@components/ui/command";
import { Input } from "@components/ui/input";
import { Select } from "@components/ui/select";
import { Textarea } from "@components/ui/textarea";
import { ApiError } from "@shared/api/http";
import { getPhoneValidationMessage, isValidPhoneLocalNumber, parsePhoneValue } from "@shared/lib/phone";
import { FormRow } from "@shared/ui/molecules/FormRow";
import { PhoneInput } from "@shared/ui/molecules/PhoneInput";
import { StatusDialog } from "@shared/ui/molecules/status-dialog";
import { CITIES_LIST } from "../../../constants/cities";

type FirmProfileValues = {
  name: string;
  tradeName: string;
  gstin: string;
  billingAddress: string;
  city: string;
  ownerName: string;
  phone: string;
  email: string;
};

type FirmProfileSubmitValues = FirmProfileValues & {
  status?: "ACTIVE" | "INACTIVE";
};

type Props = {
  title: string;
  description: string;
  submitLabel: string;
  saving?: boolean;
  initialValues?: Partial<PartnerFirm>;
  showStatus?: boolean;
  showHeader?: boolean;
  onSubmit: (values: FirmProfileSubmitValues) => Promise<void>;
};

const GSTIN_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

function getInitialValues(initialValues?: Partial<PartnerFirm>): FirmProfileValues {
  return {
    name: initialValues?.name ?? "",
    tradeName: initialValues?.tradeName ?? "",
    gstin: initialValues?.gstin ?? "",
    billingAddress: initialValues?.billingAddress ?? "",
    city: initialValues?.city ?? "",
    ownerName: initialValues?.ownerName ?? "",
    phone: initialValues?.phone ?? "",
    email: initialValues?.email ?? "",
  };
}

function FieldError({ message }: { message?: string }) {
  return (
    <div className="min-h-[1.25rem] pt-1">
      {message ? <p className="text-xs text-rose-600">{message}</p> : null}
    </div>
  );
}

function getGSTINError(gstin: string) {
  const value = gstin.trim().toUpperCase();
  if (!value) return "";
  if (value.length !== 15) return "GSTIN must be exactly 15 characters.";
  if (!GSTIN_PATTERN.test(value)) return "Enter a valid GSTIN, for example 24AAAGM0289C1ZP.";
  return "";
}

type SubmitError =
  | { field: keyof FirmProfileValues; message: string }
  | { field?: never; message: string };

function getSubmitError(error: unknown): SubmitError {
  if (error instanceof ApiError) {
    const fieldError = error.fieldErrors.find((item) => item.field in getInitialValues());
    if (fieldError) {
      return { field: fieldError.field as keyof FirmProfileValues, message: fieldError.message };
    }
    return { message: error.message };
  }
  if (error instanceof Error) {
    return { message: error.message };
  }
  return { message: "Could not save firm. Please try again." };
}

export function FirmProfileForm({
  title,
  description,
  submitLabel,
  saving = false,
  initialValues,
  showStatus = false,
  showHeader = true,
  onSubmit,
}: Props) {
  const [form, setForm] = useState<FirmProfileValues>(() => getInitialValues(initialValues));
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">(initialValues?.status ?? "ACTIVE");
  const [errors, setErrors] = useState<Partial<Record<keyof FirmProfileValues, string>>>({});
  const [statusDialog, setStatusDialog] = useState<{ tone: "success" | "error"; title: string; description?: string } | null>(null);
  const [cityQuery, setCityQuery] = useState(() => getInitialValues(initialValues).city);

  useEffect(() => {
    const nextValues = getInitialValues(initialValues);
    setForm(nextValues);
    setStatus(initialValues?.status ?? "ACTIVE");
    setCityQuery(nextValues.city);
    setErrors({});
  }, [initialValues]);

  const cityOptions = useMemo(() => {
    const query = cityQuery.trim().toLowerCase();
    const filtered = query
      ? CITIES_LIST.filter((city) => city.toLowerCase().includes(query))
      : CITIES_LIST;
    return filtered.slice(0, 100).map((city) => ({ value: city, label: city }));
  }, [cityQuery]);

  function updateField<K extends keyof FirmProfileValues>(key: K, value: FirmProfileValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate() {
    const nextErrors: Partial<Record<keyof FirmProfileValues, string>> = {};
    if (!form.name.trim()) nextErrors.name = "Firm name is required.";
    const gstinError = getGSTINError(form.gstin);
    if (gstinError) nextErrors.gstin = gstinError;
    if (!form.billingAddress.trim()) nextErrors.billingAddress = "Billing address is required.";
    if (!form.city.trim()) nextErrors.city = "City is required.";
    if (!form.ownerName.trim()) nextErrors.ownerName = "POC name is required.";
    const parsedPhone = parsePhoneValue(form.phone);
    if (!isValidPhoneLocalNumber(parsedPhone.country, parsedPhone.localNumber)) {
      nextErrors.phone = getPhoneValidationMessage(parsedPhone.country);
    }
    if (!form.email.trim()) nextErrors.email = "Email is required.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  return (
    <div className="w-full">
      <Card>
        {showHeader ? (
          <CardHeader>
            <CardTitle className="text-xl">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
        ) : null}
        <CardContent className={showHeader ? "grid gap-4 pt-0" : "grid gap-4"}>
          <div className="grid gap-4 md:grid-cols-2">
            <FormRow label="Firm name *">
              <Input value={form.name} onChange={(event) => updateField("name", event.target.value)} placeholder="e.g. Shree Shyam Corporation" />
              <FieldError message={errors.name} />
            </FormRow>
            <FormRow label="Trade name">
              <Input value={form.tradeName} onChange={(event) => updateField("tradeName", event.target.value)} placeholder="Optional market-facing name" />
              <FieldError />
            </FormRow>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormRow label="GSTIN">
              <Input
                value={form.gstin}
                maxLength={15}
                onChange={(event) => updateField("gstin", event.target.value.toUpperCase().replace(/[^0-9A-Z]/g, ""))}
                placeholder="15-character GSTIN"
              />
              <FieldError message={errors.gstin} />
            </FormRow>
            {showStatus ? (
              <FormRow label="Status">
                <Select
                  value={status}
                  onValueChange={(value) => setStatus(value as "ACTIVE" | "INACTIVE")}
                  options={[
                    { value: "ACTIVE", label: "Active" },
                    { value: "INACTIVE", label: "Inactive" },
                  ]}
                />
                <FieldError />
              </FormRow>
            ) : null}
          </div>

          <FormRow label="Billing address *">
            <Textarea value={form.billingAddress} onChange={(event) => updateField("billingAddress", event.target.value)} placeholder="Street, area, landmark" />
            <FieldError message={errors.billingAddress} />
          </FormRow>

          <FormRow label="City *">
            <Command
              value={cityQuery}
              onValueChange={(value) => {
                setCityQuery(value);
                if (!value.trim()) {
                  updateField("city", "");
                }
              }}
              onSelect={(value) => {
                setCityQuery(value);
                updateField("city", value);
              }}
              items={cityOptions}
              placeholder="Search city"
              emptyText="No matching cities"
            />
            <FieldError message={errors.city} />
          </FormRow>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,1.15fr)_minmax(0,1fr)]">
            <FormRow label="POC Name *">
              <Input value={form.ownerName} onChange={(event) => updateField("ownerName", event.target.value)} placeholder="e.g. Kevin Arora" />
              <FieldError message={errors.ownerName} />
            </FormRow>
            <FormRow label="POC Phone *">
              <PhoneInput value={form.phone} onChange={(value) => updateField("phone", value)} placeholder="Phone number" />
              <FieldError message={errors.phone} />
            </FormRow>
            <FormRow label="POC Email *">
              <Input type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} placeholder="business@example.com" />
              <FieldError message={errors.email} />
            </FormRow>
          </div>

          <div className="flex justify-end">
            <Button
              className="h-11 px-5 text-sm"
              disabled={saving}
              onClick={async () => {
                if (!validate()) return;
                const values: FirmProfileSubmitValues = {
                  ...form,
                  name: form.name.trim(),
                  tradeName: form.tradeName.trim(),
                  gstin: form.gstin.trim(),
                  billingAddress: form.billingAddress.trim(),
                  city: form.city.trim(),
                  ownerName: form.ownerName.trim(),
                  phone: form.phone.trim(),
                  email: form.email.trim(),
                };
                if (showStatus) {
                  values.status = status;
                }
                try {
                  await onSubmit(values);
                  setStatusDialog({ tone: "success", title: "Firm profile saved successfully" });
                } catch (error) {
                  const nextError = getSubmitError(error);
                  if (nextError.field) {
                    setErrors((prev) => ({ ...prev, [nextError.field]: nextError.message }));
                  } else {
                    setStatusDialog({ tone: "error", title: "Firm profile save failed", description: nextError.message });
                  }
                }
              }}
            >
              {submitLabel}
            </Button>
          </div>
        </CardContent>
      </Card>
      <StatusDialog
        open={Boolean(statusDialog)}
        tone={statusDialog?.tone ?? "success"}
        title={statusDialog?.title ?? ""}
        description={statusDialog?.description}
        onClose={() => setStatusDialog(null)}
      />
    </div>
  );
}
