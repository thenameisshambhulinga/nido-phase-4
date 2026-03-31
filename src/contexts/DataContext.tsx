import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import type {
  GeneralSettings,
  UserRole,
  AppUser,
  Organization,
  ModulePermission,
  MODULES,
} from "@/types";

export interface Order {
  id: string;
  orderNumber: string;
  orderDate: string;
  organization: string;
  requestingUser: string;
  approvingUser: string;
  status: string;
  assignedUser?: string;
  items: OrderItem[];
  billingAddress: string;
  shippingAddress: string;
  paymentMethod: string;
  deliveryMethod: string;
  trackingNumber: string;
  slaStartTime: string;
  slaStatus: "within_sla" | "at_risk" | "breached";
  assignedAnalyst: string;
  analystTeam: string;
  totalAmount: number;
  comments: Comment[];
  attachments: string[];
}

export interface OrderItem {
  id: string;
  name: string;
  description: string;
  sku: string;
  quantity: number;
  pricePerItem: number;
  totalCost: number;
  image?: string;
}

export interface Comment {
  id: string;
  user: string;
  text: string;
  timestamp: string;
  type: "internal" | "external";
}

export interface Vendor {
  id: string;
  name: string;
  category: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  status: "active" | "inactive" | "pending";
  rating: number;
  totalOrders: number;
  totalSpend: number;
  joinDate: string;
}

export interface Client {
  id: string;
  name: string;
  companyName?: string;
  clientCode?: string;
  contactPerson: string;
  contactEmployeeId?: string;
  contactNumber?: string;
  jobTitle?: string;
  email: string;
  gst?: string;
  pan?: string;
  industryType?: string;
  businessType?: "Registered" | "Unregistered" | "Consumer";
  locationDetails?: {
    address: string;
    city: string;
    state: string;
    country: string;
    currency: string;
    zipCode: string;
    timeZone: string;
  };
  contractType?: string;
  paymentTerms?: string;
  companyLogo?: string;
  contractDocuments?: string[];
  notes?: string;
  phone: string;
  address: string;
  status: "active" | "inactive";
  contractStart: string;
  contractEnd: string;
  totalOrders: number;
}

export interface Location {
  id: string;
  code: string;
  name: string;
  group: string;
  country: string;
  city: string;
  status: "active" | "inactive";
  type: "automated" | "manual";
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  module: string;
  details: string;
  ipAddress: string;
  status: "success" | "failed";
}

export interface OrderStatus {
  id: string;
  name: string;
  color: string;
  description: string;
  isVisible: boolean;
  sortOrder: number;
  isDefault: boolean;
}

export interface ApprovalWorkflow {
  id: string;
  name: string;
  module: string;
  steps: { role: string; order: number }[];
  slaHours: number;
  escalationEmail: string;
  status: "active" | "inactive";
}

export interface VendorCategory {
  id: string;
  name: string;
  code: string;
  description: string;
  parentCategory?: string;
  status: "active" | "inactive";
  vendorCount: number;
  approvalRequired: boolean;
  slaTemplate: string;
}

export interface NotificationRule {
  id: string;
  event: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  inAppEnabled: boolean;
  recipients: string[];
}

export interface Role {
  id: string;
  name: string;
  description: string;
  users: number;
  modules: string[];
  status: "active" | "inactive";
  permissions: Record<string, Record<string, boolean>>;
}

interface DataContextType {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  vendors: Vendor[];
  clients: Client[];
  locations: Location[];
  auditTrail: AuditEntry[];
  orderStatuses: OrderStatus[];
  approvalWorkflows: ApprovalWorkflow[];
  vendorCategories: VendorCategory[];
  notificationRules: NotificationRule[];
  roles: Role[];
  organizations: Organization[];
  generalSettings: Record<string, GeneralSettings>;
  userRoles: UserRole[];
  appUsers: AppUser[];
  addOrder: (order: Partial<Order>) => void;
  updateOrder: (id: string, data: Partial<Order>) => void;
  deleteOrder: (id: string) => void;
  addVendor: (vendor: Partial<Vendor>) => void;
  updateVendor: (id: string, data: Partial<Vendor>) => void;
  deleteVendor: (id: string) => void;
  addClient: (client: Partial<Client>) => void;
  updateClient: (id: string, data: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  addLocation: (loc: Partial<Location>) => void;
  updateLocation: (id: string, data: Partial<Location>) => void;
  deleteLocation: (id: string) => void;
  addAuditEntry: (entry: Partial<AuditEntry>) => void;
  addOrderStatus: (s: Partial<OrderStatus>) => void;
  updateOrderStatus: (id: string, data: Partial<OrderStatus>) => void;
  deleteOrderStatus: (id: string) => void;
  addApprovalWorkflow: (w: Partial<ApprovalWorkflow>) => void;
  updateApprovalWorkflow: (id: string, data: Partial<ApprovalWorkflow>) => void;
  deleteApprovalWorkflow: (id: string) => void;
  addVendorCategory: (c: Partial<VendorCategory>) => void;
  updateVendorCategory: (id: string, data: Partial<VendorCategory>) => void;
  deleteVendorCategory: (id: string) => void;
  updateNotificationRule: (id: string, data: Partial<NotificationRule>) => void;
  addRole: (role: Partial<Role>) => void;
  updateRole: (id: string, data: Partial<Role>) => void;
  deleteRole: (id: string) => void;
  updateGeneralSettings: (
    orgId: string,
    settings: Partial<GeneralSettings>,
  ) => void;
  addUserRole: (role: Omit<UserRole, "id">) => void;
  updateUserRole: (id: string, data: Partial<UserRole>) => void;
  deleteUserRole: (id: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

function usePersistedState<T>(
  key: string,
  defaultValue: T,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  });
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);
  return [state, setState];
}

