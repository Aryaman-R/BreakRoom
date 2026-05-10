import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./content/**/*.{md,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Mode A — Quiet Hours
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
        // Mode B — After Hours
        ah: {
          bg: "var(--ah-bg)",
          "bg-2": "var(--ah-bg-2)",
          magenta: "var(--ah-magenta)",
          tangerine: "var(--ah-tangerine)",
          electric: "var(--ah-electric)",
          mint: "var(--ah-mint)",
          violet: "var(--ah-violet)",
          cream: "var(--ah-cream)",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
        party: ["var(--font-party)", "var(--font-display)", "serif"],
      },
      fontSize: {
        // 1.333 modular scale, base 17px
        xs: ["0.75rem", { lineHeight: "1.5" }],
        sm: ["0.875rem", { lineHeight: "1.5" }],
        base: ["1.0625rem", { lineHeight: "1.6" }],
        lg: ["1.25rem", { lineHeight: "1.55" }],
        xl: ["1.667rem", { lineHeight: "1.4" }],
        "2xl": ["2.222rem", { lineHeight: "1.2" }],
        "3xl": ["2.962rem", { lineHeight: "1.1" }],
        "4xl": ["3.948rem", { lineHeight: "1.05" }],
        "5xl": ["5.262rem", { lineHeight: "1.0" }],
      },
      letterSpacing: {
        tightish: "-0.015em",
        tighter2: "-0.03em",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(42, 37, 32, 0.04), 0 8px 24px -12px rgba(42, 37, 32, 0.12)",
        lifted:
          "0 4px 8px rgba(42, 37, 32, 0.06), 0 18px 40px -16px rgba(42, 37, 32, 0.18)",
        glow: "0 0 24px rgba(255, 61, 138, 0.4), 0 0 48px rgba(255, 140, 66, 0.3)",
      },
      keyframes: {
        rotateConic: {
          to: { transform: "rotate(360deg)" },
        },
        sparkleUp: {
          "0%": { transform: "translate(0,0) scale(0.6)", opacity: "0" },
          "20%": { opacity: "1" },
          "100%": {
            transform: "translate(var(--dx,0), -28px) scale(1)",
            opacity: "0",
          },
        },
        drift: {
          "0%, 100%": { transform: "translate(0,0) rotate(0deg)" },
          "50%": {
            transform: "translate(var(--dx,12px), var(--dy,-10px)) rotate(8deg)",
          },
        },
        beanPulse: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.06)" },
        },
        meshShift: {
          "0%, 100%": {
            backgroundPosition: "0% 0%, 100% 0%, 50% 100%",
          },
          "50%": {
            backgroundPosition: "30% 20%, 70% 40%, 60% 80%",
          },
        },
      },
      animation: {
        "rotate-conic": "rotateConic 4s linear infinite",
        drift: "drift 18s ease-in-out infinite",
        "bean-pulse": "beanPulse 1.6s ease-in-out infinite",
        "mesh-shift": "meshShift 22s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
