import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import Header from "@/components/layout/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Textarea } from "@/components/ui/textarea";
import { useData } from "@/contexts/DataContext";
import { toast } from "@/hooks/use-toast";
import { safeReadJson } from "@/lib/utils";
import { nextSequentialCode } from "@/lib/documentNumbering";
import {
  FileText,
  MessageSquare,
  MoreHorizontal,
  Paperclip,
  Pencil,
  Plus,
  X,
} from "lucide-react";

type ChallanStatus = "draft" | "open";
type InvoiceStatus = "not_invoiced" | "invoiced";

interface DeliveryItem {
  itemName: string;
  description: string;
  hsnSac: string;
  quantity: number;
  rate: number;
  discount: number;
  taxRate: number;
}

interface DeliveryChallan {
  id: string;
  challanNumber: string;
  referenceNumber: string;
  customerName: string;
  customerGstin: string;
  customerAddress: string;
  challanDate: string;
  challanType: string;
  placeOfSupply: string;
  status: ChallanStatus;
  invoiceStatus: InvoiceStatus;
  item: DeliveryItem;
  subtotal: number;
  cgst: number;
  sgst: number;
  adjustment: number;
  rounding: number;
  amount: number;
  totalInWords: string;
  notes: string;
  terms: string;
  attachments: string[];
}

const STORAGE_KEY = "nido_delivery_challans_v3";

const formatAmount = (value: number) => `Rs.${value.toFixed(2)}`;

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const numberToWords = (value: number) => {
  const words = [
    "Zero",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  const asWords = (num: number): string => {
    if (num < 20) return words[num];
    if (num < 100)
      return `${tens[Math.floor(num / 10)]}${num % 10 ? `-${words[num % 10]}` : ""}`;
    if (num < 1000) {
      const rem = num % 100;
      return `${words[Math.floor(num / 100)]} Hundred${rem ? ` ${asWords(rem)}` : ""}`;
    }
    const thousand = Math.floor(num / 1000);
    const rem = num % 1000;
    return `${asWords(thousand)} Thousand${rem ? ` ${asWords(rem)}` : ""}`;
  };

  const rounded = Math.round(value);
  return `Indian Rupee ${asWords(Math.max(0, rounded))} Only`;
};

const compute = (item: DeliveryItem, adjustment: number, rounding: number) => {
  const subtotal = Math.max(0, item.quantity * item.rate - item.discount);
  const tax = (subtotal * item.taxRate) / 100;
  const cgst = Math.round((tax / 2) * 100) / 100;
  const sgst = Math.round((tax / 2) * 100) / 100;
  const total =
    Math.round((subtotal + cgst + sgst + adjustment + rounding) * 100) / 100;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    cgst,
    sgst,
    amount: total,
    totalInWords: numberToWords(total),
  };
};

const defaultChallans: DeliveryChallan[] = [
  {
    id: "dc-1",
    challanNumber: "DC-00031",
    referenceNumber: "SO-00031",
    customerName: "UNIQUE MEASUREMENT SERVICE",
    customerGstin: "29AAEFU3814C1ZC",
    customerAddress:
      "NO. 43, 1st Cross Street, Doddanna Industrial Estate\nPeenya 2nd Stage\nBangalore\n560091 Karnataka\nIndia",
    challanDate: "2021-09-07",
    challanType: "Job Work",
    placeOfSupply: "Karnataka (29)",
    status: "draft",
    invoiceStatus: "not_invoiced",
    item: {
      itemName: "YFG - RR TOP MTG BRKT-RH&LH",
      description: "Component Samples for Inspection",
      hsnSac: "8207",
      quantity: 4,
      rate: 20,
      discount: 0,
      taxRate: 18,
    },
    subtotal: 80,
    cgst: 7.2,
    sgst: 7.2,
    adjustment: 0,
    rounding: -0.4,
    amount: 94,
    totalInWords: "Indian Rupee Ninety-Four Only",
    notes: "Its a Returnable DC, Actual price will be provided on the Invoice.",
    terms:
      "1. Kindly check with the items on the delivery, if missing report immediately.\n2. Intimate immediately on any damage or breakage.\n3. Any further damages post delivery will be liable by receiver.",
    attachments: [],
  },
];

