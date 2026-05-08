import { useNavigate } from "react-router-dom";
import { Truck, Shield, Zap, Search, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useData } from "@/contexts/DataContext";

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function AnimatedSection({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, inView } = useInView();
  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-out",
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
        className,
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { searchAll } = useData();
  const [homeSearch, setHomeSearch] = useState("");
  const [debouncedHomeSearch, setDebouncedHomeSearch] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedHomeSearch(homeSearch);
    }, 220);
    return () => window.clearTimeout(timer);
  }, [homeSearch]);

  const quickResults = searchAll(debouncedHomeSearch).slice(0, 6);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <section className="relative py-20 px-4 text-center">
        <AnimatedSection>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent leading-tight mb-6">
            Elevate Your Procurement
          </h1>
        </AnimatedSection>
        <AnimatedSection delay={200}>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-black mb-8">
            <span className="text-blue-600 underline decoration-yellow-400 decoration-4">
              Nido-Tech
            </span>
          </h2>
        </AnimatedSection>
        <AnimatedSection delay={400}>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
            Your trusted B2B platform for daily-use items, office supplies,
            electronics, and logistics solutions with enterprise-grade approval
            workflows.
          </p>
          <div className="flex justify-center gap-4 mb-10">
            <Button
              size="lg"
              className="rounded-xl font-semibold text-base px-8 h-12 gap-2"
              onClick={() => navigate("/categories")}
            >
              Browse Catalog
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="rounded-xl font-semibold text-base px-8 h-12 gap-2"
              onClick={() => navigate("/services")}
            >
              Learn More
            </Button>
          </div>
        </AnimatedSection>
        <AnimatedSection delay={600}>
          <div className="mx-auto w-full max-w-4xl">
            <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-card via-white to-card p-2 shadow-2xl">
              <div className="relative rounded-xl border bg-background px-6 py-4">
                <div className="absolute inset-y-0 left-6 flex items-center text-primary/70">
                  <Search className="h-5 w-5" />
                </div>
                <input
                  value={homeSearch}
                  onChange={(e) => setHomeSearch(e.target.value)}
                  placeholder="🔍 Search 2000+ products, vendors, clients, orders..."
                  className="h-14 w-full border-0 bg-transparent pl-16 pr-16 text-lg placeholder:text-muted-foreground focus:placeholder:text-transparent outline-none"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute inset-y-0 right-4 flex items-center"
                  onClick={() => setHomeSearch("")}
                >
                  {homeSearch ? (
                    <ArrowRight className="h-5 w-5" />
                  ) : (
                    <Sparkles className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>
            {debouncedHomeSearch && quickResults.length > 0 && (
              <div className="mt-4 max-w-4xl mx-auto rounded-xl border bg-card shadow-md">
                <div className="grid gap-2 p-4">
                  {quickResults.slice(0, 5).map((result: any) => (
                    <div
                      key={result.id}
                      className="flex items-center p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => navigate(result.path)}
                    >
                      <div className="mr-3">
                        <Badge variant="outline" className="text-xs">
                          {result.group}
                        </Badge>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{result.title}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {result.subtitle}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 ml-2 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </AnimatedSection>
        <AnimatedSection delay={800}>
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: Truck,
                title: "Lightning Delivery",
                desc: "Same-day dispatch • Track in real-time",
              },
              {
                icon: Shield,
                title: "Ironclad Security",
                desc: "Role-based approvals • Full audit trail",
              },
              {
                icon: Zap,
                title: "Budget Control",
                desc: "Pre-approved pricing • Auto workflows",
              },
            ].map((feature) => (
              <Card
                key={feature.title}
                className="group hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border-primary/30 bg-gradient-to-b from-card to-muted p-1 rounded-2xl"
              >
                <div className="bg-background p-8 rounded-xl h-full group-hover:bg-gradient-to-br group-hover:from-primary/5">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-primary/20 transition-all mb-6 mx-auto">
                    <feature.icon className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3 text-center">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-center leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </AnimatedSection>

        <AnimatedSection delay={900}>
          <div className="mt-16 max-w-6xl mx-auto rounded-[12px] border border-[#E5E7EB] bg-white p-6">
            <h3 className="text-lg font-semibold text-[#111827]">
              Trusted By Enterprise Teams
            </h3>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-[#6B7280] md:grid-cols-5">
              {["ABB", "HDFC Bank", "TCS", "Infosys", "Wipro"].map(
                (company) => (
                  <div
                    key={company}
                    className="rounded-md border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2 text-center font-medium"
                  >
                    {company}
                  </div>
                ),
              )}
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={1000}>
          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4 max-w-6xl mx-auto">
            {[
              { label: "Active Clients", value: "120+" },
              { label: "Monthly Orders", value: "18K+" },
              { label: "Vendor Network", value: "350+" },
              { label: "On-time SLA", value: "98.4%" },
            ].map((stat) => (
              <Card key={stat.label} className="p-4 text-center">
                <p className="text-2xl font-semibold text-[#111827]">
                  {stat.value}
                </p>
                <p className="text-sm text-[#6B7280]">{stat.label}</p>
              </Card>
            ))}
          </div>
        </AnimatedSection>

        <AnimatedSection delay={1100}>
          <div className="mt-10 max-w-6xl mx-auto grid gap-4 md:grid-cols-3">
            {[
              {
                quote:
                  "Nido made our procurement approval flow 3x faster and cut manual effort significantly.",
                name: "Rahul Menon",
                role: "Procurement Head, ABB",
              },
              {
                quote:
                  "The catalogue and vendor insights helped us reduce cost variance across branches.",
                name: "Pooja Nair",
                role: "Operations Manager, Infosys",
              },
              {
                quote:
                  "Audit-ready workflows and controls gave finance and compliance teams full visibility.",
                name: "Ankit Sharma",
                role: "Finance Controller, HDFC",
              },
            ].map((item) => (
              <Card key={item.name}>
                <Card className="border-0 shadow-none p-0">
                  <div className="p-5">
                    <p className="text-sm text-[#111827]">"{item.quote}"</p>
                    <p className="mt-4 text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-[#6B7280]">{item.role}</p>
                  </div>
                </Card>
              </Card>
            ))}
          </div>
        </AnimatedSection>

        <AnimatedSection delay={1200}>
          <div className="mt-12 max-w-6xl mx-auto rounded-[12px] border border-[#DBEAFE] bg-[#EFF6FF] p-6 text-center">
            <h3 className="text-xl font-semibold text-[#111827]">
              Ready to modernize enterprise procurement?
            </h3>
            <p className="mt-2 text-sm text-[#6B7280]">
              Launch controlled approvals, intelligent catalog operations, and
              multi-vendor visibility.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <Button onClick={() => navigate("/shop")}>Start Shopping</Button>
              <Button
                variant="outline"
                onClick={() => navigate("/configuration/master-catalogue")}
              >
                Manage Catalogue
              </Button>
            </div>
          </div>
        </AnimatedSection>

        <footer className="mt-16 border-t border-[#E5E7EB] pt-8 text-sm text-[#6B7280]">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <p>© {new Date().getFullYear()} Nido Tech CorpEssentials</p>
            <p>
              Enterprise Procurement Platform • Secure • Scalable • Audit-ready
            </p>
          </div>
        </footer>
      </section>
    </div>
  );
}
