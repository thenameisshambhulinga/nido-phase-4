import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, CreditCard, CheckCircle2 } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, clearCart, subtotal } = useCart();
  const { addAuditEntry } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  const tax = subtotal * 0.1;
  const shipping = subtotal > 500 ? 0 : 25;
  const total = subtotal + tax + shipping;

  const handleCheckout = () => {
    // Auto-generate invoice in localStorage
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
    const savedInvoices = JSON.parse(localStorage.getItem("nido_invoices") || "[]");
    const newInvoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber,
      vendorOrClient: user?.name || "Self",
      type: "client",
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      amount: subtotal,
      tax,
      totalAmount: total,
      status: "pending",
      items: items.map(i => ({
        description: `${i.emoji} ${i.name} x${i.quantity}`,
        quantity: i.quantity,
        unitPrice: i.price,
        total: i.price * i.quantity,
      })),
      notes: "Auto-generated from cart checkout",
      autoReminder: true,
    };
    localStorage.setItem("nido_invoices", JSON.stringify([newInvoice, ...savedInvoices]));

    addAuditEntry({
      user: user?.name || "System",
      action: "Order Placed",
      module: "Shop",
      details: `Checkout completed - ${items.length} items, total $${total.toLocaleString()}. Invoice ${invoiceNumber} generated.`,
      ipAddress: "192.168.1.1",
      status: "success",
    });

    clearCart();
    setShowCheckout(false);
    setOrderPlaced(true);
    toast.success("Order placed & invoice generated!");
  };

  if (orderPlaced) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full text-center border-border/60">
          <CardContent className="p-10 space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-[hsl(var(--success))]/10 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-[hsl(var(--success))]" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Order Confirmed!</h2>
            <p className="text-muted-foreground">Your order has been placed and an invoice has been auto-generated.</p>
            <div className="flex gap-3 justify-center pt-2">
              <Button variant="outline" onClick={() => navigate("/categories")}>Continue Shopping</Button>
              <Button onClick={() => navigate("/invoices")}>View Invoices</Button>
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
            <h2 className="text-xl font-bold text-foreground">Your cart is empty</h2>
            <p className="text-muted-foreground">Browse our catalog to add products</p>
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
          <p className="text-sm text-muted-foreground">{items.length} item{items.length !== 1 ? "s" : ""} in your cart</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate("/categories")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Continue Shopping
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-3">
          {items.map(item => (
            <Card key={item.id} className="border-border/60">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="text-4xl w-14 h-14 flex items-center justify-center bg-muted rounded-xl shrink-0">
                  {item.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{item.name}</h3>
                  <p className="text-xs text-muted-foreground">{item.category}</p>
                  <p className="text-sm font-bold text-primary mt-1">${item.price.toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <span className="w-8 text-center font-semibold text-sm">{item.quantity}</span>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="text-right min-w-[80px]">
                  <p className="font-bold text-foreground">${(item.price * item.quantity).toLocaleString()}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => removeFromCart(item.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
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
                <span className="font-medium">${subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax (10%)</span>
                <span className="font-medium">${tax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-medium">{shipping === 0 ? <Badge variant="secondary" className="text-xs">Free</Badge> : `$${shipping}`}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-base font-bold">
                <span>Total</span>
                <span className="text-primary">${total.toLocaleString()}</span>
              </div>
              {subtotal < 500 && (
                <p className="text-xs text-muted-foreground">Add ${(500 - subtotal).toLocaleString()} more for free shipping</p>
              )}
              <Button className="w-full mt-2" size="lg" onClick={() => setShowCheckout(true)}>
                <CreditCard className="h-4 w-4 mr-2" /> Proceed to Checkout
              </Button>
              <Button variant="ghost" className="w-full text-destructive text-xs" onClick={clearCart}>
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
            <p className="text-muted-foreground">You're about to place an order for <span className="font-semibold text-foreground">{items.length} item{items.length !== 1 ? "s" : ""}</span>.</p>
            <div className="bg-muted rounded-lg p-3 space-y-1">
              {items.map(i => (
                <div key={i.id} className="flex justify-between">
                  <span>{i.emoji} {i.name} ×{i.quantity}</span>
                  <span className="font-medium">${(i.price * i.quantity).toLocaleString()}</span>
                </div>
              ))}
              <Separator className="my-2" />
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>${total.toLocaleString()}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">An invoice will be auto-generated and logged to the audit trail.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCheckout(false)}>Cancel</Button>
            <Button onClick={handleCheckout}>Place Order</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
