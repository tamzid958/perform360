import type { Metadata } from "next";
import { Inter } from "next/font/google";
import MixpanelProvider from "@/components/MixpanelProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

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
      <body className={`${inter.variable} antialiased`}>
        <MixpanelProvider>{children}</MixpanelProvider>
      </body>
    </html>
  );
}
