# Composing, scoring & rendering the video

The Remotion project lives in `video/`. Primary composition: `EvaHero` (`video/src/EvaHero.tsx`),
registered at **1280×720, 30fps** in `video/src/Root.tsx`. Reuse the components below.

## Components (video/src/components/)

| component                | role                                                                                                                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `tokens.ts`              | Theme: `COLORS` (bg `#050606`, accent `#818cf8`, brand purple→blue), `BRAND_GRADIENT(_TEXT)`, fonts. **Source of truth for color — never hardcode.**                                 |
| `Backdrop`               | Animated background for text scenes: drifting brand-color glow orbs + grain + dot grid + vignette. `variant="hero"` (title/proof/outro) or `"ambient"`.                              |
| `EvaMark`                | The eva sparkle (purple top / blue bottom, from `apps/web/public/icon.svg`) with glow. Props: `size`, `glow`, `rotate`.                                                              |
| `AppWindow`              | (Floating-window framing — kept for reference.) `PanScene` now renders screenshots full-bleed instead; see below. `Camera = {scale, fx, fy}`.                                        |
| `HeroCaption` + `Accent` | Lower-centre kinetic caption: mono kicker + bold statement over a legibility scrim. Wrap key words in `<Accent>` for the gradient fill. Snappy spring.                               |
| `Cursor`                 | Stylised pointer that eases along `points: {x,y,at}[]` (frame px) with click ripples at `clicks: number[]`.                                                                          |
| `Spotlight`              | Dim-everything-but-a-rect highlight with an accent ring; use `dim={0}` for a ring-only emphasis. (Aligns cleanly only at camera scale 1.)                                            |
| `StatCounter`            | Eased count-up number + label on a hairline card (the proof stats).                                                                                                                  |
| `SnapIn`                 | Punchy scene entrance (scale-pop) for hard-cut editing — wrap every `<Series.Sequence>` child in it. Default `from=1.06` pops inward and crops; pass `from={0.97}` over screenshots. |

Scenes live in `video/src/scenes/`: `TitleScene`, `PanScene` (the full-bleed screenshot scene),
`ProofScene`, `OutroScene`.

## PanScene = full-bleed screenshot (the workhorse)

`PanScene` draws a capture **full-bleed** (`objectFit: cover`, fills the whole frame) + a soft
vignette + a `HeroCaption`, with an optional `overlay` (e.g. a `Cursor`) and a gentle camera.

- Keep the camera **exactly static at `{ scale: 1.0, fx: 0.5, fy: 0.5 }`** for both `from` and
  `to`. Not "near" 1.0 — even a 1.02–1.06 push-in clips the chrome the viewer needs to read
  (sidebar labels, the top-right primary button, a stats footer). Motion comes from the hard cuts
  and the caption snaps. And **don't** zoom into a region: it crops the UI into fragments.
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

To change the cut: edit `SCENE` durations in the composition (keep multiples of 15), then
regenerate the music with `--cuts` set to the new cut seconds (see Music below).

To add/edit a scene: add a `<Series.Sequence durationInFrames={…}><SnapIn>…</SnapIn></Series.Sequence>`
with a `PanScene` (or a bespoke scene). Captions are JSX with `<Accent>` on the emphasis words.

## Music (gen-lofi-variants.mjs)

`video/scripts/gen-lofi-variants.mjs` synthesises a license-free lo-fi bed (Rhodes chords, soft
kick, brush percussion) that marks **each cut with a warm-chord swell** — no clap. This is the
user's standing preference. It takes CLI flags, so a new video needs no script edits:

```bash
node scripts/gen-lofi-variants.mjs --duration=20.5 --cuts=2.5,5.5,8.5,11.5,14.5,17.5 \
  --only=classic --prefix=platform      # → public/audio/platform-music-lofi-classic.wav
```

- `--cuts` **must equal** the scene-cut times above — that's what puts a swell on every
  transition. `--duration` should slightly exceed the composition length.
- `--only=classic` picks the one variant the user chose; drop it to render all variants for
  auditioning. `--prefix` namespaces the output file per video.
- Wire it in the composition: `<Audio src={staticFile("audio/<prefix>-music-lofi-classic.wav")}
volume={0.66} />` behind `const MUSIC = true`. Set `false` for silent.
- Claude can't hear audio. Tell the user to audition it and swap for a licensed track
  (Artlist/Epidemic) if preferred — just replace the wav.
- `gen-music.mjs` is the older energetic clap bed (`CUT_SECONDS` const, writes `audio/music.wav`).
  Only use it if the user explicitly asks for claps.

To make it less "boring": shorten scenes and hard-cut (not crossfade), keeping the swells on the
cuts. To make it punchier, raise the `<Audio>` volume.

## Rendering

No system **ffmpeg** is required — Remotion bundles its own. From `video/`:

```bash
npx remotion render <CompositionId> out/<name>.mp4 --codec=h264 --image-format=png
```

`--image-format=png` renders lossless intermediate frames → crisper UI text than the default jpeg.

## QA without watching the video

You can't preview an mp4 (no player, no system ffmpeg). QA with **still frames** instead:

```bash
node scripts/stills.mjs "37,131,210,300,510" EvaPlatform   # 2nd arg = composition id
```

The composition id argument **defaults to `EvaHero`** — pass it explicitly or you will QA the wrong
video. Frames land in `out/still-<f>.png`; pick one per scene at its midpoint (plus the
cursor-click frame if there is one).

Then read the PNGs and check **every edge of the frame**: is the top-right primary button whole,
are the sidebar labels whole, is the footer/stats row whole, does the caption overlap live UI text?
Also check the caption wording against what the screen actually shows, the cursor on its target,
and count-up values.

Verify the finished file (pass the output path — it defaults to `out/eva-demo.mp4`):

```bash
node scripts/check-audio.mjs out/eva-platform.mp4   # duration, dimensions (expect 1280×720), codecs
```

## Other gotchas

- Pin every `@remotion/*` dependency to the **same exact version** (e.g. `4.0.479`) — mismatched
  versions break the bundler. `react`/`react-dom` 19 are fine.
- Fonts: `video/src/components/fonts.ts` loads Inter + JetBrains Mono via `@remotion/google-fonts`;
  it's imported by `EvaHero` so text renders consistently headless.
- This is a standalone Remotion project at the repo root — it is NOT part of the pnpm workspace
  (`packages/*`, `apps/*`), so it won't collide with the app's React/Vite versions.
