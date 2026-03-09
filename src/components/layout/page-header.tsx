import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, children, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-6 sm:mb-8", className)}>
      <div className="min-w-0">
        <h1 className="text-title-small sm:text-title text-gray-900 truncate">{title}</h1>
        {description && (
          <p className="text-callout sm:text-body text-gray-500 mt-1">{description}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-2 sm:gap-3 shrink-0 flex-wrap">{children}</div>}
    </div>
  );
}
