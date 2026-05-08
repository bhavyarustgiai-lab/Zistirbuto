import { useEffect, useState } from "react";
import type { Service } from "@shared/types/domain";
import { Dialog as Modal } from "@components/ui/dialog";
import { FormRow } from "@shared/ui/molecules/FormRow";
import { Input } from "@components/ui/input";
import { Button } from "@components/ui/button";

export function ServiceEditorModal({
  open,
  onClose,
  initial,
  onSubmit
}: {
  open: boolean;
  onClose: () => void;
  initial?: Service;
  onSubmit: (payload: { name: string; price?: number; durationMinutes?: number }) => void;
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? "");
    setPrice(initial?.price?.toString() ?? "");
    setDuration(initial?.durationMinutes?.toString() ?? "");
  }, [open, initial]);

  return (
    <Modal open={open} title={initial ? "Edit Service" : "Add Service"} onClose={onClose}>
      <form
        className="grid gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit({
            name,
            price: price ? Number(price) : undefined,
            durationMinutes: duration ? Number(duration) : undefined
          });
        }}
      >
        <FormRow label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} /></FormRow>
        <FormRow label="Price"><Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} /></FormRow>
        <FormRow label="Duration (minutes)"><Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} /></FormRow>
        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit">Save</Button>
        </div>
      </form>
    </Modal>
  );
}
