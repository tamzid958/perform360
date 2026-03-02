import { describe, it, expect, vi } from "vitest";
import { generateAssignmentsFromTeams } from "@/lib/assignments";

// Mock generateToken to return predictable values
vi.mock("@/lib/tokens", () => {
  let counter = 0;
  return {
    generateToken: () => `token-${counter++}`,
  };
});

describe("assignments", () => {
  describe("generateAssignmentsFromTeams", () => {
    const cycleId = "cycle-1";

    it("generates manager -> member assignments", () => {
      const teams = [{
        id: "team-1",
        members: [
          { userId: "mgr-1", role: "MANAGER" as const },
          { userId: "mem-1", role: "MEMBER" as const },
          { userId: "mem-2", role: "MEMBER" as const },
        ],
      }];
      const templateMap = new Map([["team-1", "tpl-1"]]);
      const assignments = generateAssignmentsFromTeams(cycleId, teams, templateMap);

      const managerAssignments = assignments.filter((a) => a.relationship === "manager");
      expect(managerAssignments).toHaveLength(2);
      expect(managerAssignments.every((a) => a.reviewerId === "mgr-1")).toBe(true);
      expect(managerAssignments.map((a) => a.subjectId).sort()).toEqual(["mem-1", "mem-2"]);
    });

    it("generates member -> manager (direct_report) assignments", () => {
      const teams = [{
        id: "team-1",
        members: [
          { userId: "mgr-1", role: "MANAGER" as const },
          { userId: "mem-1", role: "MEMBER" as const },
        ],
      }];
      const templateMap = new Map([["team-1", "tpl-1"]]);
      const assignments = generateAssignmentsFromTeams(cycleId, teams, templateMap);

      const directReports = assignments.filter((a) => a.relationship === "direct_report");
      expect(directReports).toHaveLength(1);
      expect(directReports[0].reviewerId).toBe("mem-1");
      expect(directReports[0].subjectId).toBe("mgr-1");
    });

    it("generates peer assignments between members", () => {
      const teams = [{
        id: "team-1",
        members: [
          { userId: "mgr-1", role: "MANAGER" as const },
          { userId: "mem-1", role: "MEMBER" as const },
          { userId: "mem-2", role: "MEMBER" as const },
          { userId: "mem-3", role: "MEMBER" as const },
        ],
      }];
      const templateMap = new Map([["team-1", "tpl-1"]]);
      const assignments = generateAssignmentsFromTeams(cycleId, teams, templateMap);

      const peerAssignments = assignments.filter((a) => a.relationship === "peer");
      // 3 members x 2 peers each = 6 peer assignments
      expect(peerAssignments).toHaveLength(6);
    });

    it("generates self-evaluations for all unique members per template", () => {
      const teams = [{
        id: "team-1",
        members: [
          { userId: "mgr-1", role: "MANAGER" as const },
          { userId: "mem-1", role: "MEMBER" as const },
          { userId: "mem-2", role: "MEMBER" as const },
        ],
      }];
      const templateMap = new Map([["team-1", "tpl-1"]]);
      const assignments = generateAssignmentsFromTeams(cycleId, teams, templateMap);

      const selfAssignments = assignments.filter((a) => a.relationship === "self");
      expect(selfAssignments).toHaveLength(3);
      selfAssignments.forEach((a) => {
        expect(a.subjectId).toBe(a.reviewerId);
      });
    });

    it("deduplicates assignments across teams with same template", () => {
      const teams = [
        {
          id: "team-1",
          members: [
            { userId: "user-1", role: "MEMBER" as const },
            { userId: "user-2", role: "MEMBER" as const },
          ],
        },
        {
          id: "team-2",
          members: [
            { userId: "user-1", role: "MEMBER" as const },
            { userId: "user-2", role: "MEMBER" as const },
          ],
        },
      ];
      const templateMap = new Map([
        ["team-1", "tpl-1"],
        ["team-2", "tpl-1"],
      ]);
      const assignments = generateAssignmentsFromTeams(cycleId, teams, templateMap);

      // Without dedup: 2 peer + 2 peer + 2 self + 2 self = 8
      // With dedup: 2 peer + 2 self = 4
      const peerAssignments = assignments.filter((a) => a.relationship === "peer");
      const selfAssignments = assignments.filter((a) => a.relationship === "self");
      expect(peerAssignments).toHaveLength(2);
      expect(selfAssignments).toHaveLength(2);
    });

    it("allows same pair with different templates", () => {
      const teams = [
        {
          id: "team-1",
          members: [
            { userId: "user-1", role: "MEMBER" as const },
            { userId: "user-2", role: "MEMBER" as const },
          ],
        },
        {
          id: "team-2",
          members: [
            { userId: "user-1", role: "MEMBER" as const },
            { userId: "user-2", role: "MEMBER" as const },
          ],
        },
      ];
      const templateMap = new Map([
        ["team-1", "tpl-1"],
        ["team-2", "tpl-2"],
      ]);
      const assignments = generateAssignmentsFromTeams(cycleId, teams, templateMap);

      const peerAssignments = assignments.filter((a) => a.relationship === "peer");
      // 2 per template x 2 templates = 4
      expect(peerAssignments).toHaveLength(4);
    });

    it("skips teams without a template mapping", () => {
      const teams = [{
        id: "team-no-template",
        members: [
          { userId: "user-1", role: "MEMBER" as const },
          { userId: "user-2", role: "MEMBER" as const },
        ],
      }];
      const templateMap = new Map<string, string>();
      const assignments = generateAssignmentsFromTeams(cycleId, teams, templateMap);
      expect(assignments).toHaveLength(0);
    });

    it("returns empty for empty teams array", () => {
      const templateMap = new Map<string, string>();
      const assignments = generateAssignmentsFromTeams(cycleId, [], templateMap);
      expect(assignments).toHaveLength(0);
    });

    it("assigns unique tokens to each assignment", () => {
      const teams = [{
        id: "team-1",
        members: [
          { userId: "mgr-1", role: "MANAGER" as const },
          { userId: "mem-1", role: "MEMBER" as const },
          { userId: "mem-2", role: "MEMBER" as const },
        ],
      }];
      const templateMap = new Map([["team-1", "tpl-1"]]);
      const assignments = generateAssignmentsFromTeams(cycleId, teams, templateMap);

      const tokens = assignments.map((a) => a.token);
      expect(new Set(tokens).size).toBe(tokens.length);
    });

    it("sets cycleId on all assignments", () => {
      const teams = [{
        id: "team-1",
        members: [
          { userId: "user-1", role: "MEMBER" as const },
          { userId: "user-2", role: "MEMBER" as const },
        ],
      }];
      const templateMap = new Map([["team-1", "tpl-1"]]);
      const assignments = generateAssignmentsFromTeams(cycleId, teams, templateMap);
      expect(assignments.every((a) => a.cycleId === cycleId)).toBe(true);
    });
  });
});
