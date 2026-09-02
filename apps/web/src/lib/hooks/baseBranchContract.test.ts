import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

// Regression guard for commit e28a986ca.
//
// Each create surface seeded a local `useState` from `repo.defaultBaseBranch`.
// Switching apps (sidebar `+`, composer app switcher, rail tile) only changes
// the route params — the component does not remount, so the initializer never
// re-ran and a one-off pick was silently submitted for everything created
// afterwards. PR #615 merged into `staging` on a repo whose default is `main`
// that way, and nothing merges `staging` back into `main`.
//
// This is a disk-read contract check (matching the suite's other *Contract
// tests) because the hook resets state during render and pulls RepoContext, so
// it cannot be rendered in the node test environment. A guard for this bug
// shipped once before and was reverted away, which is the case for pinning it.

const here = dirname(fileURLToPath(import.meta.url));
const hook = readFileSync(join(here, "useBaseBranchState.ts"), "utf8");

const surfaces = [
  "../components/projects/NewProjectModal.tsx",
  "../components/quick-tasks/QuickTaskModal.tsx",
  "../../routes/_repo/$owner/$repo/sessions/_components/NewSessionComposer.tsx",
].map((path) => ({ path, source: readFileSync(join(here, path), "utf8") }));

describe("base-branch picker state", () => {
  test("re-seeds when the app row changes", () => {
    // The reset itself. Without it the hook is just a relocated useState.
    expect(hook).toContain("repo._id !== prevRepoId");
    expect(hook).toContain("setBaseBranch(repoDefaultBranch)");
  });

  test("keys on repo._id, not owner/name", () => {
    // The reverted guard keyed on `${repo.owner}/${repo.name}`, which let a
    // pick survive between sibling apps of one monorepo — exactly the switch
    // that leaked `staging` here. `defaultBaseBranch` lives on the app row.
    expect(hook).not.toMatch(/repo\.owner|repo\.name/);
  });

  test.each(surfaces)("$path takes its branch from the hook", ({ source }) => {
    expect(source).toContain(
      'import { useBaseBranchState } from "@/lib/hooks/useBaseBranchState"',
    );
    expect(source).toContain("useBaseBranchState(");
  });

  test.each(surfaces)(
    "$path holds no branch state of its own",
    ({ source }) => {
      // A fourth copy of `useState(repo.defaultBaseBranch ?? FALLBACK)` is the
      // bug returning, whatever the local variable ends up being called.
      expect(source).not.toMatch(/useState\([^)]*defaultBaseBranch/);
      expect(source).not.toContain("FALLBACK_GIT_BASE_BRANCH");
      expect(source).not.toMatch(/const \[baseBranch\s*,/);
    },
  );
});
