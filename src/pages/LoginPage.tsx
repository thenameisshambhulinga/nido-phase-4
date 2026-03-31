import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  ShoppingCart, ClipboardCheck, BarChart3, Users, Shield,
  ArrowRight, Zap, Globe, Lock, CheckCircle2
} from "lucide-react";

const WORKFLOW_STEPS = [
  {
    icon: ShoppingCart,
    title: "Procurement",
    desc: "Streamlined purchasing workflows",
  },
  {
    icon: ClipboardCheck,
    title: "Approvals",
    desc: "Multi-level approval chains",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    desc: "Real-time spend insights",
  },
  {
    icon: Users,
    title: "Vendor Mgmt",
    desc: "End-to-end vendor lifecycle",
  },
];

const FEATURES = [
  { icon: Zap, text: "Automated purchase orders" },
  { icon: Globe, text: "Multi-location support" },
  { icon: Shield, text: "Role-based access control" },
  { icon: Lock, text: "Enterprise-grade security" },
];

export default function LoginPage() {
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const [loginEmail, setLoginEmail] = useState("owner@nidotech.com");
  const [loginPassword, setLoginPassword] = useState("password");
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupOrg, setSignupOrg] = useState("");
  const [signupRole, setSignupRole] = useState<string>("owner");
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % WORKFLOW_STEPS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const success = await login(loginEmail, loginPassword);
    setLoading(false);
    if (success) {
      navigate("/home");
      toast({ title: "Welcome back!", description: "Successfully logged in." });
    } else {
      toast({ title: "Login Failed", description: "Invalid credentials.", variant: "destructive" });
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const success = await signup({
      name: signupName, email: signupEmail, password: signupPassword,
      organization: signupOrg, role: signupRole as any,
    });
    setLoading(false);
    if (success) {
      navigate("/home");
      toast({ title: "Welcome!", description: "Account created successfully." });
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left panel — branding & workflow showcase */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-sidebar text-sidebar-foreground flex-col justify-between p-10">
        {/* Decorative shapes */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-sidebar-primary/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-sidebar-primary/8 rounded-full translate-y-1/3 -translate-x-1/4 blur-2xl" />

        <div className="relative z-10">
          <div className={`transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <h1 className="text-3xl font-display font-bold text-sidebar-primary-foreground tracking-tight">
              Nido Tech
            </h1>
            <p className="text-[11px] uppercase tracking-[0.3em] text-sidebar-foreground/50 font-semibold mt-1">
              CorpEssentials
            </p>
          </div>

          <div className={`mt-12 transition-all duration-700 delay-200 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <h2 className="text-2xl font-display font-semibold text-sidebar-primary-foreground/90 leading-snug max-w-md">
              B2B Procurement & Vendor Management, simplified.
            </h2>
            <p className="text-sm text-sidebar-foreground/60 mt-3 max-w-sm leading-relaxed">
              Manage vendors, automate approvals, track spending — all from one unified platform.
            </p>
          </div>
        </div>

        {/* Workflow steps */}
        <div className={`relative z-10 transition-all duration-700 delay-500 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <p className="text-[10px] uppercase tracking-[0.2em] text-sidebar-foreground/40 font-semibold mb-4">
            How it works
          </p>
          <div className="flex gap-3">
            {WORKFLOW_STEPS.map((step, i) => {
              const Icon = step.icon;
              const isActive = i === activeStep;
              return (
                <button
                  key={step.title}
                  onClick={() => setActiveStep(i)}
                  className={`flex-1 rounded-xl p-4 transition-all duration-500 text-left border ${
                    isActive
                      ? "bg-sidebar-primary/20 border-sidebar-primary/40 shadow-lg shadow-sidebar-primary/10"
                      : "bg-sidebar-accent/30 border-sidebar-border/50 hover:bg-sidebar-accent/50"
                  }`}
                >
                  <Icon className={`h-5 w-5 mb-2 transition-colors ${isActive ? "text-sidebar-primary" : "text-sidebar-foreground/40"}`} />
                  <p className={`text-xs font-semibold mb-0.5 ${isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/70"}`}>
                    {step.title}
                  </p>
                  <p className="text-[10px] text-sidebar-foreground/40 leading-relaxed">{step.desc}</p>
                </button>
              );
            })}
          </div>

          {/* Features list */}
          <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-2.5">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.text} className="flex items-center gap-2.5">
                  <Icon className="h-3.5 w-3.5 text-sidebar-primary/80" />
                  <span className="text-xs text-sidebar-foreground/60">{f.text}</span>
                </div>
              );
            })}
          </div>
        </div>

        <p className="relative z-10 text-[10px] text-sidebar-foreground/30 mt-6">
          © 2026 Nido Tech. All rights reserved.
        </p>
      </div>

      {/* Right panel — login / signup form */}
      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className={`w-full max-w-md transition-all duration-700 delay-300 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          {/* Mobile-only branding */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-2xl font-display font-bold text-foreground">Nido Tech</h1>
            <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-medium mt-1">CorpEssentials</p>
            <p className="text-sm text-muted-foreground mt-3">B2B Procurement & Vendor Management</p>
          </div>

          <div className="hidden lg:block mb-8">
            <h2 className="text-xl font-display font-bold text-foreground">Welcome back</h2>
            <p className="text-sm text-muted-foreground mt-1">Sign in to your account to continue</p>
          </div>

          <Card className="shadow-xl border-border/40 backdrop-blur-sm">
            <Tabs defaultValue="login">
              <CardHeader className="pb-2">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login" className="text-sm">Sign In</TabsTrigger>
                  <TabsTrigger value="signup" className="text-sm">Sign Up</TabsTrigger>
                </TabsList>
              </CardHeader>
              <CardContent className="pt-2">
                <TabsContent value="login" className="mt-0">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-xs font-medium">Email</Label>
                      <Input
                        id="email" type="email" value={loginEmail}
                        onChange={e => setLoginEmail(e.target.value)}
                        placeholder="email@company.com"
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-xs font-medium">Password</Label>
                      <Input
                        id="password" type="password" value={loginPassword}
                        onChange={e => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="h-10"
                      />
                    </div>
                    <Button type="submit" className="w-full h-10 gap-2 group" disabled={loading}>
                      {loading ? "Signing in..." : (
                        <>
                          Sign In
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </>
                      )}
                    </Button>

                    <div className="rounded-lg border border-border/60 bg-muted/30 p-3.5 space-y-2">
                      <p className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary/60" />
                        Demo Accounts
                      </p>
                      <div className="grid grid-cols-1 gap-1.5">
                        {[
                          { label: "Owner", email: "owner@nidotech.com" },
                          { label: "Admin", email: "admin@nidotech.com" },
                          { label: "PM", email: "procurement@nidotech.com" },
                        ].map((acct) => (
                          <button
                            key={acct.email}
                            type="button"
                            onClick={() => { setLoginEmail(acct.email); setLoginPassword("password"); }}
                            className="flex items-center justify-between rounded-md px-3 py-1.5 text-xs hover:bg-accent transition-colors group text-left"
                          >
                            <span className="font-medium text-foreground/80">{acct.label}</span>
                            <span className="text-muted-foreground group-hover:text-foreground transition-colors">{acct.email}</span>
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-muted-foreground/60 text-center">Any password works for demo</p>
                    </div>
                  </form>
                </TabsContent>

                <TabsContent value="signup" className="mt-0">
                  <form onSubmit={handleSignup} className="space-y-3.5">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Full Name</Label>
                      <Input value={signupName} onChange={e => setSignupName(e.target.value)} placeholder="John Smith" required className="h-10" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Email</Label>
                      <Input type="email" value={signupEmail} onChange={e => setSignupEmail(e.target.value)} placeholder="email@company.com" required className="h-10" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Organization</Label>
                      <Input value={signupOrg} onChange={e => setSignupOrg(e.target.value)} placeholder="Company Name" required className="h-10" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Role</Label>
                      <Select value={signupRole} onValueChange={setSignupRole}>
                        <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="owner">Platform Owner</SelectItem>
                          <SelectItem value="vendor">Vendor</SelectItem>
                          <SelectItem value="client_admin">Client Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Password</Label>
                      <Input type="password" value={signupPassword} onChange={e => setSignupPassword(e.target.value)} placeholder="••••••••" required className="h-10" />
                    </div>
                    <Button type="submit" className="w-full h-10 gap-2 group" disabled={loading}>
                      {loading ? "Creating..." : (
                        <>
                          Create Account
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </>
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
}
