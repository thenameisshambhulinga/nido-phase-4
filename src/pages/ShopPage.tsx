import {
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ImageOff,
<<<<<<< HEAD
  Search,
  ShoppingCart,
  SlidersHorizontal,
} from "lucide-react";

import EnterpriseProductCard from "@/components/shop/EnterpriseProductCard";
import { ProductGridLayout } from "@/components/shared/ProductGridLayout";
=======
  PackageCheck,
  Search,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Truck,
} from "lucide-react";

>>>>>>> 67d1e15f2fd66c27748766bdee559c6aee16d96e
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
<<<<<<< HEAD
import { useCart } from "@/contexts/CartContext";
import { useData } from "@/contexts/DataContext";
import { getProductEmoji, getProductImage } from "@/lib/catalogMedia";
import { cn } from "@/lib/utils";
=======
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";
import { useData } from "@/contexts/DataContext";
import { cn } from "@/lib/utils";
import { getProductEmoji, resolveProductImage } from "@/lib/catalogMedia";
>>>>>>> 67d1e15f2fd66c27748766bdee559c6aee16d96e

interface ShopProduct {
  id: string;
  sku: string;
  name: string;
<<<<<<< HEAD
  minOrder: number;
=======
>>>>>>> 67d1e15f2fd66c27748766bdee559c6aee16d96e
  category: string;
  subCategory: string;
  brand: string;
  price: number;
  emoji: string;
  image: string;
  description: string;
  warranty: string;
  leadTime: string;
  status: "In Stock" | "Out of Stock";
<<<<<<< HEAD
  stock: number;
=======
>>>>>>> 67d1e15f2fd66c27748766bdee559c6aee16d96e
}

const PAGE_SIZE = 12;

