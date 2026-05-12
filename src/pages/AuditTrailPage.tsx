import { useState } from "react";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useData } from "@/contexts/DataContext";
import { Search, Download, Filter } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function AuditTrailPage() {
  const { auditTrail } = useData();
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const modules = [...new Set(auditTrail.map(a => a.module))];
  const filtered = auditTrail.filter(a => {
    const matchSearch = a.user.toLowerCase().includes(search.toLowerCase()) || a.action.toLowerCase().includes(search.toLowerCase()) || a.details.toLowerCase().includes(search.toLowerCase());
    const matchModule = moduleFilter === "all" || a.module === moduleFilter;
    const matchStatus = statusFilter === "all" || a.status === statusFilter;
    return matchSearch && matchModule && matchStatus;
  });

  const exportCSV = () => {
    const csv = ["Timestamp,User,Action,Module,Details,IP,Status", ...filtered.map(a => `${a.timestamp},${a.user},${a.action},${a.module},${a.details},${a.ipAddress},${a.status}`)].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "audit_trail.csv";
    a.click();
    toast({ title: "Export Complete" });
  };

  return (
    <div>
      <Header title="Audit Trail" />
      <div className="p-6 space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-display font-bold">Audit Trails</h1>
          <Button variant="outline" size="sm" className="gap-2" onClick={exportCSV}><Download className="h-4 w-4" /> Export</Button>
        </div>

        <div className="flex gap-3 items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search audit logs..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={moduleFilter} onValueChange={setModuleFilter}>
            <SelectTrigger className="w-36"><SelectValue placeholder="All Modules" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All Modules</SelectItem>{modules.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32"><SelectValue placeholder="All Status" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="success">Success</SelectItem><SelectItem value="failed">Failed</SelectItem></SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(entry => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-xs text-muted-foreground">{new Date(entry.timestamp).toLocaleString()}</TableCell>
                    <TableCell className="font-medium text-sm">{entry.user}</TableCell>
                    <TableCell className="text-sm">{entry.action}</TableCell>
                    <TableCell><Badge variant="outline">{entry.module}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-48 truncate">{entry.details}</TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">{entry.ipAddress}</TableCell>
                    <TableCell>
                      <Badge className={entry.status === "success" ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground"}>
                        {entry.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No audit entries found</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
