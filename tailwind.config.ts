import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gray: {
          50: "#F5F5F5",
          100: "#DDDDDD",
          200: "#DDDDDD",
          300: "#BBBBBB",
          400: "#888888",
          500: "#555555",
          600: "#555555",
          700: "#333333",
          800: "#222222",
          900: "#111111",
          950: "#000000",
        },
        accent: {
          DEFAULT: "#E63946",
          50: "#FEF2F2",
          600: "#C62828",
        },
        brand: {
          50: "#FEF2F2",
          100: "#FEE2E2",
          500: "#E63946",
          600: "#C62828",
          700: "#B71C1C",
        },
        success: {
          DEFAULT: "#2D6A4F",
          tint: "#ECFDF5",
        },
        warning: {
          DEFAULT: "#92400E",
          tint: "#FFFBEB",
        },
        error: {
          DEFAULT: "#E63946",
          tint: "#FEF2F2",
        },
        info: {
          DEFAULT: "#1E40AF",
          tint: "#EFF6FF",
        },
      },
      fontFamily: {
        serif: ["Georgia", '"Times New Roman"', "serif"],
        sans: [
          '"Helvetica Neue"',
          '"Arial Narrow"',
          "Arial",
          "sans-serif",
        ],
        mono: ['"Helvetica Neue"', "Arial", "sans-serif"],
      },
      fontSize: {
        "display": ["48px", { lineHeight: "1.1", fontWeight: "700", letterSpacing: "-0.01em" }],
        "pull-quote": ["32px", { lineHeight: "1.3", fontWeight: "400" }],
        "section": ["24px", { lineHeight: "1.2", fontWeight: "700", letterSpacing: "0.15em" }],
        "score": ["18px", { lineHeight: "1.0", fontWeight: "700" }],
        "label": ["14px", { lineHeight: "1.3", fontWeight: "500", letterSpacing: "0.15em" }],
        "body-swiss": ["16px", { lineHeight: "1.7", fontWeight: "400" }],
        "caption-swiss": ["12px", { lineHeight: "1.35", fontWeight: "400", letterSpacing: "0.05em" }],
      },
      borderRadius: {
        none: "0",
        sm: "0",
        DEFAULT: "0",
        md: "0",
        lg: "0",
        xl: "0",
        "2xl": "0",
        "3xl": "0",
        full: "0",
      },
      boxShadow: {
        xs: "none",
        sm: "none",
        DEFAULT: "none",
        md: "none",
        lg: "none",
        xl: "none",
        card: "none",
      },
      maxWidth: {
        content: "1080px",
      },
      letterSpacing: {
        caps: "0.15em",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
