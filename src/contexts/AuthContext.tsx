import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { safeReadJson } from "@/lib/storage";
import { apiBaseUrl, apiRequest } from "@/lib/api";
import { isValidEmail, normalizeEmail } from "@/lib/validation";

export type UserRole =
  | "owner"
  | "admin"
  | "procurement_manager"
  | "accounts_payable"
  | "vendor_admin"
  | "employee"
  | "vendor"
  | "client_admin"
  | "client_employee";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  organization?: string;
  status: "active" | "inactive" | "suspended";
  createdAt: string;
  modules?: string[];
  jobTitle?: string;
  department?: string;
}

interface AuthContextType {
  user: User | null;
  users: User[];
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (data: Partial<User> & { password: string }) => Promise<boolean>;
  logout: () => void;
  createUser: (data: Partial<User>) => Promise<{
    user?: User;
    credentials?: {
      username: string;
      email: string;
      temporaryPassword: string;
    };
  } | null>;
  updateUser: (id: string, data: Partial<User>) => Promise<boolean>;
  deleteUser: (id: string) => Promise<boolean>;
  hasPermission: (module: string, action: string) => boolean;
  isOwner: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_USERS: User[] = [
  {
    id: "owner-1",
    email: "owner@nidotech.com",
    name: "System Owner",
    role: "owner",
    organization: "Nido Tech",
    status: "active",
    createdAt: "2025-01-01",
    modules: ["all"],
  },
  {
    id: "admin-1",
    email: "admin@nidotech.com",
    name: "Mark Adams",
    role: "admin",
    organization: "Nido Tech",
    status: "active",
    createdAt: "2025-02-01",
    modules: [
      "dashboard",
      "shop",
      "vendors",
      "procure",
      "reports",
      "configuration",
    ],
  },
  {
    id: "pm-1",
    email: "procurement@nidotech.com",
    name: "Jane Smith",
    role: "procurement_manager",
    organization: "Nido Tech",
    status: "active",
    createdAt: "2025-03-01",
    modules: ["dashboard", "shop", "vendors", "procure"],
  },
  {
    id: "ap-1",
    email: "ap@nidotech.com",
    name: "David Chen",
    role: "accounts_payable",
    organization: "Nido Tech",
    status: "active",
    createdAt: "2025-03-15",
    modules: ["dashboard", "clients", "reports"],
  },
  {
    id: "vendor-1",
    email: "vendor@apex.com",
    name: "Vendor User",
    role: "vendor",
    organization: "Apex Tech Solutions",
    status: "active",
    createdAt: "2025-04-01",
    modules: ["dashboard", "vendors"],
  },
  {
    id: "client-admin-1",
    email: "clientadmin@corp.com",
    name: "Client Admin",
    role: "client_admin",
    organization: "Apex Tech Solutions",
    status: "active",
    createdAt: "2025-04-15",
    modules: ["dashboard", "shop", "procure"],
  },
];

const ROLE_PERMISSIONS: Record<UserRole, Record<string, string[]>> = {
  owner: { all: ["view", "edit", "delete", "approve", "configure"] },
  admin: {
    dashboard: ["view", "edit"],
    shop: ["view", "edit"],
    vendors: ["view", "edit", "approve"],
    procure: ["view", "edit", "approve"],
    clients: ["view", "edit"],
    reports: ["view"],
    configuration: ["view", "edit"],
    user_info: ["view", "edit"],
    permissions: ["view", "edit"],
  },
  procurement_manager: {
    dashboard: ["view"],
    shop: ["view", "edit"],
    vendors: ["view"],
    procure: ["view", "edit", "approve"],
  },
  accounts_payable: {
    dashboard: ["view"],
    clients: ["view", "edit"],
    reports: ["view"],
  },
  vendor_admin: {
    dashboard: ["view"],
    vendors: ["view", "edit"],
  },
  employee: {
    dashboard: ["view"],
    shop: ["view"],
  },
  vendor: {
    dashboard: ["view"],
    vendors: ["view"],
  },
  client_admin: {
    dashboard: ["view"],
    orders: ["view", "create", "edit", "approve"],
    shop: ["view", "edit"],
    procure: ["view", "approve"],
    inventory: ["view"],
  },
  client_employee: {
    dashboard: ["view"],
    orders: ["view", "create"],
    shop: ["view"],
    inventory: ["view"],
    notifications: ["view"],
  },
};

const toFrontendRole = (role?: string): UserRole => {
  const normalized = String(role || "").toUpperCase();
  if (normalized === "OWNER") return "owner";
  if (normalized === "INTERNAL_EMPLOYEE") return "admin";
  if (normalized === "CLIENT_ADMIN") return "client_admin";
  if (normalized === "CLIENT_USER") return "client_employee";
  return String(role || "employee").toLowerCase() as UserRole;
};

const toFrontendUser = (user: any): User => ({
  id: String(user.id || user._id || `user-${Date.now()}`),
  email: String(user.email || ""),
  name: String(user.name || user.fullName || ""),
  role: toFrontendRole(user.role),
  avatar: user.avatar,
  organization: user.organization || user.companyId || "",
  status: String(user.status || "active").toLowerCase() as User["status"],
  createdAt: user.createdAt || new Date().toISOString(),
  modules: user.modules,
  jobTitle: user.jobTitle,
  department: user.department,
});

const toBackendRole = (role?: string) => {
  const normalized = String(role || "employee").toLowerCase();
  if (normalized === "owner") return "OWNER";
  if (normalized === "admin") return "INTERNAL_EMPLOYEE";
  if (normalized === "client_admin") return "CLIENT_ADMIN";
  if (normalized === "client_employee") return "CLIENT_USER";
  return "INTERNAL_EMPLOYEE";
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof localStorage === "undefined") return null;
    return localStorage.getItem("nido_auth_token");
  });
  const [user, setUser] = useState<User | null>(() => {
    const parsed = safeReadJson<User | null>("nido_user", null);
    return parsed && typeof parsed === "object" ? parsed : null;
  });

  const [users, setUsers] = useState<User[]>(() => {
    const parsed = safeReadJson<User[]>("nido_users", DEFAULT_USERS);
    return Array.isArray(parsed) ? parsed : DEFAULT_USERS;
  });

  useEffect(() => {
    if (user) localStorage.setItem("nido_user", JSON.stringify(user));
    else localStorage.removeItem("nido_user");
  }, [user]);

  useEffect(() => {
    if (!token) {
      localStorage.removeItem("nido_auth_token");
      return;
    }
    localStorage.setItem("nido_auth_token", token);
  }, [token]);

  useEffect(() => {
    localStorage.setItem("nido_users", JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (!token) return;
    void (async () => {
      try {
        const current = await apiRequest<any>("/auth/me");
        setUser(toFrontendUser(current));
        const remoteUsers = await apiRequest<any[]>("/auth/users");
        setUsers(remoteUsers.map(toFrontendUser));
      } catch (error) {
        console.warn("Auth refresh failed:", error);
      }
    })();
  }, [token]);

  const login = useCallback(async (email: string, password: string) => {
    const normalizedEmail = normalizeEmail(email);
    if (!isValidEmail(normalizedEmail) || !password) {
      console.warn("[Auth] Invalid email or password validation failed", {
        email: normalizedEmail,
        isValidEmail: isValidEmail(normalizedEmail),
        hasPassword: !!password,
      });
      return false;
    }

    try {
      console.log("[Auth] Attempting login to", `${apiBaseUrl}/auth/login`);

      const response = await fetch(`${apiBaseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, password }),
      });

      let payload: any;
      try {
        payload = await response.json();
      } catch (parseError) {
        console.error("[Auth] Failed to parse login response:", parseError, {
          status: response.status,
          statusText: response.statusText,
        });
        return false;
      }

      if (!response.ok) {
        console.error("[Auth] Login failed with status", response.status, {
          error: payload?.error,
          message: payload?.message,
        });
        return false;
      }

      const token = payload?.data?.token;
      const userData = payload?.data?.user;

      if (!token || !userData) {
        console.error("[Auth] Login response missing token or user", {
          payload,
        });
        return false;
      }

      setToken(token);
      const nextUser = toFrontendUser(userData);
      setUser(nextUser);

      console.log("[Auth] Login successful", {
        userId: userData.id,
        email: userData.email,
        role: userData.role,
      });

      // Fetch remote users list
      try {
        const remoteUsers = await apiRequest<any[]>("/auth/users");
        setUsers(remoteUsers.map(toFrontendUser));
      } catch (error) {
        console.warn("[Auth] Failed to fetch users list after login:", error);
        // Don't fail login if users list fetch fails
      }

      return true;
    } catch (error) {
      console.error("[Auth] Login error:", error);
      return false;
    }
  }, []);

  const signup = useCallback(
    async (data: Partial<User> & { password: string }) => {
      if (!user || user.role !== "owner") return false;
      await createUser(data);
      return true;
    },
    [user],
  );

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("nido_auth_token");
  }, []);

  const createUser = useCallback(async (data: Partial<User>) => {
    if (!data.email || !isValidEmail(data.email)) {
      throw new Error("Invalid email format");
    }

    try {
      const response = await apiRequest<any>("/auth/users", {
        method: "POST",
        body: {
          name: data.name,
          role: toBackendRole(data.role),
          companyId: data.organization,
          permissions: {},
          email: normalizeEmail(data.email),
        },
      });
      if (response?.user) {
        setUsers((prev) => [...prev, toFrontendUser(response.user)]);
        return {
          user: toFrontendUser(response.user),
          credentials: response.credentials,
        };
      }
      return null;
    } catch (error) {
      console.error("Create user failed:", error);
      return null;
    }
  }, []);

  const updateUser = useCallback(async (id: string, data: Partial<User>) => {
    try {
      const response = await apiRequest<any>(`/auth/users/${id}`, {
        method: "PUT",
        body: {
          name: data.name,
          role: data.role ? toBackendRole(data.role) : undefined,
          companyId: data.organization,
          permissions: data.modules ? { modules: data.modules } : undefined,
          status: data.status,
        },
      });
      if (response?.data) {
        const updated = toFrontendUser(response.data);
        setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
        setUser((prev) => (prev && prev.id === id ? updated : prev));
      }
      return true;
    } catch (error) {
      console.error("Update user failed:", error);
      return false;
    }
  }, []);

  const deleteUser = useCallback(async (id: string) => {
    try {
      await apiRequest(`/auth/users/${id}`, { method: "DELETE" });
      setUsers((prev) => prev.filter((u) => u.id !== id));
      return true;
    } catch (error) {
      console.error("Delete user failed:", error);
      return false;
    }
  }, []);

  const hasPermission = useCallback(
    (module: string, action: string) => {
      if (!user) return false;
      if (user.role === "owner") return true;
      const perms = ROLE_PERMISSIONS[user.role];
      if (!perms) return false;
      if (perms.all) return perms.all.includes(action);
      return perms[module]?.includes(action) || false;
    },
    [user],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        users,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        createUser,
        updateUser,
        deleteUser,
        hasPermission,
        isOwner: user?.role === "owner",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
