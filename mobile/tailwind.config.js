/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./App.tsx",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'rgb(var(--color-text-primary) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'rgb(var(--color-text-secondary) / <alpha-value>)',
        },
        tertiary: {
          DEFAULT: 'rgb(var(--color-text-tertiary) / <alpha-value>)',
        },
        sand: {
          100: 'rgb(var(--color-sand-100) / <alpha-value>)',
          200: 'rgb(var(--color-sand-200) / <alpha-value>)',
          300: 'rgb(var(--color-sand-300) / <alpha-value>)',
          400: 'rgb(var(--color-sand-400) / <alpha-value>)',
          500: 'rgb(var(--color-sand-500) / <alpha-value>)',
          600: 'rgb(var(--color-sand-600) / <alpha-value>)',
          700: 'rgb(var(--color-sand-700) / <alpha-value>)',
          800: 'rgb(var(--color-sand-800) / <alpha-value>)',
          850: 'rgb(var(--color-sand-850) / <alpha-value>)',
          900: 'rgb(var(--color-sand-900) / <alpha-value>)',
          950: 'rgb(var(--color-sand-950) / <alpha-value>)',
        },
        surface: {
          tertiary: 'rgb(var(--color-surface-tertiary) / <alpha-value>)',
          secondary: 'rgb(var(--color-surface-secondary) / <alpha-value>)',
          primary: 'rgb(var(--color-surface-primary) / <alpha-value>)',
        },
        feedback: {
          yellow: {
            100: '#FEFCE9',
            700: '#A99100'
          },
          green: {
            DEFAULT: '#22C55E',
            100: '#F0FDF4',
            150: '#C2E7D0',
            700: '#15803D'
          },
          blue: {
            100: '#EBF4FC',
            200: '#D5E8F5',
            900: '#1E3D8B',
          },
        },
        stacks: {
          'blood-orange': '#FC6432',
          'accent-400': '#FF8A64',
        },
        'accent-bitcoin': {
          600: '#E17C18',
        },
        'accent-stacks': {
          700: '#9C310D',
        },
        bitcoin: {
          DEFAULT: '#F7931A',
          50: '#FEF7EC',
          100: '#FCEFD9',
          200: '#ffd1a7',
          300: '#F7CF8D',
          400: '#F4BF67',
          500: '#F7931A',
          600: '#e17c18',
          700: '#C97713',
          800: '#B26910',
          900: '#9B5B0D',
        },
        border: {
          primary: 'rgb(var(--color-border-primary) / <alpha-value>)',
          secondary: 'rgb(var(--color-border-secondary) / <alpha-value>)',
        },
      },
      fontFamily: {
        inter: ['Inter', 'system-ui', 'sans-serif'],
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Georgia', 'Times New Roman', 'serif'],
        mono: ['Menlo', 'Monaco', 'Courier New', 'monospace'],
        // Custom fonts
        'instrument-sans': ['InstrumentSans-Regular', 'system-ui', 'sans-serif'],
        'instrument-sans-medium': ['InstrumentSans-Medium', 'system-ui', 'sans-serif'],
        'instrument-sans-semibold': ['InstrumentSans-SemiBold', 'system-ui', 'sans-serif'],
        'instrument-sans-bold': ['InstrumentSans-Bold', 'system-ui', 'sans-serif'],
        'dm-sans-extralight': ['DMSans-ExtraLight', 'system-ui', 'sans-serif'],
        'matter': ['Matter-Regular', 'system-ui', 'sans-serif'],
        'matter-sq-mono': ['MatterSQMono-Regular', 'system-ui', 'monospace'],
        'matter-mono': ['MatterMono-Regular', 'system-ui', 'monospace'],
      },
      boxShadow: {
        'elevation-light-m': '0 8px 16px 0 rgba(213, 211, 209, 0.4)',
        'elevation-light-l': '0 16px 32px 0 rgba(183, 180, 176, 0.2)',
        'blood-orange': '0 8px 16px 0 rgba(252, 100, 50, 0.4)',
        'dual-stacking': '0 10px 30px -5px rgba(255, 152, 53, 0.5)',
        'cta-button': '0 8px 26px 0 rgba(255, 152, 53, 0.8)',
        'next-step-icon': '0 4px 13px 0 rgba(117, 172, 243, 1)',
      },
      fontSize: {
        xxs: ['0.6875rem', { lineHeight: '1rem' }],
      },
    },
  },
  plugins: [],
}
