import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0F1420',
        surface: '#171E2E',
        surfaceRaised: '#1E2740',
        gold: '#D4A73C',
        teal: '#2FB8A6',
        paper: '#F2F1EC',
        muted: '#8B93A7',
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
