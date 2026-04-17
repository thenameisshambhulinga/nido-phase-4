import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useData } from "@/contexts/DataContext";
import {
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Filter,
  TrendingUp,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

export default function SLAOverview() {
  const { orders } = useData();
  const navigate = useNavigate();

  const withinSla = orders.filter((o) => o.slaStatus === "within_sla").length;
  const atRisk = orders.filter((o) => o.slaStatus === "at_risk").length;
  const breached = orders.filter((o) => o.slaStatus === "breached").length;
  const totalFindings = orders.length;
  const complianceRate = totalFindings
    ? Math.round((withinSla / totalFindings) * 100)
    : 0;
  const overduePercent = totalFindings
    ? Math.round((breached / totalFindings) * 100)
    : 0;

  // Compute mean remediation time (mock: hours since SLA start)
  const meanRemediationDays = useMemo(() => {
    if (!orders.length) return 0;
    const totalHours = orders.reduce((sum, o) => {
      const diff = Date.now() - new Date(o.slaStartTime).getTime();
      return sum + diff / 3600000;
    }, 0);
    return Math.round(totalHours / orders.length / 24);
  }, [orders]);

  // Sub-order level SLA data
  const subOrderData = useMemo(() => {
    const items: {
      orderId: string;
      subOrderId: string;
      item: string;
      category: string;
      slaStatus: string;
      org: string;
      analyst: string;
      team: string;
      slaStart: string;
    }[] = [];
    orders.forEach((o) => {
      o.items.forEach((item, i) => {
        const cat =
          item.name.includes("iPhone") ||
          item.name.includes("Dell") ||
          item.name.includes("Samsung") ||
          item.name.includes("Galaxy")
            ? "Electronics"
            : item.name.includes("Printer") || item.name.includes("Paper")
              ? "Office Supplies"
              : item.name.includes("Chair") || item.name.includes("Desk")
                ? "Furniture"
                : item.name.includes("Camera") || item.name.includes("CCTV")
                  ? "Security"
                  : item.name.includes("Switch") || item.name.includes("Router")
                    ? "Networking"
                    : "General";
        const slaStatuses = ["within_sla", "at_risk", "breached"];
        items.push({
          orderId: o.id,
          subOrderId: `${o.orderNumber}-${i + 1}`,
          item: item.name,
          category: cat,
          slaStatus:
            o.status === "Delivered"
              ? "within_sla"
              : o.slaStatus === "within_sla"
                ? slaStatuses[i % 2]
                : o.slaStatus,
          org: o.organization,
          analyst: o.assignedAnalyst,
          team: o.analystTeam,
          slaStart: new Date(
            new Date(o.slaStartTime).getTime() + i * 600000,
          ).toISOString(),
        });
      });
    });
    return items;
  }, [orders]);

  const subWithin = subOrderData.filter(
    (s) => s.slaStatus === "within_sla",
  ).length;
  const subAtRisk = subOrderData.filter(
    (s) => s.slaStatus === "at_risk",
  ).length;
  const subBreached = subOrderData.filter(
    (s) => s.slaStatus === "breached",
  ).length;

  const slaData = [
    { name: "Within SLA", value: subWithin, color: "hsl(142, 70%, 40%)" },
    { name: "At Risk", value: subAtRisk, color: "hsl(38, 92%, 50%)" },
    { name: "Breached", value: subBreached, color: "hsl(0, 84%, 60%)" },
  ];

  const orgData = [
    { name: "Within SLA", value: subWithin, color: "hsl(142, 70%, 45%)" },
    {
      name: "Overdue",
      value: subBreached + subAtRisk,
      color: "hsl(0, 80%, 55%)",
    },
    {
      name: "Closed",
      value: Math.floor(subWithin * 0.6),
      color: "hsl(210, 60%, 50%)",
    },
  ];

  // Severity-based remediation matrix
  const severities = ["Critical", "High", "Medium", "Low"];
  const sevColors: Record<string, string> = {
    Critical: "bg-red-500",
    High: "bg-orange-500",
    Medium: "bg-amber-500",
    Low: "bg-emerald-500",
  };
  const remediationData = severities.map((sev) => ({
    severity: sev,
    closed: {
      met: Math.floor(Math.random() * 50) + 10,
      missed: Math.floor(Math.random() * 800) + 100,
    },
    overdue: {
      under30: Math.floor(Math.random() * 300) + 3,
      over30: Math.floor(Math.random() * 20000) + 1000,
    },
    withinSla: {
      under30: Math.floor(Math.random() * 800) + 50,
      over30: Math.floor(Math.random() * 50000) + 10,
    },
  }));

  const kpiCards = [
    {
      title: "Mean Remediation Time",
      value: `${meanRemediationDays} Days`,
      subtitle: "Host + App · 90 days",
      color: "bg-cyan-600 text-white",
    },
    {
      title: "Percent of Findings Overdue",
      value: `${overduePercent}%`,
      subtitle: "Host + App · 30 days",
      color: "bg-teal-600 text-white",
    },
    {
      title: "SLA Success Performance",
      value: `${complianceRate}%`,
      subtitle: "Host + App · 30 days",
      color: "bg-emerald-600 text-white",
    },
    {
      title: "Total Findings Under SLA",
      value: `${subOrderData.length}`,
      subtitle: "Host",
      color: "bg-blue-600 text-white",
    },
    {
      title: "Findings Not Under SLA",
      value: `${subBreached}`,
      subtitle: "Host + App",
      color: "bg-slate-600 text-white",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Header title="SLA Overview" />
      <div className="space-y-6 p-6 animate-fade-in">
        <section className="relative overflow-hidden rounded-3xl border border-amber-200/70 bg-gradient-to-br from-slate-100 via-amber-50 to-blue-100 p-6 md:p-8">
          <div className="pointer-events-none absolute -right-16 -top-12 h-48 w-48 rounded-full bg-amber-400/15 blur-3xl" />
          <div className="pointer-events-none absolute -left-12 bottom-0 h-40 w-40 rounded-full bg-blue-500/15 blur-3xl" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-2 inline-flex rounded-full border border-amber-300/60 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-amber-700">
                SLA command center
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                SLA Overview
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600 md:text-base">
                A more legible view of remediation, organizational compliance,
                and item-level SLA health.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 self-start lg:self-auto"
            >
              <Filter className="h-3.5 w-3.5" /> Filters (0)
            </Button>
          </div>
        </section>

        {/* KPI Cards Row */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {kpiCards.map((kpi) => (
            <Card
              key={kpi.title}
              className={`${kpi.color} overflow-hidden border-0 shadow-xl`}
            >
              <CardContent className="p-4">
                <p className="text-2xl font-bold">{kpi.value}</p>
                <p className="text-xs opacity-90 mt-1">{kpi.title}</p>
                <p className="text-[10px] opacity-70 mt-2">{kpi.subtitle}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Remediation + Organizational SLA */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Remediation SLA Overview */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                <TrendingUp className="h-4 w-4 text-primary" /> Remediation SLA
                Overview
                <span className="text-xs text-muted-foreground ml-auto">
                  Host + App · 30 days
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Distribution</TableHead>
                    {severities.map((s) => (
                      <TableHead
                        key={s}
                        className="text-center text-xs"
                        colSpan={2}
                      >
                        <Badge
                          className={`${sevColors[s]} text-white text-[10px]`}
                        >
                          {s}
                        </Badge>
                      </TableHead>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableHead></TableHead>
                    {severities.map((s) => (
                      <>
                        <TableHead
                          key={`${s}-m`}
                          className="text-[10px] text-center text-emerald-600"
                        >
                          Met SLA
                        </TableHead>
                        <TableHead
                          key={`${s}-mi`}
                          className="text-[10px] text-center text-red-600"
                        >
                          Missed SLA
                        </TableHead>
                      </>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { label: "Closed", key: "closed" as const },
                    { label: "Overdue", key: "overdue" as const },
                    { label: "Within SLA", key: "withinSla" as const },
                  ].map((row) => (
                    <TableRow key={row.label}>
                      <TableCell className="font-medium text-xs">
                        {row.label}
                      </TableCell>
                      {remediationData.map((d) => {
                        const data = d[row.key];
                        const k1 = row.key === "closed" ? "met" : "under30";
                        const k2 = row.key === "closed" ? "missed" : "over30";
                        return (
                          <>
                            <TableCell
                              key={`${d.severity}-1`}
                              className="text-center text-xs font-medium"
                            >
                              {(data as any)[k1]}
                            </TableCell>
                            <TableCell
                              key={`${d.severity}-2`}
                              className="text-center text-xs text-red-600 font-medium"
                            >
                              {(data as any)[k2]}
                            </TableCell>
                          </>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Organizational SLA Overview */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Organizational SLA Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={orgData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, value }) => `${name}\n${value}`}
                    >
                      {orgData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3 flex flex-col justify-center">
                  <p className="font-medium text-sm">Total Findings</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Total Findings
                      </span>
                      <span className="font-bold text-primary">
                        {subOrderData.length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Findings Under SLA
                      </span>
                      <span className="font-bold text-emerald-600">
                        {subWithin}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Findings Not Under SLA
                      </span>
                      <span className="font-bold text-red-600">
                        {subBreached + subAtRisk}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* SLA Distribution + Compliance */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                SLA Distribution (Item-Level)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={slaData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {slaData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                SLA Compliance by Team
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {["IT Procurement", "Mobile", "Infrastructure", "Security"].map(
                (team, i) => {
                  const rate = [88, 75, 92, 81][i];
                  return (
                    <div key={team} className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span>{team}</span>
                        <span className="font-medium">{rate}%</span>
                      </div>
                      <Progress value={rate} className="h-2" />
                    </div>
                  );
                },
              )}
            </CardContent>
          </Card>
        </div>

        {/* SLA Remediation Table - Item Level */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              SLA Remediation Table (Item-Level)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sub-Order ID</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Analyst</TableHead>
                  <TableHead>SLA Status</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>Team</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subOrderData.map((s) => (
                  <TableRow
                    key={s.subOrderId}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/orders/${s.orderId}`)}
                  >
                    <TableCell className="font-mono font-medium text-primary text-xs">
                      {s.subOrderId}
                    </TableCell>
                    <TableCell className="text-xs">{s.item}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {s.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{s.org}</TableCell>
                    <TableCell className="text-xs">{s.analyst}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          s.slaStatus === "within_sla"
                            ? "bg-success text-success-foreground"
                            : s.slaStatus === "at_risk"
                              ? "bg-warning text-warning-foreground"
                              : "bg-destructive text-destructive-foreground"
                        }
                      >
                        {s.slaStatus
                          .replace("_", " ")
                          .replace(/\b\w/g, (c) => c.toUpperCase())}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {new Date(s.slaStart).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-xs">{s.team}</TableCell>
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
