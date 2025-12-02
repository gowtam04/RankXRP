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
        // XRP Core Palette
        xrp: {
          dark: '#23292F',
          charcoal: '#1A1F24',
          slate: '#2E353D',
          white: '#FFFFFF',
          mist: '#9CA3AF',
        },
        // Ocean Accent Palette
        ocean: {
          abyss: '#0EA5E9',
          surface: '#14B8A6',
          deep: '#06B6D4',
          glow: '#22D3EE',
        },
        // Tier Colors
        tier: {
          whale: '#3B82F6',
          shark: '#64748B',
          dolphin: '#06B6D4',
          tuna: '#0D9488',
          squid: '#8B5CF6',
          shrimp: '#F472B6',
          crab: '#F97316',
          plankton: '#22C55E',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'gradient-ocean': 'linear-gradient(135deg, #0EA5E9 0%, #06B6D4 50%, #14B8A6 100%)',
        'gradient-depth': 'linear-gradient(180deg, #23292F 0%, #1A1F24 100%)',
        'gradient-surface': 'linear-gradient(180deg, #2E353D 0%, #23292F 100%)',
        'gradient-radial-glow': 'radial-gradient(ellipse at center, rgba(14, 165, 233, 0.15) 0%, transparent 70%)',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(14, 165, 233, 0.3)',
        'glow-lg': '0 0 30px rgba(14, 165, 233, 0.4)',
        'glow-xl': '0 0 50px rgba(14, 165, 233, 0.5)',
        'inner-glow': 'inset 0 0 20px rgba(14, 165, 233, 0.1)',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.6s ease forwards',
        'fade-in': 'fadeIn 0.4s ease forwards',
        'scale-in': 'scaleIn 0.4s ease forwards',
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'rise': 'rise 15s infinite',
        'tier-reveal': 'tierReveal 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(14, 165, 233, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(14, 165, 233, 0.5)' },
        },
        rise: {
          '0%': { transform: 'translateY(100vh) scale(0)', opacity: '0' },
          '10%': { opacity: '0.3' },
          '90%': { opacity: '0.3' },
          '100%': { transform: 'translateY(-10vh) scale(1)', opacity: '0' },
        },
        tierReveal: {
          '0%': { opacity: '0', transform: 'scale(0.5) translateY(30px)' },
          '50%': { opacity: '1', transform: 'scale(1.1) translateY(-5px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};

export default config;
