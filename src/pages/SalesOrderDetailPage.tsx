import Header from "@/components/layout/Header";
import SalesDocumentPreview from "@/components/sales/SalesDocumentPreview";
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
import { useData } from "@/contexts/DataContext";
import { toast } from "@/hooks/use-toast";
import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function SalesOrderDetailPage() {
  const navigate = useNavigate();
  const { id = "" } = useParams();
  const { salesOrders, sendEmail, getActivities } = useData();

  const order = useMemo(
    () => salesOrders.find((entry) => entry.id === id),
    [id, salesOrders],
  );

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

  const onSendMail = () => {
    sendEmail({
      entityType: "sales_order",
      entityId: order.id,
      to: order.emailRecipients,
      actor: "System",
      subject: `Sales Order ${order.salesOrderNumber}`,
    });
    toast({ title: "Sales order email sent (simulation)" });
  };

  return (
    <div>
      <Header title={`Sales Order ${order.salesOrderNumber}`} />
      <div className="p-6 space-y-4">
        <Card>
          <CardContent className="pt-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">
                Customer: {order.customerName}
              </p>
              <p className="text-sm text-muted-foreground">
                Order Total: INR {order.total.toLocaleString()}
              </p>
            </div>
            <Button variant="outline" onClick={onSendMail}>
              Send Email
            </Button>
          </CardContent>
        </Card>

        {/* Preview Panel */}
        <SalesDocumentPreview
          documentType="sales_order"
          documentNumber={order.salesOrderNumber}
          customerName={order.customerName}
          date={order.salesOrderDate}
          items={order.items}
          subtotal={order.subtotal}
          cgst={order.cgst}
          sgst={order.sgst}
          adjustment={order.adjustment}
          total={order.total}
          billingAddress={order.billingAddress}
          shippingAddress={order.shippingAddress}
          placeOfSupply={order.placeOfSupply}
          bankDetails={order.bankDetails}
          termsAndConditions={order.termsAndConditions}
          customerNotes={order.customerNotes}
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
