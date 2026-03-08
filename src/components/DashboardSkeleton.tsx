import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header skeleton */}
      <header className="relative overflow-hidden border-b">
        <div className="max-w-2xl mx-auto px-4 py-5 sm:py-7">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <Skeleton className="h-9 w-9 rounded-xl" />
              <Skeleton className="h-5 w-24 hidden sm:block" />
            </div>
            <div className="flex items-center gap-1">
              <Skeleton className="h-8 w-8 rounded-xl" />
              <Skeleton className="h-8 w-8 rounded-xl" />
              <Skeleton className="h-8 w-8 rounded-xl" />
            </div>
          </div>

          {/* Greeting */}
          <Skeleton className="h-7 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />

          {/* Stats grid */}
          <div className="grid grid-cols-4 gap-2 mt-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-xl glass p-3 flex flex-col items-center gap-1.5">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-6 w-8" />
                <Skeleton className="h-2.5 w-12" />
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 mt-4">
            <Skeleton className="h-10 w-36 rounded-xl" />
            <Skeleton className="h-10 w-32 rounded-xl" />
          </div>
        </div>
      </header>

      {/* Content skeleton */}
      <main className="max-w-2xl mx-auto px-4 py-5 space-y-5">
        {/* Filter bar */}
        <div className="flex items-center gap-1.5">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-xl flex-shrink-0" />
          ))}
        </div>

        {/* Schedule cards */}
        <div className="space-y-3">
          <Skeleton className="h-4 w-16" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-2xl border bg-card p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <Skeleton className="h-10 w-10 rounded-xl flex-shrink-0" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}