import Header from "@/components/layout/Header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useData } from "@/contexts/DataContext";
import { useNavigate } from "react-router-dom";

export default function SalesOrdersPage() {
  const navigate = useNavigate();
  const { salesOrders } = useData();

  return (
    <div>
      <Header title="Sales Orders" />
      <div className="p-6 space-y-4">
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Invoice Status</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesOrders.map((order) => (
                  <TableRow
                    key={order.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/sales/orders/${order.id}`)}
                  >
                    <TableCell className="font-medium">
                      {order.salesOrderNumber}
                    </TableCell>
                    <TableCell>{order.customerName}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{order.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          order.invoiceStatus === "INVOICED"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {order.invoiceStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>INR {order.total.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {salesOrders.length === 0 && (
              <p className="text-sm text-muted-foreground py-6 text-center">
                No sales orders yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
