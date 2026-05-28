export interface CanonicalProduct {
  id: string;

  productCode: string;
  sku: string;

  title: string;
  description: string;

  brand: string;
  category: string;
  subcategory: string;

  publicationStatus: "draft" | "published";

  inventoryStatus: "In Stock" | "Low Stock" | "Out of Stock";

  stock: number;
  price: number;

  images: string[];
  thumbnail: string;

  tags: string[];

  notes: string;

  leadTime: string;
  warranty: string;
  moq: number;

  vendorInventory: any[];

  keySpecifications: Array<{
    specification: string;
    value: string;
    unit?: string;
  }>;

  generalSpecifications: Array<{
    category: string;
    value: string;
  }>;

  createdAt?: string;
  updatedAt?: string;
}

const safeString = (value: any): string => {
  return typeof value === "string" ? value.trim() : "";
};

const safeArray = (value: any): any[] => {
  return Array.isArray(value) ? value.filter(Boolean) : [];
};

export function mapProduct(product: any): CanonicalProduct {
  const images = safeArray(product?.images)
    .map((img) => safeString(img))
    .filter(Boolean);

  const stock = Number(product?.initialStock) || Number(product?.stock) || 0;

  const inventoryStatus =
    stock <= 0 ? "Out of Stock" : stock <= 5 ? "Low Stock" : "In Stock";

  return {
    id: product?._id || product?.id || product?.masterProductId || "",

    productCode: safeString(product?.productCode),

    sku: safeString(product?.sku || product?.productCode),

    title: safeString(product?.productName || product?.name),

    description: safeString(product?.description),

    brand: safeString(product?.brand),

    category: safeString(product?.category),

    subcategory: safeString(product?.subcategory || product?.subCategory),

    publicationStatus:
      product?.publicationStatus ||
      (product?.status === "draft" ? "draft" : "published"),

    inventoryStatus:
      product?.inventoryStatus || product?.status || inventoryStatus,

    stock,

    price: Number(product?.price || 0),

    images,

    thumbnail: images[0] || "",

    tags: safeArray(product?.tags)
      .map((tag) => safeString(tag))
      .filter(Boolean),

    notes: safeString(product?.productNotes),

    leadTime: safeString(product?.leadTime),

    warranty: safeString(product?.warranty),

    moq: Number(product?.minimumOrderQuantity || 1),

    vendorInventory: safeArray(product?.vendorInventory),

    keySpecifications: safeArray(product?.keySpecifications).map((spec) => ({
      specification: safeString(
        spec?.specification || spec?.name || spec?.label,
      ),

      value: safeString(spec?.value),

      unit: safeString(spec?.unit),
    })),

    generalSpecifications: safeArray(product?.generalSpecifications).map(
      (spec) => ({
        category: safeString(spec?.category || spec?.name || spec?.label),

        value: safeString(spec?.value),
      }),
    ),

    createdAt: product?.createdAt,

    updatedAt: product?.updatedAt,
  };
}
