/**
 * EXTENDED USER MANAGEMENT TYPES
 * For comprehensive user lifecycle management, invitations, and audit logging
 */

import { RoleTemplateKey, UserType } from "@/lib/permissions";

export interface UserInvitation {
  id: string;
  email: string;
  role: RoleTemplateKey;
  userType: UserType;
  department?: string;
  temporaryPassword: string;
  status: "pending" | "accepted" | "expired";
  sentAt: string;
  expiresAt: string;
  acceptedAt?: string;
  invitedBy: string;
}

export interface UserSession {
  userId: string;
  token: string;
  loginTime: string;
  lastActivityTime: string;
  ipAddress?: string;
  deviceInfo?: string;
  isActive: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action:
    | "create"
    | "update"
    | "delete"
    | "login"
    | "logout"
    | "export"
    | "approve";
  entityType:
    | "user"
    | "order"
    | "invoice"
    | "vendor"
    | "client"
    | "role"
    | "permission";
  entityId: string;
  entityName: string;
  changes?: {
    fieldName: string;
    oldValue: string | number | boolean;
    newValue: string | number | boolean;
  }[];
  status: "success" | "failed";
  details?: string;
}

export interface UserDepartment {
  id: string;
  name: string;
  description: string;
  manager?: string;
  users: string[];
  createdAt: string;
}

export interface EnhancedAppUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  phone: string;
  jobTitle: string;
  department: string;
  roleTemplate: RoleTemplateKey;
  userType: UserType;
  organization: string;
  status: "Active" | "Inactive" | "Suspended" | "Pending Activation";
  passwordHash: string;
  requiresPasswordReset: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  lastLogin?: string;
  loginAttempts: number;
  isLocked: boolean;
  lockedUntil?: string;
  avatar?: string;
  twoFactorEnabled: boolean;
  approvalLimit?: number;
  canApproveOrders?: boolean;
  customPermissions?: Record<string, PermissionOverride>;
}

export interface PermissionOverride {
  module: string;
  action: string;
  granted: boolean;
  reason?: string;
  grantedAt?: string;
  grantedBy?: string;
}

export interface UserBulkImport {
  rows: BulkImportRow[];
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors: BulkImportError[];
}

export interface BulkImportRow {
  fullName: string;
  email: string;
  jobTitle: string;
  department: string;
  roleTemplate: RoleTemplateKey;
  userType: UserType;
  phone?: string;
}

export interface BulkImportError {
  rowNumber: number;
  email: string;
  error: string;
}

export interface PermissionPreset {
  id: string;
  name: string;
  description: string;
  modules: Record<string, string[]>; // module -> actions
  createdAt: string;
  createdBy: string;
  usedBy: number;
}
