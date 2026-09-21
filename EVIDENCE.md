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
- Photo via **Take Photo** (camera) + **Choose from Gallery** (action sheet); web fallback file inputs
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

## SENTINEL remediation (2026-09-20 BST)

Addressed PARTIAL gaps from `/workspace/sentinel-challenge/growthvault-verify.md`.

### High — automated tests

- Added Vitest + `fake-indexeddb`
- Scripts: `npm test` → `vitest run`
- Suites:
  - `src/lib/__tests__/streaks.test.ts` — `currentStreak` / grace yesterday / global days / `longestStreak`
  - `src/lib/__tests__/badges.test.ts` — `deriveBadges` unlock + progress (Pioneer, 7-day, Master) + preserve `unlockedAt`
  - `src/lib/__tests__/db.test.ts` — IndexedDB CRUD: putJourney / putLog / profile / badges / writeSnapshot / clearAllData

### Medium — passcode demo copy (document / label only)

- Passcode remains a **local demo keypad**, not an app lock and **not encryption**.
- UI labels on `/profile` and `/profile/passcode` state: “local demo / not a vault lock / does not encrypt”.

### Medium — runtime proof steps (manual)

Expected: demo seed → Home shows journey + streak ≥1 → Awards shows Growth Pioneer + 7 Day Warrior unlocked.

1. Open `http://localhost:4330/home` (or `/profile`).
2. Profile → **Load demo data** (Summer Body Prep · 7 logs · pioneer + warrior).
3. Home: active journey card visible; streak chip reflects consecutive logged days.
4. Awards (`/awards`): Growth Pioneer + 7 Day Warrior unlocked; Keep Building shows next incomplete.
5. Optional: Journey → **Add Evolution Log** with photo/caption → streak increments if new calendar day.
6. Profile → Clear all data (confirm) → Home empty; Awards reset.

Optional automated proof: `npm test` covers the same derive + IDB rules without a browser.

### Low — soft-404 empty state

- Unknown `/journeys/[id]` (and calendar/compare) shows in-app **Journey not found** + **Back to Home** — no fake journey shell. HTTP 200 OK for SPA.

### Gates

- `npm test` — **PASS** (22 tests, Vitest 3.2.7)
- `npm run build` — **PASS** (Next.js 16.3.5)
- Commit — `9273da5902a3e548385121f9d045cae1c90815c1` on `main`
- URL — https://github.com/vamshi365/growthvault/commit/9273da5902a3e548385121f9d045cae1c90815c1
- Preview — `http://localhost:4330` restarted

## Android debug APK (Capacitor 6) — 2026-09-20 BST

| Field | Value |
|-------|--------|
| Path | `/workspace/growthvault/dist/growthvault-debug.apk` |
| Easy path | `/workspace/growthvault/GROWTHVAULT-DEBUG.apk` |
| SHA256 | `2d34306b31c44eb8d75fa37dcac9ff69fb347e28ee133ba5815a1748144730e6` |
| Size | `4451689` bytes (~4.25 MiB) |
| appId | `com.growthvault.app` |
| webDir | `out` (static export) |
| Build | `npm run build` → `npx cap sync` → `./gradlew assembleDebug` |

### Install notes

1. Enable **Install from unknown sources** (or “Install unknown apps”) for your file manager / browser on the Android device.
2. Sideload: copy the APK to the device and open it, **or**
3. `adb install -r /workspace/growthvault/dist/growthvault-debug.apk`

Debug APK is unsigned for Play; suitable for local sideload / emulator only.

### P0 UX (CREATOR `growthvault-ui-polish.md`) shipped in this APK

| # | Item | Status |
|---|------|--------|
| P0.1 | Tap targets ≥44×44 (nav, FAB, + New, pills, Back, Save) | Done |
| P0.2 | `:focus-visible` ring `#E8D9FF` | Done |
| P0.3 | Log save toast “Evolution logged” + optional `vibrate(12)` + streak line | Done |
| P0.4 | First-run Home single CTA (Begin Journey ≤2 taps) + “Takes under a minute” | Done |
| P0.5 | New Journey progressive disclosure (essentials → optional tip/photo) | Done |
| P0.6 | Explore → Start Journey prefills `/journeys/new?template=` + From Explore eyebrow | Done |
| P0.7 | EmptyState sparkle + title/body/full-width CTA | Done |
| P0.8 | Awards 6px progress + high-contrast meta; Stats metric stack | Done |
| P0.9 | Soft-404 EmptyState; Loading vault…; save-fail toast | Done |
| P0.10 | Thumb-zone: FAB glow elevated; `.gv-page` bottom `116px + safe-area` | Done |

### §10 visual CSS (locked tokens)

- Card depth: hairline border + soft shadow + highlight gradient
- FAB `--gv-fab-glow`; all active tabs squircle well + purple dot
- Type: `.gv-title` 28 / `.gv-section-title` 18 / `.gv-metric` 32 / eyebrow 11 @ 0.08em
- Brand unchanged: `#0B0B10` / `#1A1A24` / `#9F84FF` / Inter

