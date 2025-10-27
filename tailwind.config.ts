import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    container: { center: true, padding: "1rem" },
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "Segoe UI", "Helvetica", "Arial"],
      },
      colors: {
        primary: {
          50:"#eff6ff",100:"#dbeafe",200:"#bfdbfe",300:"#93c5fd",400:"#60a5fa",
          500:"#2563eb",600:"#1d4ed8",700:"#1e40af",800:"#1e3a8a",900:"#172554",
          DEFAULT:"#2563eb",
        },
        secondary: { 50:"#ecfdf5",100:"#d1fae5",500:"#10b981",600:"#059669",DEFAULT:"#059669" },
        accent: { amber:"#f59e0b", red:"#dc2626", orange:"#f97316" },
        surface: { 50:"#f8fafc",100:"#f1f5f9",200:"#e2e8f0",300:"#cbd5e1" },
        text: { soft:"#64748b", strong:"#334155", darkest:"#0f172a" },
      },
      fontSize: {
        "hf-headline": ["3rem", { lineHeight: "1.1", fontWeight: "700" }],
        "hf-subheadline": ["1.5rem", { lineHeight: "1.3", fontWeight: "600" }],
        "hf-body-lg": ["1.125rem", { lineHeight: "1.6" }],
        "hf-body": ["1rem", { lineHeight: "1.5" }],
        "hf-small": ["0.875rem", { lineHeight: "1.4" }],
        "hf-micro": ["0.75rem", { lineHeight: "1.3" }],
      },
      borderRadius: { md: "8px", lg: "12px", xl: "16px", "2xl": "24px" },
      boxShadow: {
        "elev-1": "0 2px 8px rgba(0,0,0,0.08)",
        "elev-2": "0 6px 18px rgba(0,0,0,0.10)",
        "elev-3": "0 10px 30px rgba(0,0,0,0.12)",
        card: "0 2px 20px -2px rgba(2,8,23,.06), 0 6px 30px -2px rgba(2,8,23,.08)",
      },
      backgroundImage: { "hero-gradient": "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)" },
    },
  },
  plugins: [],
} satisfies Config;