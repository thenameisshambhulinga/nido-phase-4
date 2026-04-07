import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
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
import { Plus, Search, Trash2 } from "lucide-react";
import type { Invoice, SalesLineItem } from "@/contexts/DataContext";

type InvoiceDraftItem = SalesLineItem & { catalogItemId?: string };

type InvoiceDraft = {
  customerId: string;
  customerName: string;
  invoiceNumber: string;
  referenceSalesOrderId: string;
  invoiceDate: string;
  dueDate: string;
  paymentTerms: string;
  billingAddress: string;
  shippingAddress: string;
  placeOfSupply: string;
  emailRecipients: string;
  notes: string;
  termsAndConditions: string;
  bankDetails: string;
  shippingCharges: number;
  adjustment: number;
  items: InvoiceDraftItem[];
};

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const safeNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatCurrency = (value: unknown) => currency.format(safeNumber(value));

const statusVariant: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  DRAFT: "secondary",
  SENT: "outline",
  "PARTIALLY PAID": "outline",
  PAID: "default",
  OVERDUE: "destructive",
  UNPAID: "secondary",
};

const nextNumber = (prefix: string, existing: string[]) => {
  const highest = existing.reduce((max, value) => {
    const match = value.match(new RegExp(`^${prefix}-(\\d+)$`));
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return `${prefix}-${String(highest + 1).padStart(5, "0")}`;
};

const today = () => new Date().toISOString().slice(0, 10);
const addDays = (days: number) =>
  new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
const emptyItem = (): InvoiceDraftItem => ({
  id: `invl-${Date.now()}`,
  itemName: "",
  description: "",
  hsnSac: "",
  quantity: 1,
  rate: 0,
  discount: 0,
  taxRate: 18,
  amount: 0,
});

export default function InvoicePage() {
  const navigate = useNavigate();
  const { invoices, salesOrders, clients, masterCatalogItems, createInvoice } =
    useData();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const deferredSearch = useDeferredValue(search);
  const [customerQuery, setCustomerQuery] = useState("");
  const [draft, setDraft] = useState<InvoiceDraft>(() => ({
    customerId: "",
    customerName: "",
    invoiceNumber: nextNumber(
      "INV",
      invoices.map((entry) => entry.invoiceNumber),
    ),
    referenceSalesOrderId: "",
    invoiceDate: today(),
    dueDate: today(),
    paymentTerms: "Due on Receipt",
    billingAddress: "",
    shippingAddress: "",
    placeOfSupply: "",
    emailRecipients: "",
    notes: "",
    termsAndConditions: "",
    bankDetails: "",
    shippingCharges: 0,
    adjustment: 0,
    items: [emptyItem()],
  }));

  useEffect(() => {
    if (!showCreate) return;
    const firstCustomer = clients[0];
    setDraft({
      customerId: firstCustomer?.id || "",
      customerName: firstCustomer?.name || "",
      invoiceNumber: nextNumber(
        "INV",
        invoices.map((entry) => entry.invoiceNumber),
      ),
      referenceSalesOrderId: "",
      invoiceDate: today(),
      dueDate: addDays(0),
      paymentTerms: "Due on Receipt",
      billingAddress:
        firstCustomer?.locationDetails?.address || firstCustomer?.address || "",
      shippingAddress:
        firstCustomer?.locationDetails?.address || firstCustomer?.address || "",
      placeOfSupply: firstCustomer?.locationDetails?.state || "",
      emailRecipients: firstCustomer?.email || "",
      notes: "",
      termsAndConditions: "",
      bankDetails: "",
      shippingCharges: 0,
      adjustment: 0,
      items: [emptyItem()],
    });
    setCustomerQuery(firstCustomer?.name || "");
  }, [clients, invoices, showCreate]);

  const filteredInvoices = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    if (!query) return invoices;
    return invoices.filter((invoice) => {
      const haystack = [
        invoice.invoiceNumber,
        invoice.customerName,
        invoice.vendorOrClient,
        invoice.status,
        invoice.paymentStatus,
        invoice.dueDate,
        invoice.invoiceDate,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [deferredSearch, invoices]);

  const filteredClients = useMemo(() => {
    const normalized = customerQuery.trim().toLowerCase();
    if (!normalized) return clients.slice(0, 6);
    return clients
      .filter((client) => {
        const haystack = [
          client.name,
          client.companyName,
          client.clientCode,
          client.email,
          client.contactPerson,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(normalized);
      })
      .slice(0, 8);
  }, [clients, customerQuery]);

  const selectedSalesOrder = useMemo(
    () => salesOrders.find((order) => order.id === draft.referenceSalesOrderId),
    [draft.referenceSalesOrderId, salesOrders],
  );

  const totals = useMemo(() => {
    const subtotal = draft.items.reduce((sum, item) => sum + item.amount, 0);
    const tax = draft.items.reduce(
      (sum, item) => sum + (item.amount * item.taxRate) / 100,
      0,
    );
    const total = subtotal + tax + draft.shippingCharges + draft.adjustment;
    return {
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  }, [draft.adjustment, draft.items, draft.shippingCharges]);

  const updateItem = (index: number, patch: Partial<InvoiceDraftItem>) => {
    setDraft((current) => {
      const items = [...current.items];
      items[index] = { ...items[index], ...patch };
      if (
        patch.quantity !== undefined ||
        patch.rate !== undefined ||
        patch.discount !== undefined
      ) {
        const quantity = Number(items[index].quantity || 0);
        const rate = Number(items[index].rate || 0);
        const discount = Number(items[index].discount || 0);
        items[index].amount = Math.max(0, quantity * rate - discount);
      }
      return { ...current, items };
    });
  };

  const applyCustomer = (clientId: string) => {
    const selected = clients.find((client) => client.id === clientId);
    if (!selected) return;
    const address = selected.locationDetails?.address || selected.address;
    setDraft((current) => ({
      ...current,
      customerId: selected.id,
      customerName: selected.name,
      billingAddress: address,
      shippingAddress: address,
      placeOfSupply: selected.locationDetails?.state || current.placeOfSupply,
      emailRecipients: selected.email,
    }));
    setCustomerQuery(selected.name);
  };

  const applySalesOrder = (salesOrderId: string) => {
    if (salesOrderId === "none") {
      setDraft((current) => ({
        ...current,
        referenceSalesOrderId: "",
      }));
      return;
    }

    const selected = salesOrders.find((order) => order.id === salesOrderId);
    if (!selected) return;
    setDraft((current) => ({
      ...current,
      referenceSalesOrderId: selected.id,
      customerId: selected.customerId || current.customerId,
      customerName: selected.customerName,
      invoiceDate: today(),
      dueDate: selected.expectedShipmentDate || today(),
      paymentTerms: selected.paymentTerms,
      billingAddress: selected.billingAddress,
      shippingAddress: selected.shippingAddress,
      placeOfSupply: selected.placeOfSupply,
      emailRecipients: selected.emailRecipients.join(", "),
      notes: selected.customerNotes,
      termsAndConditions: selected.termsAndConditions,
      bankDetails: selected.bankDetails,
      items: selected.items.map((item) => ({
        ...item,
        catalogItemId: undefined,
      })),
      shippingCharges: selected.shippingCharges ?? 0,
      adjustment: selected.adjustment,
    }));
    setCustomerQuery(selected.customerName);
  };

  const applyCatalogItem = (index: number, catalogItemId: string) => {
    const item = masterCatalogItems.find((entry) => entry.id === catalogItemId);
    if (!item) return;
    const quantity = draft.items[index]?.quantity || 1;
    const rate = Number(item.discountPrice ?? item.price ?? 0);
    updateItem(index, {
      catalogItemId,
      itemName: item.name,
      description: item.description || "",
      hsnSac: item.hsnCode || "",
      rate,
      taxRate: 18,
      quantity,
      discount: 0,
      amount: Math.max(0, quantity * rate),
    });
  };

  const addRow = () =>
    setDraft((current) => ({
      ...current,
      items: [...current.items, emptyItem()],
    }));
  const removeRow = (index: number) =>
    setDraft((current) => ({
      ...current,
      items:
        current.items.length > 1
          ? current.items.filter((_, itemIndex) => itemIndex !== index)
          : [emptyItem()],
    }));

  const saveInvoice = (status: Invoice["status"]) => {
    if (!draft.customerName.trim()) {
      toast({ title: "Select a customer before saving" });
      return;
    }

    const amountPaid = status === "PAID" ? totals.total : 0;
    const created = createInvoice({
      invoiceNumber: draft.invoiceNumber,
      referenceSalesOrderId: draft.referenceSalesOrderId || undefined,
      customerName: draft.customerName,
      customerId: draft.customerId || undefined,
      vendorOrClient: draft.customerName,
      type: "client",
      invoiceDate: draft.invoiceDate,
      issueDate: draft.invoiceDate,
      dueDate: draft.dueDate,
      paymentTerms: draft.paymentTerms,
      billingAddress: draft.billingAddress,
      shippingAddress: draft.shippingAddress,
      placeOfSupply: draft.placeOfSupply,
      emailRecipients: draft.emailRecipients
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean),
      items: draft.items.map((item) => ({
        id: item.id,
        itemName: item.itemName,
        description: item.description,
        hsnSac: item.hsnSac,
        quantity: Number(item.quantity) || 0,
        rate: Number(item.rate) || 0,
        discount: Number(item.discount) || 0,
        taxRate: Number(item.taxRate) || 0,
        amount: Math.round((Number(item.amount) || 0) * 100) / 100,
      })),
      subtotal: totals.subtotal,
      cgst: Math.round((totals.tax / 2) * 100) / 100,
      sgst: Math.round((totals.tax / 2) * 100) / 100,
      adjustment: draft.adjustment,
      shippingCharges: draft.shippingCharges,
      total: totals.total,
      amountPaid,
      balanceDue: Math.max(0, totals.total - amountPaid),
      status,
      paymentStatus:
        amountPaid >= totals.total
          ? "PAID"
          : amountPaid > 0
            ? "PARTIALLY PAID"
            : "UNPAID",
      notes: draft.notes,
      termsAndConditions: draft.termsAndConditions,
      bankDetails: draft.bankDetails,
      createdBy: "System",
    });

    toast({ title: `Invoice ${created.invoiceNumber} created` });
    setShowCreate(false);
    navigate(`/sales/invoices/${created.id}`);
  };

  return (
    <div>
      <Header title="Invoices" />
      <div className="p-6 space-y-4">
        <Card className="border-border/60 shadow-sm">
          <CardContent className="flex flex-col gap-4 pt-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Manage tax invoices created from sales orders or added manually.
              </p>
              <p className="text-2xl font-semibold">
                {invoices.length} Invoices
              </p>
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <Input
                className="md:w-72"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search invoice, customer, status..."
              />
              <Button onClick={() => setShowCreate(true)}>
                <Plus className="mr-2 h-4 w-4" /> New Invoice
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">All Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow
                      key={invoice.id}
                      className="transition-colors hover:bg-muted/50"
                    >
                      <TableCell>
                        {invoice.invoiceDate || invoice.issueDate || "-"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="link"
                          className="h-auto p-0 font-medium text-primary"
                          onClick={() =>
                            navigate(`/sales/invoices/${invoice.id}`)
                          }
                        >
                          {invoice.invoiceNumber}
                        </Button>
                      </TableCell>
                      <TableCell>
                        {invoice.customerName || invoice.vendorOrClient || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={statusVariant[invoice.status] || "outline"}
                        >
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            statusVariant[invoice.paymentStatus] || "outline"
                          }
                        >
                          {invoice.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(invoice.total)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {filteredInvoices.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No invoices found.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-6xl p-0 overflow-hidden">
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle className="text-xl font-semibold">
              New Invoice
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-0 lg:grid-cols-[1fr_360px] max-h-[85vh]">
            <ScrollArea className="max-h-[85vh]">
              <div className="p-6 space-y-6">
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="space-y-2 lg:col-span-2">
                    <Label>Customer Name*</Label>
                    <div className="space-y-2 rounded-lg border bg-background p-3 shadow-sm">
                      <div className="flex items-center gap-2">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <Input
                          value={customerQuery}
                          onChange={(event) =>
                            setCustomerQuery(event.target.value)
                          }
                          placeholder="Select or search a customer"
                          className="border-0 shadow-none px-0 focus-visible:ring-0"
                        />
                      </div>
                      <div className="max-h-40 overflow-auto rounded-md border bg-muted/20">
                        {filteredClients.map((client) => (
                          <button
                            key={client.id}
                            type="button"
                            onClick={() => applyCustomer(client.id)}
                            className="flex w-full items-start justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-muted"
                          >
                            <div>
                              <p className="font-medium">{client.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {client.email}
                              </p>
                            </div>
                            <Badge variant="secondary">{client.status}</Badge>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label>Invoice#</Label>
                    <Input
                      value={draft.invoiceNumber}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                  <div>
                    <Label>Order Number</Label>
                    <Select
                      value={draft.referenceSalesOrderId}
                      onValueChange={applySalesOrder}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Link sales order" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {salesOrders.map((order) => (
                          <SelectItem key={order.id} value={order.id}>
                            {order.salesOrderNumber} - {order.customerName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Invoice Date</Label>
                    <Input
                      type="date"
                      value={draft.invoiceDate}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          invoiceDate: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label>Due Date</Label>
                    <Input
                      type="date"
                      value={draft.dueDate}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          dueDate: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label>Terms</Label>
                    <Select
                      value={draft.paymentTerms}
                      onValueChange={(value) =>
                        setDraft((current) => ({
                          ...current,
                          paymentTerms: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["Due on Receipt", "Net 15", "Net 30", "Advance"].map(
                          (term) => (
                            <SelectItem key={term} value={term}>
                              {term}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div>
                    <Label>Billing Address</Label>
                    <textarea
                      value={draft.billingAddress}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          billingAddress: event.target.value,
                        }))
                      }
                      className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                    />
                  </div>
                  <div>
                    <Label>Shipping Address</Label>
                    <textarea
                      value={draft.shippingAddress}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          shippingAddress: event.target.value,
                        }))
                      }
                      className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                    />
                  </div>
                </div>

                <div className="rounded-xl border bg-card shadow-sm">
                  <div className="flex items-center justify-between border-b px-4 py-3">
                    <div>
                      <p className="font-semibold">Item Table</p>
                      <p className="text-xs text-muted-foreground">
                        Select from the master catalogue or keep the existing
                        sales order items.
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={addRow}>
                      <Plus className="mr-2 h-4 w-4" /> Add Row
                    </Button>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[260px]">Item</TableHead>
                        <TableHead>HSN/SAC</TableHead>
                        <TableHead className="w-24">Qty</TableHead>
                        <TableHead className="w-28">Rate</TableHead>
                        <TableHead className="w-24">Discount</TableHead>
                        <TableHead className="w-24">Tax</TableHead>
                        <TableHead className="w-28 text-right">
                          Amount
                        </TableHead>
                        <TableHead className="w-12" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {draft.items.map((item, index) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Select
                              value={item.catalogItemId || ""}
                              onValueChange={(value) =>
                                applyCatalogItem(index, value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select item" />
                              </SelectTrigger>
                              <SelectContent>
                                {masterCatalogItems.map((catalogItem) => (
                                  <SelectItem
                                    key={catalogItem.id}
                                    value={catalogItem.id}
                                  >
                                    {catalogItem.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input
                              className="mt-2"
                              value={item.description}
                              onChange={(event) =>
                                updateItem(index, {
                                  description: event.target.value,
                                })
                              }
                              placeholder="Description"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={item.hsnSac}
                              onChange={(event) =>
                                updateItem(index, {
                                  hsnSac: event.target.value,
                                })
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(event) =>
                                updateItem(index, {
                                  quantity: Number(event.target.value) || 0,
                                })
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              value={item.rate}
                              onChange={(event) =>
                                updateItem(index, {
                                  rate: Number(event.target.value) || 0,
                                })
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              value={item.discount}
                              onChange={(event) =>
                                updateItem(index, {
                                  discount: Number(event.target.value) || 0,
                                })
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              value={item.taxRate}
                              onChange={(event) =>
                                updateItem(index, {
                                  taxRate: Number(event.target.value) || 0,
                                })
                              }
                            />
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {item.amount.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeRow(index)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <Label>Customer Notes</Label>
                      <textarea
                        value={draft.notes}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            notes: event.target.value,
                          }))
                        }
                        className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                      />
                    </div>
                    <div>
                      <Label>Terms & Conditions</Label>
                      <textarea
                        value={draft.termsAndConditions}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            termsAndConditions: event.target.value,
                          }))
                        }
                        className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                      />
                    </div>
                    <div>
                      <Label>Bank Details</Label>
                      <textarea
                        value={draft.bankDetails}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            bankDetails: event.target.value,
                          }))
                        }
                        className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                      />
                    </div>
                  </div>
                  <Card className="lg:sticky lg:top-4 h-fit shadow-md">
                    <CardContent className="space-y-4 p-5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Sub Total</span>
                        <span className="font-semibold">
                          {totals.subtotal.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Shipping Charges
                        </span>
                        <Input
                          type="number"
                          className="ml-auto w-32 text-right"
                          value={draft.shippingCharges}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              shippingCharges: Number(event.target.value) || 0,
                            }))
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Tax</span>
                        <span className="font-semibold">
                          {totals.tax.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Adjustment
                        </span>
                        <Input
                          type="number"
                          className="ml-auto w-32 text-right"
                          value={draft.adjustment}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              adjustment: Number(event.target.value) || 0,
                            }))
                          }
                        />
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between text-lg font-semibold">
                        <span>Total ₹</span>
                        <span>{totals.total.toFixed(2)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Invoice totals and payment status are persisted in the
                        ERP store.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </ScrollArea>

            <div className="border-t bg-muted/30 px-6 py-4 lg:border-t-0 lg:border-l">
              <div className="flex flex-col gap-3">
                <Button onClick={() => saveInvoice("DRAFT")}>
                  Save as Draft
                </Button>
                <Button
                  variant="default"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => saveInvoice("SENT")}
                >
                  Save and Send
                </Button>
                <Button variant="outline" onClick={() => setShowCreate(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
