import { describe, expect, it } from "vitest";
import type { ActivityStep } from "./activity-shared";
import { buildActivityRows, normalizeStep } from "./activity-tasks-utils";

function step(
  partial: Partial<ActivityStep> & Pick<ActivityStep, "type" | "label">,
): ActivityStep {
  return {
    status: "complete",
    ...partial,
  };
}

describe("normalizeStep", () => {
  it("drops legacy noise thinking labels", () => {
    expect(
      normalizeStep(
        step({ type: "thinking", label: "Generating response..." }),
      ),
    ).toBeNull();
  });

  it("remaps Thinking... with real detail to reasoning", () => {
    const result = normalizeStep(
      step({
        type: "thinking",
        label: "Thinking...",
        detail: "Considering the tradeoffs",
      }),
    );
    expect(result?.type).toBe("reasoning");
  });

  it("drops Thinking... with filler detail", () => {
    expect(
      normalizeStep(
        step({
          type: "thinking",
          label: "Thinking...",
          detail: "Claude is reasoning...",
        }),
      ),
    ).toBeNull();
  });

  it("passes through non-thinking steps", () => {
    const input = step({ type: "bash", label: "Ran command", detail: "ls" });
    expect(normalizeStep(input)).toEqual(input);
  });
});

describe("buildActivityRows", () => {
  it("emits one row per top-level step without consecutive merging", () => {
    const rows = buildActivityRows([
      step({ type: "bash", label: "a", detail: "ls" }),
      step({ type: "bash", label: "b", detail: "pwd" }),
      step({
        type: "read",
        label: "c",
        detail: "foo.ts",
        path: "/tmp/repo/foo.ts",
      }),
    ]);
    expect(rows).toHaveLength(3);
    expect(rows.map((r) => r.step.detail)).toEqual(["ls", "pwd", "foo.ts"]);
  });

  it("nests children under matching subtask toolUseId", () => {
    const rows = buildActivityRows([
      step({
        type: "subtask",
        label: "Ran agent",
        detail: "Explore codebase",
        toolUseId: "agent-1",
      }),
      step({
        type: "read",
        label: "Read",
        detail: "a.ts",
        path: "/tmp/repo/a.ts",
        parentToolUseId: "agent-1",
      }),
      step({
        type: "bash",
        label: "Ran",
        detail: "git status",
        parentToolUseId: "agent-1",
      }),
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.children).toHaveLength(2);
    expect(rows[0]?.children?.[0]?.step.type).toBe("read");
    expect(rows[0]?.children?.[1]?.step.type).toBe("bash");
  });

  it("appends orphan children at top level", () => {
    const rows = buildActivityRows([
      step({
        type: "bash",
        label: "Ran",
        detail: "ls",
        parentToolUseId: "missing-parent",
      }),
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.step.detail).toBe("ls");
    expect(rows[0]?.children).toBeUndefined();
  });

  it("keeps a single todos step", () => {
    const rows = buildActivityRows([
      step({
        type: "todos",
        label: "Task list",
        todos: [{ content: "Ship it", status: "pending" }],
      }),
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.step.type).toBe("todos");
  });
});
