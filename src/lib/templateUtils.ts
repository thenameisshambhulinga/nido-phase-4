import * as XLSX from "xlsx";

// ── VENDOR TEMPLATE ─────────────────────────────────────

const VENDOR_HEADERS = [
  "vendor_id", "company_name", "contact_person", "email", "phone", "mobile",
  "gst_number", "pan_number", "category", "gst_treatment", "payment_term",
  "billing_address", "billing_city", "billing_state", "billing_pincode",
  "bank_account_no", "bank_ifsc", "bank_name", "opening_balance", "credit_limit"
];

const VENDOR_REQUIRED_COLS = [1, 2, 3, 4, 8, 9, 11, 12, 13, 14]; // 0-indexed

const VENDOR_EXAMPLE_ROW = [
  "", "Apex Tech Solutions", "Rajesh Kumar", "rajesh@apextech.com", "+91 98765 43210", "+91 98765 43211",
  "27AACCN1234A1Z5", "AACCN1234A", "IT Hardware", "Registered", "Net 30",
  "123 MG Road", "Mumbai", "Maharashtra", "400001",
  "1234567890", "SBIN0001234", "State Bank of India", "0", "500000"
];

const VENDOR_EXAMPLE_ROW2 = [
  "", "Global Supply Co", "Priya Sharma", "priya@globalsupply.com", "+91 87654 32100", "",
  "29BBCDE5678B2Z6", "BBCDE5678B", "Office Supplies", "Unregistered", "Net 15",
  "456 Park Street", "Bangalore", "Karnataka", "560001",
  "", "", "", "0", "200000"
];

export const VENDOR_CATEGORIES = [
  "IT Hardware", "Office Supplies", "Cloud Services", "Security Systems",
  "Consulting", "Facility Maintenance", "Logistics", "Construction", "Cleaning Services"
];

const GST_TREATMENTS = ["Registered", "Unregistered", "Composition", "Overseas", "SEZ"];

// ── PRODUCT TEMPLATE ────────────────────────────────────

const PRODUCT_HEADERS = [
  "product_id", "vendor_id", "product_name", "sku", "category", "subcategory",
  "description", "cost_price", "selling_price", "tax_percent", "hsn_code",
  "stock_quantity", "min_order_qty"
];

const PRODUCT_EXAMPLE_ROW = [
  "", "VND-2026-0001", "Dell Latitude 5540 Laptop", "ITH-APX-0001", "IT Hardware", "Laptops",
  "14-inch business laptop, i7, 16GB RAM", "85000", "95000", "18", "847130",
  "50", "1"
];

// ── CLIENT TEMPLATE ─────────────────────────────────────

const CLIENT_HEADERS = [
  "client_id", "company_name", "contact_person", "email", "phone",
  "address", "contract_start", "contract_end"
];

const CLIENT_EXAMPLE_ROW = [
  "", "Acme Corporation", "John Smith", "john@acme.com", "+1-555-0100",
  "123 Business Ave, New York, NY", "2026-01-01", "2027-12-31"
];

// ── HELPERS ─────────────────────────────────────────────

function styleRequiredColumns(ws: XLSX.WorkSheet, requiredCols: number[], headerCount: number) {
  // Add '(Required)' note to required header cells
  for (const col of requiredCols) {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
    if (ws[cellRef]) {
      ws[cellRef].s = { fill: { fgColor: { rgb: "FFFDE68A" } }, font: { bold: true } };
    }
  }
  // Set column widths
  ws["!cols"] = Array.from({ length: headerCount }, () => ({ wch: 20 }));
}

// ── DOWNLOAD FUNCTIONS ──────────────────────────────────

export function downloadVendorTemplate(): void {
  const ws = XLSX.utils.aoa_to_sheet([VENDOR_HEADERS, VENDOR_EXAMPLE_ROW, VENDOR_EXAMPLE_ROW2]);
  styleRequiredColumns(ws, VENDOR_REQUIRED_COLS, VENDOR_HEADERS.length);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Vendors");
  XLSX.writeFile(wb, "NidoTech_Vendor_Template.xlsx");
}

