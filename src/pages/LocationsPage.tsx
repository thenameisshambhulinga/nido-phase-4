import { useState } from "react";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useData } from "@/contexts/DataContext";
import { MapPin, Plus, Search, MoreHorizontal, Globe, Building, ChevronRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function LocationsPage() {
  const { locations, addLocation, updateLocation, deleteLocation } = useData();
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [newLoc, setNewLoc] = useState({ code: "", name: "", group: "", country: "", city: "", type: "manual" as const });

  const groups = [...new Set(locations.map(l => l.group))];
  const filtered = locations.filter(l => {
    const matchSearch = l.name.toLowerCase().includes(search.toLowerCase()) || l.code.toLowerCase().includes(search.toLowerCase());
    const matchGroup = groupFilter === "all" || l.group === groupFilter;
    return matchSearch && matchGroup;
  });

  const handleCreate = () => {
    addLocation({ ...newLoc, status: "active" });
    setShowCreate(false);
    setNewLoc({ code: "", name: "", group: "", country: "", city: "", type: "manual" });
    toast({ title: "Location Added" });
  };

  return (
    <div>
      <Header title="Locations" />
      <div className="p-6 space-y-6 animate-fade-in">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>⊙ Configuration</span><ChevronRight className="h-3 w-3" /><span className="text-foreground font-medium">Locations</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold flex items-center gap-2"><MapPin className="h-6 w-6" /> Locations</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage company locations and assignment rules.</p>
          </div>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild><Button size="sm" className="gap-2"><Plus className="h-4 w-4" /> Add Location</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add New Location</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Location Code</Label><Input value={newLoc.code} onChange={e => setNewLoc(p => ({ ...p, code: e.target.value }))} placeholder="HQ001" /></div>
                  <div><Label>Name</Label><Input value={newLoc.name} onChange={e => setNewLoc(p => ({ ...p, name: e.target.value }))} placeholder="Headquarters" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>City</Label><Input value={newLoc.city} onChange={e => setNewLoc(p => ({ ...p, city: e.target.value }))} /></div>
                  <div><Label>Country</Label><Input value={newLoc.country} onChange={e => setNewLoc(p => ({ ...p, country: e.target.value }))} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Group</Label><Input value={newLoc.group} onChange={e => setNewLoc(p => ({ ...p, group: e.target.value }))} placeholder="US-West" /></div>
                  <div><Label>Type</Label>
                    <Select value={newLoc.type} onValueChange={(v: any) => setNewLoc(p => ({ ...p, type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="automated">Automated</SelectItem><SelectItem value="manual">Manual</SelectItem></SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleCreate} className="w-full">Add Location</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { title: "Total Locations", value: locations.length, icon: MapPin, link: "View Locations" },
            { title: "Location Groups", value: groups.length, icon: Globe, link: "Manage Groups" },
            { title: "Rules Configured", value: 9, icon: Building, link: "Manage Rules" },
            { title: "Rules Configured", value: 13, icon: Building, link: "Manage Rules" },
          ].map((kpi, i) => (
            <Card key={i} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-2.5 rounded-lg bg-primary/10"><kpi.icon className="h-5 w-5 text-primary" /></div>
                <div>
                  <p className="text-2xl font-bold">{kpi.value}</p>
                  <p className="text-xs text-muted-foreground">{kpi.title}</p>
                  <p className="text-xs text-primary mt-1">{kpi.link} →</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Locations</CardTitle>
              <div className="flex gap-2">
                <Select value={groupFilter} onValueChange={setGroupFilter}>
                  <SelectTrigger className="w-32 h-8 text-xs"><SelectValue placeholder="All Groups" /></SelectTrigger>
                  <SelectContent><SelectItem value="all">All Groups</SelectItem>{groups.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                </Select>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input placeholder="Search locations..." className="pl-8 h-8 w-48 text-xs" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-muted/30 rounded-lg h-64 flex items-center justify-center border">
                <div className="text-center text-muted-foreground">
                  <Globe className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Interactive Map View</p>
                  <p className="text-xs">Showing {filtered.length} locations</p>
                </div>
              </div>
              <div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">ID</TableHead>
                      <TableHead className="text-xs">Location Name</TableHead>
                      <TableHead className="text-xs">Group</TableHead>
                      <TableHead className="text-xs">Country</TableHead>
                      <TableHead className="text-xs w-8"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(loc => (
                      <TableRow key={loc.id}>
                        <TableCell className="text-xs font-medium">{loc.code}</TableCell>
                        <TableCell className="text-xs">{loc.code} - {loc.name}</TableCell>
                        <TableCell className="text-xs">{loc.group}</TableCell>
                        <TableCell className="text-xs">{loc.city}</TableCell>
                        <TableCell><Button variant="ghost" size="icon" className="h-6 w-6"><MoreHorizontal className="h-3 w-3" /></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <p className="text-xs text-muted-foreground mt-2">1 - {filtered.length} of {filtered.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Location Groups</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">ID</TableHead>
                  <TableHead className="text-xs">Location Name</TableHead>
                  <TableHead className="text-xs">Group</TableHead>
                  <TableHead className="text-xs">Country</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(loc => (
                  <TableRow key={loc.id}>
                    <TableCell className="text-xs font-medium">{loc.code}</TableCell>
                    <TableCell className="text-xs">{loc.name}</TableCell>
                    <TableCell className="text-xs capitalize">{loc.type}</TableCell>
                    <TableCell className="text-xs">{loc.group}</TableCell>
                    <TableCell><Switch checked={loc.status === "active"} onCheckedChange={(checked) => updateLocation(loc.id, { status: checked ? "active" : "inactive" })} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Quick Actions</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {[
                { title: "Add Location", desc: "Manually add a new location", icon: MapPin },
                { title: "Location Import Template", desc: "Import locations via CSV template", icon: Building },
                { title: "Location-Based Auto Assignment", desc: "Configure auto assignment rules", icon: Globe },
                { title: "Location-Based Auto Assignment", desc: "View logs of past assignments rules", icon: Globe },
              ].map((action, i) => (
                <Card key={i} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className="p-2 rounded bg-primary/10"><action.icon className="h-4 w-4 text-primary" /></div>
                    <div>
                      <p className="text-sm font-medium">{action.title}</p>
                      <p className="text-xs text-muted-foreground">{action.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
