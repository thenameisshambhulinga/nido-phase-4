import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePageMeta } from "@/contexts/PageMetaContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Building2,
  CreditCard,
  MapPin,
  FileText,
  User,
  Upload,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import MagicVendorUpload from "@/components/vendors/MagicVendorUpload";
import {
  isValidEmail,
  isValidPhoneNumber,
  normalizeEmail,
} from "@/lib/validation";

const STEPS = [
  { label: "Basic Info", icon: User },
  { label: "Business", icon: Building2 },
  { label: "Financial", icon: CreditCard },
  { label: "Address", icon: MapPin },
  { label: "Documents", icon: FileText },
];

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

const GST_TREATMENTS = [
  "Registered Business",
  "Unregistered Business",
  "Composition Scheme",
  "Overseas",
  "SEZ",
];

interface VendorForm {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  mobile: string;
  website: string;
  gstTreatment: string;
  sourceOfSupply: string;
  pan: string;
  gstin: string;
  msmeRegistered: boolean;
  currency: string;
  openingBalance: string;
  paymentTerms: string;
  tds: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branch: string;
  billingAddress: string;
  billingCity: string;
  billingState: string;
  billingPincode: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingPincode: string;
  documents: File[];
  category: string;
}

const defaultForm: VendorForm = {
  companyName: "",
  contactPerson: "",
  email: "",
  phone: "",
  mobile: "",
  website: "",
  gstTreatment: "",
  sourceOfSupply: "",
  pan: "",
  gstin: "",
  msmeRegistered: false,
  currency: "INR",
  openingBalance: "0",
  paymentTerms: "Net 30",
  tds: "",
  bankName: "",
  accountNumber: "",
  ifscCode: "",
  branch: "",
  billingAddress: "",
  billingCity: "",
  billingState: "",
  billingPincode: "",
  shippingAddress: "",
  shippingCity: "",
  shippingState: "",
  shippingPincode: "",
  documents: [],
  category: "IT Hardware",
};

