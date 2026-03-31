import { useState } from "react";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Search, Settings, Plus, ExternalLink, RefreshCw, Trash2, Edit } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Integration {
  id: string;
  name: string;
  category: string;
  description: string;
  status: "connected" | "not_connected" | "manage";
  lastSync?: string;
  icon: string;
  popular: boolean;
}

const DEFAULT_INTEGRATIONS: Integration[] = [
  { id: "sap", name: "SAP", category: "ERP System", description: "Enterprise resource planning integration", status: "connected", lastSync: "1h ago", icon: "🏢", popular: true },
  { id: "quickbooks", name: "QuickBooks", category: "Accounting", description: "Accounting and bookkeeping sync", status: "connected", lastSync: "2h ago", icon: "📊", popular: true },
  { id: "razorpay", name: "Razorpay", category: "Payment Gateway", description: "Online payment processing", status: "not_connected", icon: "💳", popular: true },
  { id: "paypal", name: "PayPal", category: "Payment Gateway", description: "International payment gateway", status: "connected", lastSync: "30m ago", icon: "💰", popular: true },
  { id: "zoho-crm", name: "Zoho CRM", category: "CRM Software", description: "Customer relationship management", status: "not_connected", icon: "👥", popular: true },
  { id: "zoho-books", name: "Zoho Books", category: "Accounting", description: "Cloud accounting software", status: "connected", lastSync: "25m ago", icon: "📚", popular: true },
  { id: "whatsapp", name: "WhatsApp", category: "SMS & WhatsApp", description: "Business messaging and notifications", status: "manage", lastSync: "5m ago", icon: "💬", popular: true },
  { id: "google-drive", name: "Google Drive", category: "Cloud Storage", description: "File storage and sharing", status: "connected", lastSync: "10m ago", icon: "☁️", popular: true },
  { id: "oracle", name: "Oracle NetSuite", category: "ERP System", description: "Cloud ERP solution", status: "not_connected", icon: "🏛️", popular: false },
  { id: "dynamics", name: "Microsoft Dynamics 365", category: "ERP System", description: "Business applications suite", status: "not_connected", icon: "🔷", popular: false },
  { id: "salesforce", name: "Salesforce", category: "CRM Software", description: "CRM and sales platform", status: "connected", lastSync: "11h ago", icon: "☁️", popular: false },
  { id: "stripe", name: "Stripe", category: "Payment Gateway", description: "Payment processing for internet businesses", status: "connected", lastSync: "2h ago", icon: "💳", popular: false },
  { id: "twilio", name: "Twilio", category: "Communication", description: "Cloud communications platform", status: "connected", lastSync: "1h ago", icon: "📞", popular: false },
  { id: "dropbox", name: "Dropbox", category: "Cloud Storage", description: "File hosting and storage", status: "not_connected", lastSync: "1h ago", icon: "📦", popular: false },
];

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState(DEFAULT_INTEGRATIONS);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showConfig, setShowConfig] = useState<string | null>(null);
  const [newIntegration, setNewIntegration] = useState({ name: "", category: "", apiKey: "", webhookUrl: "" });

  const popular = integrations.filter(i => i.popular);
  const allFiltered = integrations.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || i.category.toLowerCase().includes(search.toLowerCase()));

  const handleConnect = (id: string) => {
    setIntegrations(prev => prev.map(i => i.id === id ? { ...i, status: "connected" as const, lastSync: "Just now" } : i));
    toast({ title: "Connected", description: `Integration connected successfully.` });
  };

  const handleDisconnect = (id: string) => {
    setIntegrations(prev => prev.map(i => i.id === id ? { ...i, status: "not_connected" as const, lastSync: undefined } : i));
    toast({ title: "Disconnected" });
  };

  const handleSync = (id: string) => {
    setIntegrations(prev => prev.map(i => i.id === id ? { ...i, lastSync: "Just now" } : i));
    toast({ title: "Synced", description: "Data synchronized successfully." });
  };

  const handleAddIntegration = () => {
    const newInt: Integration = {
      id: `custom-${Date.now()}`,
      name: newIntegration.name,
      category: newIntegration.category,
      description: "Custom integration",
      status: "not_connected",
      icon: "🔌",
      popular: false,
    };
    setIntegrations(prev => [...prev, newInt]);
    setShowAdd(false);
    setNewIntegration({ name: "", category: "", apiKey: "", webhookUrl: "" });
    toast({ title: "Integration Added" });
  };

  const getStatusButton = (integration: Integration) => {
    switch (integration.status) {
      case "connected":
        return <Badge className="bg-success text-success-foreground cursor-pointer" onClick={() => setShowConfig(integration.id)}>● Connected</Badge>;
      case "not_connected":
        return <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => handleConnect(integration.id)}>Connect</Button>;
      case "manage":
        return <Badge className="bg-warning text-warning-foreground cursor-pointer" onClick={() => setShowConfig(integration.id)}>● Manage</Badge>;
    }
  };

  const configIntegration = integrations.find(i => i.id === showConfig);

  return (
    <div>
      <Header title="Integrations" />
      <div className="p-6 space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold">Integrations</h1>
            <p className="text-sm text-muted-foreground mt-1">Connect and manage third-party applications to automate workflows and sync data. Integrate with ERPs, accounting, payment gateways, e-invoicing, cloud storage, communication APIs.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2"><Settings className="h-4 w-4" /> API Settings</Button>
            <Button variant="outline" size="sm" className="gap-2"><RefreshCw className="h-4 w-4" /> Sync History</Button>
          </div>
        </div>

        {/* Popular Integrations */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Popular Integrations</h2>
            <Button size="sm" className="gap-2" onClick={() => setShowAdd(true)}><Plus className="h-4 w-4" /> New Items</Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {popular.map(integration => (
              <Card key={integration.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 text-center space-y-2">
                  <div className="text-3xl">{integration.icon}</div>
                  <p className="font-semibold text-sm">{integration.name}</p>
                  <p className="text-xs text-muted-foreground">{integration.category}</p>
                  {getStatusButton(integration)}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* All Integrations */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">All Integrations</h2>
            <div className="flex gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search integrations..." className="pl-9 w-60" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-2" /> Add Integration</Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {allFiltered.filter(i => !i.popular).map(integration => (
              <Card key={integration.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{integration.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{integration.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusButton(integration)}
                        {integration.lastSync && <span className="text-[10px] text-muted-foreground">{integration.lastSync}</span>}
                      </div>
                    </div>
                    {integration.status === "connected" && (
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowConfig(integration.id)}>
                        <Edit className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {/* Add Integration Card */}
            <Card className="border-dashed cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setShowAdd(true)}>
              <CardContent className="p-4 flex items-center justify-center h-full min-h-[80px]">
                <div className="text-center">
                  <Plus className="h-8 w-8 text-muted-foreground mx-auto" />
                  <p className="text-sm text-muted-foreground mt-1">Add Integration</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Add Integration Dialog */}
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogContent>
            <DialogHeader><DialogTitle>Add New Integration</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Integration Name</Label><Input value={newIntegration.name} onChange={e => setNewIntegration(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Custom ERP" /></div>
              <div><Label>Category</Label><Input value={newIntegration.category} onChange={e => setNewIntegration(p => ({ ...p, category: e.target.value }))} placeholder="e.g. ERP System" /></div>
              <div><Label>API Key</Label><Input value={newIntegration.apiKey} onChange={e => setNewIntegration(p => ({ ...p, apiKey: e.target.value }))} placeholder="Enter API key" type="password" /></div>
              <div><Label>Webhook URL</Label><Input value={newIntegration.webhookUrl} onChange={e => setNewIntegration(p => ({ ...p, webhookUrl: e.target.value }))} placeholder="https://..." /></div>
              <Button onClick={handleAddIntegration} className="w-full" disabled={!newIntegration.name}>Add Integration</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Config Dialog */}
        <Dialog open={!!showConfig} onOpenChange={() => setShowConfig(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Configure: {configIntegration?.name}</DialogTitle></DialogHeader>
            {configIntegration && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{configIntegration.icon}</span>
                  <div>
                    <p className="font-semibold">{configIntegration.name}</p>
                    <p className="text-sm text-muted-foreground">{configIntegration.category}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between"><Label>Auto-Sync</Label><Switch defaultChecked /></div>
                  <div className="flex items-center justify-between"><Label>Sync Frequency</Label><span className="text-sm text-muted-foreground">Every 15 minutes</span></div>
                  <div className="flex items-center justify-between"><Label>Last Synced</Label><span className="text-sm text-muted-foreground">{configIntegration.lastSync || "Never"}</span></div>
                  <div className="flex items-center justify-between"><Label>Status</Label>
                    <Badge className={configIntegration.status === "connected" ? "bg-success text-success-foreground" : "bg-muted"}>
                      {configIntegration.status === "connected" ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={() => { handleSync(configIntegration.id); setShowConfig(null); }}>
                    <RefreshCw className="h-4 w-4 mr-2" /> Sync Now
                  </Button>
                  <Button variant="destructive" onClick={() => { handleDisconnect(configIntegration.id); setShowConfig(null); }}>
                    Disconnect
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
