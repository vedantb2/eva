import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const backendDir = join(dirname(fileURLToPath(import.meta.url)), "..");

const oneShotSource = readSource("callback-src/index.ts");
const completionSource = readSource("callback-src/runtime/completion.ts");
const bundledScript = readSource(
  "convex/_sandbox_runtime/callbackScript.generated.ts",
);

/**
 * A one-shot agent (cursor/codex/opencode) that is killed by a signal — SIGTERM
 * (143) from a cancel, a sandbox stop/timeout, or a prior turn's `pkill`, or
 * SIGKILL (137) from the OOM killer — exits with a code above 128. For cursor,
 * `extractResultEvent` still fabricates a non-error result from the last
 * streamed assistant text, so an interrupted "recording all features now…"
 * preamble was reported as a SUCCESSFUL completion with that preamble as its
 * final answer. The completion flag must reject any signal death, and the
 * result-success helper must not treat a fabricated result as a real one.
 */
describe("a signal-killed one-shot turn is never reported as success", () => {
  test.each([
    ["callback source", oneShotSource],
    ["deployed bundle", bundledScript],
  ])("signal death defeats the fabricated result (%s)", (_label, source) => {
    const defineAt = source.indexOf("const killedBySignal = finalCode > 128");
    expect(defineAt, "killedBySignal moved or was renamed").toBeGreaterThan(-1);

    // runSucceededWithResult must AND in `!killedBySignal` so a fabricated
    // cursor result cannot mark an interrupted turn as having succeeded.
    const succeededAt = source.indexOf("runSucceededWithResult =");
    expect(succeededAt, "runSucceededWithResult moved").toBeGreaterThan(-1);
    const succeededLine = source.slice(
      succeededAt,
      source.indexOf(";", succeededAt),
    );
    expect(succeededLine).toContain("!killedBySignal");

    // completionSuccess must short-circuit to false on a signal death, ahead of
    // the result-event / exit-code fallbacks.
    const completionAt = source.indexOf("completionSuccess =");
    expect(completionAt, "completionSuccess moved").toBeGreaterThan(-1);
    const completionExpr = source.slice(
      completionAt,
      source.indexOf(";", completionAt),
    );
    const killAt = completionExpr.indexOf("killedBySignal");
    const resultAt = completionExpr.indexOf("finalResultEvent");
    expect(
      killAt,
      "completionSuccess no longer checks killedBySignal",
    ).toBeGreaterThan(-1);
    expect(
      resultAt,
      "completionSuccess no longer falls back to the result event",
    ).toBeGreaterThan(-1);
    expect(killAt).toBeLessThan(resultAt);

    // killedBySignal has to exist before both consumers read it.
    expect(defineAt).toBeLessThan(succeededAt);
    expect(defineAt).toBeLessThan(completionAt);
  });

  test.each([
    ["callback source", completionSource],
    ["deployed bundle", bundledScript],
  ])(
    "a bare signal kill reports as an interruption, not a raw code (%s)",
    (_label, source) => {
      // The signal branch sits AFTER every timeout branch (a timeout that ends in
      // SIGTERM keeps its specific message) and BEFORE the raw "exited with code"
      // fallback, so only an unexplained signal death gets the interrupted copy.
      const timeoutAt = source.indexOf("timedOutForNoOutput");
      const signalAt = source.indexOf("code === 137 || code === 143");
      const rawExitAt = source.indexOf('" exited with code "');
      expect(timeoutAt, "the no-output timeout branch moved").toBeGreaterThan(
        -1,
      );
      expect(
        signalAt,
        "the signal-kill branch moved or was renamed",
      ).toBeGreaterThan(-1);
      expect(rawExitAt, "the raw exit-code fallback moved").toBeGreaterThan(-1);
      expect(timeoutAt).toBeLessThan(signalAt);
      expect(signalAt).toBeLessThan(rawExitAt);
    },
  );
});

function readSource(relativePath: string): string {
  return stripComments(
    readFileSync(join(backendDir, relativePath), "utf8").replaceAll(
      "\r\n",
      "\n",
    ),
  );
}

function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^[^\S\n]*\/\/.*$/gm, "");
}
