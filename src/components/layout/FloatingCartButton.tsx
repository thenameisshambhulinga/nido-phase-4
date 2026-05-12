import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { ShoppingCart, X, Plus, Minus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function FloatingCartButton() {
  const { items, totalItems, subtotal, removeFromCart, updateQuantity } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 200);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  if (totalItems === 0) return null;

  return (
    <div
      ref={dropdownRef}
      className={cn(
        "fixed bottom-6 right-6 z-50 transition-all duration-300",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-16 opacity-0 pointer-events-none",
      )}
    >
      {/* Dropdown preview */}
      <div
        className={cn(
          "absolute bottom-16 right-0 w-80 bg-card border border-border rounded-xl shadow-2xl overflow-hidden mb-2 transition-all duration-200 origin-bottom-right",
          isOpen
            ? "scale-100 opacity-100"
            : "scale-95 opacity-0 pointer-events-none",
        )}
      >
        <div className="flex items-center justify-between p-3 border-b bg-muted/50">
          <span className="text-sm font-semibold">Cart ({totalItems})</span>
          <span className="text-xs text-muted-foreground">
            ₹{subtotal.toLocaleString()}
          </span>
        </div>
        <div className="max-h-64 overflow-y-auto">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-3 border-b last:border-0 hover:bg-muted/30 transition-colors"
            >
              <span className="text-xl flex-shrink-0">{item.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  ₹{item.price.toLocaleString()} × {item.quantity}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateQuantity(item.id, item.quantity - 1);
                  }}
                  className="h-6 w-6 rounded flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="text-xs font-medium w-6 text-center">
                  {item.quantity}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateQuantity(item.id, item.quantity + 1);
                  }}
                  className="h-6 w-6 rounded flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Plus className="h-3 w-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromCart(item.id);
                  }}
                  className="h-6 w-6 rounded flex items-center justify-center hover:bg-red-100 text-red-500 transition-colors ml-1"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="p-3 bg-muted/50 border-t">
          <Button
            className="w-full text-sm"
            size="sm"
            onClick={() => {
              setIsOpen(false);
              navigate("/shop/cart");
            }}
          >
            View Cart & Checkout
          </Button>
        </div>
      </div>

      {/* Main button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all"
      >
        <ShoppingCart className="h-6 w-6" />
        <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[22px] h-5 px-1 text-xs font-bold bg-red-500 text-white rounded-full shadow">
          {totalItems}
        </span>
        {isOpen && (
          <span className="absolute top-0 right-0 translate-x-1 -translate-y-1">
            <X className="h-4 w-4" />
          </span>
        )}
      </button>
    </div>
  );
}