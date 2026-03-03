import { prisma } from "../prisma";
import { generate } from "../ollama";
import {
  buildSystemPrompt,
  buildTopicPrompt,
  buildArticlePrompt,
  validateArticleSchema,
  type ArticleOutput,
} from "../blog-prompt";
import { sanitizeHtml, sanitizeSlug } from "../blog-utils";
import type { BlogGeneratePayload } from "@/types/job";

/**
 * Generate blog articles via Ollama and save to database.
 * Continues generating remaining articles even if one fails.
 */
export async function handleBlogGenerate(
  payload: BlogGeneratePayload
): Promise<void> {
  const { count } = payload;
  const systemPrompt = buildSystemPrompt();
  let successCount = 0;
  const errors: string[] = [];

  for (let i = 0; i < count; i++) {
    try {
      console.log(`[BlogGenerate] Generating article ${i + 1}/${count}...`);

      // Step 1: Generate a unique topic
      const topicPrompt = await buildTopicPrompt();
      const topicRaw = await generate(topicPrompt, systemPrompt, {
        temperature: 0.9,
        numPredict: 256,
      });

      const topicData = parseJson(topicRaw);
      if (!topicData?.topic || !topicData?.target_keyword) {
        throw new Error(
          `Invalid topic response: ${topicRaw.substring(0, 200)}`
        );
      }

      console.log(
        `[BlogGenerate] Topic: "${topicData.topic}" (keyword: "${topicData.target_keyword}")`
      );

      // Step 2: Generate full article
      const articlePrompt = buildArticlePrompt(
        topicData.topic as string,
        topicData.target_keyword as string
      );
      const articleRaw = await generate(articlePrompt, systemPrompt, {
        temperature: 0.7,
        numPredict: 4096,
        numCtx: 8192,
      });

      const articleRawData = parseJson(articleRaw);
      if (!articleRawData || !validateArticleSchema(articleRawData)) {
        throw new Error(
          `Invalid article response: missing required fields. Keys: ${Object.keys(articleRawData ?? {}).join(", ")}`
        );
      }

      const articleData = articleRawData as unknown as ArticleOutput;

      // Step 3: Sanitize content and ensure unique slug
      const cleanHtml = sanitizeHtml(articleData.content_html);
      const slug = await ensureUniqueSlug(articleData.slug);

      // Step 4: Save to database
      await prisma.blogPost.create({
        data: {
          title: articleData.title,
          slug,
          excerpt: articleData.excerpt,
          contentHtml: cleanHtml,
          metaTitle: articleData.meta_title,
          metaDescription: articleData.meta_description,
          primaryKeyword: articleData.primary_keyword,
          semanticKeywords: articleData.semantic_keywords,
          status: "PUBLISHED",
          publishedAt: new Date(),
        },
      });

      successCount++;
      console.log(
        `[BlogGenerate] Article ${i + 1} saved: "${articleData.title}"`
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`Article ${i + 1}: ${message}`);
      console.error(`[BlogGenerate] Article ${i + 1} failed: ${message}`);
    }
  }

  console.log(
    `[BlogGenerate] Done. ${successCount}/${count} articles generated.`
  );

  if (successCount === 0) {
    throw new Error(
      `All ${count} articles failed to generate. Errors: ${errors.join("; ")}`
    );
  }
}

/**
 * Parse JSON from Ollama response, handling common formatting issues
 * like markdown code fences or surrounding prose.
 */
function parseJson(raw: string): Record<string, unknown> | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Direct parse
  try {
    return JSON.parse(trimmed);
  } catch {
    // Strip markdown code fences (```json ... ``` or ``` ... ```)
    const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) {
      try {
        return JSON.parse(fenceMatch[1].trim());
      } catch {
        // fall through
      }
    }

    // Greedy match: extract the outermost { ... } block
    const braceMatch = trimmed.match(/\{[\s\S]*\}/);
    if (braceMatch) {
      try {
        return JSON.parse(braceMatch[0]);
      } catch {
        return null;
      }
    }

    return null;
  }
}

/**
 * Ensure slug is unique by batch-checking existing slugs.
 */
async function ensureUniqueSlug(baseSlug: string): Promise<string> {
  const slug = sanitizeSlug(baseSlug) || `post-${Date.now()}`;

  // Batch query: find all slugs that start with this base slug
  const existing = await prisma.blogPost.findMany({
    where: {
      slug: { startsWith: slug },
    },
    select: { slug: true },
  });

  const existingSlugs = new Set(existing.map((p) => p.slug));

  if (!existingSlugs.has(slug)) return slug;

  // Append numeric suffix
  let counter = 2;
  while (counter <= 100) {
    const candidate = `${slug}-${counter}`;
    if (!existingSlugs.has(candidate)) return candidate;
    counter++;
  }

  return `${slug}-${Date.now()}`;
}
