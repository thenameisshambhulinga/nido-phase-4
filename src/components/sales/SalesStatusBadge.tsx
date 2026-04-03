import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SalesStatusBadgeProps {
  status: string;
  className?: string;
}

const STATUS_STYLE: Record<string, string> = {
  ACCEPTED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  PAID: "border-emerald-200 bg-emerald-50 text-emerald-700",
  COMPLETED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  RECONCILED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  DELIVERED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  CONVERTED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  GENERATED: "border-sky-200 bg-sky-50 text-sky-700",
  SENT: "border-sky-200 bg-sky-50 text-sky-700",
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  DRAFT: "border-slate-200 bg-slate-100 text-slate-700",
  SHIPPED: "border-sky-200 bg-sky-50 text-sky-700",
  ACTIVE: "border-emerald-200 bg-emerald-50 text-emerald-700",
  PAUSED: "border-amber-200 bg-amber-50 text-amber-700",
  REJECTED: "border-rose-200 bg-rose-50 text-rose-700",
  REVERSED: "border-rose-200 bg-rose-50 text-rose-700",
  CANCELLED: "border-rose-200 bg-rose-50 text-rose-700",
  RETURNED: "border-rose-200 bg-rose-50 text-rose-700",
};

export default function SalesStatusBadge({
  status,
  className,
}: SalesStatusBadgeProps) {
  const normalized = status.toUpperCase();
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium",
        STATUS_STYLE[normalized] ||
          "border-slate-200 bg-slate-100 text-slate-700",
        className,
      )}
    >
      {status}
    </Badge>
  );
}
