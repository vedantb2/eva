# Render pass internals

Read this only when tuning the zoom pass. The defaults are fine for a normal take — the take script
and `render-screencast.mjs <slug>` need nothing from this file.

## Action log

`recordings/<slug>.actions.json`, one entry per action:

```
{ t (ms from record start), kind: click|type|nav, x, y (viewport px), label?, text? }
```

`text` is only meaningful on `type` and is what the caption renders. `render-screencast.mjs` validates
the whole log — it is the trust boundary, since `video/` has no zod.

## `video/src/screencast/zoom.ts`

Pure functions, no Remotion imports, so the motion can be reasoned about without rendering a frame.

- **`buildSegments`** turns the log into zoom windows. Actions closer together than the lead-in **merge
  into one segment**, so a type-then-click sequence stays zoomed and the camera drifts between targets
  instead of bouncing out and straight back in. `nav` actions are never zoomed — a navigation's payoff
  is the whole new screen.
- **`clampFocal`** keeps the zoomed viewport inside the frame, so a target in the top-right corner does
  not slide empty space into shot.
- **`cursorAt`** reconstructs the pointer path: park on a target, glide to the next over 520ms, arrive
  160ms before the action fires. `nav` is skipped, or the cursor takes a phantom trip to frame centre.
- **`captionAt`** reveals typed text a character at a time at `CAPTION_CPS` (20/sec), then holds a
  second and fades. `captionDurationMs` is the same number the take script's `say` waits out, and
  `holdFor` extends the zoom to cover it — so long text can never outlive its own zoom.

## `video/src/FeatureScreencast.tsx`

The composition. Cursor and click ring live **inside** the camera transform so they stay glued to their
element, with the cursor counter-scaled by `1 / camera.scale` to keep a constant on-screen size. The
caption lives **outside** the transform, so it doesn't scale or drift off frame while the shot moves
behind it.

## Tuning

`--zoom=1.4` on the render for a gentler push (default `1.55`; above ~1.7 the surrounding UI stops
being readable). Everything else is a constant in `zoom.ts` (`DEFAULT_ZOOM`, `CURSOR_TRAVEL`,
`CAPTION_CPS`) — change it there, not per-take.
