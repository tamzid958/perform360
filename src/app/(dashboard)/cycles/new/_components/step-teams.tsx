"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { MultiCombobox } from "@/components/ui/multi-combobox";
import type { ComboboxOption } from "@/components/ui/combobox";
import type { MultiComboboxOption } from "@/components/ui/multi-combobox";
import { Plus, X } from "lucide-react";
import type { AssignmentGroup, TeamOption, TemplateOption } from "./types";

interface StepTeamsProps {
  groups: AssignmentGroup[];
  onGroupsChange: (groups: AssignmentGroup[]) => void;
  teams: TeamOption[];
  templates: TemplateOption[];
  isSearchingTeams: boolean;
  isSearchingTemplates: boolean;
  onTeamSearch: (q: string) => void;
  onTemplateSearch: (q: string) => void;
  fetchError: string;
}

export function StepTeams({
  groups,
  onGroupsChange,
  teams,
  templates,
  isSearchingTeams,
  isSearchingTemplates,
  onTeamSearch,
  onTemplateSearch,
  fetchError,
}: StepTeamsProps) {
  // All team IDs already used across all groups
  const usedTeamIds = useMemo(() => {
    const ids = new Set<string>();
    for (const g of groups) {
      for (const id of g.teamIds) ids.add(id);
    }
    return ids;
  }, [groups]);

  const templateOptions: ComboboxOption[] = useMemo(
    () =>
      templates.map((t) => ({
        value: t.id,
        label: t.name,
        sublabel: t.isGlobal ? "Global template" : undefined,
      })),
    [templates]
  );

  function getTeamOptions(groupIndex: number): MultiComboboxOption[] {
    const currentGroupTeams = new Set(groups[groupIndex].teamIds);
    return teams.map((t) => ({
      value: t.id,
      label: t.name,
      disabled: usedTeamIds.has(t.id) && !currentGroupTeams.has(t.id),
      disabledReason: "Already in another group",
    }));
  }

  function updateGroup(index: number, patch: Partial<AssignmentGroup>) {
    onGroupsChange(
      groups.map((g, i) => (i === index ? { ...g, ...patch } : g))
    );
  }

  function addGroup() {
    onGroupsChange([...groups, { teamIds: [], templateId: "" }]);
  }

  function removeGroup(index: number) {
    onGroupsChange(groups.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-[15px] font-semibold text-gray-900 mb-1">
          Team &amp; Template Assignments
        </h3>
        <p className="text-[13px] text-gray-500">
          Group teams that share the same evaluation template. Select multiple
          teams per group.
        </p>
      </div>

      {fetchError && (
        <p className="text-[13px] text-red-500">{fetchError}</p>
      )}

      <div className="space-y-4">
        {groups.map((group, index) => (
          <div
            key={index}
            className="rounded-2xl border border-gray-100 bg-gray-50/40 p-4 space-y-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium text-gray-600">
                Group {index + 1}
              </span>
              {groups.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeGroup(index)}
                  className="h-7 w-7 p-0"
                >
                  <X size={14} strokeWidth={1.5} />
                </Button>
              )}
            </div>

            <MultiCombobox
              label="Teams"
              placeholder="Select teams..."
              emptyMessage="No teams found"
              value={group.teamIds}
              onChange={(ids) => updateGroup(index, { teamIds: ids })}
              onSearchChange={onTeamSearch}
              loading={isSearchingTeams}
              options={getTeamOptions(index)}
            />

            <Combobox
              label="Template"
              placeholder="Select template"
              emptyMessage="No templates found"
              value={group.templateId || null}
              onChange={(v) => updateGroup(index, { templateId: v ?? "" })}
              onSearchChange={onTemplateSearch}
              loading={isSearchingTemplates}
              options={templateOptions}
            />
          </div>
        ))}
      </div>

      <Button type="button" variant="secondary" size="sm" onClick={addGroup}>
        <Plus size={14} strokeWidth={1.5} className="mr-1.5" />
        Add Group
      </Button>
    </div>
  );
}
