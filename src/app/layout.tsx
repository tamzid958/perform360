import type { Metadata } from "next";
import "@fontsource-variable/inter";
import MixpanelProvider from "@/components/MixpanelProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Perform360 — 360° Performance Evaluation",
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
        <MixpanelProvider>{children}</MixpanelProvider>
      </body>
    </html>
  );
}
