import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  compact?: boolean;
}

export default function PageContainer({
  children,
  className,
  compact = false,
}: PageContainerProps) {
  return (
    <div
      className={cn(
        "w-full",
        compact ? "max-w-6xl" : "max-w-[1400px]",
        "mx-auto",
        className,
      )}
    >
      {children}
    </div>
  );
}
