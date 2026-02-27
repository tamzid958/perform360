"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Combobox } from "@/components/ui/combobox";
import type { ComboboxOption } from "@/components/ui/combobox";
import { Badge } from "@/components/ui/badge";
import { Toggle } from "@/components/ui/toggle";
import { InlineAlert } from "@/components/ui/inline-alert";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  X,
  Eye,
  EyeOff,
  Layers,
  ArrowRight,
} from "lucide-react";
import type {
  AssignmentGroup,
  GroupAdvancedConfig,
  LevelInfo,
  RelationshipWeightsInput,
  TemplateOption,
  TeamOption,
  TemplateOverride,
  WeightPreset,
} from "./types";
import {
  RELATIONSHIPS,
  WEIGHT_PRESETS,
  getWeightSum,
  overrideSpecificity,
} from "./types";

// ── Types ───────────────────────────────────────────────────

interface MemberInfo {
  userId: string;
  name: string;
  levelId: string | null;
  levelName: string | null;
  role: string;
}

interface StepCustomizeProps {
  groups: AssignmentGroup[];
  configs: GroupAdvancedConfig[];
  onConfigsChange: (configs: GroupAdvancedConfig[]) => void;
  teams: TeamOption[];
  templates: TemplateOption[];
  isSearchingTemplates: boolean;
  onTemplateSearch: (q: string) => void;
}

// ── Constants ───────────────────────────────────────────────

const WEIGHT_FIELDS: [keyof RelationshipWeightsInput, string][] = [
  ["manager", "Manager"],
  ["peer", "Peer"],
  ["directReport", "Direct Report"],
  ["self", "Self"],
  ["external", "External"],
];

const RELATIONSHIP_OPTIONS = [
  { value: "__any__", label: "All relationships (fallback)" },
  ...RELATIONSHIPS.map((r) => ({ value: r.key, label: r.label })),
];

const TIER_META: Record<
  number,
  { label: string; description: string; variant: "info" | "default" }
> = {
  0: {
    label: "Exact match",
    description: "Applies to a specific level + relationship combination",
    variant: "info",
  },
  1: {
    label: "Level fallback",
    description: "Applies to all relationships for a specific level",
    variant: "info",
  },
  2: {
    label: "Relationship fallback",
    description: "Applies to a relationship type across all levels",
    variant: "default",
  },
};

// ── Resolver ────────────────────────────────────────────────

function resolveTemplateClient(
  overrides: TemplateOverride[],
  subjectLevelId: string | null,
  relationship: string,
  defaultTemplateId: string | null
): string | null {
  if (subjectLevelId) {
    const lr = overrides.find(
      (o) => o.levelId === subjectLevelId && o.relationship === relationship
    );
    if (lr) return lr.templateId;
    const lo = overrides.find(
      (o) => o.levelId === subjectLevelId && !o.relationship
    );
    if (lo) return lo.templateId;
  }
  const ro = overrides.find(
    (o) => !o.levelId && o.relationship === relationship
  );
  if (ro) return ro.templateId;
  return defaultTemplateId;
}

