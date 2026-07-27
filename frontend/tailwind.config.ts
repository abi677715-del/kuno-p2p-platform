import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}'],
  theme: {
    extend: {
          colors: {
        ink: '#12161F',
        surface: '#1B2226',
        surfaceRaised: '#232C31',
        gold: '#E8A33D',
        teal: '#0B8457',
        paper: '#F2F1EC',
        muted: '#8B9A93',
      },
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
        mono: ['var(--font-mono)'],
      },
    },
  },
  plugins: [],
};
export default config;
