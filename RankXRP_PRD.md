# Product Requirements Document: RankXRP

## Branding

**Name:** RankXRP

**Tagline:** "XRP holder rankings."

**Domain:** rankxrp.com

---

## Executive Summary

RankXRP is a simple tool that answers one question: **"Where do I rank among XRP holders?"**

Users enter a wallet address and instantly see their tier (Whale, Dolphin, Shrimp, etc.), exact percentile ranking, and how much XRP they need to reach the next level. No signup required.

---

## Problem Statement

- Existing XRP rich lists show raw data without context
- Users have no easy way to understand where they rank among all holders
- No visualization of "how much more" is needed to reach the next milestone
- Rich lists focus on whales, making average holders feel disconnected

**User Pain Point:** "I have X XRP but have no idea if that's a lot or a little compared to others."

---

## Solution

RankXRP provides:

1. **Tier Classification** - Translate balance into meaningful tiers (Whale → Plankton)
2. **Percentile Ranking** - "You're in the top 8.3% of all holders"
3. **Progress Visualization** - See how close you are to the next tier
4. **Goal Calculator** - "You need X more XRP to reach Dolphin"
5. **Shareable Cards** - Flex your tier without revealing exact balance

---

## Target Users

**Primary:** XRP holders who want to understand where they stand relative to others.

**Secondary:** Curious observers interested in XRP wealth distribution.

---

## Features

### F1: Wallet Lookup
**Priority:** P0 (Must Have)

| Requirement | Description |
|-------------|-------------|
| F1.1 | Enter any valid XRP wallet address |
| F1.2 | Validate address format before lookup |
| F1.3 | Fetch current balance from XRPL in real-time |
| F1.4 | Display balance in XRP with USD equivalent |
| F1.5 | Handle errors gracefully (invalid address, network issues) |

---

### F2: Tier System
**Priority:** P0 (Must Have)

| Tier | Name | Icon | Percentile |
|------|------|------|------------|
| 1 | Whale | 🐋 | Top 0.01% |
| 2 | Shark | 🦈 | Top 0.1% |
| 3 | Dolphin | 🐬 | Top 1% |
| 4 | Tuna | 🐟 | Top 5% |
| 5 | Squid | 🦑 | Top 10% |
| 6 | Shrimp | 🦐 | Top 25% |
| 7 | Crab | 🦀 | Top 50% |
| 8 | Plankton | 🦠 | Bottom 50% |

| Requirement | Description |
|-------------|-------------|
| F2.1 | Assign tier based on percentile rank |
| F2.2 | Display tier name and icon prominently |
| F2.3 | Show exact percentile (e.g., "Top 7.23%") |
| F2.4 | Thresholds update based on live distribution data |

---

### F3: Progress to Next Tier
**Priority:** P0 (Must Have)

| Requirement | Description |
|-------------|-------------|
| F3.1 | Show progress bar within current tier |
| F3.2 | Display XRP needed to reach next tier |
| F3.3 | Show USD equivalent at current price |

**Example:**
```
🦐 Shrimp (Top 18.4%)

Progress to Squid: [████████████░░░░░░░░] 62%

You need 8,450 XRP (~$17,745) to reach 🦑 Squid
```

---

### F4: Distribution Stats
**Priority:** P1 (Should Have)

| Requirement | Description |
|-------------|-------------|
| F4.1 | Display total number of funded XRP accounts |
| F4.2 | Show threshold amounts for each tier |
| F4.3 | Show timestamp of last data update |

---

### F5: Share Card
**Priority:** P1 (Should Have)

| Requirement | Description |
|-------------|-------------|
| F5.1 | Generate image showing tier (not exact balance) |
| F5.2 | One-click share to Twitter/X |
| F5.3 | Include app URL on card |

**Example:**
```
┌─────────────────────────────┐
│         🦐 SHRIMP           │
│   Top 18.4% of XRP Holders  │
│                             │
│        rankxrp.com          │
└─────────────────────────────┘
```

---

