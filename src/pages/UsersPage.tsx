import { useState } from "react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEnhancedAuth } from "@/contexts/EnhancedAuthContext";
import CredentialsModal from "@/components/shared/CredentialsModal";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import ConfirmationDialog from "@/components/shared/ConfirmationDialog";
import { isValidEmail, normalizeEmail } from "@/lib/validation";

export default function UsersPage() {
  const {
    users,
    createUser,
    updateUser,
    deleteUser,
    isOwner,
    credentials,
    setCredentials,
  } = useEnhancedAuth();

  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const [form, setForm] = useState<{
    fullName: string;
    email: string;
    roleTemplate: "employee" | "vendor_user";
    organization: string;
    jobTitle: string;
    department: string;
    status: "Active" | "Inactive" | "Suspended";
  }>({
    fullName: "",
    email: "",
    roleTemplate: "employee",
    organization: "",
    jobTitle: "",
    department: "",
    status: "Active",
  });

  const filtered = users.filter(
    (u) =>
      String(u.fullName ?? "")
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      String(u.email ?? "")
        .toLowerCase()
        .includes(search.toLowerCase()),
  );

  const handleCreate = async () => {
    if (!form.fullName || !form.email) {
      toast({ title: "Error", description: "Name & Email required" });
      return;
    }

    if (!isValidEmail(form.email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    const result = await createUser({
      ...form,
      username: form.email.split("@")[0],
      phone: "",
      email: normalizeEmail(form.email),
      userType: "Vendor User",
      requiresPasswordReset: true,
      createdBy: "owner",
      twoFactorEnabled: false,
    });

    if (result.success && result.credentials) {
      setCredentials(result.credentials);
      toast({
        title: "User created",
        description: `Credentials generated for ${result.credentials.email}`,
      });
    } else if (!result.success) {
      toast({
        title: "Create failed",
        description: "Please check the entered details and try again.",
        variant: "destructive",
      });
      return;
    }

    setShowCreate(false);
    resetForm();
  };

  const handleEdit = (u: any) => {
    setEditId(u.id);
    setForm({
      ...u,
      jobTitle: u.jobTitle || "",
      department: u.department || "",
    });
    setShowEdit(true);
  };

  const handleSaveEdit = () => {
    if (!editId) return;

    updateUser(editId, form);

    toast({ title: "User Updated" });
    setShowEdit(false);
    resetForm();
  };

  const resetForm = () => {
    setForm({
      fullName: "",
      email: "",
      roleTemplate: "employee",
      organization: "",
      jobTitle: "",
      department: "",
      status: "Active",
    } as const);
  };

  return (
    <div>
      <Header title="User Management" />

      <div className="p-6 space-y-4">
        <div className="flex justify-between">
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button>
                <Plus /> Add User
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create User</DialogTitle>
              </DialogHeader>

              <FormFields form={form} setForm={setForm} />

              <Button onClick={() => void handleCreate()}>Create</Button>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filtered.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>{u.fullName}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.jobTitle || "-"}</TableCell>
                    <TableCell>{u.department || "-"}</TableCell>

                    <TableCell>
                      <Badge>{u.status}</Badge>
                    </TableCell>

                    <TableCell className="flex gap-2">
                      <Button size="icon" onClick={() => handleEdit(u)}>
                        <Pencil />
                      </Button>
                      <Button
                        size="icon"
                        onClick={() => setDeleteTargetId(u.id)}
                      >
                        <Trash2 />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <ConfirmationDialog
        open={!!deleteTargetId}
        title="Delete User"
        description="Delete this user account? This action cannot be undone."
        confirmLabel="Delete"
        tone="destructive"
        onOpenChange={(open) => {
          if (!open) setDeleteTargetId(null);
        }}
        onConfirm={() => {
          if (!deleteTargetId) return;
          void deleteUser(deleteTargetId);
          setDeleteTargetId(null);
        }}
      />

      <CredentialsModal
        open={!!credentials}
        onClose={() => setCredentials(null)}
        credentials={credentials}
        userType="VENDOR_USER"
      />
    </div>
  );
}

function FormFields({ form, setForm }: any) {
  return (
    <div className="space-y-3">
      <Input
        placeholder="Name"
        value={form.fullName}
        onChange={(e) => setForm({ ...form, fullName: e.target.value })}
      />

      <Input
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />

      <Input
        placeholder="Job Title"
        value={form.jobTitle}
        onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
      />

      <Input
        placeholder="Department"
        value={form.department}
        onChange={(e) => setForm({ ...form, department: e.target.value })}
      />

      <Select
        value={form.status}
        onValueChange={(v) => setForm({ ...form, status: v })}
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
  );
}