const DEFAULT_ORDERS: Order[] = [
  {
    id: "ord-1",
    orderNumber: "2498563",
    orderDate: "2026-01-03",
    organization: "Apex Tech Solutions",
    requestingUser: "Jane Smith",
    approvingUser: "David Chen",
    status: "Processing",
    assignedUser: "Mark Adams",
    items: [
      {
        id: "i1",
        name: "Apple iPhone 16 128GB Black",
        description: "Apple iPhone 16 128GB Black",
        sku: "SK0123566",
        quantity: 50,
        pricePerItem: 1160,
        totalCost: 58000,
      },
      {
        id: "i1b",
        name: "HP LaserJet Pro M404dn Printer",
        description: "Office network printer",
        sku: "SK0198432",
        quantity: 10,
        pricePerItem: 400,
        totalCost: 4000,
      },
      {
        id: "i1c",
        name: "Ergonomic Office Chair – Mesh Back",
        description: "Adjustable lumbar support chair",
        sku: "SK0234891",
        quantity: 30,
        pricePerItem: 150,
        totalCost: 4500,
      },
    ],
    billingAddress: "1234 Hammain Street, Wilts Fore, LX 99550",
    shippingAddress: "1234 Hammain Street, Wilts Fore, LX 99550",
    paymentMethod: "Corporate Credit Card **** 5678",
    deliveryMethod: "Express Air",
    trackingNumber: "NT123456789",
    slaStartTime: "2026-01-03T09:30:00",
    slaStatus: "within_sla",
    assignedAnalyst: "Mark Adams",
    analystTeam: "IT Procurement",
    totalAmount: 66500,
    comments: [
      {
        id: "c1",
        user: "Mark Adams",
        text: "Order received and being processed.",
        timestamp: "2026-01-03T09:30:00",
        type: "internal",
      },
      {
        id: "c2",
        user: "Davie Smith",
        text: "Intense.",
        timestamp: "2026-01-03T10:00:00",
        type: "internal",
      },
    ],
    attachments: [
      "Purchase_Order.pdf",
      "Invoice_2498563.pdf",
      "Delivery_Schedule.xlsx",
      "Specifications.pdf",
    ],
  },
  {
    id: "ord-2",
    orderNumber: "2498564",
    orderDate: "2026-01-04",
    organization: "Global Corp",
    requestingUser: "John Doe",
    approvingUser: "Mark Adams",
    status: "Approved",
    assignedUser: "Jane Smith",
    items: [
      {
        id: "i2",
        name: "Dell Latitude 5540",
        description: "Dell Laptop",
        sku: "SK0123567",
        quantity: 20,
        pricePerItem: 1200,
        totalCost: 24000,
      },
      {
        id: "i2b",
        name: "Cisco Catalyst 9200 Switch",
        description: "48-port managed switch",
        sku: "SK0345612",
        quantity: 8,
        pricePerItem: 900,
        totalCost: 7200,
      },
    ],
    billingAddress: "5678 Tech Avenue, Silicon Valley, CA 94000",
    shippingAddress: "5678 Tech Avenue, Silicon Valley, CA 94000",
    paymentMethod: "Wire Transfer",
    deliveryMethod: "Ground",
    trackingNumber: "NT987654321",
    slaStartTime: "2026-01-04T10:00:00",
    slaStatus: "within_sla",
    assignedAnalyst: "Jane Smith",
    analystTeam: "IT Procurement",
    totalAmount: 31200,
    comments: [],
    attachments: [],
  },
  {
    id: "ord-3",
    orderNumber: "2498565",
    orderDate: "2026-01-05",
    organization: "Apex Tech Solutions",
    requestingUser: "Alice Brown",
    approvingUser: "David Chen",
    status: "Pending",
    assignedUser: "Mark Adams",
    items: [
      {
        id: "i3",
        name: "Samsung Galaxy S24",
        description: "Samsung Phone",
        sku: "SK0123568",
        quantity: 30,
        pricePerItem: 900,
        totalCost: 27000,
      },
      {
        id: "i3b",
        name: "Hikvision CCTV IP Camera 4MP",
        description: "Outdoor surveillance camera",
        sku: "SK0456789",
        quantity: 15,
        pricePerItem: 200,
        totalCost: 3000,
      },
      {
        id: "i3c",
        name: "Standing Desk – Electric Adjustable",
        description: "Sit-stand convertible desk",
        sku: "SK0567123",
        quantity: 10,
        pricePerItem: 450,
        totalCost: 4500,
      },
    ],
    billingAddress: "9012 Innovation Blvd, Austin, TX 73301",
    shippingAddress: "9012 Innovation Blvd, Austin, TX 73301",
    paymentMethod: "Purchase Order",
    deliveryMethod: "Express Air",
    trackingNumber: "",
    slaStartTime: "2026-01-05T08:00:00",
    slaStatus: "at_risk",
    assignedAnalyst: "Mark Adams",
    analystTeam: "Mobile",
    totalAmount: 34500,
    comments: [],
    attachments: [],
  },
];

