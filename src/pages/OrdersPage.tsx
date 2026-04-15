import { useMemo, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { emailTemplates, sendEmail } from "@/lib/emailService";
import {
  Upload,
  Download,
  Search,
  Sparkles,
  Mail,
  CheckCircle2,
  XCircle,
  Eye,
  Clock3,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";

export default function OrdersPage() {
  const { orders, updateOrder, addAuditEntry } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [selected, setSelected] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState("");
  const [bulkComment, setBulkComment] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [teamFilter, setTeamFilter] = useState("all");

  const normalizedOrders = useMemo(
    () =>
      orders.map((order) => {
        const computedTotal =
          typeof order.totalAmount === "number" && order.totalAmount > 0
            ? order.totalAmount
            : (order.items || []).reduce(
                (sum, item) => sum + item.totalCost,
                0,
              );
        const normalizedStatus = (order.status || "New").toLowerCase();
        return {
          ...order,
          orderNumber: order.orderNumber || order.id,
          organization: order.organization || "Direct Customer",
          requestingUser: order.requestingUser || "Client User",
          assignedAnalyst:
            order.assignedAnalyst || order.assignedUser || "Unassigned",
          analystTeam: order.analystTeam || "Operations",
          totalAmount: computedTotal,
          statusLabel:
            normalizedStatus === "pending"
              ? "New"
              : normalizedStatus === "approved"
                ? "Processing"
                : normalizedStatus === "cancelled"
                  ? "Rejected"
                  : order.status || "New",
        };
      }),
    [orders],
  );

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    return normalizedOrders.filter((order) => {
      const matchesSearch =
        !query ||
        order.orderNumber.toLowerCase().includes(query) ||
        order.organization.toLowerCase().includes(query) ||
        order.requestingUser.toLowerCase().includes(query);
      const matchesStatus =
        statusFilter === "all" ||
        order.statusLabel.toLowerCase() === statusFilter.toLowerCase();
      const matchesTeam =
        teamFilter === "all" ||
        order.analystTeam.toLowerCase() === teamFilter.toLowerCase();
      return matchesSearch && matchesStatus && matchesTeam;
    });
  }, [normalizedOrders, search, statusFilter, teamFilter]);

  const orderStats = useMemo(() => {
    const total = normalizedOrders.length;
    const newCount = normalizedOrders.filter(
      (order) => order.statusLabel.toLowerCase() === "new",
    ).length;
    const processingCount = normalizedOrders.filter(
      (order) => order.statusLabel.toLowerCase() === "processing",
    ).length;
    const riskCount = normalizedOrders.filter(
      (order) =>
        order.slaStatus === "at_risk" || order.slaStatus === "breached",
    ).length;
    return { total, newCount, processingCount, riskCount };
  }, [normalizedOrders]);

  const allChecked = useMemo(
    () =>
      filteredOrders.length > 0 && selected.length === filteredOrders.length,
    [filteredOrders.length, selected.length],
  );

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const toggleAll = () => {
    if (allChecked) {
      setSelected([]);
      return;
    }
    setSelected(filteredOrders.map((order) => order.id));
  };

  const getRecipientEmail = (orderNumber: string, organization: string) => {
    const company = organization
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "")
      .slice(0, 18);
    return company
      ? `procurement@${company}.com`
      : `order-${orderNumber}@client.com`;
  };

  const notifyClient = async (
    kind: "approved" | "rejected",
    order: (typeof normalizedOrders)[number],
    reason?: string,
  ) => {
    const recipient = getRecipientEmail(order.orderNumber, order.organization);
    if (kind === "approved") {
      await sendEmail(
        recipient,
        emailTemplates.orderApproved({
          id: order.orderNumber,
          shippingInfo: {
            email: recipient,
            fullName: order.requestingUser,
          },
          total: order.totalAmount,
        }),
      );
      return;
    }

    await sendEmail(
      recipient,
      emailTemplates.orderRejected({
        id: order.orderNumber,
        shippingInfo: {
          email: recipient,
          fullName: order.requestingUser,
        },
        rejectionReason: reason,
      }),
    );
  };

  const handleApprove = async (orderId: string) => {
    const order = normalizedOrders.find((entry) => entry.id === orderId);
    if (!order) return;

    updateOrder(orderId, {
      status: "Processing",
      approvingUser: user?.name || "System Owner",
      comments: "Approved by procurement owner and moved to processing.",
      commentHistory: [
        ...(order.commentHistory || []),
        {
          id: `c-${Date.now()}-${orderId}`,
          user: user?.name || "System Owner",
          text: "Order approved and moved to processing for vendor assignment.",
          timestamp: new Date().toISOString(),
          type: "internal",
        },
      ],
    });

    await notifyClient("approved", order);
    addAuditEntry({
      module: "Procure",
      action: "Order Approved",
      user: user?.name || "System Owner",
      details: `Order ${order.orderNumber} approved and moved to Processing.`,
      ipAddress: "192.168.1.1",
      status: "success",
    });
    toast({ title: `Order ${order.orderNumber} approved` });
  };

  const handleReject = async (orderId: string) => {
    const order = normalizedOrders.find((entry) => entry.id === orderId);
    if (!order) return;
    const reason =
      "Rejected after procurement review due to policy or stock constraints.";

    updateOrder(orderId, {
      status: "Rejected",
      comments: reason,
      commentHistory: [
        ...(order.commentHistory || []),
        {
          id: `c-${Date.now()}-${orderId}`,
          user: user?.name || "System Owner",
          text: reason,
          timestamp: new Date().toISOString(),
          type: "internal",
        },
      ],
    });

    await notifyClient("rejected", order, reason);
    addAuditEntry({
      module: "Procure",
      action: "Order Rejected",
      user: user?.name || "System Owner",
      details: `Order ${order.orderNumber} rejected.`,
      ipAddress: "192.168.1.1",
      status: "success",
    });
    toast({ title: `Order ${order.orderNumber} rejected` });
  };

  const statusTone = (status: string) => {
    const normalized = status.toLowerCase();
    if (normalized === "new")
      return "bg-blue-100 text-blue-700 border-blue-300";
    if (normalized === "processing")
      return "bg-amber-100 text-amber-700 border-amber-300";
    if (normalized === "completed")
      return "bg-emerald-100 text-emerald-700 border-emerald-300";
    if (normalized === "rejected" || normalized === "cancelled")
      return "bg-rose-100 text-rose-700 border-rose-300";
    return "bg-muted text-muted-foreground border-border";
  };

  const applyBulk = () => {
    if (!bulkAction) {
      toast({ title: "Select a bulk action" });
      return;
    }
    if (selected.length === 0) {
      toast({ title: "Select at least one order" });
      return;
    }

    selected.forEach((id) => {
      const target = normalizedOrders.find((o) => o.id === id);
      if (!target) return;

      if (bulkAction === "complete") {
        updateOrder(id, { status: "Completed" });
        return;
      }

      if (bulkAction === "cancel") {
        updateOrder(id, { status: "Rejected" });
        return;
      }

      if (bulkAction === "approve") {
        updateOrder(id, { status: "Processing" });
        return;
      }

      if (bulkAction === "comments") {
        updateOrder(id, {
          comments: bulkComment || "Bulk comment updated",
          commentHistory: [
            ...(target.commentHistory || []),
            {
              id: `c-${Date.now()}-${id}`,
              user: "System",
              text: bulkComment || "Bulk comment updated",
              timestamp: new Date().toISOString(),
              type: "internal",
            },
          ],
        });
      }
    });

    toast({ title: "Bulk update applied" });
    setSelected([]);
    setBulkComment("");
    setBulkAction("");
  };

  const onUploadTemplate = (evt: ChangeEvent<HTMLInputElement>) => {
    const file = evt.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast({ title: "Upload a CSV template only" });
      return;
    }
    setTemplateName(file.name);
    toast({ title: `Template ${file.name} uploaded` });
  };

  const downloadTemplate = () => {
    const headers = ["order_number", "status", "comments", "assigned_user"];
    const sample = ["2498563", "Processing", "Urgent order", "Mark Adams"];
    const csv = [headers, sample].map((r) => r.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "order-bulk-template.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Template downloaded" });
  };

  return (
    <div>
      <Header title="Procure Orders" />

      <div className="p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    Total Orders
                  </p>
                  <p className="mt-2 text-3xl font-semibold">
                    {orderStats.total}
                  </p>
                </div>
                <Sparkles className="h-6 w-6 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-white">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    New Requests
                  </p>
                  <p className="mt-2 text-3xl font-semibold">
                    {orderStats.newCount}
                  </p>
                </div>
                <Clock3 className="h-6 w-6 text-indigo-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-white">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    Processing
                  </p>
                  <p className="mt-2 text-3xl font-semibold">
                    {orderStats.processingCount}
                  </p>
                </div>
                <ShieldCheck className="h-6 w-6 text-amber-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-rose-200 bg-gradient-to-br from-rose-50 to-white">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    SLA Risk
                  </p>
                  <p className="mt-2 text-3xl font-semibold">
                    {orderStats.riskCount}
                  </p>
                </div>
                <AlertTriangle className="h-6 w-6 text-rose-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Procurement Queue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 xl:grid-cols-[1fr_190px_190px_220px_auto_auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search order, client, requester"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>

              <Select value={teamFilter} onValueChange={setTeamFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                  {Array.from(
                    new Set(
                      normalizedOrders.map((order) =>
                        (order.analystTeam || "Operations").toLowerCase(),
                      ),
                    ),
                  ).map((team) => (
                    <SelectItem key={team} value={team}>
                      {team.replace(/\b\w/g, (char) => char.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={bulkAction} onValueChange={setBulkAction}>
                <SelectTrigger>
                  <SelectValue placeholder="Bulk Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approve">Approve to Processing</SelectItem>
                  <SelectItem value="complete">Mark Completed</SelectItem>
                  <SelectItem value="cancel">Reject Orders</SelectItem>
                  <SelectItem value="comments">Add Internal Comment</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={applyBulk}>Apply</Button>

              <div className="flex items-center gap-2">
                <label className="inline-flex">
                  <input
                    className="hidden"
                    type="file"
                    accept=".csv"
                    onChange={onUploadTemplate}
                  />
                  <Button variant="outline" asChild>
                    <span>
                      <Upload className="mr-1 h-4 w-4" /> Template
                    </span>
                  </Button>
                </label>
                <Button variant="outline" onClick={downloadTemplate}>
                  <Download className="mr-1 h-4 w-4" /> CSV
                </Button>
              </div>
            </div>

            {bulkAction === "comments" && (
              <Input
                placeholder="Enter internal comment for selected orders"
                value={bulkComment}
                onChange={(event) => setBulkComment(event.target.value)}
              />
            )}

            {templateName && (
              <p className="text-xs text-muted-foreground">
                Uploaded Template: {templateName}
              </p>
            )}

            <div className="overflow-hidden rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={allChecked}
                        onCheckedChange={toggleAll}
                      />
                    </TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>SLA</TableHead>
                    <TableHead>Assigned</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow
                      key={order.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/orders/${order.id}`)}
                    >
                      <TableCell onClick={(event) => event.stopPropagation()}>
                        <Checkbox
                          checked={selected.includes(order.id)}
                          onCheckedChange={() => toggle(order.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-primary">
                          #{order.orderNumber}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.orderDate).toLocaleDateString()}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{order.organization}</p>
                        <p className="text-xs text-muted-foreground">
                          {order.requestingUser}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={statusTone(order.statusLabel)}
                          variant="outline"
                        >
                          {order.statusLabel}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            order.slaStatus === "within_sla"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : order.slaStatus === "at_risk"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-rose-50 text-rose-700 border-rose-200"
                          }
                        >
                          {order.slaStatus.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{order.assignedAnalyst}</p>
                        <p className="text-xs text-muted-foreground">
                          {order.analystTeam}
                        </p>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${order.totalAmount.toLocaleString()}
                      </TableCell>
                      <TableCell
                        className="text-right"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => navigate(`/orders/${order.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => void handleApprove(order.id)}
                            title="Approve"
                          >
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => void handleReject(order.id)}
                            title="Reject"
                          >
                            <XCircle className="h-4 w-4 text-rose-600" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() =>
                              void sendEmail(
                                getRecipientEmail(
                                  order.orderNumber,
                                  order.organization,
                                ),
                                emailTemplates.orderConfirmation({
                                  id: order.orderNumber,
                                  orderDate: order.orderDate,
                                  total: order.totalAmount,
                                  items: order.items,
                                  shippingInfo: {
                                    email: getRecipientEmail(
                                      order.orderNumber,
                                      order.organization,
                                    ),
                                    fullName: order.requestingUser,
                                  },
                                }),
                              )
                            }
                            title="Send Mail"
                          >
                            <Mail className="h-4 w-4 text-blue-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}

                  {filteredOrders.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="py-10 text-center text-muted-foreground"
                      >
                        No orders match the active filters.
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
