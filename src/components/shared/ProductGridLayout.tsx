/**
 * ProductGridLayout Component
 *
 * STANDARD LAYOUT SPECIFICATION:
 * - Mobile (default): 1 column
 * - Small screens (sm): 2 columns
 * - Medium screens (md): 3 columns
 * - Large screens (lg+): 4 columns
 *
 * This component enforces the permanent product display layout.
 * Always use this component for product grids to prevent layout regression.
 *
 * Usage:
 * <ProductGridLayout>
 *   {products.map(product => <ProductCard key={product.id} product={product} />)}
 * </ProductGridLayout>
 */

import { ReactNode } from "react";

export function ProductGridLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
      {children}
    </div>
  );
}

/**
 * Product Card Wrapper for responsive layout
 *
 * SPECIFICATION:
 * - Mobile: Stacked vertically (image on top, content below)
 * - Small screens and up: Horizontal layout (image on left, content on right)
 *
 * Image dimensions:
 * - Mobile: full width, h-[180px]
 * - Small screens+: w-[200px], h-[200px]
 *
 * This ensures consistent product card appearance across all screen sizes.
 */

export const PRODUCT_CARD_IMAGE_CLASSES = {
  container:
    "relative h-[180px] w-full sm:h-[200px] sm:w-[200px] flex-shrink-0 overflow-hidden bg-gradient-to-br from-gray-50 via-white to-blue-50 p-3 flex items-center justify-center rounded-t-[20px] sm:rounded-t-none sm:rounded-l-[20px]",
  wrapper:
    "group flex h-full flex-col sm:flex-row overflow-hidden rounded-[20px] border border-gray-200 bg-white shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-2",
} as const;

export const PRODUCT_CARD_GRID_CLASSES =
  "grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4";
