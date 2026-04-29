import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useData } from "@/contexts/DataContext";
import { safeReadJson } from "@/lib/storage";
import { normalizeOrderCode } from "@/lib/documentNumbering";
import {
  BellRing,
  Building2,
  Clock3,
  Eye,
  ShieldAlert,
  ShieldCheck,
  Truck,
} from "lucide-react";

const SLA_REMINDER_STORAGE_KEY = "nido_sla_reminders_v1";

type SlaReminder = {
  id: string;
  note: string;
  remindAt: string;
  status: "pending" | "completed" | "dismissed";
  createdAt: string;
};

type VendorOrderRow = {
  orderId: string;
  orderNumber: string;
  orderDate: string;
  orderStatus: string;
  slaStatus: "within_sla" | "at_risk" | "breached";
  organization: string;
  vendorId: string;
  vendorName: string;
  assignedItems: number;
  totalItems: number;
  totalAmount: number;
  reminderCount: number;
  dueReminderCount: number;
  elapsedMs: number;
};

const getSlaTone = (slaStatus: VendorOrderRow["slaStatus"]) => {
  if (slaStatus === "within_sla") {
    return "bg-emerald-100 text-emerald-700 border-emerald-300";
  }
  if (slaStatus === "at_risk") {
    return "bg-amber-100 text-amber-700 border-amber-300";
  }
  return "bg-rose-100 text-rose-700 border-rose-300";
};

const getStatusTone = (status: string) => {
  const normalized = status.toLowerCase();
  if (normalized === "delivered" || normalized === "completed") {
    return "bg-emerald-100 text-emerald-700 border-emerald-300";
  }
  if (normalized === "processing" || normalized === "approved") {
    return "bg-blue-100 text-blue-700 border-blue-300";
  }
  if (normalized === "cancelled" || normalized === "rejected") {
    return "bg-rose-100 text-rose-700 border-rose-300";
  }
  return "bg-muted text-muted-foreground border-border";
};

