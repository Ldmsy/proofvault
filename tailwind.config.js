/** @type {import('tailwindcss').Config} */
// Palette and type follow the teammate's hospital / banking pages: warm paper neutrals, near-black ink
// as the primary colour, sage as the secondary accent, and Helvetica / Arial.
const paper = {
  50: '#faf9f6',
  100: '#f5f4ef',
  200: '#e4e2d9',
  300: '#d0cec3',
  400: '#a3a197',
  500: '#77766e',
  600: '#5c5b55',
  700: '#3f3e3a',
  800: '#2a2a27',
  900: '#1d1d1b',
  950: '#141413',
};
const ink = {
  50: '#f4f4f2',
  100: '#e9e9e6',
  200: '#d4d4cf',
  300: '#b4b4ad',
  400: '#8a8a83',
  500: '#3a3a36',
  600: '#171717',
  700: '#0f0f0f',
  800: '#0a0a0a',
  900: '#050505',
  950: '#000000',
};
const sage = {
  50: '#f1f8f5',
  100: '#dcefe7',
  200: '#c3e3d6',
  300: '#b9dccf',
  400: '#8cc4b0',
  500: '#6fae98',
  600: '#4f8f7a',
  700: '#3c7362',
  800: '#2f5b4e',
  900: '#244539',
  950: '#142a22',
};

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: { slate: paper, indigo: ink, cyan: sage, brand: { yellow: '#ffdc00', 'yellow-dark': '#d5b800' } },
      fontFamily: {
        sans: ['"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
