import React, { useRef, useState } from "react";
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
import {
  Plus,
  Search,
  Copy,
  Pencil,
  Trash2,
  MoreVertical,
  Download,
  Upload,
  FileText,
} from "lucide-react";
import type { UserRole, ModulePermission } from "@/types";
import { MODULES } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ConfirmationDialog from "@/components/shared/ConfirmationDialog";

const defaultModulePermissions = (): ModulePermission[] =>
  MODULES.map((m) => ({
    module: m,
    enabled: true,
    view: true,
    create: false,
    edit: false,
    delete: false,
    export: false,
    import: false,
    approve: false,
  }));

export default function NidoRolesPanel({
  organization,
}: {
  organization?: string;
}) {
  const { userRoles, addUserRole, updateUserRole, deleteUserRole } = useData();
  const importFileRef = useRef<HTMLInputElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [overviewRole, setOverviewRole] = useState<UserRole | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserRole | null>(null);
  const [search, setSearch] = useState("");
  const isClientScoped = Boolean(organization);
  const [form, setForm] = useState<Omit<UserRole, "id">>({
    name: "",
    description: "",
    roleType: isClientScoped ? "Client User" : "Internal User",
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

  const filtered = userRoles.filter((r) => {
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (isClientScoped) {
      return r.roleType === "Client User";
    }
    return true;
  });

  const openCreate = () => {
    setEditingId(null);
    setForm({
      name: "",
      description: "",
      roleType: isClientScoped ? "Client User" : "Internal User",
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
        ? rest.modulePermissions.map((perm) => ({
            ...perm,
            import: !!perm.import,
            approve: !!perm.approve,
          }))
        : defaultModulePermissions(),
    });
    setDialogOpen(true);
  };

  const openOverview = (id: string) => {
    const role = userRoles.find((r) => r.id === id);
    if (!role) return;
    setOverviewRole(role);
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
        ? rest.modulePermissions.map((perm) => ({
            ...perm,
            import: !!perm.import,
            approve: !!perm.approve,
          }))
        : defaultModulePermissions(),
    });
    setDialogOpen(true);
  };

  const exportRolesCsv = () => {
    const header = [
      "Role Code",
      "Role Name",
      "Description",
      "Status",
      "Role Type",
      "Assigned Users",
    ];
    const rows = userRoles.map((role) => [
      role.roleCode,
      role.name,
      role.description,
      role.status,
      role.roleType,
      String(role.assignedUsers),
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nido-roles.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadRoleTemplate = () => {
    const template = [
      "roleCode,roleName,description,roleType,status,isDefault",
      "PM,Procurement Manager,Manages procurement,Internal User,Active,false",
    ].join("\n");
    const blob = new Blob([template], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "role-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importRolesCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length < 2) {
      toast({
        title: "Import failed",
        description: "CSV has no role rows",
        variant: "destructive",
      });
      return;
    }

    let created = 0;
    for (const line of lines.slice(1)) {
      const [roleCode, roleName, description, roleType, status, isDefault] =
        line.split(",").map((v) => v?.trim()?.replace(/^"|"$/g, ""));

      if (!roleName) continue;
      addUserRole({
        name: roleName,
        description: description || "",
        roleType: roleType === "Client User" ? "Client User" : "Internal User",
        roleCode: roleCode || roleName.slice(0, 3).toUpperCase(),
        status: status === "Inactive" ? "Inactive" : "Active",
        isDefault: isDefault === "true",
        assignedUsers: 0,
        modulePermissions: defaultModulePermissions(),
        dataVisibility: "All",
        locationAccess: "All",
        canApproveOrders: false,
        approvalLimit: 0,
      });
      created += 1;
    }

    toast({
      title: "Import completed",
      description: `${created} roles imported`,
    });
    e.target.value = "";
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
    const sanitizedForm = {
      ...form,
      roleType: (isClientScoped ? "Client User" : "Internal User") as
        | "Client User"
        | "Internal User",
    };
    if (editingId) {
      updateUserRole(editingId, sanitizedForm);
      toast({ title: "Updated", description: `Role "${form.name}" updated` });
    } else {
      addUserRole(sanitizedForm);
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
      const allChecked =
        p.view &&
        p.create &&
        p.edit &&
        p.delete &&
        p.export &&
        !!p.import &&
        !!p.approve;
      perms[modIdx] = {
        ...p,
        view: !allChecked,
        create: !allChecked,
        edit: !allChecked,
        delete: !allChecked,
        export: !allChecked,
        import: !allChecked,
        approve: !allChecked,
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
          <input
            ref={importFileRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={importRolesCsv}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Role actions">
                <MoreVertical size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportRolesCsv}>
                <Download size={14} className="mr-2" /> Export CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => importFileRef.current?.click()}>
                <Upload size={14} className="mr-2" /> Import CSV
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={openCreate}>
                <Plus size={14} className="mr-2" /> Add Role
              </DropdownMenuItem>
              <DropdownMenuItem onClick={downloadRoleTemplate}>
                <FileText size={14} className="mr-2" /> Role Template
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
                <TableHead>Role Code</TableHead>
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
                  <TableCell className="font-medium">{role.roleCode}</TableCell>
                  <TableCell
                    className="font-medium text-primary cursor-pointer hover:underline"
                    onClick={() => openOverview(role.id)}
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
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(role.id)}
                        aria-label="Edit role"
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTarget(role)}
                        aria-label="Delete role"
                      >
                        <Trash2 size={14} className="text-destructive" />
                      </Button>
                    </div>
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
                <Input
                  value={isClientScoped ? "Client User" : "Internal User"}
                  readOnly
                />
                {isClientScoped && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Scoped to {organization}
                  </p>
                )}
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
                  <TableHead className="w-16 text-center">Import</TableHead>
                  <TableHead className="w-16 text-center">Approval</TableHead>
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
                    <TableCell className="text-center">
                      <Checkbox
                        checked={!!perm.import}
                        onCheckedChange={() => togglePerm(idx, "import")}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={!!perm.approve}
                        onCheckedChange={() => togglePerm(idx, "approve")}
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

      {/* Role Overview Dialog */}
      <Dialog open={!!overviewRole} onOpenChange={() => setOverviewRole(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Role Overview</DialogTitle>
          </DialogHeader>
          {overviewRole && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Role Code</Label>
                  <Input value={overviewRole.roleCode} readOnly />
                </div>
                <div>
                  <Label className="text-xs">Role Name</Label>
                  <Input value={overviewRole.name} readOnly />
                </div>
                <div>
                  <Label className="text-xs">Role Type</Label>
                  <Input value={overviewRole.roleType} readOnly />
                </div>
                <div>
                  <Label className="text-xs">Status</Label>
                  <Input value={overviewRole.status} readOnly />
                </div>
              </div>
              <div>
                <Label className="text-xs">Description</Label>
                <Textarea value={overviewRole.description} readOnly rows={3} />
              </div>
              <div>
                <Label className="text-xs">Module Permissions</Label>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Module</TableHead>
                      <TableHead className="text-center">View</TableHead>
                      <TableHead className="text-center">Create</TableHead>
                      <TableHead className="text-center">Edit</TableHead>
                      <TableHead className="text-center">Delete</TableHead>
                      <TableHead className="text-center">Export</TableHead>
                      <TableHead className="text-center">Import</TableHead>
                      <TableHead className="text-center">Approval</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overviewRole.modulePermissions.map((perm) => (
                      <TableRow key={perm.module}>
                        <TableCell>{perm.module}</TableCell>
                        <TableCell className="text-center">
                          {perm.view ? "Yes" : "No"}
                        </TableCell>
                        <TableCell className="text-center">
                          {perm.create ? "Yes" : "No"}
                        </TableCell>
                        <TableCell className="text-center">
                          {perm.edit ? "Yes" : "No"}
                        </TableCell>
                        <TableCell className="text-center">
                          {perm.delete ? "Yes" : "No"}
                        </TableCell>
                        <TableCell className="text-center">
                          {perm.export ? "Yes" : "No"}
                        </TableCell>
                        <TableCell className="text-center">
                          {perm.import ? "Yes" : "No"}
                        </TableCell>
                        <TableCell className="text-center">
                          {perm.approve ? "Yes" : "No"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={!!deleteTarget}
        title="Delete Role"
        description={
          deleteTarget
            ? `Delete role \"${deleteTarget.name}\"? This action cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        tone="destructive"
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteUserRole(deleteTarget.id);
          toast({
            title: "Deleted",
            description: `Role "${deleteTarget.name}" removed`,
          });
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
