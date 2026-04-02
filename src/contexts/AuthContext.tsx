import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { safeReadJson } from "@/lib/storage";

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
  createUser: (data: Partial<User>) => void;
  updateUser: (id: string, data: Partial<User>) => void;
  deleteUser: (id: string) => void;
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
    shop: ["view", "edit"],
    procure: ["view", "approve"],
  },
  client_employee: {
    dashboard: ["view"],
    shop: ["view"],
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(() =>
    safeReadJson<User | null>("nido_user", null),
  );

  const [users, setUsers] = useState<User[]>(() =>
    safeReadJson<User[]>("nido_users", DEFAULT_USERS),
  );

  useEffect(() => {
    if (user) localStorage.setItem("nido_user", JSON.stringify(user));
    else localStorage.removeItem("nido_user");
  }, [user]);

  useEffect(() => {
    localStorage.setItem("nido_users", JSON.stringify(users));
  }, [users]);

  const login = useCallback(
    async (email: string, _password: string) => {
      // Check current users list first, then fall back to defaults
      let found = users.find((u) => u.email === email && u.status === "active");
      if (!found) {
        found = DEFAULT_USERS.find(
          (u) => u.email === email && u.status === "active",
        );
        if (found) {
          // Re-add default user if missing from persisted list
          setUsers((prev) => {
            const exists = prev.some((u) => u.id === found!.id);
            return exists ? prev : [...prev, found!];
          });
        }
      }
      if (found) {
        setUser(found);
        return true;
      }
      return false;
    },
    [users],
  );

  const signup = useCallback(
    async (data: Partial<User> & { password: string }) => {
      const newUser: User = {
        id: `user-${Date.now()}`,
        email: data.email || "",
        name: data.name || "",
        role: data.role || "owner",
        organization: data.organization || "",
        status: "active",
        createdAt: new Date().toISOString().split("T")[0],
        modules: data.role === "owner" ? ["all"] : ["dashboard"],
      };
      setUsers((prev) => [...prev, newUser]);
      setUser(newUser);
      return true;
    },
    [],
  );

  const logout = useCallback(() => setUser(null), []);

  const createUser = useCallback((data: Partial<User>) => {
    const newUser: User = {
      id: `user-${Date.now()}`,
      email: data.email || "",
      name: data.name || "",
      role: data.role || "employee",
      organization: data.organization || "",
      status: data.status || "active",
      createdAt: new Date().toISOString().split("T")[0],
      modules: data.modules || ["dashboard"],
    };
    setUsers((prev) => [...prev, newUser]);
  }, []);

  const updateUser = useCallback((id: string, data: Partial<User>) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...data } : u)));
    // If updating the currently logged-in user, reflect changes immediately
    setUser((prev) => (prev && prev.id === id ? { ...prev, ...data } : prev));
  }, []);

  const deleteUser = useCallback((id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
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
