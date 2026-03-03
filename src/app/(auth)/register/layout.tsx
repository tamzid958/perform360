import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account — Start Your Free 360° Review",
  description:
    "Create your Performs360 organization in minutes. Set up encrypted 360-degree performance reviews for your team. Free forever, no credit card required.",
  robots: { index: true, follow: true },
  alternates: { canonical: "/register" },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://performs360.com" },
    { "@type": "ListItem", position: 2, name: "Get Started", item: "https://performs360.com/register" },
  ],
};

export default function RegisterLayout({
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
