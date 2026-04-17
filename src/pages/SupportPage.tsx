import { useState, useCallback } from "react";
import Header from "@/components/layout/Header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import {
  MessageSquare,
  AlertCircle,
  Clock,
  CheckCircle2,
  Search,
  Plus,
  Send,
  Mail,
  Phone,
  Headphones,
  MessageCircle,
  Copy,
  Link,
  Users,
  ArrowUpRight,
} from "lucide-react";
import QuickMailComposer from "@/components/shared/QuickMailComposer";
import ValidationAlert from "@/components/shared/ValidationAlert";
import { useAuth } from "@/contexts/AuthContext";
import { safeReadJson } from "@/lib/storage";

type Priority = "High" | "Medium" | "Low";
type Status = "Open" | "In Progress" | "Resolved" | "Closed";
type OwnerLevel = "L1" | "L2" | "L3";

interface TicketMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
}

interface TicketOwner {
  level: OwnerLevel;
  name: string;
  assignedAt: string;
}

interface Ticket {
  id: string;
  organization: string;
  subject: string;
  description: string;
  priority: Priority;
  status: Status;
  lastUpdated: string;
  createdAt: string;
  assignedTo: string;
  owners: TicketOwner[];
  trackingLink: string;
  messages: TicketMessage[];
}

const OWNER_LEVELS: Record<OwnerLevel, { label: string; members: string[] }> = {
  L1: {
    label: "Level 1 – Front Desk",
    members: ["Support Agent A", "Support Agent B", "Help Desk"],
  },
  L2: {
    label: "Level 2 – Specialist",
    members: ["Sr. Analyst", "Technical Lead", "Domain Expert"],
  },
  L3: {
    label: "Level 3 – Management",
    members: ["Account Manager", "Operations Head", "VP Support"],
  },
};

const generateTrackingLink = (ticketId: string) =>
  `${window.location.origin}/support/track/${ticketId}`;

