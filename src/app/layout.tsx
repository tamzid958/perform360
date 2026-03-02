import type { Metadata } from "next";
import "@fontsource-variable/inter";
import MixpanelProvider from "@/components/MixpanelProvider";
import AuthSessionProvider from "@/components/session-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Performs360 — 360° Performance Evaluation",
  description: "Modern 360° performance evaluation platform for organizations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased" style={{ fontFamily: "'Inter Variable', sans-serif" }}>
        <AuthSessionProvider>
          <MixpanelProvider>{children}</MixpanelProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
