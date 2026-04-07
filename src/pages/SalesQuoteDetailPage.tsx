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
  } = useData();

  const quote = useMemo(
    () => salesQuotes.find((entry) => entry.id === id),
    [id, salesQuotes],
  );
  const [nextStatus, setNextStatus] = useState<(typeof statuses)[number]>(
    quote?.status || "DRAFT",
  );

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
                  <Mail className="h-4 w-4" /> Send Email
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

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="rounded-2xl border border-gray-100 shadow-sm">
            <CardContent className="p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Customer
              </p>
              <p className="mt-2 text-lg font-semibold">{quote.customerName}</p>
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
              <p className="mt-2 text-lg font-semibold">{quote.quoteDate}</p>
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
              <p className="mt-2 text-lg font-semibold">{quoteItems.length}</p>
              <p className="text-sm text-muted-foreground">
                INR {quoteTotal.toLocaleString()} total quote value
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Preview Panel */}
        <Card className="rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <SalesDocumentPreview
              documentType="quote"
              documentNumber={quote.quoteNumber}
              customerName={quote.customerName}
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
            />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-gray-100 shadow-sm">
          <CardHeader>
            <CardTitle>Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activities.length === 0 && (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            )}
            {activities.map((entry) => (
              <div
                key={entry.id}
                className="rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm shadow-sm"
              >
                <p className="font-medium">{entry.action}</p>
                <p className="text-muted-foreground">{entry.message}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(entry.timestamp).toLocaleString()} by {entry.actor}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
