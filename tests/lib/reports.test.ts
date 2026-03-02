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
} from "@/lib/reports";
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

const responses = [
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
