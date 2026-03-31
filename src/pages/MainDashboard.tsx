import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { ShoppingBag, DollarSign, Users, TrendingUp, Building2 } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

const STATUS_COLORS: Record<string, string> = {
  Pending: "hsl(38, 92%, 50%)",
  Processing: "hsl(24, 95%, 53%)",
  Approved: "hsl(142, 70%, 40%)",
  Shipped: "hsl(213, 94%, 56%)",
  Delivered: "hsl(160, 84%, 39%)",
  Cancelled: "hsl(0, 84%, 60%)",
  "On Hold": "hsl(220, 9%, 46%)",
};

const CONTRACT_COLORS = [
  "hsl(213, 55%, 35%)",
  "hsl(142, 70%, 40%)",
  "hsl(38, 92%, 50%)",
  "hsl(0, 84%, 60%)",
  "hsl(280, 60%, 50%)",
  "hsl(200, 80%, 50%)",
];

export default function MainDashboard() {
  const { orders, vendors, clients } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();

  const totalSpend = orders.reduce((s, o) => s + o.totalAmount, 0);
  const activeVendors = vendors.filter(v => v.status === "active").length;
  const pendingOrders = orders.filter(o => o.status === "Pending").length;

  const statusData = Object.entries(
    orders.reduce((acc, o) => { acc[o.status] = (acc[o.status] || 0) + 1; return acc; }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const categoryData = vendors.reduce((acc, v) => {
    const existing = acc.find(a => a.name === v.category);
    if (existing) existing.value += v.totalOrders;
    else acc.push({ name: v.category, value: v.totalOrders });
    return acc;
  }, [] as { name: string; value: number }[]);

  // Corporate Companies Under Contract
  const now = new Date();
  const corporateData = clients.map(c => {
    const end = new Date(c.contractEnd);
    const start = new Date(c.contractStart);
    let contractStatus = "Active";
    if (end < now) contractStatus = "Expired";
    else if (start > now) contractStatus = "Pending";
    return { name: c.name, status: contractStatus };
  });

  const contractStatusCounts = corporateData.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const contractPieData = Object.entries(contractStatusCounts).map(([name, value]) => ({ name, value }));

  // Order distribution for dashboard analysis
  const orderDistData = [
    { name: "Approved", value: orders.filter(o => o.status === "Approved").length },
    { name: "Pending", value: orders.filter(o => o.status === "Pending").length },
    { name: "Cancelled", value: orders.filter(o => o.status === "Cancelled").length },
    { name: "Processing", value: orders.filter(o => o.status === "Processing").length },
    { name: "Delivered", value: orders.filter(o => o.status === "Delivered").length },
  ].filter(d => d.value > 0);

  const spendByMonth = [
    { month: "Jan", spend: 58000 }, { month: "Feb", spend: 42000 }, { month: "Mar", spend: 67000 },
    { month: "Apr", spend: 35000 }, { month: "May", spend: 52000 }, { month: "Jun", spend: 48000 },
  ];

  const CHART_COLORS = ["hsl(213, 55%, 35%)", "hsl(142, 70%, 40%)", "hsl(38, 92%, 50%)", "hsl(0, 84%, 60%)", "hsl(200, 80%, 50%)", "hsl(280, 60%, 50%)"];

  const CONTRACT_STATUS_COLORS: Record<string, string> = {
    Active: "hsl(142, 70%, 40%)",
    Expired: "hsl(0, 84%, 60%)",
    Pending: "hsl(38, 92%, 50%)",
  };

  return (
    <div>
      <Header title="Product Dashboard" />
      <div className="p-6 space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold">Welcome, {user?.name?.split(" ")[0]}</h1>
            <p className="text-sm text-muted-foreground">Here's your procurement overview</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { title: "Total Orders", value: orders.length, icon: ShoppingBag, color: "text-primary", desc: `${pendingOrders} pending` },
            { title: "Total Spend", value: `$${(totalSpend / 1000).toFixed(0)}K`, icon: DollarSign, color: "text-success", desc: "This quarter" },
            { title: "Active Vendors", value: activeVendors, icon: Users, color: "text-info", desc: `${vendors.length} total` },
            { title: "Active Clients", value: clients.filter(c => c.status === "active").length, icon: TrendingUp, color: "text-warning", desc: `${clients.length} total` },
            { title: "Companies", value: clients.length, icon: Building2, color: "text-primary", desc: `${contractStatusCounts["Active"] || 0} active contracts` },
          ].map(kpi => (
            <Card key={kpi.title} className="hover:shadow-md transition-shadow hover:-translate-y-0.5">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{kpi.title}</p>
                    <p className="text-2xl font-bold mt-1">{kpi.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{kpi.desc}</p>
                  </div>
                  <div className={`p-2 rounded-lg bg-muted ${kpi.color}`}>
                    <kpi.icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Row 1: 4 charts */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Procurement Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {statusData.map((entry, i) => (
                      <Cell key={i} fill={STATUS_COLORS[entry.name] || CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Order Categories (O/S)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* NEW: Corporate Companies Under Contract */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                Corporate Companies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={contractPieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {contractPieData.map((entry, i) => (
                      <Cell key={i} fill={CONTRACT_STATUS_COLORS[entry.name] || CONTRACT_COLORS[i % CONTRACT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 space-y-1">
                {corporateData.map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="truncate text-muted-foreground">{c.name}</span>
                    <Badge variant="outline" className="text-[10px]" style={{ borderColor: CONTRACT_STATUS_COLORS[c.status], color: CONTRACT_STATUS_COLORS[c.status] }}>{c.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Order Dashboard Analysis */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Order Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={orderDistData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {orderDistData.map((entry, i) => (
                      <Cell key={i} fill={STATUS_COLORS[entry.name] || CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Spend Analysis full width */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Spend Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={spendByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v / 1000}K`} />
                <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, "Spend"]} />
                <Bar dataKey="spend" fill="hsl(213, 55%, 35%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Recent Orders</CardTitle>
              <button onClick={() => navigate("/orders")} className="text-xs text-primary hover:underline font-medium">View All →</button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Requesting User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.slice(0, 5).map(order => (
                  <TableRow key={order.id} className="cursor-pointer" onClick={() => navigate(`/orders/${order.id}`)}>
                    <TableCell className="font-medium text-primary">{order.orderNumber}</TableCell>
                    <TableCell className="text-muted-foreground">{order.orderDate}</TableCell>
                    <TableCell>{order.organization}</TableCell>
                    <TableCell>{order.requestingUser}</TableCell>
                    <TableCell>
                      <Badge variant="outline" style={{ borderColor: STATUS_COLORS[order.status], color: STATUS_COLORS[order.status] }}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">${order.totalAmount.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
