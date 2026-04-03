import Header from "@/components/layout/Header";
import SalesDocumentPreview from "@/components/sales/SalesDocumentPreview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useData } from "@/contexts/DataContext";
import { toast } from "@/hooks/use-toast";
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
    navigate("/sales/invoices");
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
      <div className="p-6 space-y-4">
        <Card>
          <CardContent className="pt-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">
                Customer: {quote.customerName}
              </p>
              <p className="text-sm text-muted-foreground">
                Total: INR {quote.total.toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={quote.status === "ACCEPTED" ? "default" : "outline"}
              >
                {quote.status}
              </Badge>
              <Select
                value={nextStatus}
                onValueChange={(val) =>
                  setNextStatus(val as (typeof statuses)[number])
                }
              >
                <SelectTrigger className="w-[180px]">
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
              <Button variant="outline" onClick={saveStatus}>
                Save
              </Button>
              <Button variant="outline" onClick={onSendMail}>
                Send Email
              </Button>
              <Button onClick={onConvertOrder} disabled={!canConvert}>
                Convert to Sales Order
              </Button>
              <Button
                variant="secondary"
                onClick={onConvertInvoice}
                disabled={!canConvert}
              >
                Convert to Invoice
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preview Panel */}
        <SalesDocumentPreview
          documentType="quote"
          documentNumber={quote.quoteNumber}
          customerName={quote.customerName}
          date={quote.quoteDate}
          validTill={quote.validTillDate}
          items={quote.items}
          subtotal={quote.subtotal}
          cgst={quote.cgst}
          sgst={quote.sgst}
          adjustment={quote.adjustment}
          total={quote.total}
          billingAddress={quote.billingAddress}
          shippingAddress={quote.shippingAddress}
          placeOfSupply={quote.placeOfSupply}
          bankDetails={quote.bankDetails}
          termsAndConditions={quote.termsAndConditions}
          customerNotes={quote.customerNotes}
        />

        <Card>
          <CardHeader>
            <CardTitle>Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {activities.length === 0 && (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            )}
            {activities.map((entry) => (
              <div
                key={entry.id}
                className="text-sm border rounded-md px-3 py-2"
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
