import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import Header from "@/components/layout/Header";
import { useData } from "@/contexts/DataContext";
import { toast } from "@/hooks/use-toast";
import { safeReadJson } from "@/lib/storage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Ellipsis, Mail, Pencil, Plus, Printer, X } from "lucide-react";

type BillStatus = "DRAFT" | "OPEN" | "PAID";

interface BillItem {
  id: string;
  itemDetails: string;
  account: string;
  quantity: number;
  rate: number;
  discount: number;
  taxPercent: number;
  customerName: string;
}

interface BillEntry {
  id: string;
  billNumber: string;
  orderNumber: string;
  sourcePurchaseOrderId?: string;
  referenceNumber: string;
  vendorName: string;
  vendorAddress: string;
  billDate: string;
  dueDate: string;
  paymentTerms: string;
  reverseCharge: boolean;
  status: BillStatus;
  notes: string;
  attachmentType: string;
  paymentMade: number;
  items: BillItem[];
  tdsType: "TDS" | "TCS";
  adjustment: number;
}

interface BillForm {
  vendorName: string;
  vendorAddress: string;
  billNumber: string;
  orderNumber: string;
  referenceNumber: string;
  billDate: string;
  dueDate: string;
  paymentTerms: string;
  reverseCharge: boolean;
  notes: string;
  attachmentType: string;
  items: BillItem[];
  tdsType: "TDS" | "TCS";
  adjustment: number;
}

interface VendorLite {
  id: string;
  name: string;
  address?: string;
}

interface ClientLite {
  id: string;
  name: string;
}

const BILLS_STORAGE_KEY = "nido_purchase_bills_v1";

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(value);

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const todayIso = () => new Date().toISOString().slice(0, 10);

const isoToIndian = (value: string) => {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
};

const indianToIso = (value: string) => {
  const [dd, mm, yyyy] = value.split("/");
  if (!dd || !mm || !yyyy) return "";
  return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
};

const newItem = (id: string): BillItem => ({
  id,
  itemDetails: "",
  account: "",
  quantity: 1,
  rate: 0,
  discount: 0,
  taxPercent: 9,
  customerName: "",
});

const getVendorAddress = (vendorName: string, vendors: VendorLite[]) => {
  const vendor = vendors.find((entry) => entry.name === vendorName);
  const address = vendor?.address;
  return typeof address === "string" && address.trim()
    ? address
    : "No. 6, 4th Main Road\nGKW Layout, Peenya 2nd Stage\nBangalore Karnataka\nIndia";
};

const getBillTotals = (entry: Pick<BillEntry, "items" | "adjustment">) => {
  const subtotal = entry.items.reduce((sum, item) => {
    const base = item.quantity * item.rate;
    const discountAmount = (base * item.discount) / 100;
    return sum + (base - discountAmount);
  }, 0);
  const tax = entry.items.reduce((sum, item) => {
    const base = item.quantity * item.rate;
    const discountAmount = (base * item.discount) / 100;
    const taxable = base - discountAmount;
    return sum + (taxable * item.taxPercent) / 100;
  }, 0);
  const total = subtotal + tax + entry.adjustment;
  return {
    subtotal,
    tax,
    cgst: tax / 2,
    sgst: tax / 2,
    total,
  };
};

const nextBillNumber = (entries: BillEntry[]) => {
  const max = entries.reduce((current, entry) => {
    const parsed = Number(entry.billNumber.replace(/\D/g, ""));
    return Number.isFinite(parsed) ? Math.max(current, parsed) : current;
  }, 103);
  return String(max + 1);
};

