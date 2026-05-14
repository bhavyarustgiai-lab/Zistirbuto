import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarHeart } from "lucide-react";
import { useAppState } from "@app/providers/AppStateProvider";
import { useToast } from "@app/ToastProvider";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Input } from "@components/ui/input";
import { cn } from "@shared/lib/cn";
import {
  getPhoneValidationMessage,
  isValidPhoneValue,
  parsePhoneValue,
} from "@shared/lib/phone";
import { PhoneInput } from "@shared/ui/molecules/PhoneInput";

type FieldErrors = {
  phone?: string;
  otp?: string;
  form?: string;
};

function normalizeOtp(value: string) {
  return value.replace(/\D/g, "").slice(0, 6);
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Something went wrong, please try again later";
}

export function OtpSignInCard() {
  const navigate = useNavigate();
  const { requestLoginOtp, verifyLoginOtp } = useAppState();
  const { push } = useToast();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [mockOtp, setMockOtp] = useState("");
  const [otpRequested, setOtpRequested] = useState(false);
  const [otpExpiresAt, setOtpExpiresAt] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const expiresAtMs = useMemo(() => {
    if (!otpExpiresAt) return 0;
    const next = new Date(otpExpiresAt).getTime();
    return Number.isNaN(next) ? 0 : next;
  }, [otpExpiresAt]);

  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!otpRequested || !expiresAtMs) {
      return;
    }
    setNowMs(Date.now());
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => window.clearInterval(timer);
  }, [expiresAtMs, otpRequested]);

  const remainingSeconds =
    otpRequested && expiresAtMs
      ? Math.max(0, Math.ceil((expiresAtMs - nowMs) / 1000))
      : 0;
  const isOtpExpired = otpRequested && remainingSeconds === 0;
  const remainingMinutes = String(Math.floor(remainingSeconds / 60)).padStart(
    2,
    "0",
  );
  const remainingDisplaySeconds = String(remainingSeconds % 60).padStart(
    2,
    "0",
  );

  const resetOtpStep = () => {
    setOtpRequested(false);
    setOtp("");
    setMockOtp("");
    setOtpExpiresAt("");
    setErrors({});
    setNowMs(Date.now());
  };

  const requestOtp = async () => {
    if (!isValidPhoneValue(phone)) {
      const parsedPhone = parsePhoneValue(phone);
      setErrors({
        phone: getPhoneValidationMessage(parsedPhone.country),
      });
      push({
        title: "Unable to send OTP",
        description: getPhoneValidationMessage(parsedPhone.country),
        tone: "error",
      });
      return;
    }

    setSubmitting(true);
    setErrors({});
    try {
      const result = await requestLoginOtp({ phone });
      setOtpRequested(true);
      setOtpExpiresAt(result.expiresAt);
      setNowMs(Date.now());
      if (result.otp) {
        setMockOtp(result.otp);
        setOtp(result.otp);
      } else {
        setMockOtp("");
        setOtp("");
      }
      push({
        title: "OTP sent",
        description: "Check your SMS inbox to continue.",
        tone: "success",
      });
    } catch (error) {
      const message = getErrorMessage(error);
      setErrors({ form: message });
      push({
        title: "Unable to send OTP",
        description: message,
        tone: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const verifyOtp = async () => {
    const trimmedOtp = otp.trim();
    if (!trimmedOtp) {
      setErrors({ otp: "OTP is required." });
      push({
        title: "Unable to verify OTP",
        description: "OTP is required.",
        tone: "error",
      });
      return;
    }
    if (trimmedOtp.length < 4) {
      setErrors({ otp: "OTP must have at least 4 digits." });
      push({
        title: "Unable to verify OTP",
        description: "OTP must have at least 4 digits.",
        tone: "error",
      });
      return;
    }
    if (isOtpExpired) {
      setErrors({ otp: "OTP has expired. Request a new code to continue." });
      push({
        title: "Unable to verify OTP",
        description: "OTP has expired. Request a new code to continue.",
        tone: "error",
      });
      return;
    }

    setSubmitting(true);
    setErrors({});
    try {
      await verifyLoginOtp({ phone, otp: trimmedOtp });
      push({
        title: "Signed in",
        description: "Session started successfully.",
        tone: "success",
      });
      navigate("/partners", { replace: true });
    } catch (error) {
      const message = getErrorMessage(error);
      setErrors({ otp: message });
      push({
        title: "Unable to verify OTP",
        description: message,
        tone: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md border-slate-200 shadow-sm">
      <CardHeader className="p-6 pb-2">
        <div className="mb-3 flex items-center gap-2 text-slate-900">
          <div className="rounded-xl bg-brand-500 p-2 text-white">
            <CalendarHeart className="h-5 w-5" />
          </div>
          <span className="text-xl font-semibold">Zistributo</span>
        </div>
        <CardTitle className="text-2xl tracking-tight text-slate-950">
          Sign in
        </CardTitle>
        <p className="text-sm text-slate-500">
          Enter your mobile number to receive a one-time password.
        </p>
      </CardHeader>
      <CardContent className="grid gap-4 p-6">
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium text-slate-700">Phone</span>
          <PhoneInput
            value={phone}
            onChange={(nextPhone) => {
              setPhone(nextPhone);
              if (errors.phone || errors.form) {
                setErrors((prev) => ({
                  ...prev,
                  phone: undefined,
                  form: undefined,
                }));
              }
            }}
            placeholder="Phone number"
            disabled={submitting || otpRequested}
          />
          {errors.phone ? (
            <p className="text-xs text-rose-600">{errors.phone}</p>
          ) : null}
        </label>

        {otpRequested ? (
          <>
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-slate-700">OTP</span>
              <Input
                value={otp}
                onChange={(event) => {
                  setOtp(normalizeOtp(event.target.value));
                  if (errors.otp || errors.form) {
                    setErrors((prev) => ({
                      ...prev,
                      otp: undefined,
                      form: undefined,
                    }));
                  }
                }}
                placeholder="Enter OTP"
                inputMode="numeric"
                autoComplete="one-time-code"
                className={cn(
                  "h-11 rounded-2xl",
                  errors.otp ? "border-rose-500 ring-rose-500/20" : undefined,
                )}
                disabled={submitting}
                aria-invalid={Boolean(errors.otp)}
              />
              {errors.otp ? (
                <p className="text-xs text-rose-600">{errors.otp}</p>
              ) : null}
            </label>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <span>
                {isOtpExpired
                  ? `OTP for ${phone} has expired.`
                  : `OTP sent to ${phone}. Expires in ${remainingMinutes}:${remainingDisplaySeconds}.`}
              </span>
              {mockOtp ? <Badge tone="active">Mock OTP: {mockOtp}</Badge> : null}
            </div>
          </>
        ) : null}

        {errors.form ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {errors.form}
          </p>
        ) : null}

        <Button
          disabled={submitting}
          className="h-11 rounded-2xl"
          onClick={() => {
            if (!otpRequested || isOtpExpired) {
              void requestOtp();
              return;
            }
            void verifyOtp();
          }}
        >
          {submitting
            ? otpRequested && !isOtpExpired
              ? "Verifying..."
              : "Sending OTP..."
            : otpRequested
              ? isOtpExpired
                ? "Request New OTP"
                : "Verify OTP"
              : "Send OTP"}
        </Button>

        {otpRequested ? (
          <button
            type="button"
            className="text-sm font-medium text-brand-600"
            disabled={submitting}
            onClick={resetOtpStep}
          >
            Change mobile number
          </button>
        ) : null}
      </CardContent>
    </Card>
  );
}
