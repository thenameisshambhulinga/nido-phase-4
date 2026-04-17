import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import { useData } from "@/contexts/DataContext";
import { useAuth, type UserRole } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Download,
  Mail,
  MapPin,
  Phone,
  Plus,
  Pencil,
  Search,
  Trash2,
  Upload,
  FileText,
  Image as ImageIcon,
  AlertTriangle,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import QuickMailComposer from "@/components/shared/QuickMailComposer";

const SERVICE_TYPES = [
  "Installation",
  "Preventive Maintenance",
  "Breakdown",
  "Repair",
  "AMC Visit",
] as const;

const CATALOG_DEFAULT_TAGS = [
  "CoreEssentials",
  "New Arrival",
  "High-End",
  "Budget",
  "Eco-Friendly",
];

const CATALOG_DEFAULT_VENDORS = [
  "HP Direct",
  "Sandisk Global",
  "Epson Hub",
  "Apple Store B2B",
  "Dell Enterprise",
];

const CATALOG_LEAD_TIME_OPTIONS = ["10 Days", "1 Month", "On Backorder", "TBD"];
const CATALOG_CUSTOMS_OPTIONS = ["Exempt", "Taxable", "Restricted"];

const ROLE_PERMISSION_MODULES = [
  "Dashboard",
  "Orders",
  "Users",
  "Catalog",
  "Services",
  "Shop",
  "Transactions",
  "Invoices",
  "Configuration",
  "Reports",
];

type PermissionAction = "view" | "create" | "edit" | "delete";

type ClientCoupon = {
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
  notes: string;
};

type CouponCodeRule = {
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
};

type TaxRuleFormState = {
  ruleName: string;
  taxCode: string;
  description: string;
  taxCategory: string;
  taxType: string;
  fiscalPeriod: string;
  taxRate: string;
  applyToCategory: string;
  minimumOrderAmount: string;
  roundingRule: string;
  priority: string;
  reverseCharge: boolean;
  recoverable: boolean;
  active: boolean;
};

const DEFAULT_TAX_RULE_FORM: TaxRuleFormState = {
  ruleName: "",
  taxCode: "",
  description: "",
  taxCategory: "GST",
  taxType: "Output",
  fiscalPeriod: "FY2026",
  taxRate: "18",
  applyToCategory: "IT Hardware",
  minimumOrderAmount: "0",
  roundingRule: "Round to Nearest",
  priority: "1",
  reverseCharge: false,
  recoverable: true,
  active: true,
};

function defaultRolePermissions() {
  return ROLE_PERMISSION_MODULES.reduce<
    Record<string, Record<PermissionAction, boolean>>
  >((acc, module) => {
    acc[module] = { view: true, create: false, edit: false, delete: false };
    return acc;
  }, {});
}

