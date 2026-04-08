import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ShoppingCart,
  Wrench,
  HeadphonesIcon,
  Users,
  Building2,
  ShoppingBag,
  BarChart3,
  Settings,
  UserCog,
  Shield,
  CreditCard,
  ChevronDown,
  ChevronRight,
  MapPin,
  ClipboardList,
  Bell,
  CheckSquare,
  Tags,
  Workflow,
  LogOut,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useData } from "@/contexts/DataContext";

interface NavItem {
  label: string;
  icon: React.ElementType;
  path?: string;
  children?: NavChildItem[];
  module?: string;
}

interface NavChildItem {
  label: string;
  path?: string;
  children?: NavChildItem[];
}

const NAV_ITEMS: NavItem[] = [
  { label: "Home", icon: LayoutDashboard, module: "dashboard", path: "/home" },
  { label: "Shop", icon: Tags, module: "shop", path: "/categories" },
  {
    label: "Product Dashboard",
    icon: BarChart3,
    module: "dashboard",
    children: [
      { label: "Main Dashboard", path: "/dashboard" },
      { label: "Vendor Dashboard", path: "/dashboard/vendor" },
      { label: "SLA Overview", path: "/dashboard/sla" },
    ],
  },
  { label: "Services", icon: Wrench, module: "services", path: "/services" },
  {
    label: "Support",
    icon: HeadphonesIcon,
    module: "support",
    path: "/support",
  },
  {
    label: "Clients",
    icon: Users,
    module: "clients",
    children: [
      { label: "Client List", path: "/clients" },
      { label: "Client Addition", path: "/clients/add" },
      { label: "Contracts", path: "/clients/contracts" },
    ],
  },
  {
    label: "Vendors",
    icon: Building2,
    module: "vendors",
    children: [
      { label: "Vendor List", path: "/vendors" },
      { label: "Vendor Categories", path: "/vendors/categories" },
      { label: "Vendor Onboarding", path: "/vendors/onboarding" },
    ],
  },
  {
    label: "Procure",
    icon: ShoppingBag,
    module: "procure",
    children: [
      { label: "Orders", path: "/orders" },
      { label: "Purchase Requests", path: "/procure/requests" },
      { label: "Approvals", path: "/procure/approvals" },
    ],
  },
  {
    label: "Reports",
    icon: BarChart3,
    module: "reports",
    children: [
      { label: "Analytics", path: "/reports" },
      { label: "Audit Trail", path: "/reports/audit" },
    ],
  },
  {
    label: "Transactions",
    icon: CreditCard,
    module: "transactions",
    children: [
      {
        label: "Sales",
        children: [
          { label: "Quotes", path: "/sales/quotes" },
          { label: "Sales Orders", path: "/sales/orders" },
          { label: "Invoices", path: "/sales/invoices" },
          { label: "Recurring Invoices", path: "/sales/recurring-invoices" },
          { label: "Delivery Challans", path: "/sales/delivery-challans" },
          { label: "Payment Receipt", path: "/sales/payment-receipts" },
          { label: "Credit Notes", path: "/sales/credit-notes" },
          { label: "e-Way Bills", path: "/sales/e-way-bills" },
        ],
      },
      {
        label: "Purchases",
        children: [
          { label: "Expenses", path: "/transactions/purchase/expenses" },
          {
            label: "Recurring Expenses",
            path: "/transactions/purchase/recurring-expenses",
          },
          {
            label: "Purchase Orders",
            path: "/transactions/purchase/purchase-orders",
          },
          { label: "Bills", path: "/transactions/purchase/bills" },
          {
            label: "Recurring Bills",
            path: "/transactions/purchase/recurring-bills",
          },
          {
            label: "Payments Made",
            path: "/transactions/purchase/payments-made",
          },
          {
            label: "Vendor Credits",
            path: "/transactions/purchase/vendor-credits",
          },
        ],
      },
    ],
  },
  {
    label: "Configuration",
    icon: Settings,
    module: "configuration",
    path: "/configuration",
  },
];

// Configuration is owner-only unless explicitly delegated
const isConfigAllowed = (
  user: { role: string; modules?: string[] } | null,
  hasPermission: (m: string, a: string) => boolean,
) => {
  if (!user) return false;
  if (user.role === "owner") return true;
  // Check if user has explicit configuration delegation
  if (user.modules?.includes("configuration_delegate")) return true;
  return false;
};

interface SidebarProps {
  onClose?: () => void;
  isMobile?: boolean;
}

