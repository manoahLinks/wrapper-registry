import type { Config } from 'tailwindcss'

/**
 * Neo-brutalist "Wrapper Registry" palette — warm cream paper, ink black,
 * a single high-chroma yellow accent, hard borders and offset shadows.
 * Token NAMES are kept stable (zama-yellow, paper, ink, line, …) so the whole
 * component tree restyles from these values without per-class churn.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        zama: {
          yellow: '#ffd000',
          'yellow-press': '#e6bb00',
          'medium-yellow': '#ffda33',
          'light-yellow': '#ffe98a',
          'soft-yellow': '#fbefc2',
          orange: '#ff9e2c',
          'soft-orange': '#fff3df',
        },
        ink: {
          DEFAULT: '#0b0b0c',
          soft: '#2e2b26',
          muted: '#57534b',
          faint: '#8b867a',
          dim: '#a8a294',
        },
        paper: {
          DEFAULT: '#f1ece1',
          card: '#ffffff',
          soft: '#f8f5ee',
          sunken: '#ece7da',
        },
        line: {
          DEFAULT: '#e2dccd',
          strong: '#d8d2c2',
          dashed: '#b7b1a1',
        },
        state: {
          success: '#16a34a',
          danger: '#c0392b',
          warn: '#ffb020',
          info: '#6b7cff',
        },
      },
      fontFamily: {
        sans: ['Archivo', 'system-ui', 'sans-serif'],
        display: ['Archivo', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        card: '16px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(28,22,8,0.04)',
        pop: '0 12px 34px rgba(20,16,8,0.16)',
        modal: '0 24px 60px rgba(20,14,4,0.28)',
        lift: '0 12px 32px rgba(28,22,8,0.09)',
        brutal: '3px 3px 0 #0b0b0c',
        'brutal-lg': '4px 4px 0 #0b0b0c',
        'brutal-sm': '1px 1px 0 #0b0b0c',
        'yellow-glow': '0 8px 28px -8px rgba(255,208,0,0.55)',
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
        pop: {
          '0%': { opacity: '0', transform: 'translateY(14px) scale(.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        scrim: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.35' },
        },
      },
      animation: {
        'cipher-shimmer': 'cipher-shimmer 2.4s linear infinite',
        'fade-up': 'fade-up 0.45s cubic-bezier(0.22,1,0.36,1) both',
        pop: 'pop 0.2s ease both',
        scrim: 'scrim 0.18s ease both',
        'pulse-soft': 'pulse-soft 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config