const DEFAULT_VENDORS: Vendor[] = [
  {
    id: "v1",
    name: "Apex Tech Solutions",
    category: "IT Hardware",
    contactEmail: "contact@apex.com",
    contactPhone: "+1-555-0100",
    address: "123 Tech St, San Diego, CA",
    status: "active",
    rating: 4.5,
    totalOrders: 156,
    totalSpend: 2450000,
    joinDate: "2024-01-15",
  },
  {
    id: "v2",
    name: "Global Supply Co",
    category: "Office Supplies",
    contactEmail: "info@globalsupply.com",
    contactPhone: "+1-555-0200",
    address: "456 Supply Ave, Houston, TX",
    status: "active",
    rating: 4.2,
    totalOrders: 89,
    totalSpend: 890000,
    joinDate: "2024-03-20",
  },
  {
    id: "v3",
    name: "SecureTech Ltd",
    category: "Security Systems",
    contactEmail: "sales@securetech.com",
    contactPhone: "+1-555-0300",
    address: "789 Security Blvd, New York, NY",
    status: "active",
    rating: 4.8,
    totalOrders: 45,
    totalSpend: 1200000,
    joinDate: "2024-05-10",
  },
  {
    id: "v4",
    name: "CloudNet Services",
    category: "Cloud Services",
    contactEmail: "hello@cloudnet.com",
    contactPhone: "+1-555-0400",
    address: "321 Cloud Way, Seattle, WA",
    status: "pending",
    rating: 4.0,
    totalOrders: 12,
    totalSpend: 340000,
    joinDate: "2025-01-05",
  },
  {
    id: "v5",
    name: "EuroTech GmbH",
    category: "IT Hardware",
    contactEmail: "kontakt@eurotech.de",
    contactPhone: "+49-555-0500",
    address: "10 Technik Str, Berlin, DE",
    status: "active",
    rating: 4.6,
    totalOrders: 67,
    totalSpend: 1800000,
    joinDate: "2024-06-15",
  },
];

const DEFAULT_CLIENTS: Client[] = [
  {
    id: "cl1",
    name: "Apex Tech Solutions",
    clientCode: "CL-1001",
    contactPerson: "Jane Smith",
    contactEmployeeId: "EMP-201",
    contactNumber: "+1-555-1000",
    jobTitle: "Procurement Lead",
    email: "jane@apex.com",
    gst: "27AACCN1234A1Z5",
    pan: "AACCN1234A",
    industryType: "Technology",
    businessType: "Registered",
    locationDetails: {
      address: "123 Corp Ave",
      city: "San Diego",
      state: "California",
      country: "USA",
      currency: "USD",
      zipCode: "92101",
      timeZone: "America/Los_Angeles",
    },
    contractType: "Fixed",
    paymentTerms: "NET 30",
    phone: "+1-555-1000",
    address: "123 Corp Ave, San Diego, CA",
    status: "active",
    contractStart: "2025-01-01",
    contractEnd: "2026-12-31",
    totalOrders: 45,
  },
  {
    id: "cl2",
    name: "Global Corp Industries",
    clientCode: "CL-1002",
    contactPerson: "John Doe",
    contactEmployeeId: "EMP-307",
    contactNumber: "+1-555-2000",
    jobTitle: "Operations Manager",
    email: "john@globalcorp.com",
    gst: "29AACCG9321B1Z1",
    pan: "AACCG9321B",
    industryType: "Manufacturing",
    businessType: "Registered",
    locationDetails: {
      address: "456 Industry Blvd",
      city: "Houston",
      state: "Texas",
      country: "USA",
      currency: "USD",
      zipCode: "77001",
      timeZone: "America/Chicago",
    },
    contractType: "Subscription",
    paymentTerms: "NET 45",
    phone: "+1-555-2000",
    address: "456 Industry Blvd, Houston, TX",
    status: "active",
    contractStart: "2025-03-01",
    contractEnd: "2027-02-28",
    totalOrders: 23,
  },
  {
    id: "cl3",
    name: "EuroTech Partners",
    clientCode: "CL-1003",
    contactPerson: "Hans Mueller",
    contactEmployeeId: "EMP-451",
    contactNumber: "+49-555-3000",
    jobTitle: "Client Program Manager",
    email: "hans@europartners.de",
    pan: "AAACP7654R",
    industryType: "Consulting",
    businessType: "Unregistered",
    locationDetails: {
      address: "789 Europa Str",
      city: "Berlin",
      state: "Berlin",
      country: "Germany",
      currency: "EUR",
      zipCode: "10115",
      timeZone: "Europe/Berlin",
    },
    contractType: "Postpaid",
    paymentTerms: "Due on Receipt",
    phone: "+49-555-3000",
    address: "789 Europa Str, Berlin, DE",
    status: "active",
    contractStart: "2025-06-01",
    contractEnd: "2026-05-31",
    totalOrders: 12,
  },
];

const DEFAULT_LOCATIONS: Location[] = [
  {
    id: "loc1",
    code: "HQ001",
    name: "Headquarters",
    group: "US-West",
    country: "US",
    city: "San Diego, CA",
    status: "active",
    type: "automated",
  },
  {
    id: "loc2",
    code: "DW102",
    name: "Distribution Warehouse",
    group: "US-Central",
    country: "US",
    city: "Houston, TX",
    status: "active",
    type: "manual",
  },
  {
    id: "loc3",
    code: "ON305",
    name: "Regional Office NYC",
    group: "US-East",
    country: "US",
    city: "New York, NY",
    status: "active",
    type: "manual",
  },
  {
    id: "loc4",
    code: "ITL501",
    name: "International Logistics Hub",
    group: "EMEA",
    country: "UK",
    city: "London, UK",
    status: "active",
    type: "automated",
  },
  {
    id: "loc5",
    code: "RTB200",
    name: "Retail Branch Berlin",
    group: "EMEA",
    country: "DE",
    city: "Berlin, DE",
    status: "active",
    type: "manual",
  },
];

