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
import { Edit, Eye, Trash2 } from "lucide-react";

interface EWayBill {
  id: string;
  ewayBillNumber: string;
  supplierName: string;
  recipientName: string;
  invoiceNumber: string;
  generatedDate: string;
  validUntil: string;
  totalValue: number;
  transactionalValue: number;
  status: "generated" | "cancelled" | "used";
  transportMode: "road" | "rail" | "air" | "ship";
}

const defaultEWayBills: EWayBill[] = [
  {
    id: "eb-1",
    ewayBillNumber: "123456789012",
    supplierName: "Nido Tech",
    recipientName: "ABC Corp",
    invoiceNumber: "INV-2604",
    generatedDate: "2026-04-02",
    validUntil: "2026-04-06",
    totalValue: 150000,
    transactionalValue: 150000,
    status: "generated",
    transportMode: "road",
  },
];

export default function EWayBillsPage() {
  const navigate = useNavigate();

  const [bills, setBills] = useState<EWayBill[]>(() => {
    const stored = safeReadJson<EWayBill[]>(
      "nido_eway_bills",
      defaultEWayBills,
    );
    return stored;
  });

  const updateStorage = (next: EWayBill[]) => {
    setBills(next);
    localStorage.setItem("nido_eway_bills", JSON.stringify(next));
  };

  const deleteBill = (id: string) => {
    updateStorage(bills.filter((b) => b.id !== id));
    toast({ title: "e-Way bill deleted" });
  };

  const updateStatus = (id: string, status: EWayBill["status"]) => {
    updateStorage(bills.map((b) => (b.id === id ? { ...b, status } : b)));
    toast({ title: "Status updated" });
  };

  const transportModeLabel = {
    road: "Road",
    rail: "Rail",
    air: "Air",
    ship: "Ship",
  };

  const statusBadge: Record<string, "default" | "secondary" | "outline"> = {
    generated: "outline",
    used: "default",
    cancelled: "secondary",
  };

  return (
    <div>
      <Header title="e-Way Bills" />
      <div className="p-6 space-y-4">
        <Card>
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Generate and monitor e-Way bills for GST compliance
              </p>
              <p className="text-xl font-semibold">
                {bills.length} e-Way Bills
              </p>
            </div>
            <Button onClick={() => navigate("/sales/e-way-bills/create")}>
              Generate e-Way Bill
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>e-Way Bill #</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Total Value</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bills.map((bill) => (
                  <TableRow key={bill.id}>
                    <TableCell className="font-medium">
                      {bill.ewayBillNumber}
                    </TableCell>
                    <TableCell>{bill.supplierName}</TableCell>
                    <TableCell>{bill.recipientName}</TableCell>
                    <TableCell>{bill.invoiceNumber}</TableCell>
                    <TableCell>{bill.totalValue.toLocaleString()}</TableCell>
                    <TableCell>
                      {transportModeLabel[bill.transportMode]}
                    </TableCell>
                    <TableCell>{bill.validUntil}</TableCell>
                    <TableCell>
                      <Badge variant={statusBadge[bill.status]}>
                        {bill.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          navigate(`/sales/e-way-bills/${bill.id}`)
                        }
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {bill.status === "generated" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => updateStatus(bill.id, "used")}
                          title="Mark as Used"
                        >
                          ✓
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteBill(bill.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {bills.length === 0 && (
              <p className="text-sm text-muted-foreground py-6 text-center">
                No e-Way bills. Generate one for GST-compliant shipments.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
