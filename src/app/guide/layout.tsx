import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How 360° Performance Reviews Work — Guide",
  description:
    "Complete guide to running 360-degree performance reviews with Performs360. Learn about team roles, evaluation cycles, reports, and organizational patterns.",
  robots: { index: true, follow: true },
  alternates: { canonical: "/guide" },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://performs360.com" },
    { "@type": "ListItem", position: 2, name: "Guide", item: "https://performs360.com/guide" },
  ],
};

export default function GuideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {children}
    </>
  );
}
