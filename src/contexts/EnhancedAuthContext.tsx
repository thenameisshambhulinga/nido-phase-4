/**
 * ENHANCED AUTH CONTEXT WITH RBAC, AUDIT LOGGING & USER MANAGEMENT
 * Comprehensive authentication and authorization system for Nido Platform
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { safeReadJson } from "@/lib/storage";
import {
  RoleTemplateKey,
  ROLE_TEMPLATES,
  hasPermission,
  generateTemporaryPassword,
  hashPassword,
  verifyPassword,
  PermissionAction,
  hasApprovalCapability,
  UserType,
} from "@/lib/permissions";
import {
  EnhancedAppUser,
  UserInvitation,
  AuditLog,
  UserDepartment,
} from "@/lib/userManagementTypes";

// ─────────────────────────────────────────────────────────────────
// CONTEXT TYPE
// ─────────────────────────────────────────────────────────────────

interface EnhancedAuthContextType {
  // Current user & authentication
  user: EnhancedAppUser | null;
  isAuthenticated: boolean;
  isOwner: boolean;

  // User management
  users: EnhancedAppUser[];
  createUser: (
    data: Omit<
      EnhancedAppUser,
      | "id"
      | "createdAt"
      | "updatedAt"
      | "passwordHash"
      | "loginAttempts"
      | "isLocked"
      | "lastLogin"
    >,
  ) => Promise<{ success: boolean; userId?: string; tempPassword?: string }>;
  createBulkUsers: (
    rows: Array<
      Omit<
        EnhancedAppUser,
        | "id"
        | "createdAt"
        | "updatedAt"
        | "passwordHash"
        | "loginAttempts"
        | "isLocked"
        | "lastLogin"
      >
    >,
  ) => Promise<{ created: number; failed: number }>;
  updateUser: (id: string, data: Partial<EnhancedAppUser>) => Promise<boolean>;
  deleteUser: (id: string) => Promise<boolean>;

  // Authentication
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

  // User invitations
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

  // Permissions
  hasModulePermission: (module: string, action: PermissionAction) => boolean;
  canApprove: (amount: number) => boolean;
  getUserPermissions: (userId: string) => Record<string, string[]>;

  // Departments
  departments: UserDepartment[];
  createDepartment: (dept: Omit<UserDepartment, "id" | "createdAt">) => void;
  updateDepartment: (id: string, data: Partial<UserDepartment>) => void;
  deleteDepartment: (id: string) => void;

  // Audit logging
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

// ─────────────────────────────────────────────────────────────────
// DEFAULT DATA
// ─────────────────────────────────────────────────────────────────

const DEFAULT_OWNER: EnhancedAppUser = {
  id: "user-owner-1",
  username: "owner",
  email: "owner@nidotech.com",
  fullName: "Nido Platform Owner",
  phone: "+91-9999999999",
  jobTitle: "System Owner",
  department: "Management",
  roleTemplate: "owner",
  userType: "Internal User",
  organization: "Nido Tech",
  status: "Active",
  passwordHash: hashPassword("password"),
  requiresPasswordReset: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdBy: "system",
  loginAttempts: 0,
  isLocked: false,
  twoFactorEnabled: false,
};

const DEFAULT_DEPARTMENTS: UserDepartment[] = [
  {
    id: "dept-procurement",
    name: "Procurement",
    description: "Purchase orders and vendor management",
    manager: "user-owner-1",
    users: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: "dept-finance",
    name: "Finance",
    description: "Financial transactions and reporting",
    manager: "user-owner-1",
    users: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: "dept-operations",
    name: "Operations",
    description: "Operational tasks and approvals",
    manager: "user-owner-1",
    users: [],
    createdAt: new Date().toISOString(),
  },
];

// ─────────────────────────────────────────────────────────────────
// PROVIDER COMPONENT
// ─────────────────────────────────────────────────────────────────

export const EnhancedAuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<EnhancedAppUser | null>(() => {
    const stored = safeReadJson<EnhancedAppUser | null>("nido_auth_user", null);
    return stored && typeof stored === "object" ? stored : null;
  });

  const [users, setUsers] = useState<EnhancedAppUser[]>(() => {
    const stored = safeReadJson<EnhancedAppUser[]>("nido_auth_users", [
      DEFAULT_OWNER,
    ]);
    return Array.isArray(stored) ? stored : [DEFAULT_OWNER];
  });

  const [departments, setDepartments] = useState<UserDepartment[]>(() => {
    const stored = safeReadJson<UserDepartment[]>(
      "nido_auth_departments",
      DEFAULT_DEPARTMENTS,
    );
    return Array.isArray(stored) ? stored : DEFAULT_DEPARTMENTS;
  });

  const [invitations, setInvitations] = useState<UserInvitation[]>(() => {
    const stored = safeReadJson<UserInvitation[]>("nido_auth_invitations", []);
    return Array.isArray(stored) ? stored : [];
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const stored = safeReadJson<AuditLog[]>("nido_auth_audit_logs", []);
    return Array.isArray(stored) ? stored : [];
  });

  // ─ Persist to localStorage ─
  useEffect(() => {
    localStorage.setItem("nido_auth_user", JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem("nido_auth_users", JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem("nido_auth_departments", JSON.stringify(departments));
  }, [departments]);

  useEffect(() => {
    localStorage.setItem("nido_auth_invitations", JSON.stringify(invitations));
  }, [invitations]);

  useEffect(() => {
    localStorage.setItem("nido_auth_audit_logs", JSON.stringify(auditLogs));
  }, [auditLogs]);

  // ─────────────────────────────────────────────────────────────────
  // AUTHENTICATION
  // ─────────────────────────────────────────────────────────────────

  const login = useCallback(
    async (email: string, password: string) => {
      const found = users.find((u) => u.email === email);

      if (!found) {
        return false;
      }

      if (found.status === "Suspended") {
        return false;
      }

      if (found.isLocked) {
        const lockedUntil = found.lockedUntil
          ? new Date(found.lockedUntil)
          : null;
        if (lockedUntil && lockedUntil > new Date()) {
          return false;
        }
      }

      if (!verifyPassword(password, found.passwordHash)) {
        // Increment failed attempts
        setUsers((prev) =>
          prev.map((u) =>
            u.id === found.id
              ? {
                  ...u,
                  loginAttempts: u.loginAttempts + 1,
                  isLocked: u.loginAttempts + 1 >= 5,
                  lockedUntil:
                    u.loginAttempts + 1 >= 5
                      ? new Date(Date.now() + 30 * 60 * 1000).toISOString()
                      : undefined,
                }
              : u,
          ),
        );
        return false;
      }

      // Successful login
      const updatedUser = {
        ...found,
        lastLogin: new Date().toISOString(),
        loginAttempts: 0,
        isLocked: false,
      };

      setUser(updatedUser);
      setUsers((prev) =>
        prev.map((u) => (u.id === found.id ? updatedUser : u)),
      );

      logAction(
        "login",
        "user",
        found.id,
        found.fullName,
        "User logged in successfully",
      );
      return true;
    },
    [users],
  );

  const logout = useCallback(() => {
    if (user) {
      logAction("logout", "user", user.id, user.fullName, "User logged out");
    }
    setUser(null);
  }, [user]);

  // ─────────────────────────────────────────────────────────────────
  // USER MANAGEMENT
  // ─────────────────────────────────────────────────────────────────

  const createUser = useCallback(
    async (
      data: Omit<
        EnhancedAppUser,
        | "id"
        | "createdAt"
        | "updatedAt"
        | "passwordHash"
        | "loginAttempts"
        | "isLocked"
        | "lastLogin"
      >,
    ) => {
      const tempPassword = generateTemporaryPassword();
      const newUser: EnhancedAppUser = {
        ...data,
        id: `user-${Date.now()}`,
        passwordHash: hashPassword(tempPassword),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        loginAttempts: 0,
        isLocked: false,
        requiresPasswordReset: true,
      };

      setUsers((prev) => [...prev, newUser]);
      logAction(
        "create",
        "user",
        newUser.id,
        newUser.fullName,
        `User created with role: ${newUser.roleTemplate}`,
      );

      return {
        success: true,
        userId: newUser.id,
        tempPassword,
      };
    },
    [],
  );

  const createBulkUsers = useCallback(
    async (
      rows: Array<
        Omit<
          EnhancedAppUser,
          | "id"
          | "createdAt"
          | "updatedAt"
          | "passwordHash"
          | "loginAttempts"
          | "isLocked"
          | "lastLogin"
        >
      >,
    ) => {
      let created = 0;
      let failed = 0;

      const newUsers = rows.map((data) => {
        const tempPassword = generateTemporaryPassword();
        return {
          ...data,
          id: `user-${Date.now()}-${Math.random()}`,
          passwordHash: hashPassword(tempPassword),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          loginAttempts: 0,
          isLocked: false,
          requiresPasswordReset: true,
        };
      });

      setUsers((prev) => [...prev, ...newUsers]);
      created = newUsers.length;

      logAction(
        "create",
        "user",
        "bulk-import",
        `Bulk User Import`,
        `Imported ${created} users`,
      );

      return { created, failed };
    },
    [],
  );

  const updateUser = useCallback(
    (id: string, data: Partial<EnhancedAppUser>) => {
      return new Promise<boolean>((resolve) => {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === id
              ? {
                  ...u,
                  ...data,
                  updatedAt: new Date().toISOString(),
                }
              : u,
          ),
        );

        if (user?.id === id) {
          setUser((prev) =>
            prev
              ? {
                  ...prev,
                  ...data,
                  updatedAt: new Date().toISOString(),
                }
              : null,
          );
        }

        logAction(
          "update",
          "user",
          id,
          data.fullName || "Unknown",
          "User updated",
        );
        resolve(true);
      });
    },
    [user],
  );

  const deleteUser = useCallback(
    (id: string) => {
      return new Promise<boolean>((resolve) => {
        const userToDelete = users.find((u) => u.id === id);
        if (userToDelete) {
          setUsers((prev) => prev.filter((u) => u.id !== id));
          logAction(
            "delete",
            "user",
            id,
            userToDelete.fullName,
            "User deleted",
          );
          resolve(true);
        } else {
          resolve(false);
        }
      });
    },
    [users],
  );

  // ─────────────────────────────────────────────────────────────────
  // PASSWORD MANAGEMENT
  // ─────────────────────────────────────────────────────────────────

  const changePassword = useCallback(
    async (oldPassword: string, newPassword: string) => {
      if (!user) {
        return { success: false, message: "Not authenticated" };
      }

      if (!verifyPassword(oldPassword, user.passwordHash)) {
        return { success: false, message: "Current password is incorrect" };
      }

      const updated = {
        ...user,
        passwordHash: hashPassword(newPassword),
        requiresPasswordReset: false,
      };

      setUser(updated);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));

      logAction("update", "user", user.id, user.fullName, "Password changed");

      return { success: true, message: "Password changed successfully" };
    },
    [user],
  );

  const resetPassword = useCallback(
    (userId: string) => {
      return new Promise<{ success: boolean; tempPassword?: string }>(
        (resolve) => {
          const userToReset = users.find((u) => u.id === userId);
          if (userToReset) {
            const tempPassword = generateTemporaryPassword();
            const updated = {
              ...userToReset,
              passwordHash: hashPassword(tempPassword),
              requiresPasswordReset: true,
              loginAttempts: 0,
              isLocked: false,
            };

            setUsers((prev) =>
              prev.map((u) => (u.id === userId ? updated : u)),
            );

            if (user?.id === userId) {
              setUser(updated);
            }

            logAction(
              "update",
              "user",
              userId,
              userToReset.fullName,
              "Password reset initiated",
            );

            resolve({ success: true, tempPassword });
          } else {
            resolve({ success: false });
          }
        },
      );
    },
    [users, user],
  );

  // ─────────────────────────────────────────────────────────────────
  // USER INVITATIONS
  // ─────────────────────────────────────────────────────────────────

  const inviteUser = useCallback(
    async (
      email: string,
      role: RoleTemplateKey,
      userType: UserType,
      department?: string,
    ) => {
      const existingUser = users.find((u) => u.email === email);
      if (existingUser) {
        return { success: false };
      }

      const tempPassword = generateTemporaryPassword();
      const invitation: UserInvitation = {
        id: `inv-${Date.now()}`,
        email,
        role,
        userType,
        department,
        temporaryPassword: tempPassword,
        status: "pending",
        sentAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        invitedBy: user?.id || "system",
      };

      setInvitations((prev) => [...prev, invitation]);
      logAction(
        "create",
        "user",
        email,
        email,
        `User invited with role: ${role}`,
      );

      return { success: true, invitationId: invitation.id };
    },
    [users, user],
  );

  const acceptInvitation = useCallback(
    async (invitationId: string, password: string) => {
      const invitation = invitations.find((i) => i.id === invitationId);
      if (!invitation || invitation.status !== "pending") {
        return false;
      }

      if (new Date(invitation.expiresAt) < new Date()) {
        return false;
      }

      const newUser: EnhancedAppUser = {
        id: `user-${Date.now()}`,
        username: invitation.email.split("@")[0],
        email: invitation.email,
        fullName: invitation.email,
        phone: "",
        jobTitle: "",
        department: invitation.department || "General",
        roleTemplate: invitation.role,
        userType: invitation.userType,
        organization: "Nido Tech",
        status: "Active",
        passwordHash: hashPassword(password),
        requiresPasswordReset: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: invitation.invitedBy,
        loginAttempts: 0,
        isLocked: false,
        twoFactorEnabled: false,
      };

      setUsers((prev) => [...prev, newUser]);
      setInvitations((prev) =>
        prev.map((i) =>
          i.id === invitationId
            ? {
                ...i,
                status: "accepted",
                acceptedAt: new Date().toISOString(),
              }
            : i,
        ),
      );

      logAction(
        "create",
        "user",
        newUser.id,
        newUser.fullName,
        "User accepted invitation and activated account",
      );

      setUser(newUser);
      return true;
    },
    [invitations],
  );

  const resendInvitation = useCallback(
    (invitationId: string) => {
      return new Promise<boolean>((resolve) => {
        const invitation = invitations.find((i) => i.id === invitationId);
        if (invitation) {
          setInvitations((prev) =>
            prev.map((i) =>
              i.id === invitationId
                ? {
                    ...i,
                    sentAt: new Date().toISOString(),
                    expiresAt: new Date(
                      Date.now() + 7 * 24 * 60 * 60 * 1000,
                    ).toISOString(),
                  }
                : i,
            ),
          );

          logAction(
            "create",
            "user",
            invitationId,
            invitation.email,
            "Invitation resent",
          );

          resolve(true);
        } else {
          resolve(false);
        }
      });
    },
    [invitations],
  );

  // ─────────────────────────────────────────────────────────────────
  // PERMISSIONS
  // ─────────────────────────────────────────────────────────────────

  const hasModulePermission = useCallback(
    (module: string, action: PermissionAction) => {
      if (!user) return false;
      if (user.roleTemplate === "owner") return true;
      return hasPermission(module, action, user.roleTemplate);
    },
    [user],
  );

  const canApprove = useCallback(
    (amount: number) => {
      if (!user) return false;
      return hasApprovalCapability(user.roleTemplate, amount);
    },
    [user],
  );

  const getUserPermissions = useCallback(
    (userId: string) => {
      const userRecord = users.find((u) => u.id === userId);
      if (!userRecord) return {};

      const template =
        ROLE_TEMPLATES[userRecord.roleTemplate as keyof typeof ROLE_TEMPLATES];
      return template ? template.permissions : {};
    },
    [users],
  );

  // ─────────────────────────────────────────────────────────────────
  // DEPARTMENTS
  // ─────────────────────────────────────────────────────────────────

  const createDepartment = useCallback(
    (dept: Omit<UserDepartment, "id" | "createdAt">) => {
      const newDept: UserDepartment = {
        ...dept,
        id: `dept-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      setDepartments((prev) => [...prev, newDept]);
      logAction(
        "create",
        "user",
        newDept.id,
        newDept.name,
        "Department created",
      );
    },
    [],
  );

  const updateDepartment = useCallback(
    (id: string, data: Partial<UserDepartment>) => {
      setDepartments((prev) =>
        prev.map((d) => (d.id === id ? { ...d, ...data } : d)),
      );
      logAction(
        "update",
        "user",
        id,
        data.name || "Unknown",
        "Department updated",
      );
    },
    [],
  );

  const deleteDepartment = useCallback((id: string) => {
    setDepartments((prev) => prev.filter((d) => d.id !== id));
    logAction("delete", "user", id, "Unknown", "Department deleted");
  }, []);

  // ─────────────────────────────────────────────────────────────────
  // AUDIT LOGGING
  // ─────────────────────────────────────────────────────────────────

  const logAction = useCallback(
    (
      action: AuditLog["action"],
      entityType: AuditLog["entityType"],
      entityId: string,
      entityName: string,
      details?: string,
    ) => {
      const log: AuditLog = {
        id: `audit-${Date.now()}`,
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

      setAuditLogs((prev) => [log, ...prev]);
    },
    [user],
  );

  const getAuditLogs = useCallback(
    (filters?: {
      userId?: string;
      action?: AuditLog["action"];
      entityType?: AuditLog["entityType"];
      startDate?: string;
      endDate?: string;
    }) => {
      return auditLogs.filter((log) => {
        if (filters?.userId && log.userId !== filters.userId) return false;
        if (filters?.action && log.action !== filters.action) return false;
        if (filters?.entityType && log.entityType !== filters.entityType)
          return false;
        if (filters?.startDate && log.timestamp < filters.startDate)
          return false;
        if (filters?.endDate && log.timestamp > filters.endDate) return false;
        return true;
      });
    },
    [auditLogs],
  );

  // ─────────────────────────────────────────────────────────────────
  // CONTEXT VALUE
  // ─────────────────────────────────────────────────────────────────

  const value: EnhancedAuthContextType = {
    user,
    isAuthenticated: !!user,
    isOwner: user?.roleTemplate === "owner",
    users,
    createUser,
    createBulkUsers,
    updateUser,
    deleteUser,
    login,
    logout,
    changePassword,
    resetPassword,
    inviteUser,
    getInvitations: () => invitations,
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
  const ctx = useContext(EnhancedAuthContext);
  if (!ctx) {
    throw new Error("useEnhancedAuth must be used within EnhancedAuthProvider");
  }
  return ctx;
};
