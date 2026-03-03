import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";

// Un-mock so we test the real implementation
vi.unmock("@/lib/company-cascade-delete");

// Must mock user.findMany separately since cascade-delete uses it for session lookup
// while setup.ts also mocks it generically
const { cascadeDeleteCompany } = await import("@/lib/company-cascade-delete");

describe("cascadeDeleteCompany", () => {
  beforeEach(() => vi.clearAllMocks());

  it("invalidates sessions for all company users", async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      { authUserId: "auth-1" },
      { authUserId: "auth-2" },
      { authUserId: null }, // user with no auth user
    ] as any);

    // Mock all subsequent deleteMany/delete calls
    vi.mocked(prisma.session.deleteMany).mockResolvedValue({ count: 2 } as any);
    vi.mocked(prisma.otpSession.deleteMany).mockResolvedValue({ count: 0 } as any);
    vi.mocked(prisma.evaluationResponse.deleteMany).mockResolvedValue({ count: 0 } as any);
    vi.mocked(prisma.evaluationAssignment.deleteMany).mockResolvedValue({ count: 0 } as any);
    vi.mocked(prisma.cycleTeam.deleteMany).mockResolvedValue({ count: 0 } as any);
    vi.mocked(prisma.evaluationCycle.deleteMany).mockResolvedValue({ count: 0 } as any);
    vi.mocked(prisma.teamMember.deleteMany).mockResolvedValue({ count: 0 } as any);
    vi.mocked(prisma.team.deleteMany).mockResolvedValue({ count: 0 } as any);
    vi.mocked(prisma.evaluationTemplate.deleteMany).mockResolvedValue({ count: 0 } as any);
    vi.mocked(prisma.recoveryCode.deleteMany).mockResolvedValue({ count: 0 } as any);
    vi.mocked(prisma.auditLog.deleteMany).mockResolvedValue({ count: 0 } as any);
    vi.mocked(prisma.user.deleteMany).mockResolvedValue({ count: 0 } as any);
    vi.mocked(prisma.company.delete).mockResolvedValue({} as any);

    await cascadeDeleteCompany("co-1");

    expect(prisma.session.deleteMany).toHaveBeenCalledWith({
      where: { userId: { in: ["auth-1", "auth-2"] } },
    });
  });

  it("skips session deletion when no users have authUserId", async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      { authUserId: null },
    ] as any);

    vi.mocked(prisma.otpSession.deleteMany).mockResolvedValue({ count: 0 } as any);
    vi.mocked(prisma.evaluationResponse.deleteMany).mockResolvedValue({ count: 0 } as any);
    vi.mocked(prisma.evaluationAssignment.deleteMany).mockResolvedValue({ count: 0 } as any);
    vi.mocked(prisma.cycleTeam.deleteMany).mockResolvedValue({ count: 0 } as any);
    vi.mocked(prisma.evaluationCycle.deleteMany).mockResolvedValue({ count: 0 } as any);
    vi.mocked(prisma.teamMember.deleteMany).mockResolvedValue({ count: 0 } as any);
    vi.mocked(prisma.team.deleteMany).mockResolvedValue({ count: 0 } as any);
    vi.mocked(prisma.evaluationTemplate.deleteMany).mockResolvedValue({ count: 0 } as any);
    vi.mocked(prisma.recoveryCode.deleteMany).mockResolvedValue({ count: 0 } as any);
    vi.mocked(prisma.auditLog.deleteMany).mockResolvedValue({ count: 0 } as any);
    vi.mocked(prisma.user.deleteMany).mockResolvedValue({ count: 0 } as any);
    vi.mocked(prisma.company.delete).mockResolvedValue({} as any);

    await cascadeDeleteCompany("co-1");

    expect(prisma.session.deleteMany).not.toHaveBeenCalled();
  });

  it("deletes entities in correct leaf-to-root order", async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([] as any);

    const callOrder: string[] = [];
    const trackDelete = (name: string) => async () => { callOrder.push(name); return { count: 0 }; };

    (prisma.otpSession.deleteMany as any).mockImplementation(trackDelete("otpSession"));
    (prisma.evaluationResponse.deleteMany as any).mockImplementation(trackDelete("evaluationResponse"));
    (prisma.evaluationAssignment.deleteMany as any).mockImplementation(trackDelete("evaluationAssignment"));
    (prisma.cycleTeam.deleteMany as any).mockImplementation(trackDelete("cycleTeam"));
    (prisma.evaluationCycle.deleteMany as any).mockImplementation(trackDelete("evaluationCycle"));
    (prisma.teamMember.deleteMany as any).mockImplementation(trackDelete("teamMember"));
    (prisma.team.deleteMany as any).mockImplementation(trackDelete("team"));
    (prisma.evaluationTemplate.deleteMany as any).mockImplementation(trackDelete("evaluationTemplate"));
    (prisma.recoveryCode.deleteMany as any).mockImplementation(trackDelete("recoveryCode"));
    (prisma.auditLog.deleteMany as any).mockImplementation(trackDelete("auditLog"));
    (prisma.user.deleteMany as any).mockImplementation(trackDelete("user"));
    (prisma.company.delete as any).mockImplementation(async () => { callOrder.push("company"); return {}; });

    await cascadeDeleteCompany("co-1");

    // OTP and responses must come before assignments
    expect(callOrder.indexOf("otpSession")).toBeLessThan(callOrder.indexOf("evaluationAssignment"));
    expect(callOrder.indexOf("evaluationResponse")).toBeLessThan(callOrder.indexOf("evaluationAssignment"));

    // Assignments before cycles
    expect(callOrder.indexOf("evaluationAssignment")).toBeLessThan(callOrder.indexOf("evaluationCycle"));

    // CycleTeams before cycles
    expect(callOrder.indexOf("cycleTeam")).toBeLessThan(callOrder.indexOf("evaluationCycle"));

    // TeamMembers before teams
    expect(callOrder.indexOf("teamMember")).toBeLessThan(callOrder.indexOf("team"));

    // Users before company
    expect(callOrder.indexOf("user")).toBeLessThan(callOrder.indexOf("company"));

    // Company is last
    expect(callOrder[callOrder.length - 1]).toBe("company");
  });

  it("scopes all deletions to the given companyId", async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([] as any);
    vi.mocked(prisma.otpSession.deleteMany).mockResolvedValue({ count: 0 } as any);
    vi.mocked(prisma.evaluationResponse.deleteMany).mockResolvedValue({ count: 0 } as any);
    vi.mocked(prisma.evaluationAssignment.deleteMany).mockResolvedValue({ count: 0 } as any);
    vi.mocked(prisma.cycleTeam.deleteMany).mockResolvedValue({ count: 0 } as any);
    vi.mocked(prisma.evaluationCycle.deleteMany).mockResolvedValue({ count: 0 } as any);
    vi.mocked(prisma.teamMember.deleteMany).mockResolvedValue({ count: 0 } as any);
    vi.mocked(prisma.team.deleteMany).mockResolvedValue({ count: 0 } as any);
    vi.mocked(prisma.evaluationTemplate.deleteMany).mockResolvedValue({ count: 0 } as any);
    vi.mocked(prisma.recoveryCode.deleteMany).mockResolvedValue({ count: 0 } as any);
    vi.mocked(prisma.auditLog.deleteMany).mockResolvedValue({ count: 0 } as any);
    vi.mocked(prisma.user.deleteMany).mockResolvedValue({ count: 0 } as any);
    vi.mocked(prisma.company.delete).mockResolvedValue({} as any);

    await cascadeDeleteCompany("co-99");

    // Verify companyId is used in direct deletions
    expect(prisma.evaluationCycle.deleteMany).toHaveBeenCalledWith({
      where: { companyId: "co-99" },
    });
    expect(prisma.team.deleteMany).toHaveBeenCalledWith({
      where: { companyId: "co-99" },
    });
    expect(prisma.user.deleteMany).toHaveBeenCalledWith({
      where: { companyId: "co-99" },
    });
    expect(prisma.company.delete).toHaveBeenCalledWith({
      where: { id: "co-99" },
    });
  });
});
