import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  Pencil,
  Trash2,
  Search,
  Download,
  Mail,
  Plus,
  MoreVertical,
} from "lucide-react";
import QuickMailComposer from "@/components/shared/QuickMailComposer";
import { toast } from "@/hooks/use-toast";
import ConfirmationDialog from "@/components/shared/ConfirmationDialog";

const EMPTY_FILTER = "all";
const STATUS_TABS = ["All", "Active", "Pending", "Inactive"] as const;

const safeNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

// Helper to generate avatar letters from name
const getInitials = (name: string): string => {
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const getCompanyInitials = (name: string): string => {
  const tokens = name.split(" ").filter(Boolean);
  if (tokens.length === 0) return "--";
  if (tokens.length === 1) return tokens[0].slice(0, 2).toUpperCase();
  return `${tokens[0][0] || ""}${tokens[tokens.length - 1][0] || ""}`.toUpperCase();
};

// Helper to get avatar color based on initials - More vibrant colors matching the reference
const getAvatarColor = (name: string): string => {
  const colors = [
    "bg-blue-200 text-blue-900", // Light blue
    "bg-cyan-200 text-cyan-900", // Cyan
    "bg-teal-200 text-teal-900", // Teal
    "bg-purple-200 text-purple-900", // Purple
    "bg-pink-200 text-pink-900", // Pink;
    "bg-orange-200 text-orange-900", // Orange
    "bg-amber-200 text-amber-900", // Amber
    "bg-indigo-200 text-indigo-900", // Indigo
    "bg-green-200 text-green-900", // Green
    "bg-rose-200 text-rose-900", // Rose
    "bg-fuchsia-200 text-fuchsia-900", // Fuchsia
    "bg-sky-200 text-sky-900", // Sky
  ];
  const hash = name.charCodeAt(0) + name.charCodeAt(name.length - 1);
  return colors[hash % colors.length];
};

export default function ClientsPage() {
  const {
    clients,
    orders,
    updateClient,
    deleteClient,
    addAuditEntry,
  } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<(typeof STATUS_TABS)[number]>("All");
  const [contractTypeFilter, setContractTypeFilter] = useState(EMPTY_FILTER);
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);

  const [showMailComposer, setShowMailComposer] = useState(false);
  const [mailTo, setMailTo] = useState("");
  const [showEdit, setShowEdit] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    clientCode: "",
    contactPerson: "",
    email: "",
    contractStart: "",
    contractEnd: "",
    status: "active" as "active" | "inactive",
    contractType: "",
    businessType: "",
  });

  const clientOrderMetrics = useMemo(() => {
    const aliasToClientId = new Map<string, string>();
    const metrics = new Map<
      string,
      { totalOrders: number; totalSpend: number }
    >();

    clients.forEach((client) => {
      metrics.set(client.id, {
        totalOrders: 0,
        totalSpend: 0,
      });

      [
        client.id,
        client.clientId,
        client.clientCode,
        client.email,
        client.companyName,
        client.name,
      ]
        .filter(Boolean)
        .forEach((alias) => {
          aliasToClientId.set(String(alias).trim().toLowerCase(), client.id);
        });
    });

    orders.forEach((order) => {
      const matchedClientId = [
        order.clientId,
        order.organization,
        order.requestingUser,
      ]
        .filter(Boolean)
        .map((alias) => aliasToClientId.get(String(alias).trim().toLowerCase()))
        .find(Boolean);

      if (!matchedClientId) return;

      const current = metrics.get(matchedClientId) || {
        totalOrders: 0,
        totalSpend: 0,
      };

      metrics.set(matchedClientId, {
        totalOrders: current.totalOrders + 1,
        totalSpend: current.totalSpend + safeNumber(order.totalAmount),
      });
    });

    return metrics;
  }, [clients, orders]);

  const getClientTotalOrders = (client: (typeof clients)[number]) => {
    const liveCount = clientOrderMetrics.get(client.id)?.totalOrders ?? 0;
    return liveCount || safeNumber(client.totalOrders);
  };

  const getClientTotalSpend = (client: (typeof clients)[number]) =>
    clientOrderMetrics.get(client.id)?.totalSpend ?? 0;

  // Filter clients
  const filtered = useMemo(() => {
    return clients.filter((c) => {
      const searchText = search.toLowerCase();
      const name = String(c.name ?? "");
      const contactPerson = String(c.contactPerson ?? "");
      const email = String(c.email ?? "");
      const clientCode = String(c.clientCode ?? "");
      const clientId = String(c.clientId ?? "");

      const matchSearch =
        name.toLowerCase().includes(searchText) ||
        contactPerson.toLowerCase().includes(searchText) ||
        email.toLowerCase().includes(searchText) ||
        clientCode.toLowerCase().includes(searchText) ||
        clientId.toLowerCase().includes(searchText);

      const matchStatus =
        statusFilter === "All" ||
        (statusFilter === "Active" && c.status === "active") ||
        (statusFilter === "Pending" &&
          c.status !== "active" &&
          c.status !== "inactive") ||
        (statusFilter === "Inactive" && c.status === "inactive");

      const matchContractType =
        contractTypeFilter === EMPTY_FILTER ||
        c.contractType === contractTypeFilter;

      return matchSearch && matchStatus && matchContractType;
    });
  }, [clients, search, statusFilter, contractTypeFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    const premium = clients.filter((client) => {
      return getClientTotalOrders(client) > 10;
    }).length;
    const active = clients.filter((c) => c.status === "active").length;
    const pending = clients.filter(
      (c) => c.status !== "active" && c.status !== "inactive",
    ).length;
    const inactive = clients.filter((c) => c.status === "inactive").length;

    return { premium, active, pending, inactive, total: clients.length };
  }, [clientOrderMetrics, clients]);

  const contractTypes = useMemo(
    () =>
      Array.from(
        new Set(clients.map((c) => c.contractType).filter(Boolean)),
      ) as string[],
    [clients],
  );

  const handleSelectAll = () => {
    if (selectedClientIds.length === filtered.length) {
      setSelectedClientIds([]);
    } else {
      setSelectedClientIds(filtered.map((c) => c.id));
    }
  };

  const toggleClientSelection = (id: string) => {
    setSelectedClientIds((prev) =>
      prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id],
    );
  };

  const exportClients = (format: "csv" | "json", scope: "filtered" | "all") => {
    const source = scope === "all" ? clients : filtered;
    const headers = [
      "Client ID",
      "Company Name",
      "Contact Person",
      "Email",
      "Status",
      "Total Orders",
      "Total Spend (INR)",
    ];

    const rows = source.map((c) => [
      c.clientId || c.clientCode || c.id,
      c.companyName || c.name,
      c.contactPerson,
      c.email,
      c.status,
      getClientTotalOrders(c),
      getClientTotalSpend(c),
    ]);

    const blob =
      format === "csv"
        ? new Blob([[headers, ...rows].map((r) => r.join(",")).join("\n")], {
            type: "text/csv",
          })
        : new Blob([JSON.stringify(source, null, 2)], {
            type: "application/json",
          });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clients-${scope}-${Date.now()}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: `Exported ${source.length} client(s)`,
    });
  };

  const handleEdit = (id: string) => {
    const client = clients.find((c) => c.id === id);
    if (!client) return;
    setEditId(client.id);
    setForm({
      name: client.name,
      clientCode: client.clientCode || "",
      contactPerson: client.contactPerson,
      email: client.email,
      contractStart: client.contractStart,
      contractEnd: client.contractEnd,
      status: client.status,
      contractType: client.contractType || "",
      businessType: client.businessType || "",
    });
    setShowEdit(true);
  };

  const handleSaveEdit = () => {
    if (!editId) return;
    if (!form.name.trim() || !form.contactPerson.trim() || !form.email.trim()) {
      toast({ title: "Required fields are missing" });
      return;
    }

    updateClient(editId, {
      name: form.name,
      clientCode: form.clientCode,
      contactPerson: form.contactPerson,
      email: form.email,
      contractStart: form.contractStart,
      contractEnd: form.contractEnd,
      status: form.status,
      contractType: form.contractType,
      businessType: form.businessType,
    });

    addAuditEntry({
      user: user?.name || "System",
      action: "Client Updated",
      module: "Clients",
      details: `Updated client: ${form.name}`,
      ipAddress: "192.168.1.1",
      status: "success",
    });

    toast({ title: "Client updated" });
    setShowEdit(false);
    setEditId(null);
  };

  const handleDelete = (id: string) => {
    deleteClient(id);
    toast({ title: "Client deleted" });
    setSelectedClientIds((prev) => prev.filter((cid) => cid !== id));
  };

  const allChecked =
    filtered.length > 0 && selectedClientIds.length === filtered.length;
  const someChecked =
    selectedClientIds.length > 0 && selectedClientIds.length < filtered.length;

  return (
    <div>
      <Header title="Clients" />
      <div className="p-6 space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Clients</h1>
            <p className="text-sm text-muted-foreground">
              Manage all your client accounts
            </p>
          </div>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" /> Export
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-48">
                <div className="space-y-2">
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted rounded"
                    onClick={() => exportClients("csv", "filtered")}
                  >
                    Filtered CSV
                  </button>
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted rounded"
                    onClick={() => exportClients("csv", "all")}
                  >
                    All CSV
                  </button>
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted rounded"
                    onClick={() => exportClients("json", "filtered")}
                  >
                    Filtered JSON
                  </button>
                </div>
              </PopoverContent>
            </Popover>
            <Button
              size="sm"
              className="gap-2"
              onClick={() => navigate("/clients/add")}
            >
              <Plus className="h-4 w-4" /> Add Client
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{stats.premium}</p>
              <p className="text-xs text-muted-foreground">Premium Clients</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{stats.active}</p>
              <p className="text-xs text-muted-foreground">Active Clients</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{stats.pending}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{stats.inactive}</p>
              <p className="text-xs text-muted-foreground">Inactive</p>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filter Tabs */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search client name, representative, email..."
                className="pl-9 h-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select
              value={contractTypeFilter}
              onValueChange={setContractTypeFilter}
            >
              <SelectTrigger className="w-48 h-10">
                <SelectValue placeholder="Contract Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={EMPTY_FILTER}>All Contract Types</SelectItem>
                {contractTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Tabs */}
          <div className="flex gap-2 border-b">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  statusFilter === tab
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <Card className="border-0 shadow-sm rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow className="border-b border-gray-200 hover:bg-gray-50">
                  <TableHead className="w-12 px-4 py-4">
                    <Checkbox
                      checked={allChecked}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="px-4 py-4 text-xs font-semibold text-gray-700">
                    Client ID
                  </TableHead>
                  <TableHead className="px-4 py-4 text-xs font-semibold text-gray-700">
                    Client Name
                  </TableHead>
                  <TableHead className="px-4 py-4 text-xs font-semibold text-gray-700">
                    Representative
                  </TableHead>
                  <TableHead className="px-4 py-4 text-xs font-semibold text-gray-700">
                    Email
                  </TableHead>
                  <TableHead className="px-4 py-4 text-xs font-semibold text-gray-700 text-right">
                    Total Spend (INR)
                  </TableHead>
                  <TableHead className="px-4 py-4 text-xs font-semibold text-gray-700">
                    Status
                  </TableHead>
                  <TableHead className="px-4 py-4"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((client) => (
                  <TableRow
                    key={client.id}
                    className="border-b border-gray-100 hover:bg-gray-50/80 transition-colors cursor-pointer"
                  >
                    <TableCell
                      className="px-4 py-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        checked={selectedClientIds.includes(client.id)}
                        onCheckedChange={() => toggleClientSelection(client.id)}
                      />
                    </TableCell>
                    <TableCell
                      className="px-4 py-4 text-xs font-mono text-gray-600 cursor-pointer"
                      onClick={() => navigate(`/clients/${client.id}`)}
                    >
                      {client.clientId || client.clientCode || client.id}
                    </TableCell>
                    <TableCell
                      className="px-4 py-4 cursor-pointer"
                      onClick={() => navigate(`/clients/${client.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-base flex-shrink-0 shadow-sm ${getAvatarColor(client.name)}`}
                        >
                          {getCompanyInitials(client.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-900 truncate">
                            {client.name}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell
                      className="px-4 py-4 cursor-pointer"
                      onClick={() => navigate(`/clients/${client.id}`)}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-sm ${getAvatarColor(client.contactPerson)}`}
                        >
                          {getInitials(client.contactPerson)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {client.contactPerson}
                          </p>
                          {client.jobTitle && (
                            <p className="text-xs text-gray-500 truncate">
                              {client.jobTitle}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell
                      className="px-4 py-4 text-sm text-gray-600 cursor-pointer"
                      onClick={() => navigate(`/clients/${client.id}`)}
                    >
                      {client.email}
                    </TableCell>
                    <TableCell
                      className="px-4 py-4 text-sm font-semibold text-gray-900 text-right cursor-pointer"
                      onClick={() => navigate(`/clients/${client.id}`)}
                    >
                      ₹
                      {getClientTotalSpend(client).toLocaleString()}
                    </TableCell>
                    <TableCell
                      className="px-4 py-4 cursor-pointer"
                      onClick={() => navigate(`/clients/${client.id}`)}
                    >
                      <div className="inline-flex">
                        <Badge
                          className={`rounded-full text-xs font-semibold px-3 py-1 ${
                            client.status === "active"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {client.status === "active" ? "●" : "●"}{" "}
                          {client.status === "active" ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell
                      className="px-4 py-4 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-40 p-0">
                          <div className="flex flex-col">
                            <button
                              type="button"
                              className="w-full text-left px-4 py-2 text-sm hover:bg-muted flex items-center gap-2"
                              onClick={() => {
                                setMailTo(client.email);
                                setShowMailComposer(true);
                              }}
                            >
                              <Mail className="h-4 w-4" /> Send Email
                            </button>
                            <button
                              type="button"
                              className="w-full text-left px-4 py-2 text-sm hover:bg-muted flex items-center gap-2"
                              onClick={() => handleEdit(client.id)}
                            >
                              <Pencil className="h-4 w-4" /> Edit
                            </button>
                            <button
                              type="button"
                              className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                              onClick={() => setDeleteTargetId(client.id)}
                            >
                              <Trash2 className="h-4 w-4" /> Delete
                            </button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">No clients found</p>
              <p className="text-xs text-muted-foreground mt-1">
                Try adjusting your filters
              </p>
            </div>
          )}

          {filtered.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between text-xs text-muted-foreground">
              <div>
                {selectedClientIds.length > 0 && (
                  <span>{selectedClientIds.length} selected</span>
                )}
              </div>
              <div>
                Showing {filtered.length} client
                {filtered.length === 1 ? "" : "s"}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
            <DialogDescription>Update client profile details</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Company Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientCode">Client Code</Label>
              <Input
                id="clientCode"
                value={form.clientCode}
                onChange={(e) =>
                  setForm((p) => ({ ...p, clientCode: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPerson">Contact Person</Label>
              <Input
                id="contactPerson"
                value={form.contactPerson}
                onChange={(e) =>
                  setForm((p) => ({ ...p, contactPerson: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((p) => ({ ...p, email: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="contractStart">Contract Start</Label>
                <Input
                  id="contractStart"
                  type="date"
                  value={form.contractStart}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, contractStart: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contractEnd">Contract End</Label>
                <Input
                  id="contractEnd"
                  type="date"
                  value={form.contractEnd}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, contractEnd: e.target.value }))
                  }
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowEdit(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mail Composer */}
      <QuickMailComposer
        open={showMailComposer}
        onClose={() => setShowMailComposer(false)}
        recipientType="client"
        defaultTo={mailTo}
      />

      <ConfirmationDialog
        open={!!deleteTargetId}
        title="Delete Client"
        description="Delete this client record? This action cannot be undone."
        confirmLabel="Delete"
        tone="destructive"
        onOpenChange={(open) => {
          if (!open) setDeleteTargetId(null);
        }}
        onConfirm={() => {
          if (!deleteTargetId) return;
          handleDelete(deleteTargetId);
          setDeleteTargetId(null);
        }}
      />
    </div>
  );
}
