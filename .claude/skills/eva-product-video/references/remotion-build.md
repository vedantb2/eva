# Composing, scoring & rendering the video

The Remotion project lives in `video/`. Primary composition: `EvaHero` (`video/src/EvaHero.tsx`),
registered at **1280×720, 30fps** in `video/src/Root.tsx`. Reuse the components below.

## Components (video/src/components/)

| component                | role                                                                                                                                                    |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tokens.ts`              | Theme: `COLORS` (bg `#050606`, accent `#818cf8`, brand purple→blue), `BRAND_GRADIENT(_TEXT)`, fonts. **Source of truth for color — never hardcode.**    |
| `Backdrop`               | Animated background for text scenes: drifting brand-color glow orbs + grain + dot grid + vignette. `variant="hero"` (title/proof/outro) or `"ambient"`. |
| `EvaMark`                | The eva sparkle (purple top / blue bottom, from `apps/web/public/icon.svg`) with glow. Props: `size`, `glow`, `rotate`.                                 |
| `AppWindow`              | (Floating-window framing — kept for reference.) `PanScene` now renders screenshots full-bleed instead; see below. `Camera = {scale, fx, fy}`.           |
| `HeroCaption` + `Accent` | Lower-centre kinetic caption: mono kicker + bold statement over a legibility scrim. Wrap key words in `<Accent>` for the gradient fill. Snappy spring.  |
| `Cursor`                 | Stylised pointer that eases along `points: {x,y,at}[]` (frame px) with click ripples at `clicks: number[]`.                                             |
| `Spotlight`              | Dim-everything-but-a-rect highlight with an accent ring; use `dim={0}` for a ring-only emphasis. (Aligns cleanly only at camera scale 1.)               |
| `StatCounter`            | Eased count-up number + label on a hairline card (the proof stats).                                                                                     |
| `SnapIn`                 | Punchy scene entrance (scale-pop) for hard-cut editing — wrap every `<Series.Sequence>` child in it.                                                    |

Scenes live in `video/src/scenes/`: `TitleScene`, `PanScene` (the full-bleed screenshot scene),
`ProofScene`, `OutroScene`.

## PanScene = full-bleed screenshot (the workhorse)

`PanScene` draws a capture **full-bleed** (`objectFit: cover`, fills the whole frame) + a soft
vignette + a `HeroCaption`, with an optional `overlay` (e.g. a `Cursor`) and a gentle camera.

- Keep the camera near `scale: 1.0` (full UI visible). A tiny push `1.0 → 1.03` adds life.
  **Don't** zoom hard into a region — it crops the UI into unreadable fragments.
- For the input scene with a `Cursor`, keep the camera **static `scale: 1.0`** so the screenshot
  maps 1:1 and the cursor lands exactly on its target. Cursor target = `normalized × (1280, 720)`
  of the screenshot (because full-bleed 1:1).

## Snappy, beat-synced editing

Use `<Series>` (hard cuts), wrap each scene in `<SnapIn>`. Tempo **120 BPM**, 30fps →
**15 frames per beat**. Make every scene duration a multiple of beats so cuts land on the beat.

Current `SCENE` durations (frames) and the resulting cuts:

```
title 75, taskInput 90, agentWork 90, reviewShip 90, board 60, projects 60, proof 90, outro 75
TOTAL = 630 frames = 21.0s
cut frames  = 75, 165, 255, 345, 405, 465, 555
cut seconds = 2.5, 5.5, 8.5, 11.5, 13.5, 15.5, 18.5   (= cut frame ÷ 30)
```

To change the cut: edit `SCENE` durations in `EvaHero.tsx` (keep multiples of 15), then update
`CUT_SECONDS` in `gen-music.mjs` to the new cut seconds and regenerate the music.

To add/edit a scene: add a `<Series.Sequence durationInFrames={…}><SnapIn>…</SnapIn></Series.Sequence>`
with a `PanScene` (or a bespoke scene). Captions are JSX with `<Accent>` on the emphasis words.

## Music (gen-music.mjs)

`video/scripts/gen-music.mjs` synthesises a license-free drum bed (kick 4-on-the-floor, backbeat
claps, hi-hats, and **accent clap + crash on each cut**) and writes `public/audio/music.wav`.

- `CUT_SECONDS` **must equal** the scene-cut times above — that's what makes "each clap = a
  transition". If you change scene durations, change this too, then `node scripts/gen-music.mjs`.
- It's wired in `EvaHero.tsx` via `<Audio src={staticFile("audio/music.wav")} volume={0.62} />`
  behind `const MUSIC = true`. Set `false` for silent.
- Claude can't hear audio. The generated beat reliably hits the brief (energetic, claps on cuts),
  but tell the user to audition it and swap for a licensed track (Artlist/Epidemic) if preferred —
  just replace `public/audio/music.wav`.

To make it less "boring": shorten scenes, hard-cut (not crossfade), and ensure the claps/crashes
sit on the cuts. To make it punchier, raise the kick/clap amps in `gen-music.mjs` and the `<Audio>`
volume.

## Rendering

No system **ffmpeg** is required — Remotion bundles its own. From `video/`:

```bash
npx remotion render EvaHero out/eva-demo.mp4 --codec=h264 --image-format=png
```

`--image-format=png` renders lossless intermediate frames → crisper UI text than the default jpeg.

## QA without watching the video

You can't preview an mp4 (no player, no system ffmpeg). QA with **still frames** instead:

```bash
node scripts/stills.mjs "37,131,210,300,510"   # bundles ONCE, renders these frames to out/still-<f>.png
```

Then read the PNGs and check: zoom (UI readable?), full-bleed framing, caption wording/placement,
cursor on its target, count-up values. Pick frames at scene midpoints and at the cursor-click frame.

Verify the finished file:

```bash
node scripts/check-audio.mjs    # prints duration, dimensions (expect 1280×720), video + audio codecs
```

## Other gotchas

- Pin every `@remotion/*` dependency to the **same exact version** (e.g. `4.0.479`) — mismatched
  versions break the bundler. `react`/`react-dom` 19 are fine.
- Fonts: `video/src/components/fonts.ts` loads Inter + JetBrains Mono via `@remotion/google-fonts`;
  it's imported by `EvaHero` so text renders consistently headless.
- This is a standalone Remotion project at the repo root — it is NOT part of the pnpm workspace
  (`packages/*`, `apps/*`), so it won't collide with the app's React/Vite versions.
