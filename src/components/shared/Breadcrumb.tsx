import React from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { PAGE_PILL_BUTTON_CLASS } from "@/lib/navigationStyles";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
  isActive?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  showSeparators?: boolean;
}

export function Breadcrumb({
  items,
  className,
  showSeparators = true,
}: BreadcrumbProps) {
  if (!items.length) return null;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 text-sm text-slate-600",
        className,
      )}
      role="navigation"
      aria-label="Breadcrumb"
    >
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {item.onClick || item.href ? (
            <button
              onClick={item.onClick}
              className={cn(
                PAGE_PILL_BUTTON_CLASS,
                "transition-colors hover:text-slate-900",
              )}
              aria-current={item.isActive ? "page" : undefined}
            >
              {item.label}
            </button>
          ) : (
            <span
              className={cn(
                "line-clamp-1 font-medium text-slate-900",
                item.isActive && "font-semibold",
              )}
              aria-current={item.isActive ? "page" : undefined}
            >
              {item.label}
            </span>
          )}

          {showSeparators && index < items.length - 1 && (
            <ChevronRight className="h-4 w-4 flex-shrink-0 text-slate-400" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
