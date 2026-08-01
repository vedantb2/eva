---
name: theme-adaptive-favicon
description: Make a site's favicon and app icon follow the app's own light/dark/custom themes instead of being a fixed white chip, and hang an unread-count badge half outside the icon the way Discord does. Use when asked to make the favicon theme-aware, add a notification count to the tab, fix a white icon glowing on dark surfaces, or when auditing an app icon that ignores the theme.
---

# Theme-adaptive favicon + overlapping badge

Two related jobs. Do part 1 alone if there is no unread count to show; part 2 assumes part 1.

The app icon is usually the single element guaranteed to appear on every surface, and
usually the only one that ignores the theme. A hardcoded white chip is fine on a light
page and reads as a bug on a dark one.

## Step 0 — find the theme mechanism first

Everything below hangs off knowing what the _app's own_ theme is, which is not the same
as what the OS prefers. Grep for, in rough order of likelihood:

- `document.documentElement.classList` toggling `dark` — Tailwind convention
- `data-theme` on `<html>` — most CSS-var systems, DaisyUI, Radix Themes
- `next-themes` (`useTheme()`), `useColorScheme`, or a hand-rolled ThemeContext
- a localStorage key read by a blocking `<script>` in the HTML shell (the FOUC guard)

**Enumerate every theme, not just two.** Apps often have a third ("neutral", "dim",
"midnight", "sepia") that is dark-family but not the same colour. That third theme is the
reason this must follow the in-app theme and not `prefers-color-scheme` — the OS has no
opinion about it, and a light-theme user on a dark machine must still get the light icon.

Then find the token the icon's background should track. Usually the _card/surface_ token,
not the page background — the icon is a chip sitting on the page, so it should match what
other chips are made of.

## Part 1 — theme-adaptive favicon

### The colour map

Read the actual hex values out of the stylesheet and hardcode them in one module:

```ts
export const MARK_SURFACE: Record<Appearance, string> = {
  light: "#FFFFFF",
  dark: "#17181A",
  neutral: "#303134",
};
```

**Do not read them back with `getComputedStyle(document.documentElement)` at runtime.**
The provider that applies the theme class is an _ancestor_ of whatever component reads it,
and React runs child effects before parent effects — so the child sees the _previous_
appearance and the icon lags one theme change behind. This is the single most likely bug
in this whole task. Hardcode, and comment the map as a mirror of the stylesheet.

### One writer

The favicon href is document-level state no component owns. If a theme-watcher and a
badge-watcher both write it, they clobber each other and the result depends on effect
order. **One component owns the href.** If the count needs auth and the theme does not,
mount the single component high (above the auth gate) and skip the query instead:

```tsx
const { isAuthenticated } = useConvexAuth(); // or whatever the auth hook is
const count = useQuery(
  api.notifications.countUnread,
  isAuthenticated ? {} : "skip",
);
```

Mounting high also fixes the case people forget: the signed-out landing page and login
screen are themed too, and they get a stale icon if the controller lives inside the gate.

### Write a data URI, not a file swap

Shipping one static SVG per theme means N files and a network fetch on every toggle.
Build the SVG as a string and set `link.href = "data:image/svg+xml," + encodeURIComponent(svg)`.
Instant, no request, and the badge comes free from the same builder.

Target the SVG link specifically — Chrome, Edge and Firefox prefer it over PNG/ICO
siblings:

```ts
const link = document.querySelector('link[rel="icon"][type="image/svg+xml"]');
if (!(link instanceof HTMLLinkElement)) return;
```

### The pre-hydration frame

Before JS runs, the browser paints whatever `<link rel="icon">` points at. Give that
static file a `prefers-color-scheme` fallback so the first frame is not a white flash:

```svg
<style>
  .disc { fill: #FFFFFF }
  @media (prefers-color-scheme: dark) { .disc { fill: #17181A } }
</style>
```

CSS cannot express the third theme; fall back to the dark value if it is dark-family.
This is the _only_ place `prefers-color-scheme` belongs — it covers the moment before the
app knows its own theme, and nothing after.

### `theme-color` while you are here

`<meta name="theme-color">` colours mobile browser chrome and is almost always a stale
brand colour matching no theme in the app. Point it at the _page/shell_ token (not the
card token) and set it in two places: the blocking script in the HTML shell (pre-paint, so
mobile never flashes) and the same controller (on every toggle).

### Split the static assets by job

