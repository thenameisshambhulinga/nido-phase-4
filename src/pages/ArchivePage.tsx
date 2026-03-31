import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { RotateCcw, Trash2, Building2, Users } from "lucide-react";

interface ArchivedRecord {
  id: string;
  name: string;
  type: "vendor" | "client";
  email: string;
  deletedAt: string;
}

const STORAGE_KEY = "nido_archived_records";

function loadArchived(): ArchivedRecord[] {
  try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
}

export default function ArchivePage() {
  const [records, setRecords] = useState<ArchivedRecord[]>(loadArchived);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(records)); }, [records]);

  const handleRestore = (record: ArchivedRecord) => {
    setRecords(prev => prev.filter(r => r.id !== record.id));
    toast({ title: "Restored", description: `${record.name} has been restored. Please re-add them from the ${record.type} management page.` });
  };

  const handlePermanentDelete = (id: string) => {
    setRecords(prev => prev.filter(r => r.id !== id));
    toast({ title: "Permanently Deleted", description: "Record has been permanently removed." });
  };

  return (
    <div>
      <Header title="Archived Records" />
      <div className="p-6 space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-display font-bold">Archived Records</h1>
          <p className="text-sm text-muted-foreground">Manage deleted vendors and clients — restore or permanently remove</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="p-5">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2"><Building2 className="h-4 w-4" /> Archived Vendors</div>
            <p className="text-3xl font-bold">{records.filter(r => r.type === "vendor").length}</p>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2"><Users className="h-4 w-4" /> Archived Clients</div>
            <p className="text-3xl font-bold">{records.filter(r => r.type === "client").length}</p>
          </Card>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Deleted On</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    <Trash2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p>No archived records</p>
                    <p className="text-xs mt-1">Deleted vendors and clients will appear here</p>
                  </TableCell></TableRow>
                ) : (
                  records.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell><Badge variant="outline" className="capitalize">{r.type}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.email}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.deletedAt}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="gap-1" onClick={() => handleRestore(r)}>
                            <RotateCcw className="h-3.5 w-3.5" /> Restore
                          </Button>
                          <Button variant="ghost" size="sm" className="gap-1 text-destructive hover:text-destructive" onClick={() => handlePermanentDelete(r.id)}>
                            <Trash2 className="h-3.5 w-3.5" /> Delete Forever
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}