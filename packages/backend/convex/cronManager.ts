import { Crons } from "@convex-dev/crons";
import type { FunctionArgs, SchedulableFunctionReference } from "convex/server";
import { components } from "./_generated/api";
import type { MutationCtx } from "./_generated/server";

/** Shared crons component client. */
export const crons = new Crons(components.crons);

/**
 * Deletes the named cron if one currently exists in the crons component.
 *
 * Existence is checked by name against the component, not against any id we
 * track in our own tables. This keeps the operation idempotent and self-healing:
 * even if our stored cronJobId has drifted out of sync (e.g. it was cleared on
 * disable while the component row survived), we still remove whatever cron holds
 * the name — which is what prevents a later re-register from colliding.
 */
export async function safeDeleteCron(
  ctx: MutationCtx,
  name: string,
): Promise<void> {
  const existing = await crons.get(ctx, { name });
  if (existing) {
    await crons.delete(ctx, { name });
  }
}

/** Deletes the named cron if present and registers a new one when cronspec is non-null. */
export async function safeReplaceCron<F extends SchedulableFunctionReference>(
  ctx: MutationCtx,
  params: {
    name: string;
    cronspec: string | null;
    handler: F;
    args: FunctionArgs<F>;
  },
): Promise<string | undefined> {
  await safeDeleteCron(ctx, params.name);
  if (!params.cronspec) return undefined;
  const id = await crons.register(
    ctx,
    { kind: "cron", cronspec: params.cronspec },
    params.handler,
    params.args,
    params.name,
  );
  return String(id);
}
