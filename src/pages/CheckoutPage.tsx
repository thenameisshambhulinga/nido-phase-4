import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  ArrowLeft,
  CreditCard,
  Lock,
  Eye,
  EyeOff,
  Truck,
  AlertCircle,
  Shield,
} from "lucide-react";
import { safeReadJson } from "@/lib/storage";
import {
  nextSequentialCode,
  normalizeOrderCode,
} from "@/lib/documentNumbering";
import { emailTemplates, sendEmail } from "@/lib/emailService";
import { apiRequest } from "@/lib/api";

interface ShippingInfo {
  fullName: string;
  companyName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
}

interface PaymentInfo {
  cardholderName: string;
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  purchaseOrderNumber: string;
}

const isValidEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, subtotal, clearCart, totalItems } = useCart();
  const { user, isOwner, hasPermission } = useAuth();
  const { orders, addAuditEntry } = useData();

  const [shippingMethod, setShippingMethod] = useState<"standard" | "express">(
    "standard",
  );
  const [paymentMethod, setPaymentMethod] = useState<
    "card" | "bank" | "purchase_order"
  >("card");
  const [saveCard, setSaveCard] = useState(true);
  const [showCVV, setShowCVV] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sendOwnerNotification, setSendOwnerNotification] = useState(false);
  const [ownerNotificationEmail, setOwnerNotificationEmail] = useState("");

  // Shipping Info State
  const [shipping, setShipping] = useState<ShippingInfo>({
    fullName: user?.name || "",
    companyName: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
    email: user?.email || "",
  });

  // Payment Info State
  const [payment, setPayment] = useState<PaymentInfo>({
    cardholderName: "",
    cardNumber: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: "",
    purchaseOrderNumber: "",
  });

  // Calculations
  const shippingCost = shippingMethod === "express" ? 75 : 25;
  const tax = subtotal * 0.1;
  const total = subtotal + tax + shippingCost;
  const canConfigureOwnerNotification =
    isOwner || hasPermission("procure", "approve");

  const handleShippingChange = (field: keyof ShippingInfo, value: string) => {
    setShipping((prev) => ({ ...prev, [field]: value }));
  };

  const handlePaymentChange = (field: keyof PaymentInfo, value: string) => {
    let formattedValue = value;
    if (field === "cardNumber") {
      formattedValue = value
        .replace(/\s/g, "")
        .replace(/(\d{4})/g, "$1 ")
        .trim();
    }
    setPayment((prev) => ({ ...prev, [field]: formattedValue }));
  };

  const validateShipping = () => {
    if (
      !shipping.fullName ||
      !shipping.address ||
      !shipping.city ||
      !shipping.state ||
      !shipping.zipCode ||
      !shipping.phone ||
      !shipping.email
    ) {
      toast.error("Please fill in all shipping information");
      return false;
    }

    if (shipping.phone.replace(/\D/g, "").length !== 10) {
      toast.error("Phone number must be exactly 10 digits");
      return false;
    }

    return true;
  };

  const validatePayment = () => {
    if (paymentMethod === "card") {
      if (
        !payment.cardholderName ||
        !payment.cardNumber ||
        !payment.expiryMonth ||
        !payment.expiryYear ||
        !payment.cvv
      ) {
        toast.error("Please fill in all payment information");
        return false;
      }
      if (payment.cardNumber.replace(/\s/g, "").length !== 16) {
        toast.error("Please enter a valid 16-digit card number");
        return false;
      }
      if (payment.cvv.length !== 3) {
        toast.error("Please enter a valid 3-digit CVV");
        return false;
      }
    }

    if (paymentMethod === "purchase_order" && !payment.purchaseOrderNumber) {
      toast.error("Please provide a Purchase Order number");
      return false;
    }

    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validateShipping() || !validatePayment()) return;

    if (
      canConfigureOwnerNotification &&
      sendOwnerNotification &&
      !isValidEmail(ownerNotificationEmail)
    ) {
      toast.error("Please enter a valid notification email");
      return;
    }

    setIsProcessing(true);

    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 1500));

      let orderID = nextSequentialCode(
        "ORD",
        orders.map((entry) => normalizeOrderCode(entry.orderNumber)),
        8,
      );
      const todayIso = new Date().toISOString();
      const expectedDeliveryDate = new Date(
        Date.now() +
          (shippingMethod === "express" ? 3 : 7) * 24 * 60 * 60 * 1000,
      ).toISOString();

      const confirmationOrder = {
        id: orderID,
        clientId: user?.id || "shop-client",
        orderDate: todayIso,
        status: "Confirmed",
        requiredBy: expectedDeliveryDate,
        items: items.map((i) => ({
          id: i.id.toString(),
          name: i.name,
          quantity: i.quantity,
          price: i.price,
          total: i.price * i.quantity,
          emoji: i.emoji,
          category: i.category,
        })),
        shippingInfo: shipping,
        subtotal,
        tax,
        shippingCost,
        total,
        paymentMethod,
        shippingMethod,
      };

      const createProcureOrderPayload = (generatedOrderId: string) => ({
        orderNumber: generatedOrderId,
        clientId: user?.id || "shop-client",
        vendorId: "",
        orderDate: new Date().toISOString(),
        organization:
          shipping.companyName || user?.organization || "Client Order",
        requestingUser: shipping.fullName || user?.name || "Client User",
        approvingUser: user?.name || "System Owner",
        status: "pending",
        assignedUser: "Procurement Desk",
        items: items.map((i) => ({
          productId: i.id.toString(),
          name: i.name,
          description: `${i.category} item from shop checkout`,
          sku: `SHOP-${i.id}`,
          category: i.category,
          quantity: i.quantity,
          pricePerItem: i.price,
          totalCost: i.price * i.quantity,
        })),
        billingAddress: `${shipping.address}, ${shipping.city}, ${shipping.state} ${shipping.zipCode}`,
        shippingAddress: `${shipping.address}, ${shipping.city}, ${shipping.state} ${shipping.zipCode}`,
        paymentMethod:
          paymentMethod === "card"
            ? "Credit Card"
            : paymentMethod === "bank"
              ? "Bank Transfer"
              : `Purchase Order (${payment.purchaseOrderNumber})`,
        deliveryMethod:
          shippingMethod === "express" ? "Express Air" : "Standard Ground",
        trackingNumber: "",
        assignedAnalyst: "Procurement Analyst",
        analystTeam: "IT Procurement",
        totalAmount: total,
        comments: "Order placed from Shop Checkout.",
        commentHistory: [
          {
            id: `c-${Date.now()}`,
            user: shipping.fullName || "Client",
            text: "Order submitted from checkout and awaiting procurement approval.",
            timestamp: todayIso,
            type: "external" as const,
          },
        ],
        attachments: [],
        ownerNotificationEmail:
          canConfigureOwnerNotification && sendOwnerNotification
            ? ownerNotificationEmail.trim()
            : "",
      });

      let createdOrder: any = null;
      let createError = "";

      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          createdOrder = await apiRequest("/orders", {
            method: "POST",
            body: createProcureOrderPayload(orderID),
          });
          break;
        } catch (err: any) {
          createError = err.message || "Failed to create order";
          const normalizedError = String(createError).toLowerCase();
          const duplicateOrderNumber =
            normalizedError.includes("duplicate") &&
            normalizedError.includes("ordernumber");

          if (!duplicateOrderNumber || attempt === 2) {
            console.warn(
              "[checkout] backend order creation failed:",
              createError,
            );
            break;
          }

          orderID = `ORD-${Date.now()}-${attempt + 1}`;
        }
      }

      if (!createdOrder) {
        console.warn("[checkout] falling back to local order creation");
        const fallbackOrder = {
          id: `local-${Date.now()}`,
          ...createProcureOrderPayload(orderID),
          slaStartTime: new Date().toISOString(),
          slaStatus: "within_sla" as const,
        };
        const existingLocal = safeReadJson<any[]>("nido_orders_v2", []);
        localStorage.setItem(
          "nido_orders_v2",
          JSON.stringify([fallbackOrder, ...existingLocal]),
        );
        createdOrder = fallbackOrder;
      }

      const persistedOrderId = createdOrder.orderNumber || orderID;
      console.log("[checkout] created order", createdOrder);
      confirmationOrder.id = persistedOrderId;

      if (
        canConfigureOwnerNotification &&
        sendOwnerNotification &&
        ownerNotificationEmail.trim()
      ) {
        try {
          await sendEmail(
            ownerNotificationEmail.trim(),
            emailTemplates.orderReceivedForOwner({
              id: persistedOrderId,
              orderDate: todayIso,
              shippingInfo: {
                email: shipping.email,
                fullName: shipping.fullName,
                companyName: shipping.companyName,
              },
              items: items.map((item) => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                category: item.category,
              })),
              total,
              paymentMethod,
              shippingMethod,
            }),
          );
        } catch (emailError) {
          console.error("Owner notification email failed:", emailError);
        }
      }

      // Add audit entry
      addAuditEntry({
        user: user?.name || "System",
        action: "Order Checkout Completed",
        module: "Shop",
        details: `Order ${persistedOrderId} placed - ${items.length} items, total $${total.toLocaleString()}. Payment method: ${paymentMethod}, Shipping: ${shippingMethod}`,
        ipAddress: "192.168.1.1",
        status: "success",
      });

      // Simulate saving card (in production, use payment gateway tokenization)
      if (saveCard && paymentMethod === "card") {
        const savedCards = safeReadJson("nido_saved_cards", []);
        const maskedCard = {
          id: `card-${Date.now()}`,
          lastFour: payment.cardNumber.replace(/\s/g, "").slice(-4),
          expiryMonth: payment.expiryMonth,
          expiryYear: payment.expiryYear,
          cardholderName: payment.cardholderName,
          savedDate: new Date().toISOString(),
        };
        localStorage.setItem(
          "nido_saved_cards",
          JSON.stringify([maskedCard, ...savedCards]),
        );
      }

      clearCart();

      // Navigate to order confirmation
      navigate(`/shop/order-confirmation/${persistedOrderId}`, {
        replace: true,
        state: { order: confirmationOrder },
      });

      setIsProcessing(false);
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Failed to process order. Please try again.");
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full text-center">
          <CardContent className="p-8 space-y-4">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground" />
            <h2 className="text-xl font-bold">Your cart is empty</h2>
            <p className="text-muted-foreground">
              Please add items before proceeding to checkout
            </p>
            <Button onClick={() => navigate("/shop")} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" /> Continue Shopping
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl border border-blue-200/60 bg-gradient-to-br from-slate-100 via-blue-50 to-cyan-100 p-5 md:p-6">
        <div className="pointer-events-none absolute -right-12 -top-10 h-40 w-40 rounded-full bg-blue-300/30 blur-2xl" />
        <div className="pointer-events-none absolute -left-8 bottom-0 h-28 w-28 rounded-full bg-cyan-300/40 blur-2xl" />
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Checkout</h1>
            <p className="text-muted-foreground mt-1">
              Complete your purchase securely
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/shop/cart")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Cart
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Main Checkout Form */}
        <div className="space-y-6 lg:col-span-8">
          {/* Shipping Information */}
          <Card className="border-border/50 bg-white/95 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" /> Shipping Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                    Full Name
                  </Label>
                  <Input
                    value={shipping.fullName}
                    onChange={(e) =>
                      handleShippingChange("fullName", e.target.value)
                    }
                    placeholder="John Doe"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                    Company Name
                  </Label>
                  <Input
                    value={shipping.companyName}
                    onChange={(e) =>
                      handleShippingChange("companyName", e.target.value)
                    }
                    placeholder="Tech Solutions Inc."
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                  Street Address
                </Label>
                <Input
                  value={shipping.address}
                  onChange={(e) =>
                    handleShippingChange("address", e.target.value)
                  }
                  placeholder="1234 Business Rd, Suite 500"
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                    City
                  </Label>
                  <Input
                    value={shipping.city}
                    onChange={(e) =>
                      handleShippingChange("city", e.target.value)
                    }
                    placeholder="San Francisco"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                    State
                  </Label>
                  <Input
                    value={shipping.state}
                    onChange={(e) =>
                      handleShippingChange("state", e.target.value)
                    }
                    placeholder="CA"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                    Zip Code
                  </Label>
                  <Input
                    value={shipping.zipCode}
                    onChange={(e) =>
                      handleShippingChange("zipCode", e.target.value)
                    }
                    placeholder="94103"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                    Phone
                  </Label>
                  <Input
                    value={shipping.phone}
                    onChange={(e) =>
                      handleShippingChange(
                        "phone",
                        e.target.value.replace(/\D/g, "").slice(0, 10),
                      )
                    }
                    placeholder="9876543210"
                    inputMode="numeric"
                    pattern="[0-9]{10}"
                    maxLength={10}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                    Email
                  </Label>
                  <Input
                    type="email"
                    value={shipping.email}
                    onChange={(e) =>
                      handleShippingChange("email", e.target.value)
                    }
                    placeholder="john@example.com"
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {canConfigureOwnerNotification && (
            <Card className="border-blue-200/60 bg-gradient-to-br from-white via-blue-50/30 to-cyan-50/40 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">
                  Optional Owner Notification
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-white/70 p-3">
                  <Checkbox
                    id="owner-notification"
                    checked={sendOwnerNotification}
                    onCheckedChange={(checked) =>
                      setSendOwnerNotification(Boolean(checked))
                    }
                  />
                  <div>
                    <Label
                      htmlFor="owner-notification"
                      className="cursor-pointer font-medium"
                    >
                      Send order-received notification email
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Available only to owner or authorized internal procurement
                      users.
                    </p>
                  </div>
                </div>

                {sendOwnerNotification && (
                  <div>
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                      Notification Email
                    </Label>
                    <Input
                      type="email"
                      value={ownerNotificationEmail}
                      onChange={(e) =>
                        setOwnerNotificationEmail(e.target.value)
                      }
                      placeholder="owner.ops@company.com"
                      className="mt-1"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      The selected email will receive a premium "order received"
                      mail after successful placement.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Shipping Method */}
          <Card className="border-border/50 bg-white/95 shadow-sm">
            <CardHeader>
              <CardTitle>Shipping Method</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-3">
                <div className="border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-start gap-3">
                    <RadioGroup
                      value={shippingMethod}
                      onValueChange={(v) =>
                        setShippingMethod(v as "standard" | "express")
                      }
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="standard"
                          id="standard-shipping"
                        />
                        <Label
                          htmlFor="standard-shipping"
                          className="cursor-pointer flex-1"
                        >
                          <div>
                            <p className="font-semibold text-foreground">
                              Standard Shipping (5-7 business days)
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Free for orders over $500
                            </p>
                          </div>
                        </Label>
                        <span className="text-lg font-bold text-primary ml-auto">
                          ${shippingMethod === "standard" ? "25" : "0"}
                        </span>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                <div className="border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-start gap-3">
                    <RadioGroup
                      value={shippingMethod}
                      onValueChange={(v) =>
                        setShippingMethod(v as "standard" | "express")
                      }
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="express" id="express-shipping" />
                        <Label
                          htmlFor="express-shipping"
                          className="cursor-pointer flex-1"
                        >
                          <div>
                            <p className="font-semibold text-foreground">
                              Express Shipping (2-3 business days)
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Guaranteed fast delivery
                            </p>
                          </div>
                        </Label>
                        <span className="text-lg font-bold text-primary ml-auto">
                          $75
                        </span>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card className="border-border/50 bg-white/95 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" /> Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Payment Method Selection */}
              <div className="space-y-3">
                <div className="border rounded-lg p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <RadioGroup
                      value={paymentMethod}
                      onValueChange={(v) =>
                        setPaymentMethod(
                          v as "card" | "bank" | "purchase_order",
                        )
                      }
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="card" id="card-payment" />
                        <Label
                          htmlFor="card-payment"
                          className="cursor-pointer flex-1 flex items-center gap-2"
                        >
                          <CreditCard className="h-4 w-4" />
                          Credit/Debit Card
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                <div className="border rounded-lg p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <RadioGroup
                      value={paymentMethod}
                      onValueChange={(v) =>
                        setPaymentMethod(
                          v as "card" | "bank" | "purchase_order",
                        )
                      }
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="bank" id="bank-payment" />
                        <Label
                          htmlFor="bank-payment"
                          className="cursor-pointer flex-1 flex items-center gap-2"
                        >
                          <Truck className="h-4 w-4" />
                          Bank Transfer
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                <div className="border rounded-lg p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <RadioGroup
                      value={paymentMethod}
                      onValueChange={(v) =>
                        setPaymentMethod(
                          v as "card" | "bank" | "purchase_order",
                        )
                      }
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="purchase_order"
                          id="purchase-order-payment"
                        />
                        <Label
                          htmlFor="purchase-order-payment"
                          className="cursor-pointer flex-1 flex items-center gap-2"
                        >
                          <Truck className="h-4 w-4" />
                          Purchase Order
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </div>

              {/* Card Details */}
              {paymentMethod === "card" && (
                <div className="border-t pt-4 space-y-4">
                  <div>
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                      Cardholder Name
                    </Label>
                    <Input
                      value={payment.cardholderName}
                      onChange={(e) =>
                        handlePaymentChange("cardholderName", e.target.value)
                      }
                      placeholder="John Doe"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                      Card Number
                    </Label>
                    <div className="relative mt-1">
                      <Input
                        value={payment.cardNumber}
                        onChange={(e) =>
                          handlePaymentChange("cardNumber", e.target.value)
                        }
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        className="font-mono"
                      />
                      <Badge
                        variant="secondary"
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        {payment.cardNumber.replace(/\s/g, "").startsWith("4")
                          ? "Visa"
                          : payment.cardNumber
                                .replace(/\s/g, "")
                                .startsWith("5")
                            ? "Mastercard"
                            : "Unknown"}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                        Exp Month
                      </Label>
                      <Select
                        value={payment.expiryMonth}
                        onValueChange={(v) =>
                          handlePaymentChange("expiryMonth", v)
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="MM" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => (
                            <SelectItem
                              key={i + 1}
                              value={String(i + 1).padStart(2, "0")}
                            >
                              {String(i + 1).padStart(2, "0")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                        Exp Year
                      </Label>
                      <Select
                        value={payment.expiryYear}
                        onValueChange={(v) =>
                          handlePaymentChange("expiryYear", v)
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="YYYY" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 10 }, (_, i) => {
                            const year = new Date().getFullYear() + i;
                            return (
                              <SelectItem key={year} value={String(year)}>
                                {year}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                        CVV
                      </Label>
                      <div className="relative mt-1">
                        <Input
                          type={showCVV ? "text" : "password"}
                          value={payment.cvv}
                          onChange={(e) =>
                            handlePaymentChange("cvv", e.target.value)
                          }
                          placeholder="123"
                          maxLength={3}
                          className="pr-10 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCVV(!showCVV)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showCVV ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <Checkbox
                      id="save-card"
                      checked={saveCard}
                      onCheckedChange={(v) => setSaveCard(Boolean(v))}
                    />
                    <Label
                      htmlFor="save-card"
                      className="text-sm cursor-pointer"
                    >
                      Save this card for future purchases
                    </Label>
                  </div>

                  {/* Security Notice */}
                  <div className="bg-blue-50 rounded-lg border border-blue-200 p-3 flex gap-3">
                    <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-700">
                      Your card information is encrypted and secure. We use
                      industry-standard SSL security to protect your payment
                      details.
                    </p>
                  </div>
                </div>
              )}

              {paymentMethod === "bank" && (
                <div className="border-t pt-4 bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">
                    Bank transfer instructions will be sent to your email after
                    placing the order. Complete the transfer within 3 business
                    days to finalize your order.
                  </p>
                </div>
              )}

              {paymentMethod === "purchase_order" && (
                <div className="border-t pt-4 space-y-3 rounded-lg bg-muted/50 p-4">
                  <div>
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                      Purchase Order Number
                    </Label>
                    <Input
                      value={payment.purchaseOrderNumber}
                      onChange={(e) =>
                        handlePaymentChange(
                          "purchaseOrderNumber",
                          e.target.value,
                        )
                      }
                      placeholder="PO-2026-00124"
                      className="mt-1"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Use this option for organization-approved procurement
                    cycles. Invoice matching and PO reconciliation will be
                    available in order tracking.
                  </p>
                </div>
              )}

              <div className="border-t pt-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                  Supported Payment Rails
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {[
                    { alt: "Visa", src: "/payment/visa.svg" },
                    { alt: "Mastercard", src: "/payment/mastercard.svg" },
                    { alt: "RuPay", src: "/payment/rupay.svg" },
                    { alt: "American Express", src: "/payment/amex.svg" },
                    { alt: "Bank Transfer", src: "/payment/bank-transfer.svg" },
                    {
                      alt: "Purchase Order",
                      src: "/payment/purchase-order.svg",
                    },
                  ].map((method) => (
                    <div
                      key={method.alt}
                      className="rounded-lg border bg-white p-1 shadow-sm"
                    >
                      <img
                        src={method.src}
                        alt={method.alt}
                        className="h-8 w-full object-contain"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-4">
          <Card className="sticky top-6 border-border/50 bg-white/95 shadow-sm">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Items */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border bg-slate-50/70 p-2.5 text-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <span className="text-lg">{item.emoji}</span>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {item.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ×{item.quantity}
                          </p>
                        </div>
                      </div>
                      <p className="font-medium text-foreground whitespace-nowrap ml-2">
                        ${(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 to-cyan-50 p-3 text-xs">
                <p className="font-semibold text-slate-800">Shipping Preview</p>
                <p className="mt-1 text-slate-600">
                  {shipping.fullName || "Recipient"} •{" "}
                  {shipping.phone || "Phone"}
                </p>
                <p className="mt-0.5 text-slate-600">
                  {shipping.address || "Address"}, {shipping.city || "City"}
                </p>
                <p className="mt-0.5 text-slate-600">
                  {shipping.state || "State"} {shipping.zipCode || "ZIP"}
                </p>
              </div>

              <Separator />

              {/* Cost Summary */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">
                    ${subtotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax (10%)</span>
                  <span className="font-medium">${tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium">
                    ${shippingCost.toLocaleString()}
                  </span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between text-base font-bold">
                <span>Total</span>
                <span className="text-primary text-lg">
                  ${total.toLocaleString()}
                </span>
              </div>

              {/* Place Order Button */}
              <Button
                onClick={handlePlaceOrder}
                disabled={isProcessing || totalItems === 0}
                className="w-full h-11 gap-2 mt-4"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" /> Place Order Securely
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate("/shop/cart")}
                disabled={isProcessing}
              >
                Back to Cart
              </Button>

              {/* Trust Badges */}
              <div className="pt-4 border-t grid grid-cols-3 gap-2 text-center">
                <div className="text-xs">
                  <Lock className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <span className="text-muted-foreground text-xs">Secure</span>
                </div>
                <div className="text-xs">
                  <Shield className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <span className="text-muted-foreground text-xs">
                    Protected
                  </span>
                </div>
                <div className="text-xs">
                  <Lock className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <span className="text-muted-foreground text-xs">
                    Encrypted
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
