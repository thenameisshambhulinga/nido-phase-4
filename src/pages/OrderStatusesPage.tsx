import { useState } from "react";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Edit, Trash2, Search, GripVertical } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function OrderStatusesPage() {
  const { orderStatuses, addOrderStatus, updateOrderStatus, deleteOrderStatus } = useData();
  const { isOwner } = useAuth();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", color: "#3B82F6", description: "", isVisible: true, sortOrder: 0 });

  const filtered = orderStatuses.filter(s => s.name.toLowerCase().includes(search.toLowerCase())).sort((a, b) => a.sortOrder - b.sortOrder);

  const handleSave = () => {
    if (editId) {
      updateOrderStatus(editId, form);
      toast({ title: "Status Updated" });
    } else {
      addOrderStatus({ ...form, isDefault: false });
      toast({ title: "Status Created" });
    }
    setShowCreate(false);
    setEditId(null);
    setForm({ name: "", color: "#3B82F6", description: "", isVisible: true, sortOrder: orderStatuses.length + 1 });
  };

  const openEdit = (s: typeof orderStatuses[0]) => {
    setEditId(s.id);
    setForm({ name: s.name, color: s.color, description: s.description, isVisible: s.isVisible, sortOrder: s.sortOrder });
    setShowCreate(true);
  };

  return (
    <div>
      <Header title="Order Statuses" />
      <div className="p-6 space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold">Order Statuses</h1>
            <p className="text-sm text-muted-foreground">Manage and configure order status workflow</p>
          </div>
          <Dialog open={showCreate} onOpenChange={(v) => { setShowCreate(v); if (!v) { setEditId(null); setForm({ name: "", color: "#3B82F6", description: "", isVisible: true, sortOrder: orderStatuses.length + 1 }); } }}>
            <DialogTrigger asChild><Button size="sm" className="gap-2" disabled={!isOwner}><Plus className="h-4 w-4" /> Add Status</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editId ? "Edit" : "Add"} Order Status</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Status Name</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
                <div><Label>Color</Label><div className="flex gap-2"><Input type="color" value={form.color} onChange={e => setForm(p => ({ ...p, color: e.target.value }))} className="w-16 h-9 p-1" /><Input value={form.color} onChange={e => setForm(p => ({ ...p, color: e.target.value }))} className="flex-1" /></div></div>
                <div><Label>Description</Label><Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
                <div><Label>Sort Order</Label><Input type="number" value={form.sortOrder} onChange={e => setForm(p => ({ ...p, sortOrder: +e.target.value }))} /></div>
                <div className="flex items-center gap-2"><Switch checked={form.isVisible} onCheckedChange={v => setForm(p => ({ ...p, isVisible: v }))} /><Label>Visible</Label></div>
                <Button onClick={handleSave} className="w-full">{editId ? "Update" : "Create"} Status</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search statuses..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Status Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Sort Order</TableHead>
                  <TableHead>Visible</TableHead>
                  <TableHead>Default</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(status => (
                  <TableRow key={status.id}>
                    <TableCell><GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" /></TableCell>
                    <TableCell><div className="h-6 w-6 rounded" style={{ backgroundColor: status.color }} /></TableCell>
                    <TableCell className="font-medium">{status.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{status.description}</TableCell>
                    <TableCell className="text-sm">{status.sortOrder}</TableCell>
                    <TableCell><Switch checked={status.isVisible} onCheckedChange={v => updateOrderStatus(status.id, { isVisible: v })} disabled={!isOwner} /></TableCell>
                    <TableCell>{status.isDefault && <Badge variant="outline" className="text-xs">Default</Badge>}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(status)} disabled={!isOwner}><Edit className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { deleteOrderStatus(status.id); toast({ title: "Status Deleted" }); }} disabled={!isOwner || status.isDefault}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
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
