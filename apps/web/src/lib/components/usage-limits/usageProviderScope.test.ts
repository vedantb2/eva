import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const webSrc = join(dirname(fileURLToPath(import.meta.url)), "../../..");

function readSource(path: string): string {
  return readFileSync(join(webSrc, path), "utf8").replaceAll("\r\n", "\n");
}

/**
 * The header chip is Claude plan usage. Cursor/Codex chats still have a sticky
 * account id (or Team), and mounting the indicator anyway showed Claude's
 * numbers next to the wrong picker.
 */
describe("plan-usage is not shown on a non-Claude chat", () => {
  test("session, project, and task chats go through claudeUsageAccountScope", () => {
    const session = readSource(
      "routes/_repo/$owner/$repo/sessions/ChatPanel.tsx",
    );
    const project = readSource(
      "lib/components/projects/ProjectSandboxChatPanel.tsx",
    );
    const task = readSource("lib/components/tasks/TaskSandboxChatPanel.tsx");
    expect(session).toContain("claudeUsageAccountScope(model");
    expect(project).toContain("claudeUsageAccountScope(model");
    expect(task).toContain("claudeUsageAccountScope(model");
  });

  test("the chip is unmounted when there is no Claude scope", () => {
    const header = readSource(
      "routes/_repo/$owner/$repo/sessions/_components/SessionChatHeader.tsx",
    );
    const sandbox = readSource(
      "lib/components/sandbox/SandboxStartStopButton.tsx",
    );
    expect(header).toContain("usageAccountScope ?");
    expect(header).toContain("<UsageLimitsIndicator");
    expect(sandbox).toContain("usageAccountScope ?");
    expect(sandbox).toContain("<UsageLimitsIndicator");
  });
});
