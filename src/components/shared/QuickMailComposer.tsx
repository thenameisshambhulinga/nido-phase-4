import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Send, Paperclip, X, Mail } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import ValidationAlert from "@/components/shared/ValidationAlert";

interface QuickMailComposerProps {
  open: boolean;
  onClose: () => void;
  recipientType?: "vendor" | "client" | "all";
  defaultTo?: string;
  defaultSubject?: string;
  defaultBody?: string;
}

const TEMPLATES = [
  {
    label: "Follow-up",
    subject: "Follow-up on Recent Order",
    body: "Dear Partner,\n\nI hope this email finds you well. I wanted to follow up regarding our recent transaction and check if everything has been progressing smoothly.\n\nPlease let us know if you need any further assistance.\n\nBest regards",
  },
  {
    label: "Payment Reminder",
    subject: "Payment Reminder - Invoice Due",
    body: "Dear Partner,\n\nThis is a friendly reminder that the payment for the referenced invoice is due. Kindly process the payment at your earliest convenience.\n\nPlease reach out if you have any questions.\n\nBest regards",
  },
  {
    label: "Contract Renewal",
    subject: "Contract Renewal Discussion",
    body: "Dear Partner,\n\nAs we approach the end of our current contract period, we would like to initiate discussions regarding renewal terms.\n\nPlease let us know a convenient time to discuss this further.\n\nBest regards",
  },
  {
    label: "Issue Report",
    subject: "Service Quality Report",
    body: "Dear Partner,\n\nWe would like to bring to your attention some observations regarding recent service delivery. Please find the details below:\n\n[Describe issue here]\n\nWe look forward to your prompt resolution.\n\nBest regards",
  },
];

export default function QuickMailComposer({
  open,
  onClose,
  recipientType = "all",
  defaultTo = "",
  defaultSubject = "",
  defaultBody = "",
}: QuickMailComposerProps) {
  const { vendors, clients, addAuditEntry } = useData();
  const { user } = useAuth();

  const [to, setTo] = useState(defaultTo);
  const [cc, setCc] = useState("");
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState(defaultBody);
  const [template, setTemplate] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [validationError, setValidationError] = useState({
    open: false,
    message: "",
  });

  // Removed sync setState in effect; use key prop instead
  useEffect(() => {}, []); // Reset effect removed to avoid ESLint warning

  const recipients =
    recipientType === "vendor"
      ? vendors.map((vendor) => ({
          label: `${vendor.name} (${vendor.contactEmail})`,
          value: vendor.contactEmail,
        }))
      : recipientType === "client"
        ? clients.map((client) => ({
            label: `${client.name} - ${client.contactPerson} (${client.email})`,
            value: client.email,
          }))
        : [
            ...vendors.map((vendor) => ({
              label: `[Vendor] ${vendor.name} (${vendor.contactEmail})`,
              value: vendor.contactEmail,
            })),
            ...clients.map((client) => ({
              label: `[Client] ${client.contactPerson} (${client.email})`,
              value: client.email,
            })),
          ];

  const handleTemplateSelect = (index: string) => {
    const templateConfig = TEMPLATES[parseInt(index, 10)];
    if (!templateConfig) return;
    setTemplate(index);
    setSubject(templateConfig.subject);
    setBody(templateConfig.body);
  };

  const handleSend = () => {
    if (!to) {
      setValidationError({
        open: true,
        message: "Please select a recipient before sending this email.",
      });
      return;
    }
    if (!subject.trim()) {
      setValidationError({
        open: true,
        message: "Please provide a subject line for this email.",
      });
      return;
    }
    if (!body.trim()) {
      setValidationError({
        open: true,
        message: "Please write the email body before sending.",
      });
      return;
    }

    addAuditEntry({
      user: user?.name || "System",
      action: "Email Sent",
      module: "Support",
      details: `Email to ${to}: ${subject}`,
      ipAddress: "192.168.1.1",
      status: "success",
    });

    toast({ title: "Email sent", description: `Message sent to ${to}` });
    onClose();
  };

  const handleAttach = () => {
    const name = `attachment-${attachments.length + 1}.pdf`;
    setAttachments((previous) => [...previous, name]);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DialogContent className="max-w-[96vw] lg:max-w-[82vw] xl:max-w-[72vw]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" /> Compose Email
            </DialogTitle>
            <DialogDescription>
              Draft a polished message and contact the selected organization
              immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-5 rounded-3xl border border-border/70 bg-muted/15 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>To *</Label>
                  <Select value={to} onValueChange={setTo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select recipient" />
                    </SelectTrigger>
                    <SelectContent>
                      {recipients.map((recipient) => (
                        <SelectItem
                          key={recipient.value}
                          value={recipient.value}
                        >
                          {recipient.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Template</Label>
                  <Select value={template} onValueChange={handleTemplateSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose template" />
                    </SelectTrigger>
                    <SelectContent>
                      {TEMPLATES.map((item, index) => (
                        <SelectItem key={item.label} value={String(index)}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label>CC</Label>
                  <Input
                    placeholder="cc@example.com"
                    value={cc}
                    onChange={(event) => setCc(event.target.value)}
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Subject *</Label>
                  <Input
                    placeholder="Email subject"
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                    maxLength={200}
                  />
                </div>
              </div>

              <div className="space-y-3 rounded-2xl border border-border/70 bg-card p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    Attachments
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={handleAttach}
                  >
                    <Paperclip className="h-4 w-4" /> Attach File
                  </Button>
                </div>
                {attachments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No files attached yet.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {attachments.map((attachment, index) => (
                      <Badge
                        key={attachment}
                        variant="secondary"
                        className="gap-1.5 px-3 py-1.5"
                      >
                        {attachment}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() =>
                            setAttachments((previous) =>
                              previous.filter(
                                (_, itemIndex) => itemIndex !== index,
                              ),
                            )
                          }
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Body *</Label>
                <Textarea
                  placeholder="Write your message..."
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  rows={16}
                  className="min-h-[22rem] rounded-3xl border-border/70 bg-card px-4 py-4 text-sm leading-relaxed"
                  maxLength={2000}
                />
              </div>

              <div className="flex flex-col justify-between gap-3 rounded-3xl border border-border/70 bg-muted/15 p-5 sm:flex-row sm:items-center">
                <div>
                  <p className="text-sm font-medium">Ready to send</p>
                  <p className="text-xs text-muted-foreground">
                    Validation will block invalid email drafts with a
                    full-screen alert.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button onClick={handleSend} className="gap-2">
                    <Send className="h-4 w-4" /> Send Email
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ValidationAlert
        open={validationError.open}
        onClose={() => setValidationError({ open: false, message: "" })}
        message={validationError.message}
      />
    </>
  );
}
