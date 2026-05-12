import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowLeft,
  Building2,
  Calendar,
  DollarSign,
  Filter,
  Mail,
  MessageSquare,
  Phone,
  Search,
  Send,
  ShoppingBag,
  Users,
  Copy,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import QuickMailComposer from "@/components/shared/QuickMailComposer";
import { toast } from "@/hooks/use-toast";

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(var(--destructive))",
  "hsl(var(--info))",
  "hsl(var(--muted-foreground))",
];

const CONTRACT_STATUS_META: Record<string, { badge: string; fill: string }> = {
  Active: { badge: "border-success/30 bg-success/10 text-success", fill: "hsl(var(--success))" },
  Expired: { badge: "border-destructive/30 bg-destructive/10 text-destructive", fill: "hsl(var(--destructive))" },
  Pending: { badge: "border-warning/30 bg-warning/10 text-warning", fill: "hsl(var(--warning))" },
  Inactive: { badge: "border-border bg-muted text-muted-foreground", fill: "hsl(var(--muted-foreground))" },
};

const ORDER_STATUS_META: Record<string, string> = {
  Pending: "border-warning/30 bg-warning/10 text-warning",
  Processing: "border-primary/30 bg-primary/10 text-primary",
  Approved: "border-success/30 bg-success/10 text-success",
  Shipped: "border-info/30 bg-info/10 text-info",
  Delivered: "border-success/30 bg-success/10 text-success",
  Cancelled: "border-destructive/30 bg-destructive/10 text-destructive",
};

const ROLE_LABELS: Record<string, string> = {
  client_admin: "Organization Admin",
  client_employee: "Organization User",
  admin: "Platform Admin",
  owner: "Platform Owner",
  procurement_manager: "Procurement Manager",
  employee: "Employee",
  vendor: "Vendor",
};

const MONTH_ORDER = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const normalizeName = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

const deriveIndustry = (companyName: string) => {
  const value = companyName.toLowerCase();
  if (value.includes("tech") || value.includes("euro")) return "Technology";
  if (value.includes("global") || value.includes("industr")) return "Industrial";
  if (value.includes("sky") || value.includes("nova")) return "Infrastructure";
  return "Corporate Services";
};

const deriveCategory = (itemName: string) => {
  const value = itemName.toLowerCase();
  if (["iphone", "dell", "samsung", "galaxy", "laptop"].some((keyword) => value.includes(keyword))) return "Electronics";
  if (["printer", "paper", "stationery"].some((keyword) => value.includes(keyword))) return "Office Supplies";
  if (["chair", "desk", "furniture"].some((keyword) => value.includes(keyword))) return "Furniture";
  if (["camera", "cctv", "security"].some((keyword) => value.includes(keyword))) return "Security";
  if (["cloud", "saas", "license"].some((keyword) => value.includes(keyword))) return "Cloud Services";
  return "General";
};

