import { memo, useEffect, useMemo, useState } from "react";
import {
  CopyIcon,
  ChevronDown,
  ChevronRight,
  FolderTree,
  MoveRight,
  PencilIcon,
  Plus,
  Search,
  Sparkles,
  Tag,
} from "lucide-react";
import { useAppState } from "@app/providers/AppStateProvider";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@components/ui/card";
import { Checkbox } from "@components/ui/checkbox";
import { Collapsible } from "@components/ui/collapsible";
import { Dialog } from "@components/ui/dialog";
import { Drawer } from "@components/ui/drawer";
import { DropdownMenu } from "@components/ui/dropdown-menu";
import { Input } from "@components/ui/input";
import { ScrollArea } from "@components/ui/scroll-area";
import { Select } from "@components/ui/select";
import { Separator } from "@components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@components/ui/tabs";
import { Textarea } from "@components/ui/textarea";
import { Tooltip } from "@components/ui/tooltip";
import type { Service, ServiceCategory } from "@shared/types/domain";
import {
  createServiceCategory,
  deleteServiceCategory,
  getServiceCategories,
  updateServiceCategory,
} from "@entities/service-category/api";
import {
  createService,
  deleteService,
  getServices,
  updateService,
} from "@entities/service/api";

type CatalogService = Service & {
  categoryId: string;
};

type CategoryNode = {
  id: string;
  level: number;
  category: ServiceCategory;
  children: CategoryNode[];
  directServices: CatalogService[];
  serviceCount: number;
  expandable: boolean;
};

