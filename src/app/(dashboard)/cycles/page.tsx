"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { Plus, Calendar, ChevronRight, AlertCircle, Inbox } from "lucide-react";
import Link from "next/link";

interface Cycle {
  id: string;
  name: string;
  status: string;
  templateId: string;
  startDate: string;
  endDate: string;
  _count: { assignments: number };
}

const statusBadge: Record<string, { variant: "success" | "warning" | "default" | "info"; label: string }> = {
  DRAFT: { variant: "default", label: "Draft" },
  ACTIVE: { variant: "success", label: "Active" },
  CLOSED: { variant: "warning", label: "Closed" },
  ARCHIVED: { variant: "info", label: "Archived" },
};

function CycleCard({ cycle }: { cycle: Cycle }) {
  const badge = statusBadge[cycle.status] ?? { variant: "default" as const, label: cycle.status };
  return (
    <Link href={`/cycles/${cycle.id}`}>
      <Card className="hover:shadow-md transition-all duration-200 cursor-pointer group">
        <div className="flex items-start justify-between mb-3">
          <Badge variant={badge.variant}>{badge.label}</Badge>
          <ChevronRight size={16} strokeWidth={1.5} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
        </div>
        <CardTitle>{cycle.name}</CardTitle>
        <CardDescription>{cycle._count.assignments} assignments</CardDescription>
        <div className="flex items-center gap-2 text-[12px] text-gray-400 mt-2">
          <Calendar size={12} strokeWidth={1.5} />
          <span>
            {new Date(cycle.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} –{" "}
            {new Date(cycle.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
        </div>
      </Card>
    </Link>
  );
}

function CycleCardSkeleton() {
  return (
    <Card>
      <div className="flex items-start justify-between mb-3">
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-5 w-48 mb-2" />
      <Skeleton className="h-4 w-32 mb-3" />
      <Skeleton className="h-3 w-40" />
    </Card>
  );
}

function EmptyState({ status }: { status: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <Inbox size={32} strokeWidth={1.5} className="text-gray-300" />
      <p className="text-[14px] text-gray-500">
        No {status === "all" ? "" : status.toLowerCase() + " "}cycles found
      </p>
      <Link href="/cycles/new">
        <Button variant="secondary" size="sm">Create Cycle</Button>
      </Link>
    </div>
  );
}

export default function CyclesPage() {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  const fetchCycles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/cycles");
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to load cycles");
      setCycles(json.data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load cycles";
      setError(msg);
      addToast(msg, "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchCycles();
  }, [fetchCycles]);

  if (error && cycles.length === 0) {
    return (
      <div>
        <PageHeader title="Evaluation Cycles" description="Create and manage 360° evaluation cycles">
          <Link href="/cycles/new">
            <Button><Plus size={16} strokeWidth={2} className="mr-1.5" />New Cycle</Button>
          </Link>
        </PageHeader>
        <Card className="max-w-lg mx-auto mt-12 text-center">
          <div className="flex flex-col items-center gap-3 py-4">
            <AlertCircle size={32} strokeWidth={1.5} className="text-red-400" />
            <p className="text-[14px] text-gray-600">{error}</p>
            <Button variant="secondary" size="sm" onClick={fetchCycles}>Retry</Button>
          </div>
        </Card>
      </div>
    );
  }

  const filterCycles = (status: string) => {
    if (status === "all") return cycles;
    if (status === "closed") return cycles.filter((c) => c.status === "CLOSED" || c.status === "ARCHIVED");
    return cycles.filter((c) => c.status === status.toUpperCase());
  };

  const renderGrid = (filtered: Cycle[]) => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <CycleCardSkeleton key={i} />)}
        </div>
      );
    }
    if (filtered.length === 0) return <EmptyState status="all" />;
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((cycle) => <CycleCard key={cycle.id} cycle={cycle} />)}
      </div>
    );
  };

  return (
    <div>
      <PageHeader title="Evaluation Cycles" description="Create and manage 360° evaluation cycles">
        <Link href="/cycles/new">
          <Button><Plus size={16} strokeWidth={2} className="mr-1.5" />New Cycle</Button>
        </Link>
      </PageHeader>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
          <TabsTrigger value="closed">Closed</TabsTrigger>
        </TabsList>

        {["all", "active", "draft", "closed"].map((tab) => (
          <TabsContent key={tab} value={tab}>
            {renderGrid(filterCycles(tab))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
