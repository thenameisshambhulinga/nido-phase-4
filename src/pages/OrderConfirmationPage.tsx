import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
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
  const [order, setOrder] = useState<Order | null>(null);
  const [copied, setCopied] = useState(false);
  const [trackingStage, setTrackingStage] =
    useState<TrackingStage>("confirmed");

  useEffect(() => {
    // Get order from location state or localStorage
    if (location.state?.order) {
      setOrder(location.state.order);
    } else {
      // Try to fetch from localStorage
      const savedOrders = JSON.parse(
        localStorage.getItem("nido_orders") || "[]",
      );
      const foundOrder = savedOrders.find((o: Order) => o.id === orderId);
      if (foundOrder) {
        setOrder(foundOrder);
      }
    }
  }, [orderId, location.state]);

  useEffect(() => {
    if (!orderId || !order) return;
    const persisted = localStorage.getItem(`nido_tracking_${orderId}`);
    if (persisted) {
      setTrackingStage(persisted as TrackingStage);
      return;
    }

    const elapsedHours =
      (Date.now() - new Date(order.orderDate).getTime()) / 36e5;
    if (elapsedHours > 72) setTrackingStage("delivered");
    else if (elapsedHours > 24) setTrackingStage("shipped");
    else if (elapsedHours > 4) setTrackingStage("processing");
    else setTrackingStage("confirmed");
  }, [order, orderId]);

  useEffect(() => {
    if (!orderId) return;
    localStorage.setItem(`nido_tracking_${orderId}`, trackingStage);
  }, [orderId, trackingStage]);

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

  const downloadInvoice = () => {
    if (!order) return;
    const lines = [
      `Invoice for Order ${order.id}`,
      `Date: ${new Date(order.orderDate).toLocaleString()}`,
      "",
      ...order.items.map(
        (item) => `${item.name} x${item.quantity} - $${item.total}`,
      ),
      "",
      `Subtotal: $${order.subtotal}`,
      `Tax: $${order.tax}`,
      `Shipping: $${order.shippingCost}`,
      `Total: $${order.total}`,
      `Payment: ${order.paymentMethod}`,
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `invoice-${order.id}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("Invoice downloaded");
  };

  const convertToInvoice = () => {
    if (!order) return;
    const existing = JSON.parse(
      localStorage.getItem("nido_shop_invoices") || "[]",
    );
    const invoice = {
      id: `INV-${Date.now().toString().slice(-8)}`,
      sourceOrderId: order.id,
      date: new Date().toISOString(),
      amount: order.total,
      status: "generated",
    };
    localStorage.setItem(
      "nido_shop_invoices",
      JSON.stringify([invoice, ...existing]),
    );
    toast.success(`Converted to invoice ${invoice.id}`);
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
      navigator.clipboard.writeText(orderId);
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
                <p className="text-xl font-bold text-foreground">{orderId}</p>
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

              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={convertToInvoice}
              >
                <FilePlus2 className="h-4 w-4" /> Convert To Invoice
              </Button>
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
            <strong>{orderId}</strong>. Use this to track your order or contact
            support.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
