import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Pencil,
  Trash2,
  Search,
  Star,
  Download,
  Upload,
  Eye,
  FileSpreadsheet,
  Building2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import BulkUploadModal from "@/components/shared/BulkUploadModal";
import ConfirmationDialog from "@/components/shared/ConfirmationDialog";
import { downloadVendorTemplate } from "@/lib/templateUtils";
import type { BulkUploadResult } from "@/lib/templateUtils";
import { nextSequentialCode } from "@/lib/documentNumbering";
import { API } from "../api.js";
import type { Vendor } from "@/contexts/DataContext";

export default function VendorsPage() {
  const {
    addVendor,
    updateVendor,
    deleteVendor,
    addAuditEntry,
    generalSettings,
  } = useData();
  const { isOwner, user } = useAuth();
  const navigate = useNavigate();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const vendorCodePrefix =
    Object.values(generalSettings)[0]?.vendorCodePrefix?.trim() || "VND";
  const generateVendorCode = () =>
    nextSequentialCode(
      vendorCodePrefix,
      vendors.map((vendor) => vendor.vendorCode),
      5,
    );
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    vendorCode: generateVendorCode(),
    category: "IT Hardware",
    contactEmail: "",
    contactPhone: "",
    address: "",
    description: "",
  });

  useEffect(() => {
    const fetchVendors = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const response = await API.getVendors();
        const normalized = (Array.isArray(response) ? response : []).map(
          (vendor: any) => ({
            id: vendor._id || vendor.id || `ven-${Date.now()}`,
            vendorId:
              vendor.vendorId || vendor.vendorCode || vendor._id || vendor.id,
            vendorCode: vendor.vendorCode || "",
            name:
              vendor.companyName ||
              vendor.vendorName ||
              vendor.name ||
              "Unnamed Vendor",
            category: vendor.category || "General",
            contactEmail:
              vendor.email || vendor.contactEmail || vendor.contact || "",
            contactPhone: vendor.phone || vendor.contactPhone || "",
            address: vendor.address || "",
            status:
              vendor.status === "inactive"
                ? "inactive"
                : vendor.status === "suspended"
                  ? "pending"
                  : "active",
            rating: Number(vendor.rating) || 0,
            totalOrders: Number(vendor.totalOrders) || 0,
            totalSpend: Number(vendor.totalSpend) || 0,
            joinDate: vendor.createdAt
              ? new Date(vendor.createdAt).toISOString().split("T")[0]
              : new Date().toISOString().split("T")[0],
          }),
        );
        setVendors(normalized);
      } catch (error) {
        console.error("Failed to fetch vendors from API:", error);
        setLoadError(
          error instanceof Error ? error.message : "Failed to load vendors",
        );
      } finally {
        setLoading(false);
      }
    };

    void fetchVendors();
  }, []);

  useEffect(() => {
    if (showCreate || showEdit) return;
    setForm((prev) => ({ ...prev, vendorCode: generateVendorCode() }));
  }, [showCreate, showEdit, vendors, vendorCodePrefix]);

  const filtered = vendors.filter((v) => {
    const matchSearch =
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.contactEmail.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || v.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const refreshVendors = async () => {
    try {
      const response = await API.getVendors();
      const normalized = (Array.isArray(response) ? response : []).map(
        (vendor: any) => ({
          id: vendor._id || vendor.id || `ven-${Date.now()}`,
          vendorId:
            vendor.vendorId || vendor.vendorCode || vendor._id || vendor.id,
          vendorCode: vendor.vendorCode || "",
          name:
            vendor.companyName ||
            vendor.vendorName ||
            vendor.name ||
            "Unnamed Vendor",
          category: vendor.category || "General",
          contactEmail:
            vendor.email || vendor.contactEmail || vendor.contact || "",
          contactPhone: vendor.phone || vendor.contactPhone || "",
          address: vendor.address || "",
          status:
            vendor.status === "inactive"
              ? "inactive"
              : vendor.status === "suspended"
                ? "pending"
                : "active",
          rating: Number(vendor.rating) || 0,
          totalOrders: Number(vendor.totalOrders) || 0,
          totalSpend: Number(vendor.totalSpend) || 0,
          joinDate: vendor.createdAt
            ? new Date(vendor.createdAt).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
        }),
      );
      setVendors(normalized);
    } catch (error) {
      console.error("Failed to refresh vendors:", error);
    }
  };

  const handleCreate = async () => {
    await Promise.resolve(
      addVendor({
        ...form,
        status: "pending",
        rating: 0,
        totalOrders: 0,
        totalSpend: 0,
        joinDate: new Date().toISOString().split("T")[0],
      }),
    );
    addAuditEntry({
      user: user?.name || "System",
      action: "Vendor Created",
      module: "Vendors",
      details: `Created vendor: ${form.name}`,
      ipAddress: "192.168.1.1",
      status: "success",
    });
    await refreshVendors();
    setShowCreate(false);
    setForm({
      name: "",
      vendorCode: generateVendorCode(),
      category: "IT Hardware",
      contactEmail: "",
      contactPhone: "",
      address: "",
      description: "",
    });
    toast({
      title: "Vendor Added",
      description: `${form.name} has been registered.`,
    });
  };

  const handleEdit = (v: (typeof vendors)[0]) => {
    setEditId(v.id);
    setForm({
      name: v.name,
      vendorCode: v.vendorCode || "",
      category: v.category,
      contactEmail: v.contactEmail,
      contactPhone: v.contactPhone,
      address: v.address,
      description: "",
    });
    setShowEdit(true);
  };

  const handleSaveEdit = async () => {
    if (!editId) return;
    await Promise.resolve(
      updateVendor(editId, {
        name: form.name,
        category: form.category,
        contactEmail: form.contactEmail,
        contactPhone: form.contactPhone,
        address: form.address,
      }),
    );
    addAuditEntry({
      user: user?.name || "System",
      action: "Vendor Updated",
      module: "Vendors",
      details: `Updated vendor: ${form.name}`,
      ipAddress: "192.168.1.1",
      status: "success",
    });
    await refreshVendors();
    setShowEdit(false);
    setEditId(null);
    setForm({
      name: "",
      vendorCode: generateVendorCode(),
      category: "IT Hardware",
      contactEmail: "",
      contactPhone: "",
      address: "",
      description: "",
    });
    toast({ title: "Vendor Updated" });
  };

  const handleDelete = async (v: (typeof vendors)[number]) => {
    await Promise.resolve(deleteVendor(v.id));
    addAuditEntry({
      user: user?.name || "System",
      action: "Vendor Deleted",
      module: "Vendors",
      details: `Deleted vendor: ${v.name}`,
      ipAddress: "192.168.1.1",
      status: "success",
    });
    await refreshVendors();
    toast({ title: "Vendor Deleted" });
  };

  const handleBulkSuccess = async (results: BulkUploadResult) => {
    for (const rec of results.records) {
      await Promise.resolve(
        addVendor({
          name: rec.company_name,
          category: rec.category || "IT Hardware",
          contactEmail: rec.email,
          contactPhone: rec.phone,
          address: [
            rec.billing_address,
            rec.billing_city,
            rec.billing_state,
            rec.billing_pincode,
          ]
            .filter(Boolean)
            .join(", "),
          status: "pending",
          rating: 0,
          totalOrders: 0,
          totalSpend: 0,
          joinDate: new Date().toISOString().split("T")[0],
        }),
      );
    }
    addAuditEntry({
      user: user?.name || "System",
      action: "Bulk Vendor Import",
      module: "Vendors",
      details: `Imported ${results.created} vendors`,
      ipAddress: "192.168.1.1",
      status: "success",
    });
    await refreshVendors();
    toast({
      title: "Bulk Import Complete",
      description: `${results.created} created, ${results.skipped} skipped`,
    });
  };

  const handleExportCSV = () => {
    const headers = [
      "Vendor ID",
      "Name",
      "Category",
      "Email",
      "Phone",
      "Rating",
      "Orders",
      "Total Spend",
      "Status",
    ];
    const rows = filtered.map((v) => [
      v.vendorId || v.vendorCode || v.id,
      v.name,
      v.category,
      v.contactEmail,
      v.contactPhone,
      v.rating,
      v.totalOrders,
      v.totalSpend,
      v.status,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vendors.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported" });
  };

  const vendorFormFields = (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Vendor Name *</Label>
          <Input
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="Company legal name"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Vendor Code</Label>
          <Input
            value={form.vendorCode}
            onChange={(e) =>
              setForm((p) => ({ ...p, vendorCode: e.target.value }))
            }
            placeholder="Auto generated"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Category *</Label>
          <Select
            value={form.category}
            onValueChange={(v) => setForm((p) => ({ ...p, category: v }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[
                "IT Hardware",
                "Office Supplies",
                "Cloud Services",
                "Security Systems",
                "Consulting",
                "Facility Maintenance",
                "Logistics",
                "Construction",
                "Cleaning Services",
              ].map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Contact Email *</Label>
          <Input
            type="email"
            value={form.contactEmail}
            onChange={(e) =>
              setForm((p) => ({ ...p, contactEmail: e.target.value }))
            }
            placeholder="vendor@company.com"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Phone *</Label>
          <Input
            value={form.contactPhone}
            onChange={(e) =>
              setForm((p) => ({ ...p, contactPhone: e.target.value }))
            }
            placeholder="+91 98765 43210"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Address</Label>
        <Input
          value={form.address}
          onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
          placeholder="Street address, City, State"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Description</Label>
        <Textarea
          value={form.description}
          onChange={(e) =>
            setForm((p) => ({ ...p, description: e.target.value }))
          }
          placeholder="Brief description of vendor services..."
          rows={3}
        />
      </div>
    </div>
  );

  return (
    <div>
      <Header title="Vendors" />
      <div className="p-6 space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-display font-bold">Vendor Management</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleExportCSV}
            >
              <Download className="h-4 w-4" /> Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => downloadVendorTemplate()}
            >
              <FileSpreadsheet className="h-4 w-4" /> Template
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setShowBulkUpload(true)}
            >
              <Upload className="h-4 w-4" /> Bulk Import
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => navigate("/vendors/onboarding")}
            >
              <Upload className="h-4 w-4" /> Onboard
            </Button>
            <Button
              size="sm"
              className="gap-2"
              onClick={() => setShowCreate(true)}
            >
              <Plus className="h-4 w-4" /> Add Vendor
            </Button>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search vendors..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor ID</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Total Spend</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Loading vendors from MongoDB...
                    </TableCell>
                  </TableRow>
                ) : loadError ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center py-8 text-destructive"
                    >
                      {loadError}
                    </TableCell>
                  </TableRow>
                ) : filtered.length > 0 ? (
                  filtered.map((v) => (
                    <TableRow
                      key={v.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/vendors/${v.id}`)}
                    >
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {v.vendorId || v.vendorCode || v.id}
                      </TableCell>
                      <TableCell className="font-medium text-primary">
                        {v.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {v.category}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {v.contactEmail}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-warning text-warning" />
                          {v.rating}
                        </div>
                      </TableCell>
                      <TableCell>{v.totalOrders}</TableCell>
                      <TableCell className="font-medium">
                        ${v.totalSpend.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            v.status === "active"
                              ? "bg-success text-success-foreground"
                              : v.status === "pending"
                                ? "bg-warning text-warning-foreground"
                                : ""
                          }
                        >
                          {v.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div
                          className="flex gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => navigate(`/vendors/${v.id}`)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleEdit(v)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setDeleteTargetId(v.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No vendors found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Create Dialog */}
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" /> Register New
                Vendor
              </DialogTitle>
              <DialogDescription>
                Add a new vendor to your procurement network
              </DialogDescription>
            </DialogHeader>
            {vendorFormFields}
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!form.name || !form.contactEmail}
              >
                Add Vendor
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={showEdit} onOpenChange={setShowEdit}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Pencil className="h-5 w-5 text-primary" /> Edit Vendor
              </DialogTitle>
              <DialogDescription>
                Update vendor details and contact information
              </DialogDescription>
            </DialogHeader>
            {vendorFormFields}
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" onClick={() => setShowEdit(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit}>Save Changes</Button>
            </div>
          </DialogContent>
        </Dialog>

        <BulkUploadModal
          open={showBulkUpload}
          onClose={() => setShowBulkUpload(false)}
          type="vendor"
          existingRecords={vendors.map((v) => ({
            id: v.id,
            name: v.name,
            contactEmail: v.contactEmail,
          }))}
          onSuccess={handleBulkSuccess}
        />

        <ConfirmationDialog
          open={!!deleteTargetId}
          title="Delete Vendor"
          description="Delete this vendor? This action cannot be undone."
          confirmLabel="Delete"
          tone="destructive"
          onOpenChange={(open) => {
            if (!open) setDeleteTargetId(null);
          }}
          onConfirm={() => {
            if (!deleteTargetId) return;
            const target = vendors.find((entry) => entry.id === deleteTargetId);
            if (!target) return;
            handleDelete(target);
            setDeleteTargetId(null);
          }}
        />
      </div>
    </div>
  );
}
