import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account — Start Your Free 360° Review",
  description:
    "Create your Performs360 organization in minutes. Set up encrypted 360-degree performance reviews for your team. Free forever, no credit card required.",
  robots: { index: true, follow: true },
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
