import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
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
import { Badge } from "@/components/ui/badge";
import { safeReadJson } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { Download, Eye, Trash2 } from "lucide-react";

interface DeliveryChallan {
  id: string;
  challanNumber: string;
  orderNumber: string;
  customerName: string;
  dispatchDate: string;
  expectedDeliveryDate: string;
  status: "pending" | "shipped" | "delivered" | "returned";
  items: Array<{ itemName: string; quantity: number }>;
  totalQuantity: number;
}

const defaultChallans: DeliveryChallan[] = [
  {
    id: "dc-1",
    challanNumber: "DCN-001",
    orderNumber: "SO-2604",
    customerName: "ABC Corp",
    dispatchDate: "2026-04-02",
    expectedDeliveryDate: "2026-04-05",
    status: "shipped",
    items: [{ itemName: "Product A", quantity: 10 }],
    totalQuantity: 10,
  },
];

export default function DeliveryChallansPage() {
  const navigate = useNavigate();

  const [challans, setChallans] = useState<DeliveryChallan[]>(() => {
    const stored = safeReadJson<DeliveryChallan[]>(
      "nido_delivery_challans",
      defaultChallans,
    );
    return stored;
  });

  const updateStorage = (next: DeliveryChallan[]) => {
    setChallans(next);
    localStorage.setItem("nido_delivery_challans", JSON.stringify(next));
  };

  const deleteChalling = (id: string) => {
    updateStorage(challans.filter((c) => c.id !== id));
    toast({ title: "Delivery challan deleted" });
  };

  const updateStatus = (id: string, status: DeliveryChallan["status"]) => {
    updateStorage(challans.map((c) => (c.id === id ? { ...c, status } : c)));
    toast({ title: "Status updated" });
  };

  const statusBadge: Record<string, "default" | "secondary" | "outline"> = {
    pending: "secondary",
    shipped: "outline",
    delivered: "default",
    returned: "secondary",
  };

  return (
    <div>
      <Header title="Delivery Challans" />
      <div className="p-6 space-y-4">
        <Card>
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Track dispatch notes and delivery acknowledgements
              </p>
              <p className="text-xl font-semibold">
                {challans.length} Challans
              </p>
            </div>
            <Button onClick={() => navigate("/sales/delivery-challans/create")}>
              Create Challan
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Challan #</TableHead>
                  <TableHead>Order #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Dispatch Date</TableHead>
                  <TableHead>Expected Delivery</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {challans.map((challan) => (
                  <TableRow key={challan.id}>
                    <TableCell className="font-medium">
                      {challan.challanNumber}
                    </TableCell>
                    <TableCell>{challan.orderNumber}</TableCell>
                    <TableCell>{challan.customerName}</TableCell>
                    <TableCell>{challan.dispatchDate}</TableCell>
                    <TableCell>{challan.expectedDeliveryDate}</TableCell>
                    <TableCell>
                      <Badge variant={statusBadge[challan.status]}>
                        {challan.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          navigate(`/sales/delivery-challans/${challan.id}`)
                        }
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteChalling(challan.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {challans.length === 0 && (
              <p className="text-sm text-muted-foreground py-6 text-center">
                No delivery challans. Create one to track shipments.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
