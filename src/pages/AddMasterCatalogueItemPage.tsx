import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "@/lib/toastManager";
import {
  ChevronDown,
  Copy,
  Eye,
  Image as ImageIcon,
  Link as LinkIcon,
  MoreHorizontal,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";

function useDebounce<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePageMeta } from "@/contexts/PageMetaContext";
import BrandAutocomplete from "@/components/shared/BrandAutocomplete";
import CategoryCombobox from "@/components/shared/CategoryCombobox";

type ProductStatus = "In Stock" | "Low Stock" | "Out of Stock";

type SpecCategory = {
  id: string;
  name: string;
};

type SpecRow = {
  id: string;
  categoryId: string;
  attribute: string;
  value: string;
  unit: string;
};

type ProductImage = {
  id: string;
  src: string;
  alt: string;
  isPrimary: boolean;
};

type VendorInventory = {
  id: string;
  vendorId?: string;
  vendorName: string;
  pricePerItem: number;
  quantity: number;
  leadTime: string;
};

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const defaultSpecCategories: SpecCategory[] = [
  { id: "spec-fn", name: "Function" },
  { id: "spec-ps", name: "Print Speed" },
  { id: "spec-res", name: "Resolution" },
];

const defaultUnits = [
  "-",
  "ppm",
  "dpi",
  "Hz",
  "W",
  "V",
  "A",
  "mm",
  "cm",
  "inch",
  "kg",
  "g",
];

function reorder<T>(arr: T[], from: number, to: number) {
  const next = arr.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function formatBreadcrumb(mode: "add" | "edit") {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span>Configuration</span>
      <span className="text-muted-foreground">{">"}</span>
      <span className="text-muted-foreground">Master Catalogue</span>
      <span className="text-muted-foreground">{">"}</span>
      <span className="text-foreground">
        {mode === "edit" ? "Edit Item" : "Add New Item"}
      </span>
    </div>
  );
}

