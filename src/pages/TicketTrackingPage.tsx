import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Building2,
  Users,
} from "lucide-react";
import { safeReadJson } from "@/lib/storage";

type Priority = "High" | "Medium" | "Low";
type Status = "Open" | "In Progress" | "Resolved" | "Closed";

interface TicketMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
}
interface TicketOwner {
  level: string;
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

const statusConfig: Record<
  Status,
  { icon: React.ElementType; color: string; bg: string; label: string }
> = {
  Open: {
    icon: AlertCircle,
    color: "text-amber-600",
    bg: "bg-amber-50 border-amber-200",
    label: "Open",
  },
  "In Progress": {
    icon: Clock,
    color: "text-blue-600",
    bg: "bg-blue-50 border-blue-200",
    label: "In Progress",
  },
  Resolved: {
    icon: CheckCircle2,
    color: "text-emerald-600",
    bg: "bg-emerald-50 border-emerald-200",
    label: "Resolved",
  },
  Closed: {
    icon: CheckCircle2,
    color: "text-muted-foreground",
    bg: "bg-muted border-border",
    label: "Closed",
  },
};

const INITIAL_TICKETS = [
  {
    id: "TKT-001",
    organization: "Acme Corp",
    subject: "Delay in laptop delivery",
    description: "Order ORD-1042 laptops delayed by 2 weeks.",
    priority: "High" as Priority,
    status: "In Progress" as Status,
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
    priority: "Medium" as Priority,
    status: "Open" as Status,
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
    priority: "Low" as Priority,
    status: "Resolved" as Status,
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
    priority: "High" as Priority,
    status: "In Progress" as Status,
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
    priority: "Medium" as Priority,
    status: "Resolved" as Status,
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
];

export default function TicketTrackingPage() {
  const { ticketId } = useParams();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [clientReply, setClientReply] = useState("");

  useEffect(() => {
    const tickets = safeReadJson<Ticket[]>("support_tickets", INITIAL_TICKETS);
    const found = tickets.find((t) => t.id === ticketId);
    if (found) setTicket(found);
  }, [ticketId]);

  const handleClientReply = () => {
    if (!clientReply.trim() || !ticket) return;
    const msg: TicketMessage = {
      id: crypto.randomUUID(),
      sender: ticket.organization,
      text: clientReply.trim(),
      timestamp: new Date().toLocaleString(),
    };
    const updated = { ...ticket, messages: [...ticket.messages, msg] };
    setTicket(updated);
    const tickets = safeReadJson<Ticket[]>("support_tickets", INITIAL_TICKETS);
    const idx = tickets.findIndex((t) => t.id === ticketId);
    if (idx >= 0) {
      tickets[idx] = {
        ...tickets[idx],
        messages: [...tickets[idx].messages, msg],
      };
      localStorage.setItem("support_tickets", JSON.stringify(tickets));
    }
    setClientReply("");
  };

  if (!ticket) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="p-10 text-center space-y-4">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto" />
            <h2 className="text-xl font-bold text-foreground">
              Ticket Not Found
            </h2>
            <p className="text-sm text-muted-foreground">
              The tracking link may be invalid or the ticket may have been
              removed. Please contact support for assistance.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const Sc = statusConfig[ticket.status];
  const SIcon = Sc.icon;

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary/5 border-b border-border px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Building2 className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-lg font-bold text-foreground">
              Nido Tech Support
            </h1>
            <p className="text-xs text-muted-foreground">
              Ticket Tracking Portal
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-xl flex items-center gap-3">
                  <span className="font-mono">{ticket.id}</span>
                  <Badge variant="outline">{ticket.priority}</Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {ticket.organization} · Created {ticket.createdAt}
                </p>
              </div>
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-full border ${Sc.bg}`}
              >
                <SIcon className={`h-4 w-4 ${Sc.color}`} />
                <span className={`text-sm font-semibold ${Sc.color}`}>
                  {ticket.status}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="bg-muted/30 rounded-xl p-5 border border-border">
              <h3 className="font-semibold text-foreground text-lg">
                {ticket.subject}
              </h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                {ticket.description}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="bg-muted/30 rounded-lg p-3">
                <span className="text-muted-foreground text-xs">
                  Assigned To
                </span>
                <p className="font-medium">{ticket.assignedTo}</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3">
                <span className="text-muted-foreground text-xs">
                  Last Updated
                </span>
                <p className="font-medium">{ticket.lastUpdated}</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3">
                <span className="text-muted-foreground text-xs">
                  Support Levels
                </span>
                <div className="flex gap-1 mt-1">
                  {ticket.owners.map((o, i) => (
                    <Badge key={i} variant="outline" className="text-[10px]">
                      {o.level}: {o.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" /> Conversation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[350px] pr-4">
              <div className="space-y-4">
                {ticket.messages.map((m) => (
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
                    <p className="text-foreground leading-relaxed">{m.text}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="flex gap-3 mt-4 pt-4 border-t border-border">
              <Input
                placeholder="Type your reply..."
                value={clientReply}
                onChange={(e) => setClientReply(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleClientReply()}
                className="flex-1"
              />
              <Button onClick={handleClientReply} className="gap-2">
                <Send className="h-4 w-4" /> Send
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
