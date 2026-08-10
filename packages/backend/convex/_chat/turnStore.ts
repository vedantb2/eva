import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { internal } from "../_generated/api";
import { turnPhaseFromActivity } from "../_taskWorkflow/staleness";
import {
  canTransitionTurn,
  isPastRunTimeout,
  isTerminalTurnState,
  type LeaseVerdict,
  leaseDurationMs,
  leaseExpiryFor,
  type TerminalTurnState,
  type TurnState,
} from "./turnLease";

/** The chat surfaces that own turn rows — mirrors `ChatSurfaceAdapter.kind`. */
export type TurnSurface =
  | "session"
  | "taskChat"
  | "projectChat"
  | "summary";

export type CompletionTurnResolution =
  | { status: "current"; turn: Doc<"turns"> }
  | { status: "legacy" }
  | { status: "stale" };

/**
 * Every write to the `turns` table lives here. Turn rows are the only thing
 * that means "a turn is running", so keeping the writes in one module is what
 * stops the old four-way truth smear growing back one call site at a time.
 */

/** The entity's open turn, if any. At most one exists (enforced by openTurn). */
export async function findOpenTurn(
  ctx: QueryCtx,
  surface: TurnSurface,
  entityId: string,
): Promise<Doc<"turns"> | null> {
  return await ctx.db
    .query("turns")
    .withIndex("by_entity_open", (q) =>
      q.eq("surface", surface).eq("entityId", entityId).eq("open", true),
    )
    .first();
}

/**
 * Resolves the exact turn allowed to report completion.
 *
 * New callbacks always present a turn id. A callback from a deployment that
 * predates turn leases may omit it, but is accepted only when no open row
 * exists; once a newer turn has been staged, an unfenced legacy callback can
 * no longer mutate the entity.
 */
export async function resolveCompletionTurn(
  ctx: MutationCtx,
  params: {
    surface: TurnSurface;
    entityId: string;
    turnId?: string;
    placeholderMessageId?: Id<"messages">;
  },
): Promise<CompletionTurnResolution> {
  const current = await findOpenTurn(ctx, params.surface, params.entityId);
  if (params.turnId === undefined) {
    return current ? { status: "stale" } : { status: "legacy" };
  }

  const id = ctx.db.normalizeId("turns", params.turnId);
  if (!id) return { status: "stale" };
  const turn = await ctx.db.get(id);
  if (
    !turn ||
    !turn.open ||
    turn.surface !== params.surface ||
    turn.entityId !== params.entityId ||
    !current ||
    current._id !== turn._id ||
    (params.placeholderMessageId !== undefined &&
      turn.placeholderMessageId !== params.placeholderMessageId)
  ) {
    return { status: "stale" };
  }
  return { status: "current", turn };
}

/**
 * Every entity id with an open turn on this surface.
 *
 * Reads the whole open set (one row per in-flight turn across the deployment —
 * a handful at any moment) instead of a per-row lookup, so list views answer
 * "is this one working?" without N+1 queries.
 */
export async function listOpenTurnEntityIds(
  ctx: QueryCtx,
  surface: TurnSurface,
): Promise<Set<string>> {
  const open = await ctx.db
    .query("turns")
    .withIndex("by_open_lease", (q) => q.eq("open", true))
    .collect();
  return new Set(
    open.filter((turn) => turn.surface === surface).map((t) => t.entityId),
  );
}

/**
 * Stages a new turn, superseding whatever the entity had open. Superseding
 * rather than refusing is deliberate: staging is already the point where the
 * surfaces overwrite `activeWorkflowId`, so a leftover row from a turn whose
 * owner vanished must not block the user's next message. Mutation atomicity
 * makes the read-then-insert race-free, the same guarantee `activeWorkflowId`
 * relies on today.
 */
export async function openTurn(
  ctx: MutationCtx,
  params: {
    surface: TurnSurface;
    entityId: string;
    streamingEntityId: string;
    model: string;
    workflowId?: string;
    placeholderMessageId?: Id<"messages">;
    sandboxId?: string;
    repoId?: Id<"githubRepos">;
  },
): Promise<Id<"turns">> {
  const now = Date.now();
  const previous = await findOpenTurn(ctx, params.surface, params.entityId);
  if (previous) {
    await ctx.db.patch(previous._id, {
      state: "cancelled",
      open: false,
      finishedAt: now,
      error: "Superseded by a newer turn",
    });
  }
  return await ctx.db.insert("turns", {
    surface: params.surface,
    entityId: params.entityId,
    streamingEntityId: params.streamingEntityId,
    state: "staged",
    open: true,
    turnStartedAt: now,
    leaseExpiresAt: leaseExpiryFor({
      state: "staged",
      turnStartedAt: now,
      now,
    }),
    model: params.model,
    workflowId: params.workflowId,
    placeholderMessageId: params.placeholderMessageId,
    sandboxId: params.sandboxId,
    repoId: params.repoId,
  });
}

/**
 * Advances an open turn and re-grants its lease. Illegal transitions (a late
 * message from a superseded actor trying to drag a running turn backwards) are
 * ignored rather than thrown, so a stray callback can never fail a mutation
 * that has real work after it.
 */
export async function advanceTurn(
  ctx: MutationCtx,
  turn: Doc<"turns">,
  next: Exclude<TurnState, TerminalTurnState>,
  opts: { workflowId?: string; sandboxId?: string } = {},
): Promise<void> {
  if (!turn.open || !canTransitionTurn(turn.state, next)) return;
  const now = Date.now();
  await ctx.db.patch(turn._id, {
    state: next,
    leaseExpiresAt: leaseExpiryFor({
      state: next,
      turnStartedAt: turn.turnStartedAt,
      now,
    }),
    ...(opts.workflowId !== undefined ? { workflowId: opts.workflowId } : {}),
    ...(opts.sandboxId !== undefined ? { sandboxId: opts.sandboxId } : {}),
  });
}

