import type { Config } from 'tailwindcss'

/**
 * Palette is lifted verbatim from Zama's own brand stylesheet
 * (CSS custom properties such as `--zama-yellow: #ffd208`). Keeping these
 * exact makes the app read as a first-party Zama product.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        zama: {
          yellow: '#ffd208',
          'yellow-press': '#e6bd00',
          'medium-yellow': '#ffe052',
          'light-yellow': '#fff2b5',
          'soft-yellow': '#fffbe6',
          orange: '#ffb243',
          'soft-orange': '#fff7ec',
        },
        ink: {
          DEFAULT: '#111314',
          soft: '#2e2e2e',
          muted: '#5b6163',
          faint: '#8a9092',
        },
        paper: {
          DEFAULT: '#f2efec',
          card: '#ffffff',
          soft: '#f7f5f2',
          sunken: '#ece8e3',
        },
        line: {
          DEFAULT: '#e8e4df',
          strong: '#d9d4ce',
        },
        state: {
          success: '#1f9d55',
          danger: '#d64545',
          warn: '#ffb243',
          info: '#2b44ff',
        },
      },
      fontFamily: {
        sans: ['Archivo', 'system-ui', 'sans-serif'],
        display: ['Archivo', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        card: '14px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(17,19,20,0.04), 0 10px 30px -12px rgba(17,19,20,0.12)',
        pop: '0 18px 50px -16px rgba(17,19,20,0.22)',
        'yellow-glow': '0 8px 28px -8px rgba(255,210,8,0.55)',
      },
      keyframes: {
        'cipher-shimmer': {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
      },
      animation: {
        'cipher-shimmer': 'cipher-shimmer 2.4s linear infinite',
        'fade-up': 'fade-up 0.5s cubic-bezier(0.22,1,0.36,1) both',
        'pulse-soft': 'pulse-soft 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config
