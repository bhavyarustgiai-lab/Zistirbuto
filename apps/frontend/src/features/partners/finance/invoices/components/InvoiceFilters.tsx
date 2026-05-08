import { Input } from "@components/ui/input";
import { Select } from "@components/ui/select";
import { PartnersPageFilters } from "@features/partners/layout/PartnersPageLayout";
import type { InvoiceListFilters, InvoiceStatusFilter } from "../types";

type Props = {
  filters: InvoiceListFilters;
  onChange: (filters: InvoiceListFilters) => void;
};

const statusOptions: Array<{ value: InvoiceStatusFilter; label: string }> = [
  { value: "ALL", label: "All statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "FINALIZED", label: "Finalized" },
  { value: "CANCELLED", label: "Cancelled" },
];

export function InvoiceFilters({ filters, onChange }: Props) {
  return (
    <PartnersPageFilters className="md:grid-cols-2 xl:grid xl:grid-cols-[minmax(260px,1.4fr)_220px_180px_180px] xl:items-center">
      <Input
        value={filters.search}
        onChange={(event) => onChange({ ...filters, search: event.target.value })}
        placeholder="Search invoice, client, outlet, order"
        aria-label="Search invoices"
      />
      <Select
        value={filters.status}
        onValueChange={(value) => onChange({ ...filters, status: value as InvoiceStatusFilter })}
        options={statusOptions}
      />
      <Input
        type="date"
        value={filters.fromDate}
        onChange={(event) => onChange({ ...filters, fromDate: event.target.value })}
        aria-label="From invoice date"
      />
      <Input
        type="date"
        value={filters.toDate}
        onChange={(event) => onChange({ ...filters, toDate: event.target.value })}
        aria-label="To invoice date"
      />
    </PartnersPageFilters>
  );
}
