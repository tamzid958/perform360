import type { Metadata } from "next";
import "@fontsource-variable/inter";
import AuthSessionProvider from "@/components/session-provider";
import { BuiltBy } from "@/components/ui/built-by";
import "./globals.css";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "Performs360 — 360° Performance Reviews",
    template: "%s — Performs360",
  },
  description:
    "Self-hosted 360-degree performance review platform with end-to-end encryption.",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="antialiased"
        style={{ fontFamily: "'Inter Variable', sans-serif" }}
      >
        <AuthSessionProvider>
          {children}
          <BuiltBy />
        </AuthSessionProvider>
      </body>
    </html>
  );
}
