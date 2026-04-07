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
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function UsersPage() {
  const { users, createUser, updateUser, deleteUser, isOwner } = useAuth();

  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [form, setForm] = useState<{
    name: string;
    email: string;
    role: UserRole;
    organization: string;
    jobTitle: string;
    department: string;
    status: "active" | "inactive" | "suspended";
  }>({
    name: "",
    email: "",
    role: "employee" as UserRole,
    organization: "",
    jobTitle: "",
    department: "",
    status: "active",
  });

  const filtered = users.filter(
    (u) =>
      String(u.name ?? "")
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      String(u.email ?? "")
        .toLowerCase()
        .includes(search.toLowerCase()),
  );

  const sendWelcomeEmail = (email: string, name: string) => {
    console.log("📧 Sending welcome email to:", email);
    toast({
      title: "Signup Email Sent",
      description: `Welcome email sent to ${name}`,
    });
  };

  const handleCreate = () => {
    if (!form.name || !form.email) {
      toast({ title: "Error", description: "Name & Email required" });
      return;
    }

    createUser({
      ...form,
      modules: ["dashboard"],
    });

    sendWelcomeEmail(form.email, form.name);

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
      name: "",
      email: "",
      role: "employee",
      organization: "",
      jobTitle: "",
      department: "",
      status: "active",
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

              <Button onClick={handleCreate}>Create</Button>
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
                    <TableCell>{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.jobTitle || "-"}</TableCell>
                    <TableCell>{u.department || "-"}</TableCell>

                    <TableCell>
                      <Badge>{u.status}</Badge>
                    </TableCell>

                    <TableCell className="flex gap-2">
                      <Button size="icon" onClick={() => handleEdit(u)}>
                        <Edit />
                      </Button>
                      <Button size="icon" onClick={() => deleteUser(u.id)}>
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
    </div>
  );
}

function FormFields({ form, setForm }: any) {
  return (
    <div className="space-y-3">
      <Input
        placeholder="Name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />

      <Input
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
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
          <SelectItem value="suspended">Suspended</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
