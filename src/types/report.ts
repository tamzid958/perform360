export interface IndividualReport {
  subjectId: string;
  subjectName: string;
  cycleId: string;
  cycleName: string;
  overallScore: number;
  categoryScores: CategoryScore[];
  scoresByRelationship: RelationshipScores;
  questionDetails: QuestionDetail[];
  textFeedback: TextFeedbackGroup[];
}

export interface CategoryScore {
  category: string;
  score: number;
  maxScore: number;
}

export interface RelationshipScores {
  manager: number | null;
  peer: number | null;
  directReport: number | null;
  self: number | null;
}

export interface QuestionDetail {
  questionId: string;
  questionText: string;
  type: string;
  averageScore: number | null;
  distribution: Record<string, number>;
  responseCount: number;
}

export interface TextFeedbackGroup {
  questionId: string;
  questionText: string;
  relationship: string;
  responses: string[];
}

export interface IndividualSummary {
  subjectId: string;
  subjectName: string;
  overallScore: number;
  reviewCount: number;
  completedCount: number;
}

export interface CycleReport {
  cycleId: string;
  cycleName: string;
  completionRate: number;
  teamCompletionRates: TeamCompletionRate[];
  scoreDistribution: number[];
  participationStats: ParticipationStats;
  individualSummaries: IndividualSummary[];
}

export interface TeamCompletionRate {
  teamId: string;
  teamName: string;
  total: number;
  completed: number;
  rate: number;
}

export interface ParticipationStats {
  totalAssignments: number;
  completedAssignments: number;
  pendingAssignments: number;
  inProgressAssignments: number;
}
