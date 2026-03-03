import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin, isAuthError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { BLOG_CONFIG } from "@/lib/constants";
import { sanitizeHtml, sanitizeSlug, validateContentSize } from "@/lib/blog-utils";

const VALID_STATUSES = ["DRAFT", "PUBLISHED"] as const;

/**
 * GET /api/admin/blog — List all blog posts with pagination.
 */
export async function GET(req: NextRequest) {
  const auth = await requireSuperAdmin();
  if (isAuthError(auth)) return auth;

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(
    50,
    Math.max(1, parseInt(searchParams.get("limit") ?? String(BLOG_CONFIG.postsPerPage), 10))
  );
  const statusParam = searchParams.get("status");

  // Validate status filter against enum
  const where =
    statusParam && VALID_STATUSES.includes(statusParam as (typeof VALID_STATUSES)[number])
      ? { status: statusParam as "DRAFT" | "PUBLISHED" }
      : {};

  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        status: true,
        publishedAt: true,
        createdAt: true,
        primaryKeyword: true,
      },
    }),
    prisma.blogPost.count({ where }),
  ]);

  return NextResponse.json({
    success: true,
    data: posts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

/**
 * POST /api/admin/blog — Create a new blog post manually.
 */
export async function POST(req: NextRequest) {
  const auth = await requireSuperAdmin();
  if (isAuthError(auth)) return auth;

  const body = await req.json();
  const {
    title,
    slug,
    excerpt,
    contentHtml,
    metaTitle,
    metaDescription,
    primaryKeyword,
    semanticKeywords,
    status,
  } = body;

  if (!title || !slug || !contentHtml) {
    return NextResponse.json(
      { success: false, error: "title, slug, and contentHtml are required" },
      { status: 400 }
    );
  }

  // Validate content size
  const sizeCheck = validateContentSize(contentHtml);
  if (!sizeCheck.valid) {
    return NextResponse.json(
      { success: false, error: sizeCheck.error },
      { status: 400 }
    );
  }

  // Validate status
  const validatedStatus =
    status && VALID_STATUSES.includes(status) ? status : "DRAFT";

  // Sanitize HTML content and slug
  const cleanHtml = sanitizeHtml(contentHtml);
  const cleanSlug = sanitizeSlug(slug);

  try {
    const post = await prisma.blogPost.create({
      data: {
        title,
        slug: cleanSlug,
        excerpt: excerpt ?? "",
        contentHtml: cleanHtml,
        metaTitle: metaTitle ?? title,
        metaDescription: metaDescription ?? "",
        primaryKeyword: primaryKeyword ?? "",
        semanticKeywords: semanticKeywords ?? [],
        status: validatedStatus,
        publishedAt: validatedStatus === "PUBLISHED" ? new Date() : null,
      },
    });

    return NextResponse.json({ success: true, data: post }, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json(
        { success: false, error: "A post with this slug already exists" },
        { status: 409 }
      );
    }
    throw err;
  }
}
