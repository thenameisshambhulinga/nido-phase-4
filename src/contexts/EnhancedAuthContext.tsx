import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiRequest } from "@/lib/api";
import { safeReadJson } from "@/lib/storage";
import { useAuth } from "@/contexts/AuthContext";
import {
  hasApprovalCapability,
  hasPermission,
  type PermissionAction,
  ROLE_TEMPLATES,
  type RoleTemplateKey,
  type UserType,
} from "@/lib/permissions";
import type {
  AuditLog,
  EnhancedAppUser,
  UserDepartment,
  UserInvitation,
} from "@/lib/userManagementTypes";

interface Credentials {
  username: string;
  email: string;
  temporaryPassword: string;
  userType?: string;
}

type ManagedUserDraft = Omit<
  EnhancedAppUser,
  | "id"
  | "createdAt"
  | "updatedAt"
  | "passwordHash"
  | "loginAttempts"
  | "isLocked"
  | "lastLogin"
>;

interface EnhancedAuthContextType {
  credentials: Credentials | null;
  setCredentials: (creds: Credentials | null) => void;
  user: EnhancedAppUser | null;
  isAuthenticated: boolean;
  isOwner: boolean;
  users: EnhancedAppUser[];
  createUser: (data: ManagedUserDraft) => Promise<{
    success: boolean;
    userId?: string;
    tempPassword?: string;
    credentials?: Credentials;
    setupToken?: string;
    setupLink?: string;
  }>;
  createBulkUsers: (rows: ManagedUserDraft[]) => Promise<{
    created: number;
    failed: number;
  }>;
  updateUser: (id: string, data: Partial<EnhancedAppUser>) => Promise<boolean>;
  deleteUser: (id: string) => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  changePassword: (
    oldPassword: string,
    newPassword: string,
  ) => Promise<{ success: boolean; message: string }>;
  resetPassword: (userId: string) => Promise<{
    success: boolean;
    tempPassword?: string;
  }>;
  inviteUser: (
    email: string,
    role: RoleTemplateKey,
    userType: UserType,
    department?: string,
  ) => Promise<{ success: boolean; invitationId?: string }>;
  getInvitations: () => UserInvitation[];
  acceptInvitation: (
    invitationId: string,
    password: string,
  ) => Promise<boolean>;
  resendInvitation: (invitationId: string) => Promise<boolean>;
  hasModulePermission: (module: string, action: PermissionAction) => boolean;
  canApprove: (amount: number) => boolean;
  getUserPermissions: (userId: string) => Record<string, string[]>;
  departments: UserDepartment[];
  createDepartment: (dept: Omit<UserDepartment, "id" | "createdAt">) => void;
  updateDepartment: (id: string, data: Partial<UserDepartment>) => void;
  deleteDepartment: (id: string) => void;
  auditLogs: AuditLog[];
  logAction: (
    action: AuditLog["action"],
    entityType: AuditLog["entityType"],
    entityId: string,
    entityName: string,
    details?: string,
  ) => void;
  getAuditLogs: (filters?: {
    userId?: string;
    action?: AuditLog["action"];
    entityType?: AuditLog["entityType"];
    startDate?: string;
    endDate?: string;
  }) => AuditLog[];
}

const EnhancedAuthContext = createContext<EnhancedAuthContextType | undefined>(
  undefined,
);

const INVITATION_KEY = "nido_user_invitations_v2";
const DEPARTMENT_KEY = "nido_user_departments_v2";
const AUDIT_KEY = "nido_user_audit_v2";

const defaultDepartments: UserDepartment[] = [
  {
    id: "dept-management",
    name: "Management",
    description: "Leadership and admin operations",
    manager: "",
    users: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: "dept-procurement",
    name: "Procurement",
    description: "Procurement and sourcing operations",
    manager: "",
    users: [],
    createdAt: new Date().toISOString(),
  },
];

const roleTemplateFromAuthRole = (role?: string): RoleTemplateKey => {
  switch (String(role || "").toLowerCase()) {
    case "owner":
      return "owner";
    case "admin":
      return "admin";
    case "procurement_manager":
      return "procurement_manager";
    case "accounts_payable":
      return "accounts_payable";
    case "vendor_admin":
      return "vendor_admin";
    case "vendor":
      return "vendor_user";
    case "client_admin":
      return "client_admin";
    case "client_user":
    case "client_employee":
      return "client_user";
    default:
      return "employee";
  }
};

