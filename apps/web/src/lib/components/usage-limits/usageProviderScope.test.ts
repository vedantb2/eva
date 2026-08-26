import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const webSrc = join(dirname(fileURLToPath(import.meta.url)), "../../..");

function readSource(path: string): string {
  return readFileSync(join(webSrc, path), "utf8").replaceAll("\r\n", "\n");
}

/**
 * Chip bar follows the sticky Claude credential; the popover lists every
 * account. Cursor/Codex omit the scope so the bar does not show Claude % next
 * to the wrong picker.
 */
describe("plan-usage chip bar vs popover scoping", () => {
  test("session, project, and task chats pass a Claude account scope", () => {
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

  test("the indicator scopes the chip but not the popover rows", () => {
    const indicator = readSource(
      "lib/components/usage-limits/UsageLimitsIndicator.tsx",
    );
    expect(indicator).toContain("usageRowsForAccount(rows, accountScope)");
    expect(indicator).toContain("chipSummary(chipRows, now)");
    expect(indicator).toContain(
      "<UsageLimitsDetails repoId={repoId} rows={rows} now={now} />",
    );
  });
});
