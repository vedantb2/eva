import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const backendDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const surfaces: [string, string][] = [
  ["callback source", read("callback-src/providers/claudeSdkDaemon.ts")],
  ["deployed bundle", read("convex/_sandbox_runtime/callbackScript.generated.ts")],
];

describe("a callback refresh cannot abandon a claimed Claude turn", () => {
  test.each(surfaces)("active work defers respawn (%s)", (_label, source) => {
    const watcher = claimWatcher(source);
    const pendingAt = watcher.indexOf("supervisor.decideRefresh({");
    const activeAt = watcher.indexOf(
      'if (refreshDecision.action === "defer")',
      pendingAt,
    );
    const continueAt = watcher.indexOf("continue;", activeAt);
    const exitAt = watcher.indexOf("supervisor.stop()", continueAt);

    expect(pendingAt).toBeGreaterThan(-1);
    expect(activeAt).toBeGreaterThan(pendingAt);
    expect(watcher).toContain("supervisor.parkClaim(turn)");
    expect(watcher).toContain("supervisor.hasWork");
    expect(continueAt).toBeGreaterThan(activeAt);
    expect(exitAt).toBeGreaterThan(continueAt);
  });

  test.each(surfaces)(
    "no new turn is claimed after refresh becomes pending (%s)",
    (_label, source) => {
      const watcher = claimWatcher(source);
      const refreshAt = watcher.indexOf("supervisor.decideRefresh({");
      const claimAt = watcher.indexOf('CLAIM_MUTATION ?? ""', refreshAt);
      const continueAt = watcher.indexOf("continue;", refreshAt);
      expect(continueAt).toBeLessThan(claimAt);
    },
  );
});

function claimWatcher(source: string): string {
  const start = source.indexOf("function startClaimWatcher(");
  const end = source.indexOf("async function runDaemonMessagePump", start);
  expect(start).toBeGreaterThan(-1);
  expect(end).toBeGreaterThan(start);
  return source.slice(start, end);
}

function read(relativePath: string): string {
  return readFileSync(join(backendDir, relativePath), "utf8")
    .replaceAll("\r\n", "\n")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^[^\S\n]*\/\/.*$/gm, "");
}
