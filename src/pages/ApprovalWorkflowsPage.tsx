import { useState } from "react";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Switch } from "@/components/ui/switch";
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
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Trash2, ArrowRight, Clock, Mail } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import ConfirmationDialog from "@/components/shared/ConfirmationDialog";

export default function ApprovalWorkflowsPage() {
  const {
    approvalWorkflows,
    addApprovalWorkflow,
    updateApprovalWorkflow,
    deleteApprovalWorkflow,
  } = useData();
  const { isOwner } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    module: "Procure",
    slaHours: 24,
    escalationEmail: "",
  });

  const handleCreate = () => {
    addApprovalWorkflow({
      ...form,
      steps: [
        { role: "procurement_manager", order: 1 },
        { role: "admin", order: 2 },
      ],
      status: "active",
    });
    setShowCreate(false);
    setForm({ name: "", module: "Procure", slaHours: 24, escalationEmail: "" });
    toast({ title: "Workflow Created" });
  };

  return (
    <div>
      <Header title="Approval Workflows" />
      <div className="p-6 space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold">
              Approval Workflows
            </h1>
            <p className="text-sm text-muted-foreground">
              Configure approval chains and escalation rules
            </p>
          </div>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2" disabled={!isOwner}>
                <Plus className="h-4 w-4" /> Add Workflow
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Approval Workflow</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Workflow Name</Label>
                  <Input
                    value={form.name}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, name: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label>Module</Label>
                  <Select
                    value={form.module}
                    onValueChange={(v) => setForm((p) => ({ ...p, module: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Procure">Procure</SelectItem>
                      <SelectItem value="Vendors">Vendors</SelectItem>
                      <SelectItem value="Clients">Clients</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>SLA Hours</Label>
                  <Input
                    type="number"
                    value={form.slaHours}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, slaHours: +e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label>Escalation Email</Label>
                  <Input
                    type="email"
                    value={form.escalationEmail}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        escalationEmail: e.target.value,
                      }))
                    }
                  />
                </div>
                <Button onClick={handleCreate} className="w-full">
                  Create Workflow
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Workflow Name</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>Steps</TableHead>
                  <TableHead>SLA</TableHead>
                  <TableHead>Escalation</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvalWorkflows.map((wf) => (
                  <TableRow key={wf.id}>
                    <TableCell className="font-medium">{wf.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{wf.module}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {wf.steps.length} steps
                    </TableCell>
                    <TableCell className="text-sm">
                      <Clock className="h-3.5 w-3.5 inline mr-1" />
                      {wf.slaHours}h
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {wf.escalationEmail}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={wf.status === "active"}
                        onCheckedChange={(v) =>
                          updateApprovalWorkflow(wf.id, {
                            status: v ? "active" : "inactive",
                          })
                        }
                        disabled={!isOwner}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setDeleteTargetId(wf.id)}
                        disabled={!isOwner}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {approvalWorkflows.map((wf) => (
          <Card key={wf.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                Approver Flow: {wf.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 flex-wrap">
                {wf.steps.map((step, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-2.5 text-center">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                        Step {step.order}
                      </p>
                      <p className="text-sm font-medium capitalize">
                        {step.role.replace("_", " ")}
                      </p>
                    </div>
                    {i < wf.steps.length - 1 && (
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <div className="bg-success/10 border border-success/20 rounded-lg px-4 py-2.5 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                      Final
                    </p>
                    <p className="text-sm font-medium text-success">Approved</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>SLA: {wf.slaHours} hours</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>Escalation: {wf.escalationEmail}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ConfirmationDialog
        open={!!deleteTargetId}
        title="Delete Workflow"
        description="Delete this approval workflow? This action cannot be undone."
        confirmLabel="Delete"
        tone="destructive"
        onOpenChange={(open) => {
          if (!open) setDeleteTargetId(null);
        }}
        onConfirm={() => {
          if (!deleteTargetId) return;
          deleteApprovalWorkflow(deleteTargetId);
          toast({ title: "Workflow Deleted" });
          setDeleteTargetId(null);
        }}
      />
    </div>
  );
}
