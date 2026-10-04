import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sand: { 50: '#FBF8F3', 100: '#F6F0E6', 200: '#ECE2D2', 300: '#DDCDB4' },
        ink: { DEFAULT: '#1E1A16', 700: '#3A332C', 500: '#6B6157', 400: '#8C8277', 300: '#B5AB9F' },
        terra: { DEFAULT: '#C2532B', 600: '#A8441F', 100: '#F7E3D9', 50: '#FBF1EC' },
        olive: { DEFAULT: '#5C6B3A', 100: '#E7EBDC' },
        gold: { DEFAULT: '#B98A3A', 100: '#F4EAD6' },
        tiber: { DEFAULT: '#8FB3BF', 100: '#E3EEF1' },
      },
      fontFamily: {
        serif: ['"Fraunces Variable"', 'Fraunces', 'Georgia', 'serif'],
        sans: ['"Inter Variable"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(30,26,22,0.04), 0 8px 24px -12px rgba(30,26,22,0.12)',
        lift: '0 2px 4px rgba(30,26,22,0.05), 0 18px 40px -16px rgba(30,26,22,0.22)',
      },
      borderRadius: { '4xl': '2rem' },
      keyframes: {
        fadeUp: { '0%': { opacity: '0', transform: 'translateY(10px)' }, '100%': { opacity: '1', transform: 'none' } },
        scaleIn: { '0%': { opacity: '0', transform: 'scale(.96)' }, '100%': { opacity: '1', transform: 'none' } },
        shimmer: { '0%': { backgroundPosition: '-400px 0' }, '100%': { backgroundPosition: '400px 0' } },
        pulseDot: { '0%,100%': { opacity: '.3' }, '50%': { opacity: '1' } },
        slideIn: { '0%': { transform: 'translateX(100%)' }, '100%': { transform: 'none' } },
      },
      animation: {
        'fade-up': 'fadeUp .5s cubic-bezier(.2,.7,.2,1) both',
        'scale-in': 'scaleIn .35s cubic-bezier(.2,.7,.2,1) both',
        shimmer: 'shimmer 1.4s linear infinite',
        'pulse-dot': 'pulseDot 1.2s ease-in-out infinite',
        'slide-in': 'slideIn .35s cubic-bezier(.2,.7,.2,1) both',
      },
    },
  },
  plugins: [],
} satisfies Config;
