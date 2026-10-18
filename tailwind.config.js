/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'mac-dark': '#0b0f19',
        'mac-card': 'rgba(17, 24, 39, 0.65)',
        'mac-accent': '#6366f1',
      },
    },
  },
  plugins: [],
}
