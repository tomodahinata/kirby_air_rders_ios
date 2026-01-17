/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // === AI Copilot Clarity - Dark Mode Design System ===

        // Surface colors (unified dark theme)
        surface: {
          base: '#0f172a', // slate-950 - Main background
          elevated: '#1e293b', // slate-800 - Cards, modals
          overlay: '#334155', // slate-700 - Dropdowns, overlays
          glass: 'rgba(30, 41, 59, 0.8)', // Glassmorphism base
        },

        // Primary accent (Electric Blue)
        primary: {
          DEFAULT: '#3b82f6',
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },

        // Secondary accent (Electric Purple/Violet)
        accent: {
          DEFAULT: '#8b5cf6',
          neon: '#a855f7',
          glow: 'rgba(139, 92, 246, 0.3)',
          warm: '#f97316', // Keep for compatibility
        },

        // Text colors for dark mode (high contrast)
        text: {
          primary: '#f8fafc', // slate-50
          secondary: '#94a3b8', // slate-400
          muted: '#64748b', // slate-500
        },

        // Semantic colors
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',

        // Legacy support (keep for gradual migration)
        background: {
          DEFAULT: '#0f172a',
          secondary: '#1e293b',
        },
        card: {
          DEFAULT: 'rgba(30, 41, 59, 0.9)',
          highlight: 'rgba(251, 191, 36, 0.15)',
          glass: 'rgba(30, 41, 59, 0.7)',
        },
      },
      fontSize: {
        // === Automotive-optimized typography ===

        // Car display sizes (minimum 16px for safety)
        'car-sm': ['16px', { lineHeight: '1.4', fontWeight: '500' }],
        'car-base': ['18px', { lineHeight: '1.5', fontWeight: '400' }],
        'car-lg': ['20px', { lineHeight: '1.4', fontWeight: '500' }],
        'car-xl': ['24px', { lineHeight: '1.3', fontWeight: '600' }],
        'car-2xl': ['32px', { lineHeight: '1.2', fontWeight: '700' }],
        'car-display': ['48px', { lineHeight: '1', fontWeight: '700' }],

        // Tab bar label (fixed 14px)
        'tab-label': ['14px', { lineHeight: '1.2', fontWeight: '600' }],

        // Legacy display sizes
        'display-xl': ['72px', { lineHeight: '1', fontWeight: '700' }],
        'display-lg': ['56px', { lineHeight: '1', fontWeight: '700' }],
        display: ['42px', { lineHeight: '1.1', fontWeight: '600' }],
        'title-lg': ['24px', { lineHeight: '1.3', fontWeight: '600' }],
        title: ['20px', { lineHeight: '1.4', fontWeight: '600' }],
        'body-lg': ['18px', { lineHeight: '1.5', fontWeight: '400' }],
        body: ['16px', { lineHeight: '1.5', fontWeight: '400' }],
        caption: ['14px', { lineHeight: '1.4', fontWeight: '500' }],
        label: ['12px', { lineHeight: '1.4', fontWeight: '600', letterSpacing: '0.05em' }],
      },
      borderRadius: {
        card: '24px',
        'card-sm': '16px',
        pill: '9999px',
      },
      boxShadow: {
        card: '0 4px 24px rgba(0, 0, 0, 0.15)',
        'card-hover': '0 8px 32px rgba(0, 0, 0, 0.25)',
        'card-neon': '0 4px 24px rgba(59, 130, 246, 0.25)',
        'glow-primary': '0 0 20px rgba(59, 130, 246, 0.4)',
        'glow-accent': '0 0 20px rgba(139, 92, 246, 0.4)',
      },
      spacing: {
        touch: '48px', // Minimum touch target
        'touch-lg': '56px', // Large touch target
        'touch-xl': '64px', // Extra large (primary CTAs)
      },
    },
  },
  plugins: [],
};
