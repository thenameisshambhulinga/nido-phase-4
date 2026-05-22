import { useEffect, useState, view } from "react";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import Sidebar from "@/components/layout/Sidebar";
import FloatingCart from "@/components/shared/FloatingCart";
import Header from "@/components/layout/Header";
import { PageMetaProvider } from "@/contexts/PageMetaContext";

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!isMobile) setSidebarOpen(false);
  }, [isMobile]);

  return (
    <div className="h-screen w-screen overflow-hidden bg-background text-foreground">
      <div className="flex h-full w-full overflow-hidden">
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex-shrink-0 transition-transform duration-300 ease-out",
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
        {isMobile && sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <div
          className={cn(
            "flex min-w-0 flex-1 flex-col overflow-hidden transition-all duration-300",
            isMobile ? "ml-0" : sidebarCollapsed ? "ml-16" : "ml-60",
          )}
        >
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="fixed left-4 top-4 z-[60] flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card shadow-lg backdrop-blur-md transition-all hover:scale-[1.02] active:scale-95"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="min-h-full w-full">
              <PageMetaProvider>
                <Header />
                {/* Workspace: full width (no centered max-width wrappers).
                   Dialogs/modals should be constrained; pages should occupy the full content region. */}
                <div className="w-full">
                  <Outlet />
                </div>
              </PageMetaProvider>
            </div>
          </div>
          <FloatingCart />
        </div>
      </div>
    </div>
  );
}
