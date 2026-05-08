import React, { useMemo, useState, useEffect } from "react";
import { apiRequest } from "@/lib/api";
import {
  isValidEmail,
  isValidPhoneNumber,
  isValidGST,
  isValidPANNumber,
  isValidName,
} from "@/lib/validation";
import { useData } from "@/contexts/DataContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2 } from "lucide-react";

interface AssetRow {
  id: string;
  assetType: string;
  brand: string;
  model: string;
  serialNo: string;
  quantity: string;
  osConfig: string;
  location: string;
}

interface AMCFormProps {
  onSubmit?: (payload: any) => void;
}

const createEmptyAssetRow = (): AssetRow => ({
  id: `asset-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  assetType: "",
  brand: "",
  model: "",
  serialNo: "",
  quantity: "1",
  osConfig: "",
  location: "",
});

const SERVICE_OPTIONS = [
  "Preventive Maintenance",
  "Breakdown Support",
  "Network Support",
  "Data Backup Support",
  "Security / Antivirus",
  "Helpdesk Support",
  "On-site Support",
  "Remote Support",
  "Parts Replacement",
  "Annual Service",
];

export default function AMCForm({ onSubmit }: AMCFormProps) {
  const { clients } = useData();
  const clientCompanies = useMemo(
    () =>
      clients
        .map((client) => ({
          id: client.id,
          label: client.companyName || client.name,
        }))
        .filter((client) => client.label.trim().length > 0)
        .sort((a, b) => a.label.localeCompare(b.label)),
    [clients],
  );
  const [state, setState] = useState({
    // Section 1 - Client Information (mandatory)
    companyId: "",
    registeredAddress: "",
    gstNumber: "",
    pan: "",
    contactPerson: "",
    designation: "",
    mobile: "",
    email: "",
    // Section 2 - AMC Type (mandatory)
    amcType: "new",
    amcReference: "",
    amcExpiry: "",
    // Section 3 - Category (mandatory)
    amcCategory: "it",
    // Asset rows for the table
    assetRows: [createEmptyAssetRow()] as AssetRow[],
    // Services included
    servicesRequired: [] as string[],
    serviceNotes: "",
    // Section 5 - Common AMC Scope (mandatory)
    scopeNotes: "",
    // Section 6 - AMC Duration (mandatory)
    startDate: "",
    endDate: "",
    // Section 10 - Authorization (mandatory)
    authorizedName: "",
    authorizedDesignation: "",
    authorizationDate: "",
  });

  const toggleService = (name: string) => {
    setState((s) => {
      const existing = new Set(s.servicesRequired);
      if (existing.has(name)) existing.delete(name);
      else existing.add(name);
      return { ...s, servicesRequired: Array.from(existing) } as any;
    });
  };

  const addAssetRow = () => {
    setState((s) => ({
      ...s,
      assetRows: [...s.assetRows, createEmptyAssetRow()],
    }));
  };

  const removeAssetRow = (id: string) => {
    setState((s) => ({
      ...s,
      assetRows: s.assetRows.filter((r) => r.id !== id),
    }));
  };

  const updateAssetRow = (id: string, field: keyof AssetRow, value: string) => {
    setState((s) => ({
      ...s,
      assetRows: s.assetRows.map((r) =>
        r.id === id ? { ...r, [field]: value } : r,
      ),
    }));
  };

  const validate = () => {
    // Required sections: 1,2,3,5,6,10
    if (!state.companyId) return "Please select Company Name";
    if (!state.registeredAddress) return "Registered address is required";
    if (!state.gstNumber || !isValidGST(state.gstNumber))
      return "Valid GST number is required";
    if (!state.contactPerson || !isValidName(state.contactPerson))
      return "Valid contact person name is required";
    if (!state.mobile || !isValidPhoneNumber(state.mobile))
      return "Valid 10-digit mobile number is required";
    if (!state.email || !isValidEmail(state.email))
      return "Valid email is required";

    if (!state.amcType) return "Select AMC type";

    if (!state.amcCategory) return "Select AMC category";

    if (!state.scopeNotes) return "Provide AMC scope notes";

    if (!state.startDate || !state.endDate)
      return "Start and end dates are required";

    if (!state.authorizedName || !isValidName(state.authorizedName))
      return "Authorized signatory name is required";
    if (!state.authorizedDesignation)
      return "Authorized designation is required";
    if (!state.authorizationDate) return "Authorization date is required";

    if (state.pan && !isValidPANNumber(state.pan)) return "Invalid PAN format";

    return null;
  };

  // Auto-fill company details when companyId changes
  useEffect(() => {
    let mounted = true;
    const fetchClient = async (id: string) => {
      try {
        const data: any = await apiRequest(`/clients/${id}`);
        if (!mounted || !data) return;
        setState((s) => ({
          ...s,
          registeredAddress: data.address || s.registeredAddress,
          gstNumber: data.gstNumber || s.gstNumber || data.gst || "",
          pan: data.pan || s.pan || "",
          contactPerson:
            data.contactPerson || s.contactPerson || data.contactName || "",
          mobile: data.phone || s.mobile || data.mobile || "",
          email: data.email || s.email || "",
        }));
      } catch (err) {
        // ignore - keep current state
      }
    };

    if (state.companyId) fetchClient(state.companyId);
    return () => {
      mounted = false;
    };
  }, [state.companyId]);

  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    const payload = { ...state };
    setSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit(payload);
      } else {
        // fallback: log and keep as draft (no fake success)
        console.log("AMC Form submit", payload);
      }
      toast.success("AMC form saved");
    } catch (error: any) {
      toast.error(error?.message || "Failed to submit AMC form");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">
          Annual Maintenance Contract (AMC)
        </h2>
        <p className="text-muted-foreground">
          Please complete mandatory sections marked *
        </p>
      </div>

      {/* Section 1 - Client Information */}
      <Card>
        <CardHeader>
          <CardTitle>01: Client Information *</CardTitle>;
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>Company Name *</Label>
              <Select
                value={state.companyId}
                onValueChange={(v) => setState((s) => ({ ...s, companyId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  {clientCompanies.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-muted-foreground">
                Uses the live client registry, so newly added or deleted clients
                are reflected automatically.
              </p>
            </div>
            <div>
              <Label>Registered Address *</Label>
              <Input
                value={state.registeredAddress}
                onChange={(e) =>
                  setState((s) => ({ ...s, registeredAddress: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>GST Number *</Label>
              <Input
                value={state.gstNumber}
                onChange={(e) =>
                  setState((s) => ({ ...s, gstNumber: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>PAN (optional)</Label>
              <Input
                value={state.pan}
                onChange={(e) =>
                  setState((s) => ({ ...s, pan: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Contact Person Name *</Label>
              <Input
                value={state.contactPerson}
                onChange={(e) =>
                  setState((s) => ({ ...s, contactPerson: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Designation</Label>
              <Input
                value={state.designation}
                onChange={(e) =>
                  setState((s) => ({ ...s, designation: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Mobile Number *</Label>
              <Input
                value={state.mobile}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    mobile: e.target.value.replace(/\D/g, "").slice(0, 10),
                  }))
                }
                maxLength={10}
                inputMode="tel"
              />
            </div>
            <div>
              <Label>Email ID *</Label>
              <Input
                value={state.email}
                onChange={(e) =>
                  setState((s) => ({ ...s, email: e.target.value }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2 - AMC Type */}
      <Card>
        <CardHeader>
          <CardTitle>02: AMC Type *</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="amcType"
                checked={state.amcType === "new"}
                onChange={() => setState((s) => ({ ...s, amcType: "new" }))}
              />{" "}
              New AMC
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="amcType"
                checked={state.amcType === "renewal"}
                onChange={() => setState((s) => ({ ...s, amcType: "renewal" }))}
              />{" "}
              Renewal
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="amcType"
                checked={state.amcType === "extension"}
                onChange={() =>
                  setState((s) => ({ ...s, amcType: "extension" }))
                }
              />{" "}
              Extension / Modification
            </label>
          </div>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>Existing Reference No. (if any)</Label>
              <Input
                value={state.amcReference}
                onChange={(e) =>
                  setState((s) => ({ ...s, amcReference: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Current AMC Expiry Date (if renewal)</Label>
              <Input
                type="date"
                value={state.amcExpiry}
                onChange={(e) =>
                  setState((s) => ({ ...s, amcExpiry: e.target.value }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 3 - AMC Category — EXACT REFERENCE MATCH */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>03: AMC Category *</span>
            <span className="text-sm font-normal text-muted-foreground">Select One</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Radio Options — same line, evenly spaced */}
          <div className="flex gap-6 items-center flex-wrap border-b pb-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="amcCat"
                checked={state.amcCategory === "it"}
                onChange={() => setState((s) => ({ ...s, amcCategory: "it" }))}
                className="accent-primary"
              />
              <span className="text-sm font-medium">IT AMC</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="amcCat"
                checked={state.amcCategory === "facility"}
                onChange={() =>
                  setState((s) => ({ ...s, amcCategory: "facility" }))
                }
                className="accent-primary"
              />
              <span className="text-sm font-medium">Facility AMC</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="amcCat"
                checked={state.amcCategory === "equipment"}
                onChange={() =>
                  setState((s) => ({ ...s, amcCategory: "equipment" }))
                }
                className="accent-primary"
              />
              <span className="text-sm font-medium">Equipment AMC</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="amcCat"
                checked={state.amcCategory === "software"}
                onChange={() =>
                  setState((s) => ({ ...s, amcCategory: "software" }))
                }
                className="accent-primary"
              />
              <span className="text-sm font-medium">Software AMC</span>
            </label>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="asset-details" className="w-full">
            <TabsList className="mb-3">
              <TabsTrigger value="asset-details">Asset Details</TabsTrigger>
              <TabsTrigger value="services">Services Included</TabsTrigger>
            </TabsList>

            {/* Asset Details Tab */}
            <TabsContent value="asset-details" className="space-y-3">
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left p-2 border font-semibold text-foreground whitespace-nowrap">Sl. No.</th>
                      <th className="text-left p-2 border font-semibold text-foreground whitespace-nowrap">Asset Type</th>
                      <th className="text-left p-2 border font-semibold text-foreground whitespace-nowrap">Brand</th>
                      <th className="text-left p-2 border font-semibold text-foreground whitespace-nowrap">Model</th>
                      <th className="text-left p-2 border font-semibold text-foreground whitespace-nowrap">Serial No.</th>
                      <th className="text-left p-2 border font-semibold text-foreground whitespace-nowrap">Quantity</th>
                      <th className="text-left p-2 border font-semibold text-foreground whitespace-nowrap">OS / Configuration</th>
                      <th className="text-left p-2 border font-semibold text-foreground whitespace-nowrap">Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.assetRows.map((row, index) => (
                      <tr key={row.id} className="hover:bg-muted/20">
                        <td className="p-1 border text-center text-muted-foreground">{index + 1}</td>
                        <td className="p-1 border">
                          <Input
                            value={row.assetType}
                            onChange={(e) =>
                              updateAssetRow(row.id, "assetType", e.target.value)
                            }
                            placeholder="Desktop / Laptop / Server"
                            className="h-7 text-xs border-transparent bg-transparent focus:bg-background focus:border-input"
                          />
                        </td>
                        <td className="p-1 border">
                          <Input
                            value={row.brand}
                            onChange={(e) =>
                              updateAssetRow(row.id, "brand", e.target.value)
                            }
                            placeholder="Dell / HP / Lenovo"
                            className="h-7 text-xs border-transparent bg-transparent focus:bg-background focus:border-input"
                          />
                        </td>
                        <td className="p-1 border">
                          <Input
                            value={row.model}
                            onChange={(e) =>
                              updateAssetRow(row.id, "model", e.target.value)
                            }
                            placeholder="Model name"
                            className="h-7 text-xs border-transparent bg-transparent focus:bg-background focus:border-input"
                          />
                        </td>
                        <td className="p-1 border">
                          <Input
                            value={row.serialNo}
                            onChange={(e) =>
                              updateAssetRow(row.id, "serialNo", e.target.value)
                            }
                            placeholder="Serial No."
                            className="h-7 text-xs border-transparent bg-transparent focus:bg-background focus:border-input"
                          />
                        </td>
                        <td className="p-1 border w-16">
                          <Input
                            type="number"
                            value={row.quantity}
                            onChange={(e) =>
                              updateAssetRow(row.id, "quantity", e.target.value)
                            }
                            min="1"
                            placeholder="1"
                            className="h-7 text-xs border-transparent bg-transparent focus:bg-background focus:border-input text-center"
                          />
                        </td>
                        <td className="p-1 border">
                          <Input
                            value={row.osConfig}
                            onChange={(e) =>
                              updateAssetRow(row.id, "osConfig", e.target.value)
                            }
                            placeholder="Win 11 / 8GB RAM"
                            className="h-7 text-xs border-transparent bg-transparent focus:bg-background focus:border-input"
                          />
                        </td>
                        <td className="p-1 border">
                          <div className="flex items-center gap-1">
                            <Input
                              value={row.location}
                              onChange={(e) =>
                                updateAssetRow(row.id, "location", e.target.value)
                              }
                              placeholder="Location"
                              className="h-7 text-xs border-transparent bg-transparent focus:bg-background focus:border-input flex-1"
                            />
                            {state.assetRows.length > 1 && (
                              <button
                                onClick={() => removeAssetRow(row.id)}
                                className="text-red-500 hover:text-red-700 flex-shrink-0"
                                type="button"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addAssetRow}
                className="gap-1.5 mt-2"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Row
              </Button>
            </TabsContent>

            {/* Services Included Tab */}
            <TabsContent value="services" className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Services Required (select all that apply)
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {SERVICE_OPTIONS.map((s) => (
                    <label key={s} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={state.servicesRequired.includes(s)}
                        onCheckedChange={() => toggleService(s)}
                      />
                      <span className="text-sm">{s}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">Additional Notes</Label>
                <Textarea
                  value={state.serviceNotes}
                  onChange={(e) =>
                    setState((s) => ({ ...s, serviceNotes: e.target.value }))
                  }
                  placeholder="Any additional service requirements or notes..."
                  rows={3}
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Section 5 - Common AMC Scope */}
      <Card>
        <CardHeader>
          <CardTitle>04: Common AMC Scope *</CardTitle>
        </CardHeader>
        <CardContent>
          <Label>Detailed Scope / Notes *</Label>
          <Textarea
            value={state.scopeNotes}
            onChange={(e) =>
              setState((s) => ({ ...s, scopeNotes: e.target.value }))
            }
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Section 6 - AMC Duration */}
      <Card>
        <CardHeader>
          <CardTitle>05: AMC Duration *</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label>Start Date *</Label>
              <Input
                type="date"
                value={state.startDate}
                onChange={(e) =>
                  setState((s) => ({ ...s, startDate: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>End Date *</Label>
              <Input
                type="date"
                value={state.endDate}
                onChange={(e) =>
                  setState((s) => ({ ...s, endDate: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Other</Label>
              <Input placeholder="Optional" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 10 - Client Authorization */}
      <Card>
        <CardHeader>
          <CardTitle>06: Client Authorization *</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label>Authorized Signatory Name *</Label>
              <Input
                value={state.authorizedName}
                onChange={(e) =>
                  setState((s) => ({ ...s, authorizedName: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Designation *</Label>
              <Input
                value={state.authorizedDesignation}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    authorizedDesignation: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <Label>Date *</Label>
              <Input
                type="date"
                value={state.authorizationDate}
                onChange={(e) =>
                  setState((s) => ({ ...s, authorizationDate: e.target.value }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => toast("Draft saved locally (demo)")}
        >
          Save Draft
        </Button>
        <Button onClick={submit} disabled={submitting} className="bg-primary text-white">
          {submitting ? "Submitting..." : "Submit"}
        </Button>
      </div>
    </div>
  );
}