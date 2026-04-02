import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { safeReadJson } from "@/lib/storage";

export interface CartItem {
  id: number;
  name: string;
  category: string;
  price: number;
  emoji: string;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: {
    id: number;
    name: string;
    category: string;
    price: number;
    emoji: string;
  }) => void;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [items, setItems] = useState<CartItem[]>(() =>
    safeReadJson<CartItem[]>("nido_cart", []),
  );

  useEffect(() => {
    localStorage.setItem("nido_cart", JSON.stringify(items));
  }, [items]);

  const addToCart = useCallback(
    (product: {
      id: number;
      name: string;
      category: string;
      price: number;
      emoji: string;
    }) => {
      setItems((prev) => {
        const existing = prev.find((i) => i.id === product.id);
        if (existing)
          return prev.map((i) =>
            i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
          );
        return [...prev, { ...product, quantity: 1 }];
      });
    },
    [],
  );

  const removeFromCart = useCallback((id: number) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateQuantity = useCallback((id: number, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.id !== id));
      return;
    }
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity } : i)));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
