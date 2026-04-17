import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  ArrowLeft,
  Download,
  Eye,
  FileDown,
  FileText,
  Image as ImageIcon,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  Upload,
  X,
} from "lucide-react";

interface SpecificationAttribute {
  category: string;
  attribute: string;
  value: string;
}

interface CatalogItem {
  id: string;
  name: string;
  productCode: string;
  sku: string;
  category: string;
  subCategory: string;
  brand: string;
  productType: string;
  physicalType: string;
  price: number;
  discountPrice?: number;
  status: "In Stock" | "Low Stock" | "Out of Stock";
  image?: string;
  description?: string;
  tags: string[];
  initialStock: number;
  minStockThreshold: number;
  specification?: string;
  warranty?: string;
  hsnCode?: string;
  dimensionL?: string;
  dimensionW?: string;
  dimensionH?: string;
  dimUnit?: string;
  weight?: string;
  weightUnit?: string;
  customsDeclaration?: string;
  primaryVendor?: string;
  vendorSku?: string;
  leadTime?: string;
  vendorContact?: string;
  vendorEmail?: string;
  vendorPhone?: string;
  vendorPhone2?: string;
  trackPerformance?: boolean;
  performanceRating?: number;
  specAttributes?: SpecificationAttribute[];
}

const defaultCategories: Record<string, string[]> = {
  "IT Hardware": [
    "Laptops",
    "Desktops",
    "Monitors",
    "Peripherals",
    "Storage",
    "Networking",
  ],
  Stationery: ["Paper", "Writing", "Filing", "Desk Accessories"],
  "Office Supplies": ["Furniture", "Cleaning", "Pantry", "Safety"],
};

const defaultBrands = [
  "HP",
  "Sandisk",
  "Logitech",
  "Apple",
  "Epson",
  "Dell",
  "Lenovo",
  "Samsung",
];
const defaultProductTypes = ["Product", "Service", "Subscription"];
const defaultPhysicalTypes = ["Physical", "Digital", "Hybrid"];
const customsOptions = ["Exempt", "Taxable", "Restricted"];
const defaultTags = [
  "CoreEssentials",
  "New Arrival",
  "High-End",
  "Budget",
  "Eco-Friendly",
];

const normalizeCategoryValue = (value?: string) =>
  (value || "").trim().toLowerCase();

