import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
<<<<<<< HEAD
=======
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
>>>>>>> 67d1e15f2fd66c27748766bdee559c6aee16d96e
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
<<<<<<< HEAD
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  Calendar,
  ChevronDown,
  ChevronRight,
  Clock3,
  CreditCard,
  IdCard,
  Keyboard,
  Laptop,
  Mail,
  MapPin,
  Monitor,
  Pencil,
  Phone,
  Search,
  ShieldCheck,
  Smartphone,
=======
  ArrowLeft,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  Calendar,
  Clock3,
  IdCard,
  Laptop,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Search,
  ShieldCheck,
>>>>>>> 67d1e15f2fd66c27748766bdee559c6aee16d96e
  User,
  UserCircle2,
  UserX,
  Wallet,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
<<<<<<< HEAD
import { cn } from "@/lib/utils";
import { getProductImage } from "@/lib/catalogMedia";
=======
>>>>>>> 67d1e15f2fd66c27748766bdee559c6aee16d96e
import QuickMailComposer from "@/components/shared/QuickMailComposer";

type DeviceStatus = "available" | "assigned" | "maintenance";

type DeviceRecord = {
  id: string;
  name: string;
  serialNumber: string;
  assignedTo?: string;
  status: DeviceStatus;
  assignedDate?: string;
  expiresOn?: string;
};

const DEFAULT_DEVICES: DeviceRecord[] = [
  {
    id: "dev-1",
<<<<<<< HEAD
    name: "Apple MacBook Pro (2023)",
=======
    name: "Apple MacBook Pro 14",
>>>>>>> 67d1e15f2fd66c27748766bdee559c6aee16d96e
    serialNumber: "MBP-AT-0001",
    status: "available",
    expiresOn: "2027-12-31",
  },
  {
    id: "dev-2",
    name: "iPhone 15 Pro",
    serialNumber: "IPH-AT-0002",
    status: "available",
    expiresOn: "2027-07-15",
  },
  {
    id: "dev-3",
<<<<<<< HEAD
    name: "Dell Monitor 27",
=======
    name: "Dell Latitude 7440",
>>>>>>> 67d1e15f2fd66c27748766bdee559c6aee16d96e
    serialNumber: "DLL-GC-0003",
    status: "available",
    expiresOn: "2028-03-20",
  },
  {
    id: "dev-4",
<<<<<<< HEAD
    name: "Logitech Keyboard",
    serialNumber: "LOG-EP-0004",
=======
    name: "Samsung Galaxy S24",
    serialNumber: "SAM-EP-0004",
>>>>>>> 67d1e15f2fd66c27748766bdee559c6aee16d96e
    status: "maintenance",
    expiresOn: "2027-11-10",
  },
];

const DEVICE_STORAGE_KEY = "nido_devices_inventory";

function parseDevices(raw: string | null): DeviceRecord[] {
  if (!raw) return DEFAULT_DEVICES;
<<<<<<< HEAD

=======
>>>>>>> 67d1e15f2fd66c27748766bdee559c6aee16d96e
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_DEVICES;
    return parsed as DeviceRecord[];
  } catch {
    return DEFAULT_DEVICES;
  }
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

<<<<<<< HEAD
function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatDate(value?: string) {
  if (!value) return "-";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(parsed);
}

