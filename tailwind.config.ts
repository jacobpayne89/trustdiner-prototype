import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        trustdiner: {
          green: "#00CC87",
          yellow: "#FBBC1D", 
          red: "#F75E52",
          grey: "#C7C7C7",
        },
      },
      fontFamily: {
        ubuntu: ["var(--font-ubuntu)", "sans-serif"],
      },
      animation: {
        'radio-wave': 'radio-wave 2s infinite',
        'marker-blink': 'marker-blink 1s infinite',
      },
      keyframes: {
        'radio-wave': {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '1%': { opacity: '0.8' },
          '100%': { transform: 'scale(1)', opacity: '0' }
        },
        'marker-blink': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' }
        }
      }
    },
  },
  plugins: [],
};

export default config; 