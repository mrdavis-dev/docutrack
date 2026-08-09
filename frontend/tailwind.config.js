/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        // Each shade reads a CSS variable set at runtime (see main.jsx / useBranding),
        // so an admin-chosen brand color applies without rebuilding the frontend.
        // Falls back to the default blue via the var()'s second argument.
        brand: {
          50: "rgb(var(--brand-50, 239 246 255) / <alpha-value>)",
          100: "rgb(var(--brand-100, 219 234 254) / <alpha-value>)",
          200: "rgb(var(--brand-200, 191 219 254) / <alpha-value>)",
          300: "rgb(var(--brand-300, 147 197 253) / <alpha-value>)",
          400: "rgb(var(--brand-400, 96 165 250) / <alpha-value>)",
          500: "rgb(var(--brand-500, 59 130 246) / <alpha-value>)",
          600: "rgb(var(--brand-600, 37 99 235) / <alpha-value>)",
          700: "rgb(var(--brand-700, 29 78 216) / <alpha-value>)",
          800: "rgb(var(--brand-800, 30 64 175) / <alpha-value>)",
          900: "rgb(var(--brand-900, 30 58 138) / <alpha-value>)",
        },
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.06)",
        "card-md": "0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05)",
      },
    },
  },
  plugins: [],
};
