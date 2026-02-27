export interface QuestionOption {
  label: string;
  value: string;
}

export interface TemplateQuestion {
  id: string;
  text: string;
  type: "rating_scale" | "text" | "multiple_choice";
  required: boolean;
  options?: string[];
  scaleMin?: number;
  scaleMax?: number;
  scaleLabels?: string[];
  conditionalOn?: string;
}

export interface TemplateSection {
  title: string;
  description?: string;
  questions: TemplateQuestion[];
}

export interface EvaluationFormData {
  answers: Record<string, string | number | boolean>;
}

export type RelationshipType = "manager" | "direct_report" | "peer" | "self";
