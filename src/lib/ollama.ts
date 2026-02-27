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

function buildHeaders(apiKey: string): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }
  return headers;
}

export interface OllamaConfig {
  apiUrl: string;
  apiKey: string;
  model: string;
}

/**
 * List available models from an Ollama instance.
 */
export async function listModelsWithConfig(
  config: Pick<OllamaConfig, "apiUrl" | "apiKey">
): Promise<{ name: string; size: number; details?: { parameter_size?: string } }[]> {
  const baseUrl = config.apiUrl.replace(/\/$/, "");

  const res = await fetch(`${baseUrl}/api/tags`, {
    method: "GET",
    headers: buildHeaders(config.apiKey),
  });

  if (!res.ok) {
    throw new Error(`Ollama /api/tags failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data.models ?? [];
}

/**
 * Generate text using an explicit Ollama config (for company-specific instances).
 */
export async function generateWithConfig(
  config: OllamaConfig,
  prompt: string,
  system?: string,
  options?: GenerateOptions
): Promise<string> {
  const baseUrl = config.apiUrl.replace(/\/$/, "");
  const headers = buildHeaders(config.apiKey);

  const body: Record<string, unknown> = {
    model: config.model,
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
    signal: AbortSignal.timeout(300_000),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(`Ollama generate failed (model: ${config.model}): ${res.status} ${errorText}`);
  }

  const data: OllamaGenerateResponse = await res.json();

  if (!data.response || data.response.trim().length === 0) {
    throw new Error(
      `Ollama returned empty response (model: ${config.model}, done: ${data.done}, done_reason: ${data.done_reason ?? "none"})`
    );
  }

  return data.response;
}
