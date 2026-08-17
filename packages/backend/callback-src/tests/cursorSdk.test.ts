import { expect, test } from "vitest";
import { splitCursorModel } from "../config.js";
import { cursorSdkToolToStep } from "../parse/toolSteps.js";
import { probeCursorSdkToolResult } from "../providers/cursor.js";
import {
  RESOURCE_EXHAUSTED_CHAT_MESSAGE,
  cursorModeParams,
  filterModeParamsByModel,
  isResourceExhaustedMessage,
} from "../providers/cursorSdk.js";

test("splitCursorModel separates base id and reasoning level", () => {
  expect(splitCursorModel("grok-4.6-xhigh")).toEqual({
    base: "grok-4.6",
    level: "xhigh",
  });
  expect(splitCursorModel("grok-4.6-high")).toEqual({
    base: "grok-4.6",
    level: "high",
  });
  expect(splitCursorModel("grok-4.5-low")).toEqual({
    base: "grok-4.5",
    level: "low",
  });
  expect(splitCursorModel("grok-4.5-medium")).toEqual({
    base: "grok-4.5",
    level: "medium",
  });
  // Legacy CLI-era slug persisted from pre-migration sessions.
  expect(splitCursorModel("cursor-grok-4.5-high")).toEqual({
    base: "grok-4.5",
    level: "high",
  });
  expect(splitCursorModel("gpt-5.5-low")).toEqual({
    base: "gpt-5.5",
    level: "low",
  });
  expect(splitCursorModel("composer-2.5")).toEqual({
    base: "composer-2.5",
    level: "",
  });
  expect(splitCursorModel("gemini-3.1-pro")).toEqual({
    base: "gemini-3.1-pro",
    level: "",
  });
});

test("cursorModeParams explicitly keeps first-party models on Standard", () => {
  expect(cursorModeParams("grok-4.6", false, false)).toEqual([
    { id: "fast", value: "false" },
  ]);
  expect(cursorModeParams("grok-4.5", false, false)).toEqual([
    { id: "fast", value: "false" },
  ]);
  expect(cursorModeParams("composer-2.5", true, false)).toEqual([
    { id: "fast", value: "true" },
  ]);
  expect(cursorModeParams("gpt-5.5", false, true)).toEqual([
    { id: "context", value: "1m" },
  ]);
});

test("filterModeParamsByModel keeps params the model declares", () => {
  const candidates = cursorModeParams("grok-4.5", false, true);
  const model = {
    id: "grok-4.5",
    parameters: [
      { id: "fast", values: [{ value: "true" }, { value: "false" }] },
      { id: "context", values: [{ value: "1m" }] },
    ],
  };
  expect(filterModeParamsByModel(candidates, model, opted(false, true))).toEqual([
    { id: "fast", value: "false" },
    { id: "context", value: "1m" },
  ]);
});

test("filterModeParamsByModel drops params the model does not declare", () => {
  const candidates = cursorModeParams("grok-4.5", false, true);
  const model = { id: "grok-4.5", parameters: [{ id: "reasoning" }] };
  expect(filterModeParamsByModel(candidates, model, opted(false, true))).toEqual(
    [],
  );
  // Declared id but undeclared value drops too.
  const wrongValue = {
    id: "grok-4.5",
    parameters: [{ id: "context", values: [{ value: "500k" }] }],
  };
  expect(
    filterModeParamsByModel(candidates, wrongValue, opted(false, true)),
  ).toEqual([]);
  // A declared id with an empty values list accepts any value.
  const openValues = { id: "grok-4.5", parameters: [{ id: "fast" }] };
  expect(
    filterModeParamsByModel(candidates, openValues, opted(false, true)),
  ).toEqual([{ id: "fast", value: "false" }]);
});

test("filterModeParamsByModel without a model entry keeps only opted-in params", () => {
  // Not opted in: the protective fast=false is dropped rather than sent blind.
  expect(
    filterModeParamsByModel(
      cursorModeParams("grok-4.5", false, false),
      undefined,
      opted(false, false),
    ),
  ).toEqual([]);
  // Opted in: best-effort send of exactly what the user asked for.
  expect(
    filterModeParamsByModel(
      cursorModeParams("grok-4.5", true, true),
      undefined,
      opted(true, true),
    ),
  ).toEqual([
    { id: "fast", value: "true" },
    { id: "context", value: "1m" },
  ]);
});

function opted(fastMode: boolean, use1mContext: boolean) {
  return { fastMode, use1mContext };
}

test("isResourceExhaustedMessage matches Cursor's Connect-RPC 429", () => {
  // Exact shape observed in prod (task 234, 17 Aug 2026).
  expect(isResourceExhaustedMessage("[resource_exhausted] Error")).toBe(true);
  expect(
    isResourceExhaustedMessage("[resource_exhausted] quota exceeded"),
  ).toBe(true);
  expect(isResourceExhaustedMessage("resource_exhausted")).toBe(true);
  expect(isResourceExhaustedMessage("[agent_not_found] Error")).toBe(false);
  expect(isResourceExhaustedMessage("network timeout")).toBe(false);
  expect(isResourceExhaustedMessage("")).toBe(false);
});

test("resource_exhausted chat message is readable, not the raw code alone", () => {
  expect(RESOURCE_EXHAUSTED_CHAT_MESSAGE).toContain("rate limit");
  expect(RESOURCE_EXHAUSTED_CHAT_MESSAGE).toContain("resource_exhausted");
  expect(RESOURCE_EXHAUSTED_CHAT_MESSAGE).toContain("try again");
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
