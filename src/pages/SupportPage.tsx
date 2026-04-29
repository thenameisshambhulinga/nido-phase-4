import { useMemo, useState } from "react";
import Header from "@/components/layout/Header";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { safeReadJson } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bot,
  Calendar,
  Check,
  ChevronLeft,
  Clock3,
  FileText,
  Headphones,
  Info,
  LifeBuoy,
  Link2,
  MessageSquare,
  Plus,
  Search,
  Settings2,
  ShieldAlert,
  Sparkles,
  Ticket,
  TrendingUp,
  UserCircle2,
  Users,
  Wrench,
} from "lucide-react";

type TicketPriority = "High" | "Medium" | "Low";
type TicketStatus =
  | "Open"
  | "Assigned"
  | "In Progress"
  | "Waiting"
  | "Resolved"
  | "Closed"
  | "Escalated";
type RequestType = "Procure to Pay" | "Services";
type TicketType = "Parent" | "Child" | "Issue";
type SlaHealth = "healthy" | "at_risk" | "breached";

type TicketComment = {
  id: string;
  author: string;
  role: string;
  channel: "Internal" | "External" | "System";
  body: string;
  createdAt: string;
};

type TimelineEntry = {
  id: string;
  title: string;
  subtitle: string;
  channel: "System" | "Internal" | "External";
  createdAt: string;
};

type TicketRecord = {
  id: string;
  subject: string;
  requestType: RequestType;
  category: string;
  subCategory: string;
  organization: string;
  status: TicketStatus;
  priority: TicketPriority;
  impact: "High" | "Medium" | "Low";
  urgency: "High" | "Medium" | "Low";
  assignedTeam: string;
  assignee: string;
  backupAssignee?: string;
  ticketType: TicketType;
  source: "Portal" | "Email" | "System";
  description: string;
  createdAt: string;
  createdBy: string;
  dueDate: string;
  slaHours: number;
  typicalSla: string;
  poNumber?: string;
  orderId?: string;
  invoiceNumber?: string;
  vendorName?: string;
  location?: string;
  tags: string[];
  childIds: string[];
  parentId?: string;
  attachments: { id: string; name: string; size: string }[];
  comments: TicketComment[];
  timeline: TimelineEntry[];
};

type CreateForm = {
  requestType: RequestType;
  category: string;
  subCategory: string;
  subject: string;
  description: string;
  poNumber: string;
  orderId: string;
  invoiceNumber: string;
  invoiceDate: string;
  vendorName: string;
  clientContact: string;
  location: string;
  impact: "High" | "Medium" | "Low";
  urgency: "High" | "Medium" | "Low";
  priority: TicketPriority;
  assignedTeam: string;
  assignee: string;
  backupAssignee: string;
  assignmentMethod: "auto" | "manual";
  escalationEnabled: boolean;
  createChildren: boolean;
  attachments: { id: string; name: string; size: string }[];
};

const STORAGE_KEY = "nido_services_tickets_v2";

const REQUEST_TYPE_OPTIONS = [
  {
    value: "Procure to Pay" as const,
    label: "Procure to Pay",
    icon: Ticket,
    description:
      "Issues related to procurement, orders, invoices, payments and deliveries.",
    sla: "Typical SLA: 4 - 12 hrs",
    tint: "from-violet-50 to-fuchsia-50 border-violet-200",
    badge: "bg-violet-100 text-violet-700",
  },
  {
    value: "Services" as const,
    label: "Services",
    icon: Wrench,
    description:
      "Issues related to equipment, AMC, repairs, returns and installation.",
    sla: "Typical SLA: 8 - 48 hrs",
    tint: "from-emerald-50 to-teal-50 border-emerald-200",
    badge: "bg-emerald-100 text-emerald-700",
  },
];

const CATEGORY_MAP: Record<
  RequestType,
  { label: string; description: string }[]
> = {
  "Procure to Pay": [
    {
      label: "RFQ Issues",
      description: "Problems with RFQ creation or replies",
    },
    {
      label: "PO Creation Delay",
      description: "Delays in purchase order creation",
    },
    {
      label: "Invoice Mismatch",
      description: "Mismatch in invoice amount or details",
    },
    { label: "Payment Delay", description: "Delays in payment processing" },
    { label: "Delivery Issues", description: "Delivery delays or issues" },
    {
      label: "Partial Shipment",
      description: "Part shipment or quantity issues",
    },
  ],
  Services: [
    { label: "AMC Request", description: "Request for AMC services" },
    {
      label: "Repair / Breakdown",
      description: "Equipment repair or breakdown",
    },
    {
      label: "Return / Replacement",
      description: "Return, replacement or exchange",
    },
    {
      label: "Recycle / Disposal",
      description: "Disposal or recycle of equipment",
    },
    {
      label: "Installation Support",
      description: "Installation or configuration help",
    },
  ],
};

const TEAM_OPTIONS = [
  "Finance Team",
  "Vendor Team",
  "Logistics Team",
  "Accounts Team",
  "Service Desk",
  "Field Operations",
];

const ASSIGNEE_OPTIONS = [
  "John Doe",
  "Jane Cooper",
  "Rohit Sharma",
  "Priya Nair",
  "Arjun Mehta",
  "Sneha Iyer",
  "Robert Fox",
];

const ESCALATION_RULES = [
  {
    level: "Level 1",
    after: "After 2h 00m",
    assignee: "Team Lead",
  },
  {
    level: "Level 2",
    after: "After 3h 00m",
    assignee: "Finance Manager",
  },
  {
    level: "Level 3",
    after: "After 2h 00m",
    assignee: "Head of Finance",
  },
];

const DEFAULT_FORM: CreateForm = {
  requestType: "Procure to Pay",
  category: "Invoice Mismatch",
  subCategory: "Tax amount mismatch",
  subject: "Invoice amount mismatch for PO #45001234",
  description:
    "The invoice amount for PO #45001234 is mismatched. The tax amount charged is higher than what is mentioned in the purchase order. Kindly review and take necessary action.",
  poNumber: "45001234",
  orderId: "ORD-884512",
  invoiceNumber: "INV-778899",
  invoiceDate: "2025-05-23",
  vendorName: "Beta Inc",
  clientContact: "John Doe",
  location: "Mumbai - Head Office",
  impact: "High",
  urgency: "High",
  priority: "High",
  assignedTeam: "Finance Team",
  assignee: "John Doe",
  backupAssignee: "Jane Cooper",
  assignmentMethod: "auto",
  escalationEnabled: true,
  createChildren: true,
  attachments: [
    { id: "att-1", name: "invoice_778899.pdf", size: "245 KB" },
    { id: "att-2", name: "po_45001234.pdf", size: "198 KB" },
    { id: "att-3", name: "purchase_terms.png", size: "128 KB" },
  ],
};