<<<<<<< HEAD
function CardSkeleton() {
  return (
    <Card className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="p-5">
        <div className="mb-4 aspect-[4/3] animate-pulse rounded-xl bg-slate-100" />
        <div className="space-y-3">
          <div className="h-5 w-3/4 rounded-full bg-slate-100" />
          <div className="h-4 w-1/3 rounded-full bg-slate-100" />
          <div className="space-y-2 pt-2">
            <div className="h-3 w-full rounded-full bg-slate-100" />
            <div className="h-3 w-11/12 rounded-full bg-slate-100" />
            <div className="h-3 w-4/5 rounded-full bg-slate-100" />
          </div>
          <div className="flex items-center justify-between pt-6">
            <div className="space-y-2">
              <div className="h-3 w-14 rounded-full bg-slate-100" />
              <div className="h-6 w-24 rounded-full bg-slate-100" />
            </div>
            <div className="h-6 w-20 rounded-full bg-slate-100" />
          </div>
          <div className="grid grid-cols-2 gap-2 pt-3">
            <div className="h-10 rounded-xl bg-slate-100" />
            <div className="h-10 rounded-xl bg-slate-100" />
          </div>
        </div>
      </div>
=======
function ProductImage({ product }: { product: ShopProduct }) {
  const [failed, setFailed] = useState(false);
  const src = failed
    ? resolveProductImage({
        name: product.name,
        category: product.category,
        brand: product.brand,
        emoji: product.emoji,
      })
    : product.image;

  return (
    <img
      src={src}
      alt={product.name}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className="h-full w-full object-contain transition duration-700 group-hover:scale-[1.03]"
    />
  );
}

function CardSkeleton() {
  return (
    <Card className="overflow-hidden rounded-[28px] border-border/60 bg-white/90 shadow-sm">
      <div className="h-[270px] animate-pulse bg-gradient-to-br from-slate-100 via-slate-50 to-cyan-50" />
      <CardContent className="space-y-4 p-5">
        <div className="h-3 w-24 rounded-full bg-slate-200" />
        <div className="h-5 w-3/4 rounded-full bg-slate-200" />
        <div className="h-3 w-full rounded-full bg-slate-200" />
        <div className="grid grid-cols-2 gap-2">
          <div className="h-10 rounded-2xl bg-slate-100" />
          <div className="h-10 rounded-2xl bg-slate-100" />
          <div className="h-10 rounded-2xl bg-slate-100" />
          <div className="h-10 rounded-2xl bg-slate-100" />
        </div>
        <div className="h-14 rounded-2xl bg-slate-100" />
      </CardContent>
    </Card>
  );
}

function ProductCard({
  product,
  onAdd,
  onView,
  onEnquire,
}: {
  product: ShopProduct;
  onAdd: (product: ShopProduct) => void;
  onView: (product: ShopProduct) => void;
  onEnquire: (product: ShopProduct) => void;
}) {
  const isInStock = product.status === "In Stock";

  return (
    <Card className="group flex h-full flex-col overflow-hidden rounded-[28px] border-border/60 bg-white/90 shadow-[0_12px_35px_-24px_rgba(15,23,42,0.45)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_30px_70px_-32px_rgba(15,23,42,0.5)]">
      <div className="relative h-[270px] overflow-hidden bg-gradient-to-br from-slate-50 via-white to-cyan-50 p-5">
        <ProductImage product={product} />

        <div className="pointer-events-none absolute inset-x-4 top-4 flex items-start justify-between gap-2">
          <Badge className="rounded-full border border-white/60 bg-white/90 px-3 py-1 text-[11px] font-semibold text-slate-700 shadow-sm backdrop-blur">
            {product.category}
          </Badge>
          <Badge
            className={cn(
              "rounded-full px-3 py-1 text-[11px] font-semibold shadow-sm",
              isInStock
                ? "bg-emerald-600 text-white"
                : "bg-rose-600 text-white",
            )}
          >
            {isInStock ? "In Stock" : "Out of Stock"}
          </Badge>
        </div>

        <div className="pointer-events-none absolute inset-x-4 bottom-4 rounded-3xl border border-white/70 bg-white/90 p-3 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.4)] backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                Enterprise ready
              </p>
              <p className="mt-1 line-clamp-1 text-sm font-medium text-slate-700">
                MOQ 1 unit • {product.leadTime}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-950 px-3 py-2 text-right text-white shadow-sm">
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/70">
                Price
              </p>
              <p className="text-base font-semibold">
                ₹{product.price.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      <CardContent className="flex flex-1 flex-col p-5">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                {product.sku}
              </p>
              <h3 className="mt-1 line-clamp-2 text-[1.02rem] font-semibold leading-6 text-slate-950">
                {product.name}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {product.category} • {product.subCategory}
              </p>
            </div>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-lg text-white shadow-sm">
              {product.emoji}
            </span>
          </div>

          <p className="line-clamp-2 min-h-[44px] text-sm leading-6 text-slate-600">
            {product.description}
          </p>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5 text-sky-600" />
            <span>{product.brand}</span>
            <span>•</span>
            <Truck className="h-3.5 w-3.5 text-sky-600" />
            <span>{product.leadTime}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50 px-3 py-2">
              <p className="font-medium text-slate-900">MOQ 1</p>
              <p className="mt-0.5 text-[11px] text-slate-500">Minimum order</p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50 px-3 py-2">
              <p className="font-medium text-slate-900">{product.warranty}</p>
              <p className="mt-0.5 text-[11px] text-slate-500">Warranty</p>
            </div>
          </div>

          <Separator className="my-1 bg-slate-200" />

          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                Enterprise pricing
              </p>
              <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
                ₹{product.price.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500">
                Excluding taxes and freight
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onView(product)}
                  className="h-9 flex-1 rounded-full border-slate-300 px-3 text-[12px]"
                >
                  Details
                </Button>
                <Button
                  size="sm"
                  onClick={() => onAdd(product)}
                  disabled={!isInStock}
                  className="h-9 flex-1 rounded-full bg-slate-950 px-3 text-[12px] text-white hover:bg-slate-800"
                >
                  Add
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEnquire(product)}
                className="h-9 w-full rounded-full border-sky-300 px-3 text-[12px] text-sky-700 hover:bg-sky-50"
              >
                Enquire
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
>>>>>>> 67d1e15f2fd66c27748766bdee559c6aee16d96e
    </Card>
  );
}

function PaginationButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={disabled}
<<<<<<< HEAD
      className="h-10 rounded-xl border-slate-300 px-4 text-slate-700"
=======
      className="h-10 rounded-full border-slate-300 px-4"
>>>>>>> 67d1e15f2fd66c27748766bdee559c6aee16d96e
    >
      {children}
    </Button>
  );
}

