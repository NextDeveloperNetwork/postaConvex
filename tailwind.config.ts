import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        gold: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f6d55c', // Primary Motif
          60: '#e5c040',
          700: '#b49020',
          800: '#8c6e14',
          900: '#69510c',
        },
        posta: {
          yellow: '#f6d55c',
          dark: '#111827',
          black: '#000000',
          lightBg: '#f8fafc',
          cardBg: '#ffffff',
          accentBorder: '#e2e8f0',
        }
      },
    },
  },
  plugins: [],
};
export default config;
