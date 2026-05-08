import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import { Button } from "@components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@components/ui/card";
import { Checkbox } from "@components/ui/checkbox";
import { Input } from "@components/ui/input";
import { ScrollArea } from "@components/ui/scroll-area";
import { Sheet } from "@components/ui/sheet";
import { cn } from "@shared/lib/cn";
import type { Service } from "@shared/types/domain";
import type { StaffMember } from "@entities/staffCapabilities/api";

type ServiceLeafNode = {
  id: string;
  type: "service";
  service: Service;
};

type CategoryTreeNode = {
  id: string;
  type: "category";
  label: string;
  pathLabel: string;
  children: Array<CategoryTreeNode | ServiceLeafNode>;
};

type TreeNode = CategoryTreeNode | ServiceLeafNode;

function buildTree(services: Service[]) {
  const root: CategoryTreeNode = {
    id: "root",
    type: "category",
    label: "root",
    pathLabel: "",
    children: [],
  };

  for (const service of services) {
    const parts = (service.categoryPath ?? "Uncategorized")
      .split(">")
      .map((part) => part.trim())
      .filter(Boolean);

    let current = root;
    let currentPath = "";

    for (const part of parts) {
      currentPath = currentPath ? `${currentPath} > ${part}` : part;
      let nextNode = current.children.find(
        (child): child is CategoryTreeNode =>
          child.type === "category" && child.label === part,
      );

      if (!nextNode) {
        nextNode = {
          id: `category_${currentPath}`,
          type: "category",
          label: part,
          pathLabel: currentPath,
          children: [],
        };
        current.children.push(nextNode);
      }

      current = nextNode;
    }

    current.children.push({
      id: `service_${service.id}`,
      type: "service",
      service,
    });
  }

  return root.children;
}

function collectVisibleServiceIds(node: TreeNode): string[] {
  if (node.type === "service") {
    return node.service.active ? [node.service.id] : [];
  }
  return node.children.flatMap((child) => collectVisibleServiceIds(child));
}

function matchesSearch(node: TreeNode, normalizedQuery: string): boolean {
  if (!normalizedQuery) return true;
  if (node.type === "service") {
    return (
      node.service.name.toLowerCase().includes(normalizedQuery) ||
      (node.service.categoryPath ?? "").toLowerCase().includes(normalizedQuery)
    );
  }
  return (
    node.label.toLowerCase().includes(normalizedQuery) ||
    node.children.some((child) => matchesSearch(child, normalizedQuery))
  );
}

function filterTree(nodes: TreeNode[], normalizedQuery: string): TreeNode[] {
  if (!normalizedQuery) return nodes;
  const result: TreeNode[] = [];

  for (const node of nodes) {
    if (node.type === "service") {
      if (matchesSearch(node, normalizedQuery)) {
        result.push(node);
      }
      continue;
    }

    const filteredChildren = filterTree(node.children, normalizedQuery);
    if (
      node.label.toLowerCase().includes(normalizedQuery) ||
      filteredChildren.length > 0
    ) {
      result.push({ ...node, children: filteredChildren });
    }
  }

  return result;
}

function collectCategoryIds(nodes: TreeNode[]): string[] {
  return nodes.flatMap((node) => {
    if (node.type === "service") return [];
    return [node.id, ...collectCategoryIds(node.children)];
  });
}