One `icon.svg` usually serves as favicon, apple-touch-icon, manifest icon, and in-app
`<img>`. Once part 2 adds a badge gutter, those needs diverge. Split into:

- `icon.svg` — full-bleed, no gutter. Touch icon, manifest, any raw `<img>`.
- `favicon.svg` — with the gutter. Only the `<link rel="icon">`.

### In-app icons are the easy half

Anywhere the icon renders inside the app, inline the SVG instead of `<img src="...">` and
let CSS do it — `class="fill-card"` (Tailwind) or `fill: var(--card)`. No JS, every theme
free, including ones added later. Sweep every `<img src="/icon.svg">` call site; there are
always more than expected (chat avatars, nav, footer, OAuth consent screens).

When the icon sits next to a visible wordmark, mark it `aria-hidden` rather than labelling
it — otherwise screen readers announce the product name twice.

### Known limits — state them, do not fight them

- **Safari ignores SVG favicons entirely** and falls back to PNG/ICO. Those stay fixed-colour.
  Per-theme rasters cannot be selected through `<link>`. Accept it.
- **`manifest.json` is static.** The PWA splash and install icon get one colour, whichever
  theme you pick as canonical.
- A circular icon leaves transparent corners as an apple-touch-icon; iOS composites them
  over its own background.

## Part 2 — the Discord-style overlapping badge

A badge _inside_ the icon wastes the icon; a badge straddling its edge is the convention
everyone reads instantly. In the DOM this is free (`position: absolute` and let it
overflow). **In an SVG favicon it is not: the viewport clips.** Room outside the disc has
to be carved out of the canvas.

### The formula

Canvas `C` (use 512). Badge sits at 45° on the disc's edge, bottom-right. Let the disc
radius be `M` and the badge's outer ring radius be `R`. Put the disc flush to the top-left,
so its centre is `(M, M)`, and the badge centre lands at `(M + M/√2, M + M/√2)`.

Require the ring to end exactly at the canvas edge — `badgeCentre + R = C` — and solve:

```
M = (C - R) / (1 + 1/√2)        ≈ (C - R) / 1.70711
scale = M / (C / 2)
badgeCentre = M + M/√2 = C - R
bubbleR = R - lip               lip ≈ 0.16 R   (the ring showing outside the bubble)
```

Worked values for `C = 512` (last column is ring diameter : disc diameter):

| ring `R` | disc `M` | scale | badge centre | ring : disc |
| -------- | -------- | ----- | ------------ | ----------- |
| 120      | 230      | 0.897 | 392          | 0.52        |
| 150      | 212      | 0.828 | 362          | 0.71        |
| 180      | 194      | 0.760 | 332          | 0.93        |

Then wrap the original artwork in `<g transform="scale(<scale>)">` — a uniform scale
preserves the design exactly, so no coordinates need editing.

**Pick `R` by legibility at 16px, not by looks at 512.** That is the size a browser tab
actually draws. A badge that looks correctly proportioned in a design tool becomes an
illegible smudge. `R = 150` on a 512 canvas keeps digits readable; anything under ~120
degrades to a red dot with no count. Render every label width at 16/24/32/64 and look
before committing.

### Reserve the gutter permanently

Scale the mark down whether or not a count is showing. The alternative — full-size when
clear, scaled when badged — makes the tab icon visibly resize every time a notification
arrives and clears. Constant size is worth the ~17% loss.

### The ring is the theme surface, not white

The ring separates the red bubble from two different things at once: the artwork it
overlaps on the inside, and the tab background it hangs over on the outside. Fill it with
the **theme's surface colour**, not white — then it reads as a cut-out in every theme
instead of a white halo on dark.

Bubble fill and label stay fixed (red + white text); white-on-red is correct everywhere.

### Label sizing

Scale the font off the bubble radius so it survives extra digits:

```ts
const fontSize = (label: string, bubbleR: number) =>
  bubbleR * (label.length >= 3 ? 0.75 : label.length === 2 ? 1.15 : 1.6);
```

Saturate the count (`> 99 → "99+"`); three characters is the widest case worth designing for.

### Verify the geometry numerically

Faster and more reliable than eyeballing. Overlap should come out ≈ 0.5, the ring should
land on the canvas edge, and no important artwork should sit under the ring:

