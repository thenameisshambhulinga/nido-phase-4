import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
<<<<<<< HEAD
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import Sidebar from "@/components/layout/Sidebar";
import FloatingCartButton from "@/components/layout/FloatingCartButton";

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  return (
    <div className="h-screen overflow-hidden bg-background text-foreground">
      <div className="flex h-full w-full overflow-hidden">
        {/* Sidebar */}
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-out",
            isMobile
              ? sidebarOpen
                ? "translate-x-0"
                : "-translate-x-full"
              : "translate-x-0",
          )}
        >
          <Sidebar
            onClose={() => setSidebarOpen(false)}
            isMobile={isMobile}
            collapsed={sidebarCollapsed}
            onCollapseChange={setSidebarCollapsed}
          />
        </div>

        {/* Mobile Overlay */}
        {isMobile && sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div
          className={cn(
            "relative flex min-w-0 flex-1 flex-col overflow-hidden transition-all duration-300",
            isMobile ? "ml-0" : sidebarCollapsed ? "ml-20" : "ml-72",
          )}
        >
          {/* Mobile Toggle */}
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="fixed left-4 top-4 z-[60] flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card shadow-lg backdrop-blur-md transition-all hover:scale-[1.02] active:scale-95"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}

          {/* Scroll Container */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="min-h-full w-full">
              <div className="mx-auto w-full max-w-[1800px] px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
                <Outlet />
              </div>
            </div>
          </div>

          <FloatingCartButton />
        </div>
      </div>
=======
import Sidebar from "./Sidebar";
import FloatingCartButton from "./FloatingCartButton";
import { useIsMobile } from "@/hooks/use-mobile";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useData } from "@/contexts/DataContext";
import { applyBrandTheme } from "@/lib/theme";

export default function AppLayout() {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { organizations, generalSettings } = useData();

  useEffect(() => {
    const primaryOrgId = organizations[0]?.id || "";
    applyBrandTheme(generalSettings[primaryOrgId]?.primaryColor);
  }, [generalSettings, organizations]);

  return (
    <div className="relative flex min-h-screen bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1400px_540px_at_-10%_-20%,rgba(14,165,233,0.08),transparent_54%),radial-gradient(1200px_580px_at_110%_-30%,rgba(16,185,129,0.07),transparent_56%)]" />
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/30 backdrop-blur-sm z-30 animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed top-0 left-0 z-40 h-screen transition-transform duration-300 ease-out",
          isMobile
            ? sidebarOpen
              ? "translate-x-0"
              : "-translate-x-full"
            : "translate-x-0",
        )}
      >
        <Sidebar
          onClose={() => setSidebarOpen(false)}
          isMobile={isMobile}
          collapsed={sidebarCollapsed}
          onCollapseChange={setSidebarCollapsed}
        />
      </div>

      {/* Main content */}
      <main
        className={cn(
          "relative z-10 flex-1 transition-[margin] duration-300 ease-out",
          isMobile ? "ml-0" : sidebarCollapsed ? "ml-16" : "ml-60",
        )}
      >
        {/* Mobile hamburger */}
        {isMobile && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="fixed top-3 left-3 z-50 h-10 w-10 rounded-lg bg-card border border-border shadow-md flex items-center justify-center hover:bg-accent active:scale-95 transition-all"
          >
            <Menu className="h-5 w-5 text-foreground" />
          </button>
        )}
        <div className="animate-fade-in">
          <Outlet />
        </div>
        <FloatingCartButton />
      </main>
>>>>>>> 67d1e15f2fd66c27748766bdee559c6aee16d96e
    </div>
  );
}
