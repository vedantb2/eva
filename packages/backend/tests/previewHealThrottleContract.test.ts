import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const backendDir = join(dirname(fileURLToPath(import.meta.url)), "..");

const sandboxExecution = readSource("convex/_sandbox_runtime/execution.ts");
const sandboxHeal = readSource("convex/sandboxHeal.ts");

/**
 * The preview readiness poll fires every ~2s per open page and used to run
 * the background-daemon heal (several sandbox execs + log lines) on every
 * tick, flooding prod logs. The heal is now claimed through a per-sandbox
 * rate-limit slot. It must stay a rate limit — not a probe-failure gate —
 * because the app port can serve while a background daemon (local convex,
 * supabase) is dead, which is exactly the case the heal exists for.
 */
describe("the preview heal is rate-limited per sandbox", () => {
  test("the heal runs only after winning the claim", () => {
    const body = definitionBody(sandboxExecution, "getPreviewUrl");
    const stateGuardAt = body.indexOf('handle.state !== "running"');
    const claimAt = body.indexOf("internal.sandboxHeal.claim");
    const healAt = body.indexOf("internal.sandbox.runBackgroundCommands");
    expect(stateGuardAt, "the non-running guard moved").toBeGreaterThan(-1);
    expect(claimAt, "the heal claim moved").toBeGreaterThan(-1);
    expect(healAt, "the heal call moved").toBeGreaterThan(-1);
    // Never exec (or claim) on a stopped sandbox — on Vercel any exec resumes
    // a stopped VM (see prewarmNeverResurrects contract).
    expect(stateGuardAt).toBeLessThan(claimAt);
    expect(claimAt).toBeLessThan(healAt);
    expect(body).toContain("if (healClaimed)");
  });

  test("the claim is an interval check, not a readiness gate", () => {
    const body = definitionBody(sandboxHeal, "claim");
    expect(body).toContain("BG_HEAL_MIN_INTERVAL_MS");
    expect(body).not.toContain("ready");
    const interval = sandboxHeal.match(/BG_HEAL_MIN_INTERVAL_MS = ([\d_]+)/);
    expect(interval, "the interval constant moved").not.toBeNull();
    const ms = Number((interval?.[1] ?? "0").replaceAll("_", ""));
    // The point is fewer execs without letting dead daemons linger: keep the
    // interval in the 30-60s band.
    expect(ms).toBeGreaterThanOrEqual(30_000);
    expect(ms).toBeLessThanOrEqual(60_000);
  });
});

/** Comments name the very calls these rules rule out, so they have to go first. */
function readSource(relativePath: string): string {
  return stripComments(
    readFileSync(join(backendDir, relativePath), "utf8").replaceAll(
      "\r\n",
      "\n",
    ),
  );
}

/** One Convex definition, ending on the `\n});` that closes it. */
function definitionBody(source: string, name: string): string {
  const startAt = source.indexOf(`export const ${name} =`);
  expect(startAt, `${name} moved or was renamed`).toBeGreaterThan(-1);
  const end = source.indexOf("\n});", startAt);
  return source.slice(startAt, end < 0 ? undefined : end);
}

function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^[^\S\n]*\/\/.*$/gm, "");
}
