/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0d14',
        'on-background': '#f1f5f9',
        primary: '#6366f1',
        'on-primary': '#ffffff',
        secondary: '#a855f7',
        'on-secondary': '#ffffff',
        'on-surface': '#ffffff',
        'on-surface-variant': '#94a3b8'
      }
    },
  },
  plugins: [],
}
