import { useState, useMemo } from "react";
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
import { useData } from "@/contexts/DataContext";
import { safeReadJson } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { Edit, Eye, Trash2 } from "lucide-react";

interface RecurringInvoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  frequency: "monthly" | "quarterly" | "annual";
  nextDueDate: string;
  amount: number;
  status: "active" | "paused" | "completed";
  itemDescription: string;
}

const defaultRecurringInvoices: RecurringInvoice[] = [
  {
    id: "ri-1",
    invoiceNumber: "REC-001",
    customerName: "ABC Corp",
    frequency: "monthly",
    nextDueDate: "2026-05-01",
    amount: 50000,
    status: "active",
    itemDescription: "Monthly subscription",
  },
];

export default function RecurringInvoicesPage() {
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState<RecurringInvoice[]>(() => {
    const stored = safeReadJson<RecurringInvoice[]>(
      "nido_recurring_invoices",
      defaultRecurringInvoices,
    );
    return stored;
  });

  const updateStorage = (next: RecurringInvoice[]) => {
    setInvoices(next);
    localStorage.setItem("nido_recurring_invoices", JSON.stringify(next));
  };

  const deleteInvoice = (id: string) => {
    updateStorage(invoices.filter((inv) => inv.id !== id));
    toast({ title: "Recurring invoice deleted" });
  };

  const toggleStatus = (id: string) => {
    updateStorage(
      invoices.map((inv) =>
        inv.id === id
          ? {
              ...inv,
              status:
                inv.status === "active"
                  ? "paused"
                  : inv.status === "paused"
                    ? "active"
                    : "completed",
            }
          : inv,
      ),
    );
  };

  const frequencyLabel = {
    monthly: "Monthly",
    quarterly: "Quarterly",
    annual: "Annual",
  };

  const statusBadge = {
    active: "default",
    paused: "secondary",
    completed: "outline",
  } as const;

  return (
    <div>
      <Header title="Recurring Invoices" />
      <div className="p-6 space-y-4">
        <Card>
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Automate recurring billing and manage subscription invoices
              </p>
              <p className="text-xl font-semibold">{invoices.length} Active</p>
            </div>
            <Button
              onClick={() => navigate("/sales/recurring-invoices/create")}
            >
              Create Recurring Invoice
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Next Due</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      {invoice.invoiceNumber}
                    </TableCell>
                    <TableCell>{invoice.customerName}</TableCell>
                    <TableCell>{frequencyLabel[invoice.frequency]}</TableCell>
                    <TableCell>{invoice.nextDueDate}</TableCell>
                    <TableCell>{invoice.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={statusBadge[invoice.status]}>
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleStatus(invoice.id)}
                        title={invoice.status === "active" ? "Pause" : "Resume"}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          navigate(
                            `/sales/recurring-invoices/${invoice.id}/edit`,
                          )
                        }
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteInvoice(invoice.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {invoices.length === 0 && (
              <p className="text-sm text-muted-foreground py-6 text-center">
                No recurring invoices. Create one to automate billing.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
