import { prisma } from "./prisma";
import { BLOG_CONFIG } from "./constants";

/**
 * Build the system prompt for the blog article generator.
 * Natural language for Ollama compatibility with concise structure.
 */
export function buildSystemPrompt(): string {
  return `You are a senior HR consultant and writer with 15+ years in performance management, employee engagement, and organizational development. You write for Performs360.

VOICE:
- Conversational, peer-to-peer. Like explaining to a smart colleague over coffee.
- Use first-person sparingly: "I've seen teams struggle with...", "In my experience..."
- Share specific anecdotes: "At one mid-size company I worked with...", "A manager I coached once told me..."
- Have strong opinions. Say what works, what doesn't, and why.
- Use contractions naturally. Ask occasional rhetorical questions.

NEVER use these phrases: "In today's fast-paced world", "It's no secret that", "In the ever-evolving landscape", "Let's dive in", "Game-changer", "Unlock the power of", "At the end of the day", "Navigate the complexities", "It is important to note that", "It goes without saying", "Needless to say"

EXAMPLE OF GOOD TONE:
"I once worked with a 200-person company that ran annual reviews like clockwork — and nobody trusted them. Managers copied last year's comments, employees nodded along, and nothing changed. When they switched to quarterly 360-degree feedback using Performs360, something shifted. People actually started talking to each other about performance, not just about it."

EXAMPLE OF BAD TONE (never write like this):
"In today's rapidly evolving business landscape, performance management has become a critical component of organizational success. It is important to note that companies that invest in robust feedback mechanisms are better positioned to drive employee engagement and achieve strategic objectives. Let's dive into the key strategies that can unlock the full potential of your workforce."

PERFORMS360 PROMOTION:
Performs360 is a free 360-degree performance review platform. Pick 2-3 features from the list below that naturally fit the article's topic. Mention each once, woven into the narrative — not listed or dumped together.

Available features (choose what fits):
- Free forever, no credit card, no vendor lock-in
- End-to-end AES-256-GCM encryption with company-owned keys (Argon2id)
- Zero-access architecture — not even Performs360 can read your data
- Auto-generated reviewer assignments from org chart
- Custom evaluation templates (rating scales, open-text, multiple choice)
- Per-level templates: different evaluation forms based on employee level (e.g. junior vs senior engineers get different review criteria)
- Per-direction templates: different templates based on review relationship (e.g. manager→report uses a leadership template, peer→peer uses a collaboration template, self-review uses a reflection template)
- Impersonator role: designate someone (e.g. HR or an external coach) to submit reviews on behalf of specific relationships — useful when a reviewer is unavailable, or for anonymous third-party assessments
- Zero-friction for reviewers: secure link + OTP, no accounts needed
- Reports with radar charts, score breakdowns, anonymized feedback by relationship type
- Relationship weight control: adjust how much weight manager, peer, direct report, self, and external feedback carries in the final score
- Post-evaluation calibration: adjust scores after feedback collection with justifications, at team or individual level
- Trend analytics: score distribution, completion trends, self-vs-others gap analysis, and relationship trend analysis across cycles
- Excel and PDF export: download cycle-wide spreadsheet or individual PDF reports
- Encryption key rotation: rotate keys without losing data
- Recovery codes: backup access if the company passphrase is lost
- Passwordless login: magic link authentication, no passwords to manage
- Audit logging: full trail of who did what and when (cycle activations, role changes, decryptions)
- Template sections: organize evaluation questions into logical groups within a template
- CSV team import: bulk import teams with hierarchical manager relationships
- Cycle reminders: send email nudges to reviewers with pending evaluations
- Full GDPR deletion: complete company data destruction with optional pre-export
- Global templates: platform-wide templates available to all companies out of the box
- Scales from 5 to 5,000 team members

Write with confidence: "Performs360 handles this automatically", "Tools like Performs360 make this simple".
End the conclusion with a CTA linking to Performs360 — vary the phrasing each time. Examples:
- "Try <a href="https://performs360.com" target="_blank" rel="noopener">Performs360</a> free — no credit card required."
- "See how <a href="https://performs360.com" target="_blank" rel="noopener">Performs360</a> makes 360-degree reviews effortless."
- "Get started with <a href="https://performs360.com" target="_blank" rel="noopener">Performs360</a> and run your first cycle in minutes."
Do NOT reuse the same CTA sentence across articles.

REFERENCES (include 2-3 per article):
Cite real research inline. Use the source name and year without a URL link, since URLs may not be accurate.
The current year is ${new Date().getFullYear()}. Use recent citations (within the last 3-5 years).
Format: "According to Gallup's 2024 State of the Workplace report, ..." or "A 2023 McKinsey study found that ..."
Acceptable sources: Gallup, Deloitte, McKinsey, Gartner, SHRM, Harvard Business Review, Forbes, BLS, EEOC.

OUTPUT: Always respond with valid JSON matching the exact schema requested. No markdown fences, no extra text outside the JSON.`;
}

