import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import {
  ShoppingCart,
  ClipboardCheck,
  BarChart3,
  Users,
  Shield,
  ArrowRight,
  Zap,
  Globe,
  Lock,
} from "lucide-react";
import { isValidEmail, normalizeEmail } from "@/lib/validation";
import { usePreferences } from "@/store/preferencesStore";

const isLocalhost = Boolean(
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname.includes("localhost") ||
    window.location.hostname === "::1"),
);

const WORKFLOW_STEPS = [
  { icon: ShoppingCart, title: "Procurement", desc: "Streamlined purchasing workflows" },
  { icon: ClipboardCheck, title: "Approvals", desc: "Multi-level approval chains" },
  { icon: BarChart3, title: "Analytics", desc: "Real-time spend insights" },
  { icon: Users, title: "Vendor Mgmt", desc: "End-to-end vendor lifecycle" },
];

const FEATURES = [
  { icon: Zap, text: "Automated purchase orders" },
  { icon: Globe, text: "Multi-location support" },
  { icon: Shield, text: "Role-based access control" },
  { icon: Lock, text: "Enterprise-grade security" },
];

const LANDING_ROUTES: Record<string, string> = {
  'home': '/home',
  'shop': '/shop',
  'global-search': '/search',
  'orders': '/procure/requests',
  'invoices': '/sales/invoices',
  'tickets': '/support/tickets',
  'dashboard': '/dashboard',
  'help': '/support',
  'employees': '/users/management',
  'subscribers': '/subscribers',
  'subscriptions': '/subscriptions',
  'wireless-overview': '/wireless/overview',
  'fulfillment': '/shop/fulfillment',
  'group-orders': '/shop/group-orders',
  'telecom-bill': '/reports/telecom-bill',
  'mdm-overview': '/mdm/overview',
};

export default function LoginPage() {
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const prefs = usePreferences();
  const [loginEmail, setLoginEmail] = useState("owner@nidotech.com");
  const [loginPassword, setLoginPassword] = useState("Owner@12345!");
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

  const getLandingRoute = () => {
    return LANDING_ROUTES[prefs.landingPage] || '/home';
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(loginEmail)) {
      toast({ title: "Invalid email", description: "Enter a valid email address to continue.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const success = await login(normalizeEmail(loginEmail), loginPassword);
    setLoading(false);
    if (success) {
      navigate(getLandingRoute());
      toast({ title: "Welcome back!", description: "Successfully logged in." });
    } else {
      toast({ title: "Login Failed", description: "Invalid credentials.", variant: "destructive" });
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const success = await signup({
      name: signupName,
      email: signupEmail,
      password: signupPassword,
      organization: signupOrg,
      role: signupRole as any,
    });
    setLoading(false);
    if (success) {
      navigate(getLandingRoute());
      toast({ title: "Welcome!", description: "Account created successfully." });
    }
  };

  const StepIcon = WORKFLOW_STEPS[activeStep].icon;

  return (
    <div className="min-h-screen flex bg-background">
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-sidebar text-sidebar-foreground flex-col justify-between p-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sidebar-primary/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-sidebar-primary/8 rounded-full translate-y-1/3 -translate-x-1/4 blur-2xl" />

        <div className="relative z-10">
          <div className={`transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <h1 className="text-3xl font-display font-bold text-sidebar-primary-foreground tracking-tight">Nido Tech</h1>
            <p className="text-[11px] uppercase tracking-[0.3em] text-sidebar-foreground/50 font-semibold mt-1">CorpEssentials</p>
          </div>

          <div className={`mt-12 transition-all duration-700 delay-200 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <div className="flex items-center gap-4 mb-6">
              <div className="h-14 w-14 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <StepIcon className="h-7 w-7 text-sidebar-primary-foreground" />
              </div>
              <div>
                <p className="text-xl font-bold text-sidebar-primary-foreground">{WORKFLOW_STEPS[activeStep].title}</p>
                <p className="text-sm text-sidebar-foreground/70">{WORKFLOW_STEPS[activeStep].desc}</p>
              </div>
            </div>
            <div className="flex gap-2">
              {WORKFLOW_STEPS.map((_, i) => (
                <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i === activeStep ? "bg-white w-8" : "bg-white/20"}`} />
              ))}
            </div>
          </div>

          <div className={`mt-16 transition-all duration-700 delay-500 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <p className="text-xs uppercase tracking-widest text-sidebar-foreground/50 mb-4 font-semibold">Enterprise Features</p>
            <div className="space-y-3">
              {FEATURES.map((f, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center">
                    <f.icon className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm text-sidebar-foreground/80">{f.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-sidebar-foreground/40">
          &copy; {new Date().getFullYear()} Nido Tech CorpEssentials
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="mx-auto w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-sidebar shadow-lg">
              <img src="/favicon.svg" alt="Nido Tech logo" className="h-11 w-11" />
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground">Nido Tech</h1>
            <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-medium mt-1">CorpEssentials</p>
          </div>

          <div className="hidden lg:block mb-8">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sidebar shadow-lg">
                <img src="/favicon.svg" alt="Nido Tech logo" className="h-10 w-10" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold text-foreground">Nido Tech</h1>
                <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-medium">CorpEssentials</p>
              </div>
            </div>
            <h2 className="text-xl font-display font-bold text-foreground">Welcome back</h2>
            <p className="text-sm text-muted-foreground mt-1">Sign in to your account to continue</p>
          </div>

          <Card className="shadow-xl border-border/40 backdrop-blur-sm">
            <Tabs defaultValue="login">
              <CardHeader className="pb-2">
                <TabsList className="grid w-full grid-cols-1">
                  <TabsTrigger value="login" className="text-sm">Sign In</TabsTrigger>
                </TabsList>
              </CardHeader>
              <CardContent className="pt-2">
                <TabsContent value="login" className="mt-0">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-xs font-medium">Email</Label>
                      <Input id="email" type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="email@company.com" className="h-10" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-xs font-medium">Password</Label>
                      <Input id="password" type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="••••••••" className="h-10" />
                    </div>
                    <Button type="submit" className="w-full h-10 gap-2 group" disabled={loading}>
                      {loading ? "Signing in..." : <><span>Sign In</span><ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></>}
                    </Button>
                    <div className="mt-4 rounded-lg border border-dashed border-border/70 bg-muted/30 p-4 text-sm text-muted-foreground">
                      User creation is owner-only. Log in with the owner account to create client admin and client user accounts.
                    </div>
                    {isLocalhost && (
                      <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm text-foreground">
                        <p className="font-semibold">Default owner credentials</p>
                        <p>Email: owner@nidotech.com</p>
                        <p>Password: Owner@12345!</p>
                      </div>
                    )}
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
