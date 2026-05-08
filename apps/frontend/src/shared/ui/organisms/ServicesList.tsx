import { Clock3, Tag } from "lucide-react";
import type { Service } from "@shared/types/domain";
import { DropdownMenu } from "@components/ui/dropdown-menu";

function ServiceRow({ item, onEdit, onToggle }: { item: Service; onEdit: () => void; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between border-t border-slate-200 px-4 py-4">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-full bg-indigo-50 text-brand-500"><Tag className="h-5 w-5" /></div>
        <div>
          <p className="text-3xl font-medium text-slate-900">{item.name}</p>
          <p className="text-lg text-slate-500">{item.price != null ? `$${item.price}` : "-"} · <Clock3 className="inline h-4 w-4" /> {item.durationMinutes ?? "-"} min</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <p className="text-3xl font-semibold text-slate-900">{item.price != null ? `$${item.price}` : "-"}</p>
        <DropdownMenu items={[{ label: "Edit", onClick: onEdit }, { label: item.active ? "Disable" : "Enable", onClick: onToggle }]} />
      </div>
    </div>
  );
}

export function ServicesList({ items, onEdit, onToggle }: { items: Service[]; onEdit: (service: Service) => void; onToggle: (service: Service) => void }) {
  const active = items.filter((i) => i.active);
  const inactive = items.filter((i) => !i.active);

  return (
    <div className="grid gap-4">
      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="px-4 py-3 text-lg font-medium uppercase tracking-wide text-slate-500">Active · {active.length}</div>
        {active.map((service) => <ServiceRow key={service.id} item={service} onEdit={() => onEdit(service)} onToggle={() => onToggle(service)} />)}
      </div>
      {inactive.length > 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white">
          <div className="px-4 py-3 text-lg font-medium uppercase tracking-wide text-slate-500">Inactive · {inactive.length}</div>
          {inactive.map((service) => <ServiceRow key={service.id} item={service} onEdit={() => onEdit(service)} onToggle={() => onToggle(service)} />)}
        </div>
      ) : null}
    </div>
  );
}
