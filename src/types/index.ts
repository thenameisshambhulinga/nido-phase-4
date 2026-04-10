// ── GENERAL SETTINGS ──────────────────────────────────────────────
export interface GeneralSettings {
  companyName: string;
  companyLogo?: string;
  apiBaseUrl?: string;
  apiClientId?: string;
  apiKeyLabel?: string;
  webhookUrl?: string;
  currency: string;
  dateFormat: string;
  timezone: string;
  language: string;
  fiscalYearStart: string;
  taxId: string;
  gstNumber: string;
  panNumber: string;
  address: string;
  phone: string;
  email: string;
  poPrefix?: string;
  quotationPrefix?: string;
  estimationPrefix?: string;
  invoicePrefix?: string;
  clientCodePrefix?: string;
  vendorCodePrefix?: string;
  productCodePrefix?: string;
  salesOrderPrefix?: string;
  deliveryChallanPrefix?: string;
  creditNotePrefix?: string;
}

// ── MODULE PERMISSIONS ─────────────────────────────────────────────
export interface ModulePermission {
  module: string;
  enabled: boolean;
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  export: boolean;
}

// ── USER ROLES ────────────────────────────────────────────────────
export interface UserRole {
  id: string;
  name: string;
  description: string;
  roleType: "Internal User" | "Client User";
  roleCode: string;
  status: "Active" | "Inactive";
  isDefault: boolean;
  assignedUsers: number;
  modulePermissions: ModulePermission[];
  dataVisibility: "All" | "Department Only" | "Own Only";
  locationAccess: "All" | "Selected Locations" | "Assigned Location";
  canApproveOrders: boolean;
  approvalLimit: number;
}

// ── APP USER ──────────────────────────────────────────────────────
export interface AppUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  phone: string;
  jobTitle: string;
  department: string;
  roleId: string;
  organizationAccess: string;
  userType: "Internal User" | "Client User";
  status: "Active" | "Inactive" | "Suspended";
  createdAt: string;
}

// ── ORGANIZATION ──────────────────────────────────────────────────
export interface Organization {
  id: string;
  name: string;
  gstNumber?: string;
  address?: string;
  phone?: string;
  email?: string;
}

// ── MODULES LIST ──────────────────────────────────────────────────
export const MODULES = [
  "Dashboard",
  "Orders (Purchase Orders)",
  "Services",
  "Shop",
  "Vendors",
  "Clients",
  "Inventory",
  "Transactions",
  "Invoices",
  "Invoices & Payments",
  "Reports & Analytics",
  "Configuration",
  "Approvals",
  "Audit Trail",
  "Notifications",
];
