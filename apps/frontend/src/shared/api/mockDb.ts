// @ts-nocheck
import type {
  PartnerAuditLog,
  Client,
  DayEntry,
  EntityMember,
  Invite,
  InviteStatus,
  PartnerBrand,
  PartnerClient,
  PartnerClientBusiness,
  PartnerClientPurchaseHistoryRow,
  PartnerClientOutlet,
  PartnerCreditNote,
  PartnerCreditNoteLine,
  PartnerDashboardStats,
  PartnerDebitNote,
  PartnerDebitNoteLine,
  PartnerFirm,
  PartnerFirmInvite,
  PartnerFirmMembership,
  PartnerFirmRole,
  PartnerGlobalSearchResult,
  PartnerGoodsReceipt,
  PartnerInventoryHistoryEntry,
  PartnerInventoryItem,
  PartnerInventoryReceipt,
  PartnerInventoryUpdateInput,
  PartnerInvoice,
  PartnerInvoiceItem,
  PartnerClientLedgerEntry,
  PartnerCatalogItem,
  PartnerItem,
  PartnerOrder,
  PartnerOrderBillableLine,
  PartnerOrderItem,
  PartnerPayment,
  PartnerPaymentMode,
  PartnerPayablesSummary,
  PartnerReceivablesSummary,
  PartnerPurchase,
  PartnerPurchaseItem,
  PartnerSalesReturn,
  PartnerSalesReturnLine,
  PartnerSalesReportRow,
  PartnerSupplier,
  PartnerSupplierInvoice,
  PartnerSupplierLedgerEntry,
  PartnerSupplierPayment,
  PartnerStockActionInput,
  PartnerStockLedgerEntry,
  PartnerStockLedgerFilters,
  PartnerStockMovementReportRow,
  PartnerStockRow,
  PaymentRecord,
  PaymentStatus,
  Service,
  ServiceCategory,
  StaffServiceCapability,
} from "@shared/types/domain";
import { makeId } from "@shared/lib/id";
import { todayISO } from "@shared/lib/date";

type MockAuthUser = {
  id: number;
  name: string;
  phone: string;
  birthDate?: string;
};

let currentUser: MockAuthUser = {
  id: 1,
  name: "Kevin Arora",
  phone: "9876500000",
  birthDate: "",
};
let authenticated = true;
let authUsers: MockAuthUser[] = [currentUser];

const loginOtps: Record<string, string> = {};

let clients: Client[] = [
  { id: "client_1", name: "Serenity Spa & Wellness", clientType: "SPA" },
  { id: "client_2", name: "Pulse Fitness Studio", clientType: "FITNESS" },
];

let entityMembers: EntityMember[] = [
  {
    userId: currentUser.id,
    entityId: "client_1",
    name: "Kevin Arora",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80",
    phone: currentUser.phone,
    role: "OWNER",
    status: "ACTIVE",
    joinedAt: "2026-02-01T10:00:00.000Z",
  },
  {
    userId: 2,
    entityId: "client_1",
    name: "Riya Mehta",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80",
    phone: "9876500001",
    role: "MANAGER",
    status: "ACTIVE",
    joinedAt: "2026-02-03T10:00:00.000Z",
  },
  {
    userId: 3,
    entityId: "client_1",
    name: "Arjun Nair",
    avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80",
    phone: "9876500002",
    role: "STAFF",
    status: "ACTIVE",
    joinedAt: "2026-02-05T10:00:00.000Z",
  },
  {
    userId: 4,
    entityId: "client_1",
    name: "Maya Singh",
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80",
    phone: "9876500003",
    role: "ACCOUNT_MANAGER",
    status: "ACTIVE",
    joinedAt: "2026-02-06T10:00:00.000Z",
  },
];

let invites: Invite[] = [
  {
    id: "inv_1",
    entityId: "client_1",
    phone: "9876500008",
    role: "STAFF",
    token: "invite_staff_pending",
    status: "PENDING",
    expiresAt: "2026-03-07T10:00:00.000Z",
    createdAt: "2026-02-28T10:00:00.000Z",
  },
  {
    id: "inv_2",
    entityId: "client_2",
    phone: currentUser.phone,
    role: "MANAGER",
    token: "invite_current_user_client2",
    status: "PENDING",
    expiresAt: "2026-03-07T12:00:00.000Z",
    createdAt: "2026-02-28T12:00:00.000Z",
  },
  {
    id: "inv_3",
    entityId: "client_1",
    phone: "9876500009",
    role: "ACCOUNT_MANAGER",
    token: "invite_account_manager_pending",
    status: "ACCEPTED",
    expiresAt: "2026-03-07T14:00:00.000Z",
    createdAt: "2026-02-28T14:00:00.000Z",
  },
];

let services: Service[] = [
  { id: "svc_1", clientId: "client_1", categoryId: "cat_haircuts", name: "Men Haircut", categoryPath: "Hair Services > Haircuts & Styling", price: 30, durationMinutes: 30, active: true },
  { id: "svc_2", clientId: "client_1", categoryId: "cat_coloring", name: "Global color", categoryPath: "Hair Services > Coloring", price: 80, durationMinutes: 60, active: true },
  { id: "svc_3", clientId: "client_1", categoryId: "cat_manicure", name: "Classic Manicure", categoryPath: "Nail Care > Manicure", price: 50, durationMinutes: 45, active: true },
  { id: "svc_4", clientId: "client_1", categoryId: "cat_facials", name: "Hydra Glow Facial", categoryPath: "Skin Services > Facials", price: 25, durationMinutes: 30, active: true },
  { id: "svc_5", clientId: "client_1", categoryId: "cat_treatments", name: "Hair Spa", categoryPath: "Hair Services > Treatments", price: 90, durationMinutes: 60, active: true },
  { id: "svc_6", clientId: "client_1", categoryId: "cat_pedicure", name: "Luxe Pedicure", categoryPath: "Nail Care > Pedicure", price: 35, durationMinutes: 40, active: true },
  { id: "svc_7", clientId: "client_1", categoryId: "cat_haircuts", name: "Women Haircut", categoryPath: "Hair Services > Haircuts & Styling", price: 45, durationMinutes: 45, active: true },
  { id: "svc_8", clientId: "client_1", categoryId: "cat_haircuts", name: "Blowout - Standard", categoryPath: "Hair Services > Haircuts & Styling", price: 40, durationMinutes: 40, active: true },
  { id: "svc_9", clientId: "client_1", categoryId: "cat_haircuts", name: "Blowout - Luxury", categoryPath: "Hair Services > Haircuts & Styling", price: 60, durationMinutes: 60, active: true },
  { id: "svc_10", clientId: "client_1", categoryId: "cat_coloring", name: "Root touch-up", categoryPath: "Hair Services > Coloring", price: 50, durationMinutes: 50, active: true },
  { id: "svc_11", clientId: "client_1", categoryId: "cat_treatments", name: "Keratin", categoryPath: "Hair Services > Treatments", price: 120, durationMinutes: 120, active: true },
];

let serviceCategories: ServiceCategory[] = [
  { id: "cat_hair", clientId: "client_1", name: "Hair Services", sortOrder: 1 },
  { id: "cat_haircuts", clientId: "client_1", name: "Haircuts & Styling", parentId: "cat_hair", sortOrder: 1 },
  { id: "cat_coloring", clientId: "client_1", name: "Coloring", parentId: "cat_hair", sortOrder: 2 },
  { id: "cat_treatments", clientId: "client_1", name: "Treatments", parentId: "cat_hair", sortOrder: 3 },
  { id: "cat_nails", clientId: "client_1", name: "Nail Care", sortOrder: 2 },
  { id: "cat_manicure", clientId: "client_1", name: "Manicure", parentId: "cat_nails", sortOrder: 1 },
  { id: "cat_pedicure", clientId: "client_1", name: "Pedicure", parentId: "cat_nails", sortOrder: 2 },
  { id: "cat_skin", clientId: "client_1", name: "Skin Services", sortOrder: 3 },
  { id: "cat_facials", clientId: "client_1", name: "Facials", parentId: "cat_skin", sortOrder: 1 },
];

let staffServiceCapabilities: StaffServiceCapability[] = [
  { entityId: "client_1", userId: 3, serviceId: "svc_1", isEnabled: true },
  { entityId: "client_1", userId: 3, serviceId: "svc_2", isEnabled: true },
  { entityId: "client_1", userId: 3, serviceId: "svc_4", isEnabled: true },
];

let dayEntries: DayEntry[] = [
  {
    id: "de_1",
    visitId: "visit_1",
    clientId: "client_1",
    date: todayISO(),
    startTime: "10:00",
    serviceId: "svc_5",
    staffId: 3,
    staffIds: [3],
    customerName: "Suresh Iyer",
    customerPhone: "9898989890",
    note: "Shoulder focus",
    status: "in_progress",
    paymentStatus: "partial",
    paidAmount: 40,
  },
  {
    id: "de_1b",
    visitId: "visit_1",
    clientId: "client_1",
    date: todayISO(),
    startTime: "10:00",
    serviceId: "svc_3",
    staffId: 3,
    staffIds: [3],
    customerName: "Suresh Iyer",
    customerPhone: "9898989890",
    note: "Add-on cleanup",
    status: "planned",
    paymentStatus: "unpaid",
    paidAmount: 0,
  },
  {
    id: "de_2",
    visitId: "visit_2",
    clientId: "client_1",
    date: todayISO(),
    startTime: "11:00",
    serviceId: "svc_4",
    staffId: 3,
    staffIds: [3],
    customerName: "Anita Desai",
    customerPhone: "9787878787",
    note: "Walk-in",
    status: "planned",
    paymentStatus: "unpaid",
    paidAmount: 0,
  },
  {
    id: "de_3",
    visitId: "visit_3",
    clientId: "client_1",
    date: todayISO(),
    startTime: "12:30",
    serviceId: "svc_1",
    staffId: 3,
    staffIds: [3],
    customerName: "Neha Gupta",
    customerPhone: "9676767676",
    note: "Regular customer",
    status: "done",
    paymentStatus: "paid",
    paidAmount: 30,
  },
  {
    id: "de_4",
    visitId: "visit_4",
    clientId: "client_1",
    date: todayISO(),
    startTime: "14:00",
    serviceId: "svc_3",
    staffId: 3,
    staffIds: [3],
    customerName: "Lakshmi Rao",
    customerPhone: "9565656565",
    note: "Remaining balance",
    status: "done",
    paymentStatus: "partial",
    paidAmount: 20,
  },
];

let paymentRecords: PaymentRecord[] = [];

let partnerFirms: PartnerFirm[] = [
  {
    id: 1,
    name: "HR Enterprise",
    tradeName: "HR Enterprise Beauty Supply",
    gstin: "29AAAFH1111Q1Z5",
    billingAddress: "22 MG Road, Bengaluru",
    city: "Bengaluru",
    ownerName: "Harsh Rao",
    phone: "9810011122",
    email: "harsh@hrenterprise.in",
    status: "ACTIVE",
    createdAt: "2026-02-20T08:00:00.000Z",
    updatedAt: "2026-03-10T08:00:00.000Z",
  },
  {
    id: 2,
    name: "Sita Sales Corporation",
    tradeName: "Sita Sales",
    gstin: "07AAAFS2222P1Z3",
    billingAddress: "11 Rajouri Garden, New Delhi",
    city: "New Delhi",
    ownerName: "Tanya Bedi",
    phone: "9810011144",
    email: "hello@sitasales.in",
    status: "ACTIVE",
    createdAt: "2026-02-24T08:00:00.000Z",
    updatedAt: "2026-03-11T08:00:00.000Z",
  },
  {
    id: 3,
    name: "Shree Shyam Corporation",
    tradeName: "Zistributo Ahmedabad",
    gstin: "24AADCS2211M1Z2",
    billingAddress: "C G Road, Navrangpura, Ahmedabad",
    city: "Ahmedabad",
    ownerName: "Kevin Arora",
    phone: "9876500000",
    email: "kevin@zistributo.in",
    status: "ACTIVE",
    createdAt: "2026-03-01T08:00:00.000Z",
    updatedAt: "2026-03-17T08:00:00.000Z",
  },
];
let activePartnerFirmId = 3;
let partnerFirmMemberships: Array<{
  userId: number;
  firmId: number;
  role: "OWNER" | "STAFF" | "ACCOUNTANT" | "DELIVERY_PARTNER";
  status: "ACTIVE" | "SUSPENDED";
}> = [
  { userId: currentUser.id, firmId: 1, role: "OWNER", status: "ACTIVE" },
  { userId: currentUser.id, firmId: 2, role: "OWNER", status: "ACTIVE" },
  { userId: currentUser.id, firmId: 3, role: "OWNER", status: "ACTIVE" },
];

let partnerFirmInvites: PartnerFirmInvite[] = [
  {
    id: "pfinv_1",
    firmId: 3,
    phone: "9810099771",
    role: "STAFF",
    status: "PENDING",
    invitedBy: currentUser.id,
    expiresAt: "2026-04-06T10:00:00.000Z",
    createdAt: "2026-03-30T10:00:00.000Z",
  },
];

let partnerBrands: Array<PartnerBrand & { itemCount: number }> = [
  { id: 1, name: "L'Oréal", itemCount: 2 },
  { id: 2, name: "Wella", itemCount: 2 },
  { id: 3, name: "Schwarzkopf", itemCount: 2 },
  { id: 4, name: "Matrix", itemCount: 2 },
  { id: 5, name: "L'Oréal", itemCount: 2 },
  { id: 6, name: "Matrix", itemCount: 2 },
];

let partnerFirmBrands: Array<{ firmId: number; brandId: number }> = [
  { firmId: 1, brandId: 1 },
  { firmId: 1, brandId: 2 },
  { firmId: 2, brandId: 3 },
  { firmId: 2, brandId: 4 },
  { firmId: 3, brandId: 5 },
  { firmId: 3, brandId: 6 },
];

let partnerItems: PartnerItem[] = [
  { id: "pitem_1", brandId: 1, itemCode: "ITM-000001", name: "Absolut Repair Shampoo 300ml", description: "", hsnCode: "", sku: "LOR-SHAM-300", mrp: 690, discountPercentage: 0, currentStockQty: 0, status: "ACTIVE", updatedAt: new Date().toISOString() },
  { id: "pitem_2", brandId: 1, itemCode: "ITM-000002", name: "Metal Detox Mask 250ml", description: "", hsnCode: "", sku: "LOR-MASK-250", mrp: 940, discountPercentage: 0, currentStockQty: 0, status: "ACTIVE", updatedAt: new Date().toISOString() },
  { id: "pitem_3", brandId: 2, itemCode: "ITM-000003", name: "Invigo Nutri Enrich Shampoo 250ml", description: "", hsnCode: "", sku: "WEL-SHAM-250", mrp: 560, discountPercentage: 0, currentStockQty: 0, status: "ACTIVE", updatedAt: new Date().toISOString() },
  { id: "pitem_4", brandId: 2, itemCode: "ITM-000004", name: "EIMI Styling Gel 150ml", description: "", hsnCode: "", sku: "WEL-GEL-150", mrp: 430, discountPercentage: 0, currentStockQty: 0, status: "ACTIVE", updatedAt: new Date().toISOString() },
  { id: "pitem_5", brandId: 3, itemCode: "ITM-000005", name: "BC Bonacure Moisture Kick 250ml", description: "", hsnCode: "", sku: "SCH-SHAM-250", mrp: 620, discountPercentage: 0, currentStockQty: 0, status: "ACTIVE", updatedAt: new Date().toISOString() },
  { id: "pitem_6", brandId: 3, itemCode: "ITM-000006", name: "OSiS+ Dust It 10g", description: "", hsnCode: "", sku: "SCH-DUST-010", mrp: 780, discountPercentage: 0, currentStockQty: 0, status: "ACTIVE", updatedAt: new Date().toISOString() },
  { id: "pitem_7", brandId: 4, itemCode: "ITM-000007", name: "Opti.Care Smooth Straight Shampoo 200ml", description: "", hsnCode: "", sku: "MAT-SHAM-200", mrp: 390, discountPercentage: 0, currentStockQty: 0, status: "ACTIVE", updatedAt: new Date().toISOString() },
  { id: "pitem_8", brandId: 4, itemCode: "ITM-000008", name: "Biolage Hair Serum 100ml", description: "", hsnCode: "", sku: "MAT-SER-100", mrp: 520, discountPercentage: 0, currentStockQty: 0, status: "INACTIVE", updatedAt: new Date().toISOString() },
  { id: "pitem_9", brandId: 5, itemCode: "ITM-000009", name: "Absolut Repair Shampoo 300ml", description: "", hsnCode: "", sku: "LOR-SHAM-300", mrp: 690, discountPercentage: 0, currentStockQty: 0, status: "ACTIVE", updatedAt: new Date().toISOString() },
  { id: "pitem_10", brandId: 5, itemCode: "ITM-000010", name: "Metal Detox Mask 250ml", description: "", hsnCode: "", sku: "LOR-MASK-250", mrp: 940, discountPercentage: 0, currentStockQty: 0, status: "ACTIVE", updatedAt: new Date().toISOString() },
  { id: "pitem_11", brandId: 6, itemCode: "ITM-000011", name: "Opti.Care Smooth Straight Shampoo 200ml", description: "", hsnCode: "", sku: "MAT-SHAM-200", mrp: 390, discountPercentage: 0, currentStockQty: 0, status: "ACTIVE", updatedAt: new Date().toISOString() },
  { id: "pitem_12", brandId: 6, itemCode: "ITM-000012", name: "Biolage Hair Serum 100ml", description: "", hsnCode: "", sku: "MAT-SER-100", mrp: 520, discountPercentage: 0, currentStockQty: 0, status: "INACTIVE", updatedAt: new Date().toISOString() },
];

let partnerCatalogItems: PartnerCatalogItem[] = Array.from(
  new Map(
    partnerItems.map((item) => [
      `${item.brandId}:${item.sku.trim().toLowerCase()}`,
      {
        id: makeId("pcat"),
        brandId: item.brandId,
        name: item.name,
        description: item.description,
        hsnCode: item.hsnCode,
        sku: item.sku,
        defaultMrp: item.mrp,
        defaultDiscountPercentage: item.discountPercentage ?? 0,
        status: item.status,
        updatedAt: item.updatedAt,
      } satisfies PartnerCatalogItem,
    ]),
  ).values(),
);

let partnerFirmInventoryItems: PartnerInventoryItem[] = [
  {
    firmId: 1,
    itemId: "pfi_1",
    catalogItemId: partnerCatalogItems.find((item) => item.brandId === 1 && item.sku === "LOR-SHAM-300")?.id ?? "",
    brandId: 1,
    itemName: "Absolut Repair Shampoo 300ml",
    sku: "LOR-SHAM-300",
    mrp: 690,
    discountPercentage: 10,
    status: "ACTIVE",
    quantity: 24,
    updatedAt: new Date().toISOString(),
    lastSupplierId: "psup_1",
    lastSupplierName: "Prime Beauty Supply",
    lastReceivedAt: new Date().toISOString(),
  },
  {
    firmId: 1,
    itemId: "pfi_2",
    catalogItemId: partnerCatalogItems.find((item) => item.brandId === 1 && item.sku === "LOR-MASK-250")?.id ?? "",
    brandId: 1,
    itemName: "Metal Detox Mask 250ml",
    sku: "LOR-MASK-250",
    mrp: 940,
    discountPercentage: 12.5,
    status: "ACTIVE",
    quantity: 12,
    updatedAt: new Date().toISOString(),
    lastSupplierId: "psup_1",
    lastSupplierName: "Prime Beauty Supply",
    lastReceivedAt: new Date().toISOString(),
  },
  {
    firmId: 1,
    itemId: "pfi_3",
    catalogItemId: partnerCatalogItems.find((item) => item.brandId === 2 && item.sku === "WEL-SHAM-250")?.id ?? "",
    brandId: 2,
    itemName: "Invigo Nutri Enrich Shampoo 250ml",
    sku: "WEL-SHAM-250",
    mrp: 560,
    discountPercentage: 8,
    status: "ACTIVE",
    quantity: 18,
    updatedAt: new Date().toISOString(),
    lastSupplierId: "psup_2",
    lastSupplierName: "Salon Source India",
    lastReceivedAt: new Date().toISOString(),
  },
  {
    firmId: 3,
    itemId: "pfi_4",
    catalogItemId: partnerCatalogItems.find((item) => item.brandId === 5 && item.sku === "LOR-SHAM-300")?.id ?? "",
    brandId: 5,
    itemName: "Absolut Repair Shampoo 300ml",
    sku: "LOR-SHAM-300",
    mrp: 690,
    discountPercentage: 9,
    status: "ACTIVE",
    quantity: 9,
    updatedAt: new Date().toISOString(),
    lastSupplierId: "psup_3",
    lastSupplierName: "Northern Haircare Depot",
    lastReceivedAt: new Date().toISOString(),
  },
];

let partnerInventoryReceipts: PartnerInventoryReceipt[] = [
  { id: "prec_1", firmId: 1, supplyInwardId: "psi_1", itemId: "pfi_1", supplierId: "psup_1", supplierName: "Prime Beauty Supply", quantity: 24, receivedAt: new Date().toISOString(), note: "Opening receipt", status: "POSTED", createdAt: new Date().toISOString() },
  { id: "prec_2", firmId: 1, supplyInwardId: "psi_2", itemId: "pfi_2", supplierId: "psup_1", supplierName: "Prime Beauty Supply", quantity: 12, receivedAt: new Date().toISOString(), note: "Opening receipt", status: "POSTED", createdAt: new Date().toISOString() },
  { id: "prec_3", firmId: 1, supplyInwardId: "psi_3", itemId: "pfi_3", supplierId: "psup_2", supplierName: "Salon Source India", quantity: 18, receivedAt: new Date().toISOString(), note: "Opening receipt", status: "POSTED", createdAt: new Date().toISOString() },
  { id: "prec_4", firmId: 3, supplyInwardId: "psi_4", itemId: "pfi_4", supplierId: "psup_3", supplierName: "Northern Haircare Depot", quantity: 9, receivedAt: new Date().toISOString(), note: "Opening receipt", status: "POSTED", createdAt: new Date().toISOString() },
];

let partnerSupplyInwards: Array<{
  id: string;
  firmId: number;
  brandId: number;
  supplierId: string;
  supplierName: string;
  receivedAt: string;
  note: string;
  status: "POSTED" | "REVERTED";
  revertedAt?: string;
  revertReason?: string;
  createdAt: string;
}> = [
  {
    id: "psi_1",
    firmId: 1,
    brandId: 1,
    supplierId: "psup_1",
    supplierName: "Prime Beauty Supply",
    receivedAt: partnerInventoryReceipts[0].receivedAt,
    note: "Opening receipt",
    status: "POSTED",
    createdAt: partnerInventoryReceipts[0].createdAt,
  },
  {
    id: "psi_2",
    firmId: 1,
    brandId: 1,
    supplierId: "psup_1",
    supplierName: "Prime Beauty Supply",
    receivedAt: partnerInventoryReceipts[1].receivedAt,
    note: "Opening receipt",
    status: "POSTED",
    createdAt: partnerInventoryReceipts[1].createdAt,
  },
  {
    id: "psi_3",
    firmId: 1,
    brandId: 2,
    supplierId: "psup_2",
    supplierName: "Salon Source India",
    receivedAt: partnerInventoryReceipts[2].receivedAt,
    note: "Opening receipt",
    status: "POSTED",
    createdAt: partnerInventoryReceipts[2].createdAt,
  },
  {
    id: "psi_4",
    firmId: 3,
    brandId: 5,
    supplierId: "psup_3",
    supplierName: "Northern Haircare Depot",
    receivedAt: partnerInventoryReceipts[3].receivedAt,
    note: "Opening receipt",
    status: "POSTED",
    createdAt: partnerInventoryReceipts[3].createdAt,
  },
];

