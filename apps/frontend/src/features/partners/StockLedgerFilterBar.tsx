import { Input } from "@components/ui/input";
import { Select } from "@components/ui/select";
import type { PartnerStockLedgerFilters, PartnerStockReasonType, PartnerStockReferenceType } from "@shared/types/domain";

type Props = {
  filters: PartnerStockLedgerFilters;
  onChange: (next: PartnerStockLedgerFilters) => void;
};

const reasonOptions = [
  { value: "", label: "All reasons" },
  { value: "OPENING_STOCK", label: "Opening stock" },
  { value: "PURCHASE", label: "Purchase" },
  { value: "SALE", label: "Sale" },
  { value: "RETURN_IN", label: "Return in" },
  { value: "RETURN_OUT", label: "Return out" },
  { value: "DAMAGE", label: "Damage" },
  { value: "ADJUSTMENT", label: "Adjustment" },
];

const referenceOptions = [
  { value: "", label: "All references" },
  { value: "PURCHASE", label: "Purchase" },
  { value: "INVOICE", label: "Invoice" },
  { value: "ORDER", label: "Order" },
  { value: "MANUAL", label: "Manual" },
  { value: "RETURN", label: "Return" },
  { value: "DAMAGE", label: "Damage" },
];

export function StockLedgerFilterBar({ filters, onChange }: Props) {
  return (
    <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-2 xl:grid-cols-5">
      <Select
        value={filters.reasonType || ""}
        onValueChange={(reasonType) => onChange({ ...filters, reasonType: reasonType as "" | PartnerStockReasonType })}
        options={reasonOptions}
      />
      <Select
        value={filters.referenceType || ""}
        onValueChange={(referenceType) => onChange({ ...filters, referenceType: referenceType as "" | PartnerStockReferenceType })}
        options={referenceOptions}
      />
      <Input
        type="date"
        value={filters.fromDate || ""}
        onChange={(event) => onChange({ ...filters, fromDate: event.target.value })}
      />
      <Input
        type="date"
        value={filters.toDate || ""}
        onChange={(event) => onChange({ ...filters, toDate: event.target.value })}
      />
      <Input
        value={filters.query || ""}
        onChange={(event) => onChange({ ...filters, query: event.target.value })}
        placeholder="Search note or reference"
      />
    </div>
  );
}
