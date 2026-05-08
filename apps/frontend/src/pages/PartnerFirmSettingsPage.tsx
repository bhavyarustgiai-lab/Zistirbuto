import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useToast } from "@app/ToastProvider";
import { useAppState } from "@app/providers/AppStateProvider";
import { FirmProfileForm } from "@features/partners/FirmProfileForm";
import { EmptyState } from "@shared/ui/molecules/EmptyState";
import {
  PartnersPageHeader,
  PartnersPageShell,
} from "@features/partners/layout/PartnersPageLayout";

export function PartnerFirmSettingsPage() {
  const { activePartnerFirmId, partnerFirms, updatePartnerFirm } = useAppState();
  const { push } = useToast();
  const [saving, setSaving] = useState(false);

  if (!activePartnerFirmId) {
    return <Navigate to="/partners/onboarding/firm" replace />;
  }

  const activeFirm = partnerFirms.find((firm) => firm.id === activePartnerFirmId);

  if (!activeFirm) {
    return <EmptyState>Firm not found.</EmptyState>;
  }

  return (
    <PartnersPageShell>
      <PartnersPageHeader
        title="Manage firm"
        description="Update the firm profile, billing details, and primary contact information."
      />

      <FirmProfileForm
        title={activeFirm.name}
        description="Keep the distributor profile current for client onboarding and team references."
        submitLabel="Save changes"
        saving={saving}
        showHeader={false}
        showStatus
        initialValues={activeFirm}
        onSubmit={async (values) => {
          setSaving(true);
          try {
            await updatePartnerFirm(activePartnerFirmId, values);
            push({
              title: "Firm details saved",
              description: "Your firm profile has been updated.",
              tone: "success",
            });
          } finally {
            setSaving(false);
          }
        }}
      />
    </PartnersPageShell>
  );
}
