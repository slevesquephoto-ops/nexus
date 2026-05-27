import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'nx-bg':         '#080b14',
        'nx-surface':    '#0d1120',
        'nx-surface-2':  '#111827',
        'nx-border':     '#1e2d4a',
        'nx-yellow':     '#f5c030',
        'nx-yellow-dim': '#7a6010',
        'nx-cyan':       '#00d4c8',
        'nx-cyan-dim':   '#004a44',
        'nx-text':       '#e8eaf0',
        'nx-text-dim':   '#6b7a9e',
        'nx-text-muted': '#2a3a5a',
        'nx-gray':       '#6b7a9e',
        'nx-dark':       '#1e2d4a',
        'nx-danger':     '#ef4444',
        'nx-success':    '#10b981',
      },
      fontFamily: {
        sans: ["'Rajdhani'", "'Segoe UI'", 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'glow-yellow':    '0 0 20px rgba(245,192,48,0.25)',
        'glow-cyan':      '0 0 20px rgba(0,212,200,0.25)',
        'glow-yellow-sm': '0 0 12px rgba(245,192,48,0.15)',
        'glow-cyan-sm':   '0 0 12px rgba(0,212,200,0.15)',
        'glow-green-sm':  '0 0 12px rgba(74,222,128,0.08)',
      },
    },
  },
  plugins: [typography],
};
export default config;
