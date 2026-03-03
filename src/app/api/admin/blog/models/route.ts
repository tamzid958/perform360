import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin, isAuthError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { decryptApiKey, validateOllamaUrl } from "@/lib/blog-utils";

/**
 * POST /api/admin/blog/models — Fetch available models from Ollama API.
 * Accepts optional url/apiKey overrides for unsaved config.
 */
export async function POST(req: NextRequest) {
  const auth = await requireSuperAdmin();
  if (isAuthError(auth)) return auth;

  const body = await req.json();

  // Use provided URL or fall back to stored settings
  const settings = await prisma.blogSettings.findUnique({
    where: { id: "singleton" },
  });

  const url = (body.ollamaApiUrl as string) || settings?.ollamaApiUrl;
  if (!url) {
    return NextResponse.json(
      { success: false, error: "Ollama API URL is required" },
      { status: 400 }
    );
  }

  const urlCheck = validateOllamaUrl(url);
  if (!urlCheck.valid) {
    return NextResponse.json(
      { success: false, error: urlCheck.error },
      { status: 400 }
    );
  }

  // Use provided key, or decrypt stored key
  let apiKey = "";
  if (body.ollamaApiKey) {
    apiKey = body.ollamaApiKey;
  } else if (settings?.ollamaApiKey) {
    apiKey = decryptApiKey(settings.ollamaApiKey);
  }

  const baseUrl = url.replace(/\/$/, "");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  try {
    const res = await fetch(`${baseUrl}/api/tags`, {
      method: "GET",
      headers,
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: `Ollama API returned ${res.status} ${res.statusText}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    const models: { name: string; size: number; parameterSize?: string; family?: string }[] =
      (data.models ?? []).map(
        (m: { name: string; size: number; details?: { parameter_size?: string; family?: string } }) => ({
          name: m.name,
          size: m.size,
          parameterSize: m.details?.parameter_size,
          family: m.details?.family,
        })
      );

    return NextResponse.json({ success: true, models });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: `Failed to fetch models: ${message}` },
      { status: 502 }
    );
  }
}
