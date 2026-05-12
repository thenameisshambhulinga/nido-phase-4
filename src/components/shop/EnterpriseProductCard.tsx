import { ShoppingCart, MessageCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getProductImage } from "@/lib/catalogMedia";
import { cn } from "@/lib/utils";

interface Props {
  product: any;
  onAdd: () => void;
  onEnquire: () => void;
}

export default function EnterpriseProductCard({
  product,
  onAdd,
  onEnquire,
}: Props) {
  const isOutOfStock = product.status === "Out of Stock";

  return (
    <Card className="group overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="p-5">
        <div className="mb-4 flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl bg-gray-50">
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            decoding="async"
            onError={(event) => {
              event.currentTarget.src = getProductImage({
                category: product.category,
              });
            }}
            className="h-full w-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
          />
        </div>

        <div className="space-y-3">
          <div>
            <h3 className="line-clamp-2 text-[18px] font-semibold text-slate-900">
              {product.name}
            </h3>

            <p className="mt-1 text-sm font-medium text-blue-600">
              {product.category}
            </p>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-slate-800">
              Key Specifications
            </p>

            <ul className="ml-5 list-disc space-y-1 text-sm text-slate-600">
              <li>{product.description}</li>
              <li>Warranty: {product.warranty}</li>
              <li>Lead Time: {product.leadTime}</li>
            </ul>
          </div>

          <div className="flex items-center justify-between pt-3">
            <div>
              <p className="text-xs text-slate-500">MOQ: {product.minOrder}</p>

              <p className="mt-1 text-xl font-bold text-slate-900">
                ₹{product.price.toLocaleString()}
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
              onClick={onAdd}
              disabled={isOutOfStock}
              className={cn(
                "bg-blue-600 hover:bg-blue-700",
                isOutOfStock && "cursor-not-allowed opacity-60",
              )}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Add to Cart
            </Button>

            <Button variant="outline" onClick={onEnquire}>
              <MessageCircle className="mr-2 h-4 w-4" />
              Enquire
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
