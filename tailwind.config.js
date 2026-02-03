/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#fbf7e6',
          100: '#f5ebc0',
          200: '#edd88a',
          300: '#e4c052',
          400: '#dbad33',
          500: '#c59222', // Base
          600: '#a37119',
          700: '#7d5216',
          800: '#684318',
          900: '#58391a',
        },
        dark: {
          900: '#121212',
          800: '#1a1a1a',
          700: '#2a2a2a'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Assuming we add Inter later, or use system defaults for now
      }
    },
  },
  plugins: [],
}