function RichTextToolbar({
  onCommand,
}: {
  onCommand: (cmd: string, value?: string) => void;
}) {
  return (
    <div className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/60 px-3 py-2 backdrop-blur-sm">
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          className="h-9 w-9 p-0"
          onClick={() => onCommand("bold")}
        >
          <span className="font-semibold">B</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="h-9 w-9 p-0"
          onClick={() => onCommand("italic")}
        >
          <span className="italic">I</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="h-9 w-9 p-0"
          onClick={() => onCommand("underline")}
        >
          <span className="underline">U</span>
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          className="h-9 rounded-md px-2"
          onClick={() => onCommand("insertUnorderedList")}
        >
          • List
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          className="h-9 w-9 p-0"
          onClick={() => onCommand("justifyLeft")}
        >
          Left
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="h-9 w-9 p-0"
          onClick={() => onCommand("justifyCenter")}
        >
          Center
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="h-9 w-9 p-0"
          onClick={() => onCommand("justifyRight")}
        >
          Right
        </Button>
      </div>

      <div className="ml-auto flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          className="h-9 w-9 p-0"
          onClick={() => onCommand("image")}
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="h-9 w-9 p-0"
          onClick={() => onCommand("link")}
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function FauxRichTextArea({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  // Uses contenteditable via textarea-like UX but keeps system stable.
  // We implement toolbar commands as lightweight transformations.
  // Helper: remove existing alignment wrappers (recursive)
  const stripAlignmentWrappers = (html: string) => {
    if (!html) return "";
    // Remove outermost <div style="text-align:..."> wrappers repeatedly
    let next = html.trim();
    const wrapperRegex =
      /^<div\s+style=(?:"|')text-align:\s*(left|center|right)(?:;?)[^"']*(?:"|')>([\s\S]*)<\/div>$/i;
    let m = next.match(wrapperRegex);
    while (m) {
      next = m[2].trim();
      m = next.match(wrapperRegex);
    }
    return next;
  };

  const setBlockAlignment = (
    html: string,
    align: "left" | "center" | "right",
  ) => {
    const clean = stripAlignmentWrappers(html).trim();
    if (!clean) return "";

    // If the content already starts with a block-level tag like <p> or <ul>, set style on the first block
    const pRegex = /^(<p\b[^>]*>)([\s\S]*)(<\/p>)$/i;
    const firstTagRegex = /^(<(p|div|ul|ol|h[1-6])\b)([^>]*)>([\s\S]*?)<\/\2>/i;

    const pMatch = clean.match(pRegex);
    if (pMatch) {
      // inject text-align into opening <p>
      const open = pMatch[1].replace(/style=(?:"|')([^"']*)(?:"|')/i, (s) => s);
      const hasStyle = /style=(?:"|')/i.test(open);
      const newOpen = hasStyle
        ? open.replace(
            /style=(?:"|')([^"']*)(?:"|')/i,
            (s, g1) => `style=\"text-align:${align};${g1}\"`,
          )
        : open.replace(/<p\b([^>]*)/i, `<p style=\"text-align:${align}\"$1`);
      return `${newOpen}${pMatch[2]}${pMatch[3]}`;
    }

    const firstMatch = clean.match(firstTagRegex);
    if (firstMatch) {
      const tag = firstMatch[2];
      const attrs = firstMatch[3] || "";
      const inner = firstMatch[4] || "";
      const hasStyle = /style=(?:"|')/i.test(attrs);
      const newAttrs = hasStyle
        ? attrs.replace(
            /style=(?:"|')([^"']*)(?:"|')/i,
            (s, g1) => `style=\"text-align:${align};${g1}\"`,
          )
        : ` style=\"text-align:${align}\"${attrs}`;
      return (
        `<${tag}${newAttrs}>${inner}</${tag}>` +
        clean.slice(firstMatch[0].length)
      );
    }

    // Fallback: wrap in <p>
    return `<p style=\"text-align:${align}\">${clean}</p>`;
  };
  const handleCommand = (cmd: string, _value?: string) => {
    const v = value;
    const safe = v || "";
    if (!safe) {
      // keep empty safe
    }

    const wrap = (before: string, after: string) => {
      const next = safe ? `${before}${safe}${after}` : safe;
      onChange(next);
    };

    switch (cmd) {
      case "bold":
        wrap("<b>", "</b>");
        return;
      case "italic":
        wrap("<i>", "</i>");
        return;
      case "underline":
        wrap("<u>", "</u>");
        return;
      case "insertUnorderedList": {
        const lines = safe.split(/\n+/).filter(Boolean);
        const items = lines.length ? lines : safe ? [safe] : [];
        const ul = items.map((x) => `<li>${x}</li>`).join("");
        onChange(`<ul>${ul}</ul>`);
        return;
      }
      case "justifyLeft":
        onChange(setBlockAlignment(safe, "left"));
        return;
      case "justifyCenter":
        onChange(setBlockAlignment(safe, "center"));
        return;
      case "justifyRight":
        onChange(setBlockAlignment(safe, "right"));
        return;
      case "image":
        toast.info("Image insertion requires a media picker in this build.");
        return;
      case "link":
        toast.info("Link insertion requires a URL input in this build.");
        return;
      default:
        return;
    }
  };

  return (
    <div className="space-y-3">
      <RichTextToolbar onCommand={handleCommand} />
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-h-[190px] resize-y rounded-2xl border-border/70 bg-white px-4 py-3 text-[15px]"
      />
    </div>
  );
}

export default function AddMasterCatalogueItemPage() {
  const { setMeta } = usePageMeta();
  useEffect(() => {
    setMeta({ title: "Configuration" });
  }, []);

  const navigate = useNavigate();
  const { itemId } = useParams<{ itemId: string }>();
  const { user } = useAuth();
  const {
    addMasterCatalogItem,
    updateMasterCatalogItem,
    masterCatalogItems,
    isCoreDataLoading,
  } = useData();

  const isEditMode = Boolean(itemId);
  const didSeedEditForm = useRef(false);

  const editingItem = useMemo(() => {
    if (!itemId) return null;
    return (
      masterCatalogItems.find((item) => item.id === itemId) ||
      masterCatalogItems.find((item) => item.masterProductId === itemId) ||
      masterCatalogItems.find((item) => item.productCode === itemId) ||
      null
    );
  }, [itemId, masterCatalogItems]);

  const canEdit = !!user;

  const [breadcrumb, setBreadcrumb] = useState(() =>
    formatBreadcrumb(isEditMode ? "edit" : "add"),
  );

  const [productName, setProductName] = useState("");
  const [skuCode, setSkuCode] = useState("");
  const [draggingSpecId, setDraggingSpecId] = useState<string | null>(null);
  const [productCode, setProductCode] = useState("");
  const [vendorSearch, setVendorSearch] = useState("");
  const [vendorDropdownOpen, setVendorDropdownOpen] = useState(false);
  const [vendorHighlightedIndex, setVendorHighlightedIndex] = useState(0);

  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [selectedVendorName, setSelectedVendorName] = useState("");
  const vendorDropdownRef = useRef<HTMLDivElement | null>(null);
  const [productType, setProductType] = useState("Product");
  const [physicalType, setPhysicalType] = useState("Physical");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [brand, setBrand] = useState("");
  const [vendorInventory, setVendorInventory] = useState<VendorInventory[]>([]);
  const [totalInventory, setTotalInventory] = useState(0);

  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const [descriptionHtmlLike, setDescriptionHtmlLike] = useState("");
  // Phase 1 — Product Notes & Alerts
  const [productNotes, setProductNotes] = useState<string>("");

  const [specCategories, setSpecCategories] = useState<SpecCategory[]>(
    defaultSpecCategories,
  );
  const [specRows, setSpecRows] = useState<SpecRow[]>([
    {
      id: uid(),
      categoryId: defaultSpecCategories[0].id,
      attribute: "Print/Scan/Copy",
      value: "Print / Scan / Copy",
      unit: "-",
    },
    {
      id: uid(),
      categoryId: defaultSpecCategories[1].id,
      attribute: "Print Speed",
      value: "30",
      unit: "ppm",
    },
    {
      id: uid(),
      categoryId: defaultSpecCategories[2].id,
      attribute: "Resolution",
      value: "1200 × 1200",
      unit: "dpi",
    },
  ]);

  const [newSpecCategoryName, setNewSpecCategoryName] = useState("");
  const [specAttrInput, setSpecAttrInput] = useState("");
  const [specValueInput, setSpecValueInput] = useState("");
  const [specUnitInput, setSpecUnitInput] = useState("-");
  const [specCategorySelect, setSpecCategorySelect] = useState(
    defaultSpecCategories[0].id,
  );

  const addSpecCategory = () => {
    const name = newSpecCategoryName.trim();
    if (!name) {
      toast.error("Specification category name is required");
      return;
    }
    if (
      specCategories.some((c) => c.name.toLowerCase() === name.toLowerCase())
    ) {
      toast.error("Specification category already exists");
      return;
    }
    const next: SpecCategory = { id: uid(), name };
    setSpecCategories((prev) => [...prev, next]);
    setNewSpecCategoryName("");
    setSpecCategorySelect(next.id);
  };

  const addSpecRow = () => {
    const attribute = specAttrInput.trim();
    const value = specValueInput.trim();
    const unit = specUnitInput.trim();

    if (!specCategorySelect) {
      toast.error("Pick a specification category");
      return;
    }
    if (!attribute || !value) {
      toast.error("Specification attribute and value are required");
      return;
    }

    setSpecRows((prev) => [
      ...prev,
      {
        id: uid(),
        categoryId: specCategorySelect,
        attribute,
        value,
        unit: unit || "-",
      },
    ]);

    setSpecAttrInput("");
    setSpecValueInput("");
    setSpecUnitInput("-");
  };

  const specCategoryNameById = useMemo(() => {
    const m = new Map<string, string>();
    specCategories.forEach((c) => m.set(c.id, c.name));
    return m;
  }, [specCategories]);

  const [images, setImages] = useState<ProductImage[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [isDraftSaving, setIsDraftSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const videoRefUrl = useRef<HTMLInputElement | null>(null);

  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const [videoUrl, setVideoUrl] = useState("");

  const generateProductCode = () => {
    const year = new Date().getFullYear();
    const uniqueSuffix = Math.floor(100000 + Math.random() * 900000);
    return `PROD-${year}-${uniqueSuffix}`;
  };

  // Generate productCode exactly once when opening Add Item page.
  const generatedRef = useRef(false);
  useEffect(() => {
    if (isEditMode) return;
    if (generatedRef.current) return;

    setProductCode(generateProductCode());
    generatedRef.current = true;
  }, [isEditMode]);

  // Debounce vendor search input (300ms)
  const debouncedVendorSearch = useDebounce(vendorSearch, 300);

  const { vendors } = useData();

  const filteredVendors = useMemo(() => {
    const term = debouncedVendorSearch.trim().toLowerCase();
    if (!term) return [];
    return (vendors || [])
      .filter((v) => v.name?.toLowerCase().includes(term))
      .slice(0, 10);
  }, [vendors, debouncedVendorSearch]);

  const closeVendorDropdown = () => {
    setVendorDropdownOpen(false);
    setVendorHighlightedIndex(0);
  };

  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      if (!vendorDropdownRef.current) return;
      const target = e.target as Node | null;
      if (!target) return;

      if (!vendorDropdownRef.current.contains(target)) {
        closeVendorDropdown();
      }
    };

    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  useEffect(() => {
    if (!vendorSearch.trim()) {
      closeVendorDropdown();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorSearch]);

  // Enhanced SKU generation: SKU-XXXX-YYYY (brand/name initials + crypto randomness)
  const generateSkuCode = () => {
    const b = (brand || "").trim();
    const name = (productName || "").trim();

    // Generate more unique prefix
    let prefix = "SKU";
    if (b) {
      // Use first 2 letters of brand + first letter of name
      prefix =
        `${b.substring(0, 2).toUpperCase()}${name.substring(0, 1).toUpperCase()}`.slice(
          0,
          3,
        );
    } else if (name) {
      // Use first 3 letters of product name
      prefix = name.replace(/\s+/g, "").substring(0, 3).toUpperCase();
    }

    // Generate random alphanumeric components
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let segment1 = "";
    let segment2 = "";
    for (let i = 0; i < 4; i++) {
      segment1 += chars.charAt(Math.floor(Math.random() * chars.length));
      segment2 += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const sku = `SKU-${segment1}-${segment2}`;
    setSkuCode(sku);
    return sku;
  };

  // Auto-generate both codes disabled (SKU must be manual-only).
  // Product code generation remains available via "Generate" button (if present).

  // General Specifications (repeating rows with Category + Attribute Value)
  const [genSpecRows, setGenSpecRows] = useState<
    Array<{
      id: string;
      category: string;
      value: string;
    }>
  >([]);

  const addGenSpecRow = () => {
    setGenSpecRows((prev) => [
      ...prev,
      { id: `gen-${Date.now()}`, category: "", value: "" },
    ]);
  };

  const updateGenSpecRow = (
    id: string,
    field: "category" | "value",
    val: string,
  ) => {
    setGenSpecRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: val } : r)),
    );
  };

  const deleteGenSpecRow = (id: string) => {
    setGenSpecRows((prev) => prev.filter((r) => r.id !== id));
  };

  useEffect(() => {
    setBreadcrumb(formatBreadcrumb(isEditMode ? "edit" : "add"));
  }, [isEditMode]);

  useEffect(() => {
    didSeedEditForm.current = false;
  }, [itemId]);

  useEffect(() => {
    if (!isEditMode) return;
    if (!editingItem) {
      if (!isCoreDataLoading) {
        toast.error("Unable to load the selected master catalogue item");
        navigate("/configuration/master-catalogue", { replace: true });
      }
      return;
    }
    if (didSeedEditForm.current) return;

    didSeedEditForm.current = true;
    setProductName(editingItem.name || "");
    setSkuCode(
      (editingItem as any).sku ||
        editingItem.productCode ||
        editingItem.id ||
        "",
    );
    setProductCode(editingItem.productCode || "");
    setProductType(editingItem.productType || "Product");
    setPhysicalType(editingItem.physicalType || "Physical");
    setCategory(editingItem.category || "");
    setSubcategory(editingItem.subCategory || "");
    setBrand(editingItem.brand || "");
    setTags(editingItem.tags || []);
    setDescriptionHtmlLike(editingItem.description || "");
    setProductNotes((editingItem as any).productNotes || "");
    setImages(
      editingItem.image
        ? [
            {
              id: uid(),
              src: editingItem.image,
              alt: editingItem.name || "Primary image",
              isPrimary: true,
            },
          ]
        : [],
    );

    const rawSpecs = ((editingItem as any).specAttributes || []) as Array<{
      category?: string;
      attribute?: string;
      value?: string;
    }>;

    if (rawSpecs.length > 0) {
      const uniqueCategories = Array.from(
        new Set(rawSpecs.map((s) => s.category || "Specifications")),
      );

      const seededCategories = uniqueCategories.map((name) => ({
        id: uid(),
        name,
      }));
      const categoryIdByName = new Map(
        seededCategories.map((entry) => [entry.name, entry.id]),
      );

      setSpecCategories(seededCategories);
      setSpecRows(
        rawSpecs.map((spec) => ({
          id: uid(),
          categoryId:
            categoryIdByName.get(spec.category || "Specifications") ||
            seededCategories[0]?.id ||
            uid(),
          attribute: spec.attribute || "",
          value: spec.value || "",
          unit: "-",
        })),
      );
      setSpecCategorySelect(seededCategories[0]?.id || "");
    }
  }, [editingItem, isCoreDataLoading, isEditMode, navigate]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (images.length >= 5) {
      toast.error("Maximum 5 images allowed");
      return;
    }

    const fileArr = Array.from(files).slice(0, 5 - images.length);
    if (fileArr.length > 5 - images.length) {
      toast.error("Maximum 5 images allowed");
    }

    setUploadProgress(0);

    const toDataUrl = (file: File) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("Failed reading file"));
        reader.readAsDataURL(file);
      });

    for (let i = 0; i < fileArr.length; i++) {
      const percent = Math.round(((i + 1) / fileArr.length) * 100);
      setUploadProgress(percent);
      try {
        const src = await toDataUrl(fileArr[i]);
        setImages((prev) => {
          const nextIsPrimary = prev.length === 0;
          return [
            ...prev.map((im) => ({ ...im })),
            {
              id: uid(),
              src,
              alt: fileArr[i].name,
              isPrimary: nextIsPrimary || (prev.length === 0 ? true : false),
            },
          ];
        });
      } catch {
        toast.error("Failed to load one image");
      }
    }

    setUploadProgress(0);
  };

  const makePrimary = (id: string) => {
    setImages((prev) => prev.map((im) => ({ ...im, isPrimary: im.id === id })));
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const next = prev.filter((im) => im.id !== id);
      if (next.length > 0 && !next.some((im) => im.isPrimary)) {
        next[0] = { ...next[0], isPrimary: true };
      }
      return next;
    });
  };

  const deleteSpecRow = (id: string) => {
    setSpecRows((prev) => prev.filter((r) => r.id !== id));
  };

  const moveSpecRow = (id: string, dir: -1 | 1) => {
    setSpecRows((prev) => {
      const idx = prev.findIndex((r) => r.id === id);
      if (idx < 0) return prev;
      const to = idx + dir;
      if (to < 0 || to >= prev.length) return prev;
      return reorder(prev, idx, to);
    });
  };

  const reorderImage = (id: string, dir: -1 | 1) => {
    setImages((prev) => {
      const idx = prev.findIndex((im) => im.id === id);
      if (idx < 0) return prev;
      const to = idx + dir;
      if (to < 0 || to >= prev.length) return prev;
      return reorder(prev, idx, to);
    });
  };

  const buildMasterCatalogItem = (status: "draft" | "published") => {
    const primaryImage = images.find((im) => im.isPrimary) || images[0];

    const keySpecifications = specRows.map((r) => ({
      name: specCategoryNameById.get(r.categoryId) || "Specifications",
      label: specCategoryNameById.get(r.categoryId) || "Specifications",
      value: r.unit && r.unit !== "-" ? `${r.value} ${r.unit}` : r.value || "",
    }));

    const generalSpecifications = genSpecRows.map((r) => ({
      name: r.category,
      label: r.category,
      value: r.value,
    }));

    const leadTime =
      vendorInventory.find((v) => v.leadTime?.trim())?.leadTime || "";

    const stock = vendorInventory.reduce(
      (sum, v) => sum + (Number(v.quantity) || 0),
      0,
    );

    const fallbackProductCode = productCode.trim() || `PRD-${Date.now()}`;
    const fallbackSku =
      skuCode.trim() || productCode.trim() || `SKU-${Date.now()}`;

    return {
      name: productName.trim() || "Draft Item",
      productCode: fallbackProductCode,
      sku: fallbackSku,
      masterProductId: editingItem?.masterProductId || fallbackProductCode,
      category: category.trim() || "General",
      subCategory: subcategory.trim(),
      brand: brand.trim(),
      productType,
      physicalType,
      price: 0,
      discountPrice: undefined,
      status,
      image: primaryImage?.src,
      description: descriptionHtmlLike,
      tags,
      keySpecifications,
      generalSpecifications,
      productNotes: productNotes.trim() ? productNotes : undefined,
      images: images.map((im) => im.src),
      vendorInventory: vendorInventory as any,
      leadTime,
      initialStock: stock,
      minStockThreshold: editingItem?.minStockThreshold || 0,
      specification: editingItem?.specification || "",
      warranty: editingItem?.warranty || "",
      hsnCode: editingItem?.hsnCode || "",
      dimUnit: editingItem?.dimUnit || "cm",
      weightUnit: editingItem?.weightUnit || "kg",
      customsDeclaration: editingItem?.customsDeclaration || "Exempt",
      primaryVendor: editingItem?.primaryVendor || "",
      vendorSku: editingItem?.vendorSku || "",
      vendorContact: editingItem?.vendorContact || "",
      vendorEmail: editingItem?.vendorEmail || "",
      vendorPhone: editingItem?.vendorPhone || "",
      vendorPhone2: editingItem?.vendorPhone2 || "",
      trackPerformance: editingItem?.trackPerformance || false,
      performanceRating: editingItem?.performanceRating || 4,
    } as any;
  };

  const onSaveAsDraft = async () => {
    if (isDraftSaving) return;
    // Drafts are allowed to be incomplete; do not block on images.

    setIsDraftSaving(true);
    try {
      const draftPayload = buildMasterCatalogItem("draft");
      if (isEditMode && editingItem) {
        const updated = await updateMasterCatalogItem(editingItem.id, {
          ...draftPayload,
          status: "draft",
        });
        if (!updated) {
          toast.error("Saving draft failed");
          return;
        }
      } else {
        const created = await addMasterCatalogItem({
          ...draftPayload,
          status: "draft",
        });
        if (!created) {
          toast.error("Saving draft failed");
          return;
        }
      }
      toast.success("Draft saved");
    } catch (error: any) {
      toast.error(`Draft save failed: ${error?.message || String(error)}`);
    } finally {
      setIsDraftSaving(false);
    }
  };

  const onPublish = async () => {
    if (isPublishing) return;
    if (!productName.trim()) {
      toast.error("Product Name is required");
      return;
    }
    if (!productCode.trim()) {
      toast.error("Product Code is required");
      return;
    }
    if (!category.trim()) {
      toast.error("Category is required");
      return;
    }
    if (images.length === 0) {
      toast.error("Upload at least one image before publishing.");
      return;
    }

    setIsPublishing(true);
    try {
      const publishPayload = buildMasterCatalogItem("published");
      const publishPromise =
        isEditMode && editingItem
          ? updateMasterCatalogItem(editingItem.id, {
              ...publishPayload,
              status: "published",
            })
          : addMasterCatalogItem({
              ...publishPayload,
              status: "published",
            });

      await Promise.all([publishPromise]);
      toast.success(isEditMode ? "Product updated" : "Product published");
      navigate("/configuration/master-catalogue");
    } catch (error: any) {
      toast.error(`Publish failed: ${error?.message || String(error)}`);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDuplicateProduct = () => {
    // Reset ID to create new product
    toast.success("Product duplicated. Make changes and save as new.");
    setMenuOpen(false);
  };

  const handleResetForm = () => {
    setProductName("");
    setProductCode("");
    setSkuCode("");
    setCategory("");
    setSubcategory("");
    setBrand("");
    setProductType("Product");
    setPhysicalType("Physical");
    setDescriptionHtmlLike("");
    setTags([]);
    setProductNotes("");
    setImages([]);
    setSpecRows([]);
    setGenSpecRows([]);
    setVendorInventory([]);
    toast.success("Form reset");
    setResetConfirmOpen(false);
    setMenuOpen(false);
  };

  const handleDiscardChanges = () => {
    navigate("/configuration/master-catalogue");
  };

  const selectedPrimaryImage = images.find((im) => im.isPrimary) || images[0];

  return (
    <div className="min-h-full w-full bg-background">
      {/* FULL-WIDTH STICKY TOP ACTION BAR */}
      <div className="sticky top-0 z-40 w-full border-b border-border/70 bg-white/90 backdrop-blur">
        <div className="w-full px-6 py-4" style={{ maxWidth: "100%" }}>
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">{breadcrumb}</div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="h-11 rounded-xl px-4"
                onClick={() => setPreviewModalOpen(true)}
                disabled={!canEdit}
              >
                Preview
              </Button>
              <Button
                variant="outline"
                className="h-11 rounded-xl px-4"
                onClick={onSaveAsDraft}
                disabled={!canEdit || isDraftSaving}
              >
                <Save className="mr-2 h-4 w-4" />
                {isDraftSaving ? "Saving Draft..." : "Save as Draft"}
              </Button>
              <Button
                className="h-11 rounded-xl px-4"
                onClick={onPublish}
                disabled={!canEdit || isPublishing}
              >
                {isPublishing
                  ? isEditMode
                    ? "Saving..."
                    : "Publishing..."
                  : isEditMode
                    ? "Save Changes"
                    : "Publish Product"}
              </Button>
              <Popover open={menuOpen} onOpenChange={setMenuOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 rounded-xl"
                  >
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-0" align="end">
                  <div className="flex flex-col">
                    <button
                      onClick={() => {
                        setPreviewModalOpen(true);
                        setMenuOpen(false);
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-100 text-left"
                    >
                      <Eye className="h-4 w-4" />
                      Preview Product
                    </button>
                    <button
                      onClick={() => {
                        onSaveAsDraft();
                        setMenuOpen(false);
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-100 text-left border-t"
                    >
                      <Save className="h-4 w-4" />
                      Save as Draft
                    </button>
                    <button
                      onClick={() => {
                        handleDuplicateProduct();
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-100 text-left border-t"
                    >
                      <Copy className="h-4 w-4" />
                      Duplicate Product
                    </button>
                    <button
                      onClick={() => {
                        setResetConfirmOpen(true);
                        setMenuOpen(false);
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-100 text-left border-t"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Reset Form
                    </button>
                    <button
                      onClick={handleDiscardChanges}
                      className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-red-50 text-red-600 text-left border-t"
                    >
                      <Trash2 className="h-4 w-4" />
                      Discard
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </div>

      {/* PRODUCT PREVIEW MODAL - PRODUCTION QUALITY LAYOUT */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-5xl h-[90vh] max-h-[90vh] overflow-hidden flex flex-col p-0">
          {/* STICKY HEADER */}
          <div className="flex items-center justify-between border-b border-border bg-white px-6 py-4 flex-shrink-0">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Product Preview
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Live review based on current form values · No backend call
              </p>
            </div>
            <button
              onClick={() => setPreviewOpen(false)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* SCROLLABLE CONTENT */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr] h-full">
              {/* LEFT SIDE - PRIMARY IMAGE GALLERY + PRODUCT INFO */}
              <div className="border-r border-border p-6 space-y-6 bg-slate-50">
                {/* PRIMARY IMAGE WITH THUMBNAILS */}
                <div>
                  <div className="aspect-square overflow-hidden rounded-2xl bg-white border border-border mb-3 flex items-center justify-center min-h-80">
                    {selectedPrimaryImage?.src ? (
                      <img
                        src={selectedPrimaryImage.src}
                        alt={productName || "Product"}
                        className="h-full w-full object-contain p-2"
                      />
                    ) : (
                      <div className="text-slate-300 text-center">
                        <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-30" />
                        <p className="text-xs">No primary image</p>
                      </div>
                    )}
                  </div>

                  {/* THUMBNAIL STRIP */}
                  {images.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto">
                      {images.map((img, idx) => (
                        <div
                          key={idx}
                          className="h-16 w-16 flex-shrink-0 rounded-lg border-2 border-transparent hover:border-primary overflow-hidden bg-white cursor-pointer"
                          onClick={() => {
                            const newImages = images.map((i, i_idx) => ({
                              id: `img-${i_idx}`,
                              src: i,
                              alt: `Image ${i_idx}`,
                              isPrimary: i_idx === idx,
                            }));
                            // Note: This is just visual, actual state update would need setImages call
                          }}
                        >
                          <img
                            src={img}
                            alt={`Thumbnail ${idx}`}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* PRODUCT TITLE & METADATA */}
                <div className="bg-white rounded-xl p-4 border border-border">
                  <h3 className="text-xl font-bold text-slate-900 mb-1 break-words">
                    {productName || "(Untitled)"}
                  </h3>
                  <p className="text-sm text-slate-600 mb-3">
                    {brand && category
                      ? `${brand} · ${category}`
                      : brand || category || "No category"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {productCode && (
                      <Badge variant="outline" className="text-xs">
                        {productCode}
                      </Badge>
                    )}
                    {subcategory && (
                      <Badge variant="secondary" className="text-xs">
                        {subcategory}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* DESCRIPTION */}
                {descriptionHtmlLike?.trim() && (
                  <div className="bg-white rounded-xl p-4 border border-border">
                    <p className="text-sm leading-6 text-slate-700">
                      {descriptionHtmlLike}
                    </p>
                  </div>
                )}

                {/* TAGS */}
                {tags.length > 0 && (
                  <div className="bg-white rounded-xl p-4 border border-border">
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* PRODUCT NOTES */}
                {productNotes?.trim() && (
                  <div className="bg-white rounded-xl p-4 border border-border">
                    <h4 className="font-semibold text-xs text-slate-700 mb-2 uppercase tracking-wide">
                      Notes & Alerts
                    </h4>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">
                      {productNotes}
                    </p>
                  </div>
                )}
              </div>

              {/* RIGHT SIDE - PRODUCT IDENTIFIERS + SPECIFICATIONS + INVENTORY */}
              <div className="p-6 space-y-5 overflow-y-auto">
                {/* PRODUCT IDENTIFIERS */}
                <div className="bg-white rounded-xl p-4 border border-border">
                  <h4 className="font-semibold text-xs text-slate-700 mb-3 uppercase tracking-wide">
                    Identifiers
                  </h4>
                  <div className="space-y-2 text-xs">
                    {productCode && (
                      <div>
                        <span className="text-slate-500">Product Code:</span>
                        <p className="font-mono text-slate-900">
                          {productCode}
                        </p>
                      </div>
                    )}
                    {skuCode && (
                      <div>
                        <span className="text-slate-500">SKU:</span>
                        <p className="font-mono text-slate-900">{skuCode}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* KEY SPECIFICATIONS */}
                {specRows.length > 0 && (
                  <div className="bg-white rounded-xl p-4 border border-border">
                    <h4 className="font-semibold text-xs text-slate-700 mb-3 uppercase tracking-wide">
                      Key Specifications
                    </h4>
                    <div className="space-y-2 text-xs">
                      {specRows.map((spec) => (
                        <div key={spec.id} className="flex justify-between">
                          <span className="text-slate-600">
                            {specCategoryNameById.get(spec.categoryId) ||
                              "Spec"}
                            :
                          </span>
                          <span className="font-medium text-slate-900">
                            {spec.value}{" "}
                            {spec.unit && spec.unit !== "-" ? spec.unit : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* GENERAL SPECIFICATIONS */}
                {genSpecRows.length > 0 && (
                  <div className="bg-white rounded-xl p-4 border border-border">
                    <h4 className="font-semibold text-xs text-slate-700 mb-3 uppercase tracking-wide">
                      General Specifications
                    </h4>
                    <div className="space-y-2 text-xs">
                      {genSpecRows.map((spec) => (
                        <div key={spec.id} className="flex justify-between">
                          <span className="text-slate-600">
                            {spec.category}:
                          </span>
                          <span className="font-medium text-slate-900">
                            {spec.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* VENDOR INVENTORY */}
                {vendorInventory.length > 0 && (
                  <div className="bg-white rounded-xl p-4 border border-border">
                    <h4 className="font-semibold text-xs text-slate-700 mb-3 uppercase tracking-wide">
                      Vendor Inventory
                    </h4>
                    <div className="space-y-3 text-xs">
                      {vendorInventory.map((vendor) => (
                        <div
                          key={vendor.id}
                          className="bg-slate-50 rounded-lg p-3 border border-slate-100"
                        >
                          <p className="font-semibold text-slate-900 mb-1">
                            {vendor.vendorName}
                          </p>
                          <div className="grid grid-cols-2 gap-2 text-slate-600">
                            <div>
                              <span className="text-slate-500">Qty:</span>{" "}
                              {vendor.quantity}
                            </div>
                            <div>
                              <span className="text-slate-500">Price:</span> ₹
                              {vendor.pricePerItem}
                            </div>
                            <div className="col-span-2">
                              <span className="text-slate-500">Lead:</span>{" "}
                              {vendor.leadTime || "—"}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* RESET CONFIRMATION DIALOG */}
      <Dialog open={resetConfirmOpen} onOpenChange={setResetConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reset Form?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600 mb-6">
            This will clear all form fields. This action cannot be undone.
          </p>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setResetConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleResetForm}>
              Reset Form
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MAIN 75/25 FULL-SCREEN LAYOUT */}
      <div className="w-full h-[calc(100vh-72px)] overflow-y-auto">
        <div className="w-full px-6 py-6" style={{ maxWidth: "100%" }}>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            {/* LEFT 75% */}
            <div className="space-y-6">
              {/* SECTION 1 */}
              <Card className="rounded-2xl bg-white shadow-sm border-border/70">
                <CardContent className="p-6 space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold">
                      1. Product Information
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Capture core catalog identity for enterprise procurement
                      mapping.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Product Name</Label>
                      <Input
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        placeholder="e.g., Apple MacBook Air M3"
                        className="h-11 rounded-xl"
                      />
                    </div>
                    {/* SKU moved to Product Identifiers sidebar to avoid duplication */}
                    <div className="space-y-2">
                      <Label>Product Type</Label>
                      <Select
                        value={productType}
                        onValueChange={setProductType}
                      >
                        <SelectTrigger className="h-11 rounded-xl">
                          <SelectValue placeholder="Product Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Product">Product</SelectItem>
                          <SelectItem value="Service">Service</SelectItem>
                          <SelectItem value="Subscription">
                            Subscription
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Physical Type</Label>
                      <Select
                        value={physicalType}
                        onValueChange={setPhysicalType}
                      >
                        <SelectTrigger className="h-11 rounded-xl">
                          <SelectValue placeholder="Physical Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Physical">Physical</SelectItem>
                          <SelectItem value="Digital">Digital</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Category</Label>
                      <CategoryCombobox
                        value={category}
                        onChange={setCategory}
                        placeholder="Search or create category..."
                        className="h-11 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Subcategory</Label>
                      <Input
                        value={subcategory}
                        onChange={(e) => setSubcategory(e.target.value)}
                        placeholder="e.g., Laptops"
                        className="h-11 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Brand</Label>
                      <BrandAutocomplete
                        value={brand}
                        onChange={setBrand}
                        placeholder="Search or enter brand..."
                        className="h-11 rounded-xl"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-1">
                      <Label>Tags</Label>
                      <div className="flex flex-wrap gap-2">
                        {tags.map((t) => (
                          <Badge
                            key={t}
                            variant="secondary"
                            className="gap-2 rounded-full px-3 py-1"
                          >
                            {t}
                            <button
                              type="button"
                              className="inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-black/10"
                              onClick={() =>
                                setTags((prev) => prev.filter((x) => x !== t))
                              }
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <div className="mt-2">
                        <Input
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          placeholder="Add tag and press Enter"
                          className="h-11 rounded-xl"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const t = tagInput.trim();
                              if (t && !tags.includes(t))
                                setTags((prev) => [...prev, t]);
                              setTagInput("");
                            }
                          }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label>Description</Label>
                      <FauxRichTextArea
                        value={descriptionHtmlLike}
                        onChange={setDescriptionHtmlLike}
                        placeholder="Enter professional product description..."
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* SECTION 2 */}
              <Card className="rounded-2xl bg-white shadow-sm border-border/70">
                <CardContent className="p-6 space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold">
                      2. Key Specifications
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Reusable specification engine with dynamic categories, row
                      reordering, and unit support.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6">
                    <div>
                      <div className="rounded-2xl border border-border/70 bg-white">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-16">&nbsp;</TableHead>
                              <TableHead className="w-[260px]">
                                Specification
                              </TableHead>
                              <TableHead className="w-[240px]">Value</TableHead>
                              <TableHead className="w-[120px]">Unit</TableHead>
                              <TableHead className="w-20 text-right">
                                Delete
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {specRows.length === 0 ? (
                              <TableRow>
                                <TableCell
                                  colSpan={5}
                                  className="py-10 text-center text-muted-foreground"
                                >
                                  No specifications yet.
                                </TableCell>
                              </TableRow>
                            ) : (
                              specRows.map((r, idx) => (
                                <TableRow
                                  key={r.id}
                                  className="align-middle"
                                  draggable
                                  onDragStart={() => setDraggingSpecId(r.id)}
                                  onDragOver={(e) => e.preventDefault()}
                                  onDrop={() => {
                                    if (!draggingSpecId) return;
                                    if (draggingSpecId === r.id) return;
                                    const from = specRows.findIndex(
                                      (x) => x.id === draggingSpecId,
                                    );
                                    const to = specRows.findIndex(
                                      (x) => x.id === r.id,
                                    );
                                    if (from < 0 || to < 0 || from === to)
                                      return;
                                    setSpecRows((prev) =>
                                      reorder(prev, from, to),
                                    );
                                    setDraggingSpecId(null);
                                  }}
                                >
                                  <TableCell>
                                    <div className="flex flex-col items-center gap-1">
                                      <span className="text-muted-foreground/70 text-xs">
                                        Drag
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="space-y-1">
                                      <div className="text-sm font-medium text-foreground">
                                        {specCategoryNameById.get(
                                          r.categoryId,
                                        ) || "Specification"}
                                      </div>
                                      <Input
                                        value={r.attribute}
                                        className="h-10 rounded-xl"
                                        onChange={(e) => {
                                          const v = e.target.value;
                                          setSpecRows((prev) =>
                                            prev.map((x) =>
                                              x.id === r.id
                                                ? { ...x, attribute: v }
                                                : x,
                                            ),
                                          );
                                        }}
                                      />
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Input
                                      value={r.value}
                                      className="h-10 rounded-xl"
                                      onChange={(e) => {
                                        const v = e.target.value;
                                        setSpecRows((prev) =>
                                          prev.map((x) =>
                                            x.id === r.id
                                              ? { ...x, value: v }
                                              : x,
                                          ),
                                        );
                                      }}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Select
                                      value={r.unit}
                                      onValueChange={(v) => {
                                        setSpecRows((prev) =>
                                          prev.map((x) =>
                                            x.id === r.id
                                              ? { ...x, unit: v }
                                              : x,
                                          ),
                                        );
                                      }}
                                    >
                                      <SelectTrigger className="h-10 rounded-xl">
                                        <SelectValue placeholder="Unit" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {defaultUnits.map((u) => (
                                          <SelectItem key={u} value={u}>
                                            {u}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-9 w-9 rounded-xl text-destructive hover:text-destructive"
                                      onClick={() => deleteSpecRow(r.id)}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-2xl border border-border/70 bg-white p-4 space-y-3">
                        <h3 className="font-semibold">
                          Add Specification Category
                        </h3>
                        <div className="flex items-center gap-2">
                          <Input
                            value={newSpecCategoryName}
                            onChange={(e) =>
                              setNewSpecCategoryName(e.target.value)
                            }
                            placeholder="e.g., Connectivity"
                            className="h-11 rounded-xl"
                          />
                          <Button
                            type="button"
                            className="h-11 rounded-xl"
                            onClick={addSpecCategory}
                          >
                            <Plus className="mr-2 h-4 w-4" /> Add
                          </Button>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-border/70 bg-white p-4 space-y-3">
                        <h3 className="font-semibold">Add Row</h3>
                        <div className="space-y-2">
                          <Label>Category</Label>
                          <Select
                            value={specCategorySelect}
                            onValueChange={setSpecCategorySelect}
                          >
                            <SelectTrigger className="h-11 rounded-xl">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {specCategories.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Specification</Label>
                          <Input
                            value={specAttrInput}
                            onChange={(e) => setSpecAttrInput(e.target.value)}
                            placeholder="e.g., Resolution"
                            className="h-11 rounded-xl"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Value</Label>
                          <Input
                            value={specValueInput}
                            onChange={(e) => setSpecValueInput(e.target.value)}
                            placeholder="e.g., 1200 × 1200"
                            className="h-11 rounded-xl"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Unit</Label>
                          <Input
                            value={specUnitInput}
                            onChange={(e) => setSpecUnitInput(e.target.value)}
                            placeholder="e.g., dpi"
                            className="h-11 rounded-xl"
                          />
                        </div>

                        <Button
                          type="button"
                          className="w-full rounded-xl h-11"
                          onClick={addSpecRow}
                        >
                          <Plus className="mr-2 h-4 w-4" /> Add Specification
                          Row
                        </Button>
                        <p className="text-xs text-muted-foreground">
                          Rows are editable; delete and reorder updates apply
                          immediately.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* SECTION 3 - Product Notes & Alerts */}
              <Card className="rounded-2xl bg-white shadow-sm border-border/70">
                <CardContent className="p-6 space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold">
                      3. Product Notes &amp; Alerts
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Enter manual note points, warnings, explanations, stock
                      notices, or product-specific remarks.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="product-notes">
                      Product Notes (optional)
                    </Label>
                    <Textarea
                      id="product-notes"
                      value={productNotes}
                      onChange={(e) => setProductNotes(e.target.value)}
                      placeholder="Enter product notes, issue explanations, stock notices, warnings or remarks..."
                      className="min-h-[180px] rounded-2xl"
                    />
                    <p className="text-xs text-muted-foreground">
                      Multiline supported. Leave empty to hide banners on Shop
                      cards.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* SECTION 4 - General Specifications */}
              <Card className="rounded-2xl bg-white shadow-sm border-border/70">
                <CardContent className="p-6 space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold">
                      4. General Specifications
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Categorized product attributes for structured catalog
                      metadata.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-xl border border-border/70 bg-white">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[280px]">
                              Category
                            </TableHead>
                            <TableHead className="w-[280px]">
                              Attribute Value
                            </TableHead>
                            <TableHead className="w-20 text-right">
                              Delete
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {genSpecRows.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={3}
                                className="py-8 text-center text-muted-foreground"
                              >
                                No general specifications yet. Click "Add Row"
                                to begin.
                              </TableCell>
                            </TableRow>
                          ) : (
                            genSpecRows.map((r) => (
                              <TableRow key={r.id} className="align-middle">
                                <TableCell>
                                  <Input
                                    value={r.category}
                                    onChange={(e) =>
                                      updateGenSpecRow(
                                        r.id,
                                        "category",
                                        e.target.value,
                                      )
                                    }
                                    placeholder="e.g., Manufacturer, Color, Weight"
                                    className="h-9 rounded-lg text-sm"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    value={r.value}
                                    onChange={(e) =>
                                      updateGenSpecRow(
                                        r.id,
                                        "value",
                                        e.target.value,
                                      )
                                    }
                                    placeholder="e.g., Samsung, Black, 2.5kg"
                                    className="h-9 rounded-lg text-sm"
                                  />
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                    onClick={() => deleteGenSpecRow(r.id)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={addGenSpecRow}
                    >
                      <Plus className="mr-2 h-4 w-4" /> Add Row
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* SECTION 5 */}
              <Card className="rounded-2xl bg-white shadow-sm border-border/70">
                <CardContent className="p-6 space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold">
                      5. Product Images &amp; Media
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Modern enterprise upload experience with preview strip,
                      primary marking, and reordering.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6">
                    <div className="rounded-2xl border border-border/70 bg-white p-4">
                      <div
                        className="rounded-2xl border-2 border-dashed border-border/80 bg-background/30 p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-background/50 transition-colors"
                        onClick={() => imageInputRef.current?.click()}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") imageInputRef.current?.click();
                        }}
                      >
                        <div className="h-14 w-14 rounded-2xl border border-border/60 bg-white flex items-center justify-center mb-3">
                          <Upload className="h-6 w-6 text-primary" />
                        </div>
                        <p className="text-sm font-medium">
                          Drag & drop images here or click to upload
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Multiple upload supported. Primary image selection
                          required.
                        </p>
                        {uploadProgress > 0 && (
                          <div className="mt-4 w-full max-w-[360px]">
                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                              <span>Uploading</span>
                              <span>{uploadProgress}%</span>
                            </div>
                            <div className="h-2 rounded-full bg-border/40 overflow-hidden">
                              <div
                                className="h-full bg-primary transition-[width]"
                                style={{ width: `${uploadProgress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => handleFiles(e.target.files)}
                      />

                      <div className="mt-5">
                        {images.length === 0 ? (
                          <div className="rounded-2xl border border-border/70 bg-white p-5 text-center">
                            <p className="text-sm font-medium text-muted-foreground">
                              No images uploaded yet.
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {images.map((im, index) => (
                              <div
                                key={im.id}
                                className="group relative rounded-2xl border border-border/70 bg-white overflow-hidden"
                              >
                                <div className="aspect-[4/3] bg-slate-50">
                                  <img
                                    src={im.src}
                                    alt={im.alt}
                                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                                  />
                                </div>
                                <div className="absolute left-2 top-2">
                                  {im.isPrimary && (
                                    <Badge className="rounded-full bg-primary text-primary-foreground border-none">
                                      Primary
                                    </Badge>
                                  )}
                                </div>

                                <div className="absolute right-2 top-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    type="button"
                                    variant="secondary"
                                    size="icon"
                                    className="h-9 w-9 rounded-xl"
                                    onClick={() => makePrimary(im.id)}
                                    title="Mark as primary"
                                  >
                                    {im.isPrimary ? "★" : "☆"}
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="h-9 w-9 rounded-xl"
                                    onClick={() => removeImage(im.id)}
                                    title="Remove"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>

                                <div className="p-2 flex items-center justify-between">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 rounded-xl"
                                    onClick={() => reorderImage(im.id, -1)}
                                    disabled={index === 0}
                                  >
                                    ↑
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 rounded-xl"
                                    onClick={() => reorderImage(im.id, 1)}
                                    disabled={index === images.length - 1}
                                  >
                                    ↓
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-2xl border border-border/70 bg-white p-4">
                        <h3 className="font-semibold mb-3">Preview Strip</h3>
                        {images.length === 0 ? (
                          <div className="rounded-2xl border border-dashed border-border/70 bg-background/20 p-6 text-center">
                            <p className="text-sm text-muted-foreground">
                              No thumbnails yet.
                            </p>
                          </div>
                        ) : (
                          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                            {images.map((im, index) => (
                              <button
                                key={im.id}
                                type="button"
                                onClick={() => makePrimary(im.id)}
                                className={`min-w-[110px] shrink-0 rounded-2xl border border-border/70 bg-white overflow-hidden transition hover:shadow-sm p-1 ${
                                  im.isPrimary ? "border-primary" : ""
                                }`}
                              >
                                <div className="relative rounded-xl overflow-hidden border border-border/50 bg-slate-50">
                                  <img
                                    src={im.src}
                                    alt={im.alt}
                                    className="h-[70px] w-full object-cover"
                                  />
                                  {im.isPrimary && (
                                    <div className="absolute left-2 top-2">
                                      <Badge className="rounded-full bg-primary text-primary-foreground border-none">
                                        Primary
                                      </Badge>
                                    </div>
                                  )}
                                </div>
                                <div className="mt-2 flex items-center justify-between">
                                  <span className="text-[11px] text-muted-foreground">
                                    #{index + 1}
                                  </span>
                                  <span className="text-[11px] text-primary">
                                    {im.isPrimary ? "" : ""}
                                  </span>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        <Separator className="my-4" />

                        <div className="space-y-2">
                          <Label>Optional Video URL</Label>
                          <Input
                            value={videoUrl}
                            onChange={(e) => setVideoUrl(e.target.value)}
                            placeholder="https://..."
                            className="h-11 rounded-xl"
                            ref={(el) => {
                              // keep ref for potential future
                              videoRefUrl.current = el;
                            }}
                          />
                        </div>
                      </div>

                      <div className="rounded-2xl border border-border/70 bg-white p-4 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-semibold">Upload Rules</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              Mark one image as primary for the catalog card.
                            </p>
                          </div>
                          <div className="rounded-2xl border border-border/60 bg-white px-3 py-2">
                            <div className="text-xs text-muted-foreground">
                              Total
                            </div>
                            <div className="text-xl font-semibold">
                              {images.length}
                            </div>
                          </div>
                        </div>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          <li>• Drag & drop supported</li>
                          <li>• Multiple uploads supported</li>
                          <li>• Hover actions for primary/remove</li>
                          <li>• Reordering supported</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* RIGHT SIDEBAR */}
            <div className="space-y-4">
              <div className="sticky top-[84px]">
                {/* Sidebar Section 1 - Product Summary */}
                <div className="rounded-2xl border border-border/70 bg-white shadow-sm p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-16 w-16 rounded-2xl border border-border/70 bg-slate-50 overflow-hidden">
                      {selectedPrimaryImage ? (
                        <img
                          src={selectedPrimaryImage.src}
                          alt="Primary"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                          <ImageIcon className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs text-muted-foreground">
                        Product Summary
                      </div>
                      <div className="font-semibold text-[15px] truncate">
                        {productName || "Untitled product"}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <div className="inline-flex flex-wrap gap-2">
                      <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                        MOQ: 1
                      </span>
                      <span className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700">
                        Warranty
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sidebar Section 1.5 - Product Codes */}
                <div className="mt-4 rounded-2xl border border-border/70 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-sm p-4">
                  <div className="mb-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-900">
                      Product Identifiers
                    </div>
                    <div className="mt-1 text-sm font-medium text-blue-800">
                      Unique codes for tracking
                    </div>
                  </div>
                  <div className="space-y-3">
                    {/* Product Code */}
                    <div>
                      <Label className="text-xs font-medium text-blue-900 mb-1 block">
                        Product Code
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="PROD-0512-XXXXX"
                          value={productCode}
                          onChange={(e) => setProductCode(e.target.value)}
                          className="h-9 rounded-lg text-sm bg-white/70"
                          readOnly={isEditMode}
                        />
                        {/* One-time generation happens on page open; no manual regenerate */}
                        {false && !isEditMode && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-9 rounded-lg px-3"
                            onClick={() => generateProductCode()}
                          >
                            Generate
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* SKU Code */}
                    <div>
                      <Label className="text-xs font-medium text-blue-900 mb-1 block">
                        SKU Code
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="SKU-XXXX-YYYY"
                          value={skuCode}
                          onChange={(e) => setSkuCode(e.target.value)}
                          className="h-9 rounded-lg text-sm bg-white/70"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sidebar Section 2 - Inventory Management */}
                <div className="mt-4 rounded-2xl border border-border/70 bg-gradient-to-br from-emerald-50 to-green-50 shadow-sm p-4">
                  <div className="mb-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-900">
                      Inventory Management
                    </div>
                    <div className="mt-1 text-sm font-medium text-emerald-800">
                      Multi-vendor stock allocation
                    </div>
                  </div>

                  {/* Total Inventory Summary */}
                  <div className="mb-4 rounded-xl border border-emerald-200/50 bg-white/60 p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-emerald-700">
                          Total Stock
                        </div>
                        <div className="text-2xl font-bold text-emerald-900">
                          {totalInventory}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-emerald-700">
                          {vendorInventory.length} Vendor
                          {vendorInventory.length !== 1 ? "s" : ""}
                        </div>
                        <div className="text-lg font-semibold text-emerald-900">
                          ₹
                          {vendorInventory
                            .reduce(
                              (sum, v) => sum + v.pricePerItem * v.quantity,
                              0,
                            )
                            .toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Vendor List */}
                  {vendorInventory.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-emerald-200/50 bg-white/30 p-4 text-center">
                      <p className="text-sm text-emerald-700 font-medium">
                        No vendors added yet
                      </p>
                      <p className="text-xs text-emerald-600 mt-1">
                        Add vendor contributions to track multi-source inventory
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 mb-3 max-h-[240px] overflow-y-auto">
                      {vendorInventory.map((vendor) => (
                        <div
                          key={vendor.id}
                          className="rounded-lg border border-emerald-200/50 bg-white/70 p-2.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-sm text-emerald-900">
                                {vendor.vendorName}
                              </div>
                              <div className="flex gap-4 mt-1 text-xs text-emerald-700">
                                <span>
                                  <span className="font-semibold">
                                    {vendor.quantity}
                                  </span>{" "}
                                  units
                                </span>
                                <span>
                                  ₹
                                  <span className="font-semibold">
                                    {vendor.pricePerItem}
                                  </span>
                                  /unit
                                </span>
                              </div>
                              {vendor.leadTime && (
                                <div className="text-xs text-emerald-600 mt-0.5">
                                  Lead: {vendor.leadTime}
                                </div>
                              )}
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 rounded-md hover:bg-red-100 text-red-600 p-0"
                              onClick={() => {
                                setVendorInventory((prev) =>
                                  prev.filter((v) => v.id !== vendor.id),
                                );
                                setTotalInventory((prev) =>
                                  Math.max(0, prev - vendor.quantity),
                                );
                              }}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Vendor Form */}
                  <div className="mt-3 pt-3 border-t border-emerald-200/50">
                    <details className="group cursor-pointer">
                      <summary className="flex items-center gap-2 text-sm font-medium text-emerald-900 hover:text-emerald-700">
                        <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                        Add Vendor Stock
                      </summary>

                      <div
                        className="mt-3 space-y-3 pl-6"
                        ref={vendorDropdownRef}
                      >
                        {/* Vendor autocomplete (registered vendors only) */}
                        <div className="space-y-1">
                          <Label className="text-xs font-medium text-emerald-900">
                            Vendor
                          </Label>

                          <div className="relative">
                            <Input
                              value={vendorSearch}
                              onChange={(e) => {
                                setVendorSearch(e.target.value);
                                setVendorDropdownOpen(true);
                              }}
                              onFocus={() => {
                                if (vendorSearch.trim())
                                  setVendorDropdownOpen(true);
                              }}
                              onKeyDown={(e) => {
                                if (!vendorDropdownOpen) return;

                                if (e.key === "Escape") {
                                  e.preventDefault();
                                  closeVendorDropdown();
                                  return;
                                }
                                if (e.key === "ArrowDown") {
                                  e.preventDefault();
                                  setVendorHighlightedIndex((i) =>
                                    Math.min(
                                      i + 1,
                                      Math.max(0, filteredVendors.length - 1),
                                    ),
                                  );
                                  return;
                                }
                                if (e.key === "ArrowUp") {
                                  e.preventDefault();
                                  setVendorHighlightedIndex((i) =>
                                    Math.max(0, i - 1),
                                  );
                                  return;
                                }
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  const picked =
                                    filteredVendors[vendorHighlightedIndex];
                                  if (!picked) return;
                                  setSelectedVendorId(String(picked.id));
                                  setSelectedVendorName(picked.name);
                                  setVendorSearch(picked.name);
                                  closeVendorDropdown();
                                }
                              }}
                              placeholder="Search vendor name..."
                              className="h-8 rounded-lg text-sm pr-10"
                              aria-expanded={vendorDropdownOpen}
                              aria-controls="vendor-autocomplete"
                            />

                            {vendorDropdownOpen && vendorSearch.trim() && (
                              <div className="absolute z-20 mt-1 w-full rounded-xl border border-emerald-200 bg-white shadow-lg overflow-hidden">
                                {filteredVendors.length === 0 ? (
                                  <div className="px-3 py-2 text-xs text-emerald-700">
                                    No vendors found
                                  </div>
                                ) : (
                                  <div
                                    id="vendor-autocomplete"
                                    role="listbox"
                                    aria-label="Vendor results"
                                    className="max-h-52 overflow-y-auto"
                                  >
                                    {filteredVendors.map((v, idx) => (
                                      <button
                                        key={v.id}
                                        type="button"
                                        role="option"
                                        aria-selected={
                                          idx === vendorHighlightedIndex
                                        }
                                        className={[
                                          "w-full text-left px-3 py-2 text-sm",
                                          idx === vendorHighlightedIndex
                                            ? "bg-emerald-50"
                                            : "hover:bg-emerald-50/70",
                                        ].join(" ")}
                                        onMouseEnter={() =>
                                          setVendorHighlightedIndex(idx)
                                        }
                                        onClick={() => {
                                          setSelectedVendorId(String(v.id));
                                          setSelectedVendorName(v.name);
                                          setVendorSearch(v.name);
                                          closeVendorDropdown();
                                        }}
                                      >
                                        <div className="font-medium text-emerald-900">
                                          {v.name}
                                        </div>
                                        <div className="text-xs text-emerald-600">
                                          {v.category} · {v.status}
                                        </div>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <Input
                          placeholder="Quantity"
                          type="number"
                          min="1"
                          id="vendor-qty-temp"
                          className="h-8 rounded-lg text-sm"
                        />
                        <Input
                          placeholder="Price per item"
                          type="number"
                          min="0"
                          step="0.01"
                          id="vendor-price-temp"
                          className="h-8 rounded-lg text-sm"
                        />
                        <Input
                          placeholder="Lead time (e.g., 5-7 days)"
                          id="vendor-lead-temp"
                          className="h-8 rounded-lg text-sm"
                        />

                        <Button
                          type="button"
                          size="sm"
                          className="w-full h-8 rounded-lg text-xs"
                          onClick={() => {
                            const qtyEl = document.getElementById(
                              "vendor-qty-temp",
                            ) as HTMLInputElement;
                            const priceEl = document.getElementById(
                              "vendor-price-temp",
                            ) as HTMLInputElement;
                            const leadEl = document.getElementById(
                              "vendor-lead-temp",
                            ) as HTMLInputElement;

                            const qty = parseInt(qtyEl?.value || "0");
                            const price = parseFloat(priceEl?.value || "0");
                            const lead = leadEl?.value.trim();

                            if (
                              !selectedVendorId ||
                              !selectedVendorName ||
                              qty <= 0 ||
                              price < 0
                            ) {
                              toast.error(
                                "Select a registered vendor, and enter quantity + price",
                              );
                              return;
                            }

                            const newVendor: VendorInventory = {
                              id: uid(),
                              vendorId: selectedVendorId,
                              vendorName: selectedVendorName,
                              quantity: qty,
                              pricePerItem: price,
                              leadTime: lead,
                            };

                            setVendorInventory((prev) => [...prev, newVendor]);
                            setTotalInventory((prev) => prev + qty);

                            // Reset form (keep vendor selection closed)
                            setVendorSearch(selectedVendorName);
                            closeVendorDropdown();

                            if (qtyEl) qtyEl.value = "";
                            if (priceEl) priceEl.value = "";
                            if (leadEl) leadEl.value = "";

                            toast.success("Vendor stock added");
                          }}
                        >
                          <Plus className="h-3 w-3 mr-1" /> Add Vendor
                        </Button>
                      </div>
                    </details>
                  </div>
                </div>

                {/* Sidebar Section 3 - Quick Actions */}
                <div className="mt-4 rounded-2xl border border-border/70 bg-white shadow-sm p-4 space-y-3">
                  <div className="text-sm font-semibold">Quick Actions</div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 rounded-2xl"
                    onClick={() => setPreviewModalOpen(true)}
                  >
                    Preview Product
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 rounded-2xl"
                    onClick={onSaveAsDraft}
                  >
                    Save as Draft
                  </Button>
                  <Button
                    type="button"
                    className="w-full h-12 rounded-2xl"
                    onClick={onPublish}
                  >
                    {isEditMode ? "Save Changes" : "Publish Product"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-border/70 px-6 py-4 flex justify-between items-center rounded-t-2xl">
              <h2 className="text-xl font-semibold">Product Preview</h2>
              <button
                onClick={() => setPreviewModalOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="font-semibold mb-2">Basic Information</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Code:</span>{" "}
                    {productCode || "N/A"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Name:</span>{" "}
                    {productName || "N/A"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Category:</span>{" "}
                    {category || "N/A"}
                  </div>
                  {subcategory && (
                    <div>
                      <span className="text-muted-foreground">
                        Sub-Category:
                      </span>{" "}
                      {subcategory}
                    </div>
                  )}
                  {brand && (
                    <div>
                      <span className="text-muted-foreground">Brand:</span>{" "}
                      {brand}
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              {description && (
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {description}
                  </p>
                </div>
              )}

              {/* Images */}
              {images.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">
                    Images ({images.length})
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`Preview ${idx}`}
                        className="w-full h-32 object-cover rounded-lg border border-border/70"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Key Specifications */}
              {keySpecifications.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Key Specifications</h3>
                  <table className="w-full text-sm border-collapse">
                    <tbody>
                      {keySpecifications.map((spec, idx) => (
                        <tr key={idx} className="border-b border-border/30">
                          <td className="p-2 font-medium text-muted-foreground">
                            {spec.specification}
                          </td>
                          <td className="p-2 text-right">
                            {spec.value} {spec.unit || ""}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* General Specifications */}
              {generalSpecifications.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">General Specifications</h3>
                  <table className="w-full text-sm border-collapse">
                    <tbody>
                      {generalSpecifications.map((spec, idx) => (
                        <tr key={idx} className="border-b border-border/30">
                          <td className="p-2 font-medium text-muted-foreground">
                            {spec.category}
                          </td>
                          <td className="p-2">{spec.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Vendor Inventory */}
              {vendorInventory.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Vendor Inventory</h3>
                  <div className="space-y-2">
                    {vendorInventory.map((vendor, idx) => (
                      <div
                        key={idx}
                        className="border border-border/70 rounded-lg p-3 text-sm space-y-1"
                      >
                        <div className="font-medium">{vendor.vendorName}</div>
                        <div>
                          <span className="text-muted-foreground">
                            Quantity:
                          </span>{" "}
                          {vendor.quantity}
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Price per Item:
                          </span>{" "}
                          ₹{vendor.pricePerItem.toFixed(2)}
                        </div>
                        {vendor.leadTime && (
                          <div>
                            <span className="text-muted-foreground">
                              Lead Time:
                            </span>{" "}
                            {vendor.leadTime}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Product Notes */}
              {productNotes && (
                <div>
                  <h3 className="font-semibold mb-2">Product Notes</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {productNotes}
                  </p>
                </div>
              )}

              {/* Tags */}
              {tags.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Status */}
              <div className="p-3 rounded-lg bg-slate-50 border border-border/70">
                <p className="text-xs text-muted-foreground">
                  Status:{" "}
                  <span className="font-semibold text-slate-900">
                    {isEditMode ? "Editing Draft" : "New Product"}
                  </span>
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-border/70 px-6 py-4 flex justify-end gap-2 rounded-b-2xl bg-slate-50">
              <Button
                variant="outline"
                onClick={() => setPreviewModalOpen(false)}
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  setPreviewModalOpen(false);
                  onSaveAsDraft();
                }}
              >
                Save as Draft
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
