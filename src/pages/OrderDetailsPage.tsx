import { useState, useEffect, useMemo } from "react";
import {
  useParams,
  useNavigate,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { normalizeOrderCode } from "@/lib/documentNumbering";
import { cn } from "@/lib/utils";
import { safeReadJson } from "@/lib/storage";
import {
  ArrowLeft,
  BellRing,
  Building2,
  Circle,
  ClipboardList,
  CreditCard,
  Download,
  Eye,
  Send,
  Paperclip,
  Mail,
  MessageSquare,
  FileText,
  Image,
  MapPin,
  Package,
  Phone,
  Timer,
  Truck,
  UserCircle2,
  X,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import QuickMailComposer from "@/components/shared/QuickMailComposer";

interface SubOrder {
  subOrderId: string;
  category: string;
  item: {
    name: string;
    quantity: number;
    price: number;
    total: number;
    sku: string;
  };
  slaStartTime: string;
  slaStatus: "within_sla" | "at_risk" | "breached";
  status: string;
}

interface PurchaseOrderItem {
  id: string;
  sourceOrderItemId?: string;
  itemName: string;
  description: string;
  account: string;
  hsnSac: string;
  quantity: number;
  rate: number;
  taxPercent: number;
}

interface PurchaseOrderEntry {
  id: string;
  poNumber: string;
  sourceOrderNumber?: string;
  referenceNumber: string;
  vendorName: string;
  vendorAddress: string;
  deliveryAddressType: "Organization" | "Customer";
  deliveryAddress: string;
  date: string;
  deliveryDate: string;
  paymentTerms: string;
  shipmentPreference: string;
  includeInterStateGst: boolean;
  status: "DRAFT" | "ISSUED";
  billedStatus: "YET TO BE BILLED" | "BILLED";
  receiveStatus: "YET TO BE RECEIVED" | "RECEIVED";
  discountPercent: number;
  adjustment: number;
  notes: string;
  termsAndConditions: string;
  attachmentType: string;
  items: PurchaseOrderItem[];
}

const PURCHASE_ORDER_STORAGE_KEY = "nido_purchase_orders_v1";
const PROCUREMENT_LOCKED_STATUSES = new Set(["rejected", "cancelled"]);

const nextPoNumber = (entries: PurchaseOrderEntry[]) => {
  const max = entries.reduce((current, entry) => {
    const parsed = Number(entry.poNumber.replace(/\D/g, ""));
    return Number.isFinite(parsed) ? Math.max(current, parsed) : current;
  }, 0);
  return `PO-${String(max + 1).padStart(5, "0")}`;
};

const orderItemCategory = (name: string) => {
  const normalized = name.toLowerCase();
  if (
    normalized.includes("iphone") ||
    normalized.includes("dell") ||
    normalized.includes("samsung") ||
    normalized.includes("galaxy") ||
    normalized.includes("laptop")
  )
    return "electronics";
  if (
    normalized.includes("printer") ||
    normalized.includes("paper") ||
    normalized.includes("stationery")
  )
    return "office supplies";
  if (normalized.includes("camera") || normalized.includes("cctv"))
    return "security";
  if (normalized.includes("router") || normalized.includes("switch"))
    return "networking";
  return "general";
};

const vendorMatchesItem = (vendorCategory: string, itemName: string) => {
  const vendor = vendorCategory.toLowerCase();
  const itemCategory = orderItemCategory(itemName);
  if (itemCategory === "general") return true;
  return vendor.includes(itemCategory) || itemCategory.includes(vendor);
};

const stableSeedFromText = (text: string) => {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) % 100000;
  }
  return hash;
};

type VendorMatchMetric = {
  vendorId: string;
  availableQty: number;
  pricePerUnit: number;
  estDeliveryDays: number;
  availabilityScore: number;
  weightedScore: number;
};

const deriveVendorMetrics = (
  vendorId: string,
  itemId: string,
  unitPrice: number,
  quantity: number,
  refreshTick: number,
): VendorMatchMetric => {
  const seed = stableSeedFromText(`${vendorId}-${itemId}-${refreshTick}`);
  const capacityBoost = (seed % 5) * 10;
  const availableQty = Math.max(quantity, quantity + 10 + capacityBoost);
  const priceVariance = ((seed % 9) - 4) * 0.012;
  const pricePerUnit = Math.max(1, Math.round(unitPrice * (1 + priceVariance)));
  const estDeliveryDays = 1 + (seed % 4);

  const quantityFit = Math.min(100, Math.round((availableQty / quantity) * 80));
  const costScore = Math.max(
    0,
    Math.round(
      100 - ((pricePerUnit - unitPrice) / Math.max(unitPrice, 1)) * 100,
    ),
  );
  const deliveryScore = Math.max(0, 100 - estDeliveryDays * 15);
  const availabilityScore = Math.max(
    55,
    Math.min(
      99,
      Math.round(quantityFit * 0.35 + costScore * 0.35 + deliveryScore * 0.3),
    ),
  );

  return {
    vendorId,
    availableQty,
    pricePerUnit,
    estDeliveryDays,
    availabilityScore,
    weightedScore: availabilityScore,
  };
};

const poItemMatchesOrderItem = (
  poItem: PurchaseOrderItem,
  orderItemId: string,
) => {
  if (poItem.sourceOrderItemId === orderItemId) return true;
  if (poItem.id === orderItemId) return true;
  if (poItem.id.endsWith(`-${orderItemId}`)) return true;
  return false;
};

