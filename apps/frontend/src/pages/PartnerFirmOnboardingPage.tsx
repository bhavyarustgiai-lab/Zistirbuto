import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@app/ToastProvider";
import { useAppState } from "@app/providers/AppStateProvider";
import { FirmProfileForm } from "@features/partners/FirmProfileForm";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";

export function PartnerFirmOnboardingPage() {
  const navigate = useNavigate();
  const { push } = useToast();
  const { createPartnerFirm, partnerFirms } = useAppState();
  const [saving, setSaving] = useState(false);

  return (
    <section className="grid gap-4">
      <Card className="border-brand-100 bg-gradient-to-br from-white via-white to-indigo-50">
        <CardHeader className="p-5 sm:p-6">
          <CardTitle>
            {partnerFirms.length === 0
              ? "Create your distributor firm"
              : "Add another firm"}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pt-0 pb-5 text-sm text-slate-600 sm:px-6 sm:pb-6">
          {partnerFirms.length === 0
            ? "Start by setting up your distributor identity. Once the firm is created, you can map brands, build the catalog, and begin onboarding clients."
            : "Create a separate firm profile to manage a different distributor business inside the same workspace."}
        </CardContent>
      </Card>

      <FirmProfileForm
        title="Firm onboarding"
        description="Capture the primary business, tax, billing, and contact details for this distributor firm."
        submitLabel={"Create firm"}
        saving={saving}
        onSubmit={async (values) => {
          setSaving(true);
          try {
            await createPartnerFirm(values);
            push({
              title: "Firm created",
              description: "Your distributor firm is ready.",
              tone: "success",
            });
            navigate("/partners", { replace: true });
          } finally {
            setSaving(false);
          }
        }}
      />
    </section>
  );
}
