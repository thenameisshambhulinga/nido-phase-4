/**
 * Product Mapper
 * Provides centralized, consistent product data transformation
 * across Shop, Product Details, Cart, and Preview views
 */

export interface ProductMapperInput {
  _id?: string;
  id?: string;
  productCode?: string;
  productName?: string;
  name?: string;
  description?: string;
  productNotes?: string;
  images?: string[];
  image?: string;
  brand?: string;
  category?: string;
  subCategory?: string;
  subcategory?: string;
  tags?: string[];
  keySpecifications?: Array<{
    specification?: string;
    name?: string;
    label?: string;
    value?: string;
    unit?: string;
  }>;
  generalSpecifications?: Array<{
    category?: string;
    name?: string;
    label?: string;
    value?: string;
  }>;
  vendorInventory?: Array<{
    vendorId?: string;
    vendorName?: string;
    quantity?: number;
    pricePerItem?: number;
    leadTime?: string;
  }>;
  status?: string;
  price?: number;
  stock?: number;
  quantity?: number;
  leadTime?: string;
  [key: string]: any;
}

export interface MappedProduct {
  id: string;
  productCode: string;
  name: string;
  description: string;
  productNotes?: string;
  images: string[];
  brand: string;
  category: string;
  subCategory: string;
  tags: string[];
  keySpecifications: Array<{
    specification: string;
    value: string;
    unit?: string;
  }>;
  generalSpecifications: Array<{
    category: string;
    value: string;
  }>;
  vendorInventory: Array<{
    vendorName: string;
    quantity: number;
    pricePerItem: number;
    leadTime: string;
  }>;
  status: string;
  price: number;
  stock: number;
  leadTime: string;
}

/**
 * Status normalization map
 * Handles legacy status values and maps them to current workflow states
 */
const statusMap: Record<string, string> = {
  active: "In Stock",
  inactive: "Out Of Stock",
  discontinued: "Low Stock",
  draft: "draft",
  published: "published",
};

/**
 * Normalize status value to handle legacy and new workflow states
 */
export const normalizeStatus = (status?: string): string => {
  if (!status) return "draft";
  const normalized = String(status).trim().toLowerCase();
  return statusMap[normalized] || status;
};

/**
 * Map product from API/MongoDB to frontend format
 * Ensures consistent data structure across all views
 */
export const mapProduct = (product: ProductMapperInput): MappedProduct => {
  if (!product) {
    throw new Error("Product data is required");
  }

  const id = product._id || product.id || product.productCode || "";
  const productCode = product.productCode || "";
  const name = product.productName || product.name || "";

  // Normalize images array - only include valid URLs
  const images = Array.isArray(product.images)
    ? product.images.filter(Boolean)
    : product.image
      ? [product.image]
      : [];

  // Normalize key specifications - from DB, no defaults/fallbacks
  const keySpecifications = (product.keySpecifications || [])
    .filter((spec) => spec && (spec.specification || spec.value))
    .map((spec) => ({
      specification: spec.specification || spec.name || spec.label || "",
      value: String(spec.value || ""),
      unit: spec.unit || undefined,
    }))
    .filter((spec) => spec.specification && spec.value); // Only include specs with both name and value

  // Normalize general specifications - from DB, no defaults/fallbacks
  const generalSpecifications = (product.generalSpecifications || [])
    .filter((spec) => spec && (spec.category || spec.value))
    .map((spec) => ({
      category: spec.category || spec.name || spec.label || "",
      value: String(spec.value || ""),
    }))
    .filter((spec) => spec.category && spec.value); // Only include specs with both category and value

  // Normalize vendor inventory - from DB only
  const vendorInventory = (product.vendorInventory || [])
    .filter((v) => v && v.vendorName)
    .map((v) => ({
      vendorName: v.vendorName || "",
      quantity: Number(v.quantity) || 0,
      pricePerItem: Number(v.pricePerItem) || 0,
      leadTime: v.leadTime || "",
    }));

  // Calculate lead time from first vendor with lead time
  const leadTime = vendorInventory.find((v) => v.leadTime)?.leadTime || "";

  // Calculate total stock from vendor inventory
  const totalStock = vendorInventory.reduce((sum, v) => sum + v.quantity, 0);
  const stock = Number(product.stock) || totalStock || 0;

  return {
    id,
    productCode,
    name,
    description: product.description || "",
    productNotes: product.productNotes || undefined,
    images,
    brand: product.brand || "",
    category: product.category || "General",
    subCategory: product.subCategory || product.subcategory || "",
    tags: Array.isArray(product.tags) ? product.tags : [],
    keySpecifications,
    generalSpecifications,
    vendorInventory,
    status: product.status || "draft",
    price: Number(product.price) || 0,
    stock,
    leadTime,
  };
};

/**
 * Map multiple products
 */
export const mapProducts = (
  products: ProductMapperInput[],
): MappedProduct[] => {
  return (products || []).map(mapProduct);
};
