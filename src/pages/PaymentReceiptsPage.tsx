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

interface PaymentReceipt {
  id: string;
  receiptNumber: string;
  customerName: string;
  invoiceNumber: string;
  receiptDate: string;
  paymentMethod: "cash" | "check" | "bank_transfer" | "credit_card";
  amount: number;
  status: "pending" | "reconciled" | "reversed";
  remarks: string;
}

const defaultReceipts: PaymentReceipt[] = [
  {
    id: "pr-1",
    receiptNumber: "RCPT-001",
    customerName: "ABC Corp",
    invoiceNumber: "INV-2604",
    receiptDate: "2026-04-02",
    paymentMethod: "bank_transfer",
    amount: 150000,
    status: "reconciled",
    remarks: "Payment received",
  },
];

export default function PaymentReceiptsPage() {
  const navigate = useNavigate();

  const [receipts, setReceipts] = useState<PaymentReceipt[]>(() => {
    const stored = safeReadJson<PaymentReceipt[]>(
      "nido_payment_receipts",
      defaultReceipts,
    );
    return stored;
  });

  const updateStorage = (next: PaymentReceipt[]) => {
    setReceipts(next);
    localStorage.setItem("nido_payment_receipts", JSON.stringify(next));
  };

  const deleteReceipt = (id: string) => {
    updateStorage(receipts.filter((r) => r.id !== id));
    toast({ title: "Receipt deleted" });
  };

  const reconcile = (id: string) => {
    updateStorage(
      receipts.map((r) => (r.id === id ? { ...r, status: "reconciled" } : r)),
    );
    toast({ title: "Receipt reconciled" });
  };

  const paymentMethodLabel = {
    cash: "Cash",
    check: "Check",
    bank_transfer: "Bank Transfer",
    credit_card: "Credit Card",
  };

  const statusBadge: Record<string, "default" | "secondary" | "outline"> = {
    pending: "secondary",
    reconciled: "default",
    reversed: "outline",
  };

  return (
    <div>
      <Header title="Payment Receipts" />
      <div className="p-6 space-y-4">
        <Card>
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Record incoming payments and reconcile with invoices
              </p>
              <p className="text-xl font-semibold">
                {receipts.length} Receipts
              </p>
            </div>
            <Button onClick={() => navigate("/sales/payment-receipts/create")}>
              Create Receipt
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Receipt Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receipts.map((receipt) => (
                  <TableRow key={receipt.id}>
                    <TableCell className="font-medium">
                      {receipt.receiptNumber}
                    </TableCell>
                    <TableCell>{receipt.customerName}</TableCell>
                    <TableCell>{receipt.invoiceNumber}</TableCell>
                    <TableCell>{receipt.receiptDate}</TableCell>
                    <TableCell>{receipt.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      {paymentMethodLabel[receipt.paymentMethod]}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusBadge[receipt.status]}>
                        {receipt.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          navigate(`/sales/payment-receipts/${receipt.id}`)
                        }
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {receipt.status === "pending" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => reconcile(receipt.id)}
                          title="Reconcile"
                        >
                          ✓
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteReceipt(receipt.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {receipts.length === 0 && (
              <p className="text-sm text-muted-foreground py-6 text-center">
                No payment receipts. Record one from a transaction.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
