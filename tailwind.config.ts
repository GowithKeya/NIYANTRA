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
        background: "#130924",
        surface: {
          DEFAULT: "#1a0f30",
          card: "#1e1338",
          hover: "#281a4d",
          border: "#33215c",
        },
        niyantra: {
          purple: "#7c3aed",
          violet: "#a855f7",
          cyan: "#06b6d4",
          emerald: "#10b981",
          amber: "#f59e0b",
          crimson: "#ef4444",
        },
      },
      fontFamily: {
        mono: ["var(--font-geist-mono)", "JetBrains Mono", "Courier New", "monospace"],
        sans: ["var(--font-geist-sans)", "Inter", "sans-serif"],
      },
      keyframes: {
        pulseSlow: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.85", transform: "scale(1.02)" },
        },
        orbit: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(1000%)" },
        },
      },
      animation: {
        pulseSlow: "pulseSlow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        orbit: "orbit 20s linear infinite",
        scanline: "scanline 8s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;