export default function Sidebar({ onClose, isMobile }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, hasPermission } = useAuth();
  const { totalItems } = useCart();
  const { organizations, generalSettings } = useData();
  const [expandedItems, setExpandedItems] = useState<string[]>(["Dashboard"]);

  const primaryOrgId = organizations[0]?.id || "";
  const branding = generalSettings[primaryOrgId];

  const toggleExpand = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label) ? prev.filter((i) => i !== label) : [...prev, label],
    );
  };

  const isPathActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  const isChildActive = (child: NavChildItem): boolean => {
    if (child.path && isPathActive(child.path)) return true;
    return (
      child.children?.some((nestedChild) => isChildActive(nestedChild)) || false
    );
  };

  const isParentActive = (item: NavItem) =>
    item.children?.some((child) => isChildActive(child)) || false;

  const handleNavigate = (path: string) => {
    navigate(path);
    if (isMobile && onClose) onClose();
  };

  return (
    <aside className="w-60 h-screen bg-sidebar text-sidebar-foreground flex flex-col">
      <div className="p-5 border-b border-sidebar-border flex items-center justify-between">
        <div>
          {branding?.companyLogo ? (
            <img
              src={branding.companyLogo}
              alt={branding.companyName || "Company logo"}
              className="h-10 w-36 rounded object-contain object-left"
            />
          ) : (
            <>
              <h1 className="text-lg font-display font-bold text-sidebar-primary-foreground tracking-tight">
                {(branding?.companyName || "Nido Tech")
                  .split(" ")
                  .slice(0, 2)
                  .join(" ")}
              </h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-sidebar-foreground/60 font-medium">
                CorpEssentials
              </p>
            </>
          )}
        </div>
        {isMobile && (
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-sidebar-accent transition-colors active:scale-95"
          >
            <X className="h-4 w-4 text-sidebar-foreground" />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin py-2">
        {NAV_ITEMS.map((item) => {
          if (
            item.module === "configuration" &&
            !isConfigAllowed(user, hasPermission)
          )
            return null;
          if (
            item.module &&
            item.module !== "configuration" &&
            !hasPermission(item.module, "view") &&
            user?.role !== "owner"
          )
            return null;
          const Icon = item.icon;
          const expanded = expandedItems.includes(item.label);
          const parentActive = isParentActive(item);
          const active = item.path ? isPathActive(item.path) : false;

          const renderChildren = (
            children: NavChildItem[],
            parentKey: string,
            depth: number,
          ) => (
            <div className={cn("space-y-0.5", depth === 0 ? "ml-9" : "ml-4")}>
              {children.map((child) => {
                const childKey = `${parentKey}-${child.label}`;
                const childExpanded = expandedItems.includes(childKey);
                const childActive = isChildActive(child);

                return (
                  <div key={childKey}>
                    <button
                      onClick={() => {
                        if (child.children) {
                          toggleExpand(childKey);
                          return;
                        }
                        if (child.path) handleNavigate(child.path);
                      }}
                      className={cn(
                        "w-full flex items-center gap-2 text-left px-4 py-2 transition-all duration-150 hover:text-sidebar-primary-foreground hover:bg-sidebar-accent",
                        depth === 0 ? "text-xs" : "text-[11px]",
                        childActive
                          ? "text-sidebar-primary bg-sidebar-accent/50 font-medium"
                          : "text-sidebar-foreground/70",
                      )}
                    >
                      <span className="flex-1">{child.label}</span>
                      {child.children && (
                        <ChevronDown
                          className={cn(
                            "h-3 w-3 transition-transform duration-200",
                            !childExpanded && "-rotate-90",
                          )}
                        />
                      )}
                    </button>

                    {child.children && (
                      <div
                        className={cn(
                          "border-l border-sidebar-border overflow-hidden transition-all duration-200",
                          childExpanded
                            ? "max-h-96 opacity-100"
                            : "max-h-0 opacity-0",
                          "ml-2",
                        )}
                      >
                        {renderChildren(child.children, childKey, depth + 1)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );

          return (
            <div key={item.label}>
              <button
                onClick={() => {
                  if (item.children) toggleExpand(item.label);
                  else if (item.path) handleNavigate(item.path);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-5 py-2.5 text-sm transition-all duration-200 hover:bg-sidebar-accent group",
                  (parentActive || active) &&
                    "bg-sidebar-accent text-sidebar-primary border-l-2 border-sidebar-primary",
                  !parentActive && !active && "border-l-2 border-transparent",
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110",
                    (parentActive || active) && "text-sidebar-primary",
                  )}
                />
                <span className="flex-1 text-left">{item.label}</span>
                {item.children && (
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 transition-transform duration-200",
                      !expanded && "-rotate-90",
                    )}
                  />
                )}
              </button>
              <div
                className={cn(
                  "ml-9 border-l border-sidebar-border overflow-hidden transition-all duration-200",
                  item.children && expanded
                    ? "max-h-96 opacity-100"
                    : "max-h-0 opacity-0",
                )}
              >
                {item.children && renderChildren(item.children, item.label, 0)}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-8 w-8 rounded-full bg-sidebar-primary flex items-center justify-center text-xs font-bold text-sidebar-primary-foreground">
            {user?.name?.charAt(0) || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">
              {user?.name || "User"}
            </p>
            <p className="text-[10px] text-sidebar-foreground/60 truncate capitalize">
              {user?.role?.replace("_", " ")}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 text-xs text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors w-full active:scale-[0.98]"
        >
          <LogOut className="h-3.5 w-3.5" /> Sign Out
        </button>
      </div>
    </aside>
  );
}
