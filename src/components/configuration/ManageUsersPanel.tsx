import React, { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  MoreVertical,
  Download,
  Mail,
} from "lucide-react";
import type { AppUser } from "@/types";
import ConfirmationDialog from "@/components/shared/ConfirmationDialog";

const defaultUsers: AppUser[] = [
  {
    id: "u1",
    employeeId: "EMP-0001",
    username: "systemowner",
    email: "owner@nidotech.com",
    fullName: "System Owner",
    phone: "+91-9876543210",
    jobTitle: "CEO",
    department: "Management",
    roleId: "ur-1",
    organizationAccess: ["Nido Tech Pvt. Ltd."],
    userType: "Internal User",
    status: "Active",
    createdAt: "2024-01-15",
  },
  {
    id: "u2",
    employeeId: "EMP-0002",
    username: "markadams",
    email: "admin@nidotech.com",
    fullName: "Mark Adams",
    phone: "+91-9876543211",
    jobTitle: "System Admin",
    department: "IT",
    roleId: "ur-1",
    organizationAccess: ["Nido Tech Pvt. Ltd."],
    userType: "Internal User",
    status: "Active",
    createdAt: "2024-02-20",
  },
  {
    id: "u3",
    employeeId: "EMP-0003",
    username: "janesmith",
    email: "procurement@nidotech.com",
    fullName: "Jane Smith",
    phone: "+91-9876543212",
    jobTitle: "Procurement Manager",
    department: "Procurement",
    roleId: "ur-2",
    organizationAccess: ["Nido Tech Pvt. Ltd."],
    userType: "Internal User",
    status: "Active",
    createdAt: "2024-03-10",
  },
  {
    id: "u4",
    employeeId: "EMP-0004",
    username: "davidchen",
    email: "ap@nidotech.com",
    fullName: "David Chen",
    phone: "+91-9876543213",
    jobTitle: "Accounts Payable",
    department: "Finance",
    roleId: "ur-3",
    organizationAccess: ["Nido Tech Pvt. Ltd."],
    userType: "Internal User",
    status: "Active",
    createdAt: "2024-04-05",
  },
];

