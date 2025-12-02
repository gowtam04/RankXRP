# RankXRP Design Guide

**Version:** 1.0  
**Date:** December 2, 2025  
**App:** RankXRP — "XRP holder rankings."

---

## Design Philosophy

RankXRP combines the **sleek, institutional confidence of XRP's brand** with **ocean depth metaphors** that make wealth distribution tangible and memorable.

**Core Principles:**
- **Dark-first**: Like XRP, we lead with depth and sophistication
- **High contrast**: Information cuts through clearly
- **Organic motion**: Subtle underwater-inspired animations
- **Confidence without arrogance**: Accessible to all holder sizes

**Tone:** Premium fintech meets deep-sea exploration. Not flashy crypto bro energy — more like a sophisticated dive watch.

---

## Color System

### Primary Palette (XRP Core)

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **XRP Dark** | `#23292F` | 35, 41, 47 | Primary background, cards |
| **XRP Charcoal** | `#1A1F24` | 26, 31, 36 | Deeper backgrounds, headers |
| **XRP Slate** | `#2E353D` | 46, 53, 61 | Elevated surfaces, hover states |
| **XRP White** | `#FFFFFF` | 255, 255, 255 | Primary text, icons |
| **XRP Mist** | `#9CA3AF` | 156, 163, 175 | Secondary text, labels |

### Ocean Accent Palette

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Abyss Blue** | `#0EA5E9` | 14, 165, 233 | Primary accent, CTAs, links |
| **Surface Teal** | `#14B8A6` | 20, 184, 166 | Success states, positive progress |
| **Deep Cyan** | `#06B6D4` | 6, 182, 212 | Highlights, focus rings |
| **Bioluminescent** | `#22D3EE` | 34, 211, 238 | Special emphasis, glow effects |

### Tier Colors

Each tier gets a signature color that works on dark backgrounds:

| Tier | Icon | Color | Hex |
|------|------|-------|-----|
| Whale | 🐋 | Royal Blue | `#3B82F6` |
| Shark | 🦈 | Steel Gray | `#64748B` |
| Dolphin | 🐬 | Ocean Cyan | `#06B6D4` |
| Tuna | 🐟 | Deep Teal | `#0D9488` |
| Squid | 🦑 | Purple Ink | `#8B5CF6` |
| Shrimp | 🦐 | Coral Pink | `#F472B6` |
| Crab | 🦀 | Warm Orange | `#F97316` |
| Plankton | 🦠 | Sea Green | `#22C55E` |

### Semantic Colors

| Purpose | Color | Hex |
|---------|-------|-----|
| Success | Teal | `#14B8A6` |
| Warning | Amber | `#F59E0B` |
| Error | Red | `#EF4444` |
| Info | Cyan | `#06B6D4` |

---

## CSS Variables

```css
:root {
  /* XRP Core */
  --xrp-dark: #23292F;
  --xrp-charcoal: #1A1F24;
  --xrp-slate: #2E353D;
  --xrp-white: #FFFFFF;
  --xrp-mist: #9CA3AF;
  
  /* Ocean Accents */
  --ocean-abyss: #0EA5E9;
  --ocean-surface: #14B8A6;
  --ocean-deep: #06B6D4;
  --ocean-glow: #22D3EE;
  
  /* Gradients */
  --gradient-ocean: linear-gradient(135deg, #0EA5E9 0%, #06B6D4 50%, #14B8A6 100%);
  --gradient-depth: linear-gradient(180deg, #23292F 0%, #1A1F24 100%);
  --gradient-surface: linear-gradient(180deg, #2E353D 0%, #23292F 100%);
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.5);
  --shadow-glow: 0 0 20px rgba(14, 165, 233, 0.3);
  
  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;
  --space-3xl: 64px;
  
  /* Border Radius */
  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 9999px;
  
  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-normal: 250ms ease;
  --transition-slow: 400ms ease;
}
```

---

## Typography

### Font Stack

**Primary (Display & UI):**
```css
font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
```

**Monospace (Wallet Addresses, Numbers):**
```css
font-family: 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace;
```

