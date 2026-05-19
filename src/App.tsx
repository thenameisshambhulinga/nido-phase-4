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
import { EnhancedAuthProvider } from "@/contexts/EnhancedAuthContext";
import { DataProvider } from "@/contexts/DataContext";
import { CartProvider } from "@/contexts/CartContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import AppLayout from "@/components/layout/AppLayout";
import PageErrorBoundary from "@/components/shared/PageErrorBoundary";
import { Suspense, lazy, useState } from "react";
import { Loader2 } from "lucide-react";
import { I18nProvider } from "@/i18n/I18nProvider";
import { PreferencesProvider } from "@/store/preferencesStore";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

const LoginPage = lazy(() => import("@/pages/LoginPage"));
const MainDashboard = lazy(() => import("@/pages/MainDashboard"));
const VendorDashboard = lazy(() => import("@/pages/VendorDashboard"));
const SLAOverview = lazy(() => import("@/pages/SLAOverview"));
const OrdersPage = lazy(() => import("@/pages/OrdersPage"));
const OrderDetailsPage = lazy(() => import("@/pages/OrderDetailsPage"));
const PermissionsPage = lazy(() => import("./pages/PermissionsPage"));
const LocationsPage = lazy(() => import("@/pages/LocationsPage"));
const AuditTrailPage = lazy(() => import("@/pages/AuditTrailPage"));
const OrderStatusesPage = lazy(() => import("@/pages/OrderStatusesPage"));
const NotificationsPage = lazy(() => import("@/pages/NotificationsPage"));
const ApprovalWorkflowsPage = lazy(
  () => import("@/pages/ApprovalWorkflowsPage"),
);
const VendorCategoriesPage = lazy(() => import("@/pages/VendorCategoriesPage"));
const VendorsPage = lazy(() => import("@/pages/VendorsPage"));
const VendorDetailPage = lazy(() => import("@/pages/VendorDetailPage"));
const VendorOrdersPage = lazy(() => import("@/pages/VendorOrdersPage"));
const VendorOnboardingPage = lazy(() => import("@/pages/VendorOnboardingPage"));
const AddVendorPage = lazy(() => import("@/pages/AddVendorPage"));
const ClientsPage = lazy(() => import("@/pages/ClientsPage"));
const AddClient = lazy(() => import("@/pages/AddClient"));
const ClientDetailPage = lazy(() => import("@/pages/ClientDetailPage"));
const UsersPage = lazy(() => import("@/pages/UsersPage"));
const UserProfilePage = lazy(() => import("@/pages/UserProfilePage"));
const ConfigurationPage = lazy(() => import("@/pages/ConfigurationPage"));
const ConfigurationHubPage = lazy(() => import("@/pages/ConfigurationHubPage"));
const GeneralSettingsTab = lazy(
  () => import("@/components/configuration/GeneralSettingsTab"),
);
const UserRolesTab = lazy(
  () => import("@/components/configuration/UserRolesTab"),
);
const IntegrationsPage = lazy(() => import("@/pages/IntegrationsPage"));
const SupportPage = lazy(() => import("@/pages/SupportPage"));
const ServicesPage = lazy(() => import("@/pages/ServicesPage"));
const NewAMCRequestPage = lazy(() => import("@/pages/NewAMCRequestPage"));
const InvoicePage = lazy(() => import("@/pages/InvoicePage"));
const InvoiceDetails = lazy(() => import("@/pages/InvoiceDetails"));
const SalesQuotesPage = lazy(() => import("@/pages/SalesQuotesPage"));
const SalesQuoteDetailPage = lazy(() => import("@/pages/SalesQuoteDetailPage"));
const SalesOrdersPage = lazy(() => import("@/pages/SalesOrdersPage"));
const SalesOrderDetails = lazy(() => import("@/pages/SalesOrderDetails"));
const ExpensesPage = lazy(() => import("@/pages/ExpensesPage"));
const HomePage = lazy(() => import("@/pages/HomePage"));
const CategoriesPage = lazy(() => import("@/pages/CategoriesPage"));
const CartPage = lazy(() => import("@/pages/CartPage"));
const OrganizationsPage = lazy(() => import("@/pages/OrganizationsPage"));
const ArchivePage = lazy(() => import("@/pages/ArchivePage"));
const TicketTrackingPage = lazy(() => import("@/pages/TicketTrackingPage"));
const PricingDiscountsPage = lazy(() => import("@/pages/PricingDiscountsPage"));
const MasterCataloguePage = lazy(() => import("@/pages/MasterCataloguePage"));
const AddMasterCatalogueItemWrapper = lazy(
  () => import("@/pages/AddMasterCatalogueItemWrapper"),
);
const NotFound = lazy(() => import("@/pages/NotFound"));
const SalesQuoteFormPage = lazy(() => import("@/pages/SalesQuoteFormPage"));
const RecurringInvoicesPage = lazy(
  () => import("@/pages/RecurringInvoicesPage"),
);
const DeliveryChallansPage = lazy(() => import("@/pages/DeliveryChallansPage"));
const PaymentReceiptsPage = lazy(() => import("@/pages/PaymentReceiptsPage"));
const CreditNotesPage = lazy(() => import("@/pages/CreditNotesPage"));
const EWayBillsPage = lazy(() => import("@/pages/EWayBillsPage"));
const RecurringExpensesPage = lazy(
  () => import("@/pages/RecurringExpensesPage"),
);
const PurchaseOrdersPage = lazy(() => import("@/pages/PurchaseOrdersPage"));
const BillsPage = lazy(() => import("@/pages/BillsPage"));
const RecurringBillsPage = lazy(() => import("@/pages/RecurringBillsPage"));
const PaymentsMadePage = lazy(() => import("@/pages/PaymentsMadePage"));
const VendorCreditsPage = lazy(() => import("@/pages/VendorCreditsPage"));
const EnhancedUsersPage = lazy(() => import("@/pages/EnhancedUsersPage"));
const RoleTemplatesPage = lazy(() => import("@/pages/RoleTemplatesPage"));
const DepartmentsPage = lazy(() => import("@/pages/DepartmentsPage"));
const UserInvitationPage = lazy(() => import("@/pages/UserInvitationPage"));
const AuditLogPage = lazy(() => import("@/pages/AuditLogPage"));
const ShopPage = lazy(() => import("@/pages/ShopPage"));
const ProductDetailPage = lazy(() => import("@/pages/ProductDetailPage"));
const ProductEnquiryPage = lazy(() => import("@/pages/ProductEnquiryPage"));
const CheckoutPage = lazy(() => import("@/pages/CheckoutPage"));
const OrderConfirmationPage = lazy(
  () => import("@/pages/OrderConfirmationPage"),
);
const UserOnboardingPage = lazy(() => import("@/pages/UserOnboardingPage"));
const NidoUserProfilePage = lazy(() => import("@/pages/NidoUserProfilePage"));

