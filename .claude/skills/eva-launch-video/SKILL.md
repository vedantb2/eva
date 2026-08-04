---
name: eva-launch-video
description: >-
  Produce polished, mobile-friendly product demo videos of the eva app with Remotion —
  1280×720, snappy beat-synced hard cuts, lo-fi music that swells on every cut, and footage captured from
  the REAL running app via agent-browser (no mockups). Use this whenever the user wants to
  make, update, re-cut, re-score, re-capture, or re-render an eva demo/product/launch/Twitter
  video or screen-recording walkthrough, or mentions the `video/` Remotion project — even if
  they don't say "Remotion". It encodes hard-won defaults (resolution, zoom/framing, theme,
  pacing, music sync, rendering, QA) so you don't repeat past mistakes.
---

# eva product video

Make a high-end product video of the **eva** app (Linear/Notion quality) using the existing Remotion
project at `video/`. Footage comes from the real app, captured with `agent-browser`.

**Wrong skill?** This one is the polished multi-scene edit (Remotion, music, captions). For a single
feature, prefer the lighter siblings: `eva-feature-screenshot` (one screenshot + tweet) or
`eva-feature-demo` (one raw agent-browser recording + tweet). Tweet copy for any of the three
comes from `eva-tweet`.

**The canonical project already exists — reuse it, don't start over.**

- Project: `video/` · primary composition: **`EvaHero`** (`video/src/EvaHero.tsx`)
- Render output: `video/out/eva-demo.mp4`
- Reusable components in `video/src/components/`: `Backdrop`, `AppWindow`, `EvaMark`, `HeroCaption`
  (+ `Accent`), `Cursor`, `Spotlight`, `StatCounter`, `SnapIn`, `tokens`.
- Helper scripts in `video/scripts/`: `stills.mjs`, `gen-music.mjs`, `check-audio.mjs`.

To make a NEW video: re-capture screens for the new story, edit the scene list / captions / durations
in `EvaHero.tsx`, regenerate the music to match the cut times, render, QA.

## Non-negotiable defaults (learned the hard way — change only with a reason)

Each of these was a mistake first. Keep them unless the user overrides.

1. **1280×720, 30fps.** Not 1080p. The eva UI is a dense desktop app; at 1080p it reads "too zoomed /
   too big" on a phone. 720p is the mobile-friendly sweet spot for Twitter/X.

2. **Capture at the frame's native layout, show full-bleed.** Set the browser viewport to **1280×720**
   when capturing, then display the screenshot **full-bleed at 1:1** (filling the whole frame). The
   single biggest quality lever:
   - Capturing at 2560×1440 and downscaling to 720p halves UI text size → "zoomed out" and unreadable
     on mobile.
   - Cropping/zooming the camera _into_ a region shows awkward fragments of the UI.
   - A 1280-wide layout shown 1:1 = native element sizes = readable + "zoomed in" + crisp.

   **Zero zoom means zero.** `PanScene` `from`/`to` stay at `{ scale: 1.0, fx: 0.5, fy: 0.5 }` for
   every screenshot scene. Even a 1.02–1.06 "subtle push-in" clips the chrome the viewer needs — the
   sidebar labels, the primary button in the top-right corner, the stats footer. Also pass
   `<SnapIn from={0.97}>` around screenshots: the default 1.06 pops _inward_ and crops the opening
   frames of every cut. Motion comes from the hard cuts and caption snaps, not from camera moves.

3. **Real footage, finished states.** Drive the actual app with `agent-browser`. Record
   _already-completed_ work (merged tasks, diffs, PRs) — do NOT wait on live agent runs (sandboxes are
   stopped; live runs are slow and flaky). Stage clean inputs (e.g. a tidy task title in the New Task
   modal). See `references/capture-workflow.md`.

   **Never submit — type only.** Fill the input, open the picker, capture. No Enter in a composer, no
   send arrow, Create, Save, Run, or Start, and never kick off a real session or agent run, not even
   for demo footage. Submitting mutates the user's real workspace and burns real compute; the staged
   state is all the shot needs. Enter is allowed only where it commits to the field itself and nothing
   else (accepting an `@`-mention from an open picker) — otherwise click the picker row.

4. **Snappy, hard-cut, beat-synced.** ~20s total. Cut on the beat (use `<Series>`, not long
   crossfades) and snap captions in fast. Pop scenes in with `SnapIn` — bare over title/outro cards,
   `from={0.97}` over screenshots (see default 2). Boring = too long + too many slow crossfades.

5. **Music synced to every cut.** The user's standing preference is **lo-fi, the "classic" variant, no
   clap** — generate it with `gen-lofi-variants.mjs`, which marks each cut with a warm-chord swell
   instead. It takes `--duration`, `--cuts`, `--only`, `--prefix`, so a new video needs no edits to the
   script:

   ```bash
   node scripts/gen-lofi-variants.mjs --duration=20.5 --cuts=2.5,5.5,8.5,11.5,14.5,17.5 \
     --only=classic --prefix=platform      # → public/audio/platform-music-lofi-classic.wav
   ```

   `--cuts` **must** match the scene boundaries in the composition. `gen-music.mjs` is the older clap
   bed — only use it if the user asks for one. See `references/remotion-build.md` → Music.

