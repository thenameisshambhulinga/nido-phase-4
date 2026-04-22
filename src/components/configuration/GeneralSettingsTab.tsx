import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { GeneralSettings } from "@/types";
import { useData } from "@/contexts/DataContext";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Upload, Save, Eye, ArrowLeft } from "lucide-react";

const hexToHsl = (hex: string): string | null => {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return null;
  const r = parseInt(normalized.slice(0, 2), 16) / 255;
  const g = parseInt(normalized.slice(2, 4), 16) / 255;
  const b = parseInt(normalized.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const l = (max + min) / 2;

  if (delta === 0) {
    return `0 0% ${Math.round(l * 100)}%`;
  }

  const s = delta / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (max === r) h = ((g - b) / delta) % 6;
  else if (max === g) h = (b - r) / delta + 2;
  else h = (r - g) / delta + 4;
  h = Math.round(h * 60);
  if (h < 0) h += 360;

  return `${h} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

export default function GeneralSettingsTab() {
  const navigate = useNavigate();
  const { organizations, generalSettings, updateGeneralSettings } = useData();
  const nidoOrg = organizations[0]; // Nido is always the first org
  const selectedOrgId = nidoOrg?.id || "";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [settingsTab, setSettingsTab] = useState("organization");
  const [viewProfileOpen, setViewProfileOpen] = useState(false);

  const settings: GeneralSettings = generalSettings[selectedOrgId] || {
    companyName: nidoOrg?.name || "Nido Tech Pvt. Ltd.",
    companyLogo: undefined,
    currency: "INR",
    dateFormat: "DD/MM/YYYY",
    timezone: "Asia/Kolkata",
    language: "English",
    fiscalYearStart: "April",
    taxId: "",
    gstNumber: nidoOrg?.gstNumber || "",
    panNumber: "",
    address: nidoOrg?.address || "",
    phone: nidoOrg?.phone || "",
    email: nidoOrg?.email || "",
    poPrefix: "PO",
    quotationPrefix: "Q",
    estimationPrefix: "EST",
    invoicePrefix: "INV",
    clientCodePrefix: "CL",
    vendorCodePrefix: "VND",
    productCodePrefix: "PRD",
    salesOrderPrefix: "SO",
    deliveryChallanPrefix: "DC",
    creditNotePrefix: "CN",
  };

  const handleChange = (field: string, value: string) => {
    updateGeneralSettings(selectedOrgId, { [field]: value });
  };

  const handlePrimaryColorChange = (value: string) => {
    updateGeneralSettings(selectedOrgId, { primaryColor: value });
    const hsl = hexToHsl(value);
    if (hsl) {
      document.documentElement.style.setProperty("--primary", hsl);
    }
  };

  useEffect(() => {
    if (!settings.primaryColor) return;
    const hsl = hexToHsl(settings.primaryColor);
    if (hsl) {
      document.documentElement.style.setProperty("--primary", hsl);
    }
  }, [settings.primaryColor]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image must be under 2MB",
        variant: "destructive",
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      updateGeneralSettings(selectedOrgId, {
        companyLogo: reader.result as string,
      });
      toast({ title: "Success", description: "Logo uploaded successfully" });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    toast({
      title: "Settings Saved",
      description: `General settings updated for Nido Tech`,
    });
  };

  return (
    <div>
      <Header title="Configuration" />
      <div className="p-6 space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1"
            onClick={() => navigate("/configuration")}
          >
            <ArrowLeft size={14} /> Back to Configuration
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              General Settings
            </h2>
            <p className="text-sm text-muted-foreground">
              Configure Nido Tech platform settings
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setViewProfileOpen(true)}
              className="gap-2"
            >
              <Eye size={14} /> View Company Profile
            </Button>
            <Button onClick={handleSave} className="gap-2">
              <Save size={14} /> Save Changes
            </Button>
          </div>
        </div>

        <Tabs value={settingsTab} onValueChange={setSettingsTab}>
          <TabsList className="w-full flex flex-wrap h-auto justify-start bg-muted p-1 gap-1">
            <TabsTrigger value="organization" className="text-sm">
              Organization
            </TabsTrigger>
            <TabsTrigger value="theme" className="text-sm">
              Theme & Appearance
            </TabsTrigger>
            <TabsTrigger value="localization" className="text-sm">
              Localization
            </TabsTrigger>
            <TabsTrigger value="procurement" className="text-sm">
              Procurement Prefixes
            </TabsTrigger>
            <TabsTrigger value="api" className="text-sm">
              API
            </TabsTrigger>
            <TabsTrigger value="security" className="text-sm">
              Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="organization" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">Company Name</Label>
                <Input
                  value={settings.companyName}
                  onChange={(e) => handleChange("companyName", e.target.value)}
                />
              </div>
              <div>
                <Label className="text-sm">GST Number</Label>
                <Input
                  value={settings.gstNumber || ""}
                  onChange={(e) => handleChange("gstNumber", e.target.value)}
                  placeholder="e.g., 27AACCN1234A11ZD"
                />
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">
                  Nido Tech Company Logo
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row sm:items-center gap-4">
                {settings.companyLogo ? (
                  <img
                    src={settings.companyLogo}
                    alt="Logo"
                    className="h-20 w-32 object-contain rounded border border-border"
                  />
                ) : (
                  <div className="h-20 w-32 rounded border border-dashed border-border flex items-center justify-center bg-muted">
                    <div className="text-center">
                      <p className="text-sm font-semibold">Nido Tech</p>
                      <p className="text-[10px] text-muted-foreground tracking-widest">
                        CORPESSENTIALS
                      </p>
                    </div>
                  </div>
                )}
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-1.5"
                  >
                    <Upload size={14} /> Upload Nido Logo
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG up to 2MB
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">PAN Number</Label>
                <Input
                  value={settings.panNumber || ""}
                  onChange={(e) => handleChange("panNumber", e.target.value)}
                />
              </div>
              <div>
                <Label className="text-sm">Registered Address</Label>
                <Input
                  value={settings.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">Phone</Label>
                <Input
                  value={settings.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                />
              </div>
              <div>
                <Label className="text-sm">Email</Label>
                <Input
                  value={settings.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label className="text-sm">Tax ID</Label>
              <Input
                value={settings.taxId}
                onChange={(e) => handleChange("taxId", e.target.value)}
              />
            </div>
          </TabsContent>

          <TabsContent value="theme" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Theme & Appearance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Customize platform appearance settings.
                </p>
                <div>
                  <Label className="text-xs">Primary Color</Label>
                  <Input
                    value={settings.primaryColor || "#1e3a5f"}
                    onChange={(e) => handlePrimaryColorChange(e.target.value)}
                    type="color"
                    className="w-20 h-10"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="localization" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Localization Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">Currency</Label>
                    <Select
                      value={settings.currency}
                      onValueChange={(v) => handleChange("currency", v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INR">INR (₹)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Date Format</Label>
                    <Select
                      value={settings.dateFormat}
                      onValueChange={(v) => handleChange("dateFormat", v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Timezone</Label>
                    <Select
                      value={settings.timezone}
                      onValueChange={(v) => handleChange("timezone", v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Asia/Kolkata">
                          Asia/Kolkata (IST)
                        </SelectItem>
                        <SelectItem value="America/New_York">
                          America/New_York (EST)
                        </SelectItem>
                        <SelectItem value="Europe/London">
                          Europe/London (GMT)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Language</Label>
                    <Select
                      value={settings.language}
                      onValueChange={(v) => handleChange("language", v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="English">English</SelectItem>
                        <SelectItem value="Hindi">Hindi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Fiscal Year Start</Label>
                  <Select
                    value={settings.fiscalYearStart}
                    onValueChange={(v) => handleChange("fiscalYearStart", v)}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="January">January</SelectItem>
                      <SelectItem value="April">April</SelectItem>
                      <SelectItem value="July">July</SelectItem>
                      <SelectItem value="October">October</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="procurement" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Procurement Prefixes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-xs">Default PO Prefix</Label>
                    <Input
                      value={settings.poPrefix || ""}
                      onChange={(e) => handleChange("poPrefix", e.target.value)}
                      placeholder="PO"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Quotation Prefix</Label>
                    <Input
                      value={settings.quotationPrefix || ""}
                      onChange={(e) =>
                        handleChange("quotationPrefix", e.target.value)
                      }
                      placeholder="Q"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Estimation Prefix</Label>
                    <Input
                      value={settings.estimationPrefix || ""}
                      onChange={(e) =>
                        handleChange("estimationPrefix", e.target.value)
                      }
                      placeholder="EST"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Invoice Prefix</Label>
                    <Input
                      value={settings.invoicePrefix || ""}
                      onChange={(e) =>
                        handleChange("invoicePrefix", e.target.value)
                      }
                      placeholder="INV"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Client Code Prefix</Label>
                    <Input
                      value={settings.clientCodePrefix || ""}
                      onChange={(e) =>
                        handleChange("clientCodePrefix", e.target.value)
                      }
                      placeholder="CL"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Vendor Code Prefix</Label>
                    <Input
                      value={settings.vendorCodePrefix || ""}
                      onChange={(e) =>
                        handleChange("vendorCodePrefix", e.target.value)
                      }
                      placeholder="VND"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Product Code Prefix</Label>
                    <Input
                      value={settings.productCodePrefix || ""}
                      onChange={(e) =>
                        handleChange("productCodePrefix", e.target.value)
                      }
                      placeholder="PRD"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Sales Order Prefix</Label>
                    <Input
                      value={settings.salesOrderPrefix || ""}
                      onChange={(e) =>
                        handleChange("salesOrderPrefix", e.target.value)
                      }
                      placeholder="SO"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Delivery Challan Prefix</Label>
                    <Input
                      value={settings.deliveryChallanPrefix || ""}
                      onChange={(e) =>
                        handleChange("deliveryChallanPrefix", e.target.value)
                      }
                      placeholder="DC"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Credit Note Prefix</Label>
                    <Input
                      value={settings.creditNotePrefix || ""}
                      onChange={(e) =>
                        handleChange("creditNotePrefix", e.target.value)
                      }
                      placeholder="CN"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Default Order Code Prefix</Label>
                    <Input
                      value={settings.orderCodePrefix || ""}
                      onChange={(e) =>
                        handleChange("orderCodePrefix", e.target.value)
                      }
                      placeholder="ORD"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Service Code Prefix</Label>
                    <Input
                      value={settings.serviceCodePrefix || ""}
                      onChange={(e) =>
                        handleChange("serviceCodePrefix", e.target.value)
                      }
                      placeholder="SVC"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Support Ticket Prefix</Label>
                    <Input
                      value={settings.supportTicketPrefix || ""}
                      onChange={(e) =>
                        handleChange("supportTicketPrefix", e.target.value)
                      }
                      placeholder="SUP"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Bill Prefix</Label>
                    <Input
                      value={settings.billPrefix || ""}
                      onChange={(e) =>
                        handleChange("billPrefix", e.target.value)
                      }
                      placeholder="BILL"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Recurring PO Prefix</Label>
                    <Input
                      value={settings.recurringPoPrefix || ""}
                      onChange={(e) =>
                        handleChange("recurringPoPrefix", e.target.value)
                      }
                      placeholder="RPO"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Recurring Invoice Prefix</Label>
                    <Input
                      value={settings.recurringInvoicePrefix || ""}
                      onChange={(e) =>
                        handleChange("recurringInvoicePrefix", e.target.value)
                      }
                      placeholder="RINV"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">User Code Prefix</Label>
                    <Input
                      value={settings.userCodePrefix || ""}
                      onChange={(e) =>
                        handleChange("userCodePrefix", e.target.value)
                      }
                      placeholder="USR"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Vendor User Prefix</Label>
                    <Input
                      value={settings.vendorUserPrefix || ""}
                      onChange={(e) =>
                        handleChange("vendorUserPrefix", e.target.value)
                      }
                      placeholder="VUSR"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Recurring Bill Prefix</Label>
                    <Input
                      value={settings.recurringBillPrefix || ""}
                      onChange={(e) =>
                        handleChange("recurringBillPrefix", e.target.value)
                      }
                      placeholder="RBILL"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Vendor Credit Prefix</Label>
                    <Input
                      value={settings.vendorCreditPrefix || ""}
                      onChange={(e) =>
                        handleChange("vendorCreditPrefix", e.target.value)
                      }
                      placeholder="VC"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">API Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Configure API credentials and callback endpoints for
                  integrations.
                </p>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-xs">API Base URL</Label>
                    <Input
                      value={settings.apiBaseUrl || ""}
                      onChange={(e) =>
                        handleChange("apiBaseUrl", e.target.value)
                      }
                      placeholder="https://api.nido-tech.com/v1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Client ID</Label>
                    <Input
                      value={settings.apiClientId || ""}
                      onChange={(e) =>
                        handleChange("apiClientId", e.target.value)
                      }
                      placeholder="client_live_xxxxx"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">API Key Label</Label>
                    <Input
                      value={settings.apiKeyLabel || ""}
                      onChange={(e) =>
                        handleChange("apiKeyLabel", e.target.value)
                      }
                      placeholder="Production Key"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Webhook URL</Label>
                    <Input
                      value={settings.webhookUrl || ""}
                      onChange={(e) =>
                        handleChange("webhookUrl", e.target.value)
                      }
                      placeholder="https://app.nido-tech.com/webhooks/purchase"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() =>
                      toast({
                        title: "API Test Ping",
                        description: "Connection test request queued",
                      })
                    }
                  >
                    Test Connection
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      toast({
                        title: "API key regenerated",
                        description: "Remember to update connected services",
                      })
                    }
                  >
                    Regenerate Key
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Security Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <input type="checkbox" defaultChecked id="twoFA" />
                  <Label htmlFor="twoFA" className="text-xs">
                    Require Two-Factor Authentication
                  </Label>
                </div>
                <div>
                  <Label className="text-xs">Session Timeout (minutes)</Label>
                  <Input type="number" defaultValue={30} className="w-32" />
                </div>
                <div>
                  <Label className="text-xs">Password Policy</Label>
                  <Select defaultValue="strong">
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic (8+ chars)</SelectItem>
                      <SelectItem value="strong">
                        Strong (8+ chars, mixed case, numbers)
                      </SelectItem>
                      <SelectItem value="strict">
                        Strict (12+ chars, symbols required)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* View Company Profile Dialog */}
        <Dialog open={viewProfileOpen} onOpenChange={setViewProfileOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Company Profile — Nido Tech</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {settings.companyLogo ? (
                  <img
                    src={settings.companyLogo}
                    alt="Logo"
                    className="h-14 w-14 object-contain rounded border border-border"
                  />
                ) : (
                  <div className="h-14 w-14 rounded bg-muted flex items-center justify-center text-xs font-bold">
                    NT
                  </div>
                )}
                <div>
                  <p className="font-semibold text-foreground">
                    {settings.companyName || "Nido Tech Pvt. Ltd."}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {settings.email}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground text-xs">
                    GST Number
                  </span>
                  <p>{settings.gstNumber || "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">
                    PAN Number
                  </span>
                  <p>{settings.panNumber || "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Phone</span>
                  <p>{settings.phone || "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Address</span>
                  <p>{settings.address || "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">
                    Currency
                  </span>
                  <p>{settings.currency}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">
                    Timezone
                  </span>
                  <p>{settings.timezone}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">
                    Date Format
                  </span>
                  <p>{settings.dateFormat}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">
                    Fiscal Year
                  </span>
                  <p>{settings.fiscalYearStart}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Tax ID</span>
                  <p>{settings.taxId || "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">
                    Language
                  </span>
                  <p>{settings.language}</p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
