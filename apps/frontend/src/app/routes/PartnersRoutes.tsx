import { Navigate, Route, Routes } from "react-router-dom";
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
import { PartnerPurchasesPage } from "@pages/PartnerPurchasesPage";
import { PartnerSupplierLedgerPage } from "@pages/PartnerSupplierLedgerPage";
import { PartnersPayablesPage } from "@pages/PartnersPayablesPage";
import { PartnersStockPage } from "@pages/PartnersStockPage";
import { PartnersSuppliersPage } from "@pages/PartnersSuppliersPage";
import { PartnerFirmOnboardingPage } from "@pages/PartnerFirmOnboardingPage";
import { PartnerFirmSettingsPage } from "@pages/PartnerFirmSettingsPage";
import { PartnerTeamAccessPage } from "@pages/PartnerTeamAccessPage";
import { PartnerOrderDetailPage } from "@pages/PartnerOrderDetailPage";

export function PartnersRoutes() {
  return (
    <Routes>
      <Route index element={<PartnersDashboardPage />} />
      <Route path="onboarding/firm" element={<PartnerFirmOnboardingPage />} />
      <Route path="settings/firm" element={<PartnerFirmSettingsPage />} />
      <Route path="settings/access" element={<PartnerTeamAccessPage />} />
      <Route path="brands" element={<PartnersBrandsPage />} />
      <Route path="items" element={<PartnersItemsPage />} />
      <Route path="clients" element={<PartnersClientsPage />} />
      <Route path="clients/:clientId/ledger" element={<PartnerClientLedgerPage />} />
      <Route path="orders" element={<PartnersOrdersPage />} />
      <Route path="backorders" element={<PartnersBackordersPage />} />
      <Route path="order-history" element={<PartnersOrderHistoryPage />} />
      <Route path="history" element={<PartnersInventoryHistoryPage />} />
      <Route path="orders/:orderId" element={<PartnerOrderDetailPage />} />
      <Route path="receivables" element={<PartnersReceivablesPage />} />
      <Route path="invoices" element={<PartnerInvoicesPage />} />
      <Route path="invoices/:invoiceId" element={<PartnerInvoiceDetailPage />} />
      <Route path="payments" element={<PartnersPaymentsPage />} />
      <Route path="client-ledger" element={<PartnerClientLedgerPage />} />
      <Route path="credit-notes" element={<PartnerCreditNotesPage />} />
      <Route path="stock" element={<PartnersStockPage />} />
      <Route path="purchases" element={<PartnerPurchasesPage />} />
      <Route path="purchases/:purchaseId" element={<PartnerPurchaseDetailPage />} />
      <Route path="suppliers" element={<PartnersSuppliersPage />} />
      <Route path="suppliers/:supplierId/ledger" element={<PartnerSupplierLedgerPage />} />
      <Route path="payables" element={<PartnersPayablesPage />} />
      <Route path="*" element={<Navigate to="/partners" replace />} />
    </Routes>
  );
}
