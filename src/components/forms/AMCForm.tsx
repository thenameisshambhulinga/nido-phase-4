import React, { useMemo, useState } from "react";
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

interface AMCFormProps {
  onSubmit?: (payload: any) => void;
}

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
    assetDetails: "",
    servicesRequired: [] as string[],
    // Section 5 - Common AMC Scope (mandatory)
    scopeNotes: "",
    // Section 6 - AMC Duration (mandatory)
    startDate: "",
    endDate: "",
    // Section 10 - Client Authorization (mandatory)
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

  const validate = () => {
    // Required sections: 1,2,3,5,6,10
    if (!state.companyId) return "Please select Company Name";
    if (!state.registeredAddress) return "Registered address is required";
    if (!state.gstNumber) return "GST number is required";
    if (!state.contactPerson) return "Contact person name is required";
    if (!state.mobile) return "Mobile number is required";
    if (!state.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(state.email))
      return "Valid email is required";

    if (!state.amcType) return "Select AMC type";

    if (!state.amcCategory) return "Select AMC category";

    if (!state.scopeNotes) return "Provide AMC scope notes";

    if (!state.startDate || !state.endDate)
      return "Start and end dates are required";

    if (!state.authorizedName) return "Authorized signatory name is required";
    if (!state.authorizedDesignation)
      return "Authorized designation is required";
    if (!state.authorizationDate) return "Authorization date is required";

    return null;
  };

  const submit = () => {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    const payload = { ...state };
    if (onSubmit) onSubmit(payload);
    else {
      // fallback: console.log and toast
      console.log("AMC Form submit", payload);
      toast.success("AMC form submitted (draft)");
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
          <CardTitle>01 Client Information *</CardTitle>
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
                    mobile: e.target.value.replace(/\D/g, "").slice(0, 15),
                  }))
                }
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
          <CardTitle>02 AMC Type *</CardTitle>
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

      {/* Section 3 - AMC Category */}
      <Card>
        <CardHeader>
          <CardTitle>03 AMC Category *</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 flex-wrap">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="amcCat"
                checked={state.amcCategory === "it"}
                onChange={() => setState((s) => ({ ...s, amcCategory: "it" }))}
              />{" "}
              IT AMC
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="amcCat"
                checked={state.amcCategory === "facility"}
                onChange={() =>
                  setState((s) => ({ ...s, amcCategory: "facility" }))
                }
              />{" "}
              Facility AMC
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="amcCat"
                checked={state.amcCategory === "equipment"}
                onChange={() =>
                  setState((s) => ({ ...s, amcCategory: "equipment" }))
                }
              />{" "}
              Equipment AMC
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="amcCat"
                checked={state.amcCategory === "software"}
                onChange={() =>
                  setState((s) => ({ ...s, amcCategory: "software" }))
                }
              />{" "}
              Software AMC
            </label>
          </div>

          <div className="mt-4">
            <Label>Asset Details (optional)</Label>
            <Textarea
              value={state.assetDetails}
              onChange={(e) =>
                setState((s) => ({ ...s, assetDetails: e.target.value }))
              }
              rows={4}
            />
          </div>

          <div className="mt-4">
            <Label>Services Required (select all that apply)</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {[
                "Preventive Maintenance",
                "Breakdown Support",
                "Network Support",
                "Data Backup Support",
                "Security / Antivirus",
                "Helpdesk Support",
              ].map((s) => (
                <label key={s} className="flex items-center gap-2">
                  <Checkbox
                    checked={state.servicesRequired.includes(s)}
                    onCheckedChange={() => toggleService(s)}
                  />{" "}
                  {s}
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 5 - Common AMC Scope */}
      <Card>
        <CardHeader>
          <CardTitle>05 Common AMC Scope *</CardTitle>
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
          <CardTitle>06 AMC Duration *</CardTitle>
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
          <CardTitle>10 Client Authorization *</CardTitle>
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
        <Button onClick={submit} className="bg-primary text-white">
          Submit
        </Button>
      </div>
    </div>
  );
}
