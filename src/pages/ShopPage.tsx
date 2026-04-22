import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useData } from "@/contexts/DataContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  ShoppingCart,
  Star,
  ArrowRight,
  Sparkles,
  ImageOff,
  Layers3,
} from "lucide-react";

interface ShopProduct {
  id: number;
  sku: string;
  name: string;
  category: string;
  subCategory: string;
  brand: string;
  price: number;
  emoji: string;
  image: string;
  description: string;
  specification: string;
  warranty: string;
  primaryVendor: string;
  leadTime: string;
  status: "In Stock" | "Out of Stock";
}

const fallbackProducts: ShopProduct[] = [
  {
    id: 1,
    sku: "LAP-1001",
    name: "HP Envy Laptop",
    category: "IT Hardware",
    subCategory: "Laptops",
    brand: "HP",
    price: 80000,
    emoji: "💻",
    image:
      "https://images.unsplash.com/photo-1588872657840-790ff3bde08c?w=900&h=600&fit=crop",
    description:
      "High-performance laptop for professionals and developers with enterprise reliability.",
    specification: 'Intel i7, 16GB RAM, 512GB SSD, 15.6" Display',
    warranty: "2 years standard + 1 year accidental damage",
    primaryVendor: "HP Direct",
    leadTime: "10 Days",
    status: "In Stock",
  },
  {
    id: 2,
    sku: "SSD-2025",
    name: "Sandisk 1TB SSD",
    category: "IT Hardware",
    subCategory: "Storage",
    brand: "Sandisk",
    price: 12000,
    emoji: "💾",
    image:
      "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=900&h=600&fit=crop",
    description:
      "Ultra-fast external SSD with secure, compact and business-friendly portable storage.",
    specification: "1TB Capacity, 560MB/s Read, Compact design",
    warranty: "5 years limited warranty",
    primaryVendor: "Sandisk Global",
    leadTime: "10 Days",
    status: "In Stock",
  },
  {
    id: 3,
    sku: "MON-3210",
    name: 'Dell 27" 4K Monitor',
    category: "IT Hardware",
    subCategory: "Monitors",
    brand: "Dell",
    price: 35000,
    emoji: "🖥️",
    image:
      "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=900&h=600&fit=crop",
    description:
      "Professional 4K monitor with accurate color reproduction for teams and creators.",
    specification: '27" 4K IPS, 99% Adobe RGB, HDR-compatible',
    warranty: "3 years premium support",
    primaryVendor: "Dell Enterprise",
    leadTime: "1 Month",
    status: "In Stock",
  },
  {
    id: 4,
    sku: "MOU-3301",
    name: "Logitech Wireless Mouse",
    category: "IT Hardware",
    subCategory: "Peripherals",
    brand: "Logitech",
    price: 2500,
    emoji: "🖱️",
    image:
      "https://images.unsplash.com/photo-1527815050871-3c149d23cb76?w=900&h=600&fit=crop",
    description:
      "Ergonomic wireless mouse with precision tracking and all-day office comfort.",
    specification: "2.4GHz Wireless, 4 DPI Levels, 18-month battery",
    warranty: "2 years limited warranty",
    primaryVendor: "Logitech India",
    leadTime: "7 Days",
    status: "In Stock",
  },
  {
    id: 5,
    sku: "TAB-1110",
    name: "Apple iPad Air",
    category: "IT Hardware",
    subCategory: "Tablets",
    brand: "Apple",
    price: 45000,
    emoji: "📱",
    image:
      "https://images.unsplash.com/photo-1536231516926-6b648b868242?w=900&h=600&fit=crop",
    description:
      "Powerful iPad Air with M-series performance for mobility, review and approvals.",
    specification: 'M1 Chip, 64GB Storage, 10.9" Liquid Retina Display',
    warranty: "1 year limited warranty",
    primaryVendor: "Apple B2B",
    leadTime: "10 Days",
    status: "In Stock",
  },
  {
    id: 6,
    sku: "KEY-5501",
    name: "Mechanical Keyboard RGB",
    category: "IT Hardware",
    subCategory: "Peripherals",
    brand: "Corsair",
    price: 15000,
    emoji: "⌨️",
    image:
      "https://images.unsplash.com/photo-1587829191301-11db59a44f6b?w=900&h=600&fit=crop",
    description:
      "Durable mechanical keyboard with premium key feel and fast office response.",
    specification: "Mechanical Switches, RGB LED, Programmable Keys",
    warranty: "2 years standard warranty",
    primaryVendor: "Corsair Pro",
    leadTime: "10 Days",
    status: "In Stock",
  },
];

