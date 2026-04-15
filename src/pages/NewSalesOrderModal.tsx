import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Search, Plus, Trash2 } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { toast } from "@/hooks/use-toast";
import { nextSequentialCode } from "@/lib/documentNumbering";
import type { SalesLineItem, SalesOrder } from "@/contexts/DataContext";

type OrderDraftItem = SalesLineItem & { catalogItemId?: string };

type SalesOrderDraft = {
  customerId: string;
  customerName: string;
  referenceNumber: string;
  salesOrderNumber: string;
  salesOrderDate: string;
  expectedShipmentDate: string;
  paymentTerms: string;
  deliveryMethod: string;
  billingAddress: string;
  shippingAddress: string;
  placeOfSupply: string;
  emailRecipients: string;
  customerNotes: string;
  termsAndConditions: string;
  bankDetails: string;
  shippingCharges: number;
  adjustment: number;
  items: OrderDraftItem[];
};

interface NewSalesOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order?: SalesOrder | null;
}

const emptyItem = (): OrderDraftItem => ({
  id: `soli-${Date.now()}`,
  itemName: "",
  description: "",
  hsnSac: "",
  quantity: 1,
  rate: 0,
  discount: 0,
  taxRate: 18,
  amount: 0,
});

const formatDate = (date: Date) => date.toISOString().slice(0, 10);

