import type { Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{ts,tsx}', './popup.html'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        base: '#0B0E11',
        surface: '#14181D',
        'surface-raised': '#191E24',
        border: '#232830',
        ink: '#EDEFF2',
        muted: '#8B92A0',
        faint: '#565D68',
        accent: {
          DEFAULT: '#4DE8C9',
          dim: '#2B6E63',
          glow: 'rgba(77, 232, 201, 0.18)',
        },
        risk: {
          safe: '#34D399',
          caution: '#F5B942',
          danger: '#F0546B',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        xl: '14px',
        '2xl': '20px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.4), 0 8px 24px -8px rgba(0,0,0,0.5)',
        ring: '0 0 0 1px rgba(77,232,201,0.25), 0 0 32px -4px rgba(77,232,201,0.35)',
      },
      keyframes: {
        sweep: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        sweep: 'sweep 2.4s linear infinite',
        'fade-up': 'fade-up 0.35s ease-out both',
      },
    },
  },
  plugins: [],
} satisfies Config