const INITIAL_TICKETS: TicketRecord[] = [
  {
    id: "TKT-2025-000123",
    subject: "Invoice amount mismatch for PO# 45001234",
    requestType: "Procure to Pay",
    category: "Invoice Mismatch",
    subCategory: "Tax amount mismatch",
    organization: "Acme Corp",
    status: "In Progress",
    priority: "High",
    impact: "Medium",
    urgency: "High",
    assignedTeam: "Finance Team",
    assignee: "John Doe",
    backupAssignee: "Jane Cooper",
    ticketType: "Parent",
    source: "Portal",
    description:
      "The invoice amount for PO# 45001234 is mismatched. The tax amount charged is higher than what is mentioned in the purchase order.",
    createdAt: "2025-05-23T09:15:00",
    createdBy: "John Doe",
    dueDate: "2025-05-23T18:00:00",
    slaHours: 12,
    typicalSla: "4 - 12 hrs",
    poNumber: "45001234",
    orderId: "ORD-24815779",
    invoiceNumber: "INV-778899",
    vendorName: "Beta Inc",
    location: "Mumbai - Head Office",
    tags: ["Invoice", "GST", "PO #45001234"],
    childIds: [
      "TKT-2025-000124",
      "TKT-2025-000125",
      "TKT-2025-000126",
      "TKT-2025-000127",
    ],
    attachments: [
      { id: "a-1", name: "invoice_45001234.pdf", size: "245 KB" },
      { id: "a-2", name: "po_45001234.pdf", size: "198 KB" },
    ],
    comments: [
      {
        id: "c-1",
        author: "Jane Cooper",
        role: "Finance Team",
        channel: "Internal",
        body: "The invoice shows GST 18% but PO has GST 12%. Reaching out to vendor for confirmation.",
        createdAt: "2025-05-23T09:50:00",
      },
      {
        id: "c-2",
        author: "John Doe",
        role: "Client",
        channel: "External",
        body: "Please check and update on the invoice mismatch issue.",
        createdAt: "2025-05-23T09:40:00",
      },
      {
        id: "c-3",
        author: "Robert Fox",
        role: "Vendor Team",
        channel: "Internal",
        body: "Vendor confirmed the updated tax structure. Sharing the revised invoice shortly.",
        createdAt: "2025-05-23T10:20:00",
      },
    ],
    timeline: [
      {
        id: "t-1",
        title: "Ticket created by John Doe",
        subtitle: "External",
        channel: "External",
        createdAt: "2025-05-23T09:15:00",
      },
      {
        id: "t-2",
        title: "Assigned to Finance Team",
        subtitle: "System",
        channel: "System",
        createdAt: "2025-05-23T09:17:00",
      },
      {
        id: "t-3",
        title: "Child tickets created",
        subtitle: "4 linked workstreams generated",
        channel: "System",
        createdAt: "2025-05-23T09:25:00",
      },
    ],
  },
  {
    id: "TKT-2025-000124",
    subject: "Verify invoice with vendor",
    requestType: "Procure to Pay",
    category: "Vendor Follow Up",
    subCategory: "Invoice Confirmation",
    organization: "Acme Corp",
    status: "In Progress",
    priority: "High",
    impact: "Medium",
    urgency: "High",
    assignedTeam: "Vendor Team",
    assignee: "Rohit Sharma",
    ticketType: "Child",
    source: "System",
    description:
      "Validate invoice lines and tax breakdown directly with the vendor.",
    createdAt: "2025-05-23T09:25:00",
    createdBy: "System",
    dueDate: "2025-05-23T11:20:00",
    slaHours: 2,
    typicalSla: "2 - 4 hrs",
    parentId: "TKT-2025-000123",
    tags: ["Vendor"],
    childIds: [],
    attachments: [],
    comments: [],
    timeline: [],
  },
  {
    id: "TKT-2025-000125",
    subject: "Check delivery and GRN",
    requestType: "Procure to Pay",
    category: "Delivery Delay",
    subCategory: "GRN validation",
    organization: "Acme Corp",
    status: "Open",
    priority: "Medium",
    impact: "Medium",
    urgency: "Medium",
    assignedTeam: "Logistics Team",
    assignee: "Priya Nair",
    ticketType: "Child",
    source: "System",
    description: "Validate receipt confirmation and delivery note references.",
    createdAt: "2025-05-23T09:26:00",
    createdBy: "System",
    dueDate: "2025-05-23T15:45:00",
    slaHours: 6,
    typicalSla: "4 - 8 hrs",
    parentId: "TKT-2025-000123",
    tags: ["Logistics"],
    childIds: [],
    attachments: [],
    comments: [],
    timeline: [],
  },
  {
    id: "TKT-2025-000126",
    subject: "Check tax calculation",
    requestType: "Procure to Pay",
    category: "Tax Calculation",
    subCategory: "GST mismatch",
    organization: "Acme Corp",
    status: "Open",
    priority: "Medium",
    impact: "Medium",
    urgency: "Medium",
    assignedTeam: "Finance Team",
    assignee: "Arjun Mehta",
    ticketType: "Child",
    source: "System",
    description:
      "Verify GST slab selection against purchase order tax configuration.",
    createdAt: "2025-05-23T09:27:00",
    createdBy: "System",
    dueDate: "2025-05-23T16:30:00",
    slaHours: 7,
    typicalSla: "4 - 8 hrs",
    parentId: "TKT-2025-000123",
    tags: ["Finance"],
    childIds: [],
    attachments: [],
    comments: [],
    timeline: [],
  },
  {
    id: "TKT-2025-000127",
    subject: "Payment hold verification",
    requestType: "Procure to Pay",
    category: "Payment",
    subCategory: "Hold validation",
    organization: "Acme Corp",
    status: "Waiting",
    priority: "Low",
    impact: "Low",
    urgency: "Medium",
    assignedTeam: "Accounts Team",
    assignee: "Sneha Iyer",
    ticketType: "Child",
    source: "System",
    description:
      "Confirm whether vendor payment should remain on hold pending correction.",
    createdAt: "2025-05-23T09:28:00",
    createdBy: "System",
    dueDate: "2025-05-23T20:10:00",
    slaHours: 10,
    typicalSla: "8 - 12 hrs",
    parentId: "TKT-2025-000123",
    tags: ["Accounts"],
    childIds: [],
    attachments: [],
    comments: [],
    timeline: [],
  },
  {
    id: "TKT-2025-000128",
    subject: "Delay in laptop delivery",
    requestType: "Services",
    category: "Installation Support",
    subCategory: "Delivery setup",
    organization: "Beta Inc",
    status: "Open",
    priority: "High",
    impact: "High",
    urgency: "High",
    assignedTeam: "Field Operations",
    assignee: "Priya Nair",
    ticketType: "Issue",
    source: "Portal",
    description:
      "Delivery setup for branch rollout is running behind schedule.",
    createdAt: "2025-05-23T09:10:00",
    createdBy: "Client",
    dueDate: "2025-05-23T10:35:00",
    slaHours: 2,
    typicalSla: "2 - 6 hrs",
    tags: ["Delivery"],
    childIds: [],
    attachments: [],
    comments: [],
    timeline: [
      {
        id: "t-4",
        title: "Status changed to Open",
        subtitle: "System",
        channel: "System",
        createdAt: "2025-05-23T09:10:00",
      },
    ],
  },
  {
    id: "TKT-2025-000129",
    subject: "AMC service not completed",
    requestType: "Services",
    category: "AMC Request",
    subCategory: "Visit pending",
    organization: "Gamma Ltd",
    status: "Waiting",
    priority: "Medium",
    impact: "Medium",
    urgency: "Medium",
    assignedTeam: "Service Desk",
    assignee: "Jane Cooper",
    ticketType: "Issue",
    source: "Portal",
    description:
      "Scheduled AMC visit was not completed at the branch location.",
    createdAt: "2025-05-23T09:05:00",
    createdBy: "Client",
    dueDate: "2025-05-23T13:40:00",
    slaHours: 5,
    typicalSla: "4 - 12 hrs",
    tags: ["AMC"],
    childIds: [],
    attachments: [],
    comments: [],
    timeline: [],
  },
  {
    id: "TKT-2025-000130",
    subject: "Invoice discrepancy for Oct 2024",
    requestType: "Procure to Pay",
    category: "Invoice Mismatch",
    subCategory: "Price mismatch",
    organization: "Delta Co",
    status: "In Progress",
    priority: "Medium",
    impact: "Medium",
    urgency: "Medium",
    assignedTeam: "Finance Team",
    assignee: "Arjun Mehta",
    ticketType: "Issue",
    source: "Email",
    description: "Invoice line item totals differ from the approved PO values.",
    createdAt: "2025-05-23T08:59:00",
    createdBy: "System",
    dueDate: "2025-05-23T15:20:00",
    slaHours: 6,
    typicalSla: "4 - 12 hrs",
    tags: ["Invoice"],
    childIds: [],
    attachments: [],
    comments: [],
    timeline: [],
  },
  {
    id: "TKT-2025-000131",
    subject: "Return request for damaged items",
    requestType: "Services",
    category: "Return / Replacement",
    subCategory: "Damaged in transit",
    organization: "Epsilon Pvt Ltd",
    status: "Open",
    priority: "Low",
    impact: "Low",
    urgency: "Low",
    assignedTeam: "Service Desk",
    assignee: "Jane Cooper",
    ticketType: "Issue",
    source: "Portal",
    description:
      "Client requested return and replacement for damaged shipment items.",
    createdAt: "2025-05-23T08:45:00",
    createdBy: "Client",
    dueDate: "2025-05-23T16:35:00",
    slaHours: 8,
    typicalSla: "8 - 24 hrs",
    tags: ["Returns"],
    childIds: [],
    attachments: [],
    comments: [],
    timeline: [],
  },
  {
    id: "TKT-2025-000132",
    subject: "Vendor not responding to RFQ",
    requestType: "Procure to Pay",
    category: "RFQ Issues",
    subCategory: "Vendor response delay",
    organization: "Zeta Solutions",
    status: "Escalated",
    priority: "High",
    impact: "High",
    urgency: "High",
    assignedTeam: "Vendor Team",
    assignee: "Rohit Sharma",
    ticketType: "Issue",
    source: "Portal",
    description:
      "No vendor response received for the submitted RFQ within expected window.",
    createdAt: "2025-05-23T08:35:00",
    createdBy: "Client",
    dueDate: "2025-05-23T08:40:00",
    slaHours: 1,
    typicalSla: "1 - 4 hrs",
    tags: ["Vendor", "RFQ"],
    childIds: [],
    attachments: [],
    comments: [],
    timeline: [],
  },
];

const loadTickets = () =>
  safeReadJson<TicketRecord[]>(STORAGE_KEY, INITIAL_TICKETS);