const normalize = (entry: Partial<DeliveryChallan>): DeliveryChallan => {
  const item: DeliveryItem = {
    itemName: entry.item?.itemName || "",
    description: entry.item?.description || "",
    hsnSac: entry.item?.hsnSac || "",
    quantity: toNumber(entry.item?.quantity, 1),
    rate: toNumber(entry.item?.rate, 0),
    discount: toNumber(entry.item?.discount, 0),
    taxRate: toNumber(entry.item?.taxRate, 18),
  };
  const adjustment = toNumber(entry.adjustment, 0);
  const rounding = toNumber(entry.rounding, 0);
  const computed = compute(item, adjustment, rounding);

  return {
    ...defaultChallans[0],
    ...entry,
    item,
    adjustment,
    rounding,
    subtotal: toNumber(entry.subtotal, computed.subtotal),
    cgst: toNumber(entry.cgst, computed.cgst),
    sgst: toNumber(entry.sgst, computed.sgst),
    amount: toNumber(entry.amount, computed.amount),
    totalInWords: entry.totalInWords || computed.totalInWords,
    status: entry.status === "open" ? "open" : "draft",
    invoiceStatus:
      entry.invoiceStatus === "invoiced" ? "invoiced" : "not_invoiced",
    attachments: Array.isArray(entry.attachments) ? entry.attachments : [],
  };
};

