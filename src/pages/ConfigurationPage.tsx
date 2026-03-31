import { useState } from "react";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { Building2, Globe, Upload, Eye, Palette, Edit, Users } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function ConfigurationPage() {
  const { isOwner } = useAuth();
  const { clients } = useData();
  const [activeTab, setActiveTab] = useState("organization");
  const [showCompanyPreview, setShowCompanyPreview] = useState(false);
  const [previewCompany, setPreviewCompany] = useState<string | null>(null);

  const [org, setOrg] = useState({
    companyName: "Nido Tech Pvt. Ltd.",
    gstNumber: "274ACCN1234A11ZD",
    panNumber: "AACCN1234A",
    cinNumber: "U12345MH2010PTC123456",
    registeredAddress: "123 Corporate Ave, Suite 500,\nChennai, Tamil Nadu, India – 600001",
    correspondenceAddress: "456 Office Park Road, Building 2, Chennai, Tamil Nadu, India – 600001",
    contactEmail: "info@nido-tech.com",
    contactEmail2: "info@nido-tech.com",
    websiteUrl: "www.nidotech.com",
    phone: "+91-44-1234-5678",
  });

  const [theme, setThemeState] = useState({
    primaryColor: "#1e3a5f",
    accentColor: "#10b981",
    sidebarBranding: true,
    dashboardTheme: "professional",
  });

  const [loc, setLoc] = useState({
    currency: "inr",
    timezone: "ist",
    dateFormat: "dmy",
    financialYear: "apr-mar",
    numberFormat: "indian",
  });

  const handleSave = () => toast({ title: "Settings Saved", description: "Configuration updated successfully." });

  const selectedPreviewClient = clients.find(c => c.id === previewCompany);

  return (
    <div>
      <Header title="General Settings" />
      <div className="p-6 space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-display font-bold">General Settings</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowCompanyPreview(true)}>
              <Eye className="h-4 w-4" /> View Company Profile
            </Button>
            {isOwner && <Button size="sm" onClick={handleSave}>Save Changes</Button>}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex-wrap">
            <TabsTrigger value="organization">Organization</TabsTrigger>
            <TabsTrigger value="theme">Theme & Appearance</TabsTrigger>
            <TabsTrigger value="localization">Localization</TabsTrigger>
            <TabsTrigger value="procurement">Procurement Defaults</TabsTrigger>
            <TabsTrigger value="notifications">Notification & Alerts</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="apis">APIs</TabsTrigger>
          </TabsList>

          {/* ─── Organization ─── */}
          <TabsContent value="organization">
            <Card>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2"><Label>Company Name</Label><Input value={org.companyName} onChange={e => setOrg(p => ({ ...p, companyName: e.target.value }))} disabled={!isOwner} /></div>
                  <div className="space-y-2"><Label>GST Number</Label><Input value={org.gstNumber} onChange={e => setOrg(p => ({ ...p, gstNumber: e.target.value }))} disabled={!isOwner} /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Nido Tech Company Logo</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center gap-3">
                      <div className="text-center">
                        <h3 className="text-lg font-display font-bold">Nido Tech</h3>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">CorpEssentials</p>
                      </div>
                      <Button variant="default" size="sm" className="gap-2" disabled={!isOwner}><Upload className="h-4 w-4" /> Upload Nido Logo</Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Client Company Logo</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center gap-3">
                      <Select onValueChange={v => setPreviewCompany(v)}>
                        <SelectTrigger className="w-full"><SelectValue placeholder="Select client company" /></SelectTrigger>
                        <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                      </Select>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-8 w-8 text-primary" />
                        <span className="text-sm font-medium">{selectedPreviewClient?.name || "Select a company"}</span>
                      </div>
                      <Button variant="outline" size="sm" className="gap-2" disabled={!isOwner || !previewCompany}><Upload className="h-4 w-4" /> Upload Client Logo</Button>
                      <p className="text-xs text-muted-foreground text-center">Upload a logo for the selected client — it will reflect on their branded platform view.</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2"><Label>PAN Number</Label><Input value={org.panNumber} onChange={e => setOrg(p => ({ ...p, panNumber: e.target.value }))} disabled={!isOwner} /></div>
                    <div className="space-y-2"><Label>CIN Number</Label><Input value={org.cinNumber} onChange={e => setOrg(p => ({ ...p, cinNumber: e.target.value }))} disabled={!isOwner} /></div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2"><Label>Registered Address</Label><Textarea value={org.registeredAddress} onChange={e => setOrg(p => ({ ...p, registeredAddress: e.target.value }))} rows={3} disabled={!isOwner} /></div>
                    <div className="space-y-2"><Label>Correspondence Address</Label><Textarea value={org.correspondenceAddress} onChange={e => setOrg(p => ({ ...p, correspondenceAddress: e.target.value }))} rows={3} disabled={!isOwner} /></div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2"><Label>Contact Email</Label><Input value={org.contactEmail} onChange={e => setOrg(p => ({ ...p, contactEmail: e.target.value }))} disabled={!isOwner} /></div>
                  <div className="space-y-2"><Label>Secondary Email</Label><Input value={org.contactEmail2} onChange={e => setOrg(p => ({ ...p, contactEmail2: e.target.value }))} disabled={!isOwner} /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2"><Label>Phone</Label><Input value={org.phone} onChange={e => setOrg(p => ({ ...p, phone: e.target.value }))} disabled={!isOwner} /></div>
                  <div className="space-y-2"><Label>Website URL</Label><Input value={org.websiteUrl} onChange={e => setOrg(p => ({ ...p, websiteUrl: e.target.value }))} disabled={!isOwner} /></div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Client Companies tab removed — changes reflect on client platform automatically */}

          {/* ─── Theme & Appearance ─── */}
          <TabsContent value="theme">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2"><Palette className="h-4 w-4" /> Theme & Appearance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Primary Brand Color</Label>
                    <div className="flex gap-3 items-center">
                      <input type="color" value={theme.primaryColor} onChange={e => setThemeState(p => ({ ...p, primaryColor: e.target.value }))} className="h-10 w-16 rounded cursor-pointer" disabled={!isOwner} />
                      <Input value={theme.primaryColor} onChange={e => setThemeState(p => ({ ...p, primaryColor: e.target.value }))} className="w-32" disabled={!isOwner} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Accent Color</Label>
                    <div className="flex gap-3 items-center">
                      <input type="color" value={theme.accentColor} onChange={e => setThemeState(p => ({ ...p, accentColor: e.target.value }))} className="h-10 w-16 rounded cursor-pointer" disabled={!isOwner} />
                      <Input value={theme.accentColor} onChange={e => setThemeState(p => ({ ...p, accentColor: e.target.value }))} className="w-32" disabled={!isOwner} />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Dashboard Theme</Label>
                  <Select value={theme.dashboardTheme} onValueChange={v => setThemeState(p => ({ ...p, dashboardTheme: v }))} disabled={!isOwner}>
                    <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="modern">Modern</SelectItem>
                      <SelectItem value="minimal">Minimal</SelectItem>
                      <SelectItem value="corporate">Corporate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Sidebar Branding</Label>
                  <Switch checked={theme.sidebarBranding} onCheckedChange={v => setThemeState(p => ({ ...p, sidebarBranding: v }))} disabled={!isOwner} />
                </div>
                <div className="space-y-2">
                  <Label>Company Logo</Label>
                  <Button variant="outline" className="gap-2" disabled={!isOwner}><Upload className="h-4 w-4" /> Upload Logo</Button>
                </div>
                {isOwner && <Button onClick={handleSave}>Save Theme</Button>}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── Localization ─── */}
          <TabsContent value="localization">
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Globe className="h-4 w-4" /> Localization</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2"><Label>Default Currency</Label>
                    <Select value={loc.currency} onValueChange={v => setLoc(p => ({ ...p, currency: v }))}><SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="inr">INR – Indian Rupee</SelectItem><SelectItem value="usd">USD ($)</SelectItem><SelectItem value="eur">EUR (€)</SelectItem><SelectItem value="gbp">GBP (£)</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Time Zone</Label>
                    <Select value={loc.timezone} onValueChange={v => setLoc(p => ({ ...p, timezone: v }))}><SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="ist">(GMT+5:30) IST</SelectItem><SelectItem value="pst">PST (UTC-8)</SelectItem><SelectItem value="est">EST (UTC-5)</SelectItem><SelectItem value="utc">UTC</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Date Format</Label>
                    <Select value={loc.dateFormat} onValueChange={v => setLoc(p => ({ ...p, dateFormat: v }))}><SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="dmy">DD/MM/YYYY</SelectItem><SelectItem value="mdy">MM/DD/YYYY</SelectItem><SelectItem value="ymd">YYYY-MM-DD</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Financial Year</Label>
                    <Select value={loc.financialYear} onValueChange={v => setLoc(p => ({ ...p, financialYear: v }))}><SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="apr-mar">April – March</SelectItem><SelectItem value="jan-dec">January – December</SelectItem></SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Number Format</Label>
                  <RadioGroup value={loc.numberFormat} onValueChange={v => setLoc(p => ({ ...p, numberFormat: v }))} className="flex gap-6">
                    <div className="flex items-center gap-2"><RadioGroupItem value="indian" id="indian" /><Label htmlFor="indian">Indian (1,00,000)</Label></div>
                    <div className="flex items-center gap-2"><RadioGroupItem value="international" id="international" /><Label htmlFor="international">International (100,000)</Label></div>
                  </RadioGroup>
                </div>
                {isOwner && <Button onClick={handleSave}>Save Changes</Button>}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── Procurement Defaults ─── */}
          <TabsContent value="procurement">
            <Card>
              <CardHeader><CardTitle className="text-sm">Procurement Defaults</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Default SLA Hours</Label><Input type="number" defaultValue="24" disabled={!isOwner} /></div>
                  <div><Label>Auto-Approve Limit (₹)</Label><Input type="number" defaultValue="50000" disabled={!isOwner} /></div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between"><Label>Require Approval for All Orders</Label><Switch defaultChecked disabled={!isOwner} /></div>
                  <div className="flex items-center justify-between"><Label>Auto-Assign Analyst</Label><Switch defaultChecked disabled={!isOwner} /></div>
                  <div className="flex items-center justify-between"><Label>Allow Partial Deliveries</Label><Switch disabled={!isOwner} /></div>
                </div>
                {isOwner && <Button onClick={handleSave}>Save Changes</Button>}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── Notifications ─── */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader><CardTitle className="text-sm">Notification & Alert Settings</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {["Email on Order Created", "SMS on SLA Breach", "In-App on Approval Required", "Email on Contract Expiring", "SMS on Payment Due"].map(item => (
                  <div key={item} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <span className="text-sm">{item}</span><Switch defaultChecked disabled={!isOwner} />
                  </div>
                ))}
                {isOwner && <Button onClick={handleSave} className="mt-4">Save Changes</Button>}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── Security ─── */}
          <TabsContent value="security">
            <Card>
              <CardHeader><CardTitle className="text-sm">Security Settings</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between"><Label>Enforce Two-Factor Authentication</Label><Switch disabled={!isOwner} /></div>
                <div className="flex items-center justify-between"><Label>Session Timeout (minutes)</Label><Input type="number" defaultValue="30" className="w-24" disabled={!isOwner} /></div>
                <div className="flex items-center justify-between"><Label>Password Expiry (days)</Label><Input type="number" defaultValue="90" className="w-24" disabled={!isOwner} /></div>
                <div className="flex items-center justify-between"><Label>IP Whitelist Enabled</Label><Switch disabled={!isOwner} /></div>
                {isOwner && <Button onClick={handleSave} className="mt-4">Save Changes</Button>}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── APIs ─── */}
          <TabsContent value="apis">
            <Card>
              <CardHeader><CardTitle className="text-sm">API Configuration</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div><Label>API Key</Label><Input defaultValue="nido_key_xxxxxxxxxxxxxxxxxxxx" readOnly /></div>
                <div><Label>Webhook URL</Label><Input defaultValue="https://api.nidotech.com/webhooks" disabled={!isOwner} /></div>
                <div className="flex items-center justify-between"><Label>Enable API Access</Label><Switch defaultChecked disabled={!isOwner} /></div>
                {isOwner && <Button onClick={handleSave}>Save Changes</Button>}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Company Profile Preview Dialog */}
      <Dialog open={showCompanyPreview} onOpenChange={setShowCompanyPreview}>
        <DialogContent className="max-w-[96vw] lg:max-w-[88vw] xl:max-w-[80vw] max-h-[92vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Eye className="h-5 w-5 text-primary" /> Company Profile Preview</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            {previewCompany && selectedPreviewClient ? (
              <div className="space-y-6 p-4">
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-10 w-10 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{selectedPreviewClient.name}</h2>
                    <p className="text-muted-foreground">{selectedPreviewClient.contactPerson} · {selectedPreviewClient.email}</p>
                    <Badge className="mt-1" variant="outline">{selectedPreviewClient.status}</Badge>
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-6 text-sm">
                  <div><span className="text-muted-foreground">Phone:</span> <span className="ml-2">{selectedPreviewClient.phone}</span></div>
                  <div><span className="text-muted-foreground">Address:</span> <span className="ml-2">{selectedPreviewClient.address}</span></div>
                  <div><span className="text-muted-foreground">Contract:</span> <span className="ml-2">{selectedPreviewClient.contractStart} — {selectedPreviewClient.contractEnd}</span></div>
                  <div><span className="text-muted-foreground">Total Orders:</span> <span className="ml-2 font-semibold">{selectedPreviewClient.totalOrders}</span></div>
                </div>
                <Separator />
                <p className="text-sm text-muted-foreground italic">This is how the platform appears to {selectedPreviewClient.name}. The client sees their own dashboard, branding, and order history.</p>
                <div className="border rounded-xl p-6 bg-muted/20">
                  <div className="flex items-center gap-3 mb-4">
                    <Building2 className="h-6 w-6 text-primary" />
                    <h3 className="text-lg font-semibold">{selectedPreviewClient.name} Dashboard</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-card rounded-lg p-4 border text-center">
                      <p className="text-2xl font-bold text-primary">{selectedPreviewClient.totalOrders}</p>
                      <p className="text-xs text-muted-foreground">Orders</p>
                    </div>
                    <div className="bg-card rounded-lg p-4 border text-center">
                      <p className="text-2xl font-bold text-primary">{selectedPreviewClient.status}</p>
                      <p className="text-xs text-muted-foreground">Status</p>
                    </div>
                    <div className="bg-card rounded-lg p-4 border text-center">
                      <p className="text-2xl font-bold text-primary">{selectedPreviewClient.contractEnd}</p>
                      <p className="text-xs text-muted-foreground">Contract End</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6 p-4">
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-10 w-10 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{org.companyName}</h2>
                    <p className="text-muted-foreground">{org.contactEmail}</p>
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-6 text-sm">
                  <div><span className="text-muted-foreground">GST:</span> <span className="ml-2">{org.gstNumber}</span></div>
                  <div><span className="text-muted-foreground">PAN:</span> <span className="ml-2">{org.panNumber}</span></div>
                  <div><span className="text-muted-foreground">CIN:</span> <span className="ml-2">{org.cinNumber}</span></div>
                  <div><span className="text-muted-foreground">Phone:</span> <span className="ml-2">{org.phone}</span></div>
                  <div><span className="text-muted-foreground">Website:</span> <span className="ml-2">{org.websiteUrl}</span></div>
                </div>
                <Separator />
                <div><p className="text-sm text-muted-foreground">Registered Address</p><p className="text-sm whitespace-pre-line">{org.registeredAddress}</p></div>
                <div><p className="text-sm text-muted-foreground">Correspondence Address</p><p className="text-sm whitespace-pre-line">{org.correspondenceAddress}</p></div>
                <p className="text-sm text-muted-foreground italic">Select a client company from the "Client Companies" tab to preview their personalized view.</p>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
