---
name: eva-tweet
description: Write launch/announcement tweets in Vedant's style — terse dev-tool shipping posts built from a one-line hook, an optional positioning line, an arrow bullet list of capabilities, and a punchy close. Use whenever drafting or editing a tweet, X post, thread, or launch/changelog post announcing a feature, release, version bump, or experiment — even if he doesn't say "in my voice".
---

# Vedant's tweet voice

These are **dev-tool shipping posts**. The reader is another engineer scrolling fast. The tweet's job is to state what now exists and what it can do — nothing else. No selling, no story, no thread of context.

The whole style is one idea: **capability lists do the persuading**. You never write that something is fast or powerful; you write `83ns update dispatch` and let the reader conclude it.

This is a **written** voice and it is not the same as [[vedant-voice]], which is spoken, warm, and story-shaped (before→now→why). Do not import that structure here. Tweets are flat, clipped, and declarative.

## The shape

Almost every post is the same four blocks, separated by blank lines. Blocks 2 and 4 are optional.

```
1. Hook          — what now exists, one line
2. Positioning   — what it is, one fragment (no verb needed)
3. Arrow list    — 3–5 capabilities, each prefixed →
4. Close         — the goal, the payoff, or a fragment triad
```

Worked example:

```
Introducing <terminal />

A built-in component for Native SDK

→ Real shell on a PTY
→ Powered by libghostty-vt
→ Selection, scrollback + truecolor
→ Record sessions, replay them offline

Give your software factory or agent orchestrator a terminal
```

Short posts drop straight to blocks 1–2, or 1 alone:

```
portless v0.15.3 is out

HTTPS from WSL now just works in Windows browsers
```

## Block 1 — the hook

One line. It names the thing and the fact that it exists now. Pick the opener that matches what actually happened:

- `Introducing X` — a genuinely new product or surface
- `New experiment: X` — early, unproven, explicitly a punt
- `Now available: X` — a feature landing in something that already shipped
- `X now <verbs>` — an existing thing gained a capability ("Native SDK now renders CJK")
- `You can now <do X>` — framed from the user's side
- `X v0.15.3 is out` — a version bump

Never `We're excited to announce`. Never `🚀`. Never a question as the hook.

## Block 2 — positioning

One fragment, no full sentence needed, no period required. It answers "what _is_ this" for someone who's never heard of it.

- `A TypeScript-to-native compiler`
- `A built-in component for Native SDK`
- `agent-browser is now a browser agent.`

If the hook already made it obvious, cut this block.

## Block 3 — the arrow list

The core move. `→ ` then a terse capability. Rules:

- **3–5 items.** Six is too many, two isn't a list.
- **No trailing punctuation.** Ever.
- **Fragments, not sentences.** `→ Type checked by tsc`, not `→ It is type checked by tsc`.
- **Sentence case**, except where a lowercase project name or `all-lowercase enumeration` is natural: `→ inputs, trees, charts, dialogs`.
- **Mix the register freely** — a list can hold a technical spec, a benefit, and a get-out clause side by side: `→ 83ns update dispatch` / `→ Real TS: Classes, generics, try/catch` / `→ No Zig required / eject to Zig anytime`.
- **Lead with what's most surprising**, not what's most fundamental.

Some items are literal commands or invocations rather than prose — that's fine and common: `→ One-shot: agent-browser chat "open google, search for dogs"`.

## Block 4 — the close

One line, optional. It's either:

- **the goal**, stated flatly — `Goal: compile existing TS/JS with no code changes`
- **the payoff, imperative** — `Give your software factory or agent orchestrator a terminal`
- **a fragment triad** — three clipped fragments, usually two negations then the positive:
  ```
  No webview. No DOM.
  Just markup + TypeScript.
  ```
- **a benefit line with numbers** — `For agents: half the turns, half the cost, half the LOC`

Never a call to action. No "check it out", no "link below", no "let me know what you think".

## Code and commands

CLI goes bare on its own line — no backticks, no code fences, no indentation. Twitter renders them as literal characters, so they add noise.

```
agent-browser a11y <url>
```

Multi-line snippets can carry a `#` comment to mark the human step:

```
agent-browser network har start
# agent browses, clicks around
agent-browser network har stop
```

## Register

- **Terse. Declarative. Present tense.** Every line earns its place or gets cut.
- **Concrete specifics always** — `40+ built-in components`, `83ns`, `WCAG`, `axe-core`, `v0.15.3`, `libghostty-vt`. Named dependencies are credibility.
- **"just" as a minimizer** carries over from his spoken voice: `HTTPS from WSL now just works`, `Just markup + TypeScript`.
- **Lowercase project names stay lowercase** — `agent-browser`, `portless`, `json-render`, `eva`. Never title-case them at the start of a line.
- **Blank line between every block.** The whitespace is the layout.

## What to avoid

- **No hashtags. No @-mentions. No links.** None of the reference posts use them.
- **No exclamation marks.** Emoji almost never — at most one, only where something is genuinely wry.
- **No adjective-selling** — "powerful", "blazing fast", "seamless", "game-changing", "revolutionary". State the spec instead.
- **No hype openers** — "We're excited to", "Big news", "Thrilled to share".
- **No threads by default.** One post, one shipped thing. Only thread if the user asks.
- **No before→now story.** That's the spoken voice. Here you state the after and stop.

## Length

Under 280 characters, and usually well under. Aim for the shortest version that still names every capability worth naming. If it doesn't fit, cut an arrow item — never compress by removing whitespace.

## How to apply

Given a feature or release, ask three questions: what now exists (hook), what is it (positioning), what can it do (3–5 arrows). Write those, then decide whether a close adds anything — if not, end on the list. Strip every adjective that isn't load-bearing, then check each arrow item for a trailing period and delete it.
