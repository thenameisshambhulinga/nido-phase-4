import { useMemo, useState } from "react";
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
  Layers3,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  image: string;
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
    image:
      "https://images.unsplash.com/photo-1505843513577-22bb7d21e455?w=1200&h=800&fit=crop",
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
    image:
      "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=1200&h=800&fit=crop",
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
    image:
      "https://images.unsplash.com/photo-1541558869434-2840d308329a?w=1200&h=800&fit=crop",
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
    image:
      "https://images.unsplash.com/photo-1545235617-9465d2a55698?w=1200&h=800&fit=crop",
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
    image:
      "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1200&h=800&fit=crop",
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
    image:
      "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=1200&h=800&fit=crop",
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
    image:
      "https://images.unsplash.com/photo-1625842268584-8f3296236761?w=1200&h=800&fit=crop",
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
    image:
      "https://images.unsplash.com/photo-1472289065668-ce650ac443d2?w=1200&h=800&fit=crop",
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
    image:
      "https://images.unsplash.com/photo-1595514535415-dae2d1ff629b?w=1200&h=800&fit=crop",
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
    image:
      "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=1200&h=800&fit=crop",
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
    image:
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&h=800&fit=crop",
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
    image:
      "https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=1200&h=800&fit=crop",
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

const toDataUri = (productName: string, emoji: string) => {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='1000' height='700' viewBox='0 0 1000 700'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop stop-color='#0f172a' offset='0'/><stop stop-color='#0369a1' offset='1'/></linearGradient></defs><rect width='1000' height='700' fill='url(#g)'/><circle cx='860' cy='120' r='140' fill='rgba(255,255,255,0.12)'/><circle cx='120' cy='580' r='190' fill='rgba(34,197,94,0.16)'/><text x='500' y='320' text-anchor='middle' fill='white' font-size='110'>${emoji}</text><text x='500' y='410' text-anchor='middle' fill='white' font-size='32' font-family='Arial, sans-serif'>${productName}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

function ProductImage({ product }: { product: Product }) {
  const [failed, setFailed] = useState(false);
  const source = failed
    ? toDataUri(product.name, product.emoji)
    : product.image;

  return (
    <img
      src={source}
      alt={product.name}
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
    />
  );
}

export default function CategoriesPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

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
      const term = search.trim().toLowerCase();
      const matchSearch =
        !term ||
        p.name.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term);
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

  const ProductOverviewDialog = ({ product }: { product: Product }) => {
    if (!product) return null;

    return (
      <div className="space-y-5">
        <DialogHeader className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-full bg-sky-600 text-white">
              Catalogue Preview
            </Badge>
            <Badge variant="outline" className="rounded-full">
              {product.category}
            </Badge>
            <Badge
              variant="outline"
              className={cn(
                "rounded-full",
                product.stock > 0
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-rose-200 bg-rose-50 text-rose-700",
              )}
            >
              {getAvailabilityLabel(product.stock)}
            </Badge>
          </div>
          <DialogTitle className="text-2xl md:text-3xl">
            {product.name}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            A view-only overview inspired by the master catalogue record, with
            no edit controls shown here.
          </p>
        </DialogHeader>

        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="overflow-hidden rounded-2xl border bg-slate-100">
            <div className="relative h-[320px]">
              <ProductImage product={product} />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/70 to-transparent p-5 text-white">
                <p className="text-xs uppercase tracking-[0.2em] text-white/70">
                  Item preview
                </p>
                <p className="mt-1 text-lg font-semibold">{product.emoji}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border bg-background p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Price
                </p>
                <p className="mt-2 text-2xl font-bold text-primary">
                  ₹{product.price.toLocaleString()}
                </p>
              </div>
              <div className="rounded-2xl border bg-background p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Rating
                </p>
                <p className="mt-2 flex items-center gap-2 text-2xl font-bold">
                  <Star className="h-5 w-5 fill-warning text-warning" />
                  {product.rating}
                </p>
              </div>
              <div className="rounded-2xl border bg-background p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Stock
                </p>
                <p className="mt-2 text-lg font-semibold text-foreground">
                  {product.stock.toLocaleString()} units
                </p>
              </div>
              <div className="rounded-2xl border bg-background p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Status
                </p>
                <p
                  className={cn(
                    "mt-2 text-lg font-semibold",
                    product.stock > 0 ? "text-emerald-700" : "text-rose-700",
                  )}
                >
                  {getAvailabilityLabel(product.stock)}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border bg-background p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Overview
              </p>
              <p className="mt-2 text-sm leading-7 text-foreground">
                {product.description}
              </p>
            </div>

            <div className="rounded-2xl border bg-background p-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    Category
                  </p>
                  <p className="mt-1 font-medium">{product.category}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    Product Type
                  </p>
                  <p className="mt-1 font-medium">Business Essential</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    Display
                  </p>
                  <p className="mt-1 font-medium">Catalogue overview</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    Availability
                  </p>
                  <p className="mt-1 font-medium">
                    {getAvailabilityLabel(product.stock)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                className="flex-1 gap-2"
                onClick={() => handleAddToCart(product)}
              >
                <ShoppingCart className="h-4 w-4" /> Add to Cart
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setSelectedProduct(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="relative overflow-hidden rounded-3xl border border-sky-200/70 bg-gradient-to-br from-slate-100 via-cyan-50 to-blue-100 p-6 md:p-8">
          <div className="pointer-events-none absolute -right-20 -top-16 h-56 w-56 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -left-12 bottom-0 h-44 w-44 rounded-full bg-cyan-400/25 blur-3xl" />

          <div className="relative space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-300/60 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-blue-700">
                  <Layers3 className="h-3.5 w-3.5" />
                  Curated Categories
                </p>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                  Product Categories
                </h1>
                <p className="mt-2 text-sm text-slate-600 md:text-base">
                  Explore premium business essentials with catalog-grade
                  discovery, product intelligence, and faster add-to-cart flow.
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

            <Card className="border-white/80 bg-white/75 backdrop-blur">
              <CardContent className="flex flex-col items-center gap-4 p-3 md:flex-row">
                <div className="relative w-full flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search products, categories, keywords"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-11 pl-10"
                  />
                </div>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-11 w-full bg-white md:w-56">
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
                <div className="flex items-center gap-1 rounded-md border border-border bg-white p-0.5">
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
          </div>
        </section>

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {filtered.length} product{filtered.length === 1 ? "" : "s"}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => navigate("/shop/cart")}
          >
            Go to cart
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((p) => (
              <Card
                key={p.id}
                className="group cursor-pointer overflow-hidden border border-border/70 bg-card/80 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                onClick={() => setSelectedProduct(p)}
              >
                <CardContent className="p-0">
                  <div className="relative h-44 overflow-hidden bg-slate-100">
                    <ProductImage product={p} />
                    <Badge
                      className={cn(
                        "absolute right-3 top-3 text-[11px]",
                        p.stock > 0
                          ? "bg-emerald-600 text-white"
                          : "bg-destructive text-white",
                      )}
                    >
                      {getAvailabilityLabel(p.stock)}
                    </Badge>
                  </div>
                  <div className="space-y-3 p-4">
                    <div className="min-w-0">
                      <p className="line-clamp-1 text-base font-semibold text-foreground">
                        {p.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {p.category}
                      </p>
                    </div>
                    <p className="line-clamp-2 min-h-[34px] text-xs text-muted-foreground">
                      {p.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                      <span className="font-medium text-foreground">
                        {p.rating}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-primary">
                        ₹{p.price}
                      </span>
                      <Button
                        size="sm"
                        className="gap-1.5"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleAddToCart(p);
                        }}
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
                className="group cursor-pointer overflow-hidden border border-border/70 bg-card/80 backdrop-blur transition-all duration-300 hover:shadow-xl"
                onClick={() => setSelectedProduct(p)}
              >
                <CardContent className="flex items-center gap-4 p-3">
                  <div className="h-20 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    <ProductImage product={p} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground">{p.name}</p>
                    <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                      {p.description}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
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
                  <span className="shrink-0 text-xl font-bold text-primary">
                    ₹{p.price}
                  </span>
                  <Button
                    size="sm"
                    className="shrink-0 gap-1.5"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleAddToCart(p);
                    }}
                  >
                    <ShoppingCart className="h-3.5 w-3.5" /> Add
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filtered.length === 0 && (
          <div className="py-20 text-center text-muted-foreground">
            <p className="text-lg font-medium">No products found</p>
            <p className="mt-1 text-sm">
              Try adjusting your search or category filters
            </p>
          </div>
        )}
      </div>

      <Dialog
        open={!!selectedProduct}
        onOpenChange={(open) => !open && setSelectedProduct(null)}
      >
        <DialogContent className="max-w-5xl border-border/70 bg-background/95 backdrop-blur-xl">
          {selectedProduct ? (
            <ProductOverviewDialog product={selectedProduct} />
          ) : null}
        </DialogContent>
      </Dialog>

      <div
        className={cn(
          "fixed right-8 top-24 z-50 w-80 origin-top-right rounded-xl border border-border bg-card/95 shadow-2xl backdrop-blur transition-all",
          cartOpen
            ? "scale-100 opacity-100 pointer-events-auto"
            : "scale-90 opacity-0 pointer-events-none",
        )}
      >
        <div className="flex items-center justify-between border-b border-border p-4">
          <h3 className="font-display font-semibold text-foreground">
            Your Cart
          </h3>
          <Badge variant="secondary" className="text-xs">
            {totalItems} items
          </Badge>
        </div>

        {items.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <ShoppingCart className="mx-auto mb-2 h-8 w-8 opacity-40" />
            <p className="text-sm">Your cart is empty</p>
          </div>
        ) : (
          <>
            <ScrollArea className="max-h-64">
              <div className="space-y-2 p-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/40 p-2"
                  >
                    <span className="shrink-0 text-xl">{item.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-foreground">
                        {item.name}
                      </p>
                      <p className="text-xs font-semibold text-primary">
                        ₹{item.price * item.quantity}
                      </p>
                    </div>
                    <div className="shrink-0 flex items-center gap-1">
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                        className="flex h-6 w-6 items-center justify-center rounded border border-border bg-background transition-colors hover:bg-accent"
                      >
                        <Minus className="h-3 w-3 text-muted-foreground" />
                      </button>
                      <span className="w-5 text-center text-xs font-medium text-foreground">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                        className="flex h-6 w-6 items-center justify-center rounded border border-border bg-background transition-colors hover:bg-accent"
                      >
                        <Plus className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="flex h-6 w-6 items-center justify-center rounded transition-colors hover:bg-destructive/10"
                    >
                      <X className="h-3 w-3 text-destructive" />
                    </button>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <Separator />
            <div className="space-y-3 p-4">
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
