import React from "react";
import EnterpriseBackButton from "@/components/shared/EnterpriseBackButton";
import {
  Breadcrumb,
  type BreadcrumbItem,
} from "@/components/shared/Breadcrumb";
import { cn } from "@/lib/utils";
import { PAGE_PILL_BUTTON_CLASS } from "@/lib/navigationStyles";

interface PageHeaderProps {
  breadcrumbs?: BreadcrumbItem[];
  backLabel?: string;
  onBack?: () => void;
  title?: string;
  rightActions?: React.ReactNode;
  className?: string;
  variant?: "detail" | "modal" | "nested";
}

/**
 * Unified page header component for consistent navigation across all nested pages.
 * Provides breadcrumb navigation, back button, title, and action slots.
 */
export function PageHeader({
  breadcrumbs,
  backLabel,
  onBack,
  title,
  rightActions,
  className,
  variant = "detail",
}: PageHeaderProps) {
  const showBackButton = backLabel && onBack;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Breadcrumb Navigation */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumb items={breadcrumbs} />
      )}

      {/* Main Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Back Button */}
        {showBackButton && (
          <EnterpriseBackButton
            onClick={onBack}
            label={backLabel}
            className={cn(PAGE_PILL_BUTTON_CLASS, "flex-shrink-0")}
          />
        )}

        {/* Title (if no back button, show title in main area) */}
        {title && !showBackButton && (
          <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
        )}

        {/* Right Actions */}
        {rightActions && (
          <div
            className={cn(
              "flex items-center gap-2",
              showBackButton && "ml-auto",
            )}
          >
            {rightActions}
          </div>
        )}
      </div>

      {/* Title Row (if back button exists) */}
      {showBackButton && title && (
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
          {rightActions && (
            <div className="flex items-center gap-2">{rightActions}</div>
          )}
        </div>
      )}
    </div>
  );
}
