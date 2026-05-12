<<<<<<< HEAD
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CreditCard,
  MessageCircle,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useCart, type CartItem } from "@/contexts/CartContext";
import { getProductImage } from "@/lib/catalogMedia";

function formatCurrency(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

function CartProductImage({ item }: { item: CartItem }) {
  const [failed, setFailed] = useState(false);

  const src = failed
    ? getProductImage({ category: item.category })
    : getProductImage({
        category: item.category,
        image: item.image,
      });

  return (
    <img
      src={src}
      alt={item.name}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className="h-full w-full object-contain p-5"
    />
  );
}
=======
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ArrowLeft,
  CreditCard,
  CheckCircle2,
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { safeReadJson } from "@/lib/storage";
>>>>>>> 67d1e15f2fd66c27748766bdee559c6aee16d96e

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, clearCart, subtotal } =
    useCart();
<<<<<<< HEAD
  const navigate = useNavigate();
  const [showCheckout, setShowCheckout] = useState(false);
=======
  const { addAuditEntry } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
>>>>>>> 67d1e15f2fd66c27748766bdee559c6aee16d96e

  const tax = subtotal * 0.1;
  const shipping = subtotal > 500 ? 0 : 25;
  const total = subtotal + tax + shipping;

<<<<<<< HEAD
  const orderSummaryRows = useMemo(
    () =>
      items.map((item) => ({
        id: item.id,
        label: `${item.name} x${item.quantity}`,
        amount: item.price * item.quantity,
      })),
    [items],
  );

=======
>>>>>>> 67d1e15f2fd66c27748766bdee559c6aee16d96e
  const handleCheckout = () => {
    setShowCheckout(false);
    navigate("/shop/checkout");
  };

