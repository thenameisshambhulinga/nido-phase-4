import { useState, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Download,
  ArrowRight,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import {
  parseVendorUpload,
  parseClientUpload,
  downloadVendorTemplate,
  downloadClientTemplate,
  downloadProductTemplate,
  type ParsedRow,
  type BulkUploadResult,
} from "@/lib/templateUtils";

type UploadType = "vendor" | "product" | "client";
type Stage = "upload" | "preview" | "conflicts" | "results";

interface BulkUploadModalProps {
  open: boolean;
  onClose: () => void;
  type: UploadType;
  existingRecords?: {
    id: string;
    name: string;
    contactEmail?: string;
    email?: string;
  }[];
  onSuccess: (results: BulkUploadResult) => void;
}

const TYPE_LABELS: Record<UploadType, string> = {
  vendor: "Vendors",
  product: "Products",
  client: "Clients",
};

export default function BulkUploadModal({
  open,
  onClose,
  type,
  existingRecords = [],
  onSuccess,
}: BulkUploadModalProps) {
  const [stage, setStage] = useState<Stage>("upload");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BulkUploadResult | null>(null);
  const [importMode, setImportMode] = useState<
    "smart" | "append" | "update-only"
  >("smart");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStage("upload");
    setRows([]);
    setFileName("");
    setLoading(false);
    setResult(null);
    setImportMode("smart");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFile = useCallback(
    async (file: File) => {
      if (!file) return;
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!["xlsx", "xls", "csv"].includes(ext || "")) {
        return;
      }
      setFileName(file.name);
      setLoading(true);

      try {
        let parsed: ParsedRow[];
        const existing = existingRecords.map((r) => ({
          id: r.id,
          name: r.name,
          contactEmail: r.contactEmail || r.email || "",
          email: r.email || r.contactEmail || "",
        }));

        if (type === "vendor") {
          parsed = await parseVendorUpload(file, existing);
        } else if (type === "client") {
          parsed = await parseClientUpload(file, existing);
        } else {
          parsed = await parseVendorUpload(file, existing); // product uses same parser shape
        }

        setRows(parsed);
        setStage(parsed.some((r) => r.conflict) ? "conflicts" : "preview");
      } catch {
        // Parse error
      } finally {
        setLoading(false);
      }
    },
    [type, existingRecords],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleDownloadTemplate = () => {
    if (type === "vendor") downloadVendorTemplate();
    else if (type === "client") downloadClientTemplate();
    else downloadProductTemplate();
  };

  const handleConflictAction = (
    rowIndex: number,
    action: "update" | "skip" | "create",
  ) => {
    setRows((prev) =>
      prev.map((r) =>
        r.rowIndex === rowIndex ? { ...r, conflictAction: action } : r,
      ),
    );
  };

  const handleImport = () => {
    const validRows = rows.filter((r) => r.errors.length === 0);
    let created = 0,
      updated = 0,
      skipped = 0;
    const importedRecords: Record<string, string>[] = [];
    const allErrors = rows.flatMap((r) => r.errors);

    for (const row of validRows) {
      if (importMode === "append") {
        created++;
        importedRecords.push(row.data);
        continue;
      }

      if (importMode === "update-only") {
        if (row.conflict) {
          updated++;
          importedRecords.push(row.data);
        } else {
          skipped++;
        }
        continue;
      }

      if (row.conflict && row.conflictAction === "skip") {
        skipped++;
      } else if (row.conflict && row.conflictAction === "update") {
        updated++;
        importedRecords.push(row.data);
      } else {
        created++;
        importedRecords.push(row.data);
      }
    }

    // Count rows with errors as skipped
    skipped += rows.filter((r) => r.errors.length > 0).length;

    const res: BulkUploadResult = {
      created,
      updated,
      skipped,
      errors: allErrors,
      records: importedRecords,
    };
    setResult(res);
    setStage("results");
    onSuccess(res);
  };

  const totalErrors = rows.reduce((s, r) => s + r.errors.length, 0);
  const totalWarnings = rows.reduce((s, r) => s + r.warnings.length, 0);
  const conflicts = rows.filter((r) => r.conflict);
  const validCount = rows.filter((r) => r.errors.length === 0).length;

  const stageIndex = ["upload", "preview", "conflicts", "results"].indexOf(
    stage,
  );
  const progressValue = ((stageIndex + 1) / 4) * 100;

  const downloadErrorReport = () => {
    if (!rows.length) return;
    const reportRows = [
      ["Row", "Field", "Severity", "Message"],
      ...rows.flatMap((row) =>
        [...row.errors, ...row.warnings].map((issue) => [
          String(row.rowIndex),
          issue.field,
          issue.severity,
          issue.message,
        ]),
      ),
    ];
    const csv = reportRows.map((entry) => entry.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `bulk-import-report-${type}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Bulk Import {TYPE_LABELS[type]}
          </DialogTitle>
        </DialogHeader>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            {[
              "Upload File",
              "Preview Data",
              "Resolve Conflicts",
              "Results",
            ].map((label, i) => (
              <span
                key={label}
                className={i <= stageIndex ? "text-primary font-medium" : ""}
              >
                {label}
              </span>
            ))}
          </div>
          <Progress value={progressValue} className="h-2" />
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Badge variant="outline" className="text-xs">
              Mode
            </Badge>
            <Select
              value={importMode}
              onValueChange={(value) =>
                setImportMode(value as "smart" | "append" | "update-only")
              }
            >
              <SelectTrigger className="h-8 w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="smart">Smart Merge (default)</SelectItem>
                <SelectItem value="append">Append New Rows Only</SelectItem>
                <SelectItem value="update-only">
                  Update Existing Only
                </SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={downloadErrorReport}
            >
              <Download className="mr-1 h-3.5 w-3.5" /> Download Report
            </Button>
          </div>
        </div>

        {/* ── STAGE 1: UPLOAD ── */}
        {stage === "upload" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 py-8">
            <div
              className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-12 w-full text-center cursor-pointer hover:border-primary/50 hover:bg-accent/30 transition-all"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
            >
              {loading ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">
                    Parsing {fileName}...
                  </p>
                </div>
              ) : (
                <>
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="font-medium">Drag & drop your file here</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    or click to browse — .xlsx, .xls, .csv accepted
                  </p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFile(e.target.files[0]);
                }}
              />
            </div>
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleDownloadTemplate}
            >
              <Download className="h-4 w-4" /> Download {TYPE_LABELS[type]}{" "}
              Template
            </Button>
          </div>
        )}

        {/* ── STAGE 2: PREVIEW ── */}
        {stage === "preview" && (
          <div className="flex-1 flex flex-col gap-4 min-h-0">
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="outline" className="gap-1">
                <FileSpreadsheet className="h-3 w-3" />
                {fileName}
              </Badge>
              <Badge
                className="bg-primary/10 text-primary border-primary/30"
                variant="outline"
              >
                {rows.length} rows
              </Badge>
              <Badge
                className="bg-success/10 text-success border-success/30"
                variant="outline"
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {validCount} valid
              </Badge>
              {totalErrors > 0 && (
                <Badge
                  className="bg-destructive/10 text-destructive border-destructive/30"
                  variant="outline"
                >
                  <XCircle className="h-3 w-3 mr-1" />
                  {totalErrors} errors
                </Badge>
              )}
              {totalWarnings > 0 && (
                <Badge
                  className="bg-warning/10 text-warning border-warning/30"
                  variant="outline"
                >
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {totalWarnings} warnings
                </Badge>
              )}
            </div>

            <ScrollArea className="flex-1 border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Row</TableHead>
                    <TableHead className="w-20">Status</TableHead>
                    {rows[0] &&
                      Object.keys(rows[0].data)
                        .slice(0, 6)
                        .map((key) => (
                          <TableHead key={key} className="min-w-[120px]">
                            {key.replace(/_/g, " ")}
                          </TableHead>
                        ))}
                    <TableHead>Issues</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow
                      key={row.rowIndex}
                      className={
                        row.errors.length > 0
                          ? "bg-destructive/5"
                          : row.warnings.length > 0
                            ? "bg-warning/5"
                            : ""
                      }
                    >
                      <TableCell className="text-muted-foreground text-xs">
                        {row.rowIndex}
                      </TableCell>
                      <TableCell>
                        {row.errors.length > 0 ? (
                          <XCircle className="h-4 w-4 text-destructive" />
                        ) : row.warnings.length > 0 ? (
                          <AlertTriangle className="h-4 w-4 text-warning" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-success" />
                        )}
                      </TableCell>
                      {Object.values(row.data)
                        .slice(0, 6)
                        .map((val, idx) => (
                          <TableCell
                            key={idx}
                            className="text-xs max-w-[150px] truncate"
                          >
                            {val || "—"}
                          </TableCell>
                        ))}
                      <TableCell className="text-xs">
                        {[...row.errors, ...row.warnings].map((e, idx) => (
                          <span
                            key={idx}
                            className={`block ${e.severity === "error" ? "text-destructive" : "text-warning"}`}
                          >
                            {e.field}: {e.message}
                          </span>
                        ))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  reset();
                }}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" /> Re-upload
              </Button>
              {conflicts.length > 0 ? (
                <Button onClick={() => setStage("conflicts")} className="gap-2">
                  Resolve {conflicts.length} Conflict
                  {conflicts.length > 1 ? "s" : ""}{" "}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleImport}
                  className="gap-2"
                  disabled={validCount === 0}
                >
                  Import {validCount} Record{validCount !== 1 ? "s" : ""}{" "}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* ── STAGE 3: CONFLICTS ── */}
        {stage === "conflicts" && (
          <div className="flex-1 flex flex-col gap-4 min-h-0">
            <p className="text-sm text-muted-foreground">
              {conflicts.length} record{conflicts.length > 1 ? "s" : ""} match
              existing data. Choose how to handle each:
            </p>

            <ScrollArea className="flex-1 border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Row</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Conflict Type</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {conflicts.map((row) => (
                    <TableRow key={row.rowIndex} className="bg-warning/5">
                      <TableCell>{row.rowIndex}</TableCell>
                      <TableCell className="font-medium">
                        {row.data.company_name}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {row.data.email}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="border-warning text-warning"
                        >
                          {row.conflict === "duplicate_email"
                            ? "Email exists"
                            : "Name match"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={row.conflictAction || "skip"}
                          onValueChange={(v) =>
                            handleConflictAction(
                              row.rowIndex,
                              v as "update" | "skip" | "create",
                            )
                          }
                        >
                          <SelectTrigger className="w-32 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="update">Update</SelectItem>
                            <SelectItem value="skip">Skip</SelectItem>
                            <SelectItem value="create">Create New</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setStage("preview")}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" /> Back to Preview
              </Button>
              <Button onClick={handleImport} className="gap-2">
                Import Records <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ── STAGE 4: RESULTS ── */}
        {stage === "results" && result && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 py-6">
            <CheckCircle2 className="h-16 w-16 text-success" />
            <h3 className="text-xl font-bold">Import Complete</h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-lg">
              {[
                {
                  label: "Created",
                  value: result.created,
                  color: "text-success",
                },
                {
                  label: "Updated",
                  value: result.updated,
                  color: "text-primary",
                },
                {
                  label: "Skipped",
                  value: result.skipped,
                  color: "text-muted-foreground",
                },
                {
                  label: "Errors",
                  value: result.errors.length,
                  color: "text-destructive",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="text-center p-4 rounded-lg bg-muted/50"
                >
                  <p className={`text-2xl font-bold ${item.color}`}>
                    {item.value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>

            {result.errors.length > 0 && (
              <div className="w-full max-w-lg border rounded-lg p-3 bg-destructive/5">
                <p className="text-sm font-medium text-destructive mb-2">
                  Errors ({result.errors.length})
                </p>
                {result.errors.slice(0, 5).map((err, i) => (
                  <p key={i} className="text-xs text-muted-foreground">
                    Row {err.row}: {err.field} — {err.message}
                  </p>
                ))}
                {result.errors.length > 5 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    ...and {result.errors.length - 5} more
                  </p>
                )}
              </div>
            )}

            <Button onClick={handleClose} className="mt-2">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
