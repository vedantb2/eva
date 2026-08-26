import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const webSrc = join(dirname(fileURLToPath(import.meta.url)), "../../..");

function readSource(path: string): string {
  return readFileSync(join(webSrc, path), "utf8").replaceAll("\r\n", "\n");
}

/**
 * Plan usage is every Claude account on the repo, not the sticky session
 * credential — Cursor/Codex chats still show the chip.
 */
describe("plan-usage chip shows every Claude account", () => {
  test("session and sandbox headers always mount the unscoped indicator", () => {
    const header = readSource(
      "routes/_repo/$owner/$repo/sessions/_components/SessionChatHeader.tsx",
    );
    const sandbox = readSource(
      "lib/components/sandbox/SandboxStartStopButton.tsx",
    );
    expect(header).toContain("<UsageLimitsIndicator repoId={repoId} />");
    expect(header).not.toContain("usageAccountScope");
    expect(sandbox).toContain("<UsageLimitsIndicator repoId={repoId} />");
    expect(sandbox).not.toContain("usageAccountScope");
  });

  test("session, project, and task chats no longer scope the chip to the sticky account", () => {
    const session = readSource(
      "routes/_repo/$owner/$repo/sessions/ChatPanel.tsx",
    );
    const project = readSource(
      "lib/components/projects/ProjectSandboxChatPanel.tsx",
    );
    const task = readSource("lib/components/tasks/TaskSandboxChatPanel.tsx");
    expect(session).not.toContain("claudeUsageAccountScope");
    expect(project).not.toContain("claudeUsageAccountScope");
    expect(task).not.toContain("claudeUsageAccountScope");
  });

  test("the indicator reads every row from getByRepo", () => {
    const indicator = readSource(
      "lib/components/usage-limits/UsageLimitsIndicator.tsx",
    );
    expect(indicator).toContain("chipSummary(rows, now)");
    expect(indicator).not.toContain("usageRowsForAccount");
    expect(indicator).not.toContain("accountScope");
  });
});
