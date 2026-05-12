import { useState, useRef } from "react";
import { Wand2, Upload, Loader2, CheckCircle2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

interface ExtractedVendorData {
  companyName?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  website?: string;
  gstTreatment?: string;
  sourceOfSupply?: string;
  pan?: string;
  gstin?: string;
  msmeRegistered?: boolean;
  currency?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  branch?: string;
  billingAddress?: string;
  billingCity?: string;
  billingState?: string;
  billingPincode?: string;
  category?: string;
}

interface MagicVendorUploadProps {
  onExtracted: (data: ExtractedVendorData) => void;
  onAutoSubmit: (data: ExtractedVendorData) => void;
}

// Simulates extracting vendor data from a PDF by parsing text content
function extractVendorFromText(text: string): ExtractedVendorData {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const all = text.toUpperCase();
  const data: ExtractedVendorData = {};

  // Company Name - usually first prominent line or after "Company Name:"
  const companyMatch = text.match(/(?:company\s*name|business\s*name|firm\s*name)\s*[:\-]?\s*(.+)/i);
  if (companyMatch) data.companyName = companyMatch[1].trim();
  else if (lines.length > 0) data.companyName = lines[0];

  // Contact Person
  const contactMatch = text.match(/(?:contact\s*person|authorized\s*person|name)\s*[:\-]?\s*(.+)/i);
  if (contactMatch) data.contactPerson = contactMatch[1].trim();

  // Email
  const emailMatch = text.match(/[\w.+-]+@[\w-]+\.[\w.]+/);
  if (emailMatch) data.email = emailMatch[0];

  // Phone
  const phoneMatch = text.match(/(?:phone|tel|telephone)\s*[:\-]?\s*([+\d\s\-()]{8,})/i);
  if (phoneMatch) data.phone = phoneMatch[1].trim();

  // Mobile
  const mobileMatch = text.match(/(?:mobile|cell|whatsapp)\s*[:\-]?\s*([+\d\s\-()]{8,})/i);
  if (mobileMatch) data.mobile = mobileMatch[1].trim();

  // Website
  const webMatch = text.match(/(?:website|url|web)\s*[:\-]?\s*(https?:\/\/[^\s]+|www\.[^\s]+)/i);
  if (webMatch) data.website = webMatch[1].trim();

  // PAN
  const panMatch = text.match(/(?:PAN|pan\s*(?:no|number)?)\s*[:\-]?\s*([A-Z]{5}[0-9]{4}[A-Z])/i);
  if (panMatch) data.pan = panMatch[1].toUpperCase();
  else {
    const panDirect = all.match(/[A-Z]{5}[0-9]{4}[A-Z]/);
    if (panDirect) data.pan = panDirect[0];
  }

  // GSTIN
  const gstMatch = text.match(/(?:GSTIN|GST\s*(?:no|number|in)?)\s*[:\-]?\s*(\d{2}[A-Z]{5}\d{4}[A-Z]\d[A-Z\d]{2})/i);
  if (gstMatch) data.gstin = gstMatch[1].toUpperCase();
  else {
    const gstDirect = all.match(/\d{2}[A-Z]{5}\d{4}[A-Z]\d[A-Z\d]{2}/);
    if (gstDirect) data.gstin = gstDirect[0];
  }

  // MSME
  if (/msme\s*registered|udyam|msme\s*[:\-]?\s*yes/i.test(text)) data.msmeRegistered = true;

  // Bank details
  const bankMatch = text.match(/(?:bank\s*name|bank)\s*[:\-]?\s*(.+)/i);
  if (bankMatch) data.bankName = bankMatch[1].trim();

  const accMatch = text.match(/(?:account\s*(?:no|number)?|a\/c)\s*[:\-]?\s*(\d{8,18})/i);
  if (accMatch) data.accountNumber = accMatch[1];

  const ifscMatch = text.match(/(?:IFSC|ifsc\s*code)\s*[:\-]?\s*([A-Z]{4}0[A-Z0-9]{6})/i);
  if (ifscMatch) data.ifscCode = ifscMatch[1].toUpperCase();

  const branchMatch = text.match(/(?:branch)\s*[:\-]?\s*(.+)/i);
  if (branchMatch) data.branch = branchMatch[1].trim();

  // Address
  const addrMatch = text.match(/(?:address|billing\s*address|registered\s*address)\s*[:\-]?\s*(.+)/i);
  if (addrMatch) data.billingAddress = addrMatch[1].trim();

  // City
  const cityMatch = text.match(/(?:city|town)\s*[:\-]?\s*(.+)/i);
  if (cityMatch) data.billingCity = cityMatch[1].trim();

  // State
  const stateMatch = text.match(/(?:state)\s*[:\-]?\s*(.+)/i);
  if (stateMatch) data.billingState = stateMatch[1].trim();

  // Pincode
  const pinMatch = text.match(/(?:pin\s*code|pincode|zip)\s*[:\-]?\s*(\d{6})/i);
  if (pinMatch) data.billingPincode = pinMatch[1];

  // GST Treatment
  if (/composition/i.test(text)) data.gstTreatment = "Composition Scheme";
  else if (/unregistered/i.test(text)) data.gstTreatment = "Unregistered Business";
  else if (/overseas|foreign/i.test(text)) data.gstTreatment = "Overseas";
  else if (/sez/i.test(text)) data.gstTreatment = "SEZ";
  else if (data.gstin) data.gstTreatment = "Registered Business";

  // Source of supply from state
  if (data.billingState) data.sourceOfSupply = data.billingState;

  return data;
}

export default function MagicVendorUpload({ onExtracted, onAutoSubmit }: MagicVendorUploadProps) {
  const [open, setOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedVendorData | null>(null);
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setFileName(file.name);
    setProcessing(true);
    setExtracted(null);

    try {
      // Read file as text (works for text-based PDFs; for real apps, use a PDF parsing library)
      const text = await file.text();
      
      // Simulate processing delay for UX
      await new Promise(r => setTimeout(r, 1500));
      
      const data = extractVendorFromText(text);
      setExtracted(data);
      
      const filledFields = Object.values(data).filter(v => v !== undefined && v !== "").length;
      toast({
        title: "PDF Analyzed Successfully",
        description: `Extracted ${filledFields} fields from ${file.name}. Review and confirm.`,
      });
    } catch {
      toast({ title: "Error", description: "Failed to parse the PDF. Please try again.", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const handleAutoCreate = () => {
    if (extracted) {
      onAutoSubmit(extracted);
      setOpen(false);
      setExtracted(null);
      setFileName("");
    }
  };

  const handleFillForm = () => {
    if (extracted) {
      onExtracted(extracted);
      setOpen(false);
      setExtracted(null);
      setFileName("");
      toast({ title: "Form Populated", description: "Fields have been auto-filled. Please review before submitting." });
    }
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        className="gap-2 border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
      >
        <Wand2 className="h-4 w-4" />
        Magic Upload
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-primary" />
              Magic Vendor Registration
            </DialogTitle>
            <DialogDescription>
              Upload a vendor registration PDF or any document containing vendor details. We'll extract all information and create the vendor automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!processing && !extracted && (
              <div
                className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleFile(file);
                }}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <Upload className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Drop your vendor document here</p>
                    <p className="text-xs text-muted-foreground mt-1">PDF, TXT — Registration forms, invoices, or any vendor info document</p>
                  </div>
                  <Button variant="outline" size="sm" type="button">Browse Files</Button>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.txt,.doc,.docx"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                  }}
                />
              </div>
            )}

            {processing && (
              <div className="flex flex-col items-center gap-4 py-8">
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
                <div className="text-center">
                  <p className="text-sm font-semibold">Analyzing {fileName}...</p>
                  <p className="text-xs text-muted-foreground mt-1">Extracting vendor details using intelligent parsing</p>
                </div>
              </div>
            )}

            {extracted && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-success">
                  <CheckCircle2 className="h-4 w-4" />
                  Extraction Complete
                </div>
                <div className="bg-muted/50 rounded-lg p-4 space-y-2 max-h-60 overflow-y-auto scrollbar-thin">
                  {extracted.companyName && <Field label="Company" value={extracted.companyName} />}
                  {extracted.contactPerson && <Field label="Contact" value={extracted.contactPerson} />}
                  {extracted.email && <Field label="Email" value={extracted.email} />}
                  {extracted.phone && <Field label="Phone" value={extracted.phone} />}
                  {extracted.pan && <Field label="PAN" value={extracted.pan} />}
                  {extracted.gstin && <Field label="GSTIN" value={extracted.gstin} />}
                  {extracted.gstTreatment && <Field label="GST Treatment" value={extracted.gstTreatment} />}
                  {extracted.bankName && <Field label="Bank" value={extracted.bankName} />}
                  {extracted.accountNumber && <Field label="Account" value={extracted.accountNumber} />}
                  {extracted.ifscCode && <Field label="IFSC" value={extracted.ifscCode} />}
                  {extracted.billingAddress && <Field label="Address" value={extracted.billingAddress} />}
                  {extracted.billingCity && <Field label="City" value={extracted.billingCity} />}
                  {extracted.billingState && <Field label="State" value={extracted.billingState} />}
                  {extracted.billingPincode && <Field label="Pincode" value={extracted.billingPincode} />}
                  {Object.values(extracted).every(v => !v) && (
                    <p className="text-sm text-muted-foreground">No fields could be extracted. The document may not contain structured vendor data.</p>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <FileText className="h-3 w-3" />
                  Source: {fileName}
                </div>
              </div>
            )}
          </div>

          {extracted && (
            <DialogFooter className="flex gap-2 sm:gap-2">
              <Button variant="outline" onClick={handleFillForm} className="gap-2">
                Fill Form Only
              </Button>
              <Button onClick={handleAutoCreate} className="gap-2 bg-primary hover:bg-primary/90">
                <Wand2 className="h-4 w-4" />
                One-Click Create
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="text-muted-foreground min-w-[80px]">{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
