import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function TemplateAnalyticsLoading() {
  return (
    <div>
      {/* Back link */}
      <Skeleton className="h-5 w-44 mb-6" />

      {/* Template Header */}
      <div className="flex items-start gap-4 mb-8">
        <Skeleton className="w-14 h-14 rounded-2xl" />
        <div>
          <Skeleton className="h-7 w-56 mb-2" />
          <Skeleton className="h-4 w-80 mb-1" />
          <Skeleton className="h-3 w-36" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} padding="md">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-8 w-16" />
              </div>
              <Skeleton className="w-10 h-10 rounded-xl" />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Template Structure */}
        <div className="lg:col-span-2">
          <Card>
            <Skeleton className="h-5 w-36 mb-2" />
            <Skeleton className="h-3 w-44 mb-6" />
            <div className="space-y-6">
              {Array.from({ length: 2 }).map((_, sIdx) => (
                <div key={sIdx}>
                  <div className="flex items-center gap-2 mb-3">
                    <Skeleton className="w-6 h-6 rounded-lg" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <div className="ml-8 space-y-2">
                    {Array.from({ length: 3 }).map((_, qIdx) => (
                      <div
                        key={qIdx}
                        className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-gray-50/60"
                      >
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-3 w-6" />
                          <Skeleton className="h-3 w-48" />
                        </div>
                        <Skeleton className="h-5 w-20 rounded-full" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Adoption */}
        <div>
          <Card>
            <Skeleton className="h-5 w-20 mb-2" />
            <Skeleton className="h-3 w-40 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="py-2">
                  <div className="flex items-center justify-between mb-1">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-5 w-14 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-48" />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
