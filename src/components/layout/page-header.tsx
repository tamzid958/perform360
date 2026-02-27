import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, children, className }: PageHeaderProps) {
  return (
    <div className={cn("mb-6 sm:mb-8", className)}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-title text-gray-900 truncate">{title}</h1>
          {description && (
            <p className="text-callout text-gray-500 mt-1">{description}</p>
          )}
        </div>
        {children && <div className="flex items-center gap-2 sm:gap-3 shrink-0 flex-wrap">{children}</div>}
      </div>
      <div className="rule-accent mt-4" />
    </div>
  );
}
