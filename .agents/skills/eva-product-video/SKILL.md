---
name: eva-product-video
description: >-
  Produce polished, mobile-friendly product demo videos of the eva app with Remotion —
  1280×720, snappy beat-synced hard cuts, energetic clap music, and footage captured from
  the REAL running app via agent-browser (no mockups). Use this whenever the user wants to
  make, update, re-cut, re-score, re-capture, or re-render an eva demo/product/launch/Twitter
  video or screen-recording walkthrough, or mentions the `video/` Remotion project — even if
  they don't say "Remotion". It encodes hard-won defaults (resolution, zoom/framing, theme,
  pacing, music sync, rendering, QA) so you don't repeat past mistakes.
---

# eva product video

Make a high-end product video of the **eva** app (Linear/Notion quality) using the existing
Remotion project at `video/`. Footage comes from the real app, captured with `agent-browser`.

**The canonical project already exists — reuse it, don't start over.**

- Project: `video/` · primary composition: **`EvaHero`** (`video/src/EvaHero.tsx`)
- Render output: `video/out/eva-demo.mp4`
- Reusable components in `video/src/components/`: `Backdrop`, `AppWindow`, `EvaMark`,
  `HeroCaption` (+ `Accent`), `Cursor`, `Spotlight`, `StatCounter`, `SnapIn`, `tokens`.
- Helper scripts in `video/scripts/`: `stills.mjs`, `gen-music.mjs`, `check-audio.mjs`.

To make a NEW video: re-capture screens for the new story, edit the scene list / captions /
durations in `EvaHero.tsx`, regenerate the music to match the cut times, render, QA.

## Non-negotiable defaults (learned the hard way — change only with a reason)

These exist because each was a mistake first. Keep them unless the user overrides.

1. **1280×720, 30fps.** Not 1080p. The eva UI is a dense desktop app; at 1080p it reads
   "too zoomed / too big" on a phone. 720p is the mobile-friendly sweet spot for Twitter/X.

2. **Capture at the frame's native layout, show full-bleed.** Set the browser viewport to
   **1280×720** when capturing, then display the screenshot **full-bleed at 1:1** (it fills the
   whole frame). This is the single biggest quality lever:
   - Capturing at 2560×1440 and downscaling to 720p makes UI text ~half-size → looks "zoomed
     out" and unreadable on mobile.
   - Cropping/zooming the camera _into_ a region shows awkward fragments of the UI.
   - A 1280-wide layout shown 1:1 = native element sizes = readable + "zoomed in" + crisp.

3. **Real footage, finished states.** Drive the actual app with `agent-browser`. Record
   _already-completed_ work (merged tasks, diffs, PRs) — do NOT wait on live agent runs
   (sandboxes are stopped; live runs are slow and flaky). Stage clean inputs (e.g. type a tidy
   task title into the New Task modal). See `references/capture-workflow.md`.

4. **Snappy, hard-cut, beat-synced.** ~20s total. Cut on the beat (use `<Series>`, not long
   crossfades), pop each scene in with `SnapIn`, snap captions in fast. Boring = too long +
   too many slow crossfades.

5. **Clap music synced to every cut.** Generate an energetic drum bed (`gen-music.mjs`) where
   an accent clap lands on each scene cut. The cut times in the music script **must** match the
   scene durations in `EvaHero.tsx`. See `references/remotion-build.md` → Music.

6. **Match eva's theme.** Near-black `#050606`, indigo accent `#818cf8`, brand mark gradient
   purple `#8B3FB8` → blue `#3B7DD8`, fonts Inter + JetBrains Mono. All in
   `video/src/components/tokens.ts`. Never invent brand colors.

7. **Be honest + protect confidentiality.** Use the user's OWN repo (`vvedantb/eva`), never
   client repos (Evalucom/CarePulse). Don't show the "Codebases" home (lists client repos).
   Flag any visible PID (the demo email, real names) before the user posts publicly. Captions
   describe the product truthfully — don't imply a feature the screen doesn't show.

## Workflow

Work in this order; each step has a detailed reference file — read it before doing the step.

1. **Plan the story.** Default hero flow (8 scenes, ~20s): title → describe a task →
   Eva writes code → review & ship PR → board → projects → proof (count-up stats) → outro.
   Pick the scenes and one-line captions first.

2. **Capture footage** → read `references/capture-workflow.md`.
   Start the app (`pnpm dev`), sign in as the agent user, set viewport **1280×720**, screenshot
   each screen into `video/public/captures/`.

3. **Compose / edit** → read `references/remotion-build.md`.
   Edit `EvaHero.tsx`: scene list, durations (multiples of the beat), captions, the cursor
   path for the input scene. Reuse the existing components.

4. **Score it** → read `references/remotion-build.md` → Music.
   Set `CUT_SECONDS` in `gen-music.mjs` to the scene-cut times, run it, confirm `MUSIC = true`.

5. **Render + QA.** You can't preview the mp4 directly (no system ffmpeg, and you can't watch
   video) — so QA with **still frames**:
   ```bash
   cd video
   node scripts/stills.mjs "37,131,210,300,510"   # bundle once, render these frames as PNGs
   ```
   Read the PNGs in `video/out/` to check framing, zoom, captions, cursor. Then render + verify:
   ```bash
   npx remotion render EvaHero out/eva-demo.mp4 --codec=h264 --image-format=png
   node scripts/check-audio.mjs   # confirms duration, 1280×720, and an embedded audio track
   ```
   `--image-format=png` keeps UI text crisp. Iterate on stills until it's right, then render.

## Quick reference

| Need                  | Command (run from `video/`)                                                    |
| --------------------- | ------------------------------------------------------------------------------ |
| Live preview / scrub  | `npm run dev` (Remotion Studio)                                                |
| Render the hero video | `npx remotion render EvaHero out/eva-demo.mp4 --codec=h264 --image-format=png` |
| QA specific frames    | `node scripts/stills.mjs "12,131,300"`                                         |
| Regenerate music      | `node scripts/gen-music.mjs` (after setting `CUT_SECONDS`)                     |
| Verify output file    | `node scripts/check-audio.mjs`                                                 |

## Gotchas that cost time before

- **Sign-in URL is `/?agent=true`** (boolean), not `/?agent` — the route validates `agent` as a
  zod boolean and `/?agent` throws "Expected boolean, received string". If the callback hangs on
  "Signing in…" with `You're already signed in`, just navigate straight to the target page.
- **Pin all `@remotion/*` packages to the same exact version** or the bundler errors.
- **Music can't be auditioned by Claude.** The generated beat does exactly what's asked (claps on
  cuts) but tell the user to listen and swap for a licensed track if they want — set `MUSIC=false`
  in `EvaHero.tsx` for silent.
- **Captions carry the message** — most Twitter playback is muted, so every scene needs a caption.

Detailed how-tos: `references/capture-workflow.md` (footage) and `references/remotion-build.md`
(composition, theme, music, rendering, QA).
