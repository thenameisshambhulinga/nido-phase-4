import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import { useData } from "@/contexts/DataContext";
import { safeReadJson } from "@/lib/storage";
import { toast } from "@/hooks/use-toast";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  CalendarClock,
  Ellipsis,
  Pencil,
  Plus,
  Receipt,
  X,
} from "lucide-react";

type Frequency = "Weekly" | "Monthly" | "Quarterly";
type RecurringStatus = "ACTIVE" | "STOPPED";

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

interface RecurringBillHistory {
  id: string;
  message: string;
  by: string;
  at: string;
}

interface RecurringBillProfile {
  id: string;
  vendorName: string;
  profileName: string;
  frequency: Frequency;
  lastBillDate: string;
  nextBillDate: string;
  status: RecurringStatus;
  amount: number;
  startDate: string;
  endDate: string;
  neverExpires: boolean;
  paymentTerms: string;
  reverseCharge: boolean;
  notes: string;
  itemName: string;
  account: string;
}

const BILLS_STORAGE_KEY = "nido_purchase_bills_v1";
const RECURRING_BILLS_STORAGE_KEY = "nido_purchase_recurring_bills_v1";

const todayIso = () => new Date().toISOString().slice(0, 10);

const isoToIndian = (value: string) => {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
};

const indianToIso = (value: string) => {
  const [day, month, year] = value.split("/");
  if (!day || !month || !year) return todayIso();
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
};

