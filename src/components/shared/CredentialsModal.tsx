import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, Download, Check, Mail } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { sendEmail, emailTemplates } from "@/lib/emailService";
import { useEnhancedAuth } from "@/contexts/EnhancedAuthContext";
import jsPDF from "jspdf";

interface Credentials {
  username: string;
  email: string;
  temporaryPassword: string;
}

interface CredentialsModalProps {
  open: boolean;
  onClose: () => void;
  credentials: Credentials | null;
  userType?:
    | "CLIENT_USER"
    | "CLIENT_ADMIN"
    | "VENDOR_USER"
    | "VENDOR_ADMIN"
    | "INTERNAL_EMPLOYEE"
    | "OWNER";
}

export default function CredentialsModal({
  open,
  onClose,
  credentials,
  userType = "CLIENT_USER",
}: CredentialsModalProps) {
  const [copiedFields, setCopiedFields] = useState<Set<string>>(new Set());
  const [sendingEmail, setSendingEmail] = useState(false);
  const { user } = useEnhancedAuth();

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedFields((prev) => new Set(prev).add(field));
    toast({
      title: "Copied!",
      description: `${field.replace("_", " ").toUpperCase()} copied to clipboard`,
    });
    setTimeout(() => {
      setCopiedFields((prev) => {
        const newSet = new Set(prev);
        newSet.delete(field);
        return newSet;
      });
    }, 2000);
  };

  const downloadCredentials = () => {
    if (!credentials || !user) return;

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("User Credentials", 20, 20);
    doc.setFontSize(12);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 35);
    doc.text(`Created by: ${user.fullName}`, 20, 45);
    doc.text(`User Type: ${userType.replace("_", " ").toUpperCase()}`, 20, 55);

    doc.text("─".repeat(40), 20, 70);
    doc.text("LOGIN DETAILS", 20, 80);
    doc.text(`Username: ${credentials.username}`, 20, 90);
    doc.text(`Email: ${credentials.email}`, 20, 100);
    doc.text(`Temp Password: ${credentials.temporaryPassword}`, 20, 110);

    doc.text("─".repeat(40), 20, 130);
    doc.text("IMPORTANT", 20, 140);
    doc.text("• User must change password on first login", 20, 150);
    doc.text("• Password expires in 24 hours", 20, 160);
    doc.text("• Contact IT if login issues", 20, 170);

    const filename = `credentials-${credentials.username}-${Date.now()}.pdf`;
    doc.save(filename);
    toast({ title: "Downloaded!", description: filename });
  };

  const sendCredentialsEmail = async () => {
    if (!credentials) return;

    setSendingEmail(true);
    try {
      const template = emailTemplates.userCredentials({
        username: credentials.username,
        email: credentials.email,
        temporaryPassword: credentials.temporaryPassword,
        createdBy: user?.fullName || "Nido Admin",
        userType,
        loginUrl: `${window.location.origin}/login`,
      });

      const sent = await sendEmail(credentials.email, template);
      if (sent) {
        toast({
          title: "Email Sent!",
          description: `Credentials emailed to ${credentials.email}`,
        });
      } else {
        toast({
          title: "Email Failed",
          description: "Please try manual copy/download",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Email Error",
        description: "Failed to send email",
        variant: "destructive",
      });
    } finally {
      setSendingEmail(false);
    }
  };

  if (!credentials) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Check className="h-5 w-5 text-emerald-500" />
            User Created Successfully
          </DialogTitle>
          <DialogDescription>
            Share these credentials with the user. They must change password on
            first login.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Badge variant="secondary" className="uppercase">
            {userType.replace("_", " ").toUpperCase()}
          </Badge>

          <div className="space-y-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Username</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <code className="font-mono text-sm bg-muted/50 px-2 py-1 rounded">
                    {credentials.username}
                  </code>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                      copyToClipboard(credentials.username, "username")
                    }
                    className="h-7 w-7"
                  >
                    {copiedFields.has("username") ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Email</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm">{credentials.email}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => copyToClipboard(credentials.email, "email")}
                    className="h-7 w-7"
                  >
                    {copiedFields.has("email") ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-amber/10 border-amber/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Temporary Password
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <code className="font-mono text-sm bg-muted/50 px-2 py-1 rounded">
                    {credentials.temporaryPassword
                      .replace(/./g, "*")
                      .slice(0, -3) + credentials.temporaryPassword.slice(-3)}
                  </code>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                      copyToClipboard(credentials.temporaryPassword, "password")
                    }
                    className="h-7 w-7"
                  >
                    {copiedFields.has("password") ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-amber-700 mt-1">
                  Password masked. Click copy to reveal.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              variant="outline"
              onClick={downloadCredentials}
              className="gap-1.5 flex-1"
            >
              <Download className="h-3.5 w-3.5" />
              Download PDF
            </Button>
            <Button
              onClick={sendCredentialsEmail}
              disabled={sendingEmail}
              className="gap-1.5 flex-1"
            >
              {sendingEmail ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border border-current border-t-transparent" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-3.5 w-3.5" />
                  Email User
                </>
              )}
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