const statusLabel = (status: string) =>
  status === "Out of Stock" ? "Out of Stock" : "In Stock";

const toDataUri = (productName: string, emoji: string) => {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='1000' height='700' viewBox='0 0 1000 700'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop stop-color='#0f172a' offset='0'/><stop stop-color='#1d4ed8' offset='1'/></linearGradient></defs><rect width='1000' height='700' fill='url(#g)'/><circle cx='860' cy='120' r='140' fill='rgba(255,255,255,0.12)'/><circle cx='120' cy='580' r='190' fill='rgba(34,197,94,0.16)'/><text x='500' y='320' text-anchor='middle' fill='white' font-size='110'>${emoji}</text><text x='500' y='410' text-anchor='middle' fill='white' font-size='32' font-family='Arial, sans-serif'>${productName}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

function ProductImage({ product }: { product: ShopProduct }) {
  const [failed, setFailed] = useState(false);
  const src = failed ? toDataUri(product.name, product.emoji) : product.image;

  return (
    <img
      src={src}
      alt={product.name}
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
    />
  );
}

function ProductCard({
  product,
  onAdd,
  onView,
}: {
  product: ShopProduct;
  onAdd: (product: ShopProduct) => void;
  onView: (product: ShopProduct) => void;
}) {
  const stock = statusLabel(product.status);

  return (
    <Card className="group overflow-hidden border-border/70 bg-card/80 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
      <div className="relative h-44 overflow-hidden bg-slate-100">
        <ProductImage product={product} />
        <div className="pointer-events-none absolute inset-x-3 bottom-3 translate-y-4 rounded-xl border border-white/30 bg-slate-950/75 p-2.5 text-[11px] text-white opacity-0 shadow-lg backdrop-blur-sm transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <p className="font-semibold">Quick Overview</p>
          <p className="mt-0.5 line-clamp-1 text-white/85">
            {product.specification}
          </p>
          <div className="mt-1.5 flex items-center justify-between text-[10px] text-white/80">
            <span>{product.primaryVendor}</span>
            <span>{product.leadTime}</span>
          </div>
        </div>
        <Badge
          className={cn(
            "absolute right-3 top-3 text-[11px]",
            stock === "In Stock"
              ? "bg-emerald-600 text-white"
              : "bg-destructive text-white",
          )}
        >
          {stock}
        </Badge>
      </div>

      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {product.sku}
            </p>
            <h3 className="line-clamp-1 text-base font-semibold text-foreground">
              {product.name}
            </h3>
            <p className="text-xs text-muted-foreground">
              {product.category} • {product.subCategory}
            </p>
          </div>
          <span className="text-2xl">{product.emoji}</span>
        </div>

        <p className="line-clamp-2 text-sm text-muted-foreground">
          {product.description}
        </p>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          <span>4.8</span>
          <span>•</span>
          <span>{product.brand}</span>
        </div>

        <div className="flex items-end justify-between pt-1">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Price
            </p>
            <p className="text-2xl font-bold text-primary">
              ₹{product.price.toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onView(product)}>
              Details
            </Button>
            <Button
              size="sm"
              onClick={() => onAdd(product)}
              disabled={stock === "Out of Stock"}
            >
              Add
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProductOverview({
  product,
  onAdd,
}: {
  product: ShopProduct;
  onAdd: (product: ShopProduct) => void;
}) {
  return (
    <div className="space-y-5">
      <DialogHeader>
        <DialogTitle className="flex items-center justify-between gap-3 text-2xl">
          <span>{product.name}</span>
          <Badge variant="outline">{statusLabel(product.status)}</Badge>
        </DialogTitle>
      </DialogHeader>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-64 overflow-hidden rounded-xl border bg-muted">
          <ProductImage product={product} />
        </div>

        <div className="space-y-3 rounded-xl border bg-background p-4">
          <p className="text-sm text-muted-foreground">{product.description}</p>
          <p className="text-sm">
            <span className="font-semibold">Specification:</span>{" "}
            {product.specification}
          </p>
          <p className="text-sm">
            <span className="font-semibold">Warranty:</span> {product.warranty}
          </p>
          <p className="text-sm">
            <span className="font-semibold">Vendor:</span>{" "}
            {product.primaryVendor}
          </p>
          <p className="text-sm">
            <span className="font-semibold">Lead Time:</span> {product.leadTime}
          </p>

          <div className="pt-2">
            <Button
              className="w-full"
              onClick={() => onAdd(product)}
              disabled={statusLabel(product.status) === "Out of Stock"}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Add To Cart
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ShopPage() {
  const navigate = useNavigate();
  const { addToCart, totalItems } = useCart();
  const { masterCatalogItems } = useData();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState<ShopProduct | null>(
    null,
  );

  const products = useMemo<ShopProduct[]>(() => {
    const fromCatalog = masterCatalogItems
      .filter((item) => !!item.name && !!item.category)
      .map((item, idx) => ({
        id: Number(item.id.replace(/\D/g, "")) || idx + 1,
        sku: item.productCode || `SKU-${idx + 1000}`,
        name: item.name,
        category: item.category,
        subCategory: item.subCategory || "General",
        brand: item.brand || "Nido",
        price: Number(item.price) || 0,
        emoji: item.category.toLowerCase().includes("hardware")
          ? "💻"
          : item.category.toLowerCase().includes("stationery")
            ? "📄"
            : "📦",
        image: item.image || toDataUri(item.name, "📦"),
        description:
          item.description?.trim() ||
          `${item.name} is optimized for business procurement with dependable pricing and delivery planning.`,
        specification:
          item.specification || "Detailed specification available.",
        warranty: item.warranty || "Standard warranty",
        primaryVendor: item.primaryVendor || "Preferred vendor network",
        leadTime: item.leadTime || "5-7 Days",
        status: statusLabel(item.status) as "In Stock" | "Out of Stock",
      }));

    return fromCatalog.length > 0 ? fromCatalog : fallbackProducts;
  }, [masterCatalogItems]);

  const categories = useMemo(() => {
    const keys = Array.from(new Set(products.map((p) => p.category)));
    return ["all", ...keys];
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter((product) => {
      const searchMatch =
        !search ||
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.sku.toLowerCase().includes(search.toLowerCase()) ||
        product.description.toLowerCase().includes(search.toLowerCase());
      const categoryMatch = category === "all" || product.category === category;
      return searchMatch && categoryMatch;
    });
  }, [products, search, category]);

  const handleAddToCart = (product: ShopProduct) => {
    addToCart({
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      emoji: product.emoji,
    });
    toast.success(`${product.name} added to cart`);
  };

  return (
    <div className="space-y-6 pb-10">
      <section className="relative overflow-hidden rounded-3xl border border-blue-200/60 bg-gradient-to-br from-slate-100 via-blue-50 to-cyan-100 p-6 md:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-blue-400/20 blur-2xl" />
        <div className="pointer-events-none absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-cyan-500/20 blur-2xl" />

        <div className="relative space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-300/60 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-blue-700">
                <Sparkles className="h-3.5 w-3.5" />
                Smart Commerce Hub
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                Shop Catalog
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600 md:text-base">
                Explore enterprise-ready products with strong descriptions,
                accurate visibility and a modern buying experience.
              </p>
            </div>

            <Button
              className="h-11 gap-2 rounded-full bg-slate-900 px-5 text-white hover:bg-slate-800"
              onClick={() => navigate("/shop/cart")}
            >
              <ShoppingCart className="h-4 w-4" />
              Cart
              <Badge className="bg-white text-slate-900">{totalItems}</Badge>
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_220px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products by name, SKU, description"
                className="h-11 rounded-xl border-white/80 bg-white/90 pl-10"
              />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-11 rounded-xl border-white/80 bg-white/90">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((item) => (
                  <SelectItem value={item} key={item}>
                    {item === "all" ? "All Categories" : item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {filtered.length} product{filtered.length === 1 ? "" : "s"}
          </p>
          <p className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            <Layers3 className="h-3.5 w-3.5" />
            Professional procurement view
          </p>
        </div>

        {filtered.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <ImageOff className="mx-auto mb-2 h-10 w-10 text-muted-foreground" />
              <p className="text-base font-medium">No products found</p>
              <p className="text-sm text-muted-foreground">
                Try adjusting search text or selecting a different category.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filtered.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAdd={handleAddToCart}
                onView={setSelectedProduct}
              />
            ))}
          </div>
        )}
      </section>

      <Dialog
        open={!!selectedProduct}
        onOpenChange={(open) => !open && setSelectedProduct(null)}
      >
        <DialogContent className="max-w-4xl">
          {selectedProduct ? (
            <ProductOverview
              product={selectedProduct}
              onAdd={handleAddToCart}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <div className="flex justify-end">
        <Button variant="outline" onClick={() => navigate("/shop/cart")}>
          Proceed to Cart
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
