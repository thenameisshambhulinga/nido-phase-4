import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Search,
  Clock,
  Users,
  CheckCircle2,
  Loader2,
  X,
  Sparkles,
  Briefcase,
  Globe,
} from "lucide-react";
import {
  useOrganization,
  OrganizationInfo,
} from "@/contexts/OrganizationContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface OrganizationSwitcherProps {
  open: boolean;
  onClose: () => void;
}

// Skeleton loader for organization card
const OrgCardSkeleton = () => (
  <div className="animate-pulse">
    <div className="flex items-center gap-4 p-4">
      <div className="h-14 w-14 rounded-2xl bg-muted" />
      <div className="flex-1 space-y-2">
        <div className="h-5 w-32 rounded bg-muted" />
        <div className="h-4 w-24 rounded bg-muted" />
      </div>
    </div>
  </div>
);

export default function OrganizationSwitcher({
  open,
  onClose,
}: OrganizationSwitcherProps) {
  const navigate = useNavigate();
  const {
    accessibleOrganizations,
    currentOrganization,
    switchOrganization,
    recentOrganizations,
    isSwitching,
  } = useOrganization();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Focus search on open
  useEffect(() => {
    if (open) {
      setSelectedOrgId(
        currentOrganization?.id || accessibleOrganizations[0]?.id || null,
      );
      setTimeout(() => searchRef.current?.focus(), 100);
    }
  }, [open, currentOrganization?.id, accessibleOrganizations]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Filter organizations by search
  const filteredOrganizations = useMemo(() => {
    if (!searchQuery.trim()) return accessibleOrganizations;
    const query = searchQuery.toLowerCase();
    return accessibleOrganizations.filter(
      (org) =>
        org.name.toLowerCase().includes(query) ||
        org.industry?.toLowerCase().includes(query),
    );
  }, [accessibleOrganizations, searchQuery]);

  const selectedOrganization = useMemo(() => {
    return (
      accessibleOrganizations.find((org) => org.id === selectedOrgId) || null
    );
  }, [accessibleOrganizations, selectedOrgId]);

  // Handle organization selection
  const handleSwitch = useCallback(() => {
    if (isSwitching || !selectedOrganization) return;
    switchOrganization(selectedOrganization.id);
    setTimeout(onClose, 220);
  }, [isSwitching, onClose, selectedOrganization, switchOrganization]);

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  // Generate consistent color from org name
  const getAvatarColor = (name: string) => {
    const colors = [
      "from-blue-500 to-indigo-600",
      "from-emerald-500 to-teal-600",
      "from-purple-500 to-pink-600",
      "from-orange-500 to-red-600",
      "from-cyan-500 to-blue-600",
      "from-violet-500 to-purple-600",
    ];
    const index = name
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  // Render organization card
  const renderOrgCard = (
    org: OrganizationInfo,
    isSelected: boolean,
    isRecent: boolean = false,
  ) => (
    <button
      key={org.id}
      onClick={() => setSelectedOrgId(org.id)}
      disabled={isSwitching}
      className={cn(
        "group relative w-full text-left rounded-2xl border p-4 transition-all duration-300",
        "hover:scale-[1.01] hover:shadow-lg hover:shadow-primary/5",
        "active:scale-[0.99]",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
        isSelected || selectedOrgId === org.id
          ? "border-primary/30 bg-primary/5 shadow-lg shadow-primary/10"
          : "border-border/60 bg-card hover:border-border",
        isSwitching && "pointer-events-none opacity-50",
      )}
    >
      {/* Selected indicator */}
      {(isSelected || selectedOrgId === org.id) && (
        <div className="absolute right-3 top-3">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20">
            <CheckCircle2 className="h-4 w-4 text-primary" />
          </div>
        </div>
      )}

      {/* Switching overlay */}
      {isSwitching && isSelected && (
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-background/80 backdrop-blur-sm">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div
          className={cn(
            "relative flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br shadow-sm ring-2 ring-border/20",
            getAvatarColor(org.name),
            isSelected && "ring-2 ring-primary/30",
          )}
        >
          {org.logo ? (
            <img
              src={org.logo}
              alt={org.name}
              className="h-full w-full rounded-2xl object-cover"
            />
          ) : (
            <span className="text-sm font-bold text-white">
              {getInitials(org.name)}
            </span>
          )}

          {/* Status indicator */}
          {org.status && (
            <div
              className={cn(
                "absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-card",
                org.status === "active"
                  ? "bg-green-500"
                  : org.status === "pending"
                    ? "bg-yellow-500"
                    : "bg-gray-400",
              )}
            />
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold text-foreground">
              {org.name}
            </h3>
            {isRecent && (
              <span className="flex h-5 items-center gap-1 rounded-full bg-primary/10 px-2 text-[10px] font-medium text-primary">
                <Clock className="h-3 w-3" />
                Recent
              </span>
            )}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-2">
            {org.industry && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Briefcase className="h-3 w-3" />
                {org.industry}
              </span>
            )}
            {org.memberCount !== undefined && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                {org.memberCount} members
              </span>
            )}
          </div>

          {org.lastActive && (
            <p className="mt-1 text-[10px] text-muted-foreground/60">
              Last active: {org.lastActive}
            </p>
          )}
        </div>
      </div>

      {/* Hover glow effect */}
      <div
        className={cn(
          "absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300",
          "bg-gradient-to-r from-primary/5 to-transparent",
          "group-hover:opacity-100",
        )}
      />
    </button>
  );

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        ref={containerRef}
        className={cn(
          "fixed left-1/2 top-1/2 z-[101] w-full max-w-[720px] -translate-x-1/2 -translate-y-1/2 px-3",
          "animate-in fade-in-0 zoom-in-95 duration-200 origin-center",
          // prevent clipping in any parent
          "overflow-hidden",
        )}
      >
        <div
          className="relative overflow-hidden rounded-[28px] border border-border/60 bg-white/95 shadow-[0_28px_90px_-42px_rgba(15,23,42,0.35)] backdrop-blur-2xl"
          style={{ maxHeight: "85vh" }}
        >
          {/* Header */}
          <div className="relative border-b border-border/40 bg-gradient-to-r from-blue-50 via-transparent to-cyan-50 p-5">
            <div className="absolute right-4 top-4">
              <button
                onClick={onClose}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-xl",
                  "text-muted-foreground transition-all hover:bg-muted hover:text-foreground",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                )}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold tracking-tight">
                  Select Organization
                </h2>
                <p className="text-xs text-muted-foreground">
                  Choose your workspace organization
                </p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={searchRef}
                placeholder="Search organizations"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 rounded-xl border-border/60 bg-muted/50 pl-11 pr-4 shadow-inner transition-all focus:border-primary/50 focus:bg-background focus:shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="max-h-[72vh] overflow-y-auto p-4 pt-0">
            {/* Recent Organizations */}
            {!searchQuery && recentOrganizations.length > 0 && (
              <div className="mb-6">
                <div className="mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Recent
                  </h3>
                </div>
                <div className="grid gap-3">
                  {recentOrganizations
                    .slice(0, 3)
                    .map((org) =>
                      renderOrgCard(
                        org,
                        currentOrganization?.id === org.id,
                        true,
                      ),
                    )}
                </div>
              </div>
            )}

            {/* All Organizations */}
            <div>
              {!searchQuery && recentOrganizations.length > 0 && (
                <div className="mb-3 flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    All Organizations
                  </h3>
                </div>
              )}

              {filteredOrganizations.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <Building2 className="h-8 w-8 text-muted-foreground/40" />
                  </div>
                  <h3 className="mb-1 font-medium text-foreground">
                    No organizations found
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {searchQuery
                      ? "Try adjusting your search query"
                      : "You don't have access to any organizations"}
                  </p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {filteredOrganizations.map((org) =>
                    renderOrgCard(org, currentOrganization?.id === org.id),
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-border/40 bg-white/90 p-4 backdrop-blur-xl">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/50 bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5" />
                <span>
                  {accessibleOrganizations.length} organization
                  {accessibleOrganizations.length !== 1 ? "s" : ""} available
                </span>
              </div>
              {currentOrganization && (
                <div className="flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs text-blue-700">
                  <span className="font-medium">Active:</span>
                  <span>{currentOrganization.name}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="rounded-xl border-border/60"
                  onClick={() => navigate("/organizations")}
                >
                  Register Organization
                </Button>
                <Button
                  variant="ghost"
                  className="rounded-xl"
                  onClick={onClose}
                >
                  Cancel
                </Button>
              </div>
              <Button
                className="rounded-xl bg-blue-600 px-5 text-white shadow-sm hover:bg-blue-700"
                onClick={handleSwitch}
                disabled={!selectedOrganization || isSwitching}
              >
                {isSwitching ? "Switching..." : "Switch Organization"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
