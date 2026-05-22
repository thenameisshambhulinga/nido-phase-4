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
  Search,
  ShoppingCart,
  SlidersHorizontal,
} from "lucide-react";

import EnterpriseProductCard from "@/components/shop/EnterpriseProductCard";
import { ProductGridLayout } from "@/components/shared/ProductGridLayout";
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
import { useCart } from "@/contexts/CartContext";
import { useData } from "@/contexts/DataContext";
import { getProductEmoji, getProductImage } from "@/lib/catalogMedia";
import {
  PAGE_PILL_BUTTON_CLASS,
  PAGE_PILL_PRIMARY_BUTTON_CLASS,
} from "@/lib/navigationStyles";
import { cn } from "@/lib/utils";

interface ShopProduct {
  id: string;
  sku: string;
  name: string;
  minOrder: number;
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
  stock: number;

  // Phase 1 — Shop card data
  productNotes?: string;
  tags?: string[];
  images?: string[];
  vendorInventory?: any[];
  keySpecifications?: Array<{ name?: string; label?: string; value?: any }>;
  generalSpecifications?: Array<{ name?: string; label?: string; value?: any }>;
}

const PAGE_SIZE = 12;

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
      className={PAGE_PILL_BUTTON_CLASS}
    >
      {children}
    </Button>
  );
}

function normalizeStatus(status?: string) {
  return status === "Out of Stock" ? "Out of Stock" : "In Stock";
}

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
      .filter(
        (item) =>
          !!item.masterProductId &&
          !!item.productCode &&
          !!item.name &&
          !!item.category &&
          item.productStatus !== "draft",
      )
      .map((item) => {
        const vendorInventory = item.vendorInventory || [];
        const vendorStock = vendorInventory.reduce(
          (sum, v) => sum + (Number(v.quantity) || 0),
          0,
        );

        const stock =
          item.status === "Out of Stock"
            ? 0
            : vendorStock > 0
              ? vendorStock
              : item.initialStock || 0;

        const leadTime =
          (item.leadTime && String(item.leadTime).trim()) ||
          vendorInventory.find((v) => (v.leadTime || "").trim())?.leadTime ||
          "";

        // keySpecifications/generalSpecifications may be persisted either as
        // explicit arrays or via legacy fields (specAttributes/specification).
        const keySpecifications = (item as any).keySpecifications || []; // preferred shape: [{name,value}]
        const generalSpecifications = (item as any).generalSpecifications || []; // preferred shape: [{name,value}]

        // If legacy shape exists as specification, fall back to empty (no placeholders).
        const images =
          ((item as any).images as string[] | undefined) || item.image
            ? [item.image].filter(Boolean) // at least one image fallback is acceptable (media placeholder)
            : [];

        return {
          id: item.id || item.masterProductId!,
          sku: item.productCode,
          name: item.name,
          minOrder: Number((item as any).minOrder || 1) || 1,
          category: item.category,
          subCategory: item.subCategory || "General",
          brand: item.brand || "",
          price: Number(item.price) || 0,
          emoji: getProductEmoji(item.category, item.name),
          image: getProductImage({
            category: item.category,
            image: item.image,
          }),
          description: (item.description || "").trim(),
          warranty: item.warranty || "",
          leadTime,

          productNotes: item.productNotes,

          tags: item.tags || [],
          images,
          vendorInventory: vendorInventory as any,
          keySpecifications,
          generalSpecifications,

          status: normalizeStatus(item.status),
          stock,
        };
      });
  }, [masterCatalogItems]);

  const categories = useMemo(() => {
    return Array.from(
      new Set(products.map((product) => product.category).filter(Boolean)),
    ).sort((left, right) => left.localeCompare(right));
  }, [products]);

  const filtered = useMemo(() => {
    const term = deferredSearch.trim().toLowerCase();

    const result = products.filter((product) => {
      const searchMatch =
        !term ||
        product.name.toLowerCase().includes(term) ||
        product.sku.toLowerCase().includes(term) ||
        product.category.toLowerCase().includes(term) ||
        product.subCategory.toLowerCase().includes(term) ||
        product.brand.toLowerCase().includes(term) ||
        product.description.toLowerCase().includes(term);
      const categoryMatch = category === "all" || product.category === category;

      return searchMatch && categoryMatch;
    });

    return result;
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

  const visibleRangeStart =
    filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const visibleRangeEnd = Math.min(page * PAGE_SIZE, filtered.length);

  const handleAddToCart = (product: ShopProduct) => {
    if (product.status === "Out of Stock") {
      toast.error(`${product.name} is currently unavailable`);
      return;
    }

    addToCart({
      id: product.id,
      name: product.name,
      category: product.category,
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

    toast.success(`${product.name} added to cart`);
  };

  return (
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
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              className={PAGE_PILL_PRIMARY_BUTTON_CLASS}
              onClick={() => navigate("/shop/cart")}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Cart
              <Badge className="ml-3 bg-white text-blue-700 hover:bg-white">
                {totalItems}
              </Badge>
            </Button>
          </div>
        </div>

        <div className="mt-8 grid gap-3 xl:grid-cols-[minmax(0,1fr)_220px]">
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
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-900">
              Showing {visibleRangeStart}-{visibleRangeEnd} of {filtered.length}{" "}
              products
            </p>
            <p className="text-sm text-slate-500">
              {isCoreDataLoading ? "Loading enterprise catalog records..." : ""}
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="h-10 rounded-xl border-slate-300 px-4 text-slate-700"
            onClick={() => navigate("/shop/cart")}
          >
            Go to cart
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {isCoreDataLoading ? (
          <ProductGridLayout>
            {Array.from({ length: PAGE_SIZE }).map((_, index) => (
              <CardSkeleton key={index} />
            ))}
          </ProductGridLayout>
        ) : filtered.length === 0 ? (
          <Card className="border-dashed border-slate-300 bg-white">
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
            <ProductGridLayout>
              {paginated.map((product) => (
                <EnterpriseProductCard
                  key={product.id}
                  product={product}
                  onOpen={() => navigate(`/shop/product/${product.id}`)}
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
    </div>
  );
}
