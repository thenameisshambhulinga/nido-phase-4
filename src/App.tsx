/// <reference path="./types/react-query-shim.d.ts" />
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import { CartProvider } from "@/contexts/CartContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import AppLayout from "@/components/layout/AppLayout";
import LoginPage from "@/pages/LoginPage";
import MainDashboard from "@/pages/MainDashboard";
import VendorDashboard from "@/pages/VendorDashboard";
import SLAOverview from "@/pages/SLAOverview";
import OrdersPage from "@/pages/OrdersPage";
import OrderDetailsPage from "@/pages/OrderDetailsPage";
import PermissionsPage from "./pages/PermissionsPage";
import LocationsPage from "@/pages/LocationsPage";
import AuditTrailPage from "@/pages/AuditTrailPage";
import OrderStatusesPage from "@/pages/OrderStatusesPage";
import NotificationsPage from "@/pages/NotificationsPage";
import ApprovalWorkflowsPage from "@/pages/ApprovalWorkflowsPage";
import VendorCategoriesPage from "@/pages/VendorCategoriesPage";
import VendorsPage from "@/pages/VendorsPage";
import VendorDetailPage from "@/pages/VendorDetailPage";
import VendorOnboardingPage from "@/pages/VendorOnboardingPage";
import ClientsPage from "@/pages/ClientsPage";
import AddClient from "@/pages/AddClient";
import ClientDetailPage from "@/pages/ClientDetailPage";
import UsersPage from "@/pages/UsersPage";
import UserProfilePage from "@/pages/UserProfilePage";
import ConfigurationPage from "@/pages/ConfigurationPage";
import ConfigurationHubPage from "@/pages/ConfigurationHubPage";
import GeneralSettingsTab from "@/components/configuration/GeneralSettingsTab";
import UserRolesTab from "@/components/configuration/UserRolesTab";
import IntegrationsPage from "@/pages/IntegrationsPage";
import SupportPage from "@/pages/SupportPage";
import InvoicePage from "@/pages/InvoicePage";
import InvoiceDetails from "@/pages/InvoiceDetails";
import SalesQuotesPage from "@/pages/SalesQuotesPage";
import SalesQuoteDetailPage from "@/pages/SalesQuoteDetailPage";
import SalesOrdersPage from "@/pages/SalesOrdersPage";
import SalesOrderDetails from "@/pages/SalesOrderDetails";
import SalesModulePlaceholderPage from "@/pages/SalesModulePlaceholderPage";
import HomePage from "@/pages/HomePage";
import CategoriesPage from "@/pages/CategoriesPage";
import CartPage from "@/pages/CartPage";
import OrganizationsPage from "@/pages/OrganizationsPage";
import ArchivePage from "@/pages/ArchivePage";
import TicketTrackingPage from "@/pages/TicketTrackingPage";
import PricingDiscountsPage from "@/pages/PricingDiscountsPage";
import MasterCataloguePage from "@/pages/MasterCataloguePage";
import NotFound from "@/pages/NotFound";
import SalesQuoteFormPage from "@/pages/SalesQuoteFormPage";
import RecurringInvoicesPage from "@/pages/RecurringInvoicesPage";
import DeliveryChallansPage from "@/pages/DeliveryChallansPage";
import PaymentReceiptsPage from "@/pages/PaymentReceiptsPage";
import CreditNotesPage from "@/pages/CreditNotesPage";
import EWayBillsPage from "@/pages/EWayBillsPage";
import PageErrorBoundary from "@/components/shared/PageErrorBoundary";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to="/home" replace />
          ) : (
            <PageErrorBoundary
              title="Login failed to load"
              resetKey={location.pathname}
            >
              <LoginPage />
            </PageErrorBoundary>
          )
        }
      />
      <Route path="/support/track/:ticketId" element={<TicketTrackingPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/home" replace />} />
        <Route path="home" element={<HomePage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="dashboard" element={<MainDashboard />} />
        <Route path="dashboard/vendor" element={<VendorDashboard />} />
        <Route path="dashboard/sla" element={<SLAOverview />} />
        <Route
          path="orders"
          element={
            <PageErrorBoundary
              title="Orders failed to load"
              resetKey={location.pathname}
            >
              <OrdersPage />
            </PageErrorBoundary>
          }
        />
        <Route
          path="orders/:id"
          element={
            <PageErrorBoundary
              title="Order details failed to load"
              resetKey={location.pathname}
            >
              <OrderDetailsPage />
            </PageErrorBoundary>
          }
        />
        <Route path="vendors" element={<VendorsPage />} />
        <Route path="vendors/categories" element={<VendorCategoriesPage />} />
        <Route path="vendors/onboarding" element={<VendorOnboardingPage />} />
        <Route path="vendors/:id" element={<VendorDetailPage />} />
        <Route path="clients" element={<ClientsPage />} />
        <Route path="clients/add" element={<AddClient />} />
        <Route path="clients/:id" element={<ClientDetailPage />} />
        <Route path="clients/:id/users/:userId" element={<UserProfilePage />} />
        <Route path="clients/contracts" element={<ClientsPage />} />
        <Route path="permissions" element={<PermissionsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="configuration" element={<ConfigurationHubPage />} />
        <Route
          path="configuration/general"
          element={<Navigate to="/configuration" replace />}
        />
        <Route
          path="configuration/general-settings"
          element={<GeneralSettingsTab />}
        />
        <Route path="configuration/nido-users" element={<UserRolesTab />} />
        <Route
          path="configuration/order-statuses"
          element={<OrderStatusesPage />}
        />
        <Route path="configuration/locations" element={<LocationsPage />} />
        <Route
          path="configuration/notifications"
          element={<NotificationsPage />}
        />
        <Route
          path="configuration/workflows"
          element={<ApprovalWorkflowsPage />}
        />
        <Route
          path="configuration/pricing"
          element={<PricingDiscountsPage />}
        />
        <Route
          path="configuration/master-catalogue"
          element={<MasterCataloguePage />}
        />
        <Route path="integrations" element={<IntegrationsPage />} />
        <Route path="reports" element={<MainDashboard />} />
        <Route path="reports/audit" element={<AuditTrailPage />} />
        <Route
          path="shop"
          element={
            <PageErrorBoundary
              title="Orders failed to load"
              resetKey={location.pathname}
            >
              <OrdersPage />
            </PageErrorBoundary>
          }
        />
        <Route path="shop/cart" element={<CartPage />} />
        <Route path="services" element={<MainDashboard />} />
        <Route path="support" element={<SupportPage />} />
        <Route
          path="transactions"
          element={<Navigate to="/sales/quotes" replace />}
        />
        <Route
          path="transactions/sales"
          element={<Navigate to="/sales/quotes" replace />}
        />
        <Route
          path="transactions/purchase"
          element={
            <PageErrorBoundary
              title="Orders failed to load"
              resetKey={location.pathname}
            >
              <OrdersPage />
            </PageErrorBoundary>
          }
        />
        <Route
          path="transactions/purchase/recurring-expenses"
          element={
            <SalesModulePlaceholderPage
              title="Recurring Expenses"
              description="Manage and review recurring expense schedules."
            />
          }
        />
        <Route
          path="transactions/purchase/purchase-orders"
          element={
            <SalesModulePlaceholderPage
              title="Purchase Orders"
              description="Create and track purchase orders for vendor procurement."
            />
          }
        />
        <Route
          path="transactions/purchase/bills"
          element={
            <SalesModulePlaceholderPage
              title="Bills"
              description="View, verify, and process vendor bills."
            />
          }
        />
        <Route
          path="transactions/purchase/recurring-bills"
          element={
            <SalesModulePlaceholderPage
              title="Recurring Bills"
              description="Track recurring billing cycles and due dates."
            />
          }
        />
        <Route
          path="transactions/purchase/payments-made"
          element={
            <SalesModulePlaceholderPage
              title="Payments Made"
              description="Review completed payments made to vendors."
            />
          }
        />
        <Route
          path="transactions/purchase/vendor-credits"
          element={
            <SalesModulePlaceholderPage
              title="Vendor Credits"
              description="Manage credit notes and balances from vendors."
            />
          }
        />
        <Route path="sales" element={<Navigate to="/sales/quotes" replace />} />
        <Route
          path="sales/quotes"
          element={
            <PageErrorBoundary
              title="Quotes failed to load"
              resetKey={location.pathname}
            >
              <SalesQuotesPage />
            </PageErrorBoundary>
          }
        />
        <Route
          path="sales/quotes/create"
          element={
            <PageErrorBoundary
              title="Quote form failed to load"
              resetKey={location.pathname}
            >
              <SalesQuoteFormPage />
            </PageErrorBoundary>
          }
        />
        <Route
          path="sales/quotes/:id"
          element={
            <PageErrorBoundary
              title="Quote details failed to load"
              resetKey={location.pathname}
            >
              <SalesQuoteDetailPage />
            </PageErrorBoundary>
          }
        />
        <Route
          path="sales/quotes/:id/edit"
          element={
            <PageErrorBoundary
              title="Quote form failed to load"
              resetKey={location.pathname}
            >
              <SalesQuoteFormPage />
            </PageErrorBoundary>
          }
        />
        <Route path="sales/orders" element={<SalesOrdersPage />} />
        <Route path="sales/orders/:id" element={<SalesOrderDetails />} />
        <Route path="sales/invoices" element={<InvoicePage />} />
        <Route path="sales/invoices/:id" element={<InvoiceDetails />} />
        <Route
          path="sales/recurring-invoices"
          element={<RecurringInvoicesPage />}
        />
        <Route
          path="sales/recurring-invoices/create"
          element={<RecurringInvoicesPage />}
        />
        <Route
          path="sales/recurring-invoices/:id/edit"
          element={<RecurringInvoicesPage />}
        />
        <Route
          path="sales/delivery-challans"
          element={<DeliveryChallansPage />}
        />
        <Route
          path="sales/delivery-challans/create"
          element={<DeliveryChallansPage />}
        />
        <Route
          path="sales/delivery-challans/:id"
          element={<DeliveryChallansPage />}
        />
        <Route
          path="sales/payment-receipts"
          element={<PaymentReceiptsPage />}
        />
        <Route
          path="sales/payment-receipts/create"
          element={<PaymentReceiptsPage />}
        />
        <Route
          path="sales/payment-receipts/:id"
          element={<PaymentReceiptsPage />}
        />
        <Route path="sales/credit-notes" element={<CreditNotesPage />} />
        <Route path="sales/credit-notes/create" element={<CreditNotesPage />} />
        <Route path="sales/credit-notes/:id" element={<CreditNotesPage />} />
        <Route
          path="sales/credit-notes/:id/edit"
          element={<CreditNotesPage />}
        />
        <Route path="sales/e-way-bills" element={<EWayBillsPage />} />
        <Route path="sales/e-way-bills/create" element={<EWayBillsPage />} />
        <Route path="sales/e-way-bills/:id" element={<EWayBillsPage />} />
        <Route
          path="invoices"
          element={<Navigate to="/sales/invoices" replace />}
        />
        <Route path="procure/requests" element={<OrdersPage />} />
        <Route path="procure/approvals" element={<ApprovalWorkflowsPage />} />
        <Route path="organizations" element={<OrganizationsPage />} />
        <Route path="archive" element={<ArchivePage />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ThemeProvider>
          <NotificationProvider>
            <AuthProvider>
              <DataProvider>
                <CartProvider>
                  <AppRoutes />
                </CartProvider>
              </DataProvider>
            </AuthProvider>
          </NotificationProvider>
        </ThemeProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
