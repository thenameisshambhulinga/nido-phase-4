import { useState, useMemo, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Search,
  Plus,
  FileText,
  Download,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Send,
  RefreshCw,
  Eye,
  Trash2,
  Mail,
} from "lucide-react";
import { useData, type Invoice as CoreInvoice } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/contexts/NotificationContext";
import ConfirmationDialog from "@/components/shared/ConfirmationDialog";

const generateInvoiceNumber = () => `INV-${Date.now().toString().slice(-6)}`;

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    icon: React.ElementType;
  }
> = {
  PAID: { label: "Paid", variant: "default", icon: CheckCircle2 },
  "PARTIALLY PAID": {
    label: "Partially Paid",
    variant: "secondary",
    icon: Clock,
  },
  OVERDUE: { label: "Overdue", variant: "destructive", icon: AlertTriangle },
  SENT: { label: "Sent", variant: "outline", icon: Send },
  DRAFT: { label: "Draft", variant: "secondary", icon: FileText },
};

export default function InvoicesPage() {
  const {
    vendors,
    clients,
    invoices,
    createInvoice,
    updateInvoice,
    deleteInvoice: removeInvoice,
    addAuditEntry,
  } = useData();
  const { user } = useAuth();
  const { addNotification, notifications } = useNotifications();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    tone: "default" | "destructive";
    onConfirm: () => void;
  }>({
    open: false,
    title: "",
    description: "",
    confirmLabel: "Confirm",
    tone: "default",
    onConfirm: () => {},
  });
  const [newInvoice, setNewInvoice] = useState({
    vendorOrClient: "",
    type: "client" as "vendor" | "client",
    dueDate: "",
    items: [{ description: "", quantity: 1, unitPrice: 0, total: 0 }],
    notes: "",
    autoReminder: true,
  });

  const invoiceRows = useMemo(
    () =>
      invoices.map((invoice) => ({
        ...invoice,
        amount: invoice.subtotal,
        tax: invoice.cgst + invoice.sgst,
        totalAmount: invoice.total,
        vendorOrClient:
          invoice.vendorOrClient || invoice.customerName || "Unknown",
        type: invoice.type || "client",
        issueDate: invoice.issueDate || invoice.invoiceDate,
        items: invoice.items.map((item) => ({
          description: item.description || item.itemName,
          quantity: item.quantity,
          unitPrice: item.rate,
          total: item.amount,
        })),
        autoReminder: invoice.autoReminder ?? true,
      })),
    [invoices],
  );

  // Automation: auto-mark overdue invoices
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const needsUpdate = invoiceRows.some(
      (inv) =>
        (inv.status === "SENT" || inv.status === "PARTIALLY PAID") &&
        inv.dueDate < today,
    );
    if (needsUpdate) {
      invoiceRows.forEach((inv) => {
        if (
          (inv.status === "SENT" || inv.status === "PARTIALLY PAID") &&
          inv.dueDate < today
        ) {
          updateInvoice(inv.id, { status: "OVERDUE" });
        }
      });
    }
  }, [invoiceRows, updateInvoice]);

  // Auto-detect 30+ day overdue invoices and send notification with drafted mail
  const overdueCheckDone = useRef(false);
  useEffect(() => {
    if (overdueCheckDone.current) return;
    overdueCheckDone.current = true;

    const today = new Date();
    const overdueInvoices = invoiceRows.filter((inv) => {
      if (inv.status !== "OVERDUE") return false;
      const dueDate = new Date(inv.dueDate);
      const daysPastDue = Math.floor(
        (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      return daysPastDue >= 30;
    });

    overdueInvoices.forEach((inv) => {
      // Check if we already sent a notification for this invoice
      const alreadyNotified = notifications.some(
        (n) => n.invoiceId === inv.id && n.type === "overdue_mail",
      );
      if (alreadyNotified) return;

      const daysPastDue = Math.floor(
        (today.getTime() - new Date(inv.dueDate).getTime()) /
          (1000 * 60 * 60 * 24),
      );

      const draftSubject = `Urgent: Payment Overdue — Invoice ${inv.invoiceNumber} (${daysPastDue} Days Past Due)`;
      const draftBody = `Dear ${inv.vendorOrClient},

We hope this message finds you well. This is an automated reminder regarding Invoice ${inv.invoiceNumber} dated ${inv.issueDate}, which was due on ${inv.dueDate}.

As of today, the payment of $${inv.totalAmount.toLocaleString()} is ${daysPastDue} days overdue.

Invoice Details:
• Invoice Number: ${inv.invoiceNumber}
• Issue Date: ${inv.issueDate}
• Due Date: ${inv.dueDate}
• Amount Due: $${inv.totalAmount.toLocaleString()}
• Items: ${inv.items.map((i) => i.description).join(", ")}

We kindly request that payment be processed at your earliest convenience. If payment has already been made, please disregard this notice and share the transaction reference for our records.

Should you have any questions or require a payment plan arrangement, please do not hesitate to contact us.

Best regards,
Accounts & Finance Team
NidoTech Platform`;

      addNotification({
        type: "overdue_mail",
        title: `Auto-Mail Drafted: ${inv.vendorOrClient}`,
        message: `Invoice ${inv.invoiceNumber} is ${daysPastDue} days overdue ($${inv.totalAmount.toLocaleString()}). An automated payment reminder has been drafted.`,
        invoiceId: inv.id,
        recipientName: inv.vendorOrClient,
        draftedMail: {
          subject: draftSubject,
          body: draftBody,
        },
      });

      addAuditEntry({
        user: "System",
        action: "Auto Overdue Mail Drafted",
        module: "Invoices",
        details: `Automated overdue reminder drafted for ${inv.invoiceNumber} to ${inv.vendorOrClient} (${daysPastDue} days overdue)`,
        ipAddress: "System",
        status: "success",
      });
    });

    if (overdueInvoices.length > 0) {
      const newMails = overdueInvoices.filter(
        (inv) =>
          !notifications.some(
            (n) => n.invoiceId === inv.id && n.type === "overdue_mail",
          ),
      );
      if (newMails.length > 0) {
        toast.warning(
          `${newMails.length} overdue invoice(s) detected — automated reminder mails drafted`,
          {
            duration: 6000,
          },
        );
      }
    }
  }, [invoiceRows, notifications, addNotification, addAuditEntry]);

  const filtered = useMemo(() => {
    return invoiceRows.filter((inv) => {
      const matchSearch =
        inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
        inv.vendorOrClient.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || inv.status === statusFilter;
      const matchType = typeFilter === "all" || inv.type === typeFilter;
      return matchSearch && matchStatus && matchType;
    });
  }, [invoiceRows, search, statusFilter, typeFilter]);

  const stats = useMemo(
    () => ({
      total: invoiceRows.reduce((s, i) => s + i.totalAmount, 0),
      paid: invoiceRows
        .filter((i) => i.status === "PAID")
        .reduce((s, i) => s + i.totalAmount, 0),
      pending: invoiceRows
        .filter((i) => i.status === "SENT" || i.status === "PARTIALLY PAID")
        .reduce((s, i) => s + i.totalAmount, 0),
      overdue: invoiceRows
        .filter((i) => i.status === "OVERDUE")
        .reduce((s, i) => s + i.totalAmount, 0),
    }),
    [invoiceRows],
  );

  const handleCreate = () => {
    const amount = newInvoice.items.reduce(
      (s, i) => s + i.quantity * i.unitPrice,
      0,
    );
    const tax = amount * 0.1;
    const invoice: CoreInvoice = {
      id: `draft-${Date.now()}`,
      invoiceNumber: generateInvoiceNumber(),
      vendorOrClient: newInvoice.vendorOrClient,
      type: newInvoice.type,
      invoiceDate: new Date().toISOString().split("T")[0],
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: newInvoice.dueDate,
      paymentTerms: "Due on Receipt",
      billingAddress: "",
      shippingAddress: "",
      placeOfSupply: "",
      emailRecipients: [],
      subtotal: amount,
      cgst: tax / 2,
      sgst: tax / 2,
      adjustment: 0,
      shippingCharges: 0,
      total: amount + tax,
      amountPaid: 0,
      balanceDue: amount + tax,
      status: "DRAFT",
      paymentStatus: "UNPAID",
      items: newInvoice.items.map((i, index) => ({
        id: `item-${index}`,
        itemName: i.description,
        description: i.description,
        hsnSac: "",
        quantity: i.quantity,
        rate: i.unitPrice,
        discount: 0,
        taxRate: 10,
        amount: i.quantity * i.unitPrice,
      })),
      notes: newInvoice.notes,
      termsAndConditions: "",
      bankDetails: "",
      autoReminder: newInvoice.autoReminder,
      createdBy: user?.name || "System",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    createInvoice(invoice);
    addAuditEntry({
      user: user?.name || "System",
      action: "Invoice Created",
      module: "Invoices",
      details: `Created invoice ${invoice.invoiceNumber} for ${invoice.vendorOrClient} ($${invoice.total.toLocaleString()})`,
      ipAddress: "192.168.1.1",
      status: "success",
    });
    setShowCreate(false);
    setNewInvoice({
      vendorOrClient: "",
      type: "client",
      dueDate: "",
      items: [{ description: "", quantity: 1, unitPrice: 0, total: 0 }],
      notes: "",
      autoReminder: true,
    });
    toast.success("Invoice created successfully");
  };

  const updateStatus = (id: string, status: CoreInvoice["status"]) => {
    const inv = invoiceRows.find((i) => i.id === id);
    updateInvoice(id, { status });
    addAuditEntry({
      user: user?.name || "System",
      action: `Invoice ${status}`,
      module: "Invoices",
      details: `Marked invoice ${inv?.invoiceNumber} as ${status}`,
      ipAddress: "192.168.1.1",
      status: "success",
    });
    toast.success(`Invoice marked as ${status}`);
    setSelectedInvoice(null);
  };

  const handleDeleteInvoice = (id: string) => {
    const inv = invoiceRows.find((i) => i.id === id);
    removeInvoice(id);
    addAuditEntry({
      user: user?.name || "System",
      action: "Invoice Deleted",
      module: "Invoices",
      details: `Deleted invoice ${inv?.invoiceNumber}`,
      ipAddress: "192.168.1.1",
      status: "success",
    });
    toast.success("Invoice deleted");
    setSelectedInvoice(null);
  };

  const sendReminder = (inv: (typeof invoiceRows)[number]) => {
    updateInvoice(inv.id, {
      lastReminderSent: new Date().toISOString().split("T")[0],
    });
    addAuditEntry({
      user: user?.name || "System",
      action: "Invoice Reminder Sent",
      module: "Invoices",
      details: `Payment reminder sent for ${inv.invoiceNumber} to ${inv.vendorOrClient}`,
      ipAddress: "192.168.1.1",
      status: "success",
    });
    toast.success(`Payment reminder sent to ${inv.vendorOrClient}`);
  };

  const exportPDF = (inv: (typeof invoiceRows)[number]) => {
    const content = `
INVOICE: ${inv.invoiceNumber}
==========================================
To: ${inv.vendorOrClient} (${inv.type})
Issue Date: ${inv.issueDate}
Due Date: ${inv.dueDate}
Status: ${inv.status.toUpperCase()}
------------------------------------------
ITEMS:
${inv.items.map((i) => `  ${i.description}\n  Qty: ${i.quantity} × $${i.unitPrice.toLocaleString()} = $${i.total.toLocaleString()}`).join("\n")}
------------------------------------------
Subtotal:  $${inv.amount.toLocaleString()}
Tax (10%): $${inv.tax.toLocaleString()}
TOTAL:     $${inv.totalAmount.toLocaleString()}
------------------------------------------
Notes: ${inv.notes || "N/A"}
==========================================
    `.trim();
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${inv.invoiceNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Invoice exported");
  };

  const exportAllCSV = () => {
    const headers =
      "Invoice #,Vendor/Client,Type,Issue Date,Due Date,Amount,Tax,Total,Status\n";
    const rows = invoiceRows
      .map(
        (i) =>
          `${i.invoiceNumber},${i.vendorOrClient},${i.type},${i.issueDate},${i.dueDate},${i.amount},${i.tax},${i.totalAmount},${i.status}`,
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "invoices_export.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("All invoices exported as CSV");
  };

  const kpiCards = [
    {
      title: "Total Invoiced",
      value: stats.total,
      icon: DollarSign,
      color: "text-primary",
    },
    {
      title: "Paid",
      value: stats.paid,
      icon: CheckCircle2,
      color: "text-[hsl(var(--success))]",
    },
    {
      title: "Pending",
      value: stats.pending,
      icon: Clock,
      color: "text-[hsl(var(--warning))]",
    },
    {
      title: "Overdue",
      value: stats.overdue,
      icon: AlertTriangle,
      color: "text-destructive",
    },
  ];

  const entityOptions = [
    ...vendors.map((v) => v.name),
    ...clients.map((c) => c.name),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Invoices</h1>
          <p className="text-sm text-muted-foreground">
            Manage invoices, track payments, and automate reminders
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportAllCSV}>
            <Download className="h-4 w-4 mr-1" /> Export CSV
          </Button>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-1" /> New Invoice
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => (
          <Card key={kpi.title} className="border-border/60">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`p-3 rounded-xl bg-muted ${kpi.color}`}>
                <kpi.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">
                  {kpi.title}
                </p>
                <p className="text-xl font-bold text-foreground">
                  ${kpi.value.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="border-border/60">
        <CardContent className="p-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search invoices..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <Filter className="h-3.5 w-3.5 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="PAID">Paid</SelectItem>
              <SelectItem value="PARTIALLY PAID">Partially Paid</SelectItem>
              <SelectItem value="OVERDUE">Overdue</SelectItem>
              <SelectItem value="SENT">Sent</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="vendor">Vendor</SelectItem>
              <SelectItem value="client">Client</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Invoice Table */}
      <Card className="border-border/60">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Invoice #</TableHead>
                <TableHead className="font-semibold">Vendor / Client</TableHead>
                <TableHead className="font-semibold">Type</TableHead>
                <TableHead className="font-semibold">Issue Date</TableHead>
                <TableHead className="font-semibold">Due Date</TableHead>
                <TableHead className="font-semibold text-right">
                  Total
                </TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold text-center">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-10 text-muted-foreground"
                  >
                    No invoices found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((inv) => {
                  const cfg = STATUS_CONFIG[inv.status];
                  const StatusIcon = cfg.icon;
                  return (
                    <TableRow
                      key={inv.id}
                      className="cursor-pointer hover:bg-muted/30"
                      onClick={() => setSelectedInvoice(inv)}
                    >
                      <TableCell className="font-medium text-primary">
                        {inv.invoiceNumber}
                      </TableCell>
                      <TableCell>{inv.vendorOrClient}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize text-xs">
                          {inv.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {inv.issueDate}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {inv.dueDate}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        ${inv.totalAmount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={cfg.variant} className="gap-1">
                          <StatusIcon className="h-3 w-3" /> {cfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className="text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setSelectedInvoice(inv)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => exportPDF(inv)}
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                          {(inv.status === "SENT" ||
                            inv.status === "PARTIALLY PAID" ||
                            inv.status === "OVERDUE") && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => sendReminder(inv)}
                            >
                              <Mail className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Automation Info */}
      <Card className="border-border/60 bg-muted/30">
        <CardContent className="p-4 flex items-start gap-3">
          <RefreshCw className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-foreground">
              Automation Active
            </p>
            <p className="text-xs text-muted-foreground">
              Invoices past their due date are automatically marked as{" "}
              <span className="text-destructive font-medium">Overdue</span>.
              Auto-reminders can be enabled per invoice to notify
              vendors/clients of upcoming or overdue payments.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Invoice</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type</Label>
                <Select
                  value={newInvoice.type}
                  onValueChange={(v) =>
                    setNewInvoice((p) => ({
                      ...p,
                      type: v as "vendor" | "client",
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="vendor">Vendor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={newInvoice.dueDate}
                  onChange={(e) =>
                    setNewInvoice((p) => ({ ...p, dueDate: e.target.value }))
                  }
                />
              </div>
            </div>
            <div>
              <Label>Vendor / Client</Label>
              <Select
                value={newInvoice.vendorOrClient}
                onValueChange={(v) =>
                  setNewInvoice((p) => ({ ...p, vendorOrClient: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {entityOptions.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {newInvoice.items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-3 gap-2">
                <div className="col-span-3">
                  <Label>Item Description</Label>
                  <Input
                    value={item.description}
                    onChange={(e) => {
                      const items = [...newInvoice.items];
                      items[idx].description = e.target.value;
                      setNewInvoice((p) => ({ ...p, items }));
                    }}
                  />
                </div>
                <div>
                  <Label>Qty</Label>
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => {
                      const items = [...newInvoice.items];
                      items[idx].quantity = +e.target.value;
                      setNewInvoice((p) => ({ ...p, items }));
                    }}
                  />
                </div>
                <div>
                  <Label>Unit Price</Label>
                  <Input
                    type="number"
                    value={item.unitPrice}
                    onChange={(e) => {
                      const items = [...newInvoice.items];
                      items[idx].unitPrice = +e.target.value;
                      setNewInvoice((p) => ({ ...p, items }));
                    }}
                  />
                </div>
                <div className="flex items-end">
                  <p className="text-sm font-medium pb-2">
                    ${(item.quantity * item.unitPrice).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setNewInvoice((p) => ({
                  ...p,
                  items: [
                    ...p.items,
                    { description: "", quantity: 1, unitPrice: 0, total: 0 },
                  ],
                }))
              }
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Item
            </Button>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={newInvoice.notes}
                onChange={(e) =>
                  setNewInvoice((p) => ({ ...p, notes: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!newInvoice.vendorOrClient || !newInvoice.dueDate}
            >
              Create Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog
        open={!!selectedInvoice}
        onOpenChange={() => setSelectedInvoice(null)}
      >
        <DialogContent className="max-w-lg">
          {selectedInvoice &&
            (() => {
              const inv = selectedInvoice;
              const cfg = STATUS_CONFIG[inv.status];
              const StatusIcon = cfg.icon;
              return (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                      <span>{inv.invoiceNumber}</span>
                      <Badge variant={cfg.variant} className="gap-1">
                        <StatusIcon className="h-3 w-3" /> {cfg.label}
                      </Badge>
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Vendor/Client</p>
                        <p className="font-medium">{inv.vendorOrClient}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Type</p>
                        <p className="font-medium capitalize">{inv.type}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Issue Date</p>
                        <p className="font-medium">{inv.issueDate}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Due Date</p>
                        <p className="font-medium">{inv.dueDate}</p>
                      </div>
                    </div>
                    <div className="border-t border-border pt-3">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">
                        ITEMS
                      </p>
                      {inv.items.map((item, i) => (
                        <div
                          key={i}
                          className="flex justify-between text-sm py-1"
                        >
                          <span>{item.description}</span>
                          <span className="font-medium">
                            ${item.total.toLocaleString()}
                          </span>
                        </div>
                      ))}
                      <div className="border-t border-border mt-2 pt-2 space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Subtotal
                          </span>
                          <span>${inv.amount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Tax (10%)
                          </span>
                          <span>${inv.tax.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-bold text-base">
                          <span>Total</span>
                          <span>${inv.totalAmount.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    {inv.notes && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground">
                          NOTES
                        </p>
                        <p className="text-sm">{inv.notes}</p>
                      </div>
                    )}
                    {inv.lastReminderSent && (
                      <p className="text-xs text-muted-foreground">
                        Last reminder sent: {inv.lastReminderSent}
                      </p>
                    )}
                  </div>
                  <DialogFooter className="flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportPDF(inv)}
                    >
                      <Download className="h-3.5 w-3.5 mr-1" /> Export
                    </Button>
                    {inv.status === "DRAFT" && (
                      <Button
                        size="sm"
                        onClick={() =>
                          setConfirmState({
                            open: true,
                            title: "Send Invoice",
                            description: `Send ${inv.invoiceNumber} now?`,
                            confirmLabel: "Send",
                            tone: "default",
                            onConfirm: () => updateStatus(inv.id, "SENT"),
                          })
                        }
                      >
                        <Send className="h-3.5 w-3.5 mr-1" /> Send
                      </Button>
                    )}
                    {(inv.status === "SENT" ||
                      inv.status === "PARTIALLY PAID") && (
                      <Button
                        size="sm"
                        onClick={() =>
                          setConfirmState({
                            open: true,
                            title: "Mark Invoice Paid",
                            description: `Mark ${inv.invoiceNumber} as paid?`,
                            confirmLabel: "Mark Paid",
                            tone: "default",
                            onConfirm: () => updateStatus(inv.id, "PAID"),
                          })
                        }
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Mark Paid
                      </Button>
                    )}
                    {inv.status === "OVERDUE" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => sendReminder(inv)}
                        >
                          <Mail className="h-3.5 w-3.5 mr-1" /> Send Reminder
                        </Button>
                        <Button
                          size="sm"
                          onClick={() =>
                            setConfirmState({
                              open: true,
                              title: "Mark Invoice Paid",
                              description: `Mark ${inv.invoiceNumber} as paid?`,
                              confirmLabel: "Mark Paid",
                              tone: "default",
                              onConfirm: () => updateStatus(inv.id, "PAID"),
                            })
                          }
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Mark
                          Paid
                        </Button>
                      </>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() =>
                        setConfirmState({
                          open: true,
                          title: "Delete Invoice",
                          description: `Delete ${inv.invoiceNumber}? This action cannot be undone.`,
                          confirmLabel: "Delete",
                          tone: "destructive",
                          onConfirm: () => handleDeleteInvoice(inv.id),
                        })
                      }
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                    </Button>
                  </DialogFooter>
                </>
              );
            })()}
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={confirmState.open}
        title={confirmState.title}
        description={confirmState.description}
        confirmLabel={confirmState.confirmLabel}
        tone={confirmState.tone}
        onOpenChange={(open) => setConfirmState((prev) => ({ ...prev, open }))}
        onConfirm={() => {
          confirmState.onConfirm();
          setConfirmState((prev) => ({ ...prev, open: false }));
        }}
      />
    </div>
  );
}
