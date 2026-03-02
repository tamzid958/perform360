import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Performs360 — 360° Performance Evaluation",
    short_name: "Performs360",
    description:
      "Free 360-degree performance review platform with end-to-end encryption. Collect multi-rater feedback from managers, peers, and direct reports.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0071e3",
    icons: [
      {
        src: "/logo.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