function ServiceGroupAccordion({
  node,
  depth,
  expandedIds,
  setExpandedIds,
  selectedIds,
  setSelectedIds,
  canEdit,
  forceExpanded,
}: {
  node: TreeNode;
  depth: number;
  expandedIds: Set<string>;
  setExpandedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  selectedIds: string[];
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
  canEdit: boolean;
  forceExpanded: boolean;
}) {
  if (node.type === "service") {
    const checked = selectedIds.includes(node.service.id);

    return (
      <div
        className="flex items-center justify-between gap-4 rounded-xl px-4 py-3 transition hover:bg-slate-50/80"
        style={{ marginLeft: `${depth * 16}px` }}
      >
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "truncate text-sm font-medium",
              node.service.active ? "text-slate-900" : "text-slate-400",
            )}
          >
            {node.service.name}
          </p>
        </div>
        <div className="flex shrink-0 items-center">
          <Checkbox
            checked={checked}
            disabled={!canEdit || !node.service.active}
            onCheckedChange={(nextChecked) =>
              setSelectedIds((prev) =>
                nextChecked
                  ? [...prev, node.service.id]
                  : prev.filter((item) => item !== node.service.id),
              )
            }
          />
        </div>
      </div>
    );
  }

  const descendantIds = collectVisibleServiceIds(node);
  const selectedCount = descendantIds.filter((id) =>
    selectedIds.includes(id),
  ).length;
  const checked =
    descendantIds.length > 0 && selectedCount === descendantIds.length;
  const expanded = forceExpanded || expandedIds.has(node.id);

  return (
    <div className="space-y-1">
      <div
        className={cn(
          "rounded-2xl bg-white px-4 py-3 ring-0",
          depth === 0 ? "shadow-sm" : "shadow-none",
        )}
        style={{ marginLeft: `${depth * 12}px` }}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex min-w-0 flex-1 items-center gap-3 text-left"
            onClick={() =>
              setExpandedIds((prev) => {
                const next = new Set(prev);
                if (next.has(node.id)) next.delete(node.id);
                else next.add(node.id);
                return next;
              })
            }
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
              {expanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">
                {node.label}
              </p>
            </div>
          </button>

          <div className="flex shrink-0 items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">
                Select all
              </span>
              <Checkbox
                checked={checked}
                disabled={!canEdit || descendantIds.length === 0}
                onCheckedChange={(nextChecked) =>
                  setSelectedIds((prev) => {
                    const withoutDescendants = prev.filter(
                      (id) => !descendantIds.includes(id),
                    );
                    return nextChecked
                      ? [...withoutDescendants, ...descendantIds]
                      : withoutDescendants;
                  })
                }
              />
            </div>
          </div>
        </div>
      </div>

      {expanded ? (
        <div className="space-y-1 border-l border-slate-200/80 pl-2">
          {node.children.map((child) => (
            <ServiceGroupAccordion
              key={child.id}
              node={child}
              depth={depth + 1}
              expandedIds={expandedIds}
              setExpandedIds={setExpandedIds}
              selectedIds={selectedIds}
              setSelectedIds={setSelectedIds}
              canEdit={canEdit}
              forceExpanded={forceExpanded}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function StaffServicesDrawer({
  open,
  member,
  services,
  selectedServiceIds,
  canEdit,
  saving,
  onClose,
  onSave,
}: {
  open: boolean;
  member?: StaffMember;
  services: Service[];
  selectedServiceIds: string[];
  canEdit: boolean;
  saving: boolean;
  onClose: () => void;
  onSave: (serviceIds: string[]) => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<string[]>(selectedServiceIds);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const activeServices = useMemo(
    () => services.filter((service) => service.active),
    [services],
  );
  const serviceTree = useMemo(() => buildTree(activeServices), [activeServices]);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredTree = useMemo(
    () => filterTree(serviceTree, normalizedQuery),
    [normalizedQuery, serviceTree],
  );
  const allCategoryIds = useMemo(
    () => collectCategoryIds(serviceTree),
    [serviceTree],
  );

  useEffect(() => {
    if (!open) return;
    setDraft(selectedServiceIds);
    setQuery("");
    setExpandedIds(new Set(allCategoryIds));
  }, [open, selectedServiceIds, allCategoryIds]);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={`Services · ${member?.name ?? member?.phone ?? "Staff"}`}
      className="bg-slate-50"
      bodyClassName="h-full px-5 py-4"
    >
      <div className="flex h-full min-h-0 flex-col">
        <div className="space-y-4 pb-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search services"
              className="h-11 rounded-2xl border-slate-200 bg-white pl-9"
            />
          </div>
        </div>

        <ScrollArea className="min-h-0 flex-1 pr-1">
          {filteredTree.length === 0 ? (
            <Card className="rounded-3xl border-dashed border-slate-200/80 bg-white shadow-none">
              <CardContent className="px-6 py-14 text-center">
                <CardTitle className="text-base">No services match this search</CardTitle>
                <CardDescription className="mt-2">
                  Try a different service name or category keyword.
                </CardDescription>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-3xl border border-slate-200/80 bg-white p-3 pb-24 shadow-sm">
              <div className="space-y-2">
              {filteredTree.map((node) => (
                <ServiceGroupAccordion
                  key={node.id}
                  node={node}
                  depth={0}
                  expandedIds={expandedIds}
                  setExpandedIds={setExpandedIds}
                  selectedIds={draft}
                  setSelectedIds={setDraft}
                  canEdit={canEdit}
                  forceExpanded={Boolean(normalizedQuery)}
                />
              ))}
              </div>
            </div>
          )}
        </ScrollArea>

        <div className="sticky bottom-0 -mx-5 mt-4 border-t border-slate-200 bg-white/95 px-5 py-4 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              {draft.length} service{draft.length === 1 ? "" : "s"} selected
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={onClose} className="rounded-xl">
                Cancel
              </Button>
              <Button
                disabled={!canEdit || saving}
                onClick={() => void onSave(Array.from(new Set(draft)))}
                className="rounded-xl"
              >
                {saving ? "Saving..." : "Save services"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Sheet>
  );
}