```js
const C = 512,
  R = 150,
  M = (C - R) / (1 + 1 / Math.SQRT2),
  BC = C - R,
  BUB = R - 24;
const d = (x, y) => Math.hypot(x - BC, y - BC);
console.log(
  "overlap",
  ((M - (Math.hypot(BC - M, BC - M) - BUB)) / (2 * BUB)).toFixed(3),
); // want ~0.500
console.log("ring outer", BC + R, "vs canvas", C); // want equal
// then d(x,y) for each artwork extremity — want > R for anything that must stay visible
```

Also build a throwaway HTML page rendering the real data URIs at 16/24/32/64/128 across
every theme and every label width, and _look at it_. Generate the `<img>` tags statically
if the preview surface does not run scripts.

## Reference implementation

One module owns geometry and colour; one component owns the DOM.

```ts
// evaMark.ts  (rename to the product's mark)
const C = 512,
  RING = 150,
  LIP = 24;
const M = (C - RING) / (1 + 1 / Math.SQRT2); // 212
const SCALE = M / (C / 2); // 0.828125
const BC = C - RING; // 362
const BUBBLE = RING - LIP; // 126

export const MARK_SURFACE: Record<Appearance, string> = {
  /* mirror of --card */
};
export const SHELL_COLOR: Record<Appearance, string> = {
  /* mirror of --background */
};

const fontSize = (l: string) =>
  BUBBLE * (l.length >= 3 ? 0.75 : l.length === 2 ? 1.15 : 1.6);

export const formatBadgeLabel = (n: number) => (n > 99 ? "99+" : String(n));

export function markDataUri(
  appearance: Appearance,
  label: string | null,
): string {
  const surface = MARK_SURFACE[appearance];
  const badge =
    label === null
      ? ""
      : `<circle cx="${BC}" cy="${BC}" r="${RING}" fill="${surface}"/>` +
        `<circle cx="${BC}" cy="${BC}" r="${BUBBLE}" fill="#e5484d"/>` +
        `<text x="${BC}" y="${BC}" text-anchor="middle" dominant-baseline="central" ` +
        `font-family="system-ui, -apple-system, sans-serif" font-weight="700" ` +
        `font-size="${fontSize(label)}" fill="#ffffff">${label}</text>`;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${C} ${C}">` +
    `<g transform="scale(${SCALE})">` +
    `<circle cx="${C / 2}" cy="${C / 2}" r="${C / 2}" fill="${surface}"/>` +
    /* ...the rest of the artwork, untouched... */
    `</g>` +
    badge +
    `</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
```

```tsx
// FaviconController.tsx — mount once, above the auth gate, inside the theme provider
export function FaviconController() {
  const { appearance } = useThemeMode();
  const count = useUnreadCount(); // skipped when signed out

  useEffect(() => {
    const link = document.querySelector(
      'link[rel="icon"][type="image/svg+xml"]',
    );
    if (!(link instanceof HTMLLinkElement)) return;
    const has = count !== undefined && count > 0;
    link.href = markDataUri(appearance, has ? formatBadgeLabel(count) : null);
    return () => {
      link.href = "/favicon.svg";
    }; // never leave a stale count
  }, [appearance, count]);

  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta instanceof HTMLMetaElement) meta.content = SHELL_COLOR[appearance];
  }, [appearance]);

  return null;
}
```

Non-React: same two writes, subscribed to whatever emits theme changes (a `MutationObserver`
on `<html>`'s class/`data-theme` attribute works anywhere).

## Gotchas checklist

- [ ] Geometry copied into 2+ files? Collapse to one module first — the static SVGs are the
      only acceptable hand-maintained duplicates, and they need a comment pointing home.
- [ ] Reading theme via `getComputedStyle` from a descendant of the theme provider → off by one change.
- [ ] Two components writing `link.href` → clobbering.
- [ ] Controller inside the auth gate → signed-out pages keep the old icon.
- [ ] No unmount cleanup → stale count on the tab after sign-out.
- [ ] Badge sized by how it looks at 512 → unreadable at 16.
- [ ] Icon shape changed to a circle but call sites still say `rounded-2xl` → squircle outline
      around a circle.
- [ ] Icon inlined next to a wordmark without `aria-hidden` → product name announced twice.
- [ ] Third theme forgotten because the code says `isDark`.

## Scope note

This is the **SVG favicon** case, where the viewport clips and the gutter maths is
mandatory. For a badge on a DOM avatar, skip all of part 2's scaling — absolutely position
the badge at `bottom-0 right-0` with a `translate(25%, 25%)` and let it overflow. The
surface-coloured ring advice still applies there.
