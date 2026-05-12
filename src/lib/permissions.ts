/**
 * PERMISSION MANAGEMENT UTILITIES
 * Comprehensive RBAC (Role-Based Access Control) system for Nido Platform
 * Supports: Employees, Clients, Vendors with granular permission control
 */

export type UserType = "Internal User" | "Client User" | "Vendor User";
export type PermissionAction =
  | "view"
  | "create"
  | "edit"
  | "delete"
  | "approve"
  | "export"
  | "configure";

export interface Permission {
  action: PermissionAction;
  description: string;
}

type RoleTemplateDataVisibility = "All" | "Department Only" | "Own Only";

type RoleTemplatePermissions = Partial<
  Record<string, readonly PermissionAction[]>
>;

interface RoleTemplateDefinition {
  name: string;
  description: string;
  userType: UserType;
  permissions: RoleTemplatePermissions;
  approvalLimit: number;
  canApproveOrders: boolean;
  dataVisibility: RoleTemplateDataVisibility;
}

const defineRoleTemplates = <T extends Record<string, RoleTemplateDefinition>>(
  templates: T,
) => templates;

export const PERMISSION_ACTIONS: Record<PermissionAction, string> = {
  view: "View",
  create: "Create",
  edit: "Edit",
  delete: "Delete",
  approve: "Approve",
  export: "Export",
  configure: "Configure",
};

// ─────────────────────────────────────────────────────────────────
// MODULES & PERMISSIONS
// ─────────────────────────────────────────────────────────────────

export const AVAILABLE_MODULES = [
  { id: "dashboard", name: "Dashboard", description: "Analytics & overview" },
  {
    id: "orders",
    name: "Purchase Orders",
    description: "Manage purchase orders",
  },
  { id: "shop", name: "Shop", description: "Product catalog" },
  { id: "vendors", name: "Vendors", description: "Vendor management" },
  { id: "clients", name: "Clients", description: "Client management" },
  { id: "inventory", name: "Inventory", description: "Stock & inventory" },
  {
    id: "transactions",
    name: "Transactions",
    description: "Bills, payments, credits",
  },
  { id: "invoices", name: "Invoices", description: "Invoice management" },
  { id: "reports", name: "Reports & Analytics", description: "Reports" },
  {
    id: "configuration",
    name: "Configuration",
    description: "System settings",
  },
  { id: "approvals", name: "Approvals", description: "Approval workflows" },
  { id: "audit", name: "Audit Trail", description: "Activity logs" },
  {
    id: "notifications",
    name: "Notifications",
    description: "Alerts & messages",
  },
  { id: "users", name: "User Management", description: "Users & roles" },
] as const;

// ─────────────────────────────────────────────────────────────────
// ROLE TEMPLATES
// ─────────────────────────────────────────────────────────────────