export default function NewSalesOrderModal({
  open,
  onOpenChange,
  order,
}: NewSalesOrderModalProps) {
  const navigate = useNavigate();
  const {
    clients,
    masterCatalogItems,
    salesOrders,
    createSalesOrder,
    updateSalesOrder,
    generalSettings,
    resolveClientProductPricing,
  } = useData();
  const activeSettings = Object.values(generalSettings)[0];
  const salesOrderPrefix = activeSettings?.salesOrderPrefix?.trim() || "SO";
  const pricingSourceLabel: Record<string, string> = {
    "client-fixed": "Client Fixed",
    "client-catalog": "Client Catalog",
    "service-tier": "Service Tier",
    master: "Master Price",
  };
  const [customerQuery, setCustomerQuery] = useState("");
  const [draft, setDraft] = useState<SalesOrderDraft>(() => ({
    customerId: "",
    customerName: "",
    referenceNumber: "",
    salesOrderNumber: nextSequentialCode(
      salesOrderPrefix,
      salesOrders.map((entry) => entry.salesOrderNumber),
      5,
    ),
    salesOrderDate: formatDate(new Date()),
    expectedShipmentDate: formatDate(new Date(Date.now() + 7 * 86400000)),
    paymentTerms: "Due on Receipt",
    deliveryMethod: "Standard",
    billingAddress: "",
    shippingAddress: "",
    placeOfSupply: "",
    emailRecipients: "",
    customerNotes: "",
    termsAndConditions: "",
    bankDetails: "",
    shippingCharges: 0,
    adjustment: 0,
    items: [emptyItem()],
  }));

  useEffect(() => {
    if (!open) return;
    if (order) {
      setDraft({
        customerId: order.customerId || "",
        customerName: order.customerName,
        referenceNumber: order.referenceNumber,
        salesOrderNumber: order.salesOrderNumber,
        salesOrderDate: order.salesOrderDate,
        expectedShipmentDate: order.expectedShipmentDate,
        paymentTerms: order.paymentTerms,
        deliveryMethod: order.deliveryMethod,
        billingAddress: order.billingAddress,
        shippingAddress: order.shippingAddress,
        placeOfSupply: order.placeOfSupply,
        emailRecipients: order.emailRecipients.join(", "),
        customerNotes: order.customerNotes,
        termsAndConditions: order.termsAndConditions,
        bankDetails: order.bankDetails,
        shippingCharges: order.shippingCharges ?? 0,
        adjustment: order.adjustment,
        items: order.items.map((item) => ({ ...item })),
      });
      setCustomerQuery(order.customerName);
      return;
    }

    const defaultCustomer = clients[0];
    setDraft({
      customerId: defaultCustomer?.id || "",
      customerName: defaultCustomer?.name || "",
      referenceNumber: "",
      salesOrderNumber: nextSequentialCode(
        salesOrderPrefix,
        salesOrders.map((entry) => entry.salesOrderNumber),
        5,
      ),
      salesOrderDate: formatDate(new Date()),
      expectedShipmentDate: formatDate(new Date(Date.now() + 7 * 86400000)),
      paymentTerms: "Due on Receipt",
      deliveryMethod: "Standard",
      billingAddress:
        defaultCustomer?.locationDetails?.address ||
        defaultCustomer?.address ||
        "",
      shippingAddress:
        defaultCustomer?.locationDetails?.address ||
        defaultCustomer?.address ||
        "",
      placeOfSupply: defaultCustomer?.locationDetails?.state || "",
      emailRecipients: defaultCustomer?.email || "",
      customerNotes: "",
      termsAndConditions: "",
      bankDetails: "",
      shippingCharges: 0,
      adjustment: 0,
      items: [emptyItem()],
    });
    setCustomerQuery(defaultCustomer?.name || "");
  }, [clients, open, order, salesOrderPrefix, salesOrders]);

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

  const updateItem = (index: number, patch: Partial<OrderDraftItem>) => {
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

  const applyCatalogItem = (index: number, catalogItemId: string) => {
    const item = masterCatalogItems.find((entry) => entry.id === catalogItemId);
    if (!item) return;
    const quantity = draft.items[index]?.quantity || 1;
    const pricing = resolveClientProductPricing({
      clientId: draft.customerId || undefined,
      productId: item.id,
      productCode: item.productCode,
      fallbackPrice: Number(item.discountPrice ?? item.price ?? 0),
    });
    const rate = pricing.unitPrice;
    updateItem(index, {
      catalogItemId,
      itemName: item.name,
      description: item.description || "",
      hsnSac: item.hsnCode || "",
      rate,
      pricingSource: pricing.source,
      taxRate: 18,
      quantity,
      discount: 0,
      amount: Math.max(0, quantity * rate),
    });
  };

  const addRow = () => {
    setDraft((current) => ({
      ...current,
      items: [...current.items, emptyItem()],
    }));
  };

  const removeRow = (index: number) => {
    setDraft((current) => ({
      ...current,
      items:
        current.items.length > 1
          ? current.items.filter((_, itemIndex) => itemIndex !== index)
          : [emptyItem()],
    }));
  };

  const saveOrder = (status: SalesOrder["status"]) => {
    if (!draft.customerName.trim()) {
      toast({ title: "Select a customer before saving" });
      return;
    }

    const payload = {
      salesOrderNumber: draft.salesOrderNumber,
      referenceQuoteId: order?.referenceQuoteId,
      referenceNumber: draft.referenceNumber,
      customerName: draft.customerName,
      customerId: draft.customerId || undefined,
      salesOrderDate: draft.salesOrderDate,
      expectedShipmentDate: draft.expectedShipmentDate,
      paymentTerms: draft.paymentTerms,
      deliveryMethod: draft.deliveryMethod,
      status,
      paymentStatus: order?.paymentStatus || "UNPAID",
      shipmentStatus: order?.shipmentStatus || "PENDING",
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
        pricingSource: item.pricingSource,
      })),
      subtotal: totals.subtotal,
      cgst: Math.round((totals.tax / 2) * 100) / 100,
      sgst: Math.round((totals.tax / 2) * 100) / 100,
      adjustment: draft.adjustment,
      shippingCharges: draft.shippingCharges,
      total: totals.total,
      customerNotes: draft.customerNotes,
      termsAndConditions: draft.termsAndConditions,
      attachments: order?.attachments || [],
      bankDetails: draft.bankDetails,
    };

    if (order) {
      updateSalesOrder(order.id, payload);
      toast({ title: `Sales order ${draft.salesOrderNumber} updated` });
      onOpenChange(false);
      return;
    }

    const created = createSalesOrder({ ...payload, createdBy: "System" });
    toast({ title: `Sales order ${created.salesOrderNumber} created` });
    onOpenChange(false);
    navigate(`/sales/orders/${created.id}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl p-0 overflow-hidden">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle className="text-xl font-semibold">
            {order ? "Edit Sales Order" : "New Sales Order"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-0 lg:grid-cols-[1fr_340px] max-h-[85vh]">
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
                  <Label>Sales Order Number</Label>
                  <Input
                    value={draft.salesOrderNumber}
                    readOnly
                    className="bg-muted"
                  />
                </div>
                <div>
                  <Label>Reference Number</Label>
                  <Input
                    value={draft.referenceNumber}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        referenceNumber: event.target.value,
                      }))
                    }
                    placeholder="Quote / reference ID"
                  />
                </div>
                <div>
                  <Label>Sales Order Date</Label>
                  <Input
                    type="date"
                    value={draft.salesOrderDate}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        salesOrderDate: event.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label>Expected Shipment Date</Label>
                  <Input
                    type="date"
                    value={draft.expectedShipmentDate}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        expectedShipmentDate: event.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label>Payment Terms</Label>
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
                <div>
                  <Label>Delivery Method</Label>
                  <Select
                    value={draft.deliveryMethod}
                    onValueChange={(value) =>
                      setDraft((current) => ({
                        ...current,
                        deliveryMethod: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["Standard", "Express", "Pickup", "Courier"].map(
                        (method) => (
                          <SelectItem key={method} value={method}>
                            {method}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
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
                <div className="space-y-3">
                  <div>
                    <Label>Place of Supply</Label>
                    <Input
                      value={draft.placeOfSupply}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          placeOfSupply: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label>Email Recipients</Label>
                    <Input
                      value={draft.emailRecipients}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          emailRecipients: event.target.value,
                        }))
                      }
                      placeholder="Comma separated emails"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border bg-card shadow-sm">
                <div className="flex items-center justify-between border-b px-4 py-3">
                  <div>
                    <p className="font-semibold">Item Table</p>
                    <p className="text-xs text-muted-foreground">
                      Select from master catalogue and the rate updates
                      automatically.
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
                      <TableHead className="w-28 text-right">Amount</TableHead>
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
                          {item.pricingSource ? (
                            <Badge
                              variant="secondary"
                              className="mt-2 rounded-full bg-slate-100 text-[10px] uppercase tracking-[0.18em] text-slate-600"
                            >
                              {pricingSourceLabel[item.pricingSource] ||
                                item.pricingSource}
                            </Badge>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.hsnSac}
                            onChange={(event) =>
                              updateItem(index, { hsnSac: event.target.value })
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
                      value={draft.customerNotes}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          customerNotes: event.target.value,
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
                      <span className="text-muted-foreground">Adjustment</span>
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
                      The order totals stay in sync with item changes and are
                      persisted in local storage.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </ScrollArea>

          <div className="border-t bg-muted/30 px-6 py-4 lg:border-t-0 lg:border-l">
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => saveOrder(order ? order.status : "CONFIRMED")}
              >
                Save
              </Button>
              <Button
                variant="default"
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => saveOrder("CONFIRMED")}
              >
                Save and Send
              </Button>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
