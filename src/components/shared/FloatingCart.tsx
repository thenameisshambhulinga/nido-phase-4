import React, { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, X, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const FloatingCart: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { items, totalItems, subtotal, updateQuantity, removeFromCart } =
    useCart();
  const navigate = useNavigate();

  if (totalItems === 0) return null;

  return (
    <>
      {/* Floating Cart Badge/Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "fixed bottom-6 right-6 z-40 transition-all duration-300 ease-out",
          isExpanded
            ? "pointer-events-none opacity-0 invisible"
            : "pointer-events-auto opacity-100 visible",
        )}
      >
        <div className="relative">
          {/* Glassmorphic background */}
          <div className="absolute inset-0 rounded-full bg-white/30 backdrop-blur-md border border-white/40 shadow-lg" />

          {/* Button content */}
          <div className="relative px-4 py-3 flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-emerald-700" />
            {totalItems > 0 && (
              <span className="text-sm font-semibold text-emerald-900">
                {totalItems}
              </span>
            )}
          </div>

          {/* Animated badge pulse */}
          {totalItems > 0 && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold animate-pulse">
              {totalItems}
            </div>
          )}
        </div>
      </button>

      {/* Expanded Cart Panel */}
      {isExpanded && (
        <div className="fixed bottom-6 right-6 z-40 w-96 max-w-[calc(100vw-24px)] animate-in slide-in-from-bottom-2 duration-300">
          {/* Glassmorphic panel */}
          <div className="rounded-2xl bg-white/95 backdrop-blur-xl border border-white/40 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-b border-emerald-200/50 px-4 py-3 flex justify-between items-center sticky top-0 z-10">
              <div>
                <h3 className="font-semibold text-emerald-900">
                  Shopping Cart
                </h3>
                <p className="text-xs text-emerald-700">{totalItems} items</p>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1 hover:bg-white/50 rounded-lg transition-colors"
              >
                <X className="h-4 w-4 text-emerald-900" />
              </button>
            </div>

            {/* Items List */}
            <div className="max-h-72 overflow-y-auto space-y-2 p-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-2 p-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  {/* Item image/emoji */}
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-slate-200 flex items-center justify-center text-lg">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      item.emoji || "📦"
                    )}
                  </div>

                  {/* Item details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-slate-600">
                      ₹{item.price.toFixed(2)}
                    </p>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-1 hover:bg-slate-300 rounded transition-colors"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-6 text-center text-xs font-semibold">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-1 hover:bg-slate-300 rounded transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Remove button */}
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="p-1 hover:bg-red-100 rounded transition-colors text-red-600 hover:text-red-700"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* Footer with total and actions */}
            <div className="border-t border-slate-200/50 px-4 py-3 space-y-2 bg-slate-50/50">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-700">
                  Subtotal
                </span>
                <span className="text-sm font-semibold text-slate-900">
                  ₹{subtotal.toFixed(2)}
                </span>
              </div>
              <Button
                onClick={() => {
                  navigate("/procurement");
                  setIsExpanded(false);
                }}
                className="w-full rounded-xl h-10 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-medium"
              >
                Proceed to Cart
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingCart;
