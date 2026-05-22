import { useState } from "react";
import { ShoppingCart, MessageCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getProductImage } from "@/lib/catalogMedia";
import { cn } from "@/lib/utils";

interface Props {
  product: any;
  onOpen?: () => void;
  onAdd: () => void;
  onEnquire: () => void;
  // allow extra props without breaking ShopPage compile
  [key: string]: any;
}

export default function EnterpriseProductCard({
  product,
  onOpen,
  onAdd,
  onEnquire,
}: Props) {
  const isOutOfStock = product?.status === "Out of Stock";

  const hasNotes =
    typeof product?.productNotes === "string" &&
    product.productNotes.trim().length > 0;

  const imageSrc =
    (Array.isArray(product?.images) && product.images?.[0]) ||
    product?.image ||
    "";

  const leadTime =
    typeof product?.leadTime === "string" ? product.leadTime : "";

  const tags: string[] = Array.isArray(product?.tags)
    ? product.tags.filter((t: any) => typeof t === "string")
    : [];

  const description = String(product?.description || "").trim();
  const hasLongDescription = description.length > 160;
  const [showFullDescription, setShowFullDescription] = useState(false);

  return (
    <Card
      className="group overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (!onOpen) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
    >
      <div className="p-5">
        {hasNotes && (
          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
            <div className="flex items-start gap-2">
              <span className="mt-0.5">⚠</span>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-amber-900">
                  Product Notice:
                </div>
                <div
                  className="mt-1 whitespace-pre-line break-words text-sm text-amber-900/90"
                  style={{ wordBreak: "break-word" }}
                >
                  {product.productNotes}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mb-4 flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl bg-gray-50">
          <img
            src={imageSrc || getProductImage({ category: product?.category })}
            alt={product?.name || "Product"}
            loading="lazy"
            decoding="async"
            onError={(event) => {
              event.currentTarget.src = getProductImage({
                category: product?.category,
              });
            }}
            className="h-full w-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
          />
        </div>

        <div className="space-y-3">
          <div>
            <h3 className="line-clamp-2 text-[18px] font-semibold text-slate-900">
              {product?.name}
            </h3>

            <p className="mt-1 text-sm font-medium text-blue-600">
              {product?.brand || product?.category}
            </p>
          </div>

          <div>
            <div className="space-y-2">
              {description ? (
                <div>
                  <p
                    className={cn(
                      "text-sm text-slate-600",
                      !showFullDescription && "line-clamp-3",
                    )}
                  >
                    {description}
                  </p>
                  {hasLongDescription ? (
                    <button
                      type="button"
                      className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-700"
                      onClick={(event) => {
                        event.stopPropagation();
                        setShowFullDescription((value) => !value);
                      }}
                    >
                      {showFullDescription ? "Show less" : "Read more"}
                    </button>
                  ) : null}
                </div>
              ) : null}

              {Array.isArray(product?.keySpecifications) &&
              product.keySpecifications.length > 0 ? (
                <ul className="ml-5 list-disc space-y-1 text-sm text-slate-600">
                  {product.keySpecifications
                    .slice(0, 3)
                    .map((spec: any, idx: number) => (
                      <li key={spec?.name || spec?.label || idx}>
                        {(spec?.name || spec?.label || "Spec").toString()}:{" "}
                        {spec?.value ?? ""}
                      </li>
                    ))}
                </ul>
              ) : null}

              {Array.isArray(product?.generalSpecifications) &&
              product.generalSpecifications.length > 0 ? (
                <ul className="ml-5 list-disc space-y-1 text-sm text-slate-600">
                  {product.generalSpecifications
                    .slice(0, 3)
                    .map((spec: any, idx: number) => (
                      <li key={spec?.name || spec?.label || idx}>
                        {(spec?.name || spec?.label || "Spec").toString()}:{" "}
                        {spec?.value ?? ""}
                      </li>
                    ))}
                </ul>
              ) : null}

              {product?.productNotes?.trim() ? (
                <p className="text-xs text-slate-500">
                  Notes: {product.productNotes}
                </p>
              ) : null}

              {tags.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {tags.slice(0, 5).map((t) => (
                    <Badge
                      key={t}
                      variant="secondary"
                      className="rounded-full px-3 py-1"
                    >
                      {t}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-3">
            <div className="min-w-0 space-y-1">
              <p className="text-xs text-slate-600">
                MOQ: {product?.minOrder ?? 1}
              </p>
              <p className="text-xs text-slate-500">
                Lead time: {leadTime || "TBD"}
              </p>
            </div>

            <Badge
              className={cn(
                isOutOfStock
                  ? "border-rose-200 bg-rose-100 text-rose-700"
                  : "border-green-200 bg-green-100 text-green-700",
              )}
            >
              {isOutOfStock ? "Out of Stock" : "In Stock"}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-3">
            <Button
              disabled={isOutOfStock}
              className={cn(
                "bg-blue-600 hover:bg-blue-700",
                isOutOfStock && "cursor-not-allowed opacity-60",
              )}
              onClick={(event) => {
                event.stopPropagation();
                onAdd();
              }}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Add to Cart
            </Button>

            <Button
              variant="outline"
              onClick={(event) => {
                event.stopPropagation();
                onEnquire();
              }}
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Enquire
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