function formatDateTime(value?: string) {
  if (!value) return "Today, 11:15 AM";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

function buildPseudoIp(seed: string) {
  const digits = seed.replace(/\D/g, "").padEnd(6, "123456");
  return `10.${Number(digits.slice(0, 2)) % 200}.${Number(digits.slice(2, 4)) % 200}.${Number(digits.slice(4, 6)) % 200}`;
}

function getDeviceIcon(name: string) {
  const normalized = name.toLowerCase();
  if (normalized.includes("iphone") || normalized.includes("galaxy")) {
    return Smartphone;
  }
  if (normalized.includes("monitor")) {
    return Monitor;
  }
  if (normalized.includes("keyboard")) {
    return Keyboard;
  }
  return Laptop;
}

function getStatusClasses(status: string) {
  const normalized = status.toLowerCase();

  if (normalized === "delivered" || normalized === "active" || normalized === "assigned") {
    return "bg-emerald-100 text-emerald-700 border-emerald-200";
  }

  if (normalized === "processing" || normalized === "pending") {
    return "bg-indigo-100 text-indigo-700 border-indigo-200";
  }

  if (normalized === "cancelled" || normalized === "inactive" || normalized === "suspended") {
    return "bg-rose-100 text-rose-700 border-rose-200";
  }

  return "bg-slate-100 text-slate-700 border-slate-200";
}

function StatCard({
  icon: Icon,
  label,
  value,
  supporting,
}: {
  icon: typeof User;
  label: string;
  value: string;
  supporting?: string;
}) {
  return (
    <Card className="rounded-[24px] border border-slate-200 bg-white shadow-sm">
      <CardContent className="flex h-full items-start gap-4 p-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            {label}
          </p>
          <p className="mt-2 text-xl font-semibold text-slate-900">{value}</p>
          {supporting && <p className="mt-1 text-sm text-slate-500">{supporting}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function DetailCard({
  title,
  icon: Icon,
  rows,
}: {
  title: string;
  icon: typeof User;
  rows: Array<{ label: string; value: string }>;
}) {
  return (
    <Card className="rounded-[24px] border border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-100 pb-4">
        <CardTitle className="flex items-center gap-3 text-lg font-semibold text-slate-900">
          <Icon className="h-5 w-5 text-blue-600" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {rows.map((row) => (
          <div
            key={row.label}
            className="grid gap-1 border-b border-slate-100 px-6 py-4 last:border-b-0 md:grid-cols-[170px_minmax(0,1fr)] md:gap-4"
          >
            <p className="text-sm text-slate-500">{row.label}</p>
            <p className="text-sm font-medium text-slate-900">{row.value}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

=======
>>>>>>> 67d1e15f2fd66c27748766bdee559c6aee16d96e
export default function UserProfilePage() {
  const { id: clientId, userId } = useParams();
  const navigate = useNavigate();
  const { users, updateUser } = useAuth();
  const { clients, orders } = useData();

<<<<<<< HEAD
=======
  const [activeTab, setActiveTab] = useState("overview");
>>>>>>> 67d1e15f2fd66c27748766bdee559c6aee16d96e
  const [showMail, setShowMail] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [serialSearch, setSerialSearch] = useState("");
  const [devicePool, setDevicePool] = useState<DeviceRecord[]>(() =>
    parseDevices(localStorage.getItem(DEVICE_STORAGE_KEY)),
  );
  const [profileDraft, setProfileDraft] = useState({
    name: "",
    email: "",
    phone: "",
    jobTitle: "",
    department: "",
  });

  useEffect(() => {
    localStorage.setItem(DEVICE_STORAGE_KEY, JSON.stringify(devicePool));
  }, [devicePool]);

  const client = clients.find((entry) => entry.id === clientId);
  const profileUser = users.find((entry) => entry.id === userId);

  useEffect(() => {
    if (!profileUser || !client) return;
<<<<<<< HEAD

=======
>>>>>>> 67d1e15f2fd66c27748766bdee559c6aee16d96e
    setProfileDraft({
      name: profileUser.name,
      email: profileUser.email,
      phone: client.contactNumber || client.phone || "",
      jobTitle: profileUser.jobTitle || client.jobTitle || "",
      department: profileUser.department || client.industryType || "",
    });
  }, [client, profileUser]);

  const userOrders = useMemo(() => {
    if (!profileUser || !client) return [];
<<<<<<< HEAD

=======
>>>>>>> 67d1e15f2fd66c27748766bdee559c6aee16d96e
    return orders.filter((order) => {
      const matchesClient = order.organization === client.name;
      const matchesUser =
        order.requestingUser === profileUser.name ||
        order.assignedUser === profileUser.name ||
        order.assignedUser === profileUser.id;
<<<<<<< HEAD

=======
>>>>>>> 67d1e15f2fd66c27748766bdee559c6aee16d96e
      return matchesClient && matchesUser;
    });
  }, [client, orders, profileUser]);

  const displayOrders = useMemo(() => {
    if (!client) return [];
    if (userOrders.length > 0) return userOrders;

<<<<<<< HEAD
    return orders.filter((order) => order.organization === client.name).slice(0, 8);
  }, [client, orders, userOrders]);

  const totalOrderValue = useMemo(
    () => displayOrders.reduce((sum, order) => sum + order.totalAmount, 0),
    [displayOrders],
=======
    // Fallback for org users with no explicit assignment so profile never looks empty.
    return orders
      .filter((order) => order.organization === client.name)
      .slice(0, 8);
  }, [client, orders, userOrders]);

  const totalOrderValue = displayOrders.reduce(
    (sum, order) => sum + order.totalAmount,
    0,
>>>>>>> 67d1e15f2fd66c27748766bdee559c6aee16d96e
  );
  const totalExpenses = Math.round(totalOrderValue * 0.24);

  const assignedDevices = useMemo(() => {
    if (!profileUser) return [];
    return devicePool.filter((device) => device.assignedTo === profileUser.id);
  }, [devicePool, profileUser]);

  const matchingDevice = useMemo(() => {
    const normalized = serialSearch.trim().toLowerCase();
    if (!normalized) return null;
<<<<<<< HEAD

=======
>>>>>>> 67d1e15f2fd66c27748766bdee559c6aee16d96e
    return (
      devicePool.find(
        (device) => device.serialNumber.trim().toLowerCase() === normalized,
      ) || null
    );
  }, [devicePool, serialSearch]);

  const monthlyExpenseTrend = useMemo(() => {
<<<<<<< HEAD
    const monthTotals = new Map<string, number>();

    displayOrders.forEach((order) => {
      const orderDate = new Date(order.orderDate || new Date().toISOString());
      const monthKey = Number.isNaN(orderDate.getTime())
        ? new Date().toISOString().slice(0, 7)
        : orderDate.toISOString().slice(0, 7);

      monthTotals.set(
        monthKey,
        (monthTotals.get(monthKey) || 0) + Math.round(order.totalAmount * 0.24),
      );
    });

    const reference = new Date();
    const fallbackWeights = [0.12, 0.18, 0.22, 0.26, 0.32];

    return Array.from({ length: 5 }, (_, index) => {
      const monthDate = new Date(reference.getFullYear(), reference.getMonth() - (4 - index), 1);
      const monthKey = monthDate.toISOString().slice(0, 7);
      const monthLabel = monthDate.toLocaleString("en-US", { month: "short" });
      const amount =
        monthTotals.get(monthKey) ||
        Math.max(750, Math.round(totalExpenses * fallbackWeights[index]));

      return {
        key: monthKey,
        month: monthLabel,
        amount,
      };
    });
  }, [displayOrders, totalExpenses]);

  const openOrderCount = useMemo(
    () =>
      displayOrders.filter((order) => {
        const normalized = order.status.toLowerCase();
        return !["delivered", "cancelled"].includes(normalized);
      }).length,
    [displayOrders],
  );
=======
    const monthly = new Map<string, number>();
    displayOrders.forEach((order) => {
      const monthKey =
        order.orderDate?.slice(0, 7) || new Date().toISOString().slice(0, 7);
      monthly.set(
        monthKey,
        (monthly.get(monthKey) || 0) + Math.round(order.totalAmount * 0.24),
      );
    });

    const series = Array.from(monthly.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, amount]) => ({ month, amount }));

    if (series.length > 0) return series;

    return [
      { month: "2026-01", amount: Math.round(totalExpenses * 0.18) },
      { month: "2026-02", amount: Math.round(totalExpenses * 0.21) },
      { month: "2026-03", amount: Math.round(totalExpenses * 0.27) },
      { month: "2026-04", amount: Math.round(totalExpenses * 0.34) },
    ];
  }, [displayOrders, totalExpenses]);

  const openOrderCount = displayOrders.filter((order) => {
    const normalized = order.status.toLowerCase();
    return !["delivered", "cancelled"].includes(normalized);
  }).length;
>>>>>>> 67d1e15f2fd66c27748766bdee559c6aee16d96e

  const humanizedRole = (profileUser?.role || "employee")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
<<<<<<< HEAD

=======
>>>>>>> 67d1e15f2fd66c27748766bdee559c6aee16d96e
  const profileStatusLabel =
    profileUser?.status === "active"
      ? "Active"
      : profileUser?.status === "inactive"
        ? "Inactive"
        : "Suspended";
<<<<<<< HEAD

=======
>>>>>>> 67d1e15f2fd66c27748766bdee559c6aee16d96e
  const employeeId =
    client?.contactEmployeeId ||
    `EMP-${
      String(profileUser?.id || "")
        .replace(/[^a-zA-Z0-9]/g, "")
        .slice(-5)
        .toUpperCase() || "1001"
    }`;
<<<<<<< HEAD

  const clientCompanyName = client?.companyName || client?.name || "Client Organization";

=======
>>>>>>> 67d1e15f2fd66c27748766bdee559c6aee16d96e
  const locationLabel = client?.locationDetails
    ? [
        client.locationDetails.city,
        client.locationDetails.state,
        client.locationDetails.country,
      ]
        .filter(Boolean)
        .join(", ")
    : client?.address || "Location not provided";
<<<<<<< HEAD

  const timezoneLabel = client?.locationDetails?.timeZone || "Asia/Kolkata";
  const userPhone = profileDraft.phone || client?.contactNumber || client?.phone || "-";
  const joinedOn = formatDate(profileUser?.createdAt);
  const lastLogin = formatDateTime(profileUser?.createdAt);
  const activityIp = buildPseudoIp(profileUser?.id || "10242234");
  const avgOrderValue = displayOrders.length
    ? Math.round(totalOrderValue / displayOrders.length)
    : 0;
  const maxExpenseAmount = Math.max(...monthlyExpenseTrend.map((item) => item.amount), 1);
  const activeDevice = assignedDevices[0] || {
    id: "preview-device",
    name: "Apple MacBook Pro (2023)",
    serialNumber: "11236JW29PQTT",
    status: "assigned" as DeviceStatus,
    assignedDate: "2024-03-05",
    expiresOn: "2024-03-05",
  };

  const topStats = [
=======
  const userPhone = client?.contactNumber || client?.phone || "-";
  const profileMeta = [
>>>>>>> 67d1e15f2fd66c27748766bdee559c6aee16d96e
    {
      icon: IdCard,
      label: "User ID",
      value: employeeId,
<<<<<<< HEAD
      supporting: clientCompanyName,
=======
>>>>>>> 67d1e15f2fd66c27748766bdee559c6aee16d96e
    },
    {
      icon: ShieldCheck,
      label: "Status",
      value: profileStatusLabel,
<<<<<<< HEAD
      supporting: `Last login ${lastLogin}`,
=======
>>>>>>> 67d1e15f2fd66c27748766bdee559c6aee16d96e
    },
    {
      icon: UserCircle2,
      label: "Role",
      value: humanizedRole,
<<<<<<< HEAD
      supporting: profileUser?.department || client?.industryType || "Operations",
    },
    {
      icon: CreditCard,
      label: "Total Orders",
      value: String(displayOrders.length),
      supporting: `${openOrderCount} currently open`,
    },
    {
      icon: Wallet,
      label: "Expenses",
      value: formatMoney(totalExpenses),
      supporting: `IP: ${activityIp}`,
    },
  ];

  const personalDetails = [
    { label: "Full Name", value: profileUser?.name || "-" },
    { label: "Employee ID", value: employeeId },
    { label: "Email Address", value: profileUser?.email || "-" },
    { label: "Phone Number", value: userPhone },
    { label: "Gender", value: "Not provided" },
  ];

  const professionalDetails = [
    {
=======
    },
  ];
  const personalDetails = [
    { icon: User, label: "Full Name", value: profileUser?.name || "-" },
    { icon: IdCard, label: "Employee ID", value: employeeId },
    { icon: Mail, label: "Email Address", value: profileUser?.email || "-" },
    { icon: Phone, label: "Phone Number", value: userPhone },
    {
      icon: Calendar,
      label: "Date of Birth",
      value: "Not provided",
    },
    {
      icon: BadgeCheck,
      label: "Gender",
      value: "Not provided",
    },
  ];
  const professionalDetails = [
    {
      icon: BriefcaseBusiness,
>>>>>>> 67d1e15f2fd66c27748766bdee559c6aee16d96e
      label: "Job Title",
      value: profileUser?.jobTitle || client?.jobTitle || "Employee",
    },
    {
<<<<<<< HEAD
=======
      icon: Building2,
>>>>>>> 67d1e15f2fd66c27748766bdee559c6aee16d96e
      label: "Department",
      value: profileUser?.department || client?.industryType || "Operations",
    },
    {
<<<<<<< HEAD
=======
      icon: UserCircle2,
>>>>>>> 67d1e15f2fd66c27748766bdee559c6aee16d96e
      label: "Reporting Manager",
      value: client?.contactPerson || "System Owner",
    },
    {
<<<<<<< HEAD
      label: "Joining Date",
      value: joinedOn,
    },
    {
=======
      icon: Calendar,
      label: "Joining Date",
      value: profileUser?.createdAt || "-",
    },
    {
      icon: ShieldCheck,
>>>>>>> 67d1e15f2fd66c27748766bdee559c6aee16d96e
      label: "Role",
      value: humanizedRole,
    },
  ];

<<<<<<< HEAD
  const orderRows = useMemo(() => {
    return displayOrders.slice(0, 5).map((order, index) => {
      const device =
        assignedDevices[index % Math.max(assignedDevices.length, 1)] ||
        DEFAULT_DEVICES[index % DEFAULT_DEVICES.length];
      const DeviceIcon = getDeviceIcon(device.name);

      return {
        ...order,
        device,
        DeviceIcon,
      };
    });
  }, [assignedDevices, displayOrders]);

  const handleAssignDevice = () => {
    if (!matchingDevice || !profileUser) {
=======
  if (!client || !profileUser) {
    return (
      <div>
        <Header title="User Profile" />
        <div className="p-6">
          <Card className="rounded-2xl border border-gray-100 shadow-sm">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">
                User profile not found.
              </p>
              <Button
                className="mt-4"
                variant="outline"
                onClick={() =>
                  navigate(clientId ? `/clients/${clientId}` : "/clients")
                }
              >
                Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const handleAssignDevice = () => {
    if (!matchingDevice) {
>>>>>>> 67d1e15f2fd66c27748766bdee559c6aee16d96e
      toast({
        title: "Device not found",
        description: "Enter a valid serial number.",
      });
      return;
    }

<<<<<<< HEAD
    if (matchingDevice.assignedTo && matchingDevice.assignedTo !== profileUser.id) {
=======
    if (
      matchingDevice.assignedTo &&
      matchingDevice.assignedTo !== profileUser.id
    ) {
>>>>>>> 67d1e15f2fd66c27748766bdee559c6aee16d96e
      toast({
        title: "Device already assigned",
        description: `This device is assigned to user ${matchingDevice.assignedTo}.`,
      });
      return;
    }

    if (matchingDevice.status === "maintenance") {
      toast({
        title: "Device unavailable",
        description:
          "Device is in maintenance and cannot be assigned right now.",
      });
      return;
    }

    setDevicePool((prev) =>
      prev.map((device) =>
        device.id === matchingDevice.id
          ? {
              ...device,
              assignedTo: profileUser.id,
              status: "assigned",
              assignedDate: new Date().toISOString().slice(0, 10),
            }
          : device,
      ),
    );

    toast({
      title: "Device assigned",
      description: `${matchingDevice.name} assigned to ${profileUser.name}.`,
    });
    setAssignDialogOpen(false);
    setSerialSearch("");
  };

<<<<<<< HEAD
  const handleSaveProfile = async () => {
    if (!profileUser) return;

    const success = await updateUser(profileUser.id, {
=======
  const handleSaveProfile = () => {
    if (!profileUser) return;
    updateUser(profileUser.id, {
>>>>>>> 67d1e15f2fd66c27748766bdee559c6aee16d96e
      name: profileDraft.name.trim() || profileUser.name,
      email: profileDraft.email.trim() || profileUser.email,
      jobTitle: profileDraft.jobTitle.trim(),
      department: profileDraft.department.trim(),
    });
<<<<<<< HEAD

    if (!success) {
      toast({
        title: "Update failed",
        description: "Profile information could not be updated.",
      });
      return;
    }

=======
>>>>>>> 67d1e15f2fd66c27748766bdee559c6aee16d96e
    toast({
      title: "User updated",
      description: "Profile information was updated successfully.",
    });
    setProfileEditOpen(false);
  };

<<<<<<< HEAD
  const handleToggleStatus = async () => {
    if (!profileUser) return;

    const nextStatus = profileUser.status === "active" ? "inactive" : "active";
    const success = await updateUser(profileUser.id, { status: nextStatus });

    if (!success) {
      toast({
        title: "Status update failed",
        description: "The user status could not be changed.",
      });
      return;
    }

=======
  const handleToggleStatus = () => {
    if (!profileUser) return;
    const nextStatus = profileUser.status === "active" ? "inactive" : "active";
    updateUser(profileUser.id, { status: nextStatus });
>>>>>>> 67d1e15f2fd66c27748766bdee559c6aee16d96e
    toast({
      title: nextStatus === "active" ? "User reactivated" : "User deactivated",
      description: `${profileUser.name} is now ${nextStatus}.`,
    });
  };

<<<<<<< HEAD
  if (!client || !profileUser) {
    return (
      <div>
        <Header title="User Profile" />
        <div className="p-6">
          <Card className="rounded-2xl border border-gray-100 shadow-sm">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">
                User profile not found.
              </p>
              <Button
                className="mt-4"
                variant="outline"
                onClick={() =>
                  navigate(clientId ? `/clients/${clientId}` : "/clients")
                }
              >
                Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const ActiveDeviceIcon = getDeviceIcon(activeDevice.name);

  return (
    <>
      <div>
        <Header title={clientCompanyName} />

        <div className="min-h-full bg-slate-50/70 p-4 md:p-6">
          <div className="mx-auto max-w-[1680px] space-y-6">
            <div className="flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                    <button
                      type="button"
                      onClick={() => navigate("/clients")}
                      className="hover:text-slate-900"
                    >
                      Clients
                    </button>
                    <ChevronRight className="h-4 w-4" />
                    <button
                      type="button"
                      onClick={() => navigate(`/clients/${client.id}`)}
                      className="hover:text-slate-900"
                    >
                      {clientCompanyName}
                    </button>
                    <ChevronRight className="h-4 w-4" />
                    <span>Users</span>
                    <ChevronRight className="h-4 w-4" />
                    <span className="font-medium text-slate-900">
                      {profileUser.name}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate(`/clients/${client.id}`)}
                      className="h-10 w-10 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>

                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
                          {profileUser.name}
                        </h1>
                        <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
                          {profileStatusLabel}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm text-slate-500">
                        {profileUser.jobTitle || client.jobTitle || "Employee"} at{" "}
                        {clientCompanyName}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    className="h-11 rounded-xl bg-slate-950 px-5 text-white hover:bg-slate-800"
                    onClick={() => setShowMail(true)}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Send Email
                  </Button>
                  <Button
                    variant="outline"
                    className="h-11 rounded-xl border-slate-300 px-5 text-slate-700"
                    onClick={() => window.open(`tel:${userPhone}`)}
                  >
                    <Phone className="mr-2 h-4 w-4" />
                    Call
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-11 rounded-xl border-slate-300 px-4 text-slate-700"
                      >
                        Actions
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      <DropdownMenuItem onClick={() => setProfileEditOpen(true)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit user
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setAssignDialogOpen(true)}>
                        <Laptop className="mr-2 h-4 w-4" />
                        Assign device
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => void handleToggleStatus()}>
                        <UserX className="mr-2 h-4 w-4" />
                        {profileUser.status === "active"
                          ? "Deactivate user"
                          : "Reactivate user"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
              <Card className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
                <div className="h-32 bg-[linear-gradient(135deg,#1d4ed8_0%,#2563eb_48%,#60a5fa_100%)]" />
                <CardContent className="-mt-14 space-y-5 p-5 pt-0">
                  <div className="mx-auto flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-[6px] border-white bg-white shadow-[0_18px_40px_rgba(37,99,235,0.18)]">
                    {profileUser.avatar ? (
                      <img
                        src={profileUser.avatar}
                        alt={profileUser.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl font-semibold text-blue-700">
                        {getInitials(profileUser.name)}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 text-center">
                    <h2 className="text-[30px] font-semibold tracking-tight text-slate-900">
                      {profileUser.name}
                    </h2>
                    <p className="text-base text-slate-500">
                      {profileUser.jobTitle || client.jobTitle || "Employee"}
                    </p>
                  </div>

                  <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                    {[
                      { icon: Mail, value: profileUser.email },
                      { icon: Phone, value: userPhone },
                      { icon: Clock3, value: `Active today · ${lastLogin}` },
                      { icon: Building2, value: clientCompanyName },
                    ].map((item) => (
                      <div key={item.value} className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                          <item.icon className="h-4 w-4" />
                        </div>
                        <p className="min-w-0 truncate text-sm font-medium text-slate-700">
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      className="rounded-xl bg-slate-950 hover:bg-slate-800"
                      onClick={() => setShowMail(true)}
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Send Email
                    </Button>
                    <Button
                      variant="outline"
                      className="rounded-xl border-slate-300 text-slate-700"
                      onClick={() => window.open(`tel:${userPhone}`)}
                    >
                      <Phone className="mr-2 h-4 w-4" />
                      Call
                    </Button>
                  </div>

                  <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-500">
                          Last Login
                        </p>
                        <p className="mt-1 font-semibold text-slate-900">
                          {lastLogin}
                        </p>
                      </div>
                      <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
                        Active
                      </Badge>
                    </div>

                    <div className="space-y-2 text-sm text-slate-500">
                      <p className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-blue-600" />
                        {locationLabel}
                      </p>
                      <p className="flex items-center gap-2">
                        <Clock3 className="h-4 w-4 text-blue-600" />
                        {timezoneLabel}
                      </p>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl bg-blue-50 px-4 py-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
                          Role Badge
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {humanizedRole}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-5">
                  {topStats.map((stat) => (
                    <StatCard
                      key={stat.label}
                      icon={stat.icon}
                      label={stat.label}
                      value={stat.value}
                      supporting={stat.supporting}
                    />
                  ))}
                </div>

                <div className="grid gap-4 2xl:grid-cols-2">
                  <DetailCard
                    title="Personal Information"
                    icon={User}
                    rows={personalDetails}
                  />
                  <DetailCard
                    title="Professional Information"
                    icon={BriefcaseBusiness}
                    rows={professionalDetails}
                  />
                </div>

                <div className="grid gap-4 2xl:grid-cols-[minmax(0,1.45fr)_minmax(0,0.95fr)]">
                  <Card className="rounded-[24px] border border-slate-200 bg-white shadow-sm">
                    <CardHeader className="flex-row items-center justify-between space-y-0 border-b border-slate-100 pb-4">
                      <CardTitle className="text-lg font-semibold text-slate-900">
                        Orders
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-slate-500 hover:text-slate-900"
                        onClick={() => navigate("/orders")}
                      >
                        View All
                      </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Order ID</TableHead>
                              <TableHead>Value (USD)</TableHead>
                              <TableHead>Placed On</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Device</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {orderRows.map((order) => (
                              <TableRow key={order.id}>
                                <TableCell className="font-medium text-slate-900">
                                  {order.orderNumber}
                                </TableCell>
                                <TableCell>{formatMoney(order.totalAmount)}</TableCell>
                                <TableCell>{formatDate(order.orderDate)}</TableCell>
                                <TableCell>
                                  <Badge
                                    className={cn(
                                      "border",
                                      getStatusClasses(order.status),
                                    )}
                                  >
                                    {order.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <order.DeviceIcon className="h-4 w-4 text-blue-600" />
                                    <span className="text-sm text-slate-700">
                                      {order.device.name}
                                    </span>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                            {orderRows.length === 0 && (
                              <TableRow>
                                <TableCell
                                  colSpan={5}
                                  className="py-8 text-center text-slate-500"
                                >
                                  No orders available.
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                      <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 text-sm text-slate-500">
                        <span>
                          Showing 1 to {Math.min(orderRows.length, 5)} of{" "}
                          {displayOrders.length} orders
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-lg border-slate-200"
                            disabled
                          >
                            <ArrowLeft className="h-4 w-4" />
                          </Button>
                          <div className="flex h-8 min-w-8 items-center justify-center rounded-lg bg-blue-600 px-2 text-sm font-medium text-white">
                            1
                          </div>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-lg border-slate-200"
                            disabled
                          >
                            <ChevronRight className="h-4 w-4" />
=======
  return (
    <>
      <div>
        <Header title={client.name} />
        <div className="p-6 space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/clients/${client.id}`)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <p className="text-xs text-muted-foreground">
                  Clients / {client.name} / Users / {profileUser.name}
                </p>
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-semibold">{profileUser.name}</h1>
                  <Badge className="rounded-full bg-emerald-100 text-emerald-700">
                    {profileUser.status === "active"
                      ? "Active"
                      : profileUser.status}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button className="gap-2" onClick={() => setShowMail(true)}>
                <Mail className="h-4 w-4" /> Send Email
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => window.open(`tel:${userPhone}`)}
              >
                <Phone className="h-4 w-4" /> Call
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="h-auto w-full justify-start rounded-xl border border-gray-100 bg-white p-1">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="orders">Orders</TabsTrigger>
                <TabsTrigger value="expenses">Expenses</TabsTrigger>
                <TabsTrigger value="devices">Devices</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-4">
                <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
                  <Card className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
                    <div className="h-24 bg-gradient-to-br from-slate-800 via-blue-700 to-sky-500" />
                    <CardContent className="-mt-12 space-y-4 p-5 pt-0">
                      <div className="mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-[6px] border-white bg-gradient-to-br from-blue-100 via-sky-50 to-slate-200 text-4xl font-semibold text-primary shadow-[0_24px_60px_rgba(37,99,235,0.18)]">
                        {profileUser.avatar ? (
                          <img
                            src={profileUser.avatar}
                            alt={profileUser.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          getInitials(profileUser.name)
                        )}
                      </div>

                      <div className="space-y-1 text-center">
                        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                          {profileUser.name}
                        </h2>
                        <p className="text-sm text-slate-500">
                          {profileUser.jobTitle ||
                            client.jobTitle ||
                            "Employee"}
                        </p>
                        <Badge className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                          {humanizedRole}
                        </Badge>
                      </div>

                      <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-sm text-slate-700">
                        {[
                          {
                            icon: Mail,
                            label: "Email",
                            value: profileUser.email,
                          },
                          { icon: Phone, label: "Phone Number", value: userPhone },
                          {
                            icon: Calendar,
                            label: "Date of Birth",
                            value: "Not provided",
                          },
                          {
                            icon: Building2,
                            label: "Company Name",
                            value: client.companyName || client.name,
                          },
                          {
                            icon: MapPin,
                            label: "Location",
                            value: locationLabel,
                          },
                          {
                            icon: Clock3,
                            label: "Time Zone",
                            value: "IST (UTC+5:30)",
                          },
                        ].map((item) => (
                          <div
                            key={item.label}
                            className="flex items-center gap-3"
                          >
                            <item.icon className="h-4 w-4 text-primary flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs text-slate-500">
                                {item.label}
                              </p>
                              <p className="truncate font-medium text-slate-900">
                                {item.value}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          className="gap-2"
                          onClick={() => setShowMail(true)}
                        >
                          <Mail className="h-4 w-4" /> Send Email
                        </Button>
                        <Button
                          variant="outline"
                          className="gap-2"
                          onClick={() => window.open(`tel:${userPhone}`)}
                        >
                          <Phone className="h-4 w-4" /> Call
                        </Button>
                      </div>

                      <div className="space-y-3 rounded-2xl border border-slate-100 bg-white p-4 text-sm shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-medium text-slate-500">
                            Last Login
                          </p>
                          <Badge className="rounded-full bg-emerald-50 text-emerald-700">
                            Active
                          </Badge>
                        </div>
                        <p className="font-semibold text-slate-900">
                          {profileUser.createdAt}
                        </p>
                        <p className="text-slate-500">
                          Logged in from {locationLabel}
                        </p>
                        <p className="text-slate-500">
                          Time Zone: IST (UTC+5:30)
                        </p>
                        <div className="flex flex-col gap-2 pt-1">
                          <Button
                            variant="outline"
                            className="h-9 w-full justify-between rounded-xl border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                            onClick={() => setProfileEditOpen(true)}
                          >
                            <span>{humanizedRole}</span>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            className="h-9 w-full justify-between rounded-xl border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                            onClick={() => {
                              const manager = client?.contactPerson || "System Owner";
                              toast({ title: `Manager: ${manager}`, description: "Reporting structure" });
                            }}
                          >
                            <span>Manager</span>
                            <Badge className="rounded-full bg-blue-100 text-blue-700 text-xs">
                              {client?.contactPerson || "System Owner"}
                            </Badge>
>>>>>>> 67d1e15f2fd66c27748766bdee559c6aee16d96e
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="space-y-4">
<<<<<<< HEAD
                    <Card className="rounded-[24px] border border-slate-200 bg-white shadow-sm">
                      <CardHeader className="flex-row items-center justify-between space-y-0 border-b border-slate-100 pb-4">
                        <CardTitle className="text-lg font-semibold text-slate-900">
                          Expenses
                        </CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-500 hover:text-slate-900"
                          onClick={() => navigate("/expenses")}
                        >
                          View All
                        </Button>
                      </CardHeader>
                      <CardContent className="space-y-5 p-5">
                        <div className="flex items-end justify-between">
                          <div>
                            <p className="text-sm text-slate-500">Top - 5 Months</p>
                            <p className="mt-1 text-2xl font-semibold text-slate-900">
                              {formatMoney(totalExpenses)}
                            </p>
                          </div>
                          <div className="text-right text-sm text-slate-500">
                            <p>Open Orders: {openOrderCount}</p>
                            <p>Avg Order: {formatMoney(avgOrderValue)}</p>
                          </div>
                        </div>

                        <div className="flex h-52 items-end gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-5">
                          {monthlyExpenseTrend.map((entry) => {
                            const height = Math.max(
                              18,
                              Math.round((entry.amount / maxExpenseAmount) * 100),
                            );

                            return (
                              <div
                                key={entry.key}
                                className="flex flex-1 flex-col items-center gap-3"
                              >
                                <p className="text-[11px] text-slate-400">
                                  {Math.round(entry.amount / 1000)}k
                                </p>
                                <div className="flex h-32 w-full items-end justify-center">
                                  <div
                                    className="w-10 rounded-t-2xl bg-gradient-to-t from-blue-600 to-blue-400 shadow-[0_12px_28px_rgba(37,99,235,0.22)]"
                                    style={{ height: `${height}%` }}
                                  />
                                </div>
                                <p className="text-sm font-medium text-slate-600">
                                  {entry.month}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="rounded-[24px] border border-slate-200 bg-white shadow-sm">
                      <CardHeader className="flex-row items-center justify-between space-y-0 border-b border-slate-100 pb-4">
                        <CardTitle className="text-lg font-semibold text-slate-900">
                          Assigned Device
                        </CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-500 hover:text-slate-900"
                          onClick={() => setAssignDialogOpen(true)}
                        >
                          View Details
                        </Button>
                      </CardHeader>
                      <CardContent className="space-y-4 p-5">
                        <div className="flex gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm">
                            <img
                              src={getProductImage({ category: "IT Hardware" })}
                              alt={activeDevice.name}
                              className="h-full w-full object-contain p-2"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-base font-semibold text-slate-900">
                                  {activeDevice.name}
                                </p>
                                <p className="mt-1 text-sm text-slate-500">
                                  16-inch
                                </p>
                                <p className="text-sm text-slate-500">
                                  Apple M2 Pro, 16GB RAM, 1TB SSD
                                </p>
                              </div>
                              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                                <ActiveDeviceIcon className="h-5 w-5" />
                              </div>
                            </div>

                            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                              <span className="text-slate-500">
                                Expires: {activeDevice.expiresOn || "-"}
                              </span>
                              <Badge
                                className={cn(
                                  "border",
                                  getStatusClasses(
                                    activeDevice.status === "assigned"
                                      ? "assigned"
                                      : activeDevice.status,
                                  ),
                                )}
                              >
                                {activeDevice.status === "assigned"
                                  ? "Assigned"
                                  : activeDevice.status}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
                          <span className="text-slate-500">
                            Serial #: {activeDevice.serialNumber}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 text-slate-600 hover:text-slate-900"
                            onClick={() => setAssignDialogOpen(true)}
                          >
                            View Details
                            <ChevronRight className="ml-1 h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
=======
                    <div className="grid gap-4 md:grid-cols-2">
                      <Card className="rounded-[24px] border border-gray-100 shadow-sm">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                Total Orders
                              </p>
                              <p className="mt-2 text-4xl font-semibold">
                                {displayOrders.length}
                              </p>
                              <p className="text-sm text-muted-foreground mt-1">
                                Year-to-Date
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-slate-500 hover:text-slate-900"
                              onClick={() => setActiveTab("orders")}
                            >
                              View All
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="rounded-[24px] border border-gray-100 shadow-sm">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                Expenses
                              </p>
                              <p className="mt-2 text-4xl font-semibold">
                                ${totalExpenses.toLocaleString()}
                              </p>
                              <p className="text-sm text-muted-foreground mt-1">
                                Year-to-Date
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-slate-500 hover:text-slate-900"
                              onClick={() => setActiveTab("expenses")}
                            >
                              View All
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,0.9fr)]">
                      <Card className="rounded-[24px] border border-gray-100 shadow-sm">
                        <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
                          <CardTitle className="text-base">Orders</CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-500 hover:text-slate-900"
                            onClick={() => setActiveTab("orders")}
                          >
                            View All
                          </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Order ID</TableHead>
                                <TableHead>Value (USD)</TableHead>
                                <TableHead>Placed On</TableHead>
                                <TableHead>Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {displayOrders.slice(0, 4).map((order) => (
                                <TableRow key={order.id}>
                                  <TableCell className="font-medium text-slate-900">
                                    {order.orderNumber}
                                  </TableCell>
                                  <TableCell>
                                    ${order.totalAmount.toLocaleString()}
                                  </TableCell>
                                  <TableCell>{order.orderDate}</TableCell>
                                  <TableCell>
                                    <Badge
                                      className={
                                        order.status.toLowerCase() ===
                                        "delivered"
                                          ? "rounded-full bg-emerald-100 text-emerald-700"
                                          : "rounded-full bg-indigo-100 text-indigo-700"
                                      }
                                    >
                                      {order.status}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                              {displayOrders.length === 0 && (
                                <TableRow>
                                  <TableCell
                                    colSpan={4}
                                    className="py-8 text-center text-muted-foreground"
                                  >
                                    No orders available
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>

                      <Card className="rounded-[24px] border border-gray-100 shadow-sm">
                        <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
                          <CardTitle className="text-base">Expenses</CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-500 hover:text-slate-900"
                            onClick={() => setActiveTab("expenses")}
                          >
                            View All
                          </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex h-40 items-end gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-5">
                            {monthlyExpenseTrend.map((entry) => {
                              const maxAmount = Math.max(
                                ...monthlyExpenseTrend.map(
                                  (item) => item.amount,
                                ),
                                1,
                              );
                              const height = Math.max(
                                20,
                                Math.round((entry.amount / maxAmount) * 100),
                              );

                              return (
                                <div
                                  key={entry.month}
                                  className="flex flex-1 flex-col items-center gap-2"
                                >
                                  <div className="flex h-28 w-full items-end justify-center">
                                    <div
                                      className="w-8 rounded-t-xl bg-gradient-to-t from-blue-500 to-blue-300 shadow-sm"
                                      style={{ height: `${height}%` }}
                                    />
                                  </div>
                                  <p className="text-[11px] text-slate-500">
                                    {entry.month.slice(5)}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="rounded-xl border border-slate-100 bg-white p-3">
                              <p className="text-xs text-slate-500">
                                Open Orders
                              </p>
                              <p className="mt-1 font-semibold text-slate-900">
                                {openOrderCount}
                              </p>
                            </div>
                            <div className="rounded-xl border border-slate-100 bg-white p-3">
                              <p className="text-xs text-slate-500">
                                Avg Order
                              </p>
                              <p className="mt-1 font-semibold text-slate-900">
                                $
                                {Math.round(
                                  totalOrderValue /
                                    Math.max(displayOrders.length, 1),
                                ).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <Card className="rounded-[24px] border border-gray-100 shadow-sm">
                        <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
                          <CardTitle>Assigned Device</CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-500 hover:text-slate-900"
                            onClick={() => setActiveTab("devices")}
                          >
                            View Details
                          </Button>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {assignedDevices[0] ? (
                            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                              <div className="flex items-start gap-4">
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                                  <Laptop className="h-8 w-8" />
                                </div>
                                <div className="min-w-0 flex-1 space-y-1">
                                  <p className="font-semibold text-slate-900">
                                    {assignedDevices[0].name}
                                  </p>
                                  <p className="text-sm text-slate-500">
                                    {assignedDevices[0].serialNumber}
                                  </p>
                                  <p className="text-sm text-slate-500">
                                    Expires:{" "}
                                    {assignedDevices[0].expiresOn || "-"}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-4 flex items-center justify-between">
                                <Badge className="rounded-full bg-indigo-100 text-indigo-700">
                                  Assigned
                                </Badge>
                                <p className="text-xs text-muted-foreground">
                                  {assignedDevices[0].assignedDate || "-"}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-500">
                              No devices assigned.
                            </div>
                          )}

                          <Button
                            className="w-full"
                            variant="outline"
                            onClick={() => setAssignDialogOpen(true)}
                          >
                            Assign Device
                          </Button>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="grid gap-4 xl:grid-cols-2">
                      <Card className="rounded-[24px] border border-slate-100 shadow-sm">
                        <CardHeader className="border-b border-slate-100 pb-4">
                          <CardTitle className="flex items-center gap-3 text-2xl">
                            <User className="h-6 w-6 text-primary" />
                            Personal Information
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                          {personalDetails.map((entry) => (
                            <div
                              key={entry.label}
                              className="grid grid-cols-[24px_1fr_auto] items-center gap-4 border-b border-slate-100 px-6 py-4 last:border-b-0"
                            >
                              <entry.icon className="h-5 w-5 text-primary" />
                              <p className="text-slate-500">{entry.label}</p>
                              <p className="font-medium text-slate-900">
                                {entry.value}
                              </p>
                            </div>
                          ))}
                        </CardContent>
                      </Card>

                      <Card className="rounded-[24px] border border-slate-100 shadow-sm">
                        <CardHeader className="border-b border-slate-100 pb-4">
                          <CardTitle className="flex items-center gap-3 text-2xl">
                            <BriefcaseBusiness className="h-6 w-6 text-primary" />
                            Professional Information
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                          {professionalDetails.map((entry) => (
                            <div
                              key={entry.label}
                              className="grid grid-cols-[24px_1fr_auto] items-center gap-4 border-b border-slate-100 px-6 py-4 last:border-b-0"
                            >
                              <entry.icon className="h-5 w-5 text-primary" />
                              <p className="text-slate-500">{entry.label}</p>
                              <p className="font-medium text-slate-900">
                                {entry.value}
                              </p>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <Button
                        className="h-14 rounded-2xl text-base font-semibold"
                        onClick={() => setProfileEditOpen(true)}
                      >
                        <Pencil className="h-5 w-5" /> Edit User
                      </Button>
                      <Button
                        variant="outline"
                        className="h-14 rounded-2xl border-rose-200 bg-rose-50 text-base font-semibold text-rose-600 hover:bg-rose-100 hover:text-rose-700"
                        onClick={handleToggleStatus}
                      >
                        <UserX className="h-5 w-5" />
                        {profileUser.status === "active"
                          ? "Deactivate User"
                          : "Reactivate User"}
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="orders" className="mt-4">
                <Card className="rounded-2xl border border-gray-100 shadow-sm">
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order ID</TableHead>
                          <TableHead>Value (USD)</TableHead>
                          <TableHead>Placed On</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {displayOrders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell>{order.orderNumber}</TableCell>
                            <TableCell>
                              ${order.totalAmount.toLocaleString()}
                            </TableCell>
                            <TableCell>{order.orderDate}</TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  order.status.toLowerCase() === "delivered"
                                    ? "rounded-full bg-emerald-100 text-emerald-700"
                                    : "rounded-full bg-amber-100 text-amber-700"
                                }
                              >
                                {order.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                        {displayOrders.length === 0 && (
                          <TableRow>
                            <TableCell
                              colSpan={4}
                              className="py-8 text-center text-muted-foreground"
                            >
                              No orders available
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="expenses" className="space-y-4 mt-4">
                <Card className="rounded-2xl border border-gray-100 shadow-sm">
                  <CardHeader>
                    <CardTitle>Expense Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="rounded-xl border border-gray-100 p-4">
                        <p className="text-xs text-muted-foreground">
                          Total Expenses
                        </p>
                        <p className="text-2xl font-semibold">
                          ${totalExpenses.toLocaleString()}
                        </p>
                      </div>
                      <div className="rounded-xl border border-gray-100 p-4">
                        <p className="text-xs text-muted-foreground">
                          Open Orders
                        </p>
                        <p className="text-2xl font-semibold">
                          {openOrderCount}
                        </p>
                      </div>
                      <div className="rounded-xl border border-gray-100 p-4">
                        <p className="text-xs text-muted-foreground">
                          Avg. Order Value
                        </p>
                        <p className="text-2xl font-semibold">
                          $
                          {Math.round(
                            totalOrderValue / Math.max(displayOrders.length, 1),
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border border-gray-100 shadow-sm">
                  <CardHeader>
                    <CardTitle>Monthly Expense Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {monthlyExpenseTrend.map((entry) => (
                        <div
                          key={entry.month}
                          className="rounded-xl border border-gray-100 p-3"
                        >
                          <p className="text-xs text-muted-foreground">
                            {entry.month}
                          </p>
                          <p className="text-lg font-semibold">
                            ${entry.amount.toLocaleString()}
                          </p>
                        </div>
                      ))}
                      {monthlyExpenseTrend.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                          No expenses recorded.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="devices" className="space-y-4 mt-4">
                <div className="flex items-center justify-end">
                  <Button
                    className="gap-2"
                    onClick={() => setAssignDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4" /> Assign Device
                  </Button>
                </div>

                <Card className="rounded-2xl border border-gray-100 shadow-sm">
                  <CardHeader>
                    <CardTitle>Assigned Devices</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {assignedDevices.map((device) => (
                      <div
                        key={device.id}
                        className="flex items-center justify-between rounded-xl border border-gray-100 p-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                            <Laptop className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-semibold">{device.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Serial: {device.serialNumber}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className="rounded-full bg-indigo-100 text-indigo-700">
                            Assigned
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {device.assignedDate || "-"}
                          </p>
                        </div>
                      </div>
                    ))}
                    {assignedDevices.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No devices assigned.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="activity" className="mt-4">
                <Card className="rounded-2xl border border-gray-100 shadow-sm">
                  <CardHeader>
                    <CardTitle>Activity Timeline</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {displayOrders.slice(0, 6).map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between rounded-xl border border-gray-100 p-3"
                      >
                        <div>
                          <p className="font-medium text-sm">
                            Order {order.orderNumber} updated
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {order.orderDate}
                          </p>
                        </div>
                        <Badge variant="outline">{order.status}</Badge>
                      </div>
                    ))}
                    {displayOrders.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No timeline activity available.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
>>>>>>> 67d1e15f2fd66c27748766bdee559c6aee16d96e
          </div>
        </div>
      </div>

      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Device by Serial Number</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="relative">
<<<<<<< HEAD
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
=======
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
>>>>>>> 67d1e15f2fd66c27748766bdee559c6aee16d96e
              <Input
                value={serialSearch}
                onChange={(event) => setSerialSearch(event.target.value)}
                placeholder="Enter serial number (e.g. MBP-AT-0001)"
                className="pl-9"
              />
            </div>

            {matchingDevice ? (
              <div className="rounded-xl border border-gray-100 p-3">
                <p className="font-semibold">{matchingDevice.name}</p>
                <p className="text-xs text-muted-foreground">
                  Serial: {matchingDevice.serialNumber}
                </p>
<<<<<<< HEAD
                <p className="mt-1 text-xs text-muted-foreground">
=======
                <p className="text-xs text-muted-foreground mt-1">
>>>>>>> 67d1e15f2fd66c27748766bdee559c6aee16d96e
                  Status: {matchingDevice.status}
                </p>
                {matchingDevice.assignedTo &&
                  matchingDevice.assignedTo !== profileUser.id && (
<<<<<<< HEAD
                    <p className="mt-1 text-xs text-red-600">
=======
                    <p className="text-xs text-red-600 mt-1">
>>>>>>> 67d1e15f2fd66c27748766bdee559c6aee16d96e
                      Already assigned to another user
                    </p>
                  )}
              </div>
            ) : serialSearch.trim() ? (
              <p className="text-xs text-muted-foreground">
                No device found with this serial number.
              </p>
            ) : null}
          </div>

          <DialogFooter>
<<<<<<< HEAD
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
=======
            <Button
              variant="outline"
              onClick={() => setAssignDialogOpen(false)}
            >
>>>>>>> 67d1e15f2fd66c27748766bdee559c6aee16d96e
              Cancel
            </Button>
            <Button onClick={handleAssignDevice}>Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={profileEditOpen} onOpenChange={setProfileEditOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit User Profile</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Full Name</label>
              <Input
                value={profileDraft.name}
                onChange={(event) =>
                  setProfileDraft((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }))
                }
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                value={profileDraft.email}
                onChange={(event) =>
                  setProfileDraft((prev) => ({
                    ...prev,
                    email: event.target.value,
                  }))
                }
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Phone</label>
              <Input
                value={profileDraft.phone}
                onChange={(event) =>
                  setProfileDraft((prev) => ({
                    ...prev,
                    phone: event.target.value,
                  }))
                }
              />
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Job Title</label>
                <Input
                  value={profileDraft.jobTitle}
                  onChange={(event) =>
                    setProfileDraft((prev) => ({
                      ...prev,
                      jobTitle: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Department</label>
                <Input
                  value={profileDraft.department}
                  onChange={(event) =>
                    setProfileDraft((prev) => ({
                      ...prev,
                      department: event.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProfileEditOpen(false)}>
              Cancel
            </Button>
<<<<<<< HEAD
            <Button onClick={() => void handleSaveProfile()}>Save Changes</Button>
=======
            <Button onClick={handleSaveProfile}>Save Changes</Button>
>>>>>>> 67d1e15f2fd66c27748766bdee559c6aee16d96e
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <QuickMailComposer
<<<<<<< HEAD
        key={`${profileUser.id}-${showMail ? "open" : "closed"}`}
=======
>>>>>>> 67d1e15f2fd66c27748766bdee559c6aee16d96e
        open={showMail}
        onClose={() => setShowMail(false)}
        recipientType="client"
        defaultTo={profileUser.email}
      />
    </>
  );
}
