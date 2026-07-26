---
name: eva-feature-screenshot
description: >-
  Grab a single clean screenshot of a new eva feature from the real running app (agent-browser,
  1280×720, dev overlays hidden) and write a tweet to post with it. Use whenever the user wants
  to show off / announce / post about a feature with a screenshot, screengrab, or image — "grab a
  shot of X and write a tweet", "post this new feature", "screenshot for X/Twitter". This is the
  NO-VIDEO path: one still image + copy. For motion use eva-feature-demo (real screen
  recording) or eva-launch-video (edited Remotion cut).
---

# eva feature shot

One screenshot of a shipped feature + one tweet. No Remotion, no music, no editing, no captions
burned into the image — the product UI is the asset.

Two files land in `screenshots/` at the repo root (already gitignored):

| File                             | What it is                                                 |
| -------------------------------- | ---------------------------------------------------------- |
| `<YYYY-MM-DD>-<slug>.png`        | raw 1280×720 shot — keep it, it is the reshoot-free source |
| `<YYYY-MM-DD>-<slug>-framed.png` | **post this one** — 1600×900, branded frame                |

The framed version sits the raw shot on eva's brand gradient with rounded corners, an eva icon and
the "Eva" wordmark above it. That is why the shot reads as a product announcement rather than a bug
report screenshot.

## Non-negotiable defaults

1. **1280×720 viewport, screenshot at 1:1.** Exactly 16:9, what X shows in-timeline without
   cropping. Any other aspect gets centre-cropped and you lose the edges. The framed output is
   1600×900 — also 16:9, so the frame costs nothing in the timeline.

2. **Never `--full`.** A full-page shot of a dense app becomes a tall strip that renders
   thumbnail-sized in the timeline. One viewport, one idea.

3. **Hide the dev overlays before shooting.** react-scan and agentation both render into the page.
   Use `scripts/shot.sh` rather than a hand-rolled chain.

4. **Match the app's real theme.** Whatever the user is running (`set media dark` for dark). Don't
   restyle the app for the photo.

5. **The feature must be the visual subject.** A 200px panel in the corner of a busy page fails.
   Navigate to a view where it dominates, or open the surface that contains it (modal, sheet, detail
   pane) so it reads at timeline size.

6. **Frame it, but don't annotate it.** Always run step 6 — the gradient + wordmark is the house
   style. Never add arrows, red circles, callout text, or fake browser chrome unless asked.

7. **Never submit. Type only.** Fill inputs, open pickers, stage the state — then shoot. No Enter in
   a composer, no send arrow, Create, Save, Run, or Start, and never kick off a real session or agent
   run, not even for a better shot. Submitting mutates the user's real workspace and burns real
   compute; the staged state is what you are photographing. Enter is allowed only where it commits to
   the field itself and nothing else (accepting an `@`-mention from an open picker) — if you can't be
   certain that's all it does, click the picker row instead.

8. **Confidentiality.** Use the user's own repo `vvedantb/eva`. Never client repos
   (`evalucom/carepulse`, `eprocurement`) and never the "Codebases" home that lists them. Check
   doc/task/session lists in frame for client-named items — stage a clean demo row if the list is
   dirty. **Don't raise personal-data concerns about the app's own users** — accounts are
   first-name-only by design and the demo email is fake (confirmed twice; raising it again is noise).
   Do flag third-party names, real customer data, and error panels leaking env var names or project ids.

## Workflow

1. **Pin down what shipped.** If the user hasn't said which feature, ask — one question, not a
   survey. `git log --oneline -15`, `git diff --stat`, or `internal/changelog.md` usually name it.
   You need the feature and the URL that shows it.

2. **Start the app + sign in.** Full version in
   `.claude/skills/eva-launch-video/references/capture-workflow.md` §1–2:

   ```bash
   pnpm dev                                          # from repo root → localhost:5173
   agent-browser close
   agent-browser open "http://localhost:5173/?agent=true"   # ?agent=true — boolean, not /?agent
   agent-browser set viewport 1280 720
   agent-browser set media dark
   agent-browser open "http://localhost:5173/?agent=true"
   agent-browser wait --load networkidle && agent-browser wait 5000
   ```

