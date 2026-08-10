import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

const backendDir = join(dirname(fileURLToPath(import.meta.url)), "..");

function readSource(relativePath: string): string {
  return readFileSync(join(backendDir, relativePath), "utf8").replaceAll(
    "\r\n",
    "\n",
  );
}

test("PTYs and panes share the canonical sandbox owner validator", () => {
  const owner = readSource("convex/_sandbox/owner.ts");
  const ptyOwners = readSource("convex/_pty/owners.ts");
  const panes = readSource("convex/sandboxPanes.ts");

  expect(owner).toContain("export const sandboxOwnerValidator = v.union(");
  expect(ptyOwners).toContain("export const ownerArg = sandboxOwnerValidator");
  expect(panes).toContain("args: { owner: sandboxOwnerValidator }");
  expect(ptyOwners).not.toContain("export const ownerArg = v.union(");
});

test("shared sandbox view state is exposed from one owner-aware module", () => {
  const panes = readSource("convex/sandboxPanes.ts");
  for (const functionName of [
    "getViewState",
    "setPreviewPath",
    "setPreviewPort",
    "setTerminalHistoryTail",
    "releaseBrowserLock",
  ]) {
    expect(panes).toContain(`export const ${functionName} =`);
  }
  expect(panes).toContain("resolveSandboxOwnerForUser(");
});
