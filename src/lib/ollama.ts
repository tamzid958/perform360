import { prisma } from "./prisma";
import { decryptApiKey } from "./blog-utils";

interface OllamaModel {
  name: string;
  model: string;
  size: number;
  details?: {
    parameter_size?: string;
    family?: string;
  };
}

interface OllamaGenerateResponse {
  model: string;
  response: string;
  done: boolean;
  done_reason?: string;
  total_duration?: number;
  eval_count?: number;
}

interface GenerateOptions {
  temperature?: number;
  numPredict?: number;
  numCtx?: number;
  topP?: number;
}

async function getBlogSettings() {
  const settings = await prisma.blogSettings.findUnique({
    where: { id: "singleton" },
  });

  if (!settings || !settings.ollamaApiUrl) {
    throw new Error(
      "Blog settings not configured. Set Ollama API URL in SuperAdmin > Blog settings."
    );
  }

  // Decrypt the API key
  const apiKey = decryptApiKey(settings.ollamaApiKey);

  return { ...settings, ollamaApiKey: apiKey };
}

function buildHeaders(apiKey: string): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }
  return headers;
}

/**
 * List available models from Ollama API.
 */
export async function listModels(): Promise<OllamaModel[]> {
  const settings = await getBlogSettings();
  const baseUrl = settings.ollamaApiUrl.replace(/\/$/, "");

  const res = await fetch(`${baseUrl}/api/tags`, {
    method: "GET",
    headers: buildHeaders(settings.ollamaApiKey),
  });

  if (!res.ok) {
    throw new Error(`Ollama /api/tags failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data.models ?? [];
}

/**
 * Generate text via Ollama /api/generate with model fallback.
 * Tries preferred model first, then iterates through available models.
 */
export async function generate(
  prompt: string,
  system?: string,
  options?: GenerateOptions
): Promise<string> {
  const settings = await getBlogSettings();
  const baseUrl = settings.ollamaApiUrl.replace(/\/$/, "");
  const headers = buildHeaders(settings.ollamaApiKey);

  // Build ordered model list: preferred first, then available models
  const modelsToTry: string[] = [];

  if (settings.ollamaModel) {
    modelsToTry.push(settings.ollamaModel);
  }

  // Fetch available models and add any not already in the list
  try {
    const available = await listModels();
    for (const m of available) {
      if (!modelsToTry.includes(m.name)) {
        modelsToTry.push(m.name);
      }
    }
  } catch {
    // If listing fails but we have a preferred model, continue with it
    if (modelsToTry.length === 0) {
      throw new Error("No Ollama models available and /api/tags failed");
    }
  }

  if (modelsToTry.length === 0) {
    throw new Error("No Ollama models available");
  }

  let lastError: Error | null = null;

  for (const model of modelsToTry) {
    try {
      const body: Record<string, unknown> = {
        model,
        prompt,
        stream: false,
        options: {
          temperature: options?.temperature ?? 0.7,
          num_predict: options?.numPredict ?? 4096,
          num_ctx: options?.numCtx ?? 8192,
          top_p: options?.topP ?? 0.9,
        },
      };

      if (system) {
        body.system = system;
      }

      const res = await fetch(`${baseUrl}/api/generate`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(300_000), // 5 min timeout
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => "");
        throw new Error(
          `Ollama generate failed (model: ${model}): ${res.status} ${errorText}`
        );
      }

      const data: OllamaGenerateResponse = await res.json();
      console.log(
        `[Ollama] Generated with model=${model}, tokens=${data.eval_count ?? "?"}`
      );
      return data.response;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(
        `[Ollama] Model ${model} failed: ${lastError.message}. Trying next model...`
      );
    }
  }

  throw new Error(
    `All Ollama models failed. Last error: ${lastError?.message}`
  );
}
