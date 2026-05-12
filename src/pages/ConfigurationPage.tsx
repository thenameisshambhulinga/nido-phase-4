import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Bell,
  BookOpen,
  ClipboardList,
  GitBranch,
  Plug,
  Settings,
  Tag,
  Users,
  Building2,
  ArrowRight,
} from "lucide-react";

type ConfigTab = {
  value:
    | "general"
    | "users"
    | "workflows"
    | "statuses"
    | "notifications"
    | "pricing"
    | "catalogue"
    | "vendor-categories"
    | "integrations";
  label: string;
  title: string;
  description: string;
  path?: string;
  icon: typeof Settings;
};

const CONFIG_TABS: ConfigTab[] = [
  {
    value: "general",
    label: "General Settings",
    title: "General Settings",
    description:
      "Organization defaults, localization, and platform-wide base settings.",
    path: "/configuration/general-settings",
    icon: Settings,
  },
  {
    value: "users",
    label: "Nido Users",
    title: "Nido Users",
    description: "Role mapping, user onboarding, and account permissions.",
    path: "/configuration/nido-users",
    icon: Users,
  },
  {
    value: "workflows",
    label: "Approval Workflows",
    title: "Approval Workflows",
    description: "Define approval chains and escalation routing logic.",
    path: "/configuration/workflows",
    icon: GitBranch,
  },
  {
    value: "statuses",
    label: "Order Statuses",
    title: "Order Statuses",
    description: "Control stage labels used in order lifecycle tracking.",
    path: "/configuration/order-statuses",
    icon: ClipboardList,
  },
  {
    value: "notifications",
    label: "Notifications",
    title: "Notifications",
    description: "Manage in-app, email, and reminder alerts.",
    path: "/configuration/notifications",
    icon: Bell,
  },
  {
    value: "pricing",
    label: "Pricing & Discounts",
    title: "Pricing & Discounts",
    description: "Maintain pricing, discount, tax, and coupon policies.",
    path: "/configuration/pricing",
    icon: Tag,
  },
  {
    value: "catalogue",
    label: "Master Catalogue",
    title: "Master Catalogue",
    description: "Manage products/services used across clients and orders.",
    path: "/configuration/master-catalogue",
    icon: BookOpen,
  },
  {
    value: "vendor-categories",
    label: "Vendor Categories",
    title: "Vendor Categories",
    description: "Classify vendor types for sourcing and reporting.",
    path: "/vendors/categories",
    icon: Building2,
  },
  {
    value: "integrations",
    label: "Integrations",
    title: "Integrations",
    description: "Connect external systems and manage API integrations.",
    icon: Plug,
  },
];

export default function ConfigurationPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ConfigTab["value"]>("general");

  return (
    <div>
      <Header title="Configuration" />
      <div className="animate-fade-in space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Configuration</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            All configuration modules are available here as tabs.
          </p>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as ConfigTab["value"])}
        >
          <TabsList className="h-auto w-full justify-start gap-2 overflow-x-auto bg-transparent p-0">
            {CONFIG_TABS.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="rounded-full border border-border bg-card px-4 py-2 text-xs data-[state=active]:border-primary data-[state=active]:bg-primary/10"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {CONFIG_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsContent key={tab.value} value={tab.value} className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Icon className="h-4 w-4 text-primary" />
                      {tab.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {tab.description}
                    </p>

                    {tab.value !== "integrations" ? (
                      <Button
                        onClick={() => tab.path && navigate(tab.path)}
                        className="gap-2"
                      >
                        Open Module <ArrowRight className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        onClick={() => navigate("/integrations")}
                        className="gap-2"
                      >
                        Open Integrations <ArrowRight className="h-4 w-4" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </div>
  );
}
