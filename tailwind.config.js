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
        // Light mode design system
        background: {
          DEFAULT: '#e8eaed',
          secondary: '#f5f6f8',
        },
        card: {
          DEFAULT: 'rgba(255, 255, 255, 0.9)',
          highlight: 'rgba(255, 248, 240, 0.95)',
          glass: 'rgba(255, 255, 255, 0.7)',
        },
        text: {
          primary: '#1a1a1a',
          secondary: '#6b7280',
          muted: '#9ca3af',
        },
        accent: {
          warm: '#f97316',
          blue: '#3b82f6',
          green: '#22c55e',
        },
      },
      fontSize: {
        // Car-optimized typography (larger for visibility)
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
        card: '0 4px 24px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 8px 32px rgba(0, 0, 0, 0.12)',
      },
      spacing: {
        touch: '48px',
        'touch-lg': '64px',
      },
    },
  },
  plugins: [],
};
