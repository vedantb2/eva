<<<<<<< HEAD
import { v } from "convex/values";
import { Duration, Effect } from "effect";
=======
"use node";

import { v, type Infer } from "convex/values";
>>>>>>> origin/main
import { api, internal } from "./_generated/api";
import { runPromiseRethrowing } from "./_effect/retry";
import type { ActionCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { authAction, getActionRepoWithAccess } from "./functions";
import {
  PROVIDER_PRIMARY_AUTH_KEY,
  usageLimitProviderValidator,
} from "./validators";
import { decryptValue } from "./encryption";
import { resolveAllEnvVars } from "./envVarResolver";
import https from "node:https";
import {
  claudeUsageBodyFromUnifiedHeaders,
  hasPlanRateLimits,
  readClaudeUsageWindows,
  type ClaudeUsageBody,
  type UsageWindow,
} from "./_usageLimits/claudeUsage";

/**
 * Pulling a plan-usage reading on demand, rather than waiting for the next turn
 * to report one. The card's refresh button calls this; everything else about
 * the feature still arrives from the sandbox.
 *
 * One path: a 1-token Messages call, read for its
 * `anthropic-ratelimit-unified-*` headers. `GET /api/oauth/usage` is gone — it
 * needs `user:profile`, and over 24–27 Aug it answered 403 to every credential
 * Eva actually stores (all setup-tokens, `sk-ant-oat…`, `user:inference` only)
 * while the probe returned two windows on the same token. Trying it first only
 * bought a wasted request and a misleading "rejected" toast.
 *
 * Those headers name the 5h, weekly-all and Fable weekly windows and nothing
 * else, so a reading is stored as a partial merge: replacing the row would wipe
 * the Opus/Sonnet weeklies a real turn captured.
 *
 * The request goes through `https.request` so User-Agent actually leaves the
 * process — fetch in some runtimes strips it, and Anthropic then 429s.
 *
 * The reading is always taken with the credential the caller's surface is
 * scoped to — a connected account, or the shared team credential — and never
 * falls back from one to the other, because the whole point of the row is
 * whose plan it measures.
 */

const CLAUDE_MESSAGES_URL = "https://api.anthropic.com/v1/messages";
const USAGE_TIMEOUT_MS = 8_000;
/**
 * The OAuth beta a Bearer setup-token needs to be accepted on `/v1/messages`
 * at all — without it the token is not a credential Anthropic recognises.
 */
const CLAUDE_USAGE_BETA = "oauth-2025-04-20";
const CLAUDE_API_VERSION = "2023-06-01";
/**
 * Anthropic rate-limits by User-Agent. Node/undici's default (and a missing UA)
 * land in a bucket that 429s immediately; Claude Code's identifier is the one it
 * actually serves. Sent via `https.request` so a fetch runtime cannot strip it
 * as a forbidden header.
 */
const CLAUDE_USAGE_USER_AGENT = "claude-code/2.1.72";
/**
 * Cheapest current Haiku id, then a versionless alias. The probe is a 1-token
 * Messages call; model ids rot, so a 404 tries the next rather than failing
 * the refresh.
 */
const USAGE_PROBE_MODELS = [
  "claude-haiku-4-5-20251001",
  "claude-haiku-4-5",
] as const;

type UsageProvider = Infer<typeof usageLimitProviderValidator>;

/** Why a refresh produced nothing, in the vocabulary the toast copy speaks. */
type RefreshFailure =
  | "no-token"
  | "unauthorized"
  | "network"
  | "unavailable"
  | "rate-limited";

type TokenLookup = { kind: "token"; token: string } | { kind: "missing" };

type UsageFetch =
  | { kind: "body"; body: ClaudeUsageBody }
  | { kind: "unauthorized" }
  | { kind: "network" }
  | { kind: "rate-limited" };

/**
 * The token for the account the refresh is scoped to. Throws when the account
 * is not one the caller may run on — a refresh on somebody else's credential is
 * not a degraded case to fall back from, it is a request that should not have
 * been made.
 */
async function accountToken(
  ctx: ActionCtx,
  accountId: Id<"userProviderAccounts">,
  provider: UsageProvider,
  userId: Id<"users">,
): Promise<TokenLookup> {
  const account = await ctx.runQuery(
    internal.userProviderAccounts.getForLaunchInternal,
    { accountId, ownerUserId: userId },
  );
  if (account === null || account.provider !== provider) {
    throw new Error("Provider account not found");
  }
  const entry = account.credentials.find(
    (credential) => credential.key === PROVIDER_PRIMARY_AUTH_KEY[provider],
  );
  if (entry === undefined) return { kind: "missing" };
  return { kind: "token", token: decryptValue(entry.value) };
}

/** The shared team credential, from the same env vars a launch would inject. */
async function teamToken(
  ctx: ActionCtx,
  repoId: Id<"githubRepos">,
  provider: UsageProvider,
): Promise<TokenLookup> {
  const envVars = await resolveAllEnvVars(ctx, repoId);
  const token = envVars[PROVIDER_PRIMARY_AUTH_KEY[provider]];
  if (token === undefined || token.length === 0) return { kind: "missing" };
  return { kind: "token", token };
}

type HttpResult = {
  status: number;
  header: (name: string) => string | undefined;
};

<<<<<<< HEAD
function targetArgs(args: RefreshTargetArgs): RefreshTargetArgs {
  return {
    ...(args.sessionId === undefined ? {} : { sessionId: args.sessionId }),
    ...(args.projectId === undefined ? {} : { projectId: args.projectId }),
    ...(args.taskId === undefined ? {} : { taskId: args.taskId }),
  };
=======
/**
 * TLS POST that actually sends `User-Agent`. Convex/undici `fetch` can drop it
 * as a forbidden header, which is how Anthropic 429s a perfectly valid token.
 *
 * The response body is drained but not returned: the reading is entirely in the
 * headers, and the probe asks for one token of text nobody reads.
 */
function postHttps(input: {
  url: string;
  headers: Record<string, string>;
  body: string;
}): Promise<HttpResult | null> {
  return new Promise((resolve) => {
    const url = new URL(input.url);
    const req = https.request(
      {
        protocol: "https:",
        hostname: url.hostname,
        path: `${url.pathname}${url.search}`,
        method: "POST",
        headers: input.headers,
      },
      (res) => {
        res.resume();
        res.on("end", () => {
          resolve({
            status: res.statusCode ?? 0,
            header: (name) => readNodeHeader(res.headers[name.toLowerCase()]),
          });
        });
      },
    );
    req.on("error", (error: Error) => {
      console.warn("[usageLimits] Claude usage request failed", error.message);
      resolve(null);
    });
    req.setTimeout(USAGE_TIMEOUT_MS, () => {
      req.destroy();
      console.warn("[usageLimits] Claude usage request failed", "timeout");
      resolve(null);
    });
    req.write(input.body);
    req.end();
  });
}

/** A repeated header arrives as an array; only its first value is a reading. */
function readNodeHeader(
  value: string | string[] | undefined,
): string | undefined {
  if (value === undefined) return undefined;
  if (Array.isArray(value)) {
    const first = value[0];
    return first === undefined || first.length === 0 ? undefined : first;
  }
  return value.length === 0 ? undefined : value;
>>>>>>> origin/main
}

function credentialKind(token: string): string {
  if (token.startsWith("sk-ant-oat")) return "oat";
  if (token.startsWith("sk-ant-api")) return "api-key";
  if (token.startsWith("sk-ant-sid")) return "session";
  return "other";
}

function httpOk(status: number): boolean {
  return status >= 200 && status < 300;
}

/**
 * The OAuth beta and the UA Anthropic serves. A Bearer setup-token on
 * `/v1/messages` needs both: without the beta it is not a recognised
 * credential, and without the UA the request lands in a bucket that 429s.
 */
function usageHeaders(): Record<string, string> {
  return {
    "anthropic-beta": CLAUDE_USAGE_BETA,
    "User-Agent": CLAUDE_USAGE_USER_AGENT,
  };
}

/**
 * The reading: a 1-token Messages call, kept for its response headers. This is
 * the only scope Eva's stored credential has, so it is the only path — see the
 * module comment on why `/api/oauth/usage` is not tried first.
 */
async function requestInferenceUsage(token: string): Promise<UsageFetch> {
  for (const model of USAGE_PROBE_MODELS) {
    const body = JSON.stringify({
      model,
      max_tokens: 1,
      messages: [{ role: "user", content: "." }],
    });
    const response = await postHttps({
      url: CLAUDE_MESSAGES_URL,
      headers: {
        ...usageHeaders(),
        Authorization: `Bearer ${token}`,
        "anthropic-version": CLAUDE_API_VERSION,
        "Content-Type": "application/json",
        "Content-Length": String(Buffer.byteLength(body)),
      },
      body,
    });
    if (response === null) return { kind: "network" };
    if (response.status === 404) continue;
    if (response.status === 401 || response.status === 403) {
      console.warn(
        `[usageLimits] messages probe ${response.status} cred=${credentialKind(token)} model=${model}`,
      );
      return { kind: "unauthorized" };
    }
    if (response.status === 429) {
      console.warn("[usageLimits] messages probe returned 429");
      return { kind: "rate-limited" };
    }
    if (!httpOk(response.status)) {
      console.warn(
        `[usageLimits] messages probe returned ${response.status} model=${model}`,
      );
      return { kind: "network" };
    }
    const parsed = claudeUsageBodyFromUnifiedHeaders(response.header);
    if (parsed === null) {
      console.warn(
        `[usageLimits] messages probe 200 had no unified rate-limit headers model=${model}`,
      );
      return { kind: "network" };
    }
    console.warn(
      `[usageLimits] messages probe 200 cred=${credentialKind(token)} windows=${readClaudeUsageWindows(parsed).length}`,
    );
    return { kind: "body", body: parsed };
  }
  console.warn("[usageLimits] messages probe: no current Haiku model id");
  return { kind: "network" };
}

/**
 * Reads the provider's plan usage now, so a card opened long after the last turn
 * can be brought up to date without running one.
 *
 * The reading is always a merge, never a replacing snapshot: the probe's headers
 * name 5h, weekly-all and Fable and nothing else, so replacing would delete the
 * Opus/Sonnet weeklies a real turn captured.
 *
 * No status is reported: the probe returns numbers, not a verdict on whether the
 * plan would accept work.
 */
export const refresh = authAction({
  args: {
    repoId: v.id("githubRepos"),
    provider: usageLimitProviderValidator,
    providerAccountId: v.optional(v.id("userProviderAccounts")),
    // Older chip clients still send a sandbox target; refresh is Convex HTTP
    // now and does not need one, so these are accepted and ignored.
    sessionId: v.optional(v.id("sessions")),
    projectId: v.optional(v.id("projects")),
    taskId: v.optional(v.id("agentTasks")),
  },
  returns: v.object({ ok: v.boolean(), reason: v.optional(v.string()) }),
  handler: async (
    ctx,
    args,
  ): Promise<{ ok: boolean; reason?: RefreshFailure }> => {
    void args.sessionId;
    void args.projectId;
    void args.taskId;
    await getActionRepoWithAccess(ctx, args.repoId);
    const accountId = args.providerAccountId;
    // A refresh is not a launch: the account's `lastUsedAt` stays where the
    // last real turn left it.
    const lookup =
      accountId === undefined
        ? await teamToken(ctx, args.repoId, args.provider)
        : await accountToken(ctx, accountId, args.provider, ctx.userId);
    if (lookup.kind === "missing") return { ok: false, reason: "no-token" };

    const result = await requestInferenceUsage(lookup.token);
    if (result.kind === "unauthorized") {
      return { ok: false, reason: "unauthorized" };
    }
    if (result.kind === "rate-limited") {
      return { ok: false, reason: "rate-limited" };
    }
    if (result.kind === "network") return { ok: false, reason: "network" };
    // Headers that named no window at all are not a reading, so nothing is
    // written — a stored row keeps the numbers a real turn reported.
    if (!hasPlanRateLimits(result.body)) {
      return { ok: false, reason: "unavailable" };
    }

    const windows: UsageWindow[] = readClaudeUsageWindows(result.body);
    const accountArg =
      accountId === undefined ? {} : { providerAccountId: accountId };
    // The probe never names the plan, so the stored plan name is carried forward
    // rather than dropped.
    const stored = await ctx.runQuery(internal.usageLimits.getReadingInternal, {
      repoId: args.repoId,
      provider: args.provider,
      ...accountArg,
    });
    const subscriptionType = stored?.subscriptionType;
    // Partial, always: the probe sees three windows, so `snapshotComplete` here
    // would wipe the Opus/Sonnet weeklies a real turn captured.
    await ctx.runMutation(api.usageLimits.report, {
      repoId: args.repoId,
      provider: args.provider,
      ...accountArg,
      capturedAt: Date.now(),
      completeness: "partial",
      windows,
      ...(subscriptionType === undefined ? {} : { subscriptionType }),
    });
<<<<<<< HEAD
    if (!requested) return { ok: false, reason: "sandbox-idle" };

    try {
      // May upload a stale callback and respawn. The flag is already set and
      // survives claim polls, so the replacement daemon still sees it.
      await prewarmSurface(ctx, surfaceArgs);

      const pollOnce = Effect.zipRight(
        Effect.sleep(Duration.millis(POLL_INTERVAL_MS)),
        Effect.promise(async () => {
          const reading = await ctx.runQuery(
            internal.usageLimits.getReadingInternal,
            {
              repoId: args.repoId,
              provider: args.provider,
              ...accountArg,
            },
          );
          return reading !== null && reading.capturedAt > beforeCapturedAt;
        }),
      );
      const reported = await runPromiseRethrowing(
        pollOnce.pipe(
          Effect.repeat({
            times: POLL_ATTEMPTS - 1,
            until: (fresh) => fresh,
          }),
        ),
      );
      return reported ? { ok: true } : { ok: false, reason: "unavailable" };
    } finally {
      await ctx.runMutation(api.usageLimits.clearRefresh, surfaceArgs);
    }
=======
    return { ok: true };
>>>>>>> origin/main
  },
});
