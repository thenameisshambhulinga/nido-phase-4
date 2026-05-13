import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  ImageOff,
  Layers3,
  List,
  Search,
  ShieldCheck,
  ShoppingCart,
  Star,
  Truck,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";
import { useData } from "@/contexts/DataContext";
import {
  PAGE_PILL_BUTTON_CLASS,
  PAGE_PILL_PRIMARY_BUTTON_CLASS,
} from "@/lib/navigationStyles";
import { cn } from "@/lib/utils";
import { getProductEmoji, resolveProductImage } from "@/lib/catalogMedia";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  rating: number;
  stock: number;
  emoji: string;
  description: string;
  image: string;
  warranty: string;
  leadTime: string;
  sku: string;
}

const PAGE_SIZE = 8;

function getStockFromStatus(status?: string, initialStock?: number) {
  if (status === "Out of Stock") return 0;
  return initialStock ?? 50;
}

function ProductImage({ product }: { product: Product }) {
  const [failed, setFailed] = useState(false);
  const source = failed
    ? resolveProductImage({
        name: product.name,
        category: product.category,
        emoji: product.emoji,
      })
    : product.image;

  return (
    <img
      src={source}
      alt={product.name}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className="h-full w-full object-contain transition duration-700 group-hover:scale-[1.03]"
    />
  );
}