const DEFAULT_AUDIT: AuditEntry[] = [
  {
    id: "a1",
    timestamp: "2026-01-03T09:30:00",
    user: "Mark Adams",
    action: "Order Created",
    module: "Procure",
    details: "Created order #2498563",
    ipAddress: "192.168.1.100",
    status: "success",
  },
  {
    id: "a2",
    timestamp: "2026-01-03T10:15:00",
    user: "Jane Smith",
    action: "Vendor Updated",
    module: "Vendors",
    details: "Updated Apex Tech Solutions profile",
    ipAddress: "192.168.1.101",
    status: "success",
  },
  {
    id: "a3",
    timestamp: "2026-01-04T08:00:00",
    user: "David Chen",
    action: "Order Approved",
    module: "Procure",
    details: "Approved order #2498564",
    ipAddress: "192.168.1.102",
    status: "success",
  },
  {
    id: "a4",
    timestamp: "2026-01-04T14:30:00",
    user: "System",
    action: "Login Failed",
    module: "Auth",
    details: "Failed login attempt for unknown@test.com",
    ipAddress: "10.0.0.50",
    status: "failed",
  },
  {
    id: "a5",
    timestamp: "2026-01-05T11:00:00",
    user: "Mark Adams",
    action: "Role Modified",
    module: "Permissions",
    details: "Updated Procurement Manager permissions",
    ipAddress: "192.168.1.100",
    status: "success",
  },
];

const DEFAULT_ORDER_STATUSES: OrderStatus[] = [
  {
    id: "os1",
    name: "Pending",
    color: "#F59E0B",
    description: "Order awaiting review",
    isVisible: true,
    sortOrder: 1,
    isDefault: true,
  },
  {
    id: "os2",
    name: "Processing",
    color: "#F97316",
    description: "Order being processed",
    isVisible: true,
    sortOrder: 2,
    isDefault: false,
  },
  {
    id: "os3",
    name: "Approved",
    color: "#10B981",
    description: "Order approved",
    isVisible: true,
    sortOrder: 3,
    isDefault: false,
  },
  {
    id: "os4",
    name: "Shipped",
    color: "#3B82F6",
    description: "Order shipped",
    isVisible: true,
    sortOrder: 4,
    isDefault: false,
  },
  {
    id: "os5",
    name: "Delivered",
    color: "#059669",
    description: "Order delivered",
    isVisible: true,
    sortOrder: 5,
    isDefault: false,
  },
  {
    id: "os6",
    name: "Cancelled",
    color: "#EF4444",
    description: "Order cancelled",
    isVisible: true,
    sortOrder: 6,
    isDefault: false,
  },
  {
    id: "os7",
    name: "On Hold",
    color: "#6B7280",
    description: "Order on hold",
    isVisible: true,
    sortOrder: 7,
    isDefault: false,
  },
  {
    id: "os8",
    name: "Returned",
    color: "#8B5CF6",
    description: "Order returned",
    isVisible: false,
    sortOrder: 8,
    isDefault: false,
  },
];

const DEFAULT_WORKFLOWS: ApprovalWorkflow[] = [
  {
    id: "wf1",
    name: "Standard Purchase",
    module: "Procure",
    steps: [
      { role: "procurement_manager", order: 1 },
      { role: "admin", order: 2 },
    ],
    slaHours: 24,
    escalationEmail: "admin@nidotech.com",
    status: "active",
  },
  {
    id: "wf2",
    name: "High Value Purchase",
    module: "Procure",
    steps: [
      { role: "procurement_manager", order: 1 },
      { role: "admin", order: 2 },
      { role: "owner", order: 3 },
    ],
    slaHours: 48,
    escalationEmail: "owner@nidotech.com",
    status: "active",
  },
  {
    id: "wf3",
    name: "Vendor Onboarding",
    module: "Vendors",
    steps: [
      { role: "vendor_admin", order: 1 },
      { role: "admin", order: 2 },
    ],
    slaHours: 72,
    escalationEmail: "admin@nidotech.com",
    status: "active",
  },
];

const DEFAULT_VENDOR_CATEGORIES: VendorCategory[] = [
  {
    id: "vc1",
    name: "IT Hardware",
    code: "ITH",
    description: "Computer hardware and peripherals",
    status: "active",
    vendorCount: 12,
    approvalRequired: true,
    slaTemplate: "Standard",
  },
  {
    id: "vc2",
    name: "Office Supplies",
    code: "OFS",
    description: "General office supplies and stationery",
    status: "active",
    vendorCount: 8,
    approvalRequired: false,
    slaTemplate: "Basic",
  },
  {
    id: "vc3",
    name: "Cloud Services",
    code: "CLS",
    description: "Cloud computing and SaaS solutions",
    status: "active",
    vendorCount: 5,
    approvalRequired: true,
    slaTemplate: "Premium",
  },
  {
    id: "vc4",
    name: "Security Systems",
    code: "SEC",
    description: "Physical and cyber security solutions",
    status: "active",
    vendorCount: 3,
    approvalRequired: true,
    slaTemplate: "Premium",
  },
  {
    id: "vc5",
    name: "Consulting",
    code: "CON",
    description: "Professional consulting services",
    status: "active",
    vendorCount: 7,
    approvalRequired: true,
    slaTemplate: "Standard",
  },
];

