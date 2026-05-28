//src/components/catalog/ProductPreviewModal.tsx
import EnterpriseProductCard from "@/components/shop/EnterpriseProductCard";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

import { mapProduct } from "@/utils/ProductMapper";

interface Props {
  open: boolean;

  onOpenChange: (open: boolean) => void;

  product: any;
}

export default function ProductPreviewModal({
  open,
  onOpenChange,
  product,
}: Props) {
  const mapped = mapProduct(product);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl overflow-hidden rounded-3xl p-0">
        <DialogTitle className="sr-only">Product Preview</DialogTitle>

        <DialogDescription className="sr-only">
          Live product preview before publishing.
        </DialogDescription>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px]">
          <div className="bg-slate-50 p-10">
            <div className="mx-auto max-w-[420px]">
              <EnterpriseProductCard
                product={{
                  name: mapped.title,

                  brand: mapped.brand,

                  category: mapped.category,

                  description: mapped.description,

                  productNotes: mapped.notes,

                  images: mapped.images,

                  tags: mapped.tags,

                  leadTime: mapped.leadTime,

                  stock: mapped.stock,

                  keySpecifications: mapped.keySpecifications,

                  generalSpecifications: mapped.generalSpecifications,

                  status: mapped.inventoryStatus,

                  minOrder: mapped.moq,
                }}
                onAdd={() => {}}
                onEnquire={() => {}}
              />
            </div>
          </div>

          <div className="border-l bg-white p-8">
            <h2 className="text-2xl font-semibold">Product Preview</h2>

            <div className="mt-6 space-y-4">
              <Info label="Product Code" value={mapped.productCode} />

              <Info label="SKU" value={mapped.sku} />

              <Info label="Category" value={mapped.category} />

              <Info label="Stock" value={`${mapped.stock ?? 0}`} />

              <Info label="Lead Time" value={mapped.leadTime} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">
        {label}
      </div>

      <div className="mt-1 font-medium">{value || "-"}</div>
    </div>
  );
}
