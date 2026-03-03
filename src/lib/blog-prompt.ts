import { prisma } from "./prisma";
import { BLOG_CONFIG } from "./constants";

/**
 * Build the system prompt for the blog article generator.
 */
export function buildSystemPrompt(): string {
  return `You are an expert content writer specializing in performance management, HR technology, employee engagement, and organizational development. You write for Performs360, a free 360-degree performance review platform with end-to-end encryption.

Your writing demonstrates E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness):
- Share practical, actionable insights backed by industry knowledge
- Reference real-world scenarios and best practices
- Write in a professional yet approachable tone
- Naturally mention Performs360 where relevant (1-2 times per article, not forced)

You always respond with valid JSON matching the exact schema requested. Never include markdown code fences or extra text outside the JSON.`;
}

/**
 * Build a topic selection prompt that avoids existing titles.
 */
export async function buildTopicPrompt(): Promise<string> {
  const existingPosts = await prisma.blogPost.findMany({
    select: { title: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const existingTitles = existingPosts.map((p) => p.title);
  const titlesBlock =
    existingTitles.length > 0
      ? `\n\nEXISTING TITLES (do NOT repeat or closely rephrase these):\n${existingTitles.map((t) => `- ${t}`).join("\n")}`
      : "";

  return `Generate a specific, focused blog topic about ONE of these areas:
- 360-degree performance reviews and feedback
- Employee performance management strategies
- Team productivity and collaboration
- Manager coaching and leadership development
- Performance review best practices
- Employee engagement and retention
- Goal setting and OKRs
- Continuous feedback culture
- Remote/hybrid team performance management
- HR technology and digital transformation

The topic must be narrow and specific (not a broad category overview). It should be something a manager, HR professional, or team lead would search for.
${titlesBlock}

Respond with JSON:
{
  "topic": "The specific article topic/angle",
  "target_keyword": "primary SEO keyword phrase (2-4 words)"
}`;
}

/**
 * Build the full article generation prompt for a given topic.
 */
export function buildArticlePrompt(
  topic: string,
  targetKeyword: string
): string {
  return `Write a comprehensive blog article about: "${topic}"

PRIMARY KEYWORD: "${targetKeyword}"

CONTENT REQUIREMENTS:
- Word count: ${BLOG_CONFIG.minWords}-${BLOG_CONFIG.maxWords} words
- Professional, authoritative tone
- Actionable advice with specific examples
- Include data points or statistics where relevant
- Mention Performs360 naturally 1-2 times as a solution (it's a free 360-degree performance review platform with end-to-end encryption)

HTML STRUCTURE REQUIREMENTS:
- Do NOT include <h1> tags (the title is rendered separately)
- Start with a 2-3 sentence introduction in <p> tags
- Use <h2> for main sections (4-6 sections)
- Use <h3> for sub-points within sections
- All paragraphs in <p> tags
- Lists use <ul>/<ol> with <li> items
- End with a <h2>Conclusion</h2> section containing a key takeaway
- Do NOT include any <img> tags

SEO OPTIMIZATION:
- Primary keyword in the first 100 words
- Primary keyword in at least one <h2> heading
- Primary keyword in the conclusion
- Use 8+ semantically related keywords naturally throughout
- Write at grade 6-9 readability level
- Structure one section for featured snippet optimization (use a clear definition or numbered list)

Respond with this exact JSON schema:
{
  "title": "Engaging article title (50-65 characters)",
  "meta_title": "SEO-optimized page title (max 60 characters)",
  "slug": "url-friendly-slug-with-hyphens",
  "excerpt": "Compelling summary for card display (120-160 characters)",
  "content_html": "Full article HTML content following structure requirements above",
  "meta_description": "SEO meta description (150-160 characters)",
  "primary_keyword": "${targetKeyword}",
  "semantic_keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6", "keyword7", "keyword8"]
}`;
}

/**
 * Validate the parsed article JSON has all required fields.
 */
export function validateArticleSchema(
  data: Record<string, unknown>
): boolean {
  const requiredKeys = [
    "title",
    "meta_title",
    "slug",
    "excerpt",
    "content_html",
    "meta_description",
    "primary_keyword",
    "semantic_keywords",
  ];

  for (const key of requiredKeys) {
    if (!(key in data) || data[key] === null || data[key] === undefined) {
      return false;
    }
  }

  if (!Array.isArray(data.semantic_keywords)) {
    return false;
  }

  return true;
}

export interface ArticleOutput {
  title: string;
  meta_title: string;
  slug: string;
  excerpt: string;
  content_html: string;
  meta_description: string;
  primary_keyword: string;
  semantic_keywords: string[];
}
