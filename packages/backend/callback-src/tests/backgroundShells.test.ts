import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  backgroundShellQueueLengthForTests,
  matchBackgroundShellId,
  resetBackgroundShellsForTests,
  trackClaudeToolResult,
  trackClaudeToolUse,
} from "../runtime/backgroundShells.js";

describe("backgroundShells", () => {
  beforeEach(() => {
    resetBackgroundShellsForTests();
  });

  it("matches Claude Code background shell id wording", () => {
    assert.equal(
      matchBackgroundShellId("Command running in background with ID: bash_1"),
      "bash_1",
    );
    assert.equal(
      matchBackgroundShellId(
        "The command is running in the background with ID bash_3.",
      ),
      "bash_3",
    );
    assert.equal(matchBackgroundShellId("exit code 0\nok"), null);
  });

  it("queues register on background Bash tool_result", () => {
    trackClaudeToolUse(
      "Bash",
      { command: "while true; do sleep 1; done" },
      "toolu_abc",
    );
    trackClaudeToolResult(
      "toolu_abc",
      "Command running in background with ID: bash_2",
      false,
    );
    assert.equal(backgroundShellQueueLengthForTests(), 1);
  });

  it("does not queue register for foreground Bash results", () => {
    trackClaudeToolUse("Bash", { command: "echo hi" }, "toolu_fg");
    trackClaudeToolResult("toolu_fg", "hi\n", false);
    assert.equal(backgroundShellQueueLengthForTests(), 0);
  });

  it("queues agent_killed on successful KillShell", () => {
    trackClaudeToolUse("KillShell", { shell_id: "bash_9" }, "toolu_kill");
    trackClaudeToolResult("toolu_kill", "killed", false);
    assert.equal(backgroundShellQueueLengthForTests(), 1);
  });
});