### Import
```html
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

### Type Scale

| Name | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| **Hero** | 48px / 3rem | 800 | 1.1 | Landing page headline |
| **H1** | 36px / 2.25rem | 700 | 1.2 | Page titles |
| **H2** | 28px / 1.75rem | 700 | 1.25 | Section headers |
| **H3** | 22px / 1.375rem | 600 | 1.3 | Card titles |
| **Body Large** | 18px / 1.125rem | 400 | 1.6 | Intro text |
| **Body** | 16px / 1rem | 400 | 1.5 | Default text |
| **Body Small** | 14px / 0.875rem | 400 | 1.5 | Secondary info |
| **Caption** | 12px / 0.75rem | 500 | 1.4 | Labels, timestamps |
| **Mono** | 14px / 0.875rem | 400 | 1.4 | Wallet addresses |

### Typography Styles

```css
.text-hero {
  font-size: 3rem;
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.text-tier-display {
  font-size: 4rem;
  font-weight: 800;
  line-height: 1;
  background: var(--gradient-ocean);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.text-wallet {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.875rem;
  letter-spacing: 0.02em;
  color: var(--xrp-mist);
}

.text-balance {
  font-family: 'JetBrains Mono', monospace;
  font-size: 2rem;
  font-weight: 500;
  color: var(--xrp-white);
}
```

---

## Components

### Buttons

**Primary Button:**
```css
.btn-primary {
  background: var(--gradient-ocean);
  color: var(--xrp-charcoal);
  font-weight: 600;
  padding: 14px 28px;
  border-radius: var(--radius-lg);
  border: none;
  cursor: pointer;
  transition: all var(--transition-normal);
  box-shadow: var(--shadow-md), var(--shadow-glow);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg), 0 0 30px rgba(14, 165, 233, 0.4);
}

.btn-primary:active {
  transform: translateY(0);
}
```

**Secondary Button:**
```css
.btn-secondary {
  background: transparent;
  color: var(--xrp-white);
  font-weight: 600;
  padding: 14px 28px;
  border-radius: var(--radius-lg);
  border: 2px solid var(--xrp-slate);
  cursor: pointer;
  transition: all var(--transition-normal);
}

.btn-secondary:hover {
  border-color: var(--ocean-abyss);
  background: rgba(14, 165, 233, 0.1);
}
```

### Input Field

```css
.input-wallet {
  background: var(--xrp-charcoal);
  border: 2px solid var(--xrp-slate);
  border-radius: var(--radius-lg);
  padding: 16px 20px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 1rem;
  color: var(--xrp-white);
  width: 100%;
  transition: all var(--transition-normal);
}

.input-wallet::placeholder {
  color: var(--xrp-mist);
  opacity: 0.6;
}

.input-wallet:focus {
  outline: none;
  border-color: var(--ocean-abyss);
  box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.15);
}
```

### Cards

**Result Card:**
```css
.card-result {
  background: var(--gradient-surface);
  border: 1px solid var(--xrp-slate);
  border-radius: var(--radius-xl);
  padding: var(--space-xl);
  box-shadow: var(--shadow-lg);
}
```

**Tier Display Card:**
```css
.card-tier {
  background: var(--xrp-charcoal);
  border-radius: var(--radius-xl);
  padding: var(--space-2xl);
  text-align: center;
  position: relative;
  overflow: hidden;
}

.card-tier::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--gradient-ocean);
}
```

### Progress Bar

```css
.progress-container {
  background: var(--xrp-charcoal);
  border-radius: var(--radius-full);
  height: 12px;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: var(--gradient-ocean);
  border-radius: var(--radius-full);
  transition: width var(--transition-slow);
  position: relative;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.2) 50%,
    transparent 100%
  );
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
```

### Tier Badge

```css
.tier-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  background: rgba(14, 165, 233, 0.1);
  border: 1px solid rgba(14, 165, 233, 0.3);
  border-radius: var(--radius-full);
  font-weight: 600;
  font-size: 0.875rem;
}

