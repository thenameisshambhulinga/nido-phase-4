import { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { usePageMeta } from "@/contexts/PageMetaContext";
import { ArrowLeft, Mail, Phone, ShieldCheck, UserCircle2 } from "lucide-react";

import { useEnhancedAuth } from "@/contexts/EnhancedAuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function NidoUserProfilePage() {
  const { setMeta } = usePageMeta();
  useEffect(() => { setMeta({ title: "User Profile" }); }, []);

  const navigate = useNavigate();
  const { userId } = useParams();
  const { users } = useEnhancedAuth();
  const [activeTab, setActiveTab] = useState("overview");

  const profile = useMemo(
    () => users.find((entry) => entry.id === userId),
    [users, userId],
  );

  if (!profile) {
    return (
      <div>
                <div className="p-6">
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Profile not found.
              <div className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => navigate("/users/management")}
                >
                  Back to Users
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const initials = profile.fullName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div>
            <div className="space-y-6 p-6 animate-fade-in">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/users/management")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <p className="text-xs text-muted-foreground">
                Configuration / Nido Users / Users / Profile
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-semibold tracking-tight">
                  {profile.fullName}
                </h1>
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                  {profile.status}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button className="gap-2">
              <Mail className="h-4 w-4" />
              Email
            </Button>
            <Button variant="outline" className="gap-2">
              <Phone className="h-4 w-4" />
              Call
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                User ID
              </p>
              <p className="mt-2 text-2xl font-semibold">
                {profile.employeeId || profile.id}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Role
              </p>
              <p className="mt-2 text-2xl font-semibold">
                {profile.roleTemplate.replace(/_/g, " ")}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Status
              </p>
              <p className="mt-2 text-2xl font-semibold text-emerald-700">
                {profile.status}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="h-auto w-full justify-start gap-2 overflow-x-auto bg-transparent p-0">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
            <TabsTrigger value="approval">Approval Authority</TabsTrigger>
            <TabsTrigger value="reporting">Reporting</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent
            value="overview"
            className="mt-4 grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]"
          >
            <Card className="overflow-hidden">
              <div className="h-24 bg-[linear-gradient(135deg,#0f172a_0%,#0ea5e9_100%)]" />
              <CardContent className="space-y-4 p-5 -mt-10">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/60 bg-white text-2xl font-semibold text-slate-900 shadow-lg">
                  {initials}
                </div>
                <div>
                  <p className="text-lg font-semibold">{profile.fullName}</p>
                  <p className="text-sm text-muted-foreground">
                    {profile.jobTitle || "Nido Employee"}
                  </p>
                </div>
                <Badge variant="secondary" className="w-fit">
                  {profile.roleTemplate.replace(/_/g, " ")}
                </Badge>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>{profile.email}</p>
                  <p>{profile.phone || "-"}</p>
                  <p>{profile.department || "General"}</p>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Professional Info</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 text-sm md:grid-cols-2">
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p>{profile.email}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Phone</p>
                    <p>{profile.phone || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Department</p>
                    <p>{profile.department || "General"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">User Type</p>
                    <p>{profile.userType}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Access Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" /> Permission hierarchy
                    enabled
                  </p>
                  <p className="flex items-center gap-2">
                    <UserCircle2 className="h-4 w-4" /> Reporting structure
                    mapped
                  </p>
                  <p>Approval limit: {profile.approvalLimit || 0}</p>
                  <p>
                    Can approve orders:{" "}
                    {profile.canApproveOrders ? "Yes" : "No"}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="permissions" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Module Access</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Module</TableHead>
                      <TableHead>Access Level</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      "Dashboard",
                      "Orders",
                      "Shop",
                      "Catalog",
                      "Configuration",
                    ].map((module) => (
                      <TableRow key={module}>
                        <TableCell>{module}</TableCell>
                        <TableCell>Role-based</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="approval" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Approval Authority</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Role template: {profile.roleTemplate}. Approval policies are
                enforced through role-based controls.
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reporting" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Reporting Structure</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Department: {profile.department || "General"}. Manager mapping
                can be configured from user management forms.
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Internal Activity</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Last login: {profile.lastLogin || "No login recorded"}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
