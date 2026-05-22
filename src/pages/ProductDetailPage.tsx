import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
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
  PAGE_PILL_BUTTON_CLASS,
  PAGE_PILL_PRIMARY_BUTTON_CLASS,
} from "@/lib/navigationStyles";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import {
  buildProductGallery,
  getProductEmoji,
  getProductImage,
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
        <Breadcrumb
          items={[
            { label: "Shop", onClick: () => navigate("/shop") },
            { label: "Categories", onClick: () => navigate("/categories") },
            { label: "Product Not Found", isActive: true },
          ]}
        />
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

  // Use DB-driven key specifications, fallback to empty if not available
  const keySpecifications = Array.isArray(product.keySpecifications)
    ? product.keySpecifications
        .filter((spec: any) => spec && spec.specification && spec.value)
        .map((spec: any) => ({
          label: spec.specification || spec.name || "Specification",
          value:
            spec.unit && spec.unit !== "-"
              ? `${spec.value} ${spec.unit}`
              : spec.value || "Not specified",
          icon: PackageCheck, // Use consistent icon
        }))
    : [];

  const handleAddToCart = () => {
    addToCart({
      id: product.id || product.masterProductId || product.productCode,
      name: product.name,
      category: product.category,
      subCategory: product.subCategory,
      brand: product.brand || "Nido",
      sku: product.productCode,
      description: product.description,
      warranty: product.warranty,
      leadTime: product.leadTime,
      status: product.status === "Out of Stock" ? "Out of Stock" : "In Stock",
      price: Number(product.price || 0),
      emoji: productEmoji,
      image: getProductImage({
        category: product.category,
        image: product.image,
      }),
      stock: product.status === "Out of Stock" ? 0 : product.initialStock,
      minOrder:
        Number(
          (
            product as {
              minOrder?: number;
              minOrderQuantity?: number;
            }
          ).minOrder ??
            (
              product as {
                minOrder?: number;
                minOrderQuantity?: number;
              }
            ).minOrderQuantity,
        ) || 1,
    });
    toast.success(`${product.name} added to cart`);
  };

  return (
    <div className="space-y-8 pb-10 text-slate-50">
      <Breadcrumb
        items={[
          { label: "Shop", onClick: () => navigate("/shop") },
          { label: "Categories", onClick: () => navigate("/categories") },
          { label: product.name, isActive: true },
        ]}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="outline"
          className={PAGE_PILL_BUTTON_CLASS}
          onClick={() => navigate("/shop")}
        >
          ← Back to Catalog
        </Button>

        <div className="flex flex-wrap items-center gap-2">
          <Badge className={cn("rounded-full px-3 py-1 text-sm", statusBadge)}>
            {product.status}
          </Badge>
          <Button
            variant="outline"
            className={cn(
              PAGE_PILL_BUTTON_CLASS,
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

      <section className="grid gap-6 xl:grid-cols-[1.55fr_0.95fr]">
        <div className="space-y-5">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="relative overflow-hidden rounded-[32px] border border-white/10 bg-slate-950/90 shadow-[0_40px_120px_-72px_rgba(34,211,238,0.25)]"
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-500/15 via-transparent to-violet-500/10" />
            <div className="relative aspect-[16/9] min-h-[420px] bg-slate-950">
              <img
                src={selectedImage?.src}
                alt={product.name}
                className={cn(
                  "h-full w-full object-contain transition duration-500",
                  zoomEnabled && "cursor-zoom-in hover:scale-[1.08]",
                )}
                style={{
                  objectPosition: selectedImage?.objectPosition || "center",
                }}
              />
              <div className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-slate-950/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200 backdrop-blur">
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_16px_rgba(56,189,248,0.4)]" />
                {selectedImage?.label}
              </div>
              <button
                onClick={() => setZoomEnabled((value) => !value)}
                className="absolute right-5 top-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-slate-100 shadow-lg shadow-cyan-500/10 transition hover:border-cyan-300/30"
              >
                <ZoomIn className="h-3.5 w-3.5" />
                {zoomEnabled ? "Disable zoom" : "Enable zoom"}
              </button>
            </div>
          </motion.div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {gallery.map((image, index) => (
              <button
                key={image.key}
                onClick={() => setSelectedImageIndex(index)}
                className={cn(
                  "group overflow-hidden rounded-[24px] border bg-slate-950/80 p-2 transition hover:border-cyan-300/30 hover:shadow-[0_20px_80px_-50px_rgba(56,189,248,0.25)]",
                  selectedImageIndex === index
                    ? "border-cyan-300/40"
                    : "border-white/10",
                )}
              >
                <div className="h-24 overflow-hidden rounded-2xl bg-slate-900">
                  <img
                    src={image.src}
                    alt={`${product.name}-${image.key}`}
                    loading="lazy"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="mt-2 text-left">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    {image.label}
                  </p>
                  <p className="text-[11px] text-slate-500">{image.subtitle}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <aside className="space-y-5 xl:sticky xl:top-6">
          <Card className="overflow-hidden rounded-[32px] border border-white/10 bg-slate-950/90 shadow-[0_40px_100px_-70px_rgba(34,211,238,0.22)]">
            <CardContent className="space-y-5 p-6">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                  {product.category}
                </p>
                <h1 className="text-3xl font-semibold tracking-tight text-white">
                  {product.name}
                </h1>
                <p className="text-sm leading-6 text-slate-300">
                  {product.description ||
                    "Enterprise-ready product with reliable procurement visibility and quality-assured sourcing."}
                </p>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-slate-900/80 p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Enterprise pricing
                </p>
                <p className="mt-2 text-4xl font-semibold tracking-tight text-white">
                  ₹{Number(product.price || 0).toLocaleString()}
                </p>
                <p className="text-xs text-slate-500">
                  Excluding GST and shipping
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-3xl border border-white/10 bg-slate-950/75 p-3">
                    <p className="font-semibold text-slate-100">MOQ 1</p>
                    <p className="text-slate-500">Minimum order</p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-slate-950/75 p-3">
                    <p className="font-semibold text-slate-100">
                      {product.warranty || "Standard"}
                    </p>
                    <p className="text-slate-500">Warranty</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 text-sm text-slate-300">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-cyan-300" />
                  <span>Lead time:</span>
                  <span className="font-semibold text-slate-100">
                    {product.leadTime || "5-7 Days"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-cyan-300" />
                  <span>Vendor:</span>
                  <span className="font-semibold text-slate-100">
                    {product.primaryVendor || "Preferred vendor network"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <PackageCheck className="h-4 w-4 text-cyan-300" />
                  <span>Stock:</span>
                  <span className="font-semibold text-slate-100">
                    {product.status}
                  </span>
                </div>
              </div>

              <div className="grid gap-3">
                <Button
                  className={cn(PAGE_PILL_PRIMARY_BUTTON_CLASS, "w-full")}
                  disabled={product.status === "Out of Stock"}
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Add to Cart
                </Button>
                <Button
                  variant="outline"
                  className={cn(PAGE_PILL_BUTTON_CLASS, "w-full")}
                  onClick={() => {
                    handleAddToCart();
                    navigate("/shop/cart");
                  }}
                >
                  Buy Now
                </Button>
                <Button
                  className="h-11 w-full rounded-full bg-sky-600 text-white hover:bg-sky-700"
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
        </aside>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card className="border-white/10 bg-slate-950/85">
          <CardContent className="space-y-2 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              Product Code
            </p>
            <p className="text-base font-semibold text-white">
              {product.productCode || "N/A"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-slate-950/85">
          <CardContent className="space-y-2 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              Brand
            </p>
            <p className="text-base font-semibold text-white">
              {product.brand || "Nido"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-slate-950/85">
          <CardContent className="space-y-2 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              Warranty
            </p>
            <p className="text-base font-semibold text-white">
              {product.warranty || "Standard"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-slate-950/85">
          <CardContent className="space-y-2 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              Lead Time
            </p>
            <p className="text-base font-semibold text-white">
              {product.leadTime || "5-7 Days"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-slate-950/85">
          <CardContent className="space-y-2 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              Status
            </p>
            <p className="text-base font-semibold text-emerald-300">
              {product.status || "In Stock"}
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">
              Overview
            </p>
            <h2 className="text-xl font-semibold text-slate-100">
              Key Specifications
            </h2>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {keySpecifications.map((spec) => {
            const Icon = spec.icon;
            return (
              <Card
                key={spec.label}
                className="border-white/10 bg-slate-950/90"
              >
                <CardContent className="flex items-start gap-3 p-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-500 text-white shadow-[0_20px_40px_-24px_rgba(56,189,248,0.35)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                      {spec.label}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">
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
        <Card className="border-white/10 bg-slate-950/85">
          <CardContent className="space-y-2 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              Procurement rating
            </p>
            <p className="flex items-center gap-2 text-2xl font-semibold text-white">
              <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
              {(product.performanceRating || 4.8).toFixed(1)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-slate-950/85">
          <CardContent className="space-y-2 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              Product code
            </p>
            <p className="text-base font-semibold text-white">
              {product.productCode}
            </p>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-slate-950/85">
          <CardContent className="space-y-2 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              Category
            </p>
            <p className="text-base font-semibold text-white">
              {product.category} / {product.subCategory || "General"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-slate-950/85">
          <CardContent className="space-y-2 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              Compliance
            </p>
            <p className="text-base font-semibold text-white">
              {product.hsnCode || "Standard"}
            </p>
          </CardContent>
        </Card>
      </section>

      <Card className="overflow-hidden border-white/10 bg-slate-950/90">
        <CardHeader className="pb-3">
          <CardTitle className="text-slate-100">
            General Specifications
          </CardTitle>
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
                  <TableCell className="font-medium text-slate-100">
                    {label}
                  </TableCell>
                  <TableCell className="text-slate-200">
                    {value || "Not available"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-white/10 bg-slate-950/90">
        <CardHeader className="pb-3">
          <CardTitle className="text-slate-100">Related Products</CardTitle>
        </CardHeader>
        <CardContent>
          {relatedProducts.length === 0 ? (
            <p className="text-sm text-slate-400">
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
                    className="w-[240px] shrink-0 rounded-2xl border border-white/10 bg-slate-950/85 p-3 text-left transition hover:-translate-y-0.5 hover:shadow-[0_20px_60px_-32px_rgba(56,189,248,0.25)]"
                    onClick={() =>
                      navigate(
                        `/shop/product/${item.id || item.masterProductId}`,
                      )
                    }
                  >
                    <div className="h-32 overflow-hidden rounded-xl border border-white/10 bg-slate-900 p-3">
                      <img
                        src={imageSrc}
                        alt={item.name}
                        loading="lazy"
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <p className="mt-3 line-clamp-1 text-sm font-semibold text-slate-100">
                      {item.name}
                    </p>
                    <p className="text-xs text-slate-400">{item.category}</p>
                    <Separator className="my-2" />
                    <p className="text-base font-semibold text-white">
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