const saveTickets = (tickets: TicketRecord[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
};

const statusTone: Record<TicketStatus, string> = {
  Open: "bg-amber-50 text-amber-700 border-amber-200",
  Assigned: "bg-blue-50 text-blue-700 border-blue-200",
  "In Progress": "bg-sky-50 text-sky-700 border-sky-200",
  Waiting: "bg-violet-50 text-violet-700 border-violet-200",
  Resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Closed: "bg-slate-100 text-slate-700 border-slate-200",
  Escalated: "bg-rose-50 text-rose-700 border-rose-200",
};

const priorityTone: Record<TicketPriority, string> = {
  High: "text-rose-600",
  Medium: "text-amber-500",
  Low: "text-emerald-600",
};

const slaTone: Record<SlaHealth, string> = {
  healthy: "text-emerald-600",
  at_risk: "text-amber-500",
  breached: "text-rose-600",
};

const nowReference = new Date("2025-05-23T09:26:00").getTime();

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

const formatTimeLeft = (value: string) => {
  const diff = new Date(value).getTime() - nowReference;
  if (diff <= 0) return "00h 00m left";
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  return `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m left`;
};

const getSlaHealth = (ticket: TicketRecord): SlaHealth => {
  if (["Resolved", "Closed"].includes(ticket.status)) return "healthy";
  const diff = new Date(ticket.dueDate).getTime() - nowReference;
  if (diff <= 0) return "breached";
  if (diff <= 3 * 3600000) return "at_risk";
  return "healthy";
};

const getProgressValue = (ticket: TicketRecord) => {
  if (ticket.status === "Resolved" || ticket.status === "Closed") return 100;
  if (ticket.status === "In Progress") return 80;
  if (ticket.status === "Assigned") return 60;
  if (ticket.status === "Waiting") return 40;
  if (ticket.status === "Escalated") return 20;
  return 50;
};

const getTicketTypeBadge = (ticket: TicketRecord) => {
  if (ticket.ticketType === "Parent") return "bg-violet-100 text-violet-700";
  if (ticket.ticketType === "Child") return "bg-emerald-100 text-emerald-700";
  return "bg-slate-100 text-slate-700";
};

const buildNewTicketId = (tickets: TicketRecord[]) => {
  const numbers = tickets.map((ticket) =>
    Number(ticket.id.split("-").pop() || 0),
  );
  const next = Math.max(...numbers, 132) + 1;
  return `TKT-2025-${String(next).padStart(6, "0")}`;
};

const makeTimeline = (ticket: TicketRecord): TimelineEntry[] => [
  {
    id: crypto.randomUUID(),
    title: "PO Created",
    subtitle: `by ${ticket.createdBy}`,
    channel: "System",
    createdAt: ticket.createdAt,
  },
  {
    id: crypto.randomUUID(),
    title: "Sent to Vendor",
    subtitle: "by System",
    channel: "System",
    createdAt: ticket.createdAt,
  },
  {
    id: crypto.randomUUID(),
    title: `${ticket.assignedTeam} assigned`,
    subtitle: `to ${ticket.assignee}`,
    channel: "Internal",
    createdAt: ticket.createdAt,
  },
];

const statCardStyles = [
  "from-blue-50 to-white border-blue-200",
  "from-sky-50 to-white border-sky-200",
  "from-amber-50 to-white border-amber-200",
  "from-rose-50 to-white border-rose-200",
  "from-violet-50 to-white border-violet-200",
  "from-emerald-50 to-white border-emerald-200",
];

export default function SupportPage() {
  const { clients, vendors, orders } = useData();
  const { user } = useAuth();
  const [tickets, setTickets] = useState<TicketRecord[]>(loadTickets);
  const [mode, setMode] = useState<"dashboard" | "create" | "detail">(
    "dashboard",
  );
  const [ticketViewTab, setTicketViewTab] = useState<
    "all" | "mine" | "unassigned"
  >("all");
  const [createStep, setCreateStep] = useState(1);
  const [selectedTicketId, setSelectedTicketId] = useState("TKT-2025-000123");
  const [detailTab, setDetailTab] = useState("overview");
  const [commentTab, setCommentTab] = useState<"Internal" | "External">(
    "Internal",
  );
  const [newComment, setNewComment] = useState("");
  const [search, setSearch] = useState("");
  const [requestTypeFilter, setRequestTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [teamFilter, setTeamFilter] = useState("all");
  const [ticketTypeFilter, setTicketTypeFilter] = useState("all");
  const [form, setForm] = useState<CreateForm>(DEFAULT_FORM);

  const selectedTicket = useMemo(
    () =>
      tickets.find((ticket) => ticket.id === selectedTicketId) || tickets[0],
    [selectedTicketId, tickets],
  );

  const childTickets = useMemo(
    () =>
      tickets.filter(
        (ticket) =>
          ticket.parentId === selectedTicket?.id ||
          selectedTicket?.childIds.includes(ticket.id),
      ),
    [selectedTicket, tickets],
  );

  const metrics = useMemo(() => {
    const breached = tickets.filter(
      (ticket) => getSlaHealth(ticket) === "breached",
    );
    const atRisk = tickets.filter(
      (ticket) => getSlaHealth(ticket) === "at_risk",
    );
    const inProgress = tickets.filter(
      (ticket) =>
        ticket.status === "In Progress" || ticket.status === "Assigned",
    );
    const healthy = tickets.length - atRisk.length - breached.length;
    return [
      {
        label: "Total Tickets",
        value: tickets.length,
        delta: "12% vs last 7 days",
      },
      {
        label: "In Progress",
        value: inProgress.length,
        delta: "8% vs last 7 days",
      },
      {
        label: "At Risk (SLA)",
        value: atRisk.length,
        delta: "4% vs last 7 days",
      },
      {
        label: "SLA Breached",
        value: breached.length,
        delta: "2% vs last 7 days",
      },
      {
        label: "Avg. Resolution Time",
        value: "14h 32m",
        delta: "18% vs last 7 days",
      },
      {
        label: "SLA Compliance",
        value: `${Math.round((healthy / Math.max(tickets.length, 1)) * 100)}%`,
        delta: "5% vs last 7 days",
      },
    ];
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tickets.filter((ticket) => {
      const matchesSearch =
        !query ||
        ticket.id.toLowerCase().includes(query) ||
        ticket.subject.toLowerCase().includes(query) ||
        ticket.organization.toLowerCase().includes(query);
      const matchesRequestType =
        requestTypeFilter === "all" || ticket.requestType === requestTypeFilter;
      const matchesCategory =
        categoryFilter === "all" || ticket.category === categoryFilter;
      const matchesPriority =
        priorityFilter === "all" || ticket.priority === priorityFilter;
      const matchesTeam =
        teamFilter === "all" || ticket.assignedTeam === teamFilter;
      const matchesType =
        ticketTypeFilter === "all" || ticket.ticketType === ticketTypeFilter;
      return (
        matchesSearch &&
        matchesRequestType &&
        matchesCategory &&
        matchesPriority &&
        matchesTeam &&
        matchesType
      );
    });
  }, [
    tickets,
    search,
    requestTypeFilter,
    categoryFilter,
    priorityFilter,
    teamFilter,
    ticketTypeFilter,
  ]);

  const visibleTickets = useMemo(() => {
    const currentUserKey = [user?.name, user?.email, user?.role]
      .filter(Boolean)
      .map((value) => String(value).toLowerCase());

    if (ticketViewTab === "mine") {
      return filteredTickets.filter((ticket) => {
        const assigneeKey = ticket.assignee.toLowerCase();
        const teamKey = ticket.assignedTeam.toLowerCase();
        return currentUserKey.some(
          (key) => assigneeKey.includes(key) || teamKey.includes(key),
        );
      });
    }

    if (ticketViewTab === "unassigned") {
      return filteredTickets.filter((ticket) => {
        const assignee = ticket.assignee.trim().toLowerCase();
        return (
          !assignee ||
          assignee === "unassigned" ||
          assignee === "tbd" ||
          assignee === "-" ||
          ticket.status === "Open" ||
          ticket.status === "Waiting"
        );
      });
    }

    return filteredTickets;
  }, [filteredTickets, ticketViewTab, user?.email, user?.name, user?.role]);

  const mineCount = useMemo(() => {
    const currentUserKey = [user?.name, user?.email, user?.role]
      .filter(Boolean)
      .map((value) => String(value).toLowerCase());
    return tickets.filter((ticket) =>
      currentUserKey.some((key) => {
        const assigneeKey = ticket.assignee.toLowerCase();
        const teamKey = ticket.assignedTeam.toLowerCase();
        return assigneeKey.includes(key) || teamKey.includes(key);
      }),
    ).length;
  }, [tickets, user?.email, user?.name, user?.role]);

  const unassignedCount = useMemo(
    () =>
      tickets.filter((ticket) => {
        const assignee = ticket.assignee.trim().toLowerCase();
        return (
          !assignee ||
          assignee === "unassigned" ||
          assignee === "tbd" ||
          assignee === "-" ||
          ticket.status === "Open" ||
          ticket.status === "Waiting"
        );
      }).length,
    [tickets],
  );

  const activityFeed = useMemo(
    () =>
      tickets
        .flatMap((ticket) =>
          ticket.timeline.map((entry) => ({
            ...entry,
            ticketId: ticket.id,
          })),
        )
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, 5),
    [tickets],
  );

  const requestSummary = {
    typicalSla:
      form.requestType === "Procure to Pay" ? "4 - 12 hrs" : "8 - 48 hrs",
    description:
      form.requestType === "Procure to Pay"
        ? "Mismatch in invoice amount, tax, quantity or price details."
        : "Service request needs technician review and branch scheduling.",
  };

  const openTicket = (ticketId: string, tab = "overview") => {
    setSelectedTicketId(ticketId);
    setDetailTab(tab);
    setMode("detail");
  };

  const resetWizard = () => {
    setCreateStep(1);
    setForm(DEFAULT_FORM);
  };

  const openCreate = () => {
    resetWizard();
    setMode("create");
  };

  const updateForm = <K extends keyof CreateForm>(
    key: K,
    value: CreateForm[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleCreateTicket = () => {
    const id = buildNewTicketId(tickets);
    const now = new Date("2025-05-23T09:30:00");
    const due = new Date(now.getTime() + 4 * 3600000);
    const created: TicketRecord = {
      id,
      subject: form.subject,
      requestType: form.requestType,
      category: form.category,
      subCategory: form.subCategory,
      organization: clients[0]?.name || "Acme Corp",
      status: form.assignmentMethod === "auto" ? "Assigned" : "Open",
      priority: form.priority,
      impact: form.impact,
      urgency: form.urgency,
      assignedTeam: form.assignedTeam,
      assignee: form.assignee,
      backupAssignee: form.backupAssignee,
      ticketType: form.createChildren ? "Parent" : "Issue",
      source: "Portal",
      description: form.description,
      createdAt: now.toISOString(),
      createdBy: user?.name || "System Owner",
      dueDate: due.toISOString(),
      slaHours: 4,
      typicalSla: requestSummary.typicalSla,
      poNumber: form.poNumber,
      orderId: form.orderId,
      invoiceNumber: form.invoiceNumber,
      vendorName: form.vendorName,
      location: form.location,
      tags: [form.category, form.subCategory, `PO #${form.poNumber}`],
      childIds: [],
      attachments: form.attachments,
      comments: [],
      timeline: makeTimeline({
        id,
        subject: form.subject,
        requestType: form.requestType,
        category: form.category,
        subCategory: form.subCategory,
        organization: clients[0]?.name || "Acme Corp",
        status: "Assigned",
        priority: form.priority,
        impact: form.impact,
        urgency: form.urgency,
        assignedTeam: form.assignedTeam,
        assignee: form.assignee,
        ticketType: "Issue",
        source: "Portal",
        description: form.description,
        createdAt: now.toISOString(),
        createdBy: user?.name || "System Owner",
        dueDate: due.toISOString(),
        slaHours: 4,
        typicalSla: requestSummary.typicalSla,
        tags: [],
        childIds: [],
        attachments: [],
        comments: [],
        timeline: [],
      }),
    };

    let nextTickets = [created, ...tickets];

    if (form.createChildren) {
      const childTemplates = [
        { team: "Vendor Team", title: "Verify with vendor" },
        { team: "Finance Team", title: "Validate tax calculation" },
        { team: "Accounts Team", title: "Payment hold verification" },
      ];

      const childIds = childTemplates.map(() => buildNewTicketId(nextTickets));
      const children = childTemplates.map((entry, index) => ({
        ...created,
        id: childIds[index],
        subject: entry.title,
        ticketType: "Child" as const,
        parentId: created.id,
        childIds: [],
        assignedTeam: entry.team,
        assignee: ASSIGNEE_OPTIONS[index + 2],
        status: index === 0 ? "In Progress" : "Open",
        timeline: [],
      }));

      created.childIds = children.map((child) => child.id);
      nextTickets = [created, ...children, ...tickets];
    }

    saveTickets(nextTickets);
    setTickets(nextTickets);
    toast({
      title: "Ticket created",
      description: `${created.id} was created successfully.`,
    });
    setSelectedTicketId(created.id);
    setMode("detail");
    setDetailTab(created.childIds.length > 0 ? "children" : "overview");
    resetWizard();
  };

  const addComment = () => {
    if (!selectedTicket || !newComment.trim()) return;
    const comment: TicketComment = {
      id: crypto.randomUUID(),
      author: user?.name || "System Owner",
      role: selectedTicket.assignedTeam,
      channel: commentTab,
      body: newComment.trim(),
      createdAt: new Date("2025-05-23T09:35:00").toISOString(),
    };
    const updated = tickets.map((ticket) =>
      ticket.id === selectedTicket.id
        ? {
            ...ticket,
            comments: [comment, ...ticket.comments],
            timeline: [
              {
                id: crypto.randomUUID(),
                title: `${commentTab} note added`,
                subtitle: `by ${comment.author}`,
                channel: commentTab === "Internal" ? "Internal" : "External",
                createdAt: comment.createdAt,
              },
              ...ticket.timeline,
            ],
          }
        : ticket,
    );
    saveTickets(updated);
    setTickets(updated);
    setNewComment("");
  };

  if (!selectedTicket) {
    return null;
  }

  return (
    <div>
      <Header title="Services" />
      <div className="space-y-6 p-6">
        {mode === "dashboard" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">Tickets</p>
                <h1 className="text-3xl font-semibold tracking-tight">
                  Command Center
                </h1>
              </div>
              <div className="flex gap-3">
                <div className="relative min-w-[320px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="pl-10"
                    placeholder="Search tickets, users, vendors, clients, invoices..."
                  />
                </div>
                <Button className="gap-2 rounded-xl px-5" onClick={openCreate}>
                  <Plus className="h-4 w-4" /> Create Ticket
                </Button>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-6">
              {metrics.map((item, index) => (
                <Card
                  key={item.label}
                  className={cn(
                    "border bg-gradient-to-br shadow-sm",
                    statCardStyles[index],
                  )}
                >
                  <CardContent className="space-y-3 p-5">
                    <p className="text-sm text-muted-foreground">
                      {item.label}
                    </p>
                    <p className="text-3xl font-semibold">{item.value}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.delta}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)_280px]">
              <Card className="rounded-[26px] border-slate-200 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Filters</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setRequestTypeFilter("all");
                      setCategoryFilter("all");
                      setPriorityFilter("all");
                      setTeamFilter("all");
                      setTicketTypeFilter("all");
                    }}
                  >
                    Reset
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select
                    value={requestTypeFilter}
                    onValueChange={setRequestTypeFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Request Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {REQUEST_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={categoryFilter}
                    onValueChange={setCategoryFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {Array.from(
                        new Set(tickets.map((ticket) => ticket.category)),
                      ).map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={priorityFilter}
                    onValueChange={setPriorityFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priorities</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="rounded-2xl border border-slate-100 p-4">
                    <p className="mb-3 text-sm font-medium">SLA Status</p>
                    <div className="space-y-3 text-sm">
                      {(["healthy", "at_risk", "breached"] as const).map(
                        (health) => (
                          <div
                            key={health}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  "h-2.5 w-2.5 rounded-full",
                                  health === "healthy" && "bg-emerald-500",
                                  health === "at_risk" && "bg-amber-500",
                                  health === "breached" && "bg-rose-500",
                                )}
                              />
                              <span className="capitalize">
                                {health.replace("_", " ")}
                              </span>
                            </div>
                            <span className="text-muted-foreground">
                              {
                                tickets.filter(
                                  (ticket) => getSlaHealth(ticket) === health,
                                ).length
                              }
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>

                  <Select value={teamFilter} onValueChange={setTeamFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Assigned Team" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Teams</SelectItem>
                      {TEAM_OPTIONS.map((team) => (
                        <SelectItem key={team} value={team}>
                          {team}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={ticketTypeFilter}
                    onValueChange={setTicketTypeFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Ticket Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All (Parent & Child)</SelectItem>
                      <SelectItem value="Parent">Parent</SelectItem>
                      <SelectItem value="Child">Child</SelectItem>
                      <SelectItem value="Issue">Issue</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <Card className="rounded-[26px] border-slate-200 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between gap-3">
                  <Tabs
                    value={ticketViewTab}
                    onValueChange={(value) =>
                      setTicketViewTab(value as "all" | "mine" | "unassigned")
                    }
                    className="w-full"
                  >
                    <TabsList className="grid w-fit grid-cols-3 rounded-full">
                      <TabsTrigger value="all">
                        All Tickets ({tickets.length})
                      </TabsTrigger>
                      <TabsTrigger value="mine">
                        My Tickets ({mineCount})
                      </TabsTrigger>
                      <TabsTrigger value="unassigned">
                        Unassigned ({unassignedCount})
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <div className="flex gap-2">
                    <Button variant="outline" className="gap-2">
                      <Settings2 className="h-4 w-4" /> Group By: None
                    </Button>
                    <Button variant="outline">Export</Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {visibleTickets.map((ticket) => {
                    const health = getSlaHealth(ticket);
                    return (
                      <button
                        key={ticket.id}
                        className="grid w-full grid-cols-[24px_160px_minmax(0,1.4fr)_160px_150px_110px_120px_150px_140px] items-center gap-4 rounded-2xl border border-slate-100 px-4 py-4 text-left transition hover:border-primary/30 hover:bg-slate-50"
                        onClick={() => openTicket(ticket.id)}
                      >
                        <Checkbox checked={false} />
                        <div>
                          <p className="font-semibold">{ticket.id}</p>
                          <Badge
                            className={cn(
                              "mt-2 rounded-full",
                              getTicketTypeBadge(ticket),
                            )}
                          >
                            {ticket.ticketType}
                          </Badge>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {ticket.subject}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {ticket.organization}
                          </p>
                        </div>
                        <div>
                          <Badge className="rounded-full bg-violet-50 text-violet-700">
                            {ticket.category}
                          </Badge>
                        </div>
                        <div>
                          <p
                            className={cn(
                              "font-medium",
                              priorityTone[ticket.priority],
                            )}
                          >
                            {ticket.priority}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {ticket.assignedTeam}
                          </p>
                        </div>
                        <Badge
                          className={cn(
                            "rounded-full",
                            statusTone[ticket.status],
                          )}
                        >
                          {ticket.status}
                        </Badge>
                        <div>
                          <p className="font-medium">{ticket.assignee}</p>
                          <p className="text-xs text-muted-foreground">
                            {ticket.requestType}
                          </p>
                        </div>
                        <div className={cn("font-semibold", slaTone[health])}>
                          {formatTimeLeft(ticket.dueDate)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatDateTime(ticket.createdAt)}
                        </div>
                      </button>
                    );
                  })}

                  {visibleTickets.length === 0 && (
                    <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
                      No tickets match the active filters.
                    </div>
                  )}

                  <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-muted-foreground">
                    <span>0 Selected</span>
                    <div className="flex gap-2">
                      <Button variant="outline">Assign</Button>
                      <Button variant="outline">Change Status</Button>
                      <Button variant="outline">Change Priority</Button>
                      <Button variant="outline">More Actions</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <Card className="rounded-[26px] border-slate-200 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Activity Feed</CardTitle>
                    <Button variant="ghost" size="sm">
                      View All
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {activityFeed.map((entry) => (
                      <div key={entry.id} className="flex gap-3">
                        <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <MessageSquare className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{entry.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {entry.ticketId} • {formatDateTime(entry.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="rounded-[26px] border-slate-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">AI Insights</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
                      <p className="text-sm font-semibold text-violet-700">
                        Top recurring issue
                      </p>
                      <p className="mt-2 text-sm text-slate-700">
                        Invoice Mismatch is the top issue this week (32
                        tickets).
                      </p>
                    </div>
                    <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                      <p className="text-sm font-semibold text-amber-700">
                        Likely SLA breaches
                      </p>
                      <p className="mt-2 text-sm text-slate-700">
                        8 tickets are likely to breach SLA in the next 4 hours.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                      <p className="text-sm font-semibold text-emerald-700">
                        Suggested action
                      </p>
                      <p className="mt-2 text-sm text-slate-700">
                        Create a template for “Invoice Mismatch” responses.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-[26px] border-slate-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Links</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-3 text-sm">
                    {[
                      ["My Tickets", "42"],
                      ["Unassigned Tickets", "18"],
                      ["SLA Breached", "6"],
                      ["Escalated Tickets", "9"],
                    ].map(([label, count]) => (
                      <div
                        key={label}
                        className="rounded-2xl border border-slate-100 p-3"
                      >
                        <p className="text-muted-foreground">{label}</p>
                        <p className="mt-2 text-lg font-semibold">{count}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {mode === "create" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">
                  Create New Ticket
                </h1>
                <p className="text-sm text-muted-foreground">
                  Build the request exactly the way your service desk workflow
                  expects.
                </p>
              </div>
              <Button
                variant="ghost"
                className="gap-2"
                onClick={() => setMode("dashboard")}
              >
                <ArrowLeft className="h-4 w-4" /> Back to Tickets
              </Button>
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
              <Card className="rounded-[28px] border-slate-200 shadow-sm">
                <CardContent className="space-y-6 p-6">
                  <div className="grid gap-4 md:grid-cols-5">
                    {[
                      "Request Type",
                      "Ticket Details",
                      "SLA & Assignment",
                      "Parent / Child",
                      "Review & Submit",
                    ].map((stepLabel, index) => {
                      const step = index + 1;
                      const isComplete = step < createStep;
                      const isActive = step === createStep;
                      return (
                        <div
                          key={stepLabel}
                          className="flex items-center gap-3"
                        >
                          <div
                            className={cn(
                              "flex h-12 w-12 items-center justify-center rounded-full border text-sm font-semibold",
                              isActive &&
                                "border-primary bg-primary text-white",
                              isComplete &&
                                "border-primary/20 bg-primary/10 text-primary",
                              !isActive &&
                                !isComplete &&
                                "border-slate-200 bg-white text-slate-500",
                            )}
                          >
                            {isComplete ? <Check className="h-5 w-5" /> : step}
                          </div>
                          <div>
                            <p className="font-medium">{stepLabel}</p>
                            <p className="text-xs text-muted-foreground">
                              {step === 1 && "Choose what you need help with"}
                              {step === 2 && "Provide more information"}
                              {step === 3 && "Review SLA and assignee"}
                              {step === 4 && "Set ticket structure"}
                              {step === 5 && "Confirm and create ticket"}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {createStep === 1 && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-2xl font-semibold">
                          1. Select Request Type
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          Choose the type of request you want to raise a ticket
                          for.
                        </p>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        {REQUEST_TYPE_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              updateForm("requestType", option.value);
                              updateForm(
                                "category",
                                CATEGORY_MAP[option.value][0].label,
                              );
                            }}
                            className={cn(
                              "rounded-[24px] border bg-gradient-to-br p-5 text-left transition",
                              option.tint,
                              form.requestType === option.value &&
                                "ring-2 ring-primary/40 shadow-[0_18px_40px_rgba(59,130,246,0.12)]",
                            )}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex gap-4">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-primary shadow-sm">
                                  <option.icon className="h-6 w-6" />
                                </div>
                                <div>
                                  <p className="text-xl font-semibold">
                                    {option.label}
                                  </p>
                                  <p className="mt-2 text-sm text-slate-600">
                                    {option.description}
                                  </p>
                                  <Badge
                                    className={cn(
                                      "mt-4 rounded-full",
                                      option.badge,
                                    )}
                                  >
                                    {option.sla}
                                  </Badge>
                                </div>
                              </div>
                              {form.requestType === option.value && (
                                <div className="rounded-full bg-primary p-1 text-white">
                                  <Check className="h-4 w-4" />
                                </div>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>

                      <div className="space-y-4">
                        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          {form.requestType.toUpperCase()}
                        </p>
                        <div className="grid gap-3 md:grid-cols-3">
                          {CATEGORY_MAP[form.requestType].map((category) => (
                            <button
                              key={category.label}
                              onClick={() =>
                                updateForm("category", category.label)
                              }
                              className={cn(
                                "rounded-2xl border p-4 text-left transition",
                                form.category === category.label
                                  ? "border-primary bg-primary/5 shadow-sm"
                                  : "border-slate-100 bg-white hover:border-primary/30",
                              )}
                            >
                              <p className="font-semibold">{category.label}</p>
                              <p className="mt-2 text-sm text-muted-foreground">
                                {category.description}
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {createStep === 2 && (
                    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
                      <div className="space-y-5">
                        <div className="flex items-center justify-between">
                          <div>
                            <h2 className="text-2xl font-semibold">
                              2. Ticket Details
                            </h2>
                            <p className="text-sm text-muted-foreground">
                              Provide all the relevant information about the
                              issue.
                            </p>
                          </div>
                          <Button variant="outline" className="gap-2">
                            <Sparkles className="h-4 w-4" /> Auto-fill with AI
                          </Button>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Subject</p>
                            <Input
                              value={form.subject}
                              onChange={(event) =>
                                updateForm("subject", event.target.value)
                              }
                            />
                            <Badge className="rounded-full bg-violet-100 text-violet-700">
                              AI Suggested: {form.subject}
                            </Badge>
                          </div>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <p className="text-sm font-medium">Category</p>
                              <Input value={form.category} readOnly />
                            </div>
                            <div className="space-y-2">
                              <p className="text-sm font-medium">
                                Sub Category
                              </p>
                              <Input
                                value={form.subCategory}
                                onChange={(event) =>
                                  updateForm("subCategory", event.target.value)
                                }
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="text-sm font-medium">Description</p>
                          <Textarea
                            rows={6}
                            value={form.description}
                            onChange={(event) =>
                              updateForm("description", event.target.value)
                            }
                          />
                        </div>

                        <Card className="rounded-[24px] border-slate-100">
                          <CardHeader>
                            <CardTitle className="text-base">
                              Link Context (Helps us resolve faster)
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="grid gap-4 md:grid-cols-4">
                            <Input
                              value={form.poNumber}
                              onChange={(event) =>
                                updateForm("poNumber", event.target.value)
                              }
                              placeholder="PO Number"
                            />
                            <Input
                              value={form.orderId}
                              onChange={(event) =>
                                updateForm("orderId", event.target.value)
                              }
                              placeholder="Order ID"
                            />
                            <Input
                              value={form.invoiceNumber}
                              onChange={(event) =>
                                updateForm("invoiceNumber", event.target.value)
                              }
                              placeholder="Invoice Number"
                            />
                            <Input
                              value={form.invoiceDate}
                              onChange={(event) =>
                                updateForm("invoiceDate", event.target.value)
                              }
                              placeholder="Invoice Date"
                            />
                            <Input
                              value={form.vendorName}
                              onChange={(event) =>
                                updateForm("vendorName", event.target.value)
                              }
                              placeholder="Vendor"
                            />
                            <Input
                              value={form.clientContact}
                              onChange={(event) =>
                                updateForm("clientContact", event.target.value)
                              }
                              placeholder="Client Contact"
                            />
                            <Input
                              value={form.location}
                              onChange={(event) =>
                                updateForm("location", event.target.value)
                              }
                              placeholder="Location / Branch"
                            />
                          </CardContent>
                        </Card>

                        <Card className="rounded-[24px] border-dashed border-slate-200">
                          <CardHeader>
                            <CardTitle className="text-base">
                              Attachments
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="grid gap-3 md:grid-cols-2">
                            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-muted-foreground">
                              Drag & drop files here or click to upload
                            </div>
                            <div className="space-y-2">
                              {form.attachments.map((attachment) => (
                                <div
                                  key={attachment.id}
                                  className="flex items-center justify-between rounded-2xl border border-slate-100 p-3"
                                >
                                  <div className="flex items-center gap-3">
                                    <FileText className="h-4 w-4 text-rose-500" />
                                    <div>
                                      <p className="text-sm font-medium">
                                        {attachment.name}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {attachment.size}
                                      </p>
                                    </div>
                                  </div>
                                  <Button variant="ghost" size="sm">
                                    Remove
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      <div className="space-y-4">
                        <Card className="rounded-[24px] border-slate-100 shadow-sm">
                          <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-base">
                              Similar Tickets Found (3)
                            </CardTitle>
                            <Button variant="ghost" size="sm">
                              View All
                            </Button>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {tickets.slice(0, 3).map((ticket) => (
                              <div
                                key={ticket.id}
                                className="rounded-2xl border border-slate-100 p-3"
                              >
                                <p className="font-medium">{ticket.id}</p>
                                <div className="mt-2 flex items-center gap-2 text-xs">
                                  <Badge className="rounded-full bg-violet-100 text-violet-700">
                                    {ticket.category}
                                  </Badge>
                                  <span className="text-muted-foreground">
                                    {ticket.organization}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </CardContent>
                        </Card>

                        <Card className="rounded-[24px] border-slate-100 shadow-sm">
                          <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-base">
                              Suggested Actions
                            </CardTitle>
                            <Badge className="rounded-full bg-violet-100 text-violet-700">
                              AI
                            </Badge>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {[
                              "Assign to Finance Team",
                              "Create child ticket for Vendor Follow Up",
                            ].map((action) => (
                              <div
                                key={action}
                                className="flex items-center justify-between rounded-2xl border border-slate-100 p-3"
                              >
                                <div>
                                  <p className="font-medium">{action}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Recommended based on category and prior
                                    patterns
                                  </p>
                                </div>
                                <Button variant="outline" size="sm">
                                  Apply
                                </Button>
                              </div>
                            ))}
                          </CardContent>
                        </Card>

                        <Card className="rounded-[24px] border-slate-100 shadow-sm">
                          <CardHeader>
                            <CardTitle className="text-base">
                              Impact & Urgency
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                              <Select
                                value={form.impact}
                                onValueChange={(value) =>
                                  updateForm(
                                    "impact",
                                    value as CreateForm["impact"],
                                  )
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="High">High</SelectItem>
                                  <SelectItem value="Medium">Medium</SelectItem>
                                  <SelectItem value="Low">Low</SelectItem>
                                </SelectContent>
                              </Select>
                              <Select
                                value={form.urgency}
                                onValueChange={(value) =>
                                  updateForm(
                                    "urgency",
                                    value as CreateForm["urgency"],
                                  )
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="High">High</SelectItem>
                                  <SelectItem value="Medium">Medium</SelectItem>
                                  <SelectItem value="Low">Low</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <Select
                              value={form.priority}
                              onValueChange={(value) =>
                                updateForm("priority", value as TicketPriority)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="High">High</SelectItem>
                                <SelectItem value="Medium">Medium</SelectItem>
                                <SelectItem value="Low">Low</SelectItem>
                              </SelectContent>
                            </Select>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )}

                  {createStep === 3 && (
                    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
                      <div className="space-y-5">
                        <div>
                          <h2 className="text-2xl font-semibold">
                            3. SLA & Assignment
                          </h2>
                          <p className="text-sm text-muted-foreground">
                            Review SLA, assign the ticket to the right team or
                            person and configure escalation if required.
                          </p>
                        </div>

                        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
                          <Card className="rounded-[24px] border-slate-100">
                            <CardHeader className="flex flex-row items-center justify-between">
                              <div className="flex items-center gap-3">
                                <CardTitle className="text-base">
                                  SLA Information
                                </CardTitle>
                                <Badge className="rounded-full bg-emerald-100 text-emerald-700">
                                  Recommended SLA
                                </Badge>
                              </div>
                              <Button variant="outline" size="sm">
                                Change SLA
                              </Button>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="grid gap-4 md:grid-cols-[160px_minmax(0,1fr)_160px]">
                                <div className="rounded-2xl bg-emerald-50 p-5 text-center">
                                  <Clock3 className="mx-auto h-8 w-8 text-emerald-600" />
                                  <p className="mt-4 text-4xl font-semibold">
                                    4h 00m
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    Resolution Time
                                  </p>
                                </div>
                                <div className="grid gap-3 rounded-2xl border border-slate-100 p-4 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                      SLA Policy
                                    </span>
                                    <span className="font-medium">
                                      P2P - High Priority
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                      Calendar
                                    </span>
                                    <span className="font-medium">
                                      Business Hours
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                      Start Time
                                    </span>
                                    <span>23 May 2025, 09:20 AM</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                      Due Time
                                    </span>
                                    <span>23 May 2025, 01:20 PM</span>
                                  </div>
                                </div>
                                <div className="flex items-center justify-center rounded-2xl border border-emerald-100 bg-white">
                                  <div className="text-center">
                                    <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-[8px] border-emerald-500 text-3xl font-semibold text-emerald-600">
                                      75%
                                    </div>
                                    <p className="mt-3 font-medium text-emerald-600">
                                      Within SLA
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                                This ticket is classified as High Priority.
                                Resolution is expected within 4 hours.
                              </div>
                            </CardContent>
                          </Card>

                          <div className="space-y-4">
                            <Card className="rounded-[24px] border-slate-100">
                              <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-base">
                                  Workload Insights
                                </CardTitle>
                                <Button variant="ghost" size="sm">
                                  View Team
                                </Button>
                              </CardHeader>
                              <CardContent className="space-y-3">
                                <div className="rounded-2xl border border-slate-100 p-4">
                                  <div className="flex items-center gap-3">
                                    <Users className="h-5 w-5 text-primary" />
                                    <p className="font-medium">
                                      {form.assignedTeam}
                                    </p>
                                  </div>
                                  <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                                    <div>
                                      <p className="text-muted-foreground">
                                        Open Tickets
                                      </p>
                                      <p className="text-xl font-semibold">
                                        18
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">
                                        In Progress
                                      </p>
                                      <p className="text-xl font-semibold">7</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">
                                        Avg. Resolution
                                      </p>
                                      <p className="text-xl font-semibold">
                                        3h 15m
                                      </p>
                                    </div>
                                  </div>
                                  <Badge className="mt-4 rounded-full bg-emerald-100 text-emerald-700">
                                    Low Workload
                                  </Badge>
                                </div>
                                <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
                                  <div className="flex items-center justify-between">
                                    <p className="font-medium text-violet-700">
                                      AI Recommendation
                                    </p>
                                    <Badge className="rounded-full bg-white text-violet-700">
                                      AI
                                    </Badge>
                                  </div>
                                  <p className="mt-3 text-sm text-slate-700">
                                    Finance Team is best suited for this ticket
                                    based on category, priority and historical
                                    performance.
                                  </p>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        </div>

                        <Card className="rounded-[24px] border-slate-100">
                          <CardHeader>
                            <CardTitle className="text-base">
                              Assign To
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-4">
                              <Select
                                value={form.assignedTeam}
                                onValueChange={(value) =>
                                  updateForm("assignedTeam", value)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Assign to team" />
                                </SelectTrigger>
                                <SelectContent>
                                  {TEAM_OPTIONS.map((team) => (
                                    <SelectItem key={team} value={team}>
                                      {team}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Select
                                value={form.assignee}
                                onValueChange={(value) =>
                                  updateForm("assignee", value)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Assign to" />
                                </SelectTrigger>
                                <SelectContent>
                                  {ASSIGNEE_OPTIONS.map((assignee) => (
                                    <SelectItem key={assignee} value={assignee}>
                                      {assignee}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Select
                                value={form.backupAssignee}
                                onValueChange={(value) =>
                                  updateForm("backupAssignee", value)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Backup assignee" />
                                </SelectTrigger>
                                <SelectContent>
                                  {ASSIGNEE_OPTIONS.map((assignee) => (
                                    <SelectItem key={assignee} value={assignee}>
                                      {assignee}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-3 rounded-2xl border border-slate-100 p-4 text-sm">
                              <p className="font-medium">Assignment Method</p>
                              <label className="flex items-center gap-3">
                                <Checkbox
                                  checked={form.assignmentMethod === "auto"}
                                  onCheckedChange={() =>
                                    updateForm("assignmentMethod", "auto")
                                  }
                                />
                                Auto Assign (Recommended)
                              </label>
                              <label className="flex items-center gap-3">
                                <Checkbox
                                  checked={form.assignmentMethod === "manual"}
                                  onCheckedChange={() =>
                                    updateForm("assignmentMethod", "manual")
                                  }
                                />
                                Manual Assign
                              </label>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="rounded-[24px] border-slate-100">
                          <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-base">
                              Escalation Rules
                            </CardTitle>
                            <div className="flex items-center gap-3 text-sm">
                              <span>Enable Escalation</span>
                              <Switch
                                checked={form.escalationEnabled}
                                onCheckedChange={(checked) =>
                                  updateForm("escalationEnabled", checked)
                                }
                              />
                            </div>
                          </CardHeader>
                          <CardContent className="grid gap-4 xl:grid-cols-4">
                            {ESCALATION_RULES.map((rule) => (
                              <div
                                key={rule.level}
                                className="rounded-2xl border border-slate-100 p-4"
                              >
                                <p className="font-semibold text-violet-700">
                                  {rule.level}
                                </p>
                                <p className="mt-2 text-sm text-muted-foreground">
                                  {rule.after}
                                </p>
                                <div className="mt-4 rounded-xl border border-slate-100 px-3 py-2 text-sm">
                                  {rule.assignee}
                                </div>
                                <div className="mt-4 flex gap-2 text-xs text-muted-foreground">
                                  <Badge variant="outline">System</Badge>
                                  <Badge variant="outline">Email</Badge>
                                  <Badge variant="outline">Slack</Badge>
                                </div>
                              </div>
                            ))}
                            <button className="rounded-2xl border border-dashed border-slate-200 text-sm text-primary">
                              + Add Escalation Level
                            </button>
                          </CardContent>
                        </Card>
                      </div>

                      <div className="space-y-4">
                        <Card className="rounded-[24px] border-slate-100 shadow-sm">
                          <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-base">
                              Ticket Summary
                            </CardTitle>
                            <Button variant="ghost" size="sm">
                              Edit
                            </Button>
                          </CardHeader>
                          <CardContent className="space-y-4 text-sm">
                            {[
                              ["Request Type", form.requestType],
                              ["Category", form.category],
                              ["Sub Category", form.subCategory],
                              ["Priority", form.priority],
                              [
                                "Impact / Urgency",
                                `${form.impact} / ${form.urgency}`,
                              ],
                              ["Assigned Team", form.assignedTeam],
                              ["Assignee", form.assignee],
                              ["SLA", "4h 00m"],
                              ["Due Date", "23 May 2025, 01:20 PM"],
                            ].map(([label, value]) => (
                              <div
                                key={label}
                                className="flex justify-between gap-3"
                              >
                                <span className="text-muted-foreground">
                                  {label}
                                </span>
                                <span className="font-medium text-right">
                                  {value}
                                </span>
                              </div>
                            ))}
                          </CardContent>
                        </Card>

                        <Card className="rounded-[24px] border-slate-100 shadow-sm">
                          <CardHeader>
                            <CardTitle className="text-base">
                              SLA Timeline Preview
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4 text-sm">
                            {[
                              [
                                "23 May 2025, 09:20 AM",
                                "SLA Start",
                                "bg-emerald-500",
                              ],
                              [
                                "23 May 2025, 11:20 AM",
                                "Level 1 Escalation",
                                "bg-emerald-500",
                              ],
                              [
                                "23 May 2025, 02:20 PM",
                                "Level 2 Escalation",
                                "bg-amber-500",
                              ],
                              [
                                "23 May 2025, 04:20 PM",
                                "Level 3 Escalation",
                                "bg-amber-500",
                              ],
                              [
                                "23 May 2025, 01:20 PM",
                                "SLA Due Time",
                                "bg-rose-500",
                              ],
                            ].map(([date, label, tone]) => (
                              <div key={label} className="flex gap-3">
                                <span
                                  className={cn(
                                    "mt-1 h-3 w-3 rounded-full",
                                    tone,
                                  )}
                                />
                                <div>
                                  <p className="font-medium">{date}</p>
                                  <p className="text-muted-foreground">
                                    {label}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )}

                  {createStep === 4 && (
                    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
                      <div className="space-y-5">
                        <div>
                          <h2 className="text-2xl font-semibold">
                            4. Parent / Child
                          </h2>
                          <p className="text-sm text-muted-foreground">
                            Configure how the ticket should be split into
                            workstreams.
                          </p>
                        </div>
                        <Card className="rounded-[24px] border-slate-100">
                          <CardHeader>
                            <CardTitle className="text-base">
                              Ticket Structure
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="flex items-center justify-between rounded-2xl border border-slate-100 p-4">
                              <div>
                                <p className="font-medium">
                                  Create as parent ticket
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Break this request into team-based child
                                  tickets.
                                </p>
                              </div>
                              <Switch
                                checked={form.createChildren}
                                onCheckedChange={(checked) =>
                                  updateForm("createChildren", checked)
                                }
                              />
                            </div>
                            <div className="grid gap-4 md:grid-cols-3">
                              {[
                                {
                                  team: "Vendor Team",
                                  title: "Verify invoice with vendor",
                                },
                                {
                                  team: "Finance Team",
                                  title: "Check tax calculation",
                                },
                                {
                                  team: "Accounts Team",
                                  title: "Payment hold verification",
                                },
                              ].map((template) => (
                                <div
                                  key={template.title}
                                  className="rounded-2xl border border-slate-100 p-4"
                                >
                                  <p className="font-medium">
                                    {template.title}
                                  </p>
                                  <p className="mt-2 text-sm text-muted-foreground">
                                    {template.team}
                                  </p>
                                  <Badge className="mt-4 rounded-full bg-slate-100 text-slate-700">
                                    Auto-generated
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="rounded-[24px] border-slate-100">
                          <CardHeader>
                            <CardTitle className="text-base">
                              Dependency Preview
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {[
                              "Parent ticket remains in progress until all child tickets are resolved.",
                              "Vendor confirmation child ticket will unblock finance validation.",
                              "Payment hold child ticket closes automatically after parent resolution.",
                            ].map((item) => (
                              <div
                                key={item}
                                className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                              >
                                {item}
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      </div>

                      <div className="space-y-4">
                        <Card className="rounded-[24px] border-slate-100 shadow-sm">
                          <CardHeader>
                            <CardTitle className="text-base">
                              Request Summary
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4 text-sm">
                            <div className="rounded-2xl bg-violet-50 p-4">
                              <p className="font-semibold text-violet-700">
                                {form.requestType}
                              </p>
                              <p className="mt-2 text-slate-700">
                                {form.category}
                              </p>
                              <p className="text-slate-700">
                                {form.subCategory}
                              </p>
                            </div>
                            <div className="rounded-2xl border border-slate-100 p-4">
                              <p className="font-medium">
                                Child tickets to be created
                              </p>
                              <p className="mt-2 text-3xl font-semibold">
                                {form.createChildren ? "3" : "0"}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )}

                  {createStep === 5 && (
                    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
                      <Card className="rounded-[24px] border-slate-100">
                        <CardHeader>
                          <CardTitle className="text-2xl">
                            5. Review & Submit
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-5 text-sm">
                          {[
                            ["Subject", form.subject],
                            ["Request Type", form.requestType],
                            [
                              "Category",
                              `${form.category} / ${form.subCategory}`,
                            ],
                            [
                              "Context",
                              `${form.poNumber} • ${form.orderId} • ${form.invoiceNumber}`,
                            ],
                            [
                              "Assigned Team",
                              `${form.assignedTeam} • ${form.assignee}`,
                            ],
                            [
                              "Priority",
                              `${form.priority} • ${form.impact}/${form.urgency}`,
                            ],
                            [
                              "Children",
                              form.createChildren
                                ? "Create linked child tickets"
                                : "Single issue ticket",
                            ],
                          ].map(([label, value]) => (
                            <div
                              key={label}
                              className="flex justify-between gap-4 rounded-2xl border border-slate-100 px-4 py-3"
                            >
                              <span className="text-muted-foreground">
                                {label}
                              </span>
                              <span className="font-medium text-right">
                                {value}
                              </span>
                            </div>
                          ))}
                          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-emerald-700">
                            This request is ready to be created and routed with
                            the configured SLA and assignment rules.
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="rounded-[24px] border-slate-100 shadow-sm">
                        <CardHeader>
                          <CardTitle className="text-base">
                            Final Summary
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="rounded-2xl border border-slate-100 p-4">
                            <p className="text-sm text-muted-foreground">
                              Estimated SLA
                            </p>
                            <p className="mt-2 text-3xl font-semibold">
                              4h 00m
                            </p>
                          </div>
                          <div className="rounded-2xl border border-slate-100 p-4">
                            <p className="text-sm text-muted-foreground">
                              Attachments
                            </p>
                            <p className="mt-2 text-3xl font-semibold">
                              {form.attachments.length}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => {
                        if (createStep === 1) {
                          setMode("dashboard");
                          return;
                        }
                        setCreateStep((prev) => Math.max(1, prev - 1));
                      }}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      {createStep === 1 ? "Cancel" : "Back"}
                    </Button>
                    <div className="flex gap-3">
                      <Button variant="outline">Save as Draft</Button>
                      {createStep < 5 ? (
                        <Button
                          className="gap-2"
                          onClick={() =>
                            setCreateStep((prev) => Math.min(5, prev + 1))
                          }
                        >
                          Next
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button className="gap-2" onClick={handleCreateTicket}>
                          Create Ticket
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <Card className="rounded-[28px] border-slate-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Request Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div className="rounded-2xl border border-slate-100 p-4">
                      <p className="text-muted-foreground">Request Type</p>
                      <p className="mt-2 font-semibold">{form.requestType}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-100 p-4">
                      <p className="text-muted-foreground">Category</p>
                      <p className="mt-2 font-semibold">{form.category}</p>
                      <p className="text-muted-foreground">
                        {form.subCategory}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-100 p-4">
                      <p className="text-muted-foreground">Typical SLA</p>
                      <p className="mt-2 font-semibold">
                        {requestSummary.typicalSla}
                      </p>
                    </div>
                    <p className="text-muted-foreground">
                      {requestSummary.description}
                    </p>
                  </CardContent>
                </Card>

                <Card className="rounded-[28px] border-slate-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      What you&apos;ll need
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    {[
                      "PO Number or Order ID (if available)",
                      "Invoice copy (PDF / Image)",
                      "Vendor details",
                      "Clear description of the issue",
                    ].map((item) => (
                      <div key={item} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-emerald-600" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="rounded-[28px] border-slate-200 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">
                      Similar Tickets Found (3)
                    </CardTitle>
                    <Button variant="ghost" size="sm">
                      View All
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {tickets.slice(0, 3).map((ticket) => (
                      <button
                        key={ticket.id}
                        onClick={() => openTicket(ticket.id)}
                        className="block w-full rounded-2xl border border-slate-100 p-3 text-left"
                      >
                        <p className="font-medium">{ticket.id}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <Badge className="rounded-full bg-violet-100 text-violet-700">
                            {ticket.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {ticket.status}
                          </span>
                        </div>
                      </button>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {mode === "detail" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                className="gap-2"
                onClick={() => setMode("dashboard")}
              >
                <ArrowLeft className="h-4 w-4" /> Back to Tickets
              </Button>
              <div className="flex gap-2">
                <Button variant="outline">Edit Ticket</Button>
                {selectedTicket.ticketType === "Parent" && (
                  <Button className="gap-2" onClick={openCreate}>
                    <Plus className="h-4 w-4" /> Create Child Ticket
                  </Button>
                )}
              </div>
            </div>

            {selectedTicket.ticketType === "Parent" ? (
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                <div className="space-y-4">
                  <Card className="rounded-[28px] border-slate-200 shadow-sm">
                    <CardContent className="space-y-6 p-6">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <h1 className="text-4xl font-semibold tracking-tight">
                              Ticket: {selectedTicket.id}
                            </h1>
                            <Badge className="rounded-full bg-violet-100 text-violet-700">
                              Parent Ticket
                            </Badge>
                          </div>
                          <h2 className="text-3xl font-semibold text-slate-900">
                            {selectedTicket.subject}
                          </h2>
                          <div className="flex flex-wrap gap-2">
                            <Badge className="rounded-full bg-rose-50 text-rose-600">
                              {selectedTicket.priority}
                            </Badge>
                            <Badge
                              className={cn(
                                "rounded-full",
                                statusTone[selectedTicket.status],
                              )}
                            >
                              {selectedTicket.status}
                            </Badge>
                            <Badge variant="outline">
                              Created on{" "}
                              {formatDateTime(selectedTicket.createdAt)}
                            </Badge>
                          </div>
                        </div>
                        <div className="rounded-[24px] border border-slate-100 p-5 text-center shadow-sm">
                          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-[8px] border-amber-400 text-2xl font-semibold text-amber-500">
                            75%
                          </div>
                          <p className="mt-3 text-sm text-muted-foreground">
                            SLA Remaining
                          </p>
                          <p className="text-3xl font-semibold">
                            {formatTimeLeft(selectedTicket.dueDate).replace(
                              " left",
                              "",
                            )}
                          </p>
                          <p className="text-sm text-rose-500">
                            Due by {formatDateTime(selectedTicket.dueDate)}
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-4 rounded-[24px] border border-slate-100 p-5 md:grid-cols-5">
                        {[
                          ["Request Type", selectedTicket.requestType],
                          ["Category", selectedTicket.category],
                          ["Sub Category", selectedTicket.subCategory],
                          ["Priority", selectedTicket.priority],
                          ["Assigned To", selectedTicket.assignedTeam],
                        ].map(([label, value]) => (
                          <div key={label}>
                            <p className="text-sm text-muted-foreground">
                              {label}
                            </p>
                            <p className="mt-2 font-semibold text-slate-900">
                              {value}
                            </p>
                          </div>
                        ))}
                      </div>

                      <Tabs value={detailTab} onValueChange={setDetailTab}>
                        <TabsList className="grid h-auto w-full grid-cols-7 rounded-full">
                          <TabsTrigger value="children">
                            Child Tickets
                          </TabsTrigger>
                          <TabsTrigger value="comments">Comments</TabsTrigger>
                          <TabsTrigger value="notes">
                            Internal Notes
                          </TabsTrigger>
                          <TabsTrigger value="attachments">
                            Attachments
                          </TabsTrigger>
                          <TabsTrigger value="history">History</TabsTrigger>
                          <TabsTrigger value="sla">SLA</TabsTrigger>
                          <TabsTrigger value="details">Details</TabsTrigger>
                        </TabsList>

                        <TabsContent
                          value="children"
                          className="mt-5 space-y-4"
                        >
                          <p className="text-2xl font-semibold">
                            Child Tickets ({childTickets.length})
                          </p>
                          {childTickets.map((ticket) => (
                            <button
                              key={ticket.id}
                              onClick={() => openTicket(ticket.id)}
                              className="grid w-full grid-cols-[160px_minmax(0,1fr)_140px_120px_140px_48px] items-center gap-4 rounded-[24px] border border-slate-100 px-5 py-5 text-left shadow-sm transition hover:border-primary/30"
                            >
                              <div>
                                <p className="font-semibold">{ticket.id}</p>
                                <p className="mt-2 text-sm text-muted-foreground">
                                  {ticket.assignedTeam}
                                </p>
                              </div>
                              <div>
                                <p className="font-medium text-slate-900">
                                  {ticket.subject}
                                </p>
                                <p className="mt-2 text-sm text-muted-foreground">
                                  Assigned to {ticket.assignee}
                                </p>
                              </div>
                              <Badge
                                className={cn(
                                  "rounded-full",
                                  statusTone[ticket.status],
                                )}
                              >
                                {ticket.status}
                              </Badge>
                              <p
                                className={cn(
                                  "font-medium",
                                  priorityTone[ticket.priority],
                                )}
                              >
                                {ticket.priority}
                              </p>
                              <p
                                className={cn(
                                  "font-semibold",
                                  slaTone[getSlaHealth(ticket)],
                                )}
                              >
                                {formatTimeLeft(ticket.dueDate)}
                              </p>
                              <span className="text-xl text-muted-foreground">
                                ›
                              </span>
                            </button>
                          ))}
                        </TabsContent>

                        <TabsContent value="comments" className="mt-5">
                          <div className="space-y-4">
                            {selectedTicket.comments.map((comment) => (
                              <div
                                key={comment.id}
                                className="rounded-2xl border border-slate-100 p-4"
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium">
                                      {comment.author}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {comment.role}
                                    </p>
                                  </div>
                                  <Badge variant="outline">
                                    {comment.channel}
                                  </Badge>
                                </div>
                                <p className="mt-3 text-sm text-slate-700">
                                  {comment.body}
                                </p>
                              </div>
                            ))}
                          </div>
                        </TabsContent>

                        <TabsContent value="attachments" className="mt-5">
                          <div className="grid gap-3 md:grid-cols-2">
                            {selectedTicket.attachments.map((attachment) => (
                              <div
                                key={attachment.id}
                                className="rounded-2xl border border-slate-100 p-4"
                              >
                                <p className="font-medium">{attachment.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {attachment.size}
                                </p>
                              </div>
                            ))}
                          </div>
                        </TabsContent>

                        <TabsContent value="history" className="mt-5">
                          <div className="space-y-3">
                            {selectedTicket.timeline.map((entry) => (
                              <div
                                key={entry.id}
                                className="rounded-2xl border border-slate-100 p-4"
                              >
                                <p className="font-medium">{entry.title}</p>
                                <p className="text-sm text-muted-foreground">
                                  {entry.subtitle} •{" "}
                                  {formatDateTime(entry.createdAt)}
                                </p>
                              </div>
                            ))}
                          </div>
                        </TabsContent>

                        <TabsContent value="notes" className="mt-5">
                          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 text-sm text-slate-700">
                            Internal note: Prioritize vendor confirmation before
                            finance sign-off.
                          </div>
                        </TabsContent>

                        <TabsContent value="sla" className="mt-5">
                          <div className="rounded-2xl border border-slate-100 p-5 text-sm">
                            SLA Policy: P2P - High Priority. Due by{" "}
                            {formatDateTime(selectedTicket.dueDate)}.
                          </div>
                        </TabsContent>

                        <TabsContent value="details" className="mt-5">
                          <div className="grid gap-3 md:grid-cols-2">
                            {[
                              ["Source", selectedTicket.source],
                              ["Impact", selectedTicket.impact],
                              ["Urgency", selectedTicket.urgency],
                              ["Location", selectedTicket.location || "-"],
                            ].map(([label, value]) => (
                              <div
                                key={label}
                                className="rounded-2xl border border-slate-100 p-4"
                              >
                                <p className="text-sm text-muted-foreground">
                                  {label}
                                </p>
                                <p className="mt-2 font-medium">{value}</p>
                              </div>
                            ))}
                          </div>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>

                  <div className="grid gap-3 md:grid-cols-4">
                    <Button variant="outline">Add Internal Note</Button>
                    <Button variant="outline">Add External Comment</Button>
                    <Button variant="outline">Pause SLA</Button>
                    <Button
                      variant="outline"
                      className="border-rose-200 text-rose-600"
                    >
                      Close Parent Ticket
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <Card className="rounded-[28px] border-slate-200 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-lg">Ticket Timeline</CardTitle>
                      <Button variant="ghost" size="sm">
                        View All
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {selectedTicket.timeline
                        .concat(
                          childTickets.map((ticket) => ({
                            id: `child-${ticket.id}`,
                            title: `Child ticket ${ticket.id} created`,
                            subtitle: "System",
                            channel: "System" as const,
                            createdAt: ticket.createdAt,
                          })),
                        )
                        .map((entry) => (
                          <div key={entry.id} className="flex gap-3">
                            <span className="mt-1 h-3 w-3 rounded-full bg-primary" />
                            <div>
                              <p className="font-medium">
                                {formatDateTime(entry.createdAt)}
                              </p>
                              <p className="text-sm text-slate-700">
                                {entry.title}
                              </p>
                            </div>
                          </div>
                        ))}
                    </CardContent>
                  </Card>

                  <Card className="rounded-[28px] border-slate-200 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Parent Ticket Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      {[
                        ["Total Child Tickets", String(childTickets.length)],
                        ["Completed", "0"],
                        [
                          "In Progress",
                          String(
                            childTickets.filter(
                              (ticket) => ticket.status === "In Progress",
                            ).length,
                          ),
                        ],
                        [
                          "Open",
                          String(
                            childTickets.filter(
                              (ticket) => ticket.status === "Open",
                            ).length,
                          ),
                        ],
                        [
                          "Waiting",
                          String(
                            childTickets.filter(
                              (ticket) => ticket.status === "Waiting",
                            ).length,
                          ),
                        ],
                        ["SLA Health", "At Risk"],
                      ].map(([label, value]) => (
                        <div key={label} className="flex justify-between">
                          <span className="text-muted-foreground">{label}</span>
                          <span className="font-medium">{value}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card className="rounded-[28px] border-slate-200 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-2">
                      <Button variant="outline">Reassign Parent</Button>
                      <Button variant="outline">Change Priority</Button>
                      <Button variant="outline">Escalate Ticket</Button>
                      <Button variant="outline">Pause SLA</Button>
                    </CardContent>
                  </Card>

                  <Card className="rounded-[28px] border-slate-200 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg">Additional Info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Impact</span>
                        <span>{selectedTicket.impact}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Urgency</span>
                        <span>{selectedTicket.urgency}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          SLA Policy
                        </span>
                        <span>P2P - High Priority</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Due Date</span>
                        <span>{formatDateTime(selectedTicket.dueDate)}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-2">
                        {selectedTicket.tags.map((tag) => (
                          <Badge key={tag} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)_320px]">
                <Card className="rounded-[28px] border-slate-200 shadow-sm">
                  <CardContent className="space-y-5 p-5">
                    <div>
                      <h2 className="text-2xl font-semibold">
                        Create New Ticket
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Ticket Context
                      </p>
                    </div>
                    <div className="space-y-4 rounded-[24px] border border-slate-100 p-4">
                      <div className="grid gap-2">
                        <p className="text-sm font-medium">Request Type</p>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            className={cn(
                              selectedTicket.requestType === "Procure to Pay"
                                ? ""
                                : "bg-white text-slate-700 hover:bg-slate-50",
                            )}
                          >
                            Procure to Pay
                          </Button>
                          <Button
                            variant="outline"
                            className={cn(
                              selectedTicket.requestType === "Services" &&
                                "border-primary text-primary",
                            )}
                          >
                            Service Request
                          </Button>
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <p className="text-sm font-medium">Category</p>
                        <Input value={selectedTicket.category} readOnly />
                      </div>
                      <div className="grid gap-2">
                        <p className="text-sm font-medium">Sub Category</p>
                        <Input value={selectedTicket.subCategory} readOnly />
                      </div>
                      <div className="grid gap-2">
                        <p className="text-sm font-medium">Organization</p>
                        <Input value={selectedTicket.organization} readOnly />
                      </div>
                    </div>

                    <Card className="rounded-[24px] border-slate-100 bg-violet-50 shadow-none">
                      <CardContent className="space-y-3 p-4">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-violet-700">
                            Smart Suggestions
                          </p>
                          <Badge className="rounded-full bg-white text-violet-700">
                            AI
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-700">
                          We found similar issues that might help you resolve
                          faster.
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="px-0 text-primary"
                        >
                          View Similar Tickets (4)
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="rounded-[24px] border-slate-100 shadow-none">
                      <CardContent className="space-y-3 p-4 text-sm">
                        <Badge className="w-fit rounded-full bg-emerald-100 text-emerald-700">
                          Within SLA
                        </Badge>
                        <p className="text-3xl font-semibold">12h 00m</p>
                        <p className="text-muted-foreground">Resolution Time</p>
                        <div className="border-t pt-3">
                          <p className="text-muted-foreground">Due By</p>
                          <p className="font-medium">
                            {formatDateTime(selectedTicket.dueDate)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="rounded-[24px] border-slate-100 bg-gradient-to-br from-slate-50 to-white shadow-none">
                      <CardContent className="space-y-3 p-4 text-sm">
                        <div className="flex items-center gap-3">
                          <Headphones className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium">Need Help?</p>
                            <p className="text-muted-foreground">
                              We are here to assist you 24/7.
                            </p>
                          </div>
                        </div>
                        <Button className="w-full">Contact Support</Button>
                      </CardContent>
                    </Card>
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  <Card className="rounded-[28px] border-slate-200 shadow-sm">
                    <CardContent className="space-y-5 p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {selectedTicket.id}
                          </p>
                          <h1 className="mt-2 text-4xl font-semibold tracking-tight">
                            {selectedTicket.subject}
                          </h1>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <Badge
                              className={cn(
                                "rounded-full",
                                statusTone[selectedTicket.status],
                              )}
                            >
                              {selectedTicket.status}
                            </Badge>
                            <Badge className="rounded-full bg-rose-50 text-rose-600">
                              {selectedTicket.priority}
                            </Badge>
                          </div>
                        </div>
                        <div className="rounded-[24px] border border-slate-100 p-4 text-center">
                          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-[8px] border-amber-400 text-2xl font-semibold text-amber-500">
                            75%
                          </div>
                          <p className="mt-3 text-sm text-muted-foreground">
                            SLA Remaining
                          </p>
                          <p className="text-2xl font-semibold">
                            {formatTimeLeft(selectedTicket.dueDate).replace(
                              " left",
                              "",
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-4 rounded-[24px] border border-slate-100 p-5 md:grid-cols-4">
                        {[
                          ["Category", selectedTicket.category],
                          ["Sub Category", selectedTicket.subCategory],
                          ["Priority", selectedTicket.priority],
                          ["Assigned To", selectedTicket.assignedTeam],
                        ].map(([label, value]) => (
                          <div key={label}>
                            <p className="text-sm text-muted-foreground">
                              {label}
                            </p>
                            <p className="mt-2 font-semibold">{value}</p>
                          </div>
                        ))}
                      </div>

                      <Tabs value={detailTab} onValueChange={setDetailTab}>
                        <TabsList className="grid h-auto w-full grid-cols-6 rounded-full">
                          <TabsTrigger value="overview">Overview</TabsTrigger>
                          <TabsTrigger value="children">
                            Child Tickets
                          </TabsTrigger>
                          <TabsTrigger value="comments">Comments</TabsTrigger>
                          <TabsTrigger value="notes">
                            Internal Notes
                          </TabsTrigger>
                          <TabsTrigger value="attachments">
                            Attachments
                          </TabsTrigger>
                          <TabsTrigger value="history">History</TabsTrigger>
                        </TabsList>

                        <TabsContent
                          value="overview"
                          className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]"
                        >
                          <Card className="rounded-[24px] border-slate-100 shadow-none">
                            <CardHeader>
                              <CardTitle className="text-lg">
                                Description
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm">
                              <p className="leading-7 text-slate-700">
                                {selectedTicket.description}
                              </p>
                              <div>
                                <p className="mb-3 font-medium">
                                  Attachments (
                                  {selectedTicket.attachments.length})
                                </p>
                                <div className="grid gap-3">
                                  {selectedTicket.attachments.map(
                                    (attachment) => (
                                      <div
                                        key={attachment.id}
                                        className="rounded-2xl border border-slate-100 p-3"
                                      >
                                        <p className="font-medium">
                                          {attachment.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          {attachment.size}
                                        </p>
                                      </div>
                                    ),
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          <Card className="rounded-[24px] border-slate-100 shadow-none">
                            <CardHeader>
                              <CardTitle className="text-lg">
                                Ticket Information
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                              {[
                                ["Request Type", selectedTicket.requestType],
                                ["Source", selectedTicket.source],
                                ["Ticket Type", selectedTicket.ticketType],
                                ["Impact", selectedTicket.impact],
                                ["Urgency", selectedTicket.urgency],
                                ["SLA Policy", "P2P - High Priority"],
                              ].map(([label, value]) => (
                                <div
                                  key={label}
                                  className="flex justify-between gap-3"
                                >
                                  <span className="text-muted-foreground">
                                    {label}
                                  </span>
                                  <span className="font-medium">{value}</span>
                                </div>
                              ))}
                            </CardContent>
                          </Card>
                        </TabsContent>

                        <TabsContent value="children" className="mt-5">
                          <div className="space-y-3">
                            {tickets
                              .filter(
                                (ticket) =>
                                  ticket.parentId === selectedTicket.id,
                              )
                              .map((ticket) => (
                                <button
                                  key={ticket.id}
                                  onClick={() => openTicket(ticket.id)}
                                  className="grid w-full grid-cols-[140px_minmax(0,1fr)_120px_140px] items-center gap-4 rounded-2xl border border-slate-100 px-4 py-4 text-left"
                                >
                                  <p className="font-semibold">{ticket.id}</p>
                                  <p className="font-medium">
                                    {ticket.subject}
                                  </p>
                                  <Badge
                                    className={cn(
                                      "rounded-full",
                                      statusTone[ticket.status],
                                    )}
                                  >
                                    {ticket.status}
                                  </Badge>
                                  <p className="text-sm text-muted-foreground">
                                    Due in {formatTimeLeft(ticket.dueDate)}
                                  </p>
                                </button>
                              ))}
                            {!tickets.some(
                              (ticket) => ticket.parentId === selectedTicket.id,
                            ) && (
                              <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                                No child tickets linked yet.
                              </div>
                            )}
                          </div>
                        </TabsContent>

                        <TabsContent value="comments" className="mt-5">
                          <div className="space-y-4">
                            {selectedTicket.comments.map((comment) => (
                              <div
                                key={comment.id}
                                className="rounded-2xl border border-slate-100 p-4"
                              >
                                <div className="flex items-center justify-between">
                                  <p className="font-medium">
                                    {comment.author}
                                  </p>
                                  <Badge variant="outline">
                                    {comment.channel}
                                  </Badge>
                                </div>
                                <p className="mt-3 text-sm text-slate-700">
                                  {comment.body}
                                </p>
                              </div>
                            ))}
                          </div>
                        </TabsContent>

                        <TabsContent value="notes" className="mt-5">
                          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700">
                            Internal note: escalation is not required yet.
                            Waiting for vendor clarification.
                          </div>
                        </TabsContent>

                        <TabsContent value="attachments" className="mt-5">
                          <div className="space-y-3">
                            {selectedTicket.attachments.map((attachment) => (
                              <div
                                key={attachment.id}
                                className="rounded-2xl border border-slate-100 p-4"
                              >
                                <p className="font-medium">{attachment.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {attachment.size}
                                </p>
                              </div>
                            ))}
                          </div>
                        </TabsContent>

                        <TabsContent value="history" className="mt-5">
                          <div className="space-y-3">
                            {selectedTicket.timeline.map((entry) => (
                              <div
                                key={entry.id}
                                className="rounded-2xl border border-slate-100 p-4"
                              >
                                <p className="font-medium">{entry.title}</p>
                                <p className="text-sm text-muted-foreground">
                                  {entry.subtitle} •{" "}
                                  {formatDateTime(entry.createdAt)}
                                </p>
                              </div>
                            ))}
                          </div>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>

                  <div className="grid gap-3 md:grid-cols-5">
                    <Button variant="outline">Reassign</Button>
                    <Button variant="outline">Change Priority</Button>
                    <Button variant="outline">Escalate</Button>
                    <Button variant="outline">Pause SLA</Button>
                    <Button
                      variant="outline"
                      className="border-rose-200 text-rose-600"
                    >
                      Close Ticket
                    </Button>
                  </div>
                </div>

                <Card className="rounded-[28px] border-slate-200 shadow-sm">
                  <Tabs defaultValue="activity" className="h-full">
                    <CardHeader className="border-b border-slate-100 pb-4">
                      <TabsList className="grid h-auto w-full grid-cols-2 rounded-full">
                        <TabsTrigger value="activity">Activity</TabsTrigger>
                        <TabsTrigger value="details">Details</TabsTrigger>
                      </TabsList>
                    </CardHeader>
                    <TabsContent value="activity" className="mt-0 h-full">
                      <CardContent className="space-y-4 p-5">
                        <div className="flex items-center justify-between">
                          <p className="text-lg font-semibold">Status Flow</p>
                          <Button variant="ghost" size="sm">
                            View All
                          </Button>
                        </div>
                        <div className="flex justify-between text-center text-xs text-muted-foreground">
                          {[
                            "Open",
                            "Assigned",
                            "In Progress",
                            "Waiting",
                            "Resolved",
                            "Closed",
                          ].map((status) => (
                            <div key={status} className="flex-1">
                              <div
                                className={cn(
                                  "mx-auto mb-2 h-8 w-8 rounded-full border-2",
                                  status === selectedTicket.status
                                    ? "border-primary bg-primary text-white"
                                    : "border-slate-200 bg-white",
                                )}
                              />
                              {status}
                            </div>
                          ))}
                        </div>
                        <ScrollArea className="h-[520px] pr-3">
                          <div className="space-y-4">
                            {selectedTicket.comments.map((comment) => (
                              <div
                                key={comment.id}
                                className="rounded-2xl border border-slate-100 p-4"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                                      <UserCircle2 className="h-5 w-5" />
                                    </div>
                                    <div>
                                      <p className="font-medium">
                                        {comment.author}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {comment.role} •{" "}
                                        {formatDateTime(comment.createdAt)}
                                      </p>
                                    </div>
                                  </div>
                                  <Badge variant="outline">
                                    {comment.channel}
                                  </Badge>
                                </div>
                                <p className="mt-3 text-sm text-slate-700">
                                  {comment.body}
                                </p>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>

                        <div className="rounded-[24px] border border-slate-100 p-4">
                          <div className="mb-3 flex gap-3">
                            <Button
                              variant={
                                commentTab === "Internal"
                                  ? "default"
                                  : "outline"
                              }
                              size="sm"
                              onClick={() => setCommentTab("Internal")}
                            >
                              Internal Note
                            </Button>
                            <Button
                              variant={
                                commentTab === "External"
                                  ? "default"
                                  : "outline"
                              }
                              size="sm"
                              onClick={() => setCommentTab("External")}
                            >
                              External Comment
                            </Button>
                          </div>
                          <Textarea
                            rows={4}
                            value={newComment}
                            onChange={(event) =>
                              setNewComment(event.target.value)
                            }
                            placeholder={`Write an ${commentTab.toLowerCase()} note...`}
                          />
                          <div className="mt-3 flex justify-end">
                            <Button onClick={addComment}>Post Note</Button>
                          </div>
                        </div>
                      </CardContent>
                    </TabsContent>
                    <TabsContent value="details" className="mt-0">
                      <CardContent className="space-y-4 p-5 text-sm">
                        {[
                          ["Organization", selectedTicket.organization],
                          ["PO Number", selectedTicket.poNumber || "-"],
                          ["Order ID", selectedTicket.orderId || "-"],
                          [
                            "Invoice Number",
                            selectedTicket.invoiceNumber || "-",
                          ],
                          ["Vendor", selectedTicket.vendorName || "-"],
                        ].map(([label, value]) => (
                          <div
                            key={label}
                            className="flex justify-between gap-3"
                          >
                            <span className="text-muted-foreground">
                              {label}
                            </span>
                            <span className="font-medium">{value}</span>
                          </div>
                        ))}
                      </CardContent>
                    </TabsContent>
                  </Tabs>
                </Card>
              </div>
            )}
          </div>
        )}

        <Card className="rounded-[28px] border-slate-200 bg-gradient-to-br from-slate-50 to-white shadow-sm">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5 text-sm">
            <div className="flex items-center gap-3">
              <LifeBuoy className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Service Desk Signals</p>
                <p className="text-muted-foreground">
                  {orders.length} linked orders • {vendors.length} vendor
                  profiles • {clients.length} client records
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge className="rounded-full bg-blue-100 text-blue-700">
                <TrendingUp className="mr-1 h-3.5 w-3.5" /> SLA Trending Up
              </Badge>
              <Badge className="rounded-full bg-violet-100 text-violet-700">
                <Bot className="mr-1 h-3.5 w-3.5" /> AI Suggestions Active
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
