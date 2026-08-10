import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));

/**
 * Backend owns Preview Console launch; panels must not re-enable connect-time
 * auto-type (reconnect sees an existing tmux session and skips forever).
 */
test("session, task, and project sandbox panels disable console auto-type", () => {
  const panels = [
    join(here, "../../../routes/_repo/$owner/$repo/sessions/SandboxPanel.tsx"),
    join(here, "../tasks/TaskSandboxPanel.tsx"),
    join(here, "../projects/ProjectSandboxPanel.tsx"),
  ];
  for (const path of panels) {
    expect(readFileSync(path, "utf8")).toContain(
      "runConsoleDevCommandOnConnect={false}",
    );
  }
});
