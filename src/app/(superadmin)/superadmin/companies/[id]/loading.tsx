import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function CompanyAnalyticsLoading() {
  return (
    <div>
      {/* Back link */}
      <Skeleton className="h-5 w-36 mb-6" />

      {/* Company Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <Skeleton className="w-14 h-14 rounded-2xl" />
          <div>
            <Skeleton className="h-7 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Skeleton className="h-6 w-40 rounded-full" />
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
        <div className="lg:col-span-2 space-y-6">
          {/* Roles */}
          <Card>
            <Skeleton className="h-5 w-24 mb-2" />
            <Skeleton className="h-3 w-40 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-2 flex-1 rounded-full" />
                  <Skeleton className="h-4 w-8" />
                </div>
              ))}
            </div>
          </Card>

          {/* Cycles table */}
          <Card padding="sm">
            <div className="px-4 pt-4 pb-2">
              <Skeleton className="h-5 w-36 mb-2" />
              <Skeleton className="h-3 w-24" />
            </div>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3 border-t border-gray-50">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-2 w-20 rounded-full" />
              </div>
            ))}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <Skeleton className="h-5 w-24 mb-4" />
            <div className="text-center py-2">
              <Skeleton className="h-10 w-16 mx-auto mb-3" />
              <Skeleton className="h-2 w-full rounded-full mb-2" />
              <Skeleton className="h-3 w-32 mx-auto" />
            </div>
          </Card>

          <Card>
            <Skeleton className="h-5 w-16 mb-2" />
            <Skeleton className="h-3 w-20 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between py-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-8" />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
