# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RankXRP is an XRP holder ranking tool that shows users their tier (Whale to Plankton), percentile ranking, and progress to next tier. Built with Next.js 14, it connects to the XRPL mainnet via WebSocket for real-time balance lookups.

## Development Commands

```bash
# Start local development with Docker (includes Redis)
cd docker && docker-compose up -d

# View logs
docker-compose logs -f app

# Stop containers
docker-compose down

# Run without Docker (requires Redis running locally)
npm run dev

# Type check
npx tsc --noEmit

# Build for production
npm run build
```

## Architecture

### Backend Flow
```
User enters address → API validates address → XRPL WebSocket fetches balance →
Redis cache provides thresholds/price → Tier calculation → JSON response
```

### Key Backend Files

- **[src/lib/xrpl/](src/lib/xrpl/)** - XRPL integration
  - `client.ts` - WebSocket connection to `wss://xrplcluster.com` with fallback
  - `balance.ts` - `getAccountBalance()` using `withXrplClient()` wrapper that auto-disconnects
  - `validation.ts` - XRP address validation (r-address and X-address formats)

- **[src/lib/cache/](src/lib/cache/)** - Redis caching layer
  - `redis.ts` - ioredis singleton client
  - `price.ts` - XRP price cache (5-min TTL, key: `xrp:price:usd`)
  - `thresholds.ts` - Tier thresholds cache (1-hour TTL, key: `xrp:thresholds`)

- **[src/lib/services/](src/lib/services/)** - Business logic
  - `coingecko.ts` - Price fetching with Binance fallback
  - `xrpscan.ts` - Distribution data with stale-while-revalidate pattern
  - `tier.ts` - `calculateTier()` determines tier, percentile, and progress

- **[src/lib/constants/tiers.ts](src/lib/constants/tiers.ts)** - 8 tier definitions with colors and percentiles

### API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /api/lookup?address=rXXX` | Main lookup - returns tier, balance, percentile, progress |
| `GET /api/thresholds` | Tier threshold XRP amounts |
| `GET /api/stats` | Total accounts, median balance |
| `GET /api/health` | Health check for Fly.io |

### Frontend Components

- **[src/components/ParticleBackground.tsx](src/components/ParticleBackground.tsx)** - Canvas-based bioluminescent particle effect
- **[src/components/WalletForm.tsx](src/components/WalletForm.tsx)** - Address input with client-side validation
- **[src/components/TierDisplay.tsx](src/components/TierDisplay.tsx)** - Tier reveal with animations
- **[src/components/ProgressToNextTier.tsx](src/components/ProgressToNextTier.tsx)** - Progress bar with shimmer effect

### Pages

- **[src/app/page.tsx](src/app/page.tsx)** - Landing page (server component)
- **[src/app/result/page.tsx](src/app/result/page.tsx)** - Results page (client component, fetches from API)

## Design System

Colors defined in [tailwind.config.ts](tailwind.config.ts):
- `xrp-*` - Core palette (dark, charcoal, slate, white, mist)
- `ocean-*` - Accent colors (abyss, surface, deep, glow)
- `tier-*` - Per-tier colors (whale through plankton)

CSS classes in [src/app/globals.css](src/app/globals.css):
- `.btn-primary` / `.btn-secondary` - Buttons
- `.input-wallet` - Monospace wallet input
- `.card` / `.card-tier` - Card variants
- `.progress-container` / `.progress-fill` - Progress bar
- `.text-gradient` - Ocean gradient text

## Important Configuration

**next.config.mjs** - Must externalize xrpl/ws packages to avoid WebSocket bundling issues:
```js
experimental: {
  serverComponentsExternalPackages: ['xrpl', 'ws', 'bufferutil', 'utf-8-validate'],
}
```

**Environment Variables**:
- `REDIS_URL` - Redis connection string (default: `redis://localhost:6379`)
- `NEXT_PUBLIC_APP_URL` - App URL for OG images

## Deployment

Fly.io configuration in [fly.toml](fly.toml). Deploy with:
```bash
fly launch --name rankxrp
fly redis create
fly deploy
```
