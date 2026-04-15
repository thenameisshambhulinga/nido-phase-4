import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Grid3X3,
  List,
  Star,
  ShoppingCart,
  X,
  Minus,
  Plus,
  ArrowRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useCart } from "@/contexts/CartContext";
import { cn } from "@/lib/utils";

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  rating: number;
  stock: number;
  emoji: string;
  description: string;
}

const PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Ergonomic Office Chair",
    category: "Wooden Furniture",
    price: 599,
    rating: 4.8,
    stock: 45,
    emoji: "🪑",
    description:
      "Ergonomic build with lumbar support for long work sessions and executive comfort.",
  },
  {
    id: 2,
    name: "Wireless Mouse",
    category: "Electronics",
    price: 89,
    rating: 4.6,
    stock: 120,
    emoji: "🖱️",
    description:
      "Precision wireless tracking with smooth productivity response and durable battery life.",
  },
  {
    id: 3,
    name: "Filing Cabinet",
    category: "Office Supplies",
    price: 299,
    rating: 4.7,
    stock: 32,
    emoji: "🗄️",
    description:
      "Secure multi-drawer storage for organized office documentation and daily access.",
  },
  {
    id: 4,
    name: 'Desktop Monitor 27"',
    category: "Electronics",
    price: 349,
    rating: 4.9,
    stock: 67,
    emoji: "🖥️",
    description:
      "High-clarity display suited for dashboards, analytics and extended professional use.",
  },
  {
    id: 5,
    name: "Printer Paper (Box)",
    category: "Office Supplies",
    price: 45,
    rating: 4.5,
    stock: 200,
    emoji: "📄",
    description:
      "A4 office-grade sheets optimized for high-volume printing and smooth feed quality.",
  },
  {
    id: 6,
    name: "Executive Chair",
    category: "Wooden Furniture",
    price: 399,
    rating: 4.8,
    stock: 28,
    emoji: "💺",
    description:
      "Executive seating with balanced cushioning and premium posture support for teams.",
  },
  {
    id: 7,
    name: "USB-C Hub",
    category: "Electronics",
    price: 59,
    rating: 4.4,
    stock: 150,
    emoji: "🔌",
    description:
      "Compact multi-port expansion hub for laptops and modern workstation connectivity.",
  },
  {
    id: 8,
    name: "Stapler Set",
    category: "Office Supplies",
    price: 25,
    rating: 4.3,
    stock: 300,
    emoji: "📎",
    description:
      "Reliable stapling set with easy handling for recurring documentation workflows.",
  },
  {
    id: 9,
    name: "Standing Desk",
    category: "Wooden Furniture",
    price: 699,
    rating: 4.9,
    stock: 18,
    emoji: "🪵",
    description:
      "Spacious standing desk designed for healthy posture, cable order and sturdy daily use.",
  },
  {
    id: 10,
    name: "Mechanical Keyboard",
    category: "Electronics",
    price: 149,
    rating: 4.7,
    stock: 85,
    emoji: "⌨️",
    description:
      "Responsive mechanical typing experience for coding, admin operations and fast input.",
  },
  {
    id: 11,
    name: "Shipping Boxes (50 pk)",
    category: "Logistics Equipment",
    price: 89,
    rating: 4.5,
    stock: 500,
    emoji: "📦",
    description:
      "Durable corrugated carton bundle for secure packing, dispatch and storage operations.",
  },
  {
    id: 12,
    name: "Pallet Jack",
    category: "Logistics Equipment",
    price: 1299,
    rating: 4.6,
    stock: 12,
    emoji: "🏗️",
    description:
      "Heavy-duty handling tool for warehouse movement and consistent logistics throughput.",
  },
];

const CATEGORIES = [
  "All Categories",
  "Electronics",
  "Office Supplies",
  "Wooden Furniture",
  "Logistics Equipment",
];

const getAvailabilityLabel = (stock: number) =>
  stock > 0 ? "In Stock" : "Out of Stock";