function AppRoutes() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-background">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      }
    >
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
        <Route path="/onboarding/:token" element={<UserOnboardingPage />} />
        <Route
          path="/support/track/:ticketId"
          element={<TicketTrackingPage />}
        />
        <Route
          path="/shop/product/:productId/enquire"
          element={<ProductEnquiryPage />}
        />
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
          <Route path="categories" element={<Navigate to="/shop" replace />} />
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
          <Route path="vendors/orders" element={<VendorOrdersPage />} />
          <Route path="vendors/categories" element={<VendorCategoriesPage />} />
          <Route path="vendors/onboarding" element={<VendorOnboardingPage />} />
          <Route path="vendors/add" element={<AddVendorPage />} />
          <Route path="vendors/:id" element={<VendorDetailPage />} />
          <Route
            path="procure/orders/:id"
            element={
              <PageErrorBoundary
                title="Procure order details failed to load"
                resetKey={location.pathname}
              >
                <OrderDetailsPage />
              </PageErrorBoundary>
            }
          />
          <Route
            path="clients"
            element={
              <PageErrorBoundary
                title="Clients failed to load"
                resetKey={location.pathname}
              >
                <ClientsPage />
              </PageErrorBoundary>
            }
          />
          <Route path="clients/add" element={<AddClient />} />
          <Route
            path="clients/:id"
            element={
              <PageErrorBoundary
                title="Client profile failed to load"
                resetKey={location.pathname}
              >
                <ClientDetailPage />
              </PageErrorBoundary>
            }
          />
          <Route
            path="clients/:id/users/:userId"
            element={
              <PageErrorBoundary
                title="User profile failed to load"
                resetKey={location.pathname}
              >
                <UserProfilePage />
              </PageErrorBoundary>
            }
          />
          <Route path="clients/contracts" element={<ClientsPage />} />
          <Route path="permissions" element={<PermissionsPage />} />
          <Route
            path="users"
            element={
              <PageErrorBoundary
                title="Users failed to load"
                resetKey={location.pathname}
              >
                <UsersPage />
              </PageErrorBoundary>
            }
          />
          <Route
            path="users/management"
            element={
              <PageErrorBoundary
                title="User Management failed to load"
                resetKey={location.pathname}
              >
                <EnhancedUsersPage />
              </PageErrorBoundary>
            }
          />
          <Route
            path="configuration/nido-users/users/:userId/profile"
            element={
              <PageErrorBoundary
                title="Nido user profile failed to load"
                resetKey={location.pathname}
              >
                <NidoUserProfilePage />
              </PageErrorBoundary>
            }
          />
          <Route
            path="users/roles"
            element={
              <PageErrorBoundary
                title="Roles failed to load"
                resetKey={location.pathname}
              >
                <RoleTemplatesPage />
              </PageErrorBoundary>
            }
          />
          <Route
            path="users/departments"
            element={
              <PageErrorBoundary
                title="Departments failed to load"
                resetKey={location.pathname}
              >
                <DepartmentsPage />
              </PageErrorBoundary>
            }
          />
          <Route
            path="users/invitations"
            element={
              <PageErrorBoundary
                title="Invitations failed to load"
                resetKey={location.pathname}
              >
                <UserInvitationPage />
              </PageErrorBoundary>
            }
          />
          <Route
            path="users/audit-trail"
            element={
              <PageErrorBoundary
                title="Audit Trail failed to load"
                resetKey={location.pathname}
              >
                <AuditLogPage />
              </PageErrorBoundary>
            }
          />
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
          <Route
            path="configuration/master-catalogue/add"
            element={<AddMasterCatalogueItemWrapper />}
          />
          <Route
            path="configuration/master-catalogue/edit/:itemId"
            element={<AddMasterCatalogueItemWrapper />}
          />
          <Route path="integrations" element={<IntegrationsPage />} />
          <Route path="reports" element={<MainDashboard />} />
          <Route path="reports/audit" element={<AuditTrailPage />} />
          <Route
            path="shop"
            element={
              <PageErrorBoundary
                title="Shop failed to load"
                resetKey={location.pathname}
              >
                <ShopPage />
              </PageErrorBoundary>
            }
          />
          <Route
            path="shop/cart"
            element={
              <PageErrorBoundary
                title="Cart failed to load"
                resetKey={location.pathname}
              >
                <CartPage />
              </PageErrorBoundary>
            }
          />
          <Route
            path="shop/product/:productId"
            element={
              <PageErrorBoundary
                title="Product detail failed to load"
                resetKey={location.pathname}
              >
                <ProductDetailPage />
              </PageErrorBoundary>
            }
          />
          <Route
            path="shop/checkout"
            element={
              <PageErrorBoundary
                title="Checkout failed to load"
                resetKey={location.pathname}
              >
                <CheckoutPage />
              </PageErrorBoundary>
            }
          />
          <Route
            path="shop/order-confirmation/:orderId"
            element={
              <PageErrorBoundary
                title="Order confirmation failed to load"
                resetKey={location.pathname}
              >
                <OrderConfirmationPage />
              </PageErrorBoundary>
            }
          />
          <Route path="services" element={<ServicesPage />} />
          <Route path="services/amc/new" element={<NewAMCRequestPage />} />
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
            element={<RecurringExpensesPage />}
          />
          <Route
            path="transactions/purchase/recurring-expenses/create"
            element={<RecurringExpensesPage />}
          />
          <Route
            path="transactions/purchase/recurring-expenses/:id/edit"
            element={<RecurringExpensesPage />}
          />
          <Route
            path="transactions/purchase/expenses"
            element={<ExpensesPage />}
          />
          <Route
            path="transactions/purchase/expenses/create"
            element={<ExpensesPage />}
          />
          <Route
            path="transactions/purchase/expenses/:id"
            element={<ExpensesPage />}
          />
          <Route
            path="transactions/purchase/purchase-orders"
            element={<PurchaseOrdersPage />}
          />
          <Route
            path="transactions/purchase/purchase-orders/create"
            element={<PurchaseOrdersPage />}
          />
          <Route
            path="transactions/purchase/purchase-orders/:id"
            element={<PurchaseOrdersPage />}
          />
          <Route
            path="transactions/purchase/purchase-orders/:id/edit"
            element={<PurchaseOrdersPage />}
          />
          <Route path="transactions/purchase/bills" element={<BillsPage />} />
          <Route
            path="transactions/purchase/bills/create"
            element={<BillsPage />}
          />
          <Route
            path="transactions/purchase/bills/:id"
            element={<BillsPage />}
          />
          <Route
            path="transactions/purchase/bills/:id/edit"
            element={<BillsPage />}
          />
          <Route
            path="transactions/purchase/recurring-bills"
            element={<RecurringBillsPage />}
          />
          <Route
            path="transactions/purchase/recurring-bills/create"
            element={<RecurringBillsPage />}
          />
          <Route
            path="transactions/purchase/recurring-bills/:id"
            element={<RecurringBillsPage />}
          />
          <Route
            path="transactions/purchase/payments-made"
            element={<PaymentsMadePage />}
          />
          <Route
            path="transactions/purchase/payments-made/create"
            element={<PaymentsMadePage />}
          />
          <Route
            path="transactions/purchase/vendor-credits"
            element={<VendorCreditsPage />}
          />
          <Route
            path="transactions/purchase/vendor-credits/create"
            element={<VendorCreditsPage />}
          />
          <Route
            path="transactions/purchase/vendor-credits/:id"
            element={<VendorCreditsPage />}
          />
          <Route
            path="sales"
            element={<Navigate to="/sales/quotes" replace />}
          />
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
          <Route
            path="sales/invoices"
            element={
              <PageErrorBoundary
                title="Invoices failed to load"
                resetKey={location.pathname}
              >
                <InvoicePage />
              </PageErrorBoundary>
            }
          />
          <Route
            path="sales/invoices/:id"
            element={
              <PageErrorBoundary
                title="Invoice details failed to load"
                resetKey={location.pathname}
              >
                <InvoiceDetails />
              </PageErrorBoundary>
            }
          />
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
          <Route
            path="sales/credit-notes/create"
            element={<CreditNotesPage />}
          />
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
    </Suspense>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ThemeProvider>
          <I18nProvider>
            <PreferencesProvider>
              <NotificationProvider>
                <AuthProvider>
                  <EnhancedAuthProvider>
                    <OrganizationProvider>
                      <DataProvider>
                        <CartProvider>
                          <AppRoutes />
                        </CartProvider>
                      </DataProvider>
                    </OrganizationProvider>
                  </EnhancedAuthProvider>
                </AuthProvider>
              </NotificationProvider>
            </PreferencesProvider>
          </I18nProvider>
        </ThemeProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
