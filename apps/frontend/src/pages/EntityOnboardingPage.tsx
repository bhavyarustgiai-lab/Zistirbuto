import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Image, MapPin, Plus, Upload, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "@app/providers/AppStateProvider";
import type { ClientType } from "@shared/types/domain";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { Input } from "@components/ui/input";
import { Select } from "@components/ui/select";
import { Textarea } from "@components/ui/textarea";
import { getPhoneValidationMessage, isValidPhoneLocalNumber, parsePhoneValue } from "@shared/lib/phone";
import { PhoneInput } from "@shared/ui/molecules/PhoneInput";

const mapBoxWidth = 640;
const mapBoxHeight = 260;

function toLatLng(x: number, y: number) {
  const lat = Number((20 + (1 - y / mapBoxHeight) * 12).toFixed(5));
  const lng = Number((72 + (x / mapBoxWidth) * 12).toFixed(5));
  return { lat, lng };
}

export function EntityOnboardingPage() {
  const { createEntity, clients } = useAppState();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  const [ownerName, setOwnerName] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [entityType, setEntityType] = useState<ClientType>("SALON");
  const [entityName, setEntityName] = useState("");
  const [entityAddress, setEntityAddress] = useState("");
  const [mapPoint, setMapPoint] = useState<{ x: number; y: number } | null>(null);
  const [images, setImages] = useState<Array<{ name: string; previewUrl: string }>>([]);
  const [errors, setErrors] = useState<{
    ownerName?: string;
    ownerPhone?: string;
    entityType?: string;
    entityName?: string;
    entityAddress?: string;
    location?: string;
  }>({});

  const latLng = useMemo(() => {
    if (!mapPoint) return null;
    return toLatLng(mapPoint.x, mapPoint.y);
  }, [mapPoint]);

  useEffect(() => {
    return () => {
      for (const image of images) {
        URL.revokeObjectURL(image.previewUrl);
      }
    };
  }, [images]);

  function validateOwnerStep() {
    const nextErrors: typeof errors = {};
    if (!ownerName.trim()) nextErrors.ownerName = "Owner name is required.";
    const parsedPhone = parsePhoneValue(ownerPhone);
    if (!isValidPhoneLocalNumber(parsedPhone.country, parsedPhone.localNumber)) {
      nextErrors.ownerPhone = getPhoneValidationMessage(parsedPhone.country);
    }
    setErrors((prev) => ({ ...prev, ...nextErrors }));
    return Object.keys(nextErrors).length === 0;
  }

  function validateEntityStep() {
    const nextErrors: typeof errors = {};
    if (!entityType) nextErrors.entityType = "Entity type is required.";
    if (!entityName.trim()) nextErrors.entityName = "Entity name is required.";
    if (!entityAddress.trim()) nextErrors.entityAddress = "Entity address is required.";
    if (!latLng) nextErrors.location = "Mark your entity location on the map.";
    setErrors((prev) => ({ ...prev, ...nextErrors }));
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validateEntityStep() || !latLng) return;

    setSaving(true);
    try {
      await createEntity({
        ownerName: ownerName.trim(),
        ownerPhone: ownerPhone.trim(),
        clientType: entityType,
        name: entityName.trim(),
        address: entityAddress.trim(),
        location: latLng,
        images: images.map((item) => item.name)
      });
      navigate("/clients/appointments", { replace: true });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-6xl py-6">
      <Card className="mb-4">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-2xl">Onboard Your Entity</CardTitle>
            <CardDescription>
              {clients.length === 0
                ? "You are not mapped to any entity yet. Add your first business and owner details."
                : "Add another entity for your account and start managing appointments instantly."}
            </CardDescription>
          </div>
          <Badge tone="neutral" className="px-3 py-1">Step {step} of 2</Badge>
        </CardHeader>
      </Card>

      {step === 1 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Entity Owner</CardTitle>
            <CardDescription>Tell us who owns and manages this entity.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="mb-1 text-sm text-slate-600">Owner name *</p>
              <Input
                value={ownerName}
                onChange={(event) => {
                  setOwnerName(event.target.value);
                  setErrors((prev) => ({ ...prev, ownerName: undefined }));
                }}
                placeholder="e.g. Kevin Arora"
              />
              {errors.ownerName ? <p className="mt-1 text-xs text-rose-600">{errors.ownerName}</p> : null}
            </div>
            <div>
              <p className="mb-1 text-sm text-slate-600">Owner phone *</p>
              <PhoneInput
                value={ownerPhone}
                onChange={(value) => {
                  setOwnerPhone(value);
                  setErrors((prev) => ({ ...prev, ownerPhone: undefined }));
                }}
                placeholder="Phone number"
              />
              {errors.ownerPhone ? <p className="mt-1 text-xs text-rose-600">{errors.ownerPhone}</p> : null}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Entity Details</CardTitle>
              <CardDescription>Tell us what business you run.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <p className="mb-1 text-sm text-slate-600">Entity type *</p>
                  <Select
                    value={entityType}
                    onValueChange={(value) => {
                      setEntityType(value as ClientType);
                      setErrors((prev) => ({ ...prev, entityType: undefined }));
                    }}
                    options={[
                      { value: "SALON", label: "Salon" },
                      { value: "SPA", label: "Spa" },
                      { value: "FITNESS", label: "Fitness" }
                    ]}
                  />
                  {errors.entityType ? <p className="mt-1 text-xs text-rose-600">{errors.entityType}</p> : null}
                </div>
                <div>
                  <p className="mb-1 text-sm text-slate-600">Entity name *</p>
                  <Input
                    value={entityName}
                    onChange={(event) => {
                      setEntityName(event.target.value);
                      setErrors((prev) => ({ ...prev, entityName: undefined }));
                    }}
                    placeholder="e.g. Serenity Spa & Wellness"
                  />
                  {errors.entityName ? <p className="mt-1 text-xs text-rose-600">{errors.entityName}</p> : null}
                </div>
              </div>

              <div>
                <p className="mb-1 text-sm text-slate-600">Entity address *</p>
                <Textarea
                  value={entityAddress}
                  onChange={(event) => {
                    setEntityAddress(event.target.value);
                    setErrors((prev) => ({ ...prev, entityAddress: undefined }));
                  }}
                  placeholder="Street, area, city, state, postal code"
                />
                {errors.entityAddress ? <p className="mt-1 text-xs text-rose-600">{errors.entityAddress}</p> : null}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Location & Setup</CardTitle>
              <CardDescription>Pin your business and upload setup images.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div>
                <p className="mb-1 text-sm text-slate-600">Mark entity location *</p>
                <div
                  className="relative h-[260px] w-full rounded-xl border border-slate-300 bg-slate-50"
                  style={{
                    backgroundImage:
                      "linear-gradient(to right, rgba(148,163,184,.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,.2) 1px, transparent 1px)",
                    backgroundSize: "28px 28px"
                  }}
                  onClick={(event) => {
                    const rect = event.currentTarget.getBoundingClientRect();
                    const x = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
                    const y = Math.max(0, Math.min(rect.height, event.clientY - rect.top));
                    setMapPoint({ x, y });
                    setErrors((prev) => ({ ...prev, location: undefined }));
                  }}
                >
                  {mapPoint ? (
                    <div
                      className="absolute -translate-x-1/2 -translate-y-full text-brand-600"
                      style={{ left: mapPoint.x, top: mapPoint.y }}
                    >
                      <MapPin className="h-7 w-7 fill-current" />
                    </div>
                  ) : null}
                  <div className="absolute bottom-3 left-3 rounded-md bg-white/90 px-2 py-1 text-xs text-slate-600">
                    Click anywhere to mark location
                  </div>
                  {latLng ? (
                    <div className="absolute bottom-3 right-3 rounded-md bg-white/90 px-2 py-1 text-xs text-slate-600">
                      {latLng.lat}, {latLng.lng}
                    </div>
                  ) : null}
                </div>
                {errors.location ? <p className="mt-1 text-xs text-rose-600">{errors.location}</p> : null}
              </div>

              <div>
                <p className="mb-1 text-sm text-slate-600">Entity images</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    const files = Array.from(event.target.files ?? []);
                    const next = files.map((file) => ({
                      name: file.name,
                      previewUrl: URL.createObjectURL(file)
                    }));
                    setImages((prev) => [...prev, ...next]);
                    event.currentTarget.value = "";
                  }}
                />
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Image className="h-4 w-4" />
                      Upload entity setup images
                    </div>
                    <Button variant="outline" className="h-9" onClick={() => fileInputRef.current?.click()}>
                      <Upload className="mr-1 h-4 w-4" />
                      Choose Images
                    </Button>
                  </div>
                  {images.length > 0 ? (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {images.map((image) => (
                        <div key={`${image.name}-${image.previewUrl}`} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-2 text-sm">
                          <img
                            src={image.previewUrl}
                            alt={image.name}
                            className="h-14 w-14 rounded-md object-cover"
                          />
                          <span className="min-w-0 flex-1 truncate text-slate-700">{image.name}</span>
                          <Button
                            variant="ghost"
                            className="h-7 w-7 rounded-md p-0"
                            onClick={() => {
                              setImages((prev) => {
                                const target = prev.find((item) => item.previewUrl === image.previewUrl);
                                if (target) {
                                  URL.revokeObjectURL(target.previewUrl);
                                }
                                return prev.filter((item) => item.previewUrl !== image.previewUrl);
                              });
                            }}
                            aria-label="Remove image"
                          >
                            <X className="h-4 w-4 text-slate-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="mt-4">
        <CardContent className="flex items-center justify-end gap-2 py-4">
          {step === 2 ? (
            <Button variant="outline" onClick={() => setStep(1)}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
          ) : clients.length > 0 ? (
            <Button variant="outline" onClick={() => navigate(-1)}>
              Cancel
            </Button>
          ) : null}

          {step === 1 ? (
            <Button
              onClick={() => {
                if (!validateOwnerStep()) return;
                setStep(2);
              }}
            >
              Next
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={saving}>
              <Plus className="mr-1 h-4 w-4" />
              {saving ? "Saving..." : "Create Entity"}
            </Button>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