3. **Get the screen into the state that shows the feature.** Navigate by URL (deterministic), then
   click/fill only as needed. Stage clean, readable inputs — a tidy demo title beats a real messy
   one. Re-`snapshot -i` after every navigation; refs go stale.

4. **Shoot it.**

   ```bash
   bash .claude/skills/eva-feature-screenshot/scripts/shot.sh /vvedantb/eva/web/sessions session-composer
   ```

   Takes a URL path + slug (+ optional settle ms). Pass `-` as the path to shoot the _current_ state
   instead of navigating — after you've opened a modal, say:

   ```bash
   bash .claude/skills/eva-feature-screenshot/scripts/shot.sh - new-task-modal 800
   ```

5. **Read the PNG back and judge it.** This is where bad shots get caught:
   - Is the feature the obvious subject, or lost in chrome?
   - Any overlay/toolbar survived? Any skeleton, spinner, or `—` placeholder still on screen? (Bump
     the settle ms and reshoot.)
   - All four edges: clipped labels, half-rendered buttons, a cut-off column?
   - Anything confidential per default 8?
   - Empty states: an empty board proving "kanban tasks" is a bad shot. Populate or pick another view.

6. **Frame it.**

   ```bash
   bash .claude/skills/eva-feature-screenshot/scripts/frame.sh <slug> "Eva"
   ```

   Writes `screenshots/<today>-<slug>-framed.png` (1600×900). It renders `templates/frame.html` at
   1600×900 and restores the viewport to 1280×720 after, so you can keep shooting. Read the framed
   PNG back too — check the gradient hasn't washed out the UI at the corners and the wordmark isn't
   clipped. A third argument frames a raw PNG from another path. `templates/frame.html` is the only
   place this skill's brand colours live.

7. **Write the tweet.** Invoke the `eva-tweet` skill — hook, optional positioning fragment, `→`
   capability list, optional close. The screenshot carries the proof, so the tweet states what now
   exists rather than describing the picture. Never reference the image at all.

8. **Hand over.** The **framed** file path as a markdown link, the tweet in a fenced block, and
   anything in frame the user should check before posting.

## Quick reference

| Need                      | Command                                                                                |
| ------------------------- | -------------------------------------------------------------------------------------- |
| Shoot a URL               | `bash .claude/skills/eva-feature-screenshot/scripts/shot.sh <path> <slug> [settle-ms]` |
| Shoot current page state  | `bash .claude/skills/eva-feature-screenshot/scripts/shot.sh - <slug> [settle-ms]`      |
| **Frame it (post this)**  | `bash .claude/skills/eva-feature-screenshot/scripts/frame.sh <slug> [title] [raw-png]` |
| See what's clickable      | `agent-browser snapshot -i`                                                            |
| Debug a blank/broken page | `agent-browser console` · `agent-browser errors`                                       |

## Gotchas

- **Sign-in URL is `/?agent=true`** — `/?agent` throws a zod `SearchParamError`. If it hangs on
  "Signing in…" and the console says `You're already signed in`, navigate straight to the target.
- **The dev overlays are three nodes, all hanging off `<html>`, not `<body>`.** Hiding
  `#react-scan-root` alone is not enough: react-scan draws its component outlines and labels on a
  bare `html > canvas` with no id or class, and that is the one that ruins the shot. `shot.sh` kills
  all three (`#react-scan-root`, `html > canvas`, `[data-agentation-root]`) with inline
  `display:none !important`, because a stylesheet loses to their inline styles.
- **`frame.sh` changes the viewport to 1600×900** and sets it back to 1280×720 on the way out.
  Reshoot if a shot lands between those two — check the raw PNG's size.
- **Refs (`@e1`) invalidate on any DOM change**, including the dev toolbar expanding. Re-snapshot
  immediately before clicking.
- **Two or more images dilute the point.** X renders one image full width; a second halves both.
  Only shoot more than one for a genuine before/after.
- **Don't reuse `video/public/captures/`** — those are Remotion assets framed for a different job.
