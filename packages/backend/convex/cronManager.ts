import { Crons } from "@convex-dev/crons";
import type { FunctionArgs, SchedulableFunctionReference } from "convex/server";
import { components } from "./_generated/api";
import type { MutationCtx } from "./_generated/server";

/** Shared crons component client. */
export const crons = new Crons(components.crons);

/** Deletes the named cron if a tracked id is present, swallowing errors. */
export async function safeDeleteCron(
  ctx: MutationCtx,
  name: string,
  existingCronJobId: string | undefined,
): Promise<void> {
  if (!existingCronJobId) return;
  try {
    await crons.delete(ctx, { name });
  } catch {
    // Cron may already be deleted
  }
}

/** Deletes the named cron if present and registers a new one when cronspec is non-null. */
export async function safeReplaceCron<F extends SchedulableFunctionReference>(
  ctx: MutationCtx,
  params: {
    name: string;
    existingCronJobId: string | undefined;
    cronspec: string | null;
    handler: F;
    args: FunctionArgs<F>;
  },
): Promise<string | undefined> {
  await safeDeleteCron(ctx, params.name, params.existingCronJobId);
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
