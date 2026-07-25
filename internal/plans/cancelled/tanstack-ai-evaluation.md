# TanStack AI Evaluation — Not Adopting

Date: 2026-07-17. Verdict: **do not adopt.** Revisit only if TanStack AI
reaches stable AND eva pivots to browser-streamed, host-driven inference
(neither expected).

## What TanStack AI is

Provider-agnostic full-stack TypeScript AI SDK. Core primitive: a `ChatClient`
(`useChat` hook) that opens a streaming HTTP connection browser -> server
runtime (Node/CF Workers) -> provider adapter (Anthropic/OpenAI/Gemini/...) ->
AG-UI event stream back. Adds typed tools, multimodal hooks, and its own
coding-agent-sandbox feature. Maturity: alpha/beta, 0.x, ~1,400 releases,
rapid breaking changes. Works with any React SPA (not tied to TanStack Start).

## Why it does not fit eva

TanStack AI sells the transport + inference layer. eva solved that layer
deliberately and differently — everything it offers, eva already has or has
rejected:

| Layer           | TanStack AI                                   | eva today                                                                                                                                                                                                  |
| --------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Transport       | Browser streams SSE/AG-UI from a server route | Convex reactive queries; sandbox POSTs heartbeat snapshots to `streamingActivity` row (`convex/streaming.ts`, `/api/streaming/heartbeat`); UI re-renders via `useQuery`. No `useChat`, no SSE in app code. |
| Message model   | Vercel-style `UIMessage`                      | Convex `Doc<"messages">` (`_validators/tableFields.ts`)                                                                                                                                                    |
| Inference       | Chat-completion adapters, API keys            | Full coding-agent CLIs/SDKs inside sandboxes — `@anthropic-ai/claude-agent-sdk`, Codex, Cursor, OpenCode — with subscription OAuth, not `messages.create`                                                  |
| Agent sandboxes | New TanStack feature                          | eva's core product, already more mature                                                                                                                                                                    |

Fundamental mismatch: TanStack AI assumes the model sits behind an HTTP endpoint
you stream from. eva's model sits inside a remote sandbox running a full agentic
harness, reporting back through Convex. Adopting `useChat` means writing a
Convex->TanStack adapter to feed a streaming hook eva does not need (it does not
stream from the browser) — pure overhead, zero gain. Same reasoning that killed
the Vercel harness.

## Maturity

Chat/streaming is core product surface. TanStack AI is alpha, 0.x, churning.
High risk, no upside.

## Nuance: the type-only `ai` dep

eva's only Vercel-AI-SDK footprint is type-only — `@conductor/ui` ai-elements
import `UIMessage`/`FileUIPart` from `ai` (>=5.0.0); runtime markdown streaming
is `streamdown`. Not a reason to adopt TanStack AI (which would add a heavy
runtime dep where a light type-only one exists today).

## Bottom line

TanStack ecosystem already earns its place via Router (+ Table, hotkeys).
TanStack AI targets a problem eva solved on purpose with Convex + sandbox
harnesses. Adopting it would be a downgrade dressed as modernisation.
