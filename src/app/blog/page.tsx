import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { BLOG_CONFIG } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

export const revalidate = 3600; // ISR: revalidate every hour

export const metadata: Metadata = {
  title: "Blog — Performance Management Insights",
  description:
    "Expert articles on 360-degree feedback, performance reviews, employee engagement, and team productivity. Tips and strategies from Performs360.",
  openGraph: {
    title: "Blog — Performance Management Insights | Performs360",
    description:
      "Expert articles on 360-degree feedback, performance reviews, employee engagement, and team productivity.",
    type: "website",
  },
  alternates: { canonical: "/blog" },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

interface BlogPageProps {
  searchParams: Promise<{ page?: string }>;
}

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://performs360.com" },
    { "@type": "ListItem", position: 2, name: "Blog", item: "https://performs360.com/blog" },
  ],
};

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const limit = BLOG_CONFIG.postsPerPage;

  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        title: true,
        slug: true,
        excerpt: true,
        publishedAt: true,
        primaryKeyword: true,
      },
    }),
    prisma.blogPost.count({ where: { status: "PUBLISHED" } }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
          Performance Management Blog
        </h1>
        <p className="text-[16px] text-gray-500 mt-3 max-w-xl mx-auto">
          Expert insights on 360-degree feedback, performance reviews, and building
          high-performing teams.
        </p>
      </div>

      {/* Card Grid */}
      {posts.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-[16px] text-gray-400">
            No articles published yet. Check back soon!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group rounded-2xl border border-gray-200 bg-white p-6 hover:shadow-lg hover:border-gray-300 transition-all"
            >
              <div className="flex items-center justify-between gap-2 mb-3 min-w-0">
                {post.primaryKeyword ? (
                  <span className="text-[11px] font-medium text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full truncate min-w-0">
                    {post.primaryKeyword}
                  </span>
                ) : (
                  <span />
                )}
                <span className="text-[12px] text-gray-400 flex-shrink-0">
                  {post.publishedAt ? formatDate(post.publishedAt.toISOString()) : ""}
                </span>
              </div>
              <h2 className="text-[16px] font-semibold text-gray-900 group-hover:text-brand-600 transition-colors line-clamp-2 mb-2">
                {post.title}
              </h2>
              <p className="text-[14px] text-gray-500 line-clamp-3">
                {post.excerpt}
              </p>
              <span className="inline-block mt-4 text-[13px] font-medium text-brand-600 group-hover:underline">
                Read more
              </span>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-12">
          {page > 1 && (
            <Link
              href={`/blog?page=${page - 1}`}
              className="px-4 py-2 rounded-lg border border-gray-200 text-[14px] font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Previous
            </Link>
          )}
          <span className="text-[14px] text-gray-500">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/blog?page=${page + 1}`}
              className="px-4 py-2 rounded-lg border border-gray-200 text-[14px] font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
