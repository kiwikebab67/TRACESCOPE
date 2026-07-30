/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'ts-bg': 'var(--ts-bg)',
        'ts-text': 'var(--ts-text)',
        'ts-text-muted': 'var(--ts-text-muted)',
        'ts-border': 'var(--ts-border)',
        'ts-blue': 'var(--ts-blue)',
        'ts-purple': 'var(--ts-purple)',
        'ts-pink': 'var(--ts-pink)',
        'ts-panel': 'var(--ts-panel)',
        'ts-orange': '#f97316',
        'ts-red': '#ef4444',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'premium': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
      }
    },
  },
  plugins: [],
}
