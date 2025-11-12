/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        'spiral-dark': '#0a0a0a',
        'spiral-light': '#f5f5f5',
        'spiral-accent': '#fbbf24', // Gold accent (marca STRTGY)
        // Phase colors
        'phase-overview': '#60a5fa',  // Blue
        'phase-discovery': '#34d399', // Green
        'phase-strategy': '#fb923c',  // Orange
        'phase-execution': '#a78bfa', // Purple
        'phase-scale': '#fbbf24',     // Gold
      },
      animation: {
        'spin-slow': 'spin 20s linear infinite',
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-in',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      typography: (theme) => ({
        invert: {
          css: {
            '--tw-prose-body': theme('colors.gray[300]'),
            '--tw-prose-headings': theme('colors.spiral-light'),
            '--tw-prose-links': theme('colors.spiral-accent'),
            '--tw-prose-bold': theme('colors.spiral-light'),
            '--tw-prose-code': theme('colors.spiral-accent'),
            '--tw-prose-quotes': theme('colors.gray[300]'),
            '--tw-prose-quote-borders': theme('colors.spiral-accent'),
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};

