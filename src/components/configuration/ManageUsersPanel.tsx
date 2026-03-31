import React, { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import type { AppUser } from "@/types";

const defaultUsers: AppUser[] = [
  {
    id: "u1",
    username: "systemowner",
    email: "owner@nidotech.com",
    fullName: "System Owner",
    phone: "+91-9876543210",
    jobTitle: "CEO",
    department: "Management",
    roleId: "ur-1",
    organizationAccess: "Nido Tech Pvt. Ltd.",
    userType: "Internal User",
    status: "Active",
    createdAt: "2024-01-15",
  },
  {
    id: "u2",
    username: "markadams",
    email: "admin@nidotech.com",
    fullName: "Mark Adams",
    phone: "+91-9876543211",
    jobTitle: "System Admin",
    department: "IT",
    roleId: "ur-1",
    organizationAccess: "Nido Tech Pvt. Ltd.",
    userType: "Internal User",
    status: "Active",
    createdAt: "2024-02-20",
  },
  {
    id: "u3",
    username: "janesmith",
    email: "procurement@nidotech.com",
    fullName: "Jane Smith",
    phone: "+91-9876543212",
    jobTitle: "Procurement Manager",
    department: "Procurement",
    roleId: "ur-2",
    organizationAccess: "Nido Tech Pvt. Ltd.",
    userType: "Internal User",
    status: "Active",
    createdAt: "2024-03-10",
  },
  {
    id: "u4",
    username: "davidchen",
    email: "ap@nidotech.com",
    fullName: "David Chen",
    phone: "+91-9876543213",
    jobTitle: "Accounts Payable",
    department: "Finance",
    roleId: "ur-3",
    organizationAccess: "Nido Tech Pvt. Ltd.",
    userType: "Internal User",
    status: "Active",
    createdAt: "2024-04-05",
  },
];

export default function ManageUsersPanel() {
  const { userRoles } = useData();
  const [users, setUsers] = useState<AppUser[]>(() => {
    try {
      const stored = localStorage.getItem("appUsers");
      return stored ? JSON.parse(stored) : defaultUsers;
    } catch {
      return defaultUsers;
    }
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    userType: "Internal User" as "Internal User" | "Client User",
    fullName: "",
    email: "",
    phone: "",
    jobTitle: "",
    organizationAccess: "",
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

  const openCreate = () => {
    setEditingId(null);
    setForm({
      userType: "Internal User",
      fullName: "",
      email: "",
      phone: "",
      jobTitle: "",
      organizationAccess: "",
      roleId: "",
      status: "Active",
    });
    setDialogOpen(true);
  };

  const openEdit = (id: string) => {
    const u = users.find((u) => u.id === id);
    if (!u) return;
    setEditingId(id);
    setForm({
      userType: u.userType,
      fullName: u.fullName,
      email: u.email,
      phone: u.phone,
      jobTitle: u.jobTitle,
      organizationAccess: u.organizationAccess,
      roleId: u.roleId,
      status: u.status,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.fullName.trim() || !form.email.trim()) {
      toast({
        title: "Error",
        description: "Full name and email are required",
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
        username: form.email.split("@")[0],
        email: form.email,
        fullName: form.fullName,
        phone: form.phone,
        jobTitle: form.jobTitle,
        department: "",
        roleId: form.roleId,
        organizationAccess: form.organizationAccess,
        userType: form.userType,
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
        <Button onClick={openCreate} className="gap-1.5">
          <Plus size={14} /> Add User
        </Button>
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
              {filtered.map((user) => (
                <TableRow key={user.id}>
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
                      onClick={() => handleDelete(user.id)}
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
              <Select
                value={form.userType}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, userType: v as any }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Internal User">Internal User</SelectItem>
                  <SelectItem value="Client User">Client User</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
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
                <Input
                  value={form.organizationAccess}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      organizationAccess: e.target.value,
                    }))
                  }
                  placeholder="Company Name"
                />
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
    </div>
  );
}
