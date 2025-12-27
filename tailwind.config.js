/** @type {import('tailwindcss').Config} */
import fluid, { extract, fontSize, screens } from 'fluid-tailwind'
const defaultTheme = require('tailwindcss/defaultTheme')

module.exports = {
  darkMode: "selector",
  content: {
    files: ["./src/**/*.{html,njk,js}"],
    extract,
  },
  theme: {
    fontSize: fontSize,
    screens: screens,
    extend: {
      fontFamily: {
        "sans": ["Inter", defaultTheme.fontFamily.sans],
        "lekton": ["Lekton", defaultTheme.fontFamily.sans]
      },
      fontSize: {
        "4.5xl": ["2.5rem", "2.5rem"]
      },
      colors: {
        primary: {
          DEFAULT: '#FF9E1B',
          50: '#FFECD3',
          100: '#FFE3BE',
          200: '#FFD295',
          300: '#FFC16D',
          400: '#FFAF44',
          500: '#FF9E1B',
          600: '#E28200',
          700: '#AA6200',
          800: '#724100',
          900: '#3A2100',
          950: '#1E1100'
        },
        background: "#27251F",
        "background-light": "#E6E4DD"
      },
      borderRadius: {
        "4xl": "2rem"
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        marquee2: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0%)' },
        },
        "vertical-marquee": {
          '0%': { transform: 'translateY(0%)' },
          '100%': { transform: 'translateY(-100%)' },
        },
        "vertical-marquee2": {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0%)' },
        }
      },
      animation: {
        marquee: 'marquee 40s linear infinite',
        marquee2: 'marquee2 40s linear infinite',
        "vertical-marquee": 'vertical-marquee 10s linear infinite',
        "vertical-marquee2": 'vertical-marquee2 10s linear infinite'
      },
    },
  },
  plugins: [
    fluid,
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
    require('tailwind-scrollbar'),
    require("./src/config/plugins/tailwind.text-shadow"),
  ],
}