import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowLeft, TrendingUp, ShoppingCart, Users, AlertTriangle,
  Star, Mail, Edit, ExternalLink, Package, DollarSign, Clock, CheckCircle, Download
} from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "@/hooks/use-toast";
import QuickMailComposer from "@/components/shared/QuickMailComposer";
import VendorScorecard from "@/components/shared/VendorScorecard";

const CHART_COLORS = ["hsl(213, 94%, 56%)", "hsl(24, 95%, 53%)", "hsl(220, 9%, 60%)", "hsl(142, 70%, 40%)", "hsl(38, 92%, 50%)"];
const STATUS_COLORS: Record<string, string> = {
  Pending: "#F59E0B", Processing: "#F97316", Approved: "#10B981", Shipped: "#3B82F6", Delivered: "#059669", Cancelled: "#EF4444", "On Hold": "#6B7280",
};

function AnimatedCounter({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    let current = 0;
    const steps = 40;
    const increment = value / steps;
    const timer = setInterval(() => {
      current = Math.min(current + increment, value);
      setDisplayed(Math.round(current));
      if (current >= value) clearInterval(timer);
    }, 25);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{prefix}{displayed.toLocaleString()}{suffix}</span>;
}

export default function VendorDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { vendors, orders, updateVendor, addAuditEntry } = useData();
  const { user, isOwner } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [editRating, setEditRating] = useState(false);
  const [showMail, setShowMail] = useState(false);

  const vendor = vendors.find(v => v.id === id);

  const vendorOrders = useMemo(() => vendor ? orders.filter(o => o.organization === vendor.name) : [], [vendor, orders]);
  const totalSpend = useMemo(() => vendorOrders.reduce((s, o) => s + o.totalAmount, 0), [vendorOrders]);
  const openOrders = useMemo(() => vendorOrders.filter(o => !["Delivered", "Cancelled"].includes(o.status)).length, [vendorOrders]);
  const overdueOrders = useMemo(() => vendorOrders.filter(o => o.slaStatus === "breached").length, [vendorOrders]);

  // Procurement status pie
  const procureStatusData = useMemo(() => {
    if (!vendor) return [];
    const pending = vendorOrders.filter(o => o.status === "Pending").length;
    const processing = vendorOrders.filter(o => ["Processing", "Approved", "Shipped"].includes(o.status)).length;
    const completed = vendorOrders.filter(o => o.status === "Delivered").length;
    return [
      { name: "Pending", value: pending || 1 },
      { name: "Processing", value: processing || 1 },
      { name: "Completed", value: completed || 1 },
    ].filter(d => d.value > 0);
  }, [vendorOrders]);

  // Spend analysis pie
  const spendData = useMemo(() => {
    const paid = vendorOrders.filter(o => o.status === "Delivered").reduce((s, o) => s + o.totalAmount, 0);
    const pending = totalSpend - paid;
    return [
      { name: "Paid", value: paid || 1 },
      { name: "Pending Due", value: pending > 0 ? pending : 1 },
    ];
  }, [vendorOrders, totalSpend]);

  // Monthly spend bar chart
  const monthlySpend = useMemo(() => {
    const months: { month: string; spend: number }[] = [];
    for (let i = 7; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const month = d.toLocaleString("en-US", { month: "short" });
      const yr = d.getFullYear();
      const total = vendorOrders
        .filter(o => { const od = new Date(o.orderDate); return od.getMonth() === d.getMonth() && od.getFullYear() === yr; })
        .reduce((s, o) => s + o.totalAmount, 0);
      months.push({ month, spend: total });
    }
    // Add some sample data if all zeros
    if (months.every(m => m.spend === 0)) {
      return months.map((m, i) => ({ ...m, spend: Math.round((Math.random() * 50000) + 10000) }));
    }
    return months;
  }, [vendorOrders]);

  if (!vendor) return (
    <div className="p-6">
      <p className="text-muted-foreground">Vendor not found.</p>
      <Button onClick={() => navigate("/vendors")} className="mt-4">Back to Vendors</Button>
    </div>
  );

  const handleRatingChange = (rating: number) => {
    updateVendor(vendor.id, { rating });
    addAuditEntry({ user: user?.name || "System", action: "Vendor Rating Updated", module: "Vendors", details: `Set ${vendor.name} rating to ${rating}`, ipAddress: "192.168.1.1", status: "success" });
    setEditRating(false);
    toast({ title: "Rating Updated" });
  };

  const handleStatusToggle = () => {
    const newStatus = vendor.status === "active" ? "inactive" : "active";
    updateVendor(vendor.id, { status: newStatus });
    addAuditEntry({ user: user?.name || "System", action: "Vendor Status Changed", module: "Vendors", details: `Changed ${vendor.name} status to ${newStatus}`, ipAddress: "192.168.1.1", status: "success" });
    toast({ title: `Vendor ${newStatus === "active" ? "Activated" : "Deactivated"}` });
  };

  return (
    <div>
      <Header title={vendor.name} />
      <div className="p-6 space-y-6 animate-fade-in">
        {/* Header with breadcrumb */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/vendors")}><ArrowLeft className="h-4 w-4" /></Button>
            <div>
              <p className="text-xs text-muted-foreground">Vendors / {vendor.category}</p>
              <h1 className="text-2xl font-display font-bold">{vendor.name}</h1>
            </div>
            <Badge className={vendor.status === "active" ? "bg-success text-success-foreground" : vendor.status === "pending" ? "bg-warning text-warning-foreground" : "bg-muted text-muted-foreground"}>
              {vendor.status}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(`/orders`)} className="gap-2"><ShoppingCart className="h-4 w-4" /> New Order</Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowMail(true)}><Mail className="h-4 w-4" /> Message</Button>
            {isOwner && (
              <Button variant="outline" size="sm" onClick={handleStatusToggle} className="gap-2">
                {vendor.status === "active" ? "Deactivate" : "Activate"}
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="scorecard">Scorecard</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { title: "Total Spend", value: totalSpend, prefix: "$", icon: TrendingUp, color: "text-success", onClick: () => setActiveTab("orders") },
                { title: "Open Orders", value: openOrders, icon: ShoppingCart, color: "text-info", onClick: () => setActiveTab("orders") },
                { title: "Active Vendors", value: vendors.filter(v => v.status === "active").length, icon: Users, color: "text-primary", onClick: () => navigate("/vendors") },
                { title: "Overdue Orders", value: overdueOrders, icon: AlertTriangle, color: overdueOrders > 0 ? "text-destructive" : "text-muted-foreground", onClick: () => setActiveTab("orders") },
              ].map(kpi => (
                <Card key={kpi.title} className="cursor-pointer hover:shadow-md transition-shadow" onClick={kpi.onClick}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{kpi.title}</p>
                        <p className="text-2xl font-bold mt-1"><AnimatedCounter value={kpi.value} prefix={kpi.prefix} /></p>
                      </div>
                      <div className={`p-2 rounded-lg bg-muted ${kpi.color}`}><kpi.icon className="h-5 w-5" /></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Spend Analysis (Monthly)</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={monthlySpend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} />
                      <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, "Spend"]} />
                      <Bar dataKey="spend" fill="hsl(213, 55%, 35%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Purchase Analysis</CardTitle></CardHeader>
                <CardContent>
                  {vendorOrders.length > 0 ? (
                    <div className="space-y-4">
                      {vendorOrders.slice(0, 1).map(o => (
                        <div key={o.id} className="space-y-3">
                          {o.items.map(item => (
                            <div key={item.id} className="flex items-start gap-4 p-3 bg-muted/30 rounded-lg">
                              <div className="h-16 w-16 bg-muted rounded-lg flex items-center justify-center"><Package className="h-8 w-8 text-muted-foreground" /></div>
                              <div className="flex-1">
                                <p className="font-medium text-sm">{item.name}</p>
                                <p className="text-xs text-muted-foreground">{item.description}</p>
                                <Badge variant="outline" className="mt-1 text-xs">Qty: {item.quantity}</Badge>
                              </div>
                            </div>
                          ))}
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>${o.totalAmount.toLocaleString()}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>$0.00</span></div>
                            <div className="flex justify-between font-bold border-t pt-1"><span>Total</span><span>${o.totalAmount.toLocaleString()}</span></div>
                          </div>
                          <Button variant="link" size="sm" onClick={() => navigate(`/orders/${o.id}`)}>View Full Order →</Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground text-sm">No active purchases</p>
                      <Button variant="outline" size="sm" className="mt-2" onClick={() => navigate("/orders")}>Create New Order</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Charts Row 2: Pie charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Procurement Status</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={procureStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                        onClick={(_, i) => {
                          const status = procureStatusData[i]?.name;
                          if (status) { setActiveTab("orders"); toast({ title: `Filtered: ${status}` }); }
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        {procureStatusData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <p className="text-xs text-muted-foreground text-center">Click a slice to filter orders</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Spend Breakdown</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={spendData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value"
                        label={({ name, value }) => `${name}: $${value.toLocaleString()}`}
                        style={{ cursor: "pointer" }}
                      >
                        {spendData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Recent Orders */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Recent Orders</CardTitle>
                  <Button variant="link" size="sm" onClick={() => setActiveTab("orders")}>View All →</Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Progress</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendorOrders.slice(0, 5).map(o => {
                      const progressMap: Record<string, number> = { Pending: 20, Processing: 40, Approved: 60, Shipped: 80, Delivered: 100, Cancelled: 0 };
                      return (
                        <TableRow key={o.id} className="cursor-pointer" onClick={() => navigate(`/orders/${o.id}`)}>
                          <TableCell className="font-medium text-primary">#{o.orderNumber}</TableCell>
                          <TableCell className="text-muted-foreground">{o.orderDate}</TableCell>
                          <TableCell>
                            <Badge variant="outline" style={{ borderColor: STATUS_COLORS[o.status], color: STATUS_COLORS[o.status] }}>{o.status}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">${o.totalAmount.toLocaleString()}</TableCell>
                          <TableCell><Progress value={progressMap[o.status] || 0} className="h-2 w-20" /></TableCell>
                        </TableRow>
                      );
                    })}
                    {vendorOrders.length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center py-4 text-muted-foreground">No orders for this vendor.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">All Orders from {vendor.name}</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Requesting User</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>SLA</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendorOrders.map(o => (
                      <TableRow key={o.id} className="cursor-pointer" onClick={() => navigate(`/orders/${o.id}`)}>
                        <TableCell className="font-medium text-primary">#{o.orderNumber}</TableCell>
                        <TableCell>{o.orderDate}</TableCell>
                        <TableCell>{o.requestingUser}</TableCell>
                        <TableCell>
                          <Badge variant="outline" style={{ borderColor: STATUS_COLORS[o.status], color: STATUS_COLORS[o.status] }}>{o.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={o.slaStatus === "within_sla" ? "bg-success text-success-foreground" : o.slaStatus === "at_risk" ? "bg-warning text-warning-foreground" : "bg-destructive text-destructive-foreground"}>
                            {o.slaStatus.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">${o.totalAmount.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                    {vendorOrders.length === 0 && (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No orders found.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader><CardTitle className="text-sm">Vendor Information</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-muted-foreground">Company Name</span><p className="font-medium">{vendor.name}</p></div>
                    <div><span className="text-muted-foreground">Category</span><p className="font-medium">{vendor.category}</p></div>
                    <div><span className="text-muted-foreground">Email</span><p className="font-medium">{vendor.contactEmail}</p></div>
                    <div><span className="text-muted-foreground">Phone</span><p className="font-medium">{vendor.contactPhone}</p></div>
                    <div className="col-span-2"><span className="text-muted-foreground">Address</span><p className="font-medium">{vendor.address}</p></div>
                    <div><span className="text-muted-foreground">Vendor Since</span><p className="font-medium">{new Date(vendor.joinDate).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p></div>
                    <div><span className="text-muted-foreground">Status</span>
                      <Badge className={vendor.status === "active" ? "bg-success text-success-foreground" : "bg-warning text-warning-foreground"}>{vendor.status}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="h-20 w-20 rounded-full bg-primary flex items-center justify-center text-2xl font-bold text-primary-foreground">
                      {vendor.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-semibold">{vendor.name}</p>
                      <p className="text-sm text-muted-foreground">{vendor.address?.split(",").pop()?.trim()}</p>
                    </div>
                    {/* Rating */}
                    <div>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star
                            key={star}
                            className={`h-5 w-5 cursor-pointer transition-colors ${star <= Math.round(vendor.rating) ? "fill-warning text-warning" : "text-muted"}`}
                            onClick={() => isOwner && handleRatingChange(star)}
                          />
                        ))}
                        <span className="text-sm font-medium ml-2">{vendor.rating}/5</span>
                      </div>
                      {isOwner && <p className="text-[10px] text-muted-foreground mt-1">Click stars to update rating</p>}
                    </div>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 gap-3 w-full">
                      <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <p className="text-lg font-bold">{vendor.totalOrders}</p>
                        <p className="text-xs text-muted-foreground">Orders</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <p className="text-lg font-bold">${(vendor.totalSpend / 1000).toFixed(0)}K</p>
                        <p className="text-xs text-muted-foreground">Revenue</p>
                      </div>
                    </div>
                    {/* Quality Bars */}
                    <div className="w-full space-y-3">
                      <p className="text-xs font-medium text-left">Performance</p>
                      {[
                        { label: "Quality", value: 85 },
                        { label: "Cost", value: 72 },
                        { label: "Delivery Speed", value: 90 },
                        { label: "Communication", value: 78 },
                      ].map(metric => (
                        <div key={metric.label} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>{metric.label}</span>
                            <span className="text-muted-foreground">{metric.value}%</span>
                          </div>
                          <Progress value={metric.value} className="h-1.5" />
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">O/S Category</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Purchase Order", value: vendorOrders.length || 3 },
                          { name: "Purchase Service", value: Math.max(1, Math.floor(vendorOrders.length / 3)) },
                        ]}
                        cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        <Cell fill="hsl(213, 94%, 56%)" />
                        <Cell fill="hsl(38, 92%, 50%)" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <p className="text-xs text-center text-muted-foreground">Tap a slice to view details</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Procure Status</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={procureStatusData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {procureStatusData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Spend Analysis</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={spendData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value"
                        label={({ name, value }) => `${name}: $${value.toLocaleString()}`}
                      >
                        {spendData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Scorecard Tab */}
          <TabsContent value="scorecard" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <VendorScorecard vendor={vendor} orders={vendorOrders} />
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Services Export</CardTitle>
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => {
                      const headers = ["Order #", "Date", "Items", "Status", "Amount"];
                      const rows = vendorOrders.map(o => [o.orderNumber, o.orderDate, o.items.map(i => i.name).join("; "), o.status, o.totalAmount]);
                      const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
                      const blob = new Blob([`Services Report: ${vendor.name}\n\n${csv}`], { type: "text/csv" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a"); a.href = url; a.download = `services-${vendor.name.replace(/\s+/g, "-")}.csv`; a.click();
                      URL.revokeObjectURL(url);
                      toast({ title: "Services Exported" });
                    }}><Download className="h-3.5 w-3.5" /> Export CSV</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order #</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vendorOrders.slice(0, 10).map(o => (
                        <TableRow key={o.id}>
                          <TableCell className="font-medium">#{o.orderNumber}</TableCell>
                          <TableCell className="text-muted-foreground">{o.orderDate}</TableCell>
                          <TableCell><Badge variant="outline">{o.status}</Badge></TableCell>
                          <TableCell className="text-right font-medium">${o.totalAmount.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <QuickMailComposer
        open={showMail}
        onClose={() => setShowMail(false)}
        recipientType="vendor"
        defaultTo={vendor.contactEmail}
      />
    </div>
  );
}
