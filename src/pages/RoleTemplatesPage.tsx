import { useState } from "react";
import Header from "@/components/layout/Header";
import {
  ROLE_TEMPLATES,
  AVAILABLE_MODULES,
  RoleTemplateKey,
  generatePermissionMatrix,
  PermissionAction,
} from "@/lib/permissions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
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
import { CheckCircle2, XCircle, Users } from "lucide-react";

export default function RoleTemplatesPage() {
  const [selectedRole, setSelectedRole] = useState<RoleTemplateKey>("owner");
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const template = ROLE_TEMPLATES[selectedRole];
  const matrix = generatePermissionMatrix(selectedRole);

  const getUserCountByRole = (role: RoleTemplateKey): number => {
    // This would come from users context
    return 0;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header title="Role & Permission Management" />

      <div className="p-6 space-y-6">
        {/* Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Role-Based Access Control (RBAC)</CardTitle>
            <CardDescription>
              Define and manage user roles with granular permission controls
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            <p>
              Roles determine what users can access and do in the system. Each
              role has specific permissions across modules. Users can only
              perform actions their role allows.
            </p>
          </CardContent>
        </Card>

        {/* Role Tabs */}
        <Tabs
          value={selectedRole}
          onValueChange={(v) => setSelectedRole(v as RoleTemplateKey)}
          className="space-y-4"
        >
          <TabsList className="grid grid-cols-4 lg:grid-cols-6 h-auto gap-2">
            {Object.entries(ROLE_TEMPLATES).map(([key, role]) => (
              <TabsTrigger key={key} value={key} className="text-xs">
                {role.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(ROLE_TEMPLATES).map(([roleKey, role]) => (
            <TabsContent key={roleKey} value={roleKey} className="space-y-6">
              {/* Role Header */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{role.name}</CardTitle>
                      <CardDescription>{role.description}</CardDescription>
                    </div>
                    <div className="text-right">
                      <Badge>{role.userType}</Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t">
                    <div>
                      <p className="text-xs text-gray-500">Data Visibility</p>
                      <p className="text-sm font-semibold">
                        {role.dataVisibility}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Can Approve</p>
                      <p className="text-sm font-semibold">
                        {role.canApproveOrders ? "Yes" : "No"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Approval Limit</p>
                      <p className="text-sm font-semibold">
                        ₹{role.approvalLimit.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Assigned Users</p>
                      <p className="text-sm font-semibold">
                        {getUserCountByRole(roleKey as RoleTemplateKey)}
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Permission Matrix */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Module Permissions</CardTitle>
                  <CardDescription>
                    Click columns for each action: View, Create, Edit, Delete,
                    Approve, Export
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-48 sticky left-0 bg-white z-10">
                          Module
                        </TableHead>
                        <TableHead className="text-center w-16">View</TableHead>
                        <TableHead className="text-center w-16">
                          Create
                        </TableHead>
                        <TableHead className="text-center w-16">Edit</TableHead>
                        <TableHead className="text-center w-16">
                          Delete
                        </TableHead>
                        <TableHead className="text-center w-16">
                          Approve
                        </TableHead>
                        <TableHead className="text-center w-16">
                          Export
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {AVAILABLE_MODULES.map((module) => {
                        const permissions = (role.permissions[
                          module.id as keyof typeof role.permissions
                        ] || []) as readonly PermissionAction[];
                        const actions: PermissionAction[] = [
                          "view",
                          "create",
                          "edit",
                          "delete",
                          "approve",
                          "export",
                        ];

                        return (
                          <TableRow key={module.id}>
                            <TableCell className="font-medium sticky left-0 bg-white z-10">
                              <div>
                                <p>{module.name}</p>
                                <p className="text-xs text-gray-500">
                                  {module.description}
                                </p>
                              </div>
                            </TableCell>
                            {actions.map((action) => (
                              <TableCell key={action} className="text-center">
                                {permissions.includes(action) ? (
                                  <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-gray-300 mx-auto" />
                                )}
                              </TableCell>
                            ))}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Permission Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {AVAILABLE_MODULES.map((module) => {
                      const permissions =
                        role.permissions[
                          module.id as keyof typeof role.permissions
                        ] || [];
                      return (
                        <div key={module.id} className="p-3 border rounded">
                          <p className="font-semibold text-sm">{module.name}</p>
                          {permissions.length > 0 ? (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {permissions.map((perm) => (
                                <Badge
                                  key={perm}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {perm}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400 mt-2">
                              No access
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        {/* Role Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Role Comparison</CardTitle>
            <CardDescription>
              Side-by-side comparison of different roles
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">Aspect</TableHead>
                  {Object.entries(ROLE_TEMPLATES)
                    .slice(0, 4)
                    .map(([key, role]) => (
                      <TableHead key={key} className="text-center">
                        {role.name}
                      </TableHead>
                    ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-semibold">User Type</TableCell>
                  {Object.entries(ROLE_TEMPLATES)
                    .slice(0, 4)
                    .map(([key, role]) => (
                      <TableCell key={key} className="text-center text-sm">
                        {role.userType}
                      </TableCell>
                    ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-semibold">
                    Approval Limit
                  </TableCell>
                  {Object.entries(ROLE_TEMPLATES)
                    .slice(0, 4)
                    .map(([key, role]) => (
                      <TableCell key={key} className="text-center text-sm">
                        ₹{role.approvalLimit.toLocaleString()}
                      </TableCell>
                    ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-semibold">
                    Data Visibility
                  </TableCell>
                  {Object.entries(ROLE_TEMPLATES)
                    .slice(0, 4)
                    .map(([key, role]) => (
                      <TableCell key={key} className="text-center text-sm">
                        {role.dataVisibility}
                      </TableCell>
                    ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-semibold">
                    Modules Accessible
                  </TableCell>
                  {Object.entries(ROLE_TEMPLATES)
                    .slice(0, 4)
                    .map(([key, role]) => (
                      <TableCell key={key} className="text-center text-sm">
                        {Object.keys(role.permissions).length}
                      </TableCell>
                    ))}
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Best Practices */}
        <Card>
          <CardHeader>
            <CardTitle>RBAC Best Practices</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>
                  Assign least privilege - users get only necessary permissions
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Regular audits - review permissions quarterly</span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>
                  Separation of duties - critical actions need approvals
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>
                  Clear role definitions - roles should match job functions
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>
                  Monitor high-risk actions - export and delete operations
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
