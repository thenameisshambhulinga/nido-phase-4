import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowLeft,
  TrendingUp,
  ShoppingCart,
  Users,
  AlertTriangle,
  Star,
  Mail,
  Edit,
  ExternalLink,
  Package,
  DollarSign,
  Clock,
  CheckCircle,
  Download,
  Search,
  Plus,
  Image as ImageIcon,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { toast } from "@/hooks/use-toast";
import QuickMailComposer from "@/components/shared/QuickMailComposer";
import VendorScorecard from "@/components/shared/VendorScorecard";
import { normalizeOrderCode } from "@/lib/documentNumbering";
import { safeReadJson } from "@/lib/storage";

const VENDOR_ASSIGNMENT_STORAGE_KEY = "nido_order_vendor_assignments_v1";
const PURCHASE_ORDER_STORAGE_KEY = "nido_purchase_orders_v1";

const CHART_COLORS = [
  "hsl(213, 94%, 56%)",
  "hsl(24, 95%, 53%)",
  "hsl(220, 9%, 60%)",
  "hsl(142, 70%, 40%)",
  "hsl(38, 92%, 50%)",
];
const STATUS_COLORS: Record<string, string> = {
  Pending: "#F59E0B",
  Processing: "#F97316",
  Approved: "#10B981",
  Shipped: "#3B82F6",
  Delivered: "#059669",
  Cancelled: "#EF4444",
  "On Hold": "#6B7280",
};

type VendorCatalogItem = {
  id: string;
  vendorId: string;
  masterProductId: string;
  productCode: string;
  name: string;
  category: string;
  brand: string;
  baseMasterPrice: number;
  purchasePrice: number;
  status: "In Stock" | "Low Stock" | "Out of Stock";
};

type VendorAnalytics = {
  totalSpend: number;
  totalOrders: number;
  monthlySpend: Array<{ month?: string; value?: number }>;
  statusBreakdown: {
    pending?: number;
    processing?: number;
    completed?: number;
  };
};

function AnimatedCounter({
  value,
  prefix = "",
  suffix = "",
}: {
  value: number;
  prefix?: string;
  suffix?: string;
}) {
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    let current = 0;
    const steps = 40;
    const increment = value / steps;
    const timer = setInterval(() => {
      current = Math.min(current + increment, value);
      setDisplayed(Math.round(current));
      if (current >= value) clearInterval(timer);
    }, 25);
    return () => clearInterval(timer);
  }, [value]);
  return (
    <span>
      {prefix}
      {displayed.toLocaleString()}
      {suffix}
    </span>
  );
}

