import { useState } from "react";
import Header from "@/components/layout/Header";
import { useEnhancedAuth } from "@/contexts/EnhancedAuthContext";
import { ROLE_TEMPLATES, RoleTemplateKey, UserType } from "@/lib/permissions";
import { UserInvitation } from "@/lib/userManagementTypes";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Mail,
  Copy,
  RotateCw,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function UserInvitationPage() {
  const { inviteUser, getInvitations, resendInvitation, departments, users } =
    useEnhancedAuth();

  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<RoleTemplateKey>("employee");
  const [inviteUserType, setInviteUserType] =
    useState<UserType>("Internal User");
  const [inviteDept, setInviteDept] = useState("");

  const invitations = getInvitations();

  // Categorize invitations
  const pendingInvitations = invitations.filter(
    (inv) => inv.status === "pending",
  );
  const acceptedInvitations = invitations.filter(
    (inv) => inv.status === "accepted",
  );
  const expiredInvitations = invitations.filter(
    (inv) => inv.status === "expired",
  );

  const handleSendInvite = async () => {
    if (!inviteEmail) {
      toast({ title: "Error", description: "Email required" });
      return;
    }

    // Check if user already exists
    if (users.some((u) => u.email === inviteEmail)) {
      toast({
        title: "Error",
        description: "User with this email already exists",
      });
      return;
    }

    const result = await inviteUser(
      inviteEmail,
      inviteRole,
      inviteUserType,
      inviteDept || undefined,
    );

    if (result.success) {
      toast({
        title: "Invitation sent",
        description: `Invitation sent to ${inviteEmail}`,
      });
      setShowInviteDialog(false);
      setInviteEmail("");
      setInviteRole("employee");
      setInviteUserType("Internal User");
      setInviteDept("");
    }
  };

  const handleResendInvite = async (invitationId: string) => {
    const success = await resendInvitation(invitationId);
    if (success) {
      toast({ title: "Invitation resent successfully" });
    }
  };

  const copyInviteLink = (invitationId: string) => {
    const link = `${window.location.origin}/onboarding/${invitationId}`;
    navigator.clipboard.writeText(link);
    toast({ title: "Invitation link copied to clipboard" });
  };

  const getStatusBadge = (status: UserInvitation["status"]) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-blue-100 text-blue-800 gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      case "accepted":
        return (
          <Badge className="bg-green-100 text-green-800 gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Accepted
          </Badge>
        );
      case "expired":
        return (
          <Badge className="bg-red-100 text-red-800 gap-1">
            <AlertCircle className="h-3 w-3" />
            Expired
          </Badge>
        );
    }
  };

  const isExpired = (invitation: UserInvitation) => {
    return new Date(invitation.expiresAt) < new Date();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header title="User Invitation & Onboarding" />

      <div className="p-6 space-y-6">
        {/* Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Pending Invites
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {pendingInvitations.length}
              </div>
              <p className="text-xs text-gray-500 mt-1">Awaiting acceptance</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Accepted</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {acceptedInvitations.length}
              </div>
              <p className="text-xs text-gray-500 mt-1">Activated accounts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Expired</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {expiredInvitations.length}
              </div>
              <p className="text-xs text-gray-500 mt-1">Need resending</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Total Active Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {users.filter((u) => u.status === "Active").length}
              </div>
              <p className="text-xs text-gray-500 mt-1">In the system</p>
            </CardContent>
          </Card>
        </div>

        {/* Send Invitation */}
        <div className="flex justify-end">
          <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Mail className="h-4 w-4" />
                Send Invitation
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Send User Invitation</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label>Email Address *</Label>
                  <Input
                    type="email"
                    placeholder="user@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>User Type *</Label>
                    <Select
                      value={inviteUserType}
                      onValueChange={(v) => setInviteUserType(v as UserType)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Internal User">
                          Internal User
                        </SelectItem>
                        <SelectItem value="Client User">Client User</SelectItem>
                        <SelectItem value="Vendor User">Vendor User</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Role Assignment *</Label>
                    <Select
                      value={inviteRole}
                      onValueChange={(v) => setInviteRole(v as RoleTemplateKey)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ROLE_TEMPLATES).map(
                          ([key, role]) =>
                            role.userType === inviteUserType && (
                              <SelectItem key={key} value={key}>
                                {role.name}
                              </SelectItem>
                            ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {inviteUserType === "Internal User" && (
                  <div>
                    <Label>Department</Label>
                    <Select value={inviteDept} onValueChange={setInviteDept}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
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
                )}

                {/* Role Description */}
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-4">
                    <p className="text-sm">
                      <strong>
                        {ROLE_TEMPLATES[inviteRole as RoleTemplateKey].name}
                      </strong>
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {
                        ROLE_TEMPLATES[inviteRole as RoleTemplateKey]
                          .description
                      }
                    </p>
                  </CardContent>
                </Card>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowInviteDialog(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSendInvite}>Send Invitation</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending">
              Pending ({pendingInvitations.length})
            </TabsTrigger>
            <TabsTrigger value="accepted">
              Accepted ({acceptedInvitations.length})
            </TabsTrigger>
            <TabsTrigger value="expired">
              Expired ({expiredInvitations.length})
            </TabsTrigger>
          </TabsList>

          {/* Pending Tab */}
          <TabsContent value="pending" className="space-y-4">
            {pendingInvitations.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-gray-500">
                  No pending invitations
                </CardContent>
              </Card>
            ) : (
              <Card className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>User Type</TableHead>
                      <TableHead>Sent Date</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingInvitations.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell>{inv.email}</TableCell>
                        <TableCell>{ROLE_TEMPLATES[inv.role].name}</TableCell>
                        <TableCell>{inv.userType}</TableCell>
                        <TableCell>
                          {new Date(inv.sentAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {new Date(inv.expiresAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {isExpired(inv) ? (
                            <Badge className="bg-red-100 text-red-800">
                              Expired
                            </Badge>
                          ) : (
                            <Badge className="bg-blue-100 text-blue-800">
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyInviteLink(inv.id)}
                            title="Copy invitation link"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResendInvite(inv.id)}
                            disabled={!isExpired(inv)}
                          >
                            <RotateCw className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>

          {/* Accepted Tab */}
          <TabsContent value="accepted" className="space-y-4">
            {acceptedInvitations.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-gray-500">
                  No accepted invitations
                </CardContent>
              </Card>
            ) : (
              <Card className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>User Type</TableHead>
                      <TableHead>Sent Date</TableHead>
                      <TableHead>Accepted Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {acceptedInvitations.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell>{inv.email}</TableCell>
                        <TableCell>{ROLE_TEMPLATES[inv.role].name}</TableCell>
                        <TableCell>{inv.userType}</TableCell>
                        <TableCell>
                          {new Date(inv.sentAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {inv.acceptedAt
                            ? new Date(inv.acceptedAt).toLocaleDateString()
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-800">
                            Activated
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>

          {/* Expired Tab */}
          <TabsContent value="expired" className="space-y-4">
            {expiredInvitations.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-gray-500">
                  No expired invitations
                </CardContent>
              </Card>
            ) : (
              <Card className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Sent Date</TableHead>
                      <TableHead>Expired Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expiredInvitations.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell>{inv.email}</TableCell>
                        <TableCell>{ROLE_TEMPLATES[inv.role].name}</TableCell>
                        <TableCell>
                          {new Date(inv.sentAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {new Date(inv.expiresAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResendInvite(inv.id)}
                          >
                            <RotateCw className="h-4 w-4 mr-1" />
                            Resend
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Information Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-sm">How User Invitations Work</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <strong>1. Send Invitation:</strong> You create an invitation for
              a new user by providing their email, role, and department.
            </p>
            <p>
              <strong>2. Invitation Email:</strong> An invitation link is sent
              to their email with instructions to activate their account (valid
              for 7 days).
            </p>
            <p>
              <strong>3. User Activation:</strong> The user clicks the link,
              sets their password, and logs in with their new account.
            </p>
            <p>
              <strong>4. Access Control:</strong> Their permissions are
              automatically applied based on their assigned role. They can only
              access modules their role allows.
            </p>
            <p>
              <strong>5. Audit Trail:</strong> All user actions are logged for
              compliance and security auditing.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
