import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const testsDir = dirname(fileURLToPath(import.meta.url));

/** Source with `//` comments stripped — the prose names the very identifiers
 * these tests assert are absent, so an assertion over the raw text would match
 * the comment instead of the code. */
const source = (path: string): string =>
  readFileSync(join(testsDir, path), "utf8")
    .replaceAll("\r\n", "\n")
    .replace(/^\s*\/\/.*$/gm, "");

const executionSource = readFileSync(
  join(testsDir, "../convex/_sessions/execution.ts"),
  "utf8",
).replaceAll("\r\n", "\n");

/**
 * `stageAndStartSessionTurn`'s body with `//` comments stripped — the prose
 * names the very identifiers these tests assert are absent, so an assertion
 * over the raw text would match the comment instead of the code.
 */
const stageBody = (() => {
  const startAt = executionSource.indexOf(
    "async function stageAndStartSessionTurn(",
  );
  expect(
    startAt,
    "stageAndStartSessionTurn moved or was renamed",
  ).toBeGreaterThan(-1);
  const nextAt = executionSource.indexOf("\nexport ", startAt + 1);
  return executionSource
    .slice(startAt, nextAt < 0 ? undefined : nextAt)
    .replace(/^\s*\/\/.*$/gm, "");
})();

/** The `{ … }` object literal that starts after `from`, brace-matched. */
function braceBlock(text: string, from: number): string {
  expect(from, "the anchor this block hangs off is gone").toBeGreaterThan(-1);
  const open = text.indexOf("{", from);
  expect(open, "no object literal follows the call").toBeGreaterThan(-1);
  let depth = 0;
  for (let i = open; i < text.length; i += 1) {
    if (text[i] === "{") depth += 1;
    else if (text[i] === "}") {
      depth -= 1;
      if (depth === 0) return text.slice(open, i + 1);
    }
  }
  throw new Error("unbalanced braces");
}

const RAW_TRAIT_ARGS: readonly string[] = [
  "params.reasoningLevel",
  "params.thinkingEnabled",
  "params.use1mContext",
  "params.fastMode",
];

/**
 * Session 166: the composer sends a model default explicitly (reasoning "high"
 * is Fable's default, and its display value), so forwarding `params.*` verbatim
 * gave this turn's prewarm and the workflow's prewarm a daemon opts sig of
 * `…|high|…` where the page-open prewarm — which normalises through
 * `launchTraitsFromStored` — had `…||…`. The second prewarm then logged
 * "model/tools changed" and kill+relaunched the daemon the first had just
 * booted: 65 respawns against 146 launches in 24h.
 *
 * The fix is one normalisation, before both launch call sites. It is invisible
 * at runtime, so pin it.
 */
describe("stageAndStartSessionTurn normalises launch traits once", () => {
  const normaliseAt = stageBody.indexOf("launchTraitsFromStored(");
  const prewarmAt = stageBody.indexOf("internal.sandbox.prewarmSessionDaemon");
  const workflowStartAt = stageBody.indexOf("workflow.start(");

  test("both launch call sites are still here", () => {
    expect(prewarmAt, "the turn prewarm scheduler call moved").toBeGreaterThan(
      -1,
    );
    expect(workflowStartAt, "the workflow start moved").toBeGreaterThan(-1);
    expect(
      stageBody.slice(workflowStartAt),
      "the workflow start must be sessionExecuteWorkflow",
    ).toContain("internal.sessionWorkflow.sessionExecuteWorkflow");
  });

  test("the traits are normalised before either call site", () => {
    expect(
      normaliseAt,
      "launchTraitsFromStored is the single helper every prewarm must agree on",
    ).toBeGreaterThan(-1);
    expect(normaliseAt).toBeLessThan(prewarmAt);
    expect(normaliseAt).toBeLessThan(workflowStartAt);
    expect(executionSource).toContain("launchTraitsFromStored");
  });

  test("neither call site forwards a raw composer trait", () => {
    const prewarmArgs = stageBody.slice(prewarmAt, workflowStartAt);
    const workflowArgs = stageBody.slice(workflowStartAt);
    for (const arg of RAW_TRAIT_ARGS) {
      expect(
        prewarmArgs,
        `${arg} reaches the turn prewarm unnormalised`,
      ).not.toContain(arg);
      expect(
        workflowArgs,
        `${arg} reaches the workflow, which forwards it to prewarmSessionDaemon`,
      ).not.toContain(arg);
    }
  });

  test("the normalised traits are what both call sites spread", () => {
    expect(stageBody.slice(prewarmAt, workflowStartAt)).toContain(
      "...launchTraits",
    );
    expect(stageBody.slice(workflowStartAt)).toContain("...launchTraits");
  });
});

/**
 * `stageAndStartSessionTurn` is not the only door into
 * `sessionExecuteWorkflow`, and the workflow forwards whatever traits it is
 * given straight back into `prewarmSessionDaemon`. The queue drain reads the
 * composer's enqueued values (same display-value override as the send path) and
 * the orchestrator wake-up reads the sticky `last*` fields — both raw. Every
 * door has to normalise, or the warm daemon dies on that path instead.
 */
describe("every sessionExecuteWorkflow start normalises its launch traits", () => {
  const doors: Array<{
    label: string;
    path: string;
    rawFields: readonly string[];
  }> = [
    {
      label: "the queued-message drain",
      path: "../convex/_queues/helpers.ts",
      rawFields: [
        "next.reasoningLevel",
        "next.thinkingEnabled",
        "next.use1mContext",
        "next.fastMode",
      ],
    },
    {
      label: "the orchestrator wake-up",
      path: "../convex/orchestratorNotify.ts",
      rawFields: [
        "master.lastReasoningLevel",
        "master.lastThinkingEnabled",
        "master.lastUse1mContext",
        "master.lastFastMode",
      ],
    },
  ];

  for (const { label, path, rawFields } of doors) {
    describe(label, () => {
      const text = source(path);
      const startAt = text.indexOf(
        "internal.sessionWorkflow.sessionExecuteWorkflow",
      );
      // Brace-matched rather than indentation-matched, so reformatting or
      // moving the call deeper into a `try` cannot widen the slice.
      const args = braceBlock(text, startAt);

      test("the workflow start is still here", () => {
        expect(
          startAt,
          "the sessionExecuteWorkflow start moved",
        ).toBeGreaterThan(-1);
        expect(args).toContain("sessionId");
      });

      test("normalisation happens before the start", () => {
        expect(
          text.indexOf("launchTraitsFromStored("),
          "launchTraitsFromStored is the single helper every launch path shares",
        ).toBeGreaterThan(-1);
        expect(args).toContain("launchTraitsFromStored(");
      });

      test("no raw trait field reaches the workflow args", () => {
        // A raw field inside the launchTraitsFromStored( argument IS the
        // normalisation; anywhere else in the args it is forwarded unnormalised.
        const helperArgs = braceBlock(
          args,
          args.indexOf("launchTraitsFromStored("),
        );
        const occurrences = (text: string, needle: string): number =>
          text.split(needle).length - 1;
        for (const field of rawFields) {
          expect(
            occurrences(args, field),
            `${field} is forwarded to the workflow outside launchTraitsFromStored`,
          ).toBe(occurrences(helperArgs, field));
        }
      });
    });
  }
});
