import { memo, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import Header from "@/components/layout/Header";
import NewSalesOrderModal from "@/pages/NewSalesOrderModal";
import SalesOrderPDF from "@/components/sales/SalesOrderPDF";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
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
  ArrowRightCircle,
  ChevronDown,
  Edit3,
  FileText,
  Mail,
  Plus,
  Printer,
} from "lucide-react";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const statusVariant: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  CONFIRMED: "default",
  DRAFT: "secondary",
  CANCELLED: "destructive",
  INVOICED: "default",
  "NOT INVOICED": "secondary",
  PAID: "default",
  UNPAID: "secondary",
  "PARTIALLY PAID": "outline",
  SHIPPED: "default",
  PENDING: "secondary",
};

const SalesOrderSummary = memo(function SalesOrderSummary({
  order,
}: {
  order: NonNullable<ReturnType<typeof useSalesOrder>>;
}) {
  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">Sales Order</CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant={statusVariant[order.status] || "outline"}>
            {order.status}
          </Badge>
          <Badge variant={statusVariant[order.invoiceStatus] || "outline"}>
            {order.invoiceStatus}
          </Badge>
          <Badge variant={statusVariant[order.shipmentStatus] || "outline"}>
            {order.shipmentStatus}
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
              {order.billingAddress}
            </p>
          </div>
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Customer
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {order.customerName}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Quote Ref: {order.referenceNumber || "-"}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Order Date: {order.salesOrderDate}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Shipment: {order.expectedShipmentDate}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Bill To
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-900">
              {order.customerName}
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">
              {order.billingAddress}
            </p>
          </div>
          <div className="md:text-right">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Ship To
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-900">
              {order.customerName}
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600 md:ml-auto md:max-w-sm">
              {order.shippingAddress}
            </p>
          </div>
        </div>

        <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm md:grid-cols-2">
          <div>
            <span className="text-slate-500">Order Date:</span>{" "}
            <span className="font-medium text-slate-900">
              {order.salesOrderDate}
            </span>
          </div>
          <div className="md:text-right">
            <span className="text-slate-500">Reference:</span>{" "}
            <span className="font-medium text-slate-900">
              {order.referenceNumber || "-"}
            </span>
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
              {order.items.map((item, index) => (
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
                {order.customerNotes || "-"}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                Terms & Conditions
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                {order.termsAndConditions || "-"}
              </p>
            </div>
          </div>
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between py-1 text-sm">
              <span>Subtotal</span>
              <span>{currency.format(order.subtotal)}</span>
            </div>
            <div className="flex items-center justify-between py-1 text-sm">
              <span>CGST</span>
              <span>{currency.format(order.cgst)}</span>
            </div>
            <div className="flex items-center justify-between py-1 text-sm">
              <span>SGST</span>
              <span>{currency.format(order.sgst)}</span>
            </div>
            <div className="flex items-center justify-between py-1 text-sm">
              <span>Shipping</span>
              <span>{currency.format(order.shippingCharges ?? 0)}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex items-center justify-between rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
              <span>Total</span>
              <span>{currency.format(order.total)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

function useSalesOrder() {
  const { id = "" } = useParams();
  const { salesOrders } = useData();
  return useMemo(
    () => salesOrders.find((entry) => entry.id === id) || null,
    [id, salesOrders],
  );
}

export default function SalesOrderDetails() {
  const navigate = useNavigate();
  const order = useSalesOrder();
  const {
    sendEmail,
    getActivities,
    convertSalesOrderToInvoice,
    invoices,
    generalSettings,
  } = useData();
  const [showPdfView, setShowPdfView] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const companyLogoUrl = Object.values(generalSettings).find(
    (setting) => setting.companyLogo,
  )?.companyLogo;

  const reactToPrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: order
      ? `Sales-Order-${order.salesOrderNumber}`
      : "Sales-Order",
    pageStyle:
      "@page { size: A4; margin: 12mm; } @media print { html, body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; } }",
  });

  if (!order) {
    return (
      <div>
        <Header title="Sales Order Not Found" />
        <div className="p-6">
          <Button variant="outline" onClick={() => navigate("/sales/orders")}>
            Back to Sales Orders
          </Button>
        </div>
      </div>
    );
  }

  const activities = getActivities("sales_order", order.id);
  const invoice = order.referenceInvoiceId
    ? invoices.find((entry) => entry.id === order.referenceInvoiceId)
    : null;

  const handleSendEmail = () => {
    sendEmail({
      entityType: "sales_order",
      entityId: order.id,
      to: order.emailRecipients,
      actor: "System",
      subject: `Sales Order ${order.salesOrderNumber}`,
    });
    toast({ title: "Sales order email sent" });
  };

  const handleConvert = () => {
    const invoiceId = convertSalesOrderToInvoice(order.id, "System");
    if (!invoiceId) {
      toast({ title: "Unable to convert sales order" });
      return;
    }
    toast({ title: "Sales order converted to invoice" });
    navigate(`/sales/invoices/${invoiceId}`);
  };

  const handlePrint = () => {
    reactToPrint();
  };

  return (
    <div>
      <Header title={`Sales Order ${order.salesOrderNumber}`} />
      <div className="p-6 space-y-4">
        <Card className="border-border/60 shadow-sm">
          <CardContent className="flex flex-col gap-4 py-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Customer: {order.customerName}
              </p>
              <p className="text-sm text-muted-foreground">
                Quote Reference: {order.referenceNumber || "-"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={statusVariant[order.status] || "outline"}>
                {order.status}
              </Badge>
              <Badge variant={statusVariant[order.invoiceStatus] || "outline"}>
                {order.invoiceStatus}
              </Badge>
              <Badge variant={statusVariant[order.paymentStatus] || "outline"}>
                {order.paymentStatus}
              </Badge>
              <Badge variant={statusVariant[order.shipmentStatus] || "outline"}>
                {order.shipmentStatus}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardContent className="flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={() => setEditOpen(true)}>
                <Edit3 className="mr-2 h-4 w-4" /> Edit
              </Button>
              <Button variant="outline" onClick={handleSendEmail}>
                <Mail className="mr-2 h-4 w-4" /> Send Email
              </Button>
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" /> PDF/Print
              </Button>
              <Button
                onClick={handleConvert}
                disabled={order.invoiceStatus === "INVOICED"}
              >
                <ArrowRightCircle className="mr-2 h-4 w-4" /> Convert → Invoice
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary">
                    Create <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem onSelect={() => setEditOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> New Sales Order
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => navigate("/sales/invoices")}
                  >
                    <FileText className="mr-2 h-4 w-4" /> New Invoice
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex items-center gap-3 rounded-lg border bg-muted/20 px-4 py-2 text-sm">
              <span className="font-medium">Show PDF View</span>
              <Switch checked={showPdfView} onCheckedChange={setShowPdfView} />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            {showPdfView ? (
              <SalesOrderSummary order={order} />
            ) : (
              <Card className="border-border/60 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Structured View</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm font-semibold">Bill To</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                        {order.billingAddress}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Ship To</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                        {order.shippingAddress}
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="grid gap-3 md:grid-cols-4">
                    <div>
                      <p className="text-xs uppercase text-muted-foreground">
                        Order Date
                      </p>
                      <p className="font-medium">{order.salesOrderDate}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-muted-foreground">
                        Reference
                      </p>
                      <p className="font-medium">
                        {order.referenceNumber || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-muted-foreground">
                        Payment Terms
                      </p>
                      <p className="font-medium">{order.paymentTerms}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-muted-foreground">
                        Delivery Method
                      </p>
                      <p className="font-medium">{order.deliveryMethod}</p>
                    </div>
                  </div>
                  <div className="overflow-x-auto rounded-xl border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead>HSN/SAC</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">Rate</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {order.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <p className="font-medium">{item.itemName}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.description}
                              </p>
                            </TableCell>
                            <TableCell>{item.hsnSac || "-"}</TableCell>
                            <TableCell className="text-right">
                              {item.quantity}
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
                </CardContent>
              </Card>
            )}

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
                    className="rounded-lg border px-3 py-2 text-sm"
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

          <div className="space-y-4 lg:sticky lg:top-24 h-fit">
            <Card className="border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Invoice Status</span>
                  <Badge
                    variant={statusVariant[order.invoiceStatus] || "outline"}
                  >
                    {order.invoiceStatus}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Shipment Status</span>
                  <Badge
                    variant={statusVariant[order.shipmentStatus] || "outline"}
                  >
                    {order.shipmentStatus}
                  </Badge>
                </div>
                {invoice && (
                  <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
                    Invoice created: {invoice.invoiceNumber}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Totals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span>{currency.format(order.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>CGST</span>
                  <span>{currency.format(order.cgst)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>SGST</span>
                  <span>{currency.format(order.sgst)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Shipping</span>
                  <span>{currency.format(order.shippingCharges ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Adjustment</span>
                  <span>{currency.format(order.adjustment)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex items-center justify-between text-base font-semibold">
                  <span>Total</span>
                  <span>{currency.format(order.total)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="fixed -left-[10000px] top-0 w-[794px] bg-white">
        <div ref={printRef}>
          <SalesOrderPDF order={order} companyLogoUrl={companyLogoUrl} />
        </div>
      </div>

      <NewSalesOrderModal
        open={editOpen}
        onOpenChange={setEditOpen}
        order={order}
      />
    </div>
  );
}
