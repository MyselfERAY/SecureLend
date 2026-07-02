import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bi: {
          bg: "#0f1115",
          panel: "#171a21",
          panel2: "#1e222b",
          border: "#2a2f3a",
          accent: "#3b82f6",
          accent2: "#2563eb",
          text: "#e5e7eb",
          muted: "#9ca3af",
          dim: "#6b7280",
          rows: "#22c55e",
          cols: "#a855f7",
          values: "#f59e0b",
          filters: "#06b6d4",
        },
      },
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
