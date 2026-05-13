import { useState } from "react";
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
import { Separator } from "@/components/ui/separator";
import { useCart, type CartItem } from "@/contexts/CartContext";
import { getProductImage } from "@/lib/catalogMedia";
import {
  PAGE_PILL_BUTTON_CLASS,
  PAGE_PILL_PRIMARY_BUTTON_CLASS,
} from "@/lib/navigationStyles";

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

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, clearCart, subtotal } =
    useCart();
  const navigate = useNavigate();

  const tax = subtotal * 0.1;
  const shipping = subtotal > 500 ? 0 : 25;
  const total = subtotal + tax + shipping;

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
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
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
              className={PAGE_PILL_BUTTON_CLASS}
              onClick={() => navigate("/shop")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Continue Shopping
            </Button>
            <Button
              className={PAGE_PILL_PRIMARY_BUTTON_CLASS}
              onClick={() => navigate("/shop/checkout")}
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
              (item.stock === undefined ||
                item.stock === null ||
                item.stock > 0);

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
                            {(item.subCategory || "General") +
                              " · " +
                              (item.brand || "Nido")}
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
                            <li>
                              Warranty: {item.warranty || "Standard warranty"}
                            </li>
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
                              updateQuantity(
                                item.id,
                                Math.max(1, item.quantity - 1),
                              )
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
                className={PAGE_PILL_PRIMARY_BUTTON_CLASS}
                onClick={() => navigate("/shop/checkout")}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Proceed to Checkout
              </Button>
              <Button
                variant="ghost"
                className="w-full text-sm text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                onClick={clearCart}
              >
                Clear Cart
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