const DEFAULT_NOTIFICATION_RULES: NotificationRule[] = [
  {
    id: "nr1",
    event: "New Order Created",
    emailEnabled: true,
    smsEnabled: false,
    inAppEnabled: true,
    recipients: ["admin", "procurement_manager"],
  },
  {
    id: "nr2",
    event: "Order Approved",
    emailEnabled: true,
    smsEnabled: true,
    inAppEnabled: true,
    recipients: ["admin", "requestor"],
  },
  {
    id: "nr3",
    event: "Order Rejected",
    emailEnabled: true,
    smsEnabled: true,
    inAppEnabled: true,
    recipients: ["admin", "requestor"],
  },
  {
    id: "nr4",
    event: "SLA Breach Warning",
    emailEnabled: true,
    smsEnabled: true,
    inAppEnabled: true,
    recipients: ["admin", "assigned_analyst"],
  },
  {
    id: "nr5",
    event: "Vendor Registration",
    emailEnabled: true,
    smsEnabled: false,
    inAppEnabled: true,
    recipients: ["admin", "vendor_admin"],
  },
  {
    id: "nr6",
    event: "Payment Due",
    emailEnabled: true,
    smsEnabled: false,
    inAppEnabled: true,
    recipients: ["accounts_payable"],
  },
  {
    id: "nr7",
    event: "Contract Expiring",
    emailEnabled: true,
    smsEnabled: false,
    inAppEnabled: true,
    recipients: ["admin", "procurement_manager"],
  },
];

const DEFAULT_ROLES: Role[] = [
  {
    id: "r1",
    name: "Admin",
    description: "Full access to all modules and settings.",
    users: 2,
    modules: ["All Modules"],
    status: "active",
    permissions: {
      general: {
        dashboard: true,
        shop: true,
        vendors: true,
        procure: true,
        clients: true,
        user_info: true,
        reports: true,
        configuration: true,
      },
      order_management: {
        dashboard: true,
        shop: true,
        vendors: true,
        procure: true,
        clients: false,
        user_info: true,
        reports: true,
        configuration: true,
      },
      vendor_management: {
        dashboard: true,
        shop: false,
        vendors: true,
        procure: false,
        clients: false,
        user_info: true,
        reports: true,
        configuration: false,
      },
      approval_workflows: {
        dashboard: true,
        shop: true,
        vendors: true,
        procure: false,
        clients: false,
        user_info: true,
        reports: true,
        configuration: false,
      },
    },
  },
  {
    id: "r2",
    name: "Procurement Manager",
    description: "Handles purchase orders and procurement.",
    users: 3,
    modules: ["Dashboard", "Shop", "Vendors", "Procure"],
    status: "active",
    permissions: {
      general: {
        dashboard: true,
        shop: true,
        vendors: true,
        procure: true,
        clients: false,
        user_info: false,
        reports: false,
        configuration: false,
      },
      order_management: {
        dashboard: true,
        shop: true,
        vendors: false,
        procure: true,
        clients: false,
        user_info: false,
        reports: false,
        configuration: false,
      },
      vendor_management: {
        dashboard: true,
        shop: false,
        vendors: false,
        procure: false,
        clients: false,
        user_info: false,
        reports: false,
        configuration: false,
      },
      approval_workflows: {
        dashboard: true,
        shop: true,
        vendors: false,
        procure: false,
        clients: false,
        user_info: false,
        reports: false,
        configuration: false,
      },
    },
  },
  {
    id: "r3",
    name: "Accounts Payable (AP)",
    description: "Manages invoices and payments.",
    users: 5,
    modules: ["Dashboard", "Clients", "Reports"],
    status: "active",
    permissions: {
      general: {
        dashboard: true,
        shop: false,
        vendors: false,
        procure: false,
        clients: true,
        user_info: false,
        reports: true,
        configuration: false,
      },
      order_management: {
        dashboard: true,
        shop: false,
        vendors: false,
        procure: false,
        clients: true,
        user_info: false,
        reports: true,
        configuration: false,
      },
      vendor_management: {
        dashboard: false,
        shop: false,
        vendors: false,
        procure: false,
        clients: false,
        user_info: false,
        reports: false,
        configuration: false,
      },
      approval_workflows: {
        dashboard: false,
        shop: false,
        vendors: false,
        procure: false,
        clients: false,
        user_info: false,
        reports: false,
        configuration: false,
      },
    },
  },
  {
    id: "r4",
    name: "Vendor Admin",
    description: "Manages vendor information and submissions.",
    users: 4,
    modules: ["Dashboard", "Vendors"],
    status: "active",
    permissions: {
      general: {
        dashboard: true,
        shop: false,
        vendors: true,
        procure: false,
        clients: false,
        user_info: false,
        reports: false,
        configuration: false,
      },
      order_management: {
        dashboard: false,
        shop: false,
        vendors: false,
        procure: false,
        clients: false,
        user_info: false,
        reports: false,
        configuration: false,
      },
      vendor_management: {
        dashboard: true,
        shop: false,
        vendors: true,
        procure: false,
        clients: false,
        user_info: false,
        reports: false,
        configuration: false,
      },
      approval_workflows: {
        dashboard: false,
        shop: false,
        vendors: false,
        procure: false,
        clients: false,
        user_info: false,
        reports: false,
        configuration: false,
      },
    },
  },
];

// ── DEFAULT ORGANIZATIONS ──────────────────────────────────────────
const DEFAULT_ORGANIZATIONS: Organization[] = [
  {
    id: "org-nido",
    name: "Nido Tech Pvt. Ltd.",
    gstNumber: "27AACCN1234A11ZD",
    address:
      "123 Corporate Ave, Suite 500, Chennai, Tamil Nadu, India – 600001",
    phone: "+91-44-1234-5678",
    email: "info@nido-tech.com",
  },
];