export default function VendorOnboardingPage() {
  const navigate = useNavigate();
  const { setMeta } = usePageMeta();

  useEffect(() => {
    setMeta({
      title: "Vendor Onboarding",
      breadcrumbs: [{ label: "Vendors" }, { label: "Onboarding" }],
    });
    return () => setMeta({});
  }, [setMeta]);
  const { addVendor, addAuditEntry } = useData();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<VendorForm>(defaultForm);
  const [copyBilling, setCopyBilling] = useState(false);

  const updateForm = (fields: Partial<VendorForm>) =>
    setForm((prev) => ({ ...prev, ...fields }));

  const handleMagicFill = (data: Record<string, any>) => {
    const mapped: Partial<VendorForm> = {};
    if (data.companyName) mapped.companyName = data.companyName;
    if (data.contactPerson) mapped.contactPerson = data.contactPerson;
    if (data.email) mapped.email = data.email;
    if (data.phone) mapped.phone = data.phone;
    if (data.mobile) mapped.mobile = data.mobile;
    if (data.website) mapped.website = data.website;
    if (data.gstTreatment) mapped.gstTreatment = data.gstTreatment;
    if (data.sourceOfSupply) mapped.sourceOfSupply = data.sourceOfSupply;
    if (data.pan) mapped.pan = data.pan;
    if (data.gstin) mapped.gstin = data.gstin;
    if (data.msmeRegistered !== undefined)
      mapped.msmeRegistered = data.msmeRegistered;
    if (data.currency) mapped.currency = data.currency;
    if (data.bankName) mapped.bankName = data.bankName;
    if (data.accountNumber) mapped.accountNumber = data.accountNumber;
    if (data.ifscCode) mapped.ifscCode = data.ifscCode;
    if (data.branch) mapped.branch = data.branch;
    if (data.billingAddress) mapped.billingAddress = data.billingAddress;
    if (data.billingCity) mapped.billingCity = data.billingCity;
    if (data.billingState) mapped.billingState = data.billingState;
    if (data.billingPincode) mapped.billingPincode = data.billingPincode;
    if (data.category) mapped.category = data.category;
    updateForm(mapped);
  };

  const handleMagicAutoSubmit = (data: Record<string, any>) => {
    handleMagicFill(data);
    setTimeout(() => {
      const name = data.companyName || form.companyName || "Unknown Vendor";
      const candidateEmail = String(data.email || form.email || "");
      const candidatePhone = String(data.phone || form.phone || "");
      if (
        !isValidEmail(candidateEmail) ||
        !isValidPhoneNumber(candidatePhone)
      ) {
        toast({
          title: "Validation failed",
          description:
            "Magic upload found invalid email or phone. Please review details before submit.",
          variant: "destructive",
        });
        return;
      }
      addVendor({
        name,
        category: data.category || form.category || "IT Hardware",
        contactEmail: normalizeEmail(candidateEmail),
        contactPhone: candidatePhone,
        address: `${data.billingAddress || ""}, ${data.billingCity || ""}, ${data.billingState || ""} ${data.billingPincode || ""}`,
        status: "pending",
        rating: 0,
        totalOrders: 0,
        totalSpend: 0,
        joinDate: new Date().toISOString().split("T")[0],
      });
      addAuditEntry({
        user: user?.name || "System",
        action: "Vendor Onboarded (Magic)",
        module: "Vendors",
        details: `Auto-onboarded vendor: ${name} via Magic PDF Upload`,
        ipAddress: "192.168.1.1",
        status: "success",
      });
      toast({
        title: "Vendor Auto-Created!",
        description: `${name} has been registered automatically and is pending approval.`,
      });
      navigate("/vendors");
    }, 300);
  };

  const handleCopyBilling = (checked: boolean) => {
    setCopyBilling(checked);
    if (checked) {
      updateForm({
        shippingAddress: form.billingAddress,
        shippingCity: form.billingCity,
        shippingState: form.billingState,
        shippingPincode: form.billingPincode,
      });
    }
  };

  const canProceed = () => {
    if (step === 0) {
      return (
        form.companyName?.trim() &&
        form.contactPerson?.trim() &&
        form.email?.trim()
      );
    }
    if (step === 1) {
      return form.gstin?.trim() || form.pan?.trim();
    }
    return true;
  };

  const save = () => {
    if (!form.companyName?.trim() || !form.email?.trim()) {
      toast({ title: "Company name and email are required" });
      return;
    }
    if (!isValidEmail(form.email)) {
      toast({ title: "Invalid email address" });
      return;
    }
    if (!form.contactPerson?.trim()) {
      toast({ title: "Contact person name is required" });
      return;
    }

    addVendor({
      name: form.companyName,
      category: form.category,
      contactPerson: form.contactPerson,
      contactEmail: normalizeEmail(form.email),
      contactPhone: form.phone,
      email: normalizeEmail(form.email),
      phone: form.phone,
      mobile: form.mobile,
      website: form.website,
      gstTreatment: form.gstTreatment,
      sourceOfSupply: form.sourceOfSupply,
      pan: form.pan,
      gstin: form.gstin,
      msmeRegistered: form.msmeRegistered,
      currency: form.currency,
      openingBalance: form.openingBalance,
      paymentTerms: form.paymentTerms,
      tds: form.tds,
      bankName: form.bankName,
      accountNumber: form.accountNumber,
      ifscCode: form.ifscCode,
      branch: form.branch,
      address: form.billingAddress,
      city: form.billingCity,
      state: form.billingState,
      pincode: form.billingPincode,
      shippingAddress: form.shippingAddress,
      shippingCity: form.shippingCity,
      shippingState: form.shippingState,
      shippingPincode: form.shippingPincode,
      status: "pending",
      rating: 0,
      totalOrders: 0,
      totalSpend: 0,
      joinDate: new Date().toISOString().split("T")[0],
    });

    toast({ title: "Vendor registered successfully" });
    navigate("/vendors");
  };

  return (
    <div>
      <div className="p-6 space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/vendors")}
            className="flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Vendors
          </Button>
          <div className="text-right">
            <h1 className="text-2xl font-display font-bold">
              Vendor Onboarding
            </h1>
            <p className="text-sm text-muted-foreground">
              Complete all 5 steps to register a new vendor
            </p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex justify-between items-center">
          {STEPS.map((s, idx) => {
            const StepIcon = s.icon;
            const isActive = step === idx;
            const isComplete = step > idx;
            return (
              <div key={idx} className="flex-1 flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isComplete
                        ? "bg-emerald-600 text-white"
                        : isActive
                          ? "bg-primary text-white"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isComplete ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <StepIcon className="h-5 w-5" />
                    )}
                  </div>
                  <span
                    className={`text-xs mt-1 ${
                      isActive ? "font-semibold text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      isComplete ? "bg-emerald-600" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Magic Upload Card */}
        <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <MagicVendorUpload
              onFill={handleMagicFill}
              onAutoSubmit={handleMagicAutoSubmit}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Step {step + 1}: {STEPS[step].label}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Step 0: Basic Info */}
            {step === 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Company Name *</Label>
                  <Input
                    value={form.companyName}
                    onChange={(e) => updateForm({ companyName: e.target.value })}
                    placeholder="Legal company name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={form.category}
                    onValueChange={(v) => updateForm({ category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IT Hardware">IT Hardware</SelectItem>
                      <SelectItem value="Cloud Servers">Cloud Servers</SelectItem>
                      <SelectItem value="Networking">Networking</SelectItem>
                      <SelectItem value="Office Supplies">Office Supplies</SelectItem>
                      <SelectItem value="Miscellaneous">Miscellaneous</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Contact Person *</Label>
                  <Input
                    value={form.contactPerson}
                    onChange={(e) => updateForm({ contactPerson: e.target.value })}
                    placeholder="Primary contact name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateForm({ email: e.target.value })}
                    placeholder="contact@company.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => updateForm({ phone: e.target.value })}
                    placeholder="+91 XXXXX XXXXX"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mobile</Label>
                  <Input
                    value={form.mobile}
                    onChange={(e) => updateForm({ mobile: e.target.value })}
                    placeholder="Alternate mobile number"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input
                    value={form.website}
                    onChange={(e) => updateForm({ website: e.target.value })}
                    placeholder="www.example.com"
                  />
                </div>
              </div>
            )}

            {/* Step 1: Business */}
            {step === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>GST Treatment</Label>
                  <Select
                    value={form.gstTreatment}
                    onValueChange={(v) => updateForm({ gstTreatment: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select treatment" />
                    </SelectTrigger>
                    <SelectContent>
                      {GST_TREATMENTS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Source of Supply</Label>
                  <Input
                    value={form.sourceOfSupply}
                    onChange={(e) => updateForm({ sourceOfSupply: e.target.value })}
                    placeholder="State/UT"
                  />
                </div>
                <div className="space-y-2">
                  <Label>GSTIN</Label>
                  <Input
                    value={form.gstin}
                    onChange={(e) => updateForm({ gstin: e.target.value })}
                    placeholder="27AABCT1234A1Z5"
                  />
                </div>
                <div className="space-y-2">
                  <Label>PAN Number</Label>
                  <Input
                    value={form.pan}
                    onChange={(e) => updateForm({ pan: e.target.value })}
                    placeholder="AAAAA0000A"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select
                    value={form.currency}
                    onValueChange={(v) => updateForm({ currency: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Opening Balance</Label>
                  <Input
                    type="number"
                    value={form.openingBalance}
                    onChange={(e) => updateForm({ openingBalance: e.target.value })}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="msme"
                    checked={form.msmeRegistered}
                    onCheckedChange={(checked) =>
                      updateForm({ msmeRegistered: !!checked })
                    }
                  />
                  <Label htmlFor="msme">MSME Registered</Label>
                </div>
              </div>
            )}

            {/* Step 2: Financial */}
            {step === 2 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Payment Terms</Label>
                  <Select
                    value={form.paymentTerms}
                    onValueChange={(v) => updateForm({ paymentTerms: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Net 15">Net 15</SelectItem>
                      <SelectItem value="Net 30">Net 30</SelectItem>
                      <SelectItem value="Net 45">Net 45</SelectItem>
                      <SelectItem value="Net 60">Net 60</SelectItem>
                      <SelectItem value="Due on Receipt">Due on Receipt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>TDS Rate (%)</Label>
                  <Input
                    value={form.tds}
                    onChange={(e) => updateForm({ tds: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bank Name</Label>
                  <Input
                    value={form.bankName}
                    onChange={(e) => updateForm({ bankName: e.target.value })}
                    placeholder="Bank name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Account Number</Label>
                  <Input
                    value={form.accountNumber}
                    onChange={(e) => updateForm({ accountNumber: e.target.value })}
                    placeholder="Account number"
                  />
                </div>
                <div className="space-y-2">
                  <Label>IFSC Code</Label>
                  <Input
                    value={form.ifscCode}
                    onChange={(e) => updateForm({ ifscCode: e.target.value })}
                    placeholder="SBIN0001234"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Branch</Label>
                  <Input
                    value={form.branch}
                    onChange={(e) => updateForm({ branch: e.target.value })}
                    placeholder="Branch name"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Address */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Billing Address</Label>
                    <Textarea
                      value={form.billingAddress}
                      onChange={(e) => updateForm({ billingAddress: e.target.value })}
                      placeholder="Street address"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Shipping Address</Label>
                    <Textarea
                      value={form.shippingAddress}
                      onChange={(e) => updateForm({ shippingAddress: e.target.value })}
                      placeholder="Street address"
                      rows={3}
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="copyBilling"
                    checked={copyBilling}
                    onCheckedChange={(checked) => {
                      setCopyBilling(!!checked);
                      if (checked) {
                        updateForm({
                          shippingAddress: form.billingAddress,
                          shippingCity: form.billingCity,
                          shippingState: form.billingState,
                          shippingPincode: form.billingPincode,
                        });
                      }
                    }}
                  />
                  <Label htmlFor="copyBilling">Shipping address same as billing</Label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Billing City</Label>
                    <Input
                      value={form.billingCity}
                      onChange={(e) => updateForm({ billingCity: e.target.value })}
                      placeholder="City"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Shipping City</Label>
                    <Input
                      value={form.shippingCity}
                      onChange={(e) => updateForm({ shippingCity: e.target.value })}
                      placeholder="City"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Billing State</Label>
                    <Select
                      value={form.billingState}
                      onValueChange={(v) => updateForm({ billingState: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {INDIAN_STATES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Shipping State</Label>
                    <Select
                      value={form.shippingState}
                      onValueChange={(v) => updateForm({ shippingState: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {INDIAN_STATES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Billing Pincode</Label>
                    <Input
                      value={form.billingPincode}
                      onChange={(e) => updateForm({ billingPincode: e.target.value })}
                      placeholder="400001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Shipping Pincode</Label>
                    <Input
                      value={form.shippingPincode}
                      onChange={(e) => updateForm({ shippingPincode: e.target.value })}
                      placeholder="400001"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Documents */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Upload Documents (GST Certificate, PAN Card, etc.)</Label>
                  <Input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files) {
                        updateForm({ documents: Array.from(files) });
                      }
                    }}
                  />
                  {form.documents.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {form.documents.map((doc, idx) => (
                        <p key={idx} className="text-sm text-muted-foreground">
                          ✓ {doc.name}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => (step > 0 ? setStep(step - 1) : navigate("/vendors"))}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {step === 0 ? "Cancel" : "Previous"}
          </Button>
          <div className="flex-1" />
          {step < STEPS.length - 1 && (
            <Button onClick={() => canProceed() && setStep(step + 1)} disabled={!canProceed()}>
              Next <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
          {step === STEPS.length - 1 && (
            <Button onClick={save} className="bg-emerald-600 hover:bg-emerald-700">
              <Check className="h-4 w-4 mr-2" /> Register Vendor
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}