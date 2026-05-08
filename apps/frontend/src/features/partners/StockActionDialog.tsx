import { useEffect, useMemo, useState } from "react";
import { Button } from "@components/ui/button";
import { Dialog } from "@components/ui/dialog";
import { Input } from "@components/ui/input";
import { Select } from "@components/ui/select";
import { Textarea } from "@components/ui/textarea";
import { PartnerFieldLabel } from "@features/partners/PartnerFieldLabel";
import type {
  PartnerClientBusiness,
  PartnerInvoice,
  PartnerPurchase,
  PartnerStockActionInput,
  PartnerStockRow,
  PartnerSupplier,
} from "@shared/types/domain";

type Mode = "RETURN_IN" | "RETURN_OUT" | "DAMAGE";

type Props = {
  open: boolean;
  mode: Mode;
  stockRows: PartnerStockRow[];
  businesses: PartnerClientBusiness[];
  invoices: PartnerInvoice[];
  suppliers: PartnerSupplier[];
  purchases: PartnerPurchase[];
  onClose: () => void;
  onSubmit: (input: PartnerStockActionInput) => Promise<void>;
};

const damageCategories = [
  { value: "", label: "Select category" },
  { value: "DAMAGED", label: "Damaged" },
  { value: "EXPIRED", label: "Expired" },
  { value: "LEAKAGE", label: "Leakage" },
  { value: "BREAKAGE", label: "Breakage" },
  { value: "MISSING", label: "Missing" },
  { value: "OTHER", label: "Other" },
];

function titleFor(mode: Mode) {
  if (mode === "RETURN_IN") return "Client Return In";
  if (mode === "RETURN_OUT") return "Return Out To Supplier";
  return "Damage / Write-off";
}

