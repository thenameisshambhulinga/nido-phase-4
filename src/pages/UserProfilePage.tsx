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
  Calendar,
  Laptop,
  Mail,
  Phone,
  Plus,
  Search,
  User,
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
  const { users } = useAuth();
  const { clients, orders } = useData();

  const [activeTab, setActiveTab] = useState("overview");
  const [showMail, setShowMail] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [serialSearch, setSerialSearch] = useState("");
  const [devicePool, setDevicePool] = useState<DeviceRecord[]>(() =>
    parseDevices(localStorage.getItem(DEVICE_STORAGE_KEY)),
  );

  useEffect(() => {
    localStorage.setItem(DEVICE_STORAGE_KEY, JSON.stringify(devicePool));
  }, [devicePool]);

  const client = clients.find((entry) => entry.id === clientId);
  const profileUser = users.find((entry) => entry.id === userId);

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

  const userPhone = client.contactNumber || client.phone || "-";

  return (
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card className="lg:col-span-4 rounded-2xl border border-gray-100 shadow-sm overflow-hidden bg-white">
            <div className="h-24 bg-gradient-to-br from-blue-600 to-blue-400" />
            <CardContent className="pt-0 -mt-10 space-y-4">
              <div className="mx-auto h-20 w-20 rounded-full border-4 border-white bg-blue-100 text-blue-700 shadow-sm flex items-center justify-center text-2xl font-semibold overflow-hidden">
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

              <div className="text-center space-y-1">
                <h2 className="text-3xl font-semibold leading-tight">
                  {profileUser.name}
                </h2>
                <p className="text-muted-foreground">
                  {profileUser.jobTitle || "Manager"}
                </p>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span className="break-all">{profileUser.email}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{userPhone}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {profileUser.status === "active"
                      ? "Active - Today"
                      : profileUser.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>{client.name}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
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
            </CardContent>
          </Card>

          <div className="lg:col-span-8 space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="h-auto w-full justify-start rounded-xl border border-gray-100 bg-white p-1">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="orders">Orders</TabsTrigger>
                <TabsTrigger value="expenses">Expenses</TabsTrigger>
                <TabsTrigger value="devices">Devices</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="rounded-2xl border border-gray-100 shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Total Orders
                          </p>
                          <p className="text-4xl font-semibold">
                            {displayOrders.length}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Year-to-Date
                          </p>
                        </div>
                        <div className="h-12 w-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                          <User className="h-6 w-6" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border border-gray-100 shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Expenses
                          </p>
                          <p className="text-4xl font-semibold">
                            ${totalExpenses.toLocaleString()}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Year-to-Date
                          </p>
                        </div>
                        <div className="h-12 w-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                          <Wallet className="h-6 w-6" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="rounded-2xl border border-gray-100 shadow-sm">
                  <CardHeader>
                    <CardTitle>Recent User Activity</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {displayOrders.slice(0, 4).map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between rounded-xl border border-gray-100 p-3"
                      >
                        <div>
                          <p className="font-medium text-sm">
                            {order.orderNumber}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {order.orderDate}
                          </p>
                        </div>
                        <Badge
                          className={
                            order.status.toLowerCase() === "delivered"
                              ? "rounded-full bg-emerald-100 text-emerald-700"
                              : "rounded-full bg-indigo-100 text-indigo-700"
                          }
                        >
                          {order.status}
                        </Badge>
                      </div>
                    ))}
                    {displayOrders.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No activity available.
                      </p>
                    )}
                  </CardContent>
                </Card>
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
        <DialogContent className="rounded-2xl">
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

      <QuickMailComposer
        open={showMail}
        onClose={() => setShowMail(false)}
        recipientType="client"
        defaultTo={profileUser.email}
      />
    </div>
  );
}
