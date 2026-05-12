import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  ClipboardList,
  Recycle,
  ShieldCheck,
  Wrench,
} from "lucide-react";

const SERVICE_CARDS = [
  {
    title: "Annual Maintenance Contract",
    description:
      "Create AMC requests with mandatory client, category, duration, and authorization details.",
    icon: Wrench,
    href: "/services/amc/new",
    tone: "from-blue-50 to-cyan-50 border-blue-200",
    badge: "Primary workflow",
  },
  {
    title: "Recycle / Disposal",
    description:
      "Capture equipment recycling and disposal requests in a guided service flow.",
    icon: Recycle,
    href: "/support",
    tone: "from-emerald-50 to-teal-50 border-emerald-200",
    badge: "Service desk",
  },
  {
    title: "Service Desk Requests",
    description:
      "Raise supporting service tickets, track progress, and keep stakeholders aligned.",
    icon: ClipboardList,
    href: "/support",
    tone: "from-slate-50 to-white border-slate-200",
    badge: "Ticketing",
  },
];

export default function ServicesPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-8 p-6">
      <Header title="Services" />

      <div className="relative overflow-hidden rounded-[32px] border border-blue-200/70 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-8 text-white shadow-2xl">
        <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-blue-500/25 blur-3xl" />
        <div className="absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <Badge className="w-fit rounded-full border border-white/15 bg-white/10 text-white hover:bg-white/15">
              Services Hub
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              One place for AMC, recycling, and service requests.
            </h1>
            <p className="max-w-xl text-sm text-slate-200 md:text-base">
              Use the dedicated services workflow to open structured requests,
              keep client details consistent, and move faster with cleaner
              forms.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => navigate("/services/amc/new")}
              className="gap-2 rounded-full bg-white px-5 text-slate-950 hover:bg-slate-100"
            >
              New AMC <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/support")}
              className="gap-2 rounded-full border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              Open Service Desk
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {SERVICE_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.title}
              className={`overflow-hidden border bg-gradient-to-br ${card.tone} shadow-sm`}
            >
              <CardContent className="space-y-4 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 text-slate-900 shadow-sm">
                    <Icon className="h-6 w-6" />
                  </div>
                  <Badge variant="secondary" className="rounded-full">
                    {card.badge}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold">{card.title}</h2>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {card.description}
                  </p>
                </div>
                <Button
                  onClick={() => navigate(card.href)}
                  className="gap-2 rounded-full"
                  variant={
                    card.href === "/services/amc/new" ? "default" : "outline"
                  }
                >
                  Open <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="grid gap-6 p-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-500">
              Guided workflow
            </p>
            <h2 className="text-2xl font-semibold">
              Standardized service capture
            </h2>
            <p className="text-sm text-muted-foreground">
              The new AMC flow uses validated company selection, mandatory
              client fields, and clean section ordering so submissions are
              easier to approve.
            </p>
          </div>
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center gap-3 text-sm text-slate-700">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              Mandatory fields enforced
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
              <div className="rounded-2xl bg-white p-3 shadow-sm">
                Company dropdown
              </div>
              <div className="rounded-2xl bg-white p-3 shadow-sm">
                Client authorization
              </div>
              <div className="rounded-2xl bg-white p-3 shadow-sm">
                AMC duration
              </div>
              <div className="rounded-2xl bg-white p-3 shadow-sm">
                Scope & category
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