6. **Match eva's theme.** Near-black `#050606`, indigo accent `#818cf8`, brand mark gradient purple
   `#8B3FB8` → blue `#3B7DD8`, fonts Inter + JetBrains Mono. All in `video/src/components/tokens.ts`.
   Never invent brand colors.

7. **Be honest + protect confidentiality.** Use the user's OWN repo (`vvedantb/eva`), never client
   repos (Evalucom/CarePulse). Don't show the "Codebases" home (lists client repos), and check
   document/task lists for client-named items before capturing — stage a clean demo doc if the list is
   dirty. **Never raise personal-data concerns about names or emails on screen** — Settings →
   Experimental has a blur-PID toggle that blurs every `[data-pii]` element, so this is handled in
   the product. Do flag error panels leaking env var names or project ids. Captions describe truthfully — never imply a feature the screen doesn't show. If the only
   available capture is a stopped sandbox or an empty state, reword the caption to match the screen
   rather than dressing it up.

## Workflow

Work in this order; read each step's reference file before doing the step.

1. **Plan the story.** Default hero flow (8 scenes, ~20s): title → describe a task → Eva writes code →
   review & ship PR → board → projects → proof (count-up stats) → outro. Pick the scenes and one-line
   captions first.

2. **Capture footage** → read `references/capture-workflow.md`. Start the app (`pnpm dev`), sign in as
   the agent user, set viewport **1280×720**, screenshot each screen into `video/public/captures/`.

3. **Compose / edit** → read `references/remotion-build.md`. Edit `EvaHero.tsx`: scene list, durations
   (multiples of the beat), captions, the cursor path for the input scene. Reuse existing components.

4. **Score it** → read `references/remotion-build.md` → Music. Run `gen-lofi-variants.mjs` with
   `--cuts` matching the scene boundaries (default 5 above), point the composition's `<Audio>` at the
   generated file, confirm `MUSIC = true`.

5. **Render + QA.** You can't preview the mp4 directly (no system ffmpeg, and you can't watch video) —
   so QA with **still frames**, one per scene, taken mid-scene:
   ```bash
   cd video
   node scripts/stills.mjs "40,110,200,290,380,470,560" EvaPlatform   # 2nd arg = composition id
   ```
   The composition id defaults to `EvaHero` — **pass it explicitly** or you will QA the wrong video.
   Read the PNGs in `video/out/` and check every edge of the frame: is the top-right primary button
   whole, are the sidebar labels whole, does the caption overlap live UI text? Then render + verify:
   ```bash
   npx remotion render EvaPlatform out/eva-platform.mp4 --codec=h264 --image-format=png
   node scripts/check-audio.mjs out/eva-platform.mp4   # duration, 1280×720, audio track present
   ```
   `--image-format=png` keeps UI text crisp. Iterate on stills until it's right, then render.

## Quick reference

| Need                 | Command (run from `video/`)                                                  |
| -------------------- | ---------------------------------------------------------------------------- |
| Live preview / scrub | `npm run dev` (Remotion Studio)                                              |
| Capture one screen   | `bash scripts/shot.sh /vvedantb/eva/web/sessions sessions-list 4000`         |
| Render a composition | `npx remotion render <Id> out/<name>.mp4 --codec=h264 --image-format=png`    |
| QA specific frames   | `node scripts/stills.mjs "40,110,200" <CompositionId>`                       |
| Regenerate music     | `node scripts/gen-lofi-variants.mjs --cuts=… --only=classic --prefix=<name>` |
| Verify output file   | `node scripts/check-audio.mjs out/<name>.mp4`                                |

## Existing compositions

`EvaHero` (hero flow) · `SessionsDemo` (cloud sessions) · `EvaPlatform` (all five surfaces in one
place: sessions → docs → testing arena → kanban tasks → PR reviews) · `QuickTasksDemo` (legacy).
Register any new one in `video/src/Root.tsx` at 1280×720 / 30fps.

## Gotchas that cost time before

- **Sign-in URL is `/?agent=true`** (boolean), not `/?agent` — the route validates `agent` as a zod
  boolean and `/?agent` throws "Expected boolean, received string". If the callback hangs on
  "Signing in…" with `You're already signed in`, navigate straight to the target page.
- **Dev overlays land in the screenshot.** react-scan renders an FPS toolbar into a shadow root on
  `#react-scan-root`, and agentation into `[data-agentation-root]`. A stylesheet alone doesn't kill
  react-scan — its host carries inline styles, so also set `display:none !important` inline on the
  host. `scripts/shot.sh` does both; use it rather than hand-rolling a capture chain.
- **Chain `agent-browser` calls in one Bash command with `timeout`**, and background anything long. A
  naive open → wait → screenshot chain blows the tool timeout. Refs from `snapshot -i` go stale the
  moment the dev toolbar expands — re-snapshot after hiding overlays, before clicking.
- **Pin all `@remotion/*` packages to the same exact version** or the bundler errors.
- **Music can't be auditioned by Claude.** The bed does exactly what's asked (a swell on each cut) but
  tell the user to listen and swap for a licensed track if they want — set `MUSIC=false` for silent.
- **Sandboxes in old session captures are stopped**, so every session screen reads "Start the sandbox
  to…". Don't caption it as live. Nothing in `captures/sessions/` shows a running sandbox.
- **Captions carry the message** — most Twitter playback is muted, so every scene needs a caption.

Detailed how-tos: `references/capture-workflow.md` (footage) and `references/remotion-build.md`
(composition, theme, music, rendering, QA).
