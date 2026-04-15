import { useMemo, useState } from "react";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import {
  Tag,
  Plus,
  Percent,
  Gift,
  Zap,
  Settings,
  Copy,
  Edit,
  Trash2,
  X,
  Sparkles,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface PricingRule {
  id: string;
  name: string;
  type: string;
  ruleType?: string;
  value: string;
  enabled: boolean;
  details?: string;
  startDate?: string;
  endDate?: string;
  conditions?: Record<string, unknown>;
}
interface DiscountRule {
  id: string;
  name: string;
  type: string;
  value: string;
  enabled: boolean;
  details?: string;
  startDate?: string;
  endDate?: string;
  conditions?: Record<string, unknown>;
}
interface CouponCode {
  id: string;
  code: string;
  discount: string;
  status: "active" | "expired";
  validFrom: string;
  validTo: string;
}

export default function PricingDiscountsPage() {
  const { isOwner } = useAuth();
  const {
    clients,
    pricingRules,
    discountRules,
    couponCodes,
    couponCodeRules,
    masterCatalogItems,
    serviceTierPolicies,
    addPricingRule,
    updatePricingRule,
    addDiscountRule,
    updateDiscountRule,
    addCouponCode,
    addCouponCodeRule,
    addServiceTierPolicy,
    updateServiceTierPolicy,
    deleteServiceTierPolicy,
    resolveClientProductPricing,
    computeOrderPricing,
    autoConfigurePricingAndDiscountRules,
    autoGenerateCouponCampaign,
  } = useData();
  const [showAddPricing, setShowAddPricing] = useState(false);
  const [showAddDiscount, setShowAddDiscount] = useState(false);
  const [showCreateCoupon, setShowCreateCoupon] = useState(false);
  const [showCouponCodeRule, setShowCouponCodeRule] = useState(false);
  const [showAddTierPolicy, setShowAddTierPolicy] = useState(false);

  const [discountComputation, setDiscountComputation] = useState("before_tax");
  const [gstRate, setGstRate] = useState("18");
  const [autoGenCoupons, setAutoGenCoupons] = useState(true);
  const [couponPrefix, setCouponPrefix] = useState("NIDO");

  const catalogCategories = useMemo(
    () =>
      Array.from(
        new Set(
          masterCatalogItems.map((item) => item.category).filter(Boolean),
        ),
      ),
    [masterCatalogItems],
  );

  const catalogProducts = useMemo(
    () =>
      masterCatalogItems.map((item) => ({
        id: item.id,
        label: `${item.name} (${item.productCode})`,
        value: item.id,
      })),
    [masterCatalogItems],
  );

  const [simulationClientId, setSimulationClientId] = useState("");
  const [simulationProductId, setSimulationProductId] = useState("");
  const [simulationQuantity, setSimulationQuantity] = useState("1");

  const simulationPreview = useMemo(() => {
    const quantity = Math.max(1, Number(simulationQuantity) || 1);
    const product = masterCatalogItems.find(
      (item) => item.id === simulationProductId,
    );
    if (!product) return null;

    const resolved = resolveClientProductPricing({
      clientId: simulationClientId || undefined,
      productId: product.id,
      productCode: product.productCode,
      fallbackPrice: Number(product.discountPrice ?? product.price ?? 0),
    });

    const subtotal = resolved.unitPrice * quantity;
    const priced = computeOrderPricing({
      amount: subtotal,
      quantity,
      category: product.category,
      productCode: product.productCode,
    });
    const perUnitMargin = resolved.unitPrice - resolved.basePrice;
    const marginPercent =
      resolved.basePrice > 0 ? (perUnitMargin / resolved.basePrice) * 100 : 0;

    return {
      product,
      resolved,
      quantity,
      subtotal,
      priced,
      perUnitMargin,
      marginPercent,
    };
  }, [
    computeOrderPricing,
    masterCatalogItems,
    resolveClientProductPricing,
    simulationClientId,
    simulationProductId,
    simulationQuantity,
  ]);

  const [newTierPolicy, setNewTierPolicy] = useState({
    name: "",
    scopeType: "global" as "global" | "category" | "product",
    scopeValue: "*",
    highMultiplier: "1.22",
    midMultiplier: "1.00",
    lowMultiplier: "0.90",
    effectiveFrom: new Date().toISOString().slice(0, 10),
    effectiveTo: "2099-12-31",
    priority: "1",
  });

  // Form states
  const [newPricing, setNewPricing] = useState({
    name: "",
    ruleType: "Volume-Based",
    quantityMin: "",
    quantityOp: "Greater Than or Equal To",
    quantityVal: "",
    applyTo: "Specific Product Categories",
    selectedCategories: [] as string[],
    discountType: "Percentage Discount",
    discountValue: "",
    startDate: "",
    endDate: "",
  });

  const [newDiscount, setNewDiscount] = useState({
    name: "",
    description: "",
    ruleType: "Catalogue-Based Discount",
    minOrderAmount: "",
    discountType: "Percentage Discount",
    discountValue: "",
    startDate: "",
    endDate: "",
    maxUsagePerCustomer: "1",
    stackable: false,
  });

  const [newCoupon, setNewCoupon] = useState({
    name: "",
    codeGen: "Manual",
    code: "",
    discountType: "Percentage Discount",
    discountValue: "",
    requireMinPurchase: false,
    minPurchaseAmount: "",
    requireMinItems: false,
    minItemsInCart: "",
    validFrom: "",
    validTo: "",
    noExpiry: false,
    internalNotes: "",
    maxUsageGlobal: "500",
    maxUsagePerCustomer: "1",
  });

  const [couponCodeRuleForm, setCouponCodeRuleForm] = useState({
    name: "",
    description: "",
    triggerType: "Apply to Specific Code(s)",
    triggerValue: "",
    applyToCodesWith: "Apply to Codes with Prefix",
    codePrefix: "",
    conditions: [
      {
        type: "Cart Total",
        operator: "Greater Than or Equal To",
        value: "10000",
      },
    ],
    actions: { discountType: "Percentage Discount", discountValue: "20" },
    maxUsageGlobal: "500",
    maxUsagePerCustomer: "1",
  });

  const handleCreateCoupon = () => {
    if (!newCoupon.name || !newCoupon.discountValue) {
      toast({
        title: "Error",
        description: "Coupon name and discount are required",
        variant: "destructive",
      });
      return;
    }
    const code =
      newCoupon.codeGen === "Auto-Generate"
        ? `${couponPrefix}${Math.random().toString(36).substring(7).toUpperCase()}`
        : newCoupon.code;
    addCouponCode({
      title: newCoupon.name,
      code,
      discountType:
        newCoupon.discountType === "Fixed Amount Discount"
          ? "fixed"
          : newCoupon.discountType === "Free Shipping"
            ? "shipping"
            : "percentage",
      discountValue: Number(newCoupon.discountValue) || 0,
      minPurchase: Number(newCoupon.minPurchaseAmount) || 0,
      usageLimit: Number(newCoupon.maxUsageGlobal) || 0,
      usagePerCustomer: Number(newCoupon.maxUsagePerCustomer) || 1,
      validFrom: newCoupon.validFrom || new Date().toISOString().split("T")[0],
      validTo: newCoupon.validTo || "2026-12-31",
      active: true,
      notes: newCoupon.internalNotes,
    });
    setNewCoupon({
      name: "",
      codeGen: "Manual",
      code: "",
      discountType: "Percentage Discount",
      discountValue: "",
      requireMinPurchase: false,
      minPurchaseAmount: "",
      requireMinItems: false,
      minItemsInCart: "",
      validFrom: "",
      validTo: "",
      noExpiry: false,
      internalNotes: "",
      maxUsageGlobal: "500",
      maxUsagePerCustomer: "1",
    });
    setShowCreateCoupon(false);
    toast({
      title: "Coupon Created",
      description: `Coupon created successfully`,
    });
  };

  const handleAddPricingRule = () => {
    if (!newPricing.name) {
      toast({
        title: "Error",
        description: "Rule name is required",
        variant: "destructive",
      });
      return;
    }
    addPricingRule({
      name: newPricing.name,
      status: "active",
      ruleType:
        newPricing.ruleType === "Tiered Pricing"
          ? "Tiered Pricing"
          : "Volume-Based",
      minimumQuantity: Number(newPricing.quantityVal) || 1,
      categories:
        newPricing.applyTo === "Specific Product Categories" &&
        newPricing.selectedCategories.length > 0
          ? newPricing.selectedCategories
          : catalogCategories.slice(0, 1),
      products: [],
      adjustmentType:
        newPricing.discountType === "Markup" ? "markup" : "discount",
      valueType:
        newPricing.discountType === "Fixed Amount" ? "fixed" : "percentage",
      value: Number(newPricing.discountValue) || 0,
      startDate: newPricing.startDate || new Date().toISOString().slice(0, 10),
      endDate: newPricing.endDate || "2099-12-31",
      applyBeforeTax: true,
    });
    setNewPricing({
      name: "",
      ruleType: "Volume-Based",
      quantityMin: "",
      quantityOp: "Greater Than or Equal To",
      quantityVal: "",
      applyTo: "Specific Product Categories",
      selectedCategories: [],
      discountType: "Percentage Discount",
      discountValue: "",
      startDate: "",
      endDate: "",
    });
    setShowAddPricing(false);
    toast({ title: "Pricing Rule Added" });
  };

  const handleAddDiscountRule = () => {
    if (!newDiscount.name) {
      toast({
        title: "Error",
        description: "Rule name is required",
        variant: "destructive",
      });
      return;
    }
    addDiscountRule({
      name: newDiscount.name,
      status: "active",
      ruleType:
        newDiscount.ruleType === "Volume-Based Discount"
          ? "Volume-Based"
          : "Catalogue-Based",
      categories: catalogCategories.slice(0, 1),
      products: [],
      minimumOrderAmount: Number(newDiscount.minOrderAmount) || 0,
      discountPercent: Number(newDiscount.discountValue) || 0,
      maxUsagePerUser: Number(newDiscount.maxUsagePerCustomer) || 1,
      stackable: newDiscount.stackable,
      startDate: newDiscount.startDate || new Date().toISOString().slice(0, 10),
      endDate: newDiscount.endDate || "2099-12-31",
      applyBeforeTax: true,
    });
    setNewDiscount({
      name: "",
      description: "",
      ruleType: "Catalogue-Based Discount",
      minOrderAmount: "",
      discountType: "Percentage Discount",
      discountValue: "",
      startDate: "",
      endDate: "",
      maxUsagePerCustomer: "1",
      stackable: false,
    });
    setShowAddDiscount(false);
    toast({ title: "Discount Rule Added" });
  };

  const handleAddCouponCodeRule = () => {
    if (!couponCodeRuleForm.name) {
      toast({
        title: "Error",
        description: "Rule name is required",
        variant: "destructive",
      });
      return;
    }
    addCouponCodeRule({
      name: couponCodeRuleForm.name,
      triggerType:
        couponCodeRuleForm.triggerType === "Apply to Codes with Prefix"
          ? "prefix"
          : couponCodeRuleForm.triggerType === "Apply to Codes with Suffix"
            ? "suffix"
            : couponCodeRuleForm.triggerType === "Apply to All Codes"
              ? "all"
              : "specific",
      triggerValue: couponCodeRuleForm.triggerValue,
      conditionField: "cart_total",
      comparator: ">=",
      threshold: Number(couponCodeRuleForm.conditions[0]?.value) || 0,
      discountType:
        couponCodeRuleForm.actions.discountType === "Fixed Amount Discount"
          ? "fixed"
          : "percentage",
      discountValue: Number(couponCodeRuleForm.actions.discountValue) || 0,
      calculationOrder: "before_tax",
      maxUsageGlobal: Number(couponCodeRuleForm.maxUsageGlobal) || 0,
      maxUsagePerCustomer: Number(couponCodeRuleForm.maxUsagePerCustomer) || 1,
      stackable: false,
      active: true,
    });

    toast({ title: "Coupon Code Rule Added" });
    setCouponCodeRuleForm({
      name: "",
      description: "",
      triggerType: "Apply to Specific Code(s)",
      triggerValue: "",
      applyToCodesWith: "Apply to Codes with Prefix",
      codePrefix: "",
      conditions: [
        {
          type: "Cart Total",
          operator: "Greater Than or Equal To",
          value: "10000",
        },
      ],
      actions: { discountType: "Percentage Discount", discountValue: "20" },
      maxUsageGlobal: "500",
      maxUsagePerCustomer: "1",
    });
    setShowCouponCodeRule(false);
  };

  const handleAutomationSetup = () => {
    const configured = autoConfigurePricingAndDiscountRules();
    const campaign = autoGenerateCouponCampaign({
      prefix: couponPrefix,
      count: 5,
      discountType: "percentage",
      discountValue: 10,
      minPurchase: 5000,
      validDays: 90,
    });

    toast({
      title: "Automation completed",
      description: `${configured.pricingAdded} pricing, ${configured.discountAdded} discount, ${campaign.couponsCreated} coupons and ${campaign.rulesCreated} coupon rule generated.`,
    });
  };

  const handleAddTierPolicy = () => {
    if (!newTierPolicy.name.trim()) {
      toast({
        title: "Error",
        description: "Policy name is required",
        variant: "destructive",
      });
      return;
    }

    const scopeValue =
      newTierPolicy.scopeType === "global" ? "*" : newTierPolicy.scopeValue;
    if (!scopeValue.trim()) {
      toast({
        title: "Error",
        description: "Scope value is required",
        variant: "destructive",
      });
      return;
    }

    addServiceTierPolicy({
      name: newTierPolicy.name,
      scopeType: newTierPolicy.scopeType,
      scopeValue,
      highMultiplier: Number(newTierPolicy.highMultiplier) || 1,
      midMultiplier: Number(newTierPolicy.midMultiplier) || 1,
      lowMultiplier: Number(newTierPolicy.lowMultiplier) || 1,
      effectiveFrom: newTierPolicy.effectiveFrom,
      effectiveTo: newTierPolicy.effectiveTo,
      active: true,
      priority: Number(newTierPolicy.priority) || 1,
    });

    setNewTierPolicy({
      name: "",
      scopeType: "global",
      scopeValue: "*",
      highMultiplier: "1.22",
      midMultiplier: "1.00",
      lowMultiplier: "0.90",
      effectiveFrom: new Date().toISOString().slice(0, 10),
      effectiveTo: "2099-12-31",
      priority: "1",
    });
    setShowAddTierPolicy(false);
    toast({ title: "Service-tier policy added" });
  };

  return (
    <div>
      <Header title="Pricing & Discounts" />
      <div className="p-6 space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold">
              Pricing & Discounts
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage pricing, discounts, and promotions for products and
              services. Define tier-based pricing, seasonal discounts, bulk
              order discounts, and manage coupon codes.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleAutomationSetup}
            >
              <Zap className="h-4 w-4" /> Auto Configure
            </Button>
            <Button className="gap-2" onClick={() => setShowCreateCoupon(true)}>
              <Plus className="h-4 w-4" /> Create Coupon
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Pricing & Discount Rules */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pricing Rules */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Tag className="h-4 w-4 text-primary" /> Pricing Rules
                </CardTitle>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <Settings className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {pricingRules.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={rule.status === "active"}
                        onCheckedChange={(v) =>
                          updatePricingRule(rule.id, {
                            status: v ? "active" : "inactive",
                          })
                        }
                      />
                      <div>
                        <span className="text-sm font-medium">{rule.name}</span>
                        {rule.ruleType === "Tiered Pricing" && (
                          <Badge className="ml-2 bg-amber-500 text-white text-[10px]">
                            New Offer!
                          </Badge>
                        )}
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {rule.ruleType} · Min Qty {rule.minimumQuantity} ·{" "}
                          {rule.value}
                          {rule.valueType === "percentage" ? "%" : " INR"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {rule.adjustmentType === "markup" && (
                        <Select defaultValue="15">
                          <SelectTrigger className="w-20 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">10%</SelectItem>
                            <SelectItem value="15">15%</SelectItem>
                            <SelectItem value="20">20%</SelectItem>
                            <SelectItem value="25">25%</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      <Switch
                        checked={rule.status === "active"}
                        onCheckedChange={(v) =>
                          updatePricingRule(rule.id, {
                            status: v ? "active" : "inactive",
                          })
                        }
                      />
                    </div>
                  </div>
                ))}
                <Button
                  variant="default"
                  size="sm"
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => setShowAddPricing(true)}
                >
                  <Plus className="h-3.5 w-3.5" /> Add Pricing Rule
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" /> Owner Pricing
                  Console
                </CardTitle>
                <Button
                  size="sm"
                  className="gap-2"
                  onClick={() => setShowAddTierPolicy(true)}
                  disabled={!isOwner}
                >
                  <Plus className="h-3.5 w-3.5" /> Add Tier Policy
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {!isOwner && (
                  <p className="text-xs text-muted-foreground">
                    Owner access is required to create or modify pricing
                    policies.
                  </p>
                )}
                {serviceTierPolicies
                  .slice()
                  .sort((a, b) => b.priority - a.priority)
                  .map((policy) => (
                    <div
                      key={policy.id}
                      className="rounded-lg border border-border bg-card p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">{policy.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Scope: {policy.scopeType} {policy.scopeValue} ·
                            Priority {policy.priority}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {policy.effectiveFrom} to{" "}
                            {policy.effectiveTo || "No end date"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={policy.active}
                            onCheckedChange={(checked) =>
                              updateServiceTierPolicy(policy.id, {
                                active: checked,
                              })
                            }
                            disabled={!isOwner}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => deleteServiceTierPolicy(policy.id)}
                            disabled={!isOwner}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                        <Badge variant="outline" className="justify-center">
                          High x{policy.highMultiplier.toFixed(2)}
                        </Badge>
                        <Badge variant="outline" className="justify-center">
                          Mid x{policy.midMultiplier.toFixed(2)}
                        </Badge>
                        <Badge variant="outline" className="justify-center">
                          Low x{policy.lowMultiplier.toFixed(2)}
                        </Badge>
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>

            {/* Discount Rules */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Percent className="h-4 w-4 text-primary" /> Discount Rules
                </CardTitle>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <Settings className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {discountRules.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={rule.status === "active"}
                        onCheckedChange={(v) =>
                          updateDiscountRule(rule.id, {
                            status: v ? "active" : "inactive",
                          })
                        }
                      />
                      <div>
                        <span className="text-sm font-medium">{rule.name}</span>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {rule.ruleType} · {rule.discountPercent}% · Min ₹
                          {rule.minimumOrderAmount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={rule.status === "active"}
                      onCheckedChange={(v) =>
                        updateDiscountRule(rule.id, {
                          status: v ? "active" : "inactive",
                        })
                      }
                    />
                  </div>
                ))}
                <Button
                  variant="default"
                  size="sm"
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => setShowAddDiscount(true)}
                >
                  <Plus className="h-3.5 w-3.5" /> Add Discount Rule
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Column 2: Discount Computation + Coupons */}
          <div className="space-y-6">
            <Card className="overflow-hidden border-slate-200 bg-gradient-to-br from-slate-50 via-white to-blue-50 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-blue-600" /> Pricing
                  Simulation Lab
                </CardTitle>
                <p className="text-xs text-slate-600">
                  Safe sandbox preview. No live data is modified.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-xs">Client</Label>
                  <Select
                    value={simulationClientId}
                    onValueChange={setSimulationClientId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.companyName || client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Product</Label>
                  <Select
                    value={simulationProductId}
                    onValueChange={setSimulationProductId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {catalogProducts.map((product) => (
                        <SelectItem key={product.id} value={product.value}>
                          {product.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    value={simulationQuantity}
                    onChange={(e) => setSimulationQuantity(e.target.value)}
                  />
                </div>

                {simulationPreview ? (
                  <div className="space-y-2 rounded-lg border border-slate-200 bg-white/80 p-3">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-md border p-2">
                        <p className="text-slate-500">Price Source</p>
                        <p className="font-semibold capitalize">
                          {simulationPreview.resolved.source.replaceAll(
                            "-",
                            " ",
                          )}
                        </p>
                      </div>
                      <div className="rounded-md border p-2">
                        <p className="text-slate-500">Service Level</p>
                        <p className="font-semibold uppercase">
                          {simulationPreview.resolved.serviceLevel}
                        </p>
                      </div>
                      <div className="rounded-md border p-2">
                        <p className="text-slate-500">Base Unit Price</p>
                        <p className="font-semibold">
                          ₹
                          {simulationPreview.resolved.basePrice.toLocaleString()}
                        </p>
                      </div>
                      <div className="rounded-md border p-2">
                        <p className="text-slate-500">Resolved Unit Price</p>
                        <p className="font-semibold text-blue-700">
                          ₹
                          {simulationPreview.resolved.unitPrice.toLocaleString()}
                        </p>
                      </div>
                      <div className="rounded-md border p-2">
                        <p className="text-slate-500">Unit Margin</p>
                        <p className="font-semibold">
                          {simulationPreview.perUnitMargin >= 0 ? "+" : "-"}₹
                          {Math.abs(
                            simulationPreview.perUnitMargin,
                          ).toLocaleString()}
                        </p>
                      </div>
                      <div className="rounded-md border p-2">
                        <p className="text-slate-500">Margin %</p>
                        <p className="font-semibold">
                          {simulationPreview.marginPercent.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Subtotal</span>
                        <span className="font-medium">
                          ₹{simulationPreview.subtotal.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">
                          After pricing/discount rules
                        </span>
                        <span className="font-medium">
                          ₹
                          {simulationPreview.priced.discountedAmount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-t pt-1">
                        <span className="font-semibold text-slate-700">
                          Final (with tax)
                        </span>
                        <span className="font-semibold text-emerald-700">
                          ₹{simulationPreview.priced.total.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">
                    Select client and product to preview pricing path and
                    margin.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Discount Computation Control */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">
                  Discount Computation Control
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup
                  value={discountComputation}
                  onValueChange={setDiscountComputation}
                  className="space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="before_tax" id="bt" />
                    <Label htmlFor="bt" className="text-sm">
                      Apply Discount Before Tax
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="after_tax" id="at" />
                    <Label htmlFor="at" className="text-sm">
                      Apply Discount After Tax
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="inclusive" id="inc" />
                    <Label htmlFor="inc" className="text-sm">
                      Calculate Discount Inclusive of Tax
                    </Label>
                  </div>
                </RadioGroup>
                <Separator />
                <div className="flex items-center gap-3">
                  <Label className="text-sm font-medium">GST Rate:</Label>
                  <Select value={gstRate} onValueChange={setGstRate}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5%</SelectItem>
                      <SelectItem value="12">12%</SelectItem>
                      <SelectItem value="18">18%</SelectItem>
                      <SelectItem value="28">28%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="default"
                  size="sm"
                  className="gap-2 w-full bg-primary"
                  onClick={() => setShowCouponCodeRule(true)}
                >
                  <Plus className="h-3.5 w-3.5" /> Add Coupon Code Rule
                </Button>
              </CardContent>
            </Card>

            {/* Coupon Codes */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Coupon Codes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={autoGenCoupons}
                    onCheckedChange={(v) => setAutoGenCoupons(!!v)}
                  />
                  <Label className="text-sm">Auto Generate Coupon Codes</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Label className="text-sm">Coupon Prefix:</Label>
                  <Input
                    value={couponPrefix}
                    onChange={(e) => setCouponPrefix(e.target.value)}
                    className="w-24 h-8"
                  />
                </div>
                <Separator />
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Coupon Code</TableHead>
                      <TableHead className="text-xs">Discount</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {couponCodes.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-mono font-medium text-xs">
                          {c.code}
                        </TableCell>
                        <TableCell className="text-xs">
                          {c.discountType === "percentage"
                            ? `${c.discountValue}% OFF`
                            : c.discountType === "fixed"
                              ? `₹${c.discountValue} OFF`
                              : "Free Shipping"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              c.active
                                ? "border-emerald-300 text-emerald-700 text-[10px]"
                                : "text-[10px]"
                            }
                          >
                            {c.active ? "Active" : "Expired"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Special Offers */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Gift className="h-4 w-4 text-primary" /> Special Offers &
                  Promotions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="border rounded-lg p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm">Flash Sale – 15% OFF</p>
                      <p className="text-xs text-muted-foreground">
                        All Laptops · Till Dec 2026
                      </p>
                    </div>
                    <Badge className="bg-emerald-600 text-white text-[10px]">
                      Activate Flash Sale
                    </Badge>
                  </div>
                </div>
                <div className="border rounded-lg p-3 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm">Free Gift</p>
                      <p className="text-xs text-muted-foreground">
                        For orders above ₹5000
                      </p>
                    </div>
                    <Badge className="bg-primary text-primary-foreground text-[10px]">
                      Active till Nov 2026
                    </Badge>
                  </div>
                </div>
                <div className="border rounded-lg p-3 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm">Diwali Special</p>
                      <p className="text-xs text-muted-foreground">
                        10% OFF on all Electronics
                      </p>
                    </div>
                    <Badge className="bg-amber-600 text-white text-[10px]">
                      Active till 15 Nov 2026
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={showAddTierPolicy} onOpenChange={setShowAddTierPolicy}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Add Service Tier Policy</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Policy Name *</Label>
              <Input
                value={newTierPolicy.name}
                onChange={(e) =>
                  setNewTierPolicy((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                placeholder="e.g. IT Hardware Premium Policy"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Scope Type</Label>
                <Select
                  value={newTierPolicy.scopeType}
                  onValueChange={(value: "global" | "category" | "product") =>
                    setNewTierPolicy((prev) => ({
                      ...prev,
                      scopeType: value,
                      scopeValue: value === "global" ? "*" : "",
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">Global</SelectItem>
                    <SelectItem value="category">Category</SelectItem>
                    <SelectItem value="product">Product</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Scope Value</Label>
                {newTierPolicy.scopeType === "category" ? (
                  <Select
                    value={newTierPolicy.scopeValue}
                    onValueChange={(value) =>
                      setNewTierPolicy((prev) => ({
                        ...prev,
                        scopeValue: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {catalogCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : newTierPolicy.scopeType === "product" ? (
                  <Select
                    value={newTierPolicy.scopeValue}
                    onValueChange={(value) =>
                      setNewTierPolicy((prev) => ({
                        ...prev,
                        scopeValue: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {catalogProducts.map((product) => (
                        <SelectItem key={product.id} value={product.value}>
                          {product.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input value="*" disabled />
                )}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>High Multiplier</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newTierPolicy.highMultiplier}
                  onChange={(e) =>
                    setNewTierPolicy((prev) => ({
                      ...prev,
                      highMultiplier: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Mid Multiplier</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newTierPolicy.midMultiplier}
                  onChange={(e) =>
                    setNewTierPolicy((prev) => ({
                      ...prev,
                      midMultiplier: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Low Multiplier</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newTierPolicy.lowMultiplier}
                  onChange={(e) =>
                    setNewTierPolicy((prev) => ({
                      ...prev,
                      lowMultiplier: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Effective From</Label>
                <Input
                  type="date"
                  value={newTierPolicy.effectiveFrom}
                  onChange={(e) =>
                    setNewTierPolicy((prev) => ({
                      ...prev,
                      effectiveFrom: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Effective To</Label>
                <Input
                  type="date"
                  value={newTierPolicy.effectiveTo}
                  onChange={(e) =>
                    setNewTierPolicy((prev) => ({
                      ...prev,
                      effectiveTo: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Input
                  type="number"
                  min="1"
                  value={newTierPolicy.priority}
                  onChange={(e) =>
                    setNewTierPolicy((prev) => ({
                      ...prev,
                      priority: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddTierPolicy(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAddTierPolicy} disabled={!isOwner}>
              Save Policy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Coupon Dialog - Multi-tab */}
      <Dialog open={showCreateCoupon} onOpenChange={setShowCreateCoupon}>
        <DialogContent className="max-w-[96vw] lg:max-w-[75vw] max-h-[90vh] p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" /> Create Coupon
            </DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="basic" className="w-full px-6">
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="basic">Basic Information &</TabsTrigger>
              <TabsTrigger value="rules">Rules & Usage Limits</TabsTrigger>
              <TabsTrigger value="validity">Validity & Notes</TabsTrigger>
              <TabsTrigger value="codes">Codes</TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[calc(90vh-250px)] pr-4">
              <TabsContent value="basic" className="space-y-4 pb-4">
                <div className="space-y-2">
                  <Label>Coupon Name/Title *</Label>
                  <Input
                    value={newCoupon.name}
                    onChange={(e) =>
                      setNewCoupon((p) => ({ ...p, name: e.target.value }))
                    }
                    placeholder="e.g. Holiday Sale 20%"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Code Generation</Label>
                  <RadioGroup
                    value={newCoupon.codeGen}
                    onValueChange={(v) =>
                      setNewCoupon((p) => ({ ...p, codeGen: v }))
                    }
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="Manual" id="man" />
                      <Label htmlFor="man" className="text-sm">
                        Manual Entry
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="Auto-Generate" id="auto" />
                      <Label htmlFor="auto" className="text-sm">
                        Auto-Generate{" "}
                        <Badge className="ml-2 bg-emerald-100 text-emerald-700">
                          Generate
                        </Badge>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {newCoupon.codeGen === "Manual" && (
                  <div className="space-y-2">
                    <Label>Coupon Code</Label>
                    <Input
                      value={newCoupon.code}
                      onChange={(e) =>
                        setNewCoupon((p) => ({
                          ...p,
                          code: e.target.value.toUpperCase(),
                        }))
                      }
                      placeholder="e.g. HOLIDAY20"
                    />
                  </div>
                )}

                <Separator />

                <div className="space-y-2">
                  <Label>Discount Details</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Discount Type</Label>
                      <Select
                        value={newCoupon.discountType}
                        onValueChange={(v) =>
                          setNewCoupon((p) => ({ ...p, discountType: v }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Percentage Discount">
                            Percentage Discount
                          </SelectItem>
                          <SelectItem value="Fixed Amount Discount">
                            Fixed Amount Discount
                          </SelectItem>
                          <SelectItem value="Free Shipping">
                            Free Shipping
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Discount Value</Label>
                      <Input
                        value={newCoupon.discountValue}
                        onChange={(e) =>
                          setNewCoupon((p) => ({
                            ...p,
                            discountValue: e.target.value,
                          }))
                        }
                        placeholder="20 (for %) or 500 (for ₹)"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="rules" className="space-y-4 pb-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={newCoupon.requireMinPurchase}
                      onCheckedChange={(v) =>
                        setNewCoupon((p) => ({ ...p, requireMinPurchase: !!v }))
                      }
                      id="minPurch"
                    />
                    <Label htmlFor="minPurch" className="text-sm">
                      Require Minimum Purchase
                    </Label>
                  </div>
                  {newCoupon.requireMinPurchase && (
                    <Input
                      value={newCoupon.minPurchaseAmount}
                      onChange={(e) =>
                        setNewCoupon((p) => ({
                          ...p,
                          minPurchaseAmount: e.target.value,
                        }))
                      }
                      placeholder="₹5000"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={newCoupon.requireMinItems}
                      onCheckedChange={(v) =>
                        setNewCoupon((p) => ({ ...p, requireMinItems: !!v }))
                      }
                      id="minItems"
                    />
                    <Label htmlFor="minItems" className="text-sm">
                      Require Minimum Items in Cart
                    </Label>
                  </div>
                  {newCoupon.requireMinItems && (
                    <Input
                      value={newCoupon.minItemsInCart}
                      onChange={(e) =>
                        setNewCoupon((p) => ({
                          ...p,
                          minItemsInCart: e.target.value,
                        }))
                      }
                      placeholder="3"
                    />
                  )}
                </div>

                <Separator />
                <div className="space-y-2">
                  <Label>Maximum Usage (Global)</Label>
                  <Input
                    value={newCoupon.maxUsageGlobal}
                    onChange={(e) =>
                      setNewCoupon((p) => ({
                        ...p,
                        maxUsageGlobal: e.target.value,
                      }))
                    }
                    placeholder="500"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Maximum Usage Per Customer</Label>
                  <Input
                    value={newCoupon.maxUsagePerCustomer}
                    onChange={(e) =>
                      setNewCoupon((p) => ({
                        ...p,
                        maxUsagePerCustomer: e.target.value,
                      }))
                    }
                    placeholder="1"
                  />
                </div>
              </TabsContent>

              <TabsContent value="validity" className="space-y-4 pb-4">
                <div className="space-y-2">
                  <Label>Valid From Date & Time</Label>
                  <Input
                    type="date"
                    value={newCoupon.validFrom}
                    onChange={(e) =>
                      setNewCoupon((p) => ({ ...p, validFrom: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={newCoupon.noExpiry}
                      onCheckedChange={(v) =>
                        setNewCoupon((p) => ({ ...p, noExpiry: !!v }))
                      }
                      id="noExp"
                    />
                    <Label htmlFor="noExp" className="text-sm">
                      No End Date
                    </Label>
                  </div>
                  {!newCoupon.noExpiry && (
                    <div className="space-y-2">
                      <Label>Valid To Date & Time</Label>
                      <Input
                        type="date"
                        value={newCoupon.validTo}
                        onChange={(e) =>
                          setNewCoupon((p) => ({
                            ...p,
                            validTo: e.target.value,
                          }))
                        }
                      />
                    </div>
                  )}
                </div>

                <Separator />
                <div className="space-y-2">
                  <Label>Admin Notes</Label>
                  <Textarea
                    value={newCoupon.internalNotes}
                    onChange={(e) =>
                      setNewCoupon((p) => ({
                        ...p,
                        internalNotes: e.target.value,
                      }))
                    }
                    placeholder="Add details or context here..."
                  />
                </div>
              </TabsContent>

              <TabsContent value="codes" className="space-y-4 pb-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={autoGenCoupons}
                      onCheckedChange={setAutoGenCoupons}
                      id="autoGen"
                    />
                    <Label htmlFor="autoGen" className="text-sm">
                      Auto Generate Coupon Codes
                    </Label>
                  </div>
                </div>

                {autoGenCoupons && (
                  <>
                    <div className="space-y-2">
                      <Label>Coupon Prefix</Label>
                      <Input
                        value={couponPrefix}
                        onChange={(e) => setCouponPrefix(e.target.value)}
                        placeholder="NIDO"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Prefix Length</Label>
                      <Input type="number" placeholder="8" defaultValue="8" />
                    </div>
                  </>
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>

          <DialogFooter className="px-6 pb-6 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowCreateCoupon(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateCoupon}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Save Coupon
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Pricing Rule Dialog */}
      <Dialog open={showAddPricing} onOpenChange={setShowAddPricing}>
        <DialogContent className="max-w-[96vw] lg:max-w-[70vw] max-h-[90vh] p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>Add New Pricing Rule</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[calc(90vh-150px)]">
            <div className="px-6 pb-4 space-y-6">
              <div>
                <h3 className="font-semibold text-sm mb-4 pb-2 border-b">
                  BASIC INFORMATION
                </h3>
                <div className="space-y-2">
                  <Label>Rule Name *</Label>
                  <Input
                    value={newPricing.name}
                    onChange={(e) =>
                      setNewPricing((p) => ({ ...p, name: e.target.value }))
                    }
                    placeholder="e.g. Diwali Offer"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Switch defaultChecked />
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-sm mb-4 pb-2 border-b">
                  RULE TYPE & CONDITIONS
                </h3>
                <div className="space-y-2">
                  <Label>Select Rule Type</Label>
                  <RadioGroup
                    value={newPricing.ruleType}
                    onValueChange={(v) =>
                      setNewPricing((p) => ({ ...p, ruleType: v }))
                    }
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="Volume-Based" id="vb" />
                      <Label htmlFor="vb" className="text-sm">
                        Volume-Based
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="Tiered Pricing" id="tp" />
                      <Label htmlFor="tp" className="text-sm">
                        Tiered Pricing
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2 mt-4">
                  <Label className="text-sm font-medium">
                    Conditions (Logic Builder)
                  </Label>
                  <div className="space-y-3 p-3 border rounded bg-muted/50">
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <Label className="text-xs">Quantity is</Label>
                        <Select
                          value={newPricing.quantityOp}
                          onValueChange={(v) =>
                            setNewPricing((p) => ({ ...p, quantityOp: v }))
                          }
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Greater Than or Equal To">
                              Greater Than or Equal To
                            </SelectItem>
                            <SelectItem value="Less Than">Less Than</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-24">
                        <Label className="text-xs">Value</Label>
                        <Input
                          type="number"
                          value={newPricing.quantityVal}
                          onChange={(e) =>
                            setNewPricing((p) => ({
                              ...p,
                              quantityVal: e.target.value,
                            }))
                          }
                          placeholder="100"
                          className="h-8"
                        />
                      </div>
                      <Button variant="ghost" size="sm">
                        +
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  <Label>Apply To</Label>
                  <Select
                    value={newPricing.selectedCategories[0] || ""}
                    onValueChange={(value) =>
                      setNewPricing((p) => ({
                        ...p,
                        selectedCategories: value ? [value] : [],
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {catalogCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-sm mb-4 pb-2 border-b">
                  PRICE ACTION
                </h3>
                <div className="space-y-2">
                  <Label>Discount/Adjustment Type</Label>
                  <Select
                    value={newPricing.discountType}
                    onValueChange={(v) =>
                      setNewPricing((p) => ({ ...p, discountType: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Percentage Discount">
                        Percentage Discount
                      </SelectItem>
                      <SelectItem value="Fixed Amount">Fixed Amount</SelectItem>
                      <SelectItem value="Markup">Markup</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-4 mt-2">
                  <div className="flex-1 space-y-2">
                    <Label>Discount/Markup Value</Label>
                    <Input
                      value={newPricing.discountValue}
                      onChange={(e) =>
                        setNewPricing((p) => ({
                          ...p,
                          discountValue: e.target.value,
                        }))
                      }
                      placeholder="10%"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button variant="outline" size="sm">
                      Apply Before/After Tax
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-sm mb-4 pb-2 border-b">
                  AVAILABILITY
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={newPricing.startDate}
                      onChange={(e) =>
                        setNewPricing((p) => ({
                          ...p,
                          startDate: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={newPricing.endDate}
                      onChange={(e) =>
                        setNewPricing((p) => ({
                          ...p,
                          endDate: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="px-6 pb-4 border-t">
            <Button variant="outline" onClick={() => setShowAddPricing(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddPricingRule}>Save Rule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Discount Rule Dialog */}
      <Dialog open={showAddDiscount} onOpenChange={setShowAddDiscount}>
        <DialogContent className="max-w-[96vw] lg:max-w-[70vw] max-h-[90vh] p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>Add New Discount Rule</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[calc(90vh-150px)]">
            <div className="px-6 pb-4 space-y-6">
              <div>
                <h3 className="font-semibold text-sm mb-4 pb-2 border-b">
                  --- Basic Info ---
                </h3>
                <div className="space-y-2">
                  <Label>Rule Name *</Label>
                  <Input
                    value={newDiscount.name}
                    onChange={(e) =>
                      setNewDiscount((p) => ({ ...p, name: e.target.value }))
                    }
                    placeholder="e.g. Catalogue Clearance 25%"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Rule Description (Optional)</Label>
                  <Textarea
                    value={newDiscount.description}
                    onChange={(e) =>
                      setNewDiscount((p) => ({
                        ...p,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Brief explanation of this rule..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <RadioGroup defaultValue="active">
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="active" id="act" />
                      <Label htmlFor="act" className="text-sm">
                        Active
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="inactive" id="inact" />
                      <Label htmlFor="inact" className="text-sm">
                        Inactive
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-sm mb-4 pb-2 border-b">
                  --- Rule Type ---
                </h3>
                <div className="space-y-2">
                  <Label>Discount Rule Type</Label>
                  <Select
                    value={newDiscount.ruleType}
                    onValueChange={(v) =>
                      setNewDiscount((p) => ({ ...p, ruleType: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Catalogue-Based Discount">
                        Catalogue-Based Discount
                      </SelectItem>
                      <SelectItem value="Volume-Based Discount">
                        Volume-Based Discount
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 mt-4">
                  <Label>Minimum Order Amount to Apply</Label>
                  <Input
                    value={newDiscount.minOrderAmount}
                    onChange={(e) =>
                      setNewDiscount((p) => ({
                        ...p,
                        minOrderAmount: e.target.value,
                      }))
                    }
                    placeholder="Valid on orders above ₹10,000"
                  />
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-sm mb-4 pb-2 border-b">
                  --- Price Action ---
                </h3>
                <div className="space-y-2">
                  <Label>Discount Type</Label>
                  <Select
                    value={newDiscount.discountType}
                    onValueChange={(v) =>
                      setNewDiscount((p) => ({ ...p, discountType: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Percentage Discount">
                        Percentage Discount
                      </SelectItem>
                      <SelectItem value="Fixed Amount Discount">
                        Fixed Amount Discount
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Discount Value</Label>
                  <Input
                    value={newDiscount.discountValue}
                    onChange={(e) =>
                      setNewDiscount((p) => ({
                        ...p,
                        discountValue: e.target.value,
                      }))
                    }
                    placeholder="26"
                  />
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Switch />
                  <Label className="text-sm">Apply Before/After Tax</Label>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-sm mb-4 pb-2 border-b">
                  --- Limitations ---
                </h3>
                <div className="space-y-2">
                  <Label>Validity Period</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      type="date"
                      value={newDiscount.startDate}
                      onChange={(e) =>
                        setNewDiscount((p) => ({
                          ...p,
                          startDate: e.target.value,
                        }))
                      }
                      placeholder="Start Date"
                    />
                    <Input
                      type="date"
                      value={newDiscount.endDate}
                      onChange={(e) =>
                        setNewDiscount((p) => ({
                          ...p,
                          endDate: e.target.value,
                        }))
                      }
                      placeholder="End Date"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Max Usage Per Customer</Label>
                  <Input
                    value={newDiscount.maxUsagePerCustomer}
                    onChange={(e) =>
                      setNewDiscount((p) => ({
                        ...p,
                        maxUsagePerCustomer: e.target.value,
                      }))
                    }
                    placeholder="1"
                  />
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Checkbox
                    checked={newDiscount.stackable}
                    onCheckedChange={(v) =>
                      setNewDiscount((p) => ({ ...p, stackable: !!v }))
                    }
                  />
                  <Label className="text-sm">
                    Compatible Discounts (Stackable)
                  </Label>
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="px-6 pb-4 border-t">
            <Button variant="outline" onClick={() => setShowAddDiscount(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddDiscountRule}>Save Rule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Coupon Code Rule Dialog */}
      <Dialog open={showCouponCodeRule} onOpenChange={setShowCouponCodeRule}>
        <DialogContent className="max-w-[96vw] lg:max-w-[70vw] max-h-[90vh] p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>Add New Coupon Code Rule</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[calc(90vh-150px)]">
            <div className="px-6 pb-4 space-y-6">
              <div>
                <h3 className="font-semibold text-sm mb-4 pb-2 border-b">
                  --- Basic Info ---
                </h3>
                <div className="space-y-2">
                  <Label>Rule Name *</Label>
                  <Input
                    value={couponCodeRuleForm.name}
                    onChange={(e) =>
                      setCouponCodeRuleForm((p) => ({
                        ...p,
                        name: e.target.value,
                      }))
                    }
                    placeholder="Holiday Sale 20% OFF - New Codes Only"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Rule Description (Optional)</Label>
                  <Textarea
                    value={couponCodeRuleForm.description}
                    onChange={(e) =>
                      setCouponCodeRuleForm((p) => ({
                        ...p,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Enter code or prefix..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <RadioGroup defaultValue="active">
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="active" id="crule-act" />
                      <Label htmlFor="crule-act" className="text-sm">
                        Active
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-sm mb-4 pb-2 border-b">
                  --- Rule Trigger ---
                </h3>
                <div className="space-y-2">
                  <Label>Trigger Type</Label>
                  <Select
                    value={couponCodeRuleForm.triggerType}
                    onValueChange={(v) =>
                      setCouponCodeRuleForm((p) => ({ ...p, triggerType: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Apply to Specific Code(s)">
                        Apply to Specific Code(s)
                      </SelectItem>
                      <SelectItem value="Apply to Codes with Prefix">
                        Apply to Codes with Prefix
                      </SelectItem>
                      <SelectItem value="Apply to Codes with Suffix">
                        Apply to Codes with Suffix
                      </SelectItem>
                      <SelectItem value="Apply to All Codes">
                        Apply to All Codes
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {couponCodeRuleForm.triggerType !== "Apply to All Codes" && (
                  <div className="space-y-2 mt-4">
                    <Label>Trigger Value</Label>
                    <Input
                      value={couponCodeRuleForm.triggerValue}
                      onChange={(e) =>
                        setCouponCodeRuleForm((p) => ({
                          ...p,
                          triggerValue: e.target.value,
                        }))
                      }
                      placeholder="Enter code or prefix..."
                    />
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-semibold text-sm mb-4 pb-2 border-b">
                  --- Conditions ---
                </h3>
                <div className="space-y-3 p-3 border rounded bg-muted/50">
                  {couponCodeRuleForm.conditions.map((cond, idx) => (
                    <div key={idx} className="flex gap-2 items-end">
                      <div className="flex-1">
                        <Label className="text-xs">Cart Total</Label>
                        <Input
                          value={cond.value}
                          placeholder="10000"
                          className="h-8"
                        />
                      </div>
                      {idx === couponCodeRuleForm.conditions.length - 1 && (
                        <>
                          <Button variant="outline" size="sm">
                            +
                          </Button>
                          <Button variant="ghost" size="sm">
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground">
                    Number of Items in Cart
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Specific Products
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-sm mb-4 pb-2 border-b">
                  --- Actions ---
                </h3>
                <div className="space-y-2">
                  <Label>Discount Type</Label>
                  <Select
                    value={couponCodeRuleForm.actions.discountType}
                    onValueChange={(v) =>
                      setCouponCodeRuleForm((p) => ({
                        ...p,
                        actions: { ...p.actions, discountType: v },
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Percentage Discount">
                        Percentage Discount
                      </SelectItem>
                      <SelectItem value="Fixed Amount Discount">
                        Fixed Amount Discount
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Discount Value</Label>
                  <Input
                    value={couponCodeRuleForm.actions.discountValue}
                    onChange={(e) =>
                      setCouponCodeRuleForm((p) => ({
                        ...p,
                        actions: {
                          ...p.actions,
                          discountValue: e.target.value,
                        },
                      }))
                    }
                    placeholder="20 (for %) or 500 (for ₹)"
                  />
                </div>
                <div className="space-y-2 mt-4">
                  <Label>Calculation Order</Label>
                  <RadioGroup defaultValue="before">
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="before" id="before" />
                      <Label htmlFor="before" className="text-sm">
                        Before Tax
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="after" id="after" />
                      <Label htmlFor="after" className="text-sm">
                        After Tax
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-sm mb-4 pb-2 border-b">
                  --- Limitations ---
                </h3>
                <div className="space-y-2">
                  <Label>Maximum Usage (Global)</Label>
                  <Input
                    value={couponCodeRuleForm.maxUsageGlobal}
                    onChange={(e) =>
                      setCouponCodeRuleForm((p) => ({
                        ...p,
                        maxUsageGlobal: e.target.value,
                      }))
                    }
                    placeholder="500"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Maximum Usage Per Customer</Label>
                  <Input
                    value={couponCodeRuleForm.maxUsagePerCustomer}
                    onChange={(e) =>
                      setCouponCodeRuleForm((p) => ({
                        ...p,
                        maxUsagePerCustomer: e.target.value,
                      }))
                    }
                    placeholder="1"
                  />
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <Checkbox />
                  <Label className="text-sm">
                    Compatible with Automatic Discounts
                  </Label>
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="px-6 pb-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowCouponCodeRule(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAddCouponCodeRule}>Save Rule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