function DeliveryChallanDocument({
  challan,
  companyLogoUrl,
}: {
  challan: DeliveryChallan;
  companyLogoUrl?: string;
}) {
  return (
    <div className="relative mx-auto w-[794px] border border-slate-200 bg-white px-8 py-8 text-slate-900">
      {challan.status === "draft" && (
        <div className="pointer-events-none absolute left-0 top-0 z-10 -translate-x-8 translate-y-5 -rotate-45 bg-slate-400 px-10 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-white">
          Draft
        </div>
      )}

      <div className="flex items-start justify-between gap-8">
        <div>
          {companyLogoUrl ? (
            <div className="flex h-24 w-40 items-center justify-center overflow-hidden">
              <img
                src={companyLogoUrl}
                alt="Nido Technologies logo"
                className="h-full w-full object-contain"
              />
            </div>
          ) : (
            <div className="flex h-24 w-40 items-center justify-center rounded border border-slate-200 bg-white">
              <span className="text-xs font-semibold tracking-[0.35em]">
                NT
              </span>
            </div>
          )}
          <div className="mt-3 text-[11px] leading-5 text-slate-700">
            <p className="font-semibold text-slate-900">Nido Technologies</p>
            <p>No. 41/1, 2nd Floor, 10th Cross,</p>
            <p>11th Main, Wilsongarden,</p>
            <p>Bangalore Karnataka 560027</p>
            <p>India</p>
            <p>GSTIN 29BPAPP1867G1ZN</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-5xl font-serif leading-none">Delivery Challan</h2>
          <p className="mt-2 text-sm font-semibold">
            Delivery Challan# {challan.challanNumber}
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-[1fr_220px] text-[12px]">
        <div>
          <p className="font-semibold">Deliver To</p>
          <p className="mt-1 font-semibold text-blue-700">
            {challan.customerName}
          </p>
          <p className="mt-1 whitespace-pre-wrap text-slate-700">
            {challan.customerAddress}
          </p>
          <p className="mt-1 text-slate-700">GSTIN {challan.customerGstin}</p>
          <p className="mt-3 text-slate-700">
            Place Of Supply: {challan.placeOfSupply}
          </p>
        </div>
        <div className="self-end space-y-2 text-slate-700">
          <p>
            <span className="font-semibold">Challan Date :</span>{" "}
            {challan.challanDate}
          </p>
          <p>
            <span className="font-semibold">Challan Type :</span>{" "}
            {challan.challanType}
          </p>
        </div>
      </div>

      <div className="mt-6 overflow-hidden border border-slate-300">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-800 hover:bg-slate-800">
              <TableHead className="w-10 text-white">#</TableHead>
              <TableHead className="text-white">Item & Description</TableHead>
              <TableHead className="w-20 text-white">HSN/SAC</TableHead>
              <TableHead className="w-20 text-white text-right">Qty</TableHead>
              <TableHead className="w-20 text-white text-right">Rate</TableHead>
              <TableHead className="w-24 text-white text-right">
                Amount
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>1</TableCell>
              <TableCell>
                <p className="font-medium">{challan.item.itemName}</p>
                <p className="text-xs text-slate-500">
                  {challan.item.description}
                </p>
              </TableCell>
              <TableCell>{challan.item.hsnSac || "-"}</TableCell>
              <TableCell className="text-right">
                {challan.item.quantity.toFixed(2)}
              </TableCell>
              <TableCell className="text-right">
                {challan.item.rate.toFixed(2)}
              </TableCell>
              <TableCell className="text-right">
                {(
                  challan.item.quantity * challan.item.rate -
                  challan.item.discount
                ).toFixed(2)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div className="mt-5 ml-auto w-full max-w-[290px] space-y-2 text-[12px]">
        <div className="flex items-center justify-between">
          <span>Sub Total</span>
          <span>{challan.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>CGST9 (9%)</span>
          <span>{challan.cgst.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>SGST9 (9%)</span>
          <span>{challan.sgst.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Rounding</span>
          <span>{challan.rounding.toFixed(2)}</span>
        </div>
        <div className="mt-2 flex items-center justify-between bg-slate-100 px-3 py-2 font-semibold">
          <span>Total</span>
          <span>{formatAmount(challan.amount)}</span>
        </div>
      </div>

      <div className="mt-3 flex justify-end text-[12px]">
        <span className="mr-2">Total In Words:</span>
        <span className="font-semibold italic">{challan.totalInWords}</span>
      </div>

      <div className="mt-8 text-[12px]">
        <p className="font-semibold">Notes</p>
        <p className="mt-1 text-slate-700">{challan.notes}</p>
      </div>

      <div className="mt-6 text-[12px]">
        <p className="font-semibold">Terms & Conditions</p>
        <p className="mt-1 whitespace-pre-wrap text-slate-700">
          {challan.terms}
        </p>
      </div>

      <div className="mt-8 text-[12px]">
        Authorized Signature
        <div className="mt-1 h-px w-[340px] bg-slate-700" />
      </div>
    </div>
  );
}

export default function DeliveryChallansPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { clients, generalSettings } = useData();
  const createMode = location.pathname.endsWith("/create");

  const [challans, setChallans] = useState<DeliveryChallan[]>(() => {
    const stored = safeReadJson<DeliveryChallan[]>(
      STORAGE_KEY,
      defaultChallans,
    );
    const rows =
      Array.isArray(stored) && stored.length ? stored : defaultChallans;
    return rows.map((entry) => normalize(entry));
  });
  const [selectedId, setSelectedId] = useState(
    params.id || challans[0]?.id || "",
  );
  const [open, setOpen] = useState(createMode);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [attachmentDraft, setAttachmentDraft] = useState("");
  const [form, setForm] = useState<DeliveryChallan>(() =>
    normalize(defaultChallans[0]),
  );
  const printRef = useRef<HTMLDivElement>(null);

  const companyLogoUrl = Object.values(generalSettings).find(
    (setting) => setting.companyLogo,
  )?.companyLogo;
  const challanPrefix =
    Object.values(generalSettings)[0]?.deliveryChallanPrefix?.trim() || "DC";

  const reactToPrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Delivery-Challan",
    pageStyle:
      "@page { size: A4; margin: 12mm; } @media print { html, body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; } body * { visibility: hidden; } #dc-print-area, #dc-print-area * { visibility: visible; } #dc-print-area { position: absolute; top: 0; left: 0; width: 100%; background: white; } }",
  });

  const persist = (next: DeliveryChallan[]) => {
    setChallans(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  useEffect(() => {
    if (createMode) {
      setEditingId(null);
      setForm(
        normalize({
          ...defaultChallans[0],
          id: `dc-${Date.now()}`,
          challanNumber: nextSequentialCode(
            challanPrefix,
            challans.map((entry) => entry.challanNumber),
            5,
          ),
          challanDate: new Date().toISOString().slice(0, 10),
          status: "draft",
          invoiceStatus: "not_invoiced",
          attachments: [],
        }),
      );
      setOpen(true);
    }
  }, [challanPrefix, challans, createMode]);

  useEffect(() => {
    if (params.id) setSelectedId(params.id);
  }, [params.id]);

  const selected = useMemo(
    () =>
      challans.find((entry) => entry.id === selectedId) || challans[0] || null,
    [challans, selectedId],
  );

  useEffect(() => {
    if (!selected) return;
    const computed = compute(
      selected.item,
      selected.adjustment,
      selected.rounding,
    );
    if (
      computed.subtotal === selected.subtotal &&
      computed.cgst === selected.cgst &&
      computed.sgst === selected.sgst &&
      computed.amount === selected.amount &&
      computed.totalInWords === selected.totalInWords
    ) {
      return;
    }
    persist(
      challans.map((entry) =>
        entry.id === selected.id
          ? {
              ...entry,
              ...computed,
            }
          : entry,
      ),
    );
  }, [selected, challans]);

  const openCreate = () => {
    setEditingId(null);
    setAttachmentDraft("");
    const next = normalize({
      ...defaultChallans[0],
      id: `dc-${Date.now()}`,
      challanNumber: nextSequentialCode(
        challanPrefix,
        challans.map((entry) => entry.challanNumber),
        5,
      ),
      challanDate: new Date().toISOString().slice(0, 10),
      status: "draft",
      invoiceStatus: "not_invoiced",
      attachments: [],
    });
    setForm(next);
    setOpen(true);
    navigate("/sales/delivery-challans/create");
  };

  const openEdit = () => {
    if (!selected) return;
    setEditingId(selected.id);
    setAttachmentDraft("");
    setForm(selected);
    setOpen(true);
    navigate("/sales/delivery-challans/create");
  };

  const closeDialog = () => {
    setOpen(false);
    setEditingId(null);
    navigate("/sales/delivery-challans", { replace: true });
  };

  const save = () => {
    if (!form.customerName.trim()) {
      toast({ title: "Customer Name is required" });
      return;
    }

    const computed = compute(form.item, form.adjustment, form.rounding);

    if (editingId) {
      const next = challans.map((entry) =>
        entry.id === editingId
          ? {
              ...form,
              id: editingId,
              ...computed,
            }
          : entry,
      );
      persist(next);
      toast({ title: "Delivery challan updated" });
      closeDialog();
      return;
    }

    const created = {
      ...form,
      id: `dc-${Date.now()}`,
      ...computed,
    };
    const next = [created, ...challans];
    persist(next);
    setSelectedId(created.id);
    toast({ title: "Delivery challan created" });
    closeDialog();
  };

  const handleConvertToOpen = () => {
    if (!selected) return;
    persist(
      challans.map((entry) =>
        entry.id === selected.id
          ? { ...entry, status: "open" as const }
          : entry,
      ),
    );
    toast({ title: "Challan converted to open" });
  };

  const handleClone = () => {
    if (!selected) return;
    const clone = {
      ...selected,
      id: `dc-${Date.now()}`,
      challanNumber: `${selected.challanNumber}-COPY`,
      status: "draft" as const,
    };
    persist([clone, ...challans]);
    setSelectedId(clone.id);
    toast({ title: "Delivery challan cloned" });
  };

  const handleDelete = () => {
    if (!selected) return;
    const next = challans.filter((entry) => entry.id !== selected.id);
    persist(next);
    setSelectedId(next[0]?.id || "");
    toast({ title: "Delivery challan deleted" });
  };

  const bindCustomer = (customerName: string) => {
    const found = clients.find((entry) => entry.name === customerName);
    setForm((current) => ({
      ...current,
      customerName,
      customerAddress:
        found?.locationDetails?.address ||
        found?.address ||
        current.customerAddress,
      customerGstin: found?.gst || current.customerGstin,
      placeOfSupply: found?.locationDetails?.state || current.placeOfSupply,
    }));
  };

  return (
    <div>
      <Header title="Delivery Challans" />
      <div className="space-y-4 p-6">
        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <h2 className="text-lg font-semibold">Delivery Challans</h2>
            <div className="flex items-center gap-2">
              <Button onClick={openCreate}>
                <Plus className="mr-2 h-4 w-4" /> New
              </Button>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Delivery Challan#</TableHead>
                  <TableHead>Reference Number</TableHead>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Invoice Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {challans.map((entry) => (
                  <TableRow
                    key={entry.id}
                    className="cursor-pointer"
                    onClick={() => {
                      setSelectedId(entry.id);
                      navigate(`/sales/delivery-challans/${entry.id}`);
                    }}
                  >
                    <TableCell>{entry.challanDate}</TableCell>
                    <TableCell className="font-medium text-primary">
                      {entry.challanNumber}
                    </TableCell>
                    <TableCell>{entry.referenceNumber || "-"}</TableCell>
                    <TableCell>{entry.customerName}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          entry.status === "open" ? "default" : "secondary"
                        }
                      >
                        {entry.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {entry.invoiceStatus === "invoiced"
                        ? "INVOICED"
                        : "NOT INVOICED"}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatAmount(entry.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {selected && (
          <Card>
            <CardContent className="pt-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-2xl font-semibold">
                  {selected.challanNumber}
                </h3>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={openEdit}>
                    <Pencil className="mr-2 h-4 w-4" /> Edit
                  </Button>
                  <Button variant="outline" onClick={reactToPrint}>
                    <FileText className="mr-2 h-4 w-4" /> PDF/Print
                  </Button>
                  <Button variant="outline" onClick={handleConvertToOpen}>
                    Convert to Open
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={handleClone}>
                        Clone
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={handleDelete}>
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      navigate("/sales/delivery-challans", { replace: true })
                    }
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border bg-white p-2">
                <DeliveryChallanDocument
                  challan={selected}
                  companyLogoUrl={companyLogoUrl}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog
        open={open}
        onOpenChange={(isOpen) => (!isOpen ? closeDialog() : setOpen(isOpen))}
      >
        <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Delivery Challan" : "New Delivery Challan"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Customer Name*</Label>
                <Select value={form.customerName} onValueChange={bindCustomer}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select or add a customer" />
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
                <Label>Delivery Challan#*</Label>
                <Input
                  value={form.challanNumber}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      challanNumber: event.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label>Reference#</Label>
                <Input
                  value={form.referenceNumber}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      referenceNumber: event.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label>Delivery Challan Date*</Label>
                <Input
                  type="date"
                  value={form.challanDate}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      challanDate: event.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label>Challan Type*</Label>
                <Select
                  value={form.challanType}
                  onValueChange={(value) =>
                    setForm((current) => ({ ...current, challanType: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a proper challan type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Job Work">Job Work</SelectItem>
                    <SelectItem value="Material Transfer">
                      Material Transfer
                    </SelectItem>
                    <SelectItem value="Sample Dispatch">
                      Sample Dispatch
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-xl border bg-white">
              <div className="border-b px-4 py-3">
                <p className="font-semibold">Item Table</p>
              </div>
              <div className="grid gap-4 p-4 lg:grid-cols-[1fr_280px]">
                <div>
                  <div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr]">
                    <Input
                      placeholder="Type or click to select an item"
                      value={form.item.itemName}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          item: {
                            ...current.item,
                            itemName: event.target.value,
                          },
                        }))
                      }
                    />
                    <Input
                      type="number"
                      value={form.item.quantity}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          item: {
                            ...current.item,
                            quantity: toNumber(event.target.value, 1),
                          },
                        }))
                      }
                    />
                    <Input
                      type="number"
                      value={form.item.rate}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          item: {
                            ...current.item,
                            rate: toNumber(event.target.value),
                          },
                        }))
                      }
                    />
                    <Input
                      type="number"
                      value={form.item.discount}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          item: {
                            ...current.item,
                            discount: toNumber(event.target.value),
                          },
                        }))
                      }
                    />
                    <Input
                      type="number"
                      value={form.item.taxRate}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          item: {
                            ...current.item,
                            taxRate: toNumber(event.target.value),
                          },
                        }))
                      }
                    />
                    <Input
                      readOnly
                      value={(
                        form.item.quantity * form.item.rate -
                        form.item.discount
                      ).toFixed(2)}
                      className="text-right"
                    />
                  </div>
                  <Input
                    className="mt-3"
                    placeholder="Description"
                    value={form.item.description}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        item: {
                          ...current.item,
                          description: event.target.value,
                        },
                      }))
                    }
                  />
                </div>
                <div className="rounded-lg border bg-muted/20 p-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Sub Total</span>
                    <span>
                      {compute(
                        form.item,
                        form.adjustment,
                        form.rounding,
                      ).subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span>Adjustment</span>
                    <Input
                      className="w-28 text-right"
                      type="number"
                      value={form.adjustment}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          adjustment: toNumber(event.target.value),
                        }))
                      }
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span>Rounding</span>
                    <Input
                      className="w-28 text-right"
                      type="number"
                      value={form.rounding}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          rounding: toNumber(event.target.value),
                        }))
                      }
                    />
                  </div>
                  <div className="mt-4 border-t pt-3 text-base font-semibold">
                    <div className="flex items-center justify-between">
                      <span>Total (Rs)</span>
                      <span>
                        {compute(
                          form.item,
                          form.adjustment,
                          form.rounding,
                        ).amount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
              <div className="space-y-4">
                <div>
                  <Label>Customer Notes</Label>
                  <Textarea
                    value={form.notes}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label>Terms & Conditions</Label>
                  <Textarea
                    value={form.terms}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        terms: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="rounded-lg border p-4">
                <Label>Attach File(s) to Delivery Challan</Label>
                <div className="mt-2 flex gap-2">
                  <Input
                    value={attachmentDraft}
                    onChange={(event) => setAttachmentDraft(event.target.value)}
                    placeholder="Upload File"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const value = attachmentDraft.trim();
                      if (!value) return;
                      setForm((current) => ({
                        ...current,
                        attachments: [...current.attachments, value],
                      }));
                      setAttachmentDraft("");
                    }}
                  >
                    <Paperclip className="mr-2 h-4 w-4" /> Add
                  </Button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {form.attachments.map((entry) => (
                    <Badge key={entry} variant="secondary" className="gap-2">
                      {entry}
                      <button
                        type="button"
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            attachments: current.attachments.filter(
                              (name) => name !== entry,
                            ),
                          }))
                        }
                      >
                        x
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <div className="text-xs text-muted-foreground">
                PDF Template: Standard Template
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button onClick={save}>Save as Draft</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="fixed left-[-10000px] top-0 w-[794px] bg-white">
        <div ref={printRef} id="dc-print-area">
          {selected ? (
            <DeliveryChallanDocument
              challan={selected}
              companyLogoUrl={companyLogoUrl}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
