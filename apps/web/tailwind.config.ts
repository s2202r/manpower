import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fef9ee',
          100: '#fdf0d2',
          200: '#fbdda0',
          300: '#f9c365',
          400: '#f6a330',
          500: '#f48512',
          600: '#e56808',
          700: '#be4d09',
          800: '#973d0f',
          900: '#7a3410',
          950: '#421806',
        },
      },
    },
  },
  plugins: [],
}

export default config
