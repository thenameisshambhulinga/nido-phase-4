import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import AMCForm from "@/components/forms/AMCForm";
import { safeReadJson } from "@/lib/storage";
import { toast } from "sonner";

const STORAGE_KEY = "nido_services_tickets_v2";

const buildNewTicketId = (tickets: any[]) => {
  const numbers = tickets.map((ticket) =>
    Number(
      String(ticket.id || "")
        .split("-")
        .pop() || 0,
    ),
  );
  const next = Math.max(...numbers, 132) + 1;
  return `TKT-2025-${String(next).padStart(6, "0")}`;
};

export default function NewAMCRequestPage() {
  const navigate = useNavigate();

  const handleSubmit = (payload: any) => {
    const tickets = safeReadJson<any[]>(STORAGE_KEY, []);
    const org = payload.companyId || "Client";
    const id = buildNewTicketId(tickets);
    const created = {
      id,
      subject: `AMC Request - ${org}`,
      requestType: "Services",
      category: "AMC Request",
      subCategory: payload.amcType || "new",
      organization: org,
      status: "Open",
      priority: "Medium",
      impact: "Medium",
      urgency: "Medium",
      assignedTeam: "Service Desk",
      assignee: "Service Desk",
      ticketType: "Issue",
      source: "Portal",
      description: `AMC created for ${payload.contactPerson || "client"}`,
      createdAt: new Date().toISOString(),
      createdBy: payload.contactPerson || "Client",
      dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      slaHours: 48,
      typicalSla: "8 - 48 hrs",
      tags: ["AMC"],
      childIds: [],
      attachments: [],
      comments: [],
      timeline: [],
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify([created, ...tickets]));
    toast.success("AMC request submitted successfully");
    navigate("/services");
  };

  return (
    <div className="space-y-6 p-6">
      <Header title="New AMC Request" />
      <div className="mx-auto max-w-6xl rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <AMCForm onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
