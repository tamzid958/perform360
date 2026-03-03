## Plan: AI-Powered Blog Feature for Performs360 — COMPLETED

### Summary
Add a public-facing, SEO-optimized blog at `/blog` managed exclusively by SuperAdmin. Blog posts are auto-generated daily (3 articles) via Ollama REST API with free-model fallback, focused on performance management topics that promote Performs360. SuperAdmin gets full CRUD with TipTap rich text editor. Posts include AI-generated SEO meta (title, description, slug, keywords, Open Graph).

### Impact
- **Modify:**
  - `prisma/schema.prisma` — add `BlogPost` model
  - `src/types/job.ts` — add `blog.generate` job type + payload
  - `src/lib/jobs/index.ts` — register blog generation handler
  - `src/lib/constants.ts` — add blog config constants
  - `scripts/worker.ts` — add blog cron scheduling
  - `src/app/(superadmin)/superadmin/admin-shell.tsx` — add "Blog" nav item
  - `src/components/landing/landing-navbar.tsx` — add "Blog" nav link
  - `src/components/landing/landing-footer.tsx` — add "Blog" footer link
  - `.env.example` — add `OLLAMA_API_URL`, `OLLAMA_API_KEY`

- **Create:**
  - `prisma/migrations/xxx_add_blog_post/` — migration
  - `src/lib/ollama.ts` — Ollama API client with free-model fallback
  - `src/lib/blog-prompt.ts` — SEO article prompt template (SEOAutowrite pattern)
  - `src/lib/jobs/blog-generate.ts` — job handler for article generation
  - `src/app/api/admin/blog/route.ts` — GET (list) + POST (create)
  - `src/app/api/admin/blog/[id]/route.ts` — GET + PUT + DELETE
  - `src/app/api/admin/blog/generate/route.ts` — POST manual trigger
  - `src/app/(superadmin)/superadmin/blog/page.tsx` — blog management list
  - `src/app/(superadmin)/superadmin/blog/[id]/page.tsx` — edit post (TipTap)
  - `src/app/(superadmin)/superadmin/blog/new/page.tsx` — create post
  - `src/app/(superadmin)/superadmin/blog/blog-list.tsx` — client component for list
  - `src/app/(superadmin)/superadmin/blog/blog-editor.tsx` — client component (TipTap editor)
  - `src/app/blog/page.tsx` — public blog listing (card grid, 9/page)
  - `src/app/blog/[slug]/page.tsx` — public blog post (SEO meta + Open Graph)
  - `src/app/blog/layout.tsx` — blog layout with navbar/footer

- **Risks:**
  - Ollama API availability/rate limits on free models
  - Large prompt + response may timeout — mitigated by job queue retry logic
  - TipTap adds ~150KB to client bundle — only loaded on superadmin edit pages

### Phases

**Phase 1: Database + Ollama Client** — files: `prisma/schema.prisma`, `src/lib/ollama.ts`, `src/lib/blog-prompt.ts`, `src/lib/constants.ts` — est. diffs: ~180 lines
  1. Add `BlogPost` model to Prisma schema:
     - `id` (cuid), `title`, `slug` (unique), `excerpt`, `contentHtml` (Text), `metaTitle`, `metaDescription`, `primaryKeyword`, `semanticKeywords` (Json string[]), `status` (enum: DRAFT/PUBLISHED), `publishedAt`, `createdAt`, `updatedAt`
  2. Run `prisma migrate dev` to create migration
  3. Create `src/lib/ollama.ts` — Ollama REST API client:
     - `listModels()` — GET `/api/tags` to discover free models
     - `generate(prompt, options)` — POST `/api/generate` with model fallback (try first model, on fail try next)
     - Auth via `OLLAMA_API_KEY` header (Bearer token) + `OLLAMA_API_URL` base URL
     - Non-streaming mode (`stream: false`), JSON format output, configurable `num_predict` and `temperature`
  4. Create `src/lib/blog-prompt.ts` — prompt template adapted from SEOAutowrite pattern:
     - System prompt establishing expertise in performance management / HR tech
     - Content requirements: 800-1500 words, professional tone, E-E-A-T framework
     - HTML structure: `<h2>`, `<h3>`, `<p>`, `<ul>/<ol>`, conclusion section
     - SEO: primary keyword in first 100 words, 8+ semantic keywords, readability grade 6-9
     - Output JSON schema: `{ title, meta_title, slug, excerpt, content_html, meta_description, primary_keyword, semantic_keywords }`
     - Topic generation prompt focused on performance management, 360 feedback, employee development, team productivity — naturally promoting Performs360
  5. Add `BLOG_CONFIG` to constants (generation count, word range, etc.)

**Phase 2: Job Queue Integration** — files: `src/types/job.ts`, `src/lib/jobs/blog-generate.ts`, `src/lib/jobs/index.ts`, `scripts/worker.ts` — est. diffs: ~150 lines
  1. Add `BLOG_GENERATE: "blog.generate"` to `JOB_TYPES` + payload type `BlogGeneratePayload` (count: number)
  2. Add payload map entry for `"blog.generate"`
  3. Create `src/lib/jobs/blog-generate.ts` handler:
     - Step 1: Generate a unique topic (call Ollama with topic selection prompt, excluding existing post titles)
     - Step 2: Generate full article from topic (call Ollama with article generation prompt)
     - Step 3: Parse JSON response, validate required fields
     - Step 4: Create `BlogPost` record with status=PUBLISHED, publishedAt=now
     - Step 5: Repeat for `count` articles (default 3)
     - Error handling: if one article fails, continue with remaining; log errors
  4. Register handler in `src/lib/jobs/index.ts`
  5. Add cron scheduling in `scripts/worker.ts` — schedule `blog.generate` once per day (check `hasPendingJob` first)

