const palette = require('./src/theme/palette.json');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: palette.brand.primary,
        amber: palette.brand.amber,
        sky: palette.brand.sky,
        violet: palette.brand.violet,
      },
    },
  },
  plugins: [],
};
