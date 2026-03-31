import { useMemo, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useData } from "@/contexts/DataContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Upload, Download } from "lucide-react";

export default function OrdersPage() {
  const { orders, updateOrder } = useData();
  const navigate = useNavigate();

  const [selected, setSelected] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState("");
  const [bulkComment, setBulkComment] = useState("");
  const [templateName, setTemplateName] = useState("");

  const allChecked = useMemo(
    () => orders.length > 0 && selected.length === orders.length,
    [orders.length, selected.length],
  );

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const toggleAll = () => {
    if (allChecked) {
      setSelected([]);
      return;
    }
    setSelected(orders.map((o) => o.id));
  };

  const applyBulk = () => {
    if (!bulkAction) {
      toast({ title: "Select a bulk action" });
      return;
    }
    if (selected.length === 0) {
      toast({ title: "Select at least one order" });
      return;
    }

    selected.forEach((id) => {
      const target = orders.find((o) => o.id === id);
      if (!target) return;

      if (bulkAction === "complete") {
        updateOrder(id, { status: "Completed" });
        return;
      }

      if (bulkAction === "cancel") {
        updateOrder(id, { status: "Cancelled" });
        return;
      }

      if (bulkAction === "comments") {
        updateOrder(id, {
          comments: [
            ...target.comments,
            {
              id: `c-${Date.now()}-${id}`,
              user: "System",
              text: bulkComment || "Bulk comment updated",
              timestamp: new Date().toISOString(),
              type: "internal",
            },
          ],
        });
      }
    });

    toast({ title: "Bulk update applied" });
    setSelected([]);
    setBulkComment("");
    setBulkAction("");
  };

  const onUploadTemplate = (evt: ChangeEvent<HTMLInputElement>) => {
    const file = evt.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast({ title: "Upload a CSV template only" });
      return;
    }
    setTemplateName(file.name);
    toast({ title: `Template ${file.name} uploaded` });
  };

  const downloadTemplate = () => {
    const headers = ["order_number", "status", "comments", "assigned_user"];
    const sample = ["2498563", "Processing", "Urgent order", "Mark Adams"];
    const csv = [headers, sample].map((r) => r.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "order-bulk-template.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Template downloaded" });
  };

  return (
    <div>
      <Header title="Order Details" />

      <div className="p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={bulkAction} onValueChange={setBulkAction}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Bulk Update" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="complete">Mark Completed</SelectItem>
              <SelectItem value="cancel">Cancel Orders</SelectItem>
              <SelectItem value="comments">Update Comments</SelectItem>
            </SelectContent>
          </Select>

          {bulkAction === "comments" && (
            <Input
              className="w-72"
              placeholder="Enter bulk comment"
              value={bulkComment}
              onChange={(e) => setBulkComment(e.target.value)}
            />
          )}

          <Button onClick={applyBulk}>Apply</Button>

          <label className="inline-flex">
            <input
              className="hidden"
              type="file"
              accept=".csv"
              onChange={onUploadTemplate}
            />
            <Button variant="outline" asChild>
              <span>
                <Upload className="h-4 w-4 mr-1" /> Upload Template
              </span>
            </Button>
          </label>

          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="h-4 w-4 mr-1" /> Download Template
          </Button>

          {templateName && (
            <span className="text-xs text-muted-foreground">
              Uploaded: {templateName}
            </span>
          )}
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox checked={allChecked} onCheckedChange={toggleAll} />
              </TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned User</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {orders.map((o) => (
              <TableRow
                key={o.id}
                className="cursor-pointer"
                onClick={() => navigate(`/orders/${o.id}`)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selected.includes(o.id)}
                    onCheckedChange={() => toggle(o.id)}
                  />
                </TableCell>
                <TableCell>{o.orderNumber}</TableCell>
                <TableCell>{o.organization}</TableCell>
                <TableCell>{o.status}</TableCell>
                <TableCell>
                  {o.assignedUser || o.assignedAnalyst || "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