export default function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    clients,
    orders,
    orderStatuses,
    updateOrder,
    bulkUpdateOrders,
    addOrder,
    roles,
    addRole,
    updateRole,
    deleteRole,
    masterCatalogItems,
    getClientCatalog,
    addClientCatalogItem,
    updateClientCatalogItem,
    deleteClientCatalogItem,
    addPricingRule,
    addDiscountRule,
    addCouponCode,
    addCouponCodeRule,
    addTaxSetting,
    upsertPrimaryTaxSetting,
    autoConfigurePricingAndDiscountRules,
    autoGenerateCouponCampaign,
    exportRuleTemplate,
    importRuleTemplate,
    detectRuleConflicts,
    computeOrderPricing,
    taxSettings,
    pricingRules,
    discountRules,
    couponCodes,
    couponCodeRules,
    applyPricingRules,
    applyDiscountRules,
    applyTax,
  } = useData();
  const { users, createUser, updateUser, deleteUser, isOwner } = useAuth();

  const [activeTab, setActiveTab] = useState("overview");
  const [showMail, setShowMail] = useState(false);

  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [bulkUpdateOpen, setBulkUpdateOpen] = useState(false);
  const [createOrderOpen, setCreateOrderOpen] = useState(false);
  const [bulkComments, setBulkComments] = useState("");
  const [bulkTemplateReport, setBulkTemplateReport] = useState<{
    updated: number;
    skipped: number;
    invalidStatus: number;
    unmatched: string[];
  } | null>(null);
  const [bulkTemplateTab, setBulkTemplateTab] = useState("download");
  const [newOrderTemplateTab, setNewOrderTemplateTab] = useState("download");
  const bulkTemplateInputRef = useRef<HTMLInputElement>(null);
  const newOrderTemplateInputRef = useRef<HTMLInputElement>(null);
  const ruleTemplateInputRef = useRef<HTMLInputElement>(null);
  const [newOrderForm, setNewOrderForm] = useState({
    orderNumber: "",
    status: "Pending",
    assignedUser: "",
    comments: "",
  });

  const [catalogDialogOpen, setCatalogDialogOpen] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState("all");
  const [catalogStatusFilter, setCatalogStatusFilter] = useState("all");
  const [catalogBrandFilter, setCatalogBrandFilter] = useState("all");
  const [selectedCatalogIds, setSelectedCatalogIds] = useState<string[]>([]);
  const [catalogTagInput, setCatalogTagInput] = useState("");
  const [catalogAuditLogs, setCatalogAuditLogs] = useState<
    {
      id: string;
      event: string;
      detail: string;
      user: string;
      date: string;
      status: string;
    }[]
  >([]);
  const [selectedMasterProductId, setSelectedMasterProductId] = useState("");
  const [editingCatalogItemId, setEditingCatalogItemId] = useState<
    string | null
  >(null);
  const catalogBulkFileRef = useRef<HTMLInputElement>(null);
  const catalogImageInputRef = useRef<HTMLInputElement>(null);
  const [catalogImages, setCatalogImages] = useState<string[]>([]);
  const [catalogForm, setCatalogForm] = useState({
    productCode: "",
    name: "",
    category: "",
    subCategory: "",
    brand: "",
    productType: "Product",
    physicalType: "Physical",
    price: 0,
    discountPrice: "",
    status: "In Stock" as "In Stock" | "Low Stock" | "Out of Stock",
    initialStock: 0,
    minStockThreshold: 0,
    stock: 0,
    minStock: 0,
    description: "",
    tags: [] as string[],
    specification: "",
    warranty: "",
    hsnCode: "",
    customsDeclaration: "Exempt",
    primaryVendor: "",
    vendorSku: "",
    leadTime: "10 Days",
    vendorContact: "",
    vendorEmail: "",
    vendorPhone: "",
    vendorPhone2: "",
    trackPerformance: false,
    performanceRating: 4,
  });
  const [configTaxForm, setConfigTaxForm] = useState({
    taxType: "GST",
    taxRate: "18",
    taxRegistrationNo: "",
  });
  const [pricingRuleDialogOpen, setPricingRuleDialogOpen] = useState(false);
  const [discountRuleDialogOpen, setDiscountRuleDialogOpen] = useState(false);
  const [couponDialogOpen, setCouponDialogOpen] = useState(false);
  const [couponCodeRuleDialogOpen, setCouponCodeRuleDialogOpen] =
    useState(false);
  const [taxRuleDialogOpen, setTaxRuleDialogOpen] = useState(false);
  const [pricingRuleForm, setPricingRuleForm] = useState({
    name: "",
    status: true,
    ruleType: "Volume-Based" as "Volume-Based" | "Tiered Pricing",
    minimumQuantity: "10",
    category: "IT Hardware",
    adjustmentType: "discount" as "discount" | "markup",
    valueType: "percentage" as "percentage" | "fixed",
    value: "5",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: "2026-12-31",
    applyBeforeTax: true,
  });
  const [discountRuleForm, setDiscountRuleForm] = useState({
    name: "",
    description: "",
    status: true,
    ruleType: "Catalogue-Based" as "Catalogue-Based" | "Volume-Based",
    applyTo: "categories" as "categories" | "brands" | "specific-products",
    selection: "IT Hardware",
    minimumOrderAmount: "50000",
    discountPercent: "3",
    maxUsagePerUser: "5",
    stackable: false,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: "2026-12-31",
    applyBeforeTax: true,
  });
  const [couponForm, setCouponForm] = useState({
    title: "",
    code: "",
    autoGenerate: false,
    discountType: "percentage" as "percentage" | "fixed" | "shipping",
    discountValue: "20",
    minPurchase: "5000",
    usageLimit: "500",
    usagePerCustomer: "1",
    validFrom: new Date().toISOString().slice(0, 10),
    validTo: "2026-12-31",
    active: true,
    notes: "",
    restrictCombine: true,
    validOnSaleItems: true,
  });
  const [couponCodeRuleForm, setCouponCodeRuleForm] = useState({
    name: "",
    description: "",
    status: true,
    triggerType: "specific" as "prefix" | "suffix" | "specific" | "all",
    triggerValue: "",
    conditionField: "cart_total" as
      | "cart_total"
      | "item_count"
      | "specific_products"
      | "client_type",
    comparator: ">=" as ">=" | "<=" | "==",
    threshold: "10000",
    discountType: "percentage" as "percentage" | "fixed",
    discountValue: "20",
    calculationOrder: "before_tax" as "before_tax" | "after_tax",
    maxUsageGlobal: "500",
    maxUsagePerCustomer: "1",
    stackable: false,
  });
  const [taxRuleForm, setTaxRuleForm] = useState<TaxRuleFormState>(
    DEFAULT_TAX_RULE_FORM,
  );
  const [pricingPreview, setPricingPreview] = useState({
    amount: "10000",
    quantity: "5",
    category: "IT Hardware",
    productCode: "",
  });

  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [roleForm, setRoleForm] = useState({
    name: "",
    description: "",
    status: "active" as "active" | "inactive",
    permissions: defaultRolePermissions(),
  });

  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    role: "employee" as UserRole,
    jobTitle: "",
    department: "",
    status: "active" as "active" | "inactive" | "suspended",
  });

  const client = clients.find((c) => c.id === id);

  const clientOrders = useMemo(
    () => (client ? orders.filter((o) => o.organization === client.name) : []),
    [client, orders],
  );

  const clientCatalog = useMemo(
    () => (client ? getClientCatalog(client.id) : []),
    [client, getClientCatalog],
  );

  const selectedMasterProduct = useMemo(
    () =>
      masterCatalogItems.find((item) => item.id === selectedMasterProductId),
    [masterCatalogItems, selectedMasterProductId],
  );

  const catalogCategories = useMemo(
    () =>
      Array.from(
        new Set(
          [...masterCatalogItems, ...clientCatalog]
            .map((item) => item.category)
            .filter(Boolean),
        ),
      ),
    [clientCatalog, masterCatalogItems],
  );

  const catalogBrands = useMemo(
    () =>
      Array.from(
        new Set(
          [...masterCatalogItems, ...clientCatalog]
            .map((item) => item.brand)
            .filter(Boolean),
        ),
      ),
    [clientCatalog, masterCatalogItems],
  );

  const filteredCatalogItems = useMemo(() => {
    const query = catalogSearch.toLowerCase();
    return clientCatalog.filter((item) => {
      if (
        query &&
        !item.name.toLowerCase().includes(query) &&
        !item.productCode.toLowerCase().includes(query)
      ) {
        return false;
      }
      if (
        catalogCategoryFilter !== "all" &&
        item.category !== catalogCategoryFilter
      ) {
        return false;
      }
      if (
        catalogStatusFilter !== "all" &&
        item.status !== catalogStatusFilter
      ) {
        return false;
      }
      if (catalogBrandFilter !== "all" && item.brand !== catalogBrandFilter) {
        return false;
      }
      return true;
    });
  }, [
    catalogBrandFilter,
    catalogCategoryFilter,
    catalogSearch,
    catalogStatusFilter,
    clientCatalog,
  ]);

  const catalogStats = useMemo(
    () => ({
      total: clientCatalog.length,
      inStock: clientCatalog.filter((item) => item.status === "In Stock")
        .length,
      lowStock: clientCatalog.filter((item) => item.status === "Low Stock")
        .length,
      outOfStock: clientCatalog.filter((item) => item.status === "Out of Stock")
        .length,
    }),
    [clientCatalog],
  );

  const clientUsers = useMemo(
    () => (client ? users.filter((u) => u.organization === client.name) : []),
    [client, users],
  );

  const serviceHistory = useMemo(() => {
    return clientOrders.map((order, index) => ({
      serviceId: `SRV-${order.orderNumber}`,
      ticketNumber: `TCK-${order.orderNumber}`,
      serviceType:
        order.serviceType || SERVICE_TYPES[index % SERVICE_TYPES.length],
      assignedUser: order.assignedUser || order.assignedAnalyst || "Unassigned",
      status: order.status,
      itemName: order.items.map((item) => item.name).join(", "),
    }));
  }, [clientOrders]);

  const getCatalogStatusColor = (status: string) => {
    switch (status) {
      case "In Stock":
        return "bg-success text-success-foreground";
      case "Low Stock":
        return "bg-warning text-warning-foreground";
      case "Out of Stock":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const allCatalogRowsSelected =
    filteredCatalogItems.length > 0 &&
    selectedCatalogIds.length === filteredCatalogItems.length;

  const toggleCatalogRow = (itemId: string) => {
    setSelectedCatalogIds((prev) =>
      prev.includes(itemId)
        ? prev.filter((idValue) => idValue !== itemId)
        : [...prev, itemId],
    );
  };

  const toggleAllCatalogRows = () => {
    setSelectedCatalogIds(
      allCatalogRowsSelected ? [] : filteredCatalogItems.map((item) => item.id),
    );
  };

  const appendCatalogAudit = (event: string, detail: string) => {
    setCatalogAuditLogs((prev) => [
      {
        id: `catalog-log-${Date.now()}`,
        event,
        detail,
        user: "System",
        date: new Date().toLocaleString(),
        status: "Approved",
      },
      ...prev,
    ]);
  };

  const activeTaxSetting =
    taxSettings.find((setting) => setting.active) || taxSettings[0] || null;

  useEffect(() => {
    setConfigTaxForm({
      taxType: activeTaxSetting?.taxType || "GST",
      taxRate: String(activeTaxSetting?.taxRate ?? 18),
      taxRegistrationNo:
        activeTaxSetting?.taxRegistrationNo || client?.gst || "",
    });
  }, [activeTaxSetting, client?.gst]);

  if (!client) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Client not found.</p>
        <Button onClick={() => navigate("/clients")} className="mt-4">
          Back to Clients
        </Button>
      </div>
    );
  }

  const initials = client.name
    .split(" ")
    .filter(Boolean)
    .map((s) => s[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();

  const daysRemaining = Math.max(
    0,
    Math.ceil(
      (new Date(client.contractEnd).getTime() - Date.now()) /
        (1000 * 60 * 60 * 24),
    ),
  );

  const contractProgress =
    client.contractStart && client.contractEnd
      ? Math.min(
          100,
          Math.round(
            ((Date.now() - new Date(client.contractStart).getTime()) /
              (new Date(client.contractEnd).getTime() -
                new Date(client.contractStart).getTime())) *
              100,
          ),
        )
      : 0;

  const totalSpend = clientOrders.reduce(
    (sum, order) => sum + order.totalAmount,
    0,
  );

  const activeClientUsers = clientUsers.filter(
    (entry) => entry.status === "active",
  ).length;

  const openOrdersCount = clientOrders.filter((order) => {
    const normalized = order.status.toLowerCase();
    return !["delivered", "cancelled"].includes(normalized);
  }).length;

  const spendCategories = useMemo(() => {
    const categoryTotals = {
      Hardware: 0,
      Software: 0,
      Service: 0,
      Other: 0,
    };

    clientOrders.forEach((order) => {
      order.items.forEach((item) => {
        const name = item.name.toLowerCase();
        if (
          name.includes("laptop") ||
          name.includes("phone") ||
          name.includes("hardware") ||
          name.includes("device")
        ) {
          categoryTotals.Hardware += item.totalCost;
        } else if (
          name.includes("license") ||
          name.includes("software") ||
          name.includes("subscription")
        ) {
          categoryTotals.Software += item.totalCost;
        } else if (
          name.includes("service") ||
          name.includes("support") ||
          name.includes("maintenance")
        ) {
          categoryTotals.Service += item.totalCost;
        } else {
          categoryTotals.Other += item.totalCost;
        }
      });
    });

    const total = Object.values(categoryTotals).reduce(
      (sum, value) => sum + value,
      0,
    );
    const fallback = totalSpend || 1;

    if (total === 0) {
      return [
        {
          name: "Hardware",
          value: Math.round(fallback * 0.45),
          color: "#4169e1",
        },
        {
          name: "Software",
          value: Math.round(fallback * 0.3),
          color: "#4aa8f0",
        },
        {
          name: "Service",
          value: Math.round(fallback * 0.15),
          color: "#9f7aea",
        },
        { name: "Other", value: Math.round(fallback * 0.1), color: "#7a8498" },
      ];
    }

    return [
      { name: "Hardware", value: categoryTotals.Hardware, color: "#4169e1" },
      { name: "Software", value: categoryTotals.Software, color: "#4aa8f0" },
      { name: "Service", value: categoryTotals.Service, color: "#9f7aea" },
      { name: "Other", value: categoryTotals.Other, color: "#7a8498" },
    ];
  }, [clientOrders, totalSpend]);

  const monthlySpendSeries = useMemo(() => {
    const buckets = new Map<string, number>();
    clientOrders.forEach((order) => {
      const key = order.orderDate.slice(0, 7);
      buckets.set(key, (buckets.get(key) || 0) + order.totalAmount);
    });

    return Array.from(buckets.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([month, amount]) => ({
        month: month.slice(5),
        amount,
      }));
  }, [clientOrders]);

  const overviewSpendBars =
    monthlySpendSeries.length > 0
      ? monthlySpendSeries
      : [
          { month: "01", amount: 22000 },
          { month: "02", amount: 31000 },
          { month: "03", amount: 42000 },
          { month: "04", amount: 56000 },
          { month: "05", amount: 64000 },
          { month: "06", amount: 78000 },
        ];

  const overviewSpendPeak = Math.max(
    ...overviewSpendBars.map((entry) => entry.amount),
    1,
  );

  const donutGradient = useMemo(() => {
    const total =
      spendCategories.reduce((sum, entry) => sum + entry.value, 0) || 1;
    let cursor = 0;
    const segments = spendCategories.map((entry) => {
      const from = (cursor / total) * 100;
      cursor += entry.value;
      const to = (cursor / total) * 100;
      return `${entry.color} ${from}% ${to}%`;
    });
    return `conic-gradient(${segments.join(", ")})`;
  }, [spendCategories]);

  const ruleConflicts = detectRuleConflicts();

  const pricingSimulation = computeOrderPricing({
    amount: Number(pricingPreview.amount) || 0,
    quantity: Number(pricingPreview.quantity) || 1,
    category: pricingPreview.category || undefined,
    productCode: pricingPreview.productCode || undefined,
  });

  const allOrdersSelected =
    clientOrders.length > 0 && selectedOrders.length === clientOrders.length;

  const toggleOrder = (orderId: string) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId)
        ? prev.filter((idValue) => idValue !== orderId)
        : [...prev, orderId],
    );
  };

  const toggleAllOrders = () => {
    setSelectedOrders(
      allOrdersSelected ? [] : clientOrders.map((order) => order.id),
    );
  };

  const applyBulkUpdate = (nextStatus?: string) => {
    if (selectedOrders.length === 0) {
      toast({ title: "Select at least one order" });
      return;
    }

    const commentText = bulkComments.trim();
    const nextComment = commentText || "Bulk comment updated";
    bulkUpdateOrders(
      selectedOrders,
      nextStatus
        ? { status: nextStatus, comments: nextComment }
        : { comments: nextComment },
    );

    selectedOrders.forEach((orderId) => {
      const target = clientOrders.find((order) => order.id === orderId);
      if (!target) return;
      const historyEntry = {
        id: `comment-${Date.now()}-${orderId}`,
        user: "System",
        text: nextComment,
        timestamp: new Date().toISOString(),
        type: "internal" as const,
      };
      updateOrder(orderId, {
        comments: nextComment,
        commentHistory: [...target.commentHistory, historyEntry],
      });
    });

    toast({ title: "Bulk order update applied" });
    setSelectedOrders([]);
    setBulkComments("");
    setBulkTemplateReport(null);
    setBulkUpdateOpen(false);
  };

  const parseCsvRow = (line: string) => {
    const cells: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let idx = 0; idx < line.length; idx += 1) {
      const char = line[idx];
      if (char === '"') {
        const nextChar = line[idx + 1];
        if (inQuotes && nextChar === '"') {
          current += '"';
          idx += 1;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }

      if (char === "," && !inQuotes) {
        cells.push(current.trim());
        current = "";
        continue;
      }

      current += char;
    }

    cells.push(current.trim());
    return cells.map((value) => value.replace(/^"|"$/g, ""));
  };

  const resolveTemplateStatus = (rawStatus: string, currentStatus: string) => {
    const normalized = rawStatus.trim().toLowerCase();
    if (!normalized) {
      return { status: currentStatus, isValid: true };
    }

    const allStatuses = Array.from(
      new Set([
        ...orderStatuses.map((entry) => entry.name),
        ...clientOrders.map((order) => order.status),
      ]),
    );
    const matched = allStatuses.find(
      (candidate) => candidate.toLowerCase() === normalized,
    );

    if (!matched) {
      return { status: currentStatus, isValid: false };
    }

    return { status: matched, isValid: true };
  };

  const downloadOrderTemplate = () => {
    const csv = [
      ["OrderID", "Status", "Comments", "Action"],
      ...clientOrders.map((order) => [
        order.orderNumber,
        order.status,
        order.comments || "",
        "Update",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "client-order-template.csv";
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: "Template downloaded" });
  };

  const onOrderTemplateUpload = (evt: ChangeEvent<HTMLInputElement>) => {
    const file = evt.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast({ title: "Only CSV files are allowed" });
      return;
    }
    setBulkTemplateReport(null);

    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      const lines = text.split(/\r?\n/).filter((line) => line.trim());
      if (lines.length < 2) {
        toast({ title: "Template is empty" });
        return;
      }
      const headers = parseCsvRow(lines[0]).map((header) =>
        header.trim().toLowerCase(),
      );
      const orderIdx = headers.findIndex((header) =>
        ["orderid", "order #", "ordernumber", "order_number"].includes(header),
      );
      const statusIdx = headers.findIndex((header) => header === "status");
      const commentIdx = headers.findIndex((header) =>
        ["comments", "comment", "note", "notes"].includes(header),
      );

      if (orderIdx === -1) {
        toast({ title: "Template must include OrderID column" });
        return;
      }

      let updated = 0;
      let skipped = 0;
      let invalidStatus = 0;
      const unmatched: string[] = [];

      lines.slice(1).forEach((line) => {
        const cols = parseCsvRow(line);
        const orderNumber = cols[orderIdx];
        if (!orderNumber) return;
        const target = clientOrders.find(
          (order) => order.orderNumber === orderNumber,
        );
        if (!target) {
          skipped += 1;
          unmatched.push(orderNumber);
          return;
        }
        const resolvedStatus = resolveTemplateStatus(
          statusIdx >= 0 ? cols[statusIdx] || "" : "",
          target.status,
        );
        if (!resolvedStatus.isValid) {
          invalidStatus += 1;
        }
        const nextComment =
          (commentIdx >= 0 ? cols[commentIdx] : "") ||
          target.comments ||
          "Template update";
        updateOrder(target.id, {
          status: resolvedStatus.status,
          comments: nextComment,
          commentHistory: [
            ...target.commentHistory,
            {
              id: `comment-${Date.now()}-${target.id}`,
              user: "System",
              text: nextComment,
              timestamp: new Date().toISOString(),
              type: "internal",
            },
          ],
        });
        updated += 1;
      });

      setBulkTemplateReport({
        updated,
        skipped,
        invalidStatus,
        unmatched: unmatched.slice(0, 5),
      });

      if (updated > 0) {
        toast({
          title: `${updated} order(s) updated from template`,
          description:
            skipped > 0
              ? `${skipped} row(s) were skipped. Check summary below.`
              : undefined,
        });
        setSelectedOrders([]);
      } else {
        toast({
          title: "No matching orders were updated",
          description: "Review template values and try again.",
        });
      }
    };
    reader.readAsText(file);
    evt.target.value = "";
  };

  const handleCreateOrder = () => {
    if (!newOrderForm.orderNumber.trim()) {
      toast({ title: "Order number is required" });
      return;
    }

    addOrder({
      id: `ord-${Date.now()}`,
      orderNumber: newOrderForm.orderNumber.trim(),
      orderDate: new Date().toISOString().slice(0, 10),
      organization: client.name,
      requestingUser: client.contactPerson,
      approvingUser: client.contactPerson,
      status: newOrderForm.status,
      assignedUser: newOrderForm.assignedUser || client.contactPerson,
      items: [],
      billingAddress: client.address,
      shippingAddress: client.address,
      paymentMethod: client.paymentTerms || "Net Terms",
      deliveryMethod: "Standard",
      trackingNumber: "",
      slaStartTime: new Date().toISOString(),
      slaStatus: "within_sla",
      assignedAnalyst: newOrderForm.assignedUser || client.contactPerson,
      analystTeam: "Client Operations",
      totalAmount: 0,
      comments: newOrderForm.comments.trim(),
      commentHistory: newOrderForm.comments.trim()
        ? [
            {
              id: `comment-${Date.now()}`,
              user: client.contactPerson,
              text: newOrderForm.comments.trim(),
              timestamp: new Date().toISOString(),
              type: "internal",
            },
          ]
        : [],
      attachments: [],
      serviceType: "",
    });

    setCreateOrderOpen(false);
    setNewOrderForm({
      orderNumber: "",
      status: "Pending",
      assignedUser: "",
      comments: "",
    });
    toast({ title: "Order created" });
  };

  const openCatalogDialog = (itemId?: string) => {
    if (itemId) {
      const item = clientCatalog.find((entry) => entry.id === itemId);
      if (!item) return;
      setEditingCatalogItemId(item.id);
      setSelectedMasterProductId(item.masterProductId);
      setCatalogImages(item.image ? [item.image] : []);
      setCatalogForm({
        productCode: item.productCode,
        name: item.name,
        category: item.category,
        subCategory: item.subCategory,
        brand: item.brand,
        productType: item.productType,
        physicalType: item.physicalType,
        price: item.price,
        discountPrice: item.discountPrice ? String(item.discountPrice) : "",
        status: item.status,
        initialStock: item.initialStock,
        minStockThreshold: item.minStockThreshold,
        stock: item.stock,
        minStock: item.minStock,
        description: item.description || "",
        tags: item.tags || [],
        specification: item.specification || "",
        warranty: item.warranty || "",
        hsnCode: item.hsnCode || "",
        customsDeclaration: item.customsDeclaration || "Exempt",
        primaryVendor: item.primaryVendor || "",
        vendorSku: item.vendorSku || "",
        leadTime: item.leadTime || "10 Days",
        vendorContact: item.vendorContact || "",
        vendorEmail: item.vendorEmail || "",
        vendorPhone: item.vendorPhone || "",
        vendorPhone2: item.vendorPhone2 || "",
        trackPerformance: item.trackPerformance || false,
        performanceRating: item.performanceRating || 4,
      });
      setCatalogDialogOpen(true);
      return;
    }

    setEditingCatalogItemId(null);
    setSelectedMasterProductId("");
    setCatalogImages([]);
    setCatalogForm({
      productCode: "",
      name: "",
      category: "",
      subCategory: "",
      brand: "",
      productType: "Product",
      physicalType: "Physical",
      price: 0,
      discountPrice: "",
      status: "In Stock",
      initialStock: 0,
      minStockThreshold: 0,
      stock: 0,
      minStock: 0,
      description: "",
      tags: [],
      specification: "",
      warranty: "",
      hsnCode: "",
      customsDeclaration: "Exempt",
      primaryVendor: "",
      vendorSku: "",
      leadTime: "10 Days",
      vendorContact: "",
      vendorEmail: "",
      vendorPhone: "",
      vendorPhone2: "",
      trackPerformance: false,
      performanceRating: 4,
    });
    setCatalogDialogOpen(true);
  };

  const saveCatalogItem = () => {
    if (!isOwner) {
      toast({ title: "Only owner can fix client-specific product pricing" });
      return;
    }

    if (!selectedMasterProduct) {
      toast({ title: "Select a master catalog item first" });
      return;
    }

    const payload = {
      masterProductId: selectedMasterProduct.id,
      masterBasePrice: selectedMasterProduct.price,
      priceFixedByOwner: true,
      productCode: selectedMasterProduct.productCode,
      name: selectedMasterProduct.name,
      category: selectedMasterProduct.category,
      subCategory: selectedMasterProduct.subCategory,
      brand: selectedMasterProduct.brand,
      productType: selectedMasterProduct.productType,
      physicalType: selectedMasterProduct.physicalType,
      price: Number.isFinite(catalogForm.price)
        ? catalogForm.price
        : selectedMasterProduct.price,
      discountPrice: catalogForm.discountPrice
        ? Number(catalogForm.discountPrice)
        : selectedMasterProduct.discountPrice,
      status: catalogForm.status,
      image: catalogImages[0] || selectedMasterProduct.image,
      description: selectedMasterProduct.description || catalogForm.description,
      initialStock: catalogForm.initialStock,
      minStockThreshold: catalogForm.minStockThreshold,
      stock: catalogForm.stock,
      minStock: catalogForm.minStock,
      tags: selectedMasterProduct.tags || catalogForm.tags,
      specification:
        selectedMasterProduct.specification || catalogForm.specification,
      warranty: selectedMasterProduct.warranty || catalogForm.warranty,
      hsnCode: selectedMasterProduct.hsnCode,
      customsDeclaration: selectedMasterProduct.customsDeclaration,
      primaryVendor: selectedMasterProduct.primaryVendor || "",
      vendorSku: selectedMasterProduct.vendorSku || "",
      leadTime: selectedMasterProduct.leadTime || "10 Days",
      vendorContact: selectedMasterProduct.vendorContact || "",
      vendorEmail: selectedMasterProduct.vendorEmail || "",
      vendorPhone: selectedMasterProduct.vendorPhone || "",
      vendorPhone2: selectedMasterProduct.vendorPhone2 || "",
      trackPerformance: selectedMasterProduct.trackPerformance || false,
      performanceRating: selectedMasterProduct.performanceRating || 4,
    };

    if (editingCatalogItemId) {
      updateClientCatalogItem(client.id, editingCatalogItemId, payload);
      appendCatalogAudit("Item Updated", payload.name);
      toast({ title: "Catalog item updated" });
    } else {
      addClientCatalogItem(client.id, payload);
      appendCatalogAudit("Item Added", payload.name);
      toast({ title: "Catalog item added" });
    }

    setCatalogDialogOpen(false);
  };

  const downloadCatalogExport = () => {
    if (selectedCatalogIds.length === 0) {
      toast({ title: "Select at least one catalog item to export" });
      return;
    }

    const selectedItems = clientCatalog.filter((item) =>
      selectedCatalogIds.includes(item.id),
    );
    const rows = [
      ["ProductCode", "ItemName", "Category", "Brand", "Price", "Status"],
      ...selectedItems.map((item) => [
        item.productCode,
        item.name,
        item.category,
        item.brand,
        String(item.price),
        item.status,
      ]),
    ];
    const csv = rows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${client.name.replace(/\s+/g, "-").toLowerCase()}-catalog.csv`;
    link.click();
    URL.revokeObjectURL(url);
    appendCatalogAudit("Catalog Export", "CSV export generated");
    toast({ title: "Catalog exported" });
  };

  const downloadCatalogTemplate = () => {
    const templateRows = [
      ["ProductCode", "ItemName", "Category", "Brand", "Price", "Status"],
      [
        "PRD-1001",
        "Laptop Stand",
        "IT Hardware",
        "Logitech",
        "1500",
        "In Stock",
      ],
    ];
    const csv = templateRows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "client-catalog-template.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCatalogBulkImport = (evt: ChangeEvent<HTMLInputElement>) => {
    const file = evt.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast({ title: "Only CSV files are allowed" });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      const lines = text.split(/\r?\n/).filter((line) => line.trim());
      if (lines.length < 2) {
        toast({ title: "Template is empty" });
        return;
      }

      const headers = lines[0]
        .split(",")
        .map((header) => header.trim().toLowerCase());
      const productCodeIdx = headers.indexOf("productcode");
      const itemNameIdx = headers.indexOf("itemname");
      const categoryIdx = headers.indexOf("category");
      const brandIdx = headers.indexOf("brand");
      const priceIdx = headers.indexOf("price");
      const statusIdx = headers.indexOf("status");

      let imported = 0;
      lines.slice(1).forEach((line) => {
        const cols = line
          .split(",")
          .map((value) => value.trim().replace(/^"|"$/g, ""));
        const productCode = cols[productCodeIdx] || "";
        const name = cols[itemNameIdx] || "";
        if (!productCode || !name) return;

        addClientCatalogItem(client.id, {
          masterProductId: selectedMasterProductId || `mc-${Date.now()}`,
          productCode,
          name,
          category: cols[categoryIdx] || "IT Hardware",
          subCategory: "",
          brand: cols[brandIdx] || "",
          productType: "Product",
          physicalType: "Physical",
          price: Number(cols[priceIdx]) || 0,
          status:
            (cols[statusIdx] as "In Stock" | "Low Stock" | "Out of Stock") ||
            "In Stock",
          initialStock: 0,
          minStockThreshold: 0,
          stock: 0,
          minStock: 0,
        });
        imported += 1;
      });

      appendCatalogAudit("Bulk Import", `${imported} item(s) imported`);
      toast({ title: `${imported} catalog item(s) imported` });
    };
    reader.readAsText(file);
    evt.target.value = "";
  };

  const openRoleDialog = (roleId?: string) => {
    if (!roleId) {
      setEditingRoleId(null);
      setRoleForm({
        name: "",
        description: "",
        status: "active",
        permissions: defaultRolePermissions(),
      });
      setRoleDialogOpen(true);
      return;
    }

    const role = roles.find((item) => item.id === roleId);
    if (!role) return;

    const mappedPermissions = defaultRolePermissions();
    Object.keys(mappedPermissions).forEach((module) => {
      mappedPermissions[module].view = !!role.permissions[module]?.view;
      mappedPermissions[module].create = !!role.permissions[module]?.create;
      mappedPermissions[module].edit = !!role.permissions[module]?.edit;
      mappedPermissions[module].delete = !!role.permissions[module]?.delete;
    });

    setEditingRoleId(role.id);
    setRoleForm({
      name: role.name,
      description: role.description,
      status: role.status,
      permissions: mappedPermissions,
    });
    setRoleDialogOpen(true);
  };

  const saveRole = () => {
    if (!roleForm.name.trim()) {
      toast({ title: "Role name is required" });
      return;
    }

    const payload = {
      name: roleForm.name,
      description: roleForm.description,
      status: roleForm.status,
      users: roles.find((r) => r.id === editingRoleId)?.users || 0,
      modules: ROLE_PERMISSION_MODULES.filter(
        (module) => roleForm.permissions[module].view,
      ),
      permissions: roleForm.permissions,
    };

    if (editingRoleId) {
      updateRole(editingRoleId, payload);
      toast({ title: "Role updated" });
    } else {
      addRole(payload);
      toast({ title: "Role created" });
    }

    setRoleDialogOpen(false);
  };

  const toggleRolePermission = (module: string, key: PermissionAction) => {
    setRoleForm((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [module]: {
          ...prev.permissions[module],
          [key]: !prev.permissions[module][key],
        },
      },
    }));
  };

  const openUserDialog = (userId?: string) => {
    if (!userId) {
      setEditingUserId(null);
      setUserForm({
        name: "",
        email: "",
        role: "employee",
        jobTitle: "",
        department: "",
        status: "active",
      });
      setUserDialogOpen(true);
      return;
    }

    const selectedUser = users.find((u) => u.id === userId);
    if (!selectedUser) return;

    setEditingUserId(selectedUser.id);
    setUserForm({
      name: selectedUser.name,
      email: selectedUser.email,
      role: selectedUser.role,
      jobTitle: selectedUser.jobTitle || "",
      department: selectedUser.department || "",
      status: selectedUser.status,
    });
    setUserDialogOpen(true);
  };

  const saveUser = () => {
    if (!userForm.name.trim() || !userForm.email.trim()) {
      toast({ title: "Name and email are required" });
      return;
    }

    const payload = {
      name: userForm.name,
      email: userForm.email,
      role: userForm.role,
      organization: client.name,
      jobTitle: userForm.jobTitle,
      department: userForm.department,
      status: userForm.status,
      modules: ["dashboard"],
    };

    if (editingUserId) {
      updateUser(editingUserId, payload);
      toast({ title: "Client user updated" });
    } else {
      createUser(payload);
      toast({ title: `Welcome email sent to ${userForm.email}` });
    }

    setUserDialogOpen(false);
  };

  const exportCatalog = () => {
    const rows = [
      ["Product Code", "Item Name", "Category", "Price", "Status"],
      ...clientCatalog.map((item) => [
        item.productCode,
        item.name,
        item.category,
        String(item.price),
        item.status,
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${client.name.replace(/\s+/g, "-").toLowerCase()}-catalog.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadRuleTemplate = () => {
    const csv = exportRuleTemplate();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "pricing-discount-rule-template.csv";
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: "Rule template downloaded" });
  };

  const handleRuleTemplateUpload = (evt: ChangeEvent<HTMLInputElement>) => {
    const file = evt.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast({ title: "Only CSV files are allowed" });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = importRuleTemplate(String(reader.result || ""));
      const warningText =
        result.errors.length > 0
          ? ` (${result.errors.length} issue(s) skipped)`
          : "";
      toast({
        title: "Rule template imported",
        description: `${result.pricingAdded} pricing and ${result.discountAdded} discount rule(s) added${warningText}.`,
      });
    };
    reader.readAsText(file);
    evt.target.value = "";
  };

  const handleCreatePricingRule = () => {
    if (!pricingRuleForm.name.trim()) {
      toast({ title: "Pricing rule name is required" });
      return;
    }

    addPricingRule({
      name: pricingRuleForm.name,
      status: pricingRuleForm.status ? "active" : "inactive",
      ruleType: pricingRuleForm.ruleType,
      minimumQuantity: Number(pricingRuleForm.minimumQuantity) || 0,
      categories: [pricingRuleForm.category],
      products: [],
      adjustmentType: pricingRuleForm.adjustmentType,
      valueType: pricingRuleForm.valueType,
      value: Number(pricingRuleForm.value) || 0,
      startDate: pricingRuleForm.startDate,
      endDate: pricingRuleForm.endDate,
      applyBeforeTax: pricingRuleForm.applyBeforeTax,
    });

    setPricingRuleDialogOpen(false);
    setPricingRuleForm((prev) => ({ ...prev, name: "" }));
    toast({ title: "Pricing rule created" });
  };

  const handleCreateDiscountRule = () => {
    if (!discountRuleForm.name.trim()) {
      toast({ title: "Discount rule name is required" });
      return;
    }

    addDiscountRule({
      name: discountRuleForm.name,
      status: discountRuleForm.status ? "active" : "inactive",
      ruleType: discountRuleForm.ruleType,
      categories:
        discountRuleForm.applyTo === "categories"
          ? [discountRuleForm.selection]
          : [],
      products:
        discountRuleForm.applyTo === "specific-products"
          ? [discountRuleForm.selection]
          : [],
      minimumOrderAmount: Number(discountRuleForm.minimumOrderAmount) || 0,
      discountPercent: Number(discountRuleForm.discountPercent) || 0,
      maxUsagePerUser: Number(discountRuleForm.maxUsagePerUser) || 0,
      stackable: discountRuleForm.stackable,
      startDate: discountRuleForm.startDate,
      endDate: discountRuleForm.endDate,
      applyBeforeTax: discountRuleForm.applyBeforeTax,
    });

    setDiscountRuleDialogOpen(false);
    setDiscountRuleForm((prev) => ({ ...prev, name: "", description: "" }));
    toast({ title: "Discount rule created" });
  };

  const handleCreateCoupon = () => {
    if (!couponForm.title.trim()) {
      toast({ title: "Coupon title is required" });
      return;
    }

    const code =
      couponForm.autoGenerate || !couponForm.code.trim()
        ? `NIDO${Math.floor(1000 + Math.random() * 9000)}`
        : couponForm.code.trim().toUpperCase();

    addCouponCode({
      title: couponForm.title,
      code,
      discountType: couponForm.discountType,
      discountValue: Number(couponForm.discountValue) || 0,
      minPurchase: Number(couponForm.minPurchase) || 0,
      usageLimit: Number(couponForm.usageLimit) || 0,
      usagePerCustomer: Number(couponForm.usagePerCustomer) || 1,
      validFrom: couponForm.validFrom,
      validTo: couponForm.validTo,
      active: couponForm.active,
      notes: couponForm.notes,
    });

    setCouponDialogOpen(false);
    setCouponForm((prev) => ({ ...prev, title: "", code: "", notes: "" }));
    toast({
      title: "Coupon created",
      description: `Coupon code ${code} is ready for use.`,
    });
  };

  const handleCreateCouponCodeRule = () => {
    if (!couponCodeRuleForm.name.trim()) {
      toast({ title: "Coupon code rule name is required" });
      return;
    }

    addCouponCodeRule({
      name: couponCodeRuleForm.name,
      triggerType: couponCodeRuleForm.triggerType,
      triggerValue: couponCodeRuleForm.triggerValue,
      conditionField: couponCodeRuleForm.conditionField,
      comparator: couponCodeRuleForm.comparator,
      threshold: Number(couponCodeRuleForm.threshold) || 0,
      discountType: couponCodeRuleForm.discountType,
      discountValue: Number(couponCodeRuleForm.discountValue) || 0,
      calculationOrder: couponCodeRuleForm.calculationOrder,
      maxUsageGlobal: Number(couponCodeRuleForm.maxUsageGlobal) || 0,
      maxUsagePerCustomer: Number(couponCodeRuleForm.maxUsagePerCustomer) || 1,
      stackable: couponCodeRuleForm.stackable,
      active: couponCodeRuleForm.status,
    });

    setCouponCodeRuleDialogOpen(false);
    setCouponCodeRuleForm((prev) => ({
      ...prev,
      name: "",
      description: "",
      triggerValue: "",
    }));
    toast({ title: "Coupon code rule created" });
  };

  const handleAutoConfigureCommercialRules = () => {
    const configured = autoConfigurePricingAndDiscountRules();
    const campaign = autoGenerateCouponCampaign({
      prefix: client.name.replace(/[^A-Za-z]/g, "").slice(0, 4) || "NIDO",
      count: 5,
      discountType: "percentage",
      discountValue: 10,
      minPurchase: 5000,
      validDays: 90,
      category: pricingRuleForm.category,
    });

    toast({
      title: "Automation completed",
      description: `${configured.pricingAdded} pricing, ${configured.discountAdded} discount, ${campaign.couponsCreated} coupons and ${campaign.rulesCreated} coupon rule generated automatically.`,
    });
  };

  const handleCreateTaxRule = () => {
    if (!taxRuleForm.ruleName.trim()) {
      toast({ title: "Tax rule name is required" });
      return;
    }

    addTaxSetting({
      taxType: taxRuleForm.taxCategory,
      taxRate: Number(taxRuleForm.taxRate) || 0,
      taxRegistrationNo: taxRuleForm.taxCode || configTaxForm.taxRegistrationNo,
      active: taxRuleForm.active,
    });

    setTaxRuleDialogOpen(false);
    setTaxRuleForm(DEFAULT_TAX_RULE_FORM);
    toast({ title: "Tax rule added" });
  };

  return (
    <div>
      <Header title={client.name} />
      <div className="p-6 space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/clients")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <p className="text-xs text-muted-foreground">
                Clients / {client.name}
              </p>
              <h1 className="text-2xl font-display font-bold">{client.name}</h1>
            </div>
            <Badge
              className={
                client.status === "active"
                  ? "bg-success text-success-foreground"
                  : "bg-muted text-muted-foreground"
              }
            >
              {client.status}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setShowMail(true)}
            >
              <Mail className="h-4 w-4" /> Quick Mail
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => window.open(`tel:${client.phone}`)}
            >
              <Phone className="h-4 w-4" /> Call
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card className="lg:col-span-4 rounded-2xl border border-gray-100 shadow-sm overflow-hidden bg-white">
            <div className="h-24 bg-gradient-to-br from-blue-600 to-blue-400" />
            <CardContent className="pt-0 -mt-10 text-center space-y-4">
              <div className="mx-auto h-20 w-20 rounded-full border-4 border-white bg-blue-100 text-blue-700 shadow-sm flex items-center justify-center text-2xl font-semibold">
                {initials}
              </div>
              <div>
                <h3 className="font-semibold text-lg">{client.name}</h3>
                <p className="text-xs text-muted-foreground">
                  Premium Client • Since 2024
                </p>
              </div>
              <div className="space-y-2.5 text-sm text-left">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="h-4 w-4 shrink-0" />
                  <span className="font-medium text-foreground">
                    {client.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span className="text-xs break-all">{client.email}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4 shrink-0" />
                  <span className="text-xs">{client.phone}</span>
                </div>
                <div className="flex items-start gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                  <span className="text-xs">{client.address}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4 shrink-0" />
                  <span className="text-xs">
                    {client.contractStart} - {client.contractEnd}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Button className="gap-2" onClick={() => setShowMail(true)}>
                  <Mail className="h-4 w-4" /> Email
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => window.open(`tel:${client.phone}`)}
                >
                  <Phone className="h-4 w-4" /> Call
                </Button>
              </div>
              <div className="pt-2 border-t space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">
                    Contract Progress
                  </span>
                  <span className="font-medium">{daysRemaining} days left</span>
                </div>
                <Progress value={contractProgress} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    Total Orders:{" "}
                    <strong className="text-foreground">
                      {client.totalOrders}
                    </strong>
                  </span>
                  <span>
                    Spend:{" "}
                    <strong className="text-foreground">
                      ${totalSpend.toLocaleString()}
                    </strong>
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-8">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="flex flex-wrap h-auto">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="roles">Roles</TabsTrigger>
                <TabsTrigger value="users">Users</TabsTrigger>
                <TabsTrigger value="orders">Order Details</TabsTrigger>
                <TabsTrigger value="service">Service History</TabsTrigger>
                <TabsTrigger value="catalog">Catalog Items</TabsTrigger>
                <TabsTrigger value="config">Configuration</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white">
                    <CardContent className="p-5">
                      <p className="text-sm text-muted-foreground">
                        Total Users
                      </p>
                      <p className="text-4xl font-semibold mt-1">
                        {clientUsers.length}
                      </p>
                      <p className="text-xs text-emerald-700 mt-1">
                        {activeClientUsers} active users
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white">
                    <CardContent className="p-5">
                      <p className="text-sm text-muted-foreground">
                        Total Spends
                      </p>
                      <p className="text-4xl font-semibold mt-1">
                        ${totalSpend.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Year to date
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white">
                    <CardContent className="p-5">
                      <p className="text-sm text-muted-foreground">
                        Open Orders
                      </p>
                      <p className="text-4xl font-semibold mt-1">
                        {openOrdersCount}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        $
                        {clientOrders
                          .reduce((sum, order) => {
                            const normalized = order.status.toLowerCase();
                            return !["delivered", "cancelled"].includes(
                              normalized,
                            )
                              ? sum + order.totalAmount
                              : sum;
                          }, 0)
                          .toLocaleString()}{" "}
                        value
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                  <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Company Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                        <span className="text-foreground font-medium">
                          {client.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{client.address}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span>{client.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{client.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {client.contractStart} - {client.contractEnd}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">
                        Spending Overview
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-semibold">
                        ${totalSpend.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Total Spend
                      </p>
                      <div className="mt-4 h-36 rounded-xl bg-gradient-to-b from-blue-50 to-white border border-gray-100 p-3 flex items-end gap-2">
                        {overviewSpendBars.map((entry) => {
                          const height = Math.max(
                            12,
                            Math.round(
                              (entry.amount / overviewSpendPeak) * 100,
                            ),
                          );
                          return (
                            <div
                              key={entry.month}
                              className="flex-1 flex flex-col items-center gap-1"
                            >
                              <div
                                className="w-full rounded-t-md bg-blue-500/80"
                                style={{ height: `${height}%` }}
                              />
                              <span className="text-[10px] text-muted-foreground">
                                {entry.month}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">
                        Top Spend Categories
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4">
                        <div
                          className="h-24 w-24 rounded-full relative"
                          style={{ background: donutGradient }}
                        >
                          <div className="absolute inset-5 rounded-full bg-white" />
                        </div>
                        <div className="space-y-2 text-xs w-full">
                          {spendCategories.map((entry) => {
                            const total =
                              spendCategories.reduce(
                                (sum, item) => sum + item.value,
                                0,
                              ) || 1;
                            const percent = Math.round(
                              (entry.value / total) * 100,
                            );
                            return (
                              <div
                                key={entry.name}
                                className="flex items-center justify-between"
                              >
                                <span className="flex items-center gap-2 text-muted-foreground">
                                  <span
                                    className="h-2.5 w-2.5 rounded-full"
                                    style={{ backgroundColor: entry.color }}
                                  />
                                  {entry.name}
                                </span>
                                <span className="font-medium text-foreground">
                                  {percent}%
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">User Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm">
                      <p>
                        <span className="text-muted-foreground">
                          Total Users:{" "}
                        </span>
                        <span className="font-semibold">
                          {clientUsers.length}
                        </span>
                      </p>
                      <p>
                        <span className="text-muted-foreground">Active: </span>
                        <span className="font-semibold text-emerald-700">
                          {activeClientUsers}
                        </span>
                      </p>
                      <p>
                        <span className="text-muted-foreground">
                          Inactive:{" "}
                        </span>
                        <span className="font-semibold text-rose-700">
                          {clientUsers.length - activeClientUsers}
                        </span>
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Recent Orders</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm">
                      <p>
                        <span className="text-muted-foreground">
                          Open Orders:{" "}
                        </span>
                        <span className="font-semibold">{openOrdersCount}</span>
                      </p>
                      <p>
                        <span className="text-muted-foreground">
                          Total Value:{" "}
                        </span>
                        <span className="font-semibold">
                          ${totalSpend.toLocaleString()}
                        </span>
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">
                        Active Services
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm">
                      <p>
                        <span className="text-muted-foreground">
                          Contract Products:{" "}
                        </span>
                        <span className="font-semibold">
                          {clientCatalog.length}
                        </span>
                      </p>
                      <p>
                        <span className="text-muted-foreground">
                          Until Renewal:{" "}
                        </span>
                        <span className="font-semibold text-amber-600">
                          {daysRemaining} days
                        </span>
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="roles" className="space-y-3 mt-4">
                <div className="flex justify-end">
                  <Button className="gap-2" onClick={() => openRoleDialog()}>
                    <Plus className="h-4 w-4" /> Add Role
                  </Button>
                </div>
                <Card>
                  <CardContent className="pt-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-center">
                            No. of Users
                          </TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {roles.map((role) => (
                          <TableRow key={role.id}>
                            <TableCell>{role.name}</TableCell>
                            <TableCell>{role.description}</TableCell>
                            <TableCell className="text-center font-semibold">
                              {
                                clientUsers.filter(
                                  (clientUser) =>
                                    clientUser.status !== "inactive" &&
                                    clientUser.status !== "suspended" &&
                                    clientUser.role
                                      .replace(/[_-]/g, " ")
                                      .toLowerCase()
                                      .trim() ===
                                      role.name.toLowerCase().trim(),
                                ).length
                              }
                            </TableCell>
                            <TableCell>{role.status}</TableCell>
                            <TableCell className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openRoleDialog(role.id)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  deleteRole(role.id);
                                  toast({ title: "Role deleted" });
                                }}
                              >
                                Delete
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="users" className="space-y-3 mt-4">
                <div className="flex justify-end">
                  <Button className="gap-2" onClick={() => openUserDialog()}>
                    <Plus className="h-4 w-4" /> Add User
                  </Button>
                </div>
                <Card>
                  <CardContent className="pt-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Organization</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Job Title</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {clientUsers.map((clientUser) => (
                          <TableRow
                            key={clientUser.id}
                            className="cursor-pointer"
                            onClick={() =>
                              navigate(
                                `/clients/${client.id}/users/${clientUser.id}`,
                              )
                            }
                          >
                            <TableCell className="font-medium text-primary">
                              {clientUser.name}
                            </TableCell>
                            <TableCell>{clientUser.email}</TableCell>
                            <TableCell>{client.name}</TableCell>
                            <TableCell>{clientUser.role}</TableCell>
                            <TableCell>{clientUser.jobTitle || "-"}</TableCell>
                            <TableCell>
                              {clientUser.department || "-"}
                            </TableCell>
                            <TableCell>{clientUser.status}</TableCell>
                            <TableCell
                              className="flex gap-1"
                              onClick={(event) => event.stopPropagation()}
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openUserDialog(clientUser.id)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  deleteUser(clientUser.id);
                                  toast({ title: "User deleted" });
                                }}
                              >
                                Delete
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="orders" className="space-y-3 mt-4">
                <div className="flex flex-wrap items-center gap-2 justify-between">
                  <p className="text-sm text-muted-foreground">
                    Manage client order history and apply bulk actions to
                    selected rows.
                  </p>
                  <div className="ml-auto flex gap-2">
                    <Button
                      className="gap-2"
                      onClick={() => setBulkUpdateOpen(true)}
                      disabled={selectedOrders.length === 0}
                    >
                      Bulk Update
                    </Button>
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => setCreateOrderOpen(true)}
                    >
                      <Plus className="h-4 w-4" /> New Order
                    </Button>
                  </div>
                </div>

                <Card>
                  <CardContent className="pt-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10">
                            <Checkbox
                              checked={allOrdersSelected}
                              onCheckedChange={toggleAllOrders}
                            />
                          </TableHead>
                          <TableHead>Order ID</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Organization</TableHead>
                          <TableHead>Requesting User</TableHead>
                          <TableHead>Items</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>SLA</TableHead>
                          <TableHead>Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {clientOrders.map((order) => (
                          <TableRow
                            key={order.id}
                            className="cursor-pointer"
                            onClick={() => navigate(`/orders/${order.id}`)}
                          >
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={selectedOrders.includes(order.id)}
                                onCheckedChange={() => toggleOrder(order.id)}
                              />
                            </TableCell>
                            <TableCell className="font-mono text-primary font-medium">
                              {order.orderNumber}
                            </TableCell>
                            <TableCell>{order.orderDate}</TableCell>
                            <TableCell>{order.organization}</TableCell>
                            <TableCell>{order.requestingUser}</TableCell>
                            <TableCell>{order.items.length} items</TableCell>
                            <TableCell>{order.status}</TableCell>
                            <TableCell>
                              {order.slaStatus.replace("_", " ")}
                            </TableCell>
                            <TableCell>
                              ₹{order.totalAmount.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="service" className="space-y-3 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Service History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Service ID / Ticket Number</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Organization</TableHead>
                          <TableHead>Requesting User</TableHead>
                          <TableHead>Service Type</TableHead>
                          <TableHead>Assigned User</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>SLA</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {serviceHistory.map((row, index) => {
                          const order = clientOrders[index];
                          return (
                            <TableRow key={row.ticketNumber}>
                              <TableCell>
                                {row.serviceId} / {row.ticketNumber}
                              </TableCell>
                              <TableCell>{order?.orderDate || "-"}</TableCell>
                              <TableCell>
                                {order?.organization || client.name}
                              </TableCell>
                              <TableCell>
                                {order?.requestingUser || client.contactPerson}
                              </TableCell>
                              <TableCell>{row.serviceType}</TableCell>
                              <TableCell>{row.assignedUser}</TableCell>
                              <TableCell>{row.status}</TableCell>
                              <TableCell>
                                {order?.slaStatus?.replace("_", " ") || "-"}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="catalog" className="space-y-3 mt-4">
                <p className="text-sm text-muted-foreground">
                  Manage client catalog items with the same workflow as Master
                  Catalogue including filters, bulk import/export, and audit
                  traceability.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <Card>
                    <CardContent className="pt-3 pb-3">
                      <p className="text-xs text-muted-foreground">
                        Total Items
                      </p>
                      <p className="text-xl font-semibold">
                        {catalogStats.total}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-3 pb-3">
                      <p className="text-xs text-muted-foreground">In Stock</p>
                      <p className="text-xl font-semibold text-success">
                        {catalogStats.inStock}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-3 pb-3">
                      <p className="text-xs text-muted-foreground">Low Stock</p>
                      <p className="text-xl font-semibold text-warning">
                        {catalogStats.lowStock}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-3 pb-3">
                      <p className="text-xs text-muted-foreground">
                        Out of Stock
                      </p>
                      <p className="text-xl font-semibold text-destructive">
                        {catalogStats.outOfStock}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <Select
                    value={catalogCategoryFilter}
                    onValueChange={setCatalogCategoryFilter}
                  >
                    <SelectTrigger className="w-40 h-8 text-xs">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {catalogCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={catalogBrandFilter}
                    onValueChange={setCatalogBrandFilter}
                  >
                    <SelectTrigger className="w-32 h-8 text-xs">
                      <SelectValue placeholder="All Brands" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Brands</SelectItem>
                      {catalogBrands.map((brand) => (
                        <SelectItem key={brand} value={brand}>
                          {brand}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={catalogStatusFilter}
                    onValueChange={setCatalogStatusFilter}
                  >
                    <SelectTrigger className="w-32 h-8 text-xs">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="In Stock">In Stock</SelectItem>
                      <SelectItem value="Low Stock">Low Stock</SelectItem>
                      <SelectItem value="Out of Stock">Out of Stock</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="relative">
                    <Search
                      className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                      size={12}
                    />
                    <Input
                      className="pl-7 h-8 w-44 text-xs"
                      placeholder="Search item"
                      value={catalogSearch}
                      onChange={(e) => setCatalogSearch(e.target.value)}
                    />
                  </div>
                  <div className="ml-auto flex gap-2">
                    <input
                      ref={catalogBulkFileRef}
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={handleCatalogBulkImport}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => catalogBulkFileRef.current?.click()}
                    >
                      <Upload size={12} /> Bulk Import
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={downloadCatalogExport}
                    >
                      <Download size={12} /> Export
                    </Button>
                    <Button
                      size="sm"
                      className="gap-1.5"
                      onClick={() => openCatalogDialog()}
                      disabled={!isOwner}
                    >
                      <Plus size={12} /> Add New Item
                    </Button>
                  </div>
                </div>

                <Card>
                  <CardContent className="pt-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-8">
                            <Checkbox
                              checked={allCatalogRowsSelected}
                              onCheckedChange={toggleAllCatalogRows}
                            />
                          </TableHead>
                          <TableHead>Item Name</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Brand</TableHead>
                          <TableHead>Master Price</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Owner Fix</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCatalogItems.map((item) => {
                          const basePrice = applyPricingRules({
                            price: item.price,
                            quantity: item.stock,
                            category: item.category,
                            productCode: item.productCode,
                          });
                          const discountedPrice = applyDiscountRules({
                            amount: basePrice,
                            quantity: item.stock,
                            category: item.category,
                            productCode: item.productCode,
                          });
                          const finalPrice = applyTax(discountedPrice);
                          const masterPrice =
                            item.masterBasePrice ??
                            masterCatalogItems.find(
                              (entry) => entry.id === item.masterProductId,
                            )?.price ??
                            item.price;

                          return (
                            <TableRow key={item.id}>
                              <TableCell>
                                <Checkbox
                                  checked={selectedCatalogIds.includes(item.id)}
                                  onCheckedChange={() =>
                                    toggleCatalogRow(item.id)
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                                    {item.image ? (
                                      <img
                                        src={item.image}
                                        alt={item.name}
                                        className="w-8 h-8 object-cover rounded"
                                      />
                                    ) : (
                                      <ImageIcon
                                        size={14}
                                        className="text-muted-foreground"
                                      />
                                    )}
                                  </div>
                                  <span className="font-medium">
                                    {item.name}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {item.productCode}
                              </TableCell>
                              <TableCell className="text-sm">
                                {item.category}
                              </TableCell>
                              <TableCell className="text-sm text-primary">
                                {item.brand}
                              </TableCell>
                              <TableCell>
                                ₹{masterPrice.toLocaleString()}
                              </TableCell>
                              <TableCell>
                                ₹{finalPrice.toLocaleString()}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {item.priceFixedByOwner ? "Fixed" : "Auto"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className={`${getCatalogStatusColor(item.status)} border-none`}
                                >
                                  {item.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="flex gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openCatalogDialog(item.id)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    deleteClientCatalogItem(client.id, item.id);
                                    appendCatalogAudit(
                                      "Item Deleted",
                                      item.name,
                                    );
                                    toast({ title: "Catalog item deleted" });
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                    <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                      <span>
                        Showing 1 - {filteredCatalogItems.length} of{" "}
                        {clientCatalog.length} entries
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Import / Export Products
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Tabs defaultValue="upload">
                        <TabsList className="bg-muted">
                          <TabsTrigger value="upload">
                            Bulk Upload Items
                          </TabsTrigger>
                          <TabsTrigger value="template">Template</TabsTrigger>
                          <TabsTrigger value="export">
                            Export Catalog
                          </TabsTrigger>
                        </TabsList>
                        <TabsContent value="upload" className="mt-3">
                          <div className="text-center p-6 border-2 border-dashed border-border rounded-lg">
                            <Upload
                              size={24}
                              className="mx-auto text-primary mb-2"
                            />
                            <p className="text-sm font-medium">Upload</p>
                            <p className="text-xs text-muted-foreground">
                              Bulk upload client catalog items using CSV
                              template.
                            </p>
                            <Button
                              className="mt-2"
                              size="sm"
                              onClick={() =>
                                catalogBulkFileRef.current?.click()
                              }
                            >
                              Upload
                            </Button>
                          </div>
                        </TabsContent>
                        <TabsContent value="template" className="mt-3">
                          <div className="text-center p-6 border-2 border-dashed border-border rounded-lg">
                            <FileText
                              size={24}
                              className="mx-auto text-primary mb-2"
                            />
                            <p className="text-sm font-medium">
                              Download Template
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Includes ProductCode, ItemName, Category, Brand,
                              Price and Status.
                            </p>
                            <Button
                              className="mt-2"
                              size="sm"
                              onClick={downloadCatalogTemplate}
                            >
                              Download
                            </Button>
                          </div>
                        </TabsContent>
                        <TabsContent value="export" className="mt-3">
                          <div className="text-center p-6 border-2 border-dashed border-border rounded-lg">
                            <Download
                              size={24}
                              className="mx-auto text-success mb-2"
                            />
                            <p className="text-sm font-medium">
                              Export Catalog
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Export the complete client catalog as CSV.
                            </p>
                            <Button
                              variant="outline"
                              className="mt-2"
                              size="sm"
                              onClick={downloadCatalogExport}
                            >
                              Export
                            </Button>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Approval & Audit Logs
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Event</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(catalogAuditLogs.length > 0
                            ? catalogAuditLogs
                            : [
                                {
                                  id: "default-catalog-log",
                                  event: "Workflow Ready",
                                  detail: "Client catalog flow initialized",
                                  user: "System",
                                  date: new Date().toLocaleString(),
                                  status: "Approved",
                                },
                              ]
                          ).map((log) => (
                            <TableRow key={log.id}>
                              <TableCell>
                                <p className="text-sm font-medium">
                                  {log.event}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {log.detail}
                                </p>
                              </TableCell>
                              <TableCell className="text-sm">
                                {log.user}
                              </TableCell>
                              <TableCell className="text-xs">
                                {log.date}
                              </TableCell>
                              <TableCell>
                                <Badge className="bg-success text-success-foreground border-none">
                                  {log.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="config" className="space-y-4 mt-4">
                {ruleConflicts.length > 0 && (
                  <Alert className="border-amber-300 bg-amber-50 text-amber-900">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Rule Conflict Warning</AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc pl-4 text-xs space-y-1 mt-1">
                        {ruleConflicts.slice(0, 4).map((conflict) => (
                          <li key={conflict.id}>{conflict.message}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle>Pricing & Discount</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2 justify-between">
                      <p className="text-sm text-muted-foreground max-w-xl">
                        Manage pricing, discount rules, coupons, and promotion
                        code logic for this client profile.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          onClick={handleAutoConfigureCommercialRules}
                        >
                          Auto Configure Rules
                        </Button>
                        <Button onClick={() => setCouponDialogOpen(true)}>
                          + Create Coupon
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <Card className="lg:col-span-2">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">
                            Pricing Rules
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                            {pricingRules.map((rule) => (
                              <div
                                key={rule.id}
                                className="rounded border px-3 py-2 flex items-center justify-between"
                              >
                                <div>
                                  <p className="text-sm font-medium">
                                    {rule.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {rule.ruleType} · Min Qty{" "}
                                    {rule.minimumQuantity} · {rule.value}
                                    {rule.valueType === "percentage"
                                      ? "%"
                                      : " INR"}
                                  </p>
                                </div>
                                <Badge
                                  className={
                                    rule.status === "active"
                                      ? "bg-success text-success-foreground"
                                      : "bg-muted text-muted-foreground"
                                  }
                                >
                                  {rule.status}
                                </Badge>
                              </div>
                            ))}
                          </div>
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => setPricingRuleDialogOpen(true)}
                          >
                            + Add Pricing Rule
                          </Button>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">
                            Discount Computation
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <p className="text-xs text-muted-foreground">
                            Computation Order
                          </p>
                          <div className="flex items-center gap-2">
                            <Checkbox checked={true} />
                            <span>Apply Discount Before Tax</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox checked={false} />
                            <span>Apply Discount After Tax</span>
                          </div>
                          <div className="pt-2 border-t text-xs text-muted-foreground">
                            Current GST Rate: {activeTaxSetting?.taxRate ?? 0}%
                          </div>
                          <div className="space-y-1 max-h-24 overflow-y-auto border rounded p-2">
                            {(couponCodeRules.length > 0
                              ? couponCodeRules
                              : [
                                  {
                                    id: "seed-rule",
                                    name: "Holiday Sale 20% OFF - New Codes Only",
                                    triggerType: "specific",
                                    triggerValue: "HOLIDAY20",
                                    conditionField: "cart_total",
                                    comparator: ">=",
                                    threshold: 10000,
                                    discountType: "percentage",
                                    discountValue: 20,
                                    calculationOrder: "before_tax",
                                    maxUsageGlobal: 500,
                                    maxUsagePerCustomer: 1,
                                    stackable: false,
                                    active: true,
                                  },
                                ]
                            ).map((rule) => (
                              <div
                                key={rule.id}
                                className="text-xs rounded bg-muted px-2 py-1"
                              >
                                {rule.name}
                              </div>
                            ))}
                          </div>
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => setCouponCodeRuleDialogOpen(true)}
                          >
                            + Add Coupon Code Rule
                          </Button>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <Card className="lg:col-span-2">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">
                            Discount Rules
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                            {discountRules.map((rule) => (
                              <div
                                key={rule.id}
                                className="rounded border px-3 py-2 flex items-center justify-between"
                              >
                                <div>
                                  <p className="text-sm font-medium">
                                    {rule.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {rule.ruleType} · Min Order ₹
                                    {rule.minimumOrderAmount.toLocaleString()} ·{" "}
                                    {rule.discountPercent}%
                                  </p>
                                </div>
                                <Badge
                                  className={
                                    rule.status === "active"
                                      ? "bg-success text-success-foreground"
                                      : "bg-muted text-muted-foreground"
                                  }
                                >
                                  {rule.status}
                                </Badge>
                              </div>
                            ))}
                          </div>
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => setDiscountRuleDialogOpen(true)}
                          >
                            + Add Discount Rule
                          </Button>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">
                            Coupon Codes
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                            {(couponCodes.length > 0
                              ? couponCodes
                              : [
                                  {
                                    id: "seed-coupon",
                                    title: "Flash Sale",
                                    code: "NIDO1000",
                                    discountType: "percentage",
                                    discountValue: 15,
                                    minPurchase: 25000,
                                    usageLimit: 500,
                                    usagePerCustomer: 1,
                                    validFrom: "2026-11-01",
                                    validTo: "2026-12-31",
                                    active: true,
                                    notes: "",
                                  },
                                ]
                            ).map((coupon) => (
                              <div
                                key={coupon.id}
                                className="rounded border px-3 py-2"
                              >
                                <p className="text-sm font-medium">
                                  {coupon.title}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {coupon.code} ·{" "}
                                  {coupon.discountType === "percentage"
                                    ? `${coupon.discountValue}%`
                                    : `₹${coupon.discountValue}`}
                                </p>
                              </div>
                            ))}
                          </div>
                          <Button
                            className="w-full"
                            onClick={() => setCouponDialogOpen(true)}
                          >
                            + Create Coupon
                          </Button>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" onClick={downloadRuleTemplate}>
                        Download Rules Template
                      </Button>
                      <input
                        ref={ruleTemplateInputRef}
                        type="file"
                        accept=".csv"
                        className="hidden"
                        onChange={handleRuleTemplateUpload}
                      />
                      <Button
                        variant="outline"
                        onClick={() => ruleTemplateInputRef.current?.click()}
                      >
                        Upload Rules Template
                      </Button>
                    </div>

                    <div className="rounded-md border p-3 space-y-3 mt-3">
                      <p className="text-sm font-medium">
                        Pricing Engine Validation
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                        <Input
                          placeholder="Amount"
                          value={pricingPreview.amount}
                          onChange={(e) =>
                            setPricingPreview((prev) => ({
                              ...prev,
                              amount: e.target.value,
                            }))
                          }
                        />
                        <Input
                          placeholder="Quantity"
                          value={pricingPreview.quantity}
                          onChange={(e) =>
                            setPricingPreview((prev) => ({
                              ...prev,
                              quantity: e.target.value,
                            }))
                          }
                        />
                        <Input
                          placeholder="Category"
                          value={pricingPreview.category}
                          onChange={(e) =>
                            setPricingPreview((prev) => ({
                              ...prev,
                              category: e.target.value,
                            }))
                          }
                        />
                        <Input
                          placeholder="Product Code"
                          value={pricingPreview.productCode}
                          onChange={(e) =>
                            setPricingPreview((prev) => ({
                              ...prev,
                              productCode: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                        <div className="rounded bg-muted px-2 py-1">
                          Base: ₹{pricingSimulation.baseAmount.toFixed(2)}
                        </div>
                        <div className="rounded bg-muted px-2 py-1">
                          After Pricing: ₹
                          {pricingSimulation.adjustedAmount.toFixed(2)}
                        </div>
                        <div className="rounded bg-muted px-2 py-1">
                          After Discount: ₹
                          {pricingSimulation.discountedAmount.toFixed(2)}
                        </div>
                        <div className="rounded bg-muted px-2 py-1">
                          With Tax: ₹{pricingSimulation.taxedAmount.toFixed(2)}
                        </div>
                        <div className="rounded bg-primary/10 px-2 py-1 font-semibold">
                          Total: ₹{pricingSimulation.total.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Tax Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm text-muted-foreground">
                        Define tax categories, rates, fiscal periods, and
                        advanced application rules for the client.
                      </p>
                      <Button onClick={() => setTaxRuleDialogOpen(true)}>
                        + Add Tax Rule
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Card>
                        <CardContent className="pt-4">
                          <p className="text-xs text-muted-foreground">
                            Tax Compliance
                          </p>
                          <p className="text-2xl font-semibold">
                            {configTaxForm.taxType}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {configTaxForm.taxRegistrationNo ||
                              "Registration pending"}
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-4">
                          <p className="text-xs text-muted-foreground">
                            Tax Categories
                          </p>
                          <p className="text-2xl font-semibold">
                            {new Set(taxSettings.map((t) => t.taxType)).size ||
                              1}
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-4">
                          <p className="text-xs text-muted-foreground">
                            Active Tax Rules
                          </p>
                          <p className="text-2xl font-semibold">
                            {taxSettings.filter((t) => t.active).length}
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Rule Name</TableHead>
                            <TableHead>Tax Rate</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Active</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {taxSettings.map((setting) => (
                            <TableRow key={setting.id}>
                              <TableCell>{setting.id}</TableCell>
                              <TableCell>{setting.taxType} Tax</TableCell>
                              <TableCell>
                                {setting.taxRate.toFixed(2)}%
                              </TableCell>
                              <TableCell>{setting.taxType}</TableCell>
                              <TableCell>
                                <Badge className="bg-success text-success-foreground">
                                  Active
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Switch
                                  checked={setting.active}
                                  onCheckedChange={(checked) =>
                                    upsertPrimaryTaxSetting({
                                      taxType: setting.taxType,
                                      taxRate: setting.taxRate,
                                      taxRegistrationNo:
                                        setting.taxRegistrationNo,
                                      active: checked,
                                    })
                                  }
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label>Tax Type</Label>
                        <Input
                          placeholder="GST / VAT"
                          value={configTaxForm.taxType}
                          onChange={(e) =>
                            setConfigTaxForm((prev) => ({
                              ...prev,
                              taxType: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Tax Rate (%)</Label>
                        <Input
                          placeholder="18"
                          value={configTaxForm.taxRate}
                          onChange={(e) =>
                            setConfigTaxForm((prev) => ({
                              ...prev,
                              taxRate: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Tax Registration No</Label>
                        <Input
                          placeholder="Enter registration no"
                          value={configTaxForm.taxRegistrationNo}
                          onChange={(e) =>
                            setConfigTaxForm((prev) => ({
                              ...prev,
                              taxRegistrationNo: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        onClick={() => {
                          upsertPrimaryTaxSetting({
                            taxType: configTaxForm.taxType || "GST",
                            taxRate: Number(configTaxForm.taxRate) || 0,
                            taxRegistrationNo:
                              configTaxForm.taxRegistrationNo ||
                              client.gst ||
                              "",
                            active: true,
                          });
                          toast({ title: "Tax settings saved" });
                        }}
                      >
                        Save Tax Settings
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <Dialog open={bulkUpdateOpen} onOpenChange={setBulkUpdateOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bulk Update Orders</DialogTitle>
          </DialogHeader>

          <Tabs value={bulkTemplateTab} onValueChange={setBulkTemplateTab}>
            <TabsList className="w-full justify-start">
              <TabsTrigger value="download">Download Template</TabsTrigger>
              <TabsTrigger value="upload">Upload Template</TabsTrigger>
            </TabsList>

            <TabsContent value="download" className="mt-4 space-y-4">
              <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 via-card to-secondary/40 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      Bulk Operations Workspace
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {selectedOrders.length} order(s) selected for update
                    </p>
                  </div>
                  <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
                    <Sparkles className="mr-1 h-3.5 w-3.5" /> Flexible Mode
                  </Badge>
                </div>
              </div>
              <Textarea
                placeholder="Add a common comment for the selected orders"
                value={bulkComments}
                onChange={(e) => setBulkComments(e.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => applyBulkUpdate("Completed")}>
                  Mark as Completed
                </Button>
                <Button
                  variant="outline"
                  onClick={() => applyBulkUpdate("Cancelled")}
                >
                  Mark as Cancelled
                </Button>
                <Button variant="secondary" onClick={() => applyBulkUpdate()}>
                  Update Comments
                </Button>
              </div>
              <Button
                variant="outline"
                className="gap-2"
                onClick={downloadOrderTemplate}
              >
                <Download className="h-4 w-4" /> Download Template
              </Button>
            </TabsContent>

            <TabsContent value="upload" className="mt-4">
              <div className="rounded-lg border border-dashed p-6 text-center space-y-3">
                <Upload className="h-8 w-8 mx-auto text-primary" />
                <p className="text-sm font-medium">Upload CSV Template</p>
                <p className="text-xs text-muted-foreground">
                  Expected columns: OrderID, Status, Comments. Quoted CSV values
                  are supported.
                </p>
                <input
                  ref={bulkTemplateInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={onOrderTemplateUpload}
                />
                <Button
                  variant="outline"
                  onClick={() => bulkTemplateInputRef.current?.click()}
                >
                  Select CSV File
                </Button>
              </div>

              {bulkTemplateReport ? (
                <div className="mt-3 rounded-lg border bg-card p-3">
                  <p className="text-sm font-medium">Upload Summary</p>
                  <div className="mt-2 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                    <p>
                      Updated:{" "}
                      <span className="font-semibold text-foreground">
                        {bulkTemplateReport.updated}
                      </span>
                    </p>
                    <p>
                      Skipped:{" "}
                      <span className="font-semibold text-foreground">
                        {bulkTemplateReport.skipped}
                      </span>
                    </p>
                    <p>
                      Invalid Status Fallbacks:{" "}
                      <span className="font-semibold text-foreground">
                        {bulkTemplateReport.invalidStatus}
                      </span>
                    </p>
                  </div>
                  {bulkTemplateReport.unmatched.length > 0 ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Unmatched Order IDs:{" "}
                      {bulkTemplateReport.unmatched.join(", ")}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkUpdateOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={createOrderOpen} onOpenChange={setCreateOrderOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Order</DialogTitle>
          </DialogHeader>

          <Tabs
            value={newOrderTemplateTab}
            onValueChange={setNewOrderTemplateTab}
          >
            <TabsList className="w-full justify-start">
              <TabsTrigger value="download">Download Template</TabsTrigger>
              <TabsTrigger value="upload">Upload Template</TabsTrigger>
            </TabsList>

            <TabsContent value="download" className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Order Number</Label>
                  <Input
                    value={newOrderForm.orderNumber}
                    onChange={(e) =>
                      setNewOrderForm((prev) => ({
                        ...prev,
                        orderNumber: e.target.value,
                      }))
                    }
                    placeholder="e.g. 2499001"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={newOrderForm.status}
                    onValueChange={(value) =>
                      setNewOrderForm((prev) => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Processing">Processing</SelectItem>
                      <SelectItem value="Approved">Approved</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Assigned User</Label>
                  <Input
                    value={newOrderForm.assignedUser}
                    onChange={(e) =>
                      setNewOrderForm((prev) => ({
                        ...prev,
                        assignedUser: e.target.value,
                      }))
                    }
                    placeholder="Assigned user"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Comments</Label>
                  <Textarea
                    value={newOrderForm.comments}
                    onChange={(e) =>
                      setNewOrderForm((prev) => ({
                        ...prev,
                        comments: e.target.value,
                      }))
                    }
                    placeholder="Optional note for the order"
                  />
                </div>
              </div>
              <Button
                variant="outline"
                className="gap-2"
                onClick={downloadOrderTemplate}
              >
                <Download className="h-4 w-4" /> Download Template
              </Button>
              <Button onClick={handleCreateOrder}>Create Order</Button>
            </TabsContent>

            <TabsContent value="upload" className="mt-4">
              <div className="rounded-lg border border-dashed p-6 text-center space-y-3">
                <Upload className="h-8 w-8 mx-auto text-primary" />
                <p className="text-sm font-medium">Upload Order Template</p>
                <p className="text-xs text-muted-foreground">
                  CSV upload can be used to preview or update order details.
                </p>
                <input
                  ref={newOrderTemplateInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={onOrderTemplateUpload}
                />
                <Button
                  variant="outline"
                  onClick={() => newOrderTemplateInputRef.current?.click()}
                >
                  Select CSV File
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOrderOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={catalogDialogOpen} onOpenChange={setCatalogDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCatalogItemId ? "Edit Catalog Item" : "Add New Item"}
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[70vh] pr-3">
            <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Search master catalog..."
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                  />
                </div>
                <ScrollArea className="h-[280px] rounded-lg border">
                  <div className="space-y-2 p-3">
                    {masterCatalogItems
                      .filter((item) => {
                        const query = catalogSearch.toLowerCase();
                        return (
                          !query ||
                          item.name.toLowerCase().includes(query) ||
                          item.productCode.toLowerCase().includes(query) ||
                          item.category.toLowerCase().includes(query)
                        );
                      })
                      .map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setSelectedMasterProductId(item.id);
                            setCatalogImages(item.image ? [item.image] : []);
                            setCatalogForm((prev) => ({
                              ...prev,
                              productCode: item.productCode,
                              name: item.name,
                              category: item.category,
                              subCategory: item.subCategory,
                              brand: item.brand,
                              productType: item.productType,
                              physicalType: item.physicalType,
                              price: item.price,
                              discountPrice: item.discountPrice
                                ? String(item.discountPrice)
                                : "",
                              status: item.status,
                              initialStock: item.initialStock,
                              minStockThreshold: item.minStockThreshold,
                              stock: prev.stock || item.initialStock,
                              minStock: prev.minStock || item.minStockThreshold,
                              description: item.description || "",
                              tags: item.tags || prev.tags,
                              specification: item.specification || "",
                              warranty: item.warranty || "",
                              hsnCode: item.hsnCode || "",
                              customsDeclaration:
                                item.customsDeclaration ||
                                prev.customsDeclaration,
                              primaryVendor:
                                item.primaryVendor || prev.primaryVendor,
                              vendorSku: item.vendorSku || prev.vendorSku,
                              leadTime: item.leadTime || prev.leadTime,
                              vendorContact: item.vendorContact || "",
                              vendorEmail: item.vendorEmail || "",
                              vendorPhone: item.vendorPhone || "",
                              vendorPhone2: item.vendorPhone2 || "",
                              trackPerformance: item.trackPerformance || false,
                              performanceRating: item.performanceRating || 4,
                            }));
                          }}
                          className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/60 ${selectedMasterProductId === item.id ? "border-primary bg-primary/5" : ""}`}
                        >
                          <div className="h-12 w-12 overflow-hidden rounded-md border bg-muted flex items-center justify-center">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <ImageIcon className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">{item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.productCode} · {item.category}
                            </p>
                          </div>
                          <span className="rounded-md border px-3 py-1 text-xs font-medium text-foreground">
                            Select
                          </span>
                        </button>
                      ))}
                  </div>
                </ScrollArea>
              </div>

              <div className="space-y-5 rounded-lg border p-4">
                <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        Selected Master Product
                      </p>
                      <h3 className="text-sm font-semibold text-foreground">
                        {selectedMasterProduct?.name || "Choose a catalog item"}
                      </h3>
                    </div>
                    <Badge variant="secondary" className="rounded-full">
                      {selectedMasterProduct
                        ? selectedMasterProduct.productCode
                        : "Required"}
                    </Badge>
                  </div>
                  {selectedMasterProduct ? (
                    <div className="grid gap-3 rounded-lg border bg-white p-3 text-xs text-muted-foreground sm:grid-cols-2">
                      <div>
                        <span className="block text-[10px] uppercase tracking-[0.16em] text-slate-400">
                          Category
                        </span>
                        <span className="font-medium text-slate-700">
                          {selectedMasterProduct.category}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase tracking-[0.16em] text-slate-400">
                          Brand
                        </span>
                        <span className="font-medium text-slate-700">
                          {selectedMasterProduct.brand || "-"}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase tracking-[0.16em] text-slate-400">
                          Product Type
                        </span>
                        <span className="font-medium text-slate-700">
                          {selectedMasterProduct.productType}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase tracking-[0.16em] text-slate-400">
                          Base Price
                        </span>
                        <span className="font-medium text-slate-700">
                          ₹{selectedMasterProduct.price.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase tracking-[0.16em] text-slate-400">
                          Owner Price Delta
                        </span>
                        <span className="font-medium text-slate-700">
                          {catalogForm.price >= selectedMasterProduct.price
                            ? "+"
                            : "-"}
                          ₹
                          {Math.abs(
                            catalogForm.price - selectedMasterProduct.price,
                          ).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div>
                  <h3 className="font-semibold text-sm border-b pb-1 mb-3">
                    Client Overrides
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Selling Price</Label>
                      <Input
                        type="number"
                        value={catalogForm.price}
                        onChange={(e) =>
                          setCatalogForm((prev) => ({
                            ...prev,
                            price: Number(e.target.value) || 0,
                          }))
                        }
                        disabled={!isOwner}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Discount Price</Label>
                      <Input
                        type="number"
                        value={catalogForm.discountPrice}
                        onChange={(e) =>
                          setCatalogForm((prev) => ({
                            ...prev,
                            discountPrice: e.target.value,
                          }))
                        }
                        disabled={!isOwner}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setCatalogDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={saveCatalogItem} disabled={!isOwner}>
              Save Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={pricingRuleDialogOpen}
        onOpenChange={setPricingRuleDialogOpen}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Pricing Rule</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Rule Name</Label>
              <Input
                placeholder="e.g., Holiday Sale 20%"
                value={pricingRuleForm.name}
                onChange={(e) =>
                  setPricingRuleForm((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <div className="flex items-center gap-2 pt-2">
                <Switch
                  checked={pricingRuleForm.status}
                  onCheckedChange={(value) =>
                    setPricingRuleForm((prev) => ({ ...prev, status: value }))
                  }
                />
                <span className="text-sm">
                  {pricingRuleForm.status ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Select Rule Type</Label>
              <Select
                value={pricingRuleForm.ruleType}
                onValueChange={(value: "Volume-Based" | "Tiered Pricing") =>
                  setPricingRuleForm((prev) => ({ ...prev, ruleType: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Volume-Based">Volume-Based</SelectItem>
                  <SelectItem value="Tiered Pricing">Tiered Pricing</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Minimum Quantity</Label>
              <Input
                type="number"
                value={pricingRuleForm.minimumQuantity}
                onChange={(e) =>
                  setPricingRuleForm((prev) => ({
                    ...prev,
                    minimumQuantity: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Apply To Category</Label>
              <Input
                value={pricingRuleForm.category}
                onChange={(e) =>
                  setPricingRuleForm((prev) => ({
                    ...prev,
                    category: e.target.value,
                  }))
                }
                placeholder="IT Hardware"
              />
            </div>
            <div className="space-y-2">
              <Label>Discount/Markup Type</Label>
              <Select
                value={pricingRuleForm.adjustmentType}
                onValueChange={(value: "discount" | "markup") =>
                  setPricingRuleForm((prev) => ({
                    ...prev,
                    adjustmentType: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="discount">Discount</SelectItem>
                  <SelectItem value="markup">Markup</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Value Type</Label>
              <Select
                value={pricingRuleForm.valueType}
                onValueChange={(value: "percentage" | "fixed") =>
                  setPricingRuleForm((prev) => ({ ...prev, valueType: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="fixed">Fixed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Discount/Markup Value</Label>
              <Input
                type="number"
                value={pricingRuleForm.value}
                onChange={(e) =>
                  setPricingRuleForm((prev) => ({
                    ...prev,
                    value: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={pricingRuleForm.startDate}
                onChange={(e) =>
                  setPricingRuleForm((prev) => ({
                    ...prev,
                    startDate: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={pricingRuleForm.endDate}
                onChange={(e) =>
                  setPricingRuleForm((prev) => ({
                    ...prev,
                    endDate: e.target.value,
                  }))
                }
              />
            </div>
            <div className="md:col-span-2 flex items-center gap-2">
              <Switch
                checked={pricingRuleForm.applyBeforeTax}
                onCheckedChange={(value) =>
                  setPricingRuleForm((prev) => ({
                    ...prev,
                    applyBeforeTax: value,
                  }))
                }
              />
              <span className="text-sm">Apply Before Tax</span>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPricingRuleDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreatePricingRule}>Save Rule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={discountRuleDialogOpen}
        onOpenChange={setDiscountRuleDialogOpen}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Discount Rule</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Rule Name</Label>
                <Input
                  placeholder="e.g., Catalogue Clearance 25%"
                  value={discountRuleForm.name}
                  onChange={(e) =>
                    setDiscountRuleForm((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex items-center gap-2 pt-2">
                  <Switch
                    checked={discountRuleForm.status}
                    onCheckedChange={(value) =>
                      setDiscountRuleForm((prev) => ({
                        ...prev,
                        status: value,
                      }))
                    }
                  />
                  <span className="text-sm">
                    {discountRuleForm.status ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label>Rule Description (Optional)</Label>
                <Textarea
                  value={discountRuleForm.description}
                  onChange={(e) =>
                    setDiscountRuleForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Discount Rule Type</Label>
                <Select
                  value={discountRuleForm.ruleType}
                  onValueChange={(value: "Catalogue-Based" | "Volume-Based") =>
                    setDiscountRuleForm((prev) => ({
                      ...prev,
                      ruleType: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Catalogue-Based">
                      Catalogue-Based
                    </SelectItem>
                    <SelectItem value="Volume-Based">Volume-Based</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Minimum Order Amount</Label>
                <Input
                  type="number"
                  value={discountRuleForm.minimumOrderAmount}
                  onChange={(e) =>
                    setDiscountRuleForm((prev) => ({
                      ...prev,
                      minimumOrderAmount: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Apply To</Label>
                <Select
                  value={discountRuleForm.applyTo}
                  onValueChange={(
                    value: "categories" | "brands" | "specific-products",
                  ) =>
                    setDiscountRuleForm((prev) => ({ ...prev, applyTo: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="categories">Categories</SelectItem>
                    <SelectItem value="brands">Brands</SelectItem>
                    <SelectItem value="specific-products">
                      Specific Products
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Selection</Label>
                <Input
                  value={discountRuleForm.selection}
                  onChange={(e) =>
                    setDiscountRuleForm((prev) => ({
                      ...prev,
                      selection: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Discount Type (%)</Label>
                <Input
                  type="number"
                  value={discountRuleForm.discountPercent}
                  onChange={(e) =>
                    setDiscountRuleForm((prev) => ({
                      ...prev,
                      discountPercent: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Max Usage Per Customer</Label>
                <Input
                  type="number"
                  value={discountRuleForm.maxUsagePerUser}
                  onChange={(e) =>
                    setDiscountRuleForm((prev) => ({
                      ...prev,
                      maxUsagePerUser: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={discountRuleForm.startDate}
                  onChange={(e) =>
                    setDiscountRuleForm((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={discountRuleForm.endDate}
                  onChange={(e) =>
                    setDiscountRuleForm((prev) => ({
                      ...prev,
                      endDate: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={discountRuleForm.applyBeforeTax}
                  onCheckedChange={(value) =>
                    setDiscountRuleForm((prev) => ({
                      ...prev,
                      applyBeforeTax: value,
                    }))
                  }
                />
                <span className="text-sm">Apply Before Tax</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={discountRuleForm.stackable}
                  onCheckedChange={(value) =>
                    setDiscountRuleForm((prev) => ({
                      ...prev,
                      stackable: value,
                    }))
                  }
                />
                <span className="text-sm">
                  Compatible Discounts (Stackable)
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDiscountRuleDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateDiscountRule}>Save Rule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={couponDialogOpen} onOpenChange={setCouponDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Coupon</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Basic Information</h4>
              <div className="space-y-2">
                <Label>Coupon Name/Title</Label>
                <Input
                  value={couponForm.title}
                  onChange={(e) =>
                    setCouponForm((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Code Generation</Label>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={!couponForm.autoGenerate}
                    onCheckedChange={() =>
                      setCouponForm((prev) => ({
                        ...prev,
                        autoGenerate: false,
                      }))
                    }
                  />
                  <span className="text-sm">Manual Entry</span>
                </div>
                <Input
                  placeholder="e.g., HOLIDAY20"
                  value={couponForm.code}
                  disabled={couponForm.autoGenerate}
                  onChange={(e) =>
                    setCouponForm((prev) => ({ ...prev, code: e.target.value }))
                  }
                />
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={couponForm.autoGenerate}
                    onCheckedChange={() =>
                      setCouponForm((prev) => ({ ...prev, autoGenerate: true }))
                    }
                  />
                  <span className="text-sm">Auto-Generate</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Label>Active Status</Label>
                <Switch
                  checked={couponForm.active}
                  onCheckedChange={(value) =>
                    setCouponForm((prev) => ({ ...prev, active: value }))
                  }
                />
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Rules & Usage Limits</h4>
              <div className="space-y-2">
                <Label>Discount Type</Label>
                <Select
                  value={couponForm.discountType}
                  onValueChange={(value: "percentage" | "fixed" | "shipping") =>
                    setCouponForm((prev) => ({ ...prev, discountType: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">
                      Percentage Discount
                    </SelectItem>
                    <SelectItem value="fixed">Fixed Amount Discount</SelectItem>
                    <SelectItem value="shipping">Free Shipping</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Discount Value</Label>
                <Input
                  type="number"
                  value={couponForm.discountValue}
                  onChange={(e) =>
                    setCouponForm((prev) => ({
                      ...prev,
                      discountValue: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Minimum Purchase</Label>
                <Input
                  type="number"
                  value={couponForm.minPurchase}
                  onChange={(e) =>
                    setCouponForm((prev) => ({
                      ...prev,
                      minPurchase: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Total Usage Limit (Global)</Label>
                <Input
                  type="number"
                  value={couponForm.usageLimit}
                  onChange={(e) =>
                    setCouponForm((prev) => ({
                      ...prev,
                      usageLimit: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Usage Limit Per Customer</Label>
                <Input
                  type="number"
                  value={couponForm.usagePerCustomer}
                  onChange={(e) =>
                    setCouponForm((prev) => ({
                      ...prev,
                      usagePerCustomer: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Validity & Notes</h4>
              <div className="space-y-2">
                <Label>Valid From Date</Label>
                <Input
                  type="date"
                  value={couponForm.validFrom}
                  onChange={(e) =>
                    setCouponForm((prev) => ({
                      ...prev,
                      validFrom: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Valid To Date</Label>
                <Input
                  type="date"
                  value={couponForm.validTo}
                  onChange={(e) =>
                    setCouponForm((prev) => ({
                      ...prev,
                      validTo: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={couponForm.restrictCombine}
                  onCheckedChange={(value) =>
                    setCouponForm((prev) => ({
                      ...prev,
                      restrictCombine: Boolean(value),
                    }))
                  }
                />
                <span className="text-sm">
                  Cannot combine with other coupons
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={couponForm.validOnSaleItems}
                  onCheckedChange={(value) =>
                    setCouponForm((prev) => ({
                      ...prev,
                      validOnSaleItems: Boolean(value),
                    }))
                  }
                />
                <span className="text-sm">Valid on sale items</span>
              </div>
              <div className="space-y-2">
                <Label>Admin Notes</Label>
                <Textarea
                  value={couponForm.notes}
                  onChange={(e) =>
                    setCouponForm((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  placeholder="Add details or context here..."
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCouponDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateCoupon}>Save Coupon</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={couponCodeRuleDialogOpen}
        onOpenChange={setCouponCodeRuleDialogOpen}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Coupon Code Rule</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Rule Name</Label>
              <Input
                value={couponCodeRuleForm.name}
                onChange={(e) =>
                  setCouponCodeRuleForm((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <div className="flex items-center gap-2 pt-2">
                <Switch
                  checked={couponCodeRuleForm.status}
                  onCheckedChange={(value) =>
                    setCouponCodeRuleForm((prev) => ({
                      ...prev,
                      status: value,
                    }))
                  }
                />
                <span className="text-sm">
                  {couponCodeRuleForm.status ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label>Rule Description (Optional)</Label>
              <Textarea
                value={couponCodeRuleForm.description}
                onChange={(e) =>
                  setCouponCodeRuleForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Trigger Type</Label>
              <Select
                value={couponCodeRuleForm.triggerType}
                onValueChange={(
                  value: "prefix" | "suffix" | "specific" | "all",
                ) =>
                  setCouponCodeRuleForm((prev) => ({
                    ...prev,
                    triggerType: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="specific">
                    Apply to Specific Code(s)
                  </SelectItem>
                  <SelectItem value="prefix">
                    Apply to Codes with Prefix
                  </SelectItem>
                  <SelectItem value="suffix">
                    Apply to Codes with Suffix
                  </SelectItem>
                  <SelectItem value="all">Apply to All Codes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Trigger Value</Label>
              <Input
                value={couponCodeRuleForm.triggerValue}
                onChange={(e) =>
                  setCouponCodeRuleForm((prev) => ({
                    ...prev,
                    triggerValue: e.target.value,
                  }))
                }
                placeholder="Enter code or prefix"
              />
            </div>
            <div className="space-y-2">
              <Label>Condition Field</Label>
              <Select
                value={couponCodeRuleForm.conditionField}
                onValueChange={(
                  value:
                    | "cart_total"
                    | "item_count"
                    | "specific_products"
                    | "client_type",
                ) =>
                  setCouponCodeRuleForm((prev) => ({
                    ...prev,
                    conditionField: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cart_total">Cart Total</SelectItem>
                  <SelectItem value="item_count">
                    Number of Items in Cart
                  </SelectItem>
                  <SelectItem value="specific_products">
                    Specific Products
                  </SelectItem>
                  <SelectItem value="client_type">Client Type</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Condition</Label>
              <div className="flex gap-2">
                <Select
                  value={couponCodeRuleForm.comparator}
                  onValueChange={(value: ">=" | "<=" | "==") =>
                    setCouponCodeRuleForm((prev) => ({
                      ...prev,
                      comparator: value,
                    }))
                  }
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=">=">&gt;=</SelectItem>
                    <SelectItem value="<=">&lt;=</SelectItem>
                    <SelectItem value="==">==</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  value={couponCodeRuleForm.threshold}
                  onChange={(e) =>
                    setCouponCodeRuleForm((prev) => ({
                      ...prev,
                      threshold: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Discount Type</Label>
              <Select
                value={couponCodeRuleForm.discountType}
                onValueChange={(value: "percentage" | "fixed") =>
                  setCouponCodeRuleForm((prev) => ({
                    ...prev,
                    discountType: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">
                    Percentage Discount
                  </SelectItem>
                  <SelectItem value="fixed">Fixed Discount</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Discount Value</Label>
              <Input
                type="number"
                value={couponCodeRuleForm.discountValue}
                onChange={(e) =>
                  setCouponCodeRuleForm((prev) => ({
                    ...prev,
                    discountValue: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Calculation Order</Label>
              <Select
                value={couponCodeRuleForm.calculationOrder}
                onValueChange={(value: "before_tax" | "after_tax") =>
                  setCouponCodeRuleForm((prev) => ({
                    ...prev,
                    calculationOrder: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="before_tax">Before Tax</SelectItem>
                  <SelectItem value="after_tax">After Tax</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Maximum Usage (Global)</Label>
              <Input
                type="number"
                value={couponCodeRuleForm.maxUsageGlobal}
                onChange={(e) =>
                  setCouponCodeRuleForm((prev) => ({
                    ...prev,
                    maxUsageGlobal: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Maximum Usage per Customer</Label>
              <Input
                type="number"
                value={couponCodeRuleForm.maxUsagePerCustomer}
                onChange={(e) =>
                  setCouponCodeRuleForm((prev) => ({
                    ...prev,
                    maxUsagePerCustomer: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Compatible with Automatic Discounts</Label>
              <div className="flex items-center gap-2 pt-2">
                <Switch
                  checked={couponCodeRuleForm.stackable}
                  onCheckedChange={(value) =>
                    setCouponCodeRuleForm((prev) => ({
                      ...prev,
                      stackable: value,
                    }))
                  }
                />
                <span className="text-sm">
                  {couponCodeRuleForm.stackable ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCouponCodeRuleDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateCouponCodeRule}>Save Rule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={taxRuleDialogOpen} onOpenChange={setTaxRuleDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Tax Rule</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">
                Basic Information & Rate
              </h4>
              <div className="space-y-2">
                <Label>Rule Name</Label>
                <Input
                  value={taxRuleForm.ruleName}
                  onChange={(e) =>
                    setTaxRuleForm((prev) => ({
                      ...prev,
                      ruleName: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Tax Code/ID (Optional)</Label>
                <Input
                  value={taxRuleForm.taxCode}
                  onChange={(e) =>
                    setTaxRuleForm((prev) => ({
                      ...prev,
                      taxCode: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Rule Description</Label>
                <Textarea
                  value={taxRuleForm.description}
                  onChange={(e) =>
                    setTaxRuleForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Tax Rate</Label>
                <Input
                  type="number"
                  value={taxRuleForm.taxRate}
                  onChange={(e) =>
                    setTaxRuleForm((prev) => ({
                      ...prev,
                      taxRate: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="flex items-center gap-2">
                <Label>Active Status</Label>
                <Switch
                  checked={taxRuleForm.active}
                  onCheckedChange={(value) =>
                    setTaxRuleForm((prev) => ({ ...prev, active: value }))
                  }
                />
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Categorization & Type</h4>
              <div className="space-y-2">
                <Label>Tax Category</Label>
                <Select
                  value={taxRuleForm.taxCategory}
                  onValueChange={(value) =>
                    setTaxRuleForm((prev) => ({ ...prev, taxCategory: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GST">GST</SelectItem>
                    <SelectItem value="VAT">VAT</SelectItem>
                    <SelectItem value="Interstate">Interstate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tax Type</Label>
                <Select
                  value={taxRuleForm.taxType}
                  onValueChange={(value) =>
                    setTaxRuleForm((prev) => ({ ...prev, taxType: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Output">Output</SelectItem>
                    <SelectItem value="Input">Input</SelectItem>
                    <SelectItem value="Local">Local</SelectItem>
                    <SelectItem value="Service">Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tax Period / Fiscal Year</Label>
                <Select
                  value={taxRuleForm.fiscalPeriod}
                  onValueChange={(value) =>
                    setTaxRuleForm((prev) => ({ ...prev, fiscalPeriod: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FY2026">FY2026</SelectItem>
                    <SelectItem value="FY2025">FY2025</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Label>Reverse Charge Default</Label>
                <Switch
                  checked={taxRuleForm.reverseCharge}
                  onCheckedChange={(value) =>
                    setTaxRuleForm((prev) => ({
                      ...prev,
                      reverseCharge: value,
                    }))
                  }
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={taxRuleForm.recoverable}
                  onCheckedChange={(value) =>
                    setTaxRuleForm((prev) => ({
                      ...prev,
                      recoverable: Boolean(value),
                    }))
                  }
                />
                <span className="text-sm">Is Recoverable (Claimable)</span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold">
                Application Rules & Advanced
              </h4>
              <div className="space-y-2">
                <Label>Apply To (Conditions)</Label>
                <Input
                  value={taxRuleForm.applyToCategory}
                  onChange={(e) =>
                    setTaxRuleForm((prev) => ({
                      ...prev,
                      applyToCategory: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Minimum Order Amount</Label>
                <Input
                  type="number"
                  value={taxRuleForm.minimumOrderAmount}
                  onChange={(e) =>
                    setTaxRuleForm((prev) => ({
                      ...prev,
                      minimumOrderAmount: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Priority/Order</Label>
                <Input
                  type="number"
                  value={taxRuleForm.priority}
                  onChange={(e) =>
                    setTaxRuleForm((prev) => ({
                      ...prev,
                      priority: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Rounding Rule</Label>
                <Select
                  value={taxRuleForm.roundingRule}
                  onValueChange={(value) =>
                    setTaxRuleForm((prev) => ({ ...prev, roundingRule: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Round to Nearest">
                      Round to Nearest
                    </SelectItem>
                    <SelectItem value="Round Up">Round Up</SelectItem>
                    <SelectItem value="Round Down">Round Down</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTaxRuleDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateTaxRule}>Save Rule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRoleId ? "Edit Role" : "Add Role"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Role name"
                value={roleForm.name}
                onChange={(e) =>
                  setRoleForm((prev) => ({ ...prev, name: e.target.value }))
                }
              />
              <Select
                value={roleForm.status}
                onValueChange={(value: "active" | "inactive") =>
                  setRoleForm((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Textarea
              placeholder="Role description"
              value={roleForm.description}
              onChange={(e) =>
                setRoleForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
            />

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Module</TableHead>
                  <TableHead className="text-center">View</TableHead>
                  <TableHead className="text-center">Create</TableHead>
                  <TableHead className="text-center">Edit</TableHead>
                  <TableHead className="text-center">Delete</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ROLE_PERMISSION_MODULES.map((module) => (
                  <TableRow key={module}>
                    <TableCell>{module}</TableCell>
                    {(
                      ["view", "create", "edit", "delete"] as PermissionAction[]
                    ).map((action) => (
                      <TableCell key={action} className="text-center">
                        <Checkbox
                          checked={roleForm.permissions[module][action]}
                          onCheckedChange={() =>
                            toggleRolePermission(module, action)
                          }
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setRoleDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={saveRole}>Save Role</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingUserId ? "Edit User" : "Add User"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Name"
              value={userForm.name}
              onChange={(e) =>
                setUserForm((prev) => ({ ...prev, name: e.target.value }))
              }
            />
            <Input
              type="email"
              placeholder="Email"
              value={userForm.email}
              onChange={(e) =>
                setUserForm((prev) => ({ ...prev, email: e.target.value }))
              }
            />
            <Input value={client.name} disabled />
            <Input
              placeholder="Job Title"
              value={userForm.jobTitle}
              onChange={(e) =>
                setUserForm((prev) => ({ ...prev, jobTitle: e.target.value }))
              }
            />
            <Input
              placeholder="Department"
              value={userForm.department}
              onChange={(e) =>
                setUserForm((prev) => ({ ...prev, department: e.target.value }))
              }
            />
            <Select
              value={userForm.status}
              onValueChange={(value: "active" | "inactive" | "suspended") =>
                setUserForm((prev) => ({ ...prev, status: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setUserDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={saveUser}>Save User</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <QuickMailComposer
        open={showMail}
        onClose={() => setShowMail(false)}
        recipientType="client"
        defaultTo={client.email}
      />
    </div>
  );
}
