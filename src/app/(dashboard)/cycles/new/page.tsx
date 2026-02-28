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
import { Plus, X } from "lucide-react";

interface TeamOption {
  id: string;
  name: string;
}

interface TemplateOption {
  id: string;
  name: string;
  isGlobal: boolean;
}

interface TeamTemplatePair {
  teamId: string;
  templateId: string;
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
    { teamId: "", templateId: "" },
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

  function addRow() {
    setTeamTemplates((prev) => [...prev, { teamId: "", templateId: "" }]);
  }

  function removeRow(index: number) {
    setTeamTemplates((prev) => prev.filter((_, i) => i !== index));
  }

  function updateRow(index: number, field: "teamId" | "templateId", value: string | null) {
    setTeamTemplates((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value ?? "" } : row))
    );
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
    teamTemplates.every((tt) => tt.teamId && tt.templateId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/cycles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, startDate, endDate, teamTemplates }),
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

          <div className="grid grid-cols-2 gap-4">
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
                <div key={index} className="flex items-center gap-3 rounded-xl bg-gray-50/60 p-2">
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
