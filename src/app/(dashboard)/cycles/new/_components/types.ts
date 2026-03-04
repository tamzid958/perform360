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
  relationship: string;
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

export interface GroupAdvancedConfig {
  weights: RelationshipWeightsInput | null;
  teamLevelTemplates: Record<string, LevelTemplateEntry[]>;
  relationshipTemplates: RelationshipTemplateEntry[];
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
