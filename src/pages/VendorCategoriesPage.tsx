import { useState } from "react";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Settings,
  Shield,
  Zap,
  Package,
  Layers,
  Tags,
  Download,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

const APPROVAL_WORKFLOWS = [
  "IT Service Approval",
  "Facility Service Approval",
  "No Approval Required",
  "Maintenance Approval",
  "Construction Approval",
];
const SLA_TEMPLATES = [
  "IT SLA Template",
  "Default SLA",
  "Equipment SLA",
  "Custom SLA",
  "Facility Service SLA",
  "None",
];

export default function VendorCategoriesPage() {
  const {
    vendorCategories,
    addVendorCategory,
    updateVendorCategory,
    deleteVendorCategory,
    vendors,
  } = useData();
  const { isOwner } = useAuth();
  const [search, setSearch] = useState("");
  const [workflowFilter, setWorkflowFilter] = useState("all");
  const [slaFilter, setSlaFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    code: "",
    description: "",
    approvalRequired: false,
    slaTemplate: "Standard",
    notes: "",
  });

  const filtered = vendorCategories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );
  const getActiveVendors = (categoryName: string) =>
    vendors.filter((v) => v.category === categoryName && v.status === "active")
      .length;

  const handleCreate = () => {
    addVendorCategory({ ...form, status: "active", vendorCount: 0 });
    setShowCreate(false);
    setForm({
      name: "",
      code: "",
      description: "",
      approvalRequired: false,
      slaTemplate: "Standard",
      notes: "",
    });
    toast({ title: "Category Created" });
  };

  const handleEdit = (cat: (typeof vendorCategories)[0]) => {
    setEditId(cat.id);
    setForm({
      name: cat.name,
      code: cat.code,
      description: cat.description,
      approvalRequired: cat.approvalRequired,
      slaTemplate: cat.slaTemplate,
      notes: "",
    });
    setShowEdit(true);
  };

  const handleSaveEdit = () => {
    if (!editId) return;
    updateVendorCategory(editId, form);
    setShowEdit(false);
    setEditId(null);
    setForm({
      name: "",
      code: "",
      description: "",
      approvalRequired: false,
      slaTemplate: "Standard",
      notes: "",
    });
    toast({ title: "Category Updated" });
  };

  const categoryFormFields = (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Category Name *</Label>
          <Input
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="e.g. IT Services"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Code</Label>
          <Input
            value={form.code}
            onChange={(e) =>
              setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))
            }
            placeholder="e.g. ITS"
            maxLength={5}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Description</Label>
        <Textarea
          value={form.description}
          onChange={(e) =>
            setForm((p) => ({ ...p, description: e.target.value }))
          }
          placeholder="Detailed category description..."
          rows={3}
        />
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-semibold">SLA Template</Label>
        <Select
          value={form.slaTemplate}
          onValueChange={(v) => setForm((p) => ({ ...p, slaTemplate: v }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SLA_TEMPLATES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/30 border border-border">
        <Switch
          checked={form.approvalRequired}
          onCheckedChange={(v) =>
            setForm((p) => ({ ...p, approvalRequired: v }))
          }
        />
        <div>
          <Label className="text-sm font-semibold">Approval Required</Label>
          <p className="text-xs text-muted-foreground">
            Enable multi-level approval workflow for this category
          </p>
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Notes</Label>
        <Textarea
          value={form.notes}
          onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
          placeholder="Additional notes..."
          rows={2}
        />
      </div>
    </div>
  );

  return (
    <div>
      <Header title="Vendor Categories" />
      <div className="p-6 space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">
              Configuration / Vendor Categories
            </p>
            <h1 className="text-2xl font-display font-bold">
              Vendor Categories
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => alert("Exporting...")}
            >
              <Download className="h-4 w-4" /> Export
            </Button>
            <Button
              size="sm"
              className="gap-2"
              disabled={!isOwner}
              onClick={() => setShowCreate(true)}
            >
              <Plus className="h-4 w-4" /> Add Category
            </Button>
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          <Select value={workflowFilter} onValueChange={setWorkflowFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All Vendors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Vendors</SelectItem>
            </SelectContent>
          </Select>
          <Select value={slaFilter} onValueChange={setSlaFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Approval Workflow" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Workflows</SelectItem>
              {APPROVAL_WORKFLOWS.map((w) => (
                <SelectItem key={w} value={w}>
                  {w}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select defaultValue="all">
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Default SLA Template" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All SLA Templates</SelectItem>
              {SLA_TEMPLATES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative flex-1 max-w-xs ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category Name</TableHead>
                  <TableHead>Vendor Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Approval Workflow</TableHead>
                  <TableHead>Default SLA Template</TableHead>
                  <TableHead>Active Vendors</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{cat.name}</span>
                        {cat.approvalRequired && (
                          <Badge variant="outline" className="text-[10px]">
                            Approval
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {cat.code || "-"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-48 truncate">
                      {cat.description}
                    </TableCell>
                    <TableCell className="text-sm">
                      {cat.approvalRequired
                        ? APPROVAL_WORKFLOWS[
                            filtered.indexOf(cat) % APPROVAL_WORKFLOWS.length
                          ]
                        : "No Approval Required"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{cat.slaTemplate}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {getActiveVendors(cat.name)}
                        </span>
                        <div className="flex -space-x-1">
                          {[
                            ...Array(Math.min(3, getActiveVendors(cat.name))),
                          ].map((_, i) => (
                            <div
                              key={i}
                              className="h-5 w-5 rounded-full bg-primary/20 border border-background"
                            />
                          ))}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-success text-success-foreground">
                        {cat.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleEdit(cat)}
                          disabled={!isOwner}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => {
                            deleteVendorCategory(cat.id);
                            toast({ title: "Deleted" });
                          }}
                          disabled={!isOwner}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="text-xs text-muted-foreground">
          1 — {filtered.length} of {vendorCategories.length}
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Category Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                title: "Manage Approval Paths",
                desc: "Configure category-specific approval workflows.",
                icon: Settings,
              },
              {
                title: "Role Hierarchy & Permissions",
                desc: "Set roles and permissions for vendor categories.",
                icon: Shield,
              },
              {
                title: "Auto Assignment Logic",
                desc: "Define auto vendor assignment rules.",
                icon: Zap,
              },
              {
                title: "Update Vendor Products",
                desc: "Manage products offered by vendors.",
                icon: Package,
              },
              {
                title: "Category Settings",
                desc: "Edit-manage products by vendors.",
                icon: Layers,
              },
              {
                title: "Category Tags",
                desc: "Manage tags for vendor classification.",
                icon: Tags,
              },
            ].map((card, i) => (
              <Card
                key={i}
                className="cursor-pointer hover:shadow-md transition-shadow hover:border-primary/30"
              >
                <CardContent className="p-5 flex items-start gap-3">
                  <div className="p-2.5 rounded-lg bg-primary/10">
                    <card.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{card.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {card.desc}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Create Dialog */}
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Tags className="h-5 w-5 text-primary" /> Add Vendor Category
              </DialogTitle>
              <DialogDescription>
                Create a new category to classify your vendors
              </DialogDescription>
            </DialogHeader>
            {categoryFormFields}
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!form.name}>
                Create Category
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={showEdit} onOpenChange={setShowEdit}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5 text-primary" /> Edit Category
              </DialogTitle>
              <DialogDescription>
                Update category details, SLA templates, and approval settings
              </DialogDescription>
            </DialogHeader>
            {categoryFormFields}
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" onClick={() => setShowEdit(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit}>Save Changes</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
