import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminOrHR, isAuthError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

const inviteSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["ADMIN", "HR", "MANAGER", "MEMBER"]),
});

export async function POST(request: NextRequest) {
  const authResult = await requireAdminOrHR();
  if (isAuthError(authResult)) return authResult;

  try {
    const body = await request.json();
    const validated = inviteSchema.parse(body);

    // Only ADMINs can create other ADMINs
    if (validated.role === "ADMIN" && authResult.role !== "ADMIN") {
      return NextResponse.json({
        success: false,
        error: "Only admins can assign the ADMIN role",
        code: "FORBIDDEN",
      }, { status: 403 });
    }

    // Check if user already exists in company
    const existingUser = await prisma.user.findUnique({
      where: {
        email_companyId: {
          email: validated.email,
          companyId: authResult.companyId,
        },
      },
    });

    if (existingUser) {
      return NextResponse.json({
        success: false,
        error: "A user with this email already exists in the company",
        code: "DUPLICATE",
      }, { status: 409 });
    }

    // Create User record and AuthUser in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create AuthUser if not exists (for NextAuth login)
      const existingAuthUser = await tx.authUser.findUnique({
        where: { email: validated.email },
      });

      if (!existingAuthUser) {
        await tx.authUser.create({
          data: {
            email: validated.email,
            name: validated.name,
          },
        });
      }

      // Create company User record
      const user = await tx.user.create({
        data: {
          email: validated.email,
          name: validated.name,
          role: validated.role,
          companyId: authResult.companyId,
        },
      });

      return user;
    });

    return NextResponse.json({
      success: true,
      data: result,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: "Validation failed",
        code: "VALIDATION_ERROR",
      }, { status: 400 });
    }
    return NextResponse.json({
      success: false,
      error: "Internal server error",
    }, { status: 500 });
  }
}
