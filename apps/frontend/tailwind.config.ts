import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          500: "#4f46e5",
          600: "#4338ca"
        },
        muted: "#f1f5f9",
        "muted-foreground": "#64748b",
        primary: "#4f46e5"
      }
    }
  }
} satisfies Config;
