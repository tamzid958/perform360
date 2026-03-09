import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { sanitizeHtml, safeJsonLdStringify } from "@/lib/blog-utils";
import { ArrowLeft } from "lucide-react";

export const revalidate = 3600; // ISR: revalidate every hour

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

// Pre-render published blog posts at build time when DB is available;
// falls back to on-demand ISR when DATABASE_URL is absent (e.g. Docker build)
export async function generateStaticParams() {
  if (!process.env.DATABASE_URL) {
    return [];
  }
  const posts = await prisma.blogPost.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true },
  });
  return posts.map((post) => ({ slug: post.slug }));
}

// Deduplicate DB query between generateMetadata and page render
const getPost = cache(async (slug: string) => {
  return prisma.blogPost.findUnique({ where: { slug } });
});

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  // Only expose metadata for published posts
  if (!post || post.status !== "PUBLISHED") {
    return { title: "Post Not Found" };
  }

  const keywords = [
    post.primaryKeyword,
    ...(Array.isArray(post.semanticKeywords) ? (post.semanticKeywords as string[]) : []),
  ].filter(Boolean);

  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt,
    keywords,
    alternates: {
      canonical: `/blog/${slug}`,
    },
    openGraph: {
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt,
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
      authors: ["Performs360"],
    },
    twitter: {
      card: "summary",
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt,
    },
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
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post || post.status !== "PUBLISHED") {
    notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.metaDescription || post.excerpt,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: {
      "@type": "Organization",
      name: "Performs360",
      url: "https://performs360.com",
    },
    publisher: {
      "@type": "Organization",
      name: "Performs360",
      url: "https://performs360.com",
      logo: {
        "@type": "ImageObject",
        url: "https://performs360.com/logo.png",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://performs360.com/blog/${post.slug}`,
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://performs360.com" },
      { "@type": "ListItem", position: 2, name: "Blog", item: "https://performs360.com/blog" },
      { "@type": "ListItem", position: 3, name: post.title, item: `https://performs360.com/blog/${post.slug}` },
    ],
  };

  // Sanitize HTML at render time as defense-in-depth
  const safeHtml = sanitizeHtml(post.contentHtml);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Back link */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-[14px] text-gray-500 hover:text-gray-900 transition-colors mb-8"
        >
          <ArrowLeft size={16} strokeWidth={1.5} />
          Back to Blog
        </Link>

        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            {post.primaryKeyword && (
              <span className="text-[12px] font-medium text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full">
                {post.primaryKeyword}
              </span>
            )}
            {post.publishedAt && (
              <time
                dateTime={post.publishedAt.toISOString()}
                className="text-[13px] text-gray-400"
              >
                {formatDate(post.publishedAt.toISOString())}
              </time>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="text-[16px] sm:text-[18px] text-gray-500 mt-4 leading-relaxed">
              {post.excerpt}
            </p>
          )}
        </header>

        {/* Content */}
        <div
          className="prose prose-gray prose-lg max-w-none
            prose-headings:font-semibold prose-headings:text-gray-900
            prose-h2:text-xl prose-h2:sm:text-2xl prose-h2:mt-10 prose-h2:mb-4
            prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-3
            prose-p:text-gray-600 prose-p:leading-relaxed prose-p:mb-5
            prose-li:text-gray-600 prose-li:leading-relaxed
            prose-ul:my-6 prose-ol:my-6
            prose-a:text-brand-600 prose-a:no-underline hover:prose-a:underline
            prose-strong:text-gray-900"
          dangerouslySetInnerHTML={{ __html: safeHtml }}
        />

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {Array.isArray(post.semanticKeywords) &&
              (post.semanticKeywords as string[]).map((keyword) => (
                <span
                  key={keyword}
                  className="text-[12px] text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full"
                >
                  {keyword}
                </span>
              ))}
          </div>
        </footer>
      </article>
    </>
  );
}
