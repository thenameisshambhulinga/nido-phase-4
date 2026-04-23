import { useNavigate } from "react-router-dom";
import {
  Truck,
  Shield,
  Zap,
  Star,
  ShoppingCart,
  ArrowRight,
  MapPin,
  Phone,
  Mail,
  Monitor,
  FileText,
  Armchair,
  Package,
  Search,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useData } from "@/contexts/DataContext";

// Intersection observer hook for scroll-triggered animations
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

const categories = [
  { name: "Electronics", count: 245, icon: Monitor, emoji: "💻" },
  { name: "Office Supplies", count: 1250, icon: FileText, emoji: "📝" },
  { name: "Wooden Furniture", count: 156, icon: Armchair, emoji: "🪑" },
  { name: "Logistics Equipment", count: 89, icon: Package, emoji: "📦" },
];

const stats = [
  {
    value: "2000+",
    label: "Products Available",
    sub: "Curated for your business",
  },
  { value: "500+", label: "Happy Clients", sub: "Trusted partnerships" },
  { value: "98%", label: "Satisfaction Rate", sub: "Excellent service" },
];

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
  const { searchAll, masterCatalogItems, isCoreDataLoading, coreDataError } =
    useData();
  const [homeSearch, setHomeSearch] = useState("");
  const [debouncedHomeSearch, setDebouncedHomeSearch] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedHomeSearch(homeSearch);
    }, 220);
    return () => window.clearTimeout(timer);
  }, [homeSearch]);

  const quickResults = searchAll(debouncedHomeSearch).slice(0, 6);
  const featuredProducts = masterCatalogItems.slice(0, 4).map((item) => ({
    name: item.name,
    rating: item.performanceRating
      ? Math.min(5, item.performanceRating / 20)
      : 4.8,
    reviews: Math.max(0, item.initialStock),
    price: item.discountPrice ?? item.price ?? 0,
    emoji: item.category.toLowerCase().includes("hardware")
      ? "💻"
      : item.category.toLowerCase().includes("stationery")
        ? "📄"
        : "📦",
  }));

  return (
    <div className="min-h-screen bg-background overflow-y-auto">
      {/* Hero */}
      <section className="relative py-16 sm:py-24 px-4 sm:px-8 text-center bg-gradient-to-b from-secondary to-background">
        <AnimatedSection>
          <span className="inline-block px-4 py-1.5 mb-6 text-xs font-semibold tracking-wide border border-border rounded-full bg-card text-foreground hover:bg-accent transition-colors cursor-default">
            Premium E-Commerce Excellence
          </span>
        </AnimatedSection>
        <AnimatedSection delay={100}>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-muted-foreground/80 leading-tight mb-2">
            Elevate Your Business with
          </h1>
        </AnimatedSection>
        <AnimatedSection delay={200}>
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-bold text-primary leading-tight mb-6">
            Nido-Tech
          </h2>
        </AnimatedSection>
        <AnimatedSection delay={300}>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
            Your trusted B2B platform for daily-use items, office supplies, and
            logistics solutions.
          </p>
        </AnimatedSection>
        <AnimatedSection delay={400}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Button
              size="lg"
              className="w-full sm:w-auto px-8 py-3 text-base hover:scale-[1.02] active:scale-[0.98] transition-transform"
              onClick={() => navigate("/categories")}
            >
              Browse Shop
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto px-8 py-3 text-base border-primary text-primary hover:bg-primary/5 hover:scale-[1.02] active:scale-[0.98] transition-transform"
            >
              Learn More
            </Button>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={500}>
          <div className="mx-auto mt-8 w-full max-w-4xl">
            <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-card via-card to-secondary/60 p-2 shadow-xl shadow-primary/10">
              <div className="relative rounded-xl border border-border/60 bg-background/95 px-3 py-2 backdrop-blur-sm sm:px-4 sm:py-3">
                <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-primary/70">
                  <Search className="h-4 w-4" />
                </div>
                <input
                  value={homeSearch}
                  onChange={(event) => setHomeSearch(event.target.value)}
                  placeholder="Search products, clients, orders, vendors, invoices"
                  className="h-10 w-full rounded-lg border-0 bg-transparent pl-8 pr-28 text-sm outline-none placeholder:text-muted-foreground sm:text-base"
                />
                <div className="absolute inset-y-0 right-3 flex items-center gap-2">
                  <Badge className="hidden bg-primary/10 text-primary hover:bg-primary/10 sm:inline-flex">
                    <Sparkles className="mr-1 h-3.5 w-3.5" />
                    Smart Search
                  </Badge>
                </div>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2 px-2 pb-2">
                {[
                  "Office Chair",
                  "INV-",
                  "MacBook",
                  "Apex Tech",
                  "Pending Orders",
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setHomeSearch(chip)}
                    className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground transition hover:border-primary/40 hover:text-primary"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {debouncedHomeSearch.trim() ? (
                <div className="mx-2 mb-2 rounded-xl border border-border/70 bg-background p-2">
                  {quickResults.length ? (
                    <div className="grid gap-1">
                      {quickResults.map((result) => (
                        <button
                          key={`${result.group}-${result.id}`}
                          type="button"
                          onClick={() => navigate(result.path)}
                          className="flex items-center justify-between rounded-lg px-3 py-2 text-left transition hover:bg-secondary/70"
                        >
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {result.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {result.group} • {result.subtitle}
                            </p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="px-3 py-2 text-sm text-muted-foreground">
                      No matches found. Try a broader keyword.
                    </p>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* Features */}
      <section className="py-8 sm:py-12 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {[
            {
              icon: Truck,
              title: "Free Shipping",
              desc: "On orders over ₹7,999",
            },
            { icon: Shield, title: "Secure Payment", desc: "100% protected" },
            { icon: Zap, title: "Fast Delivery", desc: "2-day shipping" },
          ].map((f, i) => (
            <AnimatedSection key={f.title} delay={i * 100}>
              <Card className="border border-border bg-card hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-default">
                <CardContent className="flex items-center gap-4 p-5 sm:p-6">
                  <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{f.title}</p>
                    <p className="text-sm text-muted-foreground">{f.desc}</p>
                  </div>
                </CardContent>
              </Card>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* Shop by Category */}
      <section className="py-12 sm:py-16 px-4 sm:px-8 bg-secondary/50">
        <AnimatedSection>
          <div className="max-w-6xl mx-auto text-center mb-8 sm:mb-10">
            <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
              Shop by Category
            </h3>
            <p className="text-muted-foreground text-sm sm:text-base">
              Browse our extensive collection of business essentials
            </p>
          </div>
        </AnimatedSection>
        <div className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {categories.map((cat, i) => (
            <AnimatedSection key={cat.name} delay={i * 80}>
              <Card
                className="bg-card border border-border hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
                onClick={() => navigate("/categories")}
              >
                <CardContent className="p-4 sm:p-6 text-center">
                  <div className="text-4xl sm:text-5xl mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                    {cat.emoji}
                  </div>
                  <p className="font-semibold text-foreground mb-1 text-sm sm:text-base">
                    {cat.name}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                    {cat.count} products
                  </p>
                  <span className="inline-flex items-center gap-1 text-xs sm:text-sm font-medium text-primary group-hover:gap-2 transition-all duration-300">
                    Browse{" "}
                    <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </CardContent>
              </Card>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-12 sm:py-16 px-4 sm:px-8">
        <AnimatedSection>
          <div className="max-w-6xl mx-auto text-center mb-8 sm:mb-10">
            <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
              Featured Products
            </h3>
            <p className="text-muted-foreground text-sm sm:text-base">
              Hand-picked items for your business needs
            </p>
            {isCoreDataLoading ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Loading products...
              </p>
            ) : coreDataError ? (
              <p className="mt-2 text-sm text-muted-foreground">
                {coreDataError}
              </p>
            ) : null}
          </div>
        </AnimatedSection>
        <div className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {featuredProducts.length > 0 ? (
            featuredProducts.map((p, i) => (
              <AnimatedSection key={p.name} delay={i * 80}>
                <Card className="bg-card border border-border hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group overflow-hidden">
                  <CardContent className="p-0">
                    <div className="h-32 sm:h-44 bg-secondary/60 flex items-center justify-center text-5xl sm:text-6xl rounded-t-lg group-hover:bg-secondary/80 transition-colors">
                      <span className="group-hover:scale-110 transition-transform duration-300">
                        {p.emoji}
                      </span>
                    </div>
                    <div className="p-4 sm:p-5">
                      <p className="font-semibold text-foreground mb-2 text-sm sm:text-base line-clamp-1">
                        {p.name}
                      </p>
                      <div className="flex items-center gap-1 mb-3">
                        <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-warning text-warning" />
                        <span className="text-xs sm:text-sm font-medium text-foreground">
                          {p.rating}
                        </span>
                        <span className="text-[10px] sm:text-xs text-muted-foreground">
                          ({p.reviews})
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-lg sm:text-xl font-bold text-primary">
                          ₹{p.price}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 border-border hover:bg-primary hover:text-primary-foreground hover:border-primary active:scale-95 transition-all"
                        >
                          <ShoppingCart className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </AnimatedSection>
            ))
          ) : (
            <Card className="col-span-full border-dashed">
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No products
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 sm:py-16 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {stats.map((s, i) => (
            <AnimatedSection key={s.label} delay={i * 100}>
              <Card className="bg-card border border-border text-center hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                <CardContent className="p-6 sm:p-8">
                  <p className="text-3xl sm:text-4xl font-bold text-primary mb-2">
                    {s.value}
                  </p>
                  <p className="font-semibold text-foreground mb-1 text-sm sm:text-base">
                    {s.label}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {s.sub}
                  </p>
                </CardContent>
              </Card>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 sm:py-16 px-4 sm:px-8">
        <AnimatedSection>
          <div className="max-w-6xl mx-auto rounded-2xl bg-primary/15 p-8 sm:p-12 text-center">
            <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
              Ready to Get Started?
            </h3>
            <p className="text-muted-foreground mb-6 sm:mb-8 max-w-lg mx-auto text-sm sm:text-base">
              Join hundreds of businesses that trust NidoTech for their supply
              needs.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Button
                size="lg"
                className="w-full sm:w-auto hover:scale-[1.02] active:scale-[0.98] transition-transform"
                onClick={() => navigate("/categories")}
              >
                Browse Products
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto hover:scale-[1.02] active:scale-[0.98] transition-transform"
              >
                Contact Sales
              </Button>
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-secondary/30 py-8 sm:py-12 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10">
          <div>
            <h4 className="font-bold text-foreground text-lg mb-1">
              NIDO-TECHNOLOGY
            </h4>
            <p className="text-sm text-primary mb-4">
              Premium E-Commerce Excellence
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-3">Quick Links</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {["About Us", "Products", "Services", "Contact", "Blog"].map(
                (l) => (
                  <li
                    key={l}
                    className="hover:text-primary hover:translate-x-1 cursor-pointer transition-all duration-200"
                  >
                    {l}
                  </li>
                ),
              )}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-3">Contact Info</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                #41/1, 2nd Floor, 10th Cross, 11th Main, Wilsongarden, Bengaluru
                - 560027
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0" />
                +91 99833983
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0" />
                nidotechnologies@gmail.com
              </li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-8 sm:mt-10 pt-6 border-t border-border flex flex-col md:flex-row items-center justify-between text-xs text-muted-foreground gap-2">
          <p>© 2025 NIDO-TECHNOLOGY. All rights reserved.</p>
          <div className="flex gap-6">
            <span className="hover:text-primary cursor-pointer transition-colors">
              Privacy Policy
            </span>
            <span className="hover:text-primary cursor-pointer transition-colors">
              Terms of Service
            </span>
            <span className="hover:text-primary cursor-pointer transition-colors">
              Cookies
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
