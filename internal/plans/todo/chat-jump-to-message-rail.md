# Chat Jump-to-Message Rail (t3code-style minimap)

## Why

Long sessions/tasks/projects produce long chat threads. There's no way to see
or jump between turns without scrolling — t3code (pingdotgg/t3code, PR #3587,
"Restore chat scroll affordances and add timeline minimap") solved this with a
hover-reveal vertical rail: one tick per user message, hover/focus preview of
that turn's text, click or arrow-keys to jump.

## Scope

`ChatBody` (`apps/web/src/lib/components/chat/ChatBody.tsx`) is the single
shared chat renderer behind:

- `routes/_repo/$owner/$repo/sessions/ChatPanel.tsx` (session sandbox)
- `lib/components/tasks/TaskSandboxChatPanel.tsx` (quick task)
- `lib/components/projects/ProjectSandboxChatPanel.tsx` (project sandbox)

Building the rail once inside `ChatBody` covers all three surfaces with no
per-surface work.

## Decided

- **Ticks = user messages only**, matching t3code (assistant replies map 1:1
  to the preceding user turn, so a separate tick per assistant message is
  redundant).
- Reuse the existing `use-stick-to-bottom`-based scroll setup
  (`Conversation`/`ConversationContent` in `packages/ui/src/ai-elements/conversation.tsx`)
  rather than replacing it — the rail is additive, not a scroll-behavior
  rewrite.

## Implementation sketch

1. **New component** `packages/ui/src/ai-elements/conversation.tsx` (or a
   route-local `_components/ChatJumpRail.tsx` if it shouldn't ship in the
   shared `@eva/ui` package — needs a decision, see Open questions):
   - Props: list of `{ id, preview }` for user messages, `activeId`,
     `onSelect(id)`.
   - Renders a vertical rail of ticks positioned by index (percentage of
     total, like t3code's `resolveTimelineMinimapTopPercent`), visible only
     on wide layouts with a fine pointer (`@media (pointer: fine)` + min
     content-width check), fading in on hover otherwise.
   - Keyboard support: `ArrowUp`/`ArrowDown` to move focus, `Home`/`End` to
     jump to first/last, `Enter`/`Space` to select.
   - Hover/focus shows a popover with the user message's (and its final
     assistant reply's) trimmed text — same shape as t3code's tooltip.

2. **Wiring in `ChatBody`**:
   - `ChatBody` already renders all messages via `.map(renderMessage)`
     (no virtualization, unlike t3code's `LegendList`) — so jump-to-message
     is a plain `element.scrollIntoView({ behavior: "smooth", block: "start" })`
     on a ref attached to each user message's wrapper, not an index-based
     virtualized scroll API.
   - Add `data-message-id={message._id}` to the user message wrapper (or a
     ref map keyed by `_id`) so the rail can resolve DOM nodes to scroll to.
   - Build the rail's tick list via `useMemo` filtering `messages` to
     `role === "user"`, truncating `content` for the preview (reuse
     `MessageMentionText`'s plain-text extraction if it exists, else a
     simple whitespace-collapse).
   - Track "currently visible" turn via `IntersectionObserver` on user
     message wrappers (cheaper than t3code's scroll-position math since the
     list isn't virtualized) to highlight the active tick.

3. **Scroll interaction with stick-to-bottom**:
   - Selecting a tick should release "stick to bottom" the same way manual
     scrolling already does (`use-stick-to-bottom` detects the scroll event
     itself, so a plain `scrollIntoView` inside the `StickToBottom` viewport
     should already trigger this — verify, don't assume).

4. **Empty/short-thread guard**: hide the rail entirely below 2 user
   messages, same threshold as t3code (`TIMELINE_MINIMAP_MIN_ITEMS`).

## Open questions

- Shared UI package (`@eva/ui`) vs. route-local component — does this
  belong next to `Conversation`/`ConversationScrollButton` since it's
  conceptually part of that same primitive, or is it specific enough to
  `ChatBody`'s message shape (`ChatBodyMessage`) to live in
  `lib/components/chat/`?
- Any accessibility label conventions already established elsewhere in the
  UI kit for this kind of rail/tick-list (to stay consistent instead of
  inventing new `aria-label` phrasing)?

## Next step

Once the above two questions are answered, implement per the sketch above,
then run `/changelog`.