function formatINR(value?: number) {
  if (value == null || Number.isNaN(value)) return "Not set";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function ServicesPage() {
  const { clients, currentClientId } = useAppState();
  const currentClient = clients.find((client) => client.id === currentClientId);

  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [services, setServices] = useState<CatalogService[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [tab, setTab] = useState("services");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [checkedServiceIds, setCheckedServiceIds] = useState<string[]>([]);

  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [categoryDialogMode, setCategoryDialogMode] = useState<
    "create" | "rename"
  >("create");
  const [categoryTargetId, setCategoryTargetId] = useState<string>("");
  const [categoryName, setCategoryName] = useState("");
  const [categoryParentId, setCategoryParentId] = useState<string>("none");
  const [categoryErrors, setCategoryErrors] = useState<{ name?: string }>({});

  const [deleteCategoryDialogOpen, setDeleteCategoryDialogOpen] =
    useState(false);
  const [deleteCategoryId, setDeleteCategoryId] = useState("");

  const [serviceDrawerOpen, setServiceDrawerOpen] = useState(false);
  const [serviceDrawerMode, setServiceDrawerMode] = useState<"create" | "edit">(
    "create",
  );
  const [serviceTargetId, setServiceTargetId] = useState("");
  const [serviceForm, setServiceForm] = useState({
    categoryId: "",
    name: "",
    price: "",
    description: "",
    durationMinutes: "",
    active: true,
  });
  const [serviceErrors, setServiceErrors] = useState<{
    categoryId?: string;
    name?: string;
  }>({});

  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [moveServiceIds, setMoveServiceIds] = useState<string[]>([]);
  const [moveDestinationId, setMoveDestinationId] = useState("");

  async function refreshCatalog(nextSelectedCategoryId?: string) {
    if (!currentClientId) {
      setCategories([]);
      setServices([]);
      setSelectedCategoryId("");
      return;
    }

    const [fetchedCategories, fetchedServices] = await Promise.all([
      getServiceCategories(currentClientId),
      getServices(currentClientId),
    ]);
    const normalizedServices = fetchedServices.filter(
      (service): service is CatalogService => !!service.categoryId,
    );

    setCategories(
      fetchedCategories.map((category) => ({
        ...category,
        parentId: category.parentId ?? null,
      })),
    );
    setServices(normalizedServices);
    setExpanded((prev) => ({
      ...Object.fromEntries(
        fetchedCategories.map((category) => [category.id, true]),
      ),
      ...prev,
    }));
    setSelectedCategoryId((prev) => {
      const requested = nextSelectedCategoryId ?? prev;
      if (
        requested &&
        fetchedCategories.some((category) => category.id === requested)
      ) {
        return requested;
      }
      return fetchedCategories.find((category) => !category.parentId)?.id ?? "";
    });
    setCheckedServiceIds([]);
  }

  useEffect(() => {
    let cancelled = false;

    async function loadCatalog() {
      if (!currentClientId) return;
      const [fetchedCategories, fetchedServices] = await Promise.all([
        getServiceCategories(currentClientId),
        getServices(currentClientId),
      ]);
      if (cancelled) return;
      const normalizedServices = fetchedServices.filter(
        (service): service is CatalogService => !!service.categoryId,
      );

      setCategories(
        fetchedCategories.map((category) => ({
          ...category,
          parentId: category.parentId ?? null,
        })),
      );
      setServices(normalizedServices);
      setExpanded((prev) => ({
        ...Object.fromEntries(
          fetchedCategories.map((category) => [category.id, true]),
        ),
        ...prev,
      }));
      setSelectedCategoryId((prev) => {
        if (
          prev &&
          fetchedCategories.some((category) => category.id === prev)
        ) {
          return prev;
        }
        return (
          fetchedCategories.find((category) => !category.parentId)?.id ?? ""
        );
      });
      setCheckedServiceIds([]);
    }

    if (!currentClientId) {
      setCategories([]);
      setServices([]);
      setSelectedCategoryId("");
      return;
    }

    void loadCatalog();
    return () => {
      cancelled = true;
    };
  }, [currentClientId]);

  const categoriesByParent = useMemo(() => {
    const map = new Map<string | null, ServiceCategory[]>();
    for (const category of categories) {
      const parentId = category.parentId ?? null;
      const list = map.get(parentId) ?? [];
      list.push(category);
      map.set(parentId, list);
    }
    for (const [key, list] of map.entries()) {
      map.set(
        key,
        [...list].sort(
          (a, b) =>
            (a.sortOrder ?? 999) - (b.sortOrder ?? 999) ||
            a.name.localeCompare(b.name),
        ),
      );
    }
    return map;
  }, [categories]);

  const visibleServices = services;
  const searchLower = search.trim().toLowerCase();

  const matchedCategoryIds = useMemo(() => {
    if (!searchLower) {
      return new Set(categories.map((category) => category.id));
    }

    const serviceByCategory = new Map<string, CatalogService[]>();
    for (const service of visibleServices) {
      const list = serviceByCategory.get(service.categoryId) ?? [];
      list.push(service);
      serviceByCategory.set(service.categoryId, list);
    }

    const memo = new Map<string, boolean>();
    const result = new Set<string>();

    function hasMatch(categoryId: string): boolean {
      if (memo.has(categoryId)) return memo.get(categoryId)!;
      const category = categories.find((item) => item.id === categoryId);
      if (!category) return false;

      const nameMatch = category.name.toLowerCase().includes(searchLower);
      const serviceMatch = (serviceByCategory.get(categoryId) ?? []).some(
        (service) => service.name.toLowerCase().includes(searchLower),
      );
      const childMatch = (categoriesByParent.get(categoryId) ?? []).some(
        (child) => hasMatch(child.id),
      );
      const matched = nameMatch || serviceMatch || childMatch;
      memo.set(categoryId, matched);
      if (matched) result.add(categoryId);
      return matched;
    }

    for (const category of categories) {
      hasMatch(category.id);
    }

    return result;
  }, [categories, categoriesByParent, searchLower, visibleServices]);

  const selectedCategory = categories.find(
    (category) => category.id === selectedCategoryId,
  );

  const categoryPath = useMemo(() => {
    if (!selectedCategory) return [];
    const path: ServiceCategory[] = [];
    let cursor: ServiceCategory | undefined = selectedCategory;
    while (cursor) {
      path.unshift(cursor);
      cursor = cursor.parentId
        ? categories.find((item) => item.id === cursor?.parentId)
        : undefined;
    }
    return path;
  }, [categories, selectedCategory]);

  function getDescendantCategoryIds(categoryId: string): string[] {
    const result: string[] = [categoryId];
    const queue = [categoryId];
    while (queue.length > 0) {
      const current = queue.shift()!;
      const children = categoriesByParent.get(current) ?? [];
      for (const child of children) {
        result.push(child.id);
        queue.push(child.id);
      }
    }
    return result;
  }

  function getServiceCountForCategory(categoryId: string): number {
    const subtree = new Set(getDescendantCategoryIds(categoryId));
    return visibleServices.filter((service) => subtree.has(service.categoryId))
      .length;
  }

  const immediateSubcategories = useMemo(
    () =>
      selectedCategoryId
        ? (categoriesByParent.get(selectedCategoryId) ?? [])
        : [],
    [categoriesByParent, selectedCategoryId],
  );

  const servicesInSelectedCategory = useMemo(() => {
    if (!selectedCategoryId) return [];
    const list = visibleServices.filter(
      (service) => service.categoryId === selectedCategoryId,
    );
    if (sortBy === "price") {
      return [...list].sort(
        (a, b) =>
          (a.price ?? Number.MAX_SAFE_INTEGER) -
          (b.price ?? Number.MAX_SAFE_INTEGER),
      );
    }
    if (sortBy === "recent") {
      return [...list].sort(
        (a, b) =>
          new Date(b.updatedAt ?? 0).getTime() -
          new Date(a.updatedAt ?? 0).getTime(),
      );
    }
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [selectedCategoryId, sortBy, visibleServices]);

  const allVisibleChecked =
    servicesInSelectedCategory.length > 0 &&
    servicesInSelectedCategory.every((service) =>
      checkedServiceIds.includes(service.id),
    );

  function openAddCategory(parentId: string | null) {
    setCategoryDialogMode("create");
    setCategoryTargetId("");
    setCategoryName("");
    setCategoryParentId(parentId ?? "none");
    setCategoryErrors({});
    setCategoryDialogOpen(true);
  }

  function openRenameCategory(category: ServiceCategory) {
    setCategoryDialogMode("rename");
    setCategoryTargetId(category.id);
    setCategoryName(category.name);
    setCategoryParentId(category.parentId ?? "none");
    setCategoryErrors({});
    setCategoryDialogOpen(true);
  }

  async function saveCategory() {
    const nextErrors: { name?: string } = {};
    if (!categoryName.trim()) {
      nextErrors.name = "Category name is required.";
    }
    setCategoryErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (categoryDialogMode === "create") {
      const next = await createServiceCategory({
        clientId: currentClientId,
        name: categoryName.trim(),
        parentId: categoryParentId === "none" ? null : categoryParentId,
        sortOrder: 999,
      });
      await refreshCatalog(next.id);
      setExpanded((prev) => ({ ...prev, [next.id]: true }));
    } else {
      await updateServiceCategory(categoryTargetId, {
        name: categoryName.trim(),
        parentId: categoryParentId === "none" ? "" : categoryParentId,
      });
      await refreshCatalog(categoryTargetId);
    }
    setCategoryDialogOpen(false);
  }

  async function deleteCategory(categoryId: string) {
    const toDelete = new Set(getDescendantCategoryIds(categoryId));
    const fallback = categories.find((category) => !toDelete.has(category.id));
    await deleteServiceCategory(categoryId);
    await refreshCatalog(
      toDelete.has(selectedCategoryId) ? fallback?.id : selectedCategoryId,
    );
    setDeleteCategoryDialogOpen(false);
  }

  function openServiceDrawer(
    mode: "create" | "edit",
    payload: { categoryId?: string; serviceId?: string },
  ) {
    setServiceDrawerMode(mode);
    setServiceTargetId(payload.serviceId ?? "");
    const existing = payload.serviceId
      ? services.find((service) => service.id === payload.serviceId)
      : undefined;
    setServiceForm({
      categoryId:
        existing?.categoryId ?? payload.categoryId ?? selectedCategoryId,
      name: existing?.name ?? "",
      price: existing?.price?.toString() ?? "",
      description: existing?.description ?? "",
      durationMinutes: existing?.durationMinutes?.toString() ?? "",
      active: existing?.active ?? true,
    });
    setServiceErrors({});
    setServiceDrawerOpen(true);
  }

  async function saveServiceFromDrawer() {
    const nextErrors: { categoryId?: string; name?: string } = {};
    if (!serviceForm.categoryId) {
      nextErrors.categoryId = "Category is required.";
    }
    if (!serviceForm.name.trim()) {
      nextErrors.name = "Service name is required.";
    }
    setServiceErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (serviceDrawerMode === "create") {
      await createService({
        clientId: currentClientId,
        categoryId: serviceForm.categoryId,
        name: serviceForm.name.trim(),
        price: serviceForm.price ? Number(serviceForm.price) : undefined,
        description: serviceForm.description || undefined,
        durationMinutes: serviceForm.durationMinutes
          ? Number(serviceForm.durationMinutes)
          : undefined,
        active: serviceForm.active,
      });
    } else {
      await updateService(serviceTargetId, {
        categoryId: serviceForm.categoryId,
        name: serviceForm.name.trim(),
        price: serviceForm.price ? Number(serviceForm.price) : 0,
        description: serviceForm.description,
        durationMinutes: serviceForm.durationMinutes
          ? Number(serviceForm.durationMinutes)
          : 0,
        active: serviceForm.active,
      });
    }
    await refreshCatalog(serviceForm.categoryId);
    setServiceDrawerOpen(false);
  }

  async function duplicateService(service: CatalogService) {
    await createService({
      clientId: currentClientId,
      categoryId: service.categoryId,
      name: `${service.name} (Copy)`,
      price: service.price,
      description: service.description,
      durationMinutes: service.durationMinutes,
      active: service.active,
    });
    await refreshCatalog(service.categoryId);
  }

  function openMoveDialog(ids: string[]) {
    setMoveServiceIds(ids);
    setMoveDestinationId(selectedCategoryId || categories[0]?.id || "");
    setMoveDialogOpen(true);
  }

  async function moveServices() {
    if (!moveDestinationId) return;
    await Promise.all(
      moveServiceIds.map((serviceId) =>
        updateService(serviceId, { categoryId: moveDestinationId }),
      ),
    );
    await refreshCatalog(moveDestinationId);
    setCheckedServiceIds((prev) =>
      prev.filter((id) => !moveServiceIds.includes(id)),
    );
    setMoveDialogOpen(false);
  }

  async function deleteServices(ids: string[]) {
    await Promise.all(ids.map((id) => deleteService(id)));
    await refreshCatalog(selectedCategoryId);
    setCheckedServiceIds((prev) => prev.filter((id) => !ids.includes(id)));
  }

  const treeRoots = useMemo(() => {
    function buildTree(parentId: string | null, level: number): CategoryNode[] {
      const branch = (categoriesByParent.get(parentId) ?? []).filter(
        (category) => matchedCategoryIds.has(category.id),
      );

      return branch.map((category) => {
        const directServices = visibleServices
          .filter((service) => service.categoryId === category.id)
          .filter(
            (service) =>
              !searchLower || service.name.toLowerCase().includes(searchLower),
          )
          .sort((a, b) => a.name.localeCompare(b.name));
        const children = buildTree(category.id, level + 1);
        const serviceCount = getServiceCountForCategory(category.id);
        return {
          id: category.id,
          level,
          category,
          children,
          directServices,
          serviceCount,
          expandable: children.length > 0 || directServices.length > 0,
        };
      });
    }

    return buildTree(null, 0);
  }, [
    categoriesByParent,
    matchedCategoryIds,
    searchLower,
    visibleServices,
    categories,
  ]);

  const noCategories = categories.length === 0;
  const noSearchResults = !!searchLower && matchedCategoryIds.size === 0;

  return (
    <section className="flex h-[calc(100vh-2.5rem)] flex-col gap-4">
      <ServiceCatalogHeader
        clientName={currentClient?.name ?? "Client"}
        clientType={currentClient?.clientType ?? "ClientType"}
        onAddCategory={() => openAddCategory(null)}
      />

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <ServiceTreePanel
          categoryCount={categories.length}
          serviceCount={visibleServices.length}
          search={search}
          onSearchChange={setSearch}
          noCategories={noCategories}
          noSearchResults={noSearchResults}
          onAddRootCategory={() => openAddCategory(null)}
          roots={treeRoots}
          expanded={expanded}
          selectedCategoryId={selectedCategoryId}
          onToggleExpanded={(categoryId) =>
            setExpanded((prev) => ({
              ...prev,
              [categoryId]: !(prev[categoryId] ?? true),
            }))
          }
          onSelectCategory={(categoryId) => {
            setSelectedCategoryId(categoryId);
            setTab("services");
            setCheckedServiceIds([]);
          }}
          onAddCategory={openAddCategory}
          onAddService={(categoryId) =>
            openServiceDrawer("create", { categoryId })
          }
          onRenameCategory={openRenameCategory}
          onDeleteCategory={(categoryId) => {
            setDeleteCategoryId(categoryId);
            setDeleteCategoryDialogOpen(true);
          }}
          onEditService={(serviceId, categoryId) => {
            setSelectedCategoryId(categoryId);
            openServiceDrawer("edit", { serviceId });
          }}
        />

        <ServiceContentPanel
          selectedCategory={selectedCategory}
          categoryPath={categoryPath}
          tab={tab}
          onTabChange={setTab}
          sortBy={sortBy}
          onSortChange={setSortBy}
          checkedServiceIds={checkedServiceIds}
          onMoveChecked={() => openMoveDialog(checkedServiceIds)}
          onDeleteChecked={() => deleteServices(checkedServiceIds)}
          onAddService={() =>
            selectedCategory
              ? openServiceDrawer("create", { categoryId: selectedCategory.id })
              : undefined
          }
          servicesInSelectedCategory={servicesInSelectedCategory}
          allVisibleChecked={allVisibleChecked}
          onToggleAllChecked={(checked) =>
            setCheckedServiceIds(
              checked
                ? servicesInSelectedCategory.map((service) => service.id)
                : [],
            )
          }
          onToggleServiceChecked={(serviceId, checked) =>
            setCheckedServiceIds((prev) =>
              checked
                ? [...prev, serviceId]
                : prev.filter((id) => id !== serviceId),
            )
          }
          onEditService={(serviceId) =>
            openServiceDrawer("edit", { serviceId })
          }
          onDuplicateService={duplicateService}
          immediateSubcategories={immediateSubcategories}
          getServiceCountForCategory={getServiceCountForCategory}
          onOpenSubcategory={(subcategoryId) => {
            setSelectedCategoryId(subcategoryId);
            setTab("services");
          }}
          onAddSubcategory={() =>
            selectedCategory ? openAddCategory(selectedCategory.id) : undefined
          }
          onRenameSubcategory={openRenameCategory}
          onDeleteSubcategory={(subcategoryId) => {
            setDeleteCategoryId(subcategoryId);
            setDeleteCategoryDialogOpen(true);
          }}
        />
      </div>

      <Dialog
        open={categoryDialogOpen}
        title={
          categoryDialogMode === "create" ? "Add Category" : "Rename Category"
        }
        onClose={() => setCategoryDialogOpen(false)}
      >
        <div className="grid gap-3">
          <div>
            <p className="mb-1 text-sm text-slate-600">Category Name *</p>
            <Input
              value={categoryName}
              onChange={(event) => setCategoryName(event.target.value)}
              placeholder="e.g., Hair Treatments"
            />
            {categoryErrors.name ? (
              <p className="mt-1 text-xs text-rose-600">
                {categoryErrors.name}
              </p>
            ) : null}
          </div>
          <div>
            <p className="mb-1 text-sm text-slate-600">Parent Category</p>
            <Select
              value={categoryParentId}
              onValueChange={setCategoryParentId}
              options={[
                { value: "none", label: "No parent (root)" },
                ...categories
                  .filter((category) => category.id !== categoryTargetId)
                  .map((category) => ({
                    value: category.id,
                    label: category.name,
                  })),
              ]}
            />
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setCategoryErrors({});
                setCategoryDialogOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button onClick={saveCategory}>Save</Button>
          </div>
        </div>
      </Dialog>

      <EditServiceSheet
        open={serviceDrawerOpen}
        mode={serviceDrawerMode}
        categories={categories}
        serviceForm={serviceForm}
        serviceErrors={serviceErrors}
        onClose={() => setServiceDrawerOpen(false)}
        onCategoryChange={(value) =>
          setServiceForm((prev) => ({ ...prev, categoryId: value }))
        }
        onNameChange={(value) =>
          setServiceForm((prev) => ({ ...prev, name: value }))
        }
        onPriceChange={(value) =>
          setServiceForm((prev) => ({ ...prev, price: value }))
        }
        onDurationChange={(value) =>
          setServiceForm((prev) => ({ ...prev, durationMinutes: value }))
        }
        onDescriptionChange={(value) =>
          setServiceForm((prev) => ({ ...prev, description: value }))
        }
        onActiveChange={(checked) =>
          setServiceForm((prev) => ({ ...prev, active: checked }))
        }
        onSave={saveServiceFromDrawer}
      />

      <Dialog
        open={moveDialogOpen}
        title="Move Service"
        onClose={() => setMoveDialogOpen(false)}
      >
        <div className="grid gap-3">
          <p className="text-sm text-slate-600">
            Choose destination category for {moveServiceIds.length} service(s).
          </p>
          <Select
            value={moveDestinationId}
            onValueChange={setMoveDestinationId}
            options={categories.map((category) => ({
              value: category.id,
              label: category.name,
            }))}
          />
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setMoveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={moveServices}>Move</Button>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={deleteCategoryDialogOpen}
        title="Delete Category"
        onClose={() => setDeleteCategoryDialogOpen(false)}
      >
        <div className="grid gap-3">
          <p className="text-sm text-slate-600">
            Deleting this category removes all nested subcategories and
            services.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteCategoryDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteCategory(deleteCategoryId)}
            >
              Delete
            </Button>
          </div>
        </div>
      </Dialog>
    </section>
  );
}

function ServiceCatalogHeader({
  clientName,
  clientType,
  onAddCategory,
}: {
  clientName: string;
  clientType: string;
  onAddCategory: () => void;
}) {
  return (
    <Card className="overflow-hidden border-none bg-[radial-gradient(circle_at_top_left,_rgba(244,114,182,0.12),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(56,189,248,0.10),_transparent_28%),linear-gradient(135deg,_#fffafc,_#f8fbff)] shadow-sm">
      <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            Service Catalog
          </h1>
          <CardDescription className="mt-2 text-sm text-slate-500">
            Add, organize and manage the services you offer to your customers.
          </CardDescription>
        </div>
        <Button
          onClick={onAddCategory}
          className="h-11 rounded-2xl px-5 shadow-[0_10px_30px_rgba(79,70,229,0.20)]"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add category
        </Button>
      </CardContent>
    </Card>
  );
}

const ServiceTreePanel = memo(function ServiceTreePanel({
  categoryCount,
  serviceCount,
  search,
  onSearchChange,
  noCategories,
  noSearchResults,
  onAddRootCategory,
  roots,
  expanded,
  selectedCategoryId,
  onToggleExpanded,
  onSelectCategory,
  onAddCategory,
  onAddService,
  onRenameCategory,
  onDeleteCategory,
  onEditService,
}: {
  categoryCount: number;
  serviceCount: number;
  search: string;
  onSearchChange: (value: string) => void;
  noCategories: boolean;
  noSearchResults: boolean;
  onAddRootCategory: () => void;
  roots: CategoryNode[];
  expanded: Record<string, boolean>;
  selectedCategoryId: string;
  onToggleExpanded: (categoryId: string) => void;
  onSelectCategory: (categoryId: string) => void;
  onAddCategory: (parentId: string | null) => void;
  onAddService: (categoryId: string) => void;
  onRenameCategory: (category: ServiceCategory) => void;
  onDeleteCategory: (categoryId: string) => void;
  onEditService: (serviceId: string, categoryId: string) => void;
}) {
  return (
    <Card className="flex min-h-0 flex-col overflow-visible rounded-3xl border-slate-200/80 shadow-sm">
      <CardHeader className="gap-4 border-b border-slate-200/80 bg-white p-6 pb-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search categories or services"
            className="h-11 rounded-2xl border-slate-200 bg-slate-50 pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Badge className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
            {categoryCount} categories
          </Badge>
          <Badge className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
            {serviceCount} services
          </Badge>
        </div>
      </CardHeader>

      <ScrollArea className="min-h-0 flex-1">
        <div className="p-3">
          {noCategories ? (
            <TreeEmptyState
              icon={<FolderTree className="h-6 w-6 text-slate-400" />}
              title="No categories yet"
              description="Create your first category to start organizing services."
              actionLabel="Create first category"
              onAction={onAddRootCategory}
            />
          ) : noSearchResults ? (
            <TreeEmptyState
              icon={<Search className="h-6 w-6 text-slate-400" />}
              title="No matches found"
              description="Try a different category or service keyword."
            />
          ) : (
            <div className="space-y-1">
              {roots.map((node) => (
                <TreeNodeRow
                  key={node.id}
                  node={node}
                  expanded={expanded}
                  selectedCategoryId={selectedCategoryId}
                  onToggleExpanded={onToggleExpanded}
                  onSelectCategory={onSelectCategory}
                  onAddCategory={onAddCategory}
                  onAddService={onAddService}
                  onRenameCategory={onRenameCategory}
                  onDeleteCategory={onDeleteCategory}
                  onEditService={onEditService}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
});

function TreeNodeRow({
  node,
  expanded,
  selectedCategoryId,
  onToggleExpanded,
  onSelectCategory,
  onAddCategory,
  onAddService,
  onRenameCategory,
  onDeleteCategory,
  onEditService,
}: {
  node: CategoryNode;
  expanded: Record<string, boolean>;
  selectedCategoryId: string;
  onToggleExpanded: (categoryId: string) => void;
  onSelectCategory: (categoryId: string) => void;
  onAddCategory: (parentId: string | null) => void;
  onAddService: (categoryId: string) => void;
  onRenameCategory: (category: ServiceCategory) => void;
  onDeleteCategory: (categoryId: string) => void;
  onEditService: (serviceId: string, categoryId: string) => void;
}) {
  const isOpen = expanded[node.id] ?? true;
  const isActive = selectedCategoryId === node.id;

  return (
    <div className="space-y-1">
      <div
        className={`relative flex items-center gap-1 rounded-2xl border border-transparent px-2 py-1.5 transition ${
          isActive ? "bg-indigo-50/70" : "hover:bg-slate-50"
        }`}
        style={{ paddingLeft: `${10 + node.level * 18}px` }}
      >
        {isActive ? (
          <div className="pointer-events-none absolute inset-y-1 left-0 w-1 rounded-full bg-brand-500" />
        ) : null}
        <Button
          type="button"
          variant="ghost"
          className="h-7 w-7 shrink-0 rounded-full p-0 text-slate-500 hover:bg-slate-100"
          onClick={() => onToggleExpanded(node.id)}
          aria-label={isOpen ? "Collapse category" : "Expand category"}
        >
          {node.expandable ? (
            <ChevronDown
              className={`h-4 w-4 shrink-0 transition ${isOpen ? "" : "-rotate-90"}`}
            />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 opacity-30" />
          )}
        </Button>
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center justify-start rounded-xl px-2 py-2 text-left transition"
          onClick={() => onSelectCategory(node.id)}
        >
          <span
            className={`truncate text-sm ${
              isActive ? "font-semibold text-slate-950" : "text-slate-700"
            }`}
          >
            {node.category.name}
          </span>
        </button>
        <Badge className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] text-slate-600">
          {node.serviceCount}
        </Badge>
        <DropdownMenu
          items={[
            {
              label: "Add category",
              onClick: () => onAddCategory(node.id),
            },
            {
              label: "Add service",
              onClick: () => onAddService(node.id),
            },
            {
              label: "Rename",
              onClick: () => onRenameCategory(node.category),
            },
            {
              label: "Delete",
              destructive: true,
              onClick: () => onDeleteCategory(node.id),
            },
          ]}
        />
      </div>

      <Collapsible open={isOpen}>
        <div className="space-y-1">
          {node.children.map((child) => (
            <TreeNodeRow
              key={child.id}
              node={child}
              expanded={expanded}
              selectedCategoryId={selectedCategoryId}
              onToggleExpanded={onToggleExpanded}
              onSelectCategory={onSelectCategory}
              onAddCategory={onAddCategory}
              onAddService={onAddService}
              onRenameCategory={onRenameCategory}
              onDeleteCategory={onDeleteCategory}
              onEditService={onEditService}
            />
          ))}
          {node.directServices.map((service) => (
            <div
              key={service.id}
              className="flex items-center gap-2 rounded-2xl px-3 py-1.5 transition hover:bg-slate-50"
              style={{ paddingLeft: `${22 + node.level * 18}px` }}
            >
              <Button
                type="button"
                variant="ghost"
                className="h-auto min-w-0 flex-1 justify-start gap-2 rounded-xl  py-2 text-left text-sm text-slate-600 hover:bg-slate-50"
                style={{ justifyContent: "flex-start" }}
                onClick={() => onEditService(service.id, node.id)}
              >
                <Tag className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span className="truncate">{service.name}</span>
              </Button>
            </div>
          ))}
        </div>
      </Collapsible>
    </div>
  );
}

function TreeEmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <Card className="rounded-3xl border-dashed border-slate-200/80 shadow-none">
      <CardContent className="px-5 py-12 text-center">
        <div className="mb-3 inline-flex rounded-2xl bg-slate-100 p-3">
          {icon}
        </div>
        <p className="text-sm font-medium text-slate-700">{title}</p>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
        {actionLabel && onAction ? (
          <Button className="mt-4 rounded-2xl" onClick={onAction}>
            {actionLabel}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ServiceContentPanel({
  selectedCategory,
  categoryPath,
  tab,
  onTabChange,
  sortBy,
  onSortChange,
  checkedServiceIds,
  onMoveChecked,
  onDeleteChecked,
  onAddService,
  servicesInSelectedCategory,
  allVisibleChecked,
  onToggleAllChecked,
  onToggleServiceChecked,
  onEditService,
  onDuplicateService,
  immediateSubcategories,
  getServiceCountForCategory,
  onOpenSubcategory,
  onAddSubcategory,
  onRenameSubcategory,
  onDeleteSubcategory,
}: {
  selectedCategory?: ServiceCategory;
  categoryPath: ServiceCategory[];
  tab: string;
  onTabChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  checkedServiceIds: string[];
  onMoveChecked: () => void;
  onDeleteChecked: () => void;
  onAddService: () => void;
  servicesInSelectedCategory: CatalogService[];
  allVisibleChecked: boolean;
  onToggleAllChecked: (checked: boolean) => void;
  onToggleServiceChecked: (serviceId: string, checked: boolean) => void;
  onEditService: (serviceId: string) => void;
  onDuplicateService: (service: CatalogService) => void;
  immediateSubcategories: ServiceCategory[];
  getServiceCountForCategory: (categoryId: string) => number;
  onOpenSubcategory: (subcategoryId: string) => void;
  onAddSubcategory: () => void;
  onRenameSubcategory: (subcategory: ServiceCategory) => void;
  onDeleteSubcategory: (subcategoryId: string) => void;
}) {
  return (
    <Card className="flex min-h-0 flex-col overflow-visible rounded-3xl border-slate-200/80 shadow-sm">
      <CardHeader className="gap-4 border-b border-slate-200/80 bg-white p-6 pb-4">
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <span>Services</span>
          {categoryPath.map((category) => (
            <span key={category.id} className="inline-flex items-center gap-2">
              <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
              <span
                className={
                  category.id === selectedCategory?.id
                    ? "font-semibold text-slate-900"
                    : ""
                }
              >
                {category.name}
              </span>
            </span>
          ))}
        </div>
      </CardHeader>

      {!selectedCategory ? (
        <div className="grid min-h-0 flex-1 place-items-center p-6">
          <Card className="w-full max-w-xl rounded-3xl border-dashed border-slate-200/80 shadow-none">
            <CardContent className="py-16 text-center">
              <p className="text-sm text-slate-600">
                Select a category from the left tree.
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="border-b border-slate-200/80 bg-white px-6 py-4">
            <Tabs value={tab} onValueChange={onTabChange}>
              <div className="flex flex-col gap-4">
                <TabsList className="rounded-2xl bg-slate-100 p-1">
                  <TabsTrigger value="services">Services</TabsTrigger>
                  <TabsTrigger value="subcategories">Subcategories</TabsTrigger>
                </TabsList>

                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    {tab === "services" ? (
                      <>
                        <Select
                          value={sortBy}
                          onValueChange={onSortChange}
                          options={[
                            { value: "name", label: "Sort: Name" },
                            { value: "price", label: "Sort: Price" },
                            { value: "recent", label: "Sort: Recently added" },
                          ]}
                          className="w-56 rounded-2xl"
                        />
                        {checkedServiceIds.length > 0 ? (
                          <>
                            <Button variant="outline" onClick={onMoveChecked}>
                              <MoveRight className="mr-2 h-4 w-4" />
                              Move
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={onDeleteChecked}
                            >
                              Delete
                            </Button>
                          </>
                        ) : null}
                      </>
                    ) : (
                      <p className="text-sm text-slate-500">
                        Immediate child categories under {selectedCategory.name}
                      </p>
                    )}
                  </div>

                  <Button
                    onClick={
                      tab === "services" ? onAddService : onAddSubcategory
                    }
                    className="rounded-2xl"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add
                  </Button>
                </div>
              </div>

              <ScrollArea className="mt-4 min-h-0 flex-1">
                <div className="p-0">
                  <TabsContent value="services">
                    {servicesInSelectedCategory.length === 0 ? (
                      <WorkspaceEmptyState onAdd={onAddService} />
                    ) : (
                      <ServicesTable
                        services={servicesInSelectedCategory}
                        checkedServiceIds={checkedServiceIds}
                        allVisibleChecked={allVisibleChecked}
                        onToggleAllChecked={onToggleAllChecked}
                        onToggleServiceChecked={onToggleServiceChecked}
                        onEditService={onEditService}
                        onDuplicateService={onDuplicateService}
                      />
                    )}
                  </TabsContent>

                  <TabsContent value="subcategories">
                    <SubcategoriesList
                      subcategories={immediateSubcategories}
                      getServiceCountForCategory={getServiceCountForCategory}
                      onOpen={onOpenSubcategory}
                      onRename={onRenameSubcategory}
                      onDelete={onDeleteSubcategory}
                    />
                  </TabsContent>
                </div>
              </ScrollArea>
            </Tabs>
          </div>
        </div>
      )}
    </Card>
  );
}

function WorkspaceEmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <Card className="rounded-3xl border-dashed border-slate-200/80 shadow-none">
      <CardContent className="px-6 py-20 text-center">
        <div className="mb-3 inline-flex rounded-2xl bg-slate-100 p-3">
          <Sparkles className="h-6 w-6 text-slate-400" />
        </div>
        <p className="text-base font-medium text-slate-700">
          No services in this category
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Add the first service to build this category.
        </p>
        <Button className="mt-5 rounded-2xl" onClick={onAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add service
        </Button>
      </CardContent>
    </Card>
  );
}

function ServicesTable({
  services,
  checkedServiceIds,
  allVisibleChecked,
  onToggleAllChecked,
  onToggleServiceChecked,
  onEditService,
  onDuplicateService,
}: {
  services: CatalogService[];
  checkedServiceIds: string[];
  allVisibleChecked: boolean;
  onToggleAllChecked: (checked: boolean) => void;
  onToggleServiceChecked: (serviceId: string, checked: boolean) => void;
  onEditService: (serviceId: string) => void;
  onDuplicateService: (service: CatalogService) => void;
}) {
  return (
    <Card className="overflow-hidden rounded-3xl border-slate-200/80 shadow-none">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            <colgroup>
              <col className="w-12" />
              <col className="w-[40%]" />
              <col className="w-[16%]" />
              <col className="w-[16%]" />
              <col className="w-[14%]" />
              <col className="w-[14%]" />
            </colgroup>
            <thead className="bg-slate-50/90">
              <tr className="border-b border-slate-200/80 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                <th className="px-4 py-3">
                  <Checkbox
                    checked={allVisibleChecked}
                    onCheckedChange={onToggleAllChecked}
                  />
                </th>
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {services.map((service) => (
                <tr
                  key={service.id}
                  className="border-b border-slate-100 text-sm transition hover:bg-slate-50/70"
                >
                  <td className="px-4 py-3 align-middle">
                    <Checkbox
                      checked={checkedServiceIds.includes(service.id)}
                      onCheckedChange={(checked) =>
                        onToggleServiceChecked(service.id, checked)
                      }
                    />
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-auto max-w-full items-start justify-start whitespace-normal px-0 text-left font-medium text-slate-900 hover:bg-transparent hover:text-brand-600"
                      onClick={() => onEditService(service.id)}
                    >
                      <span className="whitespace-normal break-words text-left">
                        {service.name}
                      </span>
                    </Button>
                    {service.description ? (
                      <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                        {service.description}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-right align-middle text-sm font-medium tabular-nums text-slate-600">
                    {formatINR(service.price)}
                  </td>
                  <td className="px-4 py-3 align-middle text-sm text-slate-500">
                    {service.durationMinutes
                      ? `${service.durationMinutes} min`
                      : "Not set"}
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <Badge
                      className={`rounded-full px-2.5 py-1 ${
                        service.active
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {service.active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <div className="flex items-center gap-2">
                      <Tooltip content="Edit" align="start">
                        <Button
                          variant="ghost"
                          className="h-9 w-9 rounded-full p-0"
                          onClick={() => onEditService(service.id)}
                          aria-label="Edit service"
                        >
                          <PencilIcon className="h-4 w-4 text-slate-600" />
                        </Button>
                      </Tooltip>
                      <Tooltip content="Duplicate" align="start">
                        <Button
                          variant="ghost"
                          className="h-9 w-9 rounded-full p-0"
                          onClick={() => onDuplicateService(service)}
                          aria-label="Duplicate service"
                        >
                          <CopyIcon className="h-4 w-4 text-slate-600" />
                        </Button>
                      </Tooltip>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function SubcategoriesList({
  subcategories,
  getServiceCountForCategory,
  onOpen,
  onRename,
  onDelete,
}: {
  subcategories: ServiceCategory[];
  getServiceCountForCategory: (categoryId: string) => number;
  onOpen: (subcategoryId: string) => void;
  onRename: (subcategory: ServiceCategory) => void;
  onDelete: (subcategoryId: string) => void;
}) {
  if (subcategories.length === 0) {
    return (
      <Card className="rounded-3xl border-dashed border-slate-200/80 shadow-none">
        <CardContent className="px-6 py-20 text-center">
          <p className="text-base font-medium text-slate-700">
            No subcategories yet
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Create one to further organize services.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-3">
      {subcategories.map((subcategory) => (
        <Card
          key={subcategory.id}
          className="rounded-3xl border-slate-200/80 shadow-none"
        >
          <CardContent className="flex items-center justify-between gap-4 p-4">
            <div>
              <p className="font-medium text-slate-900">{subcategory.name}</p>
              <p className="mt-1 text-sm text-slate-500">
                {getServiceCountForCategory(subcategory.id)} services
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => onOpen(subcategory.id)}>
                Open
              </Button>
              <DropdownMenu
                items={[
                  {
                    label: "Rename",
                    onClick: () => onRename(subcategory),
                  },
                  {
                    label: "Delete",
                    destructive: true,
                    onClick: () => onDelete(subcategory.id),
                  },
                ]}
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EditServiceSheet({
  open,
  mode,
  categories,
  serviceForm,
  serviceErrors,
  onClose,
  onCategoryChange,
  onNameChange,
  onPriceChange,
  onDurationChange,
  onDescriptionChange,
  onActiveChange,
  onSave,
}: {
  open: boolean;
  mode: "create" | "edit";
  categories: ServiceCategory[];
  serviceForm: {
    categoryId: string;
    name: string;
    price: string;
    description: string;
    durationMinutes: string;
    active: boolean;
  };
  serviceErrors: {
    categoryId?: string;
    name?: string;
  };
  onClose: () => void;
  onCategoryChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onPriceChange: (value: string) => void;
  onDurationChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onActiveChange: (checked: boolean) => void;
  onSave: () => void;
}) {
  return (
    <Drawer
      open={open}
      title={mode === "create" ? "Add Service" : "Edit Service"}
      onClose={onClose}
      className="bg-slate-50"
      bodyClassName="h-full"
    >
      <div className="flex h-full min-h-0 flex-col">
        <div className="grid gap-6 px-1 pb-24">
          <section className="grid gap-2">
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-slate-700">Category *</span>
              <Select
                value={serviceForm.categoryId}
                onValueChange={onCategoryChange}
                options={categories.map((category) => ({
                  value: category.id,
                  label: category.name,
                }))}
                className="rounded-2xl"
              />
            </label>
            {serviceErrors.categoryId ? (
              <p className="text-xs text-rose-600">
                {serviceErrors.categoryId}
              </p>
            ) : null}
          </section>

          <section className="grid gap-2">
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-slate-700">Service Name *</span>
              <Input
                value={serviceForm.name}
                onChange={(event) => onNameChange(event.target.value)}
                className="h-11 rounded-2xl border-slate-200 bg-white"
              />
            </label>
            {serviceErrors.name ? (
              <p className="text-xs text-rose-600">{serviceErrors.name}</p>
            ) : null}
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-slate-700">Price (INR)</span>
              <Input
                type="number"
                value={serviceForm.price}
                onChange={(event) => onPriceChange(event.target.value)}
                className="h-11 rounded-2xl border-slate-200 bg-white"
              />
            </label>
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-slate-700">
                Duration (minutes)
              </span>
              <Input
                type="number"
                value={serviceForm.durationMinutes}
                onChange={(event) => onDurationChange(event.target.value)}
                className="h-11 rounded-2xl border-slate-200 bg-white"
              />
            </label>
          </section>

          <section className="grid gap-2">
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-slate-700">Description</span>
              <Textarea
                value={serviceForm.description}
                onChange={(event) => onDescriptionChange(event.target.value)}
                className="min-h-[140px] rounded-2xl border-slate-200 bg-white"
              />
            </label>
          </section>

          <section className="rounded-3xl border border-slate-200/80 bg-white p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Active service
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Control whether the service is visible and usable.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={serviceForm.active}
                className={`relative inline-flex h-7 w-12 shrink-0 rounded-full transition ${
                  serviceForm.active ? "bg-brand-500" : "bg-slate-300"
                }`}
                onClick={() => onActiveChange(!serviceForm.active)}
              >
                <span
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
                    serviceForm.active ? "left-6" : "left-1"
                  }`}
                />
              </button>
            </div>
          </section>
        </div>

        <div className="sticky bottom-0 mt-auto -mx-5 border-t border-slate-200 bg-white/95 px-5 py-4 backdrop-blur">
          <Separator className="mb-4 hidden" />
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={onSave}>Save</Button>
          </div>
        </div>
      </div>
    </Drawer>
  );
}
