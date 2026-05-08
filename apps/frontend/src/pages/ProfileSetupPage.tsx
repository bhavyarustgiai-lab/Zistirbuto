import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarHeart } from "lucide-react";
import { useAppState } from "@app/providers/AppStateProvider";
import { useToast } from "@app/ToastProvider";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Input } from "@components/ui/input";
import { cn } from "@shared/lib/cn";

export function ProfileSetupPage() {
  const navigate = useNavigate();
  const { currentUser, updateProfile } = useAppState();
  const { push } = useToast();
  const [name, setName] = useState(currentUser?.name ?? "");
  const [birthDate, setBirthDate] = useState(currentUser?.birthDate ?? "");
  const [errors, setErrors] = useState<{ name?: string; birthDate?: string }>({});
  const [shakeField, setShakeField] = useState<{ name: boolean; birthDate: boolean }>({
    name: false,
    birthDate: false,
  });
  const [submitting, setSubmitting] = useState(false);

  function triggerShake(field: "name" | "birthDate") {
    setShakeField((prev) => ({ ...prev, [field]: false }));
    window.requestAnimationFrame(() => {
      setShakeField((prev) => ({ ...prev, [field]: true }));
      window.setTimeout(() => {
        setShakeField((prev) => ({ ...prev, [field]: false }));
      }, 600);
    });
  }

  function validate() {
    const nextErrors: { name?: string; birthDate?: string } = {};
    if (!name.trim()) {
      nextErrors.name = "Full name is required.";
    }
    setErrors(nextErrors);
    if (nextErrors.name) {
      triggerShake("name");
    }
    return Object.keys(nextErrors).length === 0;
  }

  return (
    <section className="grid min-h-screen place-items-center bg-[#f4f5f8] p-6">
      <Card className="w-full max-w-md border-slate-200 shadow-sm">
        <CardHeader className="p-6 pb-2">
          <div className="mb-3 flex items-center gap-2 text-slate-900">
            <div className="rounded-xl bg-brand-500 p-2 text-white">
              <CalendarHeart className="h-5 w-5" />
            </div>
            <span className="text-xl font-semibold">Zistributo</span>
          </div>
          <CardTitle className="text-2xl tracking-tight text-slate-950">
            Complete sign up
          </CardTitle>
          <p className="text-sm text-slate-500">
            Add your name and date of birth to continue.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 p-6">
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium text-slate-700">Phone *</span>
            <Input value={currentUser?.phone ?? ""} disabled className="h-11 rounded-2xl" />
          </label>

          <label className="grid gap-1.5 text-sm">
            <span className="font-medium text-slate-700">Full name *</span>
            <Input
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                if (errors.name) {
                  setErrors((prev) => ({ ...prev, name: undefined }));
                }
              }}
              placeholder="Enter your full name"
              className={cn(
                "h-11 rounded-2xl",
                errors.name ? "border-rose-500 ring-rose-500/20" : undefined,
                shakeField.name ? "field-shake" : undefined,
              )}
              disabled={submitting}
              aria-invalid={Boolean(errors.name)}
            />
            {errors.name ? <p className="text-xs text-rose-600">{errors.name}</p> : null}
          </label>

          <label className="grid gap-1.5 text-sm">
            <span className="font-medium text-slate-700">Birth date (optional)</span>
            <Input
              type="date"
              value={birthDate}
              onChange={(event) => {
                setBirthDate(event.target.value);
                if (errors.birthDate) {
                  setErrors((prev) => ({ ...prev, birthDate: undefined }));
                }
              }}
              className={cn(
                "h-11 rounded-2xl",
                errors.birthDate ? "border-rose-500 ring-rose-500/20" : undefined,
                shakeField.birthDate ? "field-shake" : undefined,
              )}
              disabled={submitting}
              aria-invalid={Boolean(errors.birthDate)}
            />
            {errors.birthDate ? <p className="text-xs text-rose-600">{errors.birthDate}</p> : null}
          </label>

          <Button
            disabled={submitting}
            className="h-11 rounded-2xl"
            onClick={async () => {
              if (!validate()) {
                return;
              }
              setSubmitting(true);
              try {
                await updateProfile({ name, birthDate });
                navigate("/partners", { replace: true });
              } catch (error) {
                const message = error instanceof Error ? error.message : "Unknown error";
                const nextErrors: { name?: string; birthDate?: string } = {};
                if (message.toLowerCase().includes("name")) {
                  nextErrors.name = message;
                  triggerShake("name");
                }
                if (message.toLowerCase().includes("birthdate")) {
                  nextErrors.birthDate = message;
                  triggerShake("birthDate");
                }
                if (nextErrors.name || nextErrors.birthDate) {
                  setErrors(nextErrors);
                }
                push({
                  title: "Unable to complete sign up",
                  description: message,
                  tone: "error",
                });
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {submitting ? "Saving..." : "Continue"}
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
