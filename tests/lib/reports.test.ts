import { describe, it, expect, vi } from "vitest";

// Mock encryption for this file (reports uses decrypt internally)
vi.mock("@/lib/encryption", () => ({
  decrypt: vi.fn().mockReturnValue('{"q1":5,"q2":"Good"}'),
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
import { decrypt } from "@/lib/encryption";

const dataKey = Buffer.alloc(32, "k");

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

const responses: { reviewerId: string; subjectId: string; relationship: string; templateId: string; answers: Record<string, string | number | boolean>; submittedAt: Date }[] = [
  { reviewerId: "r1", subjectId: "s1", relationship: "peer", templateId: "t1", answers: { q1: 4, q2: "Great leader", q3: 5 }, submittedAt: new Date() },
  { reviewerId: "r2", subjectId: "s1", relationship: "manager", templateId: "t1", answers: { q1: 3, q2: "Needs work", q3: 4 }, submittedAt: new Date() },
  { reviewerId: "r3", subjectId: "s1", relationship: "self", templateId: "t1", answers: { q1: 5, q3: 5 }, submittedAt: new Date() },
];

describe("decryptResponse", () => {
  it("decrypts and parses JSON", () => {
    vi.mocked(decrypt).mockReturnValue('{"q1":5,"q2":"Good"}');

    const result = decryptResponse("enc", "iv", "tag", dataKey);

    expect(result).toEqual({ q1: 5, q2: "Good" });
    expect(decrypt).toHaveBeenCalledWith("enc", "iv", "tag", dataKey);
  });
});

describe("buildCategoryScores", () => {
  it("calculates average score per section", () => {
    const scores = buildCategoryScores(responses, sections);

    expect(scores).toHaveLength(2);
    expect(scores[0].category).toBe("Leadership");
    // (4+3+5)/3 = 4
    expect(scores[0].score).toBe(4);
    expect(scores[0].maxScore).toBe(5);

    expect(scores[1].category).toBe("Communication");
    // (5+4+5)/3 = 4.67
    expect(scores[1].score).toBe(4.67);
  });

  it("returns 0 for sections with no rating questions", () => {
    const textOnlySections = [
      { title: "Feedback", questions: [{ id: "q1", text: "Comments", type: "text" as const, required: false }] },
    ];
    const scores = buildCategoryScores(responses, textOnlySections);
    expect(scores[0].score).toBe(0);
  });
});

describe("buildRelationshipScores", () => {
  it("groups scores by relationship", () => {
    const scores = buildRelationshipScores(responses, sections);

    expect(scores.peer).toBe(4.5); // avg of (4+5)/2 = 4.5
    expect(scores.manager).toBe(3.5); // avg of (3+4)/2 = 3.5
    expect(scores.self).toBe(5); // avg of (5+5)/2 = 5
    expect(scores.directReport).toBeNull();
    expect(scores.external).toBeNull();
  });

  it("includes external relationship scores", () => {
    const withExternal = [
      ...responses,
      { reviewerId: "r4", subjectId: "s1", relationship: "external", templateId: "t1", answers: { q1: 4, q3: 3 }, submittedAt: new Date() },
    ];
    const scores = buildRelationshipScores(withExternal, sections);

    expect(scores.external).toBe(3.5); // avg of (4+3)/2 = 3.5
    expect(scores.peer).toBe(4.5);
    expect(scores.manager).toBe(3.5);
    expect(scores.self).toBe(5);
  });
});

describe("buildQuestionDetails", () => {
  it("builds distribution and average for rating questions", () => {
    const details = buildQuestionDetails(responses, sections);

    // Should include q1 and q3 (rating_scale), not q2 (text)
    expect(details).toHaveLength(2);

    const q1Detail = details.find((d) => d.questionId === "q1")!;
    expect(q1Detail.averageScore).toBe(4); // (4+3+5)/3
    expect(q1Detail.responseCount).toBe(3);
    expect(q1Detail.distribution).toEqual({ "3": 1, "4": 1, "5": 1 });
  });
});

describe("buildTextFeedback", () => {
  it("groups text answers by relationship", () => {
    const feedback = buildTextFeedback(responses, sections);

    // q2 is text type, only 2 responses have it
    expect(feedback.length).toBeGreaterThanOrEqual(1);
    const peerFeedback = feedback.find(
      (f) => f.questionId === "q2" && f.relationship === "peer"
    );
    expect(peerFeedback?.responses).toContain("Great leader");
  });

  it("ignores empty text answers", () => {
    const emptyResponses = [
      { reviewerId: "r1", subjectId: "s1", relationship: "peer", templateId: "t1", answers: { q2: "" }, submittedAt: new Date() },
    ];
    const feedback = buildTextFeedback(emptyResponses, sections);
    expect(feedback).toHaveLength(0);
  });
});

describe("calculateOverallScore", () => {
  it("calculates average of all rating scores", () => {
    const score = calculateOverallScore(responses, sections);
    // (4+5+3+4+5+5)/6 = 26/6 ≈ 4.33
    expect(score).toBe(4.33);
  });

  it("returns 0 when no rating responses", () => {
    const noRatingSections = [
      { title: "Text", questions: [{ id: "q1", text: "Comments", type: "text" as const, required: false }] },
    ];
    expect(calculateOverallScore(responses, noRatingSections)).toBe(0);
  });
});

// ─── Weighted Scoring Tests ───

const equalWeights: WeightConfig = {
  manager: 0.2,
  peer: 0.2,
  directReport: 0.2,
  self: 0.2,
  external: 0.2,
};

describe("applyWeightsToRelationshipAverages", () => {
  it("returns null when weights are null", () => {
    const groups = { manager: [4], peer: [3], direct_report: [], self: [], external: [] };
    expect(applyWeightsToRelationshipAverages(groups, null)).toBeNull();
  });

  it("applies weights and redistributes absent types", () => {
    // Only manager and peer have data
    const groups = {
      manager: [4],
      peer: [3],
      direct_report: [],
      self: [],
      external: [],
    };
    const weights: WeightConfig = { manager: 0.4, peer: 0.3, directReport: 0.1, self: 0.1, external: 0.1 };
    const result = applyWeightsToRelationshipAverages(groups, weights)!;

    // Absent weight = 0.1 + 0.1 + 0.1 = 0.3, present sum = 0.4 + 0.3 = 0.7
    // adj_manager = 0.4 + (0.4/0.7)*0.3 = 0.4 + 0.1714... ≈ 0.5714
    // adj_peer = 0.3 + (0.3/0.7)*0.3 = 0.3 + 0.1286... ≈ 0.4286
    // score = 4*0.5714 + 3*0.4286 = 2.2857 + 1.2857 = 3.57
    expect(result.score).toBe(3.57);
    expect(result.appliedWeights.directReport).toBe(0);
    expect(result.appliedWeights.self).toBe(0);
    expect(result.appliedWeights.external).toBe(0);
  });

  it("collapses all weight to single present type", () => {
    const groups = {
      manager: [4.5],
      peer: [],
      direct_report: [],
      self: [],
      external: [],
    };
    const weights: WeightConfig = { manager: 0.3, peer: 0.3, directReport: 0.2, self: 0.1, external: 0.1 };
    const result = applyWeightsToRelationshipAverages(groups, weights)!;

    expect(result.score).toBe(4.5);
    expect(result.appliedWeights.manager).toBeCloseTo(1.0);
  });

  it("returns 0 when all groups are empty", () => {
    const groups = { manager: [], peer: [], direct_report: [], self: [], external: [] };
    const result = applyWeightsToRelationshipAverages(groups, equalWeights)!;
    expect(result.score).toBe(0);
  });

  it("averages multiple responses within a relationship group", () => {
    const groups = {
      manager: [4, 5],  // avg = 4.5
      peer: [3],        // avg = 3
      direct_report: [],
      self: [],
      external: [],
    };
    const weights: WeightConfig = { manager: 0.6, peer: 0.4, directReport: 0, self: 0, external: 0 };
    const result = applyWeightsToRelationshipAverages(groups, weights)!;

    // manager avg = 4.5, peer avg = 3
    // No absent weight to redistribute (dr/self/ext have 0 weight)
    // score = 4.5*0.6 + 3*0.4 = 2.7 + 1.2 = 3.9
    expect(result.score).toBe(3.9);
  });
});

describe("calculateWeightedOverallScore", () => {
  it("returns null when weights are null", () => {
    expect(calculateWeightedOverallScore(responses, sections, null)).toBeNull();
  });

  it("calculates weighted score using relationship averages", () => {
    // responses: peer(q1:4,q3:5)=4.5, manager(q1:3,q3:4)=3.5, self(q1:5,q3:5)=5
    const weights: WeightConfig = { manager: 0.5, peer: 0.3, directReport: 0, self: 0.2, external: 0 };
    const result = calculateWeightedOverallScore(responses, sections, weights)!;

    // No absent groups with weight (dr=0, ext=0), so no redistribution
    // score = 3.5*0.5 + 4.5*0.3 + 5*0.2 = 1.75 + 1.35 + 1.0 = 4.1
    expect(result.score).toBe(4.1);
  });

  it("redistributes weight from absent external", () => {
    // responses have no external
    const weights: WeightConfig = { manager: 0.4, peer: 0.3, directReport: 0, self: 0.2, external: 0.1 };
    const result = calculateWeightedOverallScore(responses, sections, weights)!;

    // present: manager(0.4), peer(0.3), self(0.2) = 0.9, absent: ext(0.1)
    // adj_manager = 0.4 + (0.4/0.9)*0.1 ≈ 0.4444
    // adj_peer = 0.3 + (0.3/0.9)*0.1 ≈ 0.3333
    // adj_self = 0.2 + (0.2/0.9)*0.1 ≈ 0.2222
    // score = 3.5*0.4444 + 4.5*0.3333 + 5*0.2222 ≈ 1.5556 + 1.5 + 1.1111 ≈ 4.17
    expect(result.score).toBe(4.17);
  });

  it("returns 0 when no responses", () => {
    const weights: WeightConfig = { manager: 0.5, peer: 0.5, directReport: 0, self: 0, external: 0 };
    const result = calculateWeightedOverallScore([], sections, weights)!;
    expect(result.score).toBe(0);
  });
});

describe("buildWeightedCategoryScores", () => {
  it("returns null when weights are null", () => {
    expect(buildWeightedCategoryScores(responses, sections, null)).toBeNull();
  });

  it("applies weights per category section", () => {
    const weights: WeightConfig = { manager: 0.5, peer: 0.3, directReport: 0, self: 0.2, external: 0 };
    const result = buildWeightedCategoryScores(responses, sections, weights)!;

    expect(result).toHaveLength(2);

    // Leadership (q1): peer=4, manager=3, self=5
    // score = 3*0.5 + 4*0.3 + 5*0.2 = 1.5 + 1.2 + 1.0 = 3.7
    expect(result[0].category).toBe("Leadership");
    expect(result[0].score).toBe(3.7);
    expect(result[0].maxScore).toBe(5);

    // Communication (q3): peer=5, manager=4, self=5
    // score = 4*0.5 + 5*0.3 + 5*0.2 = 2.0 + 1.5 + 1.0 = 4.5
    expect(result[1].category).toBe("Communication");
    expect(result[1].score).toBe(4.5);
  });

  it("returns 0 for sections with no rating questions", () => {
    const textOnlySections = [
      { title: "Feedback", questions: [{ id: "q1", text: "Comments", type: "text" as const, required: false }] },
    ];
    const weights: WeightConfig = { manager: 0.5, peer: 0.5, directReport: 0, self: 0, external: 0 };
    const result = buildWeightedCategoryScores(responses, textOnlySections, weights)!;
    expect(result[0].score).toBe(0);
  });
});
