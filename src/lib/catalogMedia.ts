type MediaSource = {
  name: string;
  category?: string;
  brand?: string;
  image?: string;
  emoji?: string;
};

const categoryImages: Record<string, string> = {
  "Cloud Servers":
    "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=1200&auto=format&fit=crop",

  "IT Hardware":
    "https://images.unsplash.com/photo-1496171367470-9ed9a91ea931?q=80&w=1200&auto=format&fit=crop",

  "Office Supplies":
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200&auto=format&fit=crop",

  "Pantry & Consumables":
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1200&auto=format&fit=crop",

  Furniture:
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200&auto=format&fit=crop",
};

export function getProductImage(product: {
  category?: string;
  image?: string;
}) {
  const image = product.image?.trim();
  if (!image) {
    return (
      categoryImages[product.category || ""] ||
      "https://images.unsplash.com/photo-1586953208448-b95a79798f07?q=80&w=1200&auto=format&fit=crop"
    );
  }

  if (
    image.startsWith("http://") ||
    image.startsWith("https://") ||
    image.startsWith("data:") ||
    image.startsWith("/")
  ) {
    return image;
  }

  return (
    categoryImages[product.category || ""] ||
    "https://images.unsplash.com/photo-1586953208448-b95a79798f07?q=80&w=1200&auto=format&fit=crop"
  );
}

const fallbackGradients = [
  ["#0f172a", "#1d4ed8"],
  ["#111827", "#0891b2"],
  ["#1f2937", "#2563eb"],
  ["#172554", "#0284c7"],
];

export function getProductEmoji(category = "", name = "") {
  const source = `${category} ${name}`.toLowerCase();
  if (
    source.includes("laptop") ||
    source.includes("server") ||
    source.includes("computer")
  )
    return "💻";
  if (source.includes("printer") || source.includes("scanner")) return "🖨️";
  if (
    source.includes("chair") ||
    source.includes("desk") ||
    source.includes("table")
  )
    return "🪑";
  if (
    source.includes("water") ||
    source.includes("bottle") ||
    source.includes("drink")
  )
    return "💧";
  if (
    source.includes("coffee") ||
    source.includes("nescafe") ||
    source.includes("beverage")
  )
    return "☕";
  if (
    source.includes("rack") ||
    source.includes("storage") ||
    source.includes("shelf")
  )
    return "🗄️";
  if (
    source.includes("fire") ||
    source.includes("safety") ||
    source.includes("extinguisher")
  )
    return "🧯";
  if (source.includes("camera") || source.includes("security")) return "📷";
  if (
    source.includes("office") ||
    source.includes("stationery") ||
    source.includes("paper")
  )
    return "📄";
  return "📦";
}

export function buildProductFallbackImage(
  source: MediaSource,
  variantIndex = 0,
  subtitle?: string,
) {
  const [fromColor, toColor] =
    fallbackGradients[variantIndex % fallbackGradients.length];
  const emoji = source.emoji || getProductEmoji(source.category, source.name);
  const caption =
    subtitle || source.brand || source.category || "Enterprise catalog item";
  const svg = `
    <svg xmlns='http://www.w3.org/2000/svg' width='1200' height='900' viewBox='0 0 1200 900'>
      <defs>
        <linearGradient id='bg' x1='0' y1='0' x2='1' y2='1'>
          <stop stop-color='${fromColor}' offset='0'/>
          <stop stop-color='${toColor}' offset='1'/>
        </linearGradient>
        <filter id='blur' x='-20%' y='-20%' width='140%' height='140%'>
          <feGaussianBlur stdDeviation='20'/>
        </filter>
      </defs>
      <rect width='1200' height='900' fill='url(#bg)'/>
      <circle cx='1020' cy='120' r='170' fill='rgba(255,255,255,0.10)' filter='url(#blur)'/>
      <circle cx='180' cy='730' r='220' fill='rgba(34,197,94,0.14)' filter='url(#blur)'/>
      <rect x='120' y='115' rx='28' ry='28' width='240' height='54' fill='rgba(255,255,255,0.14)'/>
      <text x='240' y='152' text-anchor='middle' font-size='22' letter-spacing='3' fill='white' font-family='Arial, sans-serif'>CURATED CATALOG</text>
      <text x='600' y='470' text-anchor='middle' fill='white' font-size='140'>${emoji}</text>
      <text x='600' y='610' text-anchor='middle' fill='white' font-size='40' font-weight='700' font-family='Arial, sans-serif'>${source.name}</text>
      <text x='600' y='662' text-anchor='middle' fill='rgba(255,255,255,0.85)' font-size='24' font-family='Arial, sans-serif'>${caption}</text>
    </svg>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function resolveProductImage(source: MediaSource, variantIndex = 0) {
  return (
    getProductImage({
      category: source.category,
      image: source.image?.trim(),
    }) || buildProductFallbackImage(source, variantIndex)
  );
}

export function buildProductGallery(source: MediaSource) {
  const hasRealImage = Boolean(source.image?.trim());
  return [
    {
      key: "hero",
      label: "Front view",
      subtitle: "Primary product image",
      src: resolveProductImage(source, 0),
      objectPosition: "center",
    },
    {
      key: "detail",
      label: "Detail view",
      subtitle: "Procurement-ready crop",
      src: hasRealImage
        ? resolveProductImage(source, 0)
        : buildProductFallbackImage(source, 1, "Detail specification view"),
      objectPosition: hasRealImage ? "top" : "center",
    },
    {
      key: "context",
      label: "Context view",
      subtitle: "Catalog reference crop",
      src: hasRealImage
        ? resolveProductImage(source, 0)
        : buildProductFallbackImage(source, 2, "Catalog reference view"),
      objectPosition: hasRealImage ? "bottom" : "center",
    },
  ];
}