export default function OrganizationsPage() {
  const { clients, orders } = useData();
  const { users } = useAuth();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState("overview");
  const [showMail, setShowMail] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<Record<string, { sender: string; text: string; time: string }[]>>({
    cl1: [{ sender: "Jane Smith", text: "Hi team, please share the latest order delivery status.", time: "09:42 AM" }],
  });

  const organizations = useMemo(() => {
    return clients.map((client) => {
      const clientKey = normalizeName(client.name);
      const orgOrders = orders.filter((order) => {
        const orderKey = normalizeName(order.organization);
        return orderKey === clientKey || orderKey.includes(clientKey) || clientKey.includes(orderKey);
      });
      const orgUsers = users.filter((user) => {
        const userOrgKey = normalizeName(user.organization || "");
        return userOrgKey === clientKey || userOrgKey.includes(clientKey) || clientKey.includes(userOrgKey);
      });

      const now = new Date();
      const start = new Date(client.contractStart);
      const end = new Date(client.contractEnd);
      let contractStatus = "Active";
      if (end < now) contractStatus = "Expired";
      else if (start > now) contractStatus = "Pending";
      else if (client.status !== "active") contractStatus = "Inactive";

      const adminUser =
        orgUsers.find((user) => ["client_admin", "admin", "owner"].includes(user.role))?.name || client.contactPerson;

      return {
        id: client.id,
        name: client.name,
        industry: deriveIndustry(client.name),
        contactPerson: client.contactPerson,
        email: client.email,
        phone: client.phone,
        address: client.address,
        contractStatus,
        contractStart: client.contractStart,
        contractEnd: client.contractEnd,
        totalOrders: orgOrders.length,
        totalSpend: orgOrders.reduce((sum, order) => sum + order.totalAmount, 0),
        totalUsers: orgUsers.length,
        adminUser,
        registrationNumber: `REG-${client.id.toUpperCase()}`,
        orders: orgOrders,
        users: orgUsers,
      };
    });
  }, [clients, orders, users]);

  const industries = useMemo(
    () => Array.from(new Set(organizations.map((organization) => organization.industry))).sort(),
    [organizations],
  );

  const filteredOrganizations = useMemo(() => {
    return organizations.filter((organization) => {
      const query = search.toLowerCase();
      const matchesSearch =
        organization.name.toLowerCase().includes(query) ||
        organization.contactPerson.toLowerCase().includes(query) ||
        organization.adminUser.toLowerCase().includes(query);
      const matchesStatus = statusFilter === "all" || organization.contractStatus.toLowerCase() === statusFilter;
      const matchesIndustry = industryFilter === "all" || organization.industry === industryFilter;
      return matchesSearch && matchesStatus && matchesIndustry;
    });
  }, [industryFilter, organizations, search, statusFilter]);

  const selectedCompany = organizations.find((organization) => organization.id === selectedCompanyId) || null;

  const spendByCategory = useMemo(() => {
    if (!selectedCompany) return [];
    const totals = selectedCompany.orders.reduce<Record<string, number>>((accumulator, order) => {
      order.items.forEach((item) => {
        const category = deriveCategory(item.name);
        accumulator[category] = (accumulator[category] || 0) + item.totalCost;
      });
      return accumulator;
    }, {});

    return Object.entries(totals).map(([name, value]) => ({ name, value }));
  }, [selectedCompany]);

  const monthlySpend = useMemo(() => {
    if (!selectedCompany) return [];
    const totals = selectedCompany.orders.reduce<Record<string, number>>((accumulator, order) => {
      const month = new Date(order.orderDate).toLocaleString("en-US", { month: "short" });
      accumulator[month] = (accumulator[month] || 0) + order.totalAmount;
      return accumulator;
    }, {});

    return MONTH_ORDER.filter((month) => month in totals).map((month) => ({ month, spend: totals[month] }));
  }, [selectedCompany]);

  const orderDistribution = useMemo(() => {
    if (!selectedCompany) return [];
    const counts = selectedCompany.orders.reduce<Record<string, number>>((accumulator, order) => {
      accumulator[order.status] = (accumulator[order.status] || 0) + 1;
      return accumulator;
    }, {});

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [selectedCompany]);

  const sendChatMessage = () => {
    if (!selectedCompanyId || !chatMessage.trim()) return;
    const message = {
      sender: "Nido Tech",
      text: chatMessage.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setChatMessages((previous) => ({
      ...previous,
      [selectedCompanyId]: [...(previous[selectedCompanyId] || []), message],
    }));
    setChatMessage("");
    toast({ title: "Message queued", description: "Conversation updated for this organization." });
  };

  const copyContact = (value: string, label: string) => {
    navigator.clipboard.writeText(value);
    toast({ title: `${label} copied`, description: value });
  };

  if (selectedCompany) {
    const contractMeta = CONTRACT_STATUS_META[selectedCompany.contractStatus] || CONTRACT_STATUS_META.Inactive;

    return (
      <div>
        <Header title="Organization Details" />
        <div className="space-y-6 p-6 animate-fade-in">
          <Button variant="ghost" size="sm" onClick={() => setSelectedCompanyId(null)} className="w-fit gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Organizations
          </Button>

          <Card className="overflow-hidden border-border/80 shadow-sm">
            <CardContent className="space-y-6 p-6 lg:p-8">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-primary/15 bg-primary/10">
                    <Building2 className="h-8 w-8 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-2xl font-display font-bold tracking-tight">{selectedCompany.name}</h1>
                      <Badge variant="outline" className={contractMeta.badge}>
                        {selectedCompany.contractStatus} Contract
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {selectedCompany.industry} · Primary contact {selectedCompany.contactPerson}
                    </p>
                    <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                      <div>
                        <span className="font-medium text-foreground">Registration:</span> {selectedCompany.registrationNumber}
                      </div>
                      <div>
                        <span className="font-medium text-foreground">Admin:</span> {selectedCompany.adminUser}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-3 xl:min-w-[28rem]">
                  <Button variant="outline" className="gap-2" onClick={() => setShowMail(true)}>
                    <Mail className="h-4 w-4" /> Email
                  </Button>
                  <Button variant="outline" className="gap-2" onClick={() => copyContact(selectedCompany.phone, "Phone") }>
                    <Phone className="h-4 w-4" /> Call / Copy
                  </Button>
                  <Button className="gap-2" onClick={() => setDetailTab("communication")}>
                    <MessageSquare className="h-4 w-4" /> Chat Now
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                {[
                  { label: "Total Orders", value: selectedCompany.totalOrders, icon: ShoppingBag },
                  { label: "Total Spend", value: `$${selectedCompany.totalSpend.toLocaleString()}`, icon: DollarSign },
                  { label: "Total Users", value: selectedCompany.totalUsers, icon: Users },
                  { label: "Contract Start", value: selectedCompany.contractStart, icon: Calendar },
                  { label: "Contract End", value: selectedCompany.contractEnd, icon: Calendar },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="rounded-2xl border border-border/80 bg-muted/20 p-4">
                      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <p className="text-lg font-semibold tracking-tight">{item.value}</p>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{item.label}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Tabs value={detailTab} onValueChange={setDetailTab} className="space-y-6">
            <TabsList className="flex h-auto flex-wrap gap-2 rounded-2xl border border-border/70 bg-card p-2">
              <TabsTrigger value="overview">Company Overview</TabsTrigger>
              <TabsTrigger value="users">Users & Admin</TabsTrigger>
              <TabsTrigger value="purchases">Purchase History</TabsTrigger>
              <TabsTrigger value="analytics">Spend Analysis</TabsTrigger>
              <TabsTrigger value="communication">Communication</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Company Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 sm:grid-cols-2">
                    {[
                      ["Company Name", selectedCompany.name],
                      ["Industry", selectedCompany.industry],
                      ["Registration Number", selectedCompany.registrationNumber],
                      ["Contract Status", selectedCompany.contractStatus],
                      ["Contract Duration", `${selectedCompany.contractStart} → ${selectedCompany.contractEnd}`],
                      ["Primary Contact", selectedCompany.contactPerson],
                      ["Admin Name", selectedCompany.adminUser],
                      ["Total Users", String(selectedCompany.totalUsers)],
                      ["Total Orders", String(selectedCompany.totalOrders)],
                      ["Total Spend", `$${selectedCompany.totalSpend.toLocaleString()}`],
                      ["Contact Email", selectedCompany.email],
                      ["Phone", selectedCompany.phone],
                    ].map(([label, value]) => (
                      <div key={label} className="space-y-1 rounded-2xl border border-border/70 bg-muted/15 p-4">
                        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
                        <p className="text-sm font-medium leading-relaxed">{value}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Order Distribution</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="h-[260px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={orderDistribution} dataKey="value" innerRadius={65} outerRadius={95} paddingAngle={4}>
                            {orderDistribution.map((entry, index) => (
                              <Cell
                                key={entry.name}
                                fill={
                                  entry.name === "Approved"
                                    ? "hsl(var(--success))"
                                    : entry.name === "Pending"
                                      ? "hsl(var(--warning))"
                                      : entry.name === "Cancelled"
                                        ? "hsl(var(--destructive))"
                                        : CHART_COLORS[index % CHART_COLORS.length]
                                }
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid gap-2">
                      {orderDistribution.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No order history available for this organization yet.</p>
                      ) : (
                        orderDistribution.map((item) => (
                          <div key={item.name} className="flex items-center justify-between rounded-xl border border-border/70 px-4 py-3 text-sm">
                            <span>{item.name}</span>
                            <Badge variant="outline" className={ORDER_STATUS_META[item.name] || "border-border bg-muted text-muted-foreground"}>
                              {item.value}
                            </Badge>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Users & Admin Management</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="w-full">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedCompany.users.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                              No users are currently registered under this organization.
                            </TableCell>
                          </TableRow>
                        ) : (
                          selectedCompany.users.map((user) => (
                            <TableRow key={user.id}>
                              <TableCell className="font-medium">{user.name}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
                                  {ROLE_LABELS[user.role] || user.role.replace(/_/g, " ")}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground">{user.email}</TableCell>
                              <TableCell className="text-muted-foreground">{selectedCompany.phone}</TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={
                                    user.status === "active"
                                      ? "border-success/30 bg-success/10 text-success"
                                      : user.status === "suspended"
                                        ? "border-destructive/30 bg-destructive/10 text-destructive"
                                        : "border-border bg-muted text-muted-foreground"
                                  }
                                >
                                  {user.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="purchases">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Purchase History</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[560px] w-full">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order ID</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Items</TableHead>
                          <TableHead>Requested By</TableHead>
                          <TableHead>Approved By</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedCompany.orders.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                              No purchase history has been recorded for this organization.
                            </TableCell>
                          </TableRow>
                        ) : (
                          selectedCompany.orders.map((order) => (
                            <TableRow
                              key={order.id}
                              className="cursor-pointer transition-colors hover:bg-muted/40"
                              onClick={() => navigate(`/orders/${order.id}`)}
                            >
                              <TableCell className="font-mono text-xs font-semibold text-primary">{order.orderNumber}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">{order.orderDate}</TableCell>
                              <TableCell className="max-w-[22rem]">
                                <div className="space-y-2 text-xs">
                                  {order.items.map((item) => (
                                    <div key={item.id} className="rounded-xl border border-border/70 bg-muted/15 p-3">
                                      <p className="font-medium text-foreground">{item.name}</p>
                                      <p className="mt-1 text-muted-foreground">{item.description}</p>
                                      <p className="mt-1 text-muted-foreground">
                                        Qty {item.quantity} · ${item.totalCost.toLocaleString()}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell className="text-sm font-medium">{order.requestingUser}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">{order.approvingUser || "Awaiting approval"}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className={ORDER_STATUS_META[order.status] || "border-border bg-muted text-muted-foreground"}>
                                  {order.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right text-sm font-semibold">${order.totalAmount.toLocaleString()}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <div className="grid gap-6 xl:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Spend by Category</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={spendByCategory} dataKey="value" innerRadius={65} outerRadius={98} paddingAngle={4}>
                            {spendByCategory.map((entry, index) => (
                              <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, "Spend"]} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid gap-2">
                      {spendByCategory.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No category spend available yet.</p>
                      ) : (
                        spendByCategory.map((item, index) => (
                          <div key={item.name} className="flex items-center justify-between rounded-xl border border-border/70 px-4 py-3 text-sm">
                            <div className="flex items-center gap-3">
                              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                              <span>{item.name}</span>
                            </div>
                            <span className="font-semibold">${item.value.toLocaleString()}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Monthly Spend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[320px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlySpend}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} tickFormatter={(value) => `$${value / 1000}K`} />
                          <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, "Spend"]} />
                          <Bar dataKey="spend" fill="hsl(var(--primary))" radius={[10, 10, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="communication">
              <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <MessageSquare className="h-4 w-4 text-primary" /> Immediate Communication
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ScrollArea className="h-[360px] rounded-2xl border border-border/70 bg-muted/10 p-4">
                      <div className="space-y-3">
                        {(chatMessages[selectedCompany.id] || []).map((message, index) => (
                          <div
                            key={`${message.time}-${index}`}
                            className={`rounded-2xl border p-4 text-sm ${
                              message.sender === "Nido Tech"
                                ? "ml-8 border-primary/20 bg-primary/10"
                                : "mr-8 border-border bg-card"
                            }`}
                          >
                            <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                              <span className="font-semibold text-foreground">{message.sender}</span>
                              <span className="text-muted-foreground">{message.time}</span>
                            </div>
                            <p className="leading-relaxed text-foreground">{message.text}</p>
                          </div>
                        ))}
                        {!(chatMessages[selectedCompany.id] || []).length && (
                          <p className="py-16 text-center text-sm text-muted-foreground">
                            Start a direct conversation with {selectedCompany.contactPerson}.
                          </p>
                        )}
                      </div>
                    </ScrollArea>

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Input
                        placeholder={`Message ${selectedCompany.contactPerson}...`}
                        value={chatMessage}
                        onChange={(event) => setChatMessage(event.target.value)}
                        onKeyDown={(event) => event.key === "Enter" && sendChatMessage()}
                      />
                      <Button className="gap-2 sm:min-w-36" onClick={sendChatMessage}>
                        <Send className="h-4 w-4" /> Send
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Contact Center</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="space-y-4 rounded-2xl border border-border/70 bg-muted/15 p-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Primary Contact</p>
                        <p className="mt-1 text-base font-semibold">{selectedCompany.contactPerson}</p>
                      </div>
                      <Separator />
                      <button className="flex w-full items-center justify-between text-left text-sm" onClick={() => copyContact(selectedCompany.email, "Email")}>
                        <span className="inline-flex items-center gap-2 text-muted-foreground"><Mail className="h-4 w-4" /> Email</span>
                        <span className="max-w-[14rem] truncate font-medium text-foreground">{selectedCompany.email}</span>
                      </button>
                      <button className="flex w-full items-center justify-between text-left text-sm" onClick={() => copyContact(selectedCompany.phone, "Phone")}>
                        <span className="inline-flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4" /> Phone</span>
                        <span className="font-medium text-foreground">{selectedCompany.phone}</span>
                      </button>
                    </div>

                    <div className="grid gap-3">
                      <Button className="justify-start gap-2" onClick={() => setShowMail(true)}>
                        <Mail className="h-4 w-4" /> Send professional email
                      </Button>
                      <Button variant="outline" className="justify-start gap-2" onClick={() => setDetailTab("purchases") }>
                        <ShoppingBag className="h-4 w-4" /> Review purchase history
                      </Button>
                      <Button variant="outline" className="justify-start gap-2" onClick={() => copyContact(selectedCompany.address, "Address") }>
                        <Copy className="h-4 w-4" /> Copy company address
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <QuickMailComposer
          open={showMail}
          onClose={() => setShowMail(false)}
          recipientType="client"
          defaultTo={selectedCompany.email}
          defaultSubject={`Regarding ${selectedCompany.name} account activity`}
        />
      </div>
    );
  }

  return (
    <div>
      <Header title="Organizations" />
      <div className="space-y-6 p-6 animate-fade-in">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-2xl font-display font-bold tracking-tight">
              <Building2 className="h-7 w-7 text-primary" /> Organizations
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Browse all client organizations, open one from the table or dropdown, and review purchase history instantly.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="relative min-w-[15rem]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search companies..." className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="min-w-[11rem] gap-2">
                <Filter className="h-4 w-4" />
                <SelectValue placeholder="Contract status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Select value={industryFilter} onValueChange={setIndustryFilter}>
              <SelectTrigger className="min-w-[11rem]">
                <SelectValue placeholder="Industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All industries</SelectItem>
                {industries.map((industry) => (
                  <SelectItem key={industry} value={industry}>
                    {industry}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedCompanyId || ""} onValueChange={setSelectedCompanyId}>
              <SelectTrigger className="min-w-[14rem]">
                <SelectValue placeholder="Select company" />
              </SelectTrigger>
              <SelectContent>
                {organizations.map((organization) => (
                  <SelectItem key={organization.id} value={organization.id}>
                    {organization.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Organizations", value: organizations.length },
            { label: "Active Contracts", value: organizations.filter((organization) => organization.contractStatus === "Active").length },
            { label: "Total Orders", value: organizations.reduce((sum, organization) => sum + organization.totalOrders, 0) },
            { label: "Combined Spend", value: `$${organizations.reduce((sum, organization) => sum + organization.totalSpend, 0).toLocaleString()}` },
          ].map((item) => (
            <Card key={item.label} className="border-border/80">
              <CardContent className="p-5">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight">{item.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Organization List</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company Name</TableHead>
                    <TableHead>Industry</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>Total Users</TableHead>
                    <TableHead>Total Orders</TableHead>
                    <TableHead>Total Spend</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrganizations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                        No organizations matched your filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrganizations.map((organization) => {
                      const contractMeta = CONTRACT_STATUS_META[organization.contractStatus] || CONTRACT_STATUS_META.Inactive;
                      return (
                        <TableRow
                          key={organization.id}
                          className="cursor-pointer transition-colors hover:bg-muted/40"
                          onClick={() => setSelectedCompanyId(organization.id)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10">
                                <Building2 className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{organization.name}</p>
                                <p className="text-xs text-muted-foreground">{organization.contactPerson}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{organization.industry}</TableCell>
                          <TableCell>{organization.adminUser}</TableCell>
                          <TableCell>{organization.totalUsers}</TableCell>
                          <TableCell>{organization.totalOrders}</TableCell>
                          <TableCell className="font-medium">${organization.totalSpend.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={contractMeta.badge}>
                              {organization.contractStatus}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
