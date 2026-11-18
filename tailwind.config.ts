import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Corporate Enterprise Palette
        sce: {
          primary: "#00549c",
          secondary: "#0F6FB5",
          accent: "#4E95D9",
          light: "#DCEAF5",
          bg: "#FFFFFF",
          "bg-secondary": "#F5F8FC",
          text: "#172B4D",
          "text-muted": "#64748B",
          border: "#E2E8F0",
          success: "#16A36A",
          warning: "#E9A23B",
          danger: "#DC3545",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontFamily: {
        sans: [
          "'Plus Jakarta Sans'",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "'Segoe UI'",
          "Roboto",
          "sans-serif",
        ],
        mono: ["Consolas", "Monaco", "'Courier New'", "monospace"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        /**
         * 3C.1 — Skala radius standar enterprise (konsistensi lintas halaman):
         *   control : 8px  — button, input, select, badge kotak, chip
         *   card    : 10px — card, tabel, panel, toolbar
         *   modal   : 14px — dialog & overlay terapung
         * (rounded-xl/2xl pada halaman dimigrasikan bertahap ke token ini.)
         */
        control: "8px",
        card: "10px",
        modal: "14px",
      },
      boxShadow: {
        /**
         * 3C.1 — Skala bayangan halus (understated). Larangan: shadow-lg/xl/2xl
         * pada elemen statis; modal & dropdown hanya boleh memakai token ini.
         */
        card: "0 1px 2px 0 rgba(23, 43, 77, 0.04)",
        elevated: "0 1px 3px 0 rgba(23, 43, 77, 0.07), 0 1px 2px 0 rgba(23, 43, 77, 0.04)",
        dropdown: "0 4px 10px -2px rgba(23, 43, 77, 0.10), 0 2px 4px -1px rgba(23, 43, 77, 0.05)",
        modal: "0 10px 24px -6px rgba(23, 43, 77, 0.16), 0 4px 8px -4px rgba(23, 43, 77, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
