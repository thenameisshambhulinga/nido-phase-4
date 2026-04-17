import { useDeferredValue, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useData } from "@/contexts/DataContext";
import NewSalesOrderModal from "@/pages/NewSalesOrderModal";

const statusVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  DRAFT: "secondary",
  CONFIRMED: "default",
  CANCELLED: "destructive",
};

const invoiceVariant: Record<string, "default" | "secondary" | "outline"> = {
  INVOICED: "default",
  "NOT INVOICED": "secondary",
};

const paymentVariant: Record<string, "default" | "secondary" | "outline"> = {
  PAID: "default",
  "PARTIALLY PAID": "outline",
  UNPAID: "secondary",
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);

export default function SalesOrdersPage() {
  const navigate = useNavigate();
  const { salesOrders } = useData();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const deferredSearch = useDeferredValue(search);

  const filteredOrders = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    if (!query) return salesOrders;
    return salesOrders.filter((order) => {
      const haystack = [
        order.salesOrderNumber,
        order.referenceNumber,
        order.customerName,
        order.status,
        order.invoiceStatus,
        order.paymentStatus,
        order.salesOrderDate,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [deferredSearch, salesOrders]);

  return (
    <div>
      <Header title="Sales Orders" />
      <div className="p-6 space-y-4">
        <Card className="border-border/60 shadow-sm">
          <CardContent className="flex flex-col gap-4 pt-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Track orders converted from accepted quotes or created manually.
              </p>
              <p className="text-2xl font-semibold">
                {salesOrders.length} Sales Orders
              </p>
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <Input
                className="md:w-72"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search order, reference, customer..."
              />
              <Button onClick={() => setShowCreate(true)}>
                + New Sales Order
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">All Sales Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Sales Order ID</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Customer Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Invoice Status</TableHead>
                    <TableHead>Payment Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow
                      key={order.id}
                      className="group transition-colors hover:bg-muted/50"
                    >
                      <TableCell>{order.salesOrderDate}</TableCell>
                      <TableCell>
                        <Button
                          variant="link"
                          className="h-auto p-0 font-medium text-primary"
                          onClick={() => navigate(`/sales/orders/${order.id}`)}
                        >
                          {order.salesOrderNumber}
                        </Button>
                      </TableCell>
                      <TableCell>{order.referenceNumber || "-"}</TableCell>
                      <TableCell>{order.customerName}</TableCell>
                      <TableCell>
                        <Badge
                          variant={statusVariant[order.status] || "outline"}
                        >
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            invoiceVariant[order.invoiceStatus] || "outline"
                          }
                        >
                          {order.invoiceStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            paymentVariant[order.paymentStatus] || "outline"
                          }
                        >
                          {order.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(order.total)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {filteredOrders.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No sales orders found.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <NewSalesOrderModal open={showCreate} onOpenChange={setShowCreate} />
    </div>
  );
}
