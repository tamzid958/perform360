import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { randomBytes } from "crypto";
import {
  checkRateLimit,
  rateLimitResponse,
  getClientIp,
  AUTH_RATE_LIMIT,
} from "@/lib/rate-limit";
import { requireRecaptcha } from "@/lib/recaptcha";

const registerSchema = z.object({
  companyName: z.string().min(2, "Company name must be at least 2 characters").max(100),
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Please enter a valid email address"),
});

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rl = checkRateLimit(`auth:register:${ip}`, AUTH_RATE_LIMIT);
    if (!rl.allowed) return rateLimitResponse(rl.retryAfterSeconds);
    const body = await request.json();

    const recaptchaError = await requireRecaptcha(body.recaptchaToken);
    if (recaptchaError) return recaptchaError;

    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { companyName, name, email } = parsed.data;

    // Generate unique slug
    let slug = slugify(companyName);
    const existingCompany = await prisma.company.findUnique({
      where: { slug },
    });
    if (existingCompany) {
      slug = `${slug}-${randomBytes(2).toString("hex")}`;
    }

    // Placeholder — admin sets real passphrase via the encryption setup wizard after first login
    const placeholderKey = "PLACEHOLDER_AWAITING_SETUP";

    // Create company, user, and auth user in a transaction
    await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: companyName,
          slug,
          encryptionKeyEncrypted: placeholderKey,
          encryptionSalt: null,
          encryptionSetupAt: null,
          keyVersion: 0,
        },
      });

      // Upsert AuthUser for NextAuth adapter compatibility
      const authUser = await tx.authUser.upsert({
        where: { email },
        create: { email, name },
        update: {},
      });

      await tx.user.create({
        data: {
          email,
          name,
          role: "ADMIN",
          companyId: company.id,
          authUserId: authUser.id,
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