export function downloadProductTemplate(): void {
  const ws = XLSX.utils.aoa_to_sheet([PRODUCT_HEADERS, PRODUCT_EXAMPLE_ROW]);
  styleRequiredColumns(ws, [1, 2, 4, 7, 8, 9, 11], PRODUCT_HEADERS.length);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Products");
  XLSX.writeFile(wb, "NidoTech_Product_Template.xlsx");
}

export function downloadClientTemplate(): void {
  const ws = XLSX.utils.aoa_to_sheet([CLIENT_HEADERS, CLIENT_EXAMPLE_ROW]);
  styleRequiredColumns(ws, [1, 2, 3, 4], CLIENT_HEADERS.length);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Clients");
  XLSX.writeFile(wb, "NidoTech_Client_Template.xlsx");
}

// ── PARSE ERROR TYPE ────────────────────────────────────

export interface ParseError {
  row: number;
  field: string;
  message: string;
  severity: "error" | "warning";
}

export interface ParsedRow {
  rowIndex: number;
  data: Record<string, string>;
  errors: ParseError[];
  warnings: ParseError[];
  conflict?: "duplicate_email" | "duplicate_name" | null;
  conflictAction?: "update" | "skip" | "create";
}

export interface BulkUploadResult {
  created: number;
  updated: number;
  skipped: number;
  errors: ParseError[];
  records: Record<string, string>[];
}

// ── VALIDATION ──────────────────────────────────────────

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateGST(gst: string): boolean {
  if (!gst) return true;
  return /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}\d[Z]{1}[A-Z\d]{1}$/.test(gst);
}

function validatePAN(pan: string): boolean {
  if (!pan) return true;
  return /^[A-Z]{5}\d{4}[A-Z]{1}$/.test(pan);
}

function validatePincode(pin: string): boolean {
  if (!pin) return true;
  return /^\d{6}$/.test(pin);
}

// ── PARSE VENDOR UPLOAD ─────────────────────────────────

