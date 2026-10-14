import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        'brand-base': 'var(--color-bg-base)',
        'brand-surface': 'var(--color-bg-surface)',
        'brand-elevated': 'var(--color-bg-elevated)',
        'brand-text': 'var(--color-text-primary)',
        'brand-secondary': 'var(--color-text-secondary)',
        'brand-muted': 'var(--color-text-muted)',
        'brand-border': 'var(--color-border)',
        'brand-accent': 'var(--color-accent)',
        'brand-accent-hover': 'var(--color-accent-hover)',
        'brand-accent-contrast': 'var(--color-accent-contrast)',
        'brand-focus': 'var(--color-focus)',
        'brand-success': 'var(--color-success)',
        'brand-warning': 'var(--color-warning)',
        'brand-error': 'var(--color-error)',
        'brand-info': 'var(--color-info)',
      },
      fontFamily: {
        sans: [
          'Noto Sans',
          'Noto Sans Telugu',
          'Noto Sans Devanagari',
          'system-ui',
          'sans-serif',
        ],
      },
      fontSize: {
        h1: ['28px', { lineHeight: '36px', fontWeight: '700' }],
        h2: ['22px', { lineHeight: '30px', fontWeight: '600' }],
        h3: ['19px', { lineHeight: '26px', fontWeight: '600' }],
        body: ['17px', { lineHeight: '26px', fontWeight: '400' }],
        small: ['16px', { lineHeight: '24px', fontWeight: '400' }],
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(28, 35, 48, 0.06)',
      },
      spacing: {
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        6: '24px',
        8: '32px',
        12: '48px',
      },
    },
  },
  plugins: [],
};

export default config;
