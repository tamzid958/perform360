import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/encryption", () => ({
  decrypt: vi.fn().mockReturnValue('{"q1":5}'),
}));

import {
  decryptResponse,
  buildCategoryScores,
  buildRelationshipScores,
  buildQuestionDetails,
  buildTextFeedback,
  calculateOverallScore,
  applyWeightsToRelationshipAverages,
  calculateWeightedOverallScore,
  buildWeightedCategoryScores,
} from "@/lib/reports";
import type { WeightConfig } from "@/lib/reports";

const dataKey = Buffer.alloc(32, "k");

// ─── Shared Test Data ───

const sections = [
  {
    title: "Leadership",
    questions: [
      { id: "q1", text: "Rate leadership", type: "rating_scale" as const, required: true, scaleMax: 5 },
      { id: "q2", text: "Comments", type: "text" as const, required: false },
    ],
  },
  {
    title: "Communication",
    questions: [
      { id: "q3", text: "Rate communication", type: "rating_scale" as const, required: true, scaleMax: 5 },
    ],
  },
];

type TestResponse = {
  reviewerId: string;
  subjectId: string;
  relationship: string;
  templateId: string;
  answers: Record<string, string | number | boolean>;
  submittedAt: Date;
};

const responses: TestResponse[] = [
  { reviewerId: "r1", subjectId: "s1", relationship: "peer", templateId: "t1", answers: { q1: 4, q2: "Great leader", q3: 5 }, submittedAt: new Date() },
  { reviewerId: "r2", subjectId: "s1", relationship: "manager", templateId: "t1", answers: { q1: 3, q2: "Needs work", q3: 4 }, submittedAt: new Date() },
  { reviewerId: "r3", subjectId: "s1", relationship: "self", templateId: "t1", answers: { q1: 5, q3: 5 }, submittedAt: new Date() },
];

// ─── Weighted Scoring Edge Cases ───

describe("applyWeightsToRelationshipAverages — edge cases", () => {
  it("handles weights summing to slightly less than 1.0 (0.99)", () => {
    const groups = { manager: [4], peer: [3], direct_report: [], self: [], external: [] };
    const weights: WeightConfig = { manager: 0.5, peer: 0.49, directReport: 0, self: 0, external: 0 };
    const result = applyWeightsToRelationshipAverages(groups, weights)!;
    expect(result.score).toBeGreaterThan(0);
    expect(typeof result.score).toBe("number");
  });

  it("handles weights summing to slightly more than 1.0 (1.01)", () => {
    const groups = { manager: [4], peer: [3], direct_report: [], self: [], external: [] };
    const weights: WeightConfig = { manager: 0.51, peer: 0.5, directReport: 0, self: 0, external: 0 };
    const result = applyWeightsToRelationshipAverages(groups, weights)!;
    expect(result.score).toBeGreaterThan(0);
  });

  it("handles all 5 relationship types present with equal weights", () => {
    const groups = {
      manager: [4],
      peer: [3],
      direct_report: [5],
      self: [4],
      external: [2],
    };
    const weights: WeightConfig = { manager: 0.2, peer: 0.2, directReport: 0.2, self: 0.2, external: 0.2 };
    const result = applyWeightsToRelationshipAverages(groups, weights)!;

    // (4+3+5+4+2) * 0.2 each = 3.6
    expect(result.score).toBe(3.6);
    expect(result.appliedWeights.manager).toBeCloseTo(0.2);
    expect(result.appliedWeights.peer).toBeCloseTo(0.2);
    expect(result.appliedWeights.directReport).toBeCloseTo(0.2);
    expect(result.appliedWeights.self).toBeCloseTo(0.2);
    expect(result.appliedWeights.external).toBeCloseTo(0.2);
  });

  it("handles float precision with repeating decimals", () => {
    const groups = {
      manager: [4],
      peer: [4],
      direct_report: [4],
      self: [],
      external: [],
    };
    // 0.333... each = ~1.0
    const weights: WeightConfig = { manager: 1 / 3, peer: 1 / 3, directReport: 1 / 3, self: 0, external: 0 };
    const result = applyWeightsToRelationshipAverages(groups, weights)!;
    expect(result.score).toBe(4);
  });

  it("handles single response per relationship", () => {
    const groups = {
      manager: [5],
      peer: [],
      direct_report: [],
      self: [],
      external: [],
    };
    const weights: WeightConfig = { manager: 0.5, peer: 0.3, directReport: 0.1, self: 0.05, external: 0.05 };
    const result = applyWeightsToRelationshipAverages(groups, weights)!;
    expect(result.score).toBe(5);
    expect(result.appliedWeights.manager).toBeCloseTo(1.0);
  });

  it("handles multiple responses within groups (averaging correctly)", () => {
    const groups = {
      manager: [3, 4, 5],  // avg = 4
      peer: [2, 4],         // avg = 3
      direct_report: [],
      self: [],
      external: [],
    };
    const weights: WeightConfig = { manager: 0.6, peer: 0.4, directReport: 0, self: 0, external: 0 };
    const result = applyWeightsToRelationshipAverages(groups, weights)!;
    // 4*0.6 + 3*0.4 = 2.4 + 1.2 = 3.6
    expect(result.score).toBe(3.6);
  });

  it("returns score 0 when all present types have 0 values", () => {
    const groups = {
      manager: [0],
      peer: [0],
      direct_report: [],
      self: [],
      external: [],
    };
    const weights: WeightConfig = { manager: 0.5, peer: 0.5, directReport: 0, self: 0, external: 0 };
    const result = applyWeightsToRelationshipAverages(groups, weights)!;
    expect(result.score).toBe(0);
  });
});

