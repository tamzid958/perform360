"use client";

import { cn } from "@/lib/utils";

interface InlineDistributionProps {
  distribution: Record<string, number>;
  className?: string;
}

const MIN_HEIGHT = 2;
const MAX_HEIGHT = 16;

export function InlineDistribution({
  distribution,
  className,
}: InlineDistributionProps) {
  const entries = Object.entries(distribution)
    .map(([key, count]) => ({ label: key, count }))
    .sort((a, b) => Number(a.label) - Number(b.label));

  if (entries.length === 0) return null;

  const maxCount = Math.max(...entries.map((e) => e.count));

  return (
    <div
      className={cn("flex items-end gap-0.5", className)}
      title="Response distribution"
    >
      {entries.map((entry) => {
        const height =
          maxCount > 0
            ? MIN_HEIGHT + (entry.count / maxCount) * (MAX_HEIGHT - MIN_HEIGHT)
            : MIN_HEIGHT;
        const isMode = entry.count === maxCount && entry.count > 0;

        return (
          <div
            key={entry.label}
            className={cn(
              "w-1.5",
              isMode ? "bg-gray-900" : "bg-gray-300"
            )}
            style={{ height: `${Math.round(height)}px` }}
            title={`Rating ${entry.label}: ${entry.count}`}
          />
        );
      })}
    </div>
  );
}
