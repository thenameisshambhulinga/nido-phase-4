import { useMemo, useState } from "react";
import Header from "@/components/layout/Header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useData } from "@/contexts/DataContext";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MODULES } from "@/types";
import { toast } from "@/hooks/use-toast";
import { Search, Plus, Edit, Trash2 } from "lucide-react";
import type { Role } from "@/contexts/DataContext";

type PermissionKey = "view" | "create" | "edit" | "delete" | "export";

const permissionKeys: PermissionKey[] = [
  "view",
  "create",
  "edit",
  "delete",
  "export",
];

function makeDefaultPermissions() {
  return MODULES.reduce<Record<string, Record<string, boolean>>>(
    (acc, module) => {
      acc[module] = {
        view: true,
        create: false,
        edit: false,
        delete: false,
        export: false,
      };
      return acc;
    },
    {},
  );
}

export default function PermissionsPage() {
  const { roles, addRole, updateRole, deleteRole } = useData();

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [permissions, setPermissions] = useState<
    Record<string, Record<string, boolean>>
  >(makeDefaultPermissions());

  const filtered = useMemo(
    () =>
      roles.filter((r) => {
        const q = search.toLowerCase();
        return (
          r.name.toLowerCase().includes(q) ||
          (r.description || "").toLowerCase().includes(q)
        );
      }),
    [roles, search],
  );

  const resetForm = () => {
    setEditing(null);
    setName("");
    setDescription("");
    setStatus("active");
    setPermissions(makeDefaultPermissions());
  };

  const openCreate = () => {
    resetForm();
    setOpen(true);
  };

  const openEdit = (role: Role) => {
    setEditing(role);
    setName(role.name);
    setDescription(role.description || "");
    setStatus(role.status);
    setPermissions({ ...makeDefaultPermissions(), ...role.permissions });
    setOpen(true);
  };

  const togglePermission = (module: string, key: PermissionKey) => {
    setPermissions((prev) => ({
      ...prev,
      [module]: {
        ...prev[module],
        [key]: !prev[module]?.[key],
      },
    }));
  };

  const saveRole = () => {
    if (!name.trim()) {
      toast({ title: "Role name is required" });
      return;
    }

    const modules = MODULES.filter((module) => permissions[module]?.view);
    const payload = {
      name,
      description,
      status,
      users: editing?.users || 0,
      modules,
      permissions,
    };

    if (editing) {
      updateRole(editing.id, payload);
      toast({ title: "Role updated" });
    } else {
      addRole(payload);
      toast({ title: "Role created" });
    }

    setOpen(false);
    resetForm();
  };

  return (
    <div>
      <Header title="Nido Roles" />

      <div className="p-6 space-y-4">
        <div className="flex justify-between items-center gap-3">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search nido roles"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button className="gap-2" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Create Role
          </Button>
        </div>

        <Card>
          <CardContent className="pt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Role Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">{role.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {role.description}
                    </TableCell>
                    <TableCell>internal</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          role.status === "active"
                            ? "bg-success text-success-foreground"
                            : "bg-muted text-muted-foreground"
                        }
                      >
                        {role.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{role.users}</TableCell>
                    <TableCell className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(role)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          deleteRole(role.id);
                          toast({ title: "Role removed" });
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Nido Role" : "Create Nido Role"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Role Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Role Type</Label>
                <Input value="internal" disabled />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant={status === "active" ? "default" : "outline"}
                  onClick={() => setStatus("active")}
                >
                  Active
                </Button>
                <Button
                  type="button"
                  variant={status === "inactive" ? "default" : "outline"}
                  onClick={() => setStatus("inactive")}
                >
                  Inactive
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Assign Permissions</Label>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Module</TableHead>
                    {permissionKeys.map((key) => (
                      <TableHead key={key} className="text-center capitalize">
                        {key}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MODULES.map((module) => (
                    <TableRow key={module}>
                      <TableCell>{module}</TableCell>
                      {permissionKeys.map((key) => (
                        <TableCell key={key} className="text-center">
                          <Checkbox
                            checked={!!permissions[module]?.[key]}
                            onCheckedChange={() =>
                              togglePermission(module, key)
                            }
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button onClick={saveRole}>Save Role</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