/**
 * Advances the entity's open turn, if it has one. Used by call sites that hold
 * an entity id rather than a turn id (workflow steps, completion mutations).
 */
export async function advanceOpenTurn(
  ctx: MutationCtx,
  surface: TurnSurface,
  entityId: string,
  next: Exclude<TurnState, TerminalTurnState>,
  opts: { workflowId?: string; sandboxId?: string } = {},
): Promise<void> {
  const turn = await findOpenTurn(ctx, surface, entityId);
  if (turn) await advanceTurn(ctx, turn, next, opts);
}

/**
 * Closes the entity's open turn. Idempotent — every teardown path calls this,
 * and the one that gets there first wins. This is what makes the design
 * crash-only: no path has to be the *only* path.
 */
export async function closeOpenTurn(
  ctx: MutationCtx,
  surface: TurnSurface,
  entityId: string,
  state: TerminalTurnState,
  opts: { error?: string } = {},
): Promise<void> {
  const turn = await findOpenTurn(ctx, surface, entityId);
  if (!turn) return;
  await closeTurn(ctx, turn, state, opts);
}

/** Closes one specific turn row. */
export async function closeTurn(
  ctx: MutationCtx,
  turn: Doc<"turns">,
  state: TerminalTurnState,
  opts: { error?: string } = {},
): Promise<void> {
  if (!turn.open) return;
  await ctx.db.patch(turn._id, {
    state,
    open: false,
    finishedAt: Date.now(),
    ...(opts.error !== undefined ? { error: opts.error } : {}),
  });
}

/**
 * The renewal handler (I2). Only an actor presenting the current `turnId` can
 * push the lease out; everyone else is told `terminal` and is expected to stop
 * immediately. That single rule retires the zombie-runner class: a process
 * from a previous turn cannot renew, cannot reset anyone's staleness clock,
 * and learns it is obsolete on its very next heartbeat.
 */
export async function renewTurnLease(
  ctx: MutationCtx,
  turnId: string,
  opts: { currentActivity?: string; streamingEntityId?: string } = {},
): Promise<LeaseVerdict> {
  const id = ctx.db.normalizeId("turns", turnId);
  if (!id) return { status: "terminal", reason: "unknown_turn" };
  const turn = await ctx.db.get(id);
  if (!turn) return { status: "terminal", reason: "unknown_turn" };
  // The heartbeat HMAC signs the streaming entity id, not the turn id, so bind
  // the two here: a sandbox may only renew turns belonging to the entity it
  // holds a signature for.
  if (
    opts.streamingEntityId !== undefined &&
    opts.streamingEntityId !== turn.streamingEntityId
  ) {
    return { status: "terminal", reason: "unknown_turn" };
  }
  if (!turn.open || isTerminalTurnState(turn.state)) {
    return { status: "terminal", reason: "closed" };
  }

  const now = Date.now();
  // I4: no chain of renewals may carry a turn past the 2-hour ceiling. This
  // subsumes the per-surface handleStaleX backstops.
  if (isPastRunTimeout(turn.turnStartedAt, now)) {
    await closeTurn(ctx, turn, "error", {
      error: "Turn exceeded the 2-hour limit",
    });
    return { status: "terminal", reason: "timeout" };
  }
  if (turn.cancelRequestedAt !== undefined) {
    return { status: "terminal", reason: "cancelled" };
  }
  // Belt and braces against a row that stayed `open` while a newer turn was
  // staged — the newer row is the entity's truth.
  const current = await findOpenTurn(ctx, turn.surface, turn.entityId);
  if (!current || current._id !== turn._id) {
    return { status: "terminal", reason: "superseded" };
  }

  const activity =
    opts.currentActivity ??
    (
      await ctx.db
        .query("streamingActivity")
        .withIndex("by_entity", (q) =>
          q.eq("entityId", turn.streamingEntityId),
        )
        .first()
    )?.currentActivity;
  const phase = turnPhaseFromActivity({
    currentActivity: activity,
    turnStartedAt: turn.turnStartedAt,
    hasSandbox: turn.sandboxId !== undefined,
    now,
  });

  // A heartbeat that races with completion must preserve the finalizing state
  // and its longer push/save allowance instead of shortening it back to idle.
  const renewedState = turn.state === "finalizing" ? "finalizing" : "running";
  const durationMs = leaseDurationMs(renewedState, phase);
  const leaseExpiresAt = leaseExpiryFor({
    state: renewedState,
    phase,
    turnStartedAt: turn.turnStartedAt,
    now,
  });
  await ctx.db.patch(turn._id, {
    ...(renewedState === "running" && canTransitionTurn(turn.state, "running")
      ? { state: "running" }
      : {}),
    leaseExpiresAt,
  });

  // Keep the VM alive for exactly as long as the turn is alive. This used to
  // be a side effect of the watchdog chain, which meant a *dead* turn kept
  // extending its sandbox; hanging it off renewal ties it to a live owner.
  if (turn.sandboxId && turn.repoId) {
    await ctx.scheduler.runAfter(0, internal.sandbox.extendSandboxDeadline, {
      sandboxId: turn.sandboxId,
      repoId: turn.repoId,
      durationMs: durationMs * 2,
    });
  }

  return { status: "renewed", leaseExpiresAt, durationMs };
}
