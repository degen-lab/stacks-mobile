/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.tsx",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0C0C0D',
        },
        secondary: {
          DEFAULT: '#595754',
        },
        tertiary: {
          DEFAULT: '#B7B4B0',
        },
        sand: {
          100: '#F3F2F0',
          200: '#E6E4E2',
          300: '#D8D6D3',
          400: '#B7B4B0',
          500: '#95918C',
          600: '#7B7775',
          700: '#605D5D',
          800: '#484747',
          900: '#303030',
          950: '#141414',
        },
        surface: {
          tertiary: '#F7F6F5',
          secondary: '#D5D3D1'
        },
        feedback: {
          yellow: {
            100: '#FEFCE9',
            700: '#A99100'
          },
          green: {
            DEFAULT: '#22C55E',
            100: '#F0FDF4',
            700: '#15803D'
          }
        },
        stacks: {
          'blood-orange': '#FC6432',
          'accent-400': '#FF8A64',
        },
        border: {
          primary: '#BFBDBA',
          secondary: '#D5D3D1',
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
        'matter-sq-mono': ['MatterSQMono-Medium', 'system-ui', 'monospace'],
        'matter-mono': ['MatterMono-Regular', 'system-ui', 'monospace'],
      },
      boxShadow: {
        'elevation-light-m': '0 8px 16px 0 rgba(213, 211, 209, 0.4)',
        'blood-orange': '0 8px 16px 0 rgba(252, 100, 50, 0.4)',
      },
      fontSize: {
        xxs: ['0.6875rem', { lineHeight: '1rem' }],
      },
    },
  },
  plugins: [],
}