function ProductCard({
  product,
  onAdd,
  onOpen,
}: {
  product: Product;
  onAdd: (item: Product) => void;
  onOpen: (item: Product) => void;
}) {
  const inStock = product.stock > 0;

  return (
    <Card
      className="group flex h-full flex-col overflow-hidden rounded-[28px] border-border/60 bg-white/90 shadow-[0_12px_35px_-24px_rgba(15,23,42,0.45)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_30px_70px_-32px_rgba(15,23,42,0.5)]"
      role="button"
      tabIndex={0}
      onClick={() => onOpen(product)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(product);
        }
      }}
    >
      <div className="relative h-[255px] overflow-hidden bg-gradient-to-br from-slate-50 via-white to-cyan-50 p-4">
        <ProductImage product={product} />
        <div className="absolute left-4 top-4">
          <Badge className="rounded-full border border-white/70 bg-white/90 px-3 py-1 text-[11px] font-semibold text-slate-700">
            {product.category}
          </Badge>
        </div>
        <div className="absolute right-4 top-4">
          <Badge
            className={cn(
              "rounded-full px-3 py-1 text-[11px]",
              inStock ? "bg-emerald-600 text-white" : "bg-rose-600 text-white",
            )}
          >
            {inStock ? "In Stock" : "Out of Stock"}
          </Badge>
        </div>
      </div>

      <CardContent className="flex flex-1 flex-col p-5">
        <div className="space-y-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">
              {product.sku}
            </p>
            <h3 className="mt-1 line-clamp-2 min-h-[52px] text-[1.02rem] font-semibold leading-6 text-slate-950">
              {product.name}
            </h3>
          </div>

          <p className="line-clamp-2 min-h-[42px] text-sm leading-6 text-slate-600">
            {product.description}
          </p>

          <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50 px-3 py-2">
              <p className="font-medium text-slate-900">MOQ 1</p>
              <p className="mt-0.5 text-[11px] text-slate-500">Minimum order</p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50 px-3 py-2">
              <p className="font-medium text-slate-900">{product.warranty}</p>
              <p className="mt-0.5 text-[11px] text-slate-500">Warranty</p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50 px-3 py-2">
              <p className="font-medium text-slate-900">{product.leadTime}</p>
              <p className="mt-0.5 text-[11px] text-slate-500">Lead time</p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50 px-3 py-2">
              <p className="flex items-center gap-1 font-medium text-slate-900">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                {product.rating.toFixed(1)}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">Rating</p>
            </div>
          </div>

          <Separator className="bg-slate-200" />

          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                Enterprise pricing
              </p>
              <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
                ₹{product.price.toLocaleString()}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-10 rounded-full border-slate-300 px-4"
                onClick={() => onOpen(product)}
              >
                Details
              </Button>
              <Button
                size="sm"
                disabled={!inStock}
                className="h-10 rounded-full bg-slate-950 px-4 text-white hover:bg-slate-800"
                onClick={() => onAdd(product)}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Add
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CategoriesPage() {
  const navigate = useNavigate();
  const { addToCart, totalItems } = useCart();
  const { masterCatalogItems, isCoreDataLoading } = useData();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const deferredSearch = useDeferredValue(search);

  const products = useMemo<Product[]>(() => {
    return masterCatalogItems
      .filter((item) => !!item.name && !!item.category)
      .map((item, index) => {
        const stock = getStockFromStatus(item.status, item.initialStock);
        return {
          id: item.id || item.masterProductId || `prd-${index}`,
          name: item.name,
          category: item.category,
          price: Number(item.price) || 0,
          rating: item.performanceRating ?? 4.8,
          stock,
          emoji: item.emoji || getProductEmoji(item.category, item.name),
          description:
            item.description?.trim() ||
            `${item.name} is optimized for business procurement with dependable pricing and delivery planning.`,
          image: resolveProductImage({
            name: item.name,
            category: item.category,
            brand: item.brand,
            image: item.image,
            emoji: item.emoji,
          }),
          warranty: item.warranty || "Standard warranty",
          leadTime: item.leadTime || "5-7 Days",
          sku: item.productCode || `SKU-${index + 1000}`,
        };
      });
  }, [masterCatalogItems]);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map((item) => item.category)));
    return ["All Categories", ...cats];
  }, [products]);

  const filtered = useMemo(() => {
    const term = deferredSearch.trim().toLowerCase();
    return products.filter((product) => {
      const matchesSearch =
        !term ||
        product.name.toLowerCase().includes(term) ||
        product.description.toLowerCase().includes(term) ||
        product.category.toLowerCase().includes(term) ||
        product.sku.toLowerCase().includes(term);
      const matchesCategory =
        category === "All Categories" || product.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [products, deferredSearch, category]);

  const suggestions = useMemo(() => {
    const term = deferredSearch.trim().toLowerCase();
    if (!term) return [];
    return products
      .filter((product) => {
        const haystack =
          `${product.name} ${product.category} ${product.description}`.toLowerCase();
        return haystack.includes(term);
      })
      .slice(0, 5);
  }, [products, deferredSearch]);

  useEffect(() => {
    setPage(1);
  }, [deferredSearch, category, viewMode]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  useEffect(() => {
    setPage((value) => Math.min(value, totalPages));
  }, [totalPages]);

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id,
      name: product.name,
      category: product.category,
      sku: product.sku,
      description: product.description,
      warranty: product.warranty,
      leadTime: product.leadTime,
      status: product.stock > 0 ? "In Stock" : "Out of Stock",
      price: product.price,
      emoji: product.emoji,
      image: product.image,
      stock: product.stock,
    });
    toast.success(`${product.name} added to cart`);
  };

  return (
    <div className="relative min-h-full bg-slate-50 p-6 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="relative overflow-hidden rounded-[32px] border border-sky-200 bg-[linear-gradient(135deg,#eff6ff_0%,#f8fafc_48%,#ecfeff_100%)] p-6 shadow-[0_24px_80px_-50px_rgba(15,23,42,0.45)] md:p-8">
          <div className="pointer-events-none absolute -right-20 -top-16 h-56 w-56 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -left-12 bottom-0 h-44 w-44 rounded-full bg-cyan-400/25 blur-3xl" />

          <div className="relative space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-300/60 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-blue-700">
                  <Layers3 className="h-3.5 w-3.5" />
                  Curated Categories
                </p>
                <h1 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
                  Product Categories
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600 md:text-[15px]">
                  Explore premium business essentials with catalog-grade
                  discovery, product intelligence, and fast procurement actions.
                </p>
              </div>

              <Button
                onClick={() => navigate("/shop/cart")}
                className="h-11 rounded-full bg-slate-950 px-5 text-white shadow-lg hover:bg-slate-800"
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Cart
                <span className="ml-2 inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-white px-1.5 text-xs font-bold text-slate-900">
                  {totalItems}
                </span>
              </Button>
            </div>

            <Card className="border-white/80 bg-white/80 backdrop-blur">
              <CardContent className="space-y-3 p-3 md:p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Search products, categories, keywords"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="h-12 rounded-2xl border-slate-200 bg-white pl-10"
                  />
                </div>

                {suggestions.length > 0 && (
                  <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-2">
                    <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-700">
                      Smart suggestions
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {suggestions.map((product) => (
                        <button
                          key={product.id}
                          onClick={() => setSearch(product.name)}
                          className="rounded-full border border-sky-100 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-sky-200 hover:text-slate-950"
                        >
                          {product.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1">
                    <Button
                      size="icon"
                      variant={viewMode === "grid" ? "default" : "ghost"}
                      className="h-9 w-9"
                      onClick={() => setViewMode("grid")}
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant={viewMode === "list" ? "default" : "ghost"}
                      className="h-9 w-9"
                      onClick={() => setViewMode("list")}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
                    {filtered.length} results
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-600">
            Showing {filtered.length} product{filtered.length === 1 ? "" : "s"}
          </p>
          <p className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5" />
            Professional procurement view
          </p>
        </div>

        {isCoreDataLoading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <Card
                key={index}
                className="h-[460px] animate-pulse rounded-[28px] border-slate-200 bg-white"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-dashed border-slate-300 bg-white/80">
            <CardContent className="py-20 text-center text-slate-500">
              <ImageOff className="mx-auto mb-3 h-10 w-10" />
              <p className="text-lg font-medium text-slate-900">
                No products found
              </p>
              <p className="mt-1 text-sm">
                Try adjusting your search keyword or category filter.
              </p>
            </CardContent>
          </Card>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {paginated.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAdd={handleAddToCart}
                onOpen={(item) => navigate(`/shop/product/${item.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {paginated.map((product) => (
              <Card
                key={product.id}
                className="cursor-pointer rounded-2xl border-slate-200 bg-white shadow-sm transition hover:shadow-md"
                onClick={() => navigate(`/shop/product/${product.id}`)}
              >
                <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center">
                  <div className="h-28 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2 md:w-36">
                    <ProductImage product={product} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                      {product.sku}
                    </p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">
                      {product.name}
                    </p>
                    <p className="mt-1 line-clamp-1 text-sm text-slate-500">
                      {product.description}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <Badge variant="outline">{product.category}</Badge>
                      <span className="inline-flex items-center gap-1">
                        <Truck className="h-3.5 w-3.5" /> {product.leadTime}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        {product.rating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 md:flex-col md:items-end">
                    <p className="text-2xl font-semibold text-slate-950">
                      ₹{product.price.toLocaleString()}
                    </p>
                    <Button
                      size="sm"
                      className="h-10 rounded-full bg-slate-950 px-4 text-white"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleAddToCart(product);
                      }}
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Add
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="flex flex-col items-center justify-between gap-3 rounded-[28px] border border-slate-200 bg-white/85 px-4 py-4 shadow-sm md:flex-row">
          <p className="text-sm text-slate-600">
            Page {page} of {totalPages} · {filtered.length} total results
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className={PAGE_PILL_BUTTON_CLASS}
              disabled={page === 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }).map(
                (_, index) => {
                  const pageNo = index + 1;
                  return (
                    <button
                      key={pageNo}
                      onClick={() => setPage(pageNo)}
                      className={cn(
                        "h-10 min-w-10 rounded-full px-3 text-sm font-medium transition",
                        pageNo === page
                          ? "bg-slate-950 text-white"
                          : "border border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-950",
                      )}
                    >
                      {pageNo}
                    </button>
                  );
                },
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              className={PAGE_PILL_BUTTON_CLASS}
              disabled={page === totalPages}
              onClick={() =>
                setPage((value) => Math.min(totalPages, value + 1))
              }
            >
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            className="h-10 rounded-full border-slate-300 px-4"
            onClick={() => navigate("/shop/cart")}
          >
            Go to cart
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
