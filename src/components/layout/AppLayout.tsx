import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useIsMobile } from "@/hooks/use-mobile";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AppLayout() {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
        <Sidebar onClose={() => setSidebarOpen(false)} isMobile={isMobile} />
      </div>

      {/* Main content */}
      <main
        className={cn(
          "relative z-10 flex-1 transition-[margin] duration-300 ease-out",
          isMobile ? "ml-0" : "ml-60",
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
      </main>
    </div>
  );
}
