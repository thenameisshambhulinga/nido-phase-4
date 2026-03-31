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
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Plus, Search, Copy } from "lucide-react";
import type { UserRole, ModulePermission } from "@/types";
import { MODULES } from "@/types";

const defaultModulePermissions = (): ModulePermission[] =>
  MODULES.map((m) => ({
    module: m,
    enabled: true,
    view: true,
    create: false,
    edit: false,
    delete: false,
    export: false,
  }));

export default function NidoRolesPanel() {
  const { userRoles, addUserRole, updateUserRole, deleteUserRole } = useData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<Omit<UserRole, "id">>({
    name: "",
    description: "",
    roleType: "Internal User",
    roleCode: "",
    status: "Active",
    isDefault: false,
    assignedUsers: 0,
    modulePermissions: defaultModulePermissions(),
    dataVisibility: "All",
    locationAccess: "All",
    canApproveOrders: false,
    approvalLimit: 0,
  });

  const filtered = userRoles.filter(
    (r) => !search || r.name.toLowerCase().includes(search.toLowerCase()),
  );

  const openCreate = () => {
    setEditingId(null);
    setForm({
      name: "",
      description: "",
      roleType: "Internal User",
      roleCode: "",
      status: "Active",
      isDefault: false,
      assignedUsers: 0,
      modulePermissions: defaultModulePermissions(),
      dataVisibility: "All",
      locationAccess: "All",
      canApproveOrders: false,
      approvalLimit: 0,
    });
    setDialogOpen(true);
  };

  const openEdit = (id: string) => {
    const r = userRoles.find((r) => r.id === id);
    if (!r) return;
    setEditingId(id);
    const { id: _, ...rest } = r;
    setForm({
      ...rest,
      modulePermissions: rest.modulePermissions.length
        ? rest.modulePermissions
        : defaultModulePermissions(),
    });
    setDialogOpen(true);
  };

  const cloneRole = (id: string) => {
    const r = userRoles.find((r) => r.id === id);
    if (!r) return;
    setEditingId(null);
    const { id: _, ...rest } = r;
    setForm({
      ...rest,
      name: `${rest.name} (Copy)`,
      modulePermissions: rest.modulePermissions.length
        ? rest.modulePermissions
        : defaultModulePermissions(),
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      toast({
        title: "Error",
        description: "Role name required",
        variant: "destructive",
      });
      return;
    }
    if (editingId) {
      updateUserRole(editingId, form);
      toast({ title: "Updated", description: `Role "${form.name}" updated` });
    } else {
      addUserRole(form);
      toast({ title: "Created", description: `Role "${form.name}" created` });
    }
    setDialogOpen(false);
  };

  const togglePerm = (modIdx: number, field: keyof ModulePermission) => {
    setForm((prev) => {
      const perms = [...prev.modulePermissions];
      perms[modIdx] = { ...perms[modIdx], [field]: !perms[modIdx][field] };
      return { ...prev, modulePermissions: perms };
    });
  };

  const toggleSelectAll = (modIdx: number) => {
    setForm((prev) => {
      const perms = [...prev.modulePermissions];
      const p = perms[modIdx];
      const allChecked = p.view && p.create && p.edit && p.delete && p.export;
      perms[modIdx] = {
        ...p,
        view: !allChecked,
        create: !allChecked,
        edit: !allChecked,
        delete: !allChecked,
        export: !allChecked,
      };
      return { ...prev, modulePermissions: perms };
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-success text-success-foreground";
      case "Inactive":
        return "bg-warning text-warning-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Define roles and their permissions.
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            Export CSV
          </Button>
          <Button variant="outline" size="sm">
            Export PDF
          </Button>
          <Button onClick={openCreate} className="gap-1.5">
            <Plus size={14} /> Add Role
          </Button>
        </div>
      </div>

      <div className="relative w-64">
        <Search
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          size={14}
        />
        <Input
          className="pl-8 h-8 text-sm"
          placeholder="Search roles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned Users</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((role) => (
                <TableRow key={role.id}>
                  <TableCell
                    className="font-medium text-primary cursor-pointer hover:underline"
                    onClick={() => openEdit(role.id)}
                  >
                    {role.name}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                    {role.description}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`${getStatusColor(role.status)} border-none`}
                    >
                      {role.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span>{role.assignedUsers} Users</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEdit(role.id)}
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="text-xs text-muted-foreground mt-3">
            Showing 1 to {filtered.length} of {filtered.length} entries
          </p>
        </CardContent>
      </Card>

      {/* Add/Edit Role Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{editingId ? "Edit Role" : "+ Add Role"}</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave}>
                  Save Role
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          {/* Role Information */}
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground border-b border-border pb-1">
              Role Information
            </h3>
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Role Name</Label>
                  <Input
                    value={form.name}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, name: e.target.value }))
                    }
                    placeholder="e.g., Procurement Manager"
                  />
                </div>
                <div>
                  <Label className="text-xs">Role Code</Label>
                  <Input
                    value={form.roleCode}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, roleCode: e.target.value }))
                    }
                    placeholder="e.g., PM"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">Role Type</Label>
                <Select
                  value={form.roleType}
                  onValueChange={(v) =>
                    setForm((p) => ({ ...p, roleType: v as any }))
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
              <div>
                <Label className="text-xs">Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, description: e.target.value }))
                  }
                  rows={3}
                />
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={form.status === "Active"}
                    onCheckedChange={(v) =>
                      setForm((p) => ({
                        ...p,
                        status: v ? "Active" : "Inactive",
                      }))
                    }
                  />
                  <Label className="text-xs">Active</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={form.isDefault}
                    onCheckedChange={(v) =>
                      setForm((p) => ({ ...p, isDefault: !!v }))
                    }
                  />
                  <Label className="text-xs">Set as Default Role</Label>
                </div>
                <div className="ml-auto">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-xs text-primary"
                    onClick={() => {
                      if (editingId) cloneRole(editingId);
                    }}
                  >
                    <Copy size={12} /> Clone Existing Role
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Module Permissions */}
          <div className="space-y-1">
            <div className="flex items-center justify-between border-b border-border pb-1">
              <h3 className="text-sm font-semibold text-foreground">
                Module Permissions
              </h3>
              <div className="relative w-48">
                <Search
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                  size={12}
                />
                <Input
                  className="pl-7 h-7 text-xs"
                  placeholder="Search Modules"
                />
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead className="w-16 text-center">View</TableHead>
                  <TableHead className="w-16 text-center">Create</TableHead>
                  <TableHead className="w-16 text-center">Edit</TableHead>
                  <TableHead className="w-16 text-center">Delete</TableHead>
                  <TableHead className="w-16 text-center">Export</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {form.modulePermissions.map((perm, idx) => (
                  <TableRow key={perm.module}>
                    <TableCell>
                      <Checkbox
                        checked={perm.enabled}
                        onCheckedChange={() => togglePerm(idx, "enabled")}
                      />
                    </TableCell>
                    <TableCell className="font-medium text-sm">
                      <div className="flex items-center gap-2">
                        {perm.module}
                        <button
                          className="text-xs text-primary"
                          onClick={() => toggleSelectAll(idx)}
                        >
                          Select All
                        </button>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={perm.view}
                        onCheckedChange={() => togglePerm(idx, "view")}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={perm.create}
                        onCheckedChange={() => togglePerm(idx, "create")}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={perm.edit}
                        onCheckedChange={() => togglePerm(idx, "edit")}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={perm.delete}
                        onCheckedChange={() => togglePerm(idx, "delete")}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={perm.export}
                        onCheckedChange={() => togglePerm(idx, "export")}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Data Access & Approval */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-4 space-y-3">
                <h3 className="text-sm font-semibold">Data Access Control</h3>
                <div>
                  <Label className="text-xs">Data Visibility</Label>
                  <Select
                    value={form.dataVisibility}
                    onValueChange={(v) =>
                      setForm((p) => ({
                        ...p,
                        dataVisibility: v as
                          | "All"
                          | "Department Only"
                          | "Own Only",
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All</SelectItem>
                      <SelectItem value="Department Only">
                        Department Only
                      </SelectItem>
                      <SelectItem value="Own Only">Own Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Location Access</Label>
                  <Select
                    value={form.locationAccess}
                    onValueChange={(v) =>
                      setForm((p) => ({
                        ...p,
                        locationAccess: v as
                          | "All"
                          | "Selected Locations"
                          | "Assigned Location",
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All</SelectItem>
                      <SelectItem value="Selected Locations">
                        Selected Locations
                      </SelectItem>
                      <SelectItem value="Assigned Location">
                        Assigned Location
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 space-y-3">
                <h3 className="text-sm font-semibold">Approval Permissions</h3>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={form.canApproveOrders}
                    onCheckedChange={(v) =>
                      setForm((p) => ({ ...p, canApproveOrders: !!v }))
                    }
                  />
                  <Label className="text-xs">Can Approve Orders</Label>
                </div>
                {form.canApproveOrders && (
                  <div>
                    <Label className="text-xs">Approval Limit (₹)</Label>
                    <Input
                      type="number"
                      value={form.approvalLimit}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          approvalLimit: Number(e.target.value),
                        }))
                      }
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
