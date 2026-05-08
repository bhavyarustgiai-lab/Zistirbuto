import { useEffect, useState } from "react";
import { Dialog } from "@components/ui/dialog";
import { Button } from "@components/ui/button";
import { FormMessage } from "@components/ui/form-message";
import { Input } from "@components/ui/input";
import { PartnerFieldLabel } from "@features/partners/PartnerFieldLabel";
import { StatusDialog } from "@shared/ui/molecules/status-dialog";

type Props = {
  open: boolean;
  onClose: () => void;
  existingBrandNames: string[];
  onSubmit: (input: { brandName: string }) => Promise<void>;
};

export function AddBrandMappingDialog({ open, onClose, existingBrandNames, onSubmit }: Props) {
  const [brandName, setBrandName] = useState("");
  const [saving, setSaving] = useState(false);
  const [statusDialog, setStatusDialog] = useState<{ tone: "success" | "error"; title: string; description?: string } | null>(null);
  const [brandNameError, setBrandNameError] = useState("");

  useEffect(() => {
    if (!open) {
      setBrandName("");
      setSaving(false);
      setBrandNameError("");
    }
  }, [open]);

  return (
    <>
    <Dialog open={open} onClose={onClose} title="Map Brand to Firm">
      <div className="grid gap-3">
        <div>
          <PartnerFieldLabel>Enter Brand Name</PartnerFieldLabel>
          <Input
            placeholder="e.g. L'Oréal"
            value={brandName}
            onChange={(event) => {
              setBrandName(event.target.value);
              setBrandNameError("");
            }}
            className={brandNameError ? "border-rose-300 ring-2 ring-rose-100" : ""}
          />
          {brandNameError ? <FormMessage>{brandNameError}</FormMessage> : null}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose} className="h-10 px-3 text-sm">Cancel</Button>
          <Button
            className="h-10 px-3 text-sm"
            disabled={saving}
            onClick={async () => {
              const trimmed = brandName.trim();
              setBrandNameError("");
              if (!trimmed) {
                setBrandNameError("Brand name is required.");
                return;
              }
              if (existingBrandNames.some((name) => name.toLowerCase() === trimmed.toLowerCase())) {
                setBrandNameError("This brand is already mapped to the active firm.");
                return;
              }

              setSaving(true);
              try {
                await onSubmit({ brandName: trimmed });
                onClose();
                setStatusDialog({ tone: "success", title: "Brand mapped successfully" });
              } catch (err) {
                setStatusDialog({
                  tone: "error",
                  title: "Brand mapping failed",
                  description: err instanceof Error ? err.message : "Failed to map brand",
                });
              } finally {
                setSaving(false);
              }
            }}
          >
            Add Brand
          </Button>
        </div>
      </div>
    </Dialog>
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
