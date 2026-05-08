import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { PartnerClientBusiness, PartnerStockRow } from "@shared/types/domain";
import { Button } from "@components/ui/button";
import { Drawer } from "@components/ui/drawer";
import { Input } from "@components/ui/input";
import { Select } from "@components/ui/select";
import { Textarea } from "@components/ui/textarea";
import { PartnerFieldLabel } from "@features/partners/PartnerFieldLabel";

type Props = {
  open: boolean;
  businesses: PartnerClientBusiness[];
  stockRows: PartnerStockRow[];
  onClose: () => void;
  onSubmit: (input: {
    clientBusinessId: string;
    clientOutletId: string;
    orderDate: string;
    notes?: string;
    items: Array<{ itemId: string; quantity: number }>;
  }) => Promise<void>;
};

type DraftLine = {
  id: string;
  itemId: string;
  quantity: string;
};

function makeLine(): DraftLine {
  return { id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, itemId: "", quantity: "" };
}

export function CreateOrderDrawer({ open, businesses, stockRows, onClose, onSubmit }: Props) {
  const [businessId, setBusinessId] = useState("");
  const [outletId, setOutletId] = useState("");
  const [orderDate, setOrderDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([makeLine()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setBusinessId("");
      setOutletId("");
      setOrderDate(new Date().toISOString().slice(0, 10));
      setNotes("");
      setLines([makeLine()]);
      setSaving(false);
      setError("");
    }
  }, [open]);

  const businessOptions = useMemo(
    () =>
      businesses
        .filter((business) => business.outlets.some((outlet) => outlet.status === "ACTIVE"))
        .map((business) => ({ value: business.id, label: business.businessName })),
    [businesses],
  );
  const outletOptions = useMemo(
    () =>
      (businesses.find((business) => business.id === businessId)?.outlets ?? [])
        .filter((outlet) => outlet.status === "ACTIVE")
        .map((outlet) => ({
          value: outlet.id,
          label: outlet.outletName,
          description: outlet.address?.trim() || "Address not added",
        })),
    [businessId, businesses],
  );
  const itemOptions = useMemo(
    () => stockRows.map((row) => ({ value: row.itemId, label: `${row.itemName} (${row.brandName})` })),
    [stockRows],
  );

  useEffect(() => {
    const firstOutlet = outletOptions[0]?.value ?? "";
    setOutletId((prev) => (outletOptions.some((option) => option.value === prev) ? prev : firstOutlet));
  }, [outletOptions]);

  return (
    <Drawer open={open} onClose={onClose} title="Create order" className="md:w-[44vw]" bodyClassName="h-full px-0 py-0">
      <div className="flex h-[calc(100vh-88px)] flex-col">
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="grid gap-3">
            <div className="grid gap-2 md:grid-cols-2">
              <div>
                <PartnerFieldLabel>Client</PartnerFieldLabel>
                <Select value={businessId} onValueChange={setBusinessId} options={businessOptions} />
              </div>
              <div>
                <PartnerFieldLabel>Outlet</PartnerFieldLabel>
                <Select value={outletId} onValueChange={setOutletId} options={outletOptions} />
              </div>
              <div>
                <PartnerFieldLabel>Order date</PartnerFieldLabel>
                <Input type="date" value={orderDate} onChange={(event) => setOrderDate(event.target.value)} />
              </div>
            </div>

            <div>
              <PartnerFieldLabel required={false}>Notes</PartnerFieldLabel>
              <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="min-h-[88px]" />
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900">Order lines</p>
                <Button variant="outline" className="h-9 px-3 text-sm" onClick={() => setLines((prev) => [...prev, makeLine()])}>
                  <Plus className="mr-1 h-4 w-4" />
                  Add line
                </Button>
              </div>

              <div className="grid gap-3">
                {lines.map((line, index) => (
                  <div key={line.id} className="grid gap-2 rounded-xl border border-slate-200 p-3 md:grid-cols-[1fr_140px_auto]">
                    <div>
                      <PartnerFieldLabel size="xs">Item {index + 1}</PartnerFieldLabel>
                      <Select
                        value={line.itemId}
                        onValueChange={(value) => {
                          setLines((prev) => prev.map((item) => (item.id === line.id ? { ...item, itemId: value } : item)));
                        }}
                        options={itemOptions}
                      />
                    </div>
                    <div>
                      <PartnerFieldLabel size="xs">Quantity</PartnerFieldLabel>
                      <Input
                        inputMode="numeric"
                        value={line.quantity}
                        onChange={(event) => {
                          setLines((prev) => prev.map((item) => (item.id === line.id ? { ...item, quantity: event.target.value } : item)));
                        }}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        variant="ghost"
                        className="h-11 px-2 text-rose-600 hover:bg-rose-50"
                        disabled={lines.length === 1}
                        onClick={() => setLines((prev) => prev.filter((item) => item.id !== line.id))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          </div>
        </div>

        <div className="border-t border-slate-200 bg-white px-4 py-3">
          <div className="flex justify-end gap-2">
            <Button variant="ghost" className="h-10 px-3 text-sm" onClick={onClose}>Cancel</Button>
            <Button
              className="h-10 px-3 text-sm"
              disabled={saving}
              onClick={async () => {
                const parsedLines = lines
                  .map((line) => ({ itemId: line.itemId, quantity: Number.parseInt(line.quantity, 10) }))
                  .filter((line) => line.itemId && Number.isFinite(line.quantity) && line.quantity > 0);
                if (!businessId || !outletId) {
                  setError("Select a client and outlet.");
                  return;
                }
                if (!parsedLines.length) {
                  setError("Add at least one valid order line.");
                  return;
                }
                setSaving(true);
                setError("");
                try {
                  await onSubmit({
                    clientBusinessId: businessId,
                    clientOutletId: outletId,
                    orderDate,
                    notes: notes.trim() || undefined,
                    items: parsedLines,
                  });
                  onClose();
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Failed to create order");
                } finally {
                  setSaving(false);
                }
              }}
            >
              Create Order
            </Button>
          </div>
        </div>
      </div>
    </Drawer>
  );
}
