# Change Request: Tier System Update

**Project:** RankXRP  
**Version:** 1.0  
**Date:** December 2, 2025  
**Status:** Proposed

---

## Summary

Update the tier naming system to align with XRP community standards while retaining percentile-based ranking as the core differentiator.

---

## Rationale

The XRP community has established an informal but widely-recognized tier system popularized by influencers like Edo Farina (Alpha Lion Academy) and JackTheRippler. Aligning with these community-accepted names provides:

1. **Instant recognition** for existing XRP holders familiar with the naming convention
2. **Social shareability** — users can reference their tier using widely understood terms
3. **Credibility** — demonstrates awareness of XRP culture and community norms

---

## Changes

### Tier Name Changes

| Tier | Previous | New | Change Type |
|:----:|----------|-----|:-----------:|
| 1 | 🐋 Whale | 🐋 Whale | No change |
| 2 | 🦈 Shark | 🦈 Shark | No change |
| 3 | 🐬 Dolphin | 🐬 Dolphin | No change |
| 4 | 🐟 Tuna | 🐟 Fish | Renamed |
| 5 | 🦑 Squid | 🐙 Octopus | Renamed |
| 6 | 🦐 Shrimp | 🦀 Crab | Reordered |
| 7 | 🦀 Crab | 🦐 Shrimp | Reordered |
| 8 | 🦠 Plankton | 🪱 Worm | Renamed |

### Final Tier System

| Tier | Icon | Name | Percentile |
|:----:|:----:|------|------------|
| 1 | 🐋 | Whale | Top 0.01% |
| 2 | 🦈 | Shark | Top 0.1% |
| 3 | 🐬 | Dolphin | Top 1% |
| 4 | 🐟 | Fish | Top 5% |
| 5 | 🐙 | Octopus | Top 10% |
| 6 | 🦀 | Crab | Top 25% |
| 7 | 🦐 | Shrimp | Top 50% |
| 8 | 🪱 | Worm | Bottom 50% |

---

## Design Guide Updates

Update tier colors in the Design Guide:

| Tier | Name | Color | Hex |
|------|------|-------|-----|
| 1 | Whale | Royal Blue | `#3B82F6` |
| 2 | Shark | Steel Gray | `#64748B` |
| 3 | Dolphin | Ocean Cyan | `#06B6D4` |
| 4 | Fish | Deep Teal | `#0D9488` |
| 5 | Octopus | Purple Ink | `#8B5CF6` |
| 6 | Crab | Warm Orange | `#F97316` |
| 7 | Shrimp | Coral Pink | `#F472B6` |
| 8 | Worm | Earth Brown | `#A16207` |

---

## Affected Documents

| Document | Section | Update Required |
|----------|---------|-----------------|
| RankXRP_PRD.md | F2: Tier System | Update tier table |
| Design_Guide.md | Tier Colors | Update names and colors |
| (Future) UI Components | Tier badges, icons | Use new names/icons |

---

## Decision: Percentiles vs Fixed Amounts

**Decision:** Retain percentile-based ranking.

The community standard uses fixed XRP amounts (e.g., Whale = 100,000+ XRP). However, RankXRP's core value proposition is answering "Where do I rank?" — a percentile question.

| Approach | Pros | Cons |
|----------|------|------|
| Fixed XRP amounts | Familiar to community, clear goals | Doesn't show true ranking |
| Percentiles (chosen) | Core differentiator, shows real standing | Thresholds shift over time |

Percentile ranking is our differentiator. The community already has tools for fixed-amount classification.

---

## Implementation Checklist

- [ ] Update PRD tier table (Section F2)
- [ ] Update Design Guide tier colors
- [ ] Update Tailwind config with new tier names
- [ ] Update any hardcoded tier references in codebase
- [ ] Update share card templates with new icons

---

## Approval

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Product | | | |
| Design | | | |
| Engineering | | | |
