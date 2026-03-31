import React, { useState, useRef } from "react";
import type { GeneralSettings } from "@/types";
import { useData } from "@/contexts/DataContext";
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
import { Upload, Save, Eye } from "lucide-react";

export default function GeneralSettingsTab() {
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
  };

  const handleChange = (field: string, value: string) => {
    updateGeneralSettings(selectedOrgId, { [field]: value });
  };

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
    <div className="space-y-6">
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
            Procurement Defaults
          </TabsTrigger>
          <TabsTrigger value="notifications" className="text-sm">
            Notification & Alerts
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
              <CardTitle className="text-sm">Nido Tech Company Logo</CardTitle>
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
                  defaultValue="#1e3a5f"
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
              <CardTitle className="text-sm">Procurement Defaults</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Default Approval Workflow</Label>
                  <Select defaultValue="standard">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">
                        Standard Approval
                      </SelectItem>
                      <SelectItem value="multi">
                        Multi-level Approval
                      </SelectItem>
                      <SelectItem value="auto">Auto Approve</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Default PO Prefix</Label>
                  <Input defaultValue="NT-PO" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Notification & Alerts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Configure email and in-app notification preferences.
              </p>
              <div className="flex items-center gap-3">
                <input type="checkbox" defaultChecked id="emailNotif" />
                <Label htmlFor="emailNotif" className="text-xs">
                  Enable email notifications
                </Label>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" defaultChecked id="inAppNotif" />
                <Label htmlFor="inAppNotif" className="text-xs">
                  Enable in-app alerts
                </Label>
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
                <span className="text-muted-foreground text-xs">Currency</span>
                <p>{settings.currency}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">Timezone</span>
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
                <span className="text-muted-foreground text-xs">Language</span>
                <p>{settings.language}</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
