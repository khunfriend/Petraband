import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="w-full max-w-[1200px] mx-auto px-6 md:px-8 py-8 md:py-10 flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Skeleton className="h-24 w-full rounded-[var(--radius-lg)]" />
        <Skeleton className="h-24 w-full rounded-[var(--radius-lg)]" />
        <Skeleton className="h-24 w-full rounded-[var(--radius-lg)]" />
      </div>

      <Skeleton className="h-64 w-full rounded-[var(--radius-lg)]" />
    </div>
  );
}
