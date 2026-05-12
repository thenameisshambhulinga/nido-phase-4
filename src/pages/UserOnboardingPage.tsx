import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

type InvitationPayload = {
  id: string;
  name: string;
  email: string;
  role: string;
  organization: string;
  expiresAt: string;
};

export default function UserOnboardingPage() {
  const { token = "" } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [invitation, setInvitation] = useState<InvitationPayload | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    const loadInvitation = async () => {
      try {
        const payload = await apiRequest<InvitationPayload>(
          `/auth/invitations/${token}`,
        );
        setInvitation(payload);
      } catch (error: any) {
        toast({
          title: "Invitation unavailable",
          description: error?.message || "This setup link is invalid or expired.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    void loadInvitation();
  }, [token]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < 8) {
      toast({
        title: "Password too short",
        description: "Use at least 8 characters.",
        variant: "destructive",
      });
      return;
    }
    if (password !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Re-enter the same password in both fields.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      await apiRequest("/auth/reset-password", {
        method: "PATCH",
        body: {
          token,
          newPassword: password,
        },
      });
      toast({
        title: "Account ready",
        description: "Your password has been set. Please sign in.",
      });
      navigate("/login", { replace: true });
    } catch (error: any) {
      toast({
        title: "Setup failed",
        description: error?.message || "Unable to finish account setup.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-full flex items-center justify-center bg-slate-100 px-4 py-10">
      <Card className="w-full max-w-lg border-slate-200 shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Set Up Your Account</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading invitation…</p>
          ) : !invitation ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This setup link is no longer available.
              </p>
              <Button onClick={() => navigate("/login")} className="w-full">
                Return to Login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="rounded-xl border bg-slate-50 p-4 text-sm">
                <p className="font-medium text-slate-900">{invitation.name}</p>
                <p className="text-slate-600">{invitation.email}</p>
                <p className="text-slate-600">
                  {invitation.organization || "Nido Tech"} • {invitation.role}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Create Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Minimum 8 characters"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Re-enter your password"
                />
              </div>

              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? "Setting up account..." : "Complete Setup"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