const addByFrequency = (dateIso: string, frequency: Frequency) => {
  const date = new Date(`${dateIso}T00:00:00`);
  if (frequency === "Weekly") date.setDate(date.getDate() + 7);
  if (frequency === "Monthly") date.setMonth(date.getMonth() + 1);
  if (frequency === "Quarterly") date.setMonth(date.getMonth() + 3);
  return date.toISOString().slice(0, 10);
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(value);

const toNumber = (value: string | number, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const billTotal = (bill: Pick<BillEntry, "items" | "adjustment">) => {
  const subtotal = bill.items.reduce((sum, item) => {
    const base = item.quantity * item.rate;
    const discountAmount = (base * item.discount) / 100;
    return sum + (base - discountAmount);
  }, 0);
  const tax = bill.items.reduce((sum, item) => {
    const base = item.quantity * item.rate;
    const discountAmount = (base * item.discount) / 100;
    const taxable = base - discountAmount;
    return sum + (taxable * item.taxPercent) / 100;
  }, 0);
  return subtotal + tax + bill.adjustment;
};

const nextBillNumber = (entries: BillEntry[]) => {
  const max = entries.reduce((current, entry) => {
    const parsed = Number(entry.billNumber.replace(/\D/g, ""));
    return Number.isFinite(parsed) ? Math.max(current, parsed) : current;
  }, 2000);
  return String(max + 1);
};

const defaultProfiles: RecurringBillProfile[] = [
  {
    id: "rb-1",
    vendorName: "Axiomatic Technologies",
    profileName: "HP-Laptop - Wipro",
    frequency: "Weekly",
    lastBillDate: "07/04/2026",
    nextBillDate: "14/04/2026",
    status: "ACTIVE",
    amount: 96760,
    startDate: "2026-04-07",
    endDate: "",
    neverExpires: true,
    paymentTerms: "Due on Receipt",
    reverseCharge: false,
    notes: "Auto-generated from recurring profile",
    itemName: "HP-Laptop - Wipro (Apr 2026)",
    account: "IT Purchases",
  },
];

const defaultHistory: Record<string, RecurringBillHistory[]> = {
  "rb-1": [
    {
      id: "rbh-1",
      message: "Profile created",
      by: "nidotechnologies",
      at: "2026-04-07T10:00:00.000Z",
    },
    {
      id: "rbh-2",
      message: "Upcoming bill scheduled for 14/04/2026",
      by: "system",
      at: "2026-04-07T10:02:00.000Z",
    },
  ],
};

export default function RecurringBillsPage() {
  const navigate = useNavigate();
  const { vendors } = useData();

  const [profiles, setProfiles] = useState<RecurringBillProfile[]>(() =>
    safeReadJson<RecurringBillProfile[]>(
      RECURRING_BILLS_STORAGE_KEY,
      defaultProfiles,
    ),
  );
  const [historyMap, setHistoryMap] = useState<
    Record<string, RecurringBillHistory[]>
  >(() =>
    safeReadJson<Record<string, RecurringBillHistory[]>>(
      `${RECURRING_BILLS_STORAGE_KEY}_history`,
      defaultHistory,
    ),
  );
  const [selectedId, setSelectedId] = useState(profiles[0]?.id || "");
  const [openProfileDialog, setOpenProfileDialog] = useState(false);
  const [openBillDialog, setOpenBillDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState<
    Omit<
      RecurringBillProfile,
      "id" | "lastBillDate" | "nextBillDate" | "status"
    >
  >({
    vendorName: "",
    profileName: "",
    frequency: "Weekly",
    amount: 0,
    startDate: todayIso(),
    endDate: "",
    neverExpires: true,
    paymentTerms: "Due on Receipt",
    reverseCharge: false,
    notes: "",
    itemName: "",
    account: "",
  });

  const [billForm, setBillForm] = useState({
    billDate: todayIso(),
    dueDate: todayIso(),
    quantity: "1",
    rate: "0",
    taxPercent: "18",
    discount: "0",
    notes: "",
  });

  const selected = useMemo(
    () =>
      profiles.find((entry) => entry.id === selectedId) || profiles[0] || null,
    [profiles, selectedId],
  );

  const bills = useMemo(
    () => safeReadJson<BillEntry[]>(BILLS_STORAGE_KEY, []),
    [profiles],
  );

  const unpaidBills = useMemo(() => {
    if (!selected) return [] as BillEntry[];
    return bills.filter(
      (entry) =>
        entry.vendorName === selected.vendorName && entry.status !== "PAID",
    );
  }, [bills, selected]);

  const persistProfiles = (next: RecurringBillProfile[]) => {
    setProfiles(next);
    localStorage.setItem(RECURRING_BILLS_STORAGE_KEY, JSON.stringify(next));
  };

  const persistHistory = (next: Record<string, RecurringBillHistory[]>) => {
    setHistoryMap(next);
    localStorage.setItem(
      `${RECURRING_BILLS_STORAGE_KEY}_history`,
      JSON.stringify(next),
    );
  };

  const openCreateProfile = () => {
    setEditingId(null);
    setForm({
      vendorName: "",
      profileName: "",
      frequency: "Weekly",
      amount: 0,
      startDate: todayIso(),
      endDate: "",
      neverExpires: true,
      paymentTerms: "Due on Receipt",
      reverseCharge: false,
      notes: "",
      itemName: "",
      account: "",
    });
    setOpenProfileDialog(true);
  };

  const openEditProfile = () => {
    if (!selected) return;
    setEditingId(selected.id);
    setForm({
      vendorName: selected.vendorName,
      profileName: selected.profileName,
      frequency: selected.frequency,
      amount: selected.amount,
      startDate: selected.startDate,
      endDate: selected.endDate,
      neverExpires: selected.neverExpires,
      paymentTerms: selected.paymentTerms,
      reverseCharge: selected.reverseCharge,
      notes: selected.notes,
      itemName: selected.itemName,
      account: selected.account,
    });
    setOpenProfileDialog(true);
  };

  const saveProfile = () => {
    if (!form.vendorName.trim() || !form.profileName.trim()) {
      toast({ title: "Vendor and profile name are required" });
      return;
    }

    if (editingId) {
      const updated = profiles.map((entry) =>
        entry.id === editingId
          ? {
              ...entry,
              ...form,
              nextBillDate: isoToIndian(
                addByFrequency(form.startDate, form.frequency),
              ),
            }
          : entry,
      );
      persistProfiles(updated);
      persistHistory({
        ...historyMap,
        [editingId]: [
          {
            id: `rbh-${Date.now()}`,
            message: "Profile updated",
            by: "nidotechnologies",
            at: new Date().toISOString(),
          },
          ...(historyMap[editingId] || []),
        ],
      });
      toast({ title: "Recurring bill profile updated" });
      setOpenProfileDialog(false);
      return;
    }

    const created: RecurringBillProfile = {
      id: `rb-${Date.now()}`,
      ...form,
      status: "ACTIVE",
      lastBillDate: isoToIndian(form.startDate),
      nextBillDate: isoToIndian(addByFrequency(form.startDate, form.frequency)),
    };

    const nextProfiles = [created, ...profiles];
    persistProfiles(nextProfiles);
    persistHistory({
      ...historyMap,
      [created.id]: [
        {
          id: `rbh-${Date.now()}`,
          message: "Profile created",
          by: "nidotechnologies",
          at: new Date().toISOString(),
        },
      ],
    });
    setSelectedId(created.id);
    setOpenProfileDialog(false);
    toast({ title: "Recurring bill profile created" });
  };

  const toggleStatus = () => {
    if (!selected) return;
    const nextStatus: RecurringStatus =
      selected.status === "ACTIVE" ? "STOPPED" : "ACTIVE";
    const next = profiles.map((entry) =>
      entry.id === selected.id ? { ...entry, status: nextStatus } : entry,
    );
    persistProfiles(next);
    persistHistory({
      ...historyMap,
      [selected.id]: [
        {
          id: `rbh-${Date.now()}`,
          message: `Profile ${nextStatus === "ACTIVE" ? "resumed" : "stopped"}`,
          by: "nidotechnologies",
          at: new Date().toISOString(),
        },
        ...(historyMap[selected.id] || []),
      ],
    });
    toast({ title: `Profile ${nextStatus.toLowerCase()}` });
  };

  const openCreateBill = () => {
    if (!selected) return;
    setBillForm({
      billDate: todayIso(),
      dueDate: todayIso(),
      quantity: "1",
      rate: String(selected.amount || 0),
      taxPercent: "18",
      discount: "0",
      notes: selected.notes,
    });
    setOpenBillDialog(true);
  };

  const saveRecurringBillInvoice = () => {
    if (!selected) return;

    const existingBills = safeReadJson<BillEntry[]>(BILLS_STORAGE_KEY, []);
    const qty = toNumber(billForm.quantity, 1);
    const rate = toNumber(billForm.rate, selected.amount);
    const discount = toNumber(billForm.discount, 0);
    const taxPercent = toNumber(billForm.taxPercent, 18);

    const created: BillEntry = {
      id: `bill-${Date.now()}`,
      billNumber: nextBillNumber(existingBills),
      orderNumber: "",
      referenceNumber: selected.profileName,
      vendorName: selected.vendorName,
      vendorAddress:
        vendors.find((entry) => entry.name === selected.vendorName)?.address ||
        "No. 6, 4th Main Road, Peenya 2nd Stage, Bangalore",
      billDate: isoToIndian(billForm.billDate),
      dueDate: isoToIndian(billForm.dueDate),
      paymentTerms: selected.paymentTerms,
      reverseCharge: selected.reverseCharge,
      status: "OPEN",
      notes: billForm.notes,
      attachmentType: "Upload File",
      paymentMade: 0,
      tdsType: "TDS",
      adjustment: 0,
      items: [
        {
          id: `bill-item-${Date.now()}`,
          itemDetails: selected.itemName || selected.profileName,
          account: selected.account || "Purchases",
          quantity: qty,
          rate,
          discount,
          taxPercent,
          customerName: "",
        },
      ],
    };

    localStorage.setItem(
      BILLS_STORAGE_KEY,
      JSON.stringify([created, ...existingBills]),
    );

    const updatedProfiles = profiles.map((entry) =>
      entry.id === selected.id
        ? {
            ...entry,
            amount: billTotal(created),
            lastBillDate: created.billDate,
            nextBillDate: isoToIndian(
              addByFrequency(indianToIso(created.billDate), entry.frequency),
            ),
          }
        : entry,
    );
    persistProfiles(updatedProfiles);

    persistHistory({
      ...historyMap,
      [selected.id]: [
        {
          id: `rbh-${Date.now()}`,
          message: `Bill ${created.billNumber} generated for ${formatCurrency(
            billTotal(created),
          )}`,
          by: "system",
          at: new Date().toISOString(),
        },
        ...(historyMap[selected.id] || []),
      ],
    });

    setOpenBillDialog(false);
    toast({ title: "Recurring bill invoice generated" });
    navigate(`/transactions/purchase/bills/${created.id}`);
  };

  const activeProfiles = profiles.filter(
    (entry) => entry.status === "ACTIVE",
  ).length;

  return (
    <div>
      <Header title="Recurring Bills" />
      <div className="space-y-4 p-6">
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
            <div>
              <h2 className="text-3xl font-semibold">All Recurring Bills</h2>
              <p className="text-sm text-muted-foreground">
                {activeProfiles} active profiles,{" "}
                {profiles.length - activeProfiles} paused
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={openCreateProfile}>
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
                  <TableHead>VENDOR NAME</TableHead>
                  <TableHead>PROFILE NAME</TableHead>
                  <TableHead>FREQUENCY</TableHead>
                  <TableHead>LAST BILL DATE</TableHead>
                  <TableHead>NEXT BILL DATE</TableHead>
                  <TableHead>STATUS</TableHead>
                  <TableHead className="text-right">AMOUNT</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((entry) => (
                  <TableRow
                    key={entry.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedId(entry.id)}
                  >
                    <TableCell>
                      <Checkbox checked={selectedId === entry.id} />
                    </TableCell>
                    <TableCell>{entry.vendorName}</TableCell>
                    <TableCell className="font-medium text-blue-700">
                      {entry.profileName}
                    </TableCell>
                    <TableCell>{entry.frequency}</TableCell>
                    <TableCell>{entry.lastBillDate}</TableCell>
                    <TableCell>{entry.nextBillDate}</TableCell>
                    <TableCell>
                      <span
                        className={
                          entry.status === "ACTIVE"
                            ? "text-emerald-600"
                            : "text-slate-500"
                        }
                      >
                        {entry.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(entry.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {selected && (
          <Card>
            <CardContent className="space-y-4 pt-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-4xl font-semibold tracking-tight">
                  {selected.profileName}
                </h3>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={openEditProfile}>
                    <Pencil className="mr-2 h-4 w-4" /> Edit
                  </Button>
                  <Button onClick={openCreateBill}>
                    <Receipt className="mr-2 h-4 w-4" /> Create Bill
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline">More</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={toggleStatus}>
                        {selected.status === "ACTIVE"
                          ? "Stop profile"
                          : "Resume profile"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() =>
                          navigate(
                            "/transactions/purchase/payments-made/create",
                            {
                              state: { vendorName: selected.vendorName },
                            },
                          )
                        }
                      >
                        Record payment
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedId("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Tabs defaultValue="overview" className="w-full">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="next-bill">Next Bill</TabsTrigger>
                  <TabsTrigger value="recent">Recent Activities</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="pt-4">
                  <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
                    <div className="rounded-lg border">
                      <div className="border-b p-4">
                        <p className="text-xl font-medium text-blue-700">
                          {selected.vendorName}
                        </p>
                      </div>
                      <div className="space-y-2 p-4 text-sm">
                        <p className="font-semibold">DETAILS</p>
                        <div className="grid grid-cols-[120px_1fr] gap-y-2">
                          <span className="text-muted-foreground">
                            Profile Status:
                          </span>
                          <Badge>
                            {selected.status === "ACTIVE"
                              ? "Active"
                              : "Stopped"}
                          </Badge>
                          <span className="text-muted-foreground">
                            Start Date:
                          </span>
                          <span>{isoToIndian(selected.startDate)}</span>
                          <span className="text-muted-foreground">
                            End Date:
                          </span>
                          <span>
                            {selected.neverExpires
                              ? "Never Expires"
                              : isoToIndian(selected.endDate)}
                          </span>
                          <span className="text-muted-foreground">
                            Payment Terms:
                          </span>
                          <span>{selected.paymentTerms}</span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border">
                      <div className="grid gap-4 border-b p-4 md:grid-cols-3">
                        <div>
                          <p className="text-muted-foreground">Bill Amount</p>
                          <p className="text-3xl font-semibold">
                            {formatCurrency(selected.amount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">
                            Next Bill Date
                          </p>
                          <p className="text-3xl font-semibold text-blue-700">
                            {selected.nextBillDate}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">
                            Recurring Period
                          </p>
                          <p className="text-3xl font-semibold">
                            {selected.frequency}
                          </p>
                        </div>
                      </div>

                      <div className="p-4">
                        <div className="mb-3 flex items-center gap-2">
                          <CalendarClock className="h-4 w-4 text-blue-700" />
                          <p className="text-lg font-semibold">Unpaid Bills</p>
                        </div>
                        {unpaidBills.length === 0 ? (
                          <p className="py-16 text-center text-muted-foreground">
                            There are no Unpaid Bills
                          </p>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Bill#</TableHead>
                                <TableHead>Due Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">
                                  Amount
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {unpaidBills.map((bill) => (
                                <TableRow key={bill.id}>
                                  <TableCell
                                    className="cursor-pointer text-blue-700"
                                    onClick={() =>
                                      navigate(
                                        `/transactions/purchase/bills/${bill.id}`,
                                      )
                                    }
                                  >
                                    {bill.billNumber}
                                  </TableCell>
                                  <TableCell>{bill.dueDate}</TableCell>
                                  <TableCell>{bill.status}</TableCell>
                                  <TableCell className="text-right">
                                    {formatCurrency(billTotal(bill))}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="next-bill" className="pt-4">
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">
                      Upcoming invoice preview
                    </p>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Profile</p>
                        <p className="text-lg font-semibold">
                          {selected.profileName}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Scheduled Date
                        </p>
                        <p className="text-lg font-semibold text-blue-700">
                          {selected.nextBillDate}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Default Item
                        </p>
                        <p className="text-lg font-semibold">
                          {selected.itemName || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Expected Amount
                        </p>
                        <p className="text-lg font-semibold">
                          {formatCurrency(selected.amount)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Button onClick={openCreateBill}>
                        Generate Bill Now
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="recent" className="pt-4">
                  <div className="space-y-3 rounded-lg border p-4">
                    {(historyMap[selected.id] || []).map((entry) => (
                      <div
                        key={entry.id}
                        className="rounded-md border bg-muted/20 p-3"
                      >
                        <p className="font-medium">{entry.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(entry.at).toLocaleString()} by {entry.by}
                        </p>
                      </div>
                    ))}
                    {(historyMap[selected.id] || []).length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No activity yet.
                      </p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={openProfileDialog} onOpenChange={setOpenProfileDialog}>
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Recurring Bill" : "New Recurring Bill"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Vendor Name*</Label>
                <Select
                  value={form.vendorName}
                  onValueChange={(value) =>
                    setForm((current) => ({ ...current, vendorName: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map((vendor) => (
                      <SelectItem key={vendor.id} value={vendor.name}>
                        {vendor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Profile Name*</Label>
                <Input
                  value={form.profileName}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      profileName: event.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label>Repeat Every*</Label>
                <Select
                  value={form.frequency}
                  onValueChange={(value: Frequency) =>
                    setForm((current) => ({ ...current, frequency: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Weekly">Week</SelectItem>
                    <SelectItem value="Monthly">Month</SelectItem>
                    <SelectItem value="Quarterly">Quarter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Amount</Label>
                <Input
                  type="number"
                  value={form.amount}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      amount: toNumber(event.target.value),
                    }))
                  }
                />
              </div>
              <div>
                <Label>Start On</Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      startDate: event.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label>Ends On</Label>
                <Input
                  type="date"
                  value={form.endDate}
                  disabled={form.neverExpires}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      endDate: event.target.value,
                    }))
                  }
                />
                <label className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <Checkbox
                    checked={form.neverExpires}
                    onCheckedChange={(checked) =>
                      setForm((current) => ({
                        ...current,
                        neverExpires: !!checked,
                      }))
                    }
                  />
                  Never Expires
                </label>
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
                    <SelectItem value="Due on Receipt">
                      Due on Receipt
                    </SelectItem>
                    <SelectItem value="Net 15">Net 15</SelectItem>
                    <SelectItem value="Net 30">Net 30</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Item Name</Label>
                <Input
                  value={form.itemName}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      itemName: event.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label>Account</Label>
                <Input
                  value={form.account}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      account: event.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Checkbox
                checked={form.reverseCharge}
                onCheckedChange={(checked) =>
                  setForm((current) => ({
                    ...current,
                    reverseCharge: !!checked,
                  }))
                }
              />
              This transaction is applicable for reverse charge
            </label>
            <div>
              <Label>Notes</Label>
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
            <div className="flex items-center gap-2 pt-2">
              <Button onClick={saveProfile}>
                {editingId ? "Update" : "Save"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setOpenProfileDialog(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={openBillDialog} onOpenChange={setOpenBillDialog}>
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Recurring Bill Invoice</DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Vendor</Label>
                  <Input value={selected.vendorName} disabled />
                </div>
                <div>
                  <Label>Profile</Label>
                  <Input value={selected.profileName} disabled />
                </div>
                <div>
                  <Label>Bill Date</Label>
                  <Input
                    type="date"
                    value={billForm.billDate}
                    onChange={(event) =>
                      setBillForm((current) => ({
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
                    value={billForm.dueDate}
                    onChange={(event) =>
                      setBillForm((current) => ({
                        ...current,
                        dueDate: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="rounded-lg border">
                <div className="border-b p-3 font-semibold">Item Table</div>
                <div className="grid gap-3 p-3 md:grid-cols-5">
                  <div className="md:col-span-2">
                    <Label>Item Details</Label>
                    <Input
                      value={selected.itemName || selected.profileName}
                      disabled
                    />
                  </div>
                  <div>
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      value={billForm.quantity}
                      onChange={(event) =>
                        setBillForm((current) => ({
                          ...current,
                          quantity: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label>Rate</Label>
                    <Input
                      type="number"
                      value={billForm.rate}
                      onChange={(event) =>
                        setBillForm((current) => ({
                          ...current,
                          rate: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label>Tax %</Label>
                    <Input
                      type="number"
                      value={billForm.taxPercent}
                      onChange={(event) =>
                        setBillForm((current) => ({
                          ...current,
                          taxPercent: event.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea
                  value={billForm.notes}
                  onChange={(event) =>
                    setBillForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="flex items-center gap-2">
                <Button onClick={saveRecurringBillInvoice}>Save</Button>
                <Button
                  variant="outline"
                  onClick={() => setOpenBillDialog(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