const INITIAL_TICKETS: Ticket[] = [
  {
    id: "TKT-001",
    organization: "Acme Corp",
    subject: "Delay in laptop delivery",
    description: "Order ORD-1042 laptops delayed by 2 weeks.",
    priority: "High",
    status: "In Progress",
    lastUpdated: "2026-03-03",
    createdAt: "2026-02-28",
    assignedTo: "Support Team",
    owners: [
      { level: "L1", name: "Help Desk", assignedAt: "2026-02-28 10:00" },
      { level: "L2", name: "Sr. Analyst", assignedAt: "2026-03-01 09:00" },
    ],
    trackingLink: "",
    messages: [
      {
        id: "m1",
        sender: "Acme Corp",
        text: "Our laptop order is delayed. Please update.",
        timestamp: "2026-02-28 10:00",
      },
      {
        id: "m2",
        sender: "Support Team",
        text: "We are following up with the vendor. ETA next week.",
        timestamp: "2026-03-01 14:30",
      },
    ],
  },
  {
    id: "TKT-002",
    organization: "Beta Inc",
    subject: "Invoice discrepancy for October",
    description: "Invoice amount doesn't match PO total.",
    priority: "Medium",
    status: "Open",
    lastUpdated: "2026-03-02",
    createdAt: "2026-02-27",
    assignedTo: "Finance Team",
    owners: [
      { level: "L1", name: "Support Agent A", assignedAt: "2026-02-27 09:15" },
    ],
    trackingLink: "",
    messages: [
      {
        id: "m3",
        sender: "Beta Inc",
        text: "Invoice INV-298 shows ₹45,000 but PO was ₹42,500.",
        timestamp: "2026-02-27 09:15",
      },
    ],
  },
  {
    id: "TKT-003",
    organization: "Gamma Ltd",
    subject: "Login issue for user_x2",
    description: "User cannot access the portal.",
    priority: "Low",
    status: "Resolved",
    lastUpdated: "2026-03-02",
    createdAt: "2026-02-25",
    assignedTo: "IT Support",
    owners: [
      { level: "L1", name: "Help Desk", assignedAt: "2026-02-25 11:00" },
      { level: "L2", name: "Technical Lead", assignedAt: "2026-02-25 14:00" },
    ],
    trackingLink: "",
    messages: [
      {
        id: "m4",
        sender: "Gamma Ltd",
        text: "user_x2 can't log in.",
        timestamp: "2026-02-25 11:00",
      },
      {
        id: "m5",
        sender: "IT Support",
        text: "Password reset completed. User can now access.",
        timestamp: "2026-02-26 08:45",
      },
    ],
  },
  {
    id: "TKT-004",
    organization: "Acme Corp",
    subject: "Contract renewal inquiry",
    description: "Need details on renewal terms for 2026-27.",
    priority: "High",
    status: "In Progress",
    lastUpdated: "2026-03-01",
    createdAt: "2026-02-20",
    assignedTo: "Account Manager",
    owners: [
      { level: "L1", name: "Support Agent B", assignedAt: "2026-02-20 16:00" },
      { level: "L2", name: "Domain Expert", assignedAt: "2026-02-21 10:00" },
      { level: "L3", name: "Account Manager", assignedAt: "2026-02-22 09:00" },
    ],
    trackingLink: "",
    messages: [
      {
        id: "m6",
        sender: "Acme Corp",
        text: "Please share renewal pricing.",
        timestamp: "2026-02-20 16:00",
      },
    ],
  },
  {
    id: "TKT-005",
    organization: "Delta Co",
    subject: "Bulk order request for monitors",
    description: "Need 200 monitors delivered to 3 locations.",
    priority: "Medium",
    status: "Resolved",
    lastUpdated: "2026-03-02",
    createdAt: "2026-02-18",
    assignedTo: "Procurement",
    owners: [
      { level: "L1", name: "Help Desk", assignedAt: "2026-02-18 13:00" },
    ],
    trackingLink: "",
    messages: [
      {
        id: "m7",
        sender: "Delta Co",
        text: "Requesting quote for 200 monitors.",
        timestamp: "2026-02-18 13:00",
      },
      {
        id: "m8",
        sender: "Procurement",
        text: "Quote shared via email. Order confirmed.",
        timestamp: "2026-02-22 10:30",
      },
    ],
  },
].map((t) => ({ ...t, trackingLink: generateTrackingLink(t.id) })) as Ticket[];

const STORAGE_KEY = "support_tickets";

function loadTickets(): Ticket[] {
  return safeReadJson<Ticket[]>(STORAGE_KEY, INITIAL_TICKETS);
}

