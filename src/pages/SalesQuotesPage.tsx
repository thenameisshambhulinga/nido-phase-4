import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useData } from "@/contexts/DataContext";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

const badgeVariantByStatus: Record<
  string,
  "default" | "secondary" | "outline"
> = {
  DRAFT: "secondary",
  SENT: "outline",
  ACCEPTED: "default",
  DECLINED: "secondary",
  CONVERTED: "default",
};

export default function SalesQuotesPage() {
  const navigate = useNavigate();
  const { salesQuotes, clients, masterCatalogItems, createQuote } = useData();

  const createQuickQuote = () => {
    const firstClient = clients[0];
    if (!firstClient) {
      toast({ title: "Add a client before creating a quote" });
      return;
    }

    const firstItem = masterCatalogItems[0];
    const itemName = firstItem?.name || "Consulting Services";
    const quantity = 1;
    const rate = Number(firstItem?.price || 5000);
    const amount = quantity * rate;
    const subtotal = amount;
    const cgst = Math.round(subtotal * 0.09);
    const sgst = Math.round(subtotal * 0.09);
    const total = subtotal + cgst + sgst;
    const customerAddress =
      firstClient.locationDetails?.address || firstClient.address;
    const placeOfSupply =
      firstClient.locationDetails?.state || firstClient.address;

    const next = createQuote({
      quoteNumber: `Q-${String(Date.now()).slice(-5)}`,
      customerName: firstClient.name,
      customerId: firstClient.id,
      quoteDate: new Date().toISOString().slice(0, 10),
      validTillDate: new Date(Date.now() + 7 * 86400000)
        .toISOString()
        .slice(0, 10),
      projectName: "",
      placeOfSupply,
      salesperson: "",
      billingAddress: customerAddress,
      shippingAddress: customerAddress,
      emailRecipients: [firstClient.email],
      items: [
        {
          id: `qli-${Date.now()}`,
          itemName,
          description: "",
          hsnSac: "",
          quantity,
          rate,
          discount: 0,
          taxRate: 18,
          amount,
        },
      ],
      subtotal,
      cgst,
      sgst,
      adjustment: 0,
      total,
      customerNotes: "Thank you for your business",
      termsAndConditions: "Validity: 7 days",
      attachments: [],
      bankDetails: "Nido Banking Pvt Ltd",
      status: "DRAFT",
      createdBy: "System",
      referenceNumber: "",
    });

    toast({ title: `Quote ${next.quoteNumber} created` });
    navigate(`/sales/quotes/${next.id}`);
  };

  return (
    <div>
      <Header title="Sales Quotes" />
      <div className="p-6 space-y-4">
        <Card>
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Create and manage client quotations
              </p>
              <p className="text-xl font-semibold">
                {salesQuotes.length} Quotes
              </p>
            </div>
            <div className="space-x-2">
              <Button variant="outline" onClick={createQuickQuote}>
                Quick Create
              </Button>
              <Button onClick={() => navigate("/sales/quotes/create")}>
                Create Quote
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quote #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Quote Date</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesQuotes.map((quote) => (
                  <TableRow
                    key={quote.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/sales/quotes/${quote.id}`)}
                  >
                    <TableCell className="font-medium">
                      {quote.quoteNumber}
                    </TableCell>
                    <TableCell>{quote.customerName}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          badgeVariantByStatus[quote.status] || "outline"
                        }
                      >
                        {quote.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{quote.quoteDate}</TableCell>
                    <TableCell>INR {quote.total.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {salesQuotes.length === 0 && (
              <p className="text-sm text-muted-foreground py-6 text-center">
                No quotes yet. Create one to begin.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
