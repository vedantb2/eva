import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));

/**
 * Regression: `AppShellChrome` is loaded with `React.lazy`, and `embedded.ts`
 * already sits in the entry via `__root`. Importing it from the lazy chunk made
 * an async-chunk → entry cycle, which is how a failed preload ended up
 * resolving `import()` to `undefined` and crashing React.lazy on `.default`.
 *
 * The entry reads the flag and passes it down as a prop instead.
 */
test("the lazy app chrome takes embedded as a prop, not as an entry import", () => {
  const chrome = readFileSync(join(here, "AppShellChrome.tsx"), "utf8");
  expect(chrome).not.toMatch(/from\s+"[^"]*embed\/embedded"/);
  expect(chrome).not.toContain("IS_EMBEDDED");
  expect(chrome).toContain("embedded: boolean");

  const shell = readFileSync(join(here, "AppShell.tsx"), "utf8");
  expect(shell).toMatch(/from\s+"[^"]*embed\/embedded"/);
  expect(shell).toContain("embedded={IS_EMBEDDED}");
});
