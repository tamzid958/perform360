"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import type { ComboboxOption } from "@/components/ui/combobox";
import { Toggle } from "@/components/ui/toggle";
import { ChevronDown, ChevronRight } from "lucide-react";
import type {
  AssignmentGroup,
  GroupAdvancedConfig,
  LevelInfo,
  RelationshipWeightsInput,
  RelationshipTemplateEntry,
  TemplateOption,
  TeamOption,
} from "./types";
import {
  RELATIONSHIPS,
  DEFAULT_WEIGHTS,
  getWeightSum,
} from "./types";

interface StepCustomizeProps {
  groups: AssignmentGroup[];
  configs: GroupAdvancedConfig[];
  onConfigsChange: (configs: GroupAdvancedConfig[]) => void;
  teams: TeamOption[];
  templates: TemplateOption[];
  isSearchingTemplates: boolean;
  onTemplateSearch: (q: string) => void;
}

const WEIGHT_FIELDS: [keyof RelationshipWeightsInput, string][] = [
  ["manager", "Manager"],
  ["peer", "Peer"],
  ["directReport", "Direct Report"],
  ["self", "Self"],
  ["external", "External"],
];

export function StepCustomize({
  groups,
  configs,
  onConfigsChange,
  teams,
  templates,
  isSearchingTemplates,
  onTemplateSearch,
}: StepCustomizeProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());
  const [perTeamMode, setPerTeamMode] = useState<Record<number, boolean>>({});
  const [teamLevelsCache, setTeamLevelsCache] = useState<Record<string, LevelInfo[]>>({});

  const teamNameMap = useMemo(
    () => new Map(teams.map((t) => [t.id, t.name])),
    [teams]
  );

  const templateNameMap = useMemo(
    () => new Map(templates.map((t) => [t.id, t.name])),
    [templates]
  );

  const templateOptions: ComboboxOption[] = useMemo(
    () =>
      templates.map((t) => ({
        value: t.id,
        label: t.name,
        sublabel: t.isGlobal ? "Global" : undefined,
      })),
    [templates]
  );

  // Fetch levels for all teams across all groups
  const fetchTeamLevels = useCallback(
    async (teamId: string) => {
      if (!teamId || teamLevelsCache[teamId]) return;
      try {
        const res = await fetch(`/api/teams/${teamId}`);
        const json = await res.json();
        if (json.success) {
          const levelMap = new Map<string, LevelInfo>();
          for (const m of json.data.members) {
            if (m.level) levelMap.set(m.level.id, m.level);
          }
          setTeamLevelsCache((prev) => ({
            ...prev,
            [teamId]: Array.from(levelMap.values()),
          }));
        }
      } catch {
        /* silently handle */
      }
    },
    [teamLevelsCache]
  );

  useEffect(() => {
    for (const group of groups) {
      for (const teamId of group.teamIds) {
        fetchTeamLevels(teamId);
      }
    }
  }, [groups, fetchTeamLevels]);

  function toggleGroup(index: number) {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function updateConfig(index: number, patch: Partial<GroupAdvancedConfig>) {
    onConfigsChange(
      configs.map((c, i) => (i === index ? { ...c, ...patch } : c))
    );
  }

  function toggleWeights(groupIndex: number) {
    const current = configs[groupIndex].weights;
    updateConfig(groupIndex, {
      weights: current ? null : { ...DEFAULT_WEIGHTS },
    });
  }

  function updateWeight(
    groupIndex: number,
    field: keyof RelationshipWeightsInput,
    value: number
  ) {
    const weights = configs[groupIndex].weights;
    if (!weights) return;
    updateConfig(groupIndex, {
      weights: { ...weights, [field]: value },
    });
  }

  // Merged levels per group: deduplicate across teams, track which teams have each level
  function getGroupLevels(group: AssignmentGroup): { level: LevelInfo; teamIds: string[] }[] {
    const map = new Map<string, { level: LevelInfo; teamIds: string[] }>();
    for (const teamId of group.teamIds) {
      for (const level of teamLevelsCache[teamId] ?? []) {
        const existing = map.get(level.id);
        if (existing) {
          existing.teamIds.push(teamId);
        } else {
          map.set(level.id, { level, teamIds: [teamId] });
        }
      }
    }
    return Array.from(map.values());
  }

  // Update level template for ALL teams in the group that share the level
  function updateLevelTemplate(
    groupIndex: number,
    levelId: string,
    relationship: string,
    templateId: string | null,
    affectedTeamIds: string[]
  ) {
    const tlt = { ...configs[groupIndex].teamLevelTemplates };
    for (const teamId of affectedTeamIds) {
      const entries = (tlt[teamId] ?? []).filter(
        (e) => !(e.levelId === levelId && e.relationship === relationship)
      );
      if (templateId) {
        entries.push({ levelId, relationship, templateId });
      }
      tlt[teamId] = entries;
    }
    updateConfig(groupIndex, { teamLevelTemplates: tlt });
  }

  // Read from the first team that has this level (all are kept in sync in unified mode)
  function getLevelTemplateId(
    groupIndex: number,
    levelId: string,
    relationship: string,
    teamIds: string[]
  ): string {
    for (const teamId of teamIds) {
      const found = configs[groupIndex].teamLevelTemplates[teamId]?.find(
        (e) => e.levelId === levelId && e.relationship === relationship
      );
      if (found) return found.templateId;
    }
    return "";
  }

  // Per-team mode: update only one specific team
  function updateLevelTemplateSingle(
    groupIndex: number,
    teamId: string,
    levelId: string,
    relationship: string,
    templateId: string | null
  ) {
    const tlt = { ...configs[groupIndex].teamLevelTemplates };
    const entries = (tlt[teamId] ?? []).filter(
      (e) => !(e.levelId === levelId && e.relationship === relationship)
    );
    if (templateId) {
      entries.push({ levelId, relationship, templateId });
    }
    tlt[teamId] = entries;
    updateConfig(groupIndex, { teamLevelTemplates: tlt });
  }

  // Per-team mode: read from one specific team
  function getLevelTemplateIdSingle(
    groupIndex: number,
    teamId: string,
    levelId: string,
    relationship: string
  ): string {
    return (
      configs[groupIndex].teamLevelTemplates[teamId]?.find(
        (e) => e.levelId === levelId && e.relationship === relationship
      )?.templateId ?? ""
    );
  }

  function updateRelationshipTemplate(
    groupIndex: number,
    relationship: string,
    templateId: string | null
  ) {
    const filtered = configs[groupIndex].relationshipTemplates.filter(
      (e) => e.relationship !== relationship
    );
    if (templateId) {
      filtered.push({ relationship, templateId });
    }
    updateConfig(groupIndex, { relationshipTemplates: filtered });
  }

  function getRelationshipTemplateId(
    groupIndex: number,
    relationship: string
  ): string {
    return (
      configs[groupIndex].relationshipTemplates.find(
        (e) => e.relationship === relationship
      )?.templateId ?? ""
    );
  }

  const hasAnyConfig = configs.some(
    (c) =>
      c.weights !== null ||
      c.relationshipTemplates.length > 0 ||
      Object.values(c.teamLevelTemplates).some((entries) => entries.length > 0)
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-[15px] font-semibold text-gray-900 mb-1">
          Review &amp; Customize
        </h3>
        <p className="text-[13px] text-gray-500">
          Optionally configure relationship weights and per-level template
          overrides. Expand a group to customize.
        </p>
      </div>

      <div className="space-y-3">
        {groups.map((group, gIdx) => {
          const isExpanded = expandedGroups.has(gIdx);
          const config = configs[gIdx];
          const teamNames = group.teamIds
            .map((id) => teamNameMap.get(id) ?? id)
            .join(", ");
          const templateName =
            templateNameMap.get(group.templateId) ?? "No template";

          return (
            <div
              key={gIdx}
              className="rounded-2xl border border-gray-100 bg-white overflow-hidden"
            >
              {/* Group header */}
              <button
                type="button"
                onClick={() => toggleGroup(gIdx)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50/50 transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown size={16} strokeWidth={1.5} className="text-gray-400 shrink-0" />
                ) : (
                  <ChevronRight size={16} strokeWidth={1.5} className="text-gray-400 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-gray-900 truncate">
                    {teamNames}
                  </p>
                  <p className="text-[12px] text-gray-500 truncate">
                    {templateName}
                  </p>
                </div>
                {(config.weights ||
                  config.relationshipTemplates.length > 0 ||
                  Object.values(config.teamLevelTemplates).some(
                    (e) => e.length > 0
                  )) && (
                  <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-brand-50 text-brand-600">
                    Customized
                  </span>
                )}
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-5 border-t border-gray-100 pt-4">
                  {/* Weights section */}
                  <div>
                    <button
                      type="button"
                      onClick={() => toggleWeights(gIdx)}
                      className="text-[13px] font-medium text-gray-700 hover:text-gray-900 transition-colors"
                    >
                      {config.weights
                        ? "- Remove custom weights"
                        : "+ Add custom weights"}
                    </button>

                    {config.weights && (
                      <div className="mt-3 space-y-3">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                          {WEIGHT_FIELDS.map(([field, label]) => (
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
                                  value={config.weights![field]}
                                  onChange={(e) =>
                                    updateWeight(
                                      gIdx,
                                      field,
                                      Math.max(
                                        0,
                                        Math.min(100, Number(e.target.value) || 0)
                                      )
                                    )
                                  }
                                  className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-[13px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 pr-6"
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">
                                  %
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                        <WeightTotal weights={config.weights} />
                      </div>
                    )}
                  </div>

                  {/* Per-relationship template overrides (shown always) */}
                  <div>
                    <p className="text-[13px] font-medium text-gray-700 mb-3">
                      Per-relationship templates
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {RELATIONSHIPS.map((r) => (
                        <div key={r.key}>
                          <label className="block text-[11px] font-medium text-gray-500 mb-1">
                            {r.label}
                          </label>
                          <Combobox
                            placeholder="Use default"
                            emptyMessage="No templates"
                            value={getRelationshipTemplateId(gIdx, r.key) || null}
                            onChange={(v) => updateRelationshipTemplate(gIdx, r.key, v)}
                            onSearchChange={onTemplateSearch}
                            loading={isSearchingTemplates}
                            options={templateOptions}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Per-level template overrides */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[13px] font-medium text-gray-700">
                        Per-level template overrides
                      </p>
                      {group.teamIds.length > 1 && (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-gray-500">
                            Per team
                          </span>
                          <Toggle
                            checked={!!perTeamMode[gIdx]}
                            onChange={(v) =>
                              setPerTeamMode((prev) => ({ ...prev, [gIdx]: v }))
                            }
                          />
                        </div>
                      )}
                    </div>
                    {(() => {
                      if (group.teamIds.length === 0) {
                        return (
                          <p className="text-[12px] text-gray-400">
                            No teams selected.
                          </p>
                        );
                      }

                      const isPerTeam = !!perTeamMode[gIdx];
                      const groupLevels = getGroupLevels(group);

                      // No levels at all — nothing to show for per-level
                      if (groupLevels.length === 0) {
                        return (
                          <p className="text-[12px] text-gray-400 ml-1">
                            No levels assigned to members. Use per-relationship
                            templates above instead.
                          </p>
                        );
                      }

                      // Per-team mode: show levels under each team separately
                      if (isPerTeam) {
                        return (
                          <div className="space-y-4">
                            {group.teamIds.map((teamId) => {
                              const levels = teamLevelsCache[teamId] ?? [];
                              const teamName = teamNameMap.get(teamId) ?? teamId;
                              return (
                                <div key={teamId}>
                                  <p className="text-[12px] font-semibold text-gray-600 mb-2">
                                    {teamName}
                                  </p>
                                  {levels.length === 0 ? (
                                    <p className="text-[12px] text-gray-400 ml-1">
                                      No levels for this team.
                                    </p>
                                  ) : (
                                    <div className="space-y-3">
                                      {levels.map((level) => (
                                        <LevelOverrideCard
                                          key={level.id}
                                          level={level}
                                          groupIndex={gIdx}
                                          teamIds={[teamId]}
                                          teamNameMap={teamNameMap}
                                          showTeamNames={false}
                                          templateOptions={templateOptions}
                                          isSearchingTemplates={isSearchingTemplates}
                                          onTemplateSearch={onTemplateSearch}
                                          getLevelTemplateId={(gi, li, rel, _tids) =>
                                            getLevelTemplateIdSingle(gi, teamId, li, rel)
                                          }
                                          updateLevelTemplate={(gi, li, rel, tid, _tids) =>
                                            updateLevelTemplateSingle(gi, teamId, li, rel, tid)
                                          }
                                        />
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      }

                      // Unified mode: deduplicated levels across teams
                      return (
                        <div className="space-y-3">
                          {groupLevels.map(({ level, teamIds: levelTeamIds }) => (
                            <LevelOverrideCard
                              key={level.id}
                              level={level}
                              groupIndex={gIdx}
                              teamIds={levelTeamIds}
                              teamNameMap={teamNameMap}
                              showTeamNames={group.teamIds.length > 1}
                              templateOptions={templateOptions}
                              isSearchingTemplates={isSearchingTemplates}
                              onTemplateSearch={onTemplateSearch}
                              getLevelTemplateId={getLevelTemplateId}
                              updateLevelTemplate={updateLevelTemplate}
                            />
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!hasAnyConfig && (
        <p className="text-[12px] text-gray-400 text-center py-2">
          No customizations added. You can proceed to create the cycle with
          defaults.
        </p>
      )}
    </div>
  );
}

function WeightTotal({ weights }: { weights: RelationshipWeightsInput }) {
  const sum = getWeightSum(weights);
  const isValid = Math.abs(sum - 100) < 0.01;
  return (
    <div className="flex items-center gap-2">
      <span
        className={`text-[12px] font-medium ${
          isValid ? "text-green-600" : "text-red-500"
        }`}
      >
        Total: {sum}%
      </span>
      {!isValid && (
        <span className="text-[11px] text-red-400">Must equal 100%</span>
      )}
    </div>
  );
}

function LevelOverrideCard({
  level,
  groupIndex,
  teamIds,
  teamNameMap,
  showTeamNames,
  templateOptions,
  isSearchingTemplates,
  onTemplateSearch,
  getLevelTemplateId,
  updateLevelTemplate,
}: {
  level: LevelInfo;
  groupIndex: number;
  teamIds: string[];
  teamNameMap: Map<string, string>;
  showTeamNames: boolean;
  templateOptions: ComboboxOption[];
  isSearchingTemplates: boolean;
  onTemplateSearch: (q: string) => void;
  getLevelTemplateId: (
    gIdx: number,
    levelId: string,
    rel: string,
    teamIds: string[]
  ) => string;
  updateLevelTemplate: (
    gIdx: number,
    levelId: string,
    rel: string,
    templateId: string | null,
    teamIds: string[]
  ) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const hasOverrides = RELATIONSHIPS.some(
    (r) => getLevelTemplateId(groupIndex, level.id, r.key, teamIds) !== ""
  );

  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/50">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 transition-colors rounded-xl"
      >
        {expanded ? (
          <ChevronDown size={14} strokeWidth={1.5} className="text-gray-400" />
        ) : (
          <ChevronRight size={14} strokeWidth={1.5} className="text-gray-400" />
        )}
        <span className="text-[13px] font-medium text-gray-700">
          {level.name}
        </span>
        {showTeamNames && (
          <span className="text-[11px] text-gray-400 truncate">
            {teamIds.map((id) => teamNameMap.get(id) ?? id).join(", ")}
          </span>
        )}
        {hasOverrides && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-600 shrink-0">
            Overridden
          </span>
        )}
      </button>

      {expanded && (
        <div className="px-3 pb-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {RELATIONSHIPS.map((r) => (
            <div key={r.key}>
              <label className="block text-[11px] font-medium text-gray-500 mb-1">
                {r.label}
              </label>
              <Combobox
                placeholder="Default"
                emptyMessage="No templates"
                value={
                  getLevelTemplateId(groupIndex, level.id, r.key, teamIds) ||
                  null
                }
                onChange={(v) =>
                  updateLevelTemplate(groupIndex, level.id, r.key, v, teamIds)
                }
                onSearchChange={onTemplateSearch}
                loading={isSearchingTemplates}
                options={templateOptions}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
