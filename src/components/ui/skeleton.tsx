import { cn } from "@/lib/utils";

type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("rounded-xl bg-gray-200/60 dark:bg-gray-800 skeleton-shimmer", className)}
      {...props}
    />
  );
}