let partnerInventoryAdjustments: Array<{
  id: string;
  firmId: number;
  itemId: string;
  quantityFrom: number;
  quantityTo: number;
  note: string;
  createdAt: string;
}> = [
  {
    id: "padj_1",
    firmId: 1,
    itemId: "pfi_1",
    quantityFrom: 96,
    quantityTo: 100,
    note: "Manual count correction after shelf reconciliation.",
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];

let partnerClientBusinesses: PartnerClientBusiness[] = [
  {
    id: "pbiz_pclient_1",
    firmId: 1,
    businessName: "Glam Hub Salon",
    gstin: "29AAACG1234Q1Z6",
    billingName: "Glam Hub Salon",
    billingAddress: "MG Road, Bengaluru",
    contacts: [
      { id: "pbc_1", firmId: 1, clientBusinessId: "pbiz_pclient_1", name: "Harsh Rao", phone: "9810011122", isPrimary: true, sortOrder: 0 },
    ],
    outletCount: 2,
    outlets: [
      {
        id: "pout_pclient_1",
        firmId: 1,
        clientBusinessId: "pbiz_pclient_1",
        outletName: "Glam Hub Salon Main",
        address: "MG Road, Bengaluru",
        contacts: [
          { id: "poc_1", firmId: 1, outletId: "pout_pclient_1", name: "Harsh Rao", phone: "9810011122", isPrimary: true, sortOrder: 0 },
        ],
        isPrimary: true,
        status: "ACTIVE",
      },
      {
        id: "pout_glamhub_indiranagar",
        firmId: 1,
        clientBusinessId: "pbiz_pclient_1",
        outletName: "Glam Hub Salon Indiranagar",
        address: "12th Main, Indiranagar, Bengaluru",
        contacts: [
          { id: "poc_1b", firmId: 1, outletId: "pout_glamhub_indiranagar", name: "Roshni", phone: "9810011188", isPrimary: true, sortOrder: 0 },
        ],
        isPrimary: false,
        status: "ACTIVE",
      },
    ],
  },
  {
    id: "pbiz_pclient_2",
    firmId: 1,
    businessName: "Urban Style Studio",
    gstin: "",
    billingName: "Urban Style Studio",
    billingAddress: "HSR Layout, Bengaluru",
    contacts: [
      { id: "pbc_2", firmId: 1, clientBusinessId: "pbiz_pclient_2", name: "Naveen Arora", phone: "9810011133", isPrimary: true, sortOrder: 0 },
    ],
    outletCount: 1,
    outlets: [
      {
        id: "pout_pclient_2",
        firmId: 1,
        clientBusinessId: "pbiz_pclient_2",
        outletName: "Urban Style Studio Main",
        address: "HSR Layout, Bengaluru",
        contacts: [
          { id: "poc_2", firmId: 1, outletId: "pout_pclient_2", name: "Naveen Arora", phone: "9810011133", isPrimary: true, sortOrder: 0 },
        ],
        isPrimary: true,
        status: "ACTIVE",
      },
    ],
  },
  {
    id: "pbiz_pclient_3",
    firmId: 2,
    businessName: "The Color Room",
    gstin: "07AAACT9988P1Z1",
    billingName: "The Color Room",
    billingAddress: "Janakpuri, New Delhi",
    contacts: [
      { id: "pbc_3", firmId: 2, clientBusinessId: "pbiz_pclient_3", name: "Tanya Bedi", phone: "9810011144", isPrimary: true, sortOrder: 0 },
    ],
    outletCount: 2,
    outlets: [
      {
        id: "pout_pclient_3",
        firmId: 2,
        clientBusinessId: "pbiz_pclient_3",
        outletName: "The Color Room Main",
        address: "Janakpuri, New Delhi",
        contacts: [
          { id: "poc_3", firmId: 2, outletId: "pout_pclient_3", name: "Tanya Bedi", phone: "9810011144", isPrimary: true, sortOrder: 0 },
        ],
        isPrimary: true,
        status: "ACTIVE",
      },
      {
        id: "pout_colorroom_rajouri",
        firmId: 2,
        clientBusinessId: "pbiz_pclient_3",
        outletName: "The Color Room Rajouri Garden",
        address: "Ring Road, Rajouri Garden, New Delhi",
        contacts: [
          { id: "poc_3b", firmId: 2, outletId: "pout_colorroom_rajouri", name: "Aman", phone: "9810011199", isPrimary: true, sortOrder: 0 },
        ],
        isPrimary: false,
        status: "ACTIVE",
      },
    ],
  },
  {
    id: "pbiz_pclient_4",
    firmId: 2,
    businessName: "Crown Unisex Salon",
    gstin: "",
    billingName: "Crown Unisex Salon",
    billingAddress: "Dwarka, New Delhi",
    contacts: [
      { id: "pbc_4", firmId: 2, clientBusinessId: "pbiz_pclient_4", name: "Crown Unisex Salon", phone: "9810011155", isPrimary: true, sortOrder: 0 },
    ],
    outletCount: 1,
    outlets: [
      {
        id: "pout_pclient_4",
        firmId: 2,
        clientBusinessId: "pbiz_pclient_4",
        outletName: "Crown Unisex Salon Main",
        address: "Dwarka, New Delhi",
        contacts: [
          { id: "poc_4", firmId: 2, outletId: "pout_pclient_4", name: "Crown Unisex Salon", phone: "9810011155", isPrimary: true, sortOrder: 0 },
        ],
        isPrimary: true,
        status: "INACTIVE",
      },
    ],
  },
  {
    id: "pbiz_pclient_5",
    firmId: 3,
    businessName: "Scissor Story",
    gstin: "24AADCS2211M1Z2",
    billingName: "Scissor Story",
    billingAddress: "Navrangpura, Ahmedabad",
    contacts: [
      { id: "pbc_5", firmId: 3, clientBusinessId: "pbiz_pclient_5", name: "Kevin Arora", phone: "9810011166", isPrimary: true, sortOrder: 0 },
      { id: "pbc_6", firmId: 3, clientBusinessId: "pbiz_pclient_5", name: "Aman Gupta", phone: "9810011266", isPrimary: false, sortOrder: 1 },
    ],
    outletCount: 1,
    outlets: [
      {
        id: "pout_pclient_5",
        firmId: 3,
        clientBusinessId: "pbiz_pclient_5",
        outletName: "Scissor Story Main",
        address: "Navrangpura, Ahmedabad",
        contacts: [
          { id: "poc_5", firmId: 3, outletId: "pout_pclient_5", name: "Kevin Arora", phone: "9810011166", isPrimary: true, sortOrder: 0 },
          { id: "poc_6", firmId: 3, outletId: "pout_pclient_5", name: "Aman Gupta", phone: "9810011266", isPrimary: false, sortOrder: 1 },
        ],
        isPrimary: true,
        status: "ACTIVE",
      },
    ],
  },
];

let partnerStockEntries: PartnerStockLedgerEntry[] = [
  { id: "pstock_1", firmId: 1, itemId: "pitem_1", quantityDelta: 24, reasonType: "OPENING_STOCK", note: "Initial stock", createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "pstock_2", firmId: 1, itemId: "pitem_2", quantityDelta: 12, reasonType: "OPENING_STOCK", note: "Initial stock", createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "pstock_3", firmId: 1, itemId: "pitem_3", quantityDelta: 18, reasonType: "OPENING_STOCK", note: "Initial stock", createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "pstock_4", firmId: 1, itemId: "pitem_4", quantityDelta: 10, reasonType: "OPENING_STOCK", note: "Initial stock", createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "pstock_5", firmId: 2, itemId: "pitem_5", quantityDelta: 20, reasonType: "OPENING_STOCK", note: "Initial stock", createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "pstock_6", firmId: 2, itemId: "pitem_6", quantityDelta: 8, reasonType: "OPENING_STOCK", note: "Initial stock", createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "pstock_7", firmId: 2, itemId: "pitem_7", quantityDelta: 16, reasonType: "OPENING_STOCK", note: "Initial stock", createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "pstock_8", firmId: 3, itemId: "pitem_9", quantityDelta: 9, reasonType: "OPENING_STOCK", note: "Initial stock", createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "pstock_9", firmId: 3, itemId: "pitem_11", quantityDelta: 14, reasonType: "OPENING_STOCK", note: "Initial stock", createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
];

let partnerOrders: PartnerOrder[] = [];
let partnerInvoices: PartnerInvoice[] = [];
let partnerSuppliers: PartnerSupplier[] = [];
let partnerPurchases: PartnerPurchase[] = [];
let partnerGoodsReceipts: PartnerGoodsReceipt[] = [];
let partnerCreditNotes: PartnerCreditNote[] = [];
let partnerSalesReturns: PartnerSalesReturn[] = [];
let partnerDebitNotes: PartnerDebitNote[] = [];
let partnerPayments: PartnerPayment[] = [];
let partnerLedgerEntries: PartnerClientLedgerEntry[] = [];
let partnerSupplierInvoices: PartnerSupplierInvoice[] = [];
let partnerSupplierPayments: PartnerSupplierPayment[] = [];
let partnerSupplierLedgerEntries: PartnerSupplierLedgerEntry[] = [];
let partnerAuditLogs: PartnerAuditLog[] = [];

const wait = () => new Promise((resolve) => setTimeout(resolve, 120));

function normalizePhone(value: string) {
  return value.replace(/\D/g, "").slice(-10);
}

function getCategoryPath(categoryId?: string) {
  if (!categoryId) return "";

  const parts: string[] = [];
  let cursor = serviceCategories.find((category) => category.id === categoryId);
  while (cursor) {
    parts.unshift(cursor.name);
    cursor = cursor.parentId
      ? serviceCategories.find((category) => category.id === cursor?.parentId)
      : undefined;
  }
  return parts.join(" > ");
}

function getCategoryDescendantIds(categoryId: string) {
  const ids = [categoryId];
  const queue = [categoryId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    const children = serviceCategories.filter(
      (category) => category.parentId === current,
    );
    for (const child of children) {
      ids.push(child.id);
      queue.push(child.id);
    }
  }
  return ids;
}

function computePaymentStatus(amount: number, servicePrice?: number): PaymentStatus {
  if (!servicePrice || amount <= 0) {
    return "unpaid";
  }
  if (amount >= servicePrice) {
    return "paid";
  }
  return "partial";
}

function getAccessibleClients() {
  const entityIds = new Set(
    entityMembers
      .filter((member) => member.userId === currentUser.id && member.status === "ACTIVE")
      .map((member) => member.entityId),
  );

  return clients.filter((client) => entityIds.has(client.id));
}

function expireInviteIfNeeded(invite: Invite) {
  if (invite.status !== "PENDING") return invite;
  if (new Date(invite.expiresAt).getTime() <= Date.now()) {
    return { ...invite, status: "EXPIRED" as InviteStatus };
  }
  return invite;
}

function getPartnerItemStock(firmId: number, itemId: string) {
  return partnerStockEntries
    .filter((entry) => entry.firmId === firmId && entry.itemId === itemId)
    .reduce((sum, entry) => sum + entry.quantityDelta, 0);
}

function normalizePartnerItemName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function buildPartnerConfigSku(baseSku: string | undefined, name: string, mrp: number, discountPercentage: number) {
  const base = (baseSku?.trim() || name)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "ITEM";
  return `${base}-M${Math.round(mrp)}-D${Math.round(discountPercentage)}`;
}

function findPartnerItemConfig(brandId: number, itemName: string, mrp: number, discountPercentage: number) {
  const normalizedName = normalizePartnerItemName(itemName);
  return partnerItems.find(
    (item) =>
      item.brandId === brandId &&
      normalizePartnerItemName(item.name) === normalizedName &&
      item.mrp === mrp &&
      (item.discountPercentage ?? 0) === discountPercentage,
  );
}

function getPartnerItemLastUpdated(firmId: number, itemId: string) {
  const entries = partnerStockEntries
    .filter((entry) => entry.firmId === firmId && entry.itemId === itemId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return entries[0]?.createdAt ?? new Date().toISOString();
}

function getFirmBrandIds(firmId: number) {
  return partnerFirmBrands
    .filter((mapping) => mapping.firmId === firmId)
    .map((mapping) => mapping.brandId);
}

function getPartnerFirmById(firmId: number) {
  return partnerFirms.find((firm) => firm.id === firmId);
}

function flattenPartnerBusiness(business: PartnerClientBusiness): PartnerClient {
  const primaryOutlet = business.outlets.find((outlet) => outlet.isPrimary) ?? business.outlets[0];
  const primaryContact = business.contacts.find((contact) => contact.isPrimary) ?? business.contacts[0];
  return {
    id: business.id,
    firmId: business.firmId,
    name: business.businessName,
    phone: primaryContact?.phone || primaryOutlet?.contacts[0]?.phone || "",
    gstin: business.gstin || "",
    address: primaryOutlet?.address || business.billingAddress || "",
    status: primaryOutlet?.status ?? "INACTIVE",
  };
}

function normalizeGSTIN(value: string) {
  return value.trim().toUpperCase();
}

function isValidGSTIN(value: string) {
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][A-Z0-9]Z[A-Z0-9]$/.test(normalizeGSTIN(value));
}

function normalizePartnerContacts(
  contacts: Array<{ name: string; phone: string }>,
) {
  const next = contacts
    .map((contact) => ({
      name: contact.name.trim(),
      phone: contact.phone.trim(),
    }))
    .filter((contact) => contact.name || contact.phone);

  if (next.length === 0) {
    throw new Error("At least one contact is required");
  }
  if (next.some((contact) => !contact.name || !contact.phone)) {
    throw new Error("Each contact must include name and phone");
  }
  return next;
}

function getPartnerBusinessById(firmId: number, businessId: string) {
  return partnerClientBusinesses.find((business) => business.firmId === firmId && business.id === businessId);
}

function getPartnerBusinessByGSTIN(firmId: number, gstin: string, excludeBusinessId = "") {
  const normalized = normalizeGSTIN(gstin);
  if (!normalized) {
    return undefined;
  }
  return partnerClientBusinesses.find(
    (business) =>
      business.firmId === firmId &&
      business.id !== excludeBusinessId &&
      normalizeGSTIN(business.gstin || "") === normalized,
  );
}

function getPartnerOutletById(firmId: number, outletId: string) {
  for (const business of partnerClientBusinesses) {
    if (business.firmId !== firmId) continue;
    const outlet = business.outlets.find((item) => item.id === outletId);
    if (outlet) {
      return outlet;
    }
  }
  return undefined;
}

function partnerLineRate(mrp: number, discountPercentage: number) {
  const effectiveUnit = mrp * (1 - discountPercentage / 100);
  return Math.round(effectiveUnit * 100) / 100;
}

function partnerLineAmount(quantity: number, mrp: number, discountPercentage: number) {
  return Math.round(partnerLineRate(mrp, discountPercentage) * quantity * 100) / 100;
}

function partnerAgeDays(dueDate: string) {
  if (!dueDate) return 0;
  const due = new Date(`${dueDate}T00:00:00.000Z`);
  const today = new Date(`${todayISO()}T00:00:00.000Z`);
  if (Number.isNaN(due.getTime()) || Number.isNaN(today.getTime())) {
    return 0;
  }
  return Math.floor((today.getTime() - due.getTime()) / (24 * 60 * 60 * 1000));
}

function partnerAgingBucket(ageDays: number) {
  if (ageDays <= 30) return "0-30";
  if (ageDays <= 60) return "31-60";
  if (ageDays <= 90) return "61-90";
  return "90+";
}

function matchesDateRange(value: string, fromDate?: string, toDate?: string) {
  if (!value) return false;
  if (fromDate && value < fromDate) return false;
  if (toDate && value > toDate) return false;
  return true;
}

function stockActionTimestamp(actionDate: string) {
  return `${actionDate}T12:00:00.000Z`;
}

function canTransitionOrderStatus(current: PartnerOrder["status"], next: PartnerOrder["status"]) {
  return (
    (current === "DRAFT" && (next === "PLACED" || next === "CONFIRMED" || next === "CANCELLED")) ||
    (current === "PLACED" && (next === "CONFIRMED" || next === "CANCELLED")) ||
    (current === "CONFIRMED" && (next === "DRAFT" || next === "PACKED" || next === "CANCELLED")) ||
    (current === "PACKED" && (next === "DRAFT" || next === "DISPATCHED" || next === "CANCELLED")) ||
    (current === "DISPATCHED" && (next === "DELIVERED" || next === "PARTIALLY_DELIVERED" || next === "RETURNED" || next === "PARTIALLY_RETURNED")) ||
    (current === "PARTIALLY_DELIVERED" && (next === "DELIVERED" || next === "RETURNED" || next === "PARTIALLY_RETURNED")) ||
    (current === "DELIVERED" && (next === "RETURNED" || next === "PARTIALLY_RETURNED")) ||
    (current === "PARTIALLY_RETURNED" && (next === "DELIVERED" || next === "RETURNED"))
  );
}

function canEditOrder(order: PartnerOrder) {
  return (order.status === "DRAFT" || order.status === "PLACED") && !order.linkedInvoiceId;
}

function hydratePartnerOrder(order: PartnerOrder): PartnerOrder {
  const linkedInvoice = partnerInvoices.find((invoice) => invoice.orderId === order.id && invoice.status !== "CANCELLED");
  const requestedItems = order.requestedItems?.length ? order.requestedItems : order.items;
  return {
    ...order,
    linkedInvoiceId: linkedInvoice?.id,
    linkedInvoiceNumber: linkedInvoice?.invoiceNumber,
    source: order.source || "MANUAL",
    itemCount: requestedItems.length,
    totalQuantity: requestedItems.reduce((sum, item) => sum + item.quantity, 0),
    requestedItems,
    billableLines: order.billableLines ?? [],
    unfulfilledItems: order.unfulfilledItems ?? [],
    items: order.items.map((line) => ({
      ...line,
      packedQuantity:
        line.packedQuantity ??
        (["PACKED", "DISPATCHED", "DELIVERED", "PARTIALLY_DELIVERED", "RETURNED", "PARTIALLY_RETURNED"].includes(order.status)
          ? line.quantity
          : 0),
      dispatchedQuantity:
        line.dispatchedQuantity ??
        (["DISPATCHED", "DELIVERED", "PARTIALLY_DELIVERED", "RETURNED", "PARTIALLY_RETURNED"].includes(order.status)
          ? line.quantity
          : 0),
      deliveredQuantity: line.deliveredQuantity ?? (order.status === "DELIVERED" ? line.quantity : 0),
      returnedQuantity: line.returnedQuantity ?? (order.status === "RETURNED" ? line.quantity : 0),
      cancelledQuantity: line.cancelledQuantity ?? (order.status === "CANCELLED" ? line.quantity : 0),
    })),
  };
}

function resolvePartnerOrderJourneyStatusAfterReturn(order: PartnerOrder): PartnerOrder["status"] {
  const dispatchedQuantity = order.items.reduce((sum, line) => sum + (line.dispatchedQuantity ?? 0), 0);
  const returnedQuantity = order.items.reduce((sum, line) => sum + (line.returnedQuantity ?? 0), 0);
  const deliveredQuantity = order.items.reduce((sum, line) => sum + (line.deliveredQuantity ?? 0), 0);
  const openReturnable = dispatchedQuantity - returnedQuantity;
  if (openReturnable <= 0 && dispatchedQuantity > 0) return "RETURNED";
  if (deliveredQuantity >= openReturnable && deliveredQuantity > 0) return "DELIVERED";
  if (deliveredQuantity > 0) return "PARTIALLY_DELIVERED";
  return "DISPATCHED";
}

function hydratePartnerInvoice(invoice: PartnerInvoice): PartnerInvoice {
  const paidAmount = partnerPayments.reduce((sum, payment) => {
    return sum + payment.allocations
      .filter((allocation) => allocation.invoiceId === invoice.id)
      .reduce((allocationSum, allocation) => allocationSum + allocation.amount, 0);
  }, 0);
  const adjustedTotal = Math.max(invoice.amount - getCreditNoteTotalByInvoice(invoice.id) + getDebitNoteTotalByInvoice(invoice.id), 0);
  const dueAmount = Math.max(adjustedTotal - paidAmount, 0);
  const dueDate = invoice.dueDate || invoice.invoiceDate;
  const overdue = dueAmount > 0 && partnerAgeDays(dueDate) > 0;
  return {
    ...invoice,
    dueDate,
    paidAmount,
    dueAmount,
    paymentStatus: overdue ? "OVERDUE" : paidAmount <= 0 ? "UNPAID" : dueAmount <= 0 ? "PAID" : "PARTIALLY_PAID",
  };
}

function hydratePartnerPurchase(purchase: PartnerPurchase): PartnerPurchase {
  const rawStatus = purchase.status as string;
  const status = rawStatus === "POSTED" ? "RECEIVED" : purchase.status;
  const items = purchase.items.map((item) => ({
    ...item,
    receivedQuantity: item.receivedQuantity ?? 0,
    damagedQuantity: item.damagedQuantity ?? 0,
  }));
  return {
    ...purchase,
    status,
    items,
    lineCount: items.length,
    totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
    receivedQuantity: items.reduce((sum, item) => sum + item.receivedQuantity, 0),
    damagedQuantity: items.reduce((sum, item) => sum + item.damagedQuantity, 0),
    totalAmount: items.reduce((sum, item) => sum + item.lineTotal, 0),
    stockPosted: status === "RECEIVED",
  };
}

function payableStatus(finalTotal: number, paidAmount: number, dueDate?: string) {
  const outstanding = Math.max(finalTotal - paidAmount, 0);
  if (outstanding <= 0) return "PAID" as const;
  if (dueDate && dueDate < todayISO()) return "OVERDUE" as const;
  if (paidAmount > 0) return "PARTIALLY_PAID" as const;
  return "UNPAID" as const;
}

function hydrateSupplierInvoice(invoice: PartnerSupplierInvoice): PartnerSupplierInvoice {
  const paidAmount = partnerSupplierPayments.reduce(
    (sum, payment) =>
      sum + payment.allocations.filter((allocation) => allocation.supplierInvoiceId === invoice.id).reduce((inner, allocation) => inner + allocation.amount, 0),
    0,
  );
  const outstandingAmount = Math.max(invoice.finalTotalAmount - paidAmount, 0);
  return {
    ...invoice,
    paidAmount,
    outstandingAmount,
    payableStatus: invoice.status === "FINALIZED" ? payableStatus(invoice.finalTotalAmount, paidAmount, invoice.dueDate) : invoice.payableStatus,
  };
}

function pushSupplierLedgerEntry(input: Omit<PartnerSupplierLedgerEntry, "id" | "firmId" | "runningBalance" | "createdAt"> & { firmId: number }) {
  const previous = partnerSupplierLedgerEntries
    .filter((entry) => entry.firmId === input.firmId && entry.supplierId === input.supplierId)
    .sort((a, b) => `${a.entryDate}-${a.createdAt}`.localeCompare(`${b.entryDate}-${b.createdAt}`))
    .at(-1);
  const runningBalance = (previous?.runningBalance ?? 0) + input.creditAmount - input.debitAmount;
  partnerSupplierLedgerEntries.push({
    id: makeId("psled"),
    firmId: input.firmId,
    supplierId: input.supplierId,
    supplierName: input.supplierName,
    entryDate: input.entryDate,
    type: input.type,
    referenceType: input.referenceType,
    referenceId: input.referenceId,
    referenceNumber: input.referenceNumber,
    description: input.description,
    debitAmount: input.debitAmount,
    creditAmount: input.creditAmount,
    runningBalance,
    createdAt: new Date().toISOString(),
  });
}

function getPartnerSupplierById(firmId: number, supplierId: string) {
  return partnerSuppliers.find((supplier) => supplier.firmId === firmId && supplier.id === supplierId);
}

function getPartnerSupplierByGSTIN(firmId: number, gstin: string, excludeSupplierId = "") {
  const normalized = normalizeGSTIN(gstin);
  if (!normalized) {
    return undefined;
  }
  return partnerSuppliers.find(
    (supplier) =>
      supplier.firmId === firmId &&
      supplier.id !== excludeSupplierId &&
      normalizeGSTIN(supplier.gstin || "") === normalized,
  );
}

function pushPartnerStockEntry(entry: PartnerStockLedgerEntry) {
  partnerStockEntries = [entry, ...partnerStockEntries];
}

function pushPartnerAuditLog(entry: Omit<PartnerAuditLog, "id" | "createdAt"> & { id?: string; createdAt?: string }) {
  partnerAuditLogs = [
    {
      id: entry.id || makeId("audit"),
      createdAt: entry.createdAt || new Date().toISOString(),
      ...entry,
    },
    ...partnerAuditLogs,
  ];
}

function getCreditNoteTotalByInvoice(invoiceId: string) {
  return partnerCreditNotes
    .filter((note) => note.relatedInvoiceId === invoiceId && note.status === "ISSUED")
    .reduce((sum, note) => sum + note.totalAmount, 0);
}

function getDebitNoteTotalByInvoice(invoiceId: string) {
  return partnerDebitNotes
    .filter((note) => note.relatedInvoiceId === invoiceId && note.status === "ISSUED")
    .reduce((sum, note) => sum + note.totalAmount, 0);
}

function getAdjustedInvoiceOutstanding(invoice: PartnerInvoice) {
  const hydrated = hydratePartnerInvoice(invoice);
  return Math.max(hydrated.dueAmount - getCreditNoteTotalByInvoice(invoice.id) + getDebitNoteTotalByInvoice(invoice.id), 0);
}

function allocatedShare(part: number, total: number, lineAmount: number) {
  if (part <= 0 || total <= 0 || lineAmount <= 0) return 0;
  return Number((((part / total) * lineAmount)).toFixed(2));
}

function seedPartnerErpData() {
  const firm1Business = getPartnerBusinessById(1, "pbiz_pclient_1");
  const firm1Outlet = getPartnerOutletById(1, "pout_pclient_1");
  const firm1SecondaryOutlet = getPartnerOutletById(1, "pout_glamhub_indiranagar");
  const firm1Business2 = getPartnerBusinessById(1, "pbiz_pclient_2");
  const firm1Business2Outlet = getPartnerOutletById(1, "pout_pclient_2");
  const firm2Business = getPartnerBusinessById(2, "pbiz_pclient_3");
  const firm2Outlet = getPartnerOutletById(2, "pout_colorroom_rajouri");
  const firm2PrimaryOutlet = getPartnerOutletById(2, "pout_pclient_3");

  if (
    !firm1Business ||
    !firm1Outlet ||
    !firm1SecondaryOutlet ||
    !firm1Business2 ||
    !firm1Business2Outlet ||
    !firm2Business ||
    !firm2Outlet ||
    !firm2PrimaryOutlet
  ) {
    return;
  }

  const order1Items: PartnerOrderItem[] = [
    { id: "poitem_1", orderId: "porder_1", itemId: "pitem_1", itemCode: "ITM-000001", itemName: "Absolut Repair Shampoo 300ml", unit: "bottle", quantity: 6, mrp: 690, discountPercentage: 10 },
    { id: "poitem_2", orderId: "porder_1", itemId: "pitem_2", itemCode: "ITM-000002", itemName: "Metal Detox Mask 250ml", unit: "jar", quantity: 3, mrp: 940, discountPercentage: 12 },
  ];
  const order2Items: PartnerOrderItem[] = [
    { id: "poitem_3", orderId: "porder_2", itemId: "pitem_5", itemCode: "ITM-000005", itemName: "BC Bonacure Moisture Kick 250ml", unit: "bottle", quantity: 4, mrp: 620, discountPercentage: 8 },
  ];
  const order3Items: PartnerOrderItem[] = [
    { id: "poitem_4", orderId: "porder_3", itemId: "pitem_3", itemCode: "ITM-000003", itemName: "Invigo Nutri Enrich Shampoo 250ml", unit: "bottle", quantity: 5, mrp: 560, discountPercentage: 5 },
    { id: "poitem_5", orderId: "porder_3", itemId: "pitem_4", itemCode: "ITM-000004", itemName: "EIMI Styling Gel 150ml", unit: "tube", quantity: 2, mrp: 430, discountPercentage: 0 },
  ];
  const order4Items: PartnerOrderItem[] = [
    { id: "poitem_6", orderId: "porder_4", itemId: "pitem_5", itemCode: "ITM-000005", itemName: "BC Bonacure Moisture Kick 250ml", unit: "bottle", quantity: 2, mrp: 620, discountPercentage: 8 },
  ];
  const billableLinesFor = (lines: PartnerOrderItem[]): PartnerOrderBillableLine[] =>
    lines.map((line) => {
      const billableLineId = `pobl_${line.id}`;
      line.billableLineId = billableLineId;
      return {
        id: billableLineId,
        orderId: line.orderId,
        catalogItemId: line.catalogItemId || line.itemId,
        itemCode: line.itemCode,
        itemName: line.itemName,
        quantity: line.quantity,
        mrp: line.mrp,
        sellerMarginPercentage: line.discountPercentage,
        rate: partnerLineRate(line.mrp, line.discountPercentage),
        lineTotal: partnerLineAmount(line.quantity, line.mrp, line.discountPercentage),
      };
    });
  const order1BillableLines = billableLinesFor(order1Items);
  const order2BillableLines = billableLinesFor(order2Items);
  const order4BillableLines = billableLinesFor(order4Items);

  partnerOrders = [
    hydratePartnerOrder({
      id: "porder_1",
      firmId: 1,
      orderNumber: "ORD-1001",
      clientBusinessId: firm1Business.id,
      clientBusinessName: firm1Business.businessName,
      clientOutletId: firm1Outlet.id,
      clientOutletName: firm1Outlet.outletName,
      orderDate: "2026-03-10",
      status: "CONFIRMED",
      createdAt: "2026-03-10T09:10:00.000Z",
      createdByName: currentUser.name,
      confirmedAt: "2026-03-10T09:40:00.000Z",
      itemCount: 0,
      totalQuantity: 0,
      notes: "Urgent restock for weekend bookings",
      items: order1Items,
      billableLines: order1BillableLines,
    }),
    hydratePartnerOrder({
      id: "porder_2",
      firmId: 2,
      orderNumber: "ORD-2001",
      clientBusinessId: firm2Business.id,
      clientBusinessName: firm2Business.businessName,
      clientOutletId: firm2Outlet.id,
      clientOutletName: firm2Outlet.outletName,
      orderDate: "2026-03-12",
      status: "DISPATCHED",
      createdAt: "2026-03-12T10:00:00.000Z",
      createdByName: currentUser.name,
      confirmedAt: "2026-03-12T10:30:00.000Z",
      dispatchedAt: "2026-03-13T08:45:00.000Z",
      itemCount: 0,
      totalQuantity: 0,
      notes: "Send with invoice copy in shipment box.",
      items: order2Items,
      billableLines: order2BillableLines,
    }),
    hydratePartnerOrder({
      id: "porder_3",
      firmId: 1,
      orderNumber: "ORD-1002",
      clientBusinessId: firm1Business2.id,
      clientBusinessName: firm1Business2.businessName,
      clientOutletId: firm1Business2Outlet.id,
      clientOutletName: firm1Business2Outlet.outletName,
      orderDate: "2026-03-13",
      status: "DRAFT",
      createdAt: "2026-03-13T11:15:00.000Z",
      createdByName: currentUser.name,
      itemCount: 0,
      totalQuantity: 0,
      notes: "Awaiting outlet manager confirmation.",
      items: order3Items,
      billableLines: [],
    }),
    hydratePartnerOrder({
      id: "porder_4",
      firmId: 2,
      orderNumber: "ORD-2002",
      clientBusinessId: firm2Business.id,
      clientBusinessName: firm2Business.businessName,
      clientOutletId: firm2PrimaryOutlet.id,
      clientOutletName: firm2PrimaryOutlet.outletName,
      orderDate: "2026-03-08",
      status: "DISPATCHED",
      createdAt: "2026-03-08T09:00:00.000Z",
      createdByName: currentUser.name,
      confirmedAt: "2026-03-08T09:20:00.000Z",
      dispatchedAt: "2026-03-08T12:10:00.000Z",
      itemCount: 0,
      totalQuantity: 0,
      notes: "Dispatched to the outlet front desk.",
      items: order4Items,
      billableLines: order4BillableLines,
    }),
  ];

  const invoice1Items: PartnerInvoiceItem[] = order1Items.map((item) => ({
    id: `invline_${item.id}`,
    invoiceId: "pinvoice_1",
    billableLineId: item.billableLineId,
    itemId: item.itemId,
    itemCode: item.itemCode,
    itemName: item.itemName,
    quantity: item.quantity,
    mrp: item.mrp,
    discountPercentage: item.discountPercentage,
    rate: partnerLineRate(item.mrp, item.discountPercentage),
    lineTotal: partnerLineAmount(item.quantity, item.mrp, item.discountPercentage),
  }));

  const invoice2Items: PartnerInvoiceItem[] = order2Items.map((item) => ({
    id: `invline_${item.id}`,
    invoiceId: "pinvoice_2",
    billableLineId: item.billableLineId,
    itemId: item.itemId,
    itemCode: item.itemCode,
    itemName: item.itemName,
    quantity: item.quantity,
    mrp: item.mrp,
    discountPercentage: item.discountPercentage,
    rate: partnerLineRate(item.mrp, item.discountPercentage),
    lineTotal: partnerLineAmount(item.quantity, item.mrp, item.discountPercentage),
  }));
  const invoice3Items: PartnerInvoiceItem[] = [
    {
      id: "invline_standalone_1",
      invoiceId: "pinvoice_3",
      itemId: "pitem_3",
      itemCode: "ITM-000003",
      itemName: "Invigo Nutri Enrich Shampoo 250ml",
      quantity: 2,
      mrp: 560,
      discountPercentage: 5,
      rate: partnerLineRate(560, 5),
      lineTotal: partnerLineAmount(2, 560, 5),
    },
  ];
  const invoice4Items: PartnerInvoiceItem[] = [
    {
      id: "invline_standalone_2",
      invoiceId: "pinvoice_4",
      itemId: "pitem_2",
      itemCode: "ITM-000002",
      itemName: "Metal Detox Mask 250ml",
      quantity: 2,
      mrp: 920,
      discountPercentage: 8,
      rate: partnerLineRate(920, 8),
      lineTotal: partnerLineAmount(2, 920, 8),
    },
  ];

  partnerInvoices = [
    {
      id: "pinvoice_1",
      firmId: 1,
      orderId: "porder_1",
      invoiceNumber: "INV-1001",
      clientBusinessId: firm1Business.id,
      clientBusinessName: firm1Business.businessName,
      clientOutletId: firm1Outlet.id,
      clientOutletName: firm1Outlet.outletName,
      invoiceDate: "2026-03-11",
      dueDate: "2026-03-14",
      status: "FINALIZED",
      createdAt: "2026-03-11T10:00:00.000Z",
      createdByName: currentUser.name,
      amount: invoice1Items.reduce((sum, item) => sum + item.lineTotal, 0),
      paidAmount: 0,
      dueAmount: 0,
      billToName: firm1Business.billingName || firm1Business.businessName,
      billToGstin: firm1Business.gstin || "",
      billToAddress: firm1Business.billingAddress || "",
      deliverToName: firm1Outlet.outletName,
      deliverToLocality: "",
      deliverToAddress: firm1Outlet.address || "",
      deliverToManagerName: firm1Outlet.contacts[0]?.name || "",
      deliverToManagerPhone: firm1Outlet.contacts[0]?.phone || "",
      notes: "Issued with promo samples.",
      items: invoice1Items,
    },
    {
      id: "pinvoice_2",
      firmId: 2,
      orderId: "porder_2",
      invoiceNumber: "INV-2001",
      clientBusinessId: firm2Business.id,
      clientBusinessName: firm2Business.businessName,
      clientOutletId: firm2Outlet.id,
      clientOutletName: firm2Outlet.outletName,
      invoiceDate: "2026-03-13",
      dueDate: "2026-03-20",
      status: "FINALIZED",
      createdAt: "2026-03-13T09:15:00.000Z",
      createdByName: currentUser.name,
      amount: invoice2Items.reduce((sum, item) => sum + item.lineTotal, 0),
      paidAmount: 0,
      dueAmount: 0,
      billToName: firm2Business.billingName || firm2Business.businessName,
      billToGstin: firm2Business.gstin || "",
      billToAddress: firm2Business.billingAddress || "",
      deliverToName: firm2Outlet.outletName,
      deliverToLocality: "",
      deliverToAddress: firm2Outlet.address || "",
      deliverToManagerName: firm2Outlet.contacts[0]?.name || "",
      deliverToManagerPhone: firm2Outlet.contacts[0]?.phone || "",
      notes: "Customer requested delivery before noon.",
      items: invoice2Items,
    },
    {
      id: "pinvoice_3",
      firmId: 1,
      invoiceNumber: "INV-1002",
      clientBusinessId: firm1Business.id,
      clientBusinessName: firm1Business.businessName,
      clientOutletId: firm1SecondaryOutlet.id,
      clientOutletName: firm1SecondaryOutlet.outletName,
      invoiceDate: "2026-03-09",
      dueDate: "2026-02-01",
      status: "FINALIZED",
      createdAt: "2026-03-09T16:00:00.000Z",
      createdByName: currentUser.name,
      notes: "Standalone invoice for branch refill.",
      amount: invoice3Items.reduce((sum, item) => sum + item.lineTotal, 0),
      paidAmount: 0,
      dueAmount: 0,
      billToName: firm1Business.billingName || firm1Business.businessName,
      billToGstin: firm1Business.gstin || "",
      billToAddress: firm1Business.billingAddress || "",
      deliverToName: firm1SecondaryOutlet.outletName,
      deliverToLocality: "",
      deliverToAddress: firm1SecondaryOutlet.address || "",
      deliverToManagerName: firm1SecondaryOutlet.contacts[0]?.name || "",
      deliverToManagerPhone: firm1SecondaryOutlet.contacts[0]?.phone || "",
      items: invoice3Items,
    },
    {
      id: "pinvoice_4",
      firmId: 1,
      invoiceNumber: "INV-1003",
      clientBusinessId: firm1Business.id,
      clientBusinessName: firm1Business.businessName,
      clientOutletId: firm1Outlet.id,
      clientOutletName: firm1Outlet.outletName,
      invoiceDate: "2025-11-20",
      dueDate: "2025-12-01",
      status: "FINALIZED",
      createdAt: "2025-11-20T11:00:00.000Z",
      createdByName: currentUser.name,
      notes: "Legacy overdue balance carried from winter campaign.",
      amount: invoice4Items.reduce((sum, item) => sum + item.lineTotal, 0),
      paidAmount: 0,
      dueAmount: 0,
      billToName: firm1Business.billingName || firm1Business.businessName,
      billToGstin: firm1Business.gstin || "",
      billToAddress: firm1Business.billingAddress || "",
      deliverToName: firm1Outlet.outletName,
      deliverToLocality: "",
      deliverToAddress: firm1Outlet.address || "",
      deliverToManagerName: firm1Outlet.contacts[0]?.name || "",
      deliverToManagerPhone: firm1Outlet.contacts[0]?.phone || "",
      items: invoice4Items,
    },
  ];
  partnerSuppliers = [
    {
      id: "psup_1",
      firmId: 1,
      supplierName: "Prime Beauty Supply",
      gstin: "29AABCP4455K1Z4",
      phone: "9811011100",
      address: "Peenya Industrial Area, Bengaluru",
      status: "ACTIVE",
      createdAt: "2026-03-01T09:00:00.000Z",
      updatedAt: "2026-03-12T11:00:00.000Z",
    },
    {
      id: "psup_2",
      firmId: 1,
      supplierName: "Salon Source India",
      phone: "9811011101",
      address: "Yeshwanthpur, Bengaluru",
      status: "ACTIVE",
      createdAt: "2026-03-02T09:00:00.000Z",
      updatedAt: "2026-03-13T10:00:00.000Z",
    },
    {
      id: "psup_3",
      firmId: 2,
      supplierName: "Northern Haircare Depot",
      gstin: "07AACCN8765P1Z9",
      phone: "9811011102",
      address: "Naraina, New Delhi",
      status: "INACTIVE",
      createdAt: "2026-03-03T09:00:00.000Z",
      updatedAt: "2026-03-11T10:00:00.000Z",
    },
  ];

  const purchase1Items: PartnerPurchaseItem[] = [
    { id: "ppit_1", purchaseId: "ppur_1", itemId: "pitem_1", itemCode: "ITM-000001", itemName: "Absolut Repair Shampoo 300ml", sku: "LOR-SHAM-300", quantity: 12, receivedQuantity: 12, damagedQuantity: 0, costPrice: 430, discountPercentage: 0, taxPercentage: 0, lineTotal: 5160 },
    { id: "ppit_2", purchaseId: "ppur_1", itemId: "pitem_2", itemCode: "ITM-000002", itemName: "Metal Detox Mask 250ml", sku: "LOR-MASK-250", quantity: 8, receivedQuantity: 8, damagedQuantity: 0, costPrice: 610, discountPercentage: 0, taxPercentage: 0, lineTotal: 4880 },
  ];
  const purchase2Items: PartnerPurchaseItem[] = [
    { id: "ppit_3", purchaseId: "ppur_2", itemId: "pitem_3", itemCode: "ITM-000003", itemName: "Invigo Nutri Enrich Shampoo 250ml", sku: "WEL-SHAM-250", quantity: 6, receivedQuantity: 0, damagedQuantity: 0, costPrice: 340, discountPercentage: 0, taxPercentage: 0, lineTotal: 2040 },
  ];
  const purchase3Items: PartnerPurchaseItem[] = [
    { id: "ppit_4", purchaseId: "ppur_3", itemId: "pitem_5", itemCode: "ITM-000005", itemName: "BC Bonacure Moisture Kick 250ml", sku: "SCH-SHAM-250", quantity: 10, receivedQuantity: 10, damagedQuantity: 0, costPrice: 420, discountPercentage: 2, taxPercentage: 0, lineTotal: 4116 },
  ];

  partnerPurchases = [
    hydratePartnerPurchase({
      id: "ppur_1",
      firmId: 1,
      purchaseNumber: "PUR-1001",
      supplierId: "psup_1",
      supplierName: "Prime Beauty Supply",
      supplierInvoiceNumber: "PB-4382",
      supplierInvoiceDate: "2026-03-08",
      purchaseDate: "2026-03-08",
      expectedInwardDate: "2026-03-10",
      status: "RECEIVED",
      createdAt: "2026-03-08T09:00:00.000Z",
      createdByName: currentUser.name,
      postedAt: "2026-03-08T10:30:00.000Z",
      postedByName: currentUser.name,
      notes: "Weekly replenishment",
      lineCount: 0,
      totalQuantity: 0,
      receivedQuantity: 0,
      damagedQuantity: 0,
      totalAmount: 0,
      stockPosted: false,
      items: purchase1Items,
    }),
    hydratePartnerPurchase({
      id: "ppur_2",
      firmId: 1,
      purchaseNumber: "PUR-1002",
      supplierId: "psup_2",
      supplierName: "Salon Source India",
      supplierInvoiceNumber: "SSI-902",
      supplierInvoiceDate: "2026-03-13",
      purchaseDate: "2026-03-13",
      expectedInwardDate: "2026-03-18",
      status: "DRAFT",
      createdAt: "2026-03-13T12:00:00.000Z",
      createdByName: currentUser.name,
      notes: "Awaiting warehouse verification",
      lineCount: 0,
      totalQuantity: 0,
      receivedQuantity: 0,
      damagedQuantity: 0,
      totalAmount: 0,
      stockPosted: false,
      items: purchase2Items,
    }),
    hydratePartnerPurchase({
      id: "ppur_3",
      firmId: 2,
      purchaseNumber: "PUR-2001",
      supplierId: "psup_3",
      supplierName: "Northern Haircare Depot",
      supplierInvoiceNumber: "NHD-2201",
      supplierInvoiceDate: "2026-03-09",
      purchaseDate: "2026-03-09",
      expectedInwardDate: "2026-03-12",
      status: "RECEIVED",
      createdAt: "2026-03-09T08:30:00.000Z",
      createdByName: currentUser.name,
      postedAt: "2026-03-09T09:00:00.000Z",
      postedByName: currentUser.name,
      lineCount: 0,
      totalQuantity: 0,
      receivedQuantity: 0,
      damagedQuantity: 0,
      totalAmount: 0,
      stockPosted: false,
      items: purchase3Items,
    }),
  ];

  partnerInvoices = partnerInvoices.map(hydratePartnerInvoice);

  pushPartnerStockEntry({
    id: "pstock_sale_1",
    firmId: 1,
    itemId: "pitem_1",
    quantityDelta: -6,
    reasonType: "SALE",
    referenceType: "INVOICE",
    referenceId: "INV-1001",
    note: "Issued against invoice INV-1001",
    createdAt: "2026-03-11T10:00:00.000Z",
  });
  pushPartnerStockEntry({
    id: "pstock_sale_2",
    firmId: 1,
    itemId: "pitem_2",
    quantityDelta: -3,
    reasonType: "SALE",
    referenceType: "INVOICE",
    referenceId: "INV-1001",
    note: "Issued against invoice INV-1001",
    createdAt: "2026-03-11T10:05:00.000Z",
  });
  pushPartnerStockEntry({
    id: "pstock_purchase_1",
    firmId: 2,
    itemId: "pitem_5",
    quantityDelta: 12,
    reasonType: "PURCHASE",
    referenceType: "PURCHASE",
    referenceId: "ppur_3",
    note: "Posted from purchase PUR-2001",
    createdAt: "2026-03-09T09:00:00.000Z",
    unitCost: 430,
  });
  pushPartnerStockEntry({
    id: "pstock_purchase_2",
    firmId: 1,
    itemId: "pitem_1",
    quantityDelta: 12,
    reasonType: "PURCHASE",
    referenceType: "PURCHASE",
    referenceId: "ppur_1",
    note: "Posted from purchase PUR-1001",
    createdAt: "2026-03-08T10:30:00.000Z",
    unitCost: 430,
  });
  pushPartnerStockEntry({
    id: "pstock_purchase_3",
    firmId: 1,
    itemId: "pitem_2",
    quantityDelta: 8,
    reasonType: "PURCHASE",
    referenceType: "PURCHASE",
    referenceId: "ppur_1",
    note: "Posted from purchase PUR-1001",
    createdAt: "2026-03-08T10:32:00.000Z",
    unitCost: 610,
  });
  pushPartnerStockEntry({
    id: "pstock_return_in_1",
    firmId: 1,
    itemId: "pitem_1",
    quantityDelta: 1,
    reasonType: "RETURN_IN",
    referenceType: "INVOICE",
    referenceId: "pinvoice_1",
    note: "1 unit returned from Glam Hub Salon Koramangala after seal issue.",
    createdAt: "2026-03-14T15:00:00.000Z",
  });
  pushPartnerStockEntry({
    id: "pstock_return_out_1",
    firmId: 1,
    itemId: "pitem_2",
    quantityDelta: -1,
    reasonType: "RETURN_OUT",
    referenceType: "PURCHASE",
    referenceId: "ppur_1",
    note: "1 unit returned to Prime Beauty Supply due to packaging dent.",
    createdAt: "2026-03-14T16:00:00.000Z",
  });
  pushPartnerStockEntry({
    id: "pstock_damage_1",
    firmId: 1,
    itemId: "pitem_3",
    quantityDelta: -2,
    reasonType: "DAMAGE",
    referenceType: "DAMAGE",
    referenceId: "damage_batch_1",
    note: "EXPIRED: back shelf expiry discovered during cycle count.",
    createdAt: "2026-03-13T18:30:00.000Z",
  });
  pushPartnerStockEntry({
    id: "pstock_adjust_1",
    firmId: 1,
    itemId: "pitem_3",
    quantityDelta: 1,
    reasonType: "ADJUSTMENT",
    referenceType: "MANUAL",
    referenceId: "manual_count_1",
    note: "Manual recount after bin merge.",
    createdAt: "2026-03-14T11:45:00.000Z",
  });

  partnerCreditNotes = [
    {
      id: "pcn_1",
      firmId: 1,
      creditNoteNumber: "CN-1001",
      clientBusinessId: firm1Business.id,
      clientBusinessName: firm1Business.businessName,
      clientOutletId: firm1Outlet.id,
      clientOutletName: firm1Outlet.outletName,
      relatedInvoiceId: "pinvoice_1",
      relatedInvoiceNumber: "INV-1001",
      creditDate: "2026-03-14",
      note: "Return accepted for damaged seal.",
      status: "ISSUED",
      hasStockReturn: true,
      totalAmount: 621,
      createdAt: "2026-03-14T15:05:00.000Z",
      createdByName: currentUser.name,
      lines: [
        {
          id: "pcnl_1",
          creditNoteId: "pcn_1",
          itemId: "pitem_1",
          itemName: "Absolut Repair Shampoo 300ml",
          quantity: 1,
          amount: 621,
          referenceInvoiceLineId: "invline_1",
        },
      ],
    },
    {
      id: "pcn_2",
      firmId: 1,
      creditNoteNumber: "CN-1002",
      clientBusinessId: firm1Business.id,
      clientBusinessName: firm1Business.businessName,
      clientOutletId: firm1SecondaryOutlet.id,
      clientOutletName: firm1SecondaryOutlet.outletName,
      relatedInvoiceId: "pinvoice_3",
      relatedInvoiceNumber: "INV-1002",
      creditDate: "2026-03-15",
      note: "Commercial discount adjustment.",
      status: "ISSUED",
      hasStockReturn: false,
      totalAmount: 150,
      createdAt: "2026-03-15T09:10:00.000Z",
      createdByName: currentUser.name,
      lines: [{ id: "pcnl_2", creditNoteId: "pcn_2", amount: 150 }],
    },
  ];

  partnerDebitNotes = [
    {
      id: "pdn_1",
      firmId: 1,
      debitNoteNumber: "DN-1001",
      clientBusinessId: firm1Business.id,
      clientBusinessName: firm1Business.businessName,
      clientOutletId: firm1Outlet.id,
      clientOutletName: firm1Outlet.outletName,
      relatedInvoiceId: "pinvoice_1",
      relatedInvoiceNumber: "INV-1001",
      debitDate: "2026-03-15",
      note: "Missed logistics surcharge.",
      status: "ISSUED",
      totalAmount: 200,
      createdAt: "2026-03-15T10:00:00.000Z",
      createdByName: currentUser.name,
      lines: [
        { id: "pdnl_1", debitNoteId: "pdn_1", description: "Logistics surcharge", amount: 200 },
      ],
    },
  ];

  partnerAuditLogs = [
    {
      id: "audit_1",
      firmId: 1,
      userId: currentUser.id,
      userName: currentUser.name,
      entityType: "PURCHASE",
      entityId: "ppur_1",
      action: "POST",
      referenceLabel: "PUR-1001",
      afterState: JSON.stringify({ status: "POSTED" }),
      createdAt: "2026-03-08T10:30:00.000Z",
    },
    {
      id: "audit_2",
      firmId: 1,
      userId: currentUser.id,
      userName: currentUser.name,
      entityType: "INVOICE",
      entityId: "pinvoice_1",
      action: "CREATE",
      referenceLabel: "INV-1001",
      afterState: JSON.stringify({ status: "FINALIZED", amount: partnerInvoices.find((item) => item.id === "pinvoice_1")?.amount ?? 0 }),
      createdAt: "2026-03-11T10:00:00.000Z",
    },
    {
      id: "audit_4",
      firmId: 1,
      userId: currentUser.id,
      userName: currentUser.name,
      entityType: "STOCK",
      entityId: "manual_count_1",
      action: "ADJUSTMENT",
      referenceLabel: "manual_count_1",
      afterState: JSON.stringify({ reasonType: "ADJUSTMENT", quantityDelta: 1 }),
      createdAt: "2026-03-14T11:45:00.000Z",
    },
    {
      id: "audit_5",
      firmId: 1,
      userId: currentUser.id,
      userName: currentUser.name,
      entityType: "CREDIT_NOTE",
      entityId: "pcn_1",
      action: "CREATE",
      referenceLabel: "CN-1001",
      afterState: JSON.stringify({ totalAmount: 621, hasStockReturn: true }),
      createdAt: "2026-03-14T15:05:00.000Z",
    },
    {
      id: "audit_6",
      firmId: 1,
      userId: currentUser.id,
      userName: currentUser.name,
      entityType: "DEBIT_NOTE",
      entityId: "pdn_1",
      action: "CREATE",
      referenceLabel: "DN-1001",
      afterState: JSON.stringify({ totalAmount: 200 }),
      createdAt: "2026-03-15T10:00:00.000Z",
    },
  ];
}

seedPartnerErpData();

export const mockDb = {
  async getMe() {
    await wait();
    if (!authenticated) {
      throw new Error("Authentication required");
    }
    invites = invites.map(expireInviteIfNeeded);
    const accessibleClients = getAccessibleClients();
    const memberships = entityMembers.filter(
      (member) => member.userId === currentUser.id && member.status === "ACTIVE",
    );
    const currentClientId = accessibleClients[0]?.id ?? "";
    const currentEntityRole = memberships.find((membership) => membership.entityId === currentClientId)?.role;

    return {
      user: currentUser,
      clients: accessibleClients,
      currentClientId,
      memberships,
      currentEntityRole,
    };
  },

  async requestLoginOtp(input: { phone: string }) {
    await wait();
    const phone = normalizePhone(input.phone);
    const otp = "1234";
    loginOtps[phone] = otp;
    return {
      ok: true as const,
      phone,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      otp,
    };
  },

  async verifyLoginOtp(input: { phone: string; otp: string }) {
    await wait();
    const phone = normalizePhone(input.phone);
    const user = authUsers.find((item) => normalizePhone(item.phone) === phone);
    if (loginOtps[phone] !== input.otp.trim()) {
      throw new Error("invalid or expired otp");
    }
    delete loginOtps[phone];
    if (!user) {
      const nextUser = {
        id: makeId("usr"),
        name: "",
        phone,
        birthDate: "",
      };
      authUsers = [nextUser, ...authUsers];
      currentUser = nextUser;
      authenticated = true;
      return { user: currentUser };
    }
    currentUser = { ...user };
    authenticated = true;
    return { user: currentUser };
  },

  async updateProfile(input: { name: string; birthDate: string }) {
    await wait();
    if (!authenticated) {
      throw new Error("Authentication required");
    }
    const name = input.name.trim();
    const birthDate = input.birthDate.trim();
    if (!name) {
      throw new Error("name is required");
    }
    currentUser = {
      ...currentUser,
      name,
      birthDate,
    };
    authUsers = authUsers.map((item) =>
      item.id === currentUser.id ? { ...item, ...currentUser } : item,
    );
    return { user: currentUser };
  },

  async logout() {
    await wait();
    authenticated = false;
    return { ok: true as const };
  },

  async createEntity(input: {
    ownerName: string;
    ownerPhone: string;
    name: string;
    clientType: Client["clientType"];
    address: string;
    location: { lat: number; lng: number };
    images: string[];
  }) {
    await wait();
    currentUser = {
      ...currentUser,
      name: input.ownerName.trim(),
      phone: input.ownerPhone.trim(),
    };
    authUsers = authUsers.map((item) =>
      item.id === currentUser.id ? { ...item, ...currentUser } : item,
    );
    const next: Client = {
      id: makeId("client"),
      name: input.name,
      clientType: input.clientType,
    };
    clients = [...clients, next];
    entityMembers = [
      {
        userId: currentUser.id,
        entityId: next.id,
        name: input.ownerName.trim(),
        phone: input.ownerPhone.trim(),
        role: "OWNER",
        status: "ACTIVE",
        joinedAt: new Date().toISOString(),
      },
      ...entityMembers,
    ];
    return next;
  },

  async getDayEntries(clientId: string, fromDate: string, toDate: string) {
    await wait();
    return dayEntries.filter((entry) => entry.clientId === clientId && entry.date >= fromDate && entry.date <= toDate);
  },

  async createDayEntry(entry: Omit<DayEntry, "id" | "paymentStatus">) {
    await wait();
    const next: DayEntry = { ...entry, id: makeId("de"), paymentStatus: "unpaid", paidAmount: entry.paidAmount ?? 0 };
    dayEntries = [next, ...dayEntries];
    return next;
  },

  async updateDayEntry(id: string, patch: Partial<DayEntry>) {
    await wait();
    const current = dayEntries.find((entry) => entry.id === id);
    if (!current) {
      throw new Error("DayEntry not found");
    }
    const next = { ...current, ...patch };
    dayEntries = dayEntries.map((entry) => (entry.id === id ? next : entry));
    return next;
  },

  async deleteDayEntry(id: string) {
    await wait();
    dayEntries = dayEntries.filter((entry) => entry.id !== id);
    return { ok: true };
  },

  async getServices(clientId: string) {
    await wait();
    return services.filter((service) => service.clientId === clientId);
  },

  async getServiceCategories(clientId: string) {
    await wait();
    return serviceCategories.filter((category) => category.clientId === clientId);
  },

  async createServiceCategory(input: Omit<ServiceCategory, "id">) {
    await wait();
    const next: ServiceCategory = { ...input, id: makeId("cat") };
    serviceCategories = [...serviceCategories, next];
    return next;
  },

  async updateServiceCategory(id: string, patch: Partial<ServiceCategory>) {
    await wait();
    const current = serviceCategories.find((category) => category.id === id);
    if (!current) {
      throw new Error("Category not found");
    }
    const next = { ...current, ...patch };
    serviceCategories = serviceCategories.map((category) =>
      category.id === id ? next : category,
    );

    const descendantIds = new Set(getCategoryDescendantIds(id));
    services = services.map((service) =>
      service.categoryId && descendantIds.has(service.categoryId)
        ? {
            ...service,
            categoryPath: getCategoryPath(service.categoryId),
          }
        : service,
    );
    return next;
  },

  async deleteServiceCategory(id: string) {
    await wait();
    const descendantIds = new Set(getCategoryDescendantIds(id));
    serviceCategories = serviceCategories.filter(
      (category) => !descendantIds.has(category.id),
    );
    services = services.filter(
      (service) => !service.categoryId || !descendantIds.has(service.categoryId),
    );
    return { ok: true as const };
  },

  async createService(input: Omit<Service, "id">) {
    await wait();
    const next: Service = {
      ...input,
      id: makeId("svc"),
      categoryPath: input.categoryPath || getCategoryPath(input.categoryId),
      updatedAt: new Date().toISOString(),
    };
    services = [next, ...services];
    return next;
  },

  async updateService(id: string, patch: Partial<Service>) {
    await wait();
    const current = services.find((service) => service.id === id);
    if (!current) {
      throw new Error("Service not found");
    }
    const next = {
      ...current,
      ...patch,
      categoryPath:
        patch.categoryPath ??
        getCategoryPath(patch.categoryId ?? current.categoryId) ??
        current.categoryPath,
      updatedAt: new Date().toISOString(),
    };
    services = services.map((service) => (service.id === id ? next : service));
    return next;
  },

  async deleteService(id: string) {
    await wait();
    services = services.filter((service) => service.id !== id);
    return { ok: true as const };
  },

  async getMembers(entityId: string) {
    await wait();
    return entityMembers.filter((member) => member.entityId === entityId);
  },

  async getInvites(entityId: string) {
    await wait();
    invites = invites.map(expireInviteIfNeeded);
    return invites.filter((invite) => invite.entityId === entityId);
  },

  async getStaffCapabilities(entityId: string) {
    await wait();
    return staffServiceCapabilities.filter((item) => item.entityId === entityId);
  },

  async updateStaffCapabilities(
    entityId: string,
    userId: number,
    serviceIds: string[],
  ) {
    await wait();
    staffServiceCapabilities = staffServiceCapabilities.filter(
      (item) => !(item.entityId === entityId && item.userId === userId),
    );
    staffServiceCapabilities = [
      ...serviceIds.map((serviceId) => ({ entityId, userId, serviceId, isEnabled: true })),
      ...staffServiceCapabilities,
    ];
    return staffServiceCapabilities.filter(
      (item) => item.entityId === entityId && item.userId === userId,
    );
  },

  async createInvite(input: { entityId: string; phone: string; role: Invite["role"] }) {
    await wait();
    if (input.role === "ACCOUNT_MANAGER") {
      throw new Error("Account managers are internal Zistributo users and cannot be invited from this page.");
    }
    const next: Invite = {
      id: makeId("inv"),
      entityId: input.entityId,
      phone: input.phone,
      role: input.role,
      token: makeId("invite_token"),
      status: "PENDING",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    };
    invites = [next, ...invites];
    return next;
  },

  async acceptInvite(token: string) {
    await wait();
    invites = invites.map(expireInviteIfNeeded);
    const invite = invites.find((item) => item.token === token);

    if (!invite || invite.status !== "PENDING") {
      throw new Error("This invite is no longer available.");
    }

    if (invite.phone !== currentUser.phone) {
      throw new Error("This invite was sent to a different phone number.");
    }

    invites = invites.map((item) =>
      item.id === invite.id ? { ...item, status: "ACCEPTED" } : item,
    );

    const existingMembership = entityMembers.find(
      (member) => member.userId === currentUser.id && member.entityId === invite.entityId,
    );

    if (existingMembership) {
      entityMembers = entityMembers.map((member) =>
        member.userId === currentUser.id && member.entityId === invite.entityId
          ? {
              ...member,
              role: invite.role,
              status: "ACTIVE",
              joinedAt: new Date().toISOString(),
            }
          : member,
      );
    } else {
      entityMembers = [
        {
          userId: currentUser.id,
          entityId: invite.entityId,
          name: currentUser.name,
          phone: currentUser.phone,
          role: invite.role,
          status: "ACTIVE",
          joinedAt: new Date().toISOString(),
        },
        ...entityMembers,
      ];
    }

    return entityMembers.find(
      (member) => member.userId === currentUser.id && member.entityId === invite.entityId,
    ) as EntityMember;
  },

  async revokeInvite(inviteId: string) {
    await wait();
    const target = invites.find((invite) => invite.id === inviteId);
    if (!target) {
      throw new Error("Invite not found");
    }
    invites = invites.map((invite) =>
      invite.id === inviteId ? { ...invite, status: "EXPIRED" } : invite,
    );
    return { ok: true };
  },

  async removeMember(entityId: string, userId: number) {
    await wait();
    const target = entityMembers.find(
      (member) => member.entityId === entityId && member.userId === userId,
    );
    if (!target) {
      throw new Error("Member not found");
    }
    if (target.role === "OWNER") {
      throw new Error("Owner cannot be removed from the entity.");
    }
    entityMembers = entityMembers.filter(
      (member) => !(member.entityId === entityId && member.userId === userId),
    );
    return { ok: true };
  },

  async getPartnersMe() {
    await wait();
    if (!authenticated) {
      throw new Error("Authentication required");
    }
    const memberships = partnerFirmMemberships.filter(
      (membership) => membership.userId === currentUser.id && membership.status === "ACTIVE",
    );
    const firms = memberships
      .map((membership) => getPartnerFirmById(membership.firmId))
      .filter((firm): firm is PartnerFirm => Boolean(firm))
      .filter((firm, index, items) => items.findIndex((item) => item.id === firm.id) === index);
    return {
      user: {
        id: currentUser.id,
        name: currentUser.name,
        phone: currentUser.phone,
        email: "",
      },
      firms,
      activeFirmId: getPartnerFirmById(activePartnerFirmId)?.id ?? firms[0]?.id ?? "",
    };
  },

  async getPartnerFirm(firmId: number) {
    await wait();
    const firm = getPartnerFirmById(firmId);
    if (!firm) {
      throw new Error("Firm not found");
    }
    return { ...firm };
  },

  async createPartnerFirm(input: {
    name: string;
    tradeName?: string;
    gstin?: string;
    billingAddress: string;
    city: string;
    ownerName: string;
    phone: string;
    email: string;
  }) {
    await wait();
    const firm: PartnerFirm = {
      id: makeId("pf"),
      name: input.name.trim(),
      tradeName: input.tradeName?.trim() || "",
      gstin: input.gstin?.trim().toUpperCase() || "",
      billingAddress: input.billingAddress.trim(),
      city: input.city.trim(),
      ownerName: input.ownerName.trim(),
      phone: input.phone.trim(),
      email: input.email.trim(),
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    partnerFirms = [firm, ...partnerFirms];
    partnerFirmMemberships = [
      ...partnerFirmMemberships,
      {
        userId: currentUser.id,
        firmId: firm.id,
        role: "OWNER",
        status: "ACTIVE",
      },
    ];
    activePartnerFirmId = firm.id;
    return firm;
  },

  async updatePartnerFirm(
    firmId: number,
    input: {
      name: string;
      tradeName?: string;
      gstin?: string;
      billingAddress: string;
      city: string;
      ownerName: string;
      phone: string;
      email: string;
      status?: "ACTIVE" | "INACTIVE";
    },
  ) {
    await wait();
    const current = getPartnerFirmById(firmId);
    if (!current) {
      throw new Error("Firm not found");
    }
    const next: PartnerFirm = {
      ...current,
      name: input.name.trim(),
      tradeName: input.tradeName?.trim() || "",
      gstin: input.gstin?.trim().toUpperCase() || "",
      billingAddress: input.billingAddress.trim(),
      city: input.city.trim(),
      ownerName: input.ownerName.trim(),
      phone: input.phone.trim(),
      email: input.email.trim(),
      status: input.status ?? current.status ?? "ACTIVE",
      updatedAt: new Date().toISOString(),
    };
    partnerFirms = partnerFirms.map((firm) => (firm.id === firmId ? next : firm));
    return next;
  },

  async getPartnerFirmMemberships(firmId: number) {
    await wait();
    const items: PartnerFirmMembership[] = partnerFirmMemberships
      .filter((membership) => membership.firmId === firmId)
      .map((membership) => {
        const user = authUsers.find((item) => item.id === membership.userId);
        return {
          userId: membership.userId,
          firmId: membership.firmId,
          name: user?.name || "Unknown user",
          phone: user?.phone || "",
          role: membership.role,
          status: membership.status,
          joinedAt: "2026-03-30T10:00:00.000Z",
        };
      });
    return items;
  },

  async getPartnerFirmInvites(firmId: number) {
    await wait();
    return partnerFirmInvites.filter((invite) => invite.firmId === firmId && invite.status === "PENDING");
  },

  async createPartnerFirmMembership(
    firmId: number,
    input: { phone: string; role: Exclude<PartnerFirmRole, "OWNER"> },
  ) {
    await wait();
    const phone = input.phone.trim();
    const existingUser = authUsers.find((user) => user.phone === phone);
    if (existingUser) {
      if (partnerFirmMemberships.some((membership) => membership.firmId === firmId && membership.userId === existingUser.id && membership.role === input.role)) {
        throw new Error("user already has this role in the firm");
      }
      const membership: PartnerFirmMembership = {
        userId: existingUser.id,
        firmId,
        name: existingUser.name,
        phone: existingUser.phone,
        role: input.role,
        status: "ACTIVE",
        joinedAt: new Date().toISOString(),
      };
      partnerFirmMemberships = [
        ...partnerFirmMemberships,
        { userId: membership.userId, firmId: membership.firmId, role: membership.role, status: membership.status },
      ];
      return { kind: "membership" as const, membership };
    }

    if (partnerFirmInvites.some((invite) => invite.firmId === firmId && invite.phone === phone && invite.role === input.role && invite.status === "PENDING")) {
      throw new Error("pending invite already exists for this phone and role");
    }
    const invite: PartnerFirmInvite = {
      id: makeId("pfinv"),
      firmId,
      phone,
      role: input.role,
      status: "PENDING",
      invitedBy: currentUser.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    };
    partnerFirmInvites = [invite, ...partnerFirmInvites];
    return { kind: "invite" as const, invite };
  },

  async removePartnerFirmMembership(firmId: number, userId: number, role: PartnerFirmRole) {
    await wait();
    const membership = partnerFirmMemberships.find((item) => item.firmId === firmId && item.userId === userId && item.role === role);
    if (!membership) {
      throw new Error("membership not found");
    }
    if (membership.role === "OWNER") {
      throw new Error("owner membership cannot be removed");
    }
    partnerFirmMemberships = partnerFirmMemberships.filter((item) => !(item.firmId === firmId && item.userId === userId && item.role === role));
    return { ok: true };
  },

  async revokePartnerFirmInvite(firmId: number, inviteId: string, role: PartnerFirmRole) {
    await wait();
    const invite = partnerFirmInvites.find((item) => item.firmId === firmId && item.id === inviteId && item.role === role && item.status === "PENDING");
    if (!invite) {
      throw new Error("pending invite not found");
    }
    partnerFirmInvites = partnerFirmInvites.filter((item) => !(item.id === inviteId && item.role === role));
    return { ok: true };
  },

  async getPartnerFirmBrands(firmId: number) {
    await wait();
    const brandIds = new Set(getFirmBrandIds(firmId));
    return partnerBrands
      .filter((brand) => brandIds.has(brand.id))
      .map((brand) => ({
        ...brand,
        itemCount: partnerCatalogItems.filter((item) => item.brandId === brand.id).length,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  },

  async createPartnerFirmBrand(firmId: number, input: { brandId?: string; brandName?: string }) {
    await wait();
    const trimmedName = input.brandName?.trim() ?? "";
    let brandId = input.brandId ?? "";

    if (!brandId && !trimmedName) {
      throw new Error("brandId or brandName is required");
    }

    if (brandId) {
      const mappingExists = partnerFirmBrands.some((mapping) => mapping.firmId === firmId && mapping.brandId === brandId);
      if (!mappingExists) {
        throw new Error("Brands cannot be reused across firms");
      }
    } else {
      const duplicateInFirm = partnerFirmBrands.some((mapping) => {
        if (mapping.firmId !== firmId) {
          return false;
        }
        const mappedBrand = partnerBrands.find((brand) => brand.id === mapping.brandId);
        return mappedBrand?.name.toLowerCase() === trimmedName.toLowerCase();
      });
      if (duplicateInFirm) {
        throw new Error("This brand is already mapped to the active firm");
      }

      brandId = makeId("pbrand");
      partnerBrands = [
        ...partnerBrands,
        { id: brandId, name: trimmedName, itemCount: 0 },
      ];
    }

    const mappingExists = partnerFirmBrands.some((mapping) => mapping.firmId === firmId && mapping.brandId === brandId);
    if (!mappingExists) {
      partnerFirmBrands = [{ firmId, brandId }, ...partnerFirmBrands];
    }

    const brand = partnerBrands.find((item) => item.id === brandId)!;
    return {
      id: brand.id,
      name: brand.name,
      itemCount: partnerCatalogItems.filter((item) => item.brandId === brand.id).length,
    };
  },

  async deletePartnerFirmBrand(firmId: number, brandId: number) {
    await wait();
    partnerFirmBrands = partnerFirmBrands.filter((mapping) => !(mapping.firmId === firmId && mapping.brandId === brandId));
    return { ok: true as const };
  },

  async getPartnerBrandItems(firmId: number, brandId: number) {
    await wait();
    const mapped = partnerFirmBrands.some((mapping) => mapping.firmId === firmId && mapping.brandId === brandId);
    if (!mapped) {
      throw new Error("Brand mapping not found");
    }
    return partnerCatalogItems
      .filter((item) => item.brandId === brandId)
      .sort((a, b) => a.name.localeCompare(b.name));
  },

  async getPartnerDashboard(firmId: number) {
    await wait();
    const brands = await this.getPartnerFirmBrands(firmId);
    const allowedBrands = new Set(getFirmBrandIds(firmId));
    const businesses = partnerClientBusinesses.filter((business) => business.firmId === firmId);
    const orders = partnerOrders.filter((order) => order.firmId === firmId);
    const invoices = partnerInvoices.filter((invoice) => invoice.firmId === firmId).map(hydratePartnerInvoice);
    const stockQtyTotal = partnerItems
      .filter((item) => allowedBrands.has(item.brandId))
      .reduce((sum, item) => sum + getPartnerItemStock(firmId, item.id), 0);

    const recentActivity: PartnerDashboardStats["recentActivity"] = [
      ...partnerAuditLogs
        .filter((entry) => entry.firmId === firmId)
        .map((entry) => {
          const afterState = entry.afterState ? JSON.parse(entry.afterState) as Record<string, unknown> : {};

          if (entry.entityType === "ORDER") {
            const order = partnerOrders.find((item) => item.id === entry.entityId && item.firmId === firmId);
            const business = partnerClientBusinesses.find((item) => item.id === order?.clientBusinessId && item.firmId === firmId);
            const outlet = business?.outlets.find((item) => item.id === order?.clientOutletId);
            const status = String(afterState.status || order?.status || "").trim();
            return {
              id: entry.id,
              title: status ? `Order ${order?.orderNumber || entry.referenceLabel || entry.entityId} marked as ${status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())}` : `Order ${order?.orderNumber || entry.referenceLabel || entry.entityId} updated`,
              subtitle: [business?.businessName ? `Client: ${business.businessName}` : "", outlet?.outletName ? `Outlet: ${outlet.outletName}` : ""].filter(Boolean).join(" • "),
              createdAt: entry.createdAt,
              type: "ORDER",
              action: entry.action,
              reference: order?.orderNumber || entry.referenceLabel || entry.entityId,
              party: business?.businessName || "",
              location: outlet?.outletName || "",
              status,
              impactText: status ? `Status changed to ${status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())}` : "",
              href: order ? `/partners/orders/${order.id}` : "",
            };
          }

          if (entry.entityType === "INVOICE") return null;

          if (entry.entityType === "PURCHASE") return null;

          if (entry.entityType === "CREDIT_NOTE") return null;

          if (entry.entityType === "DEBIT_NOTE") return null;

          return {
            id: entry.id,
            title: `${entry.entityType.replace(/_/g, " ")} ${entry.action.replace(/_/g, " ")}`,
            subtitle: entry.referenceLabel || entry.entityId,
            createdAt: entry.createdAt,
          };
        })
        .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry)),
      ...partnerStockEntries
        .filter((entry) => entry.firmId === firmId)
        .slice(0, 4)
        .map((entry) => {
          const item = partnerItems.find((candidate) => candidate.id === entry.itemId);
          const titleByReason: Record<string, string> = {
            OPENING_STOCK: `Opening stock added for ${item?.name ?? "item"}`,
            RETURN_IN: `Client return received for ${item?.name ?? "item"}`,
            RETURN_OUT: `Return sent out for ${item?.name ?? "item"}`,
            DAMAGE: `Damaged stock recorded for ${item?.name ?? "item"}`,
            PURCHASE: `Purchase stock added for ${item?.name ?? "item"}`,
            SALE: `Stock issued for ${item?.name ?? "item"}`,
            ADJUSTMENT: `Stock adjusted for ${item?.name ?? "item"}`,
          };
          return {
            id: `stock_${entry.id}`,
            title: titleByReason[entry.reasonType] || `Stock updated for ${item?.name ?? "item"}`,
            subtitle: entry.referenceId ? `Ref: ${entry.referenceId}` : entry.note || "",
            createdAt: entry.createdAt,
            type: "INVENTORY",
            action: entry.reasonType,
            reference: entry.referenceId || "",
            subject: item?.name || "",
            quantityDelta: entry.quantityDelta,
            impactText: `${entry.quantityDelta > 0 ? "+" : ""}${entry.quantityDelta} units`,
            href: "/partners/stock",
          };
        }),
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    return {
      mappedBrandsCount: brands.length,
      itemCount: partnerCatalogItems.filter((item) => allowedBrands.has(item.brandId)).length,
      clientBusinessCount: businesses.length,
      outletCount: businesses.reduce((sum, business) => sum + business.outlets.length, 0),
      supplierCount: partnerSuppliers.filter((supplier) => supplier.firmId === firmId).length,
      openOrdersCount: orders.filter((order) => order.status !== "CANCELLED").length,
      unpaidInvoicesCount: invoices.filter((invoice) => invoice.dueAmount > 0 && invoice.status !== "CANCELLED").length,
      currentStockQtyTotal: stockQtyTotal,
      recentActivity,
    };
  },

  async getPartnerClients(firmId: number, search: string) {
    await wait();
    const query = search.trim().toLowerCase();
    return partnerClientBusinesses
      .filter((business) => business.firmId === firmId)
      .map(flattenPartnerBusiness)
      .filter((client) => {
        if (!query) return true;
        return client.name.toLowerCase().includes(query) || client.phone.includes(query);
      });
  },

  async getPartnerClientBusinesses(firmId: number, search: string) {
    await wait();
    const query = search.trim().toLowerCase();
    return partnerClientBusinesses
      .filter((business) => business.firmId === firmId)
      .filter((business) => {
        if (!query) return true;
        return (
          business.businessName.toLowerCase().includes(query) ||
          business.outlets.some(
            (outlet) =>
              outlet.outletName.toLowerCase().includes(query) ||
              outlet.contacts.some(
                (contact) =>
                  contact.name.toLowerCase().includes(query) ||
                  contact.phone.includes(query),
              ),
          )
        );
      })
      .map((business) => ({
        ...business,
        outletCount: business.outlets.length,
        outlets: [...business.outlets].sort((a, b) => a.outletName.localeCompare(b.outletName)),
      }))
      .sort((a, b) => a.businessName.localeCompare(b.businessName));
  },

  async validatePartnerBusinessGSTIN(firmId: number, gstin: string, excludeBusinessId = "") {
    await wait();
    const existing = getPartnerBusinessByGSTIN(firmId, gstin, excludeBusinessId);
    return {
      exists: Boolean(existing),
      businessId: existing?.id ?? "",
      businessName: existing?.businessName ?? "",
    };
  },

  async createPartnerClientBusiness(
    firmId: number,
    input: {
      businessName: string;
      gstin?: string;
      billingAddress?: string;
      contacts: Array<{ name: string; phone: string }>;
    },
  ) {
    await wait();
    const businessName = input.businessName.trim();
    if (!businessName) {
      throw new Error("Business name is required");
    }
    const duplicate = getPartnerBusinessByGSTIN(firmId, input.gstin ?? "");
    if (duplicate) {
      throw new Error(`This GSTIN already exists under business ${duplicate.businessName}. You can add a new outlet under it instead.`);
    }
    if (input.gstin?.trim() && !isValidGSTIN(input.gstin)) {
      throw new Error("GSTIN must be a valid 15-character GSTIN.");
    }
    const contacts = normalizePartnerContacts(input.contacts);
    const businessId = makeId("pbiz");
    const business: PartnerClientBusiness = {
      id: businessId,
      firmId,
      businessName,
      gstin: normalizeGSTIN(input.gstin ?? ""),
      billingName: businessName,
      billingAddress: input.billingAddress?.trim() || "",
      contacts: contacts.map((contact, index) => ({
        id: makeId("pbc"),
        firmId,
        clientBusinessId: businessId,
        name: contact.name,
        phone: contact.phone,
        isPrimary: index === 0,
        sortOrder: index,
      })),
      outletCount: 0,
      outlets: [],
    };
    partnerClientBusinesses = [business, ...partnerClientBusinesses];
    return business;
  },

  async addPartnerClientOutlet(
    firmId: number,
    businessId: string,
    input: {
      outletName: string;
      address?: string;
      contacts: Array<{ name: string; phone: string }>;
    },
  ) {
    await wait();
    const business = getPartnerBusinessById(firmId, businessId);
    if (!business) {
      throw new Error("Client not found");
    }
    const outletName = input.outletName.trim();
    if (!outletName) {
      throw new Error("Outlet name is required");
    }
    const contacts = normalizePartnerContacts(input.contacts);
    const outlet: PartnerClientOutlet = {
      id: makeId("pout"),
      firmId,
      clientBusinessId: businessId,
      outletName,
      address: input.address?.trim() || "",
      contacts: contacts.map((contact, index) => ({
        id: makeId("poc"),
        firmId,
        outletId: "",
        name: contact.name,
        phone: contact.phone,
        isPrimary: index === 0,
        sortOrder: index,
      })),
      isPrimary: false,
      status: "ACTIVE",
    };
    outlet.contacts = outlet.contacts.map((contact) => ({ ...contact, outletId: outlet.id }));
    partnerClientBusinesses = partnerClientBusinesses.map((item) =>
      item.id === businessId
        ? { ...item, outlets: [...item.outlets, outlet], outletCount: item.outlets.length + 1 }
        : item,
    );
    return partnerClientBusinesses.find((item) => item.id === businessId)!;
  },

  async updatePartnerClientBusiness(
    firmId: number,
    businessId: string,
    input: {
      businessName: string;
      gstin?: string;
      billingAddress?: string;
      contacts: Array<{ name: string; phone: string }>;
    },
  ) {
    await wait();
    const business = getPartnerBusinessById(firmId, businessId);
    if (!business) {
      throw new Error("Client not found");
    }
    const duplicate = getPartnerBusinessByGSTIN(firmId, input.gstin ?? "", businessId);
    if (duplicate) {
      throw new Error(`This GSTIN already exists under business ${duplicate.businessName}. You can add a new outlet under it instead.`);
    }
    if (input.gstin?.trim() && !isValidGSTIN(input.gstin)) {
      throw new Error("GSTIN must be a valid 15-character GSTIN.");
    }
    const contacts = normalizePartnerContacts(input.contacts);
    partnerClientBusinesses = partnerClientBusinesses.map((item) => {
      if (item.id !== businessId) return item;
      return {
        ...item,
        businessName: input.businessName.trim(),
        gstin: normalizeGSTIN(input.gstin ?? ""),
        billingAddress: input.billingAddress?.trim() || "",
        contacts: contacts.map((contact, index) => ({
          id: item.contacts[index]?.id || makeId("pbc"),
          firmId,
          clientBusinessId: businessId,
          name: contact.name,
          phone: contact.phone,
          isPrimary: index === 0,
          sortOrder: index,
        })),
        outletCount: item.outlets.length,
      };
    });
    return partnerClientBusinesses.find((item) => item.id === businessId)!;
  },

  async archivePartnerClientBusiness(firmId: number, businessId: string) {
    const business = getPartnerBusinessById(firmId, businessId);
    if (!business) {
      throw new Error("Client not found");
    }
    partnerClientBusinesses = partnerClientBusinesses.map((item) =>
      item.id === businessId
        ? {
            ...item,
            outlets: item.outlets.map((outlet) => ({ ...outlet, status: "INACTIVE" as const })),
          }
        : item,
    );
    return partnerClientBusinesses.find((item) => item.id === businessId)!;
  },

  async updatePartnerClientOutlet(
    firmId: number,
    businessId: string,
    outletId: string,
    input: {
      outletName: string;
      address?: string;
      contacts: Array<{ name: string; phone: string }>;
      status: "ACTIVE" | "INACTIVE";
    },
  ) {
    await wait();
    const business = getPartnerBusinessById(firmId, businessId);
    if (!business) {
      throw new Error("Client not found");
    }
    const contacts = normalizePartnerContacts(input.contacts);
    partnerClientBusinesses = partnerClientBusinesses.map((item) => {
      if (item.id !== businessId) return item;
      return {
        ...item,
        outlets: item.outlets.map((outlet) =>
          outlet.id === outletId
            ? {
                ...outlet,
                outletName: input.outletName.trim(),
                address: input.address?.trim() || "",
                contacts: contacts.map((contact, index) => ({
                  id: outlet.contacts[index]?.id ?? makeId("poc"),
                  firmId,
                  outletId: outletId,
                  name: contact.name,
                  phone: contact.phone,
                  isPrimary: index === 0,
                  sortOrder: index,
                })),
                status: input.status,
              }
            : outlet,
        ),
      };
    });
    return partnerClientBusinesses.find((item) => item.id === businessId)!;
  },

  async archivePartnerClientOutlet(firmId: number, businessId: string, outletId: string) {
    const business = getPartnerBusinessById(firmId, businessId);
    const outlet = business?.outlets.find((item) => item.id === outletId);
    if (!business || !outlet) {
      throw new Error("Outlet not found");
    }
    return this.updatePartnerClientOutlet(firmId, businessId, outletId, {
      outletName: outlet.outletName,
      address: outlet.address,
      contacts: (outlet.contacts ?? []).map((contact) => ({ name: contact.name, phone: contact.phone })),
      status: "INACTIVE",
    });
  },

  async createPartnerBrandItem(
    firmId: number,
    brandId: number,
    input: {
      name: string;
      description?: string;
      sku?: string;
      hsnCode?: string;
      defaultMrp?: number;
      defaultDiscountPercentage?: number;
      status?: "ACTIVE" | "INACTIVE";
    }
  ) {
    await wait();
    const mapped = partnerFirmBrands.some((mapping) => mapping.firmId === firmId && mapping.brandId === brandId);
    if (!mapped) {
      throw new Error("brand mapping not found");
    }
    const name = input.name.trim();
    const sku = input.sku?.trim() || "";
    if (!sku) {
      throw new Error("sku is required");
    }
    if (partnerCatalogItems.some((item) => item.brandId === brandId && item.sku.trim().toLowerCase() === sku.toLowerCase())) {
      throw new Error(`sku "${sku}" already exists for this brand`);
    }
    if (input.hsnCode?.trim() && !/^\d+$/.test(input.hsnCode.trim())) {
      throw new Error("hsnCode must contain digits only");
    }
    const defaultMrp = input.defaultMrp ?? 0;
    const defaultDiscountPercentage = input.defaultDiscountPercentage ?? 0;
    if (!Number.isInteger(defaultMrp) || defaultMrp <= 0) {
      throw new Error("defaultMrp must be greater than zero");
    }
    if (!Number.isFinite(defaultDiscountPercentage) || defaultDiscountPercentage < 0 || defaultDiscountPercentage > 100) {
      throw new Error("Default Buy Margin must be between 0 and 100");
    }

    const next: PartnerCatalogItem = {
      id: makeId("pcat"),
      brandId,
      name,
      description: input.description?.trim() || "",
      hsnCode: input.hsnCode?.trim() || "",
      sku,
      defaultMrp,
      defaultDiscountPercentage,
      status: input.status ?? "ACTIVE",
      updatedAt: new Date().toISOString(),
    };
    partnerCatalogItems = [next, ...partnerCatalogItems];
    return next;
  },

  async updatePartnerBrandItem(
    firmId: number,
    brandId: number,
    itemId: string,
    patch: {
      name?: string;
      description?: string;
      hsnCode?: string;
      defaultMrp?: number;
      defaultDiscountPercentage?: number;
      status?: "ACTIVE" | "INACTIVE";
    }
  ) {
    await wait();
    const mapped = partnerFirmBrands.some((mapping) => mapping.firmId === firmId && mapping.brandId === brandId);
    if (!mapped) {
      throw new Error("brand mapping not found");
    }
    const current = partnerCatalogItems.find((item) => item.id === itemId && item.brandId === brandId);
    if (!current) {
      throw new Error("item not found");
    }
    if ("sku" in patch) {
      throw new Error("SKU cannot be changed. Create a new item for a different SKU.");
    }
    const candidateHSNCode = patch.hsnCode != null ? patch.hsnCode.trim() : current.hsnCode;
    if (candidateHSNCode && !/^\d+$/.test(candidateHSNCode)) {
      throw new Error("hsnCode must contain digits only");
    }
    const candidateDefaultMrp = patch.defaultMrp ?? current.defaultMrp;
    const candidateDefaultDiscountPercentage = patch.defaultDiscountPercentage ?? current.defaultDiscountPercentage;
    if (!Number.isInteger(candidateDefaultMrp) || candidateDefaultMrp <= 0) {
      throw new Error("defaultMrp must be greater than zero");
    }
    if (!Number.isFinite(candidateDefaultDiscountPercentage) || candidateDefaultDiscountPercentage < 0 || candidateDefaultDiscountPercentage > 100) {
      throw new Error("Default Buy Margin must be between 0 and 100");
    }
    const next: PartnerCatalogItem = {
      ...current,
      name: patch.name != null ? patch.name.trim() : current.name,
      description: patch.description != null ? patch.description.trim() : current.description,
      hsnCode: candidateHSNCode,
      defaultMrp: candidateDefaultMrp,
      defaultDiscountPercentage: candidateDefaultDiscountPercentage,
      status: patch.status ?? current.status,
      updatedAt: new Date().toISOString(),
    };
    partnerCatalogItems = partnerCatalogItems.map((item) => (item.id === itemId ? next : item));
    return next;
  },

  async getPartnerStock(firmId: number, brandId = "") {
    await wait();
    const allowedBrands = new Set(getFirmBrandIds(firmId));
    return partnerItems
      .filter((item) => allowedBrands.has(item.brandId))
      .filter((item) => (brandId ? item.brandId === brandId : true))
      .map((item): PartnerStockRow => {
        const brandName = partnerBrands.find((brand) => brand.id === item.brandId)?.name ?? "";
        return {
          itemId: item.id,
          itemName: item.name,
          itemCode: item.itemCode,
          brandId: item.brandId,
          brandName,
          sku: item.sku,
          mrp: item.mrp,
          discountPercentage: item.discountPercentage ?? 0,
          currentStockQty: getPartnerItemStock(firmId, item.id),
          lastUpdated: getPartnerItemLastUpdated(firmId, item.id),
        };
      })
      .sort((a, b) => a.brandName.localeCompare(b.brandName) || a.itemName.localeCompare(b.itemName));
  },

  async getPartnerInventory(firmId: number, brandId = "") {
    await wait();
    const allowedBrands = new Set(getFirmBrandIds(firmId));
    return partnerFirmInventoryItems
      .filter((item) => item.firmId === firmId)
      .filter((item) => allowedBrands.has(item.brandId))
      .filter((item) => (brandId ? item.brandId === brandId : true))
      .sort((a, b) => a.itemName.localeCompare(b.itemName) || a.mrp - b.mrp || a.discountPercentage - b.discountPercentage);
  },

  async updatePartnerInventory(firmId: number, itemId: string, input: PartnerInventoryUpdateInput) {
    await wait();
    const current = partnerFirmInventoryItems.find((item) => item.firmId === firmId && item.itemId === itemId);
    if (!current) {
      throw new Error("Inventory item not found");
    }
    if (input.quantity != null && (!Number.isInteger(input.quantity) || input.quantity < 0)) {
      throw new Error("Quantity must be a non-negative integer");
    }
    if (input.status != null && input.status !== "ACTIVE" && input.status !== "INACTIVE") {
      throw new Error("Status must be ACTIVE or INACTIVE");
    }
    if ((input.quantity != null || input.status != null) && !input.note?.trim()) {
      throw new Error("Note is required");
    }
    const next: PartnerInventoryItem = {
      ...current,
      quantity: input.quantity ?? current.quantity,
      status: input.status ?? current.status,
      updatedAt: new Date().toISOString(),
    };
    partnerFirmInventoryItems = partnerFirmInventoryItems.map((item) => (item.itemId === itemId ? next : item));
    if (input.quantity != null && input.quantity !== current.quantity) {
      partnerInventoryAdjustments = [
        {
          id: makeId("padj"),
          firmId,
          itemId,
          quantityFrom: current.quantity,
          quantityTo: input.quantity,
          note: input.note?.trim() || "",
          createdAt: new Date().toISOString(),
        },
        ...partnerInventoryAdjustments,
      ];
    }
    return next;
  },

  async getPartnerInventoryHistory(
    firmId: number,
    filters: { brandId?: string; fromDate?: string; toDate?: string; query?: string } = {},
  ) {
    await wait();
    const supplyInwards: PartnerInventoryHistoryEntry[] = partnerSupplyInwards
      .filter((item) => item.firmId === firmId)
      .map((item) => {
        const lines = partnerInventoryReceipts
          .filter((receipt) => receipt.firmId === firmId && receipt.supplyInwardId === item.id)
          .map((receipt) => {
            const inventoryItem = partnerFirmInventoryItems.find((candidate) => candidate.firmId === firmId && candidate.itemId === receipt.itemId);
            return {
              itemId: receipt.itemId,
              catalogItemId: inventoryItem?.catalogItemId ?? "",
              itemName: inventoryItem?.itemName ?? "",
              sku: inventoryItem?.sku ?? "",
              quantity: receipt.quantity,
            };
          });
        const lineTotals = new Map<string, number>();
        for (const line of lines) {
          const key = `${line.itemId}:${line.catalogItemId}`;
          lineTotals.set(key, (lineTotals.get(key) ?? 0) + line.quantity);
        }
        const itemsSummary = Array.from(lineTotals.entries()).map(([key, quantity]) => {
          const [itemId, catalogItemId] = key.split(":");
          const base = lines.find((line) => line.itemId === itemId && line.catalogItemId === catalogItemId);
          return {
            itemId,
            catalogItemId,
            itemName: base?.itemName ?? "",
            sku: base?.sku ?? "",
            quantity,
          };
        }).sort((a, b) => a.itemName.localeCompare(b.itemName) || a.sku.localeCompare(b.sku));
        const canRevert =
          item.status === "POSTED" &&
          itemsSummary.every((line) => {
            const current = partnerFirmInventoryItems.find((candidate) => candidate.firmId === firmId && candidate.itemId === line.itemId);
            return (current?.quantity ?? 0) >= line.quantity;
          });
        return {
          id: item.id,
          firmId,
          brandId: item.brandId,
          eventType: "SUPPLY_INWARD",
          quantityDelta: itemsSummary.reduce((sum, line) => sum + line.quantity, 0),
          supplierId: item.supplierId,
          supplierName: item.supplierName,
          note: item.note,
          status: item.status,
          canRevert,
          revertedAt: item.revertedAt,
          revertReason: item.revertReason,
          eventAt: item.createdAt,
          items: itemsSummary,
        };
      });

    const adjustments: PartnerInventoryHistoryEntry[] = partnerInventoryAdjustments
      .filter((item) => item.firmId === firmId)
      .map((item) => {
        const inventoryItem = partnerFirmInventoryItems.find((candidate) => candidate.firmId === firmId && candidate.itemId === item.itemId);
        return {
          id: item.id,
          firmId,
          itemId: item.itemId,
          catalogItemId: inventoryItem?.catalogItemId ?? "",
          brandId: inventoryItem?.brandId ?? "",
          itemName: inventoryItem?.itemName ?? "",
          sku: inventoryItem?.sku ?? "",
          eventType: "ADJUSTMENT",
          quantityDelta: item.quantityTo - item.quantityFrom,
          quantityFrom: item.quantityFrom,
          quantityTo: item.quantityTo,
          note: item.note,
          eventAt: item.createdAt,
        };
      });

    const query = filters.query?.trim().toLowerCase() || "";
    return [...supplyInwards, ...adjustments]
      .filter((item) => !filters.brandId || item.brandId === filters.brandId)
      .filter((item) => !filters.fromDate || item.eventAt.slice(0, 10) >= filters.fromDate)
      .filter((item) => !filters.toDate || item.eventAt.slice(0, 10) <= filters.toDate)
      .filter((item) => {
        if (!query) return true;
        const itemText = item.items?.map((line) => `${line.itemName} ${line.sku}`).join(" ") ?? "";
        return [item.itemName ?? "", item.sku ?? "", item.supplierName ?? "", item.note ?? "", itemText]
          .some((value) => value.toLowerCase().includes(query));
      })
      .sort((a, b) => b.eventAt.localeCompare(a.eventAt) || b.id.localeCompare(a.id));
  },

  async revertPartnerSupplyInward(firmId: number, supplyInwardId: string, reason: string) {
    await wait();
    const inward = partnerSupplyInwards.find((item) => item.firmId === firmId && item.id === supplyInwardId);
    if (!inward) {
      throw new Error("Supply inward not found");
    }
    if (inward.status !== "POSTED") {
      throw new Error("Supply inward is already reverted");
    }
    const groupedLines = partnerInventoryReceipts
      .filter((item) => item.firmId === firmId && item.supplyInwardId === supplyInwardId)
      .reduce((map, item) => {
        map.set(item.itemId, (map.get(item.itemId) ?? 0) + item.quantity);
        return map;
      }, new Map<string, number>());
    for (const [itemId, quantity] of groupedLines.entries()) {
      const inventoryItem = partnerFirmInventoryItems.find((item) => item.firmId === firmId && item.itemId === itemId);
      if (!inventoryItem || inventoryItem.quantity- quantity < 0) {
        throw new Error("Cannot revert supply inward because one or more items would become negative");
      }
    }
    const revertedAt = new Date().toISOString();
    partnerFirmInventoryItems = partnerFirmInventoryItems.map((item) => {
      const revertQuantity = groupedLines.get(item.itemId);
      if (item.firmId !== firmId || revertQuantity == null) {
        return item;
      }
      return {
        ...item,
        quantity: item.quantity - revertQuantity,
        updatedAt: revertedAt,
      };
    });
    partnerSupplyInwards = partnerSupplyInwards.map((item) =>
      item.id === supplyInwardId
        ? {
            ...item,
            status: "REVERTED",
            revertedAt,
            revertReason: reason.trim() || "",
          }
        : item,
    );
    partnerInventoryReceipts = partnerInventoryReceipts.map((item) =>
      item.supplyInwardId === supplyInwardId
        ? {
            ...item,
            status: "VOIDED",
            voidedAt: revertedAt,
            voidReason: reason.trim() || "",
          }
        : item,
    );
    const entries = await this.getPartnerInventoryHistory(firmId, {});
    const entry = entries.find((item) => item.id === supplyInwardId && item.eventType === "SUPPLY_INWARD");
    return entry ?? {
      id: supplyInwardId,
      firmId,
      brandId: inward.brandId,
      eventType: "SUPPLY_INWARD",
      quantityDelta: 0,
      supplierId: inward.supplierId,
      supplierName: inward.supplierName,
      note: inward.note,
      status: "REVERTED",
      canRevert: false,
      revertedAt,
      revertReason: reason.trim() || "",
      eventAt: inward.receivedAt,
      items: [],
    };
  },

  async getPartnerOrders(firmId: number) {
    await wait();
    return partnerOrders
      .filter((order) => order.firmId === firmId)
      .map(hydratePartnerOrder)
      .sort((a, b) => b.orderDate.localeCompare(a.orderDate));
  },

  async getPartnerOrderById(firmId: number, orderId: string) {
    await wait();
    const order = partnerOrders.find((item) => item.firmId === firmId && item.id === orderId);
    if (!order) {
      throw new Error("Order not found");
    }
    return hydratePartnerOrder(order);
  },

  async createPartnerOrder(
    firmId: number,
    input: {
      clientBusinessId: string;
      clientOutletId: string;
      orderDate?: string;
      source?: PartnerOrder["source"];
      sellerMarginPercentage?: number;
      notes?: string;
      items: Array<{ itemId: string; quantity: number }>;
    },
  ) {
    await wait();
    const business = getPartnerBusinessById(firmId, input.clientBusinessId);
    const outlet = getPartnerOutletById(firmId, input.clientOutletId);
    if (!business || !outlet) {
      throw new Error("Client or outlet not found");
    }
    if (!input.items.length) {
      throw new Error("Add at least one order line");
    }
    const nextItems: PartnerOrderItem[] = input.items.map((line) => {
      const item = partnerCatalogItems.find((candidate) => candidate.id === line.itemId);
      if (!item) {
        throw new Error("Order item not found");
      }
      if (item.status !== "ACTIVE") {
        throw new Error("Order item is inactive");
      }
      const sellerMarginPercentage = input.sellerMarginPercentage ?? item.defaultDiscountPercentage;
      if (!Number.isFinite(sellerMarginPercentage) || sellerMarginPercentage < 0 || sellerMarginPercentage > 100) {
        throw new Error("Seller margin must be between 0 and 100");
      }
      return {
        id: makeId("poitem"),
        orderId: "",
        itemId: item.id,
        itemCode: item.sku,
        itemName: item.name,
        unit: "",
        quantity: line.quantity,
        mrp: item.defaultMrp,
        discountPercentage: sellerMarginPercentage,
      };
    });
    const orderId = makeId("porder");
    const order = hydratePartnerOrder({
      id: orderId,
      firmId,
      orderNumber: `ORD-${1000 + partnerOrders.filter((item) => item.firmId === firmId).length + 1}`,
      clientBusinessId: business.id,
      clientBusinessName: business.businessName,
      clientOutletId: outlet.id,
      clientOutletName: outlet.outletName,
      orderDate: input.orderDate || todayISO(),
      source: input.source || "MANUAL",
      status: "DRAFT",
      createdAt: new Date().toISOString(),
      createdByName: currentUser.name,
      itemCount: 0,
      totalQuantity: 0,
      notes: input.notes?.trim() || "",
      items: nextItems.map((item) => ({ ...item, orderId })),
      requestedItems: nextItems.map((item) => ({ ...item, orderId })),
      billableLines: [],
      unfulfilledItems: [],
    });
    partnerOrders = [order, ...partnerOrders];
    return order;
  },

  async updatePartnerOrderStatus(
    firmId: number,
    orderId: string,
    nextStatus: PartnerOrder["status"],
    input: {
      sellerMarginPercentage?: number;
      note?: string;
      items?: Array<{ itemId: string; quantity: number }>;
      requestedItems?: Array<{ itemId: string; sellerMarginPercentage: number }>;
      packedItems?: Array<{ orderItemId?: string; itemId?: string; packedQuantity: number; shortReason?: string }>;
      dispatchDetails?: {
        dispatchDate?: string;
        transportName?: string;
        vehicleNumber?: string;
        driverPhone?: string;
        notes?: string;
      };
      dispatchedItems?: Array<{ orderItemId?: string; itemId?: string; dispatchedQuantity: number }>;
      deliveryDetails?: {
        deliveredDate?: string;
        recipientName?: string;
        proofReference?: string;
        notes?: string;
      };
      deliveredItems?: Array<{ orderItemId?: string; itemId?: string; deliveredQuantity: number; returnedQuantity?: number }>;
    } = {},
  ) {
    await wait();
    const current = partnerOrders.find((item) => item.firmId === firmId && item.id === orderId);
    if (!current) {
      throw new Error("Order not found");
    }
    if (!canTransitionOrderStatus(current.status, nextStatus)) {
      throw new Error(`Cannot move order from ${current.status} to ${nextStatus}`);
    }
    const now = new Date().toISOString();
    const patch: Partial<PartnerOrder> = { status: nextStatus };
    if (nextStatus === "CONFIRMED") patch.confirmedAt = now;
    if (nextStatus === "DRAFT") patch.confirmedAt = "";
    if (nextStatus === "DISPATCHED") patch.dispatchedAt = now;
    if (nextStatus === "DELIVERED" || nextStatus === "PARTIALLY_DELIVERED") patch.deliveredAt = now;
    if (nextStatus === "CANCELLED") patch.cancelledAt = now;
    if (nextStatus === "DRAFT") {
      if (current.status !== "CONFIRMED") {
        throw new Error("Only confirmed orders can be reverted to draft");
      }
      const linkedInvoice = partnerInvoices.find((invoice) => invoice.firmId === firmId && invoice.orderId === orderId && invoice.status !== "CANCELLED");
      if (linkedInvoice && linkedInvoice.status !== "DRAFT") {
        throw new Error("Invoice is finalized; use return or credit note flow instead of reverting this order");
      }
      if (
        current.items.some(
          (line) =>
            (line.packedQuantity ?? 0) > 0 ||
            (line.dispatchedQuantity ?? 0) > 0 ||
            (line.deliveredQuantity ?? 0) > 0 ||
            (line.returnedQuantity ?? 0) > 0 ||
            (line.cancelledQuantity ?? 0) > 0,
        )
      ) {
        throw new Error("Order cannot be reverted after packing or dispatch has started");
      }
      if (linkedInvoice) {
        linkedInvoice.status = "CANCELLED";
      }
      for (const line of current.items) {
        const stockItem = partnerFirmInventoryItems.find((item) => item.firmId === firmId && item.itemId === line.itemId);
        if (stockItem) {
          stockItem.quantity += line.quantity;
          stockItem.updatedAt = now;
        }
      }
      const requestedItems = (current.requestedItems?.length ? current.requestedItems : current.items).map((line) => ({
        ...line,
        billableLineId: undefined,
        packedQuantity: 0,
        dispatchedQuantity: 0,
        deliveredQuantity: 0,
        returnedQuantity: 0,
        cancelledQuantity: 0,
        shortReason: "",
      }));
      patch.items = requestedItems;
      patch.requestedItems = requestedItems;
      patch.billableLines = [];
      patch.unfulfilledItems = [];
      patch.linkedInvoiceId = undefined;
      patch.linkedInvoiceNumber = undefined;
      patch.itemCount = requestedItems.length;
      patch.totalQuantity = requestedItems.reduce((sum, line) => sum + line.quantity, 0);
    }
    if (nextStatus === "PACKED") {
      const packedByLine = new Map<string, { packedQuantity: number; shortReason?: string }>();
      for (const packed of input.packedItems ?? []) {
        const key = packed.orderItemId || packed.itemId || "";
        if (!key) throw new Error("Packed item is required");
        if (!Number.isFinite(packed.packedQuantity) || packed.packedQuantity < 0) throw new Error("Packed quantity cannot be negative");
        packedByLine.set(key, packed);
      }
      patch.items = current.items.map((line) => {
        const packed = packedByLine.get(line.id) ?? packedByLine.get(line.itemId);
        const packedQuantity = packed?.packedQuantity ?? line.quantity;
        if (packedQuantity > line.quantity) throw new Error(`Packed quantity exceeds allocated quantity for ${line.itemName}`);
        if (packedQuantity < line.quantity && !packed?.shortReason) throw new Error(`Short reason is required for ${line.itemName}`);
        return { ...line, packedQuantity, shortReason: packed?.shortReason || "" };
      });
    }
    if (nextStatus === "DISPATCHED") {
      const dispatchedByLine = new Map<string, number>();
      for (const dispatched of input.dispatchedItems ?? []) {
        const key = dispatched.orderItemId || dispatched.itemId || "";
        if (!key) throw new Error("Dispatched item is required");
        if (!Number.isFinite(dispatched.dispatchedQuantity) || dispatched.dispatchedQuantity < 0) throw new Error("Dispatch quantity cannot be negative");
        dispatchedByLine.set(key, dispatched.dispatchedQuantity);
      }
      patch.dispatchDate = input.dispatchDetails?.dispatchDate || "";
      patch.transportName = input.dispatchDetails?.transportName || "";
      patch.vehicleNumber = input.dispatchDetails?.vehicleNumber || "";
      patch.driverPhone = input.dispatchDetails?.driverPhone || "";
      patch.dispatchNotes = input.dispatchDetails?.notes || "";
      patch.items = current.items.map((line) => {
        const packedQuantity = line.packedQuantity ?? line.quantity;
        const dispatchedQuantity = dispatchedByLine.get(line.id) ?? dispatchedByLine.get(line.itemId) ?? packedQuantity;
        if (dispatchedQuantity > packedQuantity) throw new Error(`Dispatch quantity exceeds packed quantity for ${line.itemName}`);
        return { ...line, packedQuantity, dispatchedQuantity };
      });
    }
    if (nextStatus === "CONFIRMED") {
      const requiredByCatalog = new Map<string, number>();
      const requestedByCatalog = new Map<string, PartnerOrderItem>();
      const requestedItems = current.requestedItems?.length ? current.requestedItems : current.items;
      const sellerMarginByCatalog = new Map((input.requestedItems ?? []).map((line) => [line.itemId, line.sellerMarginPercentage]));
      for (const margin of sellerMarginByCatalog.values()) {
        if (!Number.isFinite(margin) || margin < 0 || margin > 100) {
          throw new Error("Seller margin must be between 0 and 100");
        }
      }
      const nextRequestedItems = requestedItems.map((line) => {
        const sellerMarginPercentage = sellerMarginByCatalog.get(line.itemId) ?? input.sellerMarginPercentage ?? line.discountPercentage ?? 0;
        if (!Number.isFinite(sellerMarginPercentage) || sellerMarginPercentage < 0 || sellerMarginPercentage > 100) {
          throw new Error("Seller margin must be between 0 and 100");
        }
        return { ...line, discountPercentage: sellerMarginPercentage };
      });
      for (const line of nextRequestedItems) {
        requiredByCatalog.set(line.itemId, (requiredByCatalog.get(line.itemId) ?? 0) + line.quantity);
        requestedByCatalog.set(line.itemId, line);
      }
      const allocatedByCatalog = new Map<string, number>();
      const seen = new Set<string>();
      const billableByKey = new Map<string, PartnerOrderBillableLine>();
      const allocations = (input.items ?? []).map((line) => {
        if (!line.itemId) throw new Error("Item code is required");
        if (!Number.isFinite(line.quantity) || line.quantity <= 0) throw new Error("Quantity must be positive");
        if (seen.has(line.itemId)) throw new Error("Duplicate item code allocations are not allowed");
        seen.add(line.itemId);
        const stockItem = partnerFirmInventoryItems.find((item) => item.firmId === firmId && item.itemId === line.itemId && item.status === "ACTIVE");
        if (!stockItem) throw new Error("Stock item code not found");
        if (!requiredByCatalog.has(stockItem.catalogItemId)) throw new Error("Stock item code does not belong to this order");
        if (line.quantity > stockItem.quantity) throw new Error(`Only ${stockItem.quantity} available for ${stockItem.sku}`);
        allocatedByCatalog.set(stockItem.catalogItemId, (allocatedByCatalog.get(stockItem.catalogItemId) ?? 0) + line.quantity);
        if ((allocatedByCatalog.get(stockItem.catalogItemId) ?? 0) > (requiredByCatalog.get(stockItem.catalogItemId) ?? 0)) {
          throw new Error("Allocated quantity exceeds requested quantity");
        }
        const requestedLine = requestedByCatalog.get(stockItem.catalogItemId);
        if (!requestedLine) throw new Error("Requested catalog line not found");
        const sellerMarginPercentage = requestedLine.discountPercentage;
        const key = `${stockItem.catalogItemId}|${stockItem.mrp}|${sellerMarginPercentage}`;
        let billableLine = billableByKey.get(key);
        if (!billableLine) {
          const rate = partnerLineRate(stockItem.mrp, sellerMarginPercentage);
          billableLine = {
            id: makeId("pobl"),
            orderId,
            catalogItemId: stockItem.catalogItemId,
            itemCode: requestedLine.itemCode,
            itemName: requestedLine.itemName,
            quantity: 0,
            mrp: stockItem.mrp,
            sellerMarginPercentage,
            rate,
            lineTotal: 0,
          };
          billableByKey.set(key, billableLine);
        }
        billableLine.quantity += line.quantity;
        billableLine.lineTotal = Math.round((billableLine.lineTotal + billableLine.rate * line.quantity) * 100) / 100;
        return {
          id: makeId("poitem"),
          orderId,
          billableLineId: billableLine.id,
          itemId: stockItem.itemId,
          catalogItemId: stockItem.catalogItemId,
          itemCode: stockItem.sku,
          itemName: stockItem.itemName,
          unit: "",
          quantity: line.quantity,
          mrp: stockItem.mrp,
          discountPercentage: stockItem.discountPercentage,
        };
      });
      for (const allocation of allocations) {
        const stockItem = partnerFirmInventoryItems.find((item) => item.firmId === firmId && item.itemId === allocation.itemId);
        if (stockItem) {
          stockItem.quantity -= allocation.quantity;
          stockItem.updatedAt = now;
        }
      }
      const unfulfilledItems = nextRequestedItems.flatMap((line) => {
        const openQuantity = line.quantity - (allocatedByCatalog.get(line.itemId) ?? 0);
        if (openQuantity <= 0) return [];
        return [{
          id: makeId("puoi"),
          firmId,
          clientBusinessId: current.clientBusinessId,
          clientOutletId: current.clientOutletId,
          sourceOrderId: current.id,
          sourceOrderLineId: line.id,
          brandId: line.brandId || "",
          catalogItemId: line.itemId,
          itemCode: line.itemCode,
          itemName: line.itemName,
          requestedQuantity: line.quantity,
          fulfilledQuantity: line.quantity - openQuantity,
          openQuantity,
          status: "OPEN" as const,
          reason: "INSUFFICIENT_STOCK",
          createdAt: now,
          updatedAt: now,
        }];
      });
      patch.items = allocations;
      patch.requestedItems = nextRequestedItems;
      patch.billableLines = Array.from(billableByKey.values());
      patch.unfulfilledItems = unfulfilledItems;
      patch.itemCount = allocations.length;
      patch.totalQuantity = allocations.reduce((sum, line) => sum + line.quantity, 0);
    }
    if (nextStatus === "DELIVERED") {
      const deliveredByLine = new Map<string, { deliveredQuantity: number; returnedQuantity?: number }>();
      for (const delivered of input.deliveredItems ?? []) {
        const key = delivered.orderItemId || delivered.itemId || "";
        if (!key) throw new Error("Delivered item is required");
        if (!Number.isFinite(delivered.deliveredQuantity) || delivered.deliveredQuantity < 0) throw new Error("Delivered quantity cannot be negative");
        if ((delivered.returnedQuantity ?? 0) < 0) throw new Error("Returned quantity cannot be negative");
        deliveredByLine.set(key, delivered);
      }
      patch.deliveredDate = input.deliveryDetails?.deliveredDate || "";
      patch.deliveryRecipientName = input.deliveryDetails?.recipientName || "";
      patch.deliveryProofReference = input.deliveryDetails?.proofReference || "";
      patch.deliveryNotes = input.deliveryDetails?.notes || "";
      patch.items = current.items.map((line) => {
        const dispatchedQuantity = line.dispatchedQuantity ?? line.quantity;
        const delivered = deliveredByLine.get(line.id) ?? deliveredByLine.get(line.itemId);
        const deliveredQuantity = delivered?.deliveredQuantity ?? dispatchedQuantity;
        const returnedQuantity = delivered?.returnedQuantity ?? line.returnedQuantity ?? 0;
        if (deliveredQuantity + returnedQuantity > dispatchedQuantity) {
          throw new Error(`Delivered and returned quantities exceed dispatched quantity for ${line.itemName}`);
        }
        return { ...line, dispatchedQuantity, deliveredQuantity, returnedQuantity };
      });
    }
    if (nextStatus === "PARTIALLY_DELIVERED") {
      const quantities = new Map((input.items ?? []).map((line) => [line.itemId, line.quantity]));
      patch.items = current.items.map((line) => ({
        ...line,
        dispatchedQuantity: line.dispatchedQuantity ?? line.quantity,
        deliveredQuantity: quantities.get(line.itemId) ?? line.deliveredQuantity ?? 0,
      }));
    }
    if (nextStatus === "PARTIALLY_RETURNED" || nextStatus === "RETURNED") {
      const quantities = new Map((input.items ?? []).map((line) => [line.itemId, line.quantity]));
      patch.items = current.items.map((line) => {
        const dispatchedQuantity = line.dispatchedQuantity ?? line.quantity;
        const returnedQuantity = nextStatus === "RETURNED" ? dispatchedQuantity : quantities.get(line.itemId) ?? line.returnedQuantity ?? 0;
        return { ...line, dispatchedQuantity, returnedQuantity };
      });
      if (patch.items.every((line) => (line.returnedQuantity ?? 0) >= (line.dispatchedQuantity ?? 0))) {
        patch.status = "RETURNED";
      }
    }
    if (nextStatus === "CANCELLED") {
      const linkedInvoice = partnerInvoices.find((invoice) => invoice.firmId === firmId && invoice.orderId === orderId && invoice.status !== "CANCELLED");
      if (linkedInvoice && linkedInvoice.status !== "DRAFT") {
        throw new Error("Invoice is finalized; use return or credit note flow instead of cancelling this order");
      }
      if (linkedInvoice) {
        linkedInvoice.status = "CANCELLED";
      }
      patch.items = current.items.map((line) => ({
        ...line,
        returnedQuantity: line.dispatchedQuantity ?? 0,
        cancelledQuantity: line.quantity,
      }));
    }
    partnerOrders = partnerOrders.map((item) => (item.id === orderId ? { ...item, ...patch } : item));
    const updatedOrder = hydratePartnerOrder(partnerOrders.find((item) => item.id === orderId)!);
    if (nextStatus === "DISPATCHED") {
      let linkedInvoice = partnerInvoices.find((invoice) => invoice.firmId === firmId && invoice.orderId === orderId && invoice.status !== "CANCELLED");
      if (!linkedInvoice) {
        await mockDb.createPartnerInvoice(firmId, {
          orderId,
          clientBusinessId: updatedOrder.clientBusinessId,
          clientOutletId: updatedOrder.clientOutletId,
          invoiceDate: updatedOrder.dispatchDate || todayISO(),
          dueDate: updatedOrder.dispatchDate || todayISO(),
          notes: "Draft invoice generated at dispatch",
        });
        linkedInvoice = partnerInvoices.find((invoice) => invoice.firmId === firmId && invoice.orderId === orderId && invoice.status !== "CANCELLED");
      }
      if (linkedInvoice) {
        if (linkedInvoice.status !== "DRAFT") {
          throw new Error("Finalized invoices cannot be modified");
        }
        const nextInvoiceItems = (updatedOrder.billableLines ?? [])
          .map((line) => {
            const quantity = updatedOrder.items
              .filter((item) => item.billableLineId === line.id)
              .reduce((sum, item) => sum + (item.dispatchedQuantity ?? 0), 0);
            return {
              id: makeId("invline"),
              invoiceId: linkedInvoice.id,
              billableLineId: line.id,
              itemId: line.catalogItemId,
              itemCode: line.itemCode,
              itemName: line.itemName,
              quantity,
              mrp: line.mrp,
              discountPercentage: line.sellerMarginPercentage,
              rate: line.rate,
              lineTotal: Math.round(line.rate * quantity * 100) / 100,
            };
          })
          .filter((line) => line.quantity > 0);
        if (!nextInvoiceItems.length) {
          throw new Error("Billable lines are required");
        }
        partnerInvoices = partnerInvoices.map((invoice) =>
          invoice.id === linkedInvoice?.id
            ? hydratePartnerInvoice({
                ...invoice,
                status: "DRAFT",
                invoiceDate: updatedOrder.dispatchDate || invoice.invoiceDate,
                dueDate: updatedOrder.dispatchDate || invoice.dueDate,
                items: nextInvoiceItems,
                amount: nextInvoiceItems.reduce((sum, item) => sum + item.lineTotal, 0),
              })
            : invoice,
        );
      }
    }
    pushPartnerAuditLog({
      firmId,
      userId: currentUser.id,
      userName: currentUser.name,
      entityType: "ORDER",
      entityId: orderId,
      action: "STATUS_CHANGE",
      referenceLabel: current.orderNumber,
      beforeState: JSON.stringify({ status: current.status }),
      afterState: JSON.stringify({ status: nextStatus }),
    });
    return hydratePartnerOrder(partnerOrders.find((item) => item.id === orderId)!);
  },

  async updatePartnerOrder(
    firmId: number,
    orderId: string,
    input: {
      clientBusinessId: string;
      clientOutletId: string;
      source?: PartnerOrder["source"];
      sellerMarginPercentage?: number;
      notes?: string;
      items: Array<{ itemId: string; quantity: number }>;
    },
  ) {
    await wait();
    const current = partnerOrders.find((item) => item.firmId === firmId && item.id === orderId);
    if (!current) {
      throw new Error("Order not found");
    }
    const hydrated = hydratePartnerOrder(current);
    if (!canEditOrder(hydrated)) {
      throw new Error(hydrated.linkedInvoiceId ? "Order editing is locked after invoice creation" : "Only new orders can be edited");
    }
    const business = getPartnerBusinessById(firmId, input.clientBusinessId);
    const outlet = getPartnerOutletById(firmId, input.clientOutletId);
    if (!business || !outlet) {
      throw new Error("Client or outlet not found");
    }
    if (!input.items.length) {
      throw new Error("Add at least one order line");
    }
    const seen = new Set<string>();
    const nextItems = input.items.map((line) => {
      if (!line.itemId) throw new Error("Item is required");
      if (!Number.isFinite(line.quantity) || line.quantity <= 0) throw new Error("Quantity must be positive");
      if (seen.has(line.itemId)) throw new Error("Duplicate items are not allowed");
      seen.add(line.itemId);
      const item = partnerCatalogItems.find((candidate) => candidate.id === line.itemId);
      if (!item) throw new Error("Order item not found");
      if (item.status !== "ACTIVE") throw new Error("Order item is inactive");
      const sellerMarginPercentage = input.sellerMarginPercentage ?? item.defaultDiscountPercentage;
      if (!Number.isFinite(sellerMarginPercentage) || sellerMarginPercentage < 0 || sellerMarginPercentage > 100) {
        throw new Error("Seller margin must be between 0 and 100");
      }
      return {
        id: makeId("poitem"),
        orderId,
        itemId: item.id,
        itemCode: item.sku,
        itemName: item.name,
        unit: "",
        quantity: line.quantity,
        mrp: item.defaultMrp,
        discountPercentage: sellerMarginPercentage,
      };
    });
    const patch: Partial<PartnerOrder> = {
      clientBusinessId: business.id,
      clientBusinessName: business.businessName,
      clientOutletId: outlet.id,
      clientOutletName: outlet.outletName,
      source: input.source || "MANUAL",
      notes: input.notes?.trim() || "",
      items: nextItems,
      requestedItems: nextItems,
      billableLines: [],
      unfulfilledItems: [],
      itemCount: nextItems.length,
      totalQuantity: nextItems.reduce((sum, line) => sum + line.quantity, 0),
    };
    partnerOrders = partnerOrders.map((item) => (item.id === orderId ? hydratePartnerOrder({ ...item, ...patch }) : item));
    pushPartnerAuditLog({
      firmId,
      userId: currentUser.id,
      userName: currentUser.name,
      entityType: "ORDER",
      entityId: orderId,
      action: "UPDATE",
      referenceLabel: current.orderNumber,
      beforeState: JSON.stringify({ itemCount: hydrated.itemCount, totalQuantity: hydrated.totalQuantity, notes: hydrated.notes || "" }),
      afterState: JSON.stringify({ itemCount: nextItems.length, totalQuantity: patch.totalQuantity, notes: patch.notes }),
    });
    return hydratePartnerOrder(partnerOrders.find((item) => item.id === orderId)!);
  },

  async getPartnerOrderReturns(firmId: number, orderId: string) {
    await wait();
    return partnerSalesReturns
      .filter((item) => item.firmId === firmId && item.orderId === orderId)
      .sort((a, b) => b.returnDate.localeCompare(a.returnDate) || (b.createdAt || "").localeCompare(a.createdAt || ""));
  },

  async createPartnerOrderReturn(
    firmId: number,
    orderId: string,
    input: {
      returnDate: string;
      note: string;
      lines: Array<{ orderItemId: string; quantity: number }>;
    },
  ) {
    await wait();
    const order = partnerOrders.find((item) => item.firmId === firmId && item.id === orderId);
    if (!order) throw new Error("Order not found");
    if (!["DISPATCHED", "DELIVERED", "PARTIALLY_DELIVERED", "PARTIALLY_RETURNED"].includes(order.status)) {
      throw new Error("Returns can only be created after dispatch");
    }
    const invoice = partnerInvoices.find((item) => item.firmId === firmId && item.orderId === orderId && item.status !== "CANCELLED" && item.status !== "DRAFT");
    if (!invoice) throw new Error("Issued invoice is required before creating a return");
    const returnNote = input.note?.trim() || "";
    if (!returnNote) throw new Error("Return note is required");
    if (!input.lines.length) throw new Error("Add at least one return line");

    const selectedLines: Array<{
      orderLine: PartnerOrderItem;
      invoiceLine?: PartnerInvoiceItem;
      quantity: number;
      creditAmount: number;
    }> = [];
    const seen = new Set<string>();
    for (const line of input.lines) {
      if (!line.orderItemId) throw new Error("Order line is required");
      if (seen.has(line.orderItemId)) throw new Error("Duplicate return lines are not allowed");
      seen.add(line.orderItemId);
      if (!Number.isFinite(line.quantity) || line.quantity <= 0) throw new Error("Return quantity must be positive");
      const orderLine = order.items.find((item) => item.id === line.orderItemId);
      if (!orderLine) throw new Error("Return line does not belong to this order");
      const returnable = (orderLine.dispatchedQuantity ?? 0) - (orderLine.returnedQuantity ?? 0);
      if (line.quantity > returnable) throw new Error(`Only ${returnable} can be returned for ${orderLine.itemName}`);
      const invoiceLine = invoice.items.find((item) => item.billableLineId && item.billableLineId === orderLine.billableLineId);
      const rate = invoiceLine?.rate ?? partnerLineRate(orderLine.mrp, orderLine.discountPercentage);
      selectedLines.push({
        orderLine,
        invoiceLine,
        quantity: line.quantity,
        creditAmount: Math.round(rate * line.quantity * 100) / 100,
      });
    }

    const now = new Date().toISOString();
    const returnDate = input.returnDate || todayISO();
    const salesReturnId = makeId("psr");
    const creditNoteId = makeId("pcn");
    const returnNumber = `SR-${1000 + partnerSalesReturns.filter((item) => item.firmId === firmId).length + 1}`;
    const creditNoteNumber = `CN-${1000 + partnerCreditNotes.filter((item) => item.firmId === firmId).length + 1}`;
    const totalCreditAmount = selectedLines.reduce((sum, line) => sum + line.creditAmount, 0);
    const returnLines: PartnerSalesReturnLine[] = selectedLines.map((line) => ({
      id: makeId("psrl"),
      salesReturnId,
      orderItemId: line.orderLine.id,
      invoiceLineId: line.invoiceLine?.id || "",
      itemId: line.orderLine.itemId,
      itemName: line.orderLine.itemName,
      returnedQuantity: line.quantity,
      acceptedQuantity: line.quantity,
      creditAmount: line.creditAmount,
      reason: returnNote,
    }));
    const creditLines: PartnerCreditNoteLine[] = selectedLines.map((line) => ({
      id: makeId("pcnl"),
      creditNoteId,
      itemId: line.orderLine.itemId,
      itemName: line.orderLine.itemName,
      quantity: line.quantity,
      amount: line.creditAmount,
      referenceInvoiceLineId: line.invoiceLine?.id || "",
    }));
    const salesReturn: PartnerSalesReturn = {
      id: salesReturnId,
      firmId,
      returnNumber,
      orderId,
      orderNumber: order.orderNumber,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      creditNoteId,
      creditNoteNumber,
      clientBusinessId: order.clientBusinessId,
      clientBusinessName: order.clientBusinessName,
      clientOutletId: order.clientOutletId,
      clientOutletName: order.clientOutletName,
      returnDate,
      status: "ISSUED",
      notes: returnNote,
      totalQuantity: returnLines.reduce((sum, line) => sum + line.acceptedQuantity, 0),
      totalCreditAmount,
      createdAt: now,
      createdByName: currentUser.name,
      lines: returnLines,
    };
    const creditNote: PartnerCreditNote = {
      id: creditNoteId,
      firmId,
      creditNoteNumber,
      salesReturnId,
      clientBusinessId: order.clientBusinessId,
      clientBusinessName: order.clientBusinessName,
      clientOutletId: order.clientOutletId,
      clientOutletName: order.clientOutletName,
      relatedInvoiceId: invoice.id,
      relatedInvoiceNumber: invoice.invoiceNumber,
      creditDate: returnDate,
      note: returnNote,
      status: "ISSUED",
      hasStockReturn: true,
      totalAmount: totalCreditAmount,
      createdAt: now,
      createdByName: currentUser.name,
      lines: creditLines,
    };

    partnerSalesReturns = [salesReturn, ...partnerSalesReturns];
    partnerCreditNotes = [creditNote, ...partnerCreditNotes];
    partnerOrders = partnerOrders.map((item) => {
      if (item.id !== orderId) return item;
      const nextItems = item.items.map((orderLine) => {
        const returnedLine = selectedLines.find((line) => line.orderLine.id === orderLine.id);
        if (!returnedLine) return orderLine;
        return {
          ...orderLine,
          returnedQuantity: (orderLine.returnedQuantity ?? 0) + returnedLine.quantity,
        };
      });
      const openReturnable = nextItems.reduce((sum, line) => sum + Math.max((line.dispatchedQuantity ?? 0) - (line.returnedQuantity ?? 0), 0), 0);
      return hydratePartnerOrder({
        ...item,
        status: openReturnable === 0 ? "RETURNED" : item.status === "PARTIALLY_RETURNED" ? "DISPATCHED" : item.status,
        items: nextItems,
      });
    });
    for (const line of selectedLines) {
      const inventoryItem = partnerFirmInventoryItems.find((item) => item.firmId === firmId && item.itemId === line.orderLine.itemId);
      if (inventoryItem) {
        inventoryItem.quantity += line.quantity;
        inventoryItem.updatedAt = now;
      }
      pushPartnerStockEntry({
        id: makeId("pstock"),
        firmId,
        itemId: line.orderLine.itemId,
        quantityDelta: line.quantity,
        reasonType: "RETURN_IN",
        referenceType: "RETURN",
        referenceId: salesReturn.id,
        note: returnNote,
        createdAt: stockActionTimestamp(returnDate),
      });
    }
    pushPartnerAuditLog({
      firmId,
      userId: currentUser.id,
      userName: currentUser.name,
      entityType: "SALES_RETURN",
      entityId: salesReturn.id,
      action: "CREATE",
      afterState: JSON.stringify({ returnNumber, creditNoteNumber, totalCreditAmount }),
    });
    pushPartnerAuditLog({
      firmId,
      userId: currentUser.id,
      userName: currentUser.name,
      entityType: "ORDER",
      entityId: orderId,
      action: "RETURN",
      afterState: JSON.stringify({ status: partnerOrders.find((item) => item.id === orderId)?.status, returnNumber }),
    });

    return {
      salesReturn,
      creditNote,
      order: hydratePartnerOrder(partnerOrders.find((item) => item.id === orderId)!),
    };
  },

  async voidPartnerOrderReturn(firmId: number, orderId: string, returnId: string) {
    await wait();
    const salesReturn = partnerSalesReturns.find((item) => item.firmId === firmId && item.orderId === orderId && item.id === returnId);
    if (!salesReturn) throw new Error("Return not found");
    if (salesReturn.status === "CANCELLED") throw new Error("Return is already voided");
    const creditNote = partnerCreditNotes.find((item) => item.firmId === firmId && item.id === salesReturn.creditNoteId);
    if (!creditNote) throw new Error("Credit note not found");
    if (creditNote.status === "CANCELLED") throw new Error("Credit note is already voided");
    const order = partnerOrders.find((item) => item.firmId === firmId && item.id === orderId);
    if (!order) throw new Error("Order not found");
    if (!salesReturn.lines.length) throw new Error("Return lines are required");

    for (const line of salesReturn.lines) {
      const orderLine = order.items.find((item) => item.id === line.orderItemId);
      if (!orderLine) throw new Error("Return line does not belong to this order");
      if ((orderLine.returnedQuantity ?? 0) < line.acceptedQuantity) {
        throw new Error(`Returned quantity cannot be reversed for ${line.itemName}`);
      }
      const inventoryItem = partnerFirmInventoryItems.find((item) => item.firmId === firmId && item.itemId === line.itemId);
      if (!inventoryItem) throw new Error("Inventory item not found");
      if (inventoryItem.quantity < line.acceptedQuantity) {
        throw new Error(`Only ${inventoryItem.quantity} available`);
      }
    }

    const now = new Date().toISOString();
    for (const line of salesReturn.lines) {
      const inventoryItem = partnerFirmInventoryItems.find((item) => item.firmId === firmId && item.itemId === line.itemId);
      if (inventoryItem) {
        inventoryItem.quantity -= line.acceptedQuantity;
        inventoryItem.updatedAt = now;
      }
      pushPartnerStockEntry({
        id: makeId("pstock"),
        firmId,
        itemId: line.itemId,
        quantityDelta: -line.acceptedQuantity,
        reasonType: "RETURN_OUT",
        referenceType: "RETURN",
        referenceId: salesReturn.id,
        note: `Void return: ${salesReturn.returnNumber}`,
        createdAt: now,
      });
    }

    const nextItems = order.items.map((line) => {
      const returnedLine = salesReturn.lines.find((item) => item.orderItemId === line.id);
      if (!returnedLine) return line;
      return {
        ...line,
        returnedQuantity: Math.max((line.returnedQuantity ?? 0) - returnedLine.acceptedQuantity, 0),
      };
    });
    const nextOrder = hydratePartnerOrder({ ...order, items: nextItems, status: resolvePartnerOrderJourneyStatusAfterReturn({ ...order, items: nextItems }) });
    partnerOrders = partnerOrders.map((item) => (item.id === orderId ? nextOrder : item));

    const voidedSalesReturn: PartnerSalesReturn = { ...salesReturn, status: "CANCELLED", cancelledAt: now };
    partnerSalesReturns = partnerSalesReturns.map((item) => (item.id === returnId ? voidedSalesReturn : item));
    const voidedCreditNote: PartnerCreditNote = { ...creditNote, status: "CANCELLED", cancelledAt: now };
    partnerCreditNotes = partnerCreditNotes.map((item) => (item.id === creditNote.id ? voidedCreditNote : item));

    pushPartnerAuditLog({
      firmId,
      userId: currentUser.id,
      userName: currentUser.name,
      entityType: "SALES_RETURN",
      entityId: salesReturn.id,
      action: "VOID",
      beforeState: JSON.stringify({ status: "ISSUED" }),
      afterState: JSON.stringify({ status: "CANCELLED" }),
    });
    pushPartnerAuditLog({
      firmId,
      userId: currentUser.id,
      userName: currentUser.name,
      entityType: "CREDIT_NOTE",
      entityId: creditNote.id,
      action: "VOID",
      beforeState: JSON.stringify({ status: creditNote.status }),
      afterState: JSON.stringify({ status: "CANCELLED" }),
    });
    pushPartnerAuditLog({
      firmId,
      userId: currentUser.id,
      userName: currentUser.name,
      entityType: "ORDER",
      entityId: orderId,
      action: "RETURN_REVERSED",
      afterState: JSON.stringify({ status: nextOrder.status, returnNumber: salesReturn.returnNumber }),
    });

    return {
      salesReturn: voidedSalesReturn,
      creditNote: voidedCreditNote,
      order: nextOrder,
    };
  },

  async getPartnerInvoices(firmId: number) {
    await wait();
    return partnerInvoices
      .filter((invoice) => invoice.firmId === firmId)
      .map(hydratePartnerInvoice)
      .sort((a, b) => b.invoiceDate.localeCompare(a.invoiceDate));
  },

  async getPartnerInvoiceById(firmId: number, invoiceId: string) {
    await wait();
    const invoice = partnerInvoices.find((item) => item.firmId === firmId && item.id === invoiceId);
    if (!invoice) {
      throw new Error("Invoice not found");
    }
    return hydratePartnerInvoice(invoice);
  },

  async createPartnerInvoice(
    firmId: number,
    input: {
      orderId?: string;
      clientBusinessId: string;
      clientOutletId: string;
      invoiceDate: string;
      dueDate?: string;
      notes?: string;
      items?: Array<{ itemId: string; quantity: number }>;
    },
  ) {
    await wait();
    if (!input.orderId) {
      throw new Error("Order is required for invoice creation");
    }
    const rawOrder = partnerOrders.find((item) => item.id === input.orderId && item.firmId === firmId);
    if (!rawOrder) {
      throw new Error("Order not found");
    }
    const order = hydratePartnerOrder(rawOrder);
    if (!["DISPATCHED", "DELIVERED", "PARTIALLY_DELIVERED", "RETURNED", "PARTIALLY_RETURNED"].includes(order.status)) {
      throw new Error("Invoice can only be generated at dispatch or after dispatch");
    }
    if (partnerInvoices.some((invoice) => invoice.firmId === firmId && invoice.orderId === order.id && invoice.status !== "CANCELLED")) {
      throw new Error("Invoice already exists for this order");
    }
    const business = getPartnerBusinessById(firmId, order.clientBusinessId);
    const outlet = getPartnerOutletById(firmId, order.clientOutletId);
    if (!business || !outlet) {
      throw new Error("Client or outlet not found");
    }
    const sourceLines = (order.billableLines ?? [])
      .map((line) => {
        const matchingAllocations = order.items.filter((item) => item.billableLineId === line.id);
        const quantity = matchingAllocations.length
          ? matchingAllocations.reduce((sum, item) => {
              if (["DISPATCHED", "DELIVERED", "PARTIALLY_DELIVERED", "RETURNED", "PARTIALLY_RETURNED"].includes(order.status)) {
                return sum + (item.dispatchedQuantity ?? 0);
              }
              if (order.status === "PACKED") {
                return sum + (item.packedQuantity ?? 0);
              }
              return sum + item.quantity;
            }, 0)
          : line.quantity;
        return {
          billableLineId: line.id,
          itemId: line.catalogItemId,
          quantity,
          mrp: line.mrp,
          discountPercentage: line.sellerMarginPercentage,
          rate: line.rate,
          itemCode: line.itemCode,
          itemName: line.itemName,
          lineTotal: Math.round(line.rate * quantity * 100) / 100,
        };
      })
      .filter((line) => line.quantity > 0);
    if (!sourceLines.length) {
      throw new Error("Billable lines are required");
    }
    const invoiceId = makeId("pinvoice");
    const items: PartnerInvoiceItem[] = sourceLines.map((line) => ({
      id: makeId("invline"),
      invoiceId,
      billableLineId: line.billableLineId,
      itemId: line.itemId,
      itemCode: line.itemCode,
      itemName: line.itemName,
      quantity: line.quantity,
      mrp: line.mrp,
      discountPercentage: line.discountPercentage,
      rate: line.rate,
      lineTotal: line.lineTotal,
    }));
    const invoice = hydratePartnerInvoice({
      id: invoiceId,
      firmId,
      orderId: order.id,
      invoiceNumber: `INV-${1000 + partnerInvoices.filter((item) => item.firmId === firmId).length + 1}`,
      clientBusinessId: business.id,
      clientBusinessName: business.businessName,
      clientOutletId: outlet.id,
      clientOutletName: outlet.outletName,
      invoiceDate: input.invoiceDate,
      dueDate: input.dueDate || input.invoiceDate,
      status: "DRAFT",
      createdAt: new Date().toISOString(),
      createdByName: currentUser.name,
      notes: input.notes?.trim() || "",
      amount: items.reduce((sum, item) => sum + item.lineTotal, 0),
      paidAmount: 0,
      dueAmount: 0,
      billToName: business.billingName || business.businessName,
      billToGstin: business.gstin || "",
      billToAddress: business.billingAddress || "",
      deliverToName: outlet.outletName,
      deliverToLocality: "",
      deliverToAddress: outlet.address || "",
      deliverToManagerName: outlet.contacts[0]?.name || "",
      deliverToManagerPhone: outlet.contacts[0]?.phone || "",
      items,
    });
    partnerInvoices = [invoice, ...partnerInvoices];
    pushPartnerAuditLog({
      firmId,
      userId: currentUser.id,
      userName: currentUser.name,
      entityType: "INVOICE",
      entityId: invoiceId,
      action: "CREATE",
      referenceLabel: invoice.invoiceNumber,
      afterState: JSON.stringify({ amount: invoice.amount, status: invoice.status }),
    });
    return invoice;
  },

  async cancelPartnerInvoice(firmId: number, invoiceId: string) {
    await wait();
    const current = partnerInvoices.find((item) => item.firmId === firmId && item.id === invoiceId);
    if (!current) {
      throw new Error("Invoice not found");
    }
    const hydrated = hydratePartnerInvoice(current);
    if (hydrated.paidAmount > 0) {
      throw new Error("Paid or partially paid invoices cannot be cancelled");
    }
    if (hydrated.status !== "DRAFT") {
      throw new Error("Finalized invoices cannot be cancelled directly; use credit note or return flow");
    }
    partnerInvoices = partnerInvoices.map((item) =>
      item.id === invoiceId ? { ...item, status: "CANCELLED" } : item,
    );
    pushPartnerAuditLog({
      firmId,
      userId: currentUser.id,
      userName: currentUser.name,
      entityType: "INVOICE",
      entityId: invoiceId,
      action: "CANCEL",
      referenceLabel: hydrated.invoiceNumber,
      beforeState: JSON.stringify({ status: hydrated.status }),
      afterState: JSON.stringify({ status: "CANCELLED" }),
    });
    return hydratePartnerInvoice(partnerInvoices.find((item) => item.id === invoiceId)!);
  },

  async finalizePartnerInvoice(firmId: number, invoiceId: string) {
    await wait();
    const current = partnerInvoices.find((item) => item.firmId === firmId && item.id === invoiceId);
    if (!current) {
      throw new Error("Invoice not found");
    }
    const hydrated = hydratePartnerInvoice(current);
    if (hydrated.status !== "DRAFT" && hydrated.status !== "FINALIZED") {
      throw new Error("Only draft invoices can be finalized");
    }
    partnerInvoices = partnerInvoices.map((item) =>
      item.id === invoiceId ? { ...item, status: "FINALIZED" } : item,
    );
    partnerLedgerEntries = [
      {
        id: makeId("pled"),
        firmId,
        clientBusinessId: hydrated.clientBusinessId,
        clientBusinessName: hydrated.clientBusinessName,
        entryDate: hydrated.invoiceDate,
        type: "INVOICE",
        referenceType: "INVOICE",
        referenceId: hydrated.id,
        referenceNumber: hydrated.invoiceNumber,
        description: "Invoice finalized",
        debitAmount: hydrated.amount,
        creditAmount: 0,
        runningBalance: hydrated.amount,
        createdAt: new Date().toISOString(),
      },
      ...partnerLedgerEntries,
    ];
    pushPartnerAuditLog({
      firmId,
      userId: currentUser.id,
      userName: currentUser.name,
      entityType: "INVOICE",
      entityId: invoiceId,
      action: "FINALIZE",
      referenceLabel: hydrated.invoiceNumber,
      beforeState: JSON.stringify({ status: hydrated.status }),
      afterState: JSON.stringify({ status: "FINALIZED" }),
    });
    return hydratePartnerInvoice(partnerInvoices.find((item) => item.id === invoiceId)!);
  },

  async getPartnerPayments(
    firmId: number,
    filters: { search?: string; clientBusinessId?: string; invoiceId?: string; fromDate?: string; toDate?: string } = {},
  ) {
    await wait();
    const search = filters.search?.trim().toLowerCase() || "";
    return partnerPayments
      .filter((payment) => payment.firmId === firmId)
      .filter((payment) => !filters.clientBusinessId || payment.clientBusinessId === filters.clientBusinessId)
      .filter((payment) => !filters.invoiceId || payment.allocations.some((allocation) => allocation.invoiceId === filters.invoiceId))
      .filter((payment) => matchesDateRange(payment.paymentDate, filters.fromDate, filters.toDate))
      .filter((payment) => !search || payment.clientBusinessName.toLowerCase().includes(search) || payment.paymentReference.toLowerCase().includes(search) || (payment.referenceNumber || "").toLowerCase().includes(search))
      .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate));
  },

  async createPartnerPayment(
    firmId: number,
    input: {
      invoiceId: string;
      paymentDate: string;
      amount: number;
      paymentMode: PartnerPaymentMode;
      referenceNumber?: string;
      collectedByUserId?: number;
      notes?: string;
    },
  ) {
    await wait();
    const rawInvoice = partnerInvoices.find((item) => item.firmId === firmId && item.id === input.invoiceId);
    if (!rawInvoice) throw new Error("Invoice not found");
    const invoice = hydratePartnerInvoice(rawInvoice);
    if (invoice.status !== "FINALIZED") throw new Error("Payments can only be recorded against finalized invoices");
    if (!input.amount || input.amount <= 0) throw new Error("Amount must be greater than zero");
    if (input.amount > invoice.dueAmount) throw new Error("Amount cannot exceed outstanding balance");
    const paymentId = makeId("ppay");
    const payment: PartnerPayment = {
      id: paymentId,
      firmId,
      paymentReference: input.referenceNumber?.trim() || paymentId,
      clientBusinessId: invoice.clientBusinessId,
      clientBusinessName: invoice.clientBusinessName,
      clientOutletId: invoice.clientOutletId,
      clientOutletName: invoice.clientOutletName,
      paymentDate: input.paymentDate,
      mode: input.paymentMode,
      referenceNumber: input.referenceNumber?.trim() || "",
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      recordedByName: currentUser.name,
      collectedByUserId: input.collectedByUserId || currentUser.id,
      collectedByName: currentUser.name,
      amount: input.amount,
      allocatedAmount: input.amount,
      unallocatedAmount: 0,
      notes: input.notes?.trim() || "",
      allocations: [{
        id: makeId("ppal"),
        paymentId,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate,
        invoiceAmount: invoice.amount,
        invoiceDueAmount: Math.max(invoice.dueAmount - input.amount, 0),
        amount: input.amount,
      }],
    };
    partnerPayments = [payment, ...partnerPayments];
    const previousBalance = partnerLedgerEntries.find((entry) => entry.clientBusinessId === invoice.clientBusinessId)?.runningBalance ?? 0;
    partnerLedgerEntries = [{
      id: makeId("pled"),
      firmId,
      clientBusinessId: invoice.clientBusinessId,
      clientBusinessName: invoice.clientBusinessName,
      entryDate: input.paymentDate,
      type: "PAYMENT",
      referenceType: "PAYMENT",
      referenceId: paymentId,
      referenceNumber: payment.paymentReference,
      description: `Payment recorded for ${invoice.invoiceNumber}`,
      debitAmount: 0,
      creditAmount: input.amount,
      runningBalance: Math.max(previousBalance - input.amount, 0),
      createdAt: new Date().toISOString(),
    }, ...partnerLedgerEntries];
    pushPartnerAuditLog({
      firmId,
      userId: currentUser.id,
      userName: currentUser.name,
      entityType: "INVOICE",
      entityId: invoice.id,
      action: "PAYMENT_RECORDED",
      referenceLabel: invoice.invoiceNumber,
      afterState: JSON.stringify({ paymentId, amount: input.amount }),
    });
    return payment;
  },

  async getPartnerClientLedger(
    firmId: number,
    filters: { clientBusinessId?: string; fromDate?: string; toDate?: string } = {},
  ) {
    await wait();
    return partnerLedgerEntries
      .filter((entry) => entry.firmId === firmId)
      .filter((entry) => !filters.clientBusinessId || entry.clientBusinessId === filters.clientBusinessId)
      .filter((entry) => matchesDateRange(entry.entryDate, filters.fromDate, filters.toDate))
      .sort((a, b) => a.entryDate.localeCompare(b.entryDate) || (a.createdAt || "").localeCompare(b.createdAt || ""));
  },

  async getPartnerPayables(
    firmId: number,
    filters: { search?: string; supplierId?: string; status?: string; fromDate?: string; toDate?: string; overdueOnly?: boolean } = {},
  ): Promise<PartnerPayablesSummary> {
    await wait();
    const search = filters.search?.trim().toLowerCase() || "";
    const invoices = partnerSupplierInvoices
      .filter((invoice) => invoice.firmId === firmId)
      .map(hydrateSupplierInvoice)
      .filter((invoice) => !filters.supplierId || invoice.supplierId === filters.supplierId)
      .filter((invoice) => matchesDateRange(invoice.invoiceDate, filters.fromDate, filters.toDate))
      .filter((invoice) => !search || invoice.supplierName.toLowerCase().includes(search) || invoice.invoiceNumber.toLowerCase().includes(search))
      .filter((invoice) => !filters.status || filters.status === "ALL" || invoice.status === filters.status || invoice.payableStatus === filters.status)
      .filter((invoice) => !filters.overdueOnly || invoice.payableStatus === "OVERDUE");
    return {
      totalPayables: invoices.filter((invoice) => invoice.status === "FINALIZED").reduce((sum, invoice) => sum + invoice.outstandingAmount, 0),
      overduePayables: invoices.filter((invoice) => invoice.payableStatus === "OVERDUE").reduce((sum, invoice) => sum + invoice.outstandingAmount, 0),
      invoicesDueToday: invoices.filter((invoice) => invoice.dueDate === todayISO() && invoice.outstandingAmount > 0).length,
      invoices,
    };
  },

  async getPartnerSupplierInvoices(
    firmId: number,
    filters: { search?: string; supplierId?: string; status?: string; fromDate?: string; toDate?: string; overdueOnly?: boolean } = {},
  ) {
    const summary = await this.getPartnerPayables(firmId, filters);
    return summary.invoices;
  },

  async createPartnerSupplierInvoice(
    firmId: number,
    input: {
      supplierId: string;
      purchaseId?: string;
      grnId?: string;
      invoiceNumber: string;
      invoiceDate: string;
      dueDate?: string;
      taxableAmount: number;
      gstAmount: number;
      finalTotalAmount: number;
      finalize?: boolean;
    },
  ) {
    await wait();
    const supplier = getPartnerSupplierById(firmId, input.supplierId);
    if (!supplier) throw new Error("Supplier not found");
    if (!input.invoiceNumber.trim() || !input.invoiceDate) throw new Error("Invoice number and date are required");
    if (input.finalTotalAmount <= 0) throw new Error("Final total must be greater than zero");
    const invoice: PartnerSupplierInvoice = hydrateSupplierInvoice({
      id: makeId("psinv"),
      firmId,
      supplierId: supplier.id,
      supplierName: supplier.supplierName,
      purchaseId: input.purchaseId || "",
      purchaseNumber: partnerPurchases.find((purchase) => purchase.id === input.purchaseId)?.purchaseNumber || "",
      grnId: input.grnId || "",
      grnNumber: partnerGoodsReceipts.find((receipt) => receipt.id === input.grnId)?.grnNumber || "",
      invoiceNumber: input.invoiceNumber.trim(),
      invoiceDate: input.invoiceDate,
      dueDate: input.dueDate || "",
      taxableAmount: input.taxableAmount,
      gstAmount: input.gstAmount,
      finalTotalAmount: input.finalTotalAmount,
      paidAmount: 0,
      outstandingAmount: input.finalTotalAmount,
      status: input.finalize ? "FINALIZED" : "DRAFT",
      payableStatus: input.finalize ? payableStatus(input.finalTotalAmount, 0, input.dueDate) : "UNPAID",
      createdAt: new Date().toISOString(),
      createdByName: currentUser.name,
      finalizedAt: input.finalize ? new Date().toISOString() : "",
      finalizedByName: input.finalize ? currentUser.name : "",
    });
    partnerSupplierInvoices = [invoice, ...partnerSupplierInvoices];
    if (invoice.status === "FINALIZED") {
      pushSupplierLedgerEntry({
        firmId,
        supplierId: supplier.id,
        supplierName: supplier.supplierName,
        entryDate: invoice.invoiceDate,
        type: "SUPPLIER_INVOICE",
        referenceType: "SUPPLIER_INVOICE",
        referenceId: invoice.id,
        referenceNumber: invoice.invoiceNumber,
        description: "Supplier invoice finalized",
        debitAmount: 0,
        creditAmount: invoice.finalTotalAmount,
      });
    }
    return invoice;
  },

  async finalizePartnerSupplierInvoice(firmId: number, supplierInvoiceId: string) {
    await wait();
    const invoice = partnerSupplierInvoices.find((item) => item.firmId === firmId && item.id === supplierInvoiceId);
    if (!invoice) throw new Error("Supplier invoice not found");
    if (invoice.status === "CANCELLED") throw new Error("Cancelled supplier invoices cannot be finalized");
    if (invoice.status === "FINALIZED") return hydrateSupplierInvoice(invoice);
    const next = hydrateSupplierInvoice({ ...invoice, status: "FINALIZED", finalizedAt: new Date().toISOString(), finalizedByName: currentUser.name });
    partnerSupplierInvoices = partnerSupplierInvoices.map((item) => (item.id === supplierInvoiceId ? next : item));
    pushSupplierLedgerEntry({
      firmId,
      supplierId: next.supplierId,
      supplierName: next.supplierName,
      entryDate: next.invoiceDate,
      type: "SUPPLIER_INVOICE",
      referenceType: "SUPPLIER_INVOICE",
      referenceId: next.id,
      referenceNumber: next.invoiceNumber,
      description: "Supplier invoice finalized",
      debitAmount: 0,
      creditAmount: next.finalTotalAmount,
    });
    return next;
  },

  async getPartnerSupplierPayments(
    firmId: number,
    filters: { search?: string; supplierId?: string; supplierInvoiceId?: string; fromDate?: string; toDate?: string } = {},
  ) {
    await wait();
    const search = filters.search?.trim().toLowerCase() || "";
    return partnerSupplierPayments
      .filter((payment) => payment.firmId === firmId)
      .filter((payment) => !filters.supplierId || payment.supplierId === filters.supplierId)
      .filter((payment) => matchesDateRange(payment.paymentDate, filters.fromDate, filters.toDate))
      .filter((payment) => !search || payment.supplierName.toLowerCase().includes(search) || (payment.referenceNumber || "").toLowerCase().includes(search))
      .filter((payment) => !filters.supplierInvoiceId || payment.allocations.some((allocation) => allocation.supplierInvoiceId === filters.supplierInvoiceId));
  },

  async createPartnerSupplierPayment(
    firmId: number,
    input: { supplierInvoiceId: string; paymentDate: string; amount: number; paymentMode: PartnerPaymentMode; referenceNumber?: string; notes?: string },
  ) {
    await wait();
    const rawInvoice = partnerSupplierInvoices.find((item) => item.firmId === firmId && item.id === input.supplierInvoiceId);
    if (!rawInvoice) throw new Error("Supplier invoice not found");
    const invoice = hydrateSupplierInvoice(rawInvoice);
    if (invoice.status !== "FINALIZED") throw new Error("Payments can only be recorded against finalized supplier invoices");
    if (input.amount <= 0) throw new Error("Amount must be greater than zero");
    if (input.amount > invoice.outstandingAmount) throw new Error("Amount cannot exceed outstanding balance");
    const paymentId = makeId("pspay");
    const payment: PartnerSupplierPayment = {
      id: paymentId,
      firmId,
      supplierId: invoice.supplierId,
      supplierName: invoice.supplierName,
      paymentDate: input.paymentDate,
      mode: input.paymentMode,
      referenceNumber: input.referenceNumber || "",
      createdAt: new Date().toISOString(),
      recordedByName: currentUser.name,
      amount: input.amount,
      allocatedAmount: input.amount,
      unallocatedAmount: 0,
      notes: input.notes || "",
      allocations: [{
        id: makeId("pspal"),
        paymentId,
        supplierInvoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate,
        invoiceAmount: invoice.finalTotalAmount,
        invoiceOutstanding: Math.max(invoice.outstandingAmount - input.amount, 0),
        amount: input.amount,
      }],
    };
    partnerSupplierPayments = [payment, ...partnerSupplierPayments];
    pushSupplierLedgerEntry({
      firmId,
      supplierId: invoice.supplierId,
      supplierName: invoice.supplierName,
      entryDate: input.paymentDate,
      type: "SUPPLIER_PAYMENT",
      referenceType: "SUPPLIER_PAYMENT",
      referenceId: paymentId,
      referenceNumber: input.referenceNumber || paymentId,
      description: `Payment recorded for ${invoice.invoiceNumber}`,
      debitAmount: input.amount,
      creditAmount: 0,
    });
    return payment;
  },

  async getPartnerSupplierLedger(
    firmId: number,
    filters: { supplierId?: string; fromDate?: string; toDate?: string } = {},
  ) {
    await wait();
    return partnerSupplierLedgerEntries
      .filter((entry) => entry.firmId === firmId)
      .filter((entry) => !filters.supplierId || entry.supplierId === filters.supplierId)
      .filter((entry) => matchesDateRange(entry.entryDate, filters.fromDate, filters.toDate))
      .sort((a, b) => a.entryDate.localeCompare(b.entryDate) || (a.createdAt || "").localeCompare(b.createdAt || ""));
  },

  async getPartnerReceivablesSummary(
    firmId: number,
    filters: { search?: string; status?: "ALL" | "OUTSTANDING" | "OVERDUE" | "UNPAID" | "PARTIALLY_PAID" | "PAID"; fromDate?: string; toDate?: string; overdueOnly?: boolean },
  ) {
    await wait();
    const search = filters.search?.trim().toLowerCase() || "";
    const invoices = partnerInvoices
      .filter((invoice) => invoice.firmId === firmId)
      .map(hydratePartnerInvoice)
      .filter((invoice) => invoice.status !== "CANCELLED" && invoice.status !== "DRAFT")
      .filter((invoice) => matchesDateRange(invoice.invoiceDate, filters.fromDate, filters.toDate));
    const businessMap = new Map<string, PartnerReceivablesSummary["businesses"][number]>();

    for (const invoice of invoices) {
      const business = partnerClientBusinesses.find((item) => item.id === invoice.clientBusinessId);
      if (!business) continue;
      if (search && !business.businessName.toLowerCase().includes(search) && !invoice.invoiceNumber.toLowerCase().includes(search)) continue;
      const ageDays = partnerAgeDays(invoice.dueDate || invoice.invoiceDate);
      const isOverdue = invoice.dueAmount > 0 && ageDays > 0;
      if (filters.overdueOnly && !isOverdue) continue;
      if (filters.status === "OUTSTANDING" && invoice.dueAmount <= 0) continue;
      if (filters.status === "OVERDUE" && !isOverdue) continue;
      if (["UNPAID", "PARTIALLY_PAID", "PAID"].includes(filters.status || "") && invoice.paymentStatus !== filters.status) continue;

      const summary = businessMap.get(invoice.clientBusinessId) ?? {
        businessId: business.id,
        businessName: business.businessName,
        outletCount: business.outletCount,
        totalInvoiced: 0,
        totalPaid: 0,
        outstanding: 0,
        overdue0To30: 0,
        overdue31To60: 0,
        overdue61To90: 0,
        overdue90Plus: 0,
        latestActivityDate: invoice.invoiceDate,
        outlets: [],
        invoices: [],
      };
      const creditTotal = getCreditNoteTotalByInvoice(invoice.id);
      const debitTotal = getDebitNoteTotalByInvoice(invoice.id);
      const adjustedOutstanding = Math.max(invoice.dueAmount - creditTotal + debitTotal, 0);
      summary.totalInvoiced += invoice.amount - creditTotal + debitTotal;
      summary.totalPaid += invoice.paidAmount;
      summary.outstanding += adjustedOutstanding;
      summary.latestActivityDate = summary.latestActivityDate > invoice.invoiceDate ? summary.latestActivityDate : invoice.invoiceDate;
      if (isOverdue) {
        if (ageDays <= 30) summary.overdue0To30 += adjustedOutstanding;
        else if (ageDays <= 60) summary.overdue31To60 += adjustedOutstanding;
        else if (ageDays <= 90) summary.overdue61To90 += adjustedOutstanding;
        else summary.overdue90Plus += adjustedOutstanding;
      }
      summary.invoices.push({
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        clientId: invoice.clientBusinessId,
        clientName: invoice.clientBusinessName,
        outletId: invoice.clientOutletId,
        outletName: invoice.clientOutletName,
        invoiceDate: invoice.invoiceDate,
        dueDate: invoice.dueDate || invoice.invoiceDate,
        amount: invoice.amount,
        paidAmount: invoice.paidAmount,
        outstanding: adjustedOutstanding,
        ageDays: Math.max(ageDays, 0),
        agingBucket: partnerAgingBucket(Math.max(ageDays, 0)),
        status: isOverdue ? "OVERDUE" : "CURRENT",
        paymentStatus: invoice.paymentStatus,
      });
      businessMap.set(invoice.clientBusinessId, summary);
    }

    const businesses = Array.from(businessMap.values()).map((summary) => {
      const outletMap = new Map<string, PartnerReceivablesSummary["businesses"][number]["outlets"][number]>();
      for (const invoice of summary.invoices) {
        const outlet = outletMap.get(invoice.outletId) ?? {
          outletId: invoice.outletId,
          outletName: invoice.outletName,
          totalInvoiced: 0,
          totalPaid: 0,
          outstanding: 0,
        };
        outlet.totalInvoiced += invoice.amount;
        outlet.totalPaid += invoice.paidAmount;
        outlet.outstanding += invoice.outstanding;
        outletMap.set(invoice.outletId, outlet);
      }
      summary.outlets = Array.from(outletMap.values()).sort((a, b) => a.outletName.localeCompare(b.outletName));
      summary.invoices.sort((a, b) => a.dueDate.localeCompare(b.dueDate) || b.invoiceDate.localeCompare(a.invoiceDate));
      return summary;
    }).sort((a, b) => b.outstanding - a.outstanding || a.businessName.localeCompare(b.businessName));

    return {
      totalReceivables: businesses.reduce((sum, item) => sum + item.outstanding, 0),
      overdueReceivables: businesses.reduce((sum, item) => sum + item.overdue0To30 + item.overdue31To60 + item.overdue61To90 + item.overdue90Plus, 0),
      invoicesDueToday: businesses.reduce((sum, item) => sum + item.invoices.filter((invoice) => invoice.outstanding > 0 && invoice.dueDate === todayISO()).length, 0),
      clientsWithDues: businesses.filter((item) => item.outstanding > 0).length,
      businesses,
    } satisfies PartnerReceivablesSummary;
  },

  async getPartnerCreditNotes(firmId: number) {
    await wait();
    return partnerCreditNotes
      .filter((item) => item.firmId === firmId)
      .sort((a, b) => b.creditDate.localeCompare(a.creditDate));
  },

  async createPartnerCreditNote(
    firmId: number,
    input: {
      clientBusinessId: string;
      clientOutletId: string;
      relatedInvoiceId?: string;
      creditDate: string;
      note?: string;
      status?: "DRAFT" | "ISSUED" | "CANCELLED";
      hasStockReturn: boolean;
      lines: Array<{ itemId?: string; quantity?: number; amount: number; referenceInvoiceLineId?: string }>;
    },
  ) {
    await wait();
    const business = getPartnerBusinessById(firmId, input.clientBusinessId);
    const outlet = getPartnerOutletById(firmId, input.clientOutletId);
    if (!business || !outlet) throw new Error("Client and outlet are required");
    if (!input.lines.length) throw new Error("Add at least one line");
    const id = makeId("pcn");
    const totalAmount = input.lines.reduce((sum, line) => sum + line.amount, 0);
    const lines: PartnerCreditNoteLine[] = input.lines.map((line) => ({
      id: makeId("pcnl"),
      creditNoteId: id,
      itemId: line.itemId,
      itemName: line.itemId ? partnerItems.find((item) => item.id === line.itemId)?.name || "" : "",
      quantity: line.quantity,
      amount: line.amount,
      referenceInvoiceLineId: line.referenceInvoiceLineId,
    }));
    const note: PartnerCreditNote = {
      id,
      firmId,
      creditNoteNumber: `CN-${1000 + partnerCreditNotes.filter((item) => item.firmId === firmId).length + 1}`,
      clientBusinessId: business.id,
      clientBusinessName: business.businessName,
      clientOutletId: outlet.id,
      clientOutletName: outlet.outletName,
      relatedInvoiceId: input.relatedInvoiceId,
      relatedInvoiceNumber: partnerInvoices.find((item) => item.id === input.relatedInvoiceId)?.invoiceNumber || "",
      creditDate: input.creditDate,
      note: input.note?.trim() || "",
      status: input.status || "ISSUED",
      hasStockReturn: input.hasStockReturn,
      totalAmount,
      createdAt: new Date().toISOString(),
      createdByName: currentUser.name,
      lines,
    };
    partnerCreditNotes = [note, ...partnerCreditNotes];
    if (note.status === "ISSUED" && note.hasStockReturn) {
      for (const line of lines) {
        if (!line.itemId || !line.quantity) continue;
        pushPartnerStockEntry({
          id: makeId("pstock"),
          firmId,
          itemId: line.itemId,
          quantityDelta: line.quantity,
          reasonType: "RETURN_IN",
          referenceType: input.relatedInvoiceId ? "INVOICE" : "RETURN",
          referenceId: input.relatedInvoiceId || id,
          note: note.note,
          createdAt: stockActionTimestamp(input.creditDate),
        });
      }
    }
    pushPartnerAuditLog({
      firmId,
      userId: currentUser.id,
      userName: currentUser.name,
      entityType: "CREDIT_NOTE",
      entityId: id,
      action: "CREATE",
      referenceLabel: note.creditNoteNumber,
      afterState: JSON.stringify({ totalAmount, hasStockReturn: note.hasStockReturn }),
    });
    return note;
  },

  async getPartnerDebitNotes(firmId: number) {
    await wait();
    return partnerDebitNotes
      .filter((item) => item.firmId === firmId)
      .sort((a, b) => b.debitDate.localeCompare(a.debitDate));
  },

  async createPartnerDebitNote(
    firmId: number,
    input: {
      clientBusinessId: string;
      clientOutletId: string;
      relatedInvoiceId?: string;
      debitDate: string;
      note?: string;
      status?: "DRAFT" | "ISSUED" | "CANCELLED";
      lines: Array<{ itemId?: string; description: string; amount: number }>;
    },
  ) {
    await wait();
    const business = getPartnerBusinessById(firmId, input.clientBusinessId);
    const outlet = getPartnerOutletById(firmId, input.clientOutletId);
    if (!business || !outlet) throw new Error("Client and outlet are required");
    if (!input.lines.length) throw new Error("Add at least one line");
    const id = makeId("pdn");
    const lines: PartnerDebitNoteLine[] = input.lines.map((line) => ({
      id: makeId("pdnl"),
      debitNoteId: id,
      itemId: line.itemId,
      itemName: line.itemId ? partnerItems.find((item) => item.id === line.itemId)?.name || "" : "",
      description: line.description,
      amount: line.amount,
    }));
    const totalAmount = lines.reduce((sum, line) => sum + line.amount, 0);
    const note: PartnerDebitNote = {
      id,
      firmId,
      debitNoteNumber: `DN-${1000 + partnerDebitNotes.filter((item) => item.firmId === firmId).length + 1}`,
      clientBusinessId: business.id,
      clientBusinessName: business.businessName,
      clientOutletId: outlet.id,
      clientOutletName: outlet.outletName,
      relatedInvoiceId: input.relatedInvoiceId,
      relatedInvoiceNumber: partnerInvoices.find((item) => item.id === input.relatedInvoiceId)?.invoiceNumber || "",
      debitDate: input.debitDate,
      note: input.note?.trim() || "",
      status: input.status || "ISSUED",
      totalAmount,
      createdAt: new Date().toISOString(),
      createdByName: currentUser.name,
      lines,
    };
    partnerDebitNotes = [note, ...partnerDebitNotes];
    pushPartnerAuditLog({
      firmId,
      userId: currentUser.id,
      userName: currentUser.name,
      entityType: "DEBIT_NOTE",
      entityId: id,
      action: "CREATE",
      referenceLabel: note.debitNoteNumber,
      afterState: JSON.stringify({ totalAmount }),
    });
    return note;
  },

  async getPartnerSalesReport(
    firmId: number,
    filters: { fromDate?: string; toDate?: string; brandId?: string; itemId?: string; clientBusinessId?: string; clientOutletId?: string },
  ) {
    await wait();
    return partnerInvoices
      .filter((invoice) => invoice.firmId === firmId)
      .map(hydratePartnerInvoice)
      .filter((invoice) => invoice.status !== "CANCELLED")
      .filter((invoice) => matchesDateRange(invoice.invoiceDate, filters.fromDate, filters.toDate))
      .filter((invoice) => !filters.clientBusinessId || invoice.clientBusinessId === filters.clientBusinessId)
      .filter((invoice) => !filters.clientOutletId || invoice.clientOutletId === filters.clientOutletId)
      .flatMap((invoice) =>
        invoice.items
          .filter((line) => !filters.itemId || line.itemId === filters.itemId)
          .map((line) => {
            const item = partnerItems.find((candidate) => candidate.id === line.itemId);
            if (!item) return null;
            if (filters.brandId && item.brandId !== filters.brandId) return null;
            return {
              invoiceId: invoice.id,
              invoiceNumber: invoice.invoiceNumber,
              invoiceDate: invoice.invoiceDate,
              clientBusinessId: invoice.clientBusinessId,
              clientBusinessName: invoice.clientBusinessName,
              clientOutletId: invoice.clientOutletId,
              clientOutletName: invoice.clientOutletName,
              brandId: item.brandId,
              brandName: partnerBrands.find((brand) => brand.id === item.brandId)?.name || "",
              itemId: line.itemId,
              itemName: line.itemName,
              quantitySold: line.quantity,
              invoiceValue: line.lineTotal,
              paymentReceived: allocatedShare(invoice.paidAmount, invoice.amount, line.lineTotal),
              outstanding: allocatedShare(getAdjustedInvoiceOutstanding(invoice), invoice.amount, line.lineTotal),
            } satisfies PartnerSalesReportRow;
          }),
      )
      .filter(Boolean) as PartnerSalesReportRow[];
  },

  async getPartnerStockMovementReport(
    firmId: number,
    filters: { fromDate?: string; toDate?: string; brandId?: string; itemId?: string },
  ) {
    await wait();
    return partnerItems
      .filter((item) => getFirmBrandIds(firmId).includes(item.brandId))
      .filter((item) => !filters.brandId || item.brandId === filters.brandId)
      .filter((item) => !filters.itemId || item.id === filters.itemId)
      .map((item) => {
        const entries = partnerStockEntries.filter((entry) => entry.firmId === firmId && entry.itemId === item.id);
        const periodEntries = entries.filter((entry) => matchesDateRange(entry.createdAt.slice(0, 10), filters.fromDate, filters.toDate));
        const openingStock = entries
          .filter((entry) => !filters.fromDate || entry.createdAt.slice(0, 10) < filters.fromDate)
          .reduce((sum, entry) => sum + entry.quantityDelta, 0);
        return {
          itemId: item.id,
          itemName: item.name,
          brandId: item.brandId,
          brandName: partnerBrands.find((brand) => brand.id === item.brandId)?.name || "",
          openingStock,
          purchaseInward: periodEntries.filter((entry) => entry.reasonType === "PURCHASE").reduce((sum, entry) => sum + entry.quantityDelta, 0),
          returnIn: periodEntries.filter((entry) => entry.reasonType === "RETURN_IN").reduce((sum, entry) => sum + entry.quantityDelta, 0),
          sale: Math.abs(periodEntries.filter((entry) => entry.reasonType === "SALE").reduce((sum, entry) => sum + entry.quantityDelta, 0)),
          returnOut: Math.abs(periodEntries.filter((entry) => entry.reasonType === "RETURN_OUT").reduce((sum, entry) => sum + entry.quantityDelta, 0)),
          damage: Math.abs(periodEntries.filter((entry) => entry.reasonType === "DAMAGE").reduce((sum, entry) => sum + entry.quantityDelta, 0)),
          adjustment: periodEntries.filter((entry) => entry.reasonType === "ADJUSTMENT").reduce((sum, entry) => sum + entry.quantityDelta, 0),
          closingStock: entries.reduce((sum, entry) => sum + entry.quantityDelta, 0),
        } satisfies PartnerStockMovementReportRow;
      });
  },

  async getPartnerClientPurchaseHistory(
    firmId: number,
    filters: { fromDate?: string; toDate?: string; itemId?: string; clientBusinessId?: string; clientOutletId?: string },
  ) {
    await wait();
    const sales = await this.getPartnerSalesReport(firmId, filters);
    return sales.map((row) => ({
      clientBusinessId: row.clientBusinessId,
      clientBusinessName: row.clientBusinessName,
      clientOutletId: row.clientOutletId,
      clientOutletName: row.clientOutletName,
      invoiceId: row.invoiceId,
      invoiceNumber: row.invoiceNumber,
      invoiceDate: row.invoiceDate,
      itemId: row.itemId,
      itemName: row.itemName,
      quantity: row.quantitySold,
      amount: row.invoiceValue,
    } satisfies PartnerClientPurchaseHistoryRow));
  },

  async getPartnerAuditLogs(
    firmId: number,
    filters: { entityType?: string; fromDate?: string; toDate?: string; userId?: string },
  ) {
    await wait();
    return partnerAuditLogs
      .filter((log) => log.firmId === firmId)
      .filter((log) => !filters.entityType || log.entityType === filters.entityType)
      .filter((log) => !filters.userId || log.userId === filters.userId)
      .filter((log) => !filters.fromDate || log.createdAt.slice(0, 10) >= filters.fromDate)
      .filter((log) => !filters.toDate || log.createdAt.slice(0, 10) <= filters.toDate)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async getPartnerGlobalSearch(firmId: number, query: string) {
    await wait();
    const term = query.trim().toLowerCase();
    if (!term) return [] as PartnerGlobalSearchResult[];
    const results: PartnerGlobalSearchResult[] = [];
    for (const business of partnerClientBusinesses.filter((item) => item.firmId === firmId)) {
      if (business.businessName.toLowerCase().includes(term)) {
        results.push({ id: business.id, type: "CLIENT", title: business.businessName, subtitle: business.billingAddress || "", href: "/partners/clients" });
      }
    }
    for (const order of partnerOrders.filter((item) => item.firmId === firmId)) {
      if (`${order.orderNumber} ${order.clientBusinessName}`.toLowerCase().includes(term)) {
        results.push({ id: order.id, type: "ORDER", title: order.orderNumber, subtitle: order.clientBusinessName, href: `/partners/orders/${order.id}` });
      }
    }
    for (const item of partnerItems.filter((candidate) => getFirmBrandIds(firmId).includes(candidate.brandId))) {
      if (`${item.name} ${item.sku}`.toLowerCase().includes(term)) {
        results.push({ id: item.id, type: "ITEM", title: item.name, subtitle: item.sku, href: "/partners/items" });
      }
    }
    return results.slice(0, 10);
  },

  async getPartnerSuppliers(firmId: number, search = "") {
    await wait();
    const query = search.trim().toLowerCase();
    return partnerSuppliers
      .filter((supplier) => supplier.firmId === firmId)
      .filter((supplier) =>
        !query ||
        supplier.supplierName.toLowerCase().includes(query) ||
        (supplier.phone || "").includes(search.trim()),
      )
      .sort((a, b) => a.supplierName.localeCompare(b.supplierName));
  },

  async validatePartnerSupplierGSTIN(firmId: number, gstin: string, excludeSupplierId = "") {
    await wait();
    const supplier = getPartnerSupplierByGSTIN(firmId, gstin, excludeSupplierId);
    return supplier
      ? { exists: true, supplierId: supplier.id, supplierName: supplier.supplierName }
      : { exists: false };
  },

  async createPartnerSupplier(
    firmId: number,
    input: { supplierName: string; gstin?: string; phone?: string; address?: string },
  ) {
    await wait();
    if (!input.supplierName.trim()) {
      throw new Error("Supplier name is required");
    }
    const validation = await this.validatePartnerSupplierGSTIN(firmId, input.gstin || "");
    if (validation.exists) {
      throw new Error(`This GSTIN already exists under supplier ${validation.supplierName}`);
    }
    if (input.gstin?.trim() && !isValidGSTIN(input.gstin)) {
      throw new Error("GSTIN must be a valid 15-character GSTIN");
    }
    const supplier: PartnerSupplier = {
      id: makeId("psup"),
      firmId,
      supplierName: input.supplierName.trim(),
      gstin: normalizeGSTIN(input.gstin || ""),
      phone: input.phone?.trim() || "",
      address: input.address?.trim() || "",
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    partnerSuppliers = [supplier, ...partnerSuppliers];
    return supplier;
  },

  async updatePartnerSupplier(
    firmId: number,
    supplierId: string,
    input: { supplierName: string; gstin?: string; phone?: string; address?: string; status: "ACTIVE" | "INACTIVE" },
  ) {
    await wait();
    const current = partnerSuppliers.find((supplier) => supplier.firmId === firmId && supplier.id === supplierId);
    if (!current) {
      throw new Error("Supplier not found");
    }
    const validation = await this.validatePartnerSupplierGSTIN(firmId, input.gstin || "", supplierId);
    if (validation.exists) {
      throw new Error(`This GSTIN already exists under supplier ${validation.supplierName}`);
    }
    if (input.gstin?.trim() && !isValidGSTIN(input.gstin)) {
      throw new Error("GSTIN must be a valid 15-character GSTIN");
    }
    const next = {
      ...current,
      supplierName: input.supplierName.trim(),
      gstin: normalizeGSTIN(input.gstin || ""),
      phone: input.phone?.trim() || "",
      address: input.address?.trim() || "",
      status: input.status,
      updatedAt: new Date().toISOString(),
    };
    partnerSuppliers = partnerSuppliers.map((supplier) => (supplier.id === supplierId ? next : supplier));
    return next;
  },

  async archivePartnerSupplier(firmId: number, supplierId: string) {
    const supplier = partnerSuppliers.find((item) => item.firmId === firmId && item.id === supplierId);
    if (!supplier) {
      throw new Error("Supplier not found");
    }
    return this.updatePartnerSupplier(firmId, supplierId, {
      supplierName: supplier.supplierName,
      gstin: supplier.gstin,
      phone: supplier.phone,
      address: supplier.address,
      status: "INACTIVE",
    });
  },

  async getPartnerPurchases(firmId: number) {
    await wait();
    return partnerPurchases
      .filter((purchase) => purchase.firmId === firmId)
      .map(hydratePartnerPurchase)
      .sort((a, b) => b.purchaseDate.localeCompare(a.purchaseDate));
  },

  async getPartnerPurchaseById(firmId: number, purchaseId: string) {
    await wait();
    const purchase = partnerPurchases.find((item) => item.firmId === firmId && item.id === purchaseId);
    if (!purchase) {
      throw new Error("Purchase not found");
    }
    return hydratePartnerPurchase(purchase);
  },

  async createPartnerPurchase(
    firmId: number,
    input: {
      supplierId: string;
      purchaseNumber: string;
      supplierInvoiceNumber?: string;
      supplierInvoiceDate?: string;
      purchaseDate: string;
      expectedInwardDate?: string;
      notes?: string;
      items: Array<{ itemId: string; quantity: number; costPrice: number; discountPercentage?: number; taxPercentage?: number }>;
    },
  ) {
    await wait();
    const supplier = getPartnerSupplierById(firmId, input.supplierId);
    if (!supplier) {
      throw new Error("Supplier not found");
    }
    if (supplier.status === "INACTIVE") {
      throw new Error("Inactive suppliers cannot be used for new purchases");
    }
    if (!input.purchaseNumber.trim()) {
      throw new Error("Purchase number is required");
    }
    if (!input.items.length) {
      throw new Error("Add at least one purchase line");
    }
    const purchaseId = makeId("ppur");
    const items: PartnerPurchaseItem[] = input.items.map((line) => {
      const item = partnerItems.find((candidate) => candidate.id === line.itemId);
      if (!item) {
        throw new Error("Purchase item not found");
      }
      const discount = line.discountPercentage ?? 0;
      const tax = line.taxPercentage ?? 0;
      return {
        id: makeId("ppit"),
        purchaseId,
        itemId: item.id,
        itemCode: item.itemCode,
        itemName: item.name,
        sku: item.sku,
        quantity: line.quantity,
        receivedQuantity: 0,
        damagedQuantity: 0,
        costPrice: line.costPrice,
        discountPercentage: discount,
        taxPercentage: tax,
        lineTotal: line.quantity * line.costPrice * (1 - discount / 100) * (1 + tax / 100),
      };
    });
    const purchase = hydratePartnerPurchase({
      id: purchaseId,
      firmId,
      purchaseNumber: input.purchaseNumber.trim(),
      supplierId: supplier.id,
      supplierName: supplier.supplierName,
      supplierInvoiceNumber: input.supplierInvoiceNumber?.trim() || "",
      supplierInvoiceDate: input.supplierInvoiceDate?.trim() || "",
      purchaseDate: input.purchaseDate,
      expectedInwardDate: input.expectedInwardDate?.trim() || "",
      status: "DRAFT",
      createdAt: new Date().toISOString(),
      createdByName: currentUser.name,
      notes: input.notes?.trim() || "",
      lineCount: 0,
      totalQuantity: 0,
      receivedQuantity: 0,
      damagedQuantity: 0,
      totalAmount: 0,
      stockPosted: false,
      items,
    });
    partnerPurchases = [purchase, ...partnerPurchases];
    return purchase;
  },

  async orderPartnerPurchase(firmId: number, purchaseId: string) {
    await wait();
    const purchase = partnerPurchases.find((item) => item.firmId === firmId && item.id === purchaseId);
    if (!purchase) {
      throw new Error("Purchase not found");
    }
    if (purchase.status === "CANCELLED") {
      throw new Error("Cancelled purchases cannot be ordered");
    }
    if (purchase.status !== "DRAFT") {
      return hydratePartnerPurchase(purchase);
    }
    const orderedAt = new Date().toISOString();
    partnerPurchases = partnerPurchases.map((item) =>
      item.id === purchaseId
        ? hydratePartnerPurchase({ ...item, status: "ORDERED", orderedAt, orderedByName: currentUser.name })
        : item,
    );
    pushPartnerAuditLog({
      firmId,
      userId: currentUser.id,
      userName: currentUser.name,
      entityType: "PURCHASE",
      entityId: purchaseId,
      action: "ORDER",
      referenceLabel: purchase.purchaseNumber,
      beforeState: JSON.stringify({ status: purchase.status }),
      afterState: JSON.stringify({ status: "ORDERED" }),
    });
    return hydratePartnerPurchase(partnerPurchases.find((item) => item.id === purchaseId)!);
  },

  async cancelPartnerPurchase(firmId: number, purchaseId: string) {
    await wait();
    const purchase = partnerPurchases.find((item) => item.firmId === firmId && item.id === purchaseId);
    if (!purchase) {
      throw new Error("Purchase not found");
    }
    if (purchase.status === "PARTIALLY_RECEIVED" || purchase.status === "RECEIVED") {
      throw new Error("Received purchases cannot be cancelled");
    }
    partnerPurchases = partnerPurchases.map((item) =>
      item.id === purchaseId
        ? { ...item, status: "CANCELLED", cancelledAt: new Date().toISOString(), stockPosted: false }
        : item,
    );
    return hydratePartnerPurchase(partnerPurchases.find((item) => item.id === purchaseId)!);
  },

  async getPartnerGoodsReceipts(firmId: number, purchaseId: string) {
    await wait();
    return partnerGoodsReceipts.filter((receipt) => receipt.firmId === firmId && receipt.purchaseId === purchaseId);
  },

  async receivePartnerPurchase(
    firmId: number,
    purchaseId: string,
    input: {
      receivedDate: string;
      notes?: string;
      items: Array<{ purchaseItemId?: string; itemId?: string; receivedQuantity: number; damagedQuantity?: number; notes?: string }>;
    },
  ) {
    await wait();
    const purchase = partnerPurchases.find((item) => item.firmId === firmId && item.id === purchaseId);
    if (!purchase) {
      throw new Error("Purchase not found");
    }
    if (purchase.status === "DRAFT") {
      throw new Error("Purchase must be ordered before receiving stock");
    }
    if (purchase.status === "CANCELLED") {
      throw new Error("Cancelled purchases cannot be received");
    }
    if (purchase.status === "RECEIVED") {
      throw new Error("Purchase is already fully received");
    }
    const grnId = makeId("pgrn");
    const grnNumber = `GRN-${todayISO().replaceAll("-", "")}-${grnId.slice(-6)}`;
    const receiptItems = input.items.map((line) => {
      const purchaseLine = purchase.items.find((item) => item.id === line.purchaseItemId || item.itemId === line.itemId);
      if (!purchaseLine) {
        throw new Error("Purchase item not found");
      }
      const receivedQuantity = line.receivedQuantity || 0;
      const damagedQuantity = line.damagedQuantity || 0;
      const remaining = purchaseLine.quantity - purchaseLine.receivedQuantity - purchaseLine.damagedQuantity;
      if (receivedQuantity < 0 || damagedQuantity < 0 || receivedQuantity + damagedQuantity <= 0) {
        throw new Error("Received or damaged quantity is required");
      }
      if (receivedQuantity + damagedQuantity > remaining) {
        throw new Error(`Received quantity exceeds remaining quantity for ${purchaseLine.itemName}`);
      }
      if (receivedQuantity > 0) {
        pushPartnerStockEntry({
          id: makeId("pstock"),
          firmId,
          itemId: purchaseLine.itemId,
          quantityDelta: receivedQuantity,
          reasonType: "PURCHASE",
          referenceType: "PURCHASE",
          referenceId: grnId,
          note: `GRN ${grnNumber} for purchase ${purchase.purchaseNumber}`,
          createdAt: new Date().toISOString(),
          unitCost: purchaseLine.costPrice,
        });
      }
      return {
        id: makeId("pgri"),
        grnId,
        purchaseItemId: purchaseLine.id,
        itemId: purchaseLine.itemId,
        itemName: purchaseLine.itemName,
        sku: purchaseLine.sku,
        orderedQuantity: purchaseLine.quantity,
        receivedQuantity,
        damagedQuantity,
        notes: line.notes?.trim() || "",
      };
    });
    partnerGoodsReceipts = [
      {
        id: grnId,
        firmId,
        purchaseId,
        grnNumber,
        supplierId: purchase.supplierId,
        supplierName: purchase.supplierName,
        receivedDate: input.receivedDate || todayISO(),
        notes: input.notes?.trim() || "",
        createdAt: new Date().toISOString(),
        createdByName: currentUser.name,
        items: receiptItems,
      },
      ...partnerGoodsReceipts,
    ];
    partnerPurchases = partnerPurchases.map((item) => {
      if (item.id !== purchaseId) return item;
      const nextItems = item.items.map((purchaseLine) => {
        const receiptLine = receiptItems.find((line) => line.purchaseItemId === purchaseLine.id);
        if (!receiptLine) return purchaseLine;
        return {
          ...purchaseLine,
          receivedQuantity: purchaseLine.receivedQuantity + receiptLine.receivedQuantity,
          damagedQuantity: purchaseLine.damagedQuantity + receiptLine.damagedQuantity,
        };
      });
      const totalOrdered = nextItems.reduce((sum, line) => sum + line.quantity, 0);
      const totalAccounted = nextItems.reduce((sum, line) => sum + line.receivedQuantity + line.damagedQuantity, 0);
      return hydratePartnerPurchase({
        ...item,
        items: nextItems,
        status: totalAccounted >= totalOrdered ? "RECEIVED" : "PARTIALLY_RECEIVED",
        postedAt: totalAccounted >= totalOrdered ? new Date().toISOString() : item.postedAt,
        postedByName: totalAccounted >= totalOrdered ? currentUser.name : item.postedByName,
      });
    });
    pushPartnerAuditLog({
      firmId,
      userId: currentUser.id,
      userName: currentUser.name,
      entityType: "PURCHASE",
      entityId: purchaseId,
      action: "RECEIVE",
      referenceLabel: purchase.purchaseNumber,
      beforeState: JSON.stringify({ status: purchase.status }),
      afterState: JSON.stringify({ grnNumber }),
    });
    return hydratePartnerPurchase(partnerPurchases.find((item) => item.id === purchaseId)!);
  },

  async getPartnerStockLedgerByReference(firmId: number, referenceType: string, referenceId: string) {
    await wait();
    return partnerStockEntries
      .filter(
        (entry) =>
          entry.firmId === firmId &&
          (entry.referenceType || "") === referenceType &&
          (entry.referenceId || "") === referenceId,
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async createPartnerStockAction(firmId: number, input: PartnerStockActionInput) {
    await wait();
    const quantity = input.actionType === "ADJUSTMENT" && input.quantityDelta
      ? Math.abs(input.quantityDelta)
      : (input.quantity ?? 0);
    if (!input.itemId || !input.actionDate || quantity <= 0) {
      throw new Error("actionType, itemId, quantity, and actionDate are required");
    }
    const stockRow = (await this.getPartnerStock(firmId)).find((item) => item.itemId === input.itemId);
    if (!stockRow) {
      throw new Error("Item is not mapped to this firm");
    }
    if (input.supplierId) {
      const supplier = getPartnerSupplierById(firmId, input.supplierId);
      if (!supplier) {
        throw new Error("Supplier not found");
      }
      if (supplier.status === "INACTIVE") {
        throw new Error("Inactive suppliers cannot be used for new returns");
      }
    }
    const requestedDelta = input.actionType === "ADJUSTMENT" && input.quantityDelta != null
      ? input.quantityDelta
      : ["RETURN_OUT", "DAMAGE"].includes(input.actionType)
        ? -quantity
        : quantity;
    if (requestedDelta < 0 && stockRow.currentStockQty + requestedDelta < 0) {
      throw new Error("Quantity exceeds available stock");
    }
    if (input.actionType === "ADJUSTMENT" && !input.note?.trim()) {
      throw new Error("Note is required for manual adjustments");
    }

    let quantityDelta = quantity;
    let reasonType: PartnerStockLedgerEntry["reasonType"] = "ADJUSTMENT";
    let referenceType = input.referenceType || "";
    let referenceId = input.referenceId || "";
    let note = input.note?.trim() || "";

    if (input.actionType === "RETURN_IN") {
      reasonType = "RETURN_IN";
      referenceType = input.invoiceId ? "INVOICE" : (referenceType || "RETURN");
      referenceId = input.invoiceId || referenceId || makeId("return_in");
    } else if (input.actionType === "RETURN_OUT") {
      reasonType = "RETURN_OUT";
      quantityDelta = -quantity;
      referenceType = input.purchaseId ? "PURCHASE" : (referenceType || "RETURN");
      referenceId = input.purchaseId || referenceId || makeId("return_out");
    } else if (input.actionType === "DAMAGE") {
      reasonType = "DAMAGE";
      quantityDelta = -quantity;
      referenceType = referenceType || "DAMAGE";
      referenceId = referenceId || makeId("damage");
      note = input.damageCategory ? `${input.damageCategory}: ${note || "write-off recorded"}` : note;
    } else {
      reasonType = "ADJUSTMENT";
      quantityDelta = input.quantityDelta ?? 0;
      referenceType = "MANUAL";
      referenceId = referenceId || makeId("manual");
    }

    const entry: PartnerStockLedgerEntry = {
      id: makeId("pstock"),
      firmId,
      itemId: input.itemId,
      quantityDelta,
      reasonType,
      referenceType,
      referenceId,
      note,
      createdAt: stockActionTimestamp(input.actionDate),
    };
    pushPartnerStockEntry(entry);
    pushPartnerAuditLog({
      firmId,
      userId: currentUser.id,
      userName: currentUser.name,
      entityType: "STOCK",
      entityId: entry.referenceId || entry.id,
      action: input.actionType,
      referenceLabel: entry.referenceId || entry.id,
      afterState: JSON.stringify({ itemId: entry.itemId, quantityDelta: entry.quantityDelta, reasonType: entry.reasonType }),
    });
    return entry;
  },

  async getPartnerStockLedger(firmId: number, itemId: string, filters: PartnerStockLedgerFilters = {}) {
    await wait();
    return partnerStockEntries
      .filter((entry) => entry.firmId === firmId && entry.itemId === itemId)
      .filter((entry) => !filters.reasonType || entry.reasonType === filters.reasonType)
      .filter((entry) => !filters.referenceType || (entry.referenceType || "") === filters.referenceType)
      .filter((entry) => !filters.fromDate || entry.createdAt.slice(0, 10) >= filters.fromDate)
      .filter((entry) => !filters.toDate || entry.createdAt.slice(0, 10) <= filters.toDate)
      .filter((entry) => {
        const query = filters.query?.trim().toLowerCase();
        if (!query) return true;
        return [entry.note || "", entry.referenceType || "", entry.referenceId || ""]
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async createPartnerStockAdjustment(
    firmId: number,
    input: {
      itemId: string;
      quantityDelta: number;
      reasonType: PartnerStockLedgerEntry["reasonType"];
      referenceType?: string;
      referenceId?: string;
      note?: string;
    },
  ) {
    await wait();
    if (!input.itemId || input.quantityDelta === 0) {
      throw new Error("Item and quantity delta are required");
    }
    if (input.referenceType === "MANUAL" && !input.note?.trim()) {
      throw new Error("Note is required for manual adjustments");
    }
    const row = (await this.getPartnerStock(firmId)).find((item) => item.itemId === input.itemId);
    if (!row) {
      throw new Error("Stock item not found");
    }
    if (input.quantityDelta < 0 && row.currentStockQty + input.quantityDelta < 0) {
      throw new Error("Quantity exceeds available stock");
    }
    const entry: PartnerStockLedgerEntry = {
      id: makeId("pstock"),
      firmId,
      itemId: input.itemId,
      quantityDelta: input.quantityDelta,
      reasonType: input.reasonType,
      referenceType: input.referenceType?.trim() || "",
      referenceId: input.referenceId?.trim() || "",
      note: input.note?.trim() || "",
      createdAt: new Date().toISOString(),
    };
    pushPartnerStockEntry(entry);
    pushPartnerAuditLog({
      firmId,
      userId: currentUser.id,
      userName: currentUser.name,
      entityType: "STOCK",
      entityId: entry.referenceId || entry.id,
      action: "ADJUSTMENT",
      referenceLabel: entry.referenceId || entry.id,
      afterState: JSON.stringify({ itemId: entry.itemId, quantityDelta: entry.quantityDelta, reasonType: entry.reasonType }),
    });
    return entry;
  },

  async createPaymentRecord(input: Omit<PaymentRecord, "id" | "createdAt">) {
    await wait();
    const next: PaymentRecord = { ...input, id: makeId("pay"), createdAt: new Date().toISOString() };
    paymentRecords = [next, ...paymentRecords];

    const target = dayEntries.find((entry) => entry.id === input.dayEntryId);
    if (target) {
      const service = services.find((item) => item.id === target.serviceId);
      const nextPaidAmount = (target.paidAmount ?? 0) + input.amount;
      const amountDue = target.priceOverride ?? service?.price;
      target.paidAmount = nextPaidAmount;
      target.paymentStatus = computePaymentStatus(nextPaidAmount, amountDue);
      dayEntries = dayEntries.map((entry) => (entry.id === target.id ? target : entry));
    }

    return next;
  },
};
