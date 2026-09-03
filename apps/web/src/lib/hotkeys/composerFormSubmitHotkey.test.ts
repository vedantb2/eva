import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const web = join(here, "../..");

function read(rel: string): string {
  return readFileSync(join(web, rel), "utf8")
    .replaceAll("\r\n", "\n")
    .replace(/\/\*\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

const hotkey = read("lib/hotkeys/ComposerFormSubmitHotkey.tsx");
const taskModal = read("lib/components/quick-tasks/QuickTaskModal.tsx");
const projectModal = read("lib/components/projects/NewProjectModal.tsx");

describe("submitComposerForm is registered once per open dialog", () => {
  test("the shared registration replaces, it does not stack", () => {
    expect(hotkey).toContain('useShortcut(\n    "submitComposerForm"');
    expect(hotkey).toContain('conflictBehavior: "replace"');
    expect(hotkey).not.toContain("enabled:");
  });

  test("neither modal registers the combo itself", () => {
    expect(taskModal).not.toContain('useShortcut(\n    "submitComposerForm"');
    expect(projectModal).not.toContain('useShortcut(\n    "submitComposerForm"');
    expect(taskModal).toContain("ComposerFormSubmitHotkey");
    expect(projectModal).toContain("ComposerFormSubmitHotkey");
  });

  test("the task modal only mounts the hotkey while it owns focus", () => {
    expect(taskModal).toContain(
      "isOpen && !isCreatingProject ? (\n        <ComposerFormSubmitHotkey",
    );
  });

  test("the nested project modal is not mounted while closed", () => {
    expect(taskModal).toContain("isCreatingProject ? (\n        <NewProjectModal");
    expect(taskModal).not.toMatch(
      /<NewProjectModal\s+isOpen=\{isCreatingProject\}/,
    );
  });
});
