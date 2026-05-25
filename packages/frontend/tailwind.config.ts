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
        'nx-bg':     '#080b14',
        'nx-surface':'#0a0e1a',
        'nx-border': '#1c2a4a',
        'nx-yellow': '#f5c030',
        'nx-cyan':   '#00d4c8',
        'nx-gray':   '#4a6080',
        'nx-dark':   '#2a3a5a',
      },
      fontFamily: {
        sans: ["'Segoe UI'", 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
