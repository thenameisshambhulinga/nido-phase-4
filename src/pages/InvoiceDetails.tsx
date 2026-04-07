import { memo, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import Header from "@/components/layout/Header";
import InvoicePDF from "@/components/sales/InvoicePDF";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useData } from "@/contexts/DataContext";
import { toast } from "@/hooks/use-toast";
import {
  ChevronDown,
  Download,
  Edit3,
  Mail,
  Printer,
  Share2,
  Wallet,
} from "lucide-react";
import type { Invoice } from "@/contexts/DataContext";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const statusVariant: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  DRAFT: "secondary",
  SENT: "outline",
  "PARTIALLY PAID": "outline",
  PAID: "default",
  OVERDUE: "destructive",
  UNPAID: "secondary",
};

const InvoiceSummary = memo(function InvoiceSummary({
  invoice,
}: {
  invoice: Invoice;
}) {
  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">Tax Invoice</CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant={statusVariant[invoice.status] || "outline"}>
            {invoice.status}
          </Badge>
          <Badge variant={statusVariant[invoice.paymentStatus] || "outline"}>
            {invoice.paymentStatus}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border bg-gradient-to-br from-slate-50 to-white p-5 shadow-sm">
            <div className="mb-4 h-14 w-28 rounded-xl bg-gradient-to-br from-orange-500 via-amber-400 to-sky-600" />
            <p className="text-sm font-semibold text-slate-900">
              Nido Technologies
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">
              No. 41/1, 2nd Floor, 10th Cross
              {"\n"}11th Main, Wilson Garden
              {"\n"}Bangalore Karnataka 560027
              {"\n"}GSTIN 29BPAPP1867G1ZN
            </p>
          </div>
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Customer
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {invoice.customerName || invoice.vendorOrClient || "-"}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Invoice#: {invoice.invoiceNumber}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Date: {invoice.invoiceDate || invoice.issueDate}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Due Date: {invoice.dueDate}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Bill To
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-900">
              {invoice.customerName || invoice.vendorOrClient || "-"}
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">
              {invoice.billingAddress}
            </p>
          </div>
          <div className="md:text-right">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Ship To
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-900">
              {invoice.customerName || invoice.vendorOrClient || "-"}
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600 md:ml-auto md:max-w-sm">
              {invoice.shippingAddress}
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-900 hover:bg-slate-900">
                <TableHead className="text-white">#</TableHead>
                <TableHead className="text-white">Item & Description</TableHead>
                <TableHead className="text-white">HSN/SAC</TableHead>
                <TableHead className="text-white text-right">Qty</TableHead>
                <TableHead className="text-white text-right">Rate</TableHead>
                <TableHead className="text-white text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.items.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    <p className="font-medium text-slate-900">
                      {item.itemName}
                    </p>
                    <p className="text-xs text-slate-500">{item.description}</p>
                  </TableCell>
                  <TableCell>{item.hsnSac || "-"}</TableCell>
                  <TableCell className="text-right">
                    {item.quantity.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    {currency.format(item.rate)}
                  </TableCell>
                  <TableCell className="text-right">
                    {currency.format(item.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_340px]">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-slate-800">Notes</p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                {invoice.notes || "-"}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                Terms & Conditions
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                {invoice.termsAndConditions || "-"}
              </p>
            </div>
          </div>
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between py-1 text-sm">
              <span>Subtotal</span>
              <span>{currency.format(invoice.subtotal)}</span>
            </div>
            <div className="flex items-center justify-between py-1 text-sm">
              <span>CGST</span>
              <span>{currency.format(invoice.cgst)}</span>
            </div>
            <div className="flex items-center justify-between py-1 text-sm">
              <span>SGST</span>
              <span>{currency.format(invoice.sgst)}</span>
            </div>
            <div className="flex items-center justify-between py-1 text-sm">
              <span>Shipping</span>
              <span>{currency.format(invoice.shippingCharges ?? 0)}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex items-center justify-between rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
              <span>Total</span>
              <span>{currency.format(invoice.total)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900">
              <span>Balance Due</span>
              <span>{currency.format(invoice.balanceDue)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

export default function InvoiceDetails() {
  const navigate = useNavigate();
  const { id = "" } = useParams();
  const { invoices, updateInvoice, sendEmail, getActivities, generalSettings } =
    useData();
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [editDraft, setEditDraft] = useState({
    paymentTerms: "",
    dueDate: "",
    notes: "",
    termsAndConditions: "",
    shippingCharges: 0,
  });
  const printRef = useRef<HTMLDivElement>(null);
  const companyLogoUrl = Object.values(generalSettings).find(
    (setting) => setting.companyLogo,
  )?.companyLogo;

  const invoice = useMemo(
    () => invoices.find((entry) => entry.id === id) || null,
    [id, invoices],
  );

  const reactToPrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: invoice ? `Invoice-${invoice.invoiceNumber}` : "Invoice",
    pageStyle:
      "@page { size: A4; margin: 12mm; } @media print { html, body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; } body * { visibility: hidden; } #print-area, #print-area * { visibility: visible; } #print-area { position: absolute; top: 0; left: 0; width: 100%; background: white; } }",
  });

  useEffect(() => {
    if (!invoice) return;
    setEditDraft({
      paymentTerms: invoice.paymentTerms,
      dueDate: invoice.dueDate,
      notes: invoice.notes,
      termsAndConditions: invoice.termsAndConditions,
      shippingCharges: invoice.shippingCharges ?? 0,
    });
  }, [invoice]);

  if (!invoice) {
    return (
      <div>
        <Header title="Invoice Not Found" />
        <div className="p-6">
          <Button variant="outline" onClick={() => navigate("/sales/invoices")}>
            Back to Invoices
          </Button>
        </div>
      </div>
    );
  }

  const safeNumber = (value: unknown, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const invoiceSubtotal = safeNumber(invoice.subtotal);
  const invoiceCgst = safeNumber(invoice.cgst);
  const invoiceSgst = safeNumber(invoice.sgst);
  const invoiceShipping = safeNumber(invoice.shippingCharges);
  const invoiceTotal = safeNumber(
    invoice.total,
    invoiceSubtotal + invoiceCgst + invoiceSgst + invoiceShipping,
  );
  const invoiceAmountPaid = safeNumber(invoice.amountPaid);
  const invoiceBalanceDue = safeNumber(
    invoice.balanceDue,
    Math.max(0, invoiceTotal - invoiceAmountPaid),
  );
  const invoiceView = {
    ...invoice,
    subtotal: invoiceSubtotal,
    cgst: invoiceCgst,
    sgst: invoiceSgst,
    shippingCharges: invoiceShipping,
    total: invoiceTotal,
    amountPaid: invoiceAmountPaid,
    balanceDue: invoiceBalanceDue,
  };

  const activities = getActivities("invoice", invoice.id);

  const handleSend = () => {
    sendEmail({
      entityType: "invoice",
      entityId: invoice.id,
      to: invoice.emailRecipients,
      actor: "System",
      subject: `Invoice ${invoice.invoiceNumber}`,
    });
    toast({ title: "Invoice email sent" });
  };

  const handleShare = async () => {
    const text = `${invoice.invoiceNumber} - ${currency.format(invoiceTotal)}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: invoice.invoiceNumber, text });
        toast({ title: "Invoice shared" });
        return;
      } catch {
        // ignored
      }
    }
    await navigator.clipboard.writeText(text);
    toast({ title: "Invoice summary copied" });
  };

  const handlePrint = () => {
    reactToPrint();
  };

  const handleSavePayment = () => {
    const amount = Number(paymentAmount) || 0;
    const nextPaid = Math.min(invoiceTotal, invoiceAmountPaid + amount);
    updateInvoice(invoice.id, {
      amountPaid: nextPaid,
      balanceDue: Math.max(0, invoiceTotal - nextPaid),
      paymentStatus:
        nextPaid >= invoiceTotal
          ? "PAID"
          : nextPaid > 0
            ? "PARTIALLY PAID"
            : invoice.paymentStatus,
      status:
        nextPaid >= invoiceTotal
          ? "PAID"
          : nextPaid > 0
            ? "PARTIALLY PAID"
            : invoice.status,
      notes: paymentNote
        ? `${invoice.notes}\nPayment: ${paymentNote}`.trim()
        : invoice.notes,
    });
    setPaymentOpen(false);
    setPaymentAmount("");
    setPaymentNote("");
    toast({ title: "Payment recorded" });
  };

  const handleSaveEdit = () => {
    updateInvoice(invoice.id, {
      paymentTerms: editDraft.paymentTerms,
      dueDate: editDraft.dueDate,
      notes: editDraft.notes,
      termsAndConditions: editDraft.termsAndConditions,
      shippingCharges: editDraft.shippingCharges,
    });
    setEditOpen(false);
    toast({ title: "Invoice updated" });
  };

  return (
    <div>
      <Header title={`Invoice ${invoice.invoiceNumber}`} />
      <div className="p-6 space-y-4">
        <Card className="border-border/60 shadow-sm">
          <CardContent className="flex flex-col gap-4 py-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Customer: {invoice.customerName || invoice.vendorOrClient}
              </p>
              <p className="text-sm text-muted-foreground">
                Balance Due: {currency.format(invoiceBalanceDue)}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={statusVariant[invoice.status] || "outline"}>
                {invoice.status}
              </Badge>
              <Badge
                variant={statusVariant[invoice.paymentStatus] || "outline"}
              >
                {invoice.paymentStatus}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-white/80 shadow-sm backdrop-blur-md">
          <CardContent className="flex flex-wrap items-center gap-2 py-4">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setEditOpen(true)}
            >
              <Edit3 className="mr-2 h-4 w-4" /> Edit
            </Button>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={handleSend}
            >
              <Mail className="mr-2 h-4 w-4" /> Send
            </Button>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={handleShare}
            >
              <Share2 className="mr-2 h-4 w-4" /> Share
            </Button>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={handlePrint}
            >
              <Download className="mr-2 h-4 w-4" /> Download PDF
            </Button>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={handlePrint}
            >
              <Printer className="mr-2 h-4 w-4" /> Print
            </Button>
            <Button className="rounded-xl" onClick={() => setPaymentOpen(true)}>
              <Wallet className="mr-2 h-4 w-4" /> Payment Receipt
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" className="rounded-xl">
                  More <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onSelect={() => navigate("/sales/orders")}>
                  Go to Sales Orders
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => navigate("/sales/invoices")}>
                  Back to Invoices
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardContent>
        </Card>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <ScrollArea className="max-h-[80vh] rounded-2xl">
            <InvoiceSummary invoice={invoiceView} />
          </ScrollArea>

          <div className="space-y-4 lg:sticky lg:top-24 h-fit">
            <Card className="border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Invoice Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Invoice Date</span>
                  <span>{invoice.invoiceDate || invoice.issueDate}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Due Date</span>
                  <span>{invoice.dueDate}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Reference Quote</span>
                  <span>{invoice.referenceQuoteId || "-"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Sales Order</span>
                  <span>{invoice.referenceSalesOrderId || "-"}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span>{currency.format(invoiceSubtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Tax</span>
                  <span>{currency.format(invoiceCgst + invoiceSgst)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Shipping</span>
                  <span>{currency.format(invoiceShipping)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Balance Due</span>
                  <span>{currency.format(invoiceBalanceDue)}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {activities.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No activity yet.
                  </p>
                )}
                {activities.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-xl border border-gray-100 bg-white px-3 py-2 text-sm shadow-sm"
                  >
                    <p className="font-medium">{entry.action}</p>
                    <p className="text-muted-foreground">{entry.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(entry.timestamp).toLocaleString()} by{" "}
                      {entry.actor}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="fixed left-[-10000px] top-0 w-[794px] bg-white">
        <div ref={printRef} id="print-area">
          <InvoicePDF invoice={invoiceView} companyLogoUrl={companyLogoUrl} />
        </div>
      </div>

      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payment Receipt</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Amount</Label>
              <Input
                value={paymentAmount}
                onChange={(event) => setPaymentAmount(event.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={paymentNote}
                onChange={(event) => setPaymentNote(event.target.value)}
                placeholder="Optional payment note"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePayment}>Save Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Invoice</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Payment Terms</Label>
              <Input
                value={editDraft.paymentTerms}
                onChange={(event) =>
                  setEditDraft((current) => ({
                    ...current,
                    paymentTerms: event.target.value,
                  }))
                }
              />
            </div>
            <div>
              <Label>Due Date</Label>
              <Input
                type="date"
                value={editDraft.dueDate}
                onChange={(event) =>
                  setEditDraft((current) => ({
                    ...current,
                    dueDate: event.target.value,
                  }))
                }
              />
            </div>
            <div>
              <Label>Shipping Charges</Label>
              <Input
                type="number"
                value={editDraft.shippingCharges}
                onChange={(event) =>
                  setEditDraft((current) => ({
                    ...current,
                    shippingCharges: Number(event.target.value) || 0,
                  }))
                }
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={editDraft.notes}
                onChange={(event) =>
                  setEditDraft((current) => ({
                    ...current,
                    notes: event.target.value,
                  }))
                }
              />
            </div>
            <div>
              <Label>Terms & Conditions</Label>
              <Textarea
                value={editDraft.termsAndConditions}
                onChange={(event) =>
                  setEditDraft((current) => ({
                    ...current,
                    termsAndConditions: event.target.value,
                  }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