export const ROLE_TEMPLATES = defineRoleTemplates({
  owner: {
    name: "System Owner",
    description: "Full platform access with all permissions",
    userType: "Internal User" as UserType,
    permissions: {
      dashboard: ["view", "create", "edit", "export"],
      orders: ["view", "create", "edit", "delete", "approve", "export"],
      shop: ["view", "create", "edit", "delete", "configure"],
      vendors: ["view", "create", "edit", "delete", "approve"],
      clients: ["view", "create", "edit", "delete"],
      inventory: ["view", "create", "edit", "delete", "export"],
      transactions: ["view", "create", "edit", "delete", "approve"],
      invoices: ["view", "create", "edit", "delete", "export"],
      reports: ["view", "export"],
      configuration: ["view", "edit", "configure"],
      approvals: ["view", "edit", "approve"],
      audit: ["view"],
      notifications: ["view", "edit"],
      users: ["view", "create", "edit", "delete", "configure"],
    },
    approvalLimit: 999999,
    canApproveOrders: true,
    dataVisibility: "All" as const,
  },

  admin: {
    name: "Administrator",
    description: "Full access to internal operations",
    userType: "Internal User" as UserType,
    permissions: {
      dashboard: ["view", "create", "edit", "export"],
      orders: ["view", "create", "edit", "delete", "approve", "export"],
      shop: ["view", "create", "edit", "delete"],
      vendors: ["view", "create", "edit", "delete", "approve"],
      clients: ["view", "create", "edit", "delete"],
      inventory: ["view", "create", "edit", "delete", "export"],
      transactions: ["view", "create", "edit", "delete", "approve"],
      invoices: ["view", "create", "edit", "delete", "export"],
      reports: ["view", "export"],
      configuration: ["view", "edit"],
      approvals: ["view", "edit", "approve"],
      audit: ["view"],
      notifications: ["view", "edit"],
      users: ["view", "create", "edit", "delete"],
    },
    approvalLimit: 500000,
    canApproveOrders: true,
    dataVisibility: "All" as const,
  },

  procurement_manager: {
    name: "Procurement Manager",
    description: "Manage purchase orders and vendor relationships",
    userType: "Internal User" as UserType,
    permissions: {
      dashboard: ["view"],
      orders: ["view", "create", "edit", "approve", "export"],
      shop: ["view", "edit"],
      vendors: ["view", "edit", "approve"],
      clients: ["view"],
      inventory: ["view"],
      transactions: ["view", "create", "edit"],
      invoices: ["view"],
      reports: ["view"],
      approvals: ["view", "edit", "approve"],
      audit: ["view"],
    },
    approvalLimit: 250000,
    canApproveOrders: true,
    dataVisibility: "All" as const,
  },

  procurement_specialist: {
    name: "Procurement Specialist",
    description: "Create and manage purchase orders",
    userType: "Internal User" as UserType,
    permissions: {
      dashboard: ["view"],
      orders: ["view", "create", "edit", "export"],
      shop: ["view"],
      vendors: ["view"],
      clients: ["view"],
      inventory: ["view"],
      transactions: ["view", "create"],
      invoices: ["view"],
      reports: ["view"],
    },
    approvalLimit: 50000,
    canApproveOrders: false,
    dataVisibility: "All" as const,
  },

  accounts_payable: {
    name: "Accounts Payable Officer",
    description: "Manage bills, payments, and vendor credits",
    userType: "Internal User" as UserType,
    permissions: {
      dashboard: ["view"],
      vendors: ["view"],
      transactions: ["view", "create", "edit", "approve"],
      invoices: ["view", "edit"],
      reports: ["view"],
      audit: ["view"],
    },
    approvalLimit: 100000,
    canApproveOrders: false,
    dataVisibility: "All" as const,
  },

  finance_manager: {
    name: "Finance Manager",
    description: "Full financial operations access",
    userType: "Internal User" as UserType,
    permissions: {
      dashboard: ["view", "export"],
      orders: ["view", "edit"],
      vendors: ["view", "edit"],
      inventory: ["view"],
      transactions: ["view", "create", "edit", "approve", "export"],
      invoices: ["view", "create", "edit", "export"],
      reports: ["view", "export"],
      approvals: ["view", "approve"],
      audit: ["view"],
    },
    approvalLimit: 300000,
    canApproveOrders: true,
    dataVisibility: "All" as const,
  },

  employee: {
    name: "Employee",
    description: "Basic access to dashboard and shop",
    userType: "Internal User" as UserType,
    permissions: {
      dashboard: ["view"],
      shop: ["view"],
      vendors: ["view"],
      inventory: ["view"],
      notifications: ["view"],
    },
    approvalLimit: 0,
    canApproveOrders: false,
    dataVisibility: "Department Only" as const,
  },

  client_admin: {
    name: "Client Administrator",
    description: "Admin access for client account",
    userType: "Client User" as UserType,
    permissions: {
      dashboard: ["view", "export"],
      orders: ["view", "create", "edit", "export"],
      shop: ["view"],
      inventory: ["view"],
      transactions: ["view"],
      invoices: ["view"],
      reports: ["view"],
      approvals: ["view", "approve"],
      notifications: ["view"],
    },
    approvalLimit: 1000000,
    canApproveOrders: true,
    dataVisibility: "All" as const,
  },

  client_user: {
    name: "Client User",
    description: "Standard client account access",
    userType: "Client User" as UserType,
    permissions: {
      dashboard: ["view"],
      orders: ["view", "create"],
      shop: ["view"],
      inventory: ["view"],
      notifications: ["view"],
    },
    approvalLimit: 0,
    canApproveOrders: false,
    dataVisibility: "Own Only" as const,
  },

  vendor_admin: {
    name: "Vendor Administrator",
    description: "Vendor account admin with full access",
    userType: "Vendor User" as UserType,
    permissions: {
      dashboard: ["view"],
      vendors: ["view", "edit"],
      inventory: ["view"],
      transactions: ["view"],
      invoices: ["view"],
      notifications: ["view"],
    },
    approvalLimit: 0,
    canApproveOrders: false,
    dataVisibility: "Own Only" as const,
  },

  vendor_user: {
    name: "Vendor User",
    description: "Vendor staff member with limited access",
    userType: "Vendor User" as UserType,
    permissions: {
      dashboard: ["view"],
      vendors: ["view"],
      notifications: ["view"],
    },
    approvalLimit: 0,
    canApproveOrders: false,
    dataVisibility: "Own Only" as const,
  },
});

