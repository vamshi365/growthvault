# GrowthVault

Mobile-first Next.js app for documenting personal transformation journeys — Day 1 vs Today photos, evolution logs, streaks, badges, and curated journey templates.

**Local-first.** Data lives in IndexedDB (`idb`). No cloud auth. Insights are static quotes (not AI). Explore is templates only — no fake social users.

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS v4
- IndexedDB via `idb`
- Inter + CREATOR dark tokens (`--gv-accent: #9F84FF`)

## Quick start

```bash
cd /workspace/growthvault
npm install
npm run build
npx next start -p 4330
```

Dev: `npm run dev` (port 4330).

Open [http://localhost:4330](http://localhost:4330).

## Routes

| Route | Screen |
|-------|--------|
| `/` | Redirect → `/home` |
| `/home` | Welcome or archive hero + journeys |
| `/explore` | Journey templates (≥6) + filters |
| `/explore/[templateId]` | Template detail → Start Journey |
| `/journeys/new` | New Journey form |
| `/journeys/[id]` | Detail · grid/list logs · subtabs |
| `/journeys/[id]/log` | Evolution log modal (photo + caption + tags) |
| `/journeys/[id]/compare` | Before vs After |
| `/journeys/[id]/calendar` | Streak calendar |
| `/stats` | Longest streak · total logs · activity bars |
| `/awards` | 5 badges + Keep Building |
| `/profile` | Name · demo load/clear |
| `/profile/passcode` | Local 4-digit passcode demo |

Floating tab bar: **Home | Explore | [+] FAB | Stats | Awards**

## Demo data

Profile → **Load demo data** seeds Summer Body Prep with logs and unlocks Growth Pioneer + 7 Day Warrior. **Clear all data** wipes IndexedDB.

## Repo

https://github.com/vamshi365/growthvault
