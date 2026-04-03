import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Edit,
  Trash2,
  Search,
  Download,
  Mail,
  Plus,
  FileJson,
} from "lucide-react";
import QuickMailComposer from "@/components/shared/QuickMailComposer";
import { toast } from "@/hooks/use-toast";

const EMPTY_FILTER = "all";

export default function ClientsPage() {
  const { clients, updateClient, deleteClient, addAuditEntry } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(EMPTY_FILTER);
  const [contractTypeFilter, setContractTypeFilter] = useState(EMPTY_FILTER);
  const [businessTypeFilter, setBusinessTypeFilter] = useState(EMPTY_FILTER);

  const [showMailComposer, setShowMailComposer] = useState(false);
  const [mailTo, setMailTo] = useState("");
  const [showEdit, setShowEdit] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

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

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      const searchText = search.toLowerCase();
      const matchSearch =
        c.name.toLowerCase().includes(searchText) ||
        c.contactPerson.toLowerCase().includes(searchText) ||
        c.email.toLowerCase().includes(searchText) ||
        (c.clientCode || "").toLowerCase().includes(searchText) ||
        c.id.toLowerCase().includes(searchText);

      const matchStatus =
        statusFilter === EMPTY_FILTER || c.status === statusFilter;
      const matchContractType =
        contractTypeFilter === EMPTY_FILTER ||
        c.contractType === contractTypeFilter;
      const matchBusinessType =
        businessTypeFilter === EMPTY_FILTER ||
        c.businessType === businessTypeFilter;

      return (
        matchSearch && matchStatus && matchContractType && matchBusinessType
      );
    });
  }, [businessTypeFilter, clients, contractTypeFilter, search, statusFilter]);

  const contractTypes = useMemo(
    () =>
      Array.from(
        new Set(clients.map((c) => c.contractType).filter(Boolean)),
      ) as string[],
    [clients],
  );

  const businessTypes = useMemo(
    () =>
      Array.from(
        new Set(clients.map((c) => c.businessType).filter(Boolean)),
      ) as string[],
    [clients],
  );

  const exportClients = (format: "csv" | "json", scope: "filtered" | "all") => {
    const source = scope === "all" ? clients : filtered;
    const headers = [
      "Client ID",
      "Company Name",
      "Contact Person",
      "Email",
      "Contract Period",
      "Orders",
      "Status",
    ];

    const rows = source.map((c) => [
      c.clientCode || c.id,
      c.name,
      c.contactPerson,
      c.email,
      `${c.contractStart || ""} - ${c.contractEnd || ""}`,
      c.totalOrders,
      c.status,
    ]);

    const blob =
      format === "csv"
        ? new Blob([[headers, ...rows].map((r) => r.join(",")).join("\n")], {
            type: "text/csv",
          })
        : new Blob(
            [
              JSON.stringify(
                source.map((client) => ({
                  id: client.id,
                  clientCode: client.clientCode,
                  name: client.name,
                  contactPerson: client.contactPerson,
                  email: client.email,
                  contractStart: client.contractStart,
                  contractEnd: client.contractEnd,
                  totalOrders: client.totalOrders,
                  status: client.status,
                })),
                null,
                2,
              ),
            ],
            { type: "application/json" },
          );

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clients-${scope}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: `Exported ${source.length} client record(s)`,
      description: `${scope === "all" ? "All" : "Filtered"} list as ${format.toUpperCase()}`,
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
      toast({ title: "Company, contact person, and email are required" });
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
      businessType: form.businessType as
        | "Registered"
        | "Unregistered"
        | "Consumer",
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

  return (
    <div>
      <Header title="Clients" />
      <div className="p-6 space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-display font-bold">Client Management</h1>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" /> Export
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-72 p-2">
                <p className="px-2 pb-2 text-xs font-medium text-muted-foreground">
                  Flexible Export Options
                </p>
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition hover:bg-muted"
                  onClick={() => exportClients("csv", "filtered")}
                >
                  <span>Filtered Clients (CSV)</span>
                  <Download className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
                <button
                  type="button"
                  className="mt-1 flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition hover:bg-muted"
                  onClick={() => exportClients("csv", "all")}
                >
                  <span>All Clients (CSV)</span>
                  <Download className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
                <button
                  type="button"
                  className="mt-1 flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition hover:bg-muted"
                  onClick={() => exportClients("json", "filtered")}
                >
                  <span>Filtered Clients (JSON)</span>
                  <FileJson className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
                <button
                  type="button"
                  className="mt-1 flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition hover:bg-muted"
                  onClick={() => exportClients("json", "all")}
                >
                  <span>All Clients (JSON)</span>
                  <FileJson className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by client ID, company, contact, email"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={EMPTY_FILTER}>All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={contractTypeFilter}
            onValueChange={setContractTypeFilter}
          >
            <SelectTrigger>
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

          <Select
            value={businessTypeFilter}
            onValueChange={setBusinessTypeFilter}
          >
            <SelectTrigger>
              <SelectValue placeholder="Business Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={EMPTY_FILTER}>All Business Types</SelectItem>
              {businessTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client ID</TableHead>
                  <TableHead>Company Name</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Email ID</TableHead>
                  <TableHead>Contract Period</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow
                    key={c.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/clients/${c.id}`)}
                  >
                    <TableCell className="font-mono text-xs">
                      {c.clientCode || c.id}
                    </TableCell>
                    <TableCell className="font-medium text-primary">
                      {c.name}
                    </TableCell>
                    <TableCell>{c.contactPerson}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {c.email}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {c.contractStart || "-"} - {c.contractEnd || "-"}
                    </TableCell>
                    <TableCell>{c.totalOrders}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          c.status === "active"
                            ? "bg-success text-success-foreground"
                            : "bg-muted text-muted-foreground"
                        }
                      >
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div
                        className="flex gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => {
                            setMailTo(c.email);
                            setShowMailComposer(true);
                          }}
                        >
                          <Mail className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleEdit(c.id)}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => {
                            deleteClient(c.id);
                            toast({ title: "Client deleted" });
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No clients found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={showEdit} onOpenChange={setShowEdit}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Client</DialogTitle>
              <DialogDescription>
                Update client profile details.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Company Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Client Code</Label>
                <Input
                  value={form.clientCode}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, clientCode: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Contact Person</Label>
                <Input
                  value={form.contactPerson}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, contactPerson: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, email: e.target.value }))
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label>Contract Start</Label>
                  <Input
                    type="date"
                    value={form.contractStart}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, contractStart: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>Contract End</Label>
                  <Input
                    type="date"
                    value={form.contractEnd}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, contractEnd: e.target.value }))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEdit(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit}>Save Changes</Button>
            </div>
          </DialogContent>
        </Dialog>

        <QuickMailComposer
          open={showMailComposer}
          onClose={() => setShowMailComposer(false)}
          recipientType="client"
          defaultTo={mailTo}
        />
      </div>
    </div>
  );
}
