import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const componentsDir = dirname(fileURLToPath(import.meta.url));

const shell = readFileSync(
  join(componentsDir, "TaskActivityComposer.tsx"),
  "utf8",
);
const form = readFileSync(
  join(componentsDir, "TaskActivityComposerForm.tsx"),
  "utf8",
);

/** The editor class literal each file hands to CommentMentionInput. */
function editorClass(source: string, name: string): string {
  const match = new RegExp(`const\\s+${name}\\s*=\\s*\n?\\s*"([^"]+)"`).exec(
    source,
  );
  const value = match === null ? undefined : match[1];
  if (value === undefined) {
    throw new Error(`${name} moved or was renamed`);
  }
  return value;
}

/**
 * The shell renders a disabled copy of the editor while the draft query
 * resolves, then swaps in the real form. The two carry separate copies of the
 * same class string, so a change to one alone makes the box jump the moment
 * the draft lands — exactly what happened when only one copy was shrunk from
 * min-h-24 to min-h-14.
 */
test("the loading placeholder and the mounted form share one editor chrome", () => {
  expect(
    editorClass(shell, "editorClassName"),
    "the placeholder and the form editor must stay identical or the composer resizes on load",
  ).toBe(editorClass(form, "COMMENT_EDITOR_CLASS"));
});

/**
 * Quick tasks went comment-only, but project tasks kept a leftover "Make
 * changes" toggle that ran the agent, picked a model, and patched task status
 * straight from the activity composer. Both surfaces now share this one
 * composer, and it posts comments — nothing else.
 */
describe("the task activity composer only posts comments", () => {
  test.each([
    ["the shell", shell],
    ["the form", form],
  ])("%s runs no task mutation other than the comment create", (_, source) => {
    const mutations = [...source.matchAll(/useMutation\(api\.([\w.]+)\)/g)].map(
      (match) => match[1],
    );
    expect(mutations.every((name) => name === "taskComments.create")).toBe(
      true,
    );
  });

  test.each([
    ["the shell", shell],
    ["the form", form],
  ])("%s has no run-the-agent affordance", (_, source) => {
    expect(source).not.toContain("Make changes");
    expect(source).not.toMatch(/\bSwitch\b/);
    expect(source).not.toMatch(/\bModelSelect\b/);
    expect(source).not.toContain("requestingChanges");
  });
});
