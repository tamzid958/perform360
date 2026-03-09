"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Pagination } from "@/components/ui/pagination";
import { Users } from "lucide-react";
import { formatDate } from "@/lib/utils";

/* ── Teams Card (scrollable + paginated) ── */

const TEAMS_PER_PAGE = 8;

interface Team {
  id: string;
  name: string;
  memberCount: number;
}

export function PaginatedTeams({ teams }: { teams: Team[] }) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(teams.length / TEAMS_PER_PAGE);
  const start = (page - 1) * TEAMS_PER_PAGE;
  const visible = teams.slice(start, start + TEAMS_PER_PAGE);

  if (teams.length === 0) {
    return <p className="text-[14px] text-gray-400 text-center py-4">No teams yet</p>;
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
        {visible.map((team) => (
          <div key={team.id} className="flex items-center justify-between py-2.5">
            <p className="text-[14px] font-medium text-gray-900">{team.name}</p>
            <div className="flex items-center gap-1.5 text-[13px] text-gray-400">
              <Users size={14} strokeWidth={1.5} />
              {team.memberCount}
            </div>
          </div>
        ))}
      </div>
      <Pagination
        page={page}
        totalPages={totalPages}
        total={teams.length}
        showing={visible.length}
        noun="teams"
        onPageChange={setPage}
        className="pt-3 mt-auto border-t border-gray-100"
      />
    </div>
  );
}

/* ── Evaluation Cycles (paginated table) ── */

const CYCLES_PER_PAGE = 5;

const CYCLE_STATUS_VARIANT: Record<string, "default" | "success" | "info" | "outline"> = {
  DRAFT: "default",
  ACTIVE: "success",
  CLOSED: "info",
  ARCHIVED: "outline",
};

interface Cycle {
  id: string;
  name: string;
  status: string;
  startDate: Date;
  endDate: Date;
  assignmentCount: number;
  submittedCount: number;
}

export function PaginatedCycles({ cycles }: { cycles: Cycle[] }) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(cycles.length / CYCLES_PER_PAGE);
  const start = (page - 1) * CYCLES_PER_PAGE;
  const visible = cycles.slice(start, start + CYCLES_PER_PAGE);

  if (cycles.length === 0) {
    return <p className="text-[14px] text-gray-400 text-center py-6 px-4">No cycles created yet</p>;
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="overflow-x-auto flex-1">
        <table className="w-full">
          {/* Desktop table header */}
          <thead className="hidden sm:table-header-group">
            <tr className="border-b border-gray-100">
              <th className="text-left text-[12px] font-medium text-gray-400 uppercase tracking-wider px-4 py-3">
                Cycle
              </th>
              <th className="text-left text-[12px] font-medium text-gray-400 uppercase tracking-wider px-4 py-3">
                Status
              </th>
              <th className="text-left text-[12px] font-medium text-gray-400 uppercase tracking-wider px-4 py-3">
                Date Range
              </th>
              <th className="text-left text-[12px] font-medium text-gray-400 uppercase tracking-wider px-4 py-3">
                Progress
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {visible.map((cycle) => {
              const pct = cycle.assignmentCount > 0
                ? Math.round((cycle.submittedCount / cycle.assignmentCount) * 100)
                : 0;
              return (
                <tr key={cycle.id} className="hover:bg-gray-50/50 transition-colors flex flex-col sm:table-row px-4 py-3 sm:p-0">
                  <td className="sm:px-4 sm:py-3 flex items-center justify-between sm:table-cell">
                    <p className="text-[14px] font-medium text-gray-900">{cycle.name}</p>
                    <span className="sm:hidden">
                      <Badge variant={CYCLE_STATUS_VARIANT[cycle.status] ?? "default"}>
                        {cycle.status}
                      </Badge>
                    </span>
                  </td>
                  <td className="sm:px-4 sm:py-3 hidden sm:table-cell">
                    <Badge variant={CYCLE_STATUS_VARIANT[cycle.status] ?? "default"}>
                      {cycle.status}
                    </Badge>
                  </td>
                  <td className="sm:px-4 sm:py-3 text-[13px] text-gray-500">
                    {formatDate(cycle.startDate)} &mdash; {formatDate(cycle.endDate)}
                  </td>
                  <td className="sm:px-4 sm:py-3">
                    <div className="flex items-center gap-2">
                      <Progress value={pct} className="w-16 sm:w-20" />
                      <span className="text-[12px] text-gray-500">
                        {cycle.submittedCount}/{cycle.assignmentCount}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="px-4">
        <Pagination
          page={page}
          totalPages={totalPages}
          total={cycles.length}
          showing={visible.length}
          noun="cycles"
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