const authRoleFromTemplate = (roleTemplate: RoleTemplateKey): string => {
  switch (roleTemplate) {
    case "owner":
      return "owner";
    case "admin":
    case "procurement_manager":
    case "procurement_specialist":
    case "accounts_payable":
    case "finance_manager":
    case "employee":
      return "admin";
    case "client_admin":
      return "client_admin";
    case "client_user":
      return "client_employee";
    case "vendor_admin":
    case "vendor_user":
      return "vendor";
    default:
      return "admin";
  }
};

const statusToEnhanced = (
  status?: string,
): EnhancedAppUser["status"] => {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "inactive") return "Inactive";
  if (normalized === "suspended") return "Suspended";
  return "Active";
};

const toEnhancedUser = (user: any): EnhancedAppUser => {
  const roleTemplate = roleTemplateFromAuthRole(user.role);
  return {
    id: String(user.id || user._id || crypto.randomUUID()),
    username: user.username || user.email?.split("@")[0] || "user",
    email: user.email || "",
    fullName: user.name || user.fullName || "",
    phone: user.phone || "",
    jobTitle: user.jobTitle || "",
    department: user.department || "General",
    roleTemplate,
    userType: ROLE_TEMPLATES[roleTemplate].userType,
    organization: user.organization || "Nido Tech",
    status: statusToEnhanced(user.status),
    passwordHash: "",
    requiresPasswordReset: Boolean(user.mustResetPassword),
    createdAt: user.createdAt || new Date().toISOString(),
    updatedAt: user.updatedAt || user.createdAt || new Date().toISOString(),
    createdBy: "system",
    lastLogin: user.lastLoginAt,
    loginAttempts: 0,
    isLocked: false,
    twoFactorEnabled: false,
    approvalLimit: ROLE_TEMPLATES[roleTemplate].approvalLimit,
    canApproveOrders: ROLE_TEMPLATES[roleTemplate].canApproveOrders,
  };
};

