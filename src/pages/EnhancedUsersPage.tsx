import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePageMeta } from "@/contexts/PageMetaContext";
import { useEnhancedAuth } from "@/contexts/EnhancedAuthContext";
import {
  ROLE_TEMPLATES,
  RoleTemplateKey,
  UserType,
  AVAILABLE_MODULES,
} from "@/lib/permissions";
import { EnhancedAppUser } from "@/lib/userManagementTypes";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import {
  Plus,
  Trash2,
  Search,
  Mail,
  RotateCcw,
  Lock,
  Unlock,
  Download,
  Upload,
} from "lucide-react";
import ConfirmationDialog from "@/components/shared/ConfirmationDialog";
import { Checkbox } from "@/components/ui/checkbox";
import CredentialsModal from "@/components/shared/CredentialsModal";
import {
  isValidEmail,
  isValidPhoneNumber,
  normalizeEmail,
} from "@/lib/validation";

export default function EnhancedUsersPage() {
  const navigate = useNavigate();
  const { setMeta } = usePageMeta();

  useEffect(() => {
    setMeta({ title: "Users", breadcrumbs: [{ label: "Users" }] });
    return () => setMeta({});
  }, [setMeta]);
  const {
    users,
    isOwner,
    createUser,
    updateUser,
    deleteUser,
    resetPassword,
    departments,
    credentials,
    setCredentials,
  } = useEnhancedAuth();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [userTypeFilter, setUserTypeFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("users");

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<EnhancedAppUser | null>(
    null,
  );
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Record<string, any>>({
    fullName: "",
    email: "",
    jobTitle: "",
    department: "General",
    roleTemplate: "employee",
    userType: "Internal User",
    phone: "",
    alternatePhone: "",
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
    internalRole: "Employee",
    teams: "",
    allowedModules: "Dashboard,Orders,Shop",
    approvalAuthority: "No",
    reportingStructure: "Department Head",
    status: "Active",
  });

  // Filter users
  const filteredUsers = users.filter((u) => {
    if (
      search &&
      !u.fullName.toLowerCase().includes(search.toLowerCase()) &&
      !u.email.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    if (roleFilter !== "all" && u.roleTemplate !== roleFilter) return false;
    if (userTypeFilter !== "all" && u.userType !== userTypeFilter) return false;
    return true;
  });

  // Handle create user
  const handleCreateUser = async () => {
    if (!formData.fullName || !formData.email) {
      toast({ title: "Error", description: "Name and email required" });
      return;
    }

    if (!isValidEmail(formData.email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    if (formData.phone && !isValidPhoneNumber(formData.phone)) {
      toast({
        title: "Invalid phone",
        description: "Phone number must contain 10 to 15 digits.",
        variant: "destructive",
      });
      return;
    }

    if (
      formData.alternatePhone &&
      !isValidPhoneNumber(formData.alternatePhone)
    ) {
      toast({
        title: "Invalid alternate phone",
        description: "Alternate phone number must contain 10 to 15 digits.",
        variant: "destructive",
      });
      return;
    }

    const result = await createUser({
      ...formData,
      fullName: formData.fullName,
      email: normalizeEmail(formData.email),
      jobTitle: formData.jobTitle || "",
      department: formData.department || "General",
      roleTemplate: formData.roleTemplate as RoleTemplateKey,
      userType: formData.userType as UserType,
      phone: formData.phone || "",
      organization: "Nido Tech",
      status: "Active",
      createdBy: "owner",
    } as any);

    if (result.success) {
      if (result.credentials) {
        setCredentials(result.credentials);
      }
      toast({
        title: "User Created",
        description: `Temporary password: ${result.tempPassword}`,
      });
      setShowCreateDialog(false);
      resetForm();
    } else {
      toast({ title: "Error", description: "Failed to create user" });
    }
  };

  // Handle reset password
  const handleResetPassword = async (userId: string) => {
    const result = await resetPassword(userId);
    if (result.success) {
      toast({
        title: "Password Reset",
        description: "Temporary password reissued and emailed to the user.",
      });
    } else {
      toast({
        title: "Password Reset Failed",
        description: "Unable to generate a new setup password.",
        variant: "destructive",
      });
    }
  };

  // Handle delete user
  const handleDeleteUser = async (userId: string) => {
    setDeleteUserId(userId);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      fullName: "",
      email: "",
      jobTitle: "",
      department: "General",
      roleTemplate: "employee",
      userType: "Internal User",
      phone: "",
      alternatePhone: "",
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
      internalRole: "Employee",
      teams: "",
      allowedModules: "Dashboard,Orders,Shop",
      approvalAuthority: "No",
      reportingStructure: "Department Head",
      status: "Active",
    });
  };

  const handleSeedEnterpriseUsers = async () => {
    if (!isOwner) return;
    const seedRows = [
      {
        fullName: "Aarav Mehta",
        email: "aarav.mehta@nido.tech",
        jobTitle: "Procurement Director",
        department: "Procurement",
        roleTemplate: "procurement_manager",
        userType: "Internal User",
        phone: "9876543210",
        organization: "Nido Tech",
      },
      {
        fullName: "Isha Verma",
        email: "isha.verma@nido.tech",
        jobTitle: "Finance Manager",
        department: "Finance",
        roleTemplate: "finance_manager",
        userType: "Internal User",
        phone: "9876543211",
        organization: "Nido Tech",
      },
      {
        fullName: "Karan Nair",
        email: "karan.nair@nido.tech",
        jobTitle: "IT Operations Lead",
        department: "IT",
        roleTemplate: "admin",
        userType: "Internal User",
        phone: "9876543212",
        organization: "Nido Tech",
      },
      {
        fullName: "Neha Rao",
        email: "neha.rao@nido.tech",
        jobTitle: "Compliance Analyst",
        department: "Compliance",
        roleTemplate: "accounts_payable",
        userType: "Internal User",
        phone: "9876543213",
        organization: "Nido Tech",
      },
      {
        fullName: "Rohit Sinha",
        email: "rohit.sinha@nido.tech",
        jobTitle: "Operations Specialist",
        department: "Operations",
        roleTemplate: "employee",
        userType: "Internal User",
        phone: "9876543214",
        organization: "Nido Tech",
      },
      {
        fullName: "Priya Kapoor",
        email: "priya.kapoor@abb-corp.com",
        jobTitle: "Client Admin",
        department: "Procurement",
        roleTemplate: "client_admin",
        userType: "Client User",
        phone: "9876543215",
        organization: "ABB India",
      },
      {
        fullName: "Manoj Kulkarni",
        email: "manoj.k@hdfc-enterprise.com",
        jobTitle: "Facility Manager",
        department: "Facilities",
        roleTemplate: "client_user",
        userType: "Client User",
        phone: "9876543216",
        organization: "HDFC Bank",
      },
      {
        fullName: "Sneha Iyer",
        email: "sneha.iyer@tcs-corp.com",
        jobTitle: "IT Buyer",
        department: "IT Procurement",
        roleTemplate: "client_user",
        userType: "Client User",
        phone: "9876543217",
        organization: "TCS",
      },
      {
        fullName: "Aditya Patil",
        email: "aditya.patil@infosys-corp.com",
        jobTitle: "Regional Buyer",
        department: "Regional Ops",
        roleTemplate: "client_user",
        userType: "Client User",
        phone: "9876543218",
        organization: "Infosys",
      },
      {
        fullName: "Kavya Reddy",
        email: "kavya.reddy@wipro-enterprise.com",
        jobTitle: "Operations Coordinator",
        department: "Operations",
        roleTemplate: "client_user",
        userType: "Client User",
        phone: "9876543219",
        organization: "Wipro",
      },
    ];

    let created = 0;
    for (const row of seedRows) {
      if (
        users.some((u) => u.email.toLowerCase() === row.email.toLowerCase())
      ) {
        continue;
      }
      const result = await createUser({
        ...row,
        status: "Active",
        createdBy: "owner",
      } as any);
      if (result.success) created += 1;
    }

    toast({
      title: "Seed completed",
      description: `${created} enterprise users created. Existing users were skipped.`,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800";
      case "Inactive":
        return "bg-gray-100 text-gray-800";
      case "Suspended":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleColor = (role: RoleTemplateKey) => {
    const colors: Record<RoleTemplateKey, string> = {
      owner: "bg-purple-100 text-purple-800",
      admin: "bg-blue-100 text-blue-800",
      procurement_manager: "bg-indigo-100 text-indigo-800",
      procurement_specialist: "bg-cyan-100 text-cyan-800",
      accounts_payable: "bg-green-100 text-green-800",
      finance_manager: "bg-emerald-100 text-emerald-800",
      employee: "bg-yellow-100 text-yellow-800",
      client_admin: "bg-orange-100 text-orange-800",
      client_user: "bg-amber-100 text-amber-800",
      vendor_admin: "bg-rose-100 text-rose-800",
      vendor_user: "bg-pink-100 text-pink-800",
    };
    return colors[role] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="min-h-full bg-background">
      
      <div className="p-6 space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
              <p className="text-xs text-gray-500">Active accounts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Internal Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.filter((u) => u.userType === "Internal User").length}
              </div>
              <p className="text-xs text-gray-500">Employees</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Client Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.filter((u) => u.userType === "Client User").length}
              </div>
              <p className="text-xs text-gray-500">Clients</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Vendor Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.filter((u) => u.userType === "Vendor User").length}
              </div>
              <p className="text-xs text-gray-500">Vendors</p>
            </CardContent>
          </Card>
        </div>

        {!isOwner && (
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">
              Only owner accounts can create, invite, reset, or delete users.
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList>
            <TabsTrigger value="users">User Directory</TabsTrigger>
            <TabsTrigger value="import">Bulk Import</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-3 items-end">
              <div className="flex-1">
                <Label className="text-xs text-gray-500 mb-1 block">
                  Search
                </Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs text-gray-500 mb-1 block">Role</Label>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {Object.entries(ROLE_TEMPLATES).map(([key, template]) => (
                      <SelectItem key={key} value={key}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-gray-500 mb-1 block">
                  User Type
                </Label>
                <Select
                  value={userTypeFilter}
                  onValueChange={setUserTypeFilter}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="Internal User">Internal User</SelectItem>
                    <SelectItem value="Client User">Client User</SelectItem>
                    <SelectItem value="Vendor User">Vendor User</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isOwner && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={handleSeedEnterpriseUsers}>
                    Seed Enterprise Users
                  </Button>
                  <Dialog
                    open={showCreateDialog}
                    onOpenChange={setShowCreateDialog}
                  >
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add User
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Create New User</DialogTitle>
                      </DialogHeader>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Full Name *</Label>
                          <Input
                            placeholder="John Doe"
                            value={formData.fullName || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                fullName: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div>
                          <Label>Email *</Label>
                          <Input
                            type="email"
                            placeholder="john@nidotech.com"
                            value={formData.email || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                email: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div>
                          <Label>Job Title</Label>
                          <Input
                            placeholder="Manager"
                            value={formData.jobTitle || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                jobTitle: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div>
                          <Label>Phone</Label>
                          <Input
                            type="tel"
                            inputMode="tel"
                            placeholder="+91-XXXXXXXXXX"
                            value={formData.phone || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                phone: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div>
                          <Label>Alternate Phone</Label>
                          <Input
                            type="tel"
                            placeholder="Optional"
                            value={formData.alternatePhone || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                alternatePhone: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div>
                          <Label>Employee ID</Label>
                          <Input
                            placeholder="EMP-1001"
                            value={formData.employeeId || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                employeeId: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div>
                          <Label>Manager</Label>
                          <Input
                            placeholder="Reporting manager"
                            value={formData.manager || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                manager: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div>
                          <Label>Timezone</Label>
                          <Input
                            value={formData.timezone || "Asia/Kolkata"}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                timezone: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div className="col-span-2">
                          <Label>Address</Label>
                          <Input
                            placeholder="Street address"
                            value={formData.address || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                address: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div>
                          <Label>City</Label>
                          <Input
                            value={formData.city || ""}
                            onChange={(e) =>
                              setFormData({ ...formData, city: e.target.value })
                            }
                          />
                        </div>

                        <div>
                          <Label>State</Label>
                          <Input
                            value={formData.state || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                state: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div>
                          <Label>Country</Label>
                          <Input
                            value={formData.country || "India"}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                country: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div>
                          <Label>Postal Code</Label>
                          <Input
                            value={formData.postalCode || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                postalCode: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div>
                          <Label>Date of Birth</Label>
                          <Input
                            type="date"
                            value={formData.dob || ""}
                            onChange={(e) =>
                              setFormData({ ...formData, dob: e.target.value })
                            }
                          />
                        </div>

                        <div>
                          <Label>Joining Date</Label>
                          <Input
                            type="date"
                            value={formData.joiningDate || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                joiningDate: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div>
                          <Label>Emergency Contact</Label>
                          <Input
                            value={formData.emergencyContact || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                emergencyContact: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div>
                          <Label>Department</Label>
                          <Select
                            value={formData.department || "General"}
                            onValueChange={(v) =>
                              setFormData({ ...formData, department: v })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {departments.map((d) => (
                                <SelectItem key={d.id} value={d.name}>
                                  {d.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>User Type</Label>
                          <Input value={"Internal User"} disabled />
                        </div>

                        <div className="col-span-2">
                          <Label>Role Assignment *</Label>
                          <Select
                            value={formData.roleTemplate || "employee"}
                            onValueChange={(v) =>
                              setFormData({
                                ...formData,
                                roleTemplate: v as RoleTemplateKey,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(ROLE_TEMPLATES).map(
                                ([key, template]) => (
                                  <SelectItem key={key} value={key}>
                                    {template.name} - {template.description}
                                  </SelectItem>
                                ),
                              )}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Permission Group</Label>
                          <Input
                            value={formData.permissionGroup || "Default"}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                permissionGroup: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div>
                          <Label>System Access Level</Label>
                          <Input
                            value={formData.systemAccessLevel || "Standard"}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                systemAccessLevel: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div>
                          <Label>Internal Role</Label>
                          <Input
                            value={formData.internalRole || "Employee"}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                internalRole: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div>
                          <Label>Teams</Label>
                          <Input
                            value={formData.teams || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                teams: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div>
                          <Label>Allowed Modules</Label>
                          <Input
                            value={formData.allowedModules || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                allowedModules: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div>
                          <Label>Approval Authority</Label>
                          <Input
                            value={formData.approvalAuthority || "No"}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                approvalAuthority: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div className="col-span-2">
                          <Label>Reporting Structure</Label>
                          <Input
                            value={formData.reportingStructure || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                reportingStructure: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div className="col-span-2">
                          <Label>Notes</Label>
                          <Input
                            value={formData.notes || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                notes: e.target.value,
                              })
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
                        <Button onClick={handleCreateUser}>Create User</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </div>

            {/* Users Table */}
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>User Type</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.fullName}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge className={getRoleColor(user.roleTemplate)}>
                            {ROLE_TEMPLATES[user.roleTemplate].name}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.userType}</TableCell>
                        <TableCell>{user.department}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(user.status)}>
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              navigate(
                                `/configuration/nido-users/users/${user.id}/profile`,
                              )
                            }
                          >
                            Profile
                          </Button>
                          <Dialog
                            open={
                              showPermissionDialog &&
                              selectedUser?.id === user.id
                            }
                            onOpenChange={(open) => {
                              if (!open) setSelectedUser(null);
                              setShowPermissionDialog(open);
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedUser(user)}
                              >
                                <Lock className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-96 overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>
                                  Permissions - {user.fullName}
                                </DialogTitle>
                              </DialogHeader>

                              <div className="space-y-2">
                                <p className="text-sm text-gray-600">
                                  Role: {ROLE_TEMPLATES[user.roleTemplate].name}
                                </p>
                                <div className="grid grid-cols-4 gap-2">
                                  {AVAILABLE_MODULES.map((module) => (
                                    <div key={module.id} className="text-xs">
                                      <p className="font-semibold">
                                        {module.name}
                                      </p>
                                      <p className="text-gray-500">
                                        {module.description}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>

                          {isOwner && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleResetPassword(user.id)}
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteUser(user.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <ConfirmationDialog
              open={!!deleteUserId}
              title="Delete User"
              description="Are you sure you want to delete this user? This action cannot be undone."
              confirmLabel="Delete"
              tone="destructive"
              onOpenChange={(open) => {
                if (!open) setDeleteUserId(null);
              }}
              onConfirm={async () => {
                if (!deleteUserId) return;
                await deleteUser(deleteUserId);
                toast({ title: "User deleted" });
                setDeleteUserId(null);
              }}
            />
          </TabsContent>

          {/* Bulk Import Tab */}
          <TabsContent value="import" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Bulk User Import</CardTitle>
                <CardDescription>
                  Import multiple users at once using CSV format
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50">
                  <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm font-medium">
                    Click to upload CSV or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    CSV file with columns: fullName, email, jobTitle,
                    department, roleTemplate, userType, phone
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">CSV Template</h4>
                  <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                    {`fullName,email,jobTitle,department,roleTemplate,userType,phone
John Doe,john@nidotech.com,Manager,Procurement,procurement_manager,Internal User,+91-9999999999
Jane Smith,jane@client.com,Admin,Operations,client_admin,Client User,+91-8888888888`}
                  </pre>
                  <Button variant="outline" className="w-full gap-2">
                    <Download className="h-4 w-4" />
                    Download Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <CredentialsModal
        open={!!credentials}
        onClose={() => setCredentials(null)}
        credentials={credentials}
        userType="INTERNAL_EMPLOYEE"
      />
    </div>
  );
}
