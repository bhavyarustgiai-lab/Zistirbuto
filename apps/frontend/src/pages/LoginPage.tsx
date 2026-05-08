import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarHeart } from "lucide-react";
import { useAppState } from "@app/providers/AppStateProvider";
import { useToast } from "@app/ToastProvider";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Input } from "@components/ui/input";
import { getPhoneValidationMessage, isValidPhoneValue, parsePhoneValue } from "@shared/lib/phone";
import { PhoneInput } from "@shared/ui/molecules/PhoneInput";

export function LoginPage() {
  const navigate = useNavigate();
  const { requestLoginOtp, verifyLoginOtp } = useAppState();
  const { push } = useToast();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpRequested, setOtpRequested] = useState(false);
  const [otpExpiresAt, setOtpExpiresAt] = useState("");
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

  const remainingSeconds = otpRequested && expiresAtMs ? Math.max(0, Math.ceil((expiresAtMs - nowMs) / 1000)) : 0;
  const isOtpExpired = otpRequested && remainingSeconds === 0;
  const remainingMinutes = String(Math.floor(remainingSeconds / 60)).padStart(2, "0");
  const remainingDisplaySeconds = String(remainingSeconds % 60).padStart(2, "0");

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
            Sign in
          </CardTitle>
          <p className="text-sm text-slate-500">
            Sign in with a one-time password sent to your mobile number.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 p-6">
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium text-slate-700">Phone</span>
            <PhoneInput value={phone} onChange={setPhone} placeholder="Phone number" disabled={submitting || otpRequested} />
          </label>

          {otpRequested ? (
            <>
              <label className="grid gap-1.5 text-sm">
                <span className="font-medium text-slate-700">OTP</span>
                <Input
                  value={otp}
                  onChange={(event) => setOtp(event.target.value)}
                  placeholder="Enter OTP"
                  className="h-11 rounded-2xl"
                  disabled={submitting}
                />
              </label>
              <p className="text-xs text-slate-500">
                {isOtpExpired
                  ? `OTP for ${phone} has expired. Request a new code to continue.`
                  : `OTP sent to ${phone}. Expires in ${remainingMinutes}:${remainingDisplaySeconds}.`}
              </p>
            </>
          ) : null}

          <Button
            disabled={submitting}
            className="h-11 rounded-2xl"
            onClick={async () => {
              try {
                if (!otpRequested) {
                  if (!isValidPhoneValue(phone)) {
                    const parsedPhone = parsePhoneValue(phone);
                    push({
                      title: "Unable to send OTP",
                      description: getPhoneValidationMessage(parsedPhone.country),
                      tone: "error",
                    });
                    return;
                  }
                } else if (!otp.trim()) {
                  push({
                    title: "Unable to verify OTP",
                    description: "OTP is required.",
                    tone: "error",
                  });
                  return;
                } else if (isOtpExpired) {
                  push({
                    title: "Unable to verify OTP",
                    description: "OTP has expired. Request a new code to continue.",
                    tone: "error",
                  });
                  return;
                }

                setSubmitting(true);
                if (otpRequested && isOtpExpired) {
                  const result = await requestLoginOtp({ phone });
                  setOtp("");
                  setOtpExpiresAt(result.expiresAt);
                  setNowMs(Date.now());
                  push({
                    title: "OTP resent",
                    description: "Check your SMS inbox for the new code.",
                    tone: "success",
                  });
                  return;
                }
                if (!otpRequested) {
                  const result = await requestLoginOtp({ phone });
                  setOtpRequested(true);
                  setOtpExpiresAt(result.expiresAt);
                  setNowMs(Date.now());
                  push({
                    title: "OTP sent",
                    description: "Check your SMS inbox to continue.",
                    tone: "success",
                  });
                  return;
                }
                await verifyLoginOtp({ phone, otp });
                navigate("/partners", { replace: true });
              } catch (error) {
                push({
                  title: otpRequested ? "Unable to verify OTP" : "Unable to send OTP",
                  description:
                    error instanceof Error ? error.message : "Unknown error",
                  tone: "error",
                });
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {submitting
              ? otpRequested
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
              onClick={() => {
                setOtpRequested(false);
                setOtp("");
                setOtpExpiresAt("");
                setNowMs(Date.now());
              }}
            >
              Change mobile number
            </button>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