const usePersistedState = <T,>(key: string, fallback: T) => {
  const [value, setValue] = useState<T>(() => {
    const stored = safeReadJson<T>(key, fallback);
    return stored ?? fallback;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
};

export const EnhancedAuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const auth = useAuth();
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [invitations, setInvitations] = usePersistedState<UserInvitation[]>(
    INVITATION_KEY,
    [],
  );
  const [departments, setDepartments] = usePersistedState<UserDepartment[]>(
    DEPARTMENT_KEY,
    defaultDepartments,
  );
  const [auditLogs, setAuditLogs] = usePersistedState<AuditLog[]>(
    AUDIT_KEY,
    [],
  );

  const user = useMemo(
    () => (auth.user ? toEnhancedUser(auth.user) : null),
    [auth.user],
  );

  const users = useMemo(
    () => auth.users.map((entry) => toEnhancedUser(entry)),
    [auth.users],
  );

  const logAction = useCallback(
    (
      action: AuditLog["action"],
      entityType: AuditLog["entityType"],
      entityId: string,
      entityName: string,
      details?: string,
    ) => {
      const nextLog: AuditLog = {
        id: `audit-${Date.now()}-${entityId}`,
        timestamp: new Date().toISOString(),
        userId: user?.id || "system",
        userName: user?.fullName || "System",
        action,
        entityType,
        entityId,
        entityName,
        status: "success",
        details,
      };
      setAuditLogs((prev) => [nextLog, ...prev].slice(0, 500));
    },
    [setAuditLogs, user],
  );

  const createUser = useCallback(
    async (data: ManagedUserDraft) => {
      try {
        const result = await auth.createUser({
          name: data.fullName,
          email: data.email,
          role: authRoleFromTemplate(data.roleTemplate),
          organization: data.organization,
          jobTitle: data.jobTitle,
          department: data.department,
          phone: data.phone,
        });

        if (!result?.user || !result.credentials) {
          return { success: false };
        }

        logAction(
          "create",
          "user",
          result.user.id,
          result.user.name,
          `Created ${data.roleTemplate} account`,
        );

        return {
          success: true,
          userId: result.user.id,
          tempPassword: result.credentials.temporaryPassword,
          credentials: result.credentials,
          setupToken: (result as any).setupToken,
          setupLink: (result as any).setupLink,
        };
      } catch (error) {
        console.error("Enhanced create user failed:", error);
        return { success: false };
      }
    },
    [auth, logAction],
  );

  const createBulkUsers = useCallback(
    async (rows: ManagedUserDraft[]) => {
      let created = 0;
      let failed = 0;
      for (const row of rows) {
        const result = await createUser(row);
        if (result.success) created += 1;
        else failed += 1;
      }
      return { created, failed };
    },
    [createUser],
  );

  const updateUser = useCallback(
    async (id: string, data: Partial<EnhancedAppUser>) => {
      const success = await auth.updateUser(id, {
        name: data.fullName,
        email: data.email,
        role: data.roleTemplate
          ? authRoleFromTemplate(data.roleTemplate)
          : undefined,
        organization: data.organization,
        jobTitle: data.jobTitle,
        department: data.department,
        phone: data.phone,
        status:
          data.status === "Inactive"
            ? "inactive"
            : data.status === "Suspended"
              ? "suspended"
              : data.status === "Pending Activation"
                ? "inactive"
                : data.status
                  ? "active"
                  : undefined,
      } as any);

      if (success) {
        logAction("update", "user", id, data.fullName || id, "User updated");
      }

      return success;
    },
    [auth, logAction],
  );

  const deleteUser = useCallback(
    async (id: string) => {
      const target = users.find((entry) => entry.id === id);
      const success = await auth.deleteUser(id);
      if (success) {
        logAction("delete", "user", id, target?.fullName || id, "User deleted");
      }
      return success;
    },
    [auth, logAction, users],
  );

  const changePassword = useCallback(
    async (oldPassword: string, newPassword: string) => {
      try {
        await apiRequest("/auth/reset-password", {
          method: "PATCH",
          body: {
            currentPassword: oldPassword,
            newPassword,
          },
        });
        return { success: true, message: "Password updated successfully" };
      } catch (error: any) {
        return {
          success: false,
          message: error?.message || "Failed to update password",
        };
      }
    },
    [],
  );

  const resetPassword = useCallback(
    async (userId: string) => {
      try {
        const response = await apiRequest<any>(`/auth/users/${userId}/reset-password`, {
          method: "PATCH",
        });
        if (response?.credentials) {
          setCredentials(response.credentials);
        }
        logAction("update", "user", userId, userId, "Password reset issued");
        return {
          success: true,
          tempPassword: response?.credentials?.temporaryPassword,
        };
      } catch (error) {
        console.error("Reset password failed:", error);
        return { success: false };
      }
    },
    [logAction],
  );

  const inviteUser = useCallback(
    async (
      email: string,
      role: RoleTemplateKey,
      userType: UserType,
      department?: string,
    ) => {
      const displayName =
        email
          .split("@")[0]
          .replace(/[._-]+/g, " ")
          .replace(/[^a-zA-Z\s]/g, " ")
          .replace(/\b\w/g, (char) => char.toUpperCase()) || "New User";

      const result = await createUser({
        username: email.split("@")[0],
        email,
        fullName: displayName,
        phone: "",
        jobTitle: "",
        department: department || "General",
        roleTemplate: role,
        userType,
        organization: user?.organization || "Nido Tech",
        status: "Pending Activation",
        requiresPasswordReset: true,
        createdBy: user?.id || "system",
        twoFactorEnabled: false,
      });

      if (!result.success || !result.credentials) {
        return { success: false };
      }

      const invitation: UserInvitation = {
        id: result.setupToken || `invite-${Date.now()}`,
        email,
        role,
        userType,
        department,
        temporaryPassword: result.credentials.temporaryPassword,
        status: "pending",
        sentAt: new Date().toISOString(),
        expiresAt: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        invitedBy: user?.id || "system",
      };

      setInvitations((prev) => [invitation, ...prev]);
      logAction("create", "user", invitation.id, email, "Invitation sent");
      return { success: true, invitationId: invitation.id };
    },
    [createUser, logAction, setInvitations, user],
  );

  const getInvitations = useCallback(() => invitations, [invitations]);

  const acceptInvitation = useCallback(
    async (invitationId: string, password: string) => {
      try {
        await apiRequest("/auth/reset-password", {
          method: "PATCH",
          body: {
            token: invitationId,
            newPassword: password,
          },
        });

        setInvitations((prev) =>
          prev.map((entry) =>
            entry.id === invitationId
              ? {
                  ...entry,
                  status: "accepted",
                  acceptedAt: new Date().toISOString(),
                }
              : entry,
          ),
        );
        return true;
      } catch (error) {
        console.error("Accept invitation failed:", error);
        return false;
      }
    },
    [setInvitations],
  );

  const resendInvitation = useCallback(
    async (invitationId: string) => {
      const invitation = invitations.find((entry) => entry.id === invitationId);
      const invitedUser = users.find((entry) => entry.email === invitation?.email);
      if (!invitation || !invitedUser) return false;

      try {
        const response = await apiRequest<any>(
          `/auth/users/${invitedUser.id}/resend-invite`,
          {
            method: "POST",
          },
        );

        setInvitations((prev) =>
          prev.map((entry) =>
            entry.id === invitationId
              ? {
                  ...entry,
                  id: response?.setupToken || entry.id,
                  temporaryPassword:
                    response?.credentials?.temporaryPassword ||
                    entry.temporaryPassword,
                  sentAt: new Date().toISOString(),
                  expiresAt: new Date(
                    Date.now() + 7 * 24 * 60 * 60 * 1000,
                  ).toISOString(),
                  status: "pending",
                }
              : entry,
          ),
        );

        if (response?.credentials) {
          setCredentials(response.credentials);
        }

        logAction("update", "user", invitationId, invitation.email, "Invitation resent");
        return true;
      } catch (error) {
        console.error("Resend invitation failed:", error);
        return false;
      }
    },
    [invitations, logAction, users],
  );

  const hasModulePermission = useCallback(
    (module: string, action: PermissionAction) => {
      if (!user) return false;
      return hasPermission(module, action, user.roleTemplate);
    },
    [user],
  );

  const canApprove = useCallback(
    (amount: number) =>
      user ? hasApprovalCapability(user.roleTemplate, amount) : false,
    [user],
  );

  const getUserPermissions = useCallback(
    (userId: string) => {
      const target = users.find((entry) => entry.id === userId);
      if (!target) return {};
      const template = ROLE_TEMPLATES[target.roleTemplate];
      return Object.fromEntries(
        Object.entries(template.permissions).map(([moduleId, actions]) => [
          moduleId,
          [...actions],
        ]),
      );
    },
    [users],
  );

  const createDepartment = useCallback(
    (dept: Omit<UserDepartment, "id" | "createdAt">) => {
      setDepartments((prev) => [
        {
          ...dept,
          id: `dept-${Date.now()}`,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    },
    [setDepartments],
  );

  const updateDepartment = useCallback(
    (id: string, data: Partial<UserDepartment>) => {
      setDepartments((prev) =>
        prev.map((entry) => (entry.id === id ? { ...entry, ...data } : entry)),
      );
    },
    [setDepartments],
  );

  const deleteDepartment = useCallback(
    (id: string) => {
      setDepartments((prev) => prev.filter((entry) => entry.id !== id));
    },
    [setDepartments],
  );

  const getAuditLogs = useCallback(
    (filters?: {
      userId?: string;
      action?: AuditLog["action"];
      entityType?: AuditLog["entityType"];
      startDate?: string;
      endDate?: string;
    }) =>
      auditLogs.filter((entry) => {
        if (filters?.userId && entry.userId !== filters.userId) return false;
        if (filters?.action && entry.action !== filters.action) return false;
        if (filters?.entityType && entry.entityType !== filters.entityType)
          return false;
        if (filters?.startDate && entry.timestamp < filters.startDate)
          return false;
        if (filters?.endDate && entry.timestamp > filters.endDate) return false;
        return true;
      }),
    [auditLogs],
  );

  const value: EnhancedAuthContextType = {
    credentials,
    setCredentials,
    user,
    isAuthenticated: auth.isAuthenticated,
    isOwner: auth.isOwner,
    users,
    createUser,
    createBulkUsers,
    updateUser,
    deleteUser,
    login: auth.login,
    logout: auth.logout,
    changePassword,
    resetPassword,
    inviteUser,
    getInvitations,
    acceptInvitation,
    resendInvitation,
    hasModulePermission,
    canApprove,
    getUserPermissions,
    departments,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    auditLogs,
    logAction,
    getAuditLogs,
  };

  return (
    <EnhancedAuthContext.Provider value={value}>
      {children}
    </EnhancedAuthContext.Provider>
  );
};

export const useEnhancedAuth = () => {
  const context = useContext(EnhancedAuthContext);
  if (!context) {
    throw new Error("useEnhancedAuth must be used within EnhancedAuthProvider");
  }
  return context;
};
