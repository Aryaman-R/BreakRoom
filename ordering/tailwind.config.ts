import type { Config } from "tailwindcss";

// Brand tokens ported from the main site (Quiet Hours mode) so
// order.breakroombothell.com reads as the same brand.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        qh: {
          bg: "var(--qh-bg)",
          "bg-elevated": "var(--qh-bg-elevated)",
          ink: "var(--qh-ink)",
          "ink-soft": "var(--qh-ink-soft)",
          accent: "var(--qh-accent)",
          "accent-soft": "var(--qh-accent-soft)",
          sage: "var(--qh-sage)",
          line: "var(--qh-line)",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1.5" }],
        sm: ["0.875rem", { lineHeight: "1.5" }],
        base: ["1.0625rem", { lineHeight: "1.6" }],
        lg: ["1.25rem", { lineHeight: "1.55" }],
        xl: ["1.667rem", { lineHeight: "1.4" }],
        "2xl": ["2.222rem", { lineHeight: "1.2" }],
        "3xl": ["2.962rem", { lineHeight: "1.1" }],
      },
      letterSpacing: {
        tightish: "-0.015em",
        tighter2: "-0.03em",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(42, 37, 32, 0.04), 0 8px 24px -12px rgba(42, 37, 32, 0.12)",
        lifted:
          "0 4px 8px rgba(42, 37, 32, 0.06), 0 18px 40px -16px rgba(42, 37, 32, 0.18)",
      },
    },
  },
  plugins: [],
};

export default config;