export default function CategoriesPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [cartOpen, setCartOpen] = useState(false);

  const navigate = useNavigate();
  const {
    addToCart: addToCartCtx,
    totalItems,
    items,
    subtotal,
    updateQuantity,
    removeFromCart,
  } = useCart();

  const filtered = useMemo(() => {
    return PRODUCTS.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchCat = category === "All Categories" || p.category === category;
      return matchSearch && matchCat;
    });
  }, [search, category]);

  const handleAddToCart = (product: Product) => {
    addToCartCtx({
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      emoji: product.emoji,
    });
    toast.success(`${product.name} added to cart`);
  };

  return (
    <div className="p-8 min-h-screen bg-background relative">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">
              Product Categories
            </h1>
            <p className="text-muted-foreground">
              Browse our complete catalog of business essentials
            </p>
          </div>
          <Button
            onClick={() => setCartOpen((prev) => !prev)}
            className={cn(
              "group relative h-11 rounded-full px-5 text-white shadow-lg transition-all duration-300",
              "bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500",
              cartOpen && "ring-2 ring-blue-300/70 ring-offset-2",
            )}
          >
            <span className="absolute -inset-0.5 -z-10 rounded-full bg-gradient-to-r from-cyan-400/40 to-blue-500/30 blur opacity-80 transition-opacity group-hover:opacity-100" />
            {cartOpen ? (
              <X className="mr-2 h-4 w-4" />
            ) : (
              <ShoppingCart className="mr-2 h-4 w-4" />
            )}
            Cart
            <span className="ml-2 inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-white px-1.5 text-xs font-bold text-blue-700">
              {totalItems}
            </span>
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6 border border-border">
          <CardContent className="p-4 flex flex-col md:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-background border-border"
              />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full md:w-52 bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1 border border-border rounded-md p-0.5">
              <Button
                size="icon"
                variant={viewMode === "grid" ? "default" : "ghost"}
                className="h-8 w-8"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant={viewMode === "list" ? "default" : "ghost"}
                className="h-8 w-8"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-sm text-muted-foreground mb-4">
          Showing {filtered.length} products
        </p>

        {/* Grid View */}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {filtered.map((p) => (
              <Card
                key={p.id}
                className="border border-border bg-card hover:shadow-lg transition-all group overflow-hidden"
              >
                <CardContent className="p-0">
                  <div className="h-40 bg-secondary/50 flex items-center justify-center text-5xl">
                    {p.emoji}
                  </div>
                  <div className="p-4">
                    <p className="font-semibold text-foreground mb-1 truncate">
                      {p.name}
                    </p>
                    <p className="mb-2 line-clamp-2 text-xs text-muted-foreground min-h-8">
                      {p.description}
                    </p>
                    <div className="flex items-center gap-2 mb-1">
                      <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                      <span className="text-sm font-medium text-foreground">
                        {p.rating}
                      </span>
                      <span
                        className={cn(
                          "text-xs font-medium",
                          p.stock > 0 ? "text-success" : "text-destructive",
                        )}
                      >
                        • {getAvailabilityLabel(p.stock)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-lg font-bold text-primary">
                        ₹{p.price}
                      </span>
                      <Button
                        size="sm"
                        className="gap-1.5"
                        onClick={() => handleAddToCart(p)}
                      >
                        <ShoppingCart className="h-3.5 w-3.5" /> Add
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((p) => (
              <Card
                key={p.id}
                className="border border-border bg-card hover:shadow-md transition-all"
              >
                <CardContent className="p-4 flex items-center gap-5">
                  <div className="h-16 w-16 bg-secondary/50 rounded-lg flex items-center justify-center text-3xl shrink-0">
                    {p.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground">{p.name}</p>
                    <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                      {p.description}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="secondary" className="text-xs">
                        {p.category}
                      </Badge>
                      <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                      <span className="text-sm text-foreground">
                        {p.rating}
                      </span>
                      <span
                        className={cn(
                          "text-xs font-medium",
                          p.stock > 0 ? "text-success" : "text-destructive",
                        )}
                      >
                        • {getAvailabilityLabel(p.stock)}
                      </span>
                    </div>
                  </div>
                  <span className="text-xl font-bold text-primary shrink-0">
                    ₹{p.price}
                  </span>
                  <Button
                    size="sm"
                    className="gap-1.5 shrink-0"
                    onClick={() => handleAddToCart(p)}
                  >
                    <ShoppingCart className="h-3.5 w-3.5" /> Add
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg font-medium">No products found</p>
            <p className="text-sm mt-1">Try adjusting your search or filter</p>
          </div>
        )}
      </div>

      {/* Mini Cart Panel */}
      <div
        className={cn(
          "fixed right-8 top-24 z-50 w-80 bg-card border border-border rounded-xl shadow-2xl transition-all origin-top-right",
          cartOpen
            ? "scale-100 opacity-100 pointer-events-auto"
            : "scale-90 opacity-0 pointer-events-none",
        )}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-display font-semibold text-foreground">
            Your Cart
          </h3>
          <Badge variant="secondary" className="text-xs">
            {totalItems} items
          </Badge>
        </div>

        {items.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Your cart is empty</p>
          </div>
        ) : (
          <>
            <ScrollArea className="max-h-64">
              <div className="p-3 space-y-2">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
                  >
                    <span className="text-xl shrink-0">{item.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-primary font-semibold">
                        ₹{item.price * item.quantity}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                        className="h-6 w-6 rounded bg-background border border-border flex items-center justify-center hover:bg-accent transition-colors"
                      >
                        <Minus className="h-3 w-3 text-muted-foreground" />
                      </button>
                      <span className="text-xs font-medium w-5 text-center text-foreground">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                        className="h-6 w-6 rounded bg-background border border-border flex items-center justify-center hover:bg-accent transition-colors"
                      >
                        <Plus className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="h-6 w-6 rounded flex items-center justify-center hover:bg-destructive/10 transition-colors"
                    >
                      <X className="h-3 w-3 text-destructive" />
                    </button>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <Separator />
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="text-sm font-bold text-foreground">
                  ₹{subtotal.toLocaleString()}
                </span>
              </div>
              <Button
                className="w-full gap-2"
                onClick={() => {
                  setCartOpen(false);
                  navigate("/shop/cart");
                }}
              >
                View Full Cart <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