const isElectronicsCategory = (item: CatalogItem) => {
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

const formatDimensionText = (item: CatalogItem) => {
  if (!item.dimensionL || !item.dimensionW || !item.dimensionH) {
    return "Not specified";
  }
  const unit = item.dimUnit ? ` ${item.dimUnit}` : "";
  return `${item.dimensionL} x ${item.dimensionW} x ${item.dimensionH}${unit}`;
};

const formatWeightText = (item: CatalogItem) => {
  if (!item.weight) return "Not specified";
  return `${item.weight}${item.weightUnit ? ` ${item.weightUnit}` : ""}`;
};

const hasMeaningfulValue = (value?: string | number | null) => {
  if (value === null || value === undefined) return false;
  if (typeof value === "number") return !Number.isNaN(value);

  const normalized = value.trim().toLowerCase();
  return (
    normalized.length > 0 &&
    normalized !== "not specified" &&
    normalized !== "-" &&
    normalized !== "n/a" &&
    normalized !== "na"
  );
};

const createSpecList = (
  ...pairs: Array<[label: string, value?: string | number | null]>
): [string, string][] =>
  pairs
    .filter(([, value]) => hasMeaningfulValue(value))
    .map(([label, value]) => [label, String(value)]);

const hasAnyKeyword = (source: string, keywords: string[]) =>
  keywords.some((keyword) => source.includes(keyword));

const buildSemanticSpecificationSummary = (
  specAttributes?: SpecificationAttribute[],
) => {
  if (!specAttributes || specAttributes.length === 0) return "";
  const grouped = specAttributes.reduce<Record<string, string[]>>(
    (acc, spec) => {
      const category = spec.category.trim();
      const pair = `${spec.attribute.trim()}: ${spec.value.trim()}`;
      if (!category || !spec.attribute.trim() || !spec.value.trim()) {
        return acc;
      }
      acc[category] = [...(acc[category] || []), pair];
      return acc;
    },
    {},
  );

  return Object.entries(grouped)
    .map(([category, pairs]) => `${category} - ${pairs.join(", ")}`)
    .join(" | ");
};

const buildCategoryOverviewDescription = (item: CatalogItem) => {
  const category = item.category || "General";
  const subCategory = item.subCategory || "catalogue";
  const brand = item.brand || "trusted";

  if (isElectronicsCategory(item)) {
    return `${item.name} is a ${category.toLowerCase()} product built for everyday performance and reliability. The ${brand} build, ${subCategory.toLowerCase()} form factor, and procurement-ready configuration make it suitable for business and retail demand, with consistent availability and predictable delivery similar to top e-commerce product listings.`;
  }

  if (normalizeCategoryValue(category).includes("stationery")) {
    return `${item.name} is a ${subCategory.toLowerCase()} essential designed for repeat daily usage. It balances durability, practical utility, and cost efficiency for office and institutional buying, supporting steady replenishment cycles and dependable order fulfillment.`;
  }

  if (normalizeCategoryValue(category).includes("office")) {
    return `${item.name} is an office-use ${subCategory.toLowerCase()} item focused on functionality and long-term value. The ${brand} positioning makes it suitable for structured procurement and ongoing inventory planning.`;
  }

  return `${item.name} belongs to the ${category} category and is configured for catalogue-led procurement with pricing, compliance, and stock controls aligned to business purchasing workflows.`;
};

const buildCategorySpecifications = (item: CatalogItem): [string, string][] => {
  const context =
    `${item.category} ${item.subCategory} ${item.name} ${item.productType}`.toLowerCase();
  const dimensions = formatDimensionText(item);
  const weight = formatWeightText(item);
  const stockVisibility = `${item.initialStock.toLocaleString()} Units`;
  const semanticSpecPairs = (item.specAttributes || [])
    .filter(
      (spec) =>
        hasMeaningfulValue(spec.category) &&
        hasMeaningfulValue(spec.attribute) &&
        hasMeaningfulValue(spec.value),
    )
    .map(
      (spec) =>
        [`${spec.category} / ${spec.attribute}`, spec.value] as [
          string,
          string,
        ],
    );

  const furnitureKeywords = [
    "chair",
    "table",
    "desk",
    "stool",
    "sofa",
    "cabinet",
    "shelf",
    "furniture",
    "seating",
  ];
  const electricalApplianceKeywords = [
    "electrical",
    "electronic",
    "appliance",
    "refrigerator",
    "fridge",
    "washing",
    "microwave",
    "oven",
    "kettle",
    "geyser",
    "fan",
    "heater",
    "mixer",
    "grinder",
    "toaster",
    "air conditioner",
    "ac",
    "printer",
  ];

  if (hasAnyKeyword(context, furnitureKeywords)) {
    return [
      ...createSpecList(
        ["Material / Build", item.specification],
        ["Dimensions", dimensions],
        ["Usage Type", item.physicalType],
        ["Warranty", item.warranty],
        ["HSN/SAC", item.hsnCode],
        ["Shipping Weight", weight],
      ),
      ...semanticSpecPairs,
    ];
  }

  if (hasAnyKeyword(context, electricalApplianceKeywords)) {
    return [
      ...createSpecList(
        ["Model", item.productCode],
        ["Brand", item.brand],
        ["Technical Specification", item.specification],
        ["Product Type", item.productType],
        ["Warranty", item.warranty],
        ["HSN/SAC", item.hsnCode],
        ["Dimensions", dimensions],
        ["Shipping Weight", weight],
      ),
      ...semanticSpecPairs,
    ];
  }

  if (isElectronicsCategory(item)) {
    return [
      ...createSpecList(
        ["Model", item.productCode],
        ["Brand", item.brand],
        ["Product Type", item.productType],
        ["Connectivity / Tech Spec", item.specification],
        ["Warranty", item.warranty],
        ["Stock Visibility", stockVisibility],
        ["HSN/SAC", item.hsnCode],
        ["Dimensions", dimensions],
        ["Shipping Weight", weight],
      ),
      ...semanticSpecPairs,
    ];
  }

  if (normalizeCategoryValue(item.category).includes("stationery")) {
    return [
      ...createSpecList(
        ["Sub-category", item.subCategory],
        ["Brand", item.brand],
        ["Material / Specification", item.specification],
        ["Pack / Stock", stockVisibility],
        ["Usage Type", item.physicalType],
        ["Dimensions", dimensions],
        ["Shipping Weight", weight],
      ),
      ...semanticSpecPairs,
    ];
  }

  return [
    ...createSpecList(
      ["Category", item.category],
      ["Sub-category", item.subCategory],
      ["Brand", item.brand],
      ["Product Type", item.productType],
      ["Physical Type", item.physicalType],
      ["Specification", item.specification],
      ["Warranty", item.warranty],
      ["HSN/SAC", item.hsnCode],
      ["Dimensions", dimensions],
      ["Shipping Weight", weight],
    ),
    ...semanticSpecPairs,
  ];
};

const initialItems: CatalogItem[] = [
  {
    id: "1",
    name: "HP Envy Laptop",
    productCode: "LAP-1001",
    sku: "LAP-1001",
    category: "IT Hardware",
    subCategory: "Laptops",
    brand: "HP",
    productType: "Product",
    physicalType: "Physical",
    price: 80000,
    status: "In Stock",
    tags: ["CoreEssentials"],
    initialStock: 50,
    minStockThreshold: 5,
  },
  {
    id: "2",
    name: "Sandisk 1TB SSD",
    productCode: "SSD-2025",
    sku: "SSD-2025",
    category: "IT Hardware",
    subCategory: "Storage",
    brand: "Sandisk",
    productType: "Product",
    physicalType: "Physical",
    price: 12000,
    status: "Low Stock",
    tags: ["High-End"],
    initialStock: 12,
    minStockThreshold: 5,
  },
  {
    id: "3",
    name: "Logitech Wireless Mouse",
    productCode: "MOU-3301",
    sku: "MOU-3301",
    category: "IT Hardware",
    subCategory: "Peripherals",
    brand: "Logitech",
    productType: "Product",
    physicalType: "Physical",
    price: 1000,
    status: "In Stock",
    tags: [],
    initialStock: 200,
    minStockThreshold: 20,
  },
  {
    id: "4",
    name: "Apple iPad Air",
    productCode: "TAB-1110",
    sku: "TAB-1110",
    category: "IT Hardware",
    subCategory: "Laptops",
    brand: "Apple",
    productType: "Product",
    physicalType: "Physical",
    price: 450,
    status: "Low Stock",
    tags: ["New Arrival"],
    initialStock: 8,
    minStockThreshold: 3,
  },
  {
    id: "5",
    name: "Epson Workforce Printer",
    productCode: "PRN-3215",
    sku: "PRN-3215",
    category: "Stationery",
    subCategory: "Paper",
    brand: "Epson",
    productType: "Product",
    physicalType: "Physical",
    price: 62000,
    status: "Out of Stock",
    tags: [],
    initialStock: 0,
    minStockThreshold: 2,
  },
];

const auditLogs = [
  {
    event: "New Item Added",
    detail: "Apple MacBook Air M3",
    user: "Annit Kumar",
    date: "26 Mar 2024 11:55 PM",
    status: "Approved",
  },
  {
    event: "Price Changed",
    detail: "Sandisk 1TB SSD",
    user: "Sakelti Gupta",
    date: "25 Mar 2024 2:50 PM",
    status: "Approved",
  },
  {
    event: "Deleted Item",
    detail: "Formation Uptop",
    user: "Rehul Verma",
    date: "16 Mar 2023 3:35 PM",
    status: "Approved",
  },
  {
    event: "Bulk Update",
    detail: "CSV Catalog Accounts",
    user: "Sakelti Gupta",
    date: "07 Mar 2023 2:50 PM",
    status: "Approved",
  },
];

const emptyItem: Omit<CatalogItem, "id"> = {
  name: "",
  productCode: "",
  sku: "",
  category: "",
  subCategory: "",
  brand: "",
  productType: "Product",
  physicalType: "Physical",
  price: 0,
  status: "In Stock",
  tags: [],
  initialStock: 50,
  minStockThreshold: 5,
  description: "",
  specification: "",
  warranty: "",
  hsnCode: "",
  dimensionL: "",
  dimensionW: "",
  dimensionH: "",
  dimUnit: "cm",
  weight: "",
  weightUnit: "kg",
  customsDeclaration: "Exempt",
  primaryVendor: "",
  vendorSku: "",
  leadTime: "10 Days",
  vendorContact: "",
  vendorEmail: "",
  vendorPhone: "",
  vendorPhone2: "",
  trackPerformance: false,
  performanceRating: 4,
  specAttributes: [],
};

export default function MasterCataloguePage() {
  const navigate = useNavigate();
  const { user, isOwner } = useAuth();
  const [items, setItems] = useState<CatalogItem[]>(initialItems);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [viewItem, setViewItem] = useState<CatalogItem | null>(null);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [detailTab, setDetailTab] = useState("overview");

  const [form, setForm] = useState<Omit<CatalogItem, "id">>(emptyItem);
  const [autoSku, setAutoSku] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [categories, setCategories] =
    useState<Record<string, string[]>>(defaultCategories);
  const [brands] = useState<string[]>(defaultBrands);
  const [productTypes, setProductTypes] =
    useState<string[]>(defaultProductTypes);
  const [physicalTypes, setPhysicalTypes] =
    useState<string[]>(defaultPhysicalTypes);
  const [newCategoryInput, setNewCategoryInput] = useState("");
  const [newSubCategoryInput, setNewSubCategoryInput] = useState("");
  const [newProductTypeInput, setNewProductTypeInput] = useState("");
  const [newPhysicalTypeInput, setNewPhysicalTypeInput] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const [addingSubCategory, setAddingSubCategory] = useState(false);
  const [addingProductType, setAddingProductType] = useState(false);
  const [addingPhysicalType, setAddingPhysicalType] = useState(false);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [specCategoryInput, setSpecCategoryInput] = useState("");
  const [specAttributeInput, setSpecAttributeInput] = useState("");
  const [specValueInput, setSpecValueInput] = useState("");

  const canManageSemanticSpecs =
    isOwner ||
    ["admin", "procurement_manager", "accounts_payable"].includes(
      user?.role || "",
    );

  const bulkFileRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Stock":
        return "bg-success text-success-foreground";
      case "Low Stock":
        return "bg-warning text-warning-foreground";
      case "Out of Stock":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const filtered = items.filter((i) => {
    const q = search.toLowerCase();
    if (
      search &&
      !i.name.toLowerCase().includes(q) &&
      !i.sku.toLowerCase().includes(q) &&
      !i.productCode.toLowerCase().includes(q)
    )
      return false;
    if (categoryFilter !== "all" && i.category !== categoryFilter) return false;
    if (statusFilter !== "all" && i.status !== statusFilter) return false;
    if (brandFilter !== "all" && i.brand !== brandFilter) return false;
    return true;
  });

  const stats = {
    total: items.length,
    inStock: items.filter((i) => i.status === "In Stock").length,
    lowStock: items.filter((i) => i.status === "Low Stock").length,
    outOfStock: items.filter((i) => i.status === "Out of Stock").length,
  };

  const updateForm = (patch: Partial<Omit<CatalogItem, "id">>) =>
    setForm((f) => ({ ...f, ...patch }));

  const generateSku = () => {
    const prefix =
      form.category === "IT Hardware"
        ? "ITH"
        : form.category === "Stationery"
          ? "STN"
          : "OFS";
    return `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
  };

  const openAddDialog = () => {
    setForm(emptyItem);
    setEditingItem(null);
    setProductImages([]);
    setSpecCategoryInput("");
    setSpecAttributeInput("");
    setSpecValueInput("");
    setAutoSku(false);
    setAddDialogOpen(true);
  };

  const openEditDialog = (item: CatalogItem) => {
    setForm({ ...item, specAttributes: item.specAttributes || [] });
    setEditingItem(item);
    setProductImages(item.image ? [item.image] : []);
    setSpecCategoryInput("");
    setSpecAttributeInput("");
    setSpecValueInput("");
    setAddDialogOpen(true);
  };

  const addSemanticSpecificationAttribute = () => {
    if (!canManageSemanticSpecs) {
      toast.error(
        "Only owner and authorized internal users can add spec attributes",
      );
      return;
    }

    const category = specCategoryInput.trim();
    const attribute = specAttributeInput.trim();
    const value = specValueInput.trim();

    if (!category || !attribute || !value) {
      toast.error("Category, attribute, and value are required");
      return;
    }

    updateForm({
      specAttributes: [
        ...(form.specAttributes || []),
        {
          category,
          attribute,
          value,
        },
      ],
    });
    setSpecCategoryInput("");
    setSpecAttributeInput("");
    setSpecValueInput("");
  };

  const handleAddItem = () => {
    if (!form.name.trim()) {
      toast.error("Item Name is required");
      return;
    }
    const sku = autoSku ? generateSku() : form.sku;
    const productCode = form.productCode.trim() || sku.trim() || generateSku();
    const semanticSpecSummary = buildSemanticSpecificationSummary(
      form.specAttributes,
    );
    const specification =
      form.specification?.trim() || semanticSpecSummary || form.specification;

    const newItem: CatalogItem = {
      ...form,
      id: editingItem ? editingItem.id : Date.now().toString(),
      productCode,
      sku,
      specification,
      image: productImages[0] || undefined,
    };

    if (editingItem) {
      setItems((prev) =>
        prev.map((i) => (i.id === editingItem.id ? newItem : i)),
      );
      toast.success("Item updated successfully");
    } else {
      setItems((prev) => [...prev, newItem]);
      toast.success("Item added successfully");
    }
    setAddDialogOpen(false);
  };

  const handleBulkImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        const lines = text.split("\n").filter((l) => l.trim());
        if (lines.length < 2) {
          toast.error("CSV must have a header row and at least one data row");
          return;
        }
        const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
        const nameIdx = headers.indexOf("item name");
        const skuIdx = headers.indexOf("sku");
        const catIdx = headers.indexOf("category");
        const brandIdx = headers.indexOf("brand");
        const priceIdx = headers.indexOf("price");
        const statusIdx = headers.indexOf("status");

        let added = 0;
        const nextItems: CatalogItem[] = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(",").map((c) => c.trim());
          if (nameIdx === -1 || skuIdx === -1) continue;
          const status =
            (cols[statusIdx] as CatalogItem["status"]) || "In Stock";
          const newItem: CatalogItem = {
            id: `${Date.now()}-${i}`,
            name: cols[nameIdx] || "",
            sku: cols[skuIdx] || "",
            category: cols[catIdx] || "IT Hardware",
            subCategory: "",
            brand: cols[brandIdx] || "",
            productType: "Product",
            physicalType: "Physical",
            price: parseFloat(cols[priceIdx]) || 0,
            status: ["In Stock", "Low Stock", "Out of Stock"].includes(status)
              ? status
              : "In Stock",
            tags: [],
            initialStock: 50,
            minStockThreshold: 5,
          };
          if (newItem.name && newItem.sku) {
            nextItems.push(newItem);
            added++;
          }
        }
        if (nextItems.length > 0) {
          setItems((prev) => [...prev, ...nextItems]);
        }
        toast.success(`${added} item(s) imported successfully`);
        setBulkImportOpen(false);
      } catch {
        toast.error("Failed to parse CSV file");
      }
    };
    reader.readAsText(file);
  };

  const exportToCSV = (
    data: Array<Record<string, unknown>>,
    filename: string,
  ) => {
    if (!data.length) {
      toast.error("No data to export");
      return;
    }
    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(","),
      ...data.map((row) => headers.map((h) => `"${row[h] ?? ""}"`).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${filename} downloaded`);
  };

  const exportCatalogExcel = () => {
    exportToCSV(
      items.map((i) => ({
        "Item Name": i.name,
        SKU: i.sku,
        Category: i.category,
        Brand: i.brand,
        "Product Type": i.productType,
        "Physical Type": i.physicalType,
        Price: i.price,
        Status: i.status,
      })),
      "master-catalogue.csv",
    );
  };

  const exportCatalogPDF = () => {
    const rows = items
      .map(
        (i) =>
          `<tr><td>${i.name}</td><td>${i.sku}</td><td>${i.category}</td><td>${i.brand}</td><td>${i.productType}</td><td>${i.physicalType}</td><td>₹${i.price.toLocaleString()}</td><td>${i.status}</td></tr>`,
      )
      .join("");
    const html = `<html><head><title>Master Catalogue</title><style>body{font-family:Arial,sans-serif;padding:20px}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f5f5f5;font-weight:bold}h1{color:#333}</style></head><body><h1>Master Catalogue</h1><p>Exported on ${new Date().toLocaleDateString()}</p><table><thead><tr><th>Item Name</th><th>SKU</th><th>Category</th><th>Brand</th><th>Product Type</th><th>Physical Type</th><th>Price</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.print();
    }
    toast.success("PDF export opened for printing");
  };

  const exportAuditLogs = () => {
    exportToCSV(
      auditLogs.map((l) => ({
        Event: l.event,
        Detail: l.detail,
        User: l.user,
        Date: l.date,
        Status: l.status,
      })),
      "audit-logs.csv",
    );
  };

  const addTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !form.tags.includes(trimmed)) {
      updateForm({ tags: [...form.tags, trimmed] });
      setTagInput("");
    }
  };

  const addNewCategory = () => {
    const value = newCategoryInput.trim();
    if (value && !categories[value]) {
      setCategories((prev) => ({ ...prev, [value]: [] }));
      updateForm({ category: value, subCategory: "" });
      setNewCategoryInput("");
      setAddingCategory(false);
      toast.success("Category added");
    }
  };

  const addNewSubCategory = () => {
    const value = newSubCategoryInput.trim();
    if (value && form.category) {
      setCategories((prev) => ({
        ...prev,
        [form.category]: [...(prev[form.category] || []), value],
      }));
      updateForm({ subCategory: value });
      setNewSubCategoryInput("");
      setAddingSubCategory(false);
      toast.success("Sub-category added");
    }
  };

  const addNewProductType = () => {
    const value = newProductTypeInput.trim();
    if (value && !productTypes.includes(value)) {
      setProductTypes((prev) => [...prev, value]);
      updateForm({ productType: value });
      setNewProductTypeInput("");
      setAddingProductType(false);
      toast.success("Product type added");
    }
  };

  const addNewPhysicalType = () => {
    const value = newPhysicalTypeInput.trim();
    if (value && !physicalTypes.includes(value)) {
      setPhysicalTypes((prev) => [...prev, value]);
      updateForm({ physicalType: value });
      setNewPhysicalTypeInput("");
      setAddingPhysicalType(false);
      toast.success("Physical type added");
    }
  };

  return (
    <div>
      <Header title="Configuration" />
      <div className="p-6 space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1"
            onClick={() => navigate("/configuration")}
          >
            <ArrowLeft className="h-4 w-4" /> Back to Configuration
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Master Catalogue</h2>
            <p className="text-sm text-muted-foreground">
              Manage and register all products/services available for client
              contracts and downstream client-specific mapping.
            </p>
          </div>
          <Button className="gap-1.5" onClick={() => setBulkImportOpen(true)}>
            <Plus size={14} /> Bulk Import
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {[
            {
              label: `${stats.total} Items`,
              icon: ShoppingCart,
              color: "bg-primary text-primary-foreground",
            },
            {
              label: `${stats.inStock} in Stock`,
              icon: ShoppingCart,
              color: "bg-success/20 text-success",
            },
            {
              label: `${stats.lowStock} Low Stock`,
              icon: ShoppingCart,
              color: "bg-warning/20 text-warning",
            },
            {
              label: `${stats.outOfStock} Out of Stock`,
              icon: ShoppingCart,
              color: "bg-destructive/20 text-destructive",
            },
          ].map((stat) => (
            <Card key={stat.label} className={`${stat.color} cursor-pointer`}>
              <CardContent className="pt-3 pb-3 flex items-center gap-2">
                <stat.icon size={16} />
                <span className="font-medium text-sm">{stat.label}</span>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-36 h-8 text-xs">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.keys(categories).map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={brandFilter} onValueChange={setBrandFilter}>
            <SelectTrigger className="w-28 h-8 text-xs">
              <SelectValue placeholder="All Brands" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Brands</SelectItem>
              {brands.map((b) => (
                <SelectItem key={b} value={b}>
                  {b}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-28 h-8 text-xs">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="In Stock">In Stock</SelectItem>
              <SelectItem value="Low Stock">Low Stock</SelectItem>
              <SelectItem value="Out of Stock">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative">
            <Search
              className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={12}
            />
            <Input
              className="pl-7 h-8 w-44 text-xs"
              placeholder="Search Item"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="ml-auto flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setBulkImportOpen(true)}
            >
              <Upload size={12} /> Bulk Import
            </Button>
            <Button size="sm" className="gap-1.5" onClick={openAddDialog}>
              <Plus size={12} /> Add New Item
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="pt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">
                    <Checkbox
                      checked={
                        selectedIds.length === filtered.length &&
                        filtered.length > 0
                      }
                      onCheckedChange={() =>
                        setSelectedIds(
                          selectedIds.length === filtered.length
                            ? []
                            : filtered.map((i) => i.id),
                        )
                      }
                    />
                  </TableHead>
                  <TableHead>Item Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item) => (
                  <TableRow
                    key={item.id}
                    className="cursor-pointer transition-colors hover:bg-muted/40"
                    onClick={() => {
                      setViewItem(item);
                      setViewDialogOpen(true);
                    }}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(item.id)}
                        onClick={(e) => e.stopPropagation()}
                        onCheckedChange={() =>
                          setSelectedIds((prev) =>
                            prev.includes(item.id)
                              ? prev.filter((id) => id !== item.id)
                              : [...prev, item.id],
                          )
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-8 h-8 object-cover rounded"
                            />
                          ) : (
                            <ImageIcon
                              size={14}
                              className="text-muted-foreground"
                            />
                          )}
                        </div>
                        <span className="font-medium">{item.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {item.sku}
                    </TableCell>
                    <TableCell className="text-sm">{item.category}</TableCell>
                    <TableCell className="text-sm text-primary">
                      {item.brand}
                    </TableCell>
                    <TableCell>₹{item.price.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge
                        className={`${getStatusColor(item.status)} border-none`}
                      >
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditDialog(item);
                          }}
                        >
                          <Pencil size={12} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewItem(item);
                            setViewDialogOpen(true);
                          }}
                        >
                          <Eye size={12} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            setItems((prev) =>
                              prev.filter((i) => i.id !== item.id),
                            );
                            toast.success("Item deleted");
                          }}
                        >
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
              <span>
                Showing 1 - {filtered.length} of {items.length} entries
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Import / Export Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="upload">
                <TabsList className="bg-muted">
                  <TabsTrigger value="upload">Bulk Upload Items</TabsTrigger>
                  <TabsTrigger value="excel">
                    Export Catalog (Excel)
                  </TabsTrigger>
                  <TabsTrigger value="pdf">Export Catalog (PDF)</TabsTrigger>
                </TabsList>
                <TabsContent value="upload" className="mt-3">
                  <div className="text-center p-6 border-2 border-dashed border-border rounded-lg">
                    <Upload size={24} className="mx-auto text-primary mb-2" />
                    <p className="text-sm font-medium">Upload</p>
                    <p className="text-xs text-muted-foreground">
                      Bulk upload new products or catalog using CSV template.
                    </p>
                    <input
                      ref={bulkFileRef}
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={handleBulkImport}
                    />
                    <Button
                      className="mt-2"
                      size="sm"
                      onClick={() => bulkFileRef.current?.click()}
                    >
                      Upload
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="excel" className="mt-3">
                  <div className="text-center p-6 border-2 border-dashed border-border rounded-lg">
                    <FileDown size={24} className="mx-auto text-success mb-2" />
                    <p className="text-sm font-medium">Export</p>
                    <p className="text-xs text-muted-foreground">
                      Export the entire product catalog as Excel file.
                    </p>
                    <Button
                      variant="outline"
                      className="mt-2"
                      size="sm"
                      onClick={exportCatalogExcel}
                    >
                      Export Excel
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="pdf" className="mt-3">
                  <div className="text-center p-6 border-2 border-dashed border-border rounded-lg">
                    <FileText
                      size={24}
                      className="mx-auto text-destructive mb-2"
                    />
                    <p className="text-sm font-medium">Export Catalog</p>
                    <p className="text-xs text-muted-foreground">
                      Export as PDF file.
                    </p>
                    <Button
                      variant="outline"
                      className="mt-2"
                      size="sm"
                      onClick={exportCatalogPDF}
                    >
                      Export PDF
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  Approval & Audit Logs
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={exportAuditLogs}
                >
                  <Download size={12} /> Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <p className="text-sm font-medium">{log.event}</p>
                        <p className="text-xs text-muted-foreground">
                          {log.detail}
                        </p>
                      </TableCell>
                      <TableCell className="text-sm">{log.user}</TableCell>
                      <TableCell className="text-xs">{log.date}</TableCell>
                      <TableCell>
                        <Badge className="bg-success text-success-foreground border-none">
                          {log.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <Dialog open={bulkImportOpen} onOpenChange={setBulkImportOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Bulk Import Items</DialogTitle>
            </DialogHeader>
            <div className="text-center p-8 border-2 border-dashed border-border rounded-lg">
              <Upload size={32} className="mx-auto text-primary mb-3" />
              <p className="text-sm font-medium mb-1">Upload CSV File</p>
              <p className="text-xs text-muted-foreground mb-3">
                CSV must have headers: Item Name, SKU, Category, Brand, Price,
                Status
              </p>
              <input
                ref={bulkFileRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleBulkImport}
              />
              <Button onClick={() => bulkFileRef.current?.click()}>
                Select CSV File
              </Button>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setBulkImportOpen(false)}
              >
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={viewDialogOpen}
          onOpenChange={(open) => {
            setViewDialogOpen(open);
            if (open) {
              setDetailTab("overview");
            }
          }}
        >
          <DialogContent className="max-w-6xl p-0">
            {viewItem && (
              <div className="space-y-0">
                <DialogHeader className="border-b px-6 py-4">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setViewDialogOpen(false)}
                        >
                          <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                          <DialogTitle className="text-3xl">
                            {viewItem.name}
                          </DialogTitle>
                          <p className="text-sm text-muted-foreground">
                            {viewItem.productCode || viewItem.sku}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => {
                            openEditDialog(viewItem);
                            setViewDialogOpen(false);
                          }}
                        >
                          <Pencil className="h-4 w-4" /> Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => {
                            openEditDialog(viewItem);
                            setViewDialogOpen(false);
                            toast.success(
                              "Open the item form to manage vendor and client mapping.",
                            );
                          }}
                        >
                          <ShoppingCart className="h-4 w-4" /> Manage Mapping
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() =>
                            toast.success(
                              "Delete is intentionally handled from the catalogue grid.",
                            )
                          }
                        >
                          <Trash2 className="h-4 w-4" /> Delete
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-9 w-9"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <Tabs value={detailTab} onValueChange={setDetailTab}>
                      <TabsList className="h-10 bg-transparent p-0">
                        <TabsTrigger value="overview" className="h-9 px-5">
                          Overview
                        </TabsTrigger>
                        <TabsTrigger value="history" className="h-9 px-5">
                          History
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </DialogHeader>

                <div className="p-5">
                  {detailTab === "overview" ? (
                    <div className="overflow-hidden rounded-xl border bg-card">
                      <div className="grid lg:grid-cols-[300px_1fr]">
                        <div className="border-b bg-muted/10 p-6 lg:border-b-0 lg:border-r">
                          <div className="flex h-full min-h-[280px] items-center justify-center rounded-lg border bg-background p-4">
                            <div className="aspect-[4/5] w-full max-w-[220px] overflow-hidden rounded-lg bg-muted flex items-center justify-center">
                              {viewItem.image ? (
                                <img
                                  src={viewItem.image}
                                  alt={viewItem.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <ImageIcon className="h-16 w-16 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="p-6 space-y-5">
                          <h4 className="text-4xl font-semibold tracking-tight">
                            Overview
                          </h4>

                          <div className="overflow-hidden rounded-lg border bg-background">
                            <div className="grid grid-cols-4 border-b text-sm">
                              <div className="border-r bg-muted/20 p-3 font-medium text-muted-foreground">
                                SKU:
                              </div>
                              <div className="border-r p-3">{viewItem.sku}</div>
                              <div className="border-r bg-muted/20 p-3 font-medium text-muted-foreground">
                                Category:
                              </div>
                              <div className="p-3">{viewItem.category}</div>
                            </div>
                            <div className="grid grid-cols-4 border-b text-sm">
                              <div className="border-r bg-muted/20 p-3 font-medium text-muted-foreground">
                                Brand:
                              </div>
                              <div className="border-r p-3">
                                {viewItem.brand || "-"}
                              </div>
                              <div className="border-r bg-muted/20 p-3 font-medium text-muted-foreground">
                                Price:
                              </div>
                              <div className="p-3">
                                ₹{viewItem.price.toLocaleString()}
                                {viewItem.discountPrice ? (
                                  <span className="ml-2 text-xs text-muted-foreground line-through">
                                    ₹{viewItem.discountPrice.toLocaleString()}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                            <div className="grid grid-cols-4 border-b text-sm">
                              <div className="border-r bg-muted/20 p-3 font-medium text-muted-foreground">
                                Supplier:
                              </div>
                              <div className="border-r p-3 text-primary">
                                {viewItem.primaryVendor || "-"}
                              </div>
                              <div className="border-r bg-muted/20 p-3 font-medium text-muted-foreground">
                                Status:
                              </div>
                              <div className="p-3">
                                <Badge
                                  className={`${getStatusColor(viewItem.status)} border-none`}
                                >
                                  {viewItem.status}
                                </Badge>
                              </div>
                            </div>
                            <div className="grid grid-cols-4 text-sm">
                              <div className="border-r bg-muted/20 p-3 font-medium text-muted-foreground">
                                Stock Quantity:
                              </div>
                              <div className="border-r p-3">
                                {viewItem.initialStock.toLocaleString()} Units
                              </div>
                              <div className="border-r bg-muted/20 p-3 font-medium text-muted-foreground">
                                Shipping Weight:
                              </div>
                              <div className="p-3">
                                {formatWeightText(viewItem)}
                              </div>
                            </div>
                          </div>

                          <p className="text-base leading-8 text-foreground">
                            {buildCategoryOverviewDescription(viewItem)}
                          </p>

                          <div>
                            <h5 className="mb-2 text-lg font-semibold">
                              Key Specifications
                            </h5>
                            {buildCategorySpecifications(viewItem).length >
                            0 ? (
                              <ul className="columns-1 list-disc space-y-1 pl-5 text-base text-foreground md:columns-2">
                                {buildCategorySpecifications(viewItem).map(
                                  ([label, value]) => (
                                    <li
                                      key={label}
                                      className="break-inside-avoid"
                                    >
                                      <span className="font-medium">
                                        {label}:
                                      </span>{" "}
                                      <span>{value}</span>
                                    </li>
                                  ),
                                )}
                              </ul>
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                No category-specific specifications are
                                available yet.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">History</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Event</TableHead>
                              <TableHead>User</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {auditLogs.map((log, i) => (
                              <TableRow key={i}>
                                <TableCell>
                                  <p className="text-sm font-medium">
                                    {log.event}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {log.detail}
                                  </p>
                                </TableCell>
                                <TableCell className="text-sm">
                                  {log.user}
                                </TableCell>
                                <TableCell className="text-xs">
                                  {log.date}
                                </TableCell>
                                <TableCell>
                                  <Badge className="bg-success text-success-foreground border-none">
                                    {log.status}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  )}
                </div>

                <div className="border-t px-6 py-4">
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => setViewDialogOpen(false)}
                  >
                    <ArrowLeft className="h-4 w-4" /> Back
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] p-0">
            <DialogHeader className="px-6 pt-6 pb-2">
              <DialogTitle>
                {editingItem ? "Edit Item" : "Add New Item"}
              </DialogTitle>
            </DialogHeader>
            <ScrollArea
              className="px-6 pb-2"
              style={{ maxHeight: "calc(90vh - 130px)" }}
            >
              <div className="space-y-6 pb-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm border-b pb-1">
                      General Details
                    </h3>
                    <div>
                      <Label>
                        Item Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        placeholder="e.g., Apple MacBook Air M3"
                        value={form.name}
                        onChange={(e) => updateForm({ name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Brand</Label>
                      <Select
                        value={form.brand}
                        onValueChange={(v) => updateForm({ brand: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Brand" />
                        </SelectTrigger>
                        <SelectContent>
                          {brands.map((b) => (
                            <SelectItem key={b} value={b}>
                              {b}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Product Code</Label>
                      <Input
                        placeholder="e.g., PRD-00001"
                        value={form.productCode}
                        onChange={(e) =>
                          updateForm({ productCode: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Label>SKU</Label>
                        <div className="flex items-center gap-1 ml-auto">
                          <Checkbox
                            checked={autoSku}
                            onCheckedChange={(v) => setAutoSku(Boolean(v))}
                            id="autoSku"
                          />
                          <Label htmlFor="autoSku" className="text-xs">
                            Auto-Generate
                          </Label>
                        </div>
                      </div>
                      <Input
                        placeholder="e.g., LAP-1002"
                        value={autoSku ? "(auto)" : form.sku}
                        disabled={autoSku}
                        onChange={(e) => updateForm({ sku: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Product Type</Label>
                      {addingProductType ? (
                        <div className="flex gap-1">
                          <Input
                            value={newProductTypeInput}
                            onChange={(e) =>
                              setNewProductTypeInput(e.target.value)
                            }
                            placeholder="New product type"
                            className="h-9"
                          />
                          <Button size="sm" onClick={addNewProductType}>
                            Add
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setAddingProductType(false)}
                          >
                            X
                          </Button>
                        </div>
                      ) : (
                        <Select
                          value={form.productType}
                          onValueChange={(v) =>
                            v === "__add__"
                              ? setAddingProductType(true)
                              : updateForm({ productType: v })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Product Type" />
                          </SelectTrigger>
                          <SelectContent>
                            {productTypes.map((p) => (
                              <SelectItem key={p} value={p}>
                                {p}
                              </SelectItem>
                            ))}
                            <SelectItem value="__add__">
                              + Add Product Type
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm border-b pb-1">
                      Category & Classification
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Category</Label>
                        {addingCategory ? (
                          <div className="flex gap-1">
                            <Input
                              value={newCategoryInput}
                              onChange={(e) =>
                                setNewCategoryInput(e.target.value)
                              }
                              placeholder="New category"
                              className="h-9"
                            />
                            <Button size="sm" onClick={addNewCategory}>
                              Add
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setAddingCategory(false)}
                            >
                              X
                            </Button>
                          </div>
                        ) : (
                          <Select
                            value={form.category}
                            onValueChange={(v) =>
                              v === "__add__"
                                ? setAddingCategory(true)
                                : updateForm({ category: v, subCategory: "" })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select Category" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.keys(categories).map((c) => (
                                <SelectItem key={c} value={c}>
                                  {c}
                                </SelectItem>
                              ))}
                              <SelectItem value="__add__">
                                + Add Category
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                      <div>
                        <Label>Sub-category</Label>
                        {addingSubCategory ? (
                          <div className="flex gap-1">
                            <Input
                              value={newSubCategoryInput}
                              onChange={(e) =>
                                setNewSubCategoryInput(e.target.value)
                              }
                              placeholder="New sub-cat"
                              className="h-9"
                            />
                            <Button size="sm" onClick={addNewSubCategory}>
                              Add
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setAddingSubCategory(false)}
                            >
                              X
                            </Button>
                          </div>
                        ) : (
                          <Select
                            value={form.subCategory}
                            onValueChange={(v) =>
                              v === "__add__"
                                ? setAddingSubCategory(true)
                                : updateForm({ subCategory: v })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              {(categories[form.category] || []).map((s) => (
                                <SelectItem key={s} value={s}>
                                  {s}
                                </SelectItem>
                              ))}
                              <SelectItem value="__add__">
                                + Add Sub-category
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label>Physical Type</Label>
                      {addingPhysicalType ? (
                        <div className="flex gap-1">
                          <Input
                            value={newPhysicalTypeInput}
                            onChange={(e) =>
                              setNewPhysicalTypeInput(e.target.value)
                            }
                            placeholder="New physical type"
                            className="h-9"
                          />
                          <Button size="sm" onClick={addNewPhysicalType}>
                            Add
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setAddingPhysicalType(false)}
                          >
                            X
                          </Button>
                        </div>
                      ) : (
                        <Select
                          value={form.physicalType}
                          onValueChange={(v) =>
                            v === "__add__"
                              ? setAddingPhysicalType(true)
                              : updateForm({ physicalType: v })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Physical Type" />
                          </SelectTrigger>
                          <SelectContent>
                            {physicalTypes.map((p) => (
                              <SelectItem key={p} value={p}>
                                {p}
                              </SelectItem>
                            ))}
                            <SelectItem value="__add__">
                              + Add Physical Type
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    <div>
                      <Label>Tags</Label>
                      <div className="flex flex-wrap gap-1 mb-1">
                        {form.tags.map((t) => (
                          <Badge key={t} variant="secondary" className="gap-1">
                            {t}
                            <X
                              size={10}
                              className="cursor-pointer"
                              onClick={() =>
                                updateForm({
                                  tags: form.tags.filter((x) => x !== t),
                                })
                              }
                            />
                          </Badge>
                        ))}
                      </div>
                      <Input
                        placeholder="Tags..."
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && (e.preventDefault(), addTag())
                        }
                        className="h-8"
                      />
                      <div className="flex flex-wrap gap-1 mt-1">
                        {defaultTags
                          .filter((t) => !form.tags.includes(t))
                          .map((t) => (
                            <Badge
                              key={t}
                              variant="outline"
                              className="cursor-pointer text-xs"
                              onClick={() =>
                                updateForm({ tags: [...form.tags, t] })
                              }
                            >
                              {t}
                            </Badge>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-sm border-b pb-1 mb-3">
                    Logistics & Customs
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <Label>HSN/SAC Code</Label>
                      <Input
                        placeholder="e.g., 84713010"
                        value={form.hsnCode || ""}
                        onChange={(e) =>
                          updateForm({ hsnCode: e.target.value })
                        }
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Dimensions</Label>
                      <div className="grid grid-cols-[1fr_1fr_1fr_96px] gap-2">
                        <Input
                          placeholder="L"
                          value={form.dimensionL || ""}
                          onChange={(e) =>
                            updateForm({ dimensionL: e.target.value })
                          }
                        />
                        <Input
                          placeholder="W"
                          value={form.dimensionW || ""}
                          onChange={(e) =>
                            updateForm({ dimensionW: e.target.value })
                          }
                        />
                        <Input
                          placeholder="H"
                          value={form.dimensionH || ""}
                          onChange={(e) =>
                            updateForm({ dimensionH: e.target.value })
                          }
                        />
                        <Select
                          value={form.dimUnit || "cm"}
                          onValueChange={(v) => updateForm({ dimUnit: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cm">cm</SelectItem>
                            <SelectItem value="mm">mm</SelectItem>
                            <SelectItem value="m">m</SelectItem>
                            <SelectItem value="in">in</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>Shipping Weight</Label>
                      <div className="grid grid-cols-[1fr_90px] gap-2">
                        <Input
                          placeholder="e.g., 1.34"
                          value={form.weight || ""}
                          onChange={(e) =>
                            updateForm({ weight: e.target.value })
                          }
                        />
                        <Select
                          value={form.weightUnit || "kg"}
                          onValueChange={(v) => updateForm({ weightUnit: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="kg">kg</SelectItem>
                            <SelectItem value="g">g</SelectItem>
                            <SelectItem value="lb">lb</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 max-w-[280px]">
                    <Label>Customs Declaration</Label>
                    <Select
                      value={form.customsDeclaration || "Exempt"}
                      onValueChange={(v) =>
                        updateForm({ customsDeclaration: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Customs Declaration" />
                      </SelectTrigger>
                      <SelectContent>
                        {customsOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-sm border-b pb-1 mb-3">
                    Pricing & Inventory
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    <div>
                      <Label>Regular Price (optional)</Label>
                      <Input
                        type="number"
                        value={form.price}
                        onChange={(e) =>
                          updateForm({ price: parseFloat(e.target.value) || 0 })
                        }
                      />
                    </div>
                    <div>
                      <Label>Discount Price</Label>
                      <Input
                        type="number"
                        placeholder="(optional)"
                        value={form.discountPrice || ""}
                        onChange={(e) =>
                          updateForm({
                            discountPrice:
                              parseFloat(e.target.value) || undefined,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label>Inventory Status</Label>
                      <Select
                        value={form.status}
                        onValueChange={(v) =>
                          updateForm({ status: v as CatalogItem["status"] })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="In Stock">In Stock</SelectItem>
                          <SelectItem value="Low Stock">Low Stock</SelectItem>
                          <SelectItem value="Out of Stock">
                            Out of Stock
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Initial Stock Quantity</Label>
                      <Input
                        type="number"
                        value={form.initialStock}
                        onChange={(e) =>
                          updateForm({
                            initialStock: parseInt(e.target.value, 10) || 0,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label>Minimum Stock Threshold</Label>
                      <Input
                        type="number"
                        value={form.minStockThreshold}
                        onChange={(e) =>
                          updateForm({
                            minStockThreshold:
                              parseInt(e.target.value, 10) || 0,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-sm border-b pb-1 mb-3">
                    Product Specifics & Media
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <Label>Detailed Specification</Label>
                        <Textarea
                          value={form.specification || ""}
                          onChange={(e) =>
                            updateForm({ specification: e.target.value })
                          }
                        />
                      </div>
                      <div className="rounded-lg border p-3 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <Label className="text-sm">
                            Specification Meaning Builder
                          </Label>
                          {!canManageSemanticSpecs && (
                            <Badge variant="outline" className="text-xs">
                              Restricted
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                          <Input
                            placeholder="Category (e.g. Display)"
                            value={specCategoryInput}
                            onChange={(e) =>
                              setSpecCategoryInput(e.target.value)
                            }
                            disabled={!canManageSemanticSpecs}
                          />
                          <Input
                            placeholder="Attribute (e.g. Size)"
                            value={specAttributeInput}
                            onChange={(e) =>
                              setSpecAttributeInput(e.target.value)
                            }
                            disabled={!canManageSemanticSpecs}
                          />
                          <Input
                            placeholder="Value (e.g. 10.9 inch)"
                            value={specValueInput}
                            onChange={(e) => setSpecValueInput(e.target.value)}
                            disabled={!canManageSemanticSpecs}
                          />
                        </div>

                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={addSemanticSpecificationAttribute}
                          disabled={!canManageSemanticSpecs}
                        >
                          Add Specification Attribute
                        </Button>

                        {(form.specAttributes || []).length > 0 && (
                          <div className="space-y-2">
                            {(form.specAttributes || []).map((spec, index) => (
                              <div
                                key={`${spec.category}-${spec.attribute}-${index}`}
                                className="flex items-center justify-between gap-2 rounded border px-2 py-1.5 text-xs"
                              >
                                <span>
                                  <span className="font-medium">
                                    {spec.category}
                                  </span>{" "}
                                  / {spec.attribute}: {spec.value}
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-destructive"
                                  disabled={!canManageSemanticSpecs}
                                  onClick={() =>
                                    updateForm({
                                      specAttributes: (
                                        form.specAttributes || []
                                      ).filter((_, i) => i !== index),
                                    })
                                  }
                                >
                                  Remove
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}

                        <p className="text-xs text-muted-foreground">
                          Owner can configure specification schema anytime.
                          Authorized internal users can configure while creating
                          or editing items.
                        </p>
                      </div>
                      <div>
                        <Label>Warranty Information</Label>
                        <Textarea
                          value={form.warranty || ""}
                          onChange={(e) =>
                            updateForm({ warranty: e.target.value })
                          }
                          className="min-h-[60px]"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Add Image</Label>
                      <div
                        className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => imageInputRef.current?.click()}
                      >
                        <ImageIcon
                          size={24}
                          className="mx-auto text-muted-foreground mb-2"
                        />
                        <p className="text-sm">
                          Click to Upload or Drag Images
                        </p>
                      </div>
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const files = e.target.files;
                          if (!files) return;
                          Array.from(files).forEach((file) => {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              if (ev.target?.result) {
                                setProductImages((prev) => [
                                  ...prev,
                                  ev.target?.result as string,
                                ]);
                              }
                            };
                            reader.readAsDataURL(file);
                          });
                        }}
                      />
                      {productImages.length > 0 && (
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {productImages.map((img, i) => (
                            <div
                              key={i}
                              className="relative w-16 h-16 rounded overflow-hidden border"
                            >
                              <img
                                src={img}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                              <button
                                className="absolute top-0 right-0 bg-destructive text-destructive-foreground rounded-bl p-0.5"
                                onClick={() =>
                                  setProductImages((prev) =>
                                    prev.filter((_, idx) => idx !== i),
                                  )
                                }
                              >
                                <X size={10} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
            <DialogFooter className="px-6 pb-4">
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddItem}>
                {editingItem ? "Update Item" : "Add Item"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
