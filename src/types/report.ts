export interface RelationshipWeights {
  manager: number;
  peer: number;
  directReport: number;
  self: number;
  external: number;
}

export interface TeamBreakdown {
  teamId: string;
  teamName: string;
  overallScore: number;
  weightedOverallScore: number | null;
  appliedWeights: RelationshipWeights | null;
  categoryScores: CategoryScore[];
  weightedCategoryScores: CategoryScore[] | null;
  scoresByRelationship: RelationshipScores;
  questionDetails: QuestionDetail[];
  textFeedback: TextFeedbackGroup[];
  calibrationOffset: number | null;
  calibratedScore: number | null;
  calibrationJustification: string | null;
}

export interface SubjectContext {
  role: string;
  level: string | null;
  teams: { id: string; name: string; level: string | null }[];
}

export interface ResponseRate {
  total: number;
  completed: number;
  rate: number;
}

export interface ReviewerBreakdownItem {
  relationship: string;
  total: number;
  completed: number;
}

export interface SelfVsOthersItem {
  category: string;
  selfScore: number | null;
  othersScore: number | null;
  gap: number | null;
  insight: "blind_spot" | "hidden_strength" | "aligned" | null;
}

export interface IndividualReport {
  subjectId: string;
  subjectName: string;
  cycleId: string;
  cycleName: string;
  overallScore: number;
  weightedOverallScore: number | null;
  categoryScores: CategoryScore[];
  scoresByRelationship: RelationshipScores;
  questionDetails: QuestionDetail[];
  textFeedback: TextFeedbackGroup[];
  teamBreakdowns: TeamBreakdown[];
  calibratedScore: number | null;
  calibrationJustification: string | null;
  calibrationAdjustedBy: string | null;
  subjectContext: SubjectContext;
  responseRate: ResponseRate;
  reviewerBreakdown: ReviewerBreakdownItem[];
  selfVsOthers: SelfVsOthersItem[];
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
  external: number | null;
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
  weightedOverallScore: number | null;
  reviewCount: number;
  completedCount: number;
  calibratedScore: number | null;
}

export interface TeamScore {
  teamId: string;
  teamName: string;
  avgScore: number;
  weightedAvgScore: number | null;
  calibratedAvgScore: number | null;
}

export interface SubmissionTrendPoint {
  date: string;
  count: number;
  cumulative: number;
}

export interface CycleReport {
  cycleId: string;
  cycleName: string;
  completionRate: number;
  teamCompletionRates: TeamCompletionRate[];
  scoreDistribution: number[];
  participationStats: ParticipationStats;
  individualSummaries: IndividualSummary[];
  avgScoreByTeam: TeamScore[];
  avgScoreByRelationship: RelationshipScores;
  submissionTrend: SubmissionTrendPoint[];
  isCalibrated: boolean;
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

// ── Person Performance Profile (cross-cycle) ──

export interface PersonCycleSummary {
  cycleId: string;
  cycleName: string;
  cycleStatus: string;
  startDate: string;
  endDate: string;
  overallScore: number;
  weightedOverallScore: number | null;
  calibratedScore: number | null;
  categoryScores: CategoryScore[];
  scoresByRelationship: RelationshipScores;
  responseRate: ResponseRate;
  reviewerBreakdown: ReviewerBreakdownItem[];
}

export interface PersonPerformanceProfile {
  userId: string;
  userName: string;
  email: string;
  avatar: string | null;
  role: string;
  teamMemberships: { teamId: string; teamName: string; role: string }[];

  cycleCount: number;
  latestScore: number | null;
  averageScore: number | null;
  highestScore: number | null;
  lowestScore: number | null;
  scoreTrend: number | null;
  avgResponseRate: number;

  cycles: PersonCycleSummary[];
  avgCategoryScores: CategoryScore[];
  avgRelationshipScores: RelationshipScores;
}
