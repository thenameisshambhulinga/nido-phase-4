import Header from "@/components/layout/Header";
import SalesDocumentPreview from "@/components/sales/SalesDocumentPreview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useData } from "@/contexts/DataContext";
import { toast } from "@/hooks/use-toast";
import { ChevronDown, Mail, ArrowRight, FileText } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const statuses = [
  "DRAFT",
  "SENT",
  "ACCEPTED",
  "REJECTED",
  "CONVERTED",
] as const;

export default function SalesQuoteDetailPage() {
  const navigate = useNavigate();
  const { id = "" } = useParams();
  const {
    salesQuotes,
    updateQuote,
    convertQuoteToOrder,
    convertQuoteToInvoice,
    sendEmail,
    getActivities,
    generalSettings,
  } = useData();

  const quote = useMemo(
    () => salesQuotes.find((entry) => entry.id === id),
    [id, salesQuotes],
  );
  const [nextStatus, setNextStatus] = useState<(typeof statuses)[number]>(
    quote?.status || "DRAFT",
  );
  const [viewMode, setViewMode] = useState<"details" | "pdf">("details");

  if (!quote) {
    return (
      <div>
        <Header title="Quote Not Found" />
        <div className="p-6">
          <Button variant="outline" onClick={() => navigate("/sales/quotes")}>
            Back to Quotes
          </Button>
        </div>
      </div>
    );
  }

  const activities = getActivities("quote", quote.id);
  const canConvert = quote.status === "ACCEPTED";
  const quoteItems = Array.isArray(quote.items) ? quote.items : [];
  const quoteTotal = Number(quote.total ?? quote.subtotal ?? 0);
  const quotePdfTemplate = "Simple";
  const companyLogoUrl = Object.values(generalSettings).find(
    (setting) => setting.companyLogo,
  )?.companyLogo;

  const onShare = async () => {
    const shareText = `${quote.quoteNumber} - INR ${quoteTotal.toLocaleString()}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: quote.quoteNumber, text: shareText });
        toast({ title: "Quote shared" });
        return;
      } catch {
        // ignored
      }
    }
    await navigator.clipboard.writeText(shareText);
    toast({ title: "Quote summary copied" });
  };

  const saveStatus = () => {
    updateQuote(quote.id, { status: nextStatus });
    toast({ title: "Quote updated" });
  };

  const onConvertOrder = () => {
    const order = convertQuoteToOrder(quote.id, "System");
    if (!order) {
      toast({ title: "Only ACCEPTED quotes can be converted" });
      return;
    }
    toast({ title: `Converted to ${order.salesOrderNumber}` });
    navigate(`/sales/orders/${order.id}`);
  };

  const onConvertInvoice = () => {
    const invoiceId = convertQuoteToInvoice(quote.id, "System");
    if (!invoiceId) {
      toast({ title: "Only ACCEPTED quotes can be invoiced" });
      return;
    }
    toast({ title: "Invoice created from quote" });
    navigate(`/sales/invoices/${invoiceId}`);
  };

  const onSendMail = () => {
    sendEmail({
      entityType: "quote",
      entityId: quote.id,
      to: quote.emailRecipients,
      actor: "System",
      subject: `Quote ${quote.quoteNumber}`,
    });
    toast({ title: "Email sent (simulation)" });
  };

  return (
    <div>
      <Header title={`Quote ${quote.quoteNumber}`} />
      <div className="p-6 space-y-6">
        <Card className="border-border/60 shadow-sm bg-white">
          <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="rounded-full bg-sky-100 text-sky-700">
                  Quote
                </Badge>
                <Badge
                  variant={quote.status === "ACCEPTED" ? "default" : "outline"}
                  className="rounded-full"
                >
                  {quote.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Customer: {quote.customerName}
              </p>
              <p className="text-sm text-muted-foreground">
                Total: INR {quoteTotal.toLocaleString()}
              </p>
            </div>

            <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
              <div className="flex items-center gap-2 rounded-2xl border border-gray-100 bg-gray-50 px-3 py-2 shadow-sm">
                <span className="text-xs font-medium text-muted-foreground">
                  Status
                </span>
                <Select
                  value={nextStatus}
                  onValueChange={(val) =>
                    setNextStatus(val as (typeof statuses)[number])
                  }
                >
                  <SelectTrigger className="h-9 w-[155px] border-0 bg-white shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" onClick={saveStatus} className="rounded-xl">
                  Save
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  onClick={onSendMail}
                  className="gap-2 rounded-xl"
                >
                  <Mail className="h-4 w-4" /> Send
                </Button>
                <Button
                  variant="outline"
                  onClick={onShare}
                  className="gap-2 rounded-xl"
                >
                  Share
                </Button>
                <Button
                  variant="outline"
                  className="gap-2 rounded-xl"
                  onClick={() => window.print()}
                >
                  PDF/Print
                </Button>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="secondary"
                              disabled={!canConvert}
                              className="gap-2 rounded-xl"
                            >
                              Convert <ChevronDown className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem onSelect={onConvertInvoice}>
                              <FileText className="mr-2 h-4 w-4" /> Convert to
                              Invoice
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={onConvertOrder}>
                              <ArrowRight className="mr-2 h-4 w-4" /> Convert to
                              Sales Order
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </span>
                    </TooltipTrigger>
                    {!canConvert && (
                      <TooltipContent>
                        Quote must be ACCEPTED before conversion
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="rounded-2xl border border-gray-100 bg-white p-2 shadow-sm">
          <div className="flex items-center justify-between gap-3 px-2 py-1">
            <Tabs defaultValue="details" className="w-full">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <TabsList className="h-10 rounded-full bg-slate-100 p-1">
                  <TabsTrigger value="details">Quote Details</TabsTrigger>
                  <TabsTrigger value="activities">Activity Logs</TabsTrigger>
                </TabsList>
                <div className="flex items-center gap-2 rounded-full bg-slate-100 p-1 text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setViewMode("details")}
                    className={`rounded-full px-3 py-1.5 transition-colors ${viewMode === "details" ? "bg-white shadow text-foreground" : "text-muted-foreground"}`}
                  >
                    Details
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("pdf")}
                    className={`rounded-full px-3 py-1.5 transition-colors ${viewMode === "pdf" ? "bg-white shadow text-foreground" : "text-muted-foreground"}`}
                  >
                    PDF
                  </button>
                </div>
              </div>

              <TabsContent value="details" className="mt-4 space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card className="rounded-2xl border border-gray-100 shadow-sm">
                    <CardContent className="p-5">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Customer
                      </p>
                      <p className="mt-2 text-lg font-semibold">
                        {quote.customerName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {quote.placeOfSupply || "Place of supply not set"}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="rounded-2xl border border-gray-100 shadow-sm">
                    <CardContent className="p-5">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Document Window
                      </p>
                      <p className="mt-2 text-lg font-semibold">
                        {quote.quoteDate}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Valid till {quote.validTillDate}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="rounded-2xl border border-gray-100 shadow-sm">
                    <CardContent className="p-5">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Line Items
                      </p>
                      <p className="mt-2 text-lg font-semibold">
                        {quoteItems.length}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        INR {quoteTotal.toLocaleString()} total quote value
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="rounded-2xl border border-gray-100 shadow-sm">
                  <CardContent className="p-5">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Quote Type</p>
                        <p className="font-medium">Invoice</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Quote Number</p>
                        <p className="font-medium">{quote.quoteNumber}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Creation Date</p>
                        <p className="font-medium">{quote.quoteDate}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Salesperson</p>
                        <p className="font-medium">
                          {quote.salesperson || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Reference #</p>
                        <p className="font-medium">
                          {quote.referenceNumber || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Place of Supply</p>
                        <p className="font-medium">
                          {quote.placeOfSupply || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">PDF Template</p>
                        <p className="font-medium">{quotePdfTemplate}</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-muted-foreground">
                          Email Recipients
                        </p>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {quote.emailRecipients.length > 0 ? (
                            quote.emailRecipients.map((email) => (
                              <Badge
                                key={email}
                                variant="outline"
                                className="rounded-full"
                              >
                                {email}
                              </Badge>
                            ))
                          ) : (
                            <span className="font-medium">-</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <CardContent className="p-0">
                    {viewMode === "details" ? (
                      <div className="p-5 space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                              Bill To
                            </p>
                            <p className="mt-2 text-base font-semibold text-slate-900">
                              {quote.customerName}
                            </p>
                            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                              {quote.billingAddress}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:text-right">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                              Ship To
                            </p>
                            <p className="mt-2 text-base font-semibold text-slate-900">
                              {quote.customerName}
                            </p>
                            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600 md:ml-auto md:max-w-sm">
                              {quote.shippingAddress}
                            </p>
                          </div>
                        </div>

                        <div className="overflow-hidden rounded-2xl border border-slate-200">
                          <table className="w-full border-collapse text-sm">
                            <thead>
                              <tr className="bg-slate-900 text-white">
                                <th className="px-4 py-3 text-left font-semibold">
                                  Item Name
                                </th>
                                <th className="px-4 py-3 text-left font-semibold">
                                  Description
                                </th>
                                <th className="px-4 py-3 text-center font-semibold">
                                  HSN/SAC
                                </th>
                                <th className="px-4 py-3 text-right font-semibold">
                                  Qty
                                </th>
                                <th className="px-4 py-3 text-right font-semibold">
                                  Rate
                                </th>
                                <th className="px-4 py-3 text-right font-semibold">
                                  Discount
                                </th>
                                <th className="px-4 py-3 text-right font-semibold">
                                  Tax %
                                </th>
                                <th className="px-4 py-3 text-right font-semibold">
                                  Amount
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white">
                              {quoteItems.map((item, idx) => (
                                <tr
                                  key={idx}
                                  className="border-t border-slate-200 align-top"
                                >
                                  <td className="px-4 py-3 font-medium text-slate-900">
                                    {item.itemName}
                                  </td>
                                  <td className="px-4 py-3 text-xs leading-5 text-slate-600">
                                    {item.description}
                                  </td>
                                  <td className="px-4 py-3 text-center text-slate-700">
                                    {item.hsnSac}
                                  </td>
                                  <td className="px-4 py-3 text-right text-slate-700">
                                    {item.quantity}
                                  </td>
                                  <td className="px-4 py-3 text-right text-slate-700">
                                    {item.rate.toLocaleString()}
                                  </td>
                                  <td className="px-4 py-3 text-right text-slate-700">
                                    {item.discount}
                                  </td>
                                  <td className="px-4 py-3 text-right text-slate-700">
                                    {item.taxRate}%
                                  </td>
                                  <td className="px-4 py-3 text-right font-semibold text-slate-900">
                                    {item.amount.toLocaleString()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <div className="flex justify-end">
                          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                            {[
                              ["Subtotal", quote.subtotal],
                              ["CGST (9%)", quote.cgst],
                              ["SGST (9%)", quote.sgst],
                              ["Adjustment", quote.adjustment],
                            ].map(([label, value], idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between border-b border-slate-100 py-2 text-sm last:border-0"
                              >
                                <span className="text-slate-600">{label}</span>
                                <span className="font-semibold text-slate-900">
                                  {(value as number).toLocaleString()}
                                </span>
                              </div>
                            ))}
                            <div className="mt-2 flex items-center justify-between rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
                              <span>Total</span>
                              <span>{quote.total.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>

                        {(quote.customerNotes ||
                          quote.termsAndConditions ||
                          quote.bankDetails) && (
                          <div className="grid gap-4 border-t border-slate-200 pt-4 text-sm md:grid-cols-3">
                            {quote.customerNotes && (
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                                  Notes
                                </p>
                                <p className="mt-2 whitespace-pre-wrap text-slate-600">
                                  {quote.customerNotes}
                                </p>
                              </div>
                            )}
                            {quote.termsAndConditions && (
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                                  Terms & Conditions
                                </p>
                                <p className="mt-2 whitespace-pre-wrap text-slate-600">
                                  {quote.termsAndConditions}
                                </p>
                              </div>
                            )}
                            {quote.bankDetails && (
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                                  Bank Details
                                </p>
                                <p className="mt-2 whitespace-pre-wrap text-slate-600">
                                  {quote.bankDetails}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-0">
                        <SalesDocumentPreview
                          documentType="quote"
                          documentNumber={quote.quoteNumber}
                          customerName={quote.customerName}
                          companyLogoUrl={companyLogoUrl}
                          date={quote.quoteDate}
                          validTill={quote.validTillDate}
                          items={quoteItems}
                          subtotal={Number(quote.subtotal ?? 0)}
                          cgst={Number(quote.cgst ?? 0)}
                          sgst={Number(quote.sgst ?? 0)}
                          adjustment={Number(quote.adjustment ?? 0)}
                          total={quoteTotal}
                          billingAddress={quote.billingAddress}
                          shippingAddress={quote.shippingAddress}
                          placeOfSupply={quote.placeOfSupply}
                          bankDetails={quote.bankDetails}
                          termsAndConditions={quote.termsAndConditions}
                          customerNotes={quote.customerNotes}
                          referenceNumber={quote.referenceNumber}
                          salesperson={quote.salesperson}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="activities" className="mt-4 space-y-3">
                {activities.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No activity yet.
                  </p>
                )}
                {activities.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm shadow-sm"
                  >
                    <p className="font-medium">{entry.action}</p>
                    <p className="text-muted-foreground">{entry.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(entry.timestamp).toLocaleString()} by{" "}
                      {entry.actor}
                    </p>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
