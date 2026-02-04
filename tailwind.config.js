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
          500: '#d4af37', // New Base (Laiton)
          600: '#a37119',
          700: '#7d5216',
          800: '#684318',
          900: '#58391a',
        },
        dark: {
          900: '#000000', // Deep Black
          800: '#0a0a0a',
          700: '#1a1a1a'
        }
      },
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      }
    },
  },
  plugins: [],
}
