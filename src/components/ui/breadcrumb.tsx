import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn("mb-2", className)}>
      <ol className="flex items-center gap-1 text-[13px]">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight size={12} strokeWidth={1.5} className="text-gray-300 dark:text-gray-600" />}
              {item.href && !isLast ? (
                <Link href={item.href} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                  {item.label}
                </Link>
              ) : (
                <span className="text-gray-400 dark:text-gray-500 truncate max-w-[200px]">{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