describe("calculateWeightedOverallScore — edge cases", () => {
  it("handles responses with only text answers (no ratings)", () => {
    const textOnlyResponses: TestResponse[] = [
      { reviewerId: "r1", subjectId: "s1", relationship: "peer", templateId: "t1", answers: { q2: "Great" }, submittedAt: new Date() },
    ];
    const weights: WeightConfig = { manager: 0.5, peer: 0.5, directReport: 0, self: 0, external: 0 };
    const result = calculateWeightedOverallScore(textOnlyResponses, sections, weights)!;
    expect(result.score).toBe(0);
  });

  it("handles mixed sections: some with ratings, some text-only", () => {
    const mixedSections = [
      {
        title: "Feedback Only",
        questions: [{ id: "q10", text: "Comments", type: "text" as const, required: false }],
      },
      {
        title: "Rating",
        questions: [{ id: "q11", text: "Rate skill", type: "rating_scale" as const, required: true, scaleMax: 5 }],
      },
    ];
    const mixedResponses: TestResponse[] = [
      { reviewerId: "r1", subjectId: "s1", relationship: "peer", templateId: "t1", answers: { q10: "Good", q11: 4 }, submittedAt: new Date() },
    ];
    const weights: WeightConfig = { manager: 0, peer: 1.0, directReport: 0, self: 0, external: 0 };
    const result = calculateWeightedOverallScore(mixedResponses, mixedSections, weights)!;
    expect(result.score).toBe(4);
  });

  it("handles boundary scores: all 1s", () => {
    const lowResponses: TestResponse[] = [
      { reviewerId: "r1", subjectId: "s1", relationship: "peer", templateId: "t1", answers: { q1: 1, q3: 1 }, submittedAt: new Date() },
      { reviewerId: "r2", subjectId: "s1", relationship: "manager", templateId: "t1", answers: { q1: 1, q3: 1 }, submittedAt: new Date() },
    ];
    const weights: WeightConfig = { manager: 0.5, peer: 0.5, directReport: 0, self: 0, external: 0 };
    const result = calculateWeightedOverallScore(lowResponses, sections, weights)!;
    expect(result.score).toBe(1);
  });

  it("handles boundary scores: all 5s", () => {
    const highResponses: TestResponse[] = [
      { reviewerId: "r1", subjectId: "s1", relationship: "peer", templateId: "t1", answers: { q1: 5, q3: 5 }, submittedAt: new Date() },
      { reviewerId: "r2", subjectId: "s1", relationship: "manager", templateId: "t1", answers: { q1: 5, q3: 5 }, submittedAt: new Date() },
    ];
    const weights: WeightConfig = { manager: 0.5, peer: 0.5, directReport: 0, self: 0, external: 0 };
    const result = calculateWeightedOverallScore(highResponses, sections, weights)!;
    expect(result.score).toBe(5);
  });
});

