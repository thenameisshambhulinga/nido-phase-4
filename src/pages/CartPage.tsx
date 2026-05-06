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

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, clearCart, subtotal } =
    useCart();
  const { addAuditEntry } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  const tax = subtotal * 0.1;
  const shipping = subtotal > 500 ? 0 : 25;
  const total = subtotal + tax + shipping;

  const handleCheckout = () => {
    setShowCheckout(false);
    navigate("/shop/checkout");
  };

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
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
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
                onClick={clearCart}
              >
                Clear Cart
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

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
                {items.length} item{items.length !== 1 ? "s" : ""}
              </span>
              .
            </p>
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCheckout(false)}>
              Cancel
            </Button>
            <Button onClick={handleCheckout}>Place Order</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
