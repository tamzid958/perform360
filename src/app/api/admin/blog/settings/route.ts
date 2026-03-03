import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin, isAuthError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import {
  encryptApiKey,
  decryptApiKey,
  maskApiKey,
  validateOllamaUrl,
} from "@/lib/blog-utils";

/**
 * GET /api/admin/blog/settings — Get blog settings (Ollama config).
 */
export async function GET() {
  const auth = await requireSuperAdmin();
  if (isAuthError(auth)) return auth;

  const settings = await prisma.blogSettings.upsert({
    where: { id: "singleton" },
    create: {},
    update: {},
  });

  // Decrypt then mask API key for display
  const decryptedKey = decryptApiKey(settings.ollamaApiKey);

  return NextResponse.json({
    success: true,
    data: {
      ollamaApiUrl: settings.ollamaApiUrl,
      ollamaApiKey: maskApiKey(decryptedKey),
      ollamaModel: settings.ollamaModel,
      hasApiKey: !!settings.ollamaApiKey,
      generationPaused: settings.generationPaused,
    },
  });
}

/**
 * PUT /api/admin/blog/settings — Update blog settings.
 */
export async function PUT(req: NextRequest) {
  const auth = await requireSuperAdmin();
  if (isAuthError(auth)) return auth;

  const body = await req.json();
  const data: Record<string, string | boolean> = {};

  // Validate Ollama URL (SSRF prevention)
  if (body.ollamaApiUrl !== undefined) {
    if (body.ollamaApiUrl) {
      const urlCheck = validateOllamaUrl(body.ollamaApiUrl);
      if (!urlCheck.valid) {
        return NextResponse.json(
          { success: false, error: urlCheck.error },
          { status: 400 }
        );
      }
    }
    data.ollamaApiUrl = body.ollamaApiUrl;
  }

  // Encrypt API key before storing
  if (body.ollamaApiKey !== undefined) {
    data.ollamaApiKey = body.ollamaApiKey ? encryptApiKey(body.ollamaApiKey) : "";
  }

  if (body.ollamaModel !== undefined) data.ollamaModel = body.ollamaModel;
  if (body.generationPaused !== undefined) data.generationPaused = Boolean(body.generationPaused);

  const settings = await prisma.blogSettings.upsert({
    where: { id: "singleton" },
    create: data,
    update: data,
  });

  return NextResponse.json({
    success: true,
    data: {
      ollamaApiUrl: settings.ollamaApiUrl,
      ollamaModel: settings.ollamaModel,
      hasApiKey: !!settings.ollamaApiKey,
      generationPaused: settings.generationPaused,
    },
  });
}
