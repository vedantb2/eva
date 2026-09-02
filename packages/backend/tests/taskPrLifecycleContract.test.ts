import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const convexDir = join(dirname(fileURLToPath(import.meta.url)), "../convex");

const webhook = readSource("githubWebhook.ts");
const handler = definitionBody(webhook, "handlePrClosed");

/**
 * A merged/closed PR makes a quick task read-only, so its preview VM has to be
 * told to stop. Grace-delete alone only removes the sandbox 48h later, leaving
 * a live Vercel VM running in the meantime — sessions already stopped on the
 * PR terminal event, quick tasks did not.
 */
describe("quick-task pull-request close stops the preview sandbox", () => {
  test("stops the sandbox before scheduling its grace deletion", () => {
    const stopAt = handler.indexOf("requestTaskSandboxStop(");
    const deleteAt = handler.indexOf("scheduleTaskSandboxGraceDelete(");
    expect(stopAt).toBeGreaterThan(-1);
    expect(deleteAt).toBeGreaterThan(stopAt);
  });

  test("the stop is gated on the task being a quick task", () => {
    const gateAt = handler.indexOf("if (t.projectId === undefined) {");
    expect(gateAt, "the quick-task gate moved or was renamed").toBeGreaterThan(
      -1,
    );
    expect(handler.indexOf("requestTaskSandboxStop(")).toBeGreaterThan(gateAt);
  });

  test.each([
    ['reviewTaskSandboxStatus === "active"'],
    ['reviewTaskSandboxStatus === "starting"'],
    ['reviewTaskSandboxStatus === "stopping"'],
    ["t.sandboxId !== undefined"],
  ])("the stop condition covers %s", (clause) => {
    const gateAt = handler.indexOf("if (t.projectId === undefined) {");
    const stopAt = handler.indexOf("requestTaskSandboxStop(");
    expect(handler.slice(gateAt, stopAt)).toContain(clause);
  });
});

/**
 * Every path that flips a task to `"stopping"` goes through the shared helper,
 * so none of them can schedule the finalize without pairing its recovery
 * (asserted per module in sessionStopRecoveryContract.test.ts).
 */
describe("task stop paths share one helper", () => {
  test("the Stop mutation delegates rather than scheduling the finalize", () => {
    const body = definitionBody(
      readSource("_agentTasks/sandbox.ts"),
      "stopTaskSandbox",
    );
    expect(body).toContain("requestTaskSandboxStop(ctx, args.taskId)");
    expect(body).not.toContain("scheduleFinalizeStopTask(");
  });

  test("the idle auto-stop sweep delegates too", () => {
    const body = definitionBody(readSource("sandboxAutoStop.ts"), "stopTask");
    expect(body).toContain("requestTaskSandboxStop(");
    expect(body).not.toContain("scheduleFinalizeStopTask(");
  });
});

/** Comments name the very calls these rules rule out, so they have to go first. */
function readSource(relativePath: string): string {
  return stripComments(
    readFileSync(join(convexDir, relativePath), "utf8").replaceAll(
      "\r\n",
      "\n",
    ),
  );
}

/** One Convex definition, ending on the `\n});` that closes it. */
function definitionBody(input: string, name: string): string {
  const startAt = input.indexOf(`export const ${name} =`);
  expect(startAt, `${name} moved or was renamed`).toBeGreaterThan(-1);
  const endAt = input.indexOf("\n});", startAt);
  return input.slice(startAt, endAt < 0 ? undefined : endAt);
}

function stripComments(input: string): string {
  return input
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^[^\S\n]*\/\/.*$/gm, "");
}
