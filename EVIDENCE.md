# GrowthVault — EVIDENCE

**Date:** 2026-09-20 (Europe/London)  
**Path:** `/workspace/growthvault`  
**Repo:** https://github.com/vamshi365/growthvault (main)  
**Preview:** `http://localhost:4330` (`npm run build && npx next start -p 4330`)

## Run instructions

```bash
cd /workspace/growthvault
npm install
npm run build   # must PASS
npx next start -p 4330
```

## Tokens (CREATOR authority)

Canonical CSS `:root` from `/workspace/creator/growthvault-visual-system.md` — accent `#9F84FF`, bg `#0B0B10`, card `#1A1A24`, CTA `#7C5CFF`→`#5B7CFF`, Inter, floating nav + solid purple FAB + purple active tab + purple dot.

## Phases shipped (A→F)

| Phase | Status | Notes |
|-------|--------|-------|
| A Shell + tokens + tabs | Done | AppShell, FloatingTabBar, FAB action sheet, CREATOR `:root` |
| B IDB CRUD + streak/badge derive | Done | `idb` store, global streak, 5 badge rules |
| C New Journey + Home list | Done | Form + Identity Tip + BEGIN JOURNEY; welcome + list |
| D Hero + logging | Done | Day1\|Today hero; log modal photo/caption/tags |
| E Stats + Awards | Done | Metrics, activity bars, badges, Keep Building |
| F Explore/profile/polish | Done | ≥6 templates, filters, detail prefill; profile demo/clear; reduced-motion |

## Full §10 surfaces

- Explore templates (no social feed)
- Journey detail grid + list/timeline
- Log Evolution caption modal
- Before vs After compare
- Journey calendar streak surface
- Stats + Awards full set
- Profile + passcode keypad demo

## Acceptance notes

- No fake social Explore users — templates only
- Static insight quotes only
- Photo via file upload (not camera-only)
- Demo seed optional via Profile

## Build

See CI/local: `npm run build` exit 0 required for done.

## Build result (2026-09-20 BST)

- `npm run build` — **PASS** (Next.js 16.3.5, TypeScript OK)
- Preview — `http://localhost:4330` (Ready)
- Commit — `aab354e273d383ca681d7eacbe4a79cef5941e0b` on `main`
- URL — https://github.com/vamshi365/growthvault/commit/aab354e273d383ca681d7eacbe4a79cef5941e0b

## Confirmations

- Explore = Journey Templates only (≥7 incl. Habit Stack) — **no fake social users**
- Accent `--gv-accent: #9F84FF` from CREATOR CSS `:root` block
