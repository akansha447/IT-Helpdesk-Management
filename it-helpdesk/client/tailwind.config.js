/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        ink: {
          950: '#0B1220',
          900: '#101A2E',
          800: '#16213A',
          700: '#1E2B47',
        },
        teal: {
          50: '#EAF6F6',
          100: '#CFEBEA',
          400: '#2C9C9E',
          500: '#0E7C86',
          600: '#0B636B',
        },
        amber: {
          400: '#E8A33D',
          500: '#D68C1F',
        },
        coral: {
          400: '#E0654F',
          500: '#C64F3A',
        },
        slate: {
          50: '#F6F7F9',
          100: '#EEF0F3',
          200: '#DFE3E9',
          400: '#8792A2',
          500: '#697386',
          600: '#4B5468',
        },
      },
      boxShadow: {
        soft: '0 1px 2px rgba(16, 26, 46, 0.06), 0 1px 1px rgba(16, 26, 46, 0.04)',
      },
    },
  },
  plugins: [],
};
