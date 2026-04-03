import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Trash2, Plus, Save } from "lucide-react";

interface QuoteFormData {
  quoteNumber: string;
  referenceNumber: string;
  customerName: string;
  customerId: string;
  quoteDate: string;
  validTillDate: string;
  projectName: string;
  placeOfSupply: string;
  salesperson: string;
  billingAddress: string;
  shippingAddress: string;
  emailRecipients: string[];
  items: Array<{
    id: string;
    itemName: string;
    description: string;
    hsnSac: string;
    quantity: number;
    rate: number;
    discount: number;
    taxRate: number;
    amount: number;
  }>;
  subtotal: number;
  cgst: number;
  sgst: number;
  adjustment: number;
  total: number;
  customerNotes: string;
  termsAndConditions: string;
  attachments: string[];
  bankDetails: string;
}

export default function SalesQuoteFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { salesQuotes, createQuote, updateQuote, clients, masterCatalogItems } =
    useData();

  const existingQuote = useMemo(
    () => salesQuotes.find((q) => q.id === id),
    [id, salesQuotes],
  );

  const initialForm: QuoteFormData = existingQuote
    ? {
        quoteNumber: existingQuote.quoteNumber,
        referenceNumber: existingQuote.referenceNumber,
        customerName: existingQuote.customerName,
        customerId: existingQuote.customerId || "",
        quoteDate: existingQuote.quoteDate,
        validTillDate: existingQuote.validTillDate,
        projectName: existingQuote.projectName,
        placeOfSupply: existingQuote.placeOfSupply,
        salesperson: existingQuote.salesperson,
        billingAddress: existingQuote.billingAddress,
        shippingAddress: existingQuote.shippingAddress,
        emailRecipients: existingQuote.emailRecipients,
        items: existingQuote.items,
        subtotal: existingQuote.subtotal,
        cgst: existingQuote.cgst,
        sgst: existingQuote.sgst,
        adjustment: existingQuote.adjustment,
        total: existingQuote.total,
        customerNotes: existingQuote.customerNotes,
        termsAndConditions: existingQuote.termsAndConditions,
        attachments: existingQuote.attachments,
        bankDetails: existingQuote.bankDetails,
      }
    : {
        quoteNumber: `Q-${String(Date.now()).slice(-5)}`,
        referenceNumber: "",
        customerName: "",
        customerId: "",
        quoteDate: new Date().toISOString().slice(0, 10),
        validTillDate: new Date(Date.now() + 7 * 86400000)
          .toISOString()
          .slice(0, 10),
        projectName: "",
        placeOfSupply: "",
        salesperson: "",
        billingAddress: "",
        shippingAddress: "",
        emailRecipients: [],
        items: [],
        subtotal: 0,
        cgst: 0,
        sgst: 0,
        adjustment: 0,
        total: 0,
        customerNotes: "",
        termsAndConditions: "Validity: 7 days",
        attachments: [],
        bankDetails: "",
      };

  const [form, setForm] = useState<QuoteFormData>(initialForm);

  const [emailInput, setEmailInput] = useState("");

  const recalculate = (items: typeof form.items, adjustment: number) => {
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const cgst = Math.round(subtotal * 0.09);
    const sgst = Math.round(subtotal * 0.09);
    const total = subtotal + cgst + sgst + adjustment;
    return { subtotal, cgst, sgst, total };
  };

  const updateItem = (idx: number, fields: Partial<(typeof form.items)[0]>) => {
    const nextItems = form.items.map((item, i) => {
      if (i !== idx) return item;
      const updated = { ...item, ...fields };
      updated.amount = updated.quantity * updated.rate - updated.discount;
      return updated;
    });
    const totals = recalculate(nextItems, form.adjustment);
    setForm((prev) => ({ ...prev, items: nextItems, ...totals }));
  };

  const removeItem = (idx: number) => {
    const nextItems = form.items.filter((_, i) => i !== idx);
    const totals = recalculate(nextItems, form.adjustment);
    setForm((prev) => ({ ...prev, items: nextItems, ...totals }));
  };

  const addLineItem = () => {
    const nextItems = [
      ...form.items,
      {
        id: `qli-${Date.now()}`,
        itemName: "",
        description: "",
        hsnSac: "",
        quantity: 1,
        rate: 0,
        discount: 0,
        taxRate: 18,
        amount: 0,
      },
    ];
    setForm((prev) => ({ ...prev, items: nextItems }));
  };

  const addEmail = () => {
    if (!emailInput.trim()) return;
    if (!form.emailRecipients.includes(emailInput.trim())) {
      setForm((prev) => ({
        ...prev,
        emailRecipients: [...prev.emailRecipients, emailInput.trim()],
      }));
    }
    setEmailInput("");
  };

  const removeEmail = (email: string) => {
    setForm((prev) => ({
      ...prev,
      emailRecipients: prev.emailRecipients.filter((e) => e !== email),
    }));
  };

  const handleSave = () => {
    if (!form.quoteNumber.trim()) {
      toast({ title: "Quote number is required" });
      return;
    }
    if (!form.customerName.trim()) {
      toast({ title: "Customer name is required" });
      return;
    }
    if (form.items.length === 0) {
      toast({ title: "Add at least one line item" });
      return;
    }

    if (existingQuote) {
      updateQuote(existingQuote.id, form);
      toast({ title: "Quote updated" });
    } else {
      const created = createQuote({
        ...form,
        status: "DRAFT",
        createdBy: "System",
      });
      toast({ title: `Quote ${created.quoteNumber} created` });
      navigate(`/sales/quotes/${created.id}`);
      return;
    }
    navigate("/sales/quotes");
  };

  const suggestFromClient = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    if (!client) return;
    setForm((prev) => ({
      ...prev,
      customerName: client.companyName || client.name,
      billingAddress: client.locationDetails?.address || client.address,
      shippingAddress: client.locationDetails?.address || client.address,
      placeOfSupply: client.locationDetails?.state || client.address,
    }));
  };

  return (
    <div>
      <Header title={existingQuote ? "Edit Quote" : "Create Quote"} />
      <div className="p-6 space-y-6">
        {/* Quote Header */}
        <Card>
          <CardHeader>
            <CardTitle>Quote Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Quote Number</Label>
                <Input
                  value={form.quoteNumber}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      quoteNumber: e.target.value,
                    }))
                  }
                  disabled={!!existingQuote}
                />
              </div>
              <div>
                <Label>Quote Date</Label>
                <Input
                  type="date"
                  value={form.quoteDate}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, quoteDate: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Valid Till Date</Label>
                <Input
                  type="date"
                  value={form.validTillDate}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      validTillDate: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label>Project Name</Label>
                <Input
                  value={form.projectName}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      projectName: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Details */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Customer Name *</Label>
                <Input
                  value={form.customerName}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      customerName: e.target.value,
                    }))
                  }
                  placeholder="Client or customer name"
                  required
                />
              </div>
              <div>
                <Label>Select from Clients (Optional)</Label>
                <Select
                  onValueChange={(clientId) => suggestFromClient(clientId)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose to populate" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.companyName || client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Salesperson</Label>
                <Input
                  value={form.salesperson}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      salesperson: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label>Place of Supply</Label>
                <Input
                  value={form.placeOfSupply}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      placeOfSupply: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Addresses */}
        <Card>
          <CardHeader>
            <CardTitle>Addresses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Billing Address</Label>
                <Textarea
                  value={form.billingAddress}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      billingAddress: e.target.value,
                    }))
                  }
                  rows={3}
                />
              </div>
              <div>
                <Label>Shipping Address</Label>
                <Textarea
                  value={form.shippingAddress}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      shippingAddress: e.target.value,
                    }))
                  }
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email Recipients */}
        <Card>
          <CardHeader>
            <CardTitle>Email Recipients</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="Enter email address"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addEmail();
                  }
                }}
              />
              <Button onClick={addEmail} variant="outline">
                Add
              </Button>
            </div>
            {form.emailRecipients.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.emailRecipients.map((email) => (
                  <div
                    key={email}
                    className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm flex items-center gap-2"
                  >
                    {email}
                    <button
                      onClick={() => removeEmail(email)}
                      className="text-secondary-foreground/70 hover:text-secondary-foreground"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Line Items</CardTitle>
            <Button onClick={addLineItem} size="sm">
              <Plus className="h-4 w-4 mr-1" /> Add Item
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>HSN/SAC</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Tax %</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {form.items.map((item, idx) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Input
                          value={item.itemName}
                          onChange={(e) =>
                            updateItem(idx, { itemName: e.target.value })
                          }
                          placeholder="Item name"
                          className="w-32"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.description}
                          onChange={(e) =>
                            updateItem(idx, { description: e.target.value })
                          }
                          placeholder="Description"
                          className="w-32"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.hsnSac}
                          onChange={(e) =>
                            updateItem(idx, { hsnSac: e.target.value })
                          }
                          placeholder="HSN/SAC"
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(idx, {
                              quantity: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-16"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.rate}
                          onChange={(e) =>
                            updateItem(idx, {
                              rate: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.discount}
                          onChange={(e) =>
                            updateItem(idx, {
                              discount: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.taxRate}
                          onChange={(e) =>
                            updateItem(idx, {
                              taxRate: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-16"
                        />
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {item.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          onClick={() => removeItem(idx)}
                          variant="ghost"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Totals */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-end">
              <div className="w-80 space-y-2">
                {[
                  ["Subtotal", form.subtotal],
                  ["CGST (9%)", form.cgst],
                  ["SGST (9%)", form.sgst],
                  ["Adjustment", form.adjustment],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex justify-between text-sm px-3 py-2 border border-gray-300"
                  >
                    <span>{label}</span>
                    <span className="font-medium">
                      {(value as number).toLocaleString()}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between text-base font-bold px-3 py-2 bg-secondary">
                  <span>TOTAL</span>
                  <span>{form.total.toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <Label>Adjustment</Label>
                <Input
                  type="number"
                  value={form.adjustment}
                  onChange={(e) => {
                    const adjustment = parseFloat(e.target.value) || 0;
                    const totals = recalculate(form.items, adjustment);
                    setForm((prev) => ({
                      ...prev,
                      adjustment,
                      ...totals,
                    }));
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Bank Details</Label>
              <Textarea
                value={form.bankDetails}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, bankDetails: e.target.value }))
                }
                rows={2}
              />
            </div>
            <div>
              <Label>Terms & Conditions</Label>
              <Textarea
                value={form.termsAndConditions}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    termsAndConditions: e.target.value,
                  }))
                }
                rows={3}
              />
            </div>
            <div>
              <Label>Customer Notes</Label>
              <Textarea
                value={form.customerNotes}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    customerNotes: e.target.value,
                  }))
                }
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" />
            {existingQuote ? "Update Quote" : "Create Quote"}
          </Button>
          <Button variant="outline" onClick={() => navigate("/sales/quotes")}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
