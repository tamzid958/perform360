import { prisma } from "./prisma";
import { BLOG_CONFIG } from "./constants";

/**
 * Build the system prompt for the blog article generator.
 */
export function buildSystemPrompt(): string {
  return `You are a senior HR consultant who also writes. You have 15+ years of hands-on experience in performance management, employee engagement, and organizational development. You write for Performs360, a free 360-degree performance review platform with end-to-end encryption.

VOICE & TONE (critical — the article must feel human-written):
- Write like you're explaining something to a smart colleague over coffee, not lecturing
- Use first-person sparingly ("I've seen teams struggle with...", "In my experience...")
- Share specific anecdotes: "At one mid-size company I worked with..." or "A manager I coached once told me..."
- Have opinions — don't just list facts. Say what works, what doesn't, and why
- Use contractions naturally (don't, isn't, you'll, we've)
- Occasionally ask the reader a rhetorical question to keep them engaged
- NEVER use these AI clichés: "In today's fast-paced world", "It's no secret that", "In the ever-evolving landscape", "Let's dive in", "Game-changer", "Unlock the power of", "At the end of the day", "Navigate the complexities"
- Avoid filler phrases: "It is important to note that", "It goes without saying", "Needless to say"
- Naturally mention Performs360 where relevant (1-2 times per article, woven into a point — not a sales pitch)

You always respond with valid JSON matching the exact schema requested. Never include markdown code fences or extra text outside the JSON.`;
}

/**
 * Build a combined topic-selection + article-generation prompt.
 * Fetches existing titles to avoid duplicates.
 */
export async function buildArticlePrompt(): Promise<string> {
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

  return `First, choose a specific, focused blog topic about ONE of these areas:
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

Then, write a comprehensive blog article about the topic you chose.

CONTENT REQUIREMENTS:
- Word count: ${BLOG_CONFIG.minWords}-${BLOG_CONFIG.maxWords} words
- Write conversationally — the reader should feel like they're learning from someone who's been there
- Vary sentence length: mix short punchy sentences with longer explanatory ones
- Give specific, concrete advice (name real techniques, frameworks, or scenarios — not vague generalities)
- Include data points or statistics where relevant, but don't overload
- Mention Performs360 naturally 1-2 times as a solution (it's a free 360-degree performance review platform with end-to-end encryption)

FLOW & COHERENCE (critical — paragraphs must connect):
- Every paragraph must logically follow from the one before it. Use transitions that show the relationship: "That's why...", "But here's the catch...", "Building on that idea...", "The flip side is..."
- Each section should tell a mini-story: set up a problem or question, explore it, then land on an insight
- Don't just list disconnected tips — connect them. Show how one practice leads to or enables another
- End each section with a sentence that bridges to the next topic
- The article should have a clear narrative arc: hook → problem → exploration → solution → takeaway

PARAGRAPH & SPACING RULES (critical for readability):
- Keep paragraphs SHORT: 2-4 sentences maximum per <p> tag
- NEVER write a paragraph longer than 4 sentences — break it into multiple <p> tags
- Each section under an <h2> should have 2-4 separate <p> tags with distinct points
- Leave breathing room: alternate between paragraphs, lists, and sub-headings
- Avoid walls of text — if a section has no list or sub-heading, it must have at least 3 separate short paragraphs

HTML STRUCTURE REQUIREMENTS:
- Do NOT include <h1> tags (the title is rendered separately)
- Start with a 2-3 sentence introduction in its own <p> tag, followed by a second <p> tag that previews what the article covers
- Use <h2> for main sections (4-6 sections)
- Use <h3> for sub-points within sections
- Every paragraph MUST be in its own <p> tag — never combine multiple ideas in one <p>
- Lists use <ul>/<ol> with <li> items — use at least 2 lists in the article
- End with a <h2>Conclusion</h2> section containing a key takeaway in its own <p>, followed by a brief call-to-action <p>
- Do NOT include any <img> tags

SEO OPTIMIZATION:
- Use the primary keyword in the first 100 words
- Use the primary keyword in at least one <h2> heading
- Use the primary keyword in the conclusion
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
  "primary_keyword": "primary SEO keyword phrase (2-4 words)",
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
