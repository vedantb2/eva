import { describe, expect, it } from "vitest";
import {
  buildKillLaneCommand,
  laneDirectory,
  runnerPaths,
} from "../convex/_sandbox_runtime/lanePaths";
import { titleFromFirstMessage } from "../convex/chats";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const backendDir = join(dirname(fileURLToPath(import.meta.url)), "..");

describe("isolated chat lanes", () => {
  it("preserves legacy paths for the main lane", () => {
    expect(runnerPaths().pid).toBe("/tmp/run-design.pid");
    expect(runnerPaths().mcpConfig).toBe("/tmp/eva-mcp.json");
  });

  it("scopes every mutable runner path under the chat lane", () => {
    const paths = runnerPaths("chat_123");
    expect(paths.laneDir).toBe("/tmp/eva-lanes/chat_123");
    for (const path of [
      paths.prompt,
      paths.launchScript,
      paths.pid,
      paths.ready,
      paths.done,
      paths.rawLog,
      paths.log,
      paths.mcpConfig,
      paths.systemSkills,
      paths.attachmentsDir,
      paths.claudeRuntimeDir,
      paths.codexRuntimeDir,
      paths.opencodeRuntimeDir,
      paths.cursorRuntimeDir,
    ]) {
      expect(path.startsWith("/tmp/eva-lanes/chat_123/")).toBe(true);
    }
  });

  it("rejects lane keys that could escape the lane root", () => {
    expect(() => laneDirectory("../default")).toThrow(
      "Invalid sandbox lane key",
    );
  });

  it("builds cancellation against only the requested process group", () => {
    const command = buildKillLaneCommand("chat_123");
    expect(command).toContain("/tmp/eva-lanes/chat_123/run.pid");
    expect(command).toContain('kill -TERM -- "-$pid"');
    expect(command).not.toContain("/tmp/run-design.pid");
  });
});

describe("side chat auto titles", () => {
  it("removes mention tokens and normalizes whitespace", () => {
    expect(titleFromFirstMessage("  @[Ada](user_1)   fix the queue  ")).toBe(
      "fix the queue",
    );
  });

  it("falls back for attachment-only turns and truncates long titles", () => {
    expect(titleFromFirstMessage("@[Ada](user_1)")).toBe("New chat");
    expect(
      titleFromFirstMessage("word ".repeat(30)).length,
    ).toBeLessThanOrEqual(65);
  });
});

describe("side chat authorization and cleanup contracts", () => {
  it("resolves chat access recursively through its parent", () => {
    const source = readFileSync(
      join(backendDir, "convex/functions.ts"),
      "utf8",
    );
    expect(source).toContain('const chatId = db.normalizeId("chats", rawId)');
    expect(source).toContain(
      "await assertMessageParentAccess(db, chat.parentId, userId)",
    );
  });

  it("cleans side chats from every parent stop and session archive path", () => {
    for (const relativePath of [
      "convex/_sessions/sandbox.ts",
      "convex/_sessions/mutations.ts",
      "convex/_projects/sandbox.ts",
      "convex/_agentTasks/sandbox.ts",
    ]) {
      const source = readFileSync(join(backendDir, relativePath), "utf8");
      expect(source).toContain("internal.chatLifecycle.cleanupParentChats");
    }
  });
});