// ── DEFAULT GENERAL SETTINGS ───────────────────────────────────────
const DEFAULT_GENERAL_SETTINGS: Record<string, GeneralSettings> = {
  "org-nido": {
    companyName: "Nido Tech Pvt. Ltd.",
    currency: "INR",
    dateFormat: "DD/MM/YYYY",
    timezone: "Asia/Kolkata",
    language: "English",
    fiscalYearStart: "April",
    taxId: "",
    gstNumber: "27AACCN1234A11ZD",
    panNumber: "AACCN1234A",
    address:
      "123 Corporate Ave, Suite 500, Chennai, Tamil Nadu, India – 600001",
    phone: "+91-44-1234-5678",
    email: "info@nido-tech.com",
  },
};

// ── DEFAULT USER ROLES ────────────────────────────────────────────
const DEFAULT_USER_ROLES: UserRole[] = [
  {
    id: "ur-1",
    name: "System Owner",
    description: "Full system access with all permissions",
    roleType: "Internal User",
    roleCode: "SO",
    status: "Active",
    isDefault: true,
    assignedUsers: 1,
    modulePermissions: [
      {
        module: "Dashboard",
        enabled: true,
        view: true,
        create: true,
        edit: true,
        delete: true,
        export: true,
      },
      {
        module: "Orders (Purchase Orders)",
        enabled: true,
        view: true,
        create: true,
        edit: true,
        delete: true,
        export: true,
      },
      {
        module: "Vendors",
        enabled: true,
        view: true,
        create: true,
        edit: true,
        delete: true,
        export: true,
      },
      {
        module: "Clients",
        enabled: true,
        view: true,
        create: true,
        edit: true,
        delete: true,
        export: true,
      },
      {
        module: "Inventory",
        enabled: true,
        view: true,
        create: true,
        edit: true,
        delete: true,
        export: true,
      },
      {
        module: "Invoices & Payments",
        enabled: true,
        view: true,
        create: true,
        edit: true,
        delete: true,
        export: true,
      },
      {
        module: "Reports & Analytics",
        enabled: true,
        view: true,
        create: true,
        edit: true,
        delete: true,
        export: true,
      },
      {
        module: "Configuration",
        enabled: true,
        view: true,
        create: true,
        edit: true,
        delete: true,
        export: true,
      },
      {
        module: "Approvals",
        enabled: true,
        view: true,
        create: true,
        edit: true,
        delete: true,
        export: true,
      },
      {
        module: "Audit Trail",
        enabled: true,
        view: true,
        create: false,
        edit: false,
        delete: false,
        export: true,
      },
      {
        module: "Notifications",
        enabled: true,
        view: true,
        create: true,
        edit: true,
        delete: true,
        export: false,
      },
    ],
    dataVisibility: "All",
    locationAccess: "All",
    canApproveOrders: true,
    approvalLimit: 999999999,
  },
  {
    id: "ur-2",
    name: "Procurement Manager",
    description: "Manages purchase orders and procurement",
    roleType: "Internal User",
    roleCode: "PM",
    status: "Active",
    isDefault: false,
    assignedUsers: 2,
    modulePermissions: [
      {
        module: "Dashboard",
        enabled: true,
        view: true,
        create: false,
        edit: false,
        delete: false,
        export: false,
      },
      {
        module: "Orders (Purchase Orders)",
        enabled: true,
        view: true,
        create: true,
        edit: true,
        delete: false,
        export: true,
      },
      {
        module: "Vendors",
        enabled: true,
        view: true,
        create: true,
        edit: true,
        delete: false,
        export: true,
      },
      {
        module: "Clients",
        enabled: false,
        view: false,
        create: false,
        edit: false,
        delete: false,
        export: false,
      },
      {
        module: "Inventory",
        enabled: true,
        view: true,
        create: false,
        edit: false,
        delete: false,
        export: false,
      },
      {
        module: "Invoices & Payments",
        enabled: false,
        view: false,
        create: false,
        edit: false,
        delete: false,
        export: false,
      },
      {
        module: "Reports & Analytics",
        enabled: true,
        view: true,
        create: false,
        edit: false,
        delete: false,
        export: true,
      },
      {
        module: "Configuration",
        enabled: false,
        view: false,
        create: false,
        edit: false,
        delete: false,
        export: false,
      },
      {
        module: "Approvals",
        enabled: true,
        view: true,
        create: false,
        edit: false,
        delete: false,
        export: false,
      },
      {
        module: "Audit Trail",
        enabled: false,
        view: false,
        create: false,
        edit: false,
        delete: false,
        export: false,
      },
      {
        module: "Notifications",
        enabled: true,
        view: true,
        create: false,
        edit: false,
        delete: false,
        export: false,
      },
    ],
    dataVisibility: "Department Only",
    locationAccess: "All",
    canApproveOrders: true,
    approvalLimit: 500000,
  },
  {
    id: "ur-3",
    name: "Accounts Payable",
    description: "Manages invoices and payments",
    roleType: "Internal User",
    roleCode: "AP",
    status: "Active",
    isDefault: false,
    assignedUsers: 1,
    modulePermissions: [
      {
        module: "Dashboard",
        enabled: true,
        view: true,
        create: false,
        edit: false,
        delete: false,
        export: false,
      },
      {
        module: "Orders (Purchase Orders)",
        enabled: true,
        view: true,
        create: false,
        edit: false,
        delete: false,
        export: false,
      },
      {
        module: "Vendors",
        enabled: true,
        view: true,
        create: false,
        edit: false,
        delete: false,
        export: false,
      },
      {
        module: "Clients",
        enabled: true,
        view: true,
        create: false,
        edit: false,
        delete: false,
        export: false,
      },
      {
        module: "Inventory",
        enabled: false,
        view: false,
        create: false,
        edit: false,
        delete: false,
        export: false,
      },
      {
        module: "Invoices & Payments",
        enabled: true,
        view: true,
        create: true,
        edit: true,
        delete: false,
        export: true,
      },
      {
        module: "Reports & Analytics",
        enabled: true,
        view: true,
        create: false,
        edit: false,
        delete: false,
        export: true,
      },
      {
        module: "Configuration",
        enabled: false,
        view: false,
        create: false,
        edit: false,
        delete: false,
        export: false,
      },
      {
        module: "Approvals",
        enabled: false,
        view: false,
        create: false,
        edit: false,
        delete: false,
        export: false,
      },
      {
        module: "Audit Trail",
        enabled: false,
        view: false,
        create: false,
        edit: false,
        delete: false,
        export: false,
      },
      {
        module: "Notifications",
        enabled: true,
        view: true,
        create: false,
        edit: false,
        delete: false,
        export: false,
      },
    ],
    dataVisibility: "All",
    locationAccess: "All",
    canApproveOrders: false,
    approvalLimit: 0,
  },
  {
    id: "ur-4",
    name: "Vendor Admin",
    description: "Manages vendor information",
    roleType: "Client User",
    roleCode: "VA",
    status: "Active",
    isDefault: false,
    assignedUsers: 1,
    modulePermissions: [
      {
        module: "Dashboard",
        enabled: true,
        view: true,
        create: false,
        edit: false,
        delete: false,
        export: false,
      },
      {
        module: "Orders (Purchase Orders)",
        enabled: true,
        view: true,
        create: false,
        edit: false,
        delete: false,
        export: false,
      },
      {
        module: "Vendors",
        enabled: true,
        view: true,
        create: false,
        edit: true,
        delete: false,
        export: false,
      },
      {
        module: "Clients",
        enabled: false,
        view: false,
        create: false,
        edit: false,
        delete: false,
        export: false,
      },
      {
        module: "Inventory",
        enabled: false,
        view: false,
        create: false,
        edit: false,
        delete: false,
        export: false,
      },
      {
        module: "Invoices & Payments",
        enabled: false,
        view: false,
        create: false,
        edit: false,
        delete: false,
        export: false,
      },
      {
        module: "Reports & Analytics",
        enabled: false,
        view: false,
        create: false,
        edit: false,
        delete: false,
        export: false,
      },
      {
        module: "Configuration",
        enabled: false,
        view: false,
        create: false,
        edit: false,
        delete: false,
        export: false,
      },
      {
        module: "Approvals",
        enabled: false,
        view: false,
        create: false,
        edit: false,
        delete: false,
        export: false,
      },
      {
        module: "Audit Trail",
        enabled: false,
        view: false,
        create: false,
        edit: false,
        delete: false,
        export: false,
      },
      {
        module: "Notifications",
        enabled: true,
        view: true,
        create: false,
        edit: false,
        delete: false,
        export: false,
      },
    ],
    dataVisibility: "Own Only",
    locationAccess: "Assigned Location",
    canApproveOrders: false,
    approvalLimit: 0,
  },
];

