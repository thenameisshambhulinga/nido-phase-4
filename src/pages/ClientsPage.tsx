//src/pages/ClientsPage.tsx
import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, User, MoreVertical } from "lucide-react";
import { usePageMeta } from "@/contexts/PageMetaContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import CredentialsModal from "@/components/shared/CredentialsModal";
import { toast } from "@/hooks/use-toast";

export default function ClientsPage() {
  const navigate = useNavigate();
  const { clients, isCoreDataLoading, coreDataError } = useData();
  const { createUser } = useAuth();
  const { setMeta } = usePageMeta();
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();

  // Determine if user is a client role
  const isClientRole = user?.role?.toLowerCase().startsWith("client_");

  // For client roles, only show their own organization
  const displayOrganization = isClientRole ? currentOrganization : null;

  useEffect(() => {
    setMeta({ title: "Clients", breadcrumbs: [{ label: "Clients" }] });
    return () => setMeta({});
  }, [setMeta]);

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [showCreateUserDialog, setShowCreateUserDialog] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [newUserCredentials, setNewUserCredentials] = useState<any>(null);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    phone: "",
    alternatePhone: "",
    jobTitle: "",
    department: "",
    organization: "",
    employeeId: "",
    manager: "",
    timezone: "Asia/Kolkata",
    address: "",
    city: "",
    state: "",
    country: "India",
    postalCode: "",
    dob: "",
    joiningDate: "",
    emergencyContact: "",
    notes: "",
    permissionGroup: "Default",
    systemAccessLevel: "Standard",
    internalRole: "Client User",
    teams: "",
    approvalAuthority: "No",
    reportingStructure: "Client Lead",
    role: "client_user",
  });

  // Calculate stats
  const stats = useMemo(() => {
    const active = clients.filter((c) => c.status === "active").length;
    const inactive = clients.filter((c) => c.status === "inactive").length;
    const pending = 0;
    const premium = Math.max(1, Math.floor(clients.length * 0.2)); // At least 1 premium
    return { premium, active, pending, inactive, total: clients.length };
  }, [clients]);

  // Filter clients
  const filteredClients = useMemo(() => {
    let filtered = clients;

    // FOR CLIENT ROLES: Only show user's own organization, not all clients
    if (isClientRole && displayOrganization) {
      // Match by organization name or ID
      const orgName = displayOrganization.name.toLowerCase();
      filtered = filtered.filter((client) => {
        const clientName = (
          client.name ||
          client.companyName ||
          ""
        ).toLowerCase();
        return (
          clientName === orgName ||
          clientName.includes(orgName) ||
          orgName.includes(clientName)
        );
      });
    }

    // Tab filter
    if (activeTab === "active") {
      filtered = filtered.filter((c) => c.status === "active");
    } else if (activeTab === "inactive") {
      filtered = filtered.filter((c) => c.status === "inactive");
    }

    // Search filter
    const query = search.trim().toLowerCase();
    if (query) {
      filtered = filtered.filter((client) => {
        const company = String(
          client.companyName || client.name || "",
        ).toLowerCase();
        const representative = String(client.contactPerson || "").toLowerCase();
        const email = String(client.email || "").toLowerCase();
        const code = String(
          client.clientId || client.clientCode || "",
        ).toLowerCase();
        return (
          company.includes(query) ||
          representative.includes(query) ||
          email.includes(query) ||
          code.includes(query)
        );
      });
    }

    return filtered;
  }, [clients, search, activeTab, isClientRole, displayOrganization]);

  const handleCreateUser = async () => {
    if (!userForm.name.trim() || !userForm.email.trim()) {
      toast({ title: "Name and email required" });
      return;
    }

    try {
      const result = await createUser({
        name: userForm.name,
        email: userForm.email,
        phone: userForm.phone,
        alternatePhone: userForm.alternatePhone,
        jobTitle: userForm.jobTitle,
        department: userForm.department,
        organization: userForm.organization || "Nido Tech",
        employeeId: userForm.employeeId,
        manager: userForm.manager,
        timezone: userForm.timezone,
        address: userForm.address,
        city: userForm.city,
        state: userForm.state,
        country: userForm.country,
        postalCode: userForm.postalCode,
        dob: userForm.dob,
        joiningDate: userForm.joiningDate,
        emergencyContact: userForm.emergencyContact,
        notes: userForm.notes,
        permissionGroup: userForm.permissionGroup,
        systemAccessLevel: userForm.systemAccessLevel,
        internalRole: userForm.internalRole,
        teams: userForm.teams,
        approvalAuthority: userForm.approvalAuthority,
        reportingStructure: userForm.reportingStructure,
        role: userForm.role as any,
      } as any);

      if (result?.credentials) {
        setNewUserCredentials(result.credentials);
        setShowCredentialsModal(true);
        setShowCreateUserDialog(false);
        setUserForm({
          name: "",
          email: "",
          jobTitle: "",
          department: "",
          organization: "",
          role: "client_user",
        });
        toast({ title: "User created successfully" });
        return;
      }

      toast({ title: "Failed to create user", variant: "destructive" });
    } catch (error) {
      toast({ title: "Failed to create user", variant: "destructive" });
    }
  };

  const getAvatarColor = (index: number) => {
    const colors = [
      "bg-cyan-500",
      "bg-blue-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-orange-500",
      "bg-amber-500",
      "bg-green-500",
      "bg-emerald-500",
      "bg-indigo-500",
      "bg-violet-500",
    ];
    return colors[index % colors.length];
  };

  const toggleClientSelection = (clientId: string) => {
    setSelectedClients((prev) =>
      prev.includes(clientId)
        ? prev.filter((id) => id !== clientId)
        : [...prev, clientId],
    );
  };

  const toggleAllSelection = () => {
    if (selectedClients.length === filteredClients.length) {
      setSelectedClients([]);
    } else {
      setSelectedClients(filteredClients.map((c) => c._id || c.id));
    }
  };

  return (
    <div>
      <div className="p-6 space-y-6 animate-fade-in">
        {isCoreDataLoading && (
          <div className="flex items-center justify-center p-12">
            <div className="text-lg">Loading clients...</div>
          </div>
        )}

        {coreDataError && (
          <div className="p-12 text-center">
            <div className="text-xl font-semibold text-red-600 mb-2">
              Failed to load clients
            </div>
            <pre className="text-sm bg-red-50 p-4 rounded-lg text-red-800 mb-4 whitespace-pre-wrap">
              {coreDataError}
            </pre>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        )}

        {!isCoreDataLoading && !coreDataError && (
          <div className="space-y-6">
            {/* Header with actions */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold">
                  {isClientRole && displayOrganization
                    ? displayOrganization.name
                    : "Clients"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {isClientRole && displayOrganization
                    ? "Your organization details and team members"
                    : "Manage all your client accounts"}
                </p>
              </div>
              {!isClientRole && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => setShowCreateUserDialog(true)}
                  >
                    <User className="h-4 w-4" /> Create User
                  </Button>
                  <Button
                    size="sm"
                    className="gap-2"
                    onClick={() => navigate("/clients/add")}
                  >
                    <Plus className="h-4 w-4" /> Add Client
                  </Button>
                </div>
              )}
            </div>

            {/* Stats cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="p-4">
                <div className="text-sm text-muted-foreground">
                  Premium Clients
                </div>
                <div className="text-3xl font-bold">{stats.premium}</div>
              </Card>
              <Card className="p-4">
                <div className="text-sm text-muted-foreground">
                  Active Clients
                </div>
                <div className="text-3xl font-bold">{stats.active}</div>
              </Card>
              <Card className="p-4">
                <div className="text-sm text-muted-foreground">Pending</div>
                <div className="text-3xl font-bold">{stats.pending}</div>
              </Card>
              <Card className="p-4">
                <div className="text-sm text-muted-foreground">Inactive</div>
                <div className="text-3xl font-bold">{stats.inactive}</div>
              </Card>
            </div>

            {/* Search bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search client name, representative, email..."
                className="pl-10"
              />
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 border-b">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-4 py-2 font-medium text-sm transition-colors ${
                  activeTab === "all"
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveTab("active")}
                className={`px-4 py-2 font-medium text-sm transition-colors ${
                  activeTab === "active"
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setActiveTab("inactive")}
                className={`px-4 py-2 font-medium text-sm transition-colors ${
                  activeTab === "inactive"
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Inactive
              </button>
            </div>

            {/* Table */}
            {filteredClients.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No clients found</p>
              </Card>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted">
                      <TableHead className="w-12">
                        <Checkbox
                          checked={
                            selectedClients.length === filteredClients.length
                          }
                          indeterminate={
                            selectedClients.length > 0 &&
                            selectedClients.length < filteredClients.length
                          }
                          onCheckedChange={toggleAllSelection}
                        />
                      </TableHead>
                      <TableHead>CLIENT ID</TableHead>
                      <TableHead>CLIENT NAME</TableHead>
                      <TableHead>REPRESENTATIVE</TableHead>
                      <TableHead>EMAIL</TableHead>
                      <TableHead>TOTAL SPEND (INR)</TableHead>
                      <TableHead>STATUS</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.map((client, index) => {
                      const displayName =
                        client.companyName || client.name || "Unnamed";
                      const initials = displayName
                        .split(" ")
                        .filter(Boolean)
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase();
                      const repName = client.contactPerson || "-";
                      const repRole = client.jobTitle || "-";
                      const isSelected = selectedClients.includes(
                        client._id || client.id,
                      );

                      return (
                        <TableRow
                          key={client._id || client.id}
                          onClick={() =>
                            navigate(`/clients/${client._id || client.id}`)
                          }
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() =>
                                toggleClientSelection(client._id || client.id)
                              }
                            />
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {client.clientId || client.clientCode || client.id}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-10 w-10 items-center justify-center rounded-full text-white font-semibold ${getAvatarColor(
                                  index,
                                )}`}
                              >
                                {initials || "--"}
                              </div>
                              <span className="font-medium">{displayName}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{repName}</span>
                              <span className="text-xs text-muted-foreground">
                                {repRole}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {client.email || "-"}
                          </TableCell>
                          <TableCell className="text-sm">
                            ₹{client.totalSpend || 0}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                client.status === "active"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {(client.status || "pending")
                                .charAt(0)
                                .toUpperCase() +
                                (client.status || "pending").slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell
                            className="text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() =>
                                    navigate(
                                      `/clients/${client._id || client.id}`,
                                    )
                                  }
                                >
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem>Edit</DropdownMenuItem>
                                <DropdownMenuItem>Send Email</DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600">
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}

        {/* Create User Dialog */}
        <Dialog
          open={showCreateUserDialog}
          onOpenChange={setShowCreateUserDialog}
        >
          <DialogContent className="p-0">
            <div className="flex h-full flex-col">
              <div className="border-b border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-900 px-6 py-5 text-white">
                <DialogHeader className="space-y-1 text-left">
                  <DialogTitle className="text-2xl text-white">
                    Create Client User
                  </DialogTitle>
                  <DialogDescription className="text-white/70">
                    Create an account and show credentials immediately.
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                  <div className="space-y-6">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Identity
                      </h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Name</Label>
                          <Input
                            value={userForm.name}
                            onChange={(e) =>
                              setUserForm((prev) => ({
                                ...prev,
                                name: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Email</Label>
                          <Input
                            value={userForm.email}
                            onChange={(e) =>
                              setUserForm((prev) => ({
                                ...prev,
                                email: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Employee ID</Label>
                          <Input
                            value={userForm.employeeId}
                            onChange={(e) =>
                              setUserForm((prev) => ({
                                ...prev,
                                employeeId: e.target.value,
                              }))
                            }
                            placeholder="EMP-2001"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Phone</Label>
                          <Input
                            value={userForm.phone}
                            onChange={(e) =>
                              setUserForm((prev) => ({
                                ...prev,
                                phone: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label>Alternate Phone</Label>
                          <Input
                            value={userForm.alternatePhone}
                            onChange={(e) =>
                              setUserForm((prev) => ({
                                ...prev,
                                alternatePhone: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Access & Organization
                      </h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Organization</Label>
                          <Input
                            value={userForm.organization}
                            onChange={(e) =>
                              setUserForm((prev) => ({
                                ...prev,
                                organization: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Role</Label>
                          <Select
                            value={userForm.role}
                            onValueChange={(value) =>
                              setUserForm((prev) => ({ ...prev, role: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="client_user">
                                Client User
                              </SelectItem>
                              <SelectItem value="client_admin">
                                Client Admin
                              </SelectItem>
                              <SelectItem value="vendor_user">
                                Vendor User
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Job Title</Label>
                          <Input
                            value={userForm.jobTitle}
                            onChange={(e) =>
                              setUserForm((prev) => ({
                                ...prev,
                                jobTitle: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Department</Label>
                          <Input
                            value={userForm.department}
                            onChange={(e) =>
                              setUserForm((prev) => ({
                                ...prev,
                                department: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Manager</Label>
                          <Input
                            value={userForm.manager}
                            onChange={(e) =>
                              setUserForm((prev) => ({
                                ...prev,
                                manager: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Timezone</Label>
                          <Input
                            value={userForm.timezone}
                            onChange={(e) =>
                              setUserForm((prev) => ({
                                ...prev,
                                timezone: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Location & Governance
                      </h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2 md:col-span-2">
                          <Label>Address</Label>
                          <Input
                            value={userForm.address}
                            onChange={(e) =>
                              setUserForm((prev) => ({
                                ...prev,
                                address: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>City</Label>
                          <Input
                            value={userForm.city}
                            onChange={(e) =>
                              setUserForm((prev) => ({
                                ...prev,
                                city: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>State</Label>
                          <Input
                            value={userForm.state}
                            onChange={(e) =>
                              setUserForm((prev) => ({
                                ...prev,
                                state: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Country</Label>
                          <Input
                            value={userForm.country}
                            onChange={(e) =>
                              setUserForm((prev) => ({
                                ...prev,
                                country: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Postal Code</Label>
                          <Input
                            value={userForm.postalCode}
                            onChange={(e) =>
                              setUserForm((prev) => ({
                                ...prev,
                                postalCode: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Date of Birth</Label>
                          <Input
                            type="date"
                            value={userForm.dob}
                            onChange={(e) =>
                              setUserForm((prev) => ({
                                ...prev,
                                dob: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Joining Date</Label>
                          <Input
                            type="date"
                            value={userForm.joiningDate}
                            onChange={(e) =>
                              setUserForm((prev) => ({
                                ...prev,
                                joiningDate: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Emergency Contact</Label>
                          <Input
                            value={userForm.emergencyContact}
                            onChange={(e) =>
                              setUserForm((prev) => ({
                                ...prev,
                                emergencyContact: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Internal Role</Label>
                          <Input
                            value={userForm.internalRole}
                            onChange={(e) =>
                              setUserForm((prev) => ({
                                ...prev,
                                internalRole: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Teams</Label>
                          <Input
                            value={userForm.teams}
                            onChange={(e) =>
                              setUserForm((prev) => ({
                                ...prev,
                                teams: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Approval Authority</Label>
                          <Input
                            value={userForm.approvalAuthority}
                            onChange={(e) =>
                              setUserForm((prev) => ({
                                ...prev,
                                approvalAuthority: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label>Notes</Label>
                          <textarea
                            value={userForm.notes}
                            onChange={(e) =>
                              setUserForm((prev) => ({
                                ...prev,
                                notes: e.target.value,
                              }))
                            }
                            rows={4}
                            className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            placeholder="Optional notes or onboarding checklist"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
                      <p className="text-[10px] uppercase tracking-[0.24em] text-white/60">
                        Preview
                      </p>
                      <h3 className="mt-2 text-xl font-semibold">
                        {userForm.name || "New Client User"}
                      </h3>
                      <p className="text-sm text-white/70">
                        {userForm.jobTitle || "Role and title summary"}
                      </p>
                      <div className="mt-5 space-y-3 text-sm text-white/80">
                        <div className="rounded-xl bg-white/5 px-4 py-3">
                          <span className="block text-[10px] uppercase tracking-[0.18em] text-white/50">
                            Organization
                          </span>
                          <span>
                            {userForm.organization || "No organization set"}
                          </span>
                        </div>
                        <div className="rounded-xl bg-white/5 px-4 py-3">
                          <span className="block text-[10px] uppercase tracking-[0.18em] text-white/50">
                            Department
                          </span>
                          <span>{userForm.department || "General"}</span>
                        </div>
                        <div className="rounded-xl bg-white/5 px-4 py-3">
                          <span className="block text-[10px] uppercase tracking-[0.18em] text-white/50">
                            Access Role
                          </span>
                          <span>{userForm.role.replace(/_/g, " ")}</span>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Quick Actions
                      </h3>
                      <p className="mt-3 text-sm text-slate-600">
                        Credentials will be generated immediately after saving
                        and can be shared from the credential panel.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 px-6 py-4">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateUserDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCreateUser}>Create</Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Credentials Modal */}
        {showCredentialsModal && newUserCredentials && (
          <CredentialsModal
            credentials={newUserCredentials}
            isOpen={showCredentialsModal}
            onClose={() => {
              setShowCredentialsModal(false);
              setNewUserCredentials(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
