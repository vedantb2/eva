# Neutral theme (soft dark between light & dark)

**Status:** shipped (`e602e67e` on staging)  
**Date:** 2026-07-30  
**Final step:** `/ship` ✓

## Goal

Add **Neutral** — soft-dark appearance, darker than Light, lighter than Dark (near-black). Light text on dark-ish surfaces.

## Locked decisions

| #   | Decision                                                                                                         |
| --- | ---------------------------------------------------------------------------------------------------------------- |
| 1   | Name: `neutral` (API) / **Neutral** (UI)                                                                         |
| 2   | Peer modes: Light / Neutral / Dark / System                                                                      |
| 3   | System → OS light/dark only; Neutral explicit-only                                                               |
| 4   | Soft dark (closer to Dark); light-on-dark text                                                                   |
| 5   | `<html class="dark neutral">` — `.neutral` overrides surfaces; `dark:` variants keep working                     |
| 6   | Accents: reuse Dark accent values                                                                                |
| 7   | Convex persists `"light" \| "neutral" \| "dark"`; System stays local-only                                        |
| 8   | Settings/onboarding: 2×2 grid; `IconCircleHalf`; swatch ~zinc-700                                                |
| 9   | Sidebar/user-menu toggle: cycle Light → Neutral → Dark → Light (skip System)                                     |
| 10  | FOUC hint stores `"light" \| "neutral" \| "dark"`; script applies `dark` + `neutral`                             |
| 11  | Hand-pick soft-dark surface tokens; status colors = Dark’s                                                       |
| 12  | Scope: `apps/web` + chrome extension + landing                                                                   |
| 13  | `resolvedTheme` stays `"light" \| "dark"` (Neutral → `"dark"` for Sonner/diffs); expose appearance for real mode |
| 14  | Extension: three-way palette mirroring web Neutral tokens                                                        |
| 15  | Default: Light                                                                                                   |
| 16  | Landing: `.dark.neutral` atmosphere (lifted vs Dark)                                                             |

## Approx Neutral surfaces (RGB)

| Token                            | ~RGB              | Notes             |
| -------------------------------- | ----------------- | ----------------- |
| background / app-shell / sidebar | `34 35 37`        | zinc-800-ish      |
| card / popover                   | `48 49 52`        | step above bg     |
| muted                            | `58 59 62`        |                   |
| secondary                        | `68 69 72`        | deepest step      |
| border / input / sidebar-border  | `78 79 82`        | hairline readable |
| foreground / most text           | same as Dark      |                   |
| status-\*                        | copy from `.dark` |                   |

## Architecture

```
preference: light | neutral | dark | system
     ↓ resolve (system → light|dark)
appearance: light | neutral | dark
     ↓
DOM: light → (no dark, no neutral)
     dark  → .dark
     neutral → .dark.neutral
     ↓
resolvedTheme (3rd party): light | dark  (neutral maps → dark)
```

## Implementation checklist

### Backend

- [ ] `themeValidator` += `"neutral"`
- [ ] `getTheme` / `setTheme` accept neutral (no migration — optional field union widen)

### Web core

- [ ] `ThemeMode` += `"neutral"`
- [ ] `appearance` / apply: toggle `dark` + `neutral` classes
- [ ] `resolvedTheme`: neutral → `"dark"`
- [ ] `themeHint` + `index.html` FOUC
- [ ] `ThemeContext`: setTheme/toggleTheme cycle; persist neutral to Convex
- [ ] `AppearanceSection` 2×2 + IconCircleHalf
- [ ] Sidebar + SidebarUserMenu icons/labels for 3-way cycle
- [ ] `globals.css`: `.dark.neutral { ... }` surface tokens
- [ ] Landing atmosphere `.dark.neutral`
- [ ] `surfaceTokens.test.ts` cover `.dark.neutral`
- [ ] ThemePreview / onboarding types
- [ ] `packages/ui` theme-switcher if used

### Chrome extension

- [ ] Observe `.neutral` + `.dark`
- [ ] Three-way styles mirroring web Neutral tokens

## Out of scope

- Changing Dark palette itself
- System resolving to Neutral
- Separate Neutral accent table
- Migrating existing user themes (they stay light/dark)

## Unresolved

None — decisions locked.
