import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, requireRole, isAuthError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";
import {
  encryptSmtpPassword,
  invalidateSmtpConfigCache,
  SMTP_PASSWORD_MASK,
} from "@/lib/email";

const notificationSettingsSchema = z.object({
  evaluationInvitations: z.boolean(),
  submissionConfirmations: z.boolean(),
  cycleReminders: z.boolean(),
  cycleCompletion: z.boolean(),
});

const smtpSettingsSchema = z.object({
  host: z.string().min(1),
  port: z.number().int().min(1).max(65535),
  user: z.string().min(1),
  password: z.string().min(1),
  from: z.string().email(),
});

const updateCompanySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens only")
    .optional(),
  settings: z
    .object({
      notifications: notificationSettingsSchema.optional(),
      smtp: smtpSettingsSchema.optional(),
    })
    .optional(),
});

export async function GET(request: NextRequest) {
  const rl = applyRateLimit(request);
  if (rl) return rl;

  const authResult = await requireAuth();
  if (isAuthError(authResult)) return authResult;

  const company = await prisma.company.findUnique({
    where: { id: authResult.companyId },
    select: { id: true, name: true, slug: true, logo: true, settings: true },
  });

  if (!company) {
    return NextResponse.json({
      success: false,
      error: "Company not found",
      code: "NOT_FOUND",
    }, { status: 404 });
  }

  // Mask SMTP password before sending to client
  const settings = company.settings as Record<string, unknown> | null;
  if (settings?.smtp) {
    const smtp = settings.smtp as Record<string, unknown>;
    if (smtp.password) {
      settings.smtp = { ...smtp, password: SMTP_PASSWORD_MASK };
    }
  }

  return NextResponse.json({ success: true, data: { ...company, settings } });
}

export async function PATCH(request: NextRequest) {
  const rl = applyRateLimit(request);
  if (rl) return rl;

  const authResult = await requireRole("ADMIN");
  if (isAuthError(authResult)) return authResult;

  try {
    const body = await request.json();
    const validated = updateCompanySchema.parse(body);

    if (validated.slug) {
      const existing = await prisma.company.findUnique({
        where: { slug: validated.slug },
      });
      if (existing && existing.id !== authResult.companyId) {
        return NextResponse.json({
          success: false,
          error: "This slug is already taken",
          code: "DUPLICATE",
        }, { status: 409 });
      }
    }

    // Merge settings with existing rather than overwriting
    const updateData: Record<string, unknown> = {};
    if (validated.name !== undefined) updateData.name = validated.name;
    if (validated.slug !== undefined) updateData.slug = validated.slug;
    if (validated.settings !== undefined) {
      const existing = await prisma.company.findUnique({
        where: { id: authResult.companyId },
        select: { settings: true },
      });
      const existingSettings = (existing?.settings as Record<string, unknown>) ?? {};

      // Handle SMTP password: if masked, preserve existing encrypted password
      if (validated.settings.smtp) {
        if (validated.settings.smtp.password === SMTP_PASSWORD_MASK) {
          const existingSmtp = existingSettings.smtp as Record<string, unknown> | undefined;
          if (existingSmtp?.password) {
            validated.settings.smtp.password = existingSmtp.password as string;
          }
        } else {
          validated.settings.smtp.password = encryptSmtpPassword(
            validated.settings.smtp.password
          );
        }
      }

      updateData.settings = { ...existingSettings, ...validated.settings };
    }

    const company = await prisma.company.update({
      where: { id: authResult.companyId },
      data: updateData,
      select: { id: true, name: true, slug: true, logo: true, settings: true },
    });

    // Invalidate SMTP config cache if SMTP settings were updated
    if (validated.settings?.smtp) {
      invalidateSmtpConfigCache(authResult.companyId);
    }

    // Mask SMTP password in response
    const settings = company.settings as Record<string, unknown> | null;
    if (settings?.smtp) {
      const smtp = settings.smtp as Record<string, unknown>;
      if (smtp.password) {
        settings.smtp = { ...smtp, password: SMTP_PASSWORD_MASK };
      }
    }

    return NextResponse.json({ success: true, data: { ...company, settings } });
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
