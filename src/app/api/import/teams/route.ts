import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminOrHR, isAuthError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";
import { writeAuditLog } from "@/lib/audit";
import type { ImportResult } from "@/types/import";

const csvRowSchema = z.object({
  name: z.string().min(1),
  team: z.string().min(1),
  manager: z.string(),
  email: z.string(),
});

const importSchema = z.object({
  rows: z.array(csvRowSchema).min(1, "CSV must contain at least one row"),
});

export async function POST(request: NextRequest) {
  const rl = applyRateLimit(request);
  if (rl) return rl;

  const authResult = await requireAdminOrHR();
  if (isAuthError(authResult)) return authResult;

  try {
    const body = await request.json();
    const validated = importSchema.parse(body);
    const { companyId } = authResult;

    const validRows = validated.rows.filter(
      (r) => r.email.trim() !== "" && r.email.includes("@")
    );
    const skippedRows = validated.rows.filter(
      (r) => r.email.trim() === "" || !r.email.includes("@")
    );

    // Build manager lookup: managerName -> set of team names they manage
    const managerNamesPerTeam = new Map<string, Set<string>>();
    for (const row of validRows) {
      const mgrName = row.manager.trim();
      if (mgrName) {
        const teamName = row.team.trim();
        if (!managerNamesPerTeam.has(teamName)) {
          managerNamesPerTeam.set(teamName, new Set());
        }
        managerNamesPerTeam.get(teamName)!.add(mgrName);
      }
    }

    // Find manager names not present as rows with emails
    const validEmailNames = new Set(validRows.map((r) => r.name.trim()));
    const externalManagerNames = new Set<string>();
    Array.from(managerNamesPerTeam.values()).forEach((managers) => {
      Array.from(managers).forEach((mgrName) => {
        if (!validEmailNames.has(mgrName)) {
          externalManagerNames.add(mgrName);
        }
      });
    });

    const result = await prisma.$transaction(
      async (tx) => {
        const stats: ImportResult = {
          teamsCreated: 0,
          teamsExisted: 0,
          usersCreated: 0,
          usersExisted: 0,
          membershipsCreated: 0,
          membershipsExisted: 0,
          rowsSkipped: skippedRows.length,
          skippedDetails: skippedRows.map((r) => ({
            name: r.name,
            reason: "No email address",
          })),
          managersLinked: 0,
          managersNotFound: [],
        };

        // 1. Create teams
        const uniqueTeamNames = Array.from(
          new Set(validRows.map((r) => r.team.trim()))
        );
        const teamMap = new Map<string, string>();

        for (const teamName of uniqueTeamNames) {
          const existing = await tx.team.findFirst({
            where: { name: teamName, companyId },
          });
          if (existing) {
            teamMap.set(teamName, existing.id);
            stats.teamsExisted++;
          } else {
            const created = await tx.team.create({
              data: { name: teamName, companyId },
            });
            teamMap.set(teamName, created.id);
            stats.teamsCreated++;
          }
        }

        // 2. Create users (AuthUser + User per unique email)
        const nameByEmail = new Map<string, string>();
        for (const row of validRows) {
          const email = row.email.trim().toLowerCase();
          if (!nameByEmail.has(email)) {
            nameByEmail.set(email, row.name.trim());
          }
        }

        const userMap = new Map<string, string>(); // email -> userId
        for (const [email, name] of Array.from(nameByEmail.entries())) {
          const existingUser = await tx.user.findUnique({
            where: { email_companyId: { email, companyId } },
          });
          if (existingUser) {
            userMap.set(email, existingUser.id);
            stats.usersExisted++;
          } else {
            const authUser = await tx.authUser.upsert({
              where: { email },
              create: { email, name },
              update: {},
            });
            const newUser = await tx.user.create({
              data: {
                email,
                name,
                role: "MEMBER",
                companyId,
                authUserId: authUser.id,
              },
            });
            userMap.set(email, newUser.id);
            stats.usersCreated++;
          }
        }

        // 3. Resolve external managers (in Manager column but not a CSV row)
        const externalManagerUserIds = new Map<string, string>();
        for (const mgrName of Array.from(externalManagerNames)) {
          const found = await tx.user.findFirst({
            where: { name: mgrName, companyId },
          });
          if (found) {
            externalManagerUserIds.set(mgrName, found.id);
          } else {
            stats.managersNotFound.push(mgrName);
          }
        }

        // 4. Create team memberships for CSV rows
        for (const row of validRows) {
          const email = row.email.trim().toLowerCase();
          const teamName = row.team.trim();
          const personName = row.name.trim();
          const userId = userMap.get(email);
          const teamId = teamMap.get(teamName);

          if (!userId || !teamId) continue;

          const isManager =
            managerNamesPerTeam.get(teamName)?.has(personName) ?? false;
          const role = isManager ? "MANAGER" : "MEMBER";

          const existingMembership = await tx.teamMember.findUnique({
            where: { userId_teamId: { userId, teamId } },
          });
          if (existingMembership) {
            stats.membershipsExisted++;
          } else {
            await tx.teamMember.create({ data: { userId, teamId, role } });
            stats.membershipsCreated++;
          }
        }

        // 5. Create team memberships for external managers found in DB
        for (const [mgrName, mgrUserId] of Array.from(externalManagerUserIds.entries())) {
          for (const [teamName, managers] of Array.from(managerNamesPerTeam.entries())) {
            if (managers.has(mgrName)) {
              const teamId = teamMap.get(teamName);
              if (!teamId) continue;

              const existing = await tx.teamMember.findUnique({
                where: { userId_teamId: { userId: mgrUserId, teamId } },
              });
              if (!existing) {
                await tx.teamMember.create({
                  data: { userId: mgrUserId, teamId, role: "MANAGER" },
                });
                stats.managersLinked++;
              }
            }
          }
        }

        return stats;
      },
      { timeout: 30000 }
    );

    writeAuditLog({
      companyId: authResult.companyId,
      userId: authResult.userId,
      action: "bulk_import",
      metadata: {
        teamsCreated: result.teamsCreated,
        usersCreated: result.usersCreated,
        membershipsCreated: result.membershipsCreated,
        rowsSkipped: result.rowsSkipped,
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }
    console.error("[Import] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
