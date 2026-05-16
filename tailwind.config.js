/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'orias-green': '#1a3d2b',
        'orias-green-light': '#245438',
        'orias-gold': '#c49a2a',
        'orias-gold-light': '#d4aa3a',
        'orias-bg': '#f9f7f3',
        'orias-border': '#e8e2d6',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #c49a2a, #d4aa3a)',
        'green-gradient': 'linear-gradient(135deg, #1a3d2b, #245438)',
      },
    },
  },
  plugins: [],
}
