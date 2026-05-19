import {
  Building2,
  BookOpen,
  CreditCard,
  FileText,
  History,
  LayoutGrid,
  PackagePlus,
  PackageSearch,
  ClipboardList,
  RotateCcw,
  ScrollText,
  ShoppingCart,
  Truck,
  UsersRound,
  Warehouse,
  type LucideIcon,
} from "lucide-react";

export type PartnerSidebarItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
};

export type PartnerSidebarSection = {
  label: string;
  items: PartnerSidebarItem[];
};

export const partnerSidebarSections: PartnerSidebarSection[] = [
  {
    label: "General",
    items: [
      { to: "/partners", label: "Dashboard", icon: LayoutGrid, end: true },
      { to: "/partners/general/firm", label: "Manage firm", icon: Building2 },
      { to: "/partners/general/users", label: "Users", icon: UsersRound },
    ],
  },
  {
    label: "Products",
    items: [
      { to: "/partners/products/brands", label: "Brands", icon: PackageSearch },
      { to: "/partners/products/catalog", label: "Catalog", icon: PackagePlus },
    ],
  },
  {
    label: "Supply",
    items: [
      { to: "/partners/supply/suppliers", label: "Suppliers", icon: Truck },
      { to: "/partners/supply/purchases", label: "Purchases", icon: ClipboardList },
      { to: "/partners/supply/supplier-returns", label: "Returns", icon: RotateCcw },
      { to: "/partners/supply/purchase-history", label: "Purchase History", icon: History },
    ],
  },
  {
    label: "Stock",
    items: [
      { to: "/partners/stock/inventory", label: "Inventory", icon: Warehouse },
    ],
  },
  {
    label: "Sales",
    items: [
      { to: "/partners/sales/clients", label: "Clients", icon: UsersRound },
      { to: "/partners/sales/orders", label: "Active Orders", icon: ShoppingCart },
      { to: "/partners/sales/back-orders", label: "Back Orders", icon: PackageSearch },
      { to: "/partners/sales/order-history", label: "Order History", icon: History },
    ],
  },
  {
    label: "Finance",
    items: [
      { to: "/partners/finance/invoices", label: "Invoices", icon: FileText },
      { to: "/partners/finance/receivables", label: "Receivables", icon: ScrollText },
      { to: "/partners/finance/payments", label: "Payments", icon: CreditCard },
      { to: "/partners/finance/client-ledger", label: "Client Ledger", icon: BookOpen },
      { to: "/partners/finance/credit-notes", label: "Credit Notes", icon: ScrollText },
      { to: "/partners/finance/payables", label: "Payables", icon: ScrollText },
    ],
  },
];
