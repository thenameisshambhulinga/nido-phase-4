import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, ArrowRight, Check, Building2, CreditCard, MapPin, FileText, User, Upload } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import MagicVendorUpload from "@/components/vendors/MagicVendorUpload";

const STEPS = [
  { label: "Basic Info", icon: User },
  { label: "Business", icon: Building2 },
  { label: "Financial", icon: CreditCard },
  { label: "Address", icon: MapPin },
  { label: "Documents", icon: FileText },
];

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
];

const GST_TREATMENTS = ["Registered Business", "Unregistered Business", "Composition Scheme", "Overseas", "SEZ"];

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
  companyName: "", contactPerson: "", email: "", phone: "", mobile: "", website: "",
  gstTreatment: "", sourceOfSupply: "", pan: "", gstin: "", msmeRegistered: false,
  currency: "INR", openingBalance: "0", paymentTerms: "Net 30", tds: "",
  bankName: "", accountNumber: "", ifscCode: "", branch: "",
  billingAddress: "", billingCity: "", billingState: "", billingPincode: "",
  shippingAddress: "", shippingCity: "", shippingState: "", shippingPincode: "",
  documents: [], category: "IT Hardware",
};

export default function VendorOnboardingPage() {
  const navigate = useNavigate();
  const { addVendor, addAuditEntry } = useData();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<VendorForm>(defaultForm);
  const [copyBilling, setCopyBilling] = useState(false);

  const updateForm = (fields: Partial<VendorForm>) => setForm(prev => ({ ...prev, ...fields }));

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
    if (data.msmeRegistered !== undefined) mapped.msmeRegistered = data.msmeRegistered;
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
    // Auto-submit after filling
    setTimeout(() => {
      const name = data.companyName || form.companyName || "Unknown Vendor";
      addVendor({
        name,
        category: data.category || form.category || "IT Hardware",
        contactEmail: data.email || form.email || "",
        contactPhone: data.phone || form.phone || "",
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
      toast({ title: "Vendor Auto-Created!", description: `${name} has been registered automatically and is pending approval.` });
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      updateForm({ documents: [...form.documents, ...Array.from(e.target.files)] });
    }
  };

  const handleSubmit = () => {
    addVendor({
      name: form.companyName,
      category: form.category,
      contactEmail: form.email,
      contactPhone: form.phone,
      address: `${form.billingAddress}, ${form.billingCity}, ${form.billingState} ${form.billingPincode}`,
      status: "pending",
      rating: 0,
      totalOrders: 0,
      totalSpend: 0,
      joinDate: new Date().toISOString().split("T")[0],
    });
    addAuditEntry({
      user: user?.name || "System",
      action: "Vendor Onboarded",
      module: "Vendors",
      details: `Onboarded vendor: ${form.companyName} via registration wizard`,
      ipAddress: "192.168.1.1",
      status: "success",
    });
    toast({ title: "Vendor Registered", description: `${form.companyName} has been successfully onboarded and is pending approval.` });
    navigate("/vendors");
  };

  const canProceed = () => {
    switch (step) {
      case 0: return form.companyName && form.contactPerson && form.email && form.phone;
      case 1: return form.gstTreatment && form.sourceOfSupply;
      case 2: return true;
      case 3: return form.billingAddress && form.billingCity && form.billingState && form.billingPincode;
      case 4: return true;
      default: return true;
    }
  };

  return (
    <div>
      <Header title="Vendor Onboarding" />
      <div className="p-6 space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/vendors")} className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Vendors
            </Button>
            <h1 className="text-2xl font-display font-bold">Register New Vendor</h1>
          </div>
          <MagicVendorUpload onExtracted={handleMagicFill} onAutoSubmit={handleMagicAutoSubmit} />
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-0">
          {STEPS.map((s, i) => (
            <div key={s.label} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    i < step ? "bg-foreground text-background" :
                    i === step ? "bg-foreground text-background ring-4 ring-foreground/20" :
                    "bg-muted text-muted-foreground"
                  }`}
                >
                  {i < step ? <Check className="h-5 w-5" /> : i + 1}
                </div>
                <span className={`text-xs font-medium ${i <= step ? "text-foreground" : "text-muted-foreground"}`}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-20 h-0.5 mx-2 mt-[-18px] ${i < step ? "bg-foreground" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>

        <Card className="max-w-4xl mx-auto">
          <CardContent className="p-8">
            {/* Step 0: Basic Info */}
            {step === 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <User className="h-5 w-5" /> Basic Information
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2"><Label>Company Name *</Label><Input value={form.companyName} onChange={e => updateForm({ companyName: e.target.value })} placeholder="Legal company name" /></div>
                  <div><Label>Contact Person *</Label><Input value={form.contactPerson} onChange={e => updateForm({ contactPerson: e.target.value })} placeholder="Primary contact full name" /></div>
                  <div><Label>Category *</Label>
                    <Select value={form.category} onValueChange={v => updateForm({ category: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["IT Hardware", "Office Supplies", "Cloud Services", "Security Systems", "Consulting", "Facility Maintenance", "Logistics", "Construction", "Cleaning Services"].map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Email *</Label><Input type="email" value={form.email} onChange={e => updateForm({ email: e.target.value })} placeholder="vendor@company.com" /></div>
                  <div><Label>Phone *</Label><Input value={form.phone} onChange={e => updateForm({ phone: e.target.value })} placeholder="+91 98765 43210" /></div>
                  <div><Label>Mobile (WhatsApp)</Label><Input value={form.mobile} onChange={e => updateForm({ mobile: e.target.value })} placeholder="+91 98765 43210" /></div>
                  <div><Label>Website</Label><Input value={form.website} onChange={e => updateForm({ website: e.target.value })} placeholder="https://company.com" /></div>
                </div>
              </div>
            )}

            {/* Step 1: Business Details */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <Building2 className="h-5 w-5" /> Business Details
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div><Label>GST Treatment *</Label>
                    <Select value={form.gstTreatment} onValueChange={v => updateForm({ gstTreatment: v })}>
                      <SelectTrigger><SelectValue placeholder="Select GST Treatment *" /></SelectTrigger>
                      <SelectContent>{GST_TREATMENTS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Source of Supply *</Label>
                    <Select value={form.sourceOfSupply} onValueChange={v => updateForm({ sourceOfSupply: v })}>
                      <SelectTrigger><SelectValue placeholder="Select State *" /></SelectTrigger>
                      <SelectContent>{INDIAN_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>PAN</Label><Input value={form.pan} onChange={e => updateForm({ pan: e.target.value.toUpperCase() })} placeholder="ABCDE1234F" maxLength={10} /></div>
                  <div><Label>GSTIN</Label><Input value={form.gstin} onChange={e => updateForm({ gstin: e.target.value.toUpperCase() })} placeholder="27AABCU9603R1ZM" maxLength={15} /></div>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox checked={form.msmeRegistered} onCheckedChange={(v) => updateForm({ msmeRegistered: v === true })} />
                  <Label>MSME Registered</Label>
                </div>
              </div>
            )}

            {/* Step 2: Financial Details */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <CreditCard className="h-5 w-5" /> Financial Details
                </div>
                <div className="grid grid-cols-3 gap-6">
                  <div><Label>Currency</Label>
                    <Select value={form.currency} onValueChange={v => updateForm({ currency: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Opening Balance</Label><Input type="number" value={form.openingBalance} onChange={e => updateForm({ openingBalance: e.target.value })} placeholder="0" /></div>
                  <div><Label>Payment Terms</Label>
                    <Select value={form.paymentTerms} onValueChange={v => updateForm({ paymentTerms: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["Net 15", "Net 30", "Net 45", "Net 60", "Due on Receipt", "Custom"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label>TDS (%)</Label><Input value={form.tds} onChange={e => updateForm({ tds: e.target.value })} placeholder="TDS percentage" /></div>

                <div className="border-t pt-6">
                  <h3 className="text-base font-semibold mb-4">Bank Account Details</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div><Label>Bank Name</Label><Input value={form.bankName} onChange={e => updateForm({ bankName: e.target.value })} placeholder="Bank name" /></div>
                    <div><Label>Account Number</Label><Input value={form.accountNumber} onChange={e => updateForm({ accountNumber: e.target.value })} placeholder="Account number" /></div>
                    <div><Label>IFSC Code</Label><Input value={form.ifscCode} onChange={e => updateForm({ ifscCode: e.target.value.toUpperCase() })} placeholder="IFSC code" maxLength={11} /></div>
                    <div><Label>Branch</Label><Input value={form.branch} onChange={e => updateForm({ branch: e.target.value })} placeholder="Branch name" /></div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Address */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <MapPin className="h-5 w-5" /> Address
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="text-base font-semibold text-primary">Billing Address</h3>
                    <div><Label>Address *</Label><Textarea value={form.billingAddress} onChange={e => updateForm({ billingAddress: e.target.value })} placeholder="Street address" rows={3} /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>City *</Label><Input value={form.billingCity} onChange={e => updateForm({ billingCity: e.target.value })} placeholder="City" /></div>
                      <div><Label>State *</Label>
                        <Select value={form.billingState} onValueChange={v => updateForm({ billingState: v })}>
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>{INDIAN_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div><Label>Pincode *</Label><Input value={form.billingPincode} onChange={e => updateForm({ billingPincode: e.target.value })} placeholder="Pincode" maxLength={6} /></div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-semibold text-primary">Shipping Address</h3>
                      <div className="flex items-center gap-2">
                        <Checkbox checked={copyBilling} onCheckedChange={(v) => handleCopyBilling(v === true)} />
                        <Label className="text-xs">Same as billing</Label>
                      </div>
                    </div>
                    <div><Label>Address</Label><Textarea value={form.shippingAddress} onChange={e => updateForm({ shippingAddress: e.target.value })} placeholder="Street address" rows={3} /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>City</Label><Input value={form.shippingCity} onChange={e => updateForm({ shippingCity: e.target.value })} placeholder="City" /></div>
                      <div><Label>State</Label>
                        <Select value={form.shippingState} onValueChange={v => updateForm({ shippingState: v })}>
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>{INDIAN_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div><Label>Pincode</Label><Input value={form.shippingPincode} onChange={e => updateForm({ shippingPincode: e.target.value })} placeholder="Pincode" maxLength={6} /></div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Documents */}
            {step === 4 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <FileText className="h-5 w-5" /> Documents Upload
                </div>
                <div
                  className="border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => document.getElementById("doc-upload")?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    e.preventDefault();
                    if (e.dataTransfer.files) {
                      updateForm({ documents: [...form.documents, ...Array.from(e.dataTransfer.files)] });
                    }
                  }}
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                      <Upload className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Drag and drop files here, or click to browse</p>
                      <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG up to 10MB each</p>
                    </div>
                    <Button variant="outline" size="sm" type="button">Browse Files</Button>
                  </div>
                  <input id="doc-upload" type="file" multiple accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFileChange} />
                </div>

                {form.documents.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Uploaded Files ({form.documents.length})</p>
                    {form.documents.map((file, i) => (
                      <div key={i} className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-md">
                        <span className="text-sm">{file.name} <span className="text-xs text-muted-foreground">({(file.size / 1024).toFixed(0)} KB)</span></span>
                        <Button variant="ghost" size="sm" onClick={() => updateForm({ documents: form.documents.filter((_, j) => j !== i) })}>Remove</Button>
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium mb-2">Recommended documents:</p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>Business Registration Certificate</li>
                    <li>GST Registration Certificate</li>
                    <li>PAN Card</li>
                    <li>Bank Account Proof (Cancelled Cheque)</li>
                    <li>MSME Certificate (if applicable)</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t">
              <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 0} className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              {step < STEPS.length - 1 ? (
                <Button onClick={() => setStep(s => s + 1)} disabled={!canProceed()} className="gap-2">
                  Next <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} className="gap-2 bg-success hover:bg-success/90">
                  <Check className="h-4 w-4" /> Submit Registration
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