describe("buildWeightedCategoryScores — edge cases", () => {
  it("handles single-question sections", () => {
    const singleQSection = [
      {
        title: "Solo",
        questions: [
          { id: "q1", text: "Only question", type: "rating_scale" as const, required: true, scaleMax: 5 },
        ],
      },
    ];
    const singleResponses: TestResponse[] = [
      { reviewerId: "r1", subjectId: "s1", relationship: "peer", templateId: "t1", answers: { q1: 4 }, submittedAt: new Date() },
    ];
    const weights: WeightConfig = { manager: 0, peer: 1.0, directReport: 0, self: 0, external: 0 };
    const result = buildWeightedCategoryScores(singleResponses, singleQSection, weights)!;
    expect(result).toHaveLength(1);
    expect(result[0].score).toBe(4);
    expect(result[0].category).toBe("Solo");
  });
});

// ─── Non-Weighted Edge Cases ───

describe("buildCategoryScores — edge cases", () => {
  it("handles section with scaleMax=10", () => {
    const scaledSections = [
      {
        title: "Scaled",
        questions: [
          { id: "q1", text: "Rate", type: "rating_scale" as const, required: true, scaleMax: 10 },
        ],
      },
    ];
    const scaledResponses: TestResponse[] = [
      { reviewerId: "r1", subjectId: "s1", relationship: "peer", templateId: "t1", answers: { q1: 8 }, submittedAt: new Date() },
    ];
    const scores = buildCategoryScores(scaledResponses, scaledSections);
    expect(scores[0].maxScore).toBe(10);
    expect(scores[0].score).toBe(8);
  });

  it("handles empty responses array", () => {
    const scores = buildCategoryScores([], sections);
    expect(scores).toHaveLength(2);
    expect(scores[0].score).toBe(0);
    expect(scores[1].score).toBe(0);
  });
});

describe("buildRelationshipScores — edge cases", () => {
  it("handles single response per relationship", () => {
    const singleResponses: TestResponse[] = [
      { reviewerId: "r1", subjectId: "s1", relationship: "peer", templateId: "t1", answers: { q1: 4, q3: 3 }, submittedAt: new Date() },
    ];
    const scores = buildRelationshipScores(singleResponses, sections);
    expect(scores.peer).toBe(3.5);
    expect(scores.manager).toBeNull();
    expect(scores.directReport).toBeNull();
  });

  it("returns all nulls for empty responses", () => {
    const scores = buildRelationshipScores([], sections);
    expect(scores.manager).toBeNull();
    expect(scores.peer).toBeNull();
    expect(scores.directReport).toBeNull();
    expect(scores.self).toBeNull();
    expect(scores.external).toBeNull();
  });
});

