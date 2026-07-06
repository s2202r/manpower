import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cold steel dark palette
        surface: {
          DEFAULT: "var(--surface)",
          raised: "var(--surface-raised)",
          overlay: "var(--surface-overlay)",
        },
        border: {
          DEFAULT: "var(--border)",
          muted: "var(--border-muted)",
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
          subtle: "var(--accent-subtle)",
        },
        status: {
          "on-track": "#22C55E",
          "at-risk": "#F59E0B",
          breached: "#EF4444",
          "on-track-subtle": "#14532D",
          "at-risk-subtle": "#78350F",
          "breached-subtle": "#7F1D1D",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "sans-serif",
        ],
        mono: [
          '"JetBrains Mono"',
          '"Fira Code"',
          '"Cascadia Code"',
          "monospace",
        ],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "1rem" }],
      },
    },
  },
  plugins: [],
};

export default config;
