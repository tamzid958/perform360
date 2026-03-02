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

    // ── External role tests ──

    it("generates external -> member assignments", () => {
      const teams = [{
        id: "team-1",
        members: [
          { userId: "mgr-1", role: "MANAGER" as const },
          { userId: "mem-1", role: "MEMBER" as const },
          { userId: "mem-2", role: "MEMBER" as const },
          { userId: "ext-1", role: "EXTERNAL" as const },
        ],
      }];
      const templateMap = new Map([["team-1", "tpl-1"]]);
      const assignments = generateAssignmentsFromTeams(cycleId, teams, templateMap);

      const extToMember = assignments.filter(
        (a) => a.relationship === "external" && a.reviewerId === "ext-1" && ["mem-1", "mem-2"].includes(a.subjectId)
      );
      expect(extToMember).toHaveLength(2);
    });

    it("generates external -> manager assignments", () => {
      const teams = [{
        id: "team-1",
        members: [
          { userId: "mgr-1", role: "MANAGER" as const },
          { userId: "mem-1", role: "MEMBER" as const },
          { userId: "ext-1", role: "EXTERNAL" as const },
        ],
      }];
      const templateMap = new Map([["team-1", "tpl-1"]]);
      const assignments = generateAssignmentsFromTeams(cycleId, teams, templateMap);

      const extToManager = assignments.filter(
        (a) => a.relationship === "external" && a.reviewerId === "ext-1" && a.subjectId === "mgr-1"
      );
      expect(extToManager).toHaveLength(1);
    });

    it("does not generate member -> external assignments", () => {
      const teams = [{
        id: "team-1",
        members: [
          { userId: "mgr-1", role: "MANAGER" as const },
          { userId: "mem-1", role: "MEMBER" as const },
          { userId: "ext-1", role: "EXTERNAL" as const },
        ],
      }];
      const templateMap = new Map([["team-1", "tpl-1"]]);
      const assignments = generateAssignmentsFromTeams(cycleId, teams, templateMap);

      const toExternal = assignments.filter((a) => a.subjectId === "ext-1");
      expect(toExternal).toHaveLength(0);
    });

    it("does not generate peer assignments between externals", () => {
      const teams = [{
        id: "team-1",
        members: [
          { userId: "mgr-1", role: "MANAGER" as const },
          { userId: "ext-1", role: "EXTERNAL" as const },
          { userId: "ext-2", role: "EXTERNAL" as const },
        ],
      }];
      const templateMap = new Map([["team-1", "tpl-1"]]);
      const assignments = generateAssignmentsFromTeams(cycleId, teams, templateMap);

      const extPeer = assignments.filter(
        (a) => a.relationship === "peer" && (a.reviewerId === "ext-1" || a.reviewerId === "ext-2")
      );
      expect(extPeer).toHaveLength(0);
    });

    it("does not generate self-evaluation for external", () => {
      const teams = [{
        id: "team-1",
        members: [
          { userId: "mgr-1", role: "MANAGER" as const },
          { userId: "mem-1", role: "MEMBER" as const },
          { userId: "ext-1", role: "EXTERNAL" as const },
        ],
      }];
      const templateMap = new Map([["team-1", "tpl-1"]]);
      const assignments = generateAssignmentsFromTeams(cycleId, teams, templateMap);

      const extSelf = assignments.filter(
        (a) => a.relationship === "self" && a.reviewerId === "ext-1"
      );
      expect(extSelf).toHaveLength(0);
    });

    it("external evaluates both managers and members", () => {
      const teams = [{
        id: "team-1",
        members: [
          { userId: "mgr-1", role: "MANAGER" as const },
          { userId: "mgr-2", role: "MANAGER" as const },
          { userId: "mem-1", role: "MEMBER" as const },
          { userId: "mem-2", role: "MEMBER" as const },
          { userId: "ext-1", role: "EXTERNAL" as const },
        ],
      }];
      const templateMap = new Map([["team-1", "tpl-1"]]);
      const assignments = generateAssignmentsFromTeams(cycleId, teams, templateMap);

      const extAssignments = assignments.filter(
        (a) => a.relationship === "external" && a.reviewerId === "ext-1"
      );
      // 2 managers + 2 members = 4
      expect(extAssignments).toHaveLength(4);
      const subjects = extAssignments.map((a) => a.subjectId).sort();
      expect(subjects).toEqual(["mem-1", "mem-2", "mgr-1", "mgr-2"]);
    });
  });
});
