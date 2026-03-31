import { useState } from "react";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { Tag, Plus, Percent, Gift, Zap, Settings, Copy, Edit, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface PricingRule {
  id: string; name: string; type: string; value: string; enabled: boolean; details?: string;
}
interface DiscountRule {
  id: string; name: string; type: string; value: string; enabled: boolean; details?: string;
}
interface CouponCode {
  id: string; code: string; discount: string; status: "active" | "expired"; validFrom: string; validTo: string;
}

export default function PricingDiscountsPage() {
  const { isOwner } = useAuth();
  const [showAddPricing, setShowAddPricing] = useState(false);
  const [showAddDiscount, setShowAddDiscount] = useState(false);
  const [showCreateCoupon, setShowCreateCoupon] = useState(false);

  const [pricingRules, setPricingRules] = useState<PricingRule[]>([
    { id: "pr1", name: "Default Markup (%)", type: "markup", value: "15%", enabled: true },
    { id: "pr2", name: "Tier-Based Pricing", type: "tier", value: "Active", enabled: true, details: "3 tiers configured" },
    { id: "pr3", name: "Seasonal & Promotional Pricing", type: "seasonal", value: "Active", enabled: true, details: "Diwali Offer · 10% OFF · 15 Nov → 15 Nov 2026" },
    { id: "pr4", name: "Bulk Order Pricing", type: "bulk", value: "Active", enabled: true, details: "₹100 units · ₹500 units 5 · ₹106 · 15% OFF" },
  ]);

  const [discountRules, setDiscountRules] = useState<DiscountRule[]>([
    { id: "dr1", name: "Volume-Based Discount", type: "volume", value: "₹200", enabled: true, details: "₹4,000 – ₹4,000" },
    { id: "dr2", name: "Client Loyalty Discount", type: "loyalty", value: "₹000", enabled: true, details: "₹4,000 – ₹10,000" },
    { id: "dr3", name: "Catalogue-Based Discount", type: "catalogue", value: "15% off", enabled: true, details: "131 SanDisk products" },
    { id: "dr4", name: "Payment Method Discount", type: "payment", value: "10% off", enabled: true, details: "For Advance Payment" },
  ]);

  const [discountComputation, setDiscountComputation] = useState("before_tax");
  const [gstRate, setGstRate] = useState("18");
  const [autoGenCoupons, setAutoGenCoupons] = useState(true);
  const [couponPrefix, setCouponPrefix] = useState("NIDO");

  const [coupons, setCoupons] = useState<CouponCode[]>([
    { id: "cp1", code: "NIDO1000", discount: "₹1000 OFF", status: "active", validFrom: "2026-01-04", validTo: "2026-03-31" },
    { id: "cp2", code: "SAVE500", discount: "₹500 OFF", status: "active", validFrom: "2026-01-04", validTo: "2026-03-31" },
    { id: "cp3", code: "FREESHIP", discount: "Free Shipping", status: "active", validFrom: "2026-01-01", validTo: "2026-12-31" },
  ]);

  const [newCoupon, setNewCoupon] = useState({ code: "", discount: "", validFrom: "", validTo: "" });
  const [newPricing, setNewPricing] = useState({ name: "", type: "markup", value: "", details: "" });
  const [newDiscount, setNewDiscount] = useState({ name: "", type: "volume", value: "", details: "" });

  const handleCreateCoupon = () => {
    if (!newCoupon.code || !newCoupon.discount) { toast({ title: "Error", description: "Code and discount are required", variant: "destructive" }); return; }
    setCoupons(prev => [...prev, { ...newCoupon, id: `cp-${Date.now()}`, status: "active" }]);
    setNewCoupon({ code: "", discount: "", validFrom: "", validTo: "" });
    setShowCreateCoupon(false);
    toast({ title: "Coupon Created", description: `Coupon ${newCoupon.code} created successfully` });
  };

  const handleAddPricingRule = () => {
    if (!newPricing.name) { toast({ title: "Error", description: "Rule name is required", variant: "destructive" }); return; }
    setPricingRules(prev => [...prev, { ...newPricing, id: `pr-${Date.now()}`, enabled: true }]);
    setNewPricing({ name: "", type: "markup", value: "", details: "" });
    setShowAddPricing(false);
    toast({ title: "Pricing Rule Added" });
  };

  const handleAddDiscountRule = () => {
    if (!newDiscount.name) { toast({ title: "Error", description: "Rule name is required", variant: "destructive" }); return; }
    setDiscountRules(prev => [...prev, { ...newDiscount, id: `dr-${Date.now()}`, enabled: true }]);
    setNewDiscount({ name: "", type: "volume", value: "", details: "" });
    setShowAddDiscount(false);
    toast({ title: "Discount Rule Added" });
  };

  return (
    <div>
      <Header title="Pricing & Discounts" />
      <div className="p-6 space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold">Pricing & Discounts</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage pricing, discounts, and promotions for products and services. Define tier-based pricing, seasonal discounts, bulk order discounts, and manage coupon codes.</p>
          </div>
          <Button className="gap-2" onClick={() => setShowCreateCoupon(true)}>
            <Plus className="h-4 w-4" /> Create Coupon
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Pricing & Discount Rules */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pricing Rules */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm flex items-center gap-2"><Tag className="h-4 w-4 text-primary" /> Pricing Rules</CardTitle>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7"><Settings className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7"><Copy className="h-3.5 w-3.5" /></Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {pricingRules.map(rule => (
                  <div key={rule.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-3">
                      <Checkbox checked={rule.enabled} onCheckedChange={v => setPricingRules(prev => prev.map(r => r.id === rule.id ? { ...r, enabled: !!v } : r))} />
                      <div>
                        <span className="text-sm font-medium">{rule.name}</span>
                        {rule.type === "seasonal" && <Badge className="ml-2 bg-amber-500 text-white text-[10px]">New Offer!</Badge>}
                        {rule.details && <p className="text-xs text-muted-foreground mt-0.5">{rule.details}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {rule.type === "markup" && (
                        <Select defaultValue="15"><SelectTrigger className="w-20 h-8"><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="10">10%</SelectItem><SelectItem value="15">15%</SelectItem><SelectItem value="20">20%</SelectItem><SelectItem value="25">25%</SelectItem></SelectContent>
                        </Select>
                      )}
                      <Switch checked={rule.enabled} onCheckedChange={v => setPricingRules(prev => prev.map(r => r.id === rule.id ? { ...r, enabled: v } : r))} />
                    </div>
                  </div>
                ))}
                <Button variant="default" size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={() => setShowAddPricing(true)}>
                  <Plus className="h-3.5 w-3.5" /> Add Pricing Rule
                </Button>
              </CardContent>
            </Card>

            {/* Discount Rules */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm flex items-center gap-2"><Percent className="h-4 w-4 text-primary" /> Discount Rules</CardTitle>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7"><Settings className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7"><Copy className="h-3.5 w-3.5" /></Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {discountRules.map(rule => (
                  <div key={rule.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-3">
                      <Checkbox checked={rule.enabled} onCheckedChange={v => setDiscountRules(prev => prev.map(r => r.id === rule.id ? { ...r, enabled: !!v } : r))} />
                      <div>
                        <span className="text-sm font-medium">{rule.name}</span>
                        <p className="text-xs text-muted-foreground mt-0.5">{rule.value} · {rule.details}</p>
                      </div>
                    </div>
                    <Switch checked={rule.enabled} onCheckedChange={v => setDiscountRules(prev => prev.map(r => r.id === rule.id ? { ...r, enabled: v } : r))} />
                  </div>
                ))}
                <Button variant="default" size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={() => setShowAddDiscount(true)}>
                  <Plus className="h-3.5 w-3.5" /> Add Discount Rule
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Column 2: Discount Computation + Coupons */}
          <div className="space-y-6">
            {/* Discount Computation Control */}
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">Discount Computation Control</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup value={discountComputation} onValueChange={setDiscountComputation} className="space-y-2">
                  <div className="flex items-center gap-2"><RadioGroupItem value="before_tax" id="bt" /><Label htmlFor="bt" className="text-sm">Apply Discount Before Tax</Label></div>
                  <div className="flex items-center gap-2"><RadioGroupItem value="after_tax" id="at" /><Label htmlFor="at" className="text-sm">Apply Discount After Tax</Label></div>
                  <div className="flex items-center gap-2"><RadioGroupItem value="inclusive" id="inc" /><Label htmlFor="inc" className="text-sm">Calculate Discount Inclusive of Tax</Label></div>
                </RadioGroup>
                <Separator />
                <div className="flex items-center gap-3">
                  <Label className="text-sm font-medium">GST Rate:</Label>
                  <Select value={gstRate} onValueChange={setGstRate}>
                    <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5%</SelectItem><SelectItem value="12">12%</SelectItem>
                      <SelectItem value="18">18%</SelectItem><SelectItem value="28">28%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="default" size="sm" className="gap-2 w-full bg-primary">
                  <Plus className="h-3.5 w-3.5" /> Add Coupon Code Rule
                </Button>
              </CardContent>
            </Card>

            {/* Coupon Codes */}
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">Coupon Codes</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Checkbox checked={autoGenCoupons} onCheckedChange={v => setAutoGenCoupons(!!v)} />
                  <Label className="text-sm">Auto Generate Coupon Codes</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Label className="text-sm">Coupon Prefix:</Label>
                  <Input value={couponPrefix} onChange={e => setCouponPrefix(e.target.value)} className="w-24 h-8" />
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
                    {coupons.map(c => (
                      <TableRow key={c.id}>
                        <TableCell className="font-mono font-medium text-xs">{c.code}</TableCell>
                        <TableCell className="text-xs">{c.discount}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={c.status === "active" ? "border-emerald-300 text-emerald-700 text-[10px]" : "text-[10px]"}>
                            {c.status === "active" ? "Active" : "Expired"}
                          </Badge>
                        </TableCell>
                        <TableCell><Button variant="ghost" size="icon" className="h-6 w-6"><Edit className="h-3 w-3" /></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Special Offers */}
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Gift className="h-4 w-4 text-primary" /> Special Offers & Promotions</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="border rounded-lg p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm">Flash Sale – 15% OFF</p>
                      <p className="text-xs text-muted-foreground">All Laptops · Till Dec 2026</p>
                    </div>
                    <Badge className="bg-emerald-600 text-white text-[10px]">Activate Flash Sale</Badge>
                  </div>
                </div>
                <div className="border rounded-lg p-3 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm">Free Gift</p>
                      <p className="text-xs text-muted-foreground">For orders above ₹5000</p>
                    </div>
                    <Badge className="bg-primary text-primary-foreground text-[10px]">Active till Nov 2026</Badge>
                  </div>
                </div>
                <div className="border rounded-lg p-3 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm">Diwali Special</p>
                      <p className="text-xs text-muted-foreground">10% OFF on all Electronics</p>
                    </div>
                    <Badge className="bg-amber-600 text-white text-[10px]">Active till 15 Nov 2026</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Create Coupon Dialog */}
      <Dialog open={showCreateCoupon} onOpenChange={setShowCreateCoupon}>
        <DialogContent className="max-w-[96vw] lg:max-w-[70vw] max-h-[90vh]">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Zap className="h-5 w-5 text-primary" /> Create New Coupon</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Coupon Code</Label><Input value={newCoupon.code} onChange={e => setNewCoupon(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="e.g. NIDO2026" /></div>
              <div className="space-y-2"><Label>Discount Value</Label><Input value={newCoupon.discount} onChange={e => setNewCoupon(p => ({ ...p, discount: e.target.value }))} placeholder="e.g. ₹500 OFF or 10%" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Valid From</Label><Input type="date" value={newCoupon.validFrom} onChange={e => setNewCoupon(p => ({ ...p, validFrom: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Valid To</Label><Input type="date" value={newCoupon.validTo} onChange={e => setNewCoupon(p => ({ ...p, validTo: e.target.value }))} /></div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowCreateCoupon(false)}>Cancel</Button>
              <Button onClick={handleCreateCoupon}>Create Coupon</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Pricing Rule Dialog */}
      <Dialog open={showAddPricing} onOpenChange={setShowAddPricing}>
        <DialogContent className="max-w-[96vw] lg:max-w-[60vw] max-h-[90vh]">
          <DialogHeader><DialogTitle>Add Pricing Rule</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Rule Name</Label><Input value={newPricing.name} onChange={e => setNewPricing(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Holiday Markup" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Type</Label>
                <Select value={newPricing.type} onValueChange={v => setNewPricing(p => ({ ...p, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="markup">Markup</SelectItem><SelectItem value="tier">Tier-Based</SelectItem><SelectItem value="seasonal">Seasonal</SelectItem><SelectItem value="bulk">Bulk</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Value</Label><Input value={newPricing.value} onChange={e => setNewPricing(p => ({ ...p, value: e.target.value }))} placeholder="e.g. 10%" /></div>
            </div>
            <div className="space-y-2"><Label>Details / Description</Label><Input value={newPricing.details} onChange={e => setNewPricing(p => ({ ...p, details: e.target.value }))} placeholder="Additional details" /></div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowAddPricing(false)}>Cancel</Button>
              <Button onClick={handleAddPricingRule}>Add Rule</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Discount Rule Dialog */}
      <Dialog open={showAddDiscount} onOpenChange={setShowAddDiscount}>
        <DialogContent className="max-w-[96vw] lg:max-w-[60vw] max-h-[90vh]">
          <DialogHeader><DialogTitle>Add Discount Rule</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Rule Name</Label><Input value={newDiscount.name} onChange={e => setNewDiscount(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Early Bird Discount" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Type</Label>
                <Select value={newDiscount.type} onValueChange={v => setNewDiscount(p => ({ ...p, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="volume">Volume-Based</SelectItem><SelectItem value="loyalty">Loyalty</SelectItem><SelectItem value="catalogue">Catalogue-Based</SelectItem><SelectItem value="payment">Payment Method</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Value</Label><Input value={newDiscount.value} onChange={e => setNewDiscount(p => ({ ...p, value: e.target.value }))} placeholder="e.g. ₹500 or 15%" /></div>
            </div>
            <div className="space-y-2"><Label>Details</Label><Input value={newDiscount.details} onChange={e => setNewDiscount(p => ({ ...p, details: e.target.value }))} placeholder="Additional details" /></div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowAddDiscount(false)}>Cancel</Button>
              <Button onClick={handleAddDiscountRule}>Add Rule</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