/**
 * Build a combined topic-selection + article-generation prompt.
 * Fetches existing titles to avoid duplicates.
 */
export async function buildArticlePrompt(): Promise<string> {
  const existingPosts = await prisma.blogPost.findMany({
    select: { title: true, slug: true, primaryKeyword: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const existingTitles = existingPosts.map((p) => p.title);
  const recentKeywords = existingPosts.map((p) => p.primaryKeyword);

  const titlesBlock =
    existingTitles.length > 0
      ? `\n\nThese articles already exist — do NOT repeat or closely rephrase any of them:\n${existingTitles.map((t) => `- ${t}`).join("\n")}`
      : "";

  const keywordsBlock =
    recentKeywords.length > 0
      ? `\n\nRecent primary keywords (pick a DIFFERENT category than these): ${[...new Set(recentKeywords)].join(", ")}`
      : "";

  const internalLinksBlock =
    existingTitles.length > 0
      ? `\n\nINTERNAL LINKING: If relevant, link to one existing blog post inline. Available posts:\n${existingPosts.slice(0, 10).map((p) => `- <a href="https://performs360.com/blog/${p.slug}">${p.title}</a>`).join("\n")}`
      : "";

  return `First, choose a specific, narrow blog topic from ONE of these categories. Pick a DIFFERENT category than the recent keywords listed below.

CATEGORY A — Performance & Feedback:
  360-degree reviews, performance management strategies, review best practices, continuous feedback culture, goal setting and OKRs

CATEGORY B — People & Culture:
  employee engagement and retention, workplace culture, psychological safety, employee wellbeing and burnout, DEI in the workplace, employee recognition programs

CATEGORY C — Leadership & Development:
  manager coaching and leadership, talent development and upskilling, succession planning, conflict resolution, change management

CATEGORY D — Operations & Productivity:
  team productivity and collaboration, remote/hybrid work, workplace communication, meeting culture and productivity, cross-functional collaboration

CATEGORY E — HR Strategy & Tech:
  HR technology trends, people analytics, compensation and benefits strategy, employer branding, onboarding best practices, exit interviews and offboarding, internal mobility and career pathing, org design and restructuring, AI in HR
${titlesBlock}${keywordsBlock}${internalLinksBlock}

The topic must be narrow and specific (not a broad overview). It should be something a manager, HR professional, or team lead would actually search for.

Then write a comprehensive blog article about that topic.

CONTENT:
- ${BLOG_CONFIG.minWords}-${BLOG_CONFIG.maxWords} words
- Conversational tone — the reader should feel like they're learning from someone who's been there
- Mix short punchy sentences with longer explanatory ones
- Give specific, concrete advice — name real techniques, frameworks, or scenarios
- Include 2-3 data points or statistics from named sources (e.g. "Gallup's 2023 report found...")

FLOW:
- Every paragraph must logically follow the previous one. Use transitions: "That's why...", "But here's the catch...", "Building on that...", "The flip side is..."
- Each section should tell a mini-story: set up a problem, explore it, land on an insight
- Don't list disconnected tips — show how one practice leads to another
- Article arc: hook → problem → exploration → solution → takeaway
- Write narrative articles, NOT listicles. Lists support the prose — they are not the article. Never structure the whole article as "10 tips for X" or "7 ways to Y".

PARAGRAPHS:
- 2-4 sentences max per <p> tag. Never longer.
- Each section under an <h2> should have 2-4 separate <p> tags
- Alternate between paragraphs, lists, and sub-headings. No walls of text.

HTML STRUCTURE:
- No <h1> tags (title is rendered separately)
- Start with a 2-3 sentence intro <p>, followed by a preview <p>
- Use <h2> for 4-6 main sections, <h3> for sub-points
- Every paragraph in its own <p> tag — one idea per <p>
- Use <ul>/<ol> with <li> — at least 2 lists in the article
- End with <h2>Conclusion</h2> containing a takeaway <p> and a CTA <p> that links to <a href="https://performs360.com" target="_blank" rel="noopener">Performs360</a>
- No <img> tags

SEO:
- Primary keyword in the first 100 words, in at least one <h2>, and in the conclusion
- 8+ semantically related keywords used naturally
- Grade 6-9 readability
- Structure one section for featured snippet optimization (clear definition or numbered list)

Respond with this exact JSON:
{
  "title": "Engaging article title (50-65 characters)",
  "meta_title": "SEO-optimized page title (max 60 characters)",
  "slug": "url-friendly-slug",
  "excerpt": "Summary for card display (120-160 characters)",
  "content_html": "Full HTML article following the rules above",
  "meta_description": "SEO meta description (150-160 characters)",
  "primary_keyword": "primary keyword phrase (2-4 words)",
  "semantic_keywords": ["kw1", "kw2", "kw3", "kw4", "kw5", "kw6", "kw7", "kw8"]
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
