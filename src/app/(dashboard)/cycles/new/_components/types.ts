export interface TeamOption {
  id: string;
  name: string;
}

export interface TemplateOption {
  id: string;
  name: string;
  isGlobal: boolean;
}

export interface LevelInfo {
  id: string;
  name: string;
}

export interface RelationshipWeightsInput {
  manager: number;
  peer: number;
  directReport: number;
  self: number;
  external: number;
}

export interface LevelTemplateEntry {
  levelId: string;
  relationship: string | null;
  templateId: string;
}

export interface AssignmentGroup {
  teamIds: string[];
  templateId: string;
}

export interface RelationshipTemplateEntry {
  relationship: string;
  templateId: string;
}

export interface TemplateOverride {
  levelId: string | null;
  relationship: string | null;
  templateId: string;
}

export type WeightPreset = "equal" | "supervisor_focus" | "peer_focus" | "custom";

export const WEIGHT_PRESETS: Record<
  WeightPreset,
  { label: string; description: string; member: RelationshipWeightsInput; manager: RelationshipWeightsInput }
> = {
  equal: {
    label: "Equal",
    description: "All relationships weighted equally",
    member:  { manager: 25, peer: 25, directReport: 0, self: 25, external: 25 },
    manager: { manager: 0, peer: 25, directReport: 35, self: 25, external: 15 },
  },
  supervisor_focus: {
    label: "Supervisor Focus",
    description: "Emphasizes boss / upward feedback",
    member:  { manager: 45, peer: 25, directReport: 0, self: 15, external: 15 },
    manager: { manager: 0, peer: 20, directReport: 45, self: 20, external: 15 },
  },
  peer_focus: {
    label: "Peer Focus",
    description: "Emphasizes lateral peer feedback",
    member:  { manager: 15, peer: 45, directReport: 0, self: 20, external: 20 },
    manager: { manager: 0, peer: 45, directReport: 25, self: 15, external: 15 },
  },
  custom: {
    label: "Custom",
    description: "Define your own weights",
    member:  { manager: 35, peer: 30, directReport: 0, self: 15, external: 20 },
    manager: { manager: 0, peer: 30, directReport: 35, self: 20, external: 15 },
  },
};

export interface GroupAdvancedConfig {
  weightPreset: WeightPreset | null;
  weights: RelationshipWeightsInput | null;
  managerWeights: RelationshipWeightsInput | null;
  overrides: Record<string, TemplateOverride[]>;
}

export function overrideSpecificity(o: TemplateOverride): number {
  if (o.levelId && o.relationship) return 0;
  if (o.levelId) return 1;
  if (o.relationship) return 2;
  return 3;
}

export const RELATIONSHIPS = [
  { key: "manager", label: "Manager" },
  { key: "direct_report", label: "Direct Report" },
  { key: "peer", label: "Peer" },
  { key: "self", label: "Self" },
  { key: "external", label: "External" },
] as const;

export const DEFAULT_WEIGHTS: RelationshipWeightsInput = {
  manager: 30,
  peer: 30,
  directReport: 20,
  self: 10,
  external: 10,
};

export function getWeightSum(weights: RelationshipWeightsInput): number {
  return (
    weights.manager +
    weights.peer +
    weights.directReport +
    weights.self +
    weights.external
  );
}