const DEFAULT_BILLS: BillEntry[] = [
  {
    id: "bill-104",
    billNumber: "104",
    orderNumber: "PO-00001",
    sourcePurchaseOrderId: "po-1",
    referenceNumber: "",
    vendorName: "Global Supply Co",
    vendorAddress: "456 Supply Ave, Houston, TX",
    billDate: "06/03/2021",
    dueDate: "06/03/2021",
    paymentTerms: "Due on Receipt",
    reverseCharge: false,
    status: "PAID",
    notes: "Ring completed for March - 2021",
    attachmentType: "Upload File",
    paymentMade: 4543,
    tdsType: "TDS",
    adjustment: 0,
    items: [
      {
        id: "bill-item-1",
        itemDetails: "Job Work 1\nFor Job Work for Admin",
        account: "Subcontractor",
        quantity: 1,
        rate: 3800,
        discount: 0,
        taxPercent: 9,
        customerName: "",
      },
    ],
  },
  {
    id: "bill-11",
    billNumber: "11",
    orderNumber: "PO-00005",
    sourcePurchaseOrderId: "po-5",
    referenceNumber: "",
    vendorName: "SecureTech Ltd",
    vendorAddress: "789 Security Blvd, New York, NY",
    billDate: "26/06/2021",
    dueDate: "26/06/2021",
    paymentTerms: "Net 15",
    reverseCharge: false,
    status: "PAID",
    notes: "Closed payment",
    attachmentType: "Upload File",
    paymentMade: 18880,
    tdsType: "TDS",
    adjustment: 0,
    items: [
      {
        id: "bill-item-2",
        itemDetails: "Power Unit",
        account: "Materials",
        quantity: 2,
        rate: 8000,
        discount: 0,
        taxPercent: 18,
        customerName: "",
      },
    ],
  },
];

const readBills = () => {
  const parsed = safeReadJson<unknown>(BILLS_STORAGE_KEY, DEFAULT_BILLS);
  if (!Array.isArray(parsed)) return DEFAULT_BILLS;
  const valid = parsed.filter(
    (entry): entry is BillEntry =>
      !!entry &&
      typeof entry === "object" &&
      typeof (entry as BillEntry).id === "string" &&
      typeof (entry as BillEntry).billNumber === "string" &&
      Array.isArray((entry as BillEntry).items),
  );
  return valid.length ? valid : DEFAULT_BILLS;
};

const blankForm = (): BillForm => ({
  vendorName: "",
  vendorAddress: "",
  billNumber: "",
  orderNumber: "",
  referenceNumber: "",
  billDate: todayIso(),
  dueDate: todayIso(),
  paymentTerms: "Due on Receipt",
  reverseCharge: false,
  notes: "",
  attachmentType: "Upload File",
  tdsType: "TDS",
  adjustment: 0,
  items: [newItem(`tmp-${Date.now()}`)],
});

