import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { safeReadJson } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { Calendar, Plus, Settings } from "lucide-react";
import { useData } from "@/contexts/DataContext";

type DocumentType = "Invoices" | "Delivery Challan";
type TransactionSubType = "Supply" | "Export" | "Import";
type TransactionType =
  | "Regular"
  | "Bill To - Ship To"
  | "Bill From - Dispatch From";
type EWayStatus = "Not Generated" | "Generated";

type ModeOfTransportation = "Road" | "Rail" | "Air" | "Ship";
type VehicleType = "Regular" | "Over Dimensional Cargo";

interface EWayBill {
  id: string;
  documentType: DocumentType;
  transactionSubType: TransactionSubType;
  customerName: string;
  customerGstin: string;
  transactionNumber: string;
  transactionType: TransactionType;
  date: string;
  expiryDate: string;
  placeOfDelivery: string;
  dispatchFrom: string;
  transporterName: string;
  distanceKm: number;
  modeOfTransportation: ModeOfTransportation;
  vehicleType: VehicleType;
  vehicleNumber: string;
  transporterDocNo: string;
  transporterDocDate: string;
  status: EWayStatus;
  total: number;
}

const STORAGE_KEY = "nido_eway_bills_v3";

const defaultBills: EWayBill[] = [];

const addDays = (value: string, days: number) => {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const formatMoney = (value: number) => `Rs.${value.toFixed(2)}`;

export default function EWayBillsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { clients, invoices } = useData();

  const [bills, setBills] = useState<EWayBill[]>(() =>
    safeReadJson<EWayBill[]>(STORAGE_KEY, defaultBills),
  );
  const [createOpen, setCreateOpen] = useState(
    location.pathname.endsWith("/create"),
  );

  const [periodFilter, setPeriodFilter] = useState("This Month");
  const [transactionFilter, setTransactionFilter] = useState<
    DocumentType | "All"
  >("Invoices");
  const [statusFilter, setStatusFilter] = useState<EWayStatus | "All">(
    "Not Generated",
  );

  const [form, setForm] = useState({
    documentType: "Invoices" as DocumentType,
    transactionSubType: "Supply" as TransactionSubType,
    customerName: clients[0]?.name || "Nido Technologies",
    transactionNumber: "",
    date: new Date().toISOString().slice(0, 10),
    transactionType: "Regular" as TransactionType,
    dispatchFrom:
      clients[0]?.locationDetails?.address || clients[0]?.address || "",
    placeOfDelivery: clients[0]?.locationDetails?.state || "",
    transporterName: "",
    distanceKm: "",
    modeOfTransportation: "Road" as ModeOfTransportation,
    vehicleType: "Regular" as VehicleType,
    vehicleNumber: "",
    transporterDocNo: "",
    transporterDocDate: "",
    total: "0",
  });

  const persist = (next: EWayBill[]) => {
    setBills(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  useEffect(() => {
    if (location.pathname.endsWith("/create")) setCreateOpen(true);
  }, [location.pathname]);

  const filtered = useMemo(() => {
    return bills.filter((bill) => {
      const matchesTransaction =
        transactionFilter === "All" || bill.documentType === transactionFilter;
      const matchesStatus =
        statusFilter === "All" || bill.status === statusFilter;
      return matchesTransaction && matchesStatus;
    });
  }, [bills, statusFilter, transactionFilter]);

  const statusCount = useMemo(
    () => bills.filter((entry) => entry.status === "Not Generated").length,
    [bills],
  );

  const bindCustomer = (name: string) => {
    const customer = clients.find((entry) => entry.name === name);
    setForm((current) => ({
      ...current,
      customerName: name,
      dispatchFrom:
        customer?.locationDetails?.address ||
        customer?.address ||
        current.dispatchFrom,
      placeOfDelivery:
        customer?.locationDetails?.state || current.placeOfDelivery,
    }));
  };

  const save = (status: EWayStatus) => {
    const customer = clients.find((entry) => entry.name === form.customerName);
    const fallbackInvoice = invoices[0];
    const transactionNumber =
      form.transactionNumber ||
      fallbackInvoice?.invoiceNumber ||
      `${form.documentType === "Invoices" ? "INV" : "DC"}-${Date.now().toString().slice(-5)}`;

    const next: EWayBill = {
      id: `eway-${Date.now()}`,
      documentType: form.documentType,
      transactionSubType: form.transactionSubType,
      customerName: form.customerName,
      customerGstin: customer?.gst || "",
      transactionNumber,
      transactionType: form.transactionType,
      date: form.date,
      expiryDate: addDays(form.date, 1),
      placeOfDelivery: form.placeOfDelivery,
      dispatchFrom: form.dispatchFrom,
      transporterName: form.transporterName,
      distanceKm: Number(form.distanceKm) || 0,
      modeOfTransportation: form.modeOfTransportation,
      vehicleType: form.vehicleType,
      vehicleNumber: form.vehicleNumber,
      transporterDocNo: form.transporterDocNo,
      transporterDocDate: form.transporterDocDate,
      status,
      total: Number(form.total) || 0,
    };

    persist([next, ...bills]);
    setCreateOpen(false);
    navigate("/sales/e-way-bills", { replace: true });
    toast({
      title:
        status === "Generated" ? "e-Way bill generated" : "e-Way bill saved",
    });
  };

  return (
    <div>
      <Header title="e-Way Bills" />
      <div className="space-y-4 p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">e-Way Bills</h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    toast({ title: "Portal settings panel opened" })
                  }
                >
                  <Settings className="mr-2 h-4 w-4" /> Change e-Way Bill Portal
                  Settings
                </Button>
                <Button
                  size="sm"
                  onClick={() => navigate("/sales/e-way-bills/create")}
                >
                  <Plus className="mr-2 h-4 w-4" /> New
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/20 p-3">
              <span className="text-sm text-muted-foreground">
                Transaction Period:
              </span>
              <Select value={periodFilter} onValueChange={setPeriodFilter}>
                <SelectTrigger className="w-40">
                  <Calendar className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Today">Today</SelectItem>
                  <SelectItem value="This Week">This Week</SelectItem>
                  <SelectItem value="This Month">This Month</SelectItem>
                  <SelectItem value="Custom">Custom</SelectItem>
                </SelectContent>
              </Select>

              <span className="text-sm text-muted-foreground">
                Transaction Type:
              </span>
              <Select
                value={transactionFilter}
                onValueChange={(value: DocumentType | "All") =>
                  setTransactionFilter(value)
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  <SelectItem value="Invoices">Invoices</SelectItem>
                  <SelectItem value="Delivery Challan">
                    Delivery Challan
                  </SelectItem>
                </SelectContent>
              </Select>

              <span className="text-sm text-muted-foreground">
                e-Way Bill Status:
              </span>
              <Select
                value={statusFilter}
                onValueChange={(value: EWayStatus | "All") =>
                  setStatusFilter(value)
                }
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  <SelectItem value="Not Generated">
                    Not Generated ({statusCount})
                  </SelectItem>
                  <SelectItem value="Generated">Generated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">
                    <Checkbox checked={false} />
                  </TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Transaction#</TableHead>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Customer GSTIN</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((bill) => (
                  <TableRow key={bill.id}>
                    <TableCell>
                      <Checkbox checked={false} />
                    </TableCell>
                    <TableCell>{bill.date}</TableCell>
                    <TableCell>{bill.transactionNumber}</TableCell>
                    <TableCell>{bill.customerName}</TableCell>
                    <TableCell>{bill.customerGstin || "-"}</TableCell>
                    <TableCell>{bill.expiryDate}</TableCell>
                    <TableCell className="text-right">
                      {formatMoney(bill.total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filtered.length === 0 && (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Yay! You do not have any pending invoices for which e-way bills
                have to be generated.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) navigate("/sales/e-way-bills", { replace: true });
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New e-Way Bill</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Document Type*</Label>
                <Select
                  value={form.documentType}
                  onValueChange={(value: DocumentType) =>
                    setForm((current) => ({ ...current, documentType: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Invoices">Invoices</SelectItem>
                    <SelectItem value="Delivery Challan">
                      Delivery Challan
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Transaction Sub Type*</Label>
                <Select
                  value={form.transactionSubType}
                  onValueChange={(value: TransactionSubType) =>
                    setForm((current) => ({
                      ...current,
                      transactionSubType: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Supply">Supply</SelectItem>
                    <SelectItem value="Export">Export</SelectItem>
                    <SelectItem value="Import">Import</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Customer Name*</Label>
                <Select value={form.customerName} onValueChange={bindCustomer}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.name}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>
                  {form.documentType === "Invoices"
                    ? "Invoice#*"
                    : "Delivery Challan#*"}
                </Label>
                <Select
                  value={form.transactionNumber || "none"}
                  onValueChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      transactionNumber: value === "none" ? "" : value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select</SelectItem>
                    {invoices.slice(0, 20).map((invoice) => (
                      <SelectItem
                        key={invoice.id}
                        value={invoice.invoiceNumber}
                      >
                        {invoice.invoiceNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      date: event.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <Label>Transaction Type*</Label>
                <Select
                  value={form.transactionType}
                  onValueChange={(value: TransactionType) =>
                    setForm((current) => ({
                      ...current,
                      transactionType: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Regular">Regular</SelectItem>
                    <SelectItem value="Bill To - Ship To">
                      Bill To - Ship To
                    </SelectItem>
                    <SelectItem value="Bill From - Dispatch From">
                      Bill From - Dispatch From
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Address Details
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Dispatch / From</Label>
                  <TextareaLike
                    value={form.dispatchFrom}
                    onChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        dispatchFrom: value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label>Place of Delivery*</Label>
                  <Input
                    value={form.placeOfDelivery}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        placeOfDelivery: event.target.value,
                      }))
                    }
                    placeholder="State"
                  />
                  <button
                    type="button"
                    className="mt-2 text-xs text-blue-600"
                    onClick={() => toast({ title: "PIN details panel opened" })}
                  >
                    PIN Details
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Transportation Details
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Transporter</Label>
                  <Input
                    value={form.transporterName}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        transporterName: event.target.value,
                      }))
                    }
                    placeholder="Select the transporter's name"
                  />
                </div>
                <div>
                  <Label>Distance (in KM)*</Label>
                  <div className="flex gap-2">
                    <Input
                      value={form.distanceKm}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          distanceKm: event.target.value,
                        }))
                      }
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        toast({ title: "Distance calculation executed" })
                      }
                    >
                      Calculate Distance
                    </Button>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    If you enter 0 as the distance, e-way bill system will
                    automatically calculate it based on dispatch and delivery
                    locations.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Part B
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Mode of Transportation</Label>
                  <Select
                    value={form.modeOfTransportation}
                    onValueChange={(value: ModeOfTransportation) =>
                      setForm((current) => ({
                        ...current,
                        modeOfTransportation: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Road">Road</SelectItem>
                      <SelectItem value="Rail">Rail</SelectItem>
                      <SelectItem value="Air">Air</SelectItem>
                      <SelectItem value="Ship">Ship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Vehicle Type</Label>
                  <div className="mt-2 flex items-center gap-4 text-sm">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={form.vehicleType === "Regular"}
                        onChange={() =>
                          setForm((current) => ({
                            ...current,
                            vehicleType: "Regular",
                          }))
                        }
                      />
                      Regular
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={form.vehicleType === "Over Dimensional Cargo"}
                        onChange={() =>
                          setForm((current) => ({
                            ...current,
                            vehicleType: "Over Dimensional Cargo",
                          }))
                        }
                      />
                      Over Dimensional Cargo
                    </label>
                  </div>
                </div>

                <div>
                  <Label>Vehicle No</Label>
                  <Input
                    value={form.vehicleNumber}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        vehicleNumber: event.target.value,
                      }))
                    }
                  />
                </div>

                <div>
                  <Label>Transporter's Doc No</Label>
                  <Input
                    value={form.transporterDocNo}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        transporterDocNo: event.target.value,
                      }))
                    }
                  />
                </div>

                <div>
                  <Label>Transporter's Doc Date</Label>
                  <Input
                    type="date"
                    value={form.transporterDocDate}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        transporterDocDate: event.target.value,
                      }))
                    }
                  />
                </div>

                <div>
                  <Label>Total</Label>
                  <Input
                    value={form.total}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        total: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => save("Not Generated")}>
                Save
              </Button>
              <Button onClick={() => save("Generated")}>
                Save and Generate
              </Button>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TextareaLike({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
    />
  );
}
