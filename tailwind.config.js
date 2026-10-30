/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#237E7F',
        accent: '#237E7F',
        ink: '#342C21',
        paper: '#FFFAEF',
        pale: '#E8EFDA',
        slate: { 50: '#FFFAEF', 100: '#F1EDDF', 200: '#DED8C8', 300: '#B1AA98', 400: '#807867', 500: '#706857', 600: '#605747', 700: '#4C4335', 800: '#40372B', 900: '#342C21', 950: '#231E17' },
        indigo: { 50: '#E8EFDA', 100: '#DEEBDA', 200: '#C3E2D7', 300: '#9FCFBE', 400: '#4A9792', 500: '#237E7F', 600: '#237E7F', 700: '#1B696A', 800: '#18585A', 900: '#174A4C', 950: '#173F40' },
        success: '#10B981', // 득표
      },
      fontFamily: {
        sans: ['Paperlogy', 'system-ui', 'sans-serif'],
      },
      fontWeight: { normal: '500', medium: '500', semibold: '700', bold: '700', extrabold: '800', black: '800' },
      borderRadius: {
        xl: '16px',
        '2xl': '20px',
      },
    },
  },
  plugins: [],
}
