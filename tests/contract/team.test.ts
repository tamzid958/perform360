import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { prisma, setupTestDatabase, cleanDatabase, factories } from "./setup";

beforeAll(async () => {
  await setupTestDatabase();
});

beforeEach(async () => {
  await cleanDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Contract: Team", () => {
  it("creates a team linked to a company", async () => {
    const company = await factories.company();
    const team = await factories.team(company.id, { name: "Engineering" });

    expect(team.companyId).toBe(company.id);
    expect(team.name).toBe("Engineering");
  });

  it("allows optional description and archivedAt", async () => {
    const company = await factories.company();
    const team = await factories.team(company.id);

    expect(team.description).toBeNull();
    expect(team.archivedAt).toBeNull();
  });
});

describe("Contract: TeamMember", () => {
  it("creates team members with roles", async () => {
    const company = await factories.company();
    const user = await factories.user(company.id);
    const team = await factories.team(company.id);

    const member = await prisma.teamMember.create({
      data: { userId: user.id, teamId: team.id, role: "MANAGER" },
    });

    expect(member.role).toBe("MANAGER");
  });

  it("enforces unique userId+teamId constraint", async () => {
    const company = await factories.company();
    const user = await factories.user(company.id);
    const team = await factories.team(company.id);

    await prisma.teamMember.create({
      data: { userId: user.id, teamId: team.id, role: "MEMBER" },
    });

    await expect(
      prisma.teamMember.create({
        data: { userId: user.id, teamId: team.id, role: "MANAGER" },
      })
    ).rejects.toThrow(/Unique constraint/i);
  });

  it("validates TeamMemberRole enum values", async () => {
    const company = await factories.company();
    const team = await factories.team(company.id);

    for (const role of ["MANAGER", "MEMBER"] as const) {
      const user = await factories.user(company.id, {
        email: `${role.toLowerCase()}-tm@test.com`,
      });
      const tm = await prisma.teamMember.create({
        data: { userId: user.id, teamId: team.id, role },
      });
      expect(tm.role).toBe(role);
    }
  });
});
