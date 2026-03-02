"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { DatePicker } from "@/components/ui/date-picker";
import { Combobox } from "@/components/ui/combobox";
import type { ComboboxOption } from "@/components/ui/combobox";
import { Plus, X, ChevronDown, ChevronUp } from "lucide-react";

interface TeamOption {
  id: string;
  name: string;
}

interface TemplateOption {
  id: string;
  name: string;
  isGlobal: boolean;
}

interface RelationshipWeightsInput {
  manager: number;
  peer: number;
  directReport: number;
  self: number;
  external: number;
}

interface TeamTemplatePair {
  teamId: string;
  templateId: string;
  weights: RelationshipWeightsInput | null;
}

function useDebouncedSearch<T extends { id: string }>(
  endpoint: string,
  initialData: T[],
  delay = 300
) {
  const [searchResults, setSearchResults] = useState<T[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [query, setQuery] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const merged = useMemo(() => {
    if (!query.trim()) return initialData;
    const initialIds = new Set(initialData.map((d) => d.id));
    const extras = searchResults.filter((r) => !initialIds.has(r.id));
    return [...initialData, ...extras];
  }, [initialData, searchResults, query]);

  const handleSearch = useCallback(
    (q: string) => {
      setQuery(q);
      if (timerRef.current) clearTimeout(timerRef.current);

      if (!q.trim()) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      timerRef.current = setTimeout(async () => {
        try {
          const res = await fetch(
            `${endpoint}?search=${encodeURIComponent(q)}&limit=20`
          );
          const data = await res.json();
          if (data.success) setSearchResults(data.data);
        } catch {
          /* keep existing results */
        } finally {
          setIsSearching(false);
        }
      }, delay);
    },
    [endpoint, delay]
  );

  return { data: merged, isSearching, handleSearch };
}

export default function NewCyclePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [teamTemplates, setTeamTemplates] = useState<TeamTemplatePair[]>([
    { teamId: "", templateId: "", weights: null },
  ]);

  const [initialTeams, setInitialTeams] = useState<TeamOption[]>([]);
  const [initialTemplates, setInitialTemplates] = useState<TemplateOption[]>([]);
  const [fetchError, setFetchError] = useState("");

  useEffect(() => {
    async function loadOptions() {
      try {
        const [teamsRes, templatesRes] = await Promise.all([
          fetch("/api/teams"),
          fetch("/api/templates"),
        ]);
        const teamsData = await teamsRes.json();
        const templatesData = await templatesRes.json();

        if (teamsData.success) setInitialTeams(teamsData.data);
        if (templatesData.success) setInitialTemplates(templatesData.data);
      } catch {
        setFetchError("Failed to load teams or templates");
      }
    }
    loadOptions();
  }, []);

  const {
    data: teams,
    isSearching: isSearchingTeams,
    handleSearch: handleTeamSearch,
  } = useDebouncedSearch<TeamOption>("/api/teams", initialTeams);

  const {
    data: templates,
    isSearching: isSearchingTemplates,
    handleSearch: handleTemplateSearch,
  } = useDebouncedSearch<TemplateOption>("/api/templates", initialTemplates);

  const DEFAULT_WEIGHTS: RelationshipWeightsInput = {
    manager: 30, peer: 30, directReport: 20, self: 10, external: 10,
  };

  function addRow() {
    setTeamTemplates((prev) => [...prev, { teamId: "", templateId: "", weights: null }]);
  }

  function removeRow(index: number) {
    setTeamTemplates((prev) => prev.filter((_, i) => i !== index));
  }

  function updateRow(index: number, field: "teamId" | "templateId", value: string | null) {
    setTeamTemplates((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value ?? "" } : row))
    );
  }

  function toggleWeights(index: number) {
    setTeamTemplates((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        return { ...row, weights: row.weights ? null : { ...DEFAULT_WEIGHTS } };
      })
    );
  }

  function updateWeight(index: number, field: keyof RelationshipWeightsInput, value: number) {
    setTeamTemplates((prev) =>
      prev.map((row, i) => {
        if (i !== index || !row.weights) return row;
        return { ...row, weights: { ...row.weights, [field]: value } };
      })
    );
  }

  function getWeightSum(weights: RelationshipWeightsInput): number {
    return weights.manager + weights.peer + weights.directReport + weights.self + weights.external;
  }

  const selectedTeamIds = new Set(teamTemplates.map((tt) => tt.teamId).filter(Boolean));

  const teamOptions: ComboboxOption[] = useMemo(
    () =>
      teams.map((t) => ({
        value: t.id,
        label: t.name,
        disabled: selectedTeamIds.has(t.id),
        disabledReason: "Already assigned",
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [teams, selectedTeamIds.size]
  );

  const templateOptions: ComboboxOption[] = useMemo(
    () =>
      templates.map((t) => ({
        value: t.id,
        label: t.name,
        sublabel: t.isGlobal ? "Global template" : undefined,
      })),
    [templates]
  );

  const isValid =
    name.trim() &&
    startDate &&
    endDate &&
    teamTemplates.length > 0 &&
    teamTemplates.every(
      (tt) =>
        tt.teamId &&
        tt.templateId &&
        (!tt.weights || Math.abs(getWeightSum(tt.weights) - 100) < 0.01)
    );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/cycles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          startDate,
          endDate,
          teamTemplates: teamTemplates.map((tt) => ({
            teamId: tt.teamId,
            templateId: tt.templateId,
            ...(tt.weights ? { weights: tt.weights } : {}),
          })),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/cycles/${data.data.id}`);
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <PageHeader title="Create Evaluation Cycle" description="Set up a new 360° evaluation cycle" />

      <Card className="max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            id="name"
            label="Cycle Name"
            placeholder="e.g. Q1 2026 Performance Review"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DatePicker
              id="startDate"
              label="Start Date"
              value={startDate}
              onChange={setStartDate}
              placeholder="Pick start date"
              required
            />
            <DatePicker
              id="endDate"
              label="End Date"
              value={endDate}
              onChange={setEndDate}
              placeholder="Pick end date"
              minDate={startDate ? new Date(startDate) : undefined}
              required
            />
          </div>

          {/* Team-Template Pairs */}
          <div className="space-y-3">
            <label className="block text-[13px] font-medium text-gray-700">
              Team &amp; Template Assignments
            </label>
            <p className="text-[12px] text-gray-500">
              Assign a template to each team participating in this cycle.
            </p>

            {fetchError && (
              <p className="text-[13px] text-red-500">{fetchError}</p>
            )}

            {/* Column headers */}
            <div className="flex items-center gap-3">
              <span className="flex-1 text-[12px] font-medium text-gray-500 uppercase tracking-wide">Team</span>
              <span className="flex-1 text-[12px] font-medium text-gray-500 uppercase tracking-wide">Template</span>
              <span className="shrink-0 w-8" />
            </div>

            <div className="space-y-2">
              {teamTemplates.map((row, index) => (
                <div key={index} className="rounded-xl bg-gray-50/60 p-2">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <Combobox
                        placeholder="Select team"
                        emptyMessage="No teams found"
                        value={row.teamId || null}
                        onChange={(v) => updateRow(index, "teamId", v)}
                        onSearchChange={handleTeamSearch}
                        loading={isSearchingTeams}
                        options={teamOptions.map((o) => ({
                          ...o,
                          disabled: o.disabled && o.value !== row.teamId,
                        }))}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <Combobox
                        placeholder="Select template"
                        emptyMessage="No templates found"
                        value={row.templateId || null}
                        onChange={(v) => updateRow(index, "templateId", v)}
                        onSearchChange={handleTemplateSearch}
                        loading={isSearchingTemplates}
                        options={templateOptions}
                      />
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRow(index)}
                      disabled={teamTemplates.length === 1}
                      className="shrink-0 w-8 px-0"
                    >
                      <X size={16} strokeWidth={1.5} />
                    </Button>
                  </div>

                  {/* Weight configuration toggle */}
                  <div className="mt-2 ml-1">
                    <button
                      type="button"
                      onClick={() => toggleWeights(index)}
                      className="flex items-center gap-1 text-[12px] text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      {row.weights ? (
                        <ChevronUp size={14} strokeWidth={1.5} />
                      ) : (
                        <ChevronDown size={14} strokeWidth={1.5} />
                      )}
                      {row.weights ? "Remove custom weights" : "Set custom weights"}
                    </button>

                    {row.weights && (
                      <div className="mt-2 space-y-2">
                        <div className="grid grid-cols-5 gap-2">
                          {(
                            [
                              ["manager", "Manager"],
                              ["peer", "Peer"],
                              ["directReport", "Direct Report"],
                              ["self", "Self"],
                              ["external", "External"],
                            ] as [keyof RelationshipWeightsInput, string][]
                          ).map(([field, label]) => (
                            <div key={field}>
                              <label className="block text-[11px] font-medium text-gray-500 mb-1">
                                {label}
                              </label>
                              <div className="relative">
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  step={1}
                                  value={row.weights![field]}
                                  onChange={(e) =>
                                    updateWeight(index, field, Math.max(0, Math.min(100, Number(e.target.value) || 0)))
                                  }
                                  className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-[13px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 pr-6"
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[12px] font-medium ${
                              Math.abs(getWeightSum(row.weights) - 100) < 0.01
                                ? "text-green-600"
                                : "text-red-500"
                            }`}
                          >
                            Total: {getWeightSum(row.weights)}%
                          </span>
                          {Math.abs(getWeightSum(row.weights) - 100) >= 0.01 && (
                            <span className="text-[11px] text-red-400">Must equal 100%</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={addRow}
            >
              <Plus size={14} strokeWidth={1.5} className="mr-1.5" />
              Add Team
            </Button>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" disabled={isLoading || !isValid}>
              {isLoading ? "Creating..." : "Create Cycle"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