describe("buildQuestionDetails — edge cases", () => {
  it("tracks multiple_choice distribution", () => {
    const mcSections = [
      {
        title: "MC",
        questions: [
          { id: "q1", text: "Choose", type: "multiple_choice" as const, required: true, options: ["A", "B", "C"] },
        ],
      },
    ];
    const mcResponses: TestResponse[] = [
      { reviewerId: "r1", subjectId: "s1", relationship: "peer", templateId: "t1", answers: { q1: "A" }, submittedAt: new Date() },
      { reviewerId: "r2", subjectId: "s1", relationship: "peer", templateId: "t1", answers: { q1: "B" }, submittedAt: new Date() },
      { reviewerId: "r3", subjectId: "s1", relationship: "peer", templateId: "t1", answers: { q1: "A" }, submittedAt: new Date() },
    ];
    const details = buildQuestionDetails(mcResponses, mcSections);
    expect(details).toHaveLength(1);
    expect(details[0].distribution).toEqual({ A: 2, B: 1 });
    expect(details[0].averageScore).toBeNull();
    expect(details[0].responseCount).toBe(3);
  });

  it("returns empty array for text-only sections", () => {
    const textSections = [
      {
        title: "Text",
        questions: [
          { id: "q1", text: "Comments", type: "text" as const, required: false },
        ],
      },
    ];
    const details = buildQuestionDetails(responses, textSections);
    expect(details).toHaveLength(0);
  });
});

describe("buildTextFeedback — edge cases", () => {
  it("ignores whitespace-only text answers", () => {
    const whitespaceResponses: TestResponse[] = [
      { reviewerId: "r1", subjectId: "s1", relationship: "peer", templateId: "t1", answers: { q2: "   " }, submittedAt: new Date() },
      { reviewerId: "r2", subjectId: "s1", relationship: "peer", templateId: "t1", answers: { q2: "\t\n" }, submittedAt: new Date() },
    ];
    const feedback = buildTextFeedback(whitespaceResponses, sections);
    expect(feedback).toHaveLength(0);
  });

  it("handles responses with no text questions answered", () => {
    const noTextResponses: TestResponse[] = [
      { reviewerId: "r1", subjectId: "s1", relationship: "peer", templateId: "t1", answers: { q1: 4 }, submittedAt: new Date() },
    ];
    const feedback = buildTextFeedback(noTextResponses, sections);
    expect(feedback).toHaveLength(0);
  });

  it("groups feedback from multiple relationships separately", () => {
    const multiRelResponses: TestResponse[] = [
      { reviewerId: "r1", subjectId: "s1", relationship: "peer", templateId: "t1", answers: { q2: "Good from peer" }, submittedAt: new Date() },
      { reviewerId: "r2", subjectId: "s1", relationship: "manager", templateId: "t1", answers: { q2: "Good from mgr" }, submittedAt: new Date() },
      { reviewerId: "r3", subjectId: "s1", relationship: "peer", templateId: "t1", answers: { q2: "Another peer" }, submittedAt: new Date() },
    ];
    const feedback = buildTextFeedback(multiRelResponses, sections);
    const peerGroup = feedback.find((f) => f.relationship === "peer" && f.questionId === "q2");
    const mgrGroup = feedback.find((f) => f.relationship === "manager" && f.questionId === "q2");

    expect(peerGroup?.responses).toHaveLength(2);
    expect(mgrGroup?.responses).toHaveLength(1);
  });
});

describe("calculateOverallScore — edge cases", () => {
  it("single response, single question", () => {
    const singleSections = [
      {
        title: "Solo",
        questions: [{ id: "q1", text: "Rate", type: "rating_scale" as const, required: true, scaleMax: 5 }],
      },
    ];
    const singleResponses: TestResponse[] = [
      { reviewerId: "r1", subjectId: "s1", relationship: "peer", templateId: "t1", answers: { q1: 3 }, submittedAt: new Date() },
    ];
    expect(calculateOverallScore(singleResponses, singleSections)).toBe(3);
  });

  it("ignores non-numeric answers for rating questions", () => {
    const badResponses: TestResponse[] = [
      { reviewerId: "r1", subjectId: "s1", relationship: "peer", templateId: "t1", answers: { q1: "not a number", q3: 4 }, submittedAt: new Date() },
    ];
    const score = calculateOverallScore(badResponses, sections);
    expect(score).toBe(4);
  });
});
