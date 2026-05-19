import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { PartnersDashboardPage } from "@pages/PartnersDashboardPage";
import { PartnersBrandsPage } from "@pages/PartnersBrandsPage";
import { PartnersBackordersPage } from "@pages/PartnersBackordersPage";
import { PartnersClientsPage } from "@pages/PartnersClientsPage";
import { PartnersItemsPage } from "@pages/PartnersItemsPage";
import { PartnersOrdersPage } from "@pages/PartnersOrdersPage";
import { PartnersOrderHistoryPage } from "@pages/PartnersOrderHistoryPage";
import { PartnersInventoryHistoryPage } from "@pages/PartnersInventoryHistoryPage";
import { PartnersReceivablesPage } from "@pages/PartnersReceivablesPage";
import { PartnerCreditNotesPage } from "@pages/PartnerCreditNotesPage";
import { PartnerInvoiceDetailPage } from "@pages/PartnerInvoiceDetailPage";
import { PartnerInvoicesPage } from "@pages/PartnerInvoicesPage";
import { PartnerClientLedgerPage } from "@pages/PartnerClientLedgerPage";
import { PartnersPaymentsPage } from "@pages/PartnersPaymentsPage";
import { PartnerPurchaseDetailPage } from "@pages/PartnerPurchaseDetailPage";
import { PartnerPurchaseCreatePage } from "@pages/PartnerPurchaseCreatePage";
import { PartnerPurchasesPage } from "@pages/PartnerPurchasesPage";
import { PartnerSupplierReturnCreatePage } from "@pages/PartnerSupplierReturnCreatePage";
import { PartnerSupplierReturnDetailPage } from "@pages/PartnerSupplierReturnDetailPage";
import { PartnerSupplierReturnsPage } from "@pages/PartnerSupplierReturnsPage";
import { PartnerSupplierLedgerPage } from "@pages/PartnerSupplierLedgerPage";
import { PartnersPayablesPage } from "@pages/PartnersPayablesPage";
import { PartnersStockPage } from "@pages/PartnersStockPage";
import { PartnersSuppliersPage } from "@pages/PartnersSuppliersPage";
import { PartnerFirmOnboardingPage } from "@pages/PartnerFirmOnboardingPage";
import { PartnerFirmSettingsPage } from "@pages/PartnerFirmSettingsPage";
import { PartnerTeamAccessPage } from "@pages/PartnerTeamAccessPage";
import { PartnerOrderDetailPage } from "@pages/PartnerOrderDetailPage";

function LegacyRedirect({ to }: { to: string }) {
  const params = useParams();
  const resolvedTo = Object.entries(params).reduce(
    (path, [key, value]) => path.replace(`:${key}`, encodeURIComponent(value ?? "")),
    to,
  );
  return <Navigate to={resolvedTo} replace />;
}

