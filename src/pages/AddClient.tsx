import { useMemo, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import { Card, CardContent } from "@/components/ui/card";
import { useData } from "@/contexts/DataContext";
import { toast } from "@/hooks/use-toast";

export default function AddClient() {
  const { addClient } = useData();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("general");

  const [form, setForm] = useState({
    companyName: "",
    clientCode: "",
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
    currency: "",
    zipCode: "",
    timeZone: "",
    contractStart: "",
    contractEnd: "",
    contractType: "",
    paymentTerms: "",
    contractDocNames: [] as string[],
    notes: "",
  });

  const isRegistered = form.businessType === "Registered";
  const notesWordCount = useMemo(
    () => form.notes.trim().split(/\s+/).filter(Boolean).length,
    [form.notes],
  );

  const handleFile = (
    evt: ChangeEvent<HTMLInputElement>,
    mode: "logo" | "contract",
  ) => {
    const files = evt.target.files;
    if (!files || files.length === 0) return;
    if (mode === "logo") {
      setForm((prev) => ({ ...prev, companyLogoName: files[0].name }));
      return;
    }
    const names = Array.from(files).map((f) => f.name);
    setForm((prev) => ({ ...prev, contractDocNames: names }));
  };

  const save = () => {
    if (!form.companyName || !form.clientCode || !form.email) {
      toast({ title: "Company name, client code and email are required" });
      return;
    }
    if (!form.primaryContactName || !form.contactNumber) {
      toast({ title: "Primary contact name and number are required" });
      return;
    }
    if (isRegistered && !form.gst.trim()) {
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
      clientCode: form.clientCode,
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

    toast({ title: "Client saved" });
    setForm({
      companyName: "",
      clientCode: "",
      companyLogoName: "",
      primaryContactName: "",
      employeeId: "",
      contactNumber: "",
      email: "",
      jobTitle: "",
      gst: "",
      pan: "",
      industryType: "",
      businessType: "Registered",
      address: "",
      city: "",
      state: "",
      country: "",
      currency: "",
      zipCode: "",
      timeZone: "",
      contractStart: "",
      contractEnd: "",
      contractType: "",
      paymentTerms: "",
      contractDocNames: [],
      notes: "",
    });
    navigate("/clients");
  };

  return (
    <div>
      <Header title="Add Client" />

      <div className="p-6 space-y-4 max-w-5xl">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="general">General Information</TabsTrigger>
            <TabsTrigger value="contract">Contract Terms</TabsTrigger>
            <TabsTrigger value="additional">Additional Information</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label>Company Name</Label>
                    <Input
                      value={form.companyName}
                      onChange={(e) =>
                        setForm({ ...form, companyName: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Client Code</Label>
                    <Input
                      value={form.clientCode}
                      onChange={(e) =>
                        setForm({ ...form, clientCode: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Company Logo</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFile(e, "logo")}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Primary Contact</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      placeholder="Name"
                      value={form.primaryContactName}
                      onChange={(e) =>
                        setForm({ ...form, primaryContactName: e.target.value })
                      }
                    />
                    <Input
                      placeholder="Employee ID"
                      value={form.employeeId}
                      onChange={(e) =>
                        setForm({ ...form, employeeId: e.target.value })
                      }
                    />
                    <Input
                      placeholder="Contact Number"
                      value={form.contactNumber}
                      onChange={(e) =>
                        setForm({ ...form, contactNumber: e.target.value })
                      }
                    />
                    <Input
                      placeholder="Email"
                      type="email"
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                    />
                    <Input
                      placeholder="Job Title"
                      value={form.jobTitle}
                      onChange={(e) =>
                        setForm({ ...form, jobTitle: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Business Details</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Select
                      value={form.businessType}
                      onValueChange={(
                        value: "Registered" | "Unregistered" | "Consumer",
                      ) => setForm({ ...form, businessType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Registered">Registered</SelectItem>
                        <SelectItem value="Unregistered">
                          Unregistered
                        </SelectItem>
                        <SelectItem value="Consumer">Consumer</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="PAN No"
                      value={form.pan}
                      onChange={(e) =>
                        setForm({ ...form, pan: e.target.value })
                      }
                    />
                    <Input
                      placeholder="Industry Type"
                      value={form.industryType}
                      onChange={(e) =>
                        setForm({ ...form, industryType: e.target.value })
                      }
                    />
                    {isRegistered && (
                      <Input
                        placeholder="GST No"
                        value={form.gst}
                        onChange={(e) =>
                          setForm({ ...form, gst: e.target.value })
                        }
                      />
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Location Details</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      placeholder="Address"
                      value={form.address}
                      onChange={(e) =>
                        setForm({ ...form, address: e.target.value })
                      }
                    />
                    <Input
                      placeholder="City"
                      value={form.city}
                      onChange={(e) =>
                        setForm({ ...form, city: e.target.value })
                      }
                    />
                    <Input
                      placeholder="State"
                      value={form.state}
                      onChange={(e) =>
                        setForm({ ...form, state: e.target.value })
                      }
                    />
                    <Input
                      placeholder="Country"
                      value={form.country}
                      onChange={(e) =>
                        setForm({ ...form, country: e.target.value })
                      }
                    />
                    <Input
                      placeholder="Currency"
                      value={form.currency}
                      onChange={(e) =>
                        setForm({ ...form, currency: e.target.value })
                      }
                    />
                    <Input
                      placeholder="Zip Code"
                      value={form.zipCode}
                      onChange={(e) =>
                        setForm({ ...form, zipCode: e.target.value })
                      }
                    />
                    <Input
                      placeholder="Time Zone"
                      value={form.timeZone}
                      onChange={(e) =>
                        setForm({ ...form, timeZone: e.target.value })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contract" className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Contract Start Date</Label>
                    <Input
                      type="date"
                      value={form.contractStart}
                      onChange={(e) =>
                        setForm({ ...form, contractStart: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Contract End Date</Label>
                    <Input
                      type="date"
                      value={form.contractEnd}
                      onChange={(e) =>
                        setForm({ ...form, contractEnd: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Contract Type</Label>
                    <Select
                      value={form.contractType}
                      onValueChange={(value) =>
                        setForm({ ...form, contractType: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select contract type" />
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
                  <div className="space-y-1">
                    <Label>Payment Terms</Label>
                    <Select
                      value={form.paymentTerms}
                      onValueChange={(value) =>
                        setForm({ ...form, paymentTerms: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment terms" />
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

                <div className="space-y-1">
                  <Label>Contract Documents (JPG, PDF, DOC)</Label>
                  <Input
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.pdf,.doc,.docx"
                    onChange={(e) => handleFile(e, "contract")}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="additional" className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-3">
                <Label>Additional Information (max 500 words)</Label>
                <Textarea
                  rows={10}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  {notesWordCount}/500 words
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/clients")}>
            Cancel
          </Button>
          <Button onClick={save}>Save Client</Button>
        </div>
      </div>
    </div>
  );
}
