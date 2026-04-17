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
import { safeReadJson } from "@/lib/storage";
import { normalizeOrderCode } from "@/lib/documentNumbering";
import {
  ArrowLeft,
  BellRing,
  Circle,
  Download,
  Eye,
  Send,
  Paperclip,
  Mail,
  MessageSquare,
  FileText,
  Image,
  Package,
  Timer,
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
const VENDOR_ASSIGNMENT_STORAGE_KEY = "nido_order_vendor_assignments_v1";

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

export default function OrderDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { orders, vendors, updateOrder, addAuditEntry } = useData();
  const { user, isOwner } = useAuth();
  const order = orders.find((o) => o.id === id);
  const vendorContextId = searchParams.get("vendorId") || "";
  const vendorContext =
    vendors.find((vendor) => vendor.id === vendorContextId) || null;
  const isVendorScopedView = Boolean(vendorContext && vendorContextId);
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
    const allAssignments = safeReadJson<Record<string, Record<string, string>>>(
      VENDOR_ASSIGNMENT_STORAGE_KEY,
      {},
    );
    setVendorByItemId(allAssignments[order.id] || {});
  }, [order]);

  useEffect(() => {
    if (!order) return;
    const allAssignments = safeReadJson<Record<string, Record<string, string>>>(
      VENDOR_ASSIGNMENT_STORAGE_KEY,
      {},
    );
    allAssignments[order.id] = vendorByItemId;
    localStorage.setItem(
      VENDOR_ASSIGNMENT_STORAGE_KEY,
      JSON.stringify(allAssignments),
    );
  }, [order, vendorByItemId]);

  useEffect(() => {
    if (location.hash !== "#sla-overall") return;
    const timeoutId = window.setTimeout(() => {
      document
        .getElementById("sla-overall")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
    return () => window.clearTimeout(timeoutId);
  }, [location.hash, order?.id]);

  if (!order)
    return (
      <div className="p-6">
        <p>Order not found.</p>
        <Button onClick={() => navigate("/orders")}>Back to Orders</Button>
      </div>
    );

  const orderItems = Array.isArray(order.items) ? order.items : [];
  const orderCommentHistory = Array.isArray(order.commentHistory)
    ? order.commentHistory
    : [];
  const orderAttachments = Array.isArray(order.attachments)
    ? order.attachments
    : [];
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
    setSelectedItemIds((prev) =>
      prev.includes(itemId)
        ? prev.filter((idEntry) => idEntry !== itemId)
        : [...prev, itemId],
    );
  };

  const toggleSelectAllItems = (checked: boolean) => {
    if (checked) {
      setSelectedItemIds(scopedOrderItems.map((item) => item.id));
      return;
    }
    setSelectedItemIds([]);
  };

  const handleCreatePurchaseOrders = () => {
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

  const handleRefreshSla = () => {
    if (isDelivered) {
      toast({ title: "SLA already completed for delivered order" });
      return;
    }
    const start = new Date(order.slaStartTime).getTime();
    const diff = Date.now() - start;
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    setSlaTime(
      `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`,
    );
    toast({ title: "SLA timer refreshed" });
  };

  const handleResetSla = () => {
    if (isDelivered) {
      toast({ title: "Delivered order SLA cannot be reset" });
      return;
    }
    const nowIso = new Date().toISOString();
    updateOrder(order.id, { slaStartTime: nowIso, slaStatus: "within_sla" });
    setSlaTime("00:00:00");
    toast({ title: "SLA reset", description: "SLA timer restarted from now." });
  };

  const handleSetSlaReminder = () => {
    const reminderTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const reminderText = `Reminder set for SLA follow-up at ${new Date(reminderTime).toLocaleString()}`;
    updateOrder(order.id, {
      commentHistory: [
        ...orderCommentHistory,
        {
          id: `c-${Date.now()}-sla-reminder`,
          user: user?.name || "System",
          text: reminderText,
          timestamp: new Date().toISOString(),
          type: "internal",
        },
      ],
    });
    toast({ title: "Reminder set", description: reminderText });
  };

  const handleSetSlaTimer = () => {
    if (!canSetSlaTimer) {
      toast({
        title: "Not authorized",
        description:
          "Only owner and authorized internal users can set SLA timer.",
      });
      return;
    }

    if (isDelivered && !canSetSlaAnytime) {
      toast({
        title: "SLA locked",
        description: "Only owner can set SLA timer after delivery.",
      });
      return;
    }

    const hours = Math.max(0, Number.parseInt(slaSetHours || "0", 10) || 0);
    const minutes = Math.max(
      0,
      Math.min(59, Number.parseInt(slaSetMinutes || "0", 10) || 0),
    );
    const elapsedMs = (hours * 60 + minutes) * 60 * 1000;

    if (elapsedMs <= 0) {
      toast({
        title: "Invalid SLA timer",
        description: "Set at least 1 minute to apply the SLA timer.",
      });
      return;
    }

    const adjustedStartIso = new Date(Date.now() - elapsedMs).toISOString();
    updateOrder(order.id, {
      slaStartTime: adjustedStartIso,
      slaStatus: "within_sla",
    });
    toast({
      title: "SLA timer set",
      description: `Timer updated to ${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00 elapsed.`,
    });
  };

  const handleRefreshVendorRecommendations = () => {
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

        {/* Master Order Header */}
        {isBulkOrder && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4 flex items-center gap-4">
              <Package className="h-6 w-6 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Master Order
                </p>
                <p className="text-lg font-bold font-mono text-primary">
                  {masterOrderId}
                </p>
              </div>
              <Badge className="ml-auto">{orderItems.length} Sub-Orders</Badge>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order Number</span>
                <span className="font-medium">{formattedOrderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order Date</span>
                <span>{order.orderDate}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Status</span>
                <Badge
                  style={{
                    backgroundColor: STATUS_COLORS[order.status],
                    color: "white",
                  }}
                >
                  {order.status}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Organization</span>
                <span>{order.organization}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Requesting User</span>
                <span>{order.requestingUser}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Approving User</span>
                <span>{order.approvingUser}</span>
              </div>
            </CardContent>
          </Card>

          <Card
            id="sla-overall"
            className="border-blue-200/70 bg-gradient-to-br from-blue-50 via-white to-cyan-50 shadow-sm"
          >
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-sm">
                  SLA Information (Overall)
                </CardTitle>
                <Badge
                  variant="outline"
                  className={
                    order.slaStatus === "within_sla"
                      ? "bg-emerald-100 text-emerald-700 border-emerald-300"
                      : order.slaStatus === "at_risk"
                        ? "bg-amber-100 text-amber-700 border-amber-300"
                        : "bg-rose-100 text-rose-700 border-rose-300"
                  }
                >
                  {order.slaStatus
                    .replace("_", " ")
                    .replace(/\b\w/g, (c) => c.toUpperCase())}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isVendorScopedView && vendorContext && (
                <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
                  Vendor SLA Mode: {vendorContext.name}
                </div>
              )}

              <div className="relative mx-auto w-full max-w-[360px]">
                {!isDelivered && (
                  <div className="pointer-events-none absolute -inset-1 rounded-2xl bg-gradient-to-r from-blue-300/35 via-cyan-300/30 to-sky-300/35 blur-md" />
                )}
                <div
                  className={`relative rounded-2xl border px-4 py-5 text-center ${
                    isDelivered
                      ? "border-emerald-300 bg-emerald-50"
                      : "border-blue-200 bg-white/95 shadow-[0_10px_30px_rgba(2,132,199,0.16)]"
                  }`}
                >
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                    Live SLA Timer
                  </p>
                  <p className="mt-2 text-5xl font-mono font-bold tracking-[0.18em] text-slate-800">
                    {slaTime}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Started {new Date(order.slaStartTime).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button variant="outline" size="sm" onClick={handleRefreshSla}>
                  <RefreshCw className="mr-1 h-4 w-4" /> Refresh SLA
                </Button>
                <Button variant="outline" size="sm" onClick={handleResetSla}>
                  Reset SLA
                </Button>
                <Select onValueChange={handleStatusUpdate}>
                  <SelectTrigger className="h-8 w-[150px] text-xs">
                    <SelectValue placeholder="Update Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Processing">Processing</SelectItem>
                    <SelectItem value="Shipped">Shipped</SelectItem>
                    <SelectItem value="Delivered">Delivered</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSetSlaReminder}
                >
                  <BellRing className="mr-1 h-4 w-4" /> Set Reminder
                </Button>
              </div>

              <div className="flex flex-wrap items-end justify-end gap-2">
                <div>
                  <p className="text-[11px] text-muted-foreground mb-1">
                    Set SLA Timer (Elapsed)
                  </p>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      value={slaSetHours}
                      onChange={(e) => setSlaSetHours(e.target.value)}
                      className="h-8 w-20"
                      disabled={!canSetSlaTimer}
                    />
                    <span className="text-xs text-muted-foreground">h</span>
                    <Input
                      type="number"
                      min={0}
                      max={59}
                      value={slaSetMinutes}
                      onChange={(e) => setSlaSetMinutes(e.target.value)}
                      className="h-8 w-20"
                      disabled={!canSetSlaTimer}
                    />
                    <span className="text-xs text-muted-foreground">m</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSetSlaTimer}
                      disabled={!canSetSlaTimer}
                    >
                      Set SLA Timer
                    </Button>
                  </div>
                </div>
              </div>

              {isDelivered && (
                <p className="text-center text-xs text-emerald-700 font-medium">
                  SLA timer stopped because this order is delivered.
                </p>
              )}

              <div className="rounded-lg border bg-white/80 p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SLA start time:</span>
                  <span>{new Date(order.slaStartTime).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SLA Status:</span>
                  <span
                    className={
                      order.slaStatus === "within_sla"
                        ? "text-success font-medium"
                        : order.slaStatus === "at_risk"
                          ? "text-warning font-medium"
                          : "text-destructive font-medium"
                    }
                  >
                    {order.slaStatus
                      .replace("_", " ")
                      .replace(/\b\w/g, (c) => c.toUpperCase())}
                  </span>
                </div>
              </div>

              {isBulkOrder && (
                <p className="text-xs text-muted-foreground text-center">
                  Click any Sub-Order ID below to view individual SLA details.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Assignment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Assigned Analyst:</span>
                <span className="font-medium">{order.assignedAnalyst}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Analyst team:</span>
                <span>{order.analystTeam}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Assignment:</span>
                <span>{new Date(order.slaStartTime).toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Item Details */}
        <Card>
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

        <Card className="border-primary/20 bg-gradient-to-br from-blue-50 to-cyan-50">
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
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Vendor Selection</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={handleRefreshVendorRecommendations}
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
                                        if (isItemProcurementLocked(item.id)) {
                                          toast({
                                            title: "Cannot change vendor",
                                            description:
                                              "PO already exists for this item. Cancel it first to reassign vendor.",
                                          });
                                          return;
                                        }
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

                <Card className="border-primary/20 bg-primary/5">
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
                      disabled={selectedItems.length === 0}
                    >
                      Create Purchase Orders
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setSelectedItemIds([]);
                        setVendorByItemId({});
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

        {/* Billing & Shipping + Requestor */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                Billing & Shipping Information
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              <div>
                <p className="font-medium">Billing Address:</p>
                <p className="text-muted-foreground">{order.billingAddress}</p>
              </div>
              <div>
                <p className="font-medium">Payment Information:</p>
                <p className="text-muted-foreground">{order.paymentMethod}</p>
              </div>
              <div>
                <p className="font-medium">Shipping Address:</p>
                <p className="text-muted-foreground">{order.shippingAddress}</p>
              </div>
              <div>
                <p className="font-medium">Delivery Method:</p>
                <p className="text-muted-foreground">{order.deliveryMethod}</p>
              </div>
              <div className="flex items-center gap-2">
                <p className="font-medium">Tracking Number:</p>
                <span className="text-primary text-xs">
                  {order.trackingNumber}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                Requestor/User Information
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p>
                <span className="font-medium">Full contact details:</span>
              </p>
              <p className="text-muted-foreground">+40180335-3779673</p>
              <p className="text-muted-foreground">
                E-mail: contact@mygmail.com
              </p>
              <p className="text-muted-foreground">Www.acorpessentials.com</p>
              <p>
                <span className="font-medium">Organization:</span>
              </p>
              <p className="text-muted-foreground">{order.organization}</p>
            </CardContent>
          </Card>
        </div>

        {/* Comments & Collaboration */}
        {!isVendorScopedView && (
          <Card>
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
        <Card>
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

        <Card>
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
          <Card className="bg-muted/30">
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
