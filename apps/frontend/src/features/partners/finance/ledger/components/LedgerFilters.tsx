import { Input } from "@components/ui/input";
import { Select } from "@components/ui/select";
import type { PartnerClientBusiness } from "@shared/types/domain";
import { PartnersPageFilters } from "@features/partners/layout/PartnersPageLayout";
import type { LedgerFiltersValue } from "../types";

export function LedgerFilters({
  value,
  clients,
  onChange,
}: {
  value: LedgerFiltersValue;
  clients: PartnerClientBusiness[];
  onChange: (value: LedgerFiltersValue) => void;
}) {
  return (
    <PartnersPageFilters className="md:grid-cols-3 xl:grid xl:grid-cols-[minmax(260px,1fr)_180px_180px]">
      <Select
        value={value.clientBusinessId}
        onValueChange={(clientBusinessId) => onChange({ ...value, clientBusinessId })}
        searchable
        options={[{ value: "", label: "All clients" }, ...clients.map((client) => ({ value: client.id, label: client.businessName }))]}
      />
      <Input type="date" value={value.fromDate} onChange={(event) => onChange({ ...value, fromDate: event.target.value })} />
      <Input type="date" value={value.toDate} onChange={(event) => onChange({ ...value, toDate: event.target.value })} />
    </PartnersPageFilters>
  );
}
