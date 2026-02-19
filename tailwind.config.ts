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
        background: "#121212",
        surface: "#1e1e1e",
        border: "#2a2a2a",
        primary: "#f49d25",
        "primary-dim": "rgba(244, 157, 37, 0.15)",
        "text-primary": "#f0ece4",
        "text-muted": "#6b6560",
        success: "#14b8a6",
        danger: "#ef4444",
      },
      fontFamily: {
        mono: ["var(--font-jetbrains-mono)", "monospace"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
