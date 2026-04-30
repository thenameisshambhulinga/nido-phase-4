import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Copy,
  CheckCircle2,
  Mail,
  Truck,
  Download,
  Home,
  ExternalLink,
  MapPin,
  Phone,
  Calendar,
  Circle,
  CheckCircle,
  FilePlus2,
} from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { normalizeOrderCode } from "@/lib/documentNumbering";
import { apiRequest } from "@/lib/api";

type TrackingStage = "confirmed" | "processing" | "shipped" | "delivered";

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
  emoji: string;
  category: string;
}

export interface ShippingAddress {
  fullName: string;
  companyName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
}

export interface Order {
  id: string;
  clientId: string;
  orderDate: string;
  status: string;
  requiredBy: string;
  items: OrderItem[];
  shippingInfo: ShippingAddress;
  subtotal: number;
  tax: number;
  shippingCost: number;
  total: number;
  paymentMethod: string;
  shippingMethod: string;
}

export default function OrderConfirmationPage() {
  const { orderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createInvoice } = useData();
  const [order, setOrder] = useState<Order | null>(null);
  const [copied, setCopied] = useState(false);
  const [trackingStage, setTrackingStage] =
    useState<TrackingStage>("confirmed");

  useEffect(() => {
    // Get order from location state or backend API
    if (location.state?.order) {
      setOrder(location.state.order);
    } else {
      if (!orderId) return;

      const fetchOrder = async () => {
        try {
          const orders = await apiRequest<any[]>(
            `/orders?orderNumber=${encodeURIComponent(orderId)}`,
          );
          const backendOrder = orders[0];
          if (!backendOrder) return;

          const resolvedItems = Array.isArray(backendOrder.items)
            ? backendOrder.items
            : [];

          const total = Number(backendOrder.totalAmount || 0);
          const subtotal = resolvedItems.reduce(
            (sum: number, item: any) =>
              sum +
              (Number(item.totalCost) ||
                (Number(item.quantity) || 0) *
                  (Number(item.pricePerItem) || 0)),
            0,
          );

          const mappedOrder: Order = {
            id: backendOrder.orderNumber || backendOrder._id || orderId,
            clientId: backendOrder.clientId || "",
            orderDate: backendOrder.orderDate || backendOrder.createdAt,
            status: backendOrder.status || "pending",
            requiredBy: backendOrder.requiredBy || backendOrder.updatedAt || "",
            items: resolvedItems.map((item: any, index: number) => ({
              id: item.productId || item.id || `item-${index}`,
              name: item.name || "Item",
              quantity: Number(item.quantity) || 0,
              price: Number(item.pricePerItem || 0),
              total:
                Number(item.totalCost) ||
                (Number(item.quantity) || 0) * (Number(item.pricePerItem) || 0),
              emoji: "📦",
              category: item.category || "General",
            })),
            shippingInfo: {
              fullName: backendOrder.requestingUser || "",
              companyName: backendOrder.organization || "",
              address: backendOrder.shippingAddress || "",
              city: "",
              state: "",
              zipCode: "",
              phone: "",
              email: "",
            },
            subtotal,
            tax: Math.max(0, total - subtotal),
            shippingCost: 0,
            total,
            paymentMethod: backendOrder.paymentMethod || "",
            shippingMethod: backendOrder.deliveryMethod || "standard",
          };

          setOrder(mappedOrder);
        } catch (error) {
          console.error("Failed to load order:", error);
        }
      };

      void fetchOrder();
    }
  }, [orderId, location.state]);

  useEffect(() => {
    if (!order) return;
    const status = (order.status || "").toLowerCase();
    if (status.includes("completed") || status.includes("delivered")) {
      setTrackingStage("delivered");
      return;
    }
    if (status.includes("shipped")) {
      setTrackingStage("shipped");
      return;
    }
    if (status.includes("processing") || status.includes("approved")) {
      setTrackingStage("processing");
      return;
    }
    setTrackingStage("confirmed");
  }, [order]);

  const timeline = useMemo(
    () => [
      {
        key: "confirmed" as TrackingStage,
        title: "Order Confirmed",
        subtitle: "Order validated and queued for processing",
      },
      {
        key: "processing" as TrackingStage,
        title: "Procurement Processing",
        subtitle: "Items are being approved and packed",
      },
      {
        key: "shipped" as TrackingStage,
        title: "Shipped",
        subtitle: "Shipment created and in transit",
      },
      {
        key: "delivered" as TrackingStage,
        title: "Delivered",
        subtitle: "Order successfully delivered",
      },
    ],
    [],
  );

  const stageIndex = timeline.findIndex((step) => step.key === trackingStage);
  const displayOrderCode = normalizeOrderCode(orderId || order?.id || "");

  const canConvertToInvoice = useMemo(() => {
    if (!order || !user) return false;
    const isOwnerPlatformUser =
      (user.organization || "").trim().toLowerCase() === "nido tech";

    if (user.role === "owner") return true;
    if (!isOwnerPlatformUser) return false;

    return ["procurement_manager", "accounts_payable"].includes(user.role);
  }, [order, user]);

  const canDownloadInvoice = useMemo(() => {
    if (!order || !user) return false;
    if (canConvertToInvoice) return true;
    return user.id === order.clientId;
  }, [order, user]);

  const downloadInvoice = () => {
    if (!order) return;
    if (!canDownloadInvoice) {
      toast.error("You are not authorized to download this invoice.");
      return;
    }
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 110, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.text("Nido Tech", 44, 48);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("Corporate Essentials Invoice", 44, 68);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("INVOICE", pageWidth - 140, 48);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Invoice #: ${order.id}`, pageWidth - 190, 66);
    doc.text(
      `Date: ${new Date(order.orderDate).toLocaleDateString()}`,
      pageWidth - 190,
      82,
    );

    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Bill To", 44, 144);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const addressLines = [
      order.shippingInfo.fullName,
      order.shippingInfo.companyName || "N/A",
      order.shippingInfo.address,
      `${order.shippingInfo.city}, ${order.shippingInfo.state} ${order.shippingInfo.zipCode}`,
      order.shippingInfo.phone,
      order.shippingInfo.email,
    ];
    let y = 162;
    addressLines.forEach((line) => {
      doc.text(line, 44, y);
      y += 14;
    });

    doc.setFont("helvetica", "bold");
    doc.text("Payment", pageWidth - 190, 144);
    doc.setFont("helvetica", "normal");
    doc.text(order.paymentMethod.toUpperCase(), pageWidth - 190, 162);
    doc.text(
      `Delivery: ${
        order.shippingMethod === "express" ? "Express" : "Standard"
      }`,
      pageWidth - 190,
      178,
    );

    autoTable(doc, {
      startY: 242,
      margin: { left: 44, right: 44 },
      head: [["Item", "Category", "Qty", "Unit Price", "Amount"]],
      body: order.items.map((item) => [
        item.name,
        item.category,
        String(item.quantity),
        `₹${item.price.toLocaleString()}`,
        `₹${item.total.toLocaleString()}`,
      ]),
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      styles: {
        fontSize: 9,
        cellPadding: 7,
        lineColor: [226, 232, 240],
        lineWidth: 0.5,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
    });

    const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } })
      .lastAutoTable?.finalY;
    const totalsY = (finalY || 360) + 28;

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(pageWidth - 232, totalsY - 16, 188, 104, 8, 8, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Subtotal", pageWidth - 216, totalsY + 8);
    doc.text(
      `₹${order.subtotal.toLocaleString()}`,
      pageWidth - 56,
      totalsY + 8,
      {
        align: "right",
      },
    );
    doc.text("Tax", pageWidth - 216, totalsY + 26);
    doc.text(`₹${order.tax.toLocaleString()}`, pageWidth - 56, totalsY + 26, {
      align: "right",
    });
    doc.text("Shipping", pageWidth - 216, totalsY + 44);
    doc.text(
      `₹${order.shippingCost.toLocaleString()}`,
      pageWidth - 56,
      totalsY + 44,
      {
        align: "right",
      },
    );
    doc.setFont("helvetica", "bold");
    doc.text("Grand Total", pageWidth - 216, totalsY + 70);
    doc.text(`₹${order.total.toLocaleString()}`, pageWidth - 56, totalsY + 70, {
      align: "right",
    });

    doc.setDrawColor(226, 232, 240);
    doc.line(44, 792, pageWidth - 44, 792);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(
      "Thank you for shopping with Nido Tech. This is a computer-generated invoice.",
      44,
      810,
    );

    doc.save(`invoice-${order.id}.pdf`);
    toast.success("Invoice downloaded");
  };

  const convertToInvoice = () => {
    if (!order) return;
    if (!canConvertToInvoice) {
      toast.error("You are not authorized to convert this order to invoice.");
      return;
    }
    const invoice = createInvoice({
      orderId: order.id,
      vendorOrClient:
        order.shippingInfo.companyName || order.shippingInfo.fullName,
      customerName:
        order.shippingInfo.companyName || order.shippingInfo.fullName,
      customerId: order.clientId,
      type: "client",
      invoiceDate: new Date().toISOString().slice(0, 10),
      issueDate: new Date().toISOString().slice(0, 10),
      dueDate: order.requiredBy.slice(0, 10),
      paymentTerms: order.paymentMethod,
      billingAddress: `${order.shippingInfo.address}, ${order.shippingInfo.city}, ${order.shippingInfo.state} ${order.shippingInfo.zipCode}`,
      shippingAddress: `${order.shippingInfo.address}, ${order.shippingInfo.city}, ${order.shippingInfo.state} ${order.shippingInfo.zipCode}`,
      placeOfSupply: order.shippingInfo.state,
      emailRecipients: order.shippingInfo.email
        ? [order.shippingInfo.email]
        : [],
      items: order.items.map((item) => ({
        id: item.id,
        itemName: item.name,
        description: item.category,
        hsnSac: "",
        quantity: item.quantity,
        rate: item.price,
        discount: 0,
        taxRate: 0,
        amount: item.total,
      })),
      subtotal: order.subtotal,
      cgst: order.tax / 2,
      sgst: order.tax / 2,
      adjustment: 0,
      shippingCharges: order.shippingCost,
      total: order.total,
      notes: `Generated from shop order ${order.id}`,
      termsAndConditions: "",
      bankDetails: "",
      createdBy: user?.name || "System",
    });
    toast.success(`Converted to invoice ${invoice.invoiceNumber}`);
  };

  const advanceTracking = () => {
    setTrackingStage((prev) => {
      if (prev === "confirmed") return "processing";
      if (prev === "processing") return "shipped";
      if (prev === "shipped") return "delivered";
      return "delivered";
    });
    toast.success("Tracking stage updated");
  };

  const handleCopyOrderId = () => {
    if (orderId) {
      navigator.clipboard.writeText(displayOrderCode || orderId);
      setCopied(true);
      toast.success("Order ID copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!order && !orderId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <p className="text-muted-foreground">Order not found</p>
            <Button onClick={() => navigate("/shop")} className="w-full">
              Back to Shop
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Success Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-200 p-8 lg:p-12">
        <div className="absolute right-0 top-0 -translate-y-1/2 translate-x-1/4 opacity-10">
          <CheckCircle2 className="h-96 w-96 text-green-600" />
        </div>

        <div className="relative space-y-6 max-w-2xl">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 flex items-center justify-center w-16 h-16 rounded-full bg-green-100 border-4 border-green-500">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-foreground">
                Thank You for Your Order!
              </h1>
              <p className="text-muted-foreground mt-1">
                Your order has been successfully placed and is being processed
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <div className="bg-white/60 backdrop-blur rounded-lg p-4 border border-green-100">
              <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                Order Number
              </p>
              <div className="flex items-center gap-2 mt-2">
                <p className="text-xl font-bold text-foreground">
                  {displayOrderCode || orderId}
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCopyOrderId}
                  className="h-8 w-8 p-0"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="bg-white/60 backdrop-blur rounded-lg p-4 border border-green-100">
              <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                Order Date
              </p>
              <p className="text-lg font-bold text-foreground mt-2">
                {order ? new Date(order.orderDate).toLocaleDateString() : "-"}
              </p>
            </div>

            <div className="bg-white/60 backdrop-blur rounded-lg p-4 border border-green-100">
              <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                Order Total
              </p>
              <p className="text-2xl font-bold text-green-600 mt-2">
                ${order ? order.total.toLocaleString() : "0"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Status */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Order Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-green-100 border-2 border-green-500">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">
                    Order Confirmed
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Your order has been received and is being processed
                  </p>
                </div>
                <Badge variant="default" className="bg-green-600">
                  Confirmed
                </Badge>
              </div>

              <Separator />

              <div className="rounded-xl border bg-muted/20 p-4">
                <p className="mb-3 text-sm font-semibold text-foreground">
                  Live Tracking Flow
                </p>
                <div className="space-y-3">
                  {timeline.map((step, index) => {
                    const done = index <= stageIndex;
                    return (
                      <div key={step.key} className="flex items-start gap-3">
                        <div className="pt-0.5">
                          {done ? (
                            <CheckCircle className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <Circle className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {step.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {step.subtitle}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    <Calendar className="h-4 w-4 inline mr-2" />
                    Order Placed
                  </span>
                  <span className="font-medium">
                    {order ? new Date(order.orderDate).toLocaleString() : "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    <Truck className="h-4 w-4 inline mr-2" />
                    Expected Delivery
                  </span>
                  <span className="font-medium">
                    {order
                      ? new Date(order.requiredBy).toLocaleDateString()
                      : "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping Method</span>
                  <span className="font-medium capitalize">
                    {order?.shippingMethod === "express"
                      ? "Express (2-3 days)"
                      : "Standard (5-7 days)"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Order Items ({order?.items.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {order?.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-2xl">{item.emoji}</span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground truncate">
                          {item.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Qty: {item.quantity}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground">
                        ${item.total.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        @${item.price.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              {/* Cost Summary */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">
                    ${order?.subtotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax (10%)</span>
                  <span className="font-medium">
                    ${order?.tax.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium">
                    ${order?.shippingCost.toLocaleString()}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-base font-bold">
                  <span>Total</span>
                  <span className="text-green-600">
                    ${order?.total.toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" /> Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              {order?.shippingInfo && (
                <div className="space-y-1 text-sm">
                  <p className="font-semibold text-foreground">
                    {order.shippingInfo.fullName}
                  </p>
                  {order.shippingInfo.companyName && (
                    <p className="text-muted-foreground">
                      {order.shippingInfo.companyName}
                    </p>
                  )}
                  <p className="text-muted-foreground">
                    {order.shippingInfo.address}
                  </p>
                  <p className="text-muted-foreground">
                    {order.shippingInfo.city}, {order.shippingInfo.state}{" "}
                    {order.shippingInfo.zipCode}
                  </p>
                  <div className="pt-2 space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      {order.shippingInfo.phone}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      {order.shippingInfo.email}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Next Steps */}
        <div className="space-y-6">
          {/* Next Steps Card */}
          <Card className="border-border/50 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-lg">What's Next?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-700">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      Confirmation Email
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Check inbox for order confirmation
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-700">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      Order Processing
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Your order will be reviewed and approved
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-700">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      Shipment Updates
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Receive tracking info when shipped
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-700">4</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Delivery</p>
                    <p className="text-xs text-muted-foreground">
                      Items arrive at your address
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Communication Card */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full gap-2" asChild>
                <a href={`mailto:${order?.shippingInfo.email}`}>
                  <Mail className="h-4 w-4" /> Contact Support
                </a>
              </Button>

              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={downloadInvoice}
                disabled={!canDownloadInvoice}
              >
                <Download className="h-4 w-4" /> Download Invoice
              </Button>

              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={advanceTracking}
                disabled={trackingStage === "delivered"}
              >
                <ExternalLink className="h-4 w-4" />
                {trackingStage === "delivered"
                  ? "Order Delivered"
                  : "Advance Tracking"}
              </Button>

              {canConvertToInvoice && (
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={convertToInvoice}
                >
                  <FilePlus2 className="h-4 w-4" /> Convert To Invoice
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Continue Shopping */}
          <Button
            onClick={() => navigate("/shop")}
            size="lg"
            className="w-full gap-2 h-11"
          >
            <Home className="h-4 w-4" /> Continue Shopping
          </Button>

          <Button
            onClick={() => navigate("/shop/cart")}
            variant="outline"
            className="w-full"
          >
            View Cart
          </Button>
        </div>
      </div>

      {/* Important Information */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <p className="text-sm text-amber-900 leading-relaxed">
            <strong>Order Confirmation:</strong> A confirmation email has been
            sent to <strong>{order?.shippingInfo.email}</strong> with all order
            details. Please save this for your records. Your order number is{" "}
            <strong>{displayOrderCode || orderId}</strong>. Use this to track
            your order or contact support.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
