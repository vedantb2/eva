import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

const testsDir = dirname(fileURLToPath(import.meta.url));

const sessionsSource = readFileSync(
  join(testsDir, "../convex/_sandbox_runtime/sessions.ts"),
  "utf8",
);

const executionSource = readFileSync(
  join(testsDir, "../convex/_sandbox_runtime/execution.ts"),
  "utf8",
);

/**
 * Convex's `runAction` syscall bridge dies at roughly 300s with a message-less
 * error, while startup readiness gates can legitimately wait longer — that
 * combination produced the recurring "Sandbox startup unfinished" incidents,
 * all at +5m12-29s, with the child process still running.
 *
 * The sibling "use node" actions in sessions.ts therefore call the exported
 * helper directly: no syscall, bounded only by the caller's 10-minute action
 * budget. The `internalAction` wrapper stays for workflow steps, which get
 * their own budget.
 */
test("sessions.ts calls runStartupCommands directly, not through runAction", () => {
  expect(sessionsSource).toContain(
    'import { runStartupCommandsDirect } from "./execution"',
  );
  expect(sessionsSource).toContain("await runStartupCommandsDirect(ctx, {");
  expect(
    sessionsSource,
    "a nested runAction here dies at ~300s; call runStartupCommandsDirect instead",
  ).not.toMatch(/ctx\.runAction\(\s*internal\.sandbox\.runStartupCommands/);
});

test("execution.ts keeps the direct helper and the action wrapper in sync", () => {
  expect(executionSource).toContain(
    "export async function runStartupCommandsDirect",
  );
  expect(executionSource).toContain(
    "export const runStartupCommands = internalAction",
  );
  // The wrapper must delegate, so the two paths can never drift.
  expect(executionSource).toContain("runStartupCommandsDirect(ctx, args)");
});
