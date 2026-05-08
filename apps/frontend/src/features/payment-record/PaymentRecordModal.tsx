import { useEffect, useState } from "react";
import type { PaymentMode } from "@shared/types/domain";
import { Dialog as Modal } from "@components/ui/dialog";
import { FormRow } from "@shared/ui/molecules/FormRow";
import { Input } from "@components/ui/input";
import { Select } from "@components/ui/select";
import { Button } from "@components/ui/button";

export function PaymentRecordModal({
  open,
  onClose,
  onSubmit
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: { amount: number; mode: PaymentMode; note?: string }) => void;
}) {
  const [amount, setAmount] = useState("0");
  const [mode, setMode] = useState<PaymentMode>("cash");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!open) return;
    setAmount("0");
    setMode("cash");
    setNote("");
  }, [open]);

  return (
    <Modal open={open} title="Record Payment" onClose={onClose}>
      <form
        className="grid gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit({ amount: Number(amount), mode, note });
        }}
      >
        <FormRow label="Amount">
          <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </FormRow>
        <FormRow label="Mode">
          <Select
            value={mode}
            onValueChange={(value) => setMode(value as PaymentMode)}
            options={[
              { value: "cash", label: "Cash" },
              { value: "upi", label: "UPI" },
              { value: "card", label: "Card" },
              { value: "mixed", label: "Mixed" }
            ]}
          />
        </FormRow>
        <FormRow label="Notes">
          <Input value={note} onChange={(e) => setNote(e.target.value)} />
        </FormRow>
        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit">Save</Button>
        </div>
      </form>
    </Modal>
  );
}