export type RoleTemplateKey = keyof typeof ROLE_TEMPLATES;

// ─────────────────────────────────────────────────────────────────
// PERMISSION CHECKING UTILITIES
// ─────────────────────────────────────────────────────────────────

export function hasPermission(
  moduleId: string,
  action: PermissionAction,
  roleTemplate: string,
): boolean {
  const template = ROLE_TEMPLATES[roleTemplate as RoleTemplateKey];
  if (!template) return false;

  const modulePerms = template.permissions[
    moduleId as keyof typeof template.permissions
  ] as readonly PermissionAction[] | undefined;
  if (!modulePerms) return false;

  return modulePerms.includes(action);
}

export function hasApprovalCapability(
  roleTemplate: string,
  amount: number,
): boolean {
  const template = ROLE_TEMPLATES[roleTemplate as RoleTemplateKey];
  if (!template) return false;

  return template.canApproveOrders && amount <= template.approvalLimit;
}

export function getModuleDisplayName(moduleId: string): string {
  return AVAILABLE_MODULES.find((m) => m.id === moduleId)?.name || moduleId;
}

export function filterModulesByRole(roleTemplate: string): string[] {
  const template = ROLE_TEMPLATES[roleTemplate as RoleTemplateKey];
  if (!template) return [];
  return Object.keys(template.permissions);
}

// ─────────────────────────────────────────────────────────────────
// PERMISSION MATRIX GENERATION
// ─────────────────────────────────────────────────────────────────

export interface PermissionMatrix {
  moduleId: string;
  moduleName: string;
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  approve: boolean;
  export: boolean;
}

export function generatePermissionMatrix(
  roleTemplate: string,
): PermissionMatrix[] {
  const template = ROLE_TEMPLATES[roleTemplate as RoleTemplateKey];
  if (!template) return [];

  return AVAILABLE_MODULES.map((module) => ({
    moduleId: module.id,
    moduleName: module.name,
    view: hasPermission(module.id, "view", roleTemplate),
    create: hasPermission(module.id, "create", roleTemplate),
    edit: hasPermission(module.id, "edit", roleTemplate),
    delete: hasPermission(module.id, "delete", roleTemplate),
    approve: hasPermission(module.id, "approve", roleTemplate),
    export: hasPermission(module.id, "export", roleTemplate),
  }));
}

// ─────────────────────────────────────────────────────────────────
// PASSWORD HASHING UTILITIES
// ─────────────────────────────────────────────────────────────────

export function generateTemporaryPassword(): string {
  return (
    Math.random().toString(36).slice(2, 10).toUpperCase() +
    Math.random().toString(36).slice(2, 4)
  );
}

export function hashPassword(password: string): string {
  // Note: In production, use bcryptjs or similar
  // This is a simple hash for demonstration
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
  }
  return Math.abs(hash).toString(36) + "_" + btoa(password);
}

export function verifyPassword(password: string, hash: string): boolean {
  // For demonstration only - use bcryptjs in production
  return hashPassword(password) === hash;
}

// ─────────────────────────────────────────────────────────────────
// USER TYPE & DATA VISIBILITY
// ─────────────────────────────────────────────────────────────────

export function canSeeAllData(roleTemplate: string): boolean {
  const template = ROLE_TEMPLATES[roleTemplate as RoleTemplateKey];
  return template?.dataVisibility === "All";
}

export function getDataVisibilityScopes(roleTemplate: string): string[] {
  const template = ROLE_TEMPLATES[roleTemplate as RoleTemplateKey];
  if (!template) return [];

  if (template.dataVisibility === "All") {
    return ["all_data"];
  } else if (template.dataVisibility === "Department Only") {
    return ["own_department"];
  }
  return ["own_records"];
}