export default function VendorDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { vendors, orders, updateVendor, addAuditEntry, masterCatalogItems } =
    useData();
  const { user, isOwner } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [editRating, setEditRating] = useState(false);
  const [showMail, setShowMail] = useState(false);
  const [vendorCatalog, setVendorCatalog] = useState<VendorCatalogItem[]>([]);
  const [vendorCatalogDialogOpen, setVendorCatalogDialogOpen] = useState(false);
  const [selectedVendorCatalogIds, setSelectedVendorCatalogIds] = useState<
    string[]
  >([]);
  const [vendorCatalogSearch, setVendorCatalogSearch] = useState("");
  const [catalogLookupSearch, setCatalogLookupSearch] = useState("");
  const [selectedMasterProductId, setSelectedMasterProductId] = useState("");
  const [purchasePrice, setPurchasePrice] = useState(0);
  const [vendorAnalytics, setVendorAnalytics] =
    useState<VendorAnalytics | null>(null);

  const vendor = vendors.find((v) => v.id === id);

  useEffect(() => {
    if (!id) {
      setVendorAnalytics(null);
      return;
    }

    const fetchVendorAnalytics = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/vendors/${id}/analytics`,
        );

        if (!response.ok) {
          setVendorAnalytics(null);
          return;
        }

        const raw = await response.json();
        const data = raw?.data || raw;

        setVendorAnalytics({
          totalSpend: Number(data?.totalSpend || 0),
          totalOrders: Number(data?.totalOrders || 0),
          monthlySpend: Array.isArray(data?.monthlySpend)
            ? data.monthlySpend
            : [],
          statusBreakdown: {
            pending: Number(data?.statusBreakdown?.pending || 0),
            processing: Number(data?.statusBreakdown?.processing || 0),
            completed: Number(data?.statusBreakdown?.completed || 0),
          },
        });
      } catch {
        setVendorAnalytics(null);
      }
    };

    fetchVendorAnalytics();
  }, [id]);
  const selectedMasterProduct = useMemo(
    () =>
      masterCatalogItems.find((item) => item.id === selectedMasterProductId) ||
      null,
    [masterCatalogItems, selectedMasterProductId],
  );

  useEffect(() => {
    if (!vendor) return;
    const storageKey = `nido_vendor_catalog_${vendor.id}`;
    try {
      const raw = localStorage.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : [];
      const normalized = Array.isArray(parsed)
        ? parsed
            .filter((entry) => entry && typeof entry === "object")
            .map((entry) => {
              const rawPurchase = Number(entry.purchasePrice);
              const purchasePrice = Number.isFinite(rawPurchase)
                ? rawPurchase
                : Number(entry.price) || 0;
              const rawBase = Number(entry.baseMasterPrice);
              return {
                id: String(entry.id || `vci-${Date.now()}`),
                vendorId: String(entry.vendorId || vendor.id),
                masterProductId: String(entry.masterProductId || ""),
                productCode: String(entry.productCode || ""),
                name: String(entry.name || "Unnamed Item"),
                category: String(entry.category || "General"),
                brand: String(entry.brand || ""),
                baseMasterPrice: Number.isFinite(rawBase)
                  ? rawBase
                  : purchasePrice,
                purchasePrice,
                status:
                  entry.status === "Low Stock" ||
                  entry.status === "Out of Stock"
                    ? entry.status
                    : "In Stock",
              } as VendorCatalogItem;
            })
        : [];
      setVendorCatalog(normalized);
    } catch {
      setVendorCatalog([]);
    }
  }, [vendor]);

  const persistVendorCatalog = (next: VendorCatalogItem[]) => {
    if (!vendor) return;
    setVendorCatalog(next);
    localStorage.setItem(
      `nido_vendor_catalog_${vendor.id}`,
      JSON.stringify(next),
    );
  };

  const filteredVendorCatalog = useMemo(() => {
    const query = vendorCatalogSearch.trim().toLowerCase();
    if (!query) return vendorCatalog;
    return vendorCatalog.filter((entry) =>
      [entry.name, entry.productCode, entry.category, entry.brand]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [vendorCatalog, vendorCatalogSearch]);

  const allVendorCatalogSelected =
    filteredVendorCatalog.length > 0 &&
    selectedVendorCatalogIds.length === filteredVendorCatalog.length;

  const vendorAssignedOrderIds = useMemo(() => {
    if (!vendor) return new Set<string>();
    const allAssignments = safeReadJson<Record<string, Record<string, string>>>(
      VENDOR_ASSIGNMENT_STORAGE_KEY,
      {},
    );

    return new Set(
      Object.entries(allAssignments)
        .filter(([, itemAssignments]) =>
          Object.values(itemAssignments || {}).includes(vendor.id),
        )
        .map(([orderId]) => orderId),
    );
  }, [vendor, orders]);

  const vendorPurchaseOrderSourceNumbers = useMemo(() => {
    if (!vendor) return new Set<string>();
    const purchaseOrders = safeReadJson<
      Array<{ vendorName?: string; sourceOrderNumber?: string }>
    >(PURCHASE_ORDER_STORAGE_KEY, []);

    return new Set(
      purchaseOrders
        .filter((entry) => (entry.vendorName || "") === vendor.name)
        .map((entry) => normalizeOrderCode(entry.sourceOrderNumber || ""))
        .filter((value) => Boolean(value)),
    );
  }, [vendor, orders]);

  const vendorOrders = useMemo(
    () =>
      vendor
        ? orders
            .filter(
              (o) =>
                o.organization === vendor.name ||
                vendorAssignedOrderIds.has(o.id) ||
                vendorPurchaseOrderSourceNumbers.has(
                  normalizeOrderCode(o.orderNumber || o.id),
                ),
            )
            .map((o) => ({
              ...o,
              orderNumber: normalizeOrderCode(o.orderNumber || o.id),
            }))
        : [],
    [vendor, orders, vendorAssignedOrderIds, vendorPurchaseOrderSourceNumbers],
  );
  const totalSpend = useMemo(
    () => vendorOrders.reduce((s, o) => s + o.totalAmount, 0),
    [vendorOrders],
  );
  const openOrders = useMemo(
    () =>
      vendorOrders.filter((o) => !["Delivered", "Cancelled"].includes(o.status))
        .length,
    [vendorOrders],
  );
  const overdueOrders = useMemo(
    () => vendorOrders.filter((o) => o.slaStatus === "breached").length,
    [vendorOrders],
  );

  const hasAnalyticsData = (vendorAnalytics?.totalOrders || 0) > 0;

  // Procurement status pie
  const procureStatusData = useMemo(() => {
    const pending = Number(vendorAnalytics?.statusBreakdown?.pending || 0);
    const processing = Number(
      vendorAnalytics?.statusBreakdown?.processing || 0,
    );
    const completed = Number(vendorAnalytics?.statusBreakdown?.completed || 0);

    return [
      { name: "Pending", value: pending },
      { name: "Processing", value: processing },
      { name: "Completed", value: completed },
    ];
  }, [vendorAnalytics]);

  // Spend analysis pie
  const spendData = useMemo(() => {
    const analyticsTotalSpend = Number(vendorAnalytics?.totalSpend || 0);
    const pendingCount = Number(vendorAnalytics?.statusBreakdown?.pending || 0);
    const processingCount = Number(
      vendorAnalytics?.statusBreakdown?.processing || 0,
    );
    const completedCount = Number(
      vendorAnalytics?.statusBreakdown?.completed || 0,
    );
    const totalCount = pendingCount + processingCount + completedCount;
    const paid =
      totalCount > 0 ? (analyticsTotalSpend * completedCount) / totalCount : 0;
    const pending = Math.max(0, analyticsTotalSpend - paid);

    return [
      { name: "Paid", value: Number(paid || 0) },
      { name: "Pending Due", value: Number(pending || 0) },
    ];
  }, [vendorAnalytics]);

  // Monthly spend bar chart
  const monthlySpend = useMemo(() => {
    const source = Array.isArray(vendorAnalytics?.monthlySpend)
      ? vendorAnalytics?.monthlySpend
      : [];

    if (!source?.length) {
      return [{ name: "No Data", value: 0, month: "No Data", spend: 0 }];
    }

    return source.map((entry) => ({
      name: String(entry?.month || ""),
      value: Number(entry?.value || 0),
      month: String(entry?.month || ""),
      spend: Number(entry?.value || 0),
    }));
  }, [vendorAnalytics]);

  if (!vendor)
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Vendor not found.</p>
        <Button onClick={() => navigate("/vendors")} className="mt-4">
          Back to Vendors
        </Button>
      </div>
    );

  const handleRatingChange = (rating: number) => {
    updateVendor(vendor.id, { rating });
    addAuditEntry({
      user: user?.name || "System",
      action: "Vendor Rating Updated",
      module: "Vendors",
      details: `Set ${vendor.name} rating to ${rating}`,
      ipAddress: "192.168.1.1",
      status: "success",
    });
    setEditRating(false);
    toast({ title: "Rating Updated" });
  };

  const handleStatusToggle = () => {
    const newStatus = vendor.status === "active" ? "inactive" : "active";
    updateVendor(vendor.id, { status: newStatus });
    addAuditEntry({
      user: user?.name || "System",
      action: "Vendor Status Changed",
      module: "Vendors",
      details: `Changed ${vendor.name} status to ${newStatus}`,
      ipAddress: "192.168.1.1",
      status: "success",
    });
    toast({
      title: `Vendor ${newStatus === "active" ? "Activated" : "Deactivated"}`,
    });
  };

  const openVendorCatalogDialog = () => {
    setSelectedMasterProductId("");
    setCatalogLookupSearch("");
    setPurchasePrice(0);
    setVendorCatalogDialogOpen(true);
  };

  const saveVendorCatalogItem = () => {
    if (!isOwner) {
      toast({ title: "Only owner can fix vendor price assignments" });
      return;
    }

    if (!vendor || !selectedMasterProduct) {
      toast({ title: "Select a master catalog item first" });
      return;
    }

    const existing = vendorCatalog.find(
      (entry) => entry.masterProductId === selectedMasterProduct.id,
    );

    const item: VendorCatalogItem = {
      id: existing?.id || `vci-${Date.now()}`,
      vendorId: vendor.id,
      masterProductId: selectedMasterProduct.id,
      productCode: selectedMasterProduct.productCode,
      name: selectedMasterProduct.name,
      category: selectedMasterProduct.category,
      brand: selectedMasterProduct.brand,
      baseMasterPrice: selectedMasterProduct.price,
      purchasePrice: Number.isFinite(purchasePrice)
        ? purchasePrice
        : selectedMasterProduct.price,
      status: selectedMasterProduct.status,
    };

    const next = existing
      ? vendorCatalog.map((entry) => (entry.id === existing.id ? item : entry))
      : [item, ...vendorCatalog];

    persistVendorCatalog(next);
    toast({
      title: existing
        ? "Product catalog item updated"
        : "Product catalog item added",
    });
    setVendorCatalogDialogOpen(false);
  };

  const toggleVendorCatalogSelection = (itemId: string) => {
    setSelectedVendorCatalogIds((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId],
    );
  };

  const toggleAllVendorCatalogSelection = () => {
    setSelectedVendorCatalogIds(
      allVendorCatalogSelected
        ? []
        : filteredVendorCatalog.map((entry) => entry.id),
    );
  };

  const exportSelectedVendorCatalog = () => {
    if (selectedVendorCatalogIds.length === 0) {
      toast({ title: "Select at least one product to export" });
      return;
    }

    const rows = [
      [
        "ProductCode",
        "ItemName",
        "Category",
        "Brand",
        "PurchasePrice",
        "Status",
      ],
      ...vendorCatalog
        .filter((entry) => selectedVendorCatalogIds.includes(entry.id))
        .map((entry) => [
          entry.productCode,
          entry.name,
          entry.category,
          entry.brand,
          String(entry.purchasePrice),
          entry.status,
        ]),
    ];
    const csv = rows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${vendor?.name.replace(/\s+/g, "-").toLowerCase()}-product-catalog.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: "Selected products exported" });
  };

  const removeVendorCatalogItem = (itemId: string) => {
    const next = vendorCatalog.filter((entry) => entry.id !== itemId);
    persistVendorCatalog(next);
    setSelectedVendorCatalogIds((prev) => prev.filter((id) => id !== itemId));
    toast({ title: "Product removed from vendor catalog" });
  };

  return (
    <div>
      <Header title={vendor.name} />
      <div className="p-6 space-y-6 animate-fade-in">
        {/* Header with breadcrumb */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/vendors")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <p className="text-xs text-muted-foreground">
                Vendors / {vendor.category}
              </p>
              <h1 className="text-2xl font-display font-bold">{vendor.name}</h1>
            </div>
            <Badge
              className={
                vendor.status === "active"
                  ? "bg-success text-success-foreground"
                  : vendor.status === "pending"
                    ? "bg-warning text-warning-foreground"
                    : "bg-muted text-muted-foreground"
              }
            >
              {vendor.status}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/orders`)}
              className="gap-2"
            >
              <ShoppingCart className="h-4 w-4" /> New Order
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setShowMail(true)}
            >
              <Mail className="h-4 w-4" /> Message
            </Button>
            {isOwner && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleStatusToggle}
                className="gap-2"
              >
                {vendor.status === "active" ? "Deactivate" : "Activate"}
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="scorecard">Scorecard</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="product-catalog">Product Catalog</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                {
                  title: "Total Spend",
                  value: totalSpend,
                  prefix: "$",
                  icon: TrendingUp,
                  color: "text-success",
                  onClick: () => setActiveTab("orders"),
                },
                {
                  title: "Open Orders",
                  value: openOrders,
                  icon: ShoppingCart,
                  color: "text-info",
                  onClick: () => setActiveTab("orders"),
                },
                {
                  title: "Overdue Orders",
                  value: overdueOrders,
                  icon: AlertTriangle,
                  color:
                    overdueOrders > 0
                      ? "text-destructive"
                      : "text-muted-foreground",
                  onClick: () => setActiveTab("orders"),
                },
              ].map((kpi) => (
                <Card
                  key={kpi.title}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={kpi.onClick}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          {kpi.title}
                        </p>
                        <p className="text-2xl font-bold mt-1">
                          <AnimatedCounter
                            value={kpi.value}
                            prefix={kpi.prefix}
                          />
                        </p>
                      </div>
                      <div className={`p-2 rounded-lg bg-muted ${kpi.color}`}>
                        <kpi.icon className="h-5 w-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Spend Analysis (Monthly)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {hasAnalyticsData ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={monthlySpend}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="hsl(var(--border))"
                        />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                        <YAxis
                          tick={{ fontSize: 11 }}
                          tickFormatter={(v) =>
                            `$${(Number(v || 0) / 1000).toFixed(0)}K`
                          }
                        />
                        <Tooltip
                          formatter={(v: number) => [
                            `$${Number(v || 0).toLocaleString()}`,
                            "Spend",
                          ]}
                        />
                        <Bar
                          dataKey="spend"
                          fill="hsl(213, 55%, 35%)"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground">
                      No analytics available
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Purchase Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {vendorOrders.length > 0 ? (
                    <div className="space-y-4">
                      {vendorOrders.slice(0, 1).map((o) => (
                        <div key={o.id} className="space-y-3">
                          {o.items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-start gap-4 p-3 bg-muted/30 rounded-lg"
                            >
                              <div className="h-16 w-16 bg-muted rounded-lg flex items-center justify-center">
                                <Package className="h-8 w-8 text-muted-foreground" />
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-sm">
                                  {item.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {item.description}
                                </p>
                                <Badge
                                  variant="outline"
                                  className="mt-1 text-xs"
                                >
                                  Qty: {item.quantity}
                                </Badge>
                              </div>
                            </div>
                          ))}
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Subtotal
                              </span>
                              <span>${o.totalAmount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Shipping
                              </span>
                              <span>$0.00</span>
                            </div>
                            <div className="flex justify-between font-bold border-t pt-1">
                              <span>Total</span>
                              <span>${o.totalAmount.toLocaleString()}</span>
                            </div>
                          </div>
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() =>
                              navigate(
                                `/procure/orders/${o.id}?vendorId=${vendor.id}`,
                              )
                            }
                          >
                            View Full Order →
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground text-sm">
                        No active purchases
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => navigate("/orders")}
                      >
                        Create New Order
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Charts Row 2: Pie charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Procurement Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {hasAnalyticsData ? (
                    <>
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie
                            data={procureStatusData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={3}
                            dataKey="value"
                            label={({ name, value }) =>
                              `${name}: ${Number(value || 0)}`
                            }
                            onClick={(_, i) => {
                              const status = procureStatusData?.[i]?.name;
                              if (status) {
                                setActiveTab("orders");
                                toast({ title: `Filtered: ${status}` });
                              }
                            }}
                            style={{ cursor: "pointer" }}
                          >
                            {procureStatusData?.map((_, i) => (
                              <Cell
                                key={i}
                                fill={CHART_COLORS[i % CHART_COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      <p className="text-xs text-muted-foreground text-center">
                        Click a slice to filter orders
                      </p>
                    </>
                  ) : (
                    <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
                      No analytics available
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Spend Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {hasAnalyticsData ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={spendData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                          label={({ name, value }) =>
                            `${name}: $${Number(value || 0).toLocaleString()}`
                          }
                          style={{ cursor: "pointer" }}
                        >
                          {spendData?.map((_, i) => (
                            <Cell
                              key={i}
                              fill={CHART_COLORS[i % CHART_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(v: number) =>
                            `$${Number(v || 0).toLocaleString()}`
                          }
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
                      No analytics available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Orders */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">
                    Recent Orders
                  </CardTitle>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setActiveTab("orders")}
                  >
                    View All →
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Progress</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendorOrders.slice(0, 5).map((o) => {
                      const progressMap: Record<string, number> = {
                        Pending: 20,
                        Processing: 40,
                        Approved: 60,
                        Shipped: 80,
                        Delivered: 100,
                        Cancelled: 0,
                      };
                      return (
                        <TableRow
                          key={o.id}
                          className="cursor-pointer"
                          onClick={() =>
                            navigate(
                              `/procure/orders/${o.id}?vendorId=${vendor.id}`,
                            )
                          }
                        >
                          <TableCell className="font-medium text-primary">
                            {o.orderNumber}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {o.orderDate}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              style={{
                                borderColor: STATUS_COLORS[o.status],
                                color: STATUS_COLORS[o.status],
                              }}
                            >
                              {o.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ${o.totalAmount.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Progress
                              value={progressMap[o.status] || 0}
                              className="h-2 w-20"
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {vendorOrders.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center py-4 text-muted-foreground"
                        >
                          No orders for this vendor.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  All Orders from {vendor.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Requesting User</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>SLA</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendorOrders.map((o) => (
                      <TableRow
                        key={o.id}
                        className="cursor-pointer"
                        onClick={() =>
                          navigate(
                            `/procure/orders/${o.id}?vendorId=${vendor.id}`,
                          )
                        }
                      >
                        <TableCell className="font-medium text-primary">
                          {o.orderNumber}
                        </TableCell>
                        <TableCell>{o.orderDate}</TableCell>
                        <TableCell>{o.requestingUser}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            style={{
                              borderColor: STATUS_COLORS[o.status],
                              color: STATUS_COLORS[o.status],
                            }}
                          >
                            {o.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              o.slaStatus === "within_sla"
                                ? "bg-success text-success-foreground"
                                : o.slaStatus === "at_risk"
                                  ? "bg-warning text-warning-foreground"
                                  : "bg-destructive text-destructive-foreground"
                            }
                          >
                            {o.slaStatus.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ${o.totalAmount.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                    {vendorOrders.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center py-8 text-muted-foreground"
                        >
                          No orders found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-sm">Vendor Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">
                        Company Name
                      </span>
                      <p className="font-medium">{vendor.name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Category</span>
                      <p className="font-medium">{vendor.category}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Email</span>
                      <p className="font-medium">{vendor.contactEmail}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Phone</span>
                      <p className="font-medium">{vendor.contactPhone}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Address</span>
                      <p className="font-medium">{vendor.address}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Vendor Since
                      </span>
                      <p className="font-medium">
                        {new Date(vendor.joinDate).toLocaleDateString("en-US", {
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status</span>
                      <Badge
                        className={
                          vendor.status === "active"
                            ? "bg-success text-success-foreground"
                            : "bg-warning text-warning-foreground"
                        }
                      >
                        {vendor.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="h-20 w-20 rounded-full bg-primary flex items-center justify-center text-2xl font-bold text-primary-foreground">
                      {vendor.name
                        .split(" ")
                        .map((w) => w[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-semibold">{vendor.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {vendor.address?.split(",").pop()?.trim()}
                      </p>
                    </div>
                    {/* Rating */}
                    <div>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-5 w-5 cursor-pointer transition-colors ${star <= Math.round(vendor.rating) ? "fill-warning text-warning" : "text-muted"}`}
                            onClick={() => isOwner && handleRatingChange(star)}
                          />
                        ))}
                        <span className="text-sm font-medium ml-2">
                          {vendor.rating}/5
                        </span>
                      </div>
                      {isOwner && (
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Click stars to update rating
                        </p>
                      )}
                    </div>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 gap-3 w-full">
                      <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <p className="text-lg font-bold">
                          {vendor.totalOrders}
                        </p>
                        <p className="text-xs text-muted-foreground">Orders</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <p className="text-lg font-bold">
                          ${(vendor.totalSpend / 1000).toFixed(0)}K
                        </p>
                        <p className="text-xs text-muted-foreground">Revenue</p>
                      </div>
                    </div>
                    {/* Quality Bars */}
                    <div className="w-full space-y-3">
                      <p className="text-xs font-medium text-left">
                        Performance
                      </p>
                      {[
                        { label: "Quality", value: 85 },
                        { label: "Cost", value: 72 },
                        { label: "Delivery Speed", value: 90 },
                        { label: "Communication", value: 78 },
                      ].map((metric) => (
                        <div key={metric.label} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>{metric.label}</span>
                            <span className="text-muted-foreground">
                              {metric.value}%
                            </span>
                          </div>
                          <Progress value={metric.value} className="h-1.5" />
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="product-catalog" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Assign master catalog products to this vendor with vendor-specific
              purchase prices.
            </p>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9 w-64"
                  placeholder="Search product catalog"
                  value={vendorCatalogSearch}
                  onChange={(e) => setVendorCatalogSearch(e.target.value)}
                />
              </div>
              <div className="ml-auto flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={exportSelectedVendorCatalog}
                >
                  <Download className="h-4 w-4" /> Export
                </Button>
                <Button
                  size="sm"
                  className="gap-2"
                  onClick={openVendorCatalogDialog}
                  disabled={!isOwner}
                >
                  <Plus className="h-4 w-4" /> Add New Item
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
                          checked={allVendorCatalogSelected}
                          onCheckedChange={toggleAllVendorCatalogSelection}
                        />
                      </TableHead>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Product Code</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Brand</TableHead>
                      <TableHead>Master Price</TableHead>
                      <TableHead>Purchase Price</TableHead>
                      <TableHead>Variance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVendorCatalog.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedVendorCatalogIds.includes(item.id)}
                            onCheckedChange={() =>
                              toggleVendorCatalogSelection(item.id)
                            }
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {item.name}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {item.productCode}
                        </TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell>{item.brand}</TableCell>
                        <TableCell>
                          ₹{item.baseMasterPrice.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          ₹{item.purchasePrice.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {item.purchasePrice >= item.baseMasterPrice
                              ? "+"
                              : "-"}
                            ₹
                            {Math.abs(
                              item.purchasePrice - item.baseMasterPrice,
                            ).toLocaleString()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeVendorCatalogItem(item.id)}
                          >
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredVendorCatalog.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={10}
                          className="py-8 text-center text-muted-foreground"
                        >
                          No products assigned for this vendor.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">O/S Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={[
                          {
                            name: "Purchase Order",
                            value: vendorOrders.length || 3,
                          },
                          {
                            name: "Purchase Service",
                            value: Math.max(
                              1,
                              Math.floor(vendorOrders.length / 3),
                            ),
                          },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        <Cell fill="hsl(213, 94%, 56%)" />
                        <Cell fill="hsl(38, 92%, 50%)" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <p className="text-xs text-center text-muted-foreground">
                    Tap a slice to view details
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Procure Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={procureStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {procureStatusData.map((_, i) => (
                          <Cell
                            key={i}
                            fill={CHART_COLORS[i % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Spend Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={spendData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        dataKey="value"
                        label={({ name, value }) =>
                          `${name}: $${value.toLocaleString()}`
                        }
                      >
                        {spendData.map((_, i) => (
                          <Cell
                            key={i}
                            fill={CHART_COLORS[i % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v: number) => `$${v.toLocaleString()}`}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Scorecard Tab */}
          <TabsContent value="scorecard" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <VendorScorecard vendor={vendor} orders={vendorOrders} />
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Services Export</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => {
                        const headers = [
                          "Order ID",
                          "Date",
                          "Items",
                          "Status",
                          "Amount",
                        ];
                        const rows = vendorOrders.map((o) => [
                          o.orderNumber,
                          o.orderDate,
                          o.items.map((i) => i.name).join("; "),
                          o.status,
                          o.totalAmount,
                        ]);
                        const csv = [headers, ...rows]
                          .map((r) => r.join(","))
                          .join("\n");
                        const blob = new Blob(
                          [`Services Report: ${vendor.name}\n\n${csv}`],
                          { type: "text/csv" },
                        );
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `services-${vendor.name.replace(/\s+/g, "-")}.csv`;
                        a.click();
                        URL.revokeObjectURL(url);
                        toast({ title: "Services Exported" });
                      }}
                    >
                      <Download className="h-3.5 w-3.5" /> Export CSV
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vendorOrders.slice(0, 10).map((o) => (
                        <TableRow key={o.id}>
                          <TableCell className="font-medium">
                            {o.orderNumber}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {o.orderDate}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{o.status}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ${o.totalAmount.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <QuickMailComposer
        open={showMail}
        onClose={() => setShowMail(false)}
        recipientType="vendor"
        defaultTo={vendor.contactEmail}
      />

      <Dialog
        open={vendorCatalogDialogOpen}
        onOpenChange={setVendorCatalogDialogOpen}
      >
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Item</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search master catalog..."
                  value={catalogLookupSearch}
                  onChange={(e) => setCatalogLookupSearch(e.target.value)}
                />
              </div>
              <ScrollArea className="h-[340px] rounded-lg border">
                <div className="space-y-2 p-3">
                  {masterCatalogItems
                    .filter((item) => {
                      const query = catalogLookupSearch.trim().toLowerCase();
                      if (!query) return true;
                      return [item.name, item.productCode, item.category]
                        .join(" ")
                        .toLowerCase()
                        .includes(query);
                    })
                    .map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setSelectedMasterProductId(item.id);
                          setPurchasePrice(item.price);
                        }}
                        className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/60 ${selectedMasterProductId === item.id ? "border-primary bg-primary/5" : ""}`}
                      >
                        <div className="h-10 w-10 rounded-md border bg-muted flex items-center justify-center">
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.productCode} · {item.category}
                          </p>
                        </div>
                        <span className="rounded-md border px-3 py-1 text-xs font-medium">
                          Select
                        </span>
                      </button>
                    ))}
                </div>
              </ScrollArea>
            </div>

            <div className="space-y-4 rounded-lg border p-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Selected Master Product
                </p>
                <h3 className="mt-1 text-sm font-semibold">
                  {selectedMasterProduct?.name || "Choose a catalog item"}
                </h3>
              </div>
              {selectedMasterProduct ? (
                <div className="grid gap-2 rounded-md border bg-muted/40 p-3 text-xs sm:grid-cols-2">
                  <div>
                    <p className="text-muted-foreground">Master Base Price</p>
                    <p className="font-semibold text-foreground">
                      ₹{selectedMasterProduct.price.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Owner Price Delta</p>
                    <p className="font-semibold text-foreground">
                      {purchasePrice >= selectedMasterProduct.price ? "+" : "-"}
                      ₹
                      {Math.abs(
                        purchasePrice - selectedMasterProduct.price,
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>
              ) : null}
              <div className="space-y-2">
                <Label>Purchase Price</Label>
                <Input
                  type="number"
                  value={purchasePrice}
                  onChange={(e) =>
                    setPurchasePrice(Number(e.target.value) || 0)
                  }
                  disabled={!isOwner}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setVendorCatalogDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={saveVendorCatalogItem} disabled={!isOwner}>
              Save Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