<<<<<<< HEAD
  if (items.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white text-center shadow-sm">
          <CardContent className="space-y-4 p-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <ShoppingBag className="h-8 w-8 text-slate-500" />
            </div>
            <h2 className="text-2xl font-semibold text-slate-900">
              Your cart is empty
            </h2>
            <p className="text-sm text-slate-500">
              Browse the enterprise catalog to add products to your cart.
            </p>
            <Button
              className="rounded-xl bg-blue-600 hover:bg-blue-700"
              onClick={() => navigate("/shop")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Browse Products
=======
  if (orderPlaced) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full text-center border-border/60">
          <CardContent className="p-10 space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-[hsl(var(--success))]/10 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-[hsl(var(--success))]" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">
              Order Confirmed!
            </h2>
            <p className="text-muted-foreground">
              Your order has been placed and an invoice has been auto-generated.
            </p>
            <div className="flex gap-3 justify-center pt-2">
              <Button variant="outline" onClick={() => navigate("/categories")}>
                Continue Shopping
              </Button>
              <Button onClick={() => navigate("/invoices")}>
                View Invoices
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full text-center border-border/60">
          <CardContent className="p-10 space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <ShoppingBag className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold text-foreground">
              Your cart is empty
            </h2>
            <p className="text-muted-foreground">
              Browse our catalog to add products
            </p>
            <Button onClick={() => navigate("/categories")}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Browse Products
>>>>>>> 67d1e15f2fd66c27748766bdee559c6aee16d96e
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
<<<<<<< HEAD
    <div className="mx-auto max-w-[1600px] space-y-6 pb-10">
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              Shopping Cart
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {items.length} item{items.length !== 1 ? "s" : ""} ready for
              checkout with aligned catalog visuals and enterprise controls.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              className="rounded-xl border-slate-300 text-slate-700"
              onClick={() => navigate("/shop")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Continue Shopping
            </Button>
            <Button
              className="rounded-xl bg-blue-600 hover:bg-blue-700"
              onClick={() => setShowCheckout(true)}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Proceed to Checkout
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          {items.map((item) => {
            const isInStock =
              item.status !== "Out of Stock" &&
              (item.stock === undefined || item.stock === null || item.stock > 0);

            return (
              <Card
                key={item.id}
                className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm"
              >
                <CardContent className="p-5">
                  <div className="flex flex-col gap-5 xl:flex-row">
                    <div className="xl:w-[240px]">
                      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                        <CartProductImage item={item} />
                        <Badge
                          className={
                            isInStock
                              ? "absolute left-4 top-4 border-green-200 bg-green-100 text-green-700"
                              : "absolute left-4 top-4 border-rose-200 bg-rose-100 text-rose-700"
                          }
                        >
                          {isInStock ? "In Stock" : "Out of Stock"}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col gap-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <Badge className="border-blue-200 bg-blue-50 text-blue-700">
                              {item.category}
                            </Badge>
                            {item.sku && (
                              <span className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                                {item.sku}
                              </span>
                            )}
                          </div>
                          <h2 className="text-2xl font-semibold text-slate-900">
                            {item.name}
                          </h2>
                          <p className="mt-1 text-sm text-slate-500">
                            {(item.subCategory || "General") + " · " + (item.brand || "Nido")}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Unit Price
                          </p>
                          <p className="mt-1 text-2xl font-bold text-slate-900">
                            {formatCurrency(item.price)}
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                          <p className="mb-2 text-sm font-semibold text-slate-800">
                            Key Specifications
                          </p>
                          <ul className="ml-5 list-disc space-y-1 text-sm text-slate-600">
                            <li>
                              {item.description ||
                                "Enterprise-ready product configured for repeat purchasing."}
                            </li>
                            <li>Warranty: {item.warranty || "Standard warranty"}</li>
                            <li>Lead Time: {item.leadTime || "5-7 Days"}</li>
                          </ul>
                        </div>

                        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-500">MOQ</span>
                            <span className="font-semibold text-slate-900">
                              {item.minOrder || 1}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-500">Quantity</span>
                            <span className="font-semibold text-slate-900">
                              {item.quantity}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-500">Line Total</span>
                            <span className="font-semibold text-slate-900">
                              {formatCurrency(item.price * item.quantity)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-4 border-t border-slate-200 pt-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="inline-flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 lg:w-auto lg:min-w-[180px]">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              updateQuantity(item.id, Math.max(1, item.quantity - 1))
                            }
                            className="h-9 w-9 rounded-xl text-slate-700 hover:bg-white"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <div className="text-center">
                            <p className="text-xs text-slate-500">Quantity</p>
                            <p className="font-semibold text-slate-900">
                              {item.quantity}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                Math.min(item.quantity + 1, item.stock || 999),
                              )
                            }
                            disabled={!isInStock}
                            className="h-9 w-9 rounded-xl text-slate-700 hover:bg-white"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            className="rounded-xl border-slate-300 text-slate-700"
                            onClick={() =>
                              navigate(`/shop/product/${item.id}/enquire`)
                            }
                          >
                            <MessageCircle className="mr-2 h-4 w-4" />
                            Enquire
                          </Button>
                          <Button
                            variant="outline"
                            className="rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div>
          <Card className="sticky top-6 rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl text-slate-900">
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="font-medium text-slate-900">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Tax (10%)</span>
                  <span className="font-medium text-slate-900">
                    {formatCurrency(tax)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Shipping</span>
                  <span className="font-medium text-slate-900">
                    {shipping === 0 ? "Free" : formatCurrency(shipping)}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-base font-bold text-slate-900">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>

              {shipping > 0 && (
                <p className="text-xs text-slate-500">
                  Add {formatCurrency(500 - subtotal)} more to unlock free
                  shipping.
                </p>
              )}

              <Button
                className="h-11 w-full rounded-xl bg-blue-600 hover:bg-blue-700"
                onClick={() => setShowCheckout(true)}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Proceed to Checkout
              </Button>
              <Button
                variant="ghost"
                className="w-full text-sm text-rose-600 hover:bg-rose-50 hover:text-rose-700"
=======
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Shopping Cart</h1>
          <p className="text-sm text-muted-foreground">
            {items.length} item{items.length !== 1 ? "s" : ""} in your cart
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/categories")}
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Continue Shopping
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => (
            <Card key={item.id} className="border-border/60 overflow-hidden">
              <CardContent className="p-0">
                {/* Desktop & Tablet: table-like row */}
                <div className="hidden sm:flex items-center gap-0">
                  {/* Image column */}
                  <div className="w-20 h-20 shrink-0 bg-muted flex items-center justify-center overflow-hidden rounded-l-xl">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          e.currentTarget.nextElementSibling?.classList.remove("hidden");
                        }}
                      />
                    ) : null}
                    <span className={item.image ? "hidden text-3xl" : "text-3xl"}>
                      {item.emoji}
                    </span>
                  </div>

                  {/* Name + Category column */}
                  <div className="flex-1 min-w-0 px-4 py-4">
                    <h3 className="font-semibold text-foreground truncate text-sm">
                      {item.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.category}
                    </p>
                    <p className="text-sm font-bold text-primary mt-1">
                      ${item.price.toLocaleString()}
                    </p>
                  </div>

                  {/* Quantity column */}
                  <div className="flex items-center gap-1.5 px-4 shrink-0">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() =>
                        updateQuantity(item.id, Math.max(1, item.quantity - 1))
                      }
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </Button>
                    <Input
                      type="number"
                      min={1}
                      max={item.stock || 999}
                      value={item.quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (!isNaN(val) && val >= 1) {
                          updateQuantity(item.id, Math.min(val, item.stock || 999));
                        }
                      }}
                      onBlur={(e) => {
                        const val = parseInt(e.target.value);
                        if (isNaN(val) || val < 1) {
                          updateQuantity(item.id, 1);
                        }
                      }}
                      className="w-14 h-8 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() =>
                        updateQuantity(
                          item.id,
                          Math.min(item.quantity + 1, item.stock || 999),
                        )
                      }
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {/* Total column */}
                  <div className="text-right px-4 min-w-[90px] shrink-0">
                    <p className="text-xs text-muted-foreground mb-1">Total</p>
                    <p className="font-bold text-foreground text-sm">
                      ${(item.price * item.quantity).toLocaleString()}
                    </p>
                  </div>

                  {/* Delete column */}
                  <div className="pr-4 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Mobile: stacked layout */}
                <div className="flex sm:hidden items-center gap-3 p-4">
                  <div className="w-16 h-16 shrink-0 bg-muted rounded-xl flex items-center justify-center overflow-hidden">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          e.currentTarget.nextElementSibling?.classList.remove("hidden");
                        }}
                      />
                    ) : null}
                    <span className={item.image ? "hidden text-2xl" : "text-2xl"}>
                      {item.emoji}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate text-sm">
                      {item.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      ${item.price.toLocaleString()} × {item.quantity}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() =>
                        updateQuantity(item.id, Math.max(1, item.quantity - 1))
                      }
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">
                      {item.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() =>
                        updateQuantity(
                          item.id,
                          Math.min(item.quantity + 1, item.stock || 999),
                        )
                      }
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive/70 hover:text-destructive"
                    onClick={() => removeFromCart(item.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                {/* Mobile total */}
                <div className="flex sm:hidden justify-between items-center px-4 pb-4 pt-0">
                  <span className="text-xs text-muted-foreground">
                    Stock: {item.stock || "unlimited"}
                  </span>
                  <p className="font-bold text-foreground text-sm">
                    ${(item.price * item.quantity).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Order Summary */}
        <div>
          <Card className="border-border/60 sticky top-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">
                  ${subtotal.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax (10%)</span>
                <span className="font-medium">${tax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-medium">
                  {shipping === 0 ? (
                    <Badge variant="secondary" className="text-xs">
                      Free
                    </Badge>
                  ) : (
                    `$${shipping}`
                  )}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between text-base font-bold">
                <span>Total</span>
                <span className="text-primary">${total.toLocaleString()}</span>
              </div>
              {subtotal < 500 && (
                <p className="text-xs text-muted-foreground">
                  Add ${(500 - subtotal).toLocaleString()} more for free
                  shipping
                </p>
              )}
              <Button
                className="w-full mt-2"
                size="lg"
                onClick={handleCheckout}
              >
                <CreditCard className="h-4 w-4 mr-2" /> Proceed to Checkout
              </Button>
              <Button
                variant="ghost"
                className="w-full text-destructive text-xs"
>>>>>>> 67d1e15f2fd66c27748766bdee559c6aee16d96e
                onClick={clearCart}
              >
                Clear Cart
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

<<<<<<< HEAD
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Confirm Order</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 text-sm">
            <p className="text-slate-500">
              You&apos;re about to place an order for{" "}
              <span className="font-semibold text-slate-900">
=======
      {/* Checkout Confirmation Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              You're about to place an order for{" "}
              <span className="font-semibold text-foreground">
>>>>>>> 67d1e15f2fd66c27748766bdee559c6aee16d96e
                {items.length} item{items.length !== 1 ? "s" : ""}
              </span>
              .
            </p>
<<<<<<< HEAD

            <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              {orderSummaryRows.map((row) => (
                <div key={row.id} className="flex items-center justify-between gap-4">
                  <span className="text-slate-600">{row.label}</span>
                  <span className="font-medium text-slate-900">
                    {formatCurrency(row.amount)}
                  </span>
                </div>
              ))}
              <Separator />
              <div className="flex items-center justify-between font-semibold text-slate-900">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Checkout opens the existing order flow without changing provider
              or routing behavior.
            </p>
          </div>

=======
            <div className="bg-muted rounded-lg p-3 space-y-1">
              {items.map((i) => (
                <div key={i.id} className="flex justify-between">
                  <span>
                    {i.emoji} {i.name} ×{i.quantity}
                  </span>
                  <span className="font-medium">
                    ${(i.price * i.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
              <Separator className="my-2" />
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>${total.toLocaleString()}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              An invoice will be auto-generated and logged to the audit trail.
            </p>
          </div>
>>>>>>> 67d1e15f2fd66c27748766bdee559c6aee16d96e
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCheckout(false)}>
              Cancel
            </Button>
<<<<<<< HEAD
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleCheckout}
            >
              Place Order
            </Button>
=======
            <Button onClick={handleCheckout}>Place Order</Button>
>>>>>>> 67d1e15f2fd66c27748766bdee559c6aee16d96e
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
