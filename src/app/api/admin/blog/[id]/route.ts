import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin, isAuthError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { sanitizeHtml, sanitizeSlug, validateContentSize } from "@/lib/blog-utils";

const VALID_STATUSES = ["DRAFT", "PUBLISHED"] as const;

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/blog/[id] — Get a single blog post.
 */
export async function GET(_req: NextRequest, ctx: RouteContext) {
  const auth = await requireSuperAdmin();
  if (isAuthError(auth)) return auth;

  const { id } = await ctx.params;

  const post = await prisma.blogPost.findUnique({ where: { id } });

  if (!post) {
    return NextResponse.json(
      { success: false, error: "Post not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: post });
}

/**
 * PUT /api/admin/blog/[id] — Update a blog post.
 */
export async function PUT(req: NextRequest, ctx: RouteContext) {
  const auth = await requireSuperAdmin();
  if (isAuthError(auth)) return auth;

  const { id } = await ctx.params;
  const body = await req.json();

  const existing = await prisma.blogPost.findUnique({
    where: { id },
    select: { id: true, status: true },
  });

  if (!existing) {
    return NextResponse.json(
      { success: false, error: "Post not found" },
      { status: 404 }
    );
  }

  // Validate content size if contentHtml is being updated
  if (body.contentHtml !== undefined) {
    const sizeCheck = validateContentSize(body.contentHtml);
    if (!sizeCheck.valid) {
      return NextResponse.json(
        { success: false, error: sizeCheck.error },
        { status: 400 }
      );
    }
  }

  // Handle publish status transitions
  const data: Record<string, unknown> = {};

  if (body.title !== undefined) data.title = body.title;
  if (body.slug !== undefined) {
    data.slug = sanitizeSlug(body.slug);
  }
  if (body.excerpt !== undefined) data.excerpt = body.excerpt;
  if (body.contentHtml !== undefined) data.contentHtml = sanitizeHtml(body.contentHtml);
  if (body.metaTitle !== undefined) data.metaTitle = body.metaTitle;
  if (body.metaDescription !== undefined) data.metaDescription = body.metaDescription;
  if (body.primaryKeyword !== undefined) data.primaryKeyword = body.primaryKeyword;
  if (body.semanticKeywords !== undefined) data.semanticKeywords = body.semanticKeywords;

  if (body.status !== undefined) {
    // Validate status against enum
    if (VALID_STATUSES.includes(body.status)) {
      data.status = body.status;
      if (body.status === "PUBLISHED" && existing.status === "DRAFT") {
        data.publishedAt = new Date();
      }
      if (body.status === "DRAFT") {
        data.publishedAt = null;
      }
    }
  }

  try {
    const post = await prisma.blogPost.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, data: post });
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

/**
 * DELETE /api/admin/blog/[id] — Delete a blog post.
 */
export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  const auth = await requireSuperAdmin();
  if (isAuthError(auth)) return auth;

  const { id } = await ctx.params;

  const existing = await prisma.blogPost.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json(
      { success: false, error: "Post not found" },
      { status: 404 }
    );
  }

  await prisma.blogPost.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
