import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ChevronRight,
  Heart,
  MessageSquare,
  PackageCheck,
  ShieldCheck,
  ShoppingCart,
  Star,
  Truck,
  ZoomIn,
} from "lucide-react";
import { toast } from "sonner";

import { useData } from "@/contexts/DataContext";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  buildProductGallery,
  getProductEmoji,
  resolveProductImage,
} from "@/lib/catalogMedia";

export default function ProductDetailPage() {
  const navigate = useNavigate();
  const { productId } = useParams();
  const { masterCatalogItems } = useData();
  const { addToCart } = useCart();

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [zoomEnabled, setZoomEnabled] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);

  const product = useMemo(() => {
    return masterCatalogItems.find(
      (item) => (item.id || item.masterProductId) === productId,
    );
  }, [masterCatalogItems, productId]);

  const productEmoji = product
    ? getProductEmoji(product.category, product.name)
    : "📦";

  const gallery = useMemo(() => {
    if (!product) return [];
    return buildProductGallery({
      name: product.name,
      category: product.category,
      brand: product.brand,
      image: product.image,
      emoji: productEmoji,
    });
  }, [product, productEmoji]);

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return masterCatalogItems
      .filter(
        (item) =>
          (item.id || item.masterProductId) !==
            (product.id || product.masterProductId) &&
          item.category === product.category,
      )
      .slice(0, 8);
  }, [masterCatalogItems, product]);

  if (!product) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => navigate("/shop")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Shop
        </Button>
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Product not found.
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedImage = gallery[selectedImageIndex] || gallery[0];
  const statusBadge =
    product.status === "Out of Stock"
      ? "bg-rose-100 text-rose-700"
      : product.status === "Low Stock"
        ? "bg-amber-100 text-amber-700"
        : "bg-emerald-100 text-emerald-700";

  const specRows = [
    ["Product Code", product.productCode],
    ["Brand", product.brand || "Nido"],
    ["Category", product.category],
    ["Sub Category", product.subCategory || "General"],
    ["Warranty", product.warranty || "Standard warranty"],
    ["Lead Time", product.leadTime || "5-7 Days"],
    ["Primary Vendor", product.primaryVendor || "Preferred vendor network"],
    ["HSN/SAC", product.hsnCode || "Not specified"],
  ];

  const keySpecifications = [
    {
      label: "Function",
      value: product.productType || product.category,
      icon: PackageCheck,
    },
    {
      label: "Resolution",
      value: product.resolution || "Not specified",
      icon: Star,
    },
    {
      label: "Connectivity",
      value: product.connectivity || "Standard",
      icon: ShieldCheck,
    },
    {
      label: "Dimensions",
      value: product.dimensions || "Refer spec sheet",
      icon: Truck,
    },
    {
      label: "Warranty",
      value: product.warranty || "Standard warranty",
      icon: ShieldCheck,
    },
    {
      label: "Paper Size",
      value: product.paperSize || "A4 / Standard",
      icon: PackageCheck,
    },
  ];

  const handleAddToCart = () => {
    addToCart({
      id: product.id || product.masterProductId || product.productCode,
      name: product.name,
      category: product.category,
      price: Number(product.price || 0),
      emoji: productEmoji,
      image:
        selectedImage?.src ||
        resolveProductImage({
          name: product.name,
          category: product.category,
          brand: product.brand,
          image: product.image,
          emoji: productEmoji,
        }),
    });
    toast.success(`${product.name} added to cart`);
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <button
            onClick={() => navigate("/shop")}
            className="hover:text-slate-900"
          >
            Shop
          </button>
          <ChevronRight className="h-4 w-4" />
          <button
            onClick={() => navigate("/categories")}
            className="hover:text-slate-900"
          >
            Categories
          </button>
          <ChevronRight className="h-4 w-4" />
          <span className="line-clamp-1 font-medium text-slate-900">
            {product.name}
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            variant="outline"
            className="h-10 rounded-full"
            onClick={() => navigate("/shop")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Catalog
          </Button>
          <div className="flex items-center gap-2">
            <Badge className={cn("rounded-full px-3 py-1", statusBadge)}>
              {product.status}
            </Badge>
            <Button
              variant="outline"
              className={cn(
                "h-10 rounded-full",
                wishlisted && "border-rose-300 bg-rose-50 text-rose-700",
              )}
              onClick={() => setWishlisted((value) => !value)}
            >
              <Heart
                className={cn(
                  "mr-2 h-4 w-4",
                  wishlisted && "fill-rose-500 text-rose-500",
                )}
              />
              {wishlisted ? "Saved" : "Save"}
            </Button>
          </div>
        </div>
      </div>

      <section className="grid gap-5 xl:grid-cols-[110px_minmax(0,1fr)_360px]">
        <Card className="hidden overflow-hidden border-slate-200 bg-white/95 xl:block">
          <CardContent className="space-y-2 p-3">
            {gallery.map((image, index) => (
              <button
                key={image.key}
                onClick={() => setSelectedImageIndex(index)}
                className={cn(
                  "group w-full overflow-hidden rounded-2xl border bg-slate-50 p-1 transition",
                  selectedImageIndex === index
                    ? "border-slate-900 shadow-sm"
                    : "border-slate-200 hover:border-slate-400",
                )}
              >
                <div className="h-20 w-full overflow-hidden rounded-xl bg-white">
                  <img
                    src={image.src}
                    alt={`${product.name}-${image.key}`}
                    loading="lazy"
                    className="h-full w-full object-contain"
                    style={{ objectPosition: image.objectPosition }}
                  />
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-[28px] border-slate-200 bg-white/95 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.45)]">
          <CardContent className="space-y-4 p-4 md:p-5">
            <div className="relative flex min-h-[420px] items-center justify-center overflow-hidden rounded-[22px] border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-cyan-50 p-5">
              <img
                src={selectedImage?.src}
                alt={product.name}
                className={cn(
                  "h-full max-h-[380px] w-full max-w-[680px] object-contain transition duration-500",
                  zoomEnabled && "cursor-zoom-in hover:scale-[1.16]",
                )}
                style={{
                  objectPosition: selectedImage?.objectPosition || "center",
                }}
              />
              <div className="pointer-events-none absolute left-4 top-4 rounded-full border border-white/70 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">
                {selectedImage?.label}
              </div>
              <button
                onClick={() => setZoomEnabled((value) => !value)}
                className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:border-slate-300"
              >
                <ZoomIn className="h-3.5 w-3.5" />
                {zoomEnabled ? "Disable zoom" : "Enable zoom"}
              </button>
            </div>

            <div className="grid gap-2 md:hidden">
              {gallery.map((image, index) => (
                <button
                  key={`mobile-${image.key}`}
                  onClick={() => setSelectedImageIndex(index)}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border px-3 py-2 text-left transition",
                    selectedImageIndex === index
                      ? "border-slate-900 bg-slate-50"
                      : "border-slate-200 hover:border-slate-300",
                  )}
                >
                  <div className="h-10 w-10 overflow-hidden rounded-lg bg-slate-100">
                    <img
                      src={image.src}
                      alt={`${product.name}-${image.key}`}
                      loading="lazy"
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-900">
                      {image.label}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {image.subtitle}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="sticky top-4 h-fit overflow-hidden rounded-[28px] border-slate-200 bg-white/95 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.45)]">
          <CardContent className="space-y-4 p-5">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                {product.category}
              </p>
              <h1 className="text-2xl font-semibold leading-tight text-slate-950">
                {product.name}
              </h1>
              <p className="text-sm leading-6 text-slate-600">
                {product.description ||
                  "Enterprise-ready product with reliable procurement visibility and quality-assured sourcing."}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Enterprise pricing
              </p>
              <p className="mt-1 text-4xl font-semibold tracking-tight text-slate-950">
                ₹{Number(product.price || 0).toLocaleString()}
              </p>
              <p className="text-xs text-slate-500">
                Excluding GST and shipping
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-2xl border border-slate-200 bg-white p-2">
                  <p className="font-semibold text-slate-900">MOQ 1</p>
                  <p className="text-slate-500">Minimum order</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-2">
                  <p className="font-semibold text-slate-900">
                    {product.warranty || "Standard"}
                  </p>
                  <p className="text-slate-500">Warranty</p>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-sky-600" />
                Lead time: {product.leadTime || "5-7 Days"}
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-sky-600" />
                Vendor: {product.primaryVendor || "Preferred vendor network"}
              </div>
              <div className="flex items-center gap-2">
                <PackageCheck className="h-4 w-4 text-sky-600" />
                Stock: {product.status}
              </div>
            </div>

            <div className="grid gap-2">
              <Button
                className="h-11 rounded-full bg-slate-950 text-white hover:bg-slate-800"
                disabled={product.status === "Out of Stock"}
                onClick={handleAddToCart}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Add to Cart
              </Button>
              <Button
                variant="outline"
                className="h-11 rounded-full"
                onClick={() => {
                  handleAddToCart();
                  navigate("/shop/cart");
                }}
              >
                Buy Now
              </Button>
              <Button
                className="h-11 rounded-full bg-sky-600 text-white hover:bg-sky-700"
                onClick={() => {
                  toast.info("Opening enquiry interface...");
                  navigate(`/shop/product/${productId}/enquire`);
                }}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Enquire Now
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card className="border-slate-200">
          <CardContent className="space-y-2 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Product Code
            </p>
            <p className="text-base font-semibold text-slate-900">
              {product.productCode || "N/A"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="space-y-2 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Brand
            </p>
            <p className="text-base font-semibold text-slate-900">
              {product.brand || "Nido"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="space-y-2 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Warranty
            </p>
            <p className="text-base font-semibold text-slate-900">
              {product.warranty || "Standard"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="space-y-2 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Lead Time
            </p>
            <p className="text-base font-semibold text-slate-900">
              {product.leadTime || "5-7 Days"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="space-y-2 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Status
            </p>
            <p className="text-base font-semibold text-emerald-700">
              {product.status || "In Stock"}
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">
              Overview
            </p>
            <h2 className="text-xl font-semibold text-slate-950">
              Key Specifications
            </h2>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {keySpecifications.map((spec) => {
            const Icon = spec.icon;
            return (
              <Card key={spec.label} className="border-slate-200 bg-white/95">
                <CardContent className="flex items-start gap-3 p-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                      {spec.label}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">
                      {spec.value}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-slate-200">
          <CardContent className="space-y-2 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Procurement rating
            </p>
            <p className="flex items-center gap-2 text-2xl font-semibold text-slate-900">
              <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
              {(product.performanceRating || 4.8).toFixed(1)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="space-y-2 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Product code
            </p>
            <p className="text-base font-semibold text-slate-900">
              {product.productCode}
            </p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="space-y-2 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Category
            </p>
            <p className="text-base font-semibold text-slate-900">
              {product.category} / {product.subCategory || "General"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="space-y-2 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Compliance
            </p>
            <p className="text-base font-semibold text-slate-900">
              {product.hsnCode || "Standard"}
            </p>
          </CardContent>
        </Card>
      </section>

      <Card className="overflow-hidden border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle>General Specifications</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[260px]">Attribute</TableHead>
                <TableHead>Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {specRows.map(([label, value]) => (
                <TableRow key={label}>
                  <TableCell className="font-medium">{label}</TableCell>
                  <TableCell>{value || "Not available"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle>Related Products</CardTitle>
        </CardHeader>
        <CardContent>
          {relatedProducts.length === 0 ? (
            <p className="text-sm text-slate-500">
              No related products available.
            </p>
          ) : (
            <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-2">
              {relatedProducts.map((item) => {
                const imageSrc = resolveProductImage({
                  name: item.name,
                  category: item.category,
                  brand: item.brand,
                  image: item.image,
                });
                return (
                  <button
                    key={item.id || item.masterProductId}
                    className="w-[240px] shrink-0 rounded-2xl border border-slate-200 bg-white p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md"
                    onClick={() =>
                      navigate(
                        `/shop/product/${item.id || item.masterProductId}`,
                      )
                    }
                  >
                    <div className="h-32 overflow-hidden rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <img
                        src={imageSrc}
                        alt={item.name}
                        loading="lazy"
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <p className="mt-3 line-clamp-1 text-sm font-semibold text-slate-900">
                      {item.name}
                    </p>
                    <p className="text-xs text-slate-500">{item.category}</p>
                    <Separator className="my-2" />
                    <p className="text-base font-semibold text-slate-950">
                      ₹{Number(item.price || 0).toLocaleString()}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