// ── Main Component ──────────────────────────────────────────

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
  const [teamLevelsCache, setTeamLevelsCache] = useState<
    Record<string, LevelInfo[]>
  >({});
  const [teamMembersCache, setTeamMembersCache] = useState<
    Record<string, MemberInfo[]>
  >({});
  const { addToast } = useToast();

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

  const fetchTeamData = useCallback(
    async (teamId: string) => {
      if (!teamId || teamLevelsCache[teamId]) return;
      try {
        const res = await fetch(`/api/teams/${teamId}`);
        const json = await res.json();
        if (json.success) {
          const levelMap = new Map<string, LevelInfo>();
          const members: MemberInfo[] = [];
          for (const m of json.data.members) {
            if (m.level) levelMap.set(m.level.id, m.level);
            members.push({
              userId: m.user.id,
              name: m.user.name ?? m.user.email,
              levelId: m.level?.id ?? null,
              levelName: m.level?.name ?? null,
              role: m.role,
            });
          }
          setTeamLevelsCache((prev) => ({
            ...prev,
            [teamId]: Array.from(levelMap.values()),
          }));
          setTeamMembersCache((prev) => ({ ...prev, [teamId]: members }));
        }
      } catch {
        /* silently handle */
      }
    },
    [teamLevelsCache]
  );

  useEffect(() => {
    for (const teamId of groups.flatMap((g) => g.teamIds)) {
      void fetchTeamData(teamId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups]);

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

  function setPreset(groupIndex: number, preset: WeightPreset) {
    const def = WEIGHT_PRESETS[preset];
    updateConfig(groupIndex, {
      weightPreset: preset,
      weights: { ...def.member },
      managerWeights: { ...def.manager },
    });
  }

  function removeWeights(groupIndex: number) {
    updateConfig(groupIndex, {
      weightPreset: null,
      weights: null,
      managerWeights: null,
    });
  }

  function updateWeight(
    groupIndex: number,
    role: "member" | "manager",
    field: keyof RelationshipWeightsInput,
    value: number
  ) {
    const config = configs[groupIndex];
    if (role === "member" && config.weights) {
      updateConfig(groupIndex, { weights: { ...config.weights, [field]: value } });
    } else if (role === "manager" && config.managerWeights) {
      updateConfig(groupIndex, { managerWeights: { ...config.managerWeights, [field]: value } });
    }
  }

  function getGroupLevels(
    group: AssignmentGroup
  ): { level: LevelInfo; teamIds: string[] }[] {
    const map = new Map<string, { level: LevelInfo; teamIds: string[] }>();
    for (const teamId of group.teamIds) {
      for (const level of teamLevelsCache[teamId] ?? []) {
        const existing = map.get(level.id);
        if (existing) existing.teamIds.push(teamId);
        else map.set(level.id, { level, teamIds: [teamId] });
      }
    }
    return Array.from(map.values());
  }

  function addOverride(
    groupIndex: number,
    override: TemplateOverride,
    affectedTeamIds: string[]
  ) {
    const overrides = { ...configs[groupIndex].overrides };
    for (const teamId of affectedTeamIds) {
      const arr = [...(overrides[teamId] ?? [])];
      const idx = arr.findIndex(
        (o) =>
          o.levelId === override.levelId &&
          o.relationship === override.relationship
      );
      if (idx >= 0) arr.splice(idx, 1);
      arr.push(override);
      overrides[teamId] = arr;
    }
    updateConfig(groupIndex, { overrides });
  }

  function removeOverride(
    groupIndex: number,
    override: TemplateOverride,
    affectedTeamIds: string[]
  ) {
    const overrides = { ...configs[groupIndex].overrides };
    for (const teamId of affectedTeamIds) {
      overrides[teamId] = (overrides[teamId] ?? []).filter(
        (o) =>
          !(
            o.levelId === override.levelId &&
            o.relationship === override.relationship
          )
      );
    }
    updateConfig(groupIndex, { overrides });

    // Undo toast
    const name = templateNameMap.get(override.templateId) ?? "override";
    addToast(`Removed ${name}`, "info", {
      label: "Undo",
      onClick: () => addOverride(groupIndex, override, affectedTeamIds),
    });
  }

  function getDisplayOverrides(
    groupIndex: number,
    teamIds: string[]
  ): TemplateOverride[] {
    for (const teamId of teamIds) {
      const arr = configs[groupIndex].overrides[teamId];
      if (arr && arr.length > 0) return arr;
    }
    return [];
  }

  const hasAnyConfig = configs.some(
    (c) =>
      c.weights !== null ||
      Object.values(c.overrides).some((arr) => arr.length > 0)
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-[15px] font-semibold text-gray-900 mb-1">
          Review &amp; Customize
        </h3>
        <p className="text-[13px] text-gray-500">
          Fine-tune how templates are assigned. Overrides let you use different
          templates for specific levels or relationship types.
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
          const overrideCount = Object.values(config.overrides).reduce(
            (sum, arr) => Math.max(sum, arr.length),
            0
          );

          return (
            <div
              key={gIdx}
              className="border border-gray-900 bg-white overflow-hidden"
            >
              <button
                type="button"
                onClick={() => toggleGroup(gIdx)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left"
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
                <div className="flex items-center gap-2 shrink-0">
                  {config.weights && (
                    <Badge variant="default" className="text-[10px]">
                      Weights
                    </Badge>
                  )}
                  {overrideCount > 0 && (
                    <Badge variant="info" className="text-[10px]">
                      {overrideCount} override{overrideCount !== 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 space-y-5 border-t border-gray-100 pt-4">
                  {/* Weights */}
                  <WeightsSection
                    preset={config.weightPreset}
                    weights={config.weights}
                    managerWeights={config.managerWeights}
                    onPresetChange={(p) => setPreset(gIdx, p)}
                    onRemove={() => removeWeights(gIdx)}
                    onWeightChange={(role, field, value) => updateWeight(gIdx, role, field, value)}
                  />

                  {/* Overrides */}
                  <OverridesSection
                    group={group}
                    groupIndex={gIdx}
                    config={config}
                    isPerTeam={!!perTeamMode[gIdx]}
                    onPerTeamChange={(v) =>
                      setPerTeamMode((prev) => ({ ...prev, [gIdx]: v }))
                    }
                    teamNameMap={teamNameMap}
                    templateNameMap={templateNameMap}
                    templateOptions={templateOptions}
                    isSearchingTemplates={isSearchingTemplates}
                    onTemplateSearch={onTemplateSearch}
                    groupLevels={getGroupLevels(group)}
                    teamLevelsCache={teamLevelsCache}
                    getDisplayOverrides={() =>
                      getDisplayOverrides(gIdx, group.teamIds)
                    }
                    onAdd={(o, teamIds) => addOverride(gIdx, o, teamIds)}
                    onRemove={(o, teamIds) => removeOverride(gIdx, o, teamIds)}
                  />

                  {/* Preview */}
                  <ResolutionPreview
                    group={group}
                    config={config}
                    teamMembersCache={teamMembersCache}
                    templateNameMap={templateNameMap}
                    perTeamMode={!!perTeamMode[gIdx]}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!hasAnyConfig && (
        <p className="text-[12px] text-gray-400 text-center py-2">
          No customizations yet. You can create the cycle with defaults, or
          expand a group above to fine-tune.
        </p>
      )}
    </div>
  );
}

// ── Weights Section ─────────────────────────────────────────

const PRESET_KEYS: WeightPreset[] = ["equal", "supervisor_focus", "peer_focus", "custom"];

function WeightsSection({
  preset,
  weights,
  managerWeights,
  onPresetChange,
  onRemove,
  onWeightChange,
}: {
  preset: WeightPreset | null;
  weights: RelationshipWeightsInput | null;
  managerWeights: RelationshipWeightsInput | null;
  onPresetChange: (preset: WeightPreset) => void;
  onRemove: () => void;
  onWeightChange: (role: "member" | "manager", field: keyof RelationshipWeightsInput, value: number) => void;
}) {
  const isCustom = preset === "custom";

  return (
    <div>
      <button
        type="button"
        onClick={preset ? onRemove : () => onPresetChange("equal")}
        className="text-[13px] font-medium text-gray-700 hover:text-gray-900"
      >
        {preset ? "- Remove scoring weights" : "+ Add scoring weights"}
      </button>

      {preset && (
        <div className="mt-3 space-y-4">
          {/* Preset cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PRESET_KEYS.map((key) => {
              const p = WEIGHT_PRESETS[key];
              const isActive = preset === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onPresetChange(key)}
                  className={`border px-3 py-2.5 text-left ${
                    isActive
                      ? "border-gray-900 bg-white ring-1 ring-gray-900/30"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <p className={`text-[12px] font-semibold ${isActive ? "text-gray-900" : "text-gray-900"}`}>
                    {p.label}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">
                    {p.description}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Weight details — two columns */}
          {weights && managerWeights && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <WeightColumn
                label="For Members"
                sublabel="When the subject is a team member"
                weights={weights}
                editable={isCustom}
                onChange={(field, value) => onWeightChange("member", field, value)}
                inactiveField="directReport"
                inactiveHint="Members don't have direct reports in a single team. Enable if this member is also a manager in another team within this cycle."
              />
              <WeightColumn
                label="For Managers"
                sublabel="When the subject is a team manager"
                weights={managerWeights}
                editable={isCustom}
                onChange={(field, value) => onWeightChange("manager", field, value)}
                inactiveField="manager"
                inactiveHint="Managers typically have no skip-level boss within the same team. Enable if the manager reports to someone in another team within this cycle."
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function WeightColumn({
  label,
  sublabel,
  weights,
  editable,
  onChange,
  inactiveField,
  inactiveHint,
}: {
  label: string;
  sublabel: string;
  weights: RelationshipWeightsInput;
  editable: boolean;
  onChange: (field: keyof RelationshipWeightsInput, value: number) => void;
  inactiveField: keyof RelationshipWeightsInput;
  inactiveHint: string;
}) {
  const [showInactive, setShowInactive] = useState(false);
  const sum = getWeightSum(weights);
  const isValid = Math.abs(sum - 100) < 0.01;

  const primaryFields = WEIGHT_FIELDS.filter(([f]) => f !== inactiveField);
  const inactiveEntry = WEIGHT_FIELDS.find(([f]) => f === inactiveField)!;
  const hasInactiveValue = weights[inactiveField] > 0;

  return (
    <div className="border border-gray-100 bg-gray-50/50 p-3 space-y-2">
      <div>
        <p className="text-[12px] font-semibold text-gray-900">{label}</p>
        <p className="text-[10px] text-gray-500">{sublabel}</p>
      </div>
      {/* Primary weights */}
      <div className="space-y-1.5">
        {primaryFields.map(([field, fieldLabel]) => (
          <WeightRow
            key={field}
            field={field}
            fieldLabel={fieldLabel}
            value={weights[field]}
            editable={editable}
            onChange={onChange}
          />
        ))}
      </div>
      {/* Inactive field — collapsible cross-team section */}
      <div className="pt-1 border-t border-gray-200/40">
        <button
          type="button"
          onClick={() => setShowInactive(!showInactive)}
          className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-600"
        >
          {showInactive ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          {inactiveEntry[1]}
          {hasInactiveValue && (
            <span className="text-gray-900 font-medium ml-1">{weights[inactiveField]}%</span>
          )}
          {!hasInactiveValue && <span className="ml-1">— 0% (cross-team)</span>}
        </button>
        {showInactive && (
          <div className="mt-1.5 ml-3.5 space-y-1.5">
            <p className="text-[10px] text-gray-400 leading-relaxed">{inactiveHint}</p>
            <WeightRow
              field={inactiveField}
              fieldLabel={inactiveEntry[1]}
              value={weights[inactiveField]}
              editable={editable}
              onChange={onChange}
            />
          </div>
        )}
      </div>
      {/* Total */}
      <div className="flex items-center gap-2 pt-1 border-t border-gray-200/60">
        <span className={`text-[11px] font-medium ${isValid ? "text-gray-900" : "text-gray-900"}`}>
          Total: {sum}%
        </span>
        {!isValid && (
          <span className="text-[10px] text-gray-900">Must equal 100%</span>
        )}
      </div>
    </div>
  );
}

function WeightRow({
  field,
  fieldLabel,
  value,
  editable,
  onChange,
}: {
  field: keyof RelationshipWeightsInput;
  fieldLabel: string;
  value: number;
  editable: boolean;
  onChange: (field: keyof RelationshipWeightsInput, value: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-gray-600 w-16 shrink-0">{fieldLabel}</span>
      {editable ? (
        <div className="relative flex-1">
          <input
            type="number"
            min={0}
            max={100}
            step={1}
            value={value}
            onChange={(e) =>
              onChange(field, Math.max(0, Math.min(100, Number(e.target.value) || 0)))
            }
            className="w-full border border-gray-200 bg-white px-2 py-1 text-[12px] text-gray-900 focus:outline-none focus:outline-2 focus:outline-accent focus:outline-offset-2 pr-6"
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">%</span>
        </div>
      ) : (
        <div className="flex-1 flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-gray-200 overflow-hidden">
            <div
              className="h-full bg-gray-900"
              style={{ width: `${value}%` }}
            />
          </div>
          <span className="text-[11px] font-medium text-gray-700 w-8 text-right">{value}%</span>
        </div>
      )}
    </div>
  );
}

// ── Overrides Section ───────────────────────────────────────

function OverridesSection({
  group,
  groupIndex: _groupIndex,
  config,
  isPerTeam,
  onPerTeamChange,
  teamNameMap,
  templateNameMap,
  templateOptions,
  isSearchingTemplates,
  onTemplateSearch,
  groupLevels,
  teamLevelsCache,
  getDisplayOverrides,
  onAdd,
  onRemove,
}: {
  group: AssignmentGroup;
  groupIndex: number;
  config: GroupAdvancedConfig;
  isPerTeam: boolean;
  onPerTeamChange: (v: boolean) => void;
  teamNameMap: Map<string, string>;
  templateNameMap: Map<string, string>;
  templateOptions: ComboboxOption[];
  isSearchingTemplates: boolean;
  onTemplateSearch: (q: string) => void;
  groupLevels: { level: LevelInfo; teamIds: string[] }[];
  teamLevelsCache: Record<string, LevelInfo[]>;
  getDisplayOverrides: () => TemplateOverride[];
  onAdd: (o: TemplateOverride, teamIds: string[]) => void;
  onRemove: (o: TemplateOverride, teamIds: string[]) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Layers size={14} className="text-gray-400" />
          <p className="text-[13px] font-medium text-gray-700">
            Template overrides
          </p>
        </div>
        {group.teamIds.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-500">Per team</span>
            <Toggle checked={isPerTeam} onChange={onPerTeamChange} />
          </div>
        )}
      </div>

      {isPerTeam ? (
        <div className="space-y-4">
          {group.teamIds.map((teamId) => {
            const teamLevels = teamLevelsCache[teamId] ?? [];
            const levelOpts: ComboboxOption[] = [
              { value: "__any__", label: "All levels (fallback)" },
              ...teamLevels.map((l) => ({ value: l.id, label: l.name })),
            ];
            return (
              <div key={teamId}>
                <p className="text-[12px] font-semibold text-gray-600 mb-2">
                  {teamNameMap.get(teamId) ?? teamId}
                </p>
                <OverrideCards
                  overrides={config.overrides[teamId] ?? []}
                  templateNameMap={templateNameMap}
                  levelOptions={levelOpts}
                  templateOptions={templateOptions}
                  isSearchingTemplates={isSearchingTemplates}
                  onTemplateSearch={onTemplateSearch}
                  onAdd={(o) => onAdd(o, [teamId])}
                  onRemove={(o) => onRemove(o, [teamId])}
                />
              </div>
            );
          })}
        </div>
      ) : (
        <OverrideCards
          overrides={getDisplayOverrides()}
          templateNameMap={templateNameMap}
          levelOptions={[
            { value: "__any__", label: "All levels (fallback)" },
            ...groupLevels.map(({ level }) => ({
              value: level.id,
              label: level.name,
            })),
          ]}
          templateOptions={templateOptions}
          isSearchingTemplates={isSearchingTemplates}
          onTemplateSearch={onTemplateSearch}
          onAdd={(o) => onAdd(o, group.teamIds)}
          onRemove={(o) => onRemove(o, group.teamIds)}
        />
      )}
    </div>
  );
}

// ── Override Cards ───────────────────────────────────────────

function OverrideCards({
  overrides,
  templateNameMap,
  levelOptions,
  templateOptions,
  isSearchingTemplates,
  onTemplateSearch,
  onAdd,
  onRemove,
}: {
  overrides: TemplateOverride[];
  templateNameMap: Map<string, string>;
  levelOptions: ComboboxOption[];
  templateOptions: ComboboxOption[];
  isSearchingTemplates: boolean;
  onTemplateSearch: (q: string) => void;
  onAdd: (o: TemplateOverride) => void;
  onRemove: (o: TemplateOverride) => void;
}) {
  const [showAddForm, setShowAddForm] = useState(false);

  // Group by tier
  const tiers = useMemo(() => {
    const grouped = new Map<number, TemplateOverride[]>();
    for (const o of overrides) {
      const tier = overrideSpecificity(o);
      if (!grouped.has(tier)) grouped.set(tier, []);
      grouped.get(tier)!.push(o);
    }
    return [...grouped.entries()].sort(([a], [b]) => a - b);
  }, [overrides]);

  const levelNameMap = useMemo(
    () =>
      new Map(
        levelOptions
          .filter((o) => o.value !== "__any__")
          .map((o) => [o.value, o.label])
      ),
    [levelOptions]
  );

  const relLabelMap = useMemo(
    () => new Map<string, string>(RELATIONSHIPS.map((r) => [r.key, r.label])),
    []
  );

  if (overrides.length === 0 && !showAddForm) {
    return (
      <div className="border border-dashed border-gray-200 bg-gray-50/50 px-4 py-6 text-center">
        <Layers size={24} className="mx-auto text-gray-300 mb-2" />
        <p className="text-[13px] text-gray-500 mb-1">
          No template overrides
        </p>
        <p className="text-[11px] text-gray-400 mb-3 max-w-[280px] mx-auto">
          The default template will be used for all reviews. Add an override to
          use a different template for specific levels or relationship types.
        </p>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => setShowAddForm(true)}
          className="text-[12px]"
        >
          <Plus size={14} className="mr-1" /> Add override
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Cascade visualization */}
      {tiers.length > 0 && (
        <div className="space-y-2">
          {tiers.map(([tier, items]) => {
            const meta = TIER_META[tier];
            if (!meta) return null;
            return (
              <div key={tier}>
                <div className="flex items-center gap-2 mb-1.5">
                  <Badge variant={meta.variant} className="text-[10px]">
                    {meta.label}
                  </Badge>
                  <span className="text-[10px] text-gray-400">
                    {meta.description}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {items.map((o) => (
                    <OverrideCard
                      key={`${o.levelId ?? "any"}-${o.relationship ?? "any"}`}
                      override={o}
                      levelName={
                        o.levelId
                          ? levelNameMap.get(o.levelId) ?? o.levelId
                          : null
                      }
                      relationshipLabel={
                        o.relationship
                          ? relLabelMap.get(o.relationship) ?? o.relationship
                          : null
                      }
                      templateName={
                        templateNameMap.get(o.templateId) ?? o.templateId
                      }
                      onRemove={() => onRemove(o)}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {/* Cascade arrow to default */}
          <div className="flex items-center gap-2 pl-1 pt-1">
            <ArrowRight size={12} className="text-gray-300" />
            <span className="text-[11px] text-gray-400">
              Then falls back to the default template
            </span>
          </div>
        </div>
      )}

      {showAddForm ? (
        <AddOverrideForm
          levelOptions={levelOptions}
          templateOptions={templateOptions}
          isSearchingTemplates={isSearchingTemplates}
          onTemplateSearch={onTemplateSearch}
          existingOverrides={overrides}
          onAdd={(o) => {
            onAdd(o);
            setShowAddForm(false);
          }}
          onCancel={() => setShowAddForm(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center gap-1 text-[12px] font-medium text-gray-900"
        >
          <Plus size={14} /> Add override
        </button>
      )}
    </div>
  );
}

function OverrideCard({
  override,
  levelName,
  relationshipLabel,
  templateName,
  onRemove,
}: {
  override: TemplateOverride;
  levelName: string | null;
  relationshipLabel: string | null;
  templateName: string;
  onRemove: () => void;
}) {
  return (
    <div className="group flex items-center gap-3 border border-gray-100 bg-white px-3 py-2 hover:border-gray-200">
      {/* Scope pills */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        <ScopePill
          label={levelName ?? "All levels"}
          isWildcard={!levelName}
        />
        {override.relationship !== null && (
          <>
            <span className="text-gray-300 text-[10px]">&middot;</span>
            <ScopePill
              label={relationshipLabel ?? "All relationships"}
              isWildcard={!relationshipLabel}
            />
          </>
        )}
      </div>

      {/* Arrow */}
      <ArrowRight size={12} className="text-gray-300 shrink-0" />

      {/* Template */}
      <span className="text-[12px] font-medium text-gray-900 truncate max-w-[140px]">
        {templateName}
      </span>

      {/* Remove */}
      <button
        type="button"
        onClick={onRemove}
        className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-gray-100 text-gray-400 hover:text-gray-900 shrink-0"
        aria-label="Remove override"
      >
        <X size={14} />
      </button>
    </div>
  );
}

function ScopePill({
  label,
  isWildcard,
}: {
  label: string;
  isWildcard: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium ${
        isWildcard
          ? "bg-gray-50 text-gray-400 border border-dashed border-gray-200"
          : "bg-gray-100 text-gray-700"
      }`}
    >
      {label}
    </span>
  );
}

// ── Add Override Form ────────────────────────────────────────

function AddOverrideForm({
  levelOptions,
  templateOptions,
  isSearchingTemplates,
  onTemplateSearch,
  existingOverrides,
  onAdd,
  onCancel,
}: {
  levelOptions: ComboboxOption[];
  templateOptions: ComboboxOption[];
  isSearchingTemplates: boolean;
  onTemplateSearch: (q: string) => void;
  existingOverrides: TemplateOverride[];
  onAdd: (o: TemplateOverride) => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState<"scope" | "template">("scope");
  const [levelId, setLevelId] = useState<string | null>(null);
  const [relationship, setRelationship] = useState<string | null>(null);
  const [templateId, setTemplateId] = useState<string | null>(null);

  const effectiveLevelId = levelId === "__any__" ? null : levelId;
  const effectiveRel = relationship === "__any__" ? null : relationship;

  const scopeValid = effectiveLevelId !== null || effectiveRel !== null;

  const isDuplicate = existingOverrides.some(
    (o) => o.levelId === effectiveLevelId && o.relationship === effectiveRel
  );

  return (
    <div className="border border-gray-900 bg-white p-3 space-y-3">
      {/* Step indicator */}
      <div className="flex items-center gap-2 text-[11px] text-gray-400">
        <span
          className={step === "scope" ? "text-gray-900 font-medium" : ""}
        >
          1. Choose scope
        </span>
        <span>&rarr;</span>
        <span
          className={step === "template" ? "text-gray-900 font-medium" : ""}
        >
          2. Pick template
        </span>
      </div>

      {step === "scope" ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-medium text-gray-500 mb-1">
                Which level?
              </label>
              <Combobox
                placeholder="All levels (fallback)"
                emptyMessage="No levels"
                value={levelId}
                onChange={setLevelId}
                options={levelOptions}
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-500 mb-1">
                Which relationship?
              </label>
              <Select
                value={relationship ?? "__any__"}
                onValueChange={(v) =>
                  setRelationship(v === "__any__" ? null : v)
                }
              >
                <SelectTrigger className="h-11 text-[15px]">
                  <SelectValue placeholder="All relationships (fallback)" />
                </SelectTrigger>
                <SelectContent>
                  {RELATIONSHIP_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {!scopeValid && (
            <p className="text-[11px] text-gray-900">
              Narrow it down &mdash; pick at least a level or a relationship
              type.
            </p>
          )}
          {isDuplicate && (
            <InlineAlert variant="warning" className="py-2 text-[11px]">
              An override with this scope already exists. Adding will replace
              it.
            </InlineAlert>
          )}

          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              disabled={!scopeValid}
              onClick={() => setStep("template")}
              className="text-[12px] h-7"
            >
              Next
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="text-[12px] h-7"
            >
              Cancel
            </Button>
          </div>
        </>
      ) : (
        <>
          {/* Scope summary */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-gray-500">Scope:</span>
            <ScopePill
              label={
                effectiveLevelId
                  ? levelOptions.find((o) => o.value === effectiveLevelId)
                      ?.label ?? effectiveLevelId
                  : "All levels"
              }
              isWildcard={!effectiveLevelId}
            />
            <ScopePill
              label={
                effectiveRel
                  ? RELATIONSHIPS.find((r) => r.key === effectiveRel)?.label ??
                    effectiveRel
                  : "All relationships"
              }
              isWildcard={!effectiveRel}
            />
            <button
              type="button"
              onClick={() => setStep("scope")}
              className="text-[11px] text-gray-900 font-medium ml-1"
            >
              Change
            </button>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-1">
              Use which template?
            </label>
            <Combobox
              placeholder="Select template"
              emptyMessage="No templates"
              value={templateId}
              onChange={setTemplateId}
              onSearchChange={onTemplateSearch}
              loading={isSearchingTemplates}
              options={templateOptions}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => setStep("scope")}
              variant="ghost"
              className="text-[12px] h-7"
            >
              Back
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!templateId}
              onClick={() =>
                onAdd({
                  levelId: effectiveLevelId,
                  relationship: effectiveRel,
                  templateId: templateId!,
                })
              }
              className="text-[12px] h-7"
            >
              Add override
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Resolution Preview ──────────────────────────────────────

function ResolutionPreview({
  group,
  config,
  teamMembersCache,
  templateNameMap,
  perTeamMode,
}: {
  group: AssignmentGroup;
  config: GroupAdvancedConfig;
  teamMembersCache: Record<string, MemberInfo[]>;
  templateNameMap: Map<string, string>;
  perTeamMode: boolean;
}) {
  const [visible, setVisible] = useState(false);

  const members = useMemo(() => {
    const map = new Map<string, MemberInfo>();
    for (const teamId of group.teamIds) {
      for (const m of teamMembersCache[teamId] ?? []) {
        if (!map.has(m.userId) && m.role !== "EXTERNAL") {
          map.set(m.userId, m);
        }
      }
    }
    return Array.from(map.values());
  }, [group.teamIds, teamMembersCache]);

  const overrides = useMemo(() => {
    if (perTeamMode) return config.overrides[group.teamIds[0]] ?? [];
    for (const teamId of group.teamIds) {
      const arr = config.overrides[teamId];
      if (arr && arr.length > 0) return arr;
    }
    return [];
  }, [config.overrides, group.teamIds, perTeamMode]);

  const defaultTemplateId = group.templateId || null;
  const defaultName = defaultTemplateId
    ? templateNameMap.get(defaultTemplateId) ?? "Default"
    : "None";

  if (members.length === 0) return null;

  return (
    <div>
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-500 hover:text-gray-700"
      >
        {visible ? <EyeOff size={14} /> : <Eye size={14} />}
        {visible ? "Hide" : "Preview"} template resolution
      </button>

      {visible && (
        <div className="mt-3 space-y-2">
          {members.map((m) => {
            const resolutions = RELATIONSHIPS.map((r) => {
              const resolved = resolveTemplateClient(
                overrides,
                m.levelId,
                r.key,
                defaultTemplateId
              );
              return {
                relationship: r.label,
                templateName: resolved
                  ? templateNameMap.get(resolved) ?? "?"
                  : "\u2014",
                isOverridden: resolved !== defaultTemplateId,
              };
            });
            return (
              <div
                key={m.userId}
                className="border border-gray-100 bg-gray-50/30 px-3 py-2"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[12px] font-medium text-gray-800">
                    {m.name}
                  </span>
                  {m.levelName && (
                    <Badge variant="default" className="text-[10px] py-0">
                      {m.levelName}
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {resolutions.map((r) => (
                    <div
                      key={r.relationship}
                      className="flex items-center gap-1"
                    >
                      <span className="text-[10px] text-gray-400 w-[72px]">
                        {r.relationship}
                      </span>
                      <span
                        className={`text-[11px] ${
                          r.isOverridden
                            ? "text-gray-900 font-medium"
                            : "text-gray-500"
                        }`}
                      >
                        {r.templateName}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          <p className="text-[10px] text-gray-400 pl-1">
            <span className="text-gray-900 font-medium">Bold</span> = using an override
            instead of the default ({defaultName})
          </p>
        </div>
      )}
    </div>
  );
}
