# Aurora lock UI for agent browser control

## Context

When the agent grabs the browser (MCP `browser_lock` sets `agentBrowsingAt`), the Browser tab currently drops a full-bleed grey scrim over the entire panel with one centred label: "Agent is browsing — click to take control" (`DesktopPanel.tsx`).

Two problems. The scrim + `backdrop-blur` hides the thing you actually want to watch — the agent driving Chrome. And because it is `absolute inset-0` on the whole panel, it also covers the refresh / fullscreen / open-in-tab / stop toolbar, so those controls are unreachable while locked.

Replace it with: an animated aurora ring around the browser viewport border, and a floating card at the bottom of the view reading "Agent is in control" with a separate "Take control" button beside it. View stays fully visible; toolbar becomes reachable.

Decisions confirmed: ring around the **viewport** (not the tab pill); input stays **blocked** by an invisible catcher and clicking anywhere still takes control; bar **floats** bottom-centre so the view keeps full height; orbs derive from **`--primary`** at varied alpha (theme-safe, no hardcoded hues).

Extra (post-review): add a **TTL timer** so the floating bar clears when the 30-min lock expires without waiting for an unrelated re-render. Hover tint on the catcher kept very faint (`/5`).

## 1. CSS — aurora ring (`apps/web/src/globals.css`)

Append at end of file, unlayered. Do **not** add `keyframes`/`animation` to `tailwind.config.js`.

- `@property --aurora-angle` with `syntax: "<angle>"`, `inherits: true`.
- `@keyframes aurora-spin` ~7s `linear infinite`.
- `.agent-aurora-ring` — animated angle; `pointer-events: none`.
- `::before` = crisp hairline (`padding: 1.5px`, conic orbs at primary alphas).
- `::after` = glow (`padding: 10px`, blur, opacity breathe).
- Ring-masked via `mask` / `-webkit-mask` + xor so the view stays clear.
- Square corners, flush with the panel.
- `@media (prefers-reduced-motion: reduce)` → static soft ring.
- Colours: `rgb(var(--primary) / …)` only.

## 2. `AgentControlOverlay.tsx`

Presentational in `lib/components/sandbox/`. Props: `onTakeControl`. Three siblings: aurora ring, invisible click-catcher, floating bottom bar (pulse + label + Take control CTA).

## 3. `SandboxIframeService` — `viewportOverlay?: ReactNode`

Render last child of the viewport `flex-1 min-h-0 relative` box. Optional; EditorPanel unchanged.

## 4. Wire `DesktopPanel`

Delete scrim; pass `viewportOverlay`; wrapper back to `h-full min-h-0`. TTL `setTimeout` forces re-render at expiry. `agentBrowsingAt` / unlock mutations untouched.

## Out of scope

- Tab-pill primary dot unchanged.
- `.qt-in-progress-border` reduced-motion untouched.

## Verification

tsc, manual lock via MCP / dashboard, toolbar clickable, take control via button + catcher, fullscreen, reduced motion, themes, narrow panel. Changelog written; ship deferred.
