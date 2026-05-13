import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  ChevronDown,
  Image as ImageIcon,
  Link as LinkIcon,
  MoreHorizontal,
  Plus,
  Save,
  Upload,
  X,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import Header from "@/components/layout/Header";
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
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/70 bg-white px-3 py-2">
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          className="h-8 px-2"
          onClick={() => onCommand("bold")}
        >
          <span className="font-semibold">B</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="h-8 px-2"
          onClick={() => onCommand("italic")}
        >
          <span className="italic">I</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="h-8 px-2"
          onClick={() => onCommand("underline")}
        >
          <span className="underline">U</span>
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          className="h-8 px-2"
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
          className="h-8 px-2"
          onClick={() => onCommand("justifyLeft")}
        >
          Left
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="h-8 px-2"
          onClick={() => onCommand("justifyCenter")}
        >
          Center
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="h-8 px-2"
          onClick={() => onCommand("justifyRight")}
        >
          Right
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      <div className="ml-auto flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          className="h-8 px-2"
          onClick={() => onCommand("image")}
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="h-8 px-2"
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
        onChange(`<div style="text-align:left">${safe}</div>`);
        return;
      case "justifyCenter":
        onChange(`<div style="text-align:center">${safe}</div>`);
        return;
      case "justifyRight":
        onChange(`<div style="text-align:right">${safe}</div>`);
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
  const [productCode, setProductCode] = useState("");
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
  const videoRefUrl = useRef<HTMLInputElement | null>(null);

  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const [videoUrl, setVideoUrl] = useState("");

  // Enhanced Product Code generation: PROD-MMDD-XXXXX (timestamp-based + random)
  const generateProductCode = () => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const randomSuffix = Math.floor(10000 + Math.random() * 90000).toString();
    const code = `PROD-${month}${day}-${randomSuffix}`;
    setProductCode(code);
    return code;
  };

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

  // Auto-generate both codes when product name or brand change (only for new items)
  useEffect(() => {
    if (isEditMode) return;
    if ((skuCode && skuCode.trim()) || (productCode && productCode.trim()))
      return;
    if (!productName.trim() && !brand.trim()) return;

    const t = setTimeout(() => {
      generateProductCode();
      generateSkuCode();
    }, 600);
    return () => clearTimeout(t);
  }, [productName, brand]);

  // General Specifications for sidebar
  const [generalSpecs, setGeneralSpecs] = useState({
    manufacturer: brand || "",
    colour: "",
    dimensions: "",
    weight: "",
    warranty: "",
    inTheBox: "",
  });

  const handleGeneralSpecsChange = (
    field: keyof typeof generalSpecs,
    value: string,
  ) => {
    setGeneralSpecs((prev) => ({
      ...prev,
      [field]: value,
    }));
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

    // local data URL conversion with progress.
    const fileArr = Array.from(files);
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

  const onSaveAsDraft = () => {
    toast.success("Draft saved (local build)");
  };

  const onPublish = () => {
    if (!productName.trim()) {
      toast.error("Product Name is required");
      return;
    }
    if (!skuCode.trim()) {
      toast.error("SKU Code is required");
      return;
    }
    if (!category.trim()) {
      toast.error("Category is required");
      return;
    }

    const primaryImage = images.find((im) => im.isPrimary) || images[0];

    const specAttributes = specRows.map((r) => ({
      category: specCategoryNameById.get(r.categoryId) || "Specifications",
      attribute: r.attribute,
      value: r.value,
      unit: r.unit,
    }));

    // Back-end model uses specAttributes: {category, attribute, value}.
    // We will store unit as part of value if API expects only value.
    const specAttributesForApi = specAttributes.map((s) => ({
      category: s.category,
      attribute: s.attribute,
      value: s.unit && s.unit !== "-" ? `${s.value} ${s.unit}` : s.value,
    }));

    const payload = {
      name: productName.trim(),
      productCode: productCode.trim() || skuCode.trim(),
      sku: skuCode.trim(),
      category: category.trim(),
      subCategory: subcategory.trim(),
      brand: brand.trim(),
      productType,
      physicalType: physicalType,
      price: 0,
      discountPrice: undefined,
      status: (editingItem?.status || "In Stock") as ProductStatus,
      image: primaryImage?.src,
      description: descriptionHtmlLike,
      tags,
      initialStock: editingItem?.initialStock || totalInventory,
      minStockThreshold: editingItem?.minStockThreshold || 0,
      specification: editingItem?.specification || "",
      warranty: editingItem?.warranty || "",
      hsnCode: editingItem?.hsnCode || "",
      dimUnit: editingItem?.dimUnit || "cm",
      weightUnit: editingItem?.weightUnit || "kg",
      customsDeclaration: editingItem?.customsDeclaration || "Exempt",
      primaryVendor: editingItem?.primaryVendor || "",
      vendorSku: editingItem?.vendorSku || "",
      leadTime: editingItem?.leadTime || "",
      vendorContact: editingItem?.vendorContact || "",
      vendorEmail: editingItem?.vendorEmail || "",
      vendorPhone: editingItem?.vendorPhone || "",
      vendorPhone2: editingItem?.vendorPhone2 || "",
      trackPerformance: editingItem?.trackPerformance || false,
      performanceRating: editingItem?.performanceRating || 4,
      specAttributes: specAttributesForApi as any,
      vendorInventory: vendorInventory as any,
      // Note: no forbidden sections.
    } as any;

    if (isEditMode && editingItem) {
      updateMasterCatalogItem(editingItem.id, payload);
      toast.success("Product updated successfully");
    } else {
      addMasterCatalogItem({
        id: Date.now().toString(),
        ...payload,
      } as any);
      toast.success("Product published (local build)");
    }

    navigate("/configuration/master-catalogue");
  };

  const selectedPrimaryImage = images.find((im) => im.isPrimary) || images[0];

  return (
    <div className="min-h-full w-full bg-background">
      <Header title="Configuration" />

      {/* FULL-WIDTH STICKY TOP ACTION BAR */}
      <div className="sticky top-0 z-40 w-full border-b border-border/70 bg-white/90 backdrop-blur">
        <div className="w-full px-6 py-4" style={{ maxWidth: "100%" }}>
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">{breadcrumb}</div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="h-11 rounded-xl px-4"
                onClick={onSaveAsDraft}
                disabled={!canEdit}
              >
                <Save className="mr-2 h-4 w-4" />
                Save as Draft
              </Button>
              <Button
                className="h-11 rounded-xl px-4"
                onClick={onPublish}
                disabled={!canEdit}
              >
                {isEditMode ? "Save Changes" : "Publish Product"}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11 rounded-xl"
                onClick={() => toast.info("Overflow menu (3 dots)")}
              >
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

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
                      <Input
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder="e.g., IT Hardware"
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
                      <Input
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        placeholder="e.g., Apple"
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
                                <TableRow key={r.id} className="align-middle">
                                  <TableCell>
                                    <div className="flex flex-col items-center gap-1">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-xl"
                                        onClick={() => moveSpecRow(r.id, -1)}
                                        disabled={idx === 0}
                                      >
                                        <span className="text-lg">↑</span>
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-xl"
                                        onClick={() => moveSpecRow(r.id, 1)}
                                        disabled={idx === specRows.length - 1}
                                      >
                                        <span className="text-lg">↓</span>
                                      </Button>
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

              {/* SECTION 4 */}
              <Card className="rounded-2xl bg-white shadow-sm border-border/70">
                <CardContent className="p-6 space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold">
                      4. Product Images & Media
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

                  <div className="rounded-2xl border border-border/70 bg-background/30 p-3">
                    <div className="text-xs text-muted-foreground">
                      Price Preview
                    </div>
                    <div className="text-3xl font-semibold mt-1">₹0</div>
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
                        {!isEditMode && (
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
                          readOnly={isEditMode}
                        />
                        {!isEditMode && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-9 rounded-lg px-3"
                            onClick={() => generateSkuCode()}
                          >
                            Generate
                          </Button>
                        )}
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
                      <div className="mt-3 space-y-2 pl-6">
                        <Input
                          placeholder="Vendor name"
                          id="vendor-name-temp"
                          className="h-8 rounded-lg text-sm"
                        />
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
                            const nameEl = document.getElementById(
                              "vendor-name-temp",
                            ) as HTMLInputElement;
                            const qtyEl = document.getElementById(
                              "vendor-qty-temp",
                            ) as HTMLInputElement;
                            const priceEl = document.getElementById(
                              "vendor-price-temp",
                            ) as HTMLInputElement;
                            const leadEl = document.getElementById(
                              "vendor-lead-temp",
                            ) as HTMLInputElement;

                            const name = nameEl?.value.trim();
                            const qty = parseInt(qtyEl?.value || "0");
                            const price = parseFloat(priceEl?.value || "0");
                            const lead = leadEl?.value.trim();

                            if (!name || qty <= 0 || price < 0) {
                              toast.error(
                                "Please fill vendor name, quantity, and price",
                              );
                              return;
                            }

                            const newVendor: VendorInventory = {
                              id: uid(),
                              vendorName: name,
                              quantity: qty,
                              pricePerItem: price,
                              leadTime: lead,
                            };

                            setVendorInventory((prev) => [...prev, newVendor]);
                            setTotalInventory((prev) => prev + qty);

                            // Reset form
                            if (nameEl) nameEl.value = "";
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

                {/* Sidebar Section 3 - General Specifications (EDITABLE) */}
                <div className="mt-4 rounded-2xl border border-border/70 bg-white shadow-sm p-4">
                  <div className="mb-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      General Specifications
                    </div>
                    <div className="mt-1 text-sm font-medium text-foreground">
                      Product attributes
                    </div>
                  </div>
                  <div className="space-y-3">
                    {/* Manufacturer */}
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                        Manufacturer
                      </Label>
                      <Input
                        placeholder="e.g., Sony, Dell"
                        value={generalSpecs.manufacturer}
                        onChange={(e) =>
                          handleGeneralSpecsChange(
                            "manufacturer",
                            e.target.value,
                          )
                        }
                        className="h-8 rounded-lg text-sm"
                      />
                    </div>

                    {/* Colour */}
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                        Colour
                      </Label>
                      <Input
                        placeholder="e.g., Black, White, Silver"
                        value={generalSpecs.colour}
                        onChange={(e) =>
                          handleGeneralSpecsChange("colour", e.target.value)
                        }
                        className="h-8 rounded-lg text-sm"
                      />
                    </div>

                    {/* Dimensions */}
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                        Dimensions
                      </Label>
                      <Input
                        placeholder="e.g., 100x200x50 cm"
                        value={generalSpecs.dimensions}
                        onChange={(e) =>
                          handleGeneralSpecsChange("dimensions", e.target.value)
                        }
                        className="h-8 rounded-lg text-sm"
                      />
                    </div>

                    {/* Weight */}
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                        Weight
                      </Label>
                      <Input
                        placeholder="e.g., 2.5 kg"
                        value={generalSpecs.weight}
                        onChange={(e) =>
                          handleGeneralSpecsChange("weight", e.target.value)
                        }
                        className="h-8 rounded-lg text-sm"
                      />
                    </div>

                    {/* Warranty */}
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                        Warranty
                      </Label>
                      <Input
                        placeholder="e.g., 1 Year, 2 Years"
                        value={generalSpecs.warranty}
                        onChange={(e) =>
                          handleGeneralSpecsChange("warranty", e.target.value)
                        }
                        className="h-8 rounded-lg text-sm"
                      />
                    </div>

                    {/* In the Box */}
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                        In the Box
                      </Label>
                      <Textarea
                        placeholder="e.g., Product, Manual, Cable, Warranty Card"
                        value={generalSpecs.inTheBox}
                        onChange={(e) =>
                          handleGeneralSpecsChange("inTheBox", e.target.value)
                        }
                        className="min-h-16 rounded-lg text-sm resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Sidebar Section 3 - Quick Actions */}
                <div className="mt-4 rounded-2xl border border-border/70 bg-white shadow-sm p-4 space-y-3">
                  <div className="text-sm font-semibold">Quick Actions</div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 rounded-2xl"
                    onClick={() => toast.info("Preview Product (stub)")}
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
    </div>
  );
}
