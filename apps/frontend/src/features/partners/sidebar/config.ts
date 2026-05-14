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
      { to: "/partners/settings/firm", label: "Manage firm", icon: Building2 },
      { to: "/partners/settings/access", label: "Users", icon: UsersRound },
    ],
  },
  {
    label: "Products",
    items: [
      { to: "/partners/brands", label: "Brands", icon: PackageSearch },
      { to: "/partners/items", label: "Catalog", icon: PackagePlus },
    ],
  },
  {
    label: "Supply",
    items: [
      { to: "/partners/suppliers", label: "Suppliers", icon: Truck },
      { to: "/partners/purchases", label: "Purchases", icon: ClipboardList },
      { to: "/partners/history", label: "Purchase History", icon: History },
    ],
  },
  {
    label: "Stock",
    items: [
      { to: "/partners/stock", label: "Inventory", icon: Warehouse },
    ],
  },
  {
    label: "Sales",
    items: [
      { to: "/partners/clients", label: "Clients", icon: UsersRound },
      { to: "/partners/orders", label: "Active Orders", icon: ShoppingCart },
      { to: "/partners/backorders", label: "Back Orders", icon: PackageSearch },
      { to: "/partners/order-history", label: "Order History", icon: History },
    ],
  },
  {
    label: "Finance",
    items: [
      { to: "/partners/invoices", label: "Invoices", icon: FileText },
      { to: "/partners/receivables", label: "Receivables", icon: ScrollText },
      { to: "/partners/payments", label: "Payments", icon: CreditCard },
      { to: "/partners/client-ledger", label: "Client Ledger", icon: BookOpen },
      { to: "/partners/credit-notes", label: "Credit Notes", icon: ScrollText },
      { to: "/partners/payables", label: "Payables", icon: ScrollText },
    ],
  },
];
