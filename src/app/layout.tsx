import type { Metadata } from "next";
import Script from "next/script";
import "@fontsource-variable/inter";
import MixpanelProvider from "@/components/MixpanelProvider";
import AuthSessionProvider from "@/components/session-provider";
import "./globals.css";

const BASE_URL = "https://performs360.com";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Performs360 — Free 360° Performance Review Software",
    template: "%s — Performs360",
  },
  description:
    "Free 360-degree performance review platform with end-to-end encryption. Collect feedback from managers, peers & direct reports. Zero vendor lock-in, one-click data export.",
  keywords: [
    "360 degree feedback",
    "360 performance review",
    "performance evaluation software",
    "employee feedback platform",
    "multi-rater feedback",
    "encrypted performance reviews",
    "free performance review tool",
    "360 degree evaluation",
    "employee performance management",
    "anonymous feedback software",
  ],
  authors: [{ name: "Performs360" }],
  creator: "Performs360",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: "Performs360",
    title: "Performs360 — Free 360° Performance Review Software",
    description:
      "Free 360-degree performance reviews with end-to-end encryption. Collect multi-rater feedback from managers, peers & direct reports. Own your data — export anytime.",
    images: [
      {
        url: "/image.png",
        width: 1200,
        height: 750,
        alt: "Performs360 dashboard showing 360-degree performance review cycles, team management, and encrypted feedback reports",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Performs360 — Free 360° Performance Review Software",
    description:
      "Free 360° performance reviews with end-to-end encryption. Multi-rater feedback from managers, peers & direct reports. Zero vendor lock-in.",
    images: ["/image.png"],
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
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
  },
  alternates: {
    canonical: BASE_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-54HKSB3HEN"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-54HKSB3HEN');
          `}
        </Script>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "Performs360",
              url: BASE_URL,
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              description:
                "Free 360-degree performance review platform with end-to-end encryption. Collect multi-rater feedback from managers, peers, and direct reports.",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              creator: {
                "@type": "Organization",
                name: "Performs360",
                url: BASE_URL,
                email: "support@performs360.com",
              },
            }),
          }}
        />
      </head>
      <body
        className="antialiased"
        style={{ fontFamily: "'Inter Variable', sans-serif" }}
      >
        <AuthSessionProvider>
          <MixpanelProvider>{children}</MixpanelProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