const toReadableDuration = (elapsedMs: number) => {
  const safeMs = Math.max(0, elapsedMs);
  const totalMinutes = Math.floor(safeMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

export default function VendorOrdersPage() {
  const navigate = useNavigate();
  const { orders, vendors } = useData();
  const [search, setSearch] = useState("");
  const [vendorFilter, setVendorFilter] = useState("all");
  const [slaFilter, setSlaFilter] = useState("all");

  const openSlaView = (orderId: string, vendorId: string) => {
    navigate(`/procure/orders/${orderId}?vendorId=${vendorId}#sla-overall`);
  };

  const rows = useMemo(() => {
    const reminders = safeReadJson<Record<string, SlaReminder[]>>(
      SLA_REMINDER_STORAGE_KEY,
      {},
    );

    const derivedRows: VendorOrderRow[] = [];

    orders.forEach((order) => {
      const vendorItemCounter = new Map<string, number>();

      order.items.forEach((item) => {
        const assignedVendorId = item.vendorId || order.vendorId || "";
        if (!assignedVendorId) return;
        vendorItemCounter.set(
          assignedVendorId,
          (vendorItemCounter.get(assignedVendorId) || 0) + 1,
        );
      });

      vendorItemCounter.forEach((assignedItems, vendorId) => {
        const vendor = vendors.find((entry) => entry.id === vendorId);
        if (!vendor) return;

        const orderReminders = (reminders[order.id] || []).filter(
          (entry) => entry.status === "pending",
        );

        const now = Date.now();
        const dueReminderCount = orderReminders.filter(
          (entry) => new Date(entry.remindAt).getTime() <= now,
        ).length;

        derivedRows.push({
          orderId: order.id,
          orderNumber: normalizeOrderCode(order.orderNumber || order.id),
          orderDate: order.orderDate,
          orderStatus: order.status,
          slaStatus: order.slaStatus,
          organization: order.organization,
          vendorId,
          vendorName: vendor.name,
          assignedItems,
          totalItems: order.items.length,
          totalAmount: order.totalAmount,
          reminderCount: orderReminders.length,
          dueReminderCount,
          elapsedMs: Date.now() - new Date(order.slaStartTime).getTime(),
        });
      });
    });

    return derivedRows.sort((a, b) => {
      const aTime = new Date(a.orderDate).getTime();
      const bTime = new Date(b.orderDate).getTime();
      return bTime - aTime;
    });
  }, [orders, vendors]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesSearch =
        !query ||
        row.orderNumber.toLowerCase().includes(query) ||
        row.vendorName.toLowerCase().includes(query) ||
        row.organization.toLowerCase().includes(query);
      const matchesVendor =
        vendorFilter === "all" || row.vendorId === vendorFilter;
      const matchesSla = slaFilter === "all" || row.slaStatus === slaFilter;
      return matchesSearch && matchesVendor && matchesSla;
    });
  }, [rows, search, vendorFilter, slaFilter]);

  const metrics = useMemo(() => {
    const total = filteredRows.length;
    const withinSla = filteredRows.filter(
      (entry) => entry.slaStatus === "within_sla",
    ).length;
    const breached = filteredRows.filter(
      (entry) => entry.slaStatus === "breached",
    ).length;
    const atRisk = filteredRows.filter(
      (entry) => entry.slaStatus === "at_risk",
    ).length;
    const dueReminders = filteredRows.reduce(
      (sum, entry) => sum + entry.dueReminderCount,
      0,
    );
    return { total, withinSla, breached, atRisk, dueReminders };
  }, [filteredRows]);

  return (
    <div>
      <Header title="Vendor Orders" />

      <div className="space-y-6 p-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    Vendor Assignments
                  </p>
                  <p className="mt-2 text-3xl font-semibold">{metrics.total}</p>
                </div>
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-white">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    At Risk SLA
                  </p>
                  <p className="mt-2 text-3xl font-semibold">
                    {metrics.atRisk}
                  </p>
                </div>
                <ShieldAlert className="h-6 w-6 text-amber-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-rose-200 bg-gradient-to-br from-rose-50 to-white">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    SLA Breaches
                  </p>
                  <p className="mt-2 text-3xl font-semibold">
                    {metrics.breached}
                  </p>
                </div>
                <ShieldCheck className="h-6 w-6 text-rose-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-violet-200 bg-gradient-to-br from-violet-50 to-white">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    Due Reminders
                  </p>
                  <p className="mt-2 text-3xl font-semibold">
                    {metrics.dueReminders}
                  </p>
                </div>
                <BellRing className="h-6 w-6 text-violet-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">
              Vendor Order Control Tower
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 lg:grid-cols-[1fr_220px_220px]">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by order number, vendor, or organization"
              />
              <Select value={vendorFilter} onValueChange={setVendorFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter vendor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vendors</SelectItem>
                  {vendors.map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={slaFilter} onValueChange={setSlaFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter SLA" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All SLA</SelectItem>
                  <SelectItem value="within_sla">Within SLA</SelectItem>
                  <SelectItem value="at_risk">At Risk</SelectItem>
                  <SelectItem value="breached">Breached</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Assigned Scope</TableHead>
                    <TableHead>SLA Elapsed</TableHead>
                    <TableHead>SLA</TableHead>
                    <TableHead>Reminders</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.map((row) => (
                    <TableRow key={`${row.orderId}-${row.vendorId}`}>
                      <TableCell>
                        <div>
                          <button
                            className="font-medium text-primary hover:underline"
                            onClick={() =>
                              openSlaView(row.orderId, row.vendorId)
                            }
                          >
                            {row.orderNumber}
                          </button>
                          <div className="mt-1 flex items-center gap-2">
                            <p className="text-xs text-muted-foreground">
                              {row.orderDate}
                            </p>
                            <Badge
                              className={getStatusTone(row.orderStatus)}
                              variant="outline"
                            >
                              {row.orderStatus}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{row.vendorName}</p>
                          <p className="text-xs text-muted-foreground">
                            {row.organization}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {row.assignedItems}/{row.totalItems} items
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-2 text-sm">
                          <Clock3 className="h-4 w-4 text-muted-foreground" />
                          {toReadableDuration(row.elapsedMs)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={getSlaTone(row.slaStatus)}
                          variant="outline"
                        >
                          {row.slaStatus.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{row.reminderCount}</Badge>
                          {row.dueReminderCount > 0 && (
                            <Badge
                              className="bg-rose-100 text-rose-700 border-rose-300"
                              variant="outline"
                            >
                              {row.dueReminderCount} due
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${row.totalAmount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => openSlaView(row.orderId, row.vendorId)}
                        >
                          <Eye className="h-4 w-4" /> View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}

                  {filteredRows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="py-10 text-center">
                        <div className="space-y-2">
                          <p className="text-sm font-medium">
                            No vendor orders found
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Assign vendors in procure order details and they
                            will appear here.
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => navigate("/orders")}
                          >
                            <Truck className="h-4 w-4" /> Go to Procure Orders
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card
          id="sla-overall"
          className="rounded-2xl border border-slate-200 shadow-sm"
        >
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm">SLA Overview</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  Live vendor SLA status with quick actions for procurement.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => navigate("/orders")}
              >
                <Truck className="h-4 w-4" /> Open Procure Orders
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-emerald-700/80">
                  Within SLA
                </p>
                <p className="mt-2 text-3xl font-semibold text-emerald-800">
                  {metrics.withinSla}
                </p>
              </div>
              <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-amber-700/80">
                  At Risk
                </p>
                <p className="mt-2 text-3xl font-semibold text-amber-800">
                  {metrics.atRisk}
                </p>
              </div>
              <div className="rounded-2xl border border-rose-100 bg-rose-50/70 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-rose-700/80">
                  Breached
                </p>
                <p className="mt-2 text-3xl font-semibold text-rose-800">
                  {metrics.breached}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                  Due Reminders
                </p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">
                  {metrics.dueReminders}
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-100">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>SLA Elapsed</TableHead>
                    <TableHead>SLA Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.slice(0, 4).map((row) => (
                    <TableRow key={`sla-${row.orderId}-${row.vendorId}`}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-slate-900">
                            {row.orderNumber}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {row.organization}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{row.vendorName}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-2 text-sm">
                          <Clock3 className="h-4 w-4 text-muted-foreground" />
                          {toReadableDuration(row.elapsedMs)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={getSlaTone(row.slaStatus)}
                          variant="outline"
                        >
                          {row.slaStatus.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => openSlaView(row.orderId, row.vendorId)}
                        >
                          <Eye className="h-4 w-4" /> View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredRows.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="py-8 text-center text-muted-foreground"
                      >
                        No SLA data available.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
