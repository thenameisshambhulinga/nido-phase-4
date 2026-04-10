import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { safeReadJson } from "@/lib/storage";
import {
  nextSequentialCode,
  resolveSequentialCode,
} from "@/lib/documentNumbering";
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
  comments?: string;
  commentHistory: Comment[];
  attachments: string[];
  serviceType?: string;
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
  vendorCode?: string;
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

export interface MasterCatalogItem {
  id: string;
  productCode: string;
  name: string;
  category: string;
  subCategory: string;
  brand: string;
  productType: string;
  physicalType: string;
  price: number;
  discountPrice?: number;
  status: "In Stock" | "Low Stock" | "Out of Stock";
  image?: string;
  description?: string;
  initialStock: number;
  minStockThreshold: number;
  tags?: string[];
  specification?: string;
  warranty?: string;
  hsnCode?: string;
  dimensionL?: string;
  dimensionW?: string;
  dimensionH?: string;
  dimUnit?: string;
  weight?: string;
  weightUnit?: string;
  customsDeclaration?: string;
  primaryVendor?: string;
  vendorSku?: string;
  leadTime?: string;
  vendorContact?: string;
  vendorEmail?: string;
  vendorPhone?: string;
  vendorPhone2?: string;
  trackPerformance?: boolean;
  performanceRating?: number;
}

export interface ClientCatalogItem extends MasterCatalogItem {
  clientId: string;
  masterProductId: string;
  masterBasePrice?: number;
  priceFixedByOwner?: boolean;
  stock: number;
  minStock: number;
}

export interface PricingRule {
  id: string;
  name: string;
  status: "active" | "inactive";
  ruleType: "Volume-Based" | "Tiered Pricing";
  minimumQuantity: number;
  categories: string[];
  products: string[];
  adjustmentType: "discount" | "markup";
  valueType: "percentage" | "fixed";
  value: number;
  startDate: string;
  endDate: string;
  applyBeforeTax?: boolean;
}

export interface DiscountRule {
  id: string;
  name: string;
  status: "active" | "inactive";
  ruleType: "Catalogue-Based" | "Volume-Based";
  categories: string[];
  products: string[];
  minimumOrderAmount: number;
  discountPercent: number;
  maxUsagePerUser: number;
  stackable: boolean;
  startDate?: string;
  endDate?: string;
  applyBeforeTax?: boolean;
}

export interface TaxSetting {
  id: string;
  taxType: string;
  taxRate: number;
  taxRegistrationNo: string;
  active: boolean;
}

export interface CouponCode {
  id: string;
  title: string;
  code: string;
  discountType: "percentage" | "fixed" | "shipping";
  discountValue: number;
  minPurchase: number;
  usageLimit: number;
  usagePerCustomer: number;
  validFrom: string;
  validTo: string;
  active: boolean;
  notes?: string;
}

export interface CouponCodeRule {
  id: string;
  name: string;
  triggerType: "prefix" | "suffix" | "specific" | "all";
  triggerValue: string;
  conditionField:
    | "cart_total"
    | "item_count"
    | "specific_products"
    | "client_type";
  comparator: ">=" | "<=" | "==";
  threshold: number;
  discountType: "percentage" | "fixed";
  discountValue: number;
  calculationOrder: "before_tax" | "after_tax";
  maxUsageGlobal: number;
  maxUsagePerCustomer: number;
  stackable: boolean;
  active: boolean;
}

export interface RuleConflict {
  id: string;
  severity: "warning" | "high";
  message: string;
  ruleIds: string[];
}

export interface PricingComputation {
  baseAmount: number;
  adjustedAmount: number;
  discountedAmount: number;
  taxedAmount: number;
  total: number;
}

export interface GlobalSearchResult {
  group: "Users" | "Orders" | "Vendors" | "Clients" | "Invoices";
  title: string;
  subtitle: string;
  badge: string;
  path: string;
  id: string;
  score: number;
}

export interface SalesLineItem {
  id: string;
  itemName: string;
  description: string;
  hsnSac: string;
  quantity: number;
  rate: number;
  discount: number;
  taxRate: number;
  amount: number;
}

export interface SalesQuote {
  id: string;
  quoteNumber: string;
  referenceNumber: string;
  customerName: string;
  customerId?: string;
  quoteDate: string;
  validTillDate: string;
  projectName: string;
  status: "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED" | "CONVERTED";
  billingAddress: string;
  shippingAddress: string;
  placeOfSupply: string;
  salesperson: string;
  emailRecipients: string[];
  items: SalesLineItem[];
  subtotal: number;
  cgst: number;
  sgst: number;
  adjustment: number;
  shippingCharges?: number;
  total: number;
  customerNotes: string;
  termsAndConditions: string;
  attachments: string[];
  bankDetails: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  referenceSalesOrderId?: string;
  referenceInvoiceId?: string;
}

