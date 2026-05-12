import { Skeleton } from "@/components/ui/skeleton";

interface SalesTableSkeletonProps {
  rows?: number;
  showToolbar?: boolean;
}

export default function SalesTableSkeleton({
  rows = 6,
  showToolbar = true,
}: SalesTableSkeletonProps) {
  return (
    <div className="space-y-4">
      {showToolbar && (
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-7 w-24" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-28" />
              <Skeleton className="h-9 w-28" />
            </div>
          </div>
        </div>
      )}
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <div className="mb-3 grid grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-4 w-full" />
          ))}
        </div>
        <div className="space-y-2">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div
              key={rowIndex}
              className="grid grid-cols-5 gap-3 rounded-md border border-border/60 p-3"
            >
              {Array.from({ length: 5 }).map((_, colIndex) => (
                <Skeleton
                  key={`${rowIndex}-${colIndex}`}
                  className="h-4 w-full"
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