**CREATOR:** P0 + visual CSS landed in APK — ready for visual re-sniff.

### Capacitor / export notes

- `output: "export"` + `images.unoptimized`
- `generateStaticParams` for all explore templates (≥7) and journey `[id]` placeholder `_`
- `*.apk` gitignored; capacitor config + android project source kept (build outputs ignored)


## Camera + Gallery photo capture — 2026-09-21 BST

| Field | Value |
|-------|--------|
| Path | `/workspace/growthvault/dist/growthvault-debug.apk` |
| Easy path | `/workspace/growthvault/GROWTHVAULT-DEBUG.apk` |
| SHA256 | `5d343aeb90359d41c14e29efc030ac451003fb2572bc02ddc8f13f093cefaff9` |
| Size | `8608521` bytes (~8.21 MiB) |
| Plugin | `@capacitor/camera@6.1.3` (Capacitor 6) |
| Surfaces | Log Evolution (`/journeys/[id]/log`); New Journey Day-1 photo |
| UI | Action sheet: **Take Photo** \| **Choose from Gallery** \| **Cancel** |

### Permissions (AndroidManifest)

- `CAMERA`
- `READ_MEDIA_IMAGES` (API 33+)
- `READ_EXTERNAL_STORAGE` (`maxSdkVersion=32`)
- `uses-feature` camera `required=false` (gallery-only devices OK)

Runtime: in-app rationale → `Camera.requestPermissions({ permissions: ['camera'] })` → camera intent. Gallery uses Photo Picker and does **not** pre-request photos permission (Android 13+ picker-safe).

### Web fallback

- Hidden `<input type="file" accept="image/*" capture="environment">` for Take Photo
- Hidden `<input type="file" accept="image/*">` for gallery
- Native path uses `Camera.getPhoto` → `CameraResultType.DataUrl` for IndexedDB

### SENTINEL camera requirements — confirmed

1. **Explicit permission prompt before camera** — in-app “Camera access” rationale (Continue) then OS `Camera.requestPermissions({ permissions: ['camera'] })` via `ensureCameraPermission()` before `Camera.getPhoto(CameraSource.Camera)`.
2. **Deny path** — if CAMERA refused: status “Camera access denied. You can still Choose from Gallery — no dead end.”; sheet re-opens with Gallery available; gallery never pre-requests photos permission.
3. **No vault-encryption copy** — rationale: local on-device only (IndexedDB), not uploaded, not a secure vault. No copy claims photos are vault-encrypted.
4. **Action sheet** — **Take Photo** | **Choose from Gallery** | **Cancel** on Log Evolution (`/journeys/[id]/log`) and New Journey (`/journeys/new`) Day-1 photo.
5. **APK rebuilt** — SHA256/size in table above updated after this permission patch.


### Gates

- `npm test` — **PASS** (22 tests)
- `npm run build:apk` — **PASS** (next build + cap sync + assembleDebug)
- P0.1–P0.10 UX polish retained; CREATOR tokens + ARCHITECT IA unchanged

## v2.0 — Overlay + Compare — 2026-09-21 BST

**Authority:** `/workspace/architect/growthvault-v2-blueprint.md` § v2.0  
**Scope:** Overlay ghost capture + Compare A/B only. No paywall, widgets, share cards, ASO, social feed.

### Routes

| Route | Change |
|-------|--------|
| `/journeys/[id]/log` | After camera/gallery pick: **Align with overlay** toggle; Day1 / Last-log reference; opacity · flip · freeze; save with `referenceLogId` + `captureSource` |
| `/journeys/[id]/compare` | Enhanced offline Compare: Day1 vs Today \| Log A vs B; `CompareSplit` with **DAY 1** / **TODAY** labels; timeline `LogCalendarStrip`; Swap; no Share CTA (v2.1) |
| `/journeys/[id]/capture` | Alias → redirects to `/log` (overlay align lives post-capture) |

### Overlay — true pixel (SENTINEL bar)

- Implementation: **canvas `globalAlpha` drawImage** stacking ghost over base (`data-overlay-mode="canvas-alpha"`).
- **Not** CSS `mix-blend-mode` / multiply / screen filters.
- Unit proof: `compositePixelAlpha` (src·a + dst·(1−a)) in `src/lib/__tests__/overlay.test.ts`.
- Controls: opacity slider (0–80%), flip horizontal, freeze ghost.
- Downscale ghost for preview (`downscaleForOverlay`); full-res capture saved unchanged.
- Missing Day1 + no logs → overlay disabled + CTA “Add Day 1 photo first”.
- Local-first: photos IndexedDB only; no upload.

### Compare — Day1 / Today labels

- Mode pills: **Day 1 vs Today** | **Log A vs Log B**.
- Split badges uppercase **DAY 1** / **TODAY** (or Day N in A/B mode).
- Meta row: `Day 1 · …` / `Today · …`.
- Timeline strip taps set A then B; offline only.
- No cart, no social feed, no share compose (v2.1).

