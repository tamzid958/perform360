"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDebouncedSearch } from "./_components/use-debounced-search";
import { StepBasics } from "./_components/step-basics";
import { StepTeams } from "./_components/step-teams";
import { StepCustomize } from "./_components/step-customize";
import type {
  TeamOption,
  TemplateOption,
  AssignmentGroup,
  GroupAdvancedConfig,
} from "./_components/types";
import { getWeightSum } from "./_components/types";

const STEPS = [
  { label: "Basics", description: "Name & dates" },
  { label: "Teams", description: "Assign templates" },
  { label: "Customize", description: "Weights & overrides" },
] as const;

export default function NewCyclePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Step 1 state
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Step 2 state
  const [groups, setGroups] = useState<AssignmentGroup[]>([
    { teamIds: [], templateId: "" },
  ]);

  // Step 3 state
  const [configs, setConfigs] = useState<GroupAdvancedConfig[]>([
    { weights: null, teamLevelTemplates: {}, relationshipTemplates: [] },
  ]);

  // Keep configs array in sync with groups array length
  useEffect(() => {
    setConfigs((prev) => {
      if (prev.length === groups.length) return prev;
      const next = [...prev];
      while (next.length < groups.length) {
        next.push({ weights: null, teamLevelTemplates: {}, relationshipTemplates: [] });
      }
      return next.slice(0, groups.length);
    });
  }, [groups.length]);

  // Data loading
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

  // Validation per step
  const isStep1Valid = !!(name.trim() && startDate && endDate);

  const isStep2Valid = useMemo(
    () =>
      groups.length > 0 &&
      groups.every((g) => g.teamIds.length > 0 && g.templateId),
    [groups]
  );

  const isStep3Valid = useMemo(
    () =>
      configs.every((c) => {
        if (c.weights && Math.abs(getWeightSum(c.weights) - 100) >= 0.01) return false;
        return true;
      }),
    [configs]
  );

  // A group without a default template is still valid if it has relationship templates
  const isStep2OrStep3Valid = useMemo(
    () =>
      groups.every((g, gIdx) => {
        if (g.teamIds.length === 0) return false;
        if (g.templateId) return true;
        // No default template — check if step 3 has relationship templates
        return configs[gIdx]?.relationshipTemplates?.length > 0;
      }),
    [groups, configs]
  );

  const canProceed = [isStep1Valid, isStep2Valid, isStep3Valid][step];

  async function handleSubmit() {
    if (!isStep1Valid || !isStep2OrStep3Valid || !isStep3Valid) return;
    setIsLoading(true);
    try {
      // Flatten groups into per-team entries for the API
      const teamTemplates = groups.flatMap((group, gIdx) => {
        const config = configs[gIdx];
        return group.teamIds.map((teamId) => {
          const levelTemplates = config.teamLevelTemplates[teamId] ?? [];
          return {
            teamId,
            templateId: group.templateId || undefined,
            ...(config.weights ? { weights: config.weights } : {}),
            ...(levelTemplates.length > 0 ? { levelTemplates } : {}),
            ...(config.relationshipTemplates.length > 0
              ? { relationshipTemplates: config.relationshipTemplates }
              : {}),
          };
        });
      });

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
      <PageHeader
        title="Create Evaluation Cycle"
        description="Set up a new 360° evaluation cycle"
      />

      <Card className="max-w-3xl">
        {/* Stepper */}
        <nav className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => {
            const isCompleted = i < step;
            const isActive = i === step;
            return (
              <div key={s.label} className="flex items-center gap-2 flex-1">
                <button
                  type="button"
                  onClick={() => {
                    if (i < step) setStep(i);
                  }}
                  disabled={i > step}
                  className="flex items-center gap-2.5 group"
                >
                  <span
                    className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-full text-[13px] font-semibold transition-all shrink-0",
                      isCompleted &&
                        "bg-brand-500 text-white",
                      isActive &&
                        "bg-brand-500 text-white ring-4 ring-brand-100",
                      !isCompleted &&
                        !isActive &&
                        "bg-gray-100 text-gray-400"
                    )}
                  >
                    {isCompleted ? (
                      <Check size={14} strokeWidth={3} />
                    ) : (
                      i + 1
                    )}
                  </span>
                  <div className="hidden sm:block text-left">
                    <p
                      className={cn(
                        "text-[13px] font-medium leading-tight",
                        isActive || isCompleted
                          ? "text-gray-900"
                          : "text-gray-400"
                      )}
                    >
                      {s.label}
                    </p>
                    <p className="text-[11px] text-gray-400 leading-tight">
                      {s.description}
                    </p>
                  </div>
                </button>
                {i < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "flex-1 h-px mx-2",
                      i < step ? "bg-brand-500" : "bg-gray-200"
                    )}
                  />
                )}
              </div>
            );
          })}
        </nav>

        {/* Step content */}
        <div className="min-h-[280px]">
          {step === 0 && (
            <StepBasics
              name={name}
              onNameChange={setName}
              startDate={startDate}
              onStartDateChange={setStartDate}
              endDate={endDate}
              onEndDateChange={setEndDate}
            />
          )}

          {step === 1 && (
            <StepTeams
              groups={groups}
              onGroupsChange={setGroups}
              teams={teams}
              templates={templates}
              isSearchingTeams={isSearchingTeams}
              isSearchingTemplates={isSearchingTemplates}
              onTeamSearch={handleTeamSearch}
              onTemplateSearch={handleTemplateSearch}
              fetchError={fetchError}
            />
          )}

          {step === 2 && (
            <StepCustomize
              groups={groups}
              configs={configs}
              onConfigsChange={setConfigs}
              teams={teams}
              templates={templates}
              isSearchingTemplates={isSearchingTemplates}
              onTemplateSearch={handleTemplateSearch}
            />
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-100">
          <div>
            {step > 0 && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep(step - 1)}
              >
                Back
              </Button>
            )}
            {step === 0 && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {step < STEPS.length - 1 && (
              <Button
                type="button"
                disabled={!canProceed}
                onClick={() => setStep(step + 1)}
              >
                Continue
              </Button>
            )}
            {step === STEPS.length - 1 && (
              <Button
                type="button"
                disabled={isLoading || !canProceed}
                onClick={handleSubmit}
              >
                {isLoading ? "Creating..." : "Create Cycle"}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
