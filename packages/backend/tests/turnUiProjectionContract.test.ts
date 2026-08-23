import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const source = (path: string): string =>
  readFileSync(join(repoRoot, path), "utf8");

test("session lists derive execution from open Turns with a versioned rollout bridge", () => {
  const queries = source("packages/backend/convex/_sessions/queries.ts");
  const projection = source(
    "packages/backend/convex/_chat/turnProjection.ts",
  );
  expect(queries).toContain('.withIndex("by_repo_open"');
  expect(queries).toContain('q.eq("repoId", repoId).eq("open", true)');
  expect(queries).toContain("isLegacySessionExecuting(session)");
  expect(projection).toContain("session.turnLifecycleVersion === undefined");
  expect(projection).toContain("session.activeWorkflowId !== undefined");
});

test("the session composer uses persisted turn status after query load", () => {
  const hook = source(
    "apps/web/src/routes/_repo/$owner/$repo/sessions/_components/useSessionSend.ts",
  );
  expect(hook).toContain("useQuery(api.turns.getSessionStatus, { sessionId })");
  expect(hook).toContain("turnStatus === undefined");
  expect(hook).toContain(": turnStatus !== null");
});

test("annotation sends share the same canonical turn projection", () => {
  const hook = source(
    "apps/web/src/routes/_repo/$owner/$repo/sessions/_components/useSessionAnnotationSend.ts",
  );
  expect(hook).toContain("useQuery(api.turns.getSessionStatus, { sessionId })");
  expect(hook).toContain(": turnStatus !== null");
});