### Data delta

```ts
EvolutionLog {
  referenceLogId?: string;
  captureSource?: "camera" | "gallery";
}
```

### Gates

- `npm test` — **PASS** (31 tests; overlay + db referenceLogId links)
- `npm run build` — **PASS** (export; capture route included)
- CREATOR tokens + P0 UX + camera deny→gallery retained

### Android debug APK (v2.0)

| Field | Value |
|-------|--------|
| Path | `/workspace/growthvault/dist/growthvault-debug.apk` |
| Easy path | `/workspace/growthvault/GROWTHVAULT-DEBUG.apk` |
| SHA256 | `6a8d658cda39f07aa80407a4a4dc29097e4ead15f33b1e97700a9da07a67f355` |
| Size | `8609093` bytes (~8.21 MiB) |
| Build | `npm run build` → `npx cap sync` → `./gradlew assembleDebug` |
| Commit | `84a2dc90ad821abac1e6769f93b1c1ff86ab4efe` on `main` |
| URL | https://github.com/vamshi365/growthvault/commit/84a2dc90ad821abac1e6769f93b1c1ff86ab4efe |

## v2.1 — Share-out cards — 2026-09-21 BST

**Authority:** `/workspace/architect/growthvault-v2-blueprint.md` § v2.1  
**Craft:** `/workspace/creator/growthvault-share-cards.md` (Templates A–D)  
**Scope:** Share-out PNG cards + system share only. No in-app social feed. No paywall UI. Camera/overlay/P0/tokens retained. Live viewfinder ghost not in scope.

### Routes

| Route | Change |
|-------|--------|
| `/share/compose` | Composer: `journeyId`, `logIds`, `template`; Templates A–D; Stories 1080×1920 + Square 1080×1080; optional caption; Share → system sheet; Cancel = quiet |
| `/journeys/[id]/compare` | **Share card** CTA → compose (`template=before_after`, logIds from A/B) |
| `/journeys/[id]` | Header **Share** entry → compose |

### Templates (CREATOR A–D)

| Letter | Id | Layout |
|--------|-----|--------|
| A | `before_after` | Day 1 / Today split, journey title, Day N, “Private vault · On my phone” |
| B | `streak` | Flame + huge streak + DAY STREAK |
| C | `award` | Latest unlocked badge · UNLOCKED pill |
| D | `quote` | Photo top 55% + Evolution Insight quote card |

Brand lock: `#0B0B10` / `#9F84FF` / Inter / GrowthVault wordmark + accent rule. **No** encryption / vault-lock claims on export art. **No** feed / followers / likes.

### Export + share

- Canvas → PNG (`renderShareCardPng`)
- System share: `navigator.share({ files })` and/or `@capacitor/share@6.0.3`; download fallback
- Cancel / `AbortError` → silent (no shame toast)
- Success → local `shareEvents++` (IndexedDB meta) + toast “Card ready to send”
- Cards use **real journey photo URIs** (Day1/Today/logs) — not stock placeholders

### CREATOR PNG re-sniff — READY

Sample PNGs (demo journey art, same chrome as compose):

- `/workspace/growthvault/share-samples/A-before-after-stories.png`
- `/workspace/growthvault/share-samples/A-before-after-square.png`
- `/workspace/growthvault/share-samples/B-streak-stories.png`
- `/workspace/growthvault/share-samples/C-award-stories.png`
- `/workspace/growthvault/share-samples/D-quote-stories.png`

Also under `dist/share-samples/`. Compose route live after `npm run build && npx next start -p 4330` → `/share/compose?journeyId=…`.

### SENTINEL bar

1. System share sheet only — no in-app feed/followers  
2. Cards render real journey data (`resolveSharePhotos`)  
3. Cancel = quiet exit  
4. No “encrypted vault” claims on export art  

### Data delta

```ts
ShareEvent { id, createdAt, templateId, journeyId, logIds[] }
AppSnapshot.shareEvents: ShareEvent[]
```

### Gates

- `npm test` — **PASS** (42 tests; share A–D + shareEvents persistence)
- `npm run build` — **PASS** (`/share/compose` exported)
- CREATOR tokens + P0 + camera + overlay/compare retained

### Android debug APK (v2.1)

| Field | Value |
|-------|--------|
| Path | `/workspace/growthvault/dist/growthvault-debug.apk` |
| Easy path | `/workspace/growthvault/GROWTHVAULT-DEBUG.apk` |
| SHA256 | `752fec7d1d4920fa3ed065de97332035b4c8913c8dd37548eb67cf3bdf4fd799` |
| Size | `8609919` bytes (~8.21 MiB) |
| Plugins | `@capacitor/camera@6.1.3` · `@capacitor/share@6.0.3` |
| Build | `npm run build` → `npx cap sync` → `./gradlew assembleDebug` |
