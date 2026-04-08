import { useState } from "react";
import Header from "@/components/layout/Header";
import { useEnhancedAuth } from "@/contexts/EnhancedAuthContext";
import { UserDepartment } from "@/lib/userManagementTypes";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Plus, Edit, Trash2, Users } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function DepartmentsPage() {
  const {
    departments,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    users,
  } = useEnhancedAuth();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedDept, setSelectedDept] = useState<UserDepartment | null>(null);

  const [formData, setFormData] = useState<
    Omit<UserDepartment, "id" | "createdAt">
  >({
    name: "",
    description: "",
    manager: "",
    users: [],
  });

  const handleCreate = () => {
    if (!formData.name) {
      toast({ title: "Error", description: "Department name required" });
      return;
    }

    createDepartment(formData);
    toast({ title: "Department created successfully" });

    setShowCreateDialog(false);
    resetForm();
  };

  const handleUpdate = () => {
    if (!selectedDept) return;

    updateDepartment(selectedDept.id, formData);
    toast({ title: "Department updated successfully" });

    setShowEditDialog(false);
    setSelectedDept(null);
    resetForm();
  };

  const handleDelete = (deptId: string) => {
    if (confirm("Delete this department?")) {
      deleteDepartment(deptId);
      toast({ title: "Department deleted" });
    }
  };

  const handleEditClick = (dept: UserDepartment) => {
    setSelectedDept(dept);
    setFormData({
      name: dept.name,
      description: dept.description,
      manager: dept.manager || "",
      users: dept.users,
    });
    setShowEditDialog(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      manager: "",
      users: [],
    });
  };

  const getUsersDepartment = (deptName: string) => {
    return users.filter((u) => u.department === deptName);
  };

  const getManagerName = (userId: string | undefined) => {
    if (!userId) return "-";
    const manager = users.find((u) => u.id === userId);
    return manager?.fullName || "-";
  };

  return (
    <div className="min-h-screen bg-background">
      <Header title="Department & Team Management" />

      <div className="p-6 space-y-6">
        {/* Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Total Departments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{departments.length}</div>
              <p className="text-xs text-gray-500 mt-1">Active departments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{users.length}</div>
              <p className="text-xs text-gray-500 mt-1">
                Assigned to departments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Avg Team Size
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {departments.length > 0
                  ? Math.round(users.length / departments.length)
                  : 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">Users per department</p>
            </CardContent>
          </Card>
        </div>

        {/* Create Department */}
        <div className="flex justify-end">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Department
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Department</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label>Department Name *</Label>
                  <Input
                    placeholder="e.g., Procurement"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label>Description</Label>
                  <Input
                    placeholder="What does this department do?"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label>Department Manager</Label>
                  <Input
                    placeholder="Manager name or ID"
                    value={formData.manager || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, manager: e.target.value })
                    }
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateDialog(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreate}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Departments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {departments.map((dept) => {
            const deptUsers = getUsersDepartment(dept.name);
            return (
              <Card key={dept.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{dept.name}</CardTitle>
                      <CardDescription>{dept.description}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Dialog
                        open={showEditDialog && selectedDept?.id === dept.id}
                        onOpenChange={setShowEditDialog}
                      >
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditClick(dept)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Department</DialogTitle>
                          </DialogHeader>

                          <div className="space-y-4">
                            <div>
                              <Label>Department Name *</Label>
                              <Input
                                placeholder="e.g., Procurement"
                                value={formData.name}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    name: e.target.value,
                                  })
                                }
                              />
                            </div>

                            <div>
                              <Label>Description</Label>
                              <Input
                                placeholder="What does this department do?"
                                value={formData.description}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    description: e.target.value,
                                  })
                                }
                              />
                            </div>

                            <div>
                              <Label>Department Manager</Label>
                              <Input
                                placeholder="Manager name or ID"
                                value={formData.manager || ""}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    manager: e.target.value,
                                  })
                                }
                              />
                            </div>
                          </div>

                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setShowEditDialog(false);
                                setSelectedDept(null);
                                resetForm();
                              }}
                            >
                              Cancel
                            </Button>
                            <Button onClick={handleUpdate}>Save Changes</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600"
                        onClick={() => handleDelete(dept.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Manager</p>
                      <p className="font-semibold">
                        {getManagerName(dept.manager)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Team Size</p>
                      <p className="font-semibold">
                        {deptUsers.length} members
                      </p>
                    </div>
                  </div>

                  {deptUsers.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Team Members
                      </p>
                      <div className="space-y-1">
                        {deptUsers.slice(0, 3).map((user) => (
                          <div key={user.id} className="text-sm">
                            <p className="font-medium">{user.fullName}</p>
                            <p className="text-xs text-gray-500">
                              {user.jobTitle}
                            </p>
                          </div>
                        ))}
                        {deptUsers.length > 3 && (
                          <p className="text-xs text-gray-500 italic">
                            +{deptUsers.length - 3} more
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Departments Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Departments</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Department Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead className="text-center">Team Size</TableHead>
                  <TableHead className="text-right">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.map((dept) => {
                  const deptUsers = getUsersDepartment(dept.name);
                  return (
                    <TableRow key={dept.id}>
                      <TableCell className="font-medium">{dept.name}</TableCell>
                      <TableCell>{dept.description}</TableCell>
                      <TableCell>{getManagerName(dept.manager)}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{deptUsers.length}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm text-gray-500">
                        {new Date(dept.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
