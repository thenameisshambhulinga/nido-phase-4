import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  Calendar,
  IdCard,
  Laptop,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  User,
  UserCircle2,
  UserX,
  Wallet,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
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
    name: "Apple MacBook Pro 14",
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
    name: "Dell Latitude 7440",
    serialNumber: "DLL-GC-0003",
    status: "available",
    expiresOn: "2028-03-20",
  },
  {
    id: "dev-4",
    name: "Samsung Galaxy S24",
    serialNumber: "SAM-EP-0004",
    status: "maintenance",
    expiresOn: "2027-11-10",
  },
];

const DEVICE_STORAGE_KEY = "nido_devices_inventory";

function parseDevices(raw: string | null): DeviceRecord[] {
  if (!raw) return DEFAULT_DEVICES;
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

export default function UserProfilePage() {
  const { id: clientId, userId } = useParams();
  const navigate = useNavigate();
  const { users, updateUser } = useAuth();
  const { clients, orders } = useData();

  const [activeTab, setActiveTab] = useState("overview");
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
    return orders.filter((order) => {
      const matchesClient = order.organization === client.name;
      const matchesUser =
        order.requestingUser === profileUser.name ||
        order.assignedUser === profileUser.name ||
        order.assignedUser === profileUser.id;
      return matchesClient && matchesUser;
    });
  }, [client, orders, profileUser]);

  const displayOrders = useMemo(() => {
    if (!client) return [];
    if (userOrders.length > 0) return userOrders;

    // Fallback for org users with no explicit assignment so profile never looks empty.
    return orders
      .filter((order) => order.organization === client.name)
      .slice(0, 8);
  }, [client, orders, userOrders]);

  const totalOrderValue = displayOrders.reduce(
    (sum, order) => sum + order.totalAmount,
    0,
  );
  const totalExpenses = Math.round(totalOrderValue * 0.24);

  const assignedDevices = useMemo(() => {
    if (!profileUser) return [];
    return devicePool.filter((device) => device.assignedTo === profileUser.id);
  }, [devicePool, profileUser]);

  const matchingDevice = useMemo(() => {
    const normalized = serialSearch.trim().toLowerCase();
    if (!normalized) return null;
    return (
      devicePool.find(
        (device) => device.serialNumber.trim().toLowerCase() === normalized,
      ) || null
    );
  }, [devicePool, serialSearch]);

  const monthlyExpenseTrend = useMemo(() => {
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

  const humanizedRole = (profileUser?.role || "employee")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
  const profileStatusLabel =
    profileUser?.status === "active"
      ? "Active"
      : profileUser?.status === "inactive"
        ? "Inactive"
        : "Suspended";
  const employeeId =
    client?.contactEmployeeId ||
    `EMP-${
      String(profileUser?.id || "")
        .replace(/[^a-zA-Z0-9]/g, "")
        .slice(-5)
        .toUpperCase() || "1001"
    }`;
  const locationLabel = client?.locationDetails
    ? [
        client.locationDetails.city,
        client.locationDetails.state,
        client.locationDetails.country,
      ]
        .filter(Boolean)
        .join(", ")
    : client?.address || "Location not provided";
  const userPhone = client?.contactNumber || client?.phone || "-";
  const profileMeta = [
    {
      icon: IdCard,
      label: "User ID",
      value: employeeId,
    },
    {
      icon: ShieldCheck,
      label: "Status",
      value: profileStatusLabel,
    },
    {
      icon: UserCircle2,
      label: "Role",
      value: humanizedRole,
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
      label: "Job Title",
      value: profileUser?.jobTitle || client?.jobTitle || "Employee",
    },
    {
      icon: Building2,
      label: "Department",
      value: profileUser?.department || client?.industryType || "Operations",
    },
    {
      icon: UserCircle2,
      label: "Reporting Manager",
      value: client?.contactPerson || "System Owner",
    },
    {
      icon: Calendar,
      label: "Joining Date",
      value: profileUser?.createdAt || "-",
    },
    {
      icon: ShieldCheck,
      label: "Role",
      value: humanizedRole,
    },
  ];

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
      toast({
        title: "Device not found",
        description: "Enter a valid serial number.",
      });
      return;
    }

    if (
      matchingDevice.assignedTo &&
      matchingDevice.assignedTo !== profileUser.id
    ) {
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

  const handleSaveProfile = () => {
    if (!profileUser) return;
    updateUser(profileUser.id, {
      name: profileDraft.name.trim() || profileUser.name,
      email: profileDraft.email.trim() || profileUser.email,
      jobTitle: profileDraft.jobTitle.trim(),
      department: profileDraft.department.trim(),
    });
    toast({
      title: "User updated",
      description: "Profile information was updated successfully.",
    });
    setProfileEditOpen(false);
  };

  const handleToggleStatus = () => {
    if (!profileUser) return;
    const nextStatus = profileUser.status === "active" ? "inactive" : "active";
    updateUser(profileUser.id, { status: nextStatus });
    toast({
      title: nextStatus === "active" ? "User reactivated" : "User deactivated",
      description: `${profileUser.name} is now ${nextStatus}.`,
    });
  };

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
                          { icon: Phone, label: "Phone", value: userPhone },
                          {
                            icon: ShieldCheck,
                            label: "Status",
                            value: profileStatusLabel,
                          },
                          {
                            icon: Building2,
                            label: "Organization",
                            value: client.name,
                          },
                        ].map((item) => (
                          <div
                            key={item.label}
                            className="flex items-center gap-3"
                          >
                            <item.icon className="h-4 w-4 text-primary" />
                            <div className="min-w-0">
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
                        <Button
                          variant="outline"
                          className="h-9 w-full justify-between rounded-xl border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                          onClick={() => setProfileEditOpen(true)}
                        >
                          <span>{humanizedRole}</span>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="space-y-4">
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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                <p className="text-xs text-muted-foreground mt-1">
                  Status: {matchingDevice.status}
                </p>
                {matchingDevice.assignedTo &&
                  matchingDevice.assignedTo !== profileUser.id && (
                    <p className="text-xs text-red-600 mt-1">
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
            <Button
              variant="outline"
              onClick={() => setAssignDialogOpen(false)}
            >
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
            <Button onClick={handleSaveProfile}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <QuickMailComposer
        open={showMail}
        onClose={() => setShowMail(false)}
        recipientType="client"
        defaultTo={profileUser.email}
      />
    </>
  );
}
