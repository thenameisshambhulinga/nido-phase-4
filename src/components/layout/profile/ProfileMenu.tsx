import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronDown,
  User,
  Building2,
  Palette,
  LogOut,
  Repeat,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import EnterpriseSettingsPanel from "../enterprise/EnterpriseSettingsPanel";
import OrganizationSwitcher from "../organization/OrganizationSwitcher";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/I18nProvider";

export default function ProfileMenu() {
  const { user, logout } = useAuth();
  const { currentOrganization } = useOrganization();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [orgSwitcherOpen, setOrgSwitcherOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    });
    return () => {
      document.removeEventListener("mousedown", handler);
    };
  }, [menuOpen]);

  return (
    <>
      <div ref={menuRef} className="relative inline-flex items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMenuOpen(!menuOpen)}
          className={cn(
            "flex items-center gap-1.5 h-9 pl-1.5 pr-2 rounded-full transition-all duration-200",
            "bg-white/95 backdrop-blur-sm border border-border/60 shadow-sm",
            "hover:bg-white hover:shadow-md hover:scale-[1.02]",
            "active:scale-[0.98]",
            menuOpen ? "ring-2 ring-primary/30 shadow-md" : "",
          )}
        >
          <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center">
            <User className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
              menuOpen ? "rotate-180" : "",
            )}
          />
        </Button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-[99]" onClick={closeMenu} />
            <div className="absolute top-full right-0 mt-2 z-[100] animate-in fade-in-0 zoom-in-95 duration-150 origin-top-right">
              <div className="w-56 rounded-xl border border-border/80 bg-popup shadow-xl overflow-hidden">
                <div className="p-1.5 space-y-0.5">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2.5 h-9 text-sm rounded-lg font-medium"
                    onClick={() => {
                      closeMenu();
                      setTimeout(() => setSettingsOpen(true), 150);
                    }}
                  >
                    <Palette className="h-4 w-4" />
                    <span className="flex-1 text-left">
                      {t("settings.appearance")}
                    </span>
                  </Button>

                  {/* Full-screen Organizations page (NOT a modal) */}
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2.5 h-9 text-sm rounded-lg font-medium"
                    onClick={() => {
                      closeMenu();
                      setTimeout(() => navigate("/organizations"), 50);
                    }}
                  >
                    <Building2 className="h-4 w-4" />
                    <span className="flex-1 text-left">
                      {t("common.organizations")}
                    </span>
                  </Button>

                  {/* Organization Switcher - Opens premium modal */}
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2.5 h-9 text-sm rounded-lg font-medium"
                    onClick={() => {
                      closeMenu();
                      setTimeout(() => setOrgSwitcherOpen(true), 150);
                    }}
                  >
                    <Repeat className="h-4 w-4" />
                    <span className="flex-1 text-left">
                      {t("nav.organizations") || "Switch Organization"}
                    </span>
                  </Button>

                  {currentOrganization && (
                    <div className="px-3 py-2 text-xs text-muted-foreground bg-muted/50 rounded-lg mx-1">
                      <p className="font-medium text-foreground">
                        {currentOrganization.name}
                      </p>
                      <p className="text-[10px] mt-0.5">
                        {t("common.organizations")}: Active
                      </p>
                    </div>
                  )}

                  <div className="my-1 border-t border-border/60" />
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2.5 h-9 text-sm rounded-lg font-medium text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      closeMenu();
                      logout();
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="flex-1 text-left">
                      {t("common.logout")}
                    </span>
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      <EnterpriseSettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
      <OrganizationSwitcher
        open={orgSwitcherOpen}
        onClose={() => setOrgSwitcherOpen(false)}
      />
    </>
  );
}
