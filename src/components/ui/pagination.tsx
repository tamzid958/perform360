"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  showing: number;
  noun?: string;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  page,
  totalPages,
  total,
  showing,
  noun = "items",
  onPageChange,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-center sm:justify-between gap-2 pt-4 border-t border-gray-100",
        className
      )}
    >
      <span className="text-[12px] uppercase tracking-caps text-gray-400">
        Showing {showing} of {total} {noun}
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft size={14} strokeWidth={1.5} className="mr-1" />
          <span className="hidden sm:inline">Previous</span>
          <span className="sm:hidden">Prev</span>
        </Button>
        <span className="text-[13px] text-gray-500 px-2 tabular-nums">
          {page}/{totalPages}
        </span>
        <Button
          variant="ghost"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
          <ChevronRight size={14} strokeWidth={1.5} className="ml-1" />
        </Button>
      </div>
    </div>
  );
}
