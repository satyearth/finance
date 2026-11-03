import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-app': 'var(--bg-app)',
        'bg-surface': 'var(--bg-surface)',
        'bg-surface-elevated': 'var(--bg-surface-elevated)',
        'bg-input': 'var(--bg-input)',

        'border-subtle': 'var(--border-subtle)',
        'border-active': 'var(--border-active)',

        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Geist", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        display: ["var(--font-geist-sans)", "Geist", "-apple-system", "sans-serif"],
        mono: ["'IBM Plex Mono'", "var(--font-geist-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      letterSpacing: {
        tighter: '-0.05em',
        tight: '-0.035em',
        normal: '0',
        wide: '0.04em',
        wider: '0.08em',
        widest: '0.12em',
      },
      borderRadius: {
        none: '0px',
        xs: '2px',
        sm: '2px',
        DEFAULT: '0px',
        md: '2px',
        lg: '0px',
        xl: '0px',
        '2xl': '0px',
        '3xl': '0px',
        full: '9999px',
      },
      boxShadow: {
        none: 'none',
        xs: '0 1px 2px 0 rgba(27, 26, 24, 0.04)',
        sm: '0 1px 3px 0 rgba(27, 26, 24, 0.05)',
        md: '0 4px 10px -2px rgba(27, 26, 24, 0.07)',
        lg: '0 12px 24px -4px rgba(27, 26, 24, 0.08)',
      },
    },
  },
  plugins: [],
};

export default config;
