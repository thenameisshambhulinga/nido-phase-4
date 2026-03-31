/// <reference path="./types/react-query-shim.d.ts" />
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import ConfigurationPage from "@/pages/ConfigurationPage";
import ConfigurationHubPage from "@/pages/ConfigurationHubPage";
import GeneralSettingsTab from "@/components/configuration/GeneralSettingsTab";
import UserRolesTab from "@/components/configuration/UserRolesTab";
import IntegrationsPage from "@/pages/IntegrationsPage";
import SupportPage from "@/pages/SupportPage";
import InvoicesPage from "@/pages/InvoicesPage";
import HomePage from "@/pages/HomePage";
import CategoriesPage from "@/pages/CategoriesPage";
import CartPage from "@/pages/CartPage";
import OrganizationsPage from "@/pages/OrganizationsPage";
import ArchivePage from "@/pages/ArchivePage";
import TicketTrackingPage from "@/pages/TicketTrackingPage";
import PricingDiscountsPage from "@/pages/PricingDiscountsPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();
  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/home" replace /> : <LoginPage />
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
        <Route path="orders" element={<OrdersPage />} />
        <Route path="orders/:id" element={<OrderDetailsPage />} />
        <Route path="vendors" element={<VendorsPage />} />
        <Route path="vendors/categories" element={<VendorCategoriesPage />} />
        <Route path="vendors/onboarding" element={<VendorOnboardingPage />} />
        <Route path="vendors/:id" element={<VendorDetailPage />} />
        <Route path="clients" element={<ClientsPage />} />
        <Route path="clients/add" element={<AddClient />} />
        <Route path="clients/:id" element={<ClientDetailPage />} />
        <Route path="clients/contracts" element={<ClientsPage />} />
        <Route path="permissions" element={<PermissionsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="configuration" element={<ConfigurationHubPage />} />
        <Route path="configuration/general" element={<ConfigurationPage />} />
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
        <Route path="integrations" element={<IntegrationsPage />} />
        <Route path="reports" element={<MainDashboard />} />
        <Route path="reports/audit" element={<AuditTrailPage />} />
        <Route path="shop" element={<OrdersPage />} />
        <Route path="shop/cart" element={<CartPage />} />
        <Route path="services" element={<MainDashboard />} />
        <Route path="support" element={<SupportPage />} />
        <Route path="transactions" element={<AuditTrailPage />} />
        <Route path="invoices" element={<InvoicesPage />} />
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