function saveTickets(tickets: Ticket[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
}

const statusConfig: Record<Status, { icon: React.ElementType; color: string }> =
  {
    Open: { icon: AlertCircle, color: "text-amber-600" },
    "In Progress": { icon: Clock, color: "text-blue-600" },
    Resolved: { icon: CheckCircle2, color: "text-emerald-600" },
    Closed: { icon: CheckCircle2, color: "text-muted-foreground" },
  };

const priorityVariant: Record<Priority, "default" | "secondary" | "outline"> = {
  High: "default",
  Medium: "secondary",
  Low: "outline",
};

export default function SupportPage() {
  const { isOwner } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>(loadTickets);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyText, setReplyText] = useState("");
  const [showMailComposer, setShowMailComposer] = useState(false);
  const [mailRecipientType, setMailRecipientType] = useState<
    "vendor" | "client" | "all"
  >("all");
  const [showHotline, setShowHotline] = useState(false);
  const [validationError, setValidationError] = useState({
    open: false,
    message: "",
  });

  // Create ticket form
  const [org, setOrg] = useState("");
  const [priority, setPriority] = useState<Priority | "">("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");

  const persist = useCallback((updated: Ticket[]) => {
    setTickets(updated);
    saveTickets(updated);
  }, []);

  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === "Open").length,
    inProgress: tickets.filter((t) => t.status === "In Progress").length,
    resolved: tickets.filter(
      (t) => t.status === "Resolved" || t.status === "Closed",
    ).length,
  };

  const filtered = tickets.filter((t) => {
    const matchSearch =
      !search ||
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.subject.toLowerCase().includes(search.toLowerCase()) ||
      t.organization.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || t.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleSubmit = () => {
    if (!org) {
      setValidationError({
        open: true,
        message: "Please select an organization for this ticket.",
      });
      return;
    }
    if (!priority) {
      setValidationError({
        open: true,
        message: "Please select a priority level for this ticket.",
      });
      return;
    }
    if (!subject.trim()) {
      setValidationError({
        open: true,
        message: "Please provide a subject describing the issue.",
      });
      return;
    }
    if (subject.trim().length < 5) {
      setValidationError({
        open: true,
        message: "Subject must be at least 5 characters long.",
      });
      return;
    }
    if (!description.trim()) {
      setValidationError({
        open: true,
        message: "Please provide a detailed description of the issue.",
      });
      return;
    }
    if (description.trim().length < 10) {
      setValidationError({
        open: true,
        message:
          "Description must be at least 10 characters long for proper resolution.",
      });
      return;
    }
    const now = new Date().toISOString().slice(0, 10);
    const ticketId = `TKT-${String(tickets.length + 1).padStart(3, "0")}`;
    const defaultOwner: TicketOwner = {
      level: "L1",
      name: OWNER_LEVELS.L1.members[
        Math.floor(Math.random() * OWNER_LEVELS.L1.members.length)
      ],
      assignedAt: new Date().toLocaleString(),
    };
    const newTicket: Ticket = {
      id: ticketId,
      organization: org,
      subject: subject.trim().slice(0, 200),
      description: description.trim().slice(0, 2000),
      priority: priority as Priority,
      status: "Open",
      lastUpdated: now,
      createdAt: now,
      assignedTo: defaultOwner.name,
      owners: [defaultOwner],
      trackingLink: generateTrackingLink(ticketId),
      messages: [
        {
          id: crypto.randomUUID(),
          sender: org,
          text: description.trim().slice(0, 2000),
          timestamp: new Date().toLocaleString(),
        },
      ],
    };
    persist([newTicket, ...tickets]);
    setOrg("");
    setPriority("");
    setSubject("");
    setDescription("");
    toast({
      title: "Ticket created",
      description: `${newTicket.id} submitted successfully.`,
    });
  };

  const handleStatusChange = (ticketId: string, newStatus: Status) => {
    persist(
      tickets.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              status: newStatus,
              lastUpdated: new Date().toISOString().slice(0, 10),
            }
          : t,
      ),
    );
    if (selectedTicket?.id === ticketId)
      setSelectedTicket((prev) =>
        prev ? { ...prev, status: newStatus } : null,
      );
    toast({
      title: "Status updated",
      description: `${ticketId} → ${newStatus}`,
    });
  };

  const handleReply = () => {
    if (!replyText.trim() || !selectedTicket) return;
    const msg: TicketMessage = {
      id: crypto.randomUUID(),
      sender: "Support Team",
      text: replyText.trim().slice(0, 2000),
      timestamp: new Date().toLocaleString(),
    };
    const updated = tickets.map((t) =>
      t.id === selectedTicket.id
        ? {
            ...t,
            messages: [...t.messages, msg],
            lastUpdated: new Date().toISOString().slice(0, 10),
          }
        : t,
    );
    persist(updated);
    setSelectedTicket((prev) =>
      prev ? { ...prev, messages: [...prev.messages, msg] } : null,
    );
    setReplyText("");
  };

  const handleEscalate = (value: string) => {
    if (!selectedTicket || !isOwner) {
      setValidationError({
        open: true,
        message: "Only the system owner can assign ticket owners.",
      });
      return;
    }
    const [level, name] = value.split("|") as [OwnerLevel, string];
    const newOwner: TicketOwner = {
      level,
      name,
      assignedAt: new Date().toLocaleString(),
    };
    const updated = tickets.map((t) =>
      t.id === selectedTicket.id
        ? {
            ...t,
            owners: [...t.owners, newOwner],
            assignedTo: name,
            lastUpdated: new Date().toISOString().slice(0, 10),
          }
        : t,
    );
    persist(updated);
    setSelectedTicket((prev) =>
      prev
        ? { ...prev, owners: [...prev.owners, newOwner], assignedTo: name }
        : null,
    );
    toast({
      title: "Owner Added",
      description: `${name} (${level}) assigned to ${selectedTicket.id}`,
    });
  };

  const kpis = [
    { label: "Total Tickets", value: stats.total, icon: MessageSquare },
    { label: "Open", value: stats.open, icon: AlertCircle },
    { label: "In Progress", value: stats.inProgress, icon: Clock },
    { label: "Resolved", value: stats.resolved, icon: CheckCircle2 },
  ];

  return (
    <div>
      <Header title="Support Center" />
      <div className="p-6 space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-display font-bold">Support Center</h1>
          <p className="text-muted-foreground text-sm">
            Manage support tickets and customer inquiries
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((k) => {
            const Icon = k.icon;
            return (
              <Card
                key={k.label}
                className="p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                  <Icon className="h-4 w-4" /> {k.label}
                </div>
                <p className="text-3xl font-bold">{k.value}</p>
              </Card>
            );
          })}
        </div>

        {/* Create + List side-by-side */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Create Ticket */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Create New Ticket</CardTitle>
              <CardDescription>Submit a new support request</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Organization</Label>
                <Select value={org} onValueChange={setOrg}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select organization" />
                  </SelectTrigger>
                  <SelectContent>
                    {["Acme Corp", "Beta Inc", "Gamma Ltd", "Delta Co"].map(
                      (o) => (
                        <SelectItem key={o} value={o}>
                          {o}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select
                  value={priority}
                  onValueChange={(v) => setPriority(v as Priority)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Subject</Label>
                <Input
                  placeholder="Brief description of the issue"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  maxLength={200}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea
                  placeholder="Detailed description of the issue"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  maxLength={2000}
                />
              </div>
              <Button onClick={handleSubmit} className="w-full">
                <Plus className="h-4 w-4 mr-1" /> Submit Ticket
              </Button>
            </CardContent>
          </Card>

          {/* Ticket List */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-lg">All Support Tickets</CardTitle>
                  <CardDescription>
                    All support requests and their status
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search tickets…"
                      className="pl-8 w-48"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="Open">Open</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Resolved">Resolved</SelectItem>
                      <SelectItem value="Closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket ID</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center text-muted-foreground py-8"
                      >
                        No tickets found
                      </TableCell>
                    </TableRow>
                  )}
                  {filtered.map((t) => {
                    const Sc = statusConfig[t.status];
                    const SIcon = Sc.icon;
                    return (
                      <TableRow
                        key={t.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => setSelectedTicket(t)}
                      >
                        <TableCell className="font-mono font-medium">
                          {t.id}
                        </TableCell>
                        <TableCell>{t.organization}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {t.subject}
                        </TableCell>
                        <TableCell>
                          <Badge variant={priorityVariant[t.priority]}>
                            {t.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-medium ${Sc.color}`}
                          >
                            <SIcon className="h-3.5 w-3.5" /> {t.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {t.lastUpdated}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Quick Mail & Contact Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card
            className="cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5"
            onClick={() => setShowHotline(true)}
          >
            <CardContent className="p-5 flex flex-col items-center text-center gap-2">
              <Headphones className="h-6 w-6 text-primary" />
              <h3 className="font-semibold">Support Hotline</h3>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4" /> +1 (800) SUPPORT
              </div>
              <p className="text-xs text-muted-foreground">
                Available 24/7 for urgent issues
              </p>
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5"
            onClick={() => {
              setMailRecipientType("all");
              setShowMailComposer(true);
            }}
          >
            <CardContent className="p-5 flex flex-col items-center text-center gap-2">
              <Mail className="h-6 w-6 text-primary" />
              <h3 className="font-semibold">Email Support</h3>
              <p className="text-sm">support@nidotech.com</p>
              <p className="text-xs text-muted-foreground">
                Response within 24 hours
              </p>
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5"
            onClick={() => {
              setMailRecipientType("vendor");
              setShowMailComposer(true);
            }}
          >
            <CardContent className="p-5 flex flex-col items-center text-center gap-2">
              <Send className="h-6 w-6 text-primary" />
              <h3 className="font-semibold">Mail Vendor</h3>
              <p className="text-sm font-medium">Draft Professional Email</p>
              <p className="text-xs text-muted-foreground">
                Send to any registered vendor
              </p>
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5"
            onClick={() => {
              setMailRecipientType("client");
              setShowMailComposer(true);
            }}
          >
            <CardContent className="p-5 flex flex-col items-center text-center gap-2">
              <MessageCircle className="h-6 w-6 text-primary" />
              <h3 className="font-semibold">Mail Client</h3>
              <p className="text-sm font-medium">Draft Professional Email</p>
              <p className="text-xs text-muted-foreground">
                Send to any registered client
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Ticket Detail Dialog — LARGE */}
      <Dialog
        open={!!selectedTicket}
        onOpenChange={(open) => {
          if (!open) setSelectedTicket(null);
        }}
      >
        <DialogContent className="max-w-[96vw] lg:max-w-[90vw] xl:max-w-[84vw] 2xl:max-w-[78vw]">
          {selectedTicket && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-xl">
                  <span className="font-mono">{selectedTicket.id}</span>
                  <Badge
                    variant={priorityVariant[selectedTicket.priority]}
                    className="text-sm"
                  >
                    {selectedTicket.priority} Priority
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-sm">
                  {selectedTicket.organization} · Created{" "}
                  {selectedTicket.createdAt}
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left column — Details */}
                <div className="lg:col-span-2 space-y-5">
                  <div className="bg-muted/30 rounded-xl p-5 border border-border">
                    <h4 className="font-semibold text-foreground text-lg mb-2">
                      {selectedTicket.subject}
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {selectedTicket.description}
                    </p>
                  </div>

                  {/* Tracking Link */}
                  <div className="flex items-center gap-3 bg-primary/5 rounded-xl px-5 py-4 border border-primary/20">
                    <Link className="h-5 w-5 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-semibold text-foreground block mb-1">
                        Client Tracking Link
                      </span>
                      <code className="text-xs text-primary truncate block">
                        {selectedTicket.trackingLink}
                      </code>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 shrink-0"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          selectedTicket.trackingLink,
                        );
                        toast({
                          title: "Copied!",
                          description: "Tracking link copied to clipboard",
                        });
                      }}
                    >
                      <Copy className="h-3.5 w-3.5" /> Copy
                    </Button>
                  </div>

                  {/* Conversation */}
                  <div className="border rounded-xl overflow-hidden">
                    <div className="px-5 py-3 border-b bg-muted/30 text-sm font-semibold flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-primary" />{" "}
                      Conversation
                    </div>
                    <ScrollArea className="h-[300px] p-4">
                      <div className="space-y-3">
                        {selectedTicket.messages.map((m) => (
                          <div
                            key={m.id}
                            className={`rounded-xl p-4 text-sm ${m.sender === "Support Team" ? "bg-primary/10 ml-8 border border-primary/20" : "bg-muted mr-8"}`}
                          >
                            <div className="flex justify-between text-xs text-muted-foreground mb-2">
                              <span className="font-semibold text-foreground">
                                {m.sender}
                              </span>
                              <span>{m.timestamp}</span>
                            </div>
                            <p className="text-foreground leading-relaxed">
                              {m.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    <div className="flex gap-3 p-4 border-t">
                      <Input
                        placeholder="Type a reply…"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleReply()}
                        maxLength={2000}
                      />
                      <Button onClick={handleReply} className="gap-2">
                        <Send className="h-4 w-4" /> Reply
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Right column — Owner assignment + Status */}
                <div className="space-y-5">
                  <div className="flex items-center gap-4 bg-muted/30 rounded-xl p-4 border border-border">
                    <Label className="text-sm font-semibold shrink-0">
                      Status:
                    </Label>
                    <Select
                      value={selectedTicket.status}
                      onValueChange={(v) =>
                        handleStatusChange(selectedTicket.id, v as Status)
                      }
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Open">Open</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Resolved">Resolved</SelectItem>
                        <SelectItem value="Closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="text-sm text-muted-foreground bg-muted/30 rounded-xl p-4 border border-border">
                    Assigned to:{" "}
                    <strong className="text-foreground">
                      {selectedTicket.assignedTo}
                    </strong>
                  </div>

                  {/* Owner Assignment Levels */}
                  <div className="border rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Users className="h-4 w-4 text-primary" /> Escalation
                      Owners
                    </div>
                    <div className="space-y-2">
                      {selectedTicket.owners.map((owner, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 text-sm bg-muted/30 rounded-lg px-4 py-3"
                        >
                          <Badge
                            variant={
                              owner.level === "L3"
                                ? "default"
                                : owner.level === "L2"
                                  ? "secondary"
                                  : "outline"
                            }
                            className="text-xs"
                          >
                            {owner.level}
                          </Badge>
                          <span className="font-medium flex-1">
                            {owner.name}
                          </span>
                          <span className="text-muted-foreground text-[11px]">
                            {owner.assignedAt}
                          </span>
                        </div>
                      ))}
                    </div>
                    {isOwner ? (
                      <Select onValueChange={handleEscalate}>
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder="+ Escalate to..." />
                        </SelectTrigger>
                        <SelectContent>
                          {(
                            Object.entries(OWNER_LEVELS) as [
                              OwnerLevel,
                              { label: string; members: string[] },
                            ][]
                          ).map(([level, config]) =>
                            config.members
                              .filter(
                                (m) =>
                                  !selectedTicket.owners.some(
                                    (o) => o.name === m,
                                  ),
                              )
                              .map((member) => (
                                <SelectItem
                                  key={`${level}-${member}`}
                                  value={`${level}|${member}`}
                                >
                                  <span className="flex items-center gap-2">
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] h-4"
                                    >
                                      {level}
                                    </Badge>{" "}
                                    {member}
                                  </span>
                                </SelectItem>
                              )),
                          )}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">
                        Only the system owner can assign ticket owners.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <QuickMailComposer
        open={showMailComposer}
        onClose={() => setShowMailComposer(false)}
        recipientType={mailRecipientType}
      />

      {/* Support Hotline Dialog */}
      <Dialog open={showHotline} onOpenChange={setShowHotline}>
        <DialogContent className="max-w-[96vw] sm:max-w-2xl lg:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Headphones className="h-5 w-5 text-primary" /> Support Hotline
            </DialogTitle>
            <DialogDescription>
              Contact our support team directly
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-xl p-6 text-center space-y-2">
              <Phone className="h-8 w-8 text-primary mx-auto" />
              <p className="text-2xl font-bold tracking-wide">
                +1 (800) 787-7678
              </p>
              <p className="text-sm text-muted-foreground">
                Available 24/7 for urgent issues
              </p>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Business Hours</span>
                <span className="font-medium">Mon–Fri, 9 AM – 6 PM EST</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Emergency Line</span>
                <span className="font-medium">24/7</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Email Fallback</span>
                <span className="font-medium">urgent@nidotech.com</span>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowHotline(false)}>
                Cancel
              </Button>
              <Button
                className="gap-2"
                onClick={() => {
                  navigator.clipboard.writeText("+1 (800) 787-7678");
                  toast({
                    title: "Copied!",
                    description: "Phone number copied to clipboard",
                  });
                }}
              >
                <Copy className="h-4 w-4" /> Copy Number
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ValidationAlert
        open={validationError.open}
        onClose={() => setValidationError({ open: false, message: "" })}
        message={validationError.message}
      />
    </div>
  );
}