<<<<<<< HEAD
function normalizeStatus(status?: string) {
  return status === "Out of Stock" ? "Out of Stock" : "In Stock";
}

=======
>>>>>>> 67d1e15f2fd66c27748766bdee559c6aee16d96e
export default function ShopPage() {
  const navigate = useNavigate();
  const { addToCart, totalItems } = useCart();
  const { masterCatalogItems, isCoreDataLoading, coreDataError } = useData();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);
  const deferredSearch = useDeferredValue(search);

  const products = useMemo<ShopProduct[]>(() => {
    return masterCatalogItems
<<<<<<< HEAD
      .filter(
        (item) =>
          !!item.masterProductId &&
          !!item.productCode &&
          !!item.name &&
          !!item.category,
      )
      .map((item, index) => {
        const stock =
          item.status === "Out of Stock" ? 0 : item.initialStock || 100;

        return {
          id: item.id || item.masterProductId,
          sku: item.productCode,
          name: item.name,
          minOrder:
            Number(
              (item as { minOrder?: number; minOrderQuantity?: number })
                .minOrder ??
                (item as { minOrder?: number; minOrderQuantity?: number })
                  .minOrderQuantity,
            ) || 1,
          category: item.category,
          subCategory: item.subCategory || "General",
          brand: item.brand || "Nido",
          price: Number(item.price) || 0,
          emoji: getProductEmoji(item.category, item.name),
          image: getProductImage({
            category: item.category,
            image: item.image,
          }),
          description:
            item.description?.trim() ||
            `${item.name} is optimized for enterprise procurement workflows and repeat ordering.`,
          warranty: item.warranty || "Standard warranty",
          leadTime: item.leadTime || "5-7 Days",
          status: normalizeStatus(item.status),
          stock,
        };
      });
=======
      .filter((item) => !!item.name && !!item.category)
      .map((item, index) => ({
        id: item.id || item.masterProductId || `prd-${index}`,
        sku: item.productCode || `SKU-${index + 1000}`,
        name: item.name,
        category: item.category,
        subCategory: item.subCategory || "General",
        brand: item.brand || "Nido",
        price: Number(item.price) || 0,
        emoji: item.emoji || getProductEmoji(item.category, item.name),
        image: resolveProductImage({
          name: item.name,
          category: item.category,
          brand: item.brand,
          image: item.image,
          emoji: item.emoji,
        }),
        description: item.description || "",
        warranty: item.warranty || "Standard warranty",
        leadTime: item.leadTime || "5-7 Days",
        status: (item.status as "In Stock" | "Out of Stock") || "In Stock",
      }));
>>>>>>> 67d1e15f2fd66c27748766bdee559c6aee16d96e
  }, [masterCatalogItems]);

  const categories = useMemo(() => {
    return Array.from(
      new Set(products.map((product) => product.category).filter(Boolean)),
    ).sort((left, right) => left.localeCompare(right));
  }, [products]);

  const categoryCounts = useMemo(
    () =>
      ["all", ...categories].map((name) => ({
        name,
        count:
          name === "all"
            ? products.length
            : products.filter((product) => product.category === name).length,
      })),
    [categories, products],
  );

  const filtered = useMemo(() => {
    const term = deferredSearch.trim().toLowerCase();
<<<<<<< HEAD

=======
>>>>>>> 67d1e15f2fd66c27748766bdee559c6aee16d96e
    return products.filter((product) => {
      const searchMatch =
        !term ||
        product.name.toLowerCase().includes(term) ||
        product.sku.toLowerCase().includes(term) ||
        product.category.toLowerCase().includes(term) ||
        product.subCategory.toLowerCase().includes(term) ||
<<<<<<< HEAD
        product.brand.toLowerCase().includes(term) ||
        product.description.toLowerCase().includes(term);
      const categoryMatch = category === "all" || product.category === category;

=======
        product.description.toLowerCase().includes(term);
      const categoryMatch = category === "all" || product.category === category;
>>>>>>> 67d1e15f2fd66c27748766bdee559c6aee16d96e
      return searchMatch && categoryMatch;
    });
  }, [products, deferredSearch, category]);

  const suggestions = useMemo(() => {
    const term = deferredSearch.trim().toLowerCase();
    if (!term) return [];

    return products
      .map((product) => {
        const haystack = [
          product.name,
          product.sku,
          product.category,
          product.subCategory,
          product.brand,
          product.description,
        ]
          .join(" ")
          .toLowerCase();

        let score = 0;
        if (product.name.toLowerCase().startsWith(term)) score += 50;
        if (product.category.toLowerCase().startsWith(term)) score += 35;
        if (product.brand.toLowerCase().includes(term)) score += 15;
        if (haystack.includes(term)) score += 20;
<<<<<<< HEAD

=======
>>>>>>> 67d1e15f2fd66c27748766bdee559c6aee16d96e
        return { product, score };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((entry) => entry.product);
  }, [products, deferredSearch]);

  useEffect(() => {
    setPage(1);
  }, [deferredSearch, category]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

<<<<<<< HEAD
  const visibleRangeStart =
    filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const visibleRangeEnd = Math.min(page * PAGE_SIZE, filtered.length);

  const handleAddToCart = (product: ShopProduct) => {
    if (product.status === "Out of Stock") {
      toast.error(`${product.name} is currently unavailable`);
      return;
    }

=======
  const handleAddToCart = (product: ShopProduct) => {
>>>>>>> 67d1e15f2fd66c27748766bdee559c6aee16d96e
    addToCart({
      id: product.id,
      name: product.name,
      category: product.category,
<<<<<<< HEAD
      subCategory: product.subCategory,
      brand: product.brand,
      sku: product.sku,
      description: product.description,
      warranty: product.warranty,
      leadTime: product.leadTime,
      status: product.status,
      price: product.price,
      emoji: product.emoji,
      image: product.image,
      stock: product.stock,
      minOrder: product.minOrder,
    });

=======
      price: product.price,
      emoji: product.emoji,
      image: product.image,
    });
>>>>>>> 67d1e15f2fd66c27748766bdee559c6aee16d96e
    toast.success(`${product.name} added to cart`);
  };

  return (
<<<<<<< HEAD
    <div className="mx-auto max-w-[1600px] space-y-6 pb-10">
      <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_18px_48px_-32px_rgba(15,23,42,0.18)] md:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Enterprise Catalog
            </div>
            <div>
              <h1 className="text-4xl font-semibold tracking-tight text-slate-900 md:text-[42px]">
                Products
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-500 md:text-[15px]">
                Manage and organize your product catalog with consistent
                imagery, premium procurement cards, and enterprise-friendly
                search and filtering.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              className="h-11 rounded-xl bg-blue-600 px-5 text-white hover:bg-blue-700"
              onClick={() => navigate("/shop/cart")}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              View Cart
              <Badge className="ml-3 bg-white text-blue-700 hover:bg-white">
                {totalItems}
              </Badge>
            </Button>
            <Button
              variant="outline"
              className="h-11 rounded-xl border-slate-300 px-5 text-slate-700"
              onClick={() => navigate("/categories")}
            >
              Browse Categories
            </Button>
            <Button
              variant="outline"
              className="h-11 rounded-xl border-slate-300 px-5 text-slate-700"
              onClick={() => navigate("/support")}
            >
              Procurement Support
            </Button>
          </div>
        </div>

        <div className="mt-8 grid gap-3 xl:grid-cols-[minmax(0,1.3fr)_240px_220px_180px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search products, SKUs, categories, vendors"
              className="h-12 rounded-2xl border-slate-200 bg-white pl-11 text-[15px] shadow-sm"
            />
          </div>

          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white shadow-sm">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((item) => (
                <SelectItem value={item} key={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Results
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {filtered.length} product{filtered.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Page
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {page}/{totalPages}
            </p>
          </div>
        </div>

        {suggestions.length > 0 && (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Smart Suggestions
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => setSearch(product.name)}
                  className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-blue-200 hover:text-blue-700"
                >
                  {product.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {categoryCounts.map((entry) => (
            <button
              key={entry.name}
              type="button"
              onClick={() => setCategory(entry.name)}
              className={cn(
                "rounded-full border px-4 py-2 text-xs font-medium transition",
                category === entry.name
                  ? "border-blue-200 bg-blue-50 text-blue-700"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900",
              )}
            >
              {entry.name === "all" ? "All Categories" : entry.name}
              <span className="ml-2 text-slate-400">{entry.count}</span>
            </button>
          ))}
=======
    <div className="space-y-6 pb-10">
      <section className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-[linear-gradient(135deg,#eff6ff_0%,#f8fafc_48%,#ecfeff_100%)] p-6 shadow-[0_24px_80px_-50px_rgba(15,23,42,0.45)] md:p-8">
        <div className="pointer-events-none absolute -right-24 -top-20 h-64 w-64 rounded-full bg-sky-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-14 bottom-0 h-52 w-52 rounded-full bg-cyan-400/15 blur-3xl" />

        <div className="relative grid gap-6 xl:grid-cols-[1.15fr_0.85fr] xl:items-end">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-700 shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Curated enterprise catalogue
            </div>
            <div className="space-y-3">
              <h1 className="text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
                Shop Catalog
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-slate-600 md:text-[15px]">
                Explore enterprise-ready products with premium product cards,
                smarter search suggestions, category intelligence, and a faster
                procurement flow.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {categoryCounts.slice(0, 4).map((entry) => (
                <button
                  key={entry.name}
                  onClick={() => setCategory(entry.name)}
                  className="rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-white"
                >
                  {entry.name} · {entry.count}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-sky-600" />
                Verified procurement data
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-1.5">
                <Truck className="h-3.5 w-3.5 text-sky-600" />
                Delivery aware pricing
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-1.5">
                <PackageCheck className="h-3.5 w-3.5 text-sky-600" />
                MOQ visibility
              </span>
            </div>
          </div>

          <Card className="border-white/80 bg-white/80 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.45)] backdrop-blur">
            <CardContent className="space-y-4 p-4 md:p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Search and filter
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Fast keyword matching with curated category filtering.
                  </p>
                </div>
                <Button
                  className="h-11 rounded-full bg-slate-950 px-5 text-white hover:bg-slate-800"
                  onClick={() => navigate("/shop/cart")}
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Cart
                  <Badge className="ml-3 bg-white text-slate-950">
                    {totalItems}
                  </Badge>
                </Button>
              </div>

              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search products, categories, vendors, keywords"
                  className="h-12 rounded-2xl border-slate-200 bg-white pl-11 text-[15px] shadow-sm"
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
                        className="rounded-full border border-sky-100 bg-white px-3 py-2 text-left text-xs font-medium text-slate-700 shadow-sm transition hover:border-sky-200 hover:text-slate-950"
                      >
                        {product.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid gap-3 md:grid-cols-[1fr_230px]">
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white shadow-sm">
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
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Result count
                    </p>
                    <p className="text-sm font-medium text-slate-900">
                      {filtered.length} item{filtered.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Page
                    </p>
                    <p className="text-sm font-medium text-slate-900">
                      {page} / {totalPages}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
>>>>>>> 67d1e15f2fd66c27748766bdee559c6aee16d96e
        </div>
      </section>

      <section className="space-y-4">
<<<<<<< HEAD
        <div className="flex flex-col gap-3 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-900">
              Showing {visibleRangeStart}-{visibleRangeEnd} of {filtered.length}{" "}
              products
            </p>
            <p className="text-sm text-slate-500">
              {isCoreDataLoading
                ? "Loading enterprise catalog records..."
                : "Consistent product media, clean spacing, and procurement-ready actions."}
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="h-10 rounded-xl border-slate-300 px-4 text-slate-700"
=======
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-900">
              Showing {filtered.length} product
              {filtered.length === 1 ? "" : "s"}
            </p>
            <p className="text-sm text-slate-500">
              {isCoreDataLoading
                ? "Loading catalogue records..."
                : "Premium catalog cards with consistent image scaling and spacing."}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-10 rounded-full border-slate-300 px-4"
>>>>>>> 67d1e15f2fd66c27748766bdee559c6aee16d96e
            onClick={() => navigate("/shop/cart")}
          >
            Go to cart
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {isCoreDataLoading ? (
<<<<<<< HEAD
          <ProductGridLayout>
            {Array.from({ length: PAGE_SIZE }).map((_, index) => (
              <CardSkeleton key={index} />
            ))}
          </ProductGridLayout>
        ) : filtered.length === 0 ? (
          <Card className="border-dashed border-slate-300 bg-white">
=======
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <CardSkeleton key={index} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-dashed border-slate-300 bg-white/80">
>>>>>>> 67d1e15f2fd66c27748766bdee559c6aee16d96e
            <CardContent className="py-16 text-center">
              <ImageOff className="mx-auto mb-3 h-10 w-10 text-slate-400" />
              <p className="text-lg font-medium text-slate-900">
                No products found
              </p>
              <p className="mx-auto mt-1 max-w-xl text-sm text-slate-500">
                {coreDataError
                  ? coreDataError
                  : "Try adjusting the search keyword or category filter to surface products from the master catalogue."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
<<<<<<< HEAD
            <ProductGridLayout>
              {paginated.map((product) => (
                <EnterpriseProductCard
                  key={product.id}
                  product={product}
                  onAdd={() => handleAddToCart(product)}
                  onEnquire={() =>
                    navigate(`/shop/product/${product.id}/enquire`)
                  }
                />
              ))}
            </ProductGridLayout>

            <div className="flex flex-col items-center justify-between gap-4 rounded-[28px] border border-slate-200 bg-white px-4 py-4 shadow-sm md:flex-row">
              <p className="text-sm text-slate-600">
                Page {page} of {totalPages} · {filtered.length} total results
              </p>
              <div className="flex flex-wrap items-center gap-2">
=======
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {paginated.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAdd={handleAddToCart}
                  onView={(item) => navigate(`/shop/product/${item.id}`)}
                  onEnquire={(item) =>
                    navigate(`/shop/product/${item.id}/enquire`)
                  }
                />
              ))}
            </div>

            <div className="flex flex-col items-center justify-between gap-3 rounded-[28px] border border-slate-200 bg-white/85 px-4 py-4 shadow-sm md:flex-row">
              <p className="text-sm text-slate-600">
                Page {page} of {totalPages} · {filtered.length} total results
              </p>
              <div className="flex items-center gap-2">
>>>>>>> 67d1e15f2fd66c27748766bdee559c6aee16d96e
                <PaginationButton
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Previous
                </PaginationButton>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }).map(
                    (_, index) => {
                      const pageNumber = index + 1;
<<<<<<< HEAD

                      return (
                        <button
                          key={pageNumber}
                          type="button"
                          onClick={() => setPage(pageNumber)}
                          className={cn(
                            "h-10 min-w-10 rounded-xl border px-3 text-sm font-medium transition",
                            page === pageNumber
                              ? "border-blue-600 bg-blue-600 text-white"
                              : "border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-900",
=======
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => setPage(pageNumber)}
                          className={cn(
                            "h-10 min-w-10 rounded-full px-3 text-sm font-medium transition",
                            page === pageNumber
                              ? "bg-slate-950 text-white"
                              : "border border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-950",
>>>>>>> 67d1e15f2fd66c27748766bdee559c6aee16d96e
                          )}
                        >
                          {pageNumber}
                        </button>
                      );
                    },
                  )}
                </div>
                <PaginationButton
                  onClick={() =>
                    setPage((value) => Math.min(totalPages, value + 1))
                  }
                  disabled={page === totalPages}
                >
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </PaginationButton>
              </div>
            </div>
          </>
        )}
      </section>
<<<<<<< HEAD
=======

      <div className="flex justify-end">
        <Button
          variant="outline"
          className="h-11 rounded-full border-slate-300 px-5"
          onClick={() => navigate("/shop/cart")}
        >
          Proceed to Cart
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
>>>>>>> 67d1e15f2fd66c27748766bdee559c6aee16d96e
    </div>
  );
}