.tier-badge .icon {
  font-size: 1.25rem;
}
```

---

## Animations

### Entrance Animations

```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.animate-fade-in-up {
  animation: fadeInUp 0.6s ease forwards;
}

.animate-scale-in {
  animation: scaleIn 0.4s ease forwards;
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}
```

### Background Effects

```css
/* Subtle underwater particle effect */
.bg-particles {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}

.particle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: var(--ocean-glow);
  border-radius: 50%;
  opacity: 0.3;
  animation: rise 15s infinite;
}

@keyframes rise {
  0% {
    transform: translateY(100vh) scale(0);
    opacity: 0;
  }
  10% {
    opacity: 0.3;
  }
  90% {
    opacity: 0.3;
  }
  100% {
    transform: translateY(-10vh) scale(1);
    opacity: 0;
  }
}
```

---

## Layout

### Container

```css
.container {
  max-width: 640px;
  margin: 0 auto;
  padding: var(--space-md);
}

@media (min-width: 768px) {
  .container {
    padding: var(--space-xl);
  }
}
```

### Page Structure

```css
.page {
  min-height: 100vh;
  background: var(--xrp-dark);
  color: var(--xrp-white);
}

.page-header {
  padding: var(--space-xl) 0;
  text-align: center;
}

.page-content {
  padding: var(--space-xl) 0;
}
```

---

## Responsive Breakpoints

| Name | Width | Usage |
|------|-------|-------|
| Mobile | < 640px | Default mobile-first |
| Tablet | ≥ 640px | Larger touch devices |
| Desktop | ≥ 1024px | Full desktop experience |

```css
/* Mobile first, then scale up */
@media (min-width: 640px) { /* Tablet */ }
@media (min-width: 1024px) { /* Desktop */ }
```

---

## Tailwind Configuration

```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        xrp: {
          dark: '#23292F',
          charcoal: '#1A1F24',
          slate: '#2E353D',
          white: '#FFFFFF',
          mist: '#9CA3AF',
        },
        ocean: {
          abyss: '#0EA5E9',
          surface: '#14B8A6',
          deep: '#06B6D4',
          glow: '#22D3EE',
        },
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
      },
      boxShadow: {
        'glow': '0 0 20px rgba(14, 165, 233, 0.3)',
        'glow-lg': '0 0 30px rgba(14, 165, 233, 0.4)',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.6s ease forwards',
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite',
      },
    },
  },
  plugins: [],
}
```

---

## Dark Mode (Default)

RankXRP is **dark-mode only** by design, reflecting XRP's brand identity. No light mode variant is needed.

---

## Accessibility

- Maintain minimum contrast ratio of 4.5:1 for body text
- Use `prefers-reduced-motion` to disable animations when requested
- Ensure all interactive elements have visible focus states
- Include proper ARIA labels on interactive components

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Example: Results Page Composition

```
┌─────────────────────────────────────────────┐
│  [Logo]  RankXRP              [Share]       │  Header
├─────────────────────────────────────────────┤
│                                             │
│              🐬                              │  Tier Icon (64px)
│           DOLPHIN                           │  Tier Name
│                                             │
│      ───────────────────                    │  Divider
│                                             │
│      Top 0.84% of XRP Holders               │  Percentile
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │  Balance                            │    │
│  │  ═══════════════════════════════    │    │
│  │  42,850 XRP                         │    │  Balance Card
│  │  ≈ $89,985 USD                      │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  Progress to Shark                          │
│  ████████████████░░░░░░  71%               │  Progress Bar
│  You need 17,150 XRP to reach 🦈            │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │    [Check Another Wallet]           │    │  CTA Button
│  └─────────────────────────────────────┘    │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Asset Checklist

| Asset | Format | Sizes |
|-------|--------|-------|
| Logo | SVG | Scalable |
| Favicon | ICO, PNG | 16, 32, 180, 192, 512 |
| OG Image | PNG | 1200×630 |
| Share Card Template | PNG | 1200×630 |
| Tier Icons | Emoji | Native |

---

*Design that respects the XRP brand while making wealth distribution feel approachable.*
