import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionCardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  description?: string;
}

export default function SectionCard({
  children,
  className,
  title,
  description,
}: SectionCardProps) {
  return (
    <section
      className={cn(
        "rounded-3xl border border-border/60 bg-card/80 shadow-sm backdrop-blur-xl",
        className,
      )}
    >
      {(title || description) && (
        <div className="border-b border-border/50 px-6 py-5">
          {title && (
            <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          )}

          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}

      <div className="p-6">{children}</div>
    </section>
  );
}
