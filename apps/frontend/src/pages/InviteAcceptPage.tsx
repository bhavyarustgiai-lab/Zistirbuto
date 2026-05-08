import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, LoaderCircle, TicketX } from "lucide-react";
import { useAppState } from "@app/providers/AppStateProvider";
import { useToast } from "@app/ToastProvider";
import { acceptInvite } from "@entities/members/api";
import { Badge } from "@components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";

type InviteState = "loading" | "success" | "error";

export function InviteAcceptPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { currentUser, refresh } = useAppState();
  const { push } = useToast();
  const [state, setState] = useState<InviteState>("loading");
  const [message, setMessage] = useState("Joining entity...");

  useEffect(() => {
    if (!token) {
      setState("error");
      setMessage("This invite link is incomplete.");
      return;
    }

    if (!currentUser) {
      navigate("/login", { replace: true });
      return;
    }

    acceptInvite(token)
      .then(async () => {
        await refresh();
        setState("success");
        setMessage("Invite accepted. Redirecting to Today...");
        push({ title: "Invite accepted", description: "You now have access to this entity.", tone: "success" });
        window.setTimeout(
          () => navigate("/clients/appointments", { replace: true }),
          900,
        );
      })
      .catch((error) => {
        setState("error");
        setMessage(error instanceof Error ? error.message : "This invite could not be accepted.");
        push({ title: "Invite could not be accepted", description: error instanceof Error ? error.message : "Unknown error", tone: "error" });
      });
  }, [currentUser, navigate, push, refresh, token]);

  return (
    <section className="grid min-h-screen place-items-center bg-[#f4f5f8] p-6">
      <Card className="w-full max-w-lg border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-start justify-between gap-4 p-6">
          <div>
            <CardTitle className="text-2xl tracking-tight text-slate-950">Accept invite</CardTitle>
            <p className="mt-2 text-sm text-slate-500">Processing your Zistributo team invite.</p>
          </div>
          <Badge tone="neutral">Invite</Badge>
        </CardHeader>
        <CardContent className="flex items-start gap-3 p-6 pt-0">
          <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
            {state === "loading" ? <LoaderCircle className="h-5 w-5 animate-spin" /> : null}
            {state === "success" ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : null}
            {state === "error" ? <TicketX className="h-5 w-5 text-rose-600" /> : null}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900">
              {state === "loading" ? "Checking invite" : state === "success" ? "Invite accepted" : "Invite unavailable"}
            </p>
            <p className="mt-1 text-sm text-slate-500">{message}</p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
