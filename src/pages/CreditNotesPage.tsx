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

interface CreditNote {
  id: string;
  creditNoteNumber: string;
  customerName: string;
  invoiceNumber: string;
  issueDate: string;
  amount: number;
  reason: "return" | "adjustment" | "complaint" | "other";
  status: "draft" | "issued" | "applied";
  description: string;
}

const defaultCreditNotes: CreditNote[] = [
  {
    id: "cn-1",
    creditNoteNumber: "CN-001",
    customerName: "ABC Corp",
    invoiceNumber: "INV-2604",
    issueDate: "2026-04-02",
    amount: 10000,
    reason: "return",
    status: "issued",
    description: "Product returned - defective unit",
  },
];

export default function CreditNotesPage() {
  const navigate = useNavigate();

  const [creditNotes, setCreditNotes] = useState<CreditNote[]>(() => {
    const stored = safeReadJson<CreditNote[]>(
      "nido_credit_notes",
      defaultCreditNotes,
    );
    return stored;
  });

  const updateStorage = (next: CreditNote[]) => {
    setCreditNotes(next);
    localStorage.setItem("nido_credit_notes", JSON.stringify(next));
  };

  const deleteNote = (id: string) => {
    updateStorage(creditNotes.filter((n) => n.id !== id));
    toast({ title: "Credit note deleted" });
  };

  const updateStatus = (id: string, status: CreditNote["status"]) => {
    updateStorage(creditNotes.map((n) => (n.id === id ? { ...n, status } : n)));
    toast({ title: "Status updated" });
  };

  const reasonLabel: Record<CreditNote["reason"], string> = {
    return: "Product Return",
    adjustment: "Price Adjustment",
    complaint: "Complaint",
    other: "Other",
  };

  const statusBadge: Record<string, "default" | "secondary" | "outline"> = {
    draft: "secondary",
    issued: "outline",
    applied: "default",
  };

  return (
    <div>
      <Header title="Credit Notes" />
      <div className="p-6 space-y-4">
        <Card>
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Issue customer credits for returns, adjustments, or complaints
              </p>
              <p className="text-xl font-semibold">
                {creditNotes.length} Credit Notes
              </p>
            </div>
            <Button onClick={() => navigate("/sales/credit-notes/create")}>
              Create Credit Note
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Credit Note #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {creditNotes.map((note) => (
                  <TableRow key={note.id}>
                    <TableCell className="font-medium">
                      {note.creditNoteNumber}
                    </TableCell>
                    <TableCell>{note.customerName}</TableCell>
                    <TableCell>{note.invoiceNumber}</TableCell>
                    <TableCell>{note.issueDate}</TableCell>
                    <TableCell>{note.amount.toLocaleString()}</TableCell>
                    <TableCell>{reasonLabel[note.reason]}</TableCell>
                    <TableCell>
                      <Badge variant={statusBadge[note.status]}>
                        {note.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          navigate(`/sales/credit-notes/${note.id}`)
                        }
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          navigate(`/sales/credit-notes/${note.id}/edit`)
                        }
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteNote(note.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {creditNotes.length === 0 && (
              <p className="text-sm text-muted-foreground py-6 text-center">
                No credit notes. Create one when customer returns goods.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
