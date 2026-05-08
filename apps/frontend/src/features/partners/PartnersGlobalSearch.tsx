import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePartnerGlobalSearch } from "@entities/partners/hooks";
import { Command } from "@components/ui/command";

export function PartnersGlobalSearch({ firmId }: { firmId: string }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const search = usePartnerGlobalSearch(firmId, query);

  return (
    <Command
      value={query}
      onValueChange={setQuery}
      placeholder="Search clients, items, orders"
      emptyText={query.trim() ? "No matching records" : "Start typing to search"}
      items={search.items.map((item) => ({
        value: item.href,
        label: item.title,
        meta: item.type,
      }))}
      onSelect={(href) => {
        setQuery("");
        navigate(href);
      }}
      className="w-full md:min-w-[320px]"
    />
  );
}