const formatTimelineDate = (value: string) =>
  new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function OrderDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const {
    orders,
    vendors,
    clients,
    updateOrder,
    assignOrderVendor,
    addAuditEntry,
    isCoreDataLoading,
    coreDataError,
  } = useData();
  const { user, isOwner } = useAuth();
  const order = orders.find((o) => o.id === id);
  const vendorContextId = searchParams.get("vendorId") || "";
  const vendorContext =
    vendors.find((vendor) => vendor.id === vendorContextId) || null;
  const isVendorScopedView = Boolean(vendorContext && vendorContextId);
  const isProcurePath = location.pathname.startsWith("/procure/");
  const [newComment, setNewComment] = useState("");
  const [slaTime, setSlaTime] = useState("00:00:00");
  const [slaSetHours, setSlaSetHours] = useState("0");
  const [slaSetMinutes, setSlaSetMinutes] = useState("30");
  const [showMailComposer, setShowMailComposer] = useState(false);
  const [mailRecipientType, setMailRecipientType] = useState<
    "vendor" | "client" | "all"
  >("all");
  const [commentFilter, setCommentFilter] = useState<
    "all" | "internal" | "external"
  >("all");
  const [visibleCommentCount, setVisibleCommentCount] = useState(30);
  const [visibleAttachmentCount, setVisibleAttachmentCount] = useState(24);
  const [selectedSubOrder, setSelectedSubOrder] = useState<SubOrder | null>(
    null,
  );
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [vendorByItemId, setVendorByItemId] = useState<Record<string, string>>(
    {},
  );
  const [vendorRefreshTick, setVendorRefreshTick] = useState(0);
  const [poRefreshTick, setPoRefreshTick] = useState(0);

  const isDelivered = order?.status === "Delivered";
  const isProcurementLocked = PROCUREMENT_LOCKED_STATUSES.has(
    String(order?.status || "").toLowerCase(),
  );
  const canSetSlaTimer =
    isOwner || ["admin", "procurement_manager"].includes(user?.role || "");
  const canSetSlaAnytime = isOwner;

  const subOrders: SubOrder[] = useMemo(() => {
    if (!order) return [];
    const sourceItems = Array.isArray(order.items) ? order.items : [];
    return sourceItems.map((item, i) => {
      const category =
        item.name.includes("iPhone") ||
        item.name.includes("Dell") ||
        item.name.includes("Samsung") ||
        item.name.includes("Galaxy")
          ? "Electronics"
          : item.name.includes("Printer") || item.name.includes("Paper")
            ? "Office Supplies"
            : item.name.includes("Chair") || item.name.includes("Desk")
              ? "Furniture"
              : item.name.includes("Camera") || item.name.includes("CCTV")
                ? "Security"
                : item.name.includes("Switch") || item.name.includes("Router")
                  ? "Networking"
                  : "General";
      // Simulate slightly different SLA statuses per sub-order
      const slaStatuses: ("within_sla" | "at_risk" | "breached")[] = [
        "within_sla",
        "at_risk",
        "breached",
      ];
      const subSla = isDelivered
        ? "within_sla"
        : order.slaStatus === "within_sla"
          ? slaStatuses[i % 2]
          : order.slaStatus;
      return {
        subOrderId: `${normalizeOrderCode(order.orderNumber)}-${i + 1}`,
        category,
        item: {
          name: item.name,
          quantity: item.quantity,
          price: item.pricePerItem,
          total: item.totalCost,
          sku: item.sku,
        },
        slaStartTime: new Date(
          new Date(order.slaStartTime).getTime() + i * 600000,
        ).toISOString(),
        slaStatus: subSla as "within_sla" | "at_risk" | "breached",
        status: order.status,
      };
    });
  }, [order, isDelivered]);

  useEffect(() => {
    if (!order) return;
    if (isDelivered) {
      setSlaTime("COMPLETED");
      return;
    }
    const interval = setInterval(() => {
      const start = new Date(order.slaStartTime).getTime();
      const diff = Date.now() - start;
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setSlaTime(
        `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`,
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [order, isDelivered]);

  useEffect(() => {
    setVisibleCommentCount(30);
    setVisibleAttachmentCount(24);
  }, [id, commentFilter]);

  useEffect(() => {
    if (!order) return;
    const nextAssignments = Object.fromEntries(
      (Array.isArray(order.items) ? order.items : []).map((item) => [
        item.id,
        item.vendorId || "",
      ]),
    );
    setVendorByItemId(nextAssignments);
  }, [order]);

  useEffect(() => {
    if (location.hash !== "#sla-overall") return;
    const timeoutId = window.setTimeout(() => {
      document
        .getElementById("sla-overall")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
    return () => window.clearTimeout(timeoutId);
  }, [location.hash, order?.id]);

  if (isCoreDataLoading)
    return (
      <div className="p-6">
        <p>Loading order details...</p>
        <Button
          className="mt-4"
          onClick={() =>
            navigate(
              isVendorScopedView ? "/vendors/orders" : "/transactions/purchase",
            )
          }
        >
          Back
        </Button>
      </div>
    );

  if (!order)
    return (
      <div className="p-6">
        <p>Order not found.</p>
        <Button
          onClick={() =>
            navigate(
              isVendorScopedView ? "/vendors/orders" : "/transactions/purchase",
            )
          }
        >
          Back to Orders
        </Button>
      </div>
    );

  const connectionWarning = coreDataError ? (
    <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800 flex items-center gap-2">
      <RefreshCw className="h-4 w-4" />
      <span>
        Backend connection issue: {coreDataError}. Showing cached data.
      </span>
    </div>
  ) : null;

  const orderItems = Array.isArray(order.items) ? order.items : [];
  const orderCommentHistory = Array.isArray(order.commentHistory)
    ? order.commentHistory
    : [];
  const orderAttachments = Array.isArray(order.attachments)
    ? order.attachments
    : [];
  const clientRecord =
    clients.find((client) => client.id === order.clientId) ||
    clients.find((client) => client.name === order.organization) ||
    null;
  const vendorScopedItemIds = isVendorScopedView
    ? Object.entries(vendorByItemId)
        .filter(([, assignedVendorId]) => assignedVendorId === vendorContextId)
        .map(([itemId]) => itemId)
    : [];
  const scopedOrderItems = isVendorScopedView
    ? orderItems.filter((item) => vendorScopedItemIds.includes(item.id))
    : orderItems;

  const handleStatusUpdate = (status: string) => {
    updateOrder(order.id, { status });
    addAuditEntry({
      user: user?.name || "System",
      action: "Order Status Updated",
      module: "Procure",
      details: `Order ${formattedOrderNumber} status changed to ${status}`,
      ipAddress: "192.168.1.1",
      status: "success",
    });
    toast({
      title: "Status Updated",
      description: `Order status changed to ${status}`,
    });
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const comment = {
      id: `c-${Date.now()}`,
      user: user?.name || "User",
      text: newComment,
      timestamp: new Date().toISOString(),
      type: "internal" as const,
    };
    updateOrder(order.id, {
      comments: newComment,
      commentHistory: [...orderCommentHistory, comment],
    });
    setNewComment("");
    toast({ title: "Comment Added" });
  };

  const handleDownload = (filename: string) => {
    const content = `This is a sample document: ${filename}\nOrder: ${formattedOrderNumber}\nDate: ${order.orderDate}`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: "Downloaded",
      description: `${filename} downloaded successfully`,
    });
  };

  const handlePreview = (filename: string) =>
    toast({ title: "Preview", description: `Previewing ${filename}` });

  const filteredComments = orderCommentHistory.filter(
    (c) => commentFilter === "all" || c.type === commentFilter,
  );
  const visibleComments = filteredComments.slice(
    Math.max(0, filteredComments.length - visibleCommentCount),
  );
  const visibleAttachments = orderAttachments.slice(0, visibleAttachmentCount);
  const STATUS_COLORS: Record<string, string> = {
    Pending: "#F59E0B",
    Processing: "#F97316",
    Approved: "#10B981",
    Shipped: "#3B82F6",
    Delivered: "#059669",
    Cancelled: "#EF4444",
  };

  const getFileIcon = (filename: string) => {
    if (filename.match(/\.(pdf|doc|docx)$/i))
      return <FileText className="h-4 w-4 text-destructive" />;
    if (filename.match(/\.(jpg|png|gif|svg)$/i))
      return <Image className="h-4 w-4 text-blue-500" />;
    return <Paperclip className="h-4 w-4 text-muted-foreground" />;
  };

  const isBulkOrder = scopedOrderItems.length > 1;
  const formattedOrderNumber = normalizeOrderCode(order.orderNumber);
  const masterOrderId = formattedOrderNumber;
  const scopedSubOrders = isVendorScopedView
    ? subOrders.filter((_, index) => {
        const itemId = orderItems[index]?.id;
        return Boolean(itemId && vendorScopedItemIds.includes(itemId));
      })
    : subOrders;
  const scopedTotalAmount = scopedOrderItems.reduce(
    (sum, item) => sum + item.totalCost,
    0,
  );

  const selectedItems = scopedOrderItems.filter((item) =>
    selectedItemIds.includes(item.id),
  );

  const existingPurchaseOrders = useMemo(() => {
    const normalizedOrder = normalizeOrderCode(order.orderNumber);
    return safeReadJson<PurchaseOrderEntry[]>(
      PURCHASE_ORDER_STORAGE_KEY,
      [],
    ).filter((entry) => {
      const sourceOrder = normalizeOrderCode(entry.sourceOrderNumber || "");
      return sourceOrder === normalizedOrder;
    });
  }, [order.orderNumber, poRefreshTick]);

  const activePoItemIds = useMemo(() => {
    const ids = new Set<string>();
    existingPurchaseOrders.forEach((entry) => {
      const statusValue = String((entry as { status?: string }).status || "")
        .trim()
        .toLowerCase();
      const isCancelled =
        statusValue === "cancelled" || statusValue === "canceled";
      if (isCancelled) return;
      entry.items.forEach((poItem) => {
        scopedOrderItems.forEach((item) => {
          if (poItemMatchesOrderItem(poItem, item.id)) {
            ids.add(item.id);
          }
        });
      });
    });
    return ids;
  }, [existingPurchaseOrders, scopedOrderItems]);

  const allItemsAssigned =
    scopedOrderItems.length > 0 &&
    scopedOrderItems.every(
      (item) =>
        item.vendorId ||
        vendorByItemId[item.id] ||
        activePoItemIds.has(item.id),
    );
  const showSimplifiedView =
    !isVendorScopedView &&
    !allItemsAssigned &&
    !isDelivered &&
    !isProcurementLocked;

  const isItemProcurementLocked = (itemId: string) =>
    activePoItemIds.has(itemId);

  const buildVendorRowsForItem = (item: (typeof orderItems)[number]) => {
    const basePool = vendors.filter((vendor) =>
      vendorMatchesItem(vendor.category, item.name),
    );
    const pool = basePool.length > 0 ? basePool : vendors;

    return pool
      .map((vendor) => {
        const metric = deriveVendorMetrics(
          vendor.id,
          item.id,
          item.pricePerItem,
          item.quantity,
          vendorRefreshTick,
        );
        return { vendor, metric };
      })
      .sort((a, b) => b.metric.weightedScore - a.metric.weightedScore);
  };

  const resolveVendorIdForItem = (item: (typeof orderItems)[number]) =>
    vendorByItemId[item.id] || buildVendorRowsForItem(item)[0]?.vendor.id || "";

  const itemWiseTracking = useMemo(() => {
    const statusToStage: Record<string, number> = {
      Pending: 0,
      New: 0,
      Approved: 1,
      Processing: 1,
      Shipped: order.trackingNumber ? 3 : 2,
      "Out for Delivery": 3,
      "Out For Delivery": 3,
      Completed: 4,
      Delivered: 4,
    };

    const currentStage = isDelivered
      ? 4
      : (statusToStage[order.status] ?? (order.trackingNumber ? 3 : 1));

    const stageLabels = [
      "Order Created",
      "Confirmed",
      "Shipped",
      "Out for Delivery",
      "Delivered",
    ];

    const eligibleItems = scopedOrderItems.filter(
      (item) => vendorByItemId[item.id] || activePoItemIds.has(item.id),
    );

    return eligibleItems.map((item, index) => ({
      item,
      stages: stageLabels.map((label, stageIndex) => {
        let state: "done" | "current" | "pending" = "pending";
        if (stageIndex < currentStage) state = "done";
        if (stageIndex === currentStage) state = "current";
        return {
          label,
          state,
          etaHint:
            stageIndex <= currentStage
              ? "Completed"
              : `${Math.max(1, stageIndex - currentStage)} step(s) remaining`,
        };
      }),
      progress: Math.round(((currentStage + 1) / stageLabels.length) * 100),
      rowCode: `${formattedOrderNumber}-${index + 1}`,
    }));
  }, [
    isDelivered,
    order.status,
    order.trackingNumber,
    scopedOrderItems,
    order.orderNumber,
    vendorByItemId,
    activePoItemIds,
  ]);

  const vendorProcurementTimeline = useMemo(() => {
    const statusToStageIndex: Record<string, number> = {
      Pending: 0,
      New: 0,
      Approved: 1,
      Processing: 2,
      Shipped: 3,
      Delivered: 5,
      Completed: 5,
      Cancelled: 0,
    };

    const current = isDelivered ? 5 : (statusToStageIndex[order.status] ?? 2);
    const steps = [
      "Order Created",
      "PO Created",
      "Sent to Vendor",
      "Acknowledged",
      "Split Shipment",
      "Delivered",
    ];

    return steps.map((step, index) => ({
      step,
      state:
        index < current ? "done" : index === current ? "current" : "pending",
    }));
  }, [isDelivered, order.status]);

  const matchingVendors = useMemo(() => {
    if (selectedItems.length === 0) return [];
    return vendors.filter((vendor) =>
      selectedItems.some((item) =>
        vendorMatchesItem(vendor.category, item.name),
      ),
    );
  }, [selectedItems, vendors]);

  const toggleItemSelection = (itemId: string) => {
    if (isProcurementLocked) {
      toast({
        title: "Order is locked",
        description:
          "Rejected or cancelled orders cannot be selected for vendor assignment.",
      });
      return;
    }
    setSelectedItemIds((prev) =>
      prev.includes(itemId)
        ? prev.filter((idEntry) => idEntry !== itemId)
        : [...prev, itemId],
    );
  };

  const toggleSelectAllItems = (checked: boolean) => {
    if (isProcurementLocked) {
      toast({
        title: "Order is locked",
        description:
          "Rejected or cancelled orders cannot be selected for vendor assignment.",
      });
      return;
    }
    if (checked) {
      setSelectedItemIds(scopedOrderItems.map((item) => item.id));
      return;
    }
    setSelectedItemIds([]);
  };

  const handleCreatePurchaseOrders = () => {
    if (isProcurementLocked) {
      toast({
        title: "Procurement blocked",
        description:
          "Vendor assignment and purchase order creation are disabled for rejected/cancelled orders.",
      });
      return;
    }

    if (selectedItems.length === 0) {
      toast({ title: "Select at least one item to create purchase orders" });
      return;
    }

    const lockedItems = selectedItems.filter((item) =>
      isItemProcurementLocked(item.id),
    );
    if (lockedItems.length > 0) {
      toast({
        title: "Purchase order already exists",
        description: `${lockedItems.length} selected item(s) already have an active PO. Cancel that PO first to regenerate.`,
      });
      return;
    }

    const pendingVendorItems = selectedItems.filter(
      (item) => !resolveVendorIdForItem(item),
    );
    if (pendingVendorItems.length > 0) {
      toast({ title: "Assign a vendor for each selected item" });
      return;
    }

    const existingOrders = safeReadJson<PurchaseOrderEntry[]>(
      PURCHASE_ORDER_STORAGE_KEY,
      [],
    );
    let runningEntries = [...existingOrders];

    const today = new Date().toISOString().slice(0, 10);
    const day = new Date();
    const delivery = new Date(day.getTime() + 5 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    const newPurchaseOrders = selectedItems.map((item) => {
      const vendorId = resolveVendorIdForItem(item);
      const vendor = vendors.find((entry) => entry.id === vendorId);
      const poNumber = nextPoNumber(runningEntries);

      const poEntry: PurchaseOrderEntry = {
        id: `po-${Date.now()}-${item.id}`,
        poNumber,
        sourceOrderNumber: formattedOrderNumber,
        referenceNumber: formattedOrderNumber,
        vendorName: vendor?.name || "Assigned Vendor",
        vendorAddress: vendor?.address || "Vendor address pending",
        deliveryAddressType: "Organization",
        deliveryAddress: order.shippingAddress,
        date: today.split("-").reverse().join("/"),
        deliveryDate: delivery.split("-").reverse().join("/"),
        paymentTerms: "Due on Receipt",
        shipmentPreference: "Any",
        includeInterStateGst: false,
        status: "ISSUED",
        billedStatus: "YET TO BE BILLED",
        receiveStatus: "YET TO BE RECEIVED",
        discountPercent: 0,
        adjustment: 0,
        notes: `Auto-created from procure order ${formattedOrderNumber}`,
        termsAndConditions: "PO should be accepted within 3 business days.",
        attachmentType: "Upload File",
        items: [
          {
            id: item.id,
            sourceOrderItemId: item.id,
            itemName: item.name,
            description: item.description,
            account: "Materials",
            hsnSac: "8517",
            quantity: item.quantity,
            rate: item.pricePerItem,
            taxPercent: 18,
          },
        ],
      };

      runningEntries = [poEntry, ...runningEntries];
      return poEntry;
    });

    localStorage.setItem(
      PURCHASE_ORDER_STORAGE_KEY,
      JSON.stringify([...newPurchaseOrders, ...existingOrders]),
    );

    updateOrder(order.id, {
      status: "Processing",
      comments: `Purchase orders created: ${newPurchaseOrders.map((entry) => entry.poNumber).join(", ")}`,
      commentHistory: [
        ...orderCommentHistory,
        {
          id: `c-${Date.now()}-po`,
          user: user?.name || "System Owner",
          text: `Created ${newPurchaseOrders.length} purchase order(s): ${newPurchaseOrders
            .map((entry) => entry.poNumber)
            .join(", ")}`,
          timestamp: new Date().toISOString(),
          type: "internal",
        },
      ],
    });

    addAuditEntry({
      user: user?.name || "System Owner",
      action: "Purchase Orders Created",
      module: "Procure",
      details: `Order ${formattedOrderNumber}: ${newPurchaseOrders
        .map((entry) => entry.poNumber)
        .join(", ")}`,
      ipAddress: "192.168.1.1",
      status: "success",
    });

    toast({
      title: "Purchase Orders Created",
      description: `${newPurchaseOrders.length} PO(s) created and moved to Purchase Orders list.`,
    });
    setPoRefreshTick((prev) => prev + 1);
    navigate("/transactions/purchase/purchase-orders");
  };

  const handleRefreshVendorRecommendations = () => {
    if (isProcurementLocked) {
      toast({
        title: "Procurement blocked",
        description:
          "Rejected/cancelled orders cannot refresh vendor recommendations.",
      });
      return;
    }
    if (selectedItems.length === 0) {
      toast({
        title: "Select at least one item to refresh vendor recommendations",
      });
      return;
    }
    setVendorRefreshTick((prev) => prev + 1);
    toast({ title: "Vendor recommendations refreshed" });
  };

  const getSlaColor = (status: string) => {
    if (isDelivered)
      return "bg-emerald-100 text-emerald-700 border-emerald-300";
    if (status === "within_sla")
      return "bg-emerald-100 text-emerald-700 border-emerald-300";
    if (status === "at_risk")
      return "bg-amber-100 text-amber-700 border-amber-300";
    return "bg-red-100 text-red-700 border-red-300";
  };

  const requestorEmail =
    clientRecord?.email ||
    `${order.organization.toLowerCase().replace(/[^a-z0-9]+/g, ".")}@corpessentials.com`;
  const requestorPhone =
    clientRecord?.contactNumber ||
    clientRecord?.phone ||
    "+1 (408) 035-3779673";
  const requestorLocation = clientRecord?.locationDetails
    ? [
        clientRecord.locationDetails.city,
        clientRecord.locationDetails.state,
        clientRecord.locationDetails.country,
      ]
        .filter(Boolean)
        .join(", ")
    : clientRecord?.address || order.shippingAddress;
  const requestorWebsite = clientRecord
    ? `www.${clientRecord.name.toLowerCase().replace(/[^a-z0-9]+/g, "")}.com`
    : "www.corpessentials.com";

  const purchaseOrdersForVendor = isVendorScopedView
    ? existingPurchaseOrders.filter(
        (entry) => entry.vendorName === vendorContext?.name,
      )
    : existingPurchaseOrders;
  const primaryPurchaseOrder = purchaseOrdersForVendor[0] || null;

  const orderActivityTimeline = useMemo(() => {
    const baseTimeline = [
      {
        id: "activity-created",
        title: "Order Created",
        subtitle: `by ${order.requestingUser}`,
        timestamp: new Date(
          order.orderDate || order.slaStartTime,
        ).toISOString(),
      },
      {
        id: "activity-assigned",
        title: isVendorScopedView ? "Sent to Vendor" : "Sent to Vendors",
        subtitle: `by ${user?.name || "System"}`,
        timestamp: order.slaStartTime,
      },
    ];

    if (primaryPurchaseOrder) {
      baseTimeline.push({
        id: "activity-po",
        title: isVendorScopedView ? "Vendor Confirmed" : "POs Generated",
        subtitle: primaryPurchaseOrder.poNumber,
        timestamp: order.slaStartTime,
      });
    }

    if (order.status.toLowerCase() !== "pending") {
      baseTimeline.push({
        id: "activity-status",
        title: order.status,
        subtitle: "Latest master status",
        timestamp: new Date(
          new Date(order.slaStartTime).getTime() + 2 * 3600000,
        ).toISOString(),
      });
    }

    orderCommentHistory.slice(-4).forEach((comment) => {
      baseTimeline.push({
        id: comment.id,
        title:
          comment.type === "internal" ? "Internal update" : "Client update",
        subtitle: `by ${comment.user}`,
        timestamp: comment.timestamp,
      });
    });

    return baseTimeline
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      )
      .slice(-6)
      .reverse();
  }, [
    isVendorScopedView,
    order.orderDate,
    order.requestingUser,
    order.slaStartTime,
    order.status,
    orderCommentHistory,
    primaryPurchaseOrder,
    user?.name,
  ]);

  const masterStatusSteps = [
    {
      label: "Processing",
      caption: new Date(order.slaStartTime).toLocaleDateString(),
      state: "done",
    },
    {
      label: scopedOrderItems.some((item) => item.vendorId)
        ? "Partially Shipped"
        : "Awaiting Vendor",
      caption: scopedOrderItems.some((item) => item.vendorId)
        ? "In Progress"
        : "Pending",
      state: scopedOrderItems.some((item) => item.vendorId)
        ? "current"
        : "pending",
    },
    {
      label: "Partially Delivered",
      caption:
        order.status === "Delivered" || order.status === "Completed"
          ? "Reached"
          : "Pending",
      state:
        order.status === "Delivered" || order.status === "Completed"
          ? "done"
          : "pending",
    },
    {
      label: "Delivered",
      caption:
        order.status === "Delivered" || order.status === "Completed"
          ? "Completed"
          : "Pending",
      state:
        order.status === "Delivered" || order.status === "Completed"
          ? "done"
          : "pending",
    },
  ];

  const vendorStatusSteps = [
    "Confirmed",
    "Processing",
    "Shipped",
    "Out for Delivery",
    "Delivered",
    "Closed",
  ].map((label, index) => {
    const statusValue = String(order.status || "").toLowerCase();
    const currentIndex =
      statusValue === "processing"
        ? 1
        : statusValue === "shipped"
          ? 2
          : statusValue.includes("delivery")
            ? 3
            : statusValue === "delivered" || statusValue === "completed"
              ? 4
              : 1;
    return {
      label,
      caption:
        index < currentIndex
          ? new Date(order.slaStartTime).toLocaleDateString()
          : index === currentIndex
            ? "In Progress"
            : "Pending",
      state:
        index < currentIndex
          ? "done"
          : index === currentIndex
            ? "current"
            : "pending",
    };
  });

  return (
    <div>
      <Header title="Order History" />
      <div className="p-6 space-y-6 animate-fade-in">
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            isVendorScopedView
              ? navigate(`/vendors/${vendorContextId}`)
              : navigate("/orders")
          }
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {isVendorScopedView ? "Back to Vendor Orders" : "Back to Orders"}
        </Button>

        {connectionWarning}

        {/* ⏱️ SLA Banner — Top of Page (Client View Only) */}
        {!isVendorScopedView && (
          <Card className="rounded-2xl border-blue-200 bg-gradient-to-r from-blue-50 via-white to-sky-50 shadow-sm overflow-hidden">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-blue-200 bg-white text-primary">
                    <Timer className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Live SLA Timer
                    </p>
                    <p className="text-2xl font-mono font-bold text-primary">
                      {slaTime}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        className={cn(
                          order.slaStatus === "within_sla"
                            ? "bg-emerald-100 text-emerald-700 border-emerald-300"
                            : order.slaStatus === "at_risk"
                              ? "bg-amber-100 text-amber-700 border-amber-300"
                              : "bg-red-100 text-red-700 border-red-300",
                        )}
                        variant="outline"
                      >
                        {order.slaStatus.replace("_", " ")}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Order #{formattedOrderNumber}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={order.status}
                    onValueChange={handleStatusUpdate}
                  >
                    <SelectTrigger className="w-[160px] h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Processing">Processing</SelectItem>
                      <SelectItem value="Shipped">Shipped</SelectItem>
                      <SelectItem value="Delivered">Delivered</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  {canSetSlaTimer && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => {
                        updateOrder(order.id, {
                          slaStartTime: new Date().toISOString(),
                          slaStatus: "within_sla",
                        });
                        toast({ title: "SLA reset to now" });
                      }}
                    >
                      <RefreshCw className="h-3.5 w-3.5" /> Reset SLA
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {isVendorScopedView ? "Vendor Purchase Order" : "Order Details"}{" "}
                /
                <span className="ml-1 font-semibold text-foreground">
                  {isVendorScopedView
                    ? primaryPurchaseOrder?.poNumber || formattedOrderNumber
                    : formattedOrderNumber}
                </span>
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
                  {isVendorScopedView
                    ? `Vendor Purchase Order / ${
                        primaryPurchaseOrder?.poNumber || formattedOrderNumber
                      }`
                    : `Order Details / ${formattedOrderNumber}`}
                </h1>
                <Badge
                  className={cn(
                    "rounded-full px-3 py-1 text-sm",
                    order.status === "Delivered" || order.status === "Completed"
                      ? "bg-emerald-100 text-emerald-700"
                      : order.status === "Processing" ||
                          order.status === "Approved"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-amber-100 text-amber-700",
                  )}
                >
                  {order.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {isVendorScopedView
                  ? `Master Order • ${formattedOrderNumber} • Vendor: ${
                      vendorContext?.name ||
                      primaryPurchaseOrder?.vendorName ||
                      "Assigned Vendor"
                    } • Created on ${order.orderDate}`
                  : `Master Order • Created on ${order.orderDate} • Requested by ${order.requestingUser}`}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="gap-2">
                <ClipboardList className="h-4 w-4" />
                {isVendorScopedView ? "Print PO" : "Edit Order"}
              </Button>
              <Select onValueChange={handleStatusUpdate} value={order.status}>
                <SelectTrigger className="w-[180px] bg-primary text-primary-foreground">
                  <SelectValue placeholder="Update Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Processing">Processing</SelectItem>
                  <SelectItem value="Shipped">Shipped</SelectItem>
                  <SelectItem value="Delivered">Delivered</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isVendorScopedView ? (
            <>
              <div className="grid gap-4 xl:grid-cols-[repeat(4,minmax(0,1fr))_260px]">
                <Card className="rounded-2xl border-slate-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">
                      Vendor Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {vendorContext?.name ||
                          primaryPurchaseOrder?.vendorName ||
                          "Assigned Vendor"}
                      </span>
                      <Button variant="outline" size="sm">
                        View Vendor
                      </Button>
                    </div>
                    <p className="text-muted-foreground">
                      {vendorContext?.contactEmail || "sales@vendor.com"}
                    </p>
                    <p className="text-muted-foreground">
                      {vendorContext?.contactPhone || "+1 (408) 555-1234"}
                    </p>
                    <p className="text-muted-foreground">
                      {vendorContext?.address || "Vendor address pending"}
                    </p>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">PO Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">PO Number</span>
                      <span className="font-semibold">
                        {primaryPurchaseOrder?.poNumber || formattedOrderNumber}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">PO Date</span>
                      <span>{order.orderDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Payment Terms
                      </span>
                      <span>
                        {primaryPurchaseOrder?.paymentTerms || "Net 30"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Currency</span>
                      <span>USD</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">
                      Billing Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <p className="text-muted-foreground">
                      {order.billingAddress}
                    </p>
                    <div>
                      <p className="font-medium">Payment Method</p>
                      <p className="text-muted-foreground">
                        {order.paymentMethod}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Payment Terms</p>
                      <p className="text-muted-foreground">
                        {primaryPurchaseOrder?.paymentTerms || "Net 30"}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">
                      Shipping Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <p className="text-muted-foreground">
                      {order.shippingAddress}
                    </p>
                    <div>
                      <p className="font-medium">Delivery Method</p>
                      <p className="text-muted-foreground">
                        {order.deliveryMethod}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Requested Delivery</p>
                      <p className="text-muted-foreground">{order.orderDate}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Items</span>
                      <span className="font-semibold">
                        {scopedOrderItems.length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sub Total</span>
                      <span>${scopedTotalAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax (10%)</span>
                      <span>
                        ${Math.round(scopedTotalAmount * 0.1).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-base font-semibold">
                      <span>Total Amount</span>
                      <span>
                        ${Math.round(scopedTotalAmount * 1.1).toLocaleString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <>
              <div className="grid gap-4 xl:grid-cols-[repeat(4,minmax(0,1fr))]">
                <Card className="rounded-2xl border-slate-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">
                      Billing Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <p className="text-muted-foreground">
                      {order.billingAddress}
                    </p>
                    <div>
                      <p className="font-medium">Payment Method</p>
                      <p className="text-muted-foreground">
                        {order.paymentMethod}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Payment Terms</p>
                      <p className="text-muted-foreground">Net 30</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">
                      Shipping Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <p className="text-muted-foreground">
                      {order.shippingAddress}
                    </p>
                    <div>
                      <p className="font-medium">Delivery Method</p>
                      <p className="text-muted-foreground">
                        {order.deliveryMethod}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Requested Delivery</p>
                      <p className="text-muted-foreground">{order.orderDate}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">
                      Requestor / Client Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div>
                      <p className="font-medium">{order.requestingUser}</p>
                      <p className="text-muted-foreground">{requestorEmail}</p>
                    </div>
                    <p className="text-muted-foreground">{requestorPhone}</p>
                    <p className="text-muted-foreground">
                      {order.organization}
                    </p>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Master Order ID
                      </span>
                      <span className="font-semibold">
                        {formattedOrderNumber}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sub Orders</span>
                      <span>{scopedOrderItems.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Items</span>
                      <span>{orderItems.length}</span>
                    </div>
                    <div className="flex justify-between text-base font-semibold">
                      <span>Total Amount</span>
                      <span>${order.totalAmount.toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
                <Card
                  id="sla-overall"
                  className="rounded-2xl border-blue-100 bg-gradient-to-br from-blue-50 via-white to-sky-50 shadow-sm"
                >
                  <CardContent className="space-y-5 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-blue-200 bg-white text-primary">
                          <Truck className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Master Order Status
                          </p>
                          <p className="text-2xl font-semibold text-primary">
                            {scopedOrderItems.some((item) => item.vendorId)
                              ? "Partially Shipped"
                              : "Processing"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {
                              scopedOrderItems.filter((item) => item.vendorId)
                                .length
                            }{" "}
                            of {scopedOrderItems.length} sub-orders assigned to
                            vendors
                          </p>
                        </div>
                      </div>
                      <Select
                        value={order.status}
                        onValueChange={handleStatusUpdate}
                      >
                        <SelectTrigger className="w-[190px]">
                          <SelectValue placeholder="Update Master Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Processing">Processing</SelectItem>
                          <SelectItem value="Shipped">
                            Partially Shipped
                          </SelectItem>
                          <SelectItem value="Delivered">Delivered</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-4 md:grid-cols-4">
                      {masterStatusSteps.map((step) => (
                        <div key={step.label} className="text-center">
                          <div
                            className={cn(
                              "mx-auto flex h-12 w-12 items-center justify-center rounded-full border-2",
                              step.state === "done" &&
                                "border-emerald-300 bg-emerald-100 text-emerald-700",
                              step.state === "current" &&
                                "border-blue-300 bg-blue-100 text-blue-700",
                              step.state === "pending" &&
                                "border-slate-200 bg-white text-slate-400",
                            )}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </div>
                          <p className="mt-3 text-sm font-medium">
                            {step.label}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {step.caption}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  <Card className="rounded-2xl border-slate-200 shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">
                        Vendor Purchase Orders
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      {existingPurchaseOrders.length === 0 && (
                        <p className="text-muted-foreground">
                          No vendor purchase orders created yet.
                        </p>
                      )}
                      {existingPurchaseOrders.slice(0, 3).map((po) => (
                        <div
                          key={po.id}
                          className="rounded-2xl border border-slate-100 p-3"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-primary">
                                {po.poNumber}
                              </p>
                              <p className="text-muted-foreground">
                                {po.vendorName}
                              </p>
                            </div>
                            <Button variant="outline" size="sm">
                              View PO
                            </Button>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-slate-200 shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">
                        Order Activity Timeline
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                      {orderActivityTimeline.map((entry) => (
                        <div key={entry.id} className="flex gap-3">
                          <span className="mt-1 h-3 w-3 rounded-full bg-primary" />
                          <div>
                            <p className="font-medium">{entry.title}</p>
                            <p className="text-muted-foreground">
                              {formatTimelineDate(entry.timestamp)} •{" "}
                              {entry.subtitle}
                            </p>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Item Details */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              {isBulkOrder && <Package className="h-4 w-4 text-primary" />}
              {isBulkOrder ? "Sub-Order Details" : "Item Details"}
              {isBulkOrder && (
                <span className="text-xs text-muted-foreground ml-2">
                  (click Sub Order ID for SLA info)
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  {!isVendorScopedView && (
                    <TableHead className="w-10">
                      <Checkbox
                        checked={
                          scopedOrderItems.length > 0 &&
                          selectedItemIds.length === scopedOrderItems.length
                        }
                        onCheckedChange={(checked) =>
                          toggleSelectAllItems(Boolean(checked))
                        }
                      />
                    </TableHead>
                  )}
                  <TableHead>
                    {isBulkOrder ? "Sub Order ID" : "Order/Service No."}
                  </TableHead>
                  {isBulkOrder && <TableHead>Category</TableHead>}
                  <TableHead>Item Name / Description</TableHead>
                  <TableHead>Item SKU/specs</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Price per item</TableHead>
                  <TableHead className="text-right">Total item cost</TableHead>
                  {isBulkOrder && <TableHead>SLA</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {scopedOrderItems.map((item, i) => (
                  <TableRow key={item.id}>
                    {!isVendorScopedView && (
                      <TableCell>
                        <Checkbox
                          checked={selectedItemIds.includes(item.id)}
                          disabled={isProcurementLocked}
                          onCheckedChange={() => toggleItemSelection(item.id)}
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      {isBulkOrder ? (
                        <button
                          className="text-primary font-medium font-mono text-xs hover:underline cursor-pointer flex items-center gap-1"
                          onClick={() =>
                            setSelectedSubOrder(scopedSubOrders[i])
                          }
                        >
                          <Timer className="h-3 w-3" />
                          {scopedSubOrders[i]?.subOrderId}
                        </button>
                      ) : (
                        <span className="text-primary font-medium font-mono text-xs">
                          {formattedOrderNumber}
                        </span>
                      )}
                    </TableCell>
                    {isBulkOrder && (
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {scopedSubOrders[i]?.category}
                        </Badge>
                      </TableCell>
                    )}
                    <TableCell>{item.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      SKU/{item.sku}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-right">
                      ${item.pricePerItem.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${item.totalCost.toLocaleString()}
                    </TableCell>
                    {isBulkOrder && (
                      <TableCell>
                        <Badge
                          className={getSlaColor(scopedSubOrders[i]?.slaStatus)}
                          variant="outline"
                        >
                          {isDelivered
                            ? "Completed"
                            : scopedSubOrders[i]?.slaStatus.replace("_", " ")}
                        </Badge>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex justify-end mt-4">
              <div className="text-sm space-y-1 text-right">
                {isBulkOrder &&
                  scopedOrderItems.map((item, i) => (
                    <div
                      key={i}
                      className="flex justify-between gap-8 text-xs text-muted-foreground"
                    >
                      <button
                        className="text-primary hover:underline cursor-pointer"
                        onClick={() => setSelectedSubOrder(scopedSubOrders[i])}
                      >
                        {scopedSubOrders[i]?.subOrderId}
                      </button>
                      <span>${item.totalCost.toLocaleString()}</span>
                    </div>
                  ))}
                <div className="border-t pt-1 flex justify-between gap-8">
                  <span className="font-semibold">
                    {isVendorScopedView
                      ? "Vendor assigned total"
                      : "Overall order total"}
                  </span>
                  <span className="font-bold text-lg">
                    $
                    {(isVendorScopedView
                      ? scopedTotalAmount
                      : order.totalAmount
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-primary/20 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              Item-wise Procurement Tracking Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`grid gap-4 ${isVendorScopedView ? "lg:grid-cols-[1fr_320px]" : "grid-cols-1"}`}
            >
              <div className="space-y-4">
                {itemWiseTracking.length === 0 && (
                  <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                    Timeline appears only for items that have a vendor assigned
                    or an active purchase order.
                  </p>
                )}

                {itemWiseTracking.map(({ item, stages, progress, rowCode }) => (
                  <div
                    key={item.id}
                    className="rounded-xl border bg-background/80 p-4 shadow-sm"
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-foreground">
                          {item.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Ref {rowCode} • SKU/{item.sku} • Qty {item.quantity}
                        </p>
                      </div>
                      <Badge variant="secondary">{progress}% Tracked</Badge>
                    </div>

                    <div className="space-y-3">
                      {stages.map((step, index) => (
                        <div
                          key={`${item.id}-${step.label}`}
                          className="flex gap-3"
                        >
                          <div className="flex w-4 flex-col items-center">
                            {step.state === "done" ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            ) : step.state === "current" ? (
                              <CheckCircle2 className="h-4 w-4 text-blue-600" />
                            ) : (
                              <Circle className="h-4 w-4 text-muted-foreground" />
                            )}
                            {index < stages.length - 1 && (
                              <span className="mt-1 h-6 w-px bg-border" />
                            )}
                          </div>
                          <div
                            className={`rounded-lg border px-3 py-2 text-xs w-full ${
                              step.state === "done"
                                ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                                : step.state === "current"
                                  ? "border-blue-300 bg-blue-50 text-blue-700"
                                  : "border-border bg-muted/30 text-muted-foreground"
                            }`}
                          >
                            <p className="font-semibold">{step.label}</p>
                            <p className="mt-1">{step.etaHint}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {isVendorScopedView && (
                <div className="rounded-xl border bg-background/90 p-4">
                  <p className="text-sm font-semibold mb-3">
                    Procurement Tracking Timeline
                  </p>
                  <div className="space-y-3">
                    {vendorProcurementTimeline.map((entry, index) => (
                      <div key={entry.step} className="flex gap-3">
                        <div className="flex w-4 flex-col items-center">
                          {entry.state === "done" ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          ) : entry.state === "current" ? (
                            <CheckCircle2 className="h-4 w-4 text-blue-600" />
                          ) : (
                            <Circle className="h-4 w-4 text-muted-foreground" />
                          )}
                          {index < vendorProcurementTimeline.length - 1 && (
                            <span className="mt-1 h-6 w-px bg-border" />
                          )}
                        </div>
                        <div className="text-sm">
                          <p className="font-medium">{entry.step}</p>
                          <p className="text-xs text-muted-foreground">
                            {entry.state === "done"
                              ? "Completed"
                              : entry.state === "current"
                                ? "In progress"
                                : "Pending"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {!isVendorScopedView && (
          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Vendor Selection</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={handleRefreshVendorRecommendations}
                  disabled={isProcurementLocked}
                >
                  <RefreshCw className="h-4 w-4" /> Refresh vendors
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Select a vendor to fulfill each selected item using quantity,
                unit price, delivery estimate, and availability score.
              </p>

              <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
                <div className="space-y-3">
                  {selectedItems.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No items selected yet. Tick item checkboxes above to
                      enable vendor assignment.
                    </p>
                  )}

                  {isProcurementLocked && (
                    <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                      Vendor assignment is disabled because this order is in a
                      terminal state ({order.status}).
                    </div>
                  )}

                  {selectedItems.map((item) => {
                    const vendorRows = buildVendorRowsForItem(item);
                    const bestVendor = vendorRows[0]?.vendor;
                    const selectedVendorId = resolveVendorIdForItem(item);

                    return (
                      <div
                        key={item.id}
                        className="rounded-lg border p-3 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              SKU/{item.sku} • Qty {item.quantity} • $
                              {item.totalCost.toLocaleString()}
                            </p>
                            {!!item.description && (
                              <p className="text-xs text-muted-foreground">
                                Specs: {item.description}
                              </p>
                            )}
                          </div>
                          {isItemProcurementLocked(item.id) && (
                            <Badge className="bg-amber-100 text-amber-800">
                              PO already generated
                            </Badge>
                          )}
                        </div>

                        {!!bestVendor && (
                          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                            <span className="font-semibold">
                              Best Vendor: {bestVendor.name}
                            </span>{" "}
                            has been selected based on price, delivery time, and
                            availability score.
                          </div>
                        )}

                        <div className="rounded-lg border overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Vendor Matching Panel</TableHead>
                                <TableHead className="text-right">
                                  Available Qty
                                </TableHead>
                                <TableHead className="text-right">
                                  Price per Unit
                                </TableHead>
                                <TableHead className="text-right">
                                  Est. Delivery Time
                                </TableHead>
                                <TableHead className="text-right">
                                  Availability Score
                                </TableHead>
                                <TableHead className="text-center">
                                  Select
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {vendorRows.map(({ vendor, metric }) => (
                                <TableRow key={`${item.id}-${vendor.id}`}>
                                  <TableCell className="font-medium">
                                    {vendor.name}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {metric.availableQty}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    ${metric.pricePerUnit.toLocaleString()}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {metric.estDeliveryDays}d
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <span className="inline-flex items-center gap-2">
                                      <span className="h-2 w-16 rounded bg-muted">
                                        <span
                                          className="block h-2 rounded bg-emerald-500"
                                          style={{
                                            width: `${Math.min(100, metric.availabilityScore)}%`,
                                          }}
                                        />
                                      </span>
                                      {metric.availabilityScore}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <button
                                      className="inline-flex items-center justify-center"
                                      onClick={() => {
                                        if (isProcurementLocked) {
                                          toast({
                                            title: "Procurement blocked",
                                            description:
                                              "Rejected/cancelled orders cannot assign vendors.",
                                          });
                                          return;
                                        }
                                        if (isItemProcurementLocked(item.id)) {
                                          toast({
                                            title: "Cannot change vendor",
                                            description:
                                              "PO already exists for this item. Cancel it first to reassign vendor.",
                                          });
                                          return;
                                        }
                                        assignOrderVendor(order.id, vendor.id, {
                                          itemId: item.id,
                                          vendorName: vendor.name,
                                        });
                                        setVendorByItemId((prev) => ({
                                          ...prev,
                                          [item.id]: vendor.id,
                                        }));
                                      }}
                                    >
                                      {selectedVendorId === vendor.id ? (
                                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                      ) : (
                                        <Circle className="h-5 w-5 text-muted-foreground" />
                                      )}
                                    </button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>

                        <p className="text-xs text-muted-foreground">
                          The best vendor is recommended using price, estimated
                          delivery time, and availability score. You can
                          manually override before PO generation.
                        </p>
                      </div>
                    );
                  })}
                </div>

                <Card className="border-primary/20 bg-primary/5 rounded-2xl shadow-sm">
                  <CardContent className="pt-4 space-y-2 text-sm">
                    <p className="font-medium">Selection Summary</p>
                    <p className="text-muted-foreground">
                      Items Selected: {selectedItems.length}
                    </p>
                    <p className="text-muted-foreground">
                      Matching Vendors: {matchingVendors.length}
                    </p>
                    <p className="text-muted-foreground">
                      Ready for PO:{" "}
                      {
                        selectedItems.filter(
                          (item) =>
                            resolveVendorIdForItem(item) &&
                            !isItemProcurementLocked(item.id),
                        ).length
                      }
                    </p>

                    <Button
                      className="mt-3 w-full"
                      onClick={handleCreatePurchaseOrders}
                      disabled={
                        selectedItems.length === 0 || isProcurementLocked
                      }
                    >
                      Create Purchase Orders
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setSelectedItemIds([]);
                        if (!isProcurementLocked) {
                          setVendorByItemId({});
                        }
                      }}
                    >
                      Cancel
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        )}

        {isVendorScopedView ? (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px_220px_260px]">
            <Card className="rounded-2xl border-slate-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Activity Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {orderActivityTimeline.map((entry) => (
                  <div key={entry.id} className="flex gap-3">
                    <span className="mt-1 h-3 w-3 rounded-full bg-primary" />
                    <div>
                      <p className="font-medium">{entry.title}</p>
                      <p className="text-muted-foreground">
                        {formatTimelineDate(entry.timestamp)} • {entry.subtitle}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Vendor Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <UserCircle2 className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">
                      {vendorContext?.name || "Assigned Vendor"}
                    </p>
                    <p className="text-muted-foreground">
                      {vendorContext?.category || "Sales Manager"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Mail className="h-4 w-4 text-primary" />
                  <span>
                    {vendorContext?.contactEmail || "sales@vendor.com"}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Phone className="h-4 w-4 text-primary" />
                  <span>
                    {vendorContext?.contactPhone || "+1 (408) 555-1234"}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Related Orders</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Master Order</span>
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                </div>
                <p className="font-semibold text-primary">
                  {formattedOrderNumber}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Sub Orders</span>
                  <span>{scopedOrderItems.length}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-blue-200 bg-gradient-to-br from-blue-50 via-white to-sky-50 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Timer className="h-4 w-4 text-primary" />
                  SLA Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="text-center">
                  <p className="text-2xl font-mono font-bold text-primary">
                    {slaTime}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Live Timer
                  </p>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Status</span>
                  <Badge
                    className={cn(
                      order.slaStatus === "within_sla"
                        ? "bg-emerald-100 text-emerald-700 border-emerald-300"
                        : order.slaStatus === "at_risk"
                          ? "bg-amber-100 text-amber-700 border-amber-300"
                          : "bg-red-100 text-red-700 border-red-300",
                    )}
                    variant="outline"
                  >
                    {order.slaStatus.replace("_", " ")}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order Status</span>
                  <span className="font-medium">{order.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Items</span>
                  <span className="font-medium">{scopedOrderItems.length}</span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Delivery Progress</span>
                    <span className="font-medium text-foreground">
                      {
                        vendorProcurementTimeline.filter(
                          (s) => s.state === "done",
                        ).length
                      }{" "}
                      / {vendorProcurementTimeline.length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="rounded-2xl border-slate-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Requestor Directory</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <UserCircle2 className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">{order.requestingUser}</p>
                    <p className="text-muted-foreground">
                      {order.organization}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Mail className="h-4 w-4 text-primary" />
                  <span>{requestorEmail}</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Phone className="h-4 w-4 text-primary" />
                  <span>{requestorPhone}</span>
                </div>
                <div className="flex items-start gap-3 text-muted-foreground">
                  <MapPin className="mt-0.5 h-4 w-4 text-primary" />
                  <span>{requestorLocation}</span>
                </div>
                <p className="text-muted-foreground">{requestorWebsite}</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">
                  SLA & Assignment Snapshot
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Live SLA</span>
                  <span className="font-semibold">{slaTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SLA Status</span>
                  <span
                    className={
                      order.slaStatus === "within_sla"
                        ? "font-medium text-emerald-600"
                        : order.slaStatus === "at_risk"
                          ? "font-medium text-amber-600"
                          : "font-medium text-rose-600"
                    }
                  >
                    {order.slaStatus.replace("_", " ")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Assigned Analyst
                  </span>
                  <span>{order.assignedAnalyst}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Analyst Team</span>
                  <span>{order.analystTeam}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tracking Number</span>
                  <span className="text-primary">
                    {order.trackingNumber || "Pending"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Comments & Collaboration */}
        {!isVendorScopedView && (
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">
                    Comments & Collaboration
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {orderCommentHistory.length} messages
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Select
                    onValueChange={(v) => {
                      setMailRecipientType(v as "vendor" | "client");
                      setShowMailComposer(true);
                    }}
                  >
                    <SelectTrigger className="h-9 w-auto text-sm gap-2 border-border">
                      <Mail className="h-4 w-4" />
                      <span>Send Email</span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client">Mail to Client</SelectItem>
                      <SelectItem value="vendor">Mail to Vendor</SelectItem>
                      <SelectItem value="all">Mail to Any</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select onValueChange={handleStatusUpdate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Update Status" />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="Processing">Processing</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                {(["all", "internal", "external"] as const).map((f) => (
                  <Button
                    key={f}
                    variant={commentFilter === f ? "default" : "outline"}
                    size="sm"
                    className="text-xs capitalize"
                    onClick={() => setCommentFilter(f)}
                  >
                    {f === "all"
                      ? "All Messages"
                      : f === "internal"
                        ? "Admin/Internal"
                        : "External/Client"}
                  </Button>
                ))}
              </div>

              <ScrollArea className="h-64 pr-4">
                <div className="space-y-4">
                  {visibleComments.map((c) => (
                    <div key={c.id} className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-sm text-primary-foreground font-bold shrink-0">
                        {c.user.charAt(0)}
                      </div>
                      <div className="flex-1 bg-muted/40 rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-sm font-semibold text-foreground">
                            {c.user}
                          </span>
                          <Badge variant="outline" className="text-[10px] h-5">
                            {c.type === "internal" ? "INTERNAL" : "EXTERNAL"}
                          </Badge>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {new Date(c.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-foreground leading-relaxed">
                          {c.text}
                        </p>
                      </div>
                    </div>
                  ))}
                  {filteredComments.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">No messages yet</p>
                    </div>
                  )}
                  {filteredComments.length > visibleComments.length && (
                    <div className="flex justify-center pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setVisibleCommentCount((prev) => prev + 30)
                        }
                      >
                        Load Older Messages
                      </Button>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <Separator />

              <div className="flex gap-3 items-center">
                <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-sm text-primary-foreground font-bold shrink-0">
                  {user?.name?.charAt(0) || "U"}
                </div>
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment or update..."
                  className="flex-1"
                  onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                />
                <Button className="gap-2" onClick={handleAddComment}>
                  <Send className="h-4 w-4" /> Send
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Document Attachments */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Paperclip className="h-4 w-4 text-primary" /> Document
              Attachments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {visibleAttachments.map((a, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors"
                >
                  {getFileIcon(a)}
                  <span className="text-sm text-foreground flex-1 truncate">
                    {a}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-primary/10"
                      onClick={() => handlePreview(a)}
                    >
                      <Eye className="h-4 w-4 text-primary" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-primary/10"
                      onClick={() => handleDownload(a)}
                    >
                      <Download className="h-4 w-4 text-primary" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            {orderAttachments.length > visibleAttachments.length && (
              <div className="mt-4 flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setVisibleAttachmentCount((prev) => prev + 24)}
                >
                  Load More Documents
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Update Order Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 items-center">
              <Select value={order.status} onValueChange={handleStatusUpdate}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Processing">Processing</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sub-Order SLA Detail Dialog */}
      <SubOrderSLADialog
        subOrder={selectedSubOrder}
        isDelivered={isDelivered}
        masterOrderId={masterOrderId}
        onClose={() => setSelectedSubOrder(null)}
      />

      <QuickMailComposer
        open={showMailComposer}
        onClose={() => setShowMailComposer(false)}
        recipientType={mailRecipientType}
      />
    </div>
  );
}

// ── Sub-Order SLA Dialog ──
function SubOrderSLADialog({
  subOrder,
  isDelivered,
  masterOrderId,
  onClose,
}: {
  subOrder: SubOrder | null;
  isDelivered: boolean;
  masterOrderId: string;
  onClose: () => void;
}) {
  const [elapsed, setElapsed] = useState("00:00:00");

  useEffect(() => {
    if (!subOrder) return;
    if (isDelivered) {
      setElapsed("COMPLETED");
      return;
    }
    const interval = setInterval(() => {
      const start = new Date(subOrder.slaStartTime).getTime();
      const diff = Date.now() - start;
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setElapsed(
        `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`,
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [subOrder, isDelivered]);

  if (!subOrder) return null;

  const slaColor = isDelivered
    ? "text-emerald-600"
    : subOrder.slaStatus === "within_sla"
      ? "text-emerald-600"
      : subOrder.slaStatus === "at_risk"
        ? "text-amber-600"
        : "text-red-600";

  const slaBg = isDelivered
    ? "border-emerald-500 bg-emerald-50"
    : subOrder.slaStatus === "within_sla"
      ? "border-emerald-500 bg-emerald-50"
      : subOrder.slaStatus === "at_risk"
        ? "border-amber-500 bg-amber-50"
        : "border-red-500 bg-red-50";

  return (
    <Dialog open={!!subOrder} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="flex items-center gap-3">
            <Timer className="h-5 w-5 text-primary" />
            SLA Details — {subOrder.subOrderId}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {/* Link back to master */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Package className="h-4 w-4" />
            <span>Part of Master Order:</span>
            <span className="font-mono font-bold text-primary">
              {masterOrderId}
            </span>
          </div>

          {/* SLA Timer */}
          <div className="text-center">
            <div
              className={`text-5xl font-mono font-bold tracking-wider border-2 rounded-xl py-5 px-6 inline-block ${slaBg}`}
            >
              {elapsed}
            </div>
            <p className={`text-sm font-medium mt-2 ${slaColor}`}>
              {isDelivered
                ? "SLA Completed"
                : subOrder.slaStatus
                    .replace("_", " ")
                    .replace(/\b\w/g, (c) => c.toUpperCase())}
            </p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sub-Order ID</span>
                <span className="font-mono font-medium">
                  {subOrder.subOrderId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Category</span>
                <Badge variant="outline">{subOrder.category}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium">{subOrder.status}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">SLA Start</span>
                <span>{new Date(subOrder.slaStartTime).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Item</span>
                <span className="font-medium">{subOrder.item.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">SKU</span>
                <span>SKU/{subOrder.item.sku}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Item Summary */}
          <Card className="bg-muted/30 rounded-2xl shadow-sm">
            <CardContent className="p-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">
                      {subOrder.item.name}
                    </TableCell>
                    <TableCell className="text-right">
                      {subOrder.item.quantity}
                    </TableCell>
                    <TableCell className="text-right">
                      ${subOrder.item.price.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      ${subOrder.item.total.toLocaleString()}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