export function parseVendorUpload(file: File, existingVendors: { id: string; name: string; contactEmail: string }[] = []): Promise<ParsedRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target!.result;
        const wb = XLSX.read(data, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (raw.length < 2) {
          resolve([]);
          return;
        }

        const headers = raw[0].map(h => String(h).trim().toLowerCase());
        const rows: ParsedRow[] = [];

        for (let i = 1; i < raw.length; i++) {
          const rowData = raw[i];
          if (!rowData || rowData.every(cell => !cell && String(cell) !== "0")) continue;

          const record: Record<string, string> = {};
          headers.forEach((h, idx) => {
            record[h] = rowData[idx] != null ? String(rowData[idx]).trim() : "";
          });

          const errors: ParseError[] = [];
          const warnings: ParseError[] = [];

          // Required field checks
          if (!record.company_name) errors.push({ row: i + 1, field: "company_name", message: "Company name is required", severity: "error" });
          if (!record.contact_person) errors.push({ row: i + 1, field: "contact_person", message: "Contact person is required", severity: "error" });
          if (!record.email) errors.push({ row: i + 1, field: "email", message: "Email is required", severity: "error" });
          else if (!validateEmail(record.email)) errors.push({ row: i + 1, field: "email", message: "Invalid email format", severity: "error" });
          if (!record.phone) errors.push({ row: i + 1, field: "phone", message: "Phone is required", severity: "error" });
          if (!record.category) errors.push({ row: i + 1, field: "category", message: "Category is required", severity: "error" });
          else if (!VENDOR_CATEGORIES.includes(record.category)) warnings.push({ row: i + 1, field: "category", message: `Unknown category: ${record.category}`, severity: "warning" });
          if (!record.gst_treatment) errors.push({ row: i + 1, field: "gst_treatment", message: "GST treatment is required", severity: "error" });
          else if (!GST_TREATMENTS.includes(record.gst_treatment)) errors.push({ row: i + 1, field: "gst_treatment", message: `Invalid GST treatment. Use: ${GST_TREATMENTS.join(", ")}`, severity: "error" });

          if (!record.billing_address) errors.push({ row: i + 1, field: "billing_address", message: "Billing address required", severity: "error" });
          if (!record.billing_city) errors.push({ row: i + 1, field: "billing_city", message: "Billing city required", severity: "error" });
          if (!record.billing_state) errors.push({ row: i + 1, field: "billing_state", message: "Billing state required", severity: "error" });
          if (!record.billing_pincode) errors.push({ row: i + 1, field: "billing_pincode", message: "Billing pincode required", severity: "error" });
          else if (!validatePincode(record.billing_pincode)) errors.push({ row: i + 1, field: "billing_pincode", message: "Pincode must be 6 digits", severity: "error" });

          // Optional validations
          if (record.gst_number && !validateGST(record.gst_number)) warnings.push({ row: i + 1, field: "gst_number", message: "GST format looks invalid", severity: "warning" });
          if (record.pan_number && !validatePAN(record.pan_number)) warnings.push({ row: i + 1, field: "pan_number", message: "PAN format looks invalid", severity: "warning" });

          // Conflict detection
          let conflict: ParsedRow["conflict"] = null;
          if (!record.vendor_id) {
            const emailMatch = existingVendors.find(v => v.contactEmail.toLowerCase() === record.email?.toLowerCase());
            if (emailMatch) conflict = "duplicate_email";
            else {
              const nameMatch = existingVendors.find(v => v.name.toLowerCase() === record.company_name?.toLowerCase());
              if (nameMatch) conflict = "duplicate_name";
            }
          }

          rows.push({ rowIndex: i + 1, data: record, errors, warnings, conflict, conflictAction: conflict ? "skip" : "create" });
        }

        resolve(rows);
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsBinaryString(file);
  });
}

// ── PARSE CLIENT UPLOAD ─────────────────────────────────

export function parseClientUpload(file: File, existingClients: { id: string; name: string; email: string }[] = []): Promise<ParsedRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target!.result;
        const wb = XLSX.read(data, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (raw.length < 2) { resolve([]); return; }
        const headers = raw[0].map(h => String(h).trim().toLowerCase());
        const rows: ParsedRow[] = [];

        for (let i = 1; i < raw.length; i++) {
          const rowData = raw[i];
          if (!rowData || rowData.every(cell => !cell && String(cell) !== "0")) continue;

          const record: Record<string, string> = {};
          headers.forEach((h, idx) => { record[h] = rowData[idx] != null ? String(rowData[idx]).trim() : ""; });

          const errors: ParseError[] = [];
          const warnings: ParseError[] = [];

          if (!record.company_name) errors.push({ row: i + 1, field: "company_name", message: "Company name is required", severity: "error" });
          if (!record.contact_person) errors.push({ row: i + 1, field: "contact_person", message: "Contact person is required", severity: "error" });
          if (!record.email) errors.push({ row: i + 1, field: "email", message: "Email is required", severity: "error" });
          else if (!validateEmail(record.email)) errors.push({ row: i + 1, field: "email", message: "Invalid email format", severity: "error" });
          if (!record.phone) errors.push({ row: i + 1, field: "phone", message: "Phone is required", severity: "error" });

          let conflict: ParsedRow["conflict"] = null;
          if (!record.client_id) {
            const emailMatch = existingClients.find(c => c.email.toLowerCase() === record.email?.toLowerCase());
            if (emailMatch) conflict = "duplicate_email";
          }

          rows.push({ rowIndex: i + 1, data: record, errors, warnings, conflict, conflictAction: conflict ? "skip" : "create" });
        }
        resolve(rows);
      } catch (err) { reject(err); }
    };
    reader.readAsBinaryString(file);
  });
}