export function PartnersRoutes() {
  return (
    <Routes>
      <Route index element={<PartnersDashboardPage />} />
      <Route path="onboarding/firm" element={<PartnerFirmOnboardingPage />} />
      <Route path="general/firm" element={<PartnerFirmSettingsPage />} />
      <Route path="general/users" element={<PartnerTeamAccessPage />} />
      <Route path="products/brands" element={<PartnersBrandsPage />} />
      <Route path="products/catalog" element={<PartnersItemsPage />} />
      <Route path="supply/suppliers" element={<PartnersSuppliersPage />} />
      <Route path="supply/suppliers/:supplierId/ledger" element={<PartnerSupplierLedgerPage />} />
      <Route path="supply/purchases" element={<PartnerPurchasesPage />} />
      <Route path="supply/purchases/new" element={<PartnerPurchaseCreatePage />} />
      <Route path="supply/purchases/:purchaseId" element={<PartnerPurchaseDetailPage />} />
      <Route path="supply/supplier-returns" element={<PartnerSupplierReturnsPage />} />
      <Route path="supply/supplier-returns/new" element={<PartnerSupplierReturnCreatePage />} />
      <Route path="supply/supplier-returns/:returnId" element={<PartnerSupplierReturnDetailPage />} />
      <Route path="supply/purchase-history" element={<PartnersInventoryHistoryPage />} />
      <Route path="stock/inventory" element={<PartnersStockPage />} />
      <Route path="sales/clients" element={<PartnersClientsPage />} />
      <Route path="sales/clients/:clientId/ledger" element={<PartnerClientLedgerPage />} />
      <Route path="sales/orders" element={<PartnersOrdersPage />} />
      <Route path="sales/orders/:orderId" element={<PartnerOrderDetailPage />} />
      <Route path="sales/back-orders" element={<PartnersBackordersPage />} />
      <Route path="sales/order-history" element={<PartnersOrderHistoryPage />} />
      <Route path="finance/invoices" element={<PartnerInvoicesPage />} />
      <Route path="finance/invoices/:invoiceId" element={<PartnerInvoiceDetailPage />} />
      <Route path="finance/receivables" element={<PartnersReceivablesPage />} />
      <Route path="finance/payments" element={<PartnersPaymentsPage />} />
      <Route path="finance/client-ledger" element={<PartnerClientLedgerPage />} />
      <Route path="finance/credit-notes" element={<PartnerCreditNotesPage />} />
      <Route path="finance/payables" element={<PartnersPayablesPage />} />
      <Route path="dashboard" element={<Navigate to="/partners" replace />} />
      <Route path="settings/firm" element={<Navigate to="/partners/general/firm" replace />} />
      <Route path="settings/access" element={<Navigate to="/partners/general/users" replace />} />
      <Route path="brands" element={<Navigate to="/partners/products/brands" replace />} />
      <Route path="items" element={<Navigate to="/partners/products/catalog" replace />} />
      <Route path="suppliers" element={<Navigate to="/partners/supply/suppliers" replace />} />
      <Route path="suppliers/:supplierId/ledger" element={<LegacyRedirect to="/partners/supply/suppliers/:supplierId/ledger" />} />
      <Route path="purchases" element={<Navigate to="/partners/supply/purchases" replace />} />
      <Route path="purchases/new" element={<Navigate to="/partners/supply/purchases/new" replace />} />
      <Route path="purchases/:purchaseId" element={<LegacyRedirect to="/partners/supply/purchases/:purchaseId" />} />
      <Route path="supplier-returns" element={<Navigate to="/partners/supply/supplier-returns" replace />} />
      <Route path="supplier-returns/new" element={<Navigate to="/partners/supply/supplier-returns/new" replace />} />
      <Route path="history" element={<Navigate to="/partners/supply/purchase-history" replace />} />
      <Route path="stock" element={<Navigate to="/partners/stock/inventory" replace />} />
      <Route path="clients" element={<Navigate to="/partners/sales/clients" replace />} />
      <Route path="clients/:clientId/ledger" element={<LegacyRedirect to="/partners/sales/clients/:clientId/ledger" />} />
      <Route path="orders" element={<Navigate to="/partners/sales/orders" replace />} />
      <Route path="orders/:orderId" element={<LegacyRedirect to="/partners/sales/orders/:orderId" />} />
      <Route path="backorders" element={<Navigate to="/partners/sales/back-orders" replace />} />
      <Route path="order-history" element={<Navigate to="/partners/sales/order-history" replace />} />
      <Route path="orders/history" element={<Navigate to="/partners/sales/order-history" replace />} />
      <Route path="invoices" element={<Navigate to="/partners/finance/invoices" replace />} />
      <Route path="invoices/:invoiceId" element={<LegacyRedirect to="/partners/finance/invoices/:invoiceId" />} />
      <Route path="receivables" element={<Navigate to="/partners/finance/receivables" replace />} />
      <Route path="payments" element={<Navigate to="/partners/finance/payments" replace />} />
      <Route path="client-ledger" element={<Navigate to="/partners/finance/client-ledger" replace />} />
      <Route path="credit-notes" element={<Navigate to="/partners/finance/credit-notes" replace />} />
      <Route path="payables" element={<Navigate to="/partners/finance/payables" replace />} />
      <Route path="*" element={<Navigate to="/partners" replace />} />
    </Routes>
  );
}