**Phase 3: SuperAdmin API Routes** — files: `src/app/api/admin/blog/route.ts`, `src/app/api/admin/blog/[id]/route.ts`, `src/app/api/admin/blog/generate/route.ts` — est. diffs: ~180 lines
  1. `GET /api/admin/blog` — list all posts with pagination (page, limit query params), ordered by createdAt desc. Protected by `requireSuperAdmin()`
  2. `POST /api/admin/blog` — create post manually (title, slug, excerpt, contentHtml, metaTitle, metaDescription, primaryKeyword, semanticKeywords, status). Validate slug uniqueness
  3. `GET /api/admin/blog/[id]` — get single post by ID
  4. `PUT /api/admin/blog/[id]` — update post fields (partial update). Validate slug uniqueness if changed
  5. `DELETE /api/admin/blog/[id]` — hard delete post
  6. `POST /api/admin/blog/generate` — manual trigger: enqueue `blog.generate` job, return job ID for status polling. Accepts optional `count` (default 3)

**Phase 4: SuperAdmin Dashboard UI** — files: `src/app/(superadmin)/superadmin/blog/page.tsx`, `src/app/(superadmin)/superadmin/blog/[id]/page.tsx`, `src/app/(superadmin)/superadmin/blog/new/page.tsx`, `src/app/(superadmin)/superadmin/blog/blog-list.tsx`, `src/app/(superadmin)/superadmin/blog/blog-editor.tsx`, `src/app/(superadmin)/superadmin/admin-shell.tsx` — est. diffs: ~500 lines (TipTap heavy)
  1. Install TipTap dependencies: `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-link`, `@tiptap/extension-heading`, `@tiptap/pm`
  2. Add "Blog" nav item to `admin-shell.tsx` navigation array (Newspaper icon)
  3. Create `blog-list.tsx` — client component:
     - Table/card list of posts (title, status, publishedAt, slug)
     - Publish/unpublish toggle, delete button with confirmation
     - "Generate Articles" button (calls `/api/admin/blog/generate`, shows job status)
     - Pagination controls
     - Link to create new / edit existing
  4. Create `blog-editor.tsx` — client component:
     - TipTap editor for contentHtml with toolbar (headings, bold, italic, lists, links)
     - Input fields: title, slug (auto-generated from title), excerpt, metaTitle, metaDescription, primaryKeyword
     - Semantic keywords tag input
     - Status toggle (DRAFT/PUBLISHED)
     - Save button (POST or PUT)
  5. `page.tsx` (list) — server component rendering blog-list
  6. `[id]/page.tsx` — server component fetching post, rendering blog-editor in edit mode
  7. `new/page.tsx` — server component rendering blog-editor in create mode

**Phase 5: Public Blog Pages + SEO** — files: `src/app/blog/layout.tsx`, `src/app/blog/page.tsx`, `src/app/blog/[slug]/page.tsx`, `src/components/landing/landing-navbar.tsx`, `src/components/landing/landing-footer.tsx` — est. diffs: ~250 lines
  1. Create `src/app/blog/layout.tsx` — reuse `LandingNavbar` + `LandingFooter`
  2. Create `src/app/blog/page.tsx` — public listing:
     - Server component, fetch published posts with pagination (9/page)
     - 3-column card grid (title, excerpt, date, "Read more" link)
     - `generateMetadata()` for blog index SEO
     - Pagination via search params (`?page=2`)
  3. Create `src/app/blog/[slug]/page.tsx` — individual post:
     - Server component, fetch by slug (404 if not found or not PUBLISHED)
     - `generateMetadata()` with per-post metaTitle, metaDescription, Open Graph tags, article schema
     - Render contentHtml with proper typography styles
     - Back to blog link, published date
     - JSON-LD Article structured data
  4. Add "Blog" link to `landing-navbar.tsx` navLinks array
  5. Add "Blog" link to `landing-footer.tsx` productLinks array

### Testing Strategy
- **Phase 1:** Run `prisma migrate dev` successfully. Unit test Ollama client mock responses. Verify prompt generates valid JSON schema.
- **Phase 2:** Test job handler with mocked Ollama responses. Verify retry/fallback logic. Test cron scheduling avoids duplicates.
- **Phase 3:** Test API routes: auth protection (non-superadmin gets 403), CRUD operations, slug uniqueness validation, pagination.
- **Phase 4:** Manual UI testing — create/edit/delete posts, TipTap editor functionality, generate button triggers job.
- **Phase 5:** Verify public pages render correctly. Check SEO meta tags in page source. Verify 404 for unpublished/missing slugs. Test pagination.
- **Final:** `npm run build` passes. `npm run lint` passes. `npm run typecheck` passes. Full flow: generate articles via job → view on public blog → edit in superadmin.

### Assumptions
- [ASSUMPTION: Ollama cloud API accepts Bearer token auth via `Authorization` header — will use `OLLAMA_API_KEY` env var]
- [ASSUMPTION: Free models available via `/api/tags` endpoint — fallback iterates through available models]
- [ASSUMPTION: Blog posts are global (not company-scoped) — managed by SuperAdmin only]
- [ASSUMPTION: No RSS feed or sitemap generation needed in initial implementation]
- [ASSUMPTION: TipTap editor is the preferred WYSIWYG — adds ~150KB client-side, only on superadmin pages]
- [ASSUMPTION: Daily generation runs once per 24h via cron scheduler in worker — not a specific time of day]