### F6: Wallet Watchlist
**Priority:** P2 (Nice to Have)

| Requirement | Description |
|-------------|-------------|
| F6.1 | Save multiple wallets to localStorage |
| F6.2 | Quick switch between saved wallets |
| F6.3 | Nickname wallets for easy identification |

---

### F7: Goal Calculator
**Priority:** P2 (Nice to Have)

| Requirement | Description |
|-------------|-------------|
| F7.1 | Select target tier |
| F7.2 | Enter monthly DCA amount |
| F7.3 | Show estimated months to reach goal |

---

## Technical Architecture

### Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Frontend | Next.js 14 + React | SSR, great DX |
| Styling | Tailwind CSS | Rapid development |
| XRPL | xrpl.js | Official library |
| Hosting | Fly.io | WebSocket-friendly for xrpl.js, persistent containers |
| Cache | Fly Redis | Threshold cache, same infra |

### Infrastructure

```
┌─────────────────────────────┐
│  Fly.io                     │
│  ┌───────────────────────┐  │
│  │ Next.js App           │  │
│  │ shared-cpu-1x, 256MB  │  │
│  └───────────────────────┘  │
│  ┌───────────────────────┐  │
│  │ Fly Redis             │  │
│  │ Threshold cache       │  │
│  └───────────────────────┘  │
└─────────────────────────────┘

Estimated cost: ~$5-10/month
```

### API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/lookup?address=rXXX` | Get balance, tier, and percentile |
| `GET /api/thresholds` | Get current tier thresholds |
| `GET /api/stats` | Get distribution statistics |

### XRP Price Data

**Source:** CoinGecko API (free, no auth required)

```
GET https://api.coingecko.com/api/v3/simple/price?ids=ripple&vs_currencies=usd
```

**Fallback:** Binance API

```
GET https://api.binance.com/api/v3/ticker/price?symbol=XRPUSDT
```

**Caching Strategy:**
- Store price in Redis with 5-minute TTL
- On request: return cached price if fresh, otherwise fetch new
- Display: "Price: $X.XX (updated X min ago)"

**Why 5 minutes:**
- Fresh enough for USD estimates
- Stays within free tier rate limits
- At 500 lookups/day = max 288 price fetches/day

### Data Flow

```
User enters address
       ↓
Validate r-address format
       ↓
Fetch balance from XRPL (xrpl.js)
       ↓
Fetch thresholds from cache
       ↓
Calculate percentile + tier
       ↓
Return results to frontend
```

---

## User Interface

### Landing Page
- Clean hero with tagline
- Large wallet address input
- "Check My Rank" button
- Tier overview below fold

### Results Page
- Large tier icon + name
- Percentile display
- Progress bar to next tier
- XRP needed calculation
- Share button

---

## Success Metrics

| Metric | Target (Month 1) |
|--------|------------------|
| Wallet Lookups/Day | 500 |
| Return Visitors (7-day) | 20% |
| Share Rate | 10% of lookups |

---

## Timeline

| Week | Deliverables |
|------|--------------|
| 1 | Project setup, XRPL integration, lookup API |
| 2 | Tier system, percentile calculation, basic UI |
| 3 | Progress visualization, share cards |
| 4 | Polish, testing, launch |

---

## Open Questions

1. **Data Freshness:** How often should tier thresholds update? (Hourly recommended)

2. **Exchange Wallets:** Exclude from calculations? (Recommend: no, keep it simple)

---

## Appendix

### XRP Distribution Reference

Based on recent data:
- Total funded accounts: ~4.8M
- Top 1% threshold: ~70,000 XRP
- Top 10% threshold: ~15,000 XRP
- Median balance: ~200 XRP

### Data Sources

| Data | Source | Update Frequency |
|------|--------|------------------|
| User Balance | xrpl.js → XRPL mainnet | Real-time |
| Distribution Data | XRPScan API | Hourly |
| XRP Price | CoinGecko API | 5-minute cache |

---

*Simple tool. Clear value. Ship it.*
