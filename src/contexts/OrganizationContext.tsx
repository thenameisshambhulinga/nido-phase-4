import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { safeReadJson } from "@/lib/storage";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";

export interface OrganizationInfo {
  id: string;
  name: string;
  industry?: string;
  memberCount?: number;
  status?: "active" | "inactive" | "pending";
  lastActive?: string;
  logo?: string;
}

interface OrganizationContextType {
  // All organizations user has access to
  accessibleOrganizations: OrganizationInfo[];
  setAccessibleOrganizations: (orgs: OrganizationInfo[]) => void;

  // Current active organization
  currentOrganization: OrganizationInfo | null;
  setCurrentOrganization: (org: OrganizationInfo | null) => void;

  // Organization switching
  switchOrganization: (orgId: string) => void;
  isSwitching: boolean;

  // Recent organizations for quick switching
  recentOrganizations: OrganizationInfo[];
  addToRecent: (org: OrganizationInfo) => void;

  // Loading state
  isLoading: boolean;

  // Check if user has access to a specific organization
  hasOrgAccess: (orgId: string) => boolean;

  // Check if current org matches a given org
  isCurrentOrg: (orgId: string) => boolean;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(
  undefined,
);

const MAX_RECENT_ORGS = 5;
const RECENT_ORGS_KEY = "nido_recent_organizations";

// Load recent organizations from storage
const loadRecentOrganizations = (): OrganizationInfo[] => {
  try {
    const stored = localStorage.getItem(RECENT_ORGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Ignore parse errors
  }
  return [];
};

// Save recent organizations to storage
const saveRecentOrganizations = (orgs: OrganizationInfo[]) => {
  try {
    localStorage.setItem(
      RECENT_ORGS_KEY,
      JSON.stringify(orgs.slice(0, MAX_RECENT_ORGS)),
    );
  } catch {
    // Ignore storage errors
  }
};

export const OrganizationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const { clients } = useData();

  // Accessible organizations - loaded from user data or backend
  const [accessibleOrganizations, setAccessibleOrganizations] = useState<
    OrganizationInfo[]
  >(() => {
    return safeReadJson<OrganizationInfo[]>("nido_accessible_orgs", []);
  });

  // Current active organization
  const [currentOrganization, setCurrentOrganizationState] =
    useState<OrganizationInfo | null>(() => {
      return safeReadJson<OrganizationInfo | null>("nido_current_org", null);
    });

  // Recent organizations
  const [recentOrganizations, setRecentOrganizations] = useState<
    OrganizationInfo[]
  >(() => {
    return loadRecentOrganizations();
  });

  // Loading state during organization switch
  const [isSwitching, setIsSwitching] = useState(false);

  // Persist accessible organizations
  useEffect(() => {
    localStorage.setItem(
      "nido_accessible_orgs",
      JSON.stringify(accessibleOrganizations),
    );
  }, [accessibleOrganizations]);

  // Persist current organization
  useEffect(() => {
    if (currentOrganization) {
      localStorage.setItem(
        "nido_current_org",
        JSON.stringify(currentOrganization),
      );
    } else {
      localStorage.removeItem("nido_current_org");
    }
  }, [currentOrganization]);

  // Persist recent organizations
  useEffect(() => {
    saveRecentOrganizations(recentOrganizations);
  }, [recentOrganizations]);

  // Set current organization with loading state
  const setCurrentOrganization = useCallback((org: OrganizationInfo | null) => {
    setIsSwitching(true);
    setCurrentOrganizationState(org);

    // Add to recent if switching to a real org
    if (org) {
      setRecentOrganizations((prev) => {
        const filtered = prev.filter((o) => o.id !== org.id);
        return [org, ...filtered].slice(0, MAX_RECENT_ORGS);
      });
    }

    // Simulate brief loading for smooth transition
    setTimeout(() => setIsSwitching(false), 300);
  }, []);

  // Switch to a different organization by ID
  const switchOrganization = useCallback(
    (orgId: string) => {
      const org = accessibleOrganizations.find((o) => o.id === orgId);
      if (org) {
        setCurrentOrganization(org);
      }
    },
    [accessibleOrganizations, setCurrentOrganization],
  );

  // Add an organization to recent list
  const addToRecent = useCallback((org: OrganizationInfo) => {
    setRecentOrganizations((prev) => {
      const filtered = prev.filter((o) => o.id !== org.id);
      return [org, ...filtered].slice(0, MAX_RECENT_ORGS);
    });
  }, []);

  // Check if user has access to an organization
  const hasOrgAccess = useCallback(
    (orgId: string) => {
      return accessibleOrganizations.some((org) => org.id === orgId);
    },
    [accessibleOrganizations],
  );

  // Check if a given org is the current one
  const isCurrentOrg = useCallback(
    (orgId: string) => {
      return currentOrganization?.id === orgId;
    },
    [currentOrganization],
  );

  // Initialize accessible organizations from clients data
  useEffect(() => {
    const loadOrgs = () => {
      const storedOrgs = safeReadJson<OrganizationInfo[]>(
        "nido_accessible_orgs",
        [],
      );

      if (storedOrgs.length > 0) {
        setAccessibleOrganizations(storedOrgs);
        if (!currentOrganization) setCurrentOrganization(storedOrgs[0]);
        return;
      }

      // Seed from clients data (NO DUMMY / NO RANDOM IDS)
      if (clients && clients.length > 0) {
        const orgsFromClients: OrganizationInfo[] = clients
          .slice(0, 10)
          .map((client: any) => {
            const stableId = String(
              client.id ??
                client.companyId ??
                client.company_name ??
                client.name ??
                "",
            );
            // If we truly cannot find a stable id, skip this record instead of generating dummy/random.
            if (!stableId || stableId === "undefined" || stableId === "null")
              return null;

            return {
              id: stableId,
              name: client.name || client.companyName || "Unnamed Organization",
              industry: client.industry || "",
              status: (client.status === "active" ? "active" : "inactive") as
                | "active"
                | "inactive"
                | "pending",
              memberCount:
                client.memberCount ?? client.membersCount ?? undefined,
              lastActive: client.lastActive ?? undefined,
              logo: client.logo ?? undefined,
            } as OrganizationInfo;
          })
          .filter(Boolean) as OrganizationInfo[];

        if (orgsFromClients.length > 0) {
          setAccessibleOrganizations(orgsFromClients);
          if (!currentOrganization) setCurrentOrganization(orgsFromClients[0]);
        }
      } else if (user?.organization) {
        // Fallback to user organization (stable id)
        const userOrg: OrganizationInfo = {
          id: String(user.organization),
          name: String(user.organization),
          status: "active",
        };
        setAccessibleOrganizations([userOrg]);
        if (!currentOrganization) setCurrentOrganization(userOrg);
      }
    };

    loadOrgs();
    // Note: intentionally do NOT depend on accessibleOrganizations.length to avoid re-seeding loops.
    // currentOrganization is used to decide whether to set the initial org.
  }, [user, clients, currentOrganization]);

  const value = useMemo(
    () => ({
      accessibleOrganizations,
      setAccessibleOrganizations,
      currentOrganization,
      setCurrentOrganization,
      switchOrganization,
      isSwitching,
      recentOrganizations,
      addToRecent,
      isLoading: isSwitching,
      hasOrgAccess,
      isCurrentOrg,
    }),
    [
      accessibleOrganizations,
      currentOrganization,
      switchOrganization,
      isSwitching,
      recentOrganizations,
      addToRecent,
      hasOrgAccess,
      isCurrentOrg,
    ],
  );

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
};

// Format organization name from ID for display
const formatOrgName = (orgId: string): string => {
  if (!orgId) return "Unknown Organization";
  // Convert camelCase or kebab-case to space-separated words
  return orgId
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

export const useOrganization = () => {
  const ctx = useContext(OrganizationContext);
  if (!ctx) {
    throw new Error("useOrganization must be used within OrganizationProvider");
  }
  return ctx;
};

// Hook for checking if current user is a client role (non-owner, non-admin internal)
export const useIsClientRole = () => {
  const { user } = useAuth();
  const { clients } = useData();
  return useMemo(() => {
    if (!user) return false;
    const role = user.role?.toLowerCase() || "";
    return (
      role.startsWith("client_") ||
      role === "client_admin" ||
      role === "client_employee"
    );
  }, [user?.role]);
};

// Hook to get organization-filtered data
export const useOrganizationFilteredData = <
  T extends { organization?: string; clientId?: string },
>(
  data: T[],
  idField: "organization" | "clientId" = "organization",
): T[] => {
  const { currentOrganization } = useOrganization();

  return useMemo(() => {
    if (!currentOrganization) return data;
    return data.filter((item) => item[idField] === currentOrganization.id);
  }, [data, currentOrganization, idField]);
};
