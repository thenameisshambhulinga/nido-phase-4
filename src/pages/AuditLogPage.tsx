import { useState } from "react";
import Header from "@/components/layout/Header";
import { useEnhancedAuth } from "@/contexts/EnhancedAuthContext";
import { AuditLog } from "@/lib/userManagementTypes";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Download,
  Eye,
  Plus,
  Pencil,
  Trash2,
  LogIn,
  LogOut,
  FileText,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default function AuditLogPage() {
  const { auditLogs, getAuditLogs } = useEnhancedAuth();

  const [actionFilter, setActionFilter] = useState<string>("all");
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>("all");
  const [userFilter, setUserFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  // Get unique values for filters
  const uniqueUsers = Array.from(new Set(auditLogs.map((log) => log.userName)));
  const uniqueActions = Array.from(
    new Set(auditLogs.map((log) => log.action)),
  ) as AuditLog["action"][];
  const uniqueEntityTypes = Array.from(
    new Set(auditLogs.map((log) => log.entityType)),
  ) as AuditLog["entityType"][];

  // Filter logs
  const filteredLogs = getAuditLogs({
    action:
      actionFilter !== "all" ? (actionFilter as AuditLog["action"]) : undefined,
    entityType:
      entityTypeFilter !== "all"
        ? (entityTypeFilter as AuditLog["entityType"])
        : undefined,
    userId: userFilter !== "all" ? userFilter : undefined,
  });

  const getActionIcon = (action: AuditLog["action"]) => {
    switch (action) {
      case "login":
        return <LogIn className="h-4 w-4 text-green-600" />;
      case "logout":
        return <LogOut className="h-4 w-4 text-orange-600" />;
      case "create":
        return <Plus className="h-4 w-4 text-blue-600" />;
      case "update":
        return <Pencil className="h-4 w-4 text-yellow-600" />;
      case "delete":
        return <Trash2 className="h-4 w-4 text-red-600" />;
      case "approve":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "export":
        return <Download className="h-4 w-4 text-purple-600" />;
      default:
        return <Eye className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActionLabel = (action: AuditLog["action"]) => {
    switch (action) {
      case "login":
        return "Login";
      case "logout":
        return "Logout";
      case "create":
        return "Created";
      case "update":
        return "Updated";
      case "delete":
        return "Deleted";
      case "approve":
        return "Approved";
      case "export":
        return "Exported";
      default:
        return "Other";
    }
  };

  const getStatusBadge = (status: AuditLog["status"]) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-100 text-green-800">Success</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getEntityTypeColor = (entityType: AuditLog["entityType"]) => {
    const colors: Record<AuditLog["entityType"], string> = {
      user: "bg-blue-100 text-blue-800",
      order: "bg-purple-100 text-purple-800",
      invoice: "bg-green-100 text-green-800",
      vendor: "bg-orange-100 text-orange-800",
      client: "bg-pink-100 text-pink-800",
      role: "bg-indigo-100 text-indigo-800",
      permission: "bg-cyan-100 text-cyan-800",
    };
    return colors[entityType] || "bg-gray-100 text-gray-800";
  };

  const handleExportLogs = () => {
    const csv = [
      ["Timestamp", "User", "Action", "Entity Type", "Entity ID", "Status"],
      ...filteredLogs.map((log) => [
        new Date(log.timestamp).toLocaleString(),
        log.userName,
        log.action,
        log.entityType,
        log.entityId,
        log.status,
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header title="Audit Trail & Activity Log" />

      <div className="p-6 space-y-6">
        {/* Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Total Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{auditLogs.length}</div>
              <p className="text-xs text-gray-500 mt-1">Tracked activities</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Logins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {auditLogs.filter((log) => log.action === "login").length}
              </div>
              <p className="text-xs text-gray-500 mt-1">User sessions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Creates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {auditLogs.filter((log) => log.action === "create").length}
              </div>
              <p className="text-xs text-gray-500 mt-1">New records</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Updates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {auditLogs.filter((log) => log.action === "update").length}
              </div>
              <p className="text-xs text-gray-500 mt-1">Modified records</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Deletes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {auditLogs.filter((log) => log.action === "delete").length}
              </div>
              <p className="text-xs text-gray-500 mt-1">Deleted records</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Filter & Search</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">User</Label>
                <Select value={userFilter} onValueChange={setUserFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All users" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All users</SelectItem>
                    {uniqueUsers.map((user) => (
                      <SelectItem key={user} value={user}>
                        {user}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-gray-500 mb-1 block">
                  Action
                </Label>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    {uniqueActions.map((action) => (
                      <SelectItem key={action} value={action}>
                        {getActionLabel(action as AuditLog["action"])}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-gray-500 mb-1 block">
                  Entity Type
                </Label>
                <Select
                  value={entityTypeFilter}
                  onValueChange={setEntityTypeFilter}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {uniqueEntityTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={handleExportLogs}
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Action</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead className="w-24">Type</TableHead>
                <TableHead className="w-16">Status</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-gray-500"
                  >
                    No audit logs found
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.slice(0, 50).map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{getActionIcon(log.action)}</TableCell>
                    <TableCell className="text-sm">
                      {new Date(log.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-medium">
                      {log.userName}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{log.entityName}</p>
                        <p className="text-xs text-gray-500">{log.entityId}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getEntityTypeColor(log.entityType)}>
                        {log.entityType}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(log.status)}</TableCell>
                    <TableCell>
                      <Dialog
                        open={showDetailsDialog && selectedLog?.id === log.id}
                        onOpenChange={setShowDetailsDialog}
                      >
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedLog(log)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Activity Details</DialogTitle>
                          </DialogHeader>

                          <div className="space-y-4 max-h-96 overflow-y-auto">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <p className="text-gray-500">Timestamp</p>
                                <p className="font-semibold">
                                  {new Date(log.timestamp).toLocaleString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500">User</p>
                                <p className="font-semibold">{log.userName}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Action</p>
                                <p className="font-semibold">
                                  {getActionLabel(log.action)}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500">Entity Type</p>
                                <p className="font-semibold">
                                  {log.entityType}
                                </p>
                              </div>
                            </div>

                            <div>
                              <p className="text-gray-500 text-sm">
                                Entity Info
                              </p>
                              <p className="font-semibold">{log.entityName}</p>
                              <p className="text-xs text-gray-500">
                                {log.entityId}
                              </p>
                            </div>

                            {log.details && (
                              <div className="bg-gray-50 p-3 rounded text-sm">
                                <p className="text-gray-500 mb-1">Details</p>
                                <p>{log.details}</p>
                              </div>
                            )}

                            {log.changes && log.changes.length > 0 && (
                              <div className="bg-gray-50 p-3 rounded text-sm">
                                <p className="text-gray-500 mb-2">Changes</p>
                                <div className="space-y-2">
                                  {log.changes.map((change, idx) => (
                                    <div key={idx}>
                                      <p className="font-medium">
                                        {change.fieldName}
                                      </p>
                                      <p className="text-xs text-red-600">
                                        from: {String(change.oldValue)}
                                      </p>
                                      <p className="text-xs text-green-600">
                                        to: {String(change.newValue)}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        {/* Information Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-sm">What's Tracked</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>
              <strong>User Actions:</strong> Login, logout, password changes,
              account updates
            </p>
            <p>
              <strong>Create Operations:</strong> New users, orders, invoices,
              vendors, clients
            </p>
            <p>
              <strong>Updates:</strong> Changes to any recorded data with
              before/after values
            </p>
            <p>
              <strong>Sensitive Actions:</strong> Deletions, approvals, exports,
              role changes
            </p>
            <p>
              <strong>Data:</strong> Timestamp, user, action, entity type,
              status, and detailed changes
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
