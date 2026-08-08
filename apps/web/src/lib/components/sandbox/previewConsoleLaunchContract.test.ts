import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));

/**
 * Backend owns Preview Console launch. The shared workspace must keep that
 * policy centralized so one owner surface cannot drift from the others.
 */
test("the shared sandbox workspace disables console auto-type once", () => {
  const workspace = readFileSync(join(here, "SandboxWorkspace.tsx"), "utf8");
  expect(workspace).toContain("runConsoleDevCommandOnConnect={false}");

  const panels = [
    join(here, "../../../routes/_repo/$owner/$repo/sessions/SandboxPanel.tsx"),
    join(here, "../tasks/TaskSandboxPanel.tsx"),
    join(here, "../projects/ProjectSandboxPanel.tsx"),
  ];
  for (const path of panels) {
    const panel = readFileSync(path, "utf8");
    expect(panel).toContain("<SandboxWorkspace");
    expect(panel).not.toContain("<SandboxPaneSlots");
    expect(panel).not.toContain("<SandboxTabBar");
  }
});