export default function ManageUsersPanel() {
  const { userRoles, organizations } = useData();
  const [users, setUsers] = useState<AppUser[]>(() => {
    try {
      const stored = localStorage.getItem("appUsers");
      return stored ? JSON.parse(stored) : defaultUsers;
    } catch {
      return defaultUsers;
    }
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [search, setSearch] = useState("");
  const [inviteLookup, setInviteLookup] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRoleId, setInviteRoleId] = useState("");
  const [orgAccessInput, setOrgAccessInput] = useState("");
  const [inviteEmployeeId, setInviteEmployeeId] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<AppUser | null>(null);
  const [form, setForm] = useState({
    employeeId: "",
    fullName: "",
    email: "",
    phone: "",
    jobTitle: "",
    organizationAccess: [] as string[],
    roleId: "",
    status: "Active" as "Active" | "Inactive" | "Suspended",
  });

  const saveUsers = (next: AppUser[]) => {
    setUsers(next);
    localStorage.setItem("appUsers", JSON.stringify(next));
  };

  const filtered = users.filter(
    (u) =>
      !search ||
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  const getRoleName = (roleId: string) =>
    userRoles.find((r) => r.id === roleId)?.name || roleId;

  const normalizeOrgAccess = (orgAccess: AppUser["organizationAccess"]) =>
    Array.isArray(orgAccess) ? orgAccess : orgAccess ? [orgAccess] : [];

  const availableOrganizations = Array.from(
    new Set([
      ...organizations.map((org) => org.name).filter(Boolean),
      ...users.flatMap((u) => normalizeOrgAccess(u.organizationAccess)),
      ...form.organizationAccess,
    ]),
  );

  const toEmployeeId = (index: number, current?: string) =>
    current || `EMP-${String(index + 1).padStart(4, "0")}`;

  const openCreate = () => {
    setEditingId(null);
    setForm({
      employeeId: `EMP-${String(users.length + 1).padStart(4, "0")}`,
      fullName: "",
      email: "",
      phone: "",
      jobTitle: "",
      organizationAccess: organizations.length ? [organizations[0].name] : [],
      roleId: "",
      status: "Active",
    });
    setOrgAccessInput("");
    setDialogOpen(true);
  };

  const openEdit = (id: string) => {
    const u = users.find((u) => u.id === id);
    if (!u) return;
    setEditingId(id);
    setForm({
      employeeId: u.employeeId || "",
      fullName: u.fullName,
      email: u.email,
      phone: u.phone,
      jobTitle: u.jobTitle,
      organizationAccess: normalizeOrgAccess(u.organizationAccess),
      roleId: u.roleId,
      status: u.status,
    });
    setOrgAccessInput("");
    setDialogOpen(true);
  };

  const addOrganizationAccess = (value: string) => {
    const nextOrg = value.trim();
    if (!nextOrg) return;
    setForm((prev) => {
      if (prev.organizationAccess.includes(nextOrg)) return prev;
      return {
        ...prev,
        organizationAccess: [...prev.organizationAccess, nextOrg],
      };
    });
    setOrgAccessInput("");
  };

  const handleSave = () => {
    if (
      !form.fullName.trim() ||
      !form.email.trim() ||
      !form.employeeId.trim() ||
      form.organizationAccess.length === 0
    ) {
      toast({
        title: "Error",
        description:
          "Employee ID, full name, email and at least one organization are required",
        variant: "destructive",
      });
      return;
    }
    if (editingId) {
      const next = users.map((u) =>
        u.id === editingId
          ? {
              ...u,
              ...form,
              employeeId: form.employeeId,
              username: form.email.split("@")[0],
              department: u.department,
            }
          : u,
      );
      saveUsers(next);
      toast({
        title: "Updated",
        description: `User "${form.fullName}" updated`,
      });
    } else {
      const newUser: AppUser = {
        id: crypto.randomUUID(),
        employeeId: form.employeeId,
        username: form.email.split("@")[0],
        email: form.email,
        fullName: form.fullName,
        phone: form.phone,
        jobTitle: form.jobTitle,
        department: "",
        roleId: form.roleId,
        organizationAccess: form.organizationAccess,
        userType: "Internal User",
        status: form.status,
        createdAt: new Date().toISOString().split("T")[0],
      };
      saveUsers([...users, newUser]);
      toast({
        title: "User Created",
        description: `Welcome email sent to ${form.email} with login credentials.`,
      });
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    saveUsers(users.filter((u) => u.id !== id));
    toast({ title: "Deleted", description: "User removed" });
  };

  const openDetails = (user: AppUser) => {
    setSelectedUser(user);
    setDetailsOpen(true);
  };

  const exportUsersCsv = () => {
    const header = [
      "Employee ID",
      "Name",
      "Email",
      "Role",
      "Job Title",
      "User Type",
      "Status",
      "Organization Access",
    ];
    const rows = users.map((user, idx) => [
      toEmployeeId(idx, user.employeeId),
      user.fullName,
      user.email,
      getRoleName(user.roleId),
      user.jobTitle,
      user.userType,
      user.status,
      normalizeOrgAccess(user.organizationAccess).join(" | "),
    ]);

    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nido-users.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const onInviteLookupChange = (value: string) => {
    setInviteLookup(value);
    const matched = users.find(
      (u) =>
        u.fullName.toLowerCase() === value.toLowerCase() ||
        u.email.toLowerCase() === value.toLowerCase(),
    );
    if (!matched) return;
    setInviteEmail(matched.email);
    setInviteRoleId(matched.roleId);
    setInviteEmployeeId(matched.employeeId || "");
  };

  const sendInvitation = () => {
    if (!inviteEmail.trim()) {
      toast({
        title: "Error",
        description: "Email is required",
        variant: "destructive",
      });
      return;
    }

    const missing: string[] = [];
    if (!inviteEmployeeId.trim()) missing.push("Employee ID");
    if (!inviteRoleId) missing.push("Role");

    if (missing.length) {
      toast({
        title: "Missing details",
        description: `Please complete: ${missing.join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    const key = "nido_user_invite_log";
    const log = JSON.parse(localStorage.getItem(key) || "{}");
    const lastSentAt = log[inviteEmail] ? new Date(log[inviteEmail]) : null;
    const now = new Date();

    if (
      lastSentAt &&
      now.getTime() - lastSentAt.getTime() < 24 * 60 * 60 * 1000
    ) {
      toast({
        title: "Invitation blocked",
        description:
          "An invitation was already sent in the last 24 hours. Please try later.",
        variant: "destructive",
      });
      return;
    }

    log[inviteEmail] = now.toISOString();
    localStorage.setItem(key, JSON.stringify(log));
    toast({
      title: "Invitation sent",
      description: `Invitation sent to ${inviteEmail}`,
    });
    setInviteOpen(false);
    setInviteLookup("");
    setInviteEmail("");
    setInviteRoleId("");
    setInviteEmployeeId("");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-success text-success-foreground";
      case "Inactive":
        return "bg-warning text-warning-foreground";
      case "Suspended":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Add and manage internal users and client/vendor users.
        </p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" aria-label="User actions">
              <MoreVertical size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={exportUsersCsv}>
              <Download size={14} className="mr-2" /> Export CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={openCreate}>
              <Plus size={14} className="mr-2" /> Add User
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setInviteOpen(true)}>
              <Mail size={14} className="mr-2" /> Send Invitation
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="relative w-64">
        <Search
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          size={14}
        />
        <Input
          className="pl-8 h-8 text-sm"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Job Title</TableHead>
                <TableHead>User Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((user, idx) => (
                <TableRow key={user.id}>
                  <TableCell
                    className="font-medium text-primary cursor-pointer hover:underline"
                    onClick={() => openDetails(user)}
                  >
                    {toEmployeeId(idx, user.employeeId)}
                  </TableCell>
                  <TableCell className="font-medium">{user.fullName}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {user.email}
                  </TableCell>
                  <TableCell className="text-sm">
                    {getRoleName(user.roleId)}
                  </TableCell>
                  <TableCell className="text-sm">{user.jobTitle}</TableCell>
                  <TableCell className="text-sm">{user.userType}</TableCell>
                  <TableCell>
                    <Badge
                      className={`${getStatusColor(user.status)} border-none`}
                    >
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(user.id)}
                    >
                      <Pencil size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteTarget(user)}
                    >
                      <Trash2 size={14} className="text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="text-xs text-muted-foreground mt-3">
            Showing {filtered.length} of {users.length} users
          </p>
        </CardContent>
      </Card>

      {/* Add/Edit User Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit User" : "Add User"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm">User Type</Label>
              <Input value="Internal User" readOnly />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">Employee ID</Label>
                <Input
                  value={form.employeeId}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, employeeId: e.target.value }))
                  }
                  placeholder="EMP-0005"
                />
              </div>
              <div>
                <Label className="text-sm">Full Name</Label>
                <Input
                  value={form.fullName}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, fullName: e.target.value }))
                  }
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label className="text-sm">Email</Label>
                <Input
                  value={form.email}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, email: e.target.value }))
                  }
                  placeholder="john@company.com"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">Phone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, phone: e.target.value }))
                  }
                  placeholder="+1 234 567 8900"
                />
              </div>
              <div>
                <Label className="text-sm">Organization Access</Label>
                <div className="rounded-md border border-input p-3 space-y-2 max-h-28 overflow-y-auto">
                  {availableOrganizations.map((orgName) => {
                    const checked = form.organizationAccess.includes(orgName);
                    return (
                      <div key={orgName} className="flex items-center gap-2">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(v) => {
                            setForm((prev) => ({
                              ...prev,
                              organizationAccess: v
                                ? [...prev.organizationAccess, orgName]
                                : prev.organizationAccess.filter(
                                    (name) => name !== orgName,
                                  ),
                            }));
                          }}
                        />
                        <span className="text-sm">{orgName}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-2 flex gap-2">
                  <Input
                    value={orgAccessInput}
                    placeholder="Add organization name"
                    onChange={(e) => setOrgAccessInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addOrganizationAccess(orgAccessInput);
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addOrganizationAccess(orgAccessInput)}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>
            <div>
              <Label className="text-sm">Job Title</Label>
              <Input
                value={form.jobTitle}
                onChange={(e) =>
                  setForm((p) => ({ ...p, jobTitle: e.target.value }))
                }
                placeholder="e.g., Procurement Manager"
              />
            </div>
            <div>
              <Label className="text-sm">Role</Label>
              <Select
                value={form.roleId}
                onValueChange={(v) => setForm((p) => ({ ...p, roleId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {userRoles.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, status: v as any }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              User will be able to log in with this email (any password accepted
              in demo mode).
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingId ? "Update User" : "Add User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Employee details */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Employee Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Employee ID</Label>
                <Input value={selectedUser.employeeId || ""} readOnly />
              </div>
              <div>
                <Label className="text-xs">Name</Label>
                <Input value={selectedUser.fullName} readOnly />
              </div>
              <div>
                <Label className="text-xs">Email</Label>
                <Input value={selectedUser.email} readOnly />
              </div>
              <div>
                <Label className="text-xs">Phone</Label>
                <Input value={selectedUser.phone} readOnly />
              </div>
              <div>
                <Label className="text-xs">Role</Label>
                <Input value={getRoleName(selectedUser.roleId)} readOnly />
              </div>
              <div>
                <Label className="text-xs">Status</Label>
                <Input value={selectedUser.status} readOnly />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Send invitation */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send User Invitation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm">User Name</Label>
              <Input
                value={inviteLookup}
                onChange={(e) => onInviteLookupChange(e.target.value)}
                placeholder="Type user name or email"
                list="nido-user-list"
              />
              <datalist id="nido-user-list">
                {users.map((u) => (
                  <option key={u.id} value={u.fullName} />
                ))}
              </datalist>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">Email Address *</Label>
                <Input
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <Label className="text-sm">Employee ID *</Label>
                <Input
                  value={inviteEmployeeId}
                  onChange={(e) => setInviteEmployeeId(e.target.value)}
                  placeholder="EMP-0005"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">User Type *</Label>
                <Input value="Internal User" readOnly />
              </div>
              <div>
                <Label className="text-sm">Role Assignment *</Label>
                <Select value={inviteRoleId} onValueChange={setInviteRoleId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {userRoles.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button onClick={sendInvitation}>Send Invitation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={!!deleteTarget}
        title="Delete User"
        description={
          deleteTarget
            ? `Delete ${deleteTarget.fullName}? This action cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        tone="destructive"
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={() => {
          if (!deleteTarget) return;
          handleDelete(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