export interface SalesOrder {
  id: string;
  salesOrderNumber: string;
  referenceQuoteId?: string;
  referenceNumber: string;
  customerName: string;
  customerId?: string;
  salesOrderDate: string;
  expectedShipmentDate: string;
  paymentTerms: string;
  deliveryMethod: string;
  status: "DRAFT" | "CONFIRMED" | "CANCELLED";
  invoiceStatus: "NOT INVOICED" | "INVOICED";
  paymentStatus: "UNPAID" | "PARTIALLY PAID" | "PAID";
  shipmentStatus: "PENDING" | "PARTIALLY SHIPPED" | "SHIPPED";
  billingAddress: string;
  shippingAddress: string;
  placeOfSupply: string;
  emailRecipients: string[];
  items: SalesLineItem[];
  subtotal: number;
  cgst: number;
  sgst: number;
  adjustment: number;
  shippingCharges?: number;
  total: number;
  customerNotes: string;
  termsAndConditions: string;
  attachments: string[];
  bankDetails: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  referenceInvoiceId?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  referenceQuoteId?: string;
  referenceSalesOrderId?: string;
  customerName?: string;
  customerId?: string;
  vendorOrClient?: string;
  type?: "client" | "vendor";
  customerGst?: string;
  customerBusinessType?: "Registered" | "Unregistered" | "Consumer";
  invoiceDate: string;
  issueDate?: string;
  dueDate: string;
  paymentTerms: string;
  billingAddress: string;
  shippingAddress: string;
  placeOfSupply: string;
  emailRecipients: string[];
  items: SalesLineItem[];
  subtotal: number;
  cgst: number;
  sgst: number;
  adjustment: number;
  shippingCharges?: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
  status: "DRAFT" | "SENT" | "PARTIALLY PAID" | "PAID" | "OVERDUE";
  paymentStatus: "UNPAID" | "PARTIALLY PAID" | "PAID";
  notes: string;
  termsAndConditions: string;
  bankDetails: string;
  attachments?: string[];
  attachCustomerStatement?: boolean;
  attachInvoicePdf?: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalesActivity {
  id: string;
  entityType: "quote" | "sales_order" | "invoice";
  entityId: string;
  action: "CREATED" | "EDITED" | "SENT" | "CONVERTED";
  message: string;
  actor: string;
  timestamp: string;
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
  masterCatalogItems: MasterCatalogItem[];
  clientCatalogItems: Record<string, ClientCatalogItem[]>;
  pricingRules: PricingRule[];
  discountRules: DiscountRule[];
  taxSettings: TaxSetting[];
  couponCodes: CouponCode[];
  couponCodeRules: CouponCodeRule[];
  salesQuotes: SalesQuote[];
  salesOrders: SalesOrder[];
  invoices: Invoice[];
  salesActivities: SalesActivity[];
  addOrder: (order: Partial<Order>) => void;
  updateOrder: (id: string, data: Partial<Order>) => void;
  bulkUpdateOrders: (ids: string[], data: Partial<Order>) => void;
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
  addMasterCatalogItem: (item: Partial<MasterCatalogItem>) => void;
  updateMasterCatalogItem: (
    id: string,
    data: Partial<MasterCatalogItem>,
  ) => void;
  deleteMasterCatalogItem: (id: string) => void;
  getClientCatalog: (clientId: string) => ClientCatalogItem[];
  addClientCatalogItem: (
    clientId: string,
    item: Partial<ClientCatalogItem>,
  ) => void;
  updateClientCatalogItem: (
    clientId: string,
    itemId: string,
    data: Partial<ClientCatalogItem>,
  ) => void;
  deleteClientCatalogItem: (clientId: string, itemId: string) => void;
  addPricingRule: (rule: Omit<PricingRule, "id">) => void;
  updatePricingRule: (id: string, data: Partial<PricingRule>) => void;
  addDiscountRule: (rule: Omit<DiscountRule, "id">) => void;
  updateDiscountRule: (id: string, data: Partial<DiscountRule>) => void;
  addCouponCode: (coupon: Omit<CouponCode, "id">) => void;
  updateCouponCode: (id: string, data: Partial<CouponCode>) => void;
  addCouponCodeRule: (rule: Omit<CouponCodeRule, "id">) => void;
  updateCouponCodeRule: (id: string, data: Partial<CouponCodeRule>) => void;
  addTaxSetting: (setting: Omit<TaxSetting, "id">) => void;
  updateTaxSetting: (id: string, data: Partial<TaxSetting>) => void;
  upsertPrimaryTaxSetting: (setting: Omit<TaxSetting, "id">) => void;
  autoConfigurePricingAndDiscountRules: () => {
    pricingAdded: number;
    discountAdded: number;
  };
  autoGenerateCouponCampaign: (args?: {
    prefix?: string;
    count?: number;
    discountType?: "percentage" | "fixed";
    discountValue?: number;
    minPurchase?: number;
    validDays?: number;
    category?: string;
  }) => {
    couponsCreated: number;
    rulesCreated: number;
  };
  exportRuleTemplate: () => string;
  importRuleTemplate: (csvText: string) => {
    pricingAdded: number;
    discountAdded: number;
    skipped: number;
    errors: string[];
  };
  detectRuleConflicts: () => RuleConflict[];
  computeOrderPricing: (args: {
    amount: number;
    quantity?: number;
    category?: string;
    productCode?: string;
    orderDate?: string;
  }) => PricingComputation;
  applyPricingRules: (args: {
    price: number;
    quantity?: number;
    category?: string;
    productCode?: string;
  }) => number;
  applyDiscountRules: (args: {
    amount: number;
    quantity?: number;
    category?: string;
    productCode?: string;
  }) => number;
  applyTax: (amount: number) => number;
  searchAll: (query: string) => GlobalSearchResult[];
  createQuote: (
    quote: Omit<
      SalesQuote,
      "id" | "createdAt" | "updatedAt" | "createdBy" | "status" | "quoteNumber"
    > & {
      quoteNumber?: string;
      status?: SalesQuote["status"];
      createdBy?: string;
    },
  ) => SalesQuote;
  updateQuote: (id: string, data: Partial<SalesQuote>) => void;
  createSalesOrder: (
    order: Omit<
      SalesOrder,
      | "id"
      | "createdAt"
      | "updatedAt"
      | "createdBy"
      | "invoiceStatus"
      | "salesOrderNumber"
    > & {
      salesOrderNumber?: string;
      invoiceStatus?: SalesOrder["invoiceStatus"];
      createdBy?: string;
    },
  ) => SalesOrder;
  updateSalesOrder: (id: string, data: Partial<SalesOrder>) => void;
  createInvoice: (
    invoice: Omit<
      Invoice,
      | "id"
      | "createdAt"
      | "updatedAt"
      | "createdBy"
      | "invoiceNumber"
      | "balanceDue"
      | "amountPaid"
      | "status"
      | "paymentStatus"
    > & {
      invoiceNumber?: string;
      amountPaid?: number;
      balanceDue?: number;
      status?: Invoice["status"];
      paymentStatus?: Invoice["paymentStatus"];
      createdBy?: string;
    },
  ) => Invoice;
  updateInvoice: (id: string, data: Partial<Invoice>) => void;
  convertQuoteToSalesOrder: (
    quoteId: string,
    actor?: string,
  ) => SalesOrder | null;
  convertQuoteToOrder: (quoteId: string, actor?: string) => SalesOrder | null;
  convertQuoteToInvoice: (quoteId: string, actor?: string) => string | null;
  convertSalesOrderToInvoice: (
    salesOrderId: string,
    actor?: string,
  ) => string | null;
  sendEmail: (args: {
    entityType: "quote" | "sales_order" | "invoice";
    entityId: string;
    to: string[];
    actor?: string;
    subject?: string;
  }) => void;
  getActivities: (
    entityType: SalesActivity["entityType"],
    entityId: string,
  ) => SalesActivity[];
  getAllData: () => {
    salesQuotes: SalesQuote[];
    salesOrders: SalesOrder[];
    invoices: Invoice[];
    salesActivities: SalesActivity[];
  };
}

const DataContext = createContext<DataContextType | undefined>(undefined);

function usePersistedState<T>(
  key: string,
  defaultValue: T,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    const parsed = safeReadJson<T>(key, defaultValue);

    // Prevent runtime crashes from malformed persisted values.
    if (Array.isArray(defaultValue)) {
      return (Array.isArray(parsed) ? parsed : defaultValue) as T;
    }

    if (defaultValue && typeof defaultValue === "object") {
      return (
        parsed && typeof parsed === "object" ? parsed : defaultValue
      ) as T;
    }

    return (typeof parsed === typeof defaultValue ? parsed : defaultValue) as T;
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
    comments: "Urgent order, prioritize processing.",
    commentHistory: [
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
    commentHistory: [],
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
    commentHistory: [],
    attachments: [],
  },
];
const DEFAULT_MASTER_CATALOG: MasterCatalogItem[] = [
  {
    id: "mc-1",
    productCode: "LAP-1001",
    name: "HP Envy Laptop",
    category: "IT Hardware",
    subCategory: "Laptops",
    brand: "HP",
    productType: "Product",
    physicalType: "Physical",
    price: 80000,
    status: "In Stock",
    initialStock: 50,
    minStockThreshold: 5,
  },
  {
    id: "mc-2",
    productCode: "SSD-2025",
    name: "Sandisk 1TB SSD",
    category: "IT Hardware",
    subCategory: "Storage",
    brand: "Sandisk",
    productType: "Product",
    physicalType: "Physical",
    price: 12000,
    status: "Low Stock",
    initialStock: 12,
    minStockThreshold: 5,
  },
  {
    id: "mc-3",
    productCode: "MOU-3301",
    name: "Logitech Wireless Mouse",
    category: "IT Hardware",
    subCategory: "Peripherals",
    brand: "Logitech",
    productType: "Product",
    physicalType: "Physical",
    price: 1000,
    status: "In Stock",
    initialStock: 200,
    minStockThreshold: 20,
  },
  {
    id: "mc-4",
    productCode: "TAB-1110",
    name: "Apple iPad Air",
    category: "IT Hardware",
    subCategory: "Laptops",
    brand: "Apple",
    productType: "Product",
    physicalType: "Physical",
    price: 450,
    status: "Low Stock",
    initialStock: 8,
    minStockThreshold: 3,
  },
  {
    id: "mc-5",
    productCode: "PRN-3215",
    name: "Epson Workforce Printer",
    category: "Stationery",
    subCategory: "Paper",
    brand: "Epson",
    productType: "Product",
    physicalType: "Physical",
    price: 62000,
    status: "Out of Stock",
    initialStock: 0,
    minStockThreshold: 2,
  },
];

const DEFAULT_CLIENT_CATALOG: Record<string, ClientCatalogItem[]> = {
  cl1: [
    {
      ...DEFAULT_MASTER_CATALOG[0],
      clientId: "cl1",
      masterProductId: DEFAULT_MASTER_CATALOG[0].id,
      stock: 50,
      minStock: 5,
    },
    {
      ...DEFAULT_MASTER_CATALOG[2],
      clientId: "cl1",
      masterProductId: DEFAULT_MASTER_CATALOG[2].id,
      stock: 200,
      minStock: 20,
    },
  ],
  cl2: [],
  cl3: [],
};

const DEFAULT_PRICING_RULES: PricingRule[] = [
  {
    id: "pr-1",
    name: "Volume Discount",
    status: "active",
    ruleType: "Volume-Based",
    minimumQuantity: 10,
    categories: ["IT Hardware"],
    products: [],
    adjustmentType: "discount",
    valueType: "percentage",
    value: 5,
    startDate: "2026-01-01",
    endDate: "2026-12-31",
  },
];

const DEFAULT_DISCOUNT_RULES: DiscountRule[] = [
  {
    id: "dr-1",
    name: "Catalog Discount",
    status: "active",
    ruleType: "Catalogue-Based",
    categories: ["IT Hardware"],
    products: [],
    minimumOrderAmount: 50000,
    discountPercent: 3,
    maxUsagePerUser: 5,
    stackable: false,
  },
];

const DEFAULT_TAX_SETTINGS: TaxSetting[] = [
  {
    id: "tx-1",
    taxType: "GST",
    taxRate: 18,
    taxRegistrationNo: "27AACCN1234A11ZD",
    active: true,
  },
];

const DEFAULT_COUPON_CODES: CouponCode[] = [
  {
    id: "cp-1",
    title: "Launch Offer",
    code: "NIDO1000",
    discountType: "fixed",
    discountValue: 1000,
    minPurchase: 5000,
    usageLimit: 500,
    usagePerCustomer: 1,
    validFrom: "2026-01-01",
    validTo: "2026-12-31",
    active: true,
  },
];

const DEFAULT_COUPON_CODE_RULES: CouponCodeRule[] = [
  {
    id: "ccr-1",
    name: "Standard cart threshold rule",
    triggerType: "prefix",
    triggerValue: "NIDO",
    conditionField: "cart_total",
    comparator: ">=",
    threshold: 5000,
    discountType: "fixed",
    discountValue: 500,
    calculationOrder: "before_tax",
    maxUsageGlobal: 500,
    maxUsagePerCustomer: 1,
    stackable: false,
    active: true,
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

const buildDefaultGeneralSettings = (): GeneralSettings => ({
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
  poPrefix: "PO",
  quotationPrefix: "Q",
  estimationPrefix: "EST",
  invoicePrefix: "INV",
  clientCodePrefix: "CL",
  vendorCodePrefix: "VND",
  productCodePrefix: "PRD",
  salesOrderPrefix: "SO",
  deliveryChallanPrefix: "DC",
  creditNotePrefix: "CN",
});

// ── DEFAULT GENERAL SETTINGS ───────────────────────────────────────
const DEFAULT_GENERAL_SETTINGS: Record<string, GeneralSettings> = {
  "org-nido": {
    ...buildDefaultGeneralSettings(),
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

const DEFAULT_SALES_QUOTES: SalesQuote[] = [
  {
    id: "sq-1",
    quoteNumber: "EST-000126",
    referenceNumber: "REF-EST-126",
    customerName: "Nido Technologies",
    customerId: "cl1",
    quoteDate: "2026-03-30",
    validTillDate: "2026-04-30",
    projectName: "Design Model Program",
    status: "ACCEPTED",
    billingAddress:
      "Nido Technologies, 41/1 2nd Floor 10th Cross, Wilson Garden, Bengaluru",
    shippingAddress:
      "Nido Technologies, 41/1 2nd Floor 10th Cross, Wilson Garden, Bengaluru",
    placeOfSupply: "Karnataka (29)",
    salesperson: "Mark Adams",
    emailRecipients: ["pavannido@gmail.com"],
    items: [
      {
        id: "sqli-1",
        itemName: "3D Design Model",
        description: "3D model mould designs for handle",
        hsnSac: "9983",
        quantity: 1,
        rate: 400,
        discount: 0,
        taxRate: 18,
        amount: 400,
      },
    ],
    subtotal: 400,
    cgst: 36,
    sgst: 36,
    adjustment: 0,
    shippingCharges: 0,
    total: 472,
    customerNotes:
      "BANK NAME:- IDFC\nA/c Payee Name: Nido Technologies\nBank A/C No.: 10028186411",
    termsAndConditions:
      "Payment of 50% post approval of quote, 30% against trial component and 20% before delivery.",
    attachments: [],
    bankDetails:
      "BANK NAME:- IDFC\nA/c Payee Name: Nido Technologies\nBank IFSC Code: IDFB0080154",
    createdBy: "System Owner",
    createdAt: "2026-03-30T09:00:00.000Z",
    updatedAt: "2026-03-30T09:00:00.000Z",
  },
];

const DEFAULT_SALES_ORDERS: SalesOrder[] = [
  {
    id: "so-1",
    salesOrderNumber: "SO-00001",
    referenceQuoteId: "sq-1",
    referenceNumber: "EST-000126",
    customerName: "Nido Technologies",
    customerId: "cl1",
    salesOrderDate: "2026-03-30",
    expectedShipmentDate: "2026-04-05",
    paymentTerms: "Due on Receipt",
    deliveryMethod: "Standard",
    status: "CONFIRMED",
    invoiceStatus: "NOT INVOICED",
    paymentStatus: "UNPAID",
    shipmentStatus: "PENDING",
    billingAddress:
      "Nido Technologies, 41/1 2nd Floor 10th Cross, Wilson Garden, Bengaluru",
    shippingAddress:
      "Nido Technologies, 41/1 2nd Floor 10th Cross, Wilson Garden, Bengaluru",
    placeOfSupply: "Karnataka (29)",
    emailRecipients: ["pavannido@gmail.com"],
    items: [
      {
        id: "soli-1",
        itemName: "3D Design Model",
        description: "3D model mould designs for handle",
        hsnSac: "9983",
        quantity: 1,
        rate: 400,
        discount: 0,
        taxRate: 18,
        amount: 400,
      },
    ],
    subtotal: 400,
    cgst: 36,
    sgst: 36,
    adjustment: 0,
    shippingCharges: 0,
    total: 472,
    customerNotes: "Customer prefers afternoon dispatch window",
    termsAndConditions:
      "Trial cost not included and delivery will be made after payment confirmation.",
    attachments: [],
    bankDetails:
      "BANK NAME:- IDFC\nA/c Payee Name: Nido Technologies\nBank IFSC Code: IDFB0080154",
    createdBy: "System Owner",
    createdAt: "2026-03-30T11:00:00.000Z",
    updatedAt: "2026-03-30T11:00:00.000Z",
  },
];

const DEFAULT_INVOICES: Invoice[] = [
  {
    id: "inv-1",
    invoiceNumber: "INV-00064",
    referenceQuoteId: "sq-1",
    referenceSalesOrderId: "so-1",
    customerName: "Nido Technologies",
    customerId: "cl1",
    vendorOrClient: "Nido Technologies",
    type: "client",
    invoiceDate: "2026-04-02",
    issueDate: "2026-04-02",
    dueDate: "2026-04-02",
    paymentTerms: "Due on Receipt",
    billingAddress:
      "Nido Technologies, 41/1 2nd Floor 10th Cross, Wilson Garden, Bengaluru",
    shippingAddress:
      "Nido Technologies, 41/1 2nd Floor 10th Cross, Wilson Garden, Bengaluru",
    placeOfSupply: "Karnataka (29)",
    emailRecipients: ["pavannido@gmail.com"],
    items: [
      {
        id: "invli-1",
        itemName: "3D Design Model",
        description: "3D model mould designs for handle",
        hsnSac: "9983",
        quantity: 1,
        rate: 400,
        discount: 0,
        taxRate: 18,
        amount: 400,
      },
    ],
    subtotal: 400,
    cgst: 36,
    sgst: 36,
    adjustment: 0,
    shippingCharges: 0,
    total: 472,
    amountPaid: 0,
    balanceDue: 472,
    status: "SENT",
    paymentStatus: "UNPAID",
    notes:
      "BANK NAME:- IDFC\nA/c Payee Name: Nido Technologies\nBank A/C No.: 10028186411",
    termsAndConditions:
      "Payment of 50% post approval of quote, 30% against trial component and 20% before delivery.",
    bankDetails:
      "BANK NAME:- IDFC\nA/c Payee Name: Nido Technologies\nBank IFSC Code: IDFB0080154",
    createdBy: "System Owner",
    createdAt: "2026-04-02T09:00:00.000Z",
    updatedAt: "2026-04-02T09:00:00.000Z",
  },
];

const DEFAULT_SALES_ACTIVITIES: SalesActivity[] = [
  {
    id: "sa-1",
    entityType: "quote",
    entityId: "sq-1",
    action: "CREATED",
    message: "Quote EST-000126 created",
    actor: "System Owner",
    timestamp: "2026-03-30T09:00:00.000Z",
  },
  {
    id: "sa-2",
    entityType: "quote",
    entityId: "sq-1",
    action: "CONVERTED",
    message: "Quote EST-000126 converted to Sales Order SO-00001",
    actor: "System Owner",
    timestamp: "2026-03-30T11:00:00.000Z",
  },
];

const nextDocumentNumber = (
  prefix: string,
  existingNumbers: Array<string | undefined>,
) => {
  return nextSequentialCode(prefix, existingNumbers, 5);
};

const resolveDocumentNumber = (
  prefix: string,
  requested: string | undefined,
  existingNumbers: Array<string | undefined>,
) => {
  return resolveSequentialCode(prefix, requested, existingNumbers, 5);
};

const lineItemsFromSalesItems = (items: SalesLineItem[]) =>
  items.map((item, index) => ({
    ...item,
    id: `${item.id || "li"}-${Date.now()}-${index}`,
  }));

const safeSalesNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeSalesLineItem = (item: SalesLineItem): SalesLineItem => {
  const quantity = safeSalesNumber(item.quantity);
  const rate = safeSalesNumber(item.rate);
  const amountFromFields = quantity * rate;
  const amount = safeSalesNumber(item.amount, amountFromFields);
  return {
    ...item,
    quantity,
    rate,
    discount: safeSalesNumber(item.discount),
    taxRate: safeSalesNumber(item.taxRate),
    amount: Math.round(amount * 100) / 100,
  };
};

const computeSalesTotals = (
  items: SalesLineItem[],
  adjustment = 0,
  shippingCharges = 0,
) => {
  const normalizedItems = items.map(normalizeSalesLineItem);
  const subtotal = normalizedItems.reduce(
    (sum, item) => sum + safeSalesNumber(item.amount),
    0,
  );
  const totalTax = normalizedItems.reduce(
    (sum, item) =>
      sum +
      (safeSalesNumber(item.amount) * safeSalesNumber(item.taxRate)) / 100,
    0,
  );
  const nextAdjustment = safeSalesNumber(adjustment);
  const nextShippingCharges = safeSalesNumber(shippingCharges);
  const halfTax = Math.round((totalTax / 2) * 100) / 100;
  const total =
    Math.round(
      (subtotal + totalTax + nextAdjustment + nextShippingCharges) * 100,
    ) / 100;
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    cgst: halfTax,
    sgst: halfTax,
    total,
  };
};

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
  const [masterCatalogItems, setMasterCatalogItems] = usePersistedState(
    "nido_master_catalog",
    DEFAULT_MASTER_CATALOG,
  );
  const [clientCatalogItems, setClientCatalogItems] = usePersistedState(
    "nido_client_catalog",
    DEFAULT_CLIENT_CATALOG,
  );
  const [pricingRules, setPricingRules] = usePersistedState(
    "nido_pricing_rules",
    DEFAULT_PRICING_RULES,
  );
  const [discountRules, setDiscountRules] = usePersistedState(
    "nido_discount_rules",
    DEFAULT_DISCOUNT_RULES,
  );
  const [taxSettings, setTaxSettings] = usePersistedState(
    "nido_tax_settings",
    DEFAULT_TAX_SETTINGS,
  );
  const [couponCodes, setCouponCodes] = usePersistedState(
    "nido_coupon_codes",
    DEFAULT_COUPON_CODES,
  );
  const [couponCodeRules, setCouponCodeRules] = usePersistedState(
    "nido_coupon_code_rules",
    DEFAULT_COUPON_CODE_RULES,
  );
  const [salesQuotes, setSalesQuotes] = usePersistedState(
    "nido_sales_quotes",
    DEFAULT_SALES_QUOTES,
  );
  const [salesOrders, setSalesOrders] = usePersistedState(
    "nido_sales_orders",
    DEFAULT_SALES_ORDERS,
  );
  const [invoices, setInvoices] = usePersistedState(
    "nido_invoices",
    DEFAULT_INVOICES,
  );
  const [salesActivities, setSalesActivities] = usePersistedState(
    "nido_sales_activities",
    DEFAULT_SALES_ACTIVITIES,
  );

  const primaryOrgId = organizations[0]?.id || "org-nido";
  const activeSettings =
    generalSettings[primaryOrgId] || buildDefaultGeneralSettings();

  const configuredPrefix = useCallback(
    (
      key: keyof Pick<
        GeneralSettings,
        | "poPrefix"
        | "quotationPrefix"
        | "estimationPrefix"
        | "invoicePrefix"
        | "clientCodePrefix"
        | "vendorCodePrefix"
        | "productCodePrefix"
        | "salesOrderPrefix"
        | "deliveryChallanPrefix"
        | "creditNotePrefix"
      >,
      fallback: string,
    ) => {
      const value = activeSettings[key];
      return (value && value.trim()) || fallback;
    },
    [activeSettings],
  );

  useEffect(() => {
    setSalesQuotes((prev) =>
      prev.map((quote) => {
        const nextItems = quote.items.map(normalizeSalesLineItem);
        const totals = computeSalesTotals(
          nextItems,
          quote.adjustment,
          quote.shippingCharges ?? 0,
        );
        const nextQuote = {
          ...quote,
          items: nextItems,
          ...totals,
        };
        return JSON.stringify(nextQuote) === JSON.stringify(quote)
          ? quote
          : nextQuote;
      }),
    );
    setSalesOrders((prev) =>
      prev.map((order) => {
        const nextItems = order.items.map(normalizeSalesLineItem);
        const totals = computeSalesTotals(
          nextItems,
          order.adjustment,
          order.shippingCharges ?? 0,
        );
        const nextOrder = {
          ...order,
          items: nextItems,
          ...totals,
        };
        return JSON.stringify(nextOrder) === JSON.stringify(order)
          ? order
          : nextOrder;
      }),
    );
    setInvoices((prev) =>
      prev.map((invoice) => {
        const nextItems = invoice.items.map(normalizeSalesLineItem);
        const totals = computeSalesTotals(
          nextItems,
          invoice.adjustment,
          invoice.shippingCharges ?? 0,
        );
        const amountPaid = safeSalesNumber(invoice.amountPaid);
        const balanceDue = safeSalesNumber(
          invoice.balanceDue,
          Math.max(0, totals.total - amountPaid),
        );
        const nextInvoice = {
          ...invoice,
          items: nextItems,
          ...totals,
          amountPaid,
          balanceDue: Math.round(balanceDue * 100) / 100,
        };
        return JSON.stringify(nextInvoice) === JSON.stringify(invoice)
          ? invoice
          : nextInvoice;
      }),
    );
  }, [setInvoices, setSalesOrders, setSalesQuotes]);

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

  const addVendor = useCallback(
    (vendor: Partial<Vendor>) => {
      const vendorCode =
        vendor.vendorCode ||
        nextSequentialCode(
          configuredPrefix("vendorCodePrefix", "VND"),
          vendors.map((entry) => entry.vendorCode),
          5,
        );
      setVendors((prev) => [
        ...prev,
        {
          ...vendor,
          id: vendor.id || `${Date.now()}`,
          vendorCode,
        } as Vendor,
      ]);
    },
    [configuredPrefix, setVendors, vendors],
  );

  const addClient = useCallback(
    (client: Partial<Client>) => {
      const clientCode =
        client.clientCode ||
        nextSequentialCode(
          configuredPrefix("clientCodePrefix", "CL"),
          clients.map((entry) => entry.clientCode),
          5,
        );
      setClients((prev) => [
        ...prev,
        {
          ...client,
          id: client.id || `${Date.now()}`,
          clientCode,
        } as Client,
      ]);
    },
    [clients, configuredPrefix, setClients],
  );

  const bulkUpdateOrders = useCallback(
    (ids: string[], data: Partial<Order>) => {
      setOrders((prev) =>
        prev.map((order) =>
          ids.includes(order.id) ? { ...order, ...data } : order,
        ),
      );
    },
    [setOrders],
  );

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
          ...(prev[orgId] || buildDefaultGeneralSettings()),
          ...settings,
        } as GeneralSettings,
      }));
    },
    [setGeneralSettings],
  );

  const logSalesActivity = useCallback(
    (
      entry: Omit<SalesActivity, "id" | "timestamp"> & {
        timestamp?: string;
      },
    ) => {
      setSalesActivities((prev) => [
        {
          id: `sa-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          timestamp: entry.timestamp || new Date().toISOString(),
          ...entry,
        },
        ...prev,
      ]);
    },
    [setSalesActivities],
  );

  const createQuote = useCallback(
    (
      quote: Omit<
        SalesQuote,
        | "id"
        | "createdAt"
        | "updatedAt"
        | "createdBy"
        | "status"
        | "quoteNumber"
      > & {
        quoteNumber?: string;
        status?: SalesQuote["status"];
        createdBy?: string;
      },
    ) => {
      const quotePrefix =
        configuredPrefix("estimationPrefix", "EST") ||
        configuredPrefix("quotationPrefix", "Q");
      const quoteNumber = resolveDocumentNumber(
        quotePrefix,
        quote.quoteNumber,
        salesQuotes.map((entry) => entry.quoteNumber),
      );
      const totals = computeSalesTotals(
        quote.items,
        quote.adjustment,
        quote.shippingCharges ?? 0,
      );
      const nextQuote: SalesQuote = {
        ...quote,
        ...totals,
        quoteNumber,
        status: quote.status || "DRAFT",
        id: `sq-${Date.now()}`,
        createdBy: quote.createdBy || "System",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setSalesQuotes((prev) => [nextQuote, ...prev]);
      logSalesActivity({
        entityType: "quote",
        entityId: nextQuote.id,
        action: "CREATED",
        actor: nextQuote.createdBy,
        message: `Quote ${nextQuote.quoteNumber} created`,
      });
      return nextQuote;
    },
    [configuredPrefix, logSalesActivity, salesQuotes, setSalesQuotes],
  );

  const updateQuote = useCallback(
    (id: string, data: Partial<SalesQuote>) => {
      setSalesQuotes((prev) =>
        prev.map((quote) => {
          if (quote.id !== id) return quote;
          const nextItems = data.items || quote.items;
          const nextAdjustment = data.adjustment ?? quote.adjustment;
          const nextShipping =
            data.shippingCharges ?? quote.shippingCharges ?? 0;
          const totals = computeSalesTotals(
            nextItems,
            nextAdjustment,
            nextShipping,
          );
          return {
            ...quote,
            ...data,
            ...totals,
            updatedAt: new Date().toISOString(),
          };
        }),
      );
      logSalesActivity({
        entityType: "quote",
        entityId: id,
        action: "EDITED",
        actor: data.createdBy || "System",
        message: `Quote updated`,
      });
    },
    [logSalesActivity, setSalesQuotes],
  );

  const createSalesOrder = useCallback(
    (
      order: Omit<
        SalesOrder,
        | "id"
        | "createdAt"
        | "updatedAt"
        | "createdBy"
        | "invoiceStatus"
        | "salesOrderNumber"
      > & {
        salesOrderNumber?: string;
        invoiceStatus?: SalesOrder["invoiceStatus"];
        createdBy?: string;
      },
    ) => {
      const salesOrderPrefix = configuredPrefix("salesOrderPrefix", "SO");
      const salesOrderNumber = resolveDocumentNumber(
        salesOrderPrefix,
        order.salesOrderNumber,
        salesOrders.map((entry) => entry.salesOrderNumber),
      );
      const totals = computeSalesTotals(
        order.items,
        order.adjustment,
        order.shippingCharges ?? 0,
      );
      const nextOrder: SalesOrder = {
        ...order,
        ...totals,
        salesOrderNumber,
        invoiceStatus: order.invoiceStatus || "NOT INVOICED",
        id: `so-${Date.now()}`,
        createdBy: order.createdBy || "System",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setSalesOrders((prev) => [nextOrder, ...prev]);
      logSalesActivity({
        entityType: "sales_order",
        entityId: nextOrder.id,
        action: "CREATED",
        actor: nextOrder.createdBy,
        message: `Sales Order ${nextOrder.salesOrderNumber} created`,
      });
      return nextOrder;
    },
    [configuredPrefix, logSalesActivity, salesOrders, setSalesOrders],
  );

  const createInvoice = useCallback(
    (
      invoice: Omit<
        Invoice,
        | "id"
        | "createdAt"
        | "updatedAt"
        | "createdBy"
        | "invoiceNumber"
        | "balanceDue"
        | "amountPaid"
        | "status"
        | "paymentStatus"
      > & {
        invoiceNumber?: string;
        amountPaid?: number;
        balanceDue?: number;
        status?: Invoice["status"];
        paymentStatus?: Invoice["paymentStatus"];
        createdBy?: string;
      },
    ) => {
      const invoicePrefix = configuredPrefix("invoicePrefix", "INV");
      const invoiceNumber = resolveDocumentNumber(
        invoicePrefix,
        invoice.invoiceNumber,
        invoices.map((entry) => entry.invoiceNumber),
      );
      const totals = computeSalesTotals(
        invoice.items,
        invoice.adjustment,
        invoice.shippingCharges ?? 0,
      );
      const amountPaid = invoice.amountPaid ?? 0;
      const nextStatus =
        invoice.status ||
        (amountPaid >= totals.total
          ? "PAID"
          : amountPaid > 0
            ? "PARTIALLY PAID"
            : "SENT");
      const nextPaymentStatus =
        invoice.paymentStatus ||
        (amountPaid >= totals.total
          ? "PAID"
          : amountPaid > 0
            ? "PARTIALLY PAID"
            : "UNPAID");
      const balanceDue =
        invoice.balanceDue ?? Math.max(0, totals.total - amountPaid);
      const nextInvoice: Invoice = {
        ...invoice,
        ...totals,
        invoiceNumber,
        amountPaid,
        balanceDue: Math.round(balanceDue * 100) / 100,
        status: nextStatus,
        paymentStatus: nextPaymentStatus,
        id: `inv-${Date.now()}`,
        createdBy: invoice.createdBy || "System",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setInvoices((prev) => [nextInvoice, ...prev]);
      logSalesActivity({
        entityType: "invoice",
        entityId: nextInvoice.id,
        action: "CREATED",
        actor: nextInvoice.createdBy,
        message: `Invoice ${nextInvoice.invoiceNumber} created`,
      });
      return nextInvoice;
    },
    [configuredPrefix, invoices, logSalesActivity, setInvoices],
  );

  const updateSalesOrder = useCallback(
    (id: string, data: Partial<SalesOrder>) => {
      setSalesOrders((prev) =>
        prev.map((order) => {
          if (order.id !== id) return order;
          const nextItems = data.items || order.items;
          const nextAdjustment = data.adjustment ?? order.adjustment;
          const nextShipping =
            data.shippingCharges ?? order.shippingCharges ?? 0;
          const totals = computeSalesTotals(
            nextItems,
            nextAdjustment,
            nextShipping,
          );
          return {
            ...order,
            ...data,
            ...totals,
            updatedAt: new Date().toISOString(),
          };
        }),
      );
      logSalesActivity({
        entityType: "sales_order",
        entityId: id,
        action: "EDITED",
        actor: data.createdBy || "System",
        message: `Sales Order updated`,
      });
    },
    [logSalesActivity, setSalesOrders],
  );

  const updateInvoice = useCallback(
    (id: string, data: Partial<Invoice>) => {
      setInvoices((prev) =>
        prev.map((invoice) => {
          if (invoice.id !== id) return invoice;
          const nextItems = data.items || invoice.items;
          const nextAdjustment = data.adjustment ?? invoice.adjustment;
          const nextShipping =
            data.shippingCharges ?? invoice.shippingCharges ?? 0;
          const totals = computeSalesTotals(
            nextItems,
            nextAdjustment,
            nextShipping,
          );
          const amountPaid = data.amountPaid ?? invoice.amountPaid ?? 0;
          const balanceDue =
            data.balanceDue ?? Math.max(0, totals.total - amountPaid);
          return {
            ...invoice,
            ...data,
            ...totals,
            amountPaid,
            balanceDue: Math.round(balanceDue * 100) / 100,
            status:
              data.status ||
              (amountPaid >= totals.total
                ? "PAID"
                : amountPaid > 0
                  ? "PARTIALLY PAID"
                  : invoice.status),
            paymentStatus:
              data.paymentStatus ||
              (amountPaid >= totals.total
                ? "PAID"
                : amountPaid > 0
                  ? "PARTIALLY PAID"
                  : invoice.paymentStatus),
            updatedAt: new Date().toISOString(),
          };
        }),
      );
      logSalesActivity({
        entityType: "invoice",
        entityId: id,
        action: "EDITED",
        actor: data.createdBy || "System",
        message: `Invoice updated`,
      });
    },
    [logSalesActivity, setInvoices],
  );

  const convertQuoteToSalesOrder = useCallback(
    (quoteId: string, actor = "System") => {
      const quote = salesQuotes.find((entry) => entry.id === quoteId);
      if (!quote || quote.status !== "ACCEPTED") return null;
      if (quote.referenceSalesOrderId) {
        return (
          salesOrders.find(
            (entry) => entry.id === quote.referenceSalesOrderId,
          ) || null
        );
      }

      const newOrder = createSalesOrder({
        salesOrderNumber: undefined,
        referenceQuoteId: quote.id,
        referenceNumber: quote.quoteNumber,
        customerName: quote.customerName,
        customerId: quote.customerId,
        salesOrderDate: new Date().toISOString().slice(0, 10),
        expectedShipmentDate: quote.validTillDate,
        paymentTerms: "Due on Receipt",
        deliveryMethod: "Standard",
        status: "CONFIRMED",
        paymentStatus: "UNPAID",
        shipmentStatus: "PENDING",
        billingAddress: quote.billingAddress,
        shippingAddress: quote.shippingAddress,
        placeOfSupply: quote.placeOfSupply,
        emailRecipients: quote.emailRecipients,
        items: quote.items,
        subtotal: quote.subtotal,
        cgst: quote.cgst,
        sgst: quote.sgst,
        adjustment: quote.adjustment,
        shippingCharges: quote.shippingCharges ?? 0,
        total: quote.total,
        customerNotes: quote.customerNotes,
        termsAndConditions: quote.termsAndConditions,
        attachments: quote.attachments,
        bankDetails: quote.bankDetails,
        createdBy: actor,
      });

      setSalesQuotes((prev) =>
        prev.map((entry) =>
          entry.id === quoteId
            ? {
                ...entry,
                status: "CONVERTED",
                referenceSalesOrderId: newOrder.id,
                updatedAt: new Date().toISOString(),
              }
            : entry,
        ),
      );
      logSalesActivity({
        entityType: "quote",
        entityId: quoteId,
        action: "CONVERTED",
        actor,
        message: `Quote ${quote.quoteNumber} converted to Sales Order ${newOrder.salesOrderNumber}`,
      });
      return newOrder;
    },
    [createSalesOrder, logSalesActivity, salesOrders, salesQuotes],
  );

  const convertQuoteToOrder = convertQuoteToSalesOrder;

  const convertQuoteToInvoice = useCallback(
    (quoteId: string, actor = "System") => {
      const quote = salesQuotes.find((entry) => entry.id === quoteId);
      if (!quote || quote.status !== "ACCEPTED") return null;
      if (quote.referenceInvoiceId) {
        return quote.referenceInvoiceId;
      }

      const newInvoice = createInvoice({
        invoiceNumber: undefined,
        referenceQuoteId: quote.id,
        customerName: quote.customerName,
        customerId: quote.customerId,
        vendorOrClient: quote.customerName,
        type: "client",
        invoiceDate: new Date().toISOString().slice(0, 10),
        issueDate: new Date().toISOString().slice(0, 10),
        dueDate: quote.validTillDate,
        paymentTerms: "Due on Receipt",
        billingAddress: quote.billingAddress,
        shippingAddress: quote.shippingAddress,
        placeOfSupply: quote.placeOfSupply,
        emailRecipients: quote.emailRecipients,
        items: lineItemsFromSalesItems(quote.items),
        adjustment: quote.adjustment,
        shippingCharges: quote.shippingCharges ?? 0,
        notes: quote.customerNotes,
        termsAndConditions: quote.termsAndConditions,
        bankDetails: quote.bankDetails,
        amountPaid: 0,
        balanceDue: quote.total,
        status: "SENT",
        paymentStatus: "UNPAID",
        createdBy: actor,
      });

      setSalesQuotes((prev) =>
        prev.map((entry) =>
          entry.id === quoteId
            ? {
                ...entry,
                status: "CONVERTED",
                referenceInvoiceId: newInvoice.id,
                updatedAt: new Date().toISOString(),
              }
            : entry,
        ),
      );

      if (quote.referenceSalesOrderId) {
        setSalesOrders((prev) =>
          prev.map((entry) =>
            entry.id === quote.referenceSalesOrderId
              ? {
                  ...entry,
                  invoiceStatus: "INVOICED",
                  referenceInvoiceId: newInvoice.id,
                  updatedAt: new Date().toISOString(),
                }
              : entry,
          ),
        );
      }

      logSalesActivity({
        entityType: "quote",
        entityId: quoteId,
        action: "CONVERTED",
        actor,
        message: `Quote ${quote.quoteNumber} converted to Invoice ${newInvoice.invoiceNumber}`,
      });
      return newInvoice.id;
    },
    [createInvoice, logSalesActivity, salesQuotes],
  );

  const convertSalesOrderToInvoice = useCallback(
    (salesOrderId: string, actor = "System") => {
      const order = salesOrders.find((entry) => entry.id === salesOrderId);
      if (!order) return null;

      const newInvoice = createInvoice({
        invoiceNumber: undefined,
        referenceSalesOrderId: order.id,
        referenceQuoteId: order.referenceQuoteId,
        customerName: order.customerName,
        customerId: order.customerId,
        vendorOrClient: order.customerName,
        type: "client",
        invoiceDate: new Date().toISOString().slice(0, 10),
        issueDate: new Date().toISOString().slice(0, 10),
        dueDate: order.expectedShipmentDate,
        paymentTerms: order.paymentTerms,
        billingAddress: order.billingAddress,
        shippingAddress: order.shippingAddress,
        placeOfSupply: order.placeOfSupply,
        emailRecipients: order.emailRecipients,
        items: lineItemsFromSalesItems(order.items),
        adjustment: order.adjustment,
        shippingCharges: order.shippingCharges ?? 0,
        notes: order.customerNotes,
        termsAndConditions: order.termsAndConditions,
        bankDetails: order.bankDetails,
        amountPaid: order.paymentStatus === "PAID" ? order.total : 0,
        balanceDue: order.paymentStatus === "PAID" ? 0 : order.total,
        status: order.paymentStatus === "PAID" ? "PAID" : "SENT",
        paymentStatus:
          order.paymentStatus === "PAID"
            ? "PAID"
            : order.paymentStatus === "PARTIALLY PAID"
              ? "PARTIALLY PAID"
              : "UNPAID",
        createdBy: actor,
      });

      setSalesOrders((prev) =>
        prev.map((entry) =>
          entry.id === salesOrderId
            ? {
                ...entry,
                invoiceStatus: "INVOICED",
                referenceInvoiceId: newInvoice.id,
                updatedAt: new Date().toISOString(),
              }
            : entry,
        ),
      );

      if (order.referenceQuoteId) {
        setSalesQuotes((prev) =>
          prev.map((entry) =>
            entry.id === order.referenceQuoteId
              ? {
                  ...entry,
                  referenceInvoiceId: newInvoice.id,
                  updatedAt: new Date().toISOString(),
                }
              : entry,
          ),
        );
      }

      logSalesActivity({
        entityType: "sales_order",
        entityId: salesOrderId,
        action: "CONVERTED",
        actor,
        message: `Sales Order ${order.salesOrderNumber} converted to Invoice ${newInvoice.invoiceNumber}`,
      });
      return newInvoice.id;
    },
    [
      createInvoice,
      logSalesActivity,
      salesOrders,
      setSalesOrders,
      setSalesQuotes,
    ],
  );

  const sendEmail = useCallback(
    (args: {
      entityType: "quote" | "sales_order" | "invoice";
      entityId: string;
      to: string[];
      actor?: string;
      subject?: string;
    }) => {
      const actor = args.actor || "System";
      logSalesActivity({
        entityType: args.entityType,
        entityId: args.entityId,
        action: "SENT",
        actor,
        message: `${args.subject || "Email"} sent to ${args.to.join(", ")}`,
      });
      addAuditEntry({
        user: actor,
        action: "Document Email Sent",
        module: "Transactions",
        details: `${args.entityType} ${args.entityId} emailed to ${args.to.join(", ")}`,
        ipAddress: "10.0.0.22",
        status: "success",
      });
    },
    [addAuditEntry, logSalesActivity],
  );

  const getActivities = useCallback(
    (entityType: SalesActivity["entityType"], entityId: string) =>
      salesActivities.filter(
        (entry) =>
          entry.entityType === entityType && entry.entityId === entityId,
      ),
    [salesActivities],
  );

  const getAllData = useCallback(
    () => ({
      salesQuotes,
      salesOrders,
      invoices,
      salesActivities,
    }),
    [invoices, salesActivities, salesOrders, salesQuotes],
  );

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

  const addMasterCatalogItem = useCallback(
    (item: Partial<MasterCatalogItem>) => {
      const productCode =
        item.productCode ||
        nextSequentialCode(
          configuredPrefix("productCodePrefix", "PRD"),
          masterCatalogItems.map((entry) => entry.productCode),
          5,
        );
      const newItem: MasterCatalogItem = {
        id: `mc-${Date.now()}`,
        productCode,
        name: item.name || "Unnamed Item",
        category: item.category || "IT Hardware",
        subCategory: item.subCategory || "",
        brand: item.brand || "",
        productType: item.productType || "Product",
        physicalType: item.physicalType || "Physical",
        price: item.price ?? 0,
        discountPrice: item.discountPrice,
        status: item.status || "In Stock",
        image: item.image,
        description: item.description,
        initialStock: item.initialStock ?? 0,
        minStockThreshold: item.minStockThreshold ?? 0,
        tags: item.tags || [],
        specification: item.specification,
        warranty: item.warranty,
        hsnCode: item.hsnCode,
        dimensionL: item.dimensionL,
        dimensionW: item.dimensionW,
        dimensionH: item.dimensionH,
        dimUnit: item.dimUnit,
        weight: item.weight,
        weightUnit: item.weightUnit,
        customsDeclaration: item.customsDeclaration,
        primaryVendor: item.primaryVendor,
        vendorSku: item.vendorSku,
        leadTime: item.leadTime,
        vendorContact: item.vendorContact,
        vendorEmail: item.vendorEmail,
        vendorPhone: item.vendorPhone,
        vendorPhone2: item.vendorPhone2,
        trackPerformance: item.trackPerformance,
        performanceRating: item.performanceRating,
      };
      setMasterCatalogItems((prev) => [...prev, newItem]);
    },
    [configuredPrefix, masterCatalogItems, setMasterCatalogItems],
  );

  const updateMasterCatalogItem = useCallback(
    (id: string, data: Partial<MasterCatalogItem>) => {
      setMasterCatalogItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...data } : item)),
      );
    },
    [setMasterCatalogItems],
  );

  const deleteMasterCatalogItem = useCallback(
    (id: string) => {
      setMasterCatalogItems((prev) => prev.filter((item) => item.id !== id));
      setClientCatalogItems((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((clientId) => {
          next[clientId] = next[clientId].filter(
            (item) => item.masterProductId !== id && item.id !== id,
          );
        });
        return next;
      });
    },
    [setClientCatalogItems, setMasterCatalogItems],
  );

  const getClientCatalog = useCallback(
    (clientId: string) => clientCatalogItems[clientId] || [],
    [clientCatalogItems],
  );

  const addClientCatalogItem = useCallback(
    (clientId: string, item: Partial<ClientCatalogItem>) => {
      const catalogItem: ClientCatalogItem = {
        id: `cli-${Date.now()}`,
        clientId,
        masterProductId: item.masterProductId || item.id || `mc-${Date.now()}`,
        masterBasePrice: item.masterBasePrice ?? item.price ?? 0,
        priceFixedByOwner: item.priceFixedByOwner ?? false,
        productCode: item.productCode || "",
        name: item.name || "Unnamed Item",
        category: item.category || "IT Hardware",
        subCategory: item.subCategory || "",
        brand: item.brand || "",
        productType: item.productType || "Product",
        physicalType: item.physicalType || "Physical",
        price: item.price ?? 0,
        discountPrice: item.discountPrice,
        status: item.status || "In Stock",
        image: item.image,
        description: item.description,
        initialStock: item.initialStock ?? 0,
        minStockThreshold: item.minStockThreshold ?? 0,
        tags: item.tags || [],
        specification: item.specification,
        warranty: item.warranty,
        hsnCode: item.hsnCode,
        dimensionL: item.dimensionL,
        dimensionW: item.dimensionW,
        dimensionH: item.dimensionH,
        dimUnit: item.dimUnit,
        weight: item.weight,
        weightUnit: item.weightUnit,
        customsDeclaration: item.customsDeclaration,
        primaryVendor: item.primaryVendor,
        vendorSku: item.vendorSku,
        leadTime: item.leadTime,
        vendorContact: item.vendorContact,
        vendorEmail: item.vendorEmail,
        vendorPhone: item.vendorPhone,
        vendorPhone2: item.vendorPhone2,
        trackPerformance: item.trackPerformance,
        performanceRating: item.performanceRating,
        stock: item.stock ?? item.initialStock ?? 0,
        minStock: item.minStock ?? item.minStockThreshold ?? 0,
      };
      setClientCatalogItems((prev) => ({
        ...prev,
        [clientId]: [...(prev[clientId] || []), catalogItem],
      }));
    },
    [setClientCatalogItems],
  );

  const updateClientCatalogItem = useCallback(
    (clientId: string, itemId: string, data: Partial<ClientCatalogItem>) => {
      setClientCatalogItems((prev) => ({
        ...prev,
        [clientId]: (prev[clientId] || []).map((item) =>
          item.id === itemId ? { ...item, ...data } : item,
        ),
      }));
    },
    [setClientCatalogItems],
  );

  const deleteClientCatalogItem = useCallback(
    (clientId: string, itemId: string) => {
      setClientCatalogItems((prev) => ({
        ...prev,
        [clientId]: (prev[clientId] || []).filter((item) => item.id !== itemId),
      }));
    },
    [setClientCatalogItems],
  );

  const addPricingRule = useCallback(
    (rule: Omit<PricingRule, "id">) => {
      setPricingRules((prev) => [...prev, { ...rule, id: `pr-${Date.now()}` }]);
    },
    [setPricingRules],
  );

  const updatePricingRule = useCallback(
    (id: string, data: Partial<PricingRule>) => {
      setPricingRules((prev) =>
        prev.map((rule) => (rule.id === id ? { ...rule, ...data } : rule)),
      );
    },
    [setPricingRules],
  );

  const addDiscountRule = useCallback(
    (rule: Omit<DiscountRule, "id">) => {
      setDiscountRules((prev) => [
        ...prev,
        { ...rule, id: `dr-${Date.now()}` },
      ]);
    },
    [setDiscountRules],
  );

  const updateDiscountRule = useCallback(
    (id: string, data: Partial<DiscountRule>) => {
      setDiscountRules((prev) =>
        prev.map((rule) => (rule.id === id ? { ...rule, ...data } : rule)),
      );
    },
    [setDiscountRules],
  );

  const addCouponCode = useCallback(
    (coupon: Omit<CouponCode, "id">) => {
      setCouponCodes((prev) => [
        ...prev,
        { ...coupon, id: `cp-${Date.now()}` },
      ]);
    },
    [setCouponCodes],
  );

  const updateCouponCode = useCallback(
    (id: string, data: Partial<CouponCode>) => {
      setCouponCodes((prev) =>
        prev.map((coupon) =>
          coupon.id === id ? { ...coupon, ...data } : coupon,
        ),
      );
    },
    [setCouponCodes],
  );

  const addCouponCodeRule = useCallback(
    (rule: Omit<CouponCodeRule, "id">) => {
      setCouponCodeRules((prev) => [
        ...prev,
        { ...rule, id: `ccr-${Date.now()}` },
      ]);
    },
    [setCouponCodeRules],
  );

  const updateCouponCodeRule = useCallback(
    (id: string, data: Partial<CouponCodeRule>) => {
      setCouponCodeRules((prev) =>
        prev.map((rule) => (rule.id === id ? { ...rule, ...data } : rule)),
      );
    },
    [setCouponCodeRules],
  );

  const addTaxSetting = useCallback(
    (setting: Omit<TaxSetting, "id">) => {
      setTaxSettings((prev) => [
        ...prev,
        { ...setting, id: `tx-${Date.now()}` },
      ]);
    },
    [setTaxSettings],
  );

  const updateTaxSetting = useCallback(
    (id: string, data: Partial<TaxSetting>) => {
      setTaxSettings((prev) =>
        prev.map((setting) =>
          setting.id === id ? { ...setting, ...data } : setting,
        ),
      );
    },
    [setTaxSettings],
  );

  const upsertPrimaryTaxSetting = useCallback(
    (setting: Omit<TaxSetting, "id">) => {
      setTaxSettings((prev) => {
        if (!prev.length) {
          return [{ ...setting, id: `tx-${Date.now()}`, active: true }];
        }
        const firstId = prev[0].id;
        return prev.map((entry) =>
          entry.id === firstId
            ? { ...entry, ...setting, active: true }
            : { ...entry, active: false },
        );
      });
    },
    [setTaxSettings],
  );

  const autoConfigurePricingAndDiscountRules = useCallback(() => {
    const categories = Array.from(
      new Set(masterCatalogItems.map((item) => item.category).filter(Boolean)),
    );
    const today = new Date().toISOString().slice(0, 10);
    const oneYearOut = new Date();
    oneYearOut.setFullYear(oneYearOut.getFullYear() + 1);
    const endDate = oneYearOut.toISOString().slice(0, 10);

    const pricingToAdd = categories
      .filter(
        (category) =>
          !pricingRules.some(
            (rule) =>
              rule.status === "active" && rule.categories.includes(category),
          ),
      )
      .map((category, index) => ({
        id: `pr-auto-${Date.now()}-${index}`,
        name: `Auto ${category} Volume Pricing`,
        status: "active" as const,
        ruleType: "Volume-Based" as const,
        minimumQuantity: 10,
        categories: [category],
        products: [],
        adjustmentType: "discount" as const,
        valueType: "percentage" as const,
        value: 5,
        startDate: today,
        endDate,
        applyBeforeTax: true,
      }));

    const discountToAdd = categories
      .filter(
        (category) =>
          !discountRules.some(
            (rule) =>
              rule.status === "active" && rule.categories.includes(category),
          ),
      )
      .map((category, index) => ({
        id: `dr-auto-${Date.now()}-${index}`,
        name: `Auto ${category} Discount`,
        status: "active" as const,
        ruleType: "Catalogue-Based" as const,
        categories: [category],
        products: [],
        minimumOrderAmount: 10000,
        discountPercent: 3,
        maxUsagePerUser: 999,
        stackable: false,
        startDate: today,
        endDate,
        applyBeforeTax: true,
      }));

    if (pricingToAdd.length > 0) {
      setPricingRules((prev) => [...prev, ...pricingToAdd]);
    }
    if (discountToAdd.length > 0) {
      setDiscountRules((prev) => [...prev, ...discountToAdd]);
    }

    return {
      pricingAdded: pricingToAdd.length,
      discountAdded: discountToAdd.length,
    };
  }, [
    discountRules,
    masterCatalogItems,
    pricingRules,
    setDiscountRules,
    setPricingRules,
  ]);

  const autoGenerateCouponCampaign = useCallback(
    (args?: {
      prefix?: string;
      count?: number;
      discountType?: "percentage" | "fixed";
      discountValue?: number;
      minPurchase?: number;
      validDays?: number;
      category?: string;
    }) => {
      const prefix = (args?.prefix || "NIDO").toUpperCase();
      const count = Math.max(1, Math.min(args?.count || 5, 50));
      const discountType = args?.discountType || "percentage";
      const discountValue = args?.discountValue ?? 10;
      const minPurchase = args?.minPurchase ?? 5000;
      const validDays = args?.validDays ?? 90;

      const now = new Date();
      const validFrom = now.toISOString().slice(0, 10);
      const validToDate = new Date(now);
      validToDate.setDate(now.getDate() + validDays);
      const validTo = validToDate.toISOString().slice(0, 10);

      const newCoupons: CouponCode[] = Array.from({ length: count }).map(
        (_, index) => ({
          id: `cp-auto-${Date.now()}-${index}`,
          title: `${prefix} Auto Campaign`,
          code: `${prefix}${Math.floor(1000 + Math.random() * 9000)}${index}`,
          discountType,
          discountValue,
          minPurchase,
          usageLimit: 1000,
          usagePerCustomer: 1,
          validFrom,
          validTo,
          active: true,
          notes: "Auto-generated campaign",
        }),
      );

      const nextRule: CouponCodeRule = {
        id: `ccr-auto-${Date.now()}`,
        name: `${prefix} Auto Rule`,
        triggerType: "prefix",
        triggerValue: prefix,
        conditionField: "cart_total",
        comparator: ">=",
        threshold: minPurchase,
        discountType: discountType === "fixed" ? "fixed" : "percentage",
        discountValue,
        calculationOrder: "before_tax",
        maxUsageGlobal: 1000,
        maxUsagePerCustomer: 1,
        stackable: false,
        active: true,
      };

      setCouponCodes((prev) => [...prev, ...newCoupons]);
      setCouponCodeRules((prev) => [nextRule, ...prev]);

      return {
        couponsCreated: newCoupons.length,
        rulesCreated: 1,
      };
    },
    [setCouponCodeRules, setCouponCodes],
  );

  const exportRuleTemplate = useCallback(() => {
    const lines = [
      "RuleScope,RuleType,Name,Status,Category,ProductCode,MinimumQuantity,MinimumOrderAmount,AdjustmentType,ValueType,Value,DiscountPercent,StartDate,EndDate,Stackable,ApplyBeforeTax",
      "pricing,Volume-Based,Sample Volume Rule,active,IT Hardware,,10,,discount,percentage,5,,2026-01-01,2026-12-31,,true",
      "discount,Catalogue-Based,Sample Discount Rule,active,IT Hardware,,,50000,,, ,3,2026-01-01,2026-12-31,false,true",
    ];
    return lines.join("\n");
  }, []);

  const importRuleTemplate = useCallback(
    (csvText: string) => {
      const lines = csvText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
      if (lines.length < 2) {
        return {
          pricingAdded: 0,
          discountAdded: 0,
          skipped: 0,
          errors: ["Template is empty"],
        };
      }

      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const idx = (name: string) => headers.indexOf(name.toLowerCase());
      const get = (cols: string[], name: string) => {
        const i = idx(name);
        return i >= 0 ? (cols[i] || "").trim().replace(/^"|"$/g, "") : "";
      };

      const pricingToAdd: PricingRule[] = [];
      const discountToAdd: DiscountRule[] = [];
      const errors: string[] = [];
      let skipped = 0;

      lines.slice(1).forEach((line, lineIndex) => {
        const cols = line.split(",");
        const scope = get(cols, "RuleScope").toLowerCase();
        const name = get(cols, "Name");
        if (!scope || !name) {
          skipped += 1;
          return;
        }

        const status =
          get(cols, "Status").toLowerCase() === "inactive"
            ? "inactive"
            : "active";
        const category = get(cols, "Category");
        const productCode = get(cols, "ProductCode");
        const startDate =
          get(cols, "StartDate") || new Date().toISOString().slice(0, 10);
        const endDate = get(cols, "EndDate") || "2099-12-31";
        const applyBeforeTax =
          get(cols, "ApplyBeforeTax").toLowerCase() !== "false";

        if (scope === "pricing") {
          pricingToAdd.push({
            id: `pr-${Date.now()}-${lineIndex}`,
            name,
            status,
            ruleType:
              get(cols, "RuleType") === "Tiered Pricing"
                ? "Tiered Pricing"
                : "Volume-Based",
            minimumQuantity: Number(get(cols, "MinimumQuantity")) || 1,
            categories: category ? [category] : [],
            products: productCode ? [productCode] : [],
            adjustmentType:
              get(cols, "AdjustmentType") === "markup" ? "markup" : "discount",
            valueType:
              get(cols, "ValueType") === "fixed" ? "fixed" : "percentage",
            value: Number(get(cols, "Value")) || 0,
            startDate,
            endDate,
            applyBeforeTax,
          });
          return;
        }

        if (scope === "discount") {
          discountToAdd.push({
            id: `dr-${Date.now()}-${lineIndex}`,
            name,
            status,
            ruleType:
              get(cols, "RuleType") === "Volume-Based"
                ? "Volume-Based"
                : "Catalogue-Based",
            categories: category ? [category] : [],
            products: productCode ? [productCode] : [],
            minimumOrderAmount: Number(get(cols, "MinimumOrderAmount")) || 0,
            discountPercent: Number(get(cols, "DiscountPercent")) || 0,
            maxUsagePerUser: 9999,
            stackable: get(cols, "Stackable").toLowerCase() === "true",
            startDate,
            endDate,
            applyBeforeTax,
          });
          return;
        }

        skipped += 1;
        errors.push(`Line ${lineIndex + 2}: Unsupported RuleScope '${scope}'`);
      });

      if (pricingToAdd.length) {
        setPricingRules((prev) => [...prev, ...pricingToAdd]);
      }
      if (discountToAdd.length) {
        setDiscountRules((prev) => [...prev, ...discountToAdd]);
      }

      return {
        pricingAdded: pricingToAdd.length,
        discountAdded: discountToAdd.length,
        skipped,
        errors,
      };
    },
    [setDiscountRules, setPricingRules],
  );

  const detectRuleConflicts = useCallback(() => {
    const conflicts: RuleConflict[] = [];

    for (let i = 0; i < pricingRules.length; i += 1) {
      const a = pricingRules[i];
      if (a.status !== "active") continue;
      for (let j = i + 1; j < pricingRules.length; j += 1) {
        const b = pricingRules[j];
        if (b.status !== "active") continue;
        const sameCategory =
          !a.categories.length ||
          !b.categories.length ||
          a.categories.some((c) => b.categories.includes(c));
        const sameProduct =
          !a.products.length ||
          !b.products.length ||
          a.products.some((p) => b.products.includes(p));
        const sameWindow = a.startDate <= b.endDate && b.startDate <= a.endDate;

        if ((sameCategory || sameProduct) && sameWindow) {
          conflicts.push({
            id: `pricing-${a.id}-${b.id}`,
            severity: "warning",
            message: `Pricing rules '${a.name}' and '${b.name}' overlap and may compound unexpectedly.`,
            ruleIds: [a.id, b.id],
          });
        }
      }
    }

    const activeNonStackable = discountRules.filter(
      (r) => r.status === "active" && !r.stackable,
    );
    if (activeNonStackable.length > 1) {
      conflicts.push({
        id: "discount-non-stackable",
        severity: "high",
        message:
          "Multiple non-stackable discount rules are active. Only one should apply for the same order context.",
        ruleIds: activeNonStackable.map((r) => r.id),
      });
    }

    return conflicts;
  }, [discountRules, pricingRules]);

  const applyPricingRules = useCallback(
    ({
      price,
      quantity = 1,
      category,
      productCode,
    }: {
      price: number;
      quantity?: number;
      category?: string;
      productCode?: string;
    }) => {
      let nextPrice = price;
      const now = new Date().toISOString().slice(0, 10);
      pricingRules
        .filter((rule) => rule.status === "active")
        .forEach((rule) => {
          if (now < rule.startDate || now > rule.endDate) return;
          const categoryMatch =
            !rule.categories.length ||
            (category ? rule.categories.includes(category) : false);
          const productMatch =
            !rule.products.length ||
            (productCode ? rule.products.includes(productCode) : false);
          if (!categoryMatch && !productMatch) return;
          if (quantity < rule.minimumQuantity) return;
          const delta =
            rule.valueType === "percentage"
              ? (nextPrice * rule.value) / 100
              : rule.value;
          nextPrice =
            rule.adjustmentType === "discount"
              ? Math.max(0, nextPrice - delta)
              : nextPrice + delta;
        });
      return Math.round(nextPrice * 100) / 100;
    },
    [pricingRules],
  );

  const applyDiscountRules = useCallback(
    ({
      amount,
      quantity = 1,
      category,
      productCode,
    }: {
      amount: number;
      quantity?: number;
      category?: string;
      productCode?: string;
    }) => {
      let nextAmount = amount;
      const now = new Date().toISOString().slice(0, 10);
      let nonStackableApplied = false;
      discountRules
        .filter((rule) => rule.status === "active")
        .forEach((rule) => {
          if (rule.startDate && now < rule.startDate) return;
          if (rule.endDate && now > rule.endDate) return;
          const categoryMatch =
            !rule.categories.length ||
            (category ? rule.categories.includes(category) : false);
          const productMatch =
            !rule.products.length ||
            (productCode ? rule.products.includes(productCode) : false);
          if (!categoryMatch && !productMatch) return;
          if (nextAmount < rule.minimumOrderAmount) return;
          if (quantity < 1) return;
          if (nonStackableApplied && !rule.stackable) return;
          nextAmount = Math.max(
            0,
            nextAmount - (nextAmount * rule.discountPercent) / 100,
          );
          if (!rule.stackable) {
            nonStackableApplied = true;
          }
        });
      return Math.round(nextAmount * 100) / 100;
    },
    [discountRules],
  );

  const applyTax = useCallback(
    (amount: number) => {
      const activeTax = taxSettings.find((setting) => setting.active);
      if (!activeTax) return amount;
      return (
        Math.round((amount + (amount * activeTax.taxRate) / 100) * 100) / 100
      );
    },
    [taxSettings],
  );

  const searchAll = useCallback(
    (query: string) => {
      const normalized = query.trim().toLowerCase();
      if (!normalized) return [];

      const scoreMatch = (value?: string) => {
        if (!value) return 0;
        const normalizedValue = value.toLowerCase();
        const matchIndex = normalizedValue.indexOf(normalized);
        if (matchIndex === -1) return 0;
        if (normalizedValue === normalized) return 100;
        if (normalizedValue.startsWith(normalized)) return 85;
        return Math.max(30, 60 - matchIndex);
      };

      const collectBestScore = (values: Array<string | undefined>) =>
        values.reduce((best, value) => Math.max(best, scoreMatch(value)), 0);

      const groupedResults: Record<
        GlobalSearchResult["group"],
        GlobalSearchResult[]
      > = {
        Users: [],
        Orders: [],
        Vendors: [],
        Clients: [],
        Invoices: [],
      };

      appUsers.forEach((appUser) => {
        const score = collectBestScore([
          appUser.fullName,
          appUser.username,
          appUser.email,
          appUser.jobTitle,
          appUser.department,
          appUser.roleId,
          appUser.organizationAccess,
          appUser.userType,
          appUser.status,
        ]);
        if (!score) return;
        groupedResults.Users.push({
          group: "Users",
          title: appUser.fullName,
          subtitle: [appUser.jobTitle, appUser.organizationAccess]
            .filter(Boolean)
            .join(" • "),
          badge: appUser.status || "user",
          path: "/users",
          id: appUser.id,
          score,
        });
      });

      const authUsers = safeReadJson<
        Array<{
          id: string;
          name?: string;
          email?: string;
          role?: string;
          organization?: string;
          status?: string;
          jobTitle?: string;
          department?: string;
        }>
      >("nido_users", []);

      authUsers.forEach((authUser) => {
        const score = collectBestScore([
          authUser.name,
          authUser.email,
          authUser.role,
          authUser.organization,
          authUser.status,
          authUser.jobTitle,
          authUser.department,
        ]);
        if (!score) return;
        groupedResults.Users.push({
          group: "Users",
          title: authUser.name || authUser.email || authUser.id,
          subtitle: [authUser.role, authUser.organization]
            .filter(Boolean)
            .join(" • "),
          badge: authUser.status || "user",
          path: "/users",
          id: `auth-${authUser.id}`,
          score,
        });
      });

      orders.forEach((order) => {
        const score = collectBestScore([
          order.orderNumber,
          order.organization,
          order.requestingUser,
          order.approvingUser,
          order.status,
          order.assignedUser,
          order.assignedAnalyst,
          order.analystTeam,
          order.serviceType,
        ]);
        if (!score) return;
        groupedResults.Orders.push({
          group: "Orders",
          title: order.orderNumber,
          subtitle: [order.organization, order.status]
            .filter(Boolean)
            .join(" • "),
          badge: order.slaStatus.replaceAll("_", " "),
          path: `/orders/${order.id}`,
          id: order.id,
          score,
        });
      });

      vendors.forEach((vendor) => {
        const score = collectBestScore([
          vendor.name,
          vendor.category,
          vendor.contactEmail,
          vendor.contactPhone,
          vendor.address,
          vendor.status,
        ]);
        if (!score) return;
        groupedResults.Vendors.push({
          group: "Vendors",
          title: vendor.name,
          subtitle: [vendor.category, vendor.status]
            .filter(Boolean)
            .join(" • "),
          badge: `Rating ${vendor.rating.toFixed(1)}`,
          path: `/vendors/${vendor.id}`,
          id: vendor.id,
          score,
        });
      });

      clients.forEach((client) => {
        const score = collectBestScore([
          client.name,
          client.companyName,
          client.clientCode,
          client.contactPerson,
          client.contactEmployeeId,
          client.contactNumber,
          client.jobTitle,
          client.email,
          client.industryType,
          client.businessType,
        ]);
        if (!score) return;
        groupedResults.Clients.push({
          group: "Clients",
          title: client.name,
          subtitle: [client.companyName, client.clientCode]
            .filter(Boolean)
            .join(" • "),
          badge: client.businessType || client.industryType || "client",
          path: `/clients/${client.id}`,
          id: client.id,
          score,
        });
      });

      invoices.forEach((invoice) => {
        const score = collectBestScore([
          invoice.invoiceNumber,
          invoice.customerName,
          invoice.vendorOrClient,
          invoice.type,
          invoice.status,
          invoice.dueDate,
          invoice.issueDate,
          String(invoice.total),
        ]);
        if (!score) return;
        groupedResults.Invoices.push({
          group: "Invoices",
          title:
            invoice.invoiceNumber ||
            invoice.customerName ||
            invoice.vendorOrClient ||
            invoice.id,
          subtitle: [
            invoice.customerName || invoice.vendorOrClient,
            invoice.status,
          ]
            .filter(Boolean)
            .join(" • "),
          badge: invoice.type || "invoice",
          path: `/sales/invoices/${invoice.id}`,
          id: invoice.id,
          score,
        });
      });

      return (
        Object.keys(groupedResults) as GlobalSearchResult["group"][]
      ).flatMap((group) =>
        groupedResults[group]
          .sort(
            (left, right) =>
              right.score - left.score || left.title.localeCompare(right.title),
          )
          .slice(0, 10),
      );
    },
    [appUsers, clients, invoices, orders, vendors],
  );

  const computeOrderPricing = useCallback(
    ({
      amount,
      quantity = 1,
      category,
      productCode,
      orderDate,
    }: {
      amount: number;
      quantity?: number;
      category?: string;
      productCode?: string;
      orderDate?: string;
    }) => {
      const dateToUse = orderDate || new Date().toISOString().slice(0, 10);
      const activePricing = pricingRules.filter(
        (rule) =>
          rule.status === "active" &&
          dateToUse >= rule.startDate &&
          dateToUse <= rule.endDate,
      );

      let adjustedAmount = amount;
      activePricing.forEach((rule) => {
        const categoryMatch =
          !rule.categories.length ||
          (category ? rule.categories.includes(category) : false);
        const productMatch =
          !rule.products.length ||
          (productCode ? rule.products.includes(productCode) : false);
        if (!categoryMatch && !productMatch) return;
        if (quantity < rule.minimumQuantity) return;
        const delta =
          rule.valueType === "percentage"
            ? (adjustedAmount * rule.value) / 100
            : rule.value;
        adjustedAmount =
          rule.adjustmentType === "discount"
            ? Math.max(0, adjustedAmount - delta)
            : adjustedAmount + delta;
      });

      const discountedAmount = applyDiscountRules({
        amount: adjustedAmount,
        quantity,
        category,
        productCode,
      });
      const taxedAmount = applyTax(discountedAmount);

      return {
        baseAmount: Math.round(amount * 100) / 100,
        adjustedAmount: Math.round(adjustedAmount * 100) / 100,
        discountedAmount,
        taxedAmount,
        total: taxedAmount,
      };
    },
    [applyDiscountRules, applyTax, pricingRules],
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
        masterCatalogItems,
        clientCatalogItems,
        pricingRules,
        discountRules,
        taxSettings,
        couponCodes,
        couponCodeRules,
        salesQuotes,
        salesOrders,
        invoices,
        salesActivities,

        roles,
        addOrder: orderCrud.add,
        updateOrder: orderCrud.update,
        bulkUpdateOrders,
        deleteOrder: orderCrud.delete,
        addVendor,
        updateVendor: vendorCrud.update,
        deleteVendor: vendorCrud.delete,
        addClient,
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
        addMasterCatalogItem,
        updateMasterCatalogItem,
        deleteMasterCatalogItem,
        getClientCatalog,
        addClientCatalogItem,
        updateClientCatalogItem,
        deleteClientCatalogItem,
        addPricingRule,
        updatePricingRule,
        addDiscountRule,
        updateDiscountRule,
        addCouponCode,
        updateCouponCode,
        addCouponCodeRule,
        updateCouponCodeRule,
        addTaxSetting,
        updateTaxSetting,
        upsertPrimaryTaxSetting,
        createQuote,
        updateQuote,
        createSalesOrder,
        updateSalesOrder,
        createInvoice,
        updateInvoice,
        convertQuoteToSalesOrder,
        convertQuoteToOrder,
        convertQuoteToInvoice,
        convertSalesOrderToInvoice,
        sendEmail,
        getActivities,
        getAllData,
        autoConfigurePricingAndDiscountRules,
        autoGenerateCouponCampaign,
        searchAll,
        exportRuleTemplate,
        importRuleTemplate,
        detectRuleConflicts,
        computeOrderPricing,
        applyPricingRules,
        applyDiscountRules,
        applyTax,
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
