import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useData } from "@/contexts/DataContext";
import { Building2, DollarSign, ShoppingBag, Star, TrendingUp } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const COLORS = ["hsl(213, 55%, 35%)", "hsl(142, 70%, 40%)", "hsl(38, 92%, 50%)", "hsl(0, 84%, 60%)", "hsl(200, 80%, 50%)"];

export default function VendorDashboard() {
  const { vendors, orders } = useData();

  const totalSpend = vendors.reduce((s, v) => s + v.totalSpend, 0);
  const avgRating = vendors.length ? (vendors.reduce((s, v) => s + v.rating, 0) / vendors.length).toFixed(1) : "0";
  const totalOrders = vendors.reduce((s, v) => s + v.totalOrders, 0);

  const categorySpend = vendors.reduce((acc, v) => {
    const ex = acc.find(a => a.name === v.category);
    if (ex) ex.value += v.totalSpend;
    else acc.push({ name: v.category, value: v.totalSpend });
    return acc;
  }, [] as { name: string; value: number }[]);

  const vendorSpend = vendors.map(v => ({ name: v.name.split(" ").slice(0, 2).join(" "), spend: v.totalSpend / 1000 })).sort((a, b) => b.spend - a.spend).slice(0, 5);

  return (
    <div>
      <Header title="Vendor Dashboard" />
      <div className="p-6 space-y-6 animate-fade-in">
        <h1 className="text-2xl font-display font-bold">Vendor Analytics</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { title: "Total Vendors", value: vendors.length, icon: Building2, color: "text-primary" },
            { title: "Total Spend", value: `$${(totalSpend / 1000000).toFixed(1)}M`, icon: DollarSign, color: "text-success" },
            { title: "Total Orders", value: totalOrders, icon: ShoppingBag, color: "text-info" },
            { title: "Avg Rating", value: avgRating, icon: Star, color: "text-warning" },
          ].map(kpi => (
            <Card key={kpi.title}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{kpi.title}</p>
                    <p className="text-2xl font-bold mt-1">{kpi.value}</p>
                  </div>
                  <div className={`p-2 rounded-lg bg-muted ${kpi.color}`}><kpi.icon className="h-5 w-5" /></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Spend by Category</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={categorySpend} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: $${(value / 1000).toFixed(0)}K`}>
                    {categorySpend.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Top Vendors by Spend ($K)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={vendorSpend} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                  <Tooltip formatter={(v: number) => [`$${v}K`, "Spend"]} />
                  <Bar dataKey="spend" fill="hsl(213, 55%, 35%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Vendor Profiles</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Total Spend</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendors.map(v => (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium">{v.name}</TableCell>
                    <TableCell className="text-muted-foreground">{v.category}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                        <span className="text-sm">{v.rating}</span>
                      </div>
                    </TableCell>
                    <TableCell>{v.totalOrders}</TableCell>
                    <TableCell className="font-medium">${v.totalSpend.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={v.status === "active" ? "default" : v.status === "pending" ? "secondary" : "outline"}
                        className={v.status === "active" ? "bg-success text-success-foreground" : ""}>
                        {v.status}
                      </Badge>
                    </TableCell>
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
