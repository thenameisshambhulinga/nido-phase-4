/**
 * Category-aware utilities for product description and specification rendering
 * Used across Master Catalogue and Shop pages for consistent category-specific content
 */

export interface CategoryAwareItem {
  category?: string;
  subCategory?: string;
  brand?: string;
  productCode?: string;
  productType?: string;
  physicalType?: string;
  specification?: string;
  warranty?: string;
  hsnCode?: string;
  dimensionL?: string;
  dimensionW?: string;
  dimensionH?: string;
  dimUnit?: string;
  weight?: string;
  weightUnit?: string;
  primaryVendor?: string;
  vendorSku?: string;
  leadTime?: string;
  initialStock?: number;
  tags?: string[];
}

export const normalizeCategoryValue = (value?: string) =>
  (value || "").trim().toLowerCase();

export const isElectronicsCategory = (item: CategoryAwareItem) => {
  const category = normalizeCategoryValue(item.category);
  const subCategory = normalizeCategoryValue(item.subCategory);
  const electronicsKeywords = [
    "it",
    "elect",
    "laptop",
    "desktop",
    "tablet",
    "mobile",
    "monitor",
    "network",
    "storage",
    "peripheral",
  ];

  return electronicsKeywords.some(
    (keyword) => category.includes(keyword) || subCategory.includes(keyword),
  );
};

export const formatDimensionText = (item: CategoryAwareItem) => {
  if (!item.dimensionL || !item.dimensionW || !item.dimensionH) {
    return "Not specified";
  }
  const unit = item.dimUnit ? ` ${item.dimUnit}` : "";
  return `${item.dimensionL} x ${item.dimensionW} x ${item.dimensionH}${unit}`;
};

export const formatWeightText = (item: CategoryAwareItem) => {
  if (!item.weight) return "Not specified";
  return `${item.weight}${item.weightUnit ? ` ${item.weightUnit}` : ""}`;
};

export const buildCategoryOverviewDescription = (
  item: CategoryAwareItem,
  name: string,
) => {
  const category = item.category || "General";
  const subCategory = item.subCategory || "catalogue";
  const brand = item.brand || "trusted";
  const vendor = item.primaryVendor || "verified supply partner";

  if (isElectronicsCategory(item)) {
    return `${name} is a ${category.toLowerCase()} product built for everyday performance and reliability. The ${brand} build, ${subCategory.toLowerCase()} form factor, and procurement-ready configuration make it suitable for business and retail demand. Sourced via ${vendor}, it is positioned for consistent availability, predictable delivery, and smooth after-sales support similar to top e-commerce product listings.`;
  }

  if (normalizeCategoryValue(category).includes("stationery")) {
    return `${name} is a ${subCategory.toLowerCase()} essential designed for repeat daily usage. It balances durability, practical utility, and cost efficiency for office and institutional buying. With sourcing from ${vendor}, this item supports steady replenishment cycles and dependable order fulfillment.`;
  }

  if (normalizeCategoryValue(category).includes("office")) {
    return `${name} is an office-use ${subCategory.toLowerCase()} item focused on functionality and long-term value. The ${brand} positioning and vendor-backed supply model make it suitable for structured procurement and ongoing inventory planning.`;
  }

  return `${name} belongs to the ${category} category and is configured for catalogue-led procurement. It is sourced through ${vendor} with pricing, compliance, and stock controls aligned to business purchasing workflows.`;
};

export const buildCategorySpecifications = (
  item: CategoryAwareItem,
): [string, string][] => {
  const common = [
    ["HSN/SAC", item.hsnCode || "Not specified"],
    ["Dimensions", formatDimensionText(item)],
    ["Shipping Weight", formatWeightText(item)],
    ["Primary Vendor", item.primaryVendor || "Not specified"],
    ["Vendor SKU", item.vendorSku || "Not specified"],
    ["Lead Time", item.leadTime || "Not specified"],
  ] as [string, string][];

  if (isElectronicsCategory(item)) {
    return [
      ["Model", item.productCode || "Not specified"],
      ["Brand", item.brand || "Not specified"],
      ["Product Type", item.productType || "Not specified"],
      ["Connectivity/Tech Spec", item.specification || "Not specified"],
      ["Warranty", item.warranty || "Not specified"],
      [
        "Stock Visibility",
        `${(item.initialStock || 0).toLocaleString()} Units`,
      ],
      ...common,
    ];
  }

  if (normalizeCategoryValue(item.category).includes("stationery")) {
    return [
      ["Sub-category", item.subCategory || "Not specified"],
      ["Brand", item.brand || "Not specified"],
      ["Material/Specification", item.specification || "Not specified"],
      ["Pack/Stock", `${(item.initialStock || 0).toLocaleString()} Units`],
      ["Product Type", item.productType || "Not specified"],
      ["Usage Type", item.physicalType || "Not specified"],
      ...common,
    ];
  }

  return [
    ["Category", item.category || "Not specified"],
    ["Sub-category", item.subCategory || "Not specified"],
    ["Brand", item.brand || "Not specified"],
    ["Product Type", item.productType || "Not specified"],
    ["Physical Type", item.physicalType || "Not specified"],
    ["Specification", item.specification || "Not specified"],
    ["Warranty", item.warranty || "Not specified"],
    ...common,
  ];
};