export function StockActionDialog({
  open,
  mode,
  stockRows,
  businesses,
  invoices,
  suppliers,
  purchases,
  onClose,
  onSubmit,
}: Props) {
  const [itemId, setItemId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [actionDate, setActionDate] = useState(new Date().toISOString().slice(0, 10));
  const [businessId, setBusinessId] = useState("");
  const [outletId, setOutletId] = useState("");
  const [invoiceId, setInvoiceId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [purchaseId, setPurchaseId] = useState("");
  const [damageCategory, setDamageCategory] = useState("");
  const [note, setNote] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setItemId("");
      setQuantity("");
      setActionDate(new Date().toISOString().slice(0, 10));
      setBusinessId("");
      setOutletId("");
      setInvoiceId("");
      setSupplierId("");
      setPurchaseId("");
      setDamageCategory("");
      setNote("");
      setConfirmed(false);
      setSaving(false);
      setError("");
    }
  }, [open, mode]);

  const itemOptions = useMemo(
    () => stockRows.map((item) => ({ value: item.itemId, label: `${item.itemName} (${item.brandName})` })),
    [stockRows],
  );
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
        .map((outlet) => ({ value: outlet.id, label: outlet.outletName, description: outlet.address?.trim() || "Address not added" })),
    [businessId, businesses],
  );
  const invoiceOptions = useMemo(
    () =>
      invoices
        .filter((invoice) => invoice.clientBusinessId === businessId)
        .map((invoice) => ({ value: invoice.id, label: `${invoice.invoiceNumber} · Due ${invoice.dueAmount.toLocaleString("en-IN")}` })),
    [businessId, invoices],
  );
  const supplierOptions = useMemo(
    () => suppliers.filter((supplier) => supplier.status === "ACTIVE").map((supplier) => ({ value: supplier.id, label: supplier.supplierName })),
    [suppliers],
  );
  const purchaseOptions = useMemo(
    () =>
      purchases
        .filter((purchase) => !supplierId || purchase.supplierId === supplierId)
        .map((purchase) => ({ value: purchase.id, label: `${purchase.purchaseNumber} · ${purchase.supplierName}` })),
    [purchases, supplierId],
  );

  useEffect(() => {
    if (!outletOptions.some((option) => option.value === outletId)) {
      setOutletId(outletOptions[0]?.value ?? "");
    }
  }, [outletId, outletOptions]);

  return (
    <Dialog open={open} onClose={onClose} title={titleFor(mode)}>
      <div className="grid gap-3">
        {mode === "RETURN_IN" ? (
          <>
            <div className="grid gap-2 md:grid-cols-2">
              <div>
                <PartnerFieldLabel>Client</PartnerFieldLabel>
                <Select value={businessId} onValueChange={setBusinessId} options={businessOptions} />
              </div>
              <div>
                <PartnerFieldLabel required={false}>Outlet</PartnerFieldLabel>
                <Select value={outletId} onValueChange={setOutletId} options={[{ value: "", label: "All outlets" }, ...outletOptions]} />
              </div>
            </div>
            <div>
              <PartnerFieldLabel required={false}>Related invoice</PartnerFieldLabel>
              <Select value={invoiceId} onValueChange={setInvoiceId} options={[{ value: "", label: "No linked invoice" }, ...invoiceOptions]} />
            </div>
          </>
        ) : null}

        {mode === "RETURN_OUT" ? (
          <>
            <div>
              <PartnerFieldLabel>Supplier</PartnerFieldLabel>
              <Select value={supplierId} onValueChange={setSupplierId} options={supplierOptions} />
            </div>
            <div>
              <PartnerFieldLabel required={false}>Related purchase</PartnerFieldLabel>
              <Select value={purchaseId} onValueChange={setPurchaseId} options={[{ value: "", label: "No linked purchase" }, ...purchaseOptions]} />
            </div>
          </>
        ) : null}

        {mode === "DAMAGE" ? (
          <div>
            <PartnerFieldLabel>Category</PartnerFieldLabel>
            <Select value={damageCategory} onValueChange={setDamageCategory} options={damageCategories} />
          </div>
        ) : null}

        <div className="grid gap-2 md:grid-cols-3">
          <div>
            <PartnerFieldLabel>Item</PartnerFieldLabel>
            <Select value={itemId} onValueChange={setItemId} options={itemOptions} />
          </div>
          <div>
            <PartnerFieldLabel>Quantity</PartnerFieldLabel>
            <Input value={quantity} onChange={(event) => setQuantity(event.target.value)} inputMode="numeric" placeholder="Units" />
          </div>
          <div>
            <PartnerFieldLabel>Date</PartnerFieldLabel>
            <Input type="date" value={actionDate} onChange={(event) => setActionDate(event.target.value)} />
          </div>
        </div>

        <div>
          <PartnerFieldLabel required={false}>Note</PartnerFieldLabel>
          <Textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={
              mode === "RETURN_IN"
                ? "Why stock came back from the client"
                : mode === "RETURN_OUT"
                  ? "Why stock is being returned to the supplier"
                  : "Why this stock is damaged or unusable"
            }
          />
        </div>

        {mode === "DAMAGE" ? (
          <label className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
            Confirm this write-off should reduce available stock.
          </label>
        ) : null}

        {error ? <p className="text-sm text-rose-600">{error}</p> : null}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" className="h-10 px-3 text-sm" onClick={onClose}>Cancel</Button>
          <Button
            className="h-10 px-3 text-sm"
            disabled={saving}
            onClick={async () => {
              const parsedQuantity = Number.parseInt(quantity, 10);
              if (!itemId || !Number.isFinite(parsedQuantity) || parsedQuantity <= 0 || !actionDate) {
                setError("Item, quantity, and date are required.");
                return;
              }
              if (mode === "RETURN_IN" && !businessId) {
                setError("Client is required.");
                return;
              }
              if (mode === "RETURN_OUT" && !supplierId) {
                setError("Supplier is required.");
                return;
              }
              if (mode === "DAMAGE" && !confirmed) {
                setError("Confirm the write-off before saving.");
                return;
              }

              setSaving(true);
              setError("");
              try {
                await onSubmit({
                  actionType: mode,
                  itemId,
                  quantity: parsedQuantity,
                  actionDate,
                  note: note.trim() || undefined,
                  clientBusinessId: businessId || undefined,
                  clientOutletId: outletId || undefined,
                  invoiceId: invoiceId || undefined,
                  supplierId: supplierId || undefined,
                  purchaseId: purchaseId || undefined,
                  damageCategory: (damageCategory || undefined) as PartnerStockActionInput["damageCategory"],
                });
                onClose();
              } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to record stock action");
              } finally {
                setSaving(false);
              }
            }}
          >
            Record Action
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