function BillPdfSheet({
  bill,
  companyName,
  companyAddress,
  companyGst,
}: {
  bill: BillEntry;
  companyName: string;
  companyAddress: string;
  companyGst: string;
}) {
  const totals = getBillTotals(bill);
  const balanceDue = Math.max(totals.total - bill.paymentMade, 0);

  return (
    <div className="mx-auto max-w-[980px] border bg-white p-6 text-slate-900 shadow-sm">
      <div className="mb-5 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="grid h-24 w-24 place-items-center rounded-md border bg-slate-100 text-3xl font-bold text-sky-700">
            NT
          </div>
          <div>
            <Badge className="bg-emerald-600">{bill.status}</Badge>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-4xl font-serif">BILL</h2>
          <p className="text-sm">Bill {bill.billNumber}</p>
          <p className="mt-2 text-sm">Balance Due</p>
          <p className="text-xl font-semibold">{money(balanceDue)}</p>
        </div>
      </div>

      <div className="mb-5 grid gap-4 md:grid-cols-2">
        <div>
          <p className="font-semibold">{companyName}</p>
          <p className="whitespace-pre-wrap text-sm text-slate-700">
            {companyAddress}
          </p>
          <p className="mt-1 text-sm">GSTIN {companyGst}</p>
        </div>
        <div>
          <p className="font-semibold">Bill From</p>
          <p className="text-blue-700">{bill.vendorName}</p>
          <p className="whitespace-pre-wrap text-sm text-slate-700">
            {bill.vendorAddress}
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
            <p>Bill Date:</p>
            <p>{bill.billDate}</p>
            <p>Due Date:</p>
            <p>{bill.dueDate}</p>
            <p>Terms:</p>
            <p>{bill.paymentTerms}</p>
          </div>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="bg-slate-900 hover:bg-slate-900">
            <TableHead className="text-white">#</TableHead>
            <TableHead className="text-white">Item & Description</TableHead>
            <TableHead className="text-white">HSN/SAC</TableHead>
            <TableHead className="text-right text-white">Qty</TableHead>
            <TableHead className="text-right text-white">Rate</TableHead>
            <TableHead className="text-right text-white">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bill.items.map((item, index) => {
            const base = item.quantity * item.rate;
            const discountAmount = (base * item.discount) / 100;
            const taxable = base - discountAmount;
            return (
              <TableRow key={item.id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell className="whitespace-pre-wrap">
                  {item.itemDetails || "-"}
                </TableCell>
                <TableCell>{item.account || "-"}</TableCell>
                <TableCell className="text-right">
                  {item.quantity.toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  {item.rate.toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  {taxable.toFixed(2)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <div className="mt-4 grid gap-4 md:grid-cols-[1fr_300px]">
        <div>
          <p className="text-sm font-medium">Notes</p>
          <p className="whitespace-pre-wrap text-sm text-slate-700">
            {bill.notes || "-"}
          </p>
        </div>
        <div>
          <div className="flex items-center justify-between py-1 text-sm">
            <span>Sub Total</span>
            <span>{totals.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between py-1 text-sm">
            <span>SGST (9%)</span>
            <span>{totals.sgst.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between py-1 text-sm">
            <span>CGST (9%)</span>
            <span>{totals.cgst.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between py-1 text-sm text-red-600">
            <span>Payment Made</span>
            <span>{money(bill.paymentMade)}</span>
          </div>
          <Separator className="my-2" />
          <div className="flex items-center justify-between py-1 text-base font-semibold">
            <span>Balance Due</span>
            <span>{money(balanceDue)}</span>
          </div>
        </div>
      </div>

      <div className="mt-8 text-sm">
        <p>Authorized Signature ___________________________</p>
      </div>
    </div>
  );
}

export default function BillsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { vendors, clients, generalSettings } = useData();

  const [bills, setBills] = useState<BillEntry[]>(readBills);
  const [openForm, setOpenForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPdfView, setShowPdfView] = useState(true);
  const [form, setForm] = useState<BillForm>(blankForm);

  const printRef = useRef<HTMLDivElement>(null);

  const createMode = location.pathname.endsWith("/create");
  const editMode = location.pathname.endsWith("/edit") && !!params.id;
  const detailId = editMode ? null : params.id;

  const selectedBill = useMemo(() => {
    if (!params.id) return null;
    return bills.find((entry) => entry.id === params.id) || null;
  }, [bills, params.id]);

  const companySettings = useMemo(() => {
    const first = Object.values(generalSettings)[0];
    return {
      companyName: first?.companyName || "Nido Technologies",
      companyAddress:
        first?.address ||
        "No. 41/1, 2nd Floor, 10th Cross,\n11th Main, Wilson Garden,\nBangalore Karnataka 560027",
      companyGst: first?.gstNumber || "29BPAPP1867G1ZN",
    };
  }, [generalSettings]);

  const persist = (next: BillEntry[]) => {
    setBills(next);
    localStorage.setItem(BILLS_STORAGE_KEY, JSON.stringify(next));
  };

  useEffect(() => {
    if (!createMode && !editMode) {
      setOpenForm(false);
      setEditingId(null);
      return;
    }

    if (createMode) {
      setEditingId(null);
      setForm(blankForm());
      setOpenForm(true);
      return;
    }

    if (editMode && selectedBill) {
      setEditingId(selectedBill.id);
      setForm({
        vendorName: selectedBill.vendorName,
        vendorAddress: selectedBill.vendorAddress,
        billNumber: selectedBill.billNumber,
        orderNumber: selectedBill.orderNumber,
        referenceNumber: selectedBill.referenceNumber,
        billDate: indianToIso(selectedBill.billDate),
        dueDate: indianToIso(selectedBill.dueDate),
        paymentTerms: selectedBill.paymentTerms,
        reverseCharge: selectedBill.reverseCharge,
        notes: selectedBill.notes,
        attachmentType: selectedBill.attachmentType,
        items: selectedBill.items.map((item) => ({ ...item })),
        tdsType: selectedBill.tdsType,
        adjustment: selectedBill.adjustment,
      });
      setOpenForm(true);
    }
  }, [createMode, editMode, selectedBill]);

  const closeDialog = () => {
    setOpenForm(false);
    if (editingId) {
      navigate(`/transactions/purchase/bills/${editingId}`, { replace: true });
    } else {
      navigate("/transactions/purchase/bills", { replace: true });
    }
    setEditingId(null);
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: selectedBill ? `Bill-${selectedBill.billNumber}` : "Bill",
    pageStyle:
      "@page { size: A4; margin: 8mm; } @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }",
  });

  const saveBill = (status: BillStatus) => {
    if (!form.vendorName || !form.billDate || !form.dueDate) {
      toast({ title: "Vendor Name, Bill Date and Due Date are required" });
      return;
    }

    if (!form.items.some((item) => item.itemDetails.trim())) {
      toast({ title: "Please add at least one line item" });
      return;
    }

    if (editingId) {
      const updated = bills.map((entry) =>
        entry.id === editingId
          ? {
              ...entry,
              vendorName: form.vendorName,
              vendorAddress: form.vendorAddress,
              billNumber: form.billNumber,
              orderNumber: form.orderNumber,
              referenceNumber: form.referenceNumber,
              billDate: isoToIndian(form.billDate),
              dueDate: isoToIndian(form.dueDate),
              paymentTerms: form.paymentTerms,
              reverseCharge: form.reverseCharge,
              status,
              notes: form.notes,
              attachmentType: form.attachmentType,
              items: form.items,
              tdsType: form.tdsType,
              adjustment: form.adjustment,
            }
          : entry,
      );
      persist(updated);
      toast({ title: "Bill updated" });
      closeDialog();
      return;
    }

    const id = `bill-${Date.now()}`;
    const created: BillEntry = {
      id,
      billNumber: form.billNumber || nextBillNumber(bills),
      orderNumber: form.orderNumber,
      referenceNumber: form.referenceNumber,
      vendorName: form.vendorName,
      vendorAddress: form.vendorAddress,
      billDate: isoToIndian(form.billDate),
      dueDate: isoToIndian(form.dueDate),
      paymentTerms: form.paymentTerms,
      reverseCharge: form.reverseCharge,
      status,
      notes: form.notes,
      attachmentType: form.attachmentType,
      paymentMade:
        status === "PAID"
          ? getBillTotals({ items: form.items, adjustment: form.adjustment })
              .total
          : 0,
      items: form.items,
      tdsType: form.tdsType,
      adjustment: form.adjustment,
    };

    persist([created, ...bills]);
    toast({
      title: status === "DRAFT" ? "Bill saved as draft" : "Bill saved as open",
    });
    setOpenForm(false);
    navigate(`/transactions/purchase/bills/${id}`, { replace: true });
  };

  const addRow = () => {
    setForm((current) => ({
      ...current,
      items: [...current.items, newItem(`tmp-${Date.now()}`)],
    }));
  };

  const updateItem = (id: string, key: keyof BillItem, value: string) => {
    setForm((current) => ({
      ...current,
      items: current.items.map((item) => {
        if (item.id !== id) return item;
        if (["quantity", "rate", "discount", "taxPercent"].includes(key)) {
          return { ...item, [key]: toNumber(value) };
        }
        return { ...item, [key]: value };
      }),
    }));
  };

  const removeItem = (id: string) => {
    setForm((current) => {
      const next = current.items.filter((item) => item.id !== id);
      return {
        ...current,
        items: next.length ? next : [newItem(`tmp-${Date.now()}`)],
      };
    });
  };

  const markPaid = () => {
    if (!selectedBill) return;
    const totals = getBillTotals(selectedBill);
    persist(
      bills.map((entry) =>
        entry.id === selectedBill.id
          ? { ...entry, status: "PAID", paymentMade: totals.total }
          : entry,
      ),
    );
    toast({ title: "Bill marked as paid" });
  };

  const duplicateBill = () => {
    if (!selectedBill) return;
    const cloned: BillEntry = {
      ...selectedBill,
      id: `bill-${Date.now()}`,
      billNumber: nextBillNumber(bills),
      status: "DRAFT",
      paymentMade: 0,
      items: selectedBill.items.map((item) => ({
        ...item,
        id: `bill-item-${Date.now()}-${Math.random()}`,
      })),
    };
    persist([cloned, ...bills]);
    navigate(`/transactions/purchase/bills/${cloned.id}`);
    toast({ title: "Bill duplicated" });
  };

  const deleteBill = () => {
    if (!selectedBill) return;
    persist(bills.filter((entry) => entry.id !== selectedBill.id));
    navigate("/transactions/purchase/bills", { replace: true });
    toast({ title: "Bill deleted" });
  };

  if (detailId && selectedBill) {
    const totals = getBillTotals(selectedBill);

    return (
      <div>
        <Header title={selectedBill.billNumber} />
        <div className="space-y-4 p-6">
          <Card>
            <CardContent className="py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() =>
                      navigate(
                        `/transactions/purchase/bills/${selectedBill.id}/edit`,
                      )
                    }
                  >
                    <Pencil className="mr-2 h-4 w-4" /> Edit
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline">
                        <Printer className="mr-2 h-4 w-4" /> PDF/Print
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem
                        onSelect={(event) => {
                          event.preventDefault();
                          handlePrint();
                        }}
                      >
                        Print Bill
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon">
                        <Ellipsis className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={markPaid}>
                        Mark as Paid
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={duplicateBill}>
                        Duplicate Bill
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={deleteBill}>
                        Delete Bill
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => toast({ title: "Email sent to vendor" })}
                  >
                    <Mail className="mr-2 h-4 w-4" /> Send Email
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      navigate("/transactions/purchase/bills", {
                        replace: true,
                      })
                    }
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 py-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Payments Made: {money(selectedBill.paymentMade)}
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <span>Show PDF View</span>
                  <Switch
                    checked={showPdfView}
                    onCheckedChange={setShowPdfView}
                  />
                </div>
              </div>

              {showPdfView ? (
                <>
                  <div ref={printRef}>
                    <BillPdfSheet
                      bill={selectedBill}
                      companyName={companySettings.companyName}
                      companyAddress={companySettings.companyAddress}
                      companyGst={companySettings.companyGst}
                    />
                  </div>
                  <p className="text-right text-sm text-muted-foreground">
                    PDF Template: Standard Template{" "}
                    <span className="text-blue-600">Change</span>
                  </p>
                </>
              ) : (
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="rounded-md border p-3">
                    <p className="text-xs text-muted-foreground">Subtotal</p>
                    <p className="text-xl font-semibold">
                      {money(totals.subtotal)}
                    </p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-xs text-muted-foreground">Tax</p>
                    <p className="text-xl font-semibold">{money(totals.tax)}</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-xs text-muted-foreground">
                      Payment Made
                    </p>
                    <p className="text-xl font-semibold">
                      {money(selectedBill.paymentMade)}
                    </p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-xs text-muted-foreground">Balance Due</p>
                    <p className="text-xl font-semibold">
                      {money(
                        Math.max(totals.total - selectedBill.paymentMade, 0),
                      )}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-4">
              <p className="mb-3 text-lg font-semibold">Journal</p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ACCOUNT</TableHead>
                    <TableHead className="text-right">DEBIT</TableHead>
                    <TableHead className="text-right">CREDIT</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Subcontractor</TableCell>
                    <TableCell className="text-right">
                      {getBillTotals(selectedBill).subtotal.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">0.00</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Input SGST</TableCell>
                    <TableCell className="text-right">
                      {getBillTotals(selectedBill).sgst.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">0.00</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Input CGST</TableCell>
                    <TableCell className="text-right">
                      {getBillTotals(selectedBill).cgst.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">0.00</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Accounts Payable</TableCell>
                    <TableCell className="text-right">0.00</TableCell>
                    <TableCell className="text-right">
                      {getBillTotals(selectedBill).total.toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <Dialog
          open={openForm}
          onOpenChange={(open) => (!open ? closeDialog() : setOpenForm(open))}
        >
          <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Bill</DialogTitle>
            </DialogHeader>
            <BillFormSection
              form={form}
              setForm={setForm}
              vendors={vendors}
              clients={clients}
              onAddRow={addRow}
              onUpdateItem={updateItem}
              onRemoveItem={removeItem}
              onSaveDraft={() => saveBill("DRAFT")}
              onSaveOpen={() => saveBill("OPEN")}
              onCancel={closeDialog}
            />
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div>
      <Header title="Bills" />
      <div className="space-y-4 p-6">
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-5">
            <h2 className="text-3xl font-semibold">All Bills</h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon">
                <Ellipsis className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => navigate("/transactions/purchase/bills/create")}
              >
                <Plus className="mr-2 h-4 w-4" /> New
              </Button>
              <Button variant="outline" size="icon">
                <Ellipsis className="h-4 w-4" />
              </Button>
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
                  <TableHead>DATE</TableHead>
                  <TableHead>BILL#</TableHead>
                  <TableHead>REFERENCE NUMBER</TableHead>
                  <TableHead>VENDOR NAME</TableHead>
                  <TableHead>STATUS</TableHead>
                  <TableHead>DUE DATE</TableHead>
                  <TableHead className="text-right">AMOUNT</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bills.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <Checkbox checked={false} />
                    </TableCell>
                    <TableCell>{entry.billDate}</TableCell>
                    <TableCell>
                      <button
                        type="button"
                        className="text-blue-600 hover:underline"
                        onClick={() =>
                          navigate(`/transactions/purchase/bills/${entry.id}`)
                        }
                      >
                        {entry.billNumber}
                      </button>
                    </TableCell>
                    <TableCell>{entry.referenceNumber || "-"}</TableCell>
                    <TableCell>{entry.vendorName}</TableCell>
                    <TableCell>
                      <span
                        className={
                          entry.status === "PAID"
                            ? "text-emerald-600"
                            : "text-slate-600"
                        }
                      >
                        {entry.status}
                      </span>
                    </TableCell>
                    <TableCell>{entry.dueDate}</TableCell>
                    <TableCell className="text-right">
                      {money(getBillTotals(entry).total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={openForm}
        onOpenChange={(open) => (!open ? closeDialog() : setOpenForm(open))}
      >
        <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Bill</DialogTitle>
          </DialogHeader>
          <BillFormSection
            form={form}
            setForm={setForm}
            vendors={vendors}
            clients={clients}
            onAddRow={addRow}
            onUpdateItem={updateItem}
            onRemoveItem={removeItem}
            onSaveDraft={() => saveBill("DRAFT")}
            onSaveOpen={() => saveBill("OPEN")}
            onCancel={closeDialog}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BillFormSection({
  form,
  setForm,
  vendors,
  clients,
  onAddRow,
  onUpdateItem,
  onRemoveItem,
  onSaveDraft,
  onSaveOpen,
  onCancel,
}: {
  form: BillForm;
  setForm: React.Dispatch<React.SetStateAction<BillForm>>;
  vendors: VendorLite[];
  clients: ClientLite[];
  onAddRow: () => void;
  onUpdateItem: (id: string, key: keyof BillItem, value: string) => void;
  onRemoveItem: (id: string) => void;
  onSaveDraft: () => void;
  onSaveOpen: () => void;
  onCancel: () => void;
}) {
  const preview: BillEntry = {
    id: "preview",
    billNumber: form.billNumber || "(auto)",
    orderNumber: form.orderNumber,
    referenceNumber: form.referenceNumber,
    vendorName: form.vendorName,
    vendorAddress: form.vendorAddress,
    billDate: isoToIndian(form.billDate),
    dueDate: isoToIndian(form.dueDate),
    paymentTerms: form.paymentTerms,
    reverseCharge: form.reverseCharge,
    status: "DRAFT",
    notes: form.notes,
    attachmentType: form.attachmentType,
    paymentMade: 0,
    items: form.items,
    tdsType: form.tdsType,
    adjustment: form.adjustment,
  };

  const totals = getBillTotals(preview);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <Label>Vendor Name*</Label>
          <div className="mt-1 flex gap-2">
            <Select
              value={form.vendorName || "none"}
              onValueChange={(value) => {
                const selected = value === "none" ? "" : value;
                setForm((current) => ({
                  ...current,
                  vendorName: selected,
                  vendorAddress: getVendorAddress(selected, vendors),
                }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a Vendor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Select a Vendor</SelectItem>
                {vendors.map((vendor) => (
                  <SelectItem key={vendor.id} value={vendor.name}>
                    {vendor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => toast({ title: "Search vendor" })}
            >
              Search
            </Button>
          </div>
        </div>

        <div>
          <Label>Bill#*</Label>
          <Input
            value={form.billNumber}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                billNumber: event.target.value,
              }))
            }
          />
        </div>

        <div>
          <Label>Order Number</Label>
          <Input
            value={form.orderNumber}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                orderNumber: event.target.value,
              }))
            }
          />
        </div>

        <div>
          <Label>Bill Date*</Label>
          <Input
            type="date"
            value={form.billDate}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                billDate: event.target.value,
              }))
            }
          />
        </div>

        <div>
          <Label>Due Date</Label>
          <Input
            type="date"
            value={form.dueDate}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                dueDate: event.target.value,
              }))
            }
          />
        </div>

        <div>
          <Label>Payment Terms</Label>
          <Select
            value={form.paymentTerms}
            onValueChange={(value) =>
              setForm((current) => ({ ...current, paymentTerms: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Due on Receipt">Due on Receipt</SelectItem>
              <SelectItem value="Net 15">Net 15</SelectItem>
              <SelectItem value="Net 30">Net 30</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Reference Number</Label>
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

        <div className="md:col-span-2">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={form.reverseCharge}
              onCheckedChange={(checked) =>
                setForm((current) => ({ ...current, reverseCharge: !!checked }))
              }
            />
            This transaction is applicable for reverse charge
          </label>
        </div>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-medium">Item Table</p>
            <button
              type="button"
              className="text-sm text-blue-600 hover:underline"
              onClick={() => toast({ title: "Bulk Actions opened" })}
            >
              Bulk Actions
            </button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ITEM DETAILS</TableHead>
                <TableHead>ACCOUNT</TableHead>
                <TableHead className="text-right">QUANTITY</TableHead>
                <TableHead className="text-right">RATE</TableHead>
                <TableHead className="text-right">DISCOUNT</TableHead>
                <TableHead className="text-right">TAX</TableHead>
                <TableHead>CUSTOMER DETAILS</TableHead>
                <TableHead className="text-right">AMOUNT</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {form.items.map((item) => {
                const base = item.quantity * item.rate;
                const discountAmount = (base * item.discount) / 100;
                const taxable = base - discountAmount;
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Input
                        value={item.itemDetails}
                        onChange={(event) =>
                          onUpdateItem(
                            item.id,
                            "itemDetails",
                            event.target.value,
                          )
                        }
                        placeholder="Type or click to select an item"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={item.account}
                        onChange={(event) =>
                          onUpdateItem(item.id, "account", event.target.value)
                        }
                        placeholder="Select an account"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        className="text-right"
                        value={String(item.quantity)}
                        onChange={(event) =>
                          onUpdateItem(item.id, "quantity", event.target.value)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        className="text-right"
                        value={String(item.rate)}
                        onChange={(event) =>
                          onUpdateItem(item.id, "rate", event.target.value)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        className="text-right"
                        value={String(item.discount)}
                        onChange={(event) =>
                          onUpdateItem(item.id, "discount", event.target.value)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        className="text-right"
                        value={String(item.taxPercent)}
                        onChange={(event) =>
                          onUpdateItem(
                            item.id,
                            "taxPercent",
                            event.target.value,
                          )
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={item.customerName || "none"}
                        onValueChange={(value) =>
                          onUpdateItem(
                            item.id,
                            "customerName",
                            value === "none" ? "" : value,
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Customer" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Select Customer</SelectItem>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.name}>
                              {client.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      {taxable.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        className="text-rose-500 hover:underline"
                        onClick={() => onRemoveItem(item.id)}
                      >
                        X
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast({ title: "Purchase discounts opened" })}
            >
              Purchase Discounts
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast({ title: "Reporting tags opened" })}
            >
              Reporting Tags
            </Button>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <Button variant="outline" size="sm" onClick={onAddRow}>
              + Add New Row
            </Button>
            <div className="w-full rounded-md border p-3 md:w-[360px]">
              <div className="flex items-center justify-between py-1 text-sm">
                <span>Sub Total</span>
                <span>{totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-3 py-2 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={form.tdsType === "TDS"}
                    onChange={() =>
                      setForm((current) => ({ ...current, tdsType: "TDS" }))
                    }
                  />
                  TDS
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={form.tdsType === "TCS"}
                    onChange={() =>
                      setForm((current) => ({ ...current, tdsType: "TCS" }))
                    }
                  />
                  TCS
                </label>
                <Select defaultValue="none">
                  <SelectTrigger className="h-8 w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select a Tax</SelectItem>
                    <SelectItem value="10">10%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between py-1 text-sm">
                <span>Adjustment</span>
                <Input
                  className="h-8 w-24 text-right"
                  value={String(form.adjustment)}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      adjustment: toNumber(event.target.value),
                    }))
                  }
                />
              </div>
              <Separator className="my-2" />
              <div className="flex items-center justify-between py-1 text-base font-semibold">
                <span>Total</span>
                <span>{totals.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label>Notes</Label>
          <Textarea
            value={form.notes}
            onChange={(event) =>
              setForm((current) => ({ ...current, notes: event.target.value }))
            }
          />
        </div>
        <div>
          <Label>Attach File(s) to Bill</Label>
          <Select
            value={form.attachmentType}
            onValueChange={(value) =>
              setForm((current) => ({ ...current, attachmentType: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Upload File">Upload File</SelectItem>
              <SelectItem value="Drive">Attach from Drive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
        <div className="flex gap-2">
          <Button variant="outline" onClick={onSaveDraft}>
            Save as Draft
          </Button>
          <Button onClick={onSaveOpen}>Save as Open</Button>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          PDF Template: Standard Template{" "}
          <span className="text-blue-600">Change</span>
        </p>
      </div>
    </div>
  );
}
