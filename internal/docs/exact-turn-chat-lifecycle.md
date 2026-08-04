# Exact-turn chat lifecycle

Date: 2026-07-31
Owner: Chat platform

## Purpose

Eva's session, task-sandbox, and project-sandbox chats use the same ownership contract. Every accepted user submission becomes one durable turn, and every later mutation must name that exact turn. No callback is allowed to infer its target from the newest message, the current stream, or client-side busy state.

This contract prevents a delayed callback from an older request from appearing in, clearing, or completing a newer assistant bubble.

## Durable identity

The browser creates a stable `turnId` before submission. When the server starts the turn, it records this active tuple on the owning session, task, or project:

```text
(turnId, assistantMessageId, attempt, protocolVersion)
```

- `turnId` identifies the logical user request and survives queue edits, reorder, dequeue, and safe network retries.
- `assistantMessageId` is the canonical Convex message row that owns streaming and the final answer.
- `attempt` distinguishes retries of the same logical turn.
- `protocolVersion` prevents an obsolete callback bundle or daemon from claiming a turn whose identity contract it cannot satisfy.

The callback protocol carries the first three fields on streams, heartbeats, questions, media, completion, cancellation, watchdogs, and recovery. The server compares all three before changing state.

## Submission and queueing

Each chat surface exposes one `submitTurn` mutation. It performs the complete acceptance decision in one Convex transaction:

1. Authorize the caller and validate the request.
2. Check the request fingerprint for an idempotent retry or a conflicting reused `turnId`.
3. If the entity is idle, insert the user row and canonical assistant placeholder, install `activeTurn`, and schedule dispatch.
4. If the entity is busy, insert one queue row containing the same `turnId`, request fingerprint, attachments, model, traits, mode, and provider account.
5. Return an authoritative `active` or `queued` result to reconcile the optimistic UI.

The client never chooses execution from a stale `isRunning` snapshot. A failed or uncertain request can be retried with the same `turnId`; it cannot create a second turn.

Queue activation is also atomic. It removes one queue row, creates its exact user/assistant pair, installs `activeTurn`, and schedules dispatch while preserving the original identity and settings snapshot.

## Callback validation

All exact-turn callback paths use the shared identity matcher in `packages/backend/convex/_chat/turnIdentity.ts`.

For an identity-enabled entity:

- an exact tuple is accepted;
- a partial tuple is rejected;
- a missing tuple is rejected;
- an older turn or attempt is rejected;
- a different assistant row is rejected.

A rejected callback makes no chat-state change and emits a structured `chat.stale_callback_ignored` event containing the event kind and expected/received tuple. Expected late events after cancel or retry are counted without being treated as successful work.

Finalization updates the accepted assistant row directly. Streaming clear is conditional on the same tuple. Pending questions are addressed by question document ID and also validate their stored tuple. Screenshots and other media attach only to the exact assistant row.

## Completion, cancellation, and recovery

Exact completion performs these operations against the same tuple:

1. Reconcile the last stream before completion.
2. Persist the final answer and activity on `assistantMessageId`.
3. Clear only matching streaming and unanswered pending-question state.
4. Release `activeTurn` only if it still matches.
5. Atomically activate the next queued turn when present.

Cancellation marks or interrupts only the current tuple. A late completion from the cancelled provider cannot release or overwrite a subsequent turn.

Watchdogs receive the tuple they were scheduled for. If the entity has moved on, the watchdog is stale and exits without changing state. Recovery may restage an accepted turn only when durable ownership still matches; it must not replay a prompt after provider acceptance is ambiguous.

Synthetic continuation turns use the same tuple. They create a real assistant row, install `activeTurn`, and complete through exact synthetic callbacks rather than bypassing chat ownership.

## Frontend projection

The web app renders a pure, single-pass timeline from paginated messages, exact live state, and local optimistic rows.

- Logical `turnId` keys survive optimistic-to-canonical reconciliation.
- Live stream and question state bind to the matching active assistant row, never to the last assistant row.
- Recent history loads first; older pages prepend while preserving the visible anchor.
- Media resolution is limited to loaded pages.
- Virtualization keeps mounted row count bounded and follows streaming only when the user is already at the bottom.
- Inactive session routes do not keep message, queue, stream, or question subscriptions alive.

The model composer consumes normalized provider capability descriptors. Provider-specific discovery remains behind that contract rather than leaking ACP option identifiers throughout the UI.

## Invariants for future changes

- Never reintroduce split `addMessage` then `startExecute` submission.
- Never mutate the latest message as a proxy for the active turn.
- Never create fake Convex IDs for optimistic rows.
- Never accept an incomplete v2 callback tuple.
- Never clear streaming, questions, or active state unconditionally.
- Never automatically execute the same accepted prompt through a fallback provider or transport.
- Keep all three chat surfaces in the shared lifecycle and timeline contract tests.

## Diagnostics

When a reply looks mismatched, search logs for:

```text
chat.stale_callback_ignored
```

Compare `expectedTurnId`, `expectedAssistantMessageId`, and `expectedAttempt` with the received tuple. Then inspect the entity's `activeTurn`, the matching assistant message, queued rows with the same `turnId`, its streaming row, and unanswered pending questions. A valid state has at most one active tuple and every live artifact belongs to it.

Do not repair a mismatch by copying data into the latest row. Either let exact recovery restage the still-owned turn or terminate the orphan and ask the user to retry with a new `turnId`.
