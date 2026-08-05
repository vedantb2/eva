import { expect, test } from "vitest";
import { cursorSdkToolToStep } from "../parse/toolSteps.js";
import { probeCursorSdkToolResult } from "../providers/cursor.js";
import { parseCursorSdkMcpServers } from "../providers/cursorSdk.js";

test("parseCursorSdkMcpServers maps eva-mcp.json to inline SDK config", () => {
  const raw = JSON.stringify({
    mcpServers: {
      eva: {
        url: "https://example.convex.site/mcp",
        headers: { Authorization: "Bearer abc", "X-Num": 5 },
      },
      broken: { command: "npx" },
      empty: { url: "   " },
    },
  });
  const servers = parseCursorSdkMcpServers(raw);
  expect(Object.keys(servers)).toEqual(["eva"]);
  expect(servers.eva).toEqual({
    type: "http",
    url: "https://example.convex.site/mcp",
    headers: { Authorization: "Bearer abc" },
  });
});

test("parseCursorSdkMcpServers tolerates malformed input", () => {
  expect(parseCursorSdkMcpServers("not json")).toEqual({});
  expect(parseCursorSdkMcpServers("[]")).toEqual({});
  expect(parseCursorSdkMcpServers('{"mcpServers":[]}')).toEqual({});
});

test("cursorSdkToolToStep maps known SDK tool kinds", () => {
  const read = cursorSdkToolToStep("read", { path: "/tmp/repo/src/a.ts" });
  expect(read.type).toBe("read");
  expect(read.path).toBe("/tmp/repo/src/a.ts");

  const write = cursorSdkToolToStep("write", {
    path: "src/b.ts",
    fileText: "export const a = 1;",
  });
  expect(write.type).toBe("write");
  expect(write.contentPreview).toContain("export const a");

  const shell = cursorSdkToolToStep("shell", { command: "npm test" });
  expect(shell.type).toBe("bash");
  expect(shell.command).toBe("npm test");
  expect(shell.detail).toBe("npm test");

  const glob = cursorSdkToolToStep("glob", { globPattern: "**/*.ts" });
  expect(glob.type).toBe("search_files");
  expect(glob.detail).toBe("**/*.ts");

  const grep = cursorSdkToolToStep("grep", { pattern: "TODO" });
  expect(grep.type).toBe("search_code");
  expect(grep.detail).toBe("TODO");

  const del = cursorSdkToolToStep("delete", { path: "src/old.ts" });
  expect(del.type).toBe("edit");
  expect(del.label).toBe("Deleting file...");

  const mcp = cursorSdkToolToStep("mcp", { serverName: "linear" });
  expect(mcp.type).toBe("tool");
  expect(mcp.label).toBe("Using MCP linear...");

  const todos = cursorSdkToolToStep("updateTodos", {});
  expect(todos.label).toBe("Updating tasks...");
});

test("cursorSdkToolToStep falls back heuristically for unknown names", () => {
  const fetch = cursorSdkToolToStep("webFetch", {
    url: "https://example.com",
  });
  expect(fetch.type).toBe("web_fetch");

  const mystery = cursorSdkToolToStep("recordScreen", {});
  expect(mystery.type).toBe("tool");
  expect(mystery.label).toBe("Using recordScreen...");

  const unnamed = cursorSdkToolToStep("", {});
  expect(unnamed.label).toBe("Using tool...");
});

test("probeCursorSdkToolResult unwraps success envelopes", () => {
  const result = probeCursorSdkToolResult("completed", {
    status: "success",
    value: {
      exitCode: 0,
      stdout: "hello world",
      stderr: "",
      executionTime: 120,
    },
  });
  expect(result?.output?.text).toBe("hello world");
  expect(result?.output?.exitCode).toBe(0);
  expect(result?.durationMs).toBe(120);
  expect(result?.isError).toBeUndefined();
});

test("probeCursorSdkToolResult unwraps error envelopes and statuses", () => {
  const stringError = probeCursorSdkToolResult("error", {
    status: "error",
    error: "boom",
  });
  expect(stringError?.isError).toBe(true);
  expect(stringError?.output?.text).toBe("boom");

  const objectError = probeCursorSdkToolResult("error", {
    status: "error",
    error: { message: "tool exploded" },
  });
  expect(objectError?.isError).toBe(true);
  expect(objectError?.output?.text).toBe("tool exploded");

  const noPayload = probeCursorSdkToolResult("error", undefined);
  expect(noPayload).toEqual({ isError: true });

  const okNoPayload = probeCursorSdkToolResult("completed", undefined);
  expect(okNoPayload).toBeUndefined();
});

test("probeCursorSdkToolResult surfaces diffString and plain payloads", () => {
  const diff = probeCursorSdkToolResult("completed", {
    status: "success",
    value: { diffString: "-a\n+b", linesAdded: 1, linesRemoved: 1 },
  });
  expect(diff?.output?.text).toBe("-a\n+b");

  const plainString = probeCursorSdkToolResult("completed", "raw output");
  expect(plainString?.output?.text).toBe("raw output");

  const plainObject = probeCursorSdkToolResult("completed", {
    stdout: "direct",
    exitCode: 0,
  });
  expect(plainObject?.output?.text).toBe("direct");
});
