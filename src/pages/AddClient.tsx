import { useMemo, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useData } from "@/contexts/DataContext";
import { toast } from "@/hooks/use-toast";
import { nextSequentialCode } from "@/lib/documentNumbering";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Building2,
  CreditCard,
  MapPin,
  FileText,
  User,
} from "lucide-react";

const STEPS = [
  { label: "General Information", icon: User },
  { label: "Contract Terms", icon: CreditCard },
  { label: "Additional Information", icon: FileText },
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

export default function AddClient() {
  const { addClient, clients, generalSettings } = useData();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const clientCodePrefix =
    Object.values(generalSettings)[0]?.clientCodePrefix?.trim() || "CL";

  const [form, setForm] = useState(() => ({
    companyName: "",
    clientCode: nextSequentialCode(
      clientCodePrefix,
      clients.map((entry) => entry.clientCode),
      5,
    ),
    companyLogoName: "",
    primaryContactName: "",
    employeeId: "",
    contactNumber: "",
    email: "",
    jobTitle: "",
    gst: "",
    pan: "",
    industryType: "",
    businessType: "Registered" as "Registered" | "Unregistered" | "Consumer",
    address: "",
    city: "",
    state: "",
    country: "",
    currency: "INR",
    zipCode: "",
    timeZone: "",
    contractStart: "",
    contractEnd: "",
    contractType: "",
    pricingTier: "mid" as "high" | "mid" | "low" | "custom",
    paymentTerms: "",
    contractDocNames: [] as string[],
    notes: "",
  }));

  const isRegistered = form.businessType === "Registered";
  const notesWordCount = useMemo(
    () => form.notes.trim().split(/\s+/).filter(Boolean).length,
    [form.notes],
  );

  const updateForm = (fields: Partial<typeof form>) =>
    setForm((prev) => ({ ...prev, ...fields }));

  const handleFile = (
    evt: ChangeEvent<HTMLInputElement>,
    mode: "logo" | "contract",
  ) => {
    const files = evt.target.files;
    if (!files || files.length === 0) return;
    if (mode === "logo") {
      updateForm({ companyLogoName: files[0].name });
      return;
    }
    const names = Array.from(files).map((f) => f.name);
    updateForm({ contractDocNames: names });
  };

  const canProceed = () => {
    if (step === 0) {
      return (
        form.companyName?.trim() &&
        form.clientCode?.trim() &&
        form.primaryContactName?.trim() &&
        form.email?.trim()
      );
    }
    if (step === 1) {
      return (
        form.contractType &&
        form.pricingTier &&
        form.paymentTerms &&
        form.contractStart &&
        form.contractEnd
      );
    }
    return true;
  };

  const save = () => {
    if (!form.companyName?.trim() || !form.email?.trim()) {
      toast({ title: "Company name and email are required" });
      return;
    }
    if (!form.primaryContactName?.trim() || !form.contactNumber?.trim()) {
      toast({ title: "Primary contact name and phone are required" });
      return;
    }
    if (isRegistered && !form.gst?.trim()) {
      toast({ title: "GST number is required for registered businesses" });
      return;
    }
    if (
      form.contractStart &&
      form.contractEnd &&
      form.contractStart > form.contractEnd
    ) {
      toast({ title: "Contract end date must be after contract start date" });
      return;
    }
    if (notesWordCount > 500) {
      toast({ title: "Additional information must be within 500 words" });
      return;
    }

    addClient({
      name: form.companyName,
      companyName: form.companyName,
      clientCode:
        form.clientCode ||
        nextSequentialCode(
          clientCodePrefix,
          clients.map((entry) => entry.clientCode),
          5,
        ),
      contactPerson: form.primaryContactName,
      contactEmployeeId: form.employeeId,
      contactNumber: form.contactNumber,
      email: form.email,
      jobTitle: form.jobTitle,
      companyLogo: form.companyLogoName,
      gst: form.gst,
      pan: form.pan,
      industryType: form.industryType,
      businessType: form.businessType,
      locationDetails: {
        address: form.address,
        city: form.city,
        state: form.state,
        country: form.country,
        currency: form.currency,
        zipCode: form.zipCode,
        timeZone: form.timeZone,
      },
      contractType: form.contractType,
      pricingTier: form.pricingTier,
      paymentTerms: form.paymentTerms,
      contractDocuments: form.contractDocNames,
      notes: form.notes,
      phone: form.contactNumber,
      address: form.address,
      status: "active",
      contractStart: form.contractStart,
      contractEnd: form.contractEnd,
      totalOrders: 0,
    });

    toast({ title: "Client registered successfully" });
    navigate("/clients");
  };

  return (
    <div>
      <Header title="Client Onboarding" />
      <div className="p-6 space-y-6 animate-fade-in">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/clients")}
            className="flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Clients
          </Button>
          <div className="text-right">
            <h1 className="text-2xl font-display font-bold">
              Register New Client
            </h1>
            <p className="text-sm text-muted-foreground">
              Guided onboarding for company, contract, and profile details
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto rounded-2xl border bg-card p-6 shadow-sm space-y-6">
          {/* Step Indicator */}
          <div>
            <div className="flex justify-between items-center mb-8">
              {STEPS.map((s, idx) => {
                const StepIcon = s.icon;
                const isActive = step === idx;
                const isComplete = step > idx;
                return (
                  <div key={idx} className="flex-1">
                    <div className="flex items-center">
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
                      {idx < STEPS.length - 1 && (
                        <div
                          className={`flex-1 h-1 mx-2 ${
                            isComplete ? "bg-emerald-600" : "bg-muted"
                          }`}
                        />
                      )}
                    </div>
                    <p
                      className={`text-xs mt-2 text-center ${isActive ? "font-semibold text-primary" : "text-muted-foreground"}`}
                    >
                      {s.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 0: General Information */}
          {step === 0 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-1">General Information</h2>
                <p className="text-sm text-muted-foreground">
                  Provide basic company and contact details
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Company Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Company Name *</Label>
                      <Input
                        value={form.companyName}
                        onChange={(e) =>
                          updateForm({ companyName: e.target.value })
                        }
                        placeholder="Legal company name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Client Code *</Label>
                      <Input
                        value={form.clientCode}
                        onChange={(e) =>
                          updateForm({ clientCode: e.target.value })
                        }
                        placeholder="e.g. CL-001"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Company Logo</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFile(e, "logo")}
                    />
                    {form.companyLogoName && (
                      <p className="text-xs text-muted-foreground">
                        {form.companyLogoName}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Primary Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Name *</Label>
                      <Input
                        value={form.primaryContactName}
                        onChange={(e) =>
                          updateForm({ primaryContactName: e.target.value })
                        }
                        placeholder="Full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Employee ID</Label>
                      <Input
                        value={form.employeeId}
                        onChange={(e) =>
                          updateForm({ employeeId: e.target.value })
                        }
                        placeholder="Optional"
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
                      <Label>Contact Number *</Label>
                      <Input
                        value={form.contactNumber}
                        onChange={(e) =>
                          updateForm({ contactNumber: e.target.value })
                        }
                        placeholder="+91 XXXXX XXXXX"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Job Title</Label>
                      <Input
                        value={form.jobTitle}
                        onChange={(e) =>
                          updateForm({ jobTitle: e.target.value })
                        }
                        placeholder="e.g. Manager"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Business Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Business Type</Label>
                      <Select
                        value={form.businessType}
                        onValueChange={(v: any) =>
                          updateForm({ businessType: v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Registered">Registered</SelectItem>
                          <SelectItem value="Unregistered">
                            Unregistered
                          </SelectItem>
                          <SelectItem value="Consumer">Consumer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {isRegistered && (
                      <div className="space-y-2">
                        <Label>GST Number *</Label>
                        <Input
                          value={form.gst}
                          onChange={(e) => updateForm({ gst: e.target.value })}
                          placeholder="27AABCT1234A1Z5"
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label>PAN Number</Label>
                      <Input
                        value={form.pan}
                        onChange={(e) => updateForm({ pan: e.target.value })}
                        placeholder="AAAAA0000A"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Industry Type</Label>
                      <Input
                        value={form.industryType}
                        onChange={(e) =>
                          updateForm({ industryType: e.target.value })
                        }
                        placeholder="e.g. IT, Manufacturing"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Location Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Input
                      value={form.address}
                      onChange={(e) => updateForm({ address: e.target.value })}
                      placeholder="Street address"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>City</Label>
                      <Input
                        value={form.city}
                        onChange={(e) => updateForm({ city: e.target.value })}
                        placeholder="City"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>State</Label>
                      <Select
                        value={form.state}
                        onValueChange={(v) => updateForm({ state: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
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
                      <Label>Country</Label>
                      <Input
                        value={form.country}
                        onChange={(e) =>
                          updateForm({ country: e.target.value })
                        }
                        placeholder="Country"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Zip Code</Label>
                      <Input
                        value={form.zipCode}
                        onChange={(e) =>
                          updateForm({ zipCode: e.target.value })
                        }
                        placeholder="Postal code"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Currency</Label>
                      <Input
                        value={form.currency}
                        onChange={(e) =>
                          updateForm({ currency: e.target.value })
                        }
                        placeholder="INR"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Time Zone</Label>
                      <Input
                        value={form.timeZone}
                        onChange={(e) =>
                          updateForm({ timeZone: e.target.value })
                        }
                        placeholder="IST"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 1: Contract Terms */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-1">Contract Terms</h2>
                <p className="text-sm text-muted-foreground">
                  Define contract duration and payment terms
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Contract Duration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Contract Start Date *</Label>
                      <Input
                        type="date"
                        value={form.contractStart}
                        onChange={(e) =>
                          updateForm({ contractStart: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Contract End Date *</Label>
                      <Input
                        type="date"
                        value={form.contractEnd}
                        onChange={(e) =>
                          updateForm({ contractEnd: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">
                    Contract & Payment Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Contract Type *</Label>
                      <Select
                        value={form.contractType}
                        onValueChange={(v) => updateForm({ contractType: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Fixed">Fixed</SelectItem>
                          <SelectItem value="Prepaid">Prepaid</SelectItem>
                          <SelectItem value="Postpaid">Postpaid</SelectItem>
                          <SelectItem value="Subscription">
                            Subscription
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Client Service Tier *</Label>
                      <Select
                        value={form.pricingTier}
                        onValueChange={(v) =>
                          updateForm({
                            pricingTier: v as "high" | "mid" | "low" | "custom",
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select tier" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">High Level</SelectItem>
                          <SelectItem value="mid">Mid Level</SelectItem>
                          <SelectItem value="low">Low Level</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Payment Terms *</Label>
                      <Select
                        value={form.paymentTerms}
                        onValueChange={(v) => updateForm({ paymentTerms: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select terms" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NET 15">NET 15</SelectItem>
                          <SelectItem value="NET 30">NET 30</SelectItem>
                          <SelectItem value="NET 45">NET 45</SelectItem>
                          <SelectItem value="NET 60">NET 60</SelectItem>
                          <SelectItem value="Due on Receipt">
                            Due on Receipt
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Contract Documents (JPG, PDF, DOC)</Label>
                    <Input
                      type="file"
                      multiple
                      accept=".jpg,.jpeg,.pdf,.doc,.docx"
                      onChange={(e) => handleFile(e, "contract")}
                    />
                    {form.contractDocNames.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {form.contractDocNames.map((name, idx) => (
                          <p
                            key={idx}
                            className="text-xs text-muted-foreground"
                          >
                            ✓ {name}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 2: Additional Information */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-1">
                  Additional Information
                </h2>
                <p className="text-sm text-muted-foreground">
                  Provide any additional notes or context about the client
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Notes & Comments</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Label>Additional Information (max 500 words)</Label>
                  <Textarea
                    rows={10}
                    value={form.notes}
                    onChange={(e) => updateForm({ notes: e.target.value })}
                    placeholder="Special requirements, billing preferences, operational notes..."
                  />
                  <p className="text-xs text-muted-foreground">
                    {notesWordCount}/500 words
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() =>
                step > 0 ? setStep(step - 1) : navigate("/clients")
              }
            >
              <ArrowLeft className="h-4 w-4 mr-2" />{" "}
              {step === 0 ? "Cancel" : "Back"}
            </Button>
            <div className="flex-1" />
            {step < STEPS.length - 1 && (
              <Button
                onClick={() => canProceed() && setStep(step + 1)}
                disabled={!canProceed()}
              >
                Next <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
            {step === STEPS.length - 1 && (
              <Button
                onClick={save}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Check className="h-4 w-4 mr-2" /> Register Client
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
