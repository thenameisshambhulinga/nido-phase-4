import { useMemo, useState, type ChangeEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import { useData } from "@/contexts/DataContext";
import { useAuth, type UserRole } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Download,
  Mail,
  MapPin,
  Phone,
  Plus,
  Star,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import QuickMailComposer from "@/components/shared/QuickMailComposer";

const FEEDBACK: Record<
  string,
  { id: string; text: string; date: string; ref: string }[]
> = {
  cl1: [
    {
      id: "f1",
      text: "Excellent delivery speed on the last batch of iPhones. Very satisfied with the packaging quality.",
      date: "2026-02-15",
      ref: "#2498563",
    },
    {
      id: "f2",
      text: "Minor delay on laptop order but communication was good throughout.",
      date: "2026-01-20",
      ref: "#2498564",
    },
    {
      id: "f3",
      text: "Product quality is consistently high. Would appreciate volume discounts for larger orders.",
      date: "2025-12-10",
      ref: "#2498560",
    },
  ],
};

const SERVICE_TYPES = [
  "Installation",
  "Preventive Maintenance",
  "Breakdown",
  "Repair",
  "AMC Visit",
] as const;

const ROLE_PERMISSION_MODULES = [
  "Dashboard",
  "Orders",
  "Users",
  "Catalog",
  "Configuration",
  "Reports",
];

type PermissionAction = "view" | "create" | "edit" | "delete";

function defaultRolePermissions() {
  return ROLE_PERMISSION_MODULES.reduce<
    Record<string, Record<PermissionAction, boolean>>
  >((acc, module) => {
    acc[module] = { view: true, create: false, edit: false, delete: false };
    return acc;
  }, {});
}

export default function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    clients,
    orders,
    updateOrder,
    roles,
    addRole,
    updateRole,
    deleteRole,
  } = useData();
  const { users, createUser, updateUser, deleteUser } = useAuth();

  const [activeTab, setActiveTab] = useState("overview");
  const [showMail, setShowMail] = useState(false);

  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState("");
  const [bulkComment, setBulkComment] = useState("");

  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [roleForm, setRoleForm] = useState({
    name: "",
    description: "",
    status: "active" as "active" | "inactive",
    permissions: defaultRolePermissions(),
  });

  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    role: "employee" as UserRole,
    jobTitle: "",
    department: "",
    status: "active" as "active" | "inactive" | "suspended",
  });

  const client = clients.find((c) => c.id === id);

  const clientOrders = useMemo(
    () => (client ? orders.filter((o) => o.organization === client.name) : []),
    [client, orders],
  );

  const clientUsers = useMemo(
    () => (client ? users.filter((u) => u.organization === client.name) : []),
    [client, users],
  );

  const catalogItems = useMemo(() => {
    return clientOrders.flatMap((order) =>
      order.items.map((item) => ({
        id: `${order.id}-${item.id}`,
        productCode: item.sku,
        itemName: item.name,
        description: item.description,
        quantity: item.quantity,
      })),
    );
  }, [clientOrders]);

  const serviceHistory = useMemo(() => {
    return clientOrders.flatMap((order) =>
      order.items.map((item, index) => ({
        serviceId: `${order.orderNumber}-${index + 1}`,
        ticketNumber: `TCK-${order.orderNumber}-${index + 1}`,
        serviceType: SERVICE_TYPES[index % SERVICE_TYPES.length],
        assignedUser:
          order.assignedUser || order.assignedAnalyst || "Unassigned",
        status: order.status,
        itemName: item.name,
      })),
    );
  }, [clientOrders]);

  if (!client) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Client not found.</p>
        <Button onClick={() => navigate("/clients")} className="mt-4">
          Back to Clients
        </Button>
      </div>
    );
  }

  const initials = client.contactPerson
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const daysRemaining = Math.max(
    0,
    Math.ceil(
      (new Date(client.contractEnd).getTime() - Date.now()) /
        (1000 * 60 * 60 * 24),
    ),
  );

  const contractProgress =
    client.contractStart && client.contractEnd
      ? Math.min(
          100,
          Math.round(
            ((Date.now() - new Date(client.contractStart).getTime()) /
              (new Date(client.contractEnd).getTime() -
                new Date(client.contractStart).getTime())) *
              100,
          ),
        )
      : 0;

  const totalSpend = clientOrders.reduce(
    (sum, order) => sum + order.totalAmount,
    0,
  );

  const feedbackList = FEEDBACK[client.id] || [];

  const toggleOrder = (orderId: string) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId)
        ? prev.filter((idValue) => idValue !== orderId)
        : [...prev, orderId],
    );
  };

  const applyBulkUpdate = () => {
    if (!bulkAction) {
      toast({ title: "Choose a bulk action" });
      return;
    }
    if (selectedOrders.length === 0) {
      toast({ title: "Select at least one order" });
      return;
    }

    selectedOrders.forEach((orderId) => {
      const target = clientOrders.find((o) => o.id === orderId);
      if (!target) return;

      if (bulkAction === "completed") {
        updateOrder(orderId, { status: "Completed" });
        return;
      }
      if (bulkAction === "cancelled") {
        updateOrder(orderId, { status: "Cancelled" });
        return;
      }
      if (bulkAction === "comments") {
        updateOrder(orderId, {
          comments: [
            ...target.comments,
            {
              id: `comment-${Date.now()}-${orderId}`,
              user: "System",
              text: bulkComment || "Bulk comment updated",
              timestamp: new Date().toISOString(),
              type: "internal",
            },
          ],
        });
      }
    });

    toast({ title: "Bulk order update applied" });
    setSelectedOrders([]);
    setBulkAction("");
    setBulkComment("");
  };

  const downloadOrderTemplate = () => {
    const csv = [
      ["order_number", "status", "comments"],
      ["2498563", "Processing", "Sample update"],
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "client-order-template.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const onOrderTemplateUpload = (evt: ChangeEvent<HTMLInputElement>) => {
    const file = evt.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast({ title: "Only CSV files are allowed" });
      return;
    }
    toast({ title: `Template ${file.name} uploaded` });
  };

  const openRoleDialog = (roleId?: string) => {
    if (!roleId) {
      setEditingRoleId(null);
      setRoleForm({
        name: "",
        description: "",
        status: "active",
        permissions: defaultRolePermissions(),
      });
      setRoleDialogOpen(true);
      return;
    }

    const role = roles.find((item) => item.id === roleId);
    if (!role) return;

    const mappedPermissions = defaultRolePermissions();
    Object.keys(mappedPermissions).forEach((module) => {
      mappedPermissions[module].view = !!role.permissions[module]?.view;
      mappedPermissions[module].create = !!role.permissions[module]?.create;
      mappedPermissions[module].edit = !!role.permissions[module]?.edit;
      mappedPermissions[module].delete = !!role.permissions[module]?.delete;
    });

    setEditingRoleId(role.id);
    setRoleForm({
      name: role.name,
      description: role.description,
      status: role.status,
      permissions: mappedPermissions,
    });
    setRoleDialogOpen(true);
  };

  const saveRole = () => {
    if (!roleForm.name.trim()) {
      toast({ title: "Role name is required" });
      return;
    }

    const payload = {
      name: roleForm.name,
      description: roleForm.description,
      status: roleForm.status,
      users: roles.find((r) => r.id === editingRoleId)?.users || 0,
      modules: ROLE_PERMISSION_MODULES.filter(
        (module) => roleForm.permissions[module].view,
      ),
      permissions: roleForm.permissions,
    };

    if (editingRoleId) {
      updateRole(editingRoleId, payload);
      toast({ title: "Role updated" });
    } else {
      addRole(payload);
      toast({ title: "Role created" });
    }

    setRoleDialogOpen(false);
  };

  const toggleRolePermission = (module: string, key: PermissionAction) => {
    setRoleForm((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [module]: {
          ...prev.permissions[module],
          [key]: !prev.permissions[module][key],
        },
      },
    }));
  };

  const openUserDialog = (userId?: string) => {
    if (!userId) {
      setEditingUserId(null);
      setUserForm({
        name: "",
        email: "",
        role: "employee",
        jobTitle: "",
        department: "",
        status: "active",
      });
      setUserDialogOpen(true);
      return;
    }

    const selectedUser = users.find((u) => u.id === userId);
    if (!selectedUser) return;

    setEditingUserId(selectedUser.id);
    setUserForm({
      name: selectedUser.name,
      email: selectedUser.email,
      role: selectedUser.role,
      jobTitle: selectedUser.jobTitle || "",
      department: selectedUser.department || "",
      status: selectedUser.status,
    });
    setUserDialogOpen(true);
  };

  const saveUser = () => {
    if (!userForm.name.trim() || !userForm.email.trim()) {
      toast({ title: "Name and email are required" });
      return;
    }

    const payload = {
      name: userForm.name,
      email: userForm.email,
      role: userForm.role,
      organization: client.name,
      jobTitle: userForm.jobTitle,
      department: userForm.department,
      status: userForm.status,
      modules: ["dashboard"],
    };

    if (editingUserId) {
      updateUser(editingUserId, payload);
      toast({ title: "Client user updated" });
    } else {
      createUser(payload);
      toast({ title: `Welcome email sent to ${userForm.email}` });
    }

    setUserDialogOpen(false);
  };

  const exportCatalog = () => {
    const rows = [
      ["Product Code", "Item Name", "Description", "Quantity"],
      ...catalogItems.map((item) => [
        item.productCode,
        item.itemName,
        item.description,
        String(item.quantity),
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${client.name.replace(/\s+/g, "-").toLowerCase()}-catalog.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <Header title={client.name} />
      <div className="p-6 space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/clients")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <p className="text-xs text-muted-foreground">
                Clients / {client.name}
              </p>
              <h1 className="text-2xl font-display font-bold">
                {client.contactPerson}
              </h1>
            </div>
            <Badge
              className={
                client.status === "active"
                  ? "bg-success text-success-foreground"
                  : "bg-muted text-muted-foreground"
              }
            >
              {client.status}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" /> Export Services
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setShowMail(true)}
            >
              <Mail className="h-4 w-4" /> Quick Mail
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => window.open(`tel:${client.phone}`)}
            >
              <Phone className="h-4 w-4" /> Call
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card className="lg:col-span-1 overflow-hidden">
            <div className="h-20 bg-gradient-to-br from-primary to-primary/70" />
            <CardContent className="pt-0 -mt-10 text-center space-y-4">
              <div className="mx-auto h-20 w-20 rounded-full bg-card border-4 border-card flex items-center justify-center text-2xl font-bold text-primary shadow-lg">
                {initials}
              </div>
              <div>
                <h3 className="font-semibold text-lg">
                  {client.contactPerson}
                </h3>
                <p className="text-xs text-muted-foreground">Representative</p>
              </div>
              <div className="space-y-2.5 text-sm text-left">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="h-4 w-4 shrink-0" />
                  <span className="font-medium text-foreground">
                    {client.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span className="text-xs break-all">{client.email}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4 shrink-0" />
                  <span className="text-xs">{client.phone}</span>
                </div>
                <div className="flex items-start gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                  <span className="text-xs">{client.address}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4 shrink-0" />
                  <span className="text-xs">
                    {client.contractStart} - {client.contractEnd}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Button
                  size="sm"
                  className="gap-1 w-full"
                  onClick={() => setShowMail(true)}
                >
                  <Mail className="h-3.5 w-3.5" /> Email
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 w-full"
                  onClick={() => window.open(`tel:${client.phone}`)}
                >
                  <Phone className="h-3.5 w-3.5" /> Call
                </Button>
              </div>
              <div className="pt-2 border-t space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">
                    Contract Progress
                  </span>
                  <span className="font-medium">{daysRemaining} days left</span>
                </div>
                <Progress value={contractProgress} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    Total Orders:{" "}
                    <strong className="text-foreground">
                      {client.totalOrders}
                    </strong>
                  </span>
                  <span>
                    Spend:{" "}
                    <strong className="text-foreground">
                      ${totalSpend.toLocaleString()}
                    </strong>
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="flex flex-wrap h-auto">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="roles">Add/Manage Roles</TabsTrigger>
                <TabsTrigger value="users">Add/Manage Users</TabsTrigger>
                <TabsTrigger value="orders">Order Details</TabsTrigger>
                <TabsTrigger value="service">Service History</TabsTrigger>
                <TabsTrigger value="catalog">Catalog Items</TabsTrigger>
                <TabsTrigger value="config">Configuration</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-xs text-muted-foreground">
                        Total Orders
                      </p>
                      <p className="text-3xl font-bold">
                        {clientOrders.length}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-xs text-muted-foreground">
                        Total Spend
                      </p>
                      <p className="text-3xl font-bold">
                        ${totalSpend.toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-xs text-muted-foreground">
                        Avg Rating
                      </p>
                      <p className="text-3xl font-bold">4.3</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-xs text-muted-foreground">
                        Contract Products
                      </p>
                      <p className="text-3xl font-bold">
                        {catalogItems.length}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Recent Feedback</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {feedbackList.map((feedback) => (
                      <div key={feedback.id} className="rounded-md border p-3">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                          <div className="flex items-center gap-1 text-amber-500">
                            <Star className="h-3 w-3 fill-current" />
                            <Star className="h-3 w-3 fill-current" />
                            <Star className="h-3 w-3 fill-current" />
                            <Star className="h-3 w-3 fill-current" />
                            <Star className="h-3 w-3 fill-current" />
                          </div>
                          <span>
                            {feedback.date} - {feedback.ref}
                          </span>
                        </div>
                        <p className="text-sm">{feedback.text}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="roles" className="space-y-3 mt-4">
                <div className="flex justify-end">
                  <Button className="gap-2" onClick={() => openRoleDialog()}>
                    <Plus className="h-4 w-4" /> Add Role
                  </Button>
                </div>
                <Card>
                  <CardContent className="pt-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {roles.map((role) => (
                          <TableRow key={role.id}>
                            <TableCell>{role.name}</TableCell>
                            <TableCell>{role.description}</TableCell>
                            <TableCell>{role.status}</TableCell>
                            <TableCell className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openRoleDialog(role.id)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  deleteRole(role.id);
                                  toast({ title: "Role deleted" });
                                }}
                              >
                                Delete
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="users" className="space-y-3 mt-4">
                <div className="flex justify-end">
                  <Button className="gap-2" onClick={() => openUserDialog()}>
                    <Plus className="h-4 w-4" /> Add User
                  </Button>
                </div>
                <Card>
                  <CardContent className="pt-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Organization</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Job Title</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {clientUsers.map((clientUser) => (
                          <TableRow key={clientUser.id}>
                            <TableCell>{clientUser.name}</TableCell>
                            <TableCell>{clientUser.email}</TableCell>
                            <TableCell>{client.name}</TableCell>
                            <TableCell>{clientUser.role}</TableCell>
                            <TableCell>{clientUser.jobTitle || "-"}</TableCell>
                            <TableCell>
                              {clientUser.department || "-"}
                            </TableCell>
                            <TableCell>{clientUser.status}</TableCell>
                            <TableCell className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openUserDialog(clientUser.id)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  deleteUser(clientUser.id);
                                  toast({ title: "User deleted" });
                                }}
                              >
                                Delete
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="orders" className="space-y-3 mt-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Select value={bulkAction} onValueChange={setBulkAction}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Bulk Update" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="completed">Mark Completed</SelectItem>
                      <SelectItem value="cancelled">Cancel Orders</SelectItem>
                      <SelectItem value="comments">Update Comments</SelectItem>
                    </SelectContent>
                  </Select>

                  {bulkAction === "comments" && (
                    <Input
                      className="w-72"
                      placeholder="Comment for selected orders"
                      value={bulkComment}
                      onChange={(e) => setBulkComment(e.target.value)}
                    />
                  )}

                  <Button onClick={applyBulkUpdate}>Apply</Button>

                  <label>
                    <input
                      className="hidden"
                      type="file"
                      accept=".csv"
                      onChange={onOrderTemplateUpload}
                    />
                    <Button variant="outline" asChild>
                      <span>Upload Template</span>
                    </Button>
                  </label>
                  <Button variant="outline" onClick={downloadOrderTemplate}>
                    Download Template
                  </Button>
                </div>

                <Card>
                  <CardContent className="pt-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10"></TableHead>
                          <TableHead>Order</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Assigned User</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {clientOrders.map((order) => (
                          <TableRow
                            key={order.id}
                            className="cursor-pointer"
                            onClick={() => navigate(`/orders/${order.id}`)}
                          >
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={selectedOrders.includes(order.id)}
                                onCheckedChange={() => toggleOrder(order.id)}
                              />
                            </TableCell>
                            <TableCell>{order.orderNumber}</TableCell>
                            <TableCell>{order.status}</TableCell>
                            <TableCell>
                              {order.assignedUser ||
                                order.assignedAnalyst ||
                                "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="service" className="space-y-3 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Service History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Service ID / Ticket Number</TableHead>
                          <TableHead>Service Type</TableHead>
                          <TableHead>Item</TableHead>
                          <TableHead>Assigned User</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {serviceHistory.map((row) => (
                          <TableRow key={row.ticketNumber}>
                            <TableCell>
                              {row.serviceId} / {row.ticketNumber}
                            </TableCell>
                            <TableCell>{row.serviceType}</TableCell>
                            <TableCell>{row.itemName}</TableCell>
                            <TableCell>{row.assignedUser}</TableCell>
                            <TableCell>{row.status}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="catalog" className="space-y-3 mt-4">
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={exportCatalog}
                  >
                    <Download className="h-4 w-4" /> Export
                  </Button>
                </div>
                <Card>
                  <CardHeader>
                    <CardTitle>Catalog Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product Code</TableHead>
                          <TableHead>Item Name</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Quantity</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {catalogItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.productCode}</TableCell>
                            <TableCell>{item.itemName}</TableCell>
                            <TableCell>{item.description}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="config" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Pricing & Discount</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline">Add Pricing Rule</Button>
                      <Button variant="outline">Add Discount Rule</Button>
                      <Button variant="outline">Create Coupon</Button>
                      <Button variant="outline">Coupon Code Rule</Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Tax Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label>Tax Type</Label>
                      <Input placeholder="GST / VAT" defaultValue="GST" />
                    </div>
                    <div className="space-y-1">
                      <Label>Tax Rate (%)</Label>
                      <Input placeholder="18" defaultValue="18" />
                    </div>
                    <div className="space-y-1">
                      <Label>Tax Registration No</Label>
                      <Input
                        placeholder="Enter registration no"
                        defaultValue={client.gst || ""}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRoleId ? "Edit Role" : "Add Role"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Role name"
                value={roleForm.name}
                onChange={(e) =>
                  setRoleForm((prev) => ({ ...prev, name: e.target.value }))
                }
              />
              <Select
                value={roleForm.status}
                onValueChange={(value: "active" | "inactive") =>
                  setRoleForm((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Textarea
              placeholder="Role description"
              value={roleForm.description}
              onChange={(e) =>
                setRoleForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
            />

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Module</TableHead>
                  <TableHead className="text-center">View</TableHead>
                  <TableHead className="text-center">Create</TableHead>
                  <TableHead className="text-center">Edit</TableHead>
                  <TableHead className="text-center">Delete</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ROLE_PERMISSION_MODULES.map((module) => (
                  <TableRow key={module}>
                    <TableCell>{module}</TableCell>
                    {(
                      ["view", "create", "edit", "delete"] as PermissionAction[]
                    ).map((action) => (
                      <TableCell key={action} className="text-center">
                        <Checkbox
                          checked={roleForm.permissions[module][action]}
                          onCheckedChange={() =>
                            toggleRolePermission(module, action)
                          }
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setRoleDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={saveRole}>Save Role</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingUserId ? "Edit User" : "Add User"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Name"
              value={userForm.name}
              onChange={(e) =>
                setUserForm((prev) => ({ ...prev, name: e.target.value }))
              }
            />
            <Input
              type="email"
              placeholder="Email"
              value={userForm.email}
              onChange={(e) =>
                setUserForm((prev) => ({ ...prev, email: e.target.value }))
              }
            />
            <Input value={client.name} disabled />
            <Input
              placeholder="Job Title"
              value={userForm.jobTitle}
              onChange={(e) =>
                setUserForm((prev) => ({ ...prev, jobTitle: e.target.value }))
              }
            />
            <Input
              placeholder="Department"
              value={userForm.department}
              onChange={(e) =>
                setUserForm((prev) => ({ ...prev, department: e.target.value }))
              }
            />
            <Select
              value={userForm.status}
              onValueChange={(value: "active" | "inactive" | "suspended") =>
                setUserForm((prev) => ({ ...prev, status: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setUserDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={saveUser}>Save User</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <QuickMailComposer
        open={showMail}
        onClose={() => setShowMail(false)}
        recipientType="client"
        defaultTo={client.email}
      />
    </div>
  );
}