// ── DEFAULT APP USERS ────────────────────────────────────────────
const DEFAULT_APP_USERS: AppUser[] = [
  {
    id: "u1",
    username: "systemowner",
    email: "owner@nidotech.com",
    fullName: "System Owner",
    phone: "+91-9876543210",
    jobTitle: "CEO",
    department: "Management",
    roleId: "ur-1",
    organizationAccess: "Nido Tech Pvt. Ltd.",
    userType: "Internal User",
    status: "Active",
    createdAt: "2024-01-15",
  },
  {
    id: "u2",
    username: "markadams",
    email: "admin@nidotech.com",
    fullName: "Mark Adams",
    phone: "+91-9876543211",
    jobTitle: "System Admin",
    department: "IT",
    roleId: "ur-1",
    organizationAccess: "Nido Tech Pvt. Ltd.",
    userType: "Internal User",
    status: "Active",
    createdAt: "2024-02-20",
  },
  {
    id: "u3",
    username: "janesmith",
    email: "procurement@nidotech.com",
    fullName: "Jane Smith",
    phone: "+91-9876543212",
    jobTitle: "Procurement Manager",
    department: "Procurement",
    roleId: "ur-2",
    organizationAccess: "Nido Tech Pvt. Ltd.",
    userType: "Internal User",
    status: "Active",
    createdAt: "2024-03-10",
  },
  {
    id: "u4",
    username: "davidchen",
    email: "ap@nidotech.com",
    fullName: "David Chen",
    phone: "+91-9876543213",
    jobTitle: "Accounts Payable",
    department: "Finance",
    roleId: "ur-3",
    organizationAccess: "Nido Tech Pvt. Ltd.",
    userType: "Internal User",
    status: "Active",
    createdAt: "2024-04-05",
  },
];

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [orders, setOrders] = usePersistedState("nido_orders", DEFAULT_ORDERS);
  const [vendors, setVendors] = usePersistedState(
    "nido_vendors",
    DEFAULT_VENDORS,
  );
  const [clients, setClients] = usePersistedState(
    "nido_clients",
    DEFAULT_CLIENTS,
  );
  const [locations, setLocations] = usePersistedState(
    "nido_locations",
    DEFAULT_LOCATIONS,
  );
  const [auditTrail, setAuditTrail] = usePersistedState(
    "nido_audit",
    DEFAULT_AUDIT,
  );
  const [orderStatuses, setOrderStatuses] = usePersistedState(
    "nido_order_statuses",
    DEFAULT_ORDER_STATUSES,
  );
  const [approvalWorkflows, setApprovalWorkflows] = usePersistedState(
    "nido_workflows",
    DEFAULT_WORKFLOWS,
  );
  const [vendorCategories, setVendorCategories] = usePersistedState(
    "nido_vendor_categories",
    DEFAULT_VENDOR_CATEGORIES,
  );
  const [notificationRules, setNotificationRules] = usePersistedState(
    "nido_notification_rules",
    DEFAULT_NOTIFICATION_RULES,
  );
  const [roles, setRoles] = usePersistedState("nido_roles", DEFAULT_ROLES);
  const [organizations, setOrganizations] = usePersistedState(
    "nido_organizations",
    DEFAULT_ORGANIZATIONS,
  );
  const [generalSettings, setGeneralSettings] = usePersistedState(
    "nido_general_settings",
    DEFAULT_GENERAL_SETTINGS,
  );
  const [userRoles, setUserRoles] = usePersistedState(
    "nido_user_roles",
    DEFAULT_USER_ROLES,
  );
  const [appUsers, setAppUsers] = usePersistedState(
    "nido_app_users",
    DEFAULT_APP_USERS,
  );

  const makeCrud = <T extends { id: string }>(
    setter: React.Dispatch<React.SetStateAction<T[]>>,
  ) => ({
    add: (data: Partial<T>) =>
      setter((prev) => [...prev, { ...data, id: `${Date.now()}` } as T]),
    update: (id: string, data: Partial<T>) =>
      setter((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...data } : item)),
      ),
    delete: (id: string) =>
      setter((prev) => prev.filter((item) => item.id !== id)),
  });

  const orderCrud = makeCrud(setOrders);
  const vendorCrud = makeCrud(setVendors);

  const clientCrud = makeCrud(setClients);
  const locationCrud = makeCrud(setLocations);
  const statusCrud = makeCrud(setOrderStatuses);
  const workflowCrud = makeCrud(setApprovalWorkflows);
  const categoryCrud = makeCrud(setVendorCategories);
  const roleCrud = makeCrud(setRoles);
  const userRoleCrud = makeCrud(setUserRoles);

  const addAuditEntry = useCallback(
    (entry: Partial<AuditEntry>) => {
      setAuditTrail((prev) => [
        {
          ...entry,
          id: `a-${Date.now()}`,
          timestamp: new Date().toISOString(),
        } as AuditEntry,
        ...prev,
      ]);
    },
    [setAuditTrail],
  );

  const updateNotificationRule = useCallback(
    (id: string, data: Partial<NotificationRule>) => {
      setNotificationRules((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...data } : r)),
      );
    },
    [setNotificationRules],
  );

  const updateGeneralSettings = useCallback(
    (orgId: string, settings: Partial<GeneralSettings>) => {
      setGeneralSettings((prev) => ({
        ...prev,
        [orgId]: {
          ...(prev[orgId] || getDefaultGeneralSettings()),
          ...settings,
        } as GeneralSettings,
      }));
    },
    [setGeneralSettings],
  );

  const getDefaultGeneralSettings = (): GeneralSettings => ({
    companyName: "Nido Tech Pvt. Ltd.",
    currency: "INR",
    dateFormat: "DD/MM/YYYY",
    timezone: "Asia/Kolkata",
    language: "English",
    fiscalYearStart: "April",
    taxId: "",
    gstNumber: "",
    panNumber: "",
    address: "",
    phone: "",
    email: "",
  });

  const addUserRole = useCallback(
    (role: Omit<UserRole, "id">) => {
      const newId = `ur-${Date.now()}`;
      setUserRoles((prev) => [...prev, { ...role, id: newId }]);
    },
    [setUserRoles],
  );

  const updateUserRole = useCallback(
    (id: string, data: Partial<UserRole>) => {
      setUserRoles((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...data } : r)),
      );
    },
    [setUserRoles],
  );

  const deleteUserRole = useCallback(
    (id: string) => {
      setUserRoles((prev) => prev.filter((r) => r.id !== id));
    },
    [setUserRoles],
  );

  return (
    <DataContext.Provider
      value={{
        orders,
        setOrders,
        vendors,
        clients,
        locations,
        auditTrail,
        orderStatuses,
        approvalWorkflows,
        vendorCategories,
        notificationRules,
        organizations,
        generalSettings,
        userRoles,
        appUsers,

        roles,
        addOrder: orderCrud.add,
        updateOrder: orderCrud.update,
        deleteOrder: orderCrud.delete,
        addVendor: vendorCrud.add,
        updateVendor: vendorCrud.update,
        deleteVendor: vendorCrud.delete,
        addClient: clientCrud.add,
        updateClient: clientCrud.update,
        deleteClient: clientCrud.delete,
        addLocation: locationCrud.add,
        updateLocation: locationCrud.update,
        deleteLocation: locationCrud.delete,
        addAuditEntry,
        addOrderStatus: statusCrud.add,
        updateOrderStatus: statusCrud.update,
        deleteOrderStatus: statusCrud.delete,
        addApprovalWorkflow: workflowCrud.add,
        updateApprovalWorkflow: workflowCrud.update,
        deleteApprovalWorkflow: workflowCrud.delete,
        addVendorCategory: categoryCrud.add,
        updateVendorCategory: categoryCrud.update,
        deleteVendorCategory: categoryCrud.delete,
        updateNotificationRule,
        addRole: roleCrud.add,
        updateRole: roleCrud.update,
        deleteRole: roleCrud.delete,
        updateGeneralSettings,
        addUserRole,
        updateUserRole,
        deleteUserRole,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
};
