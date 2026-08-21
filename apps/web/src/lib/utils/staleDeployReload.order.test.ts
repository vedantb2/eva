import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const mainSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../../main.tsx"),
  "utf8",
);

describe("handleStaleDeployment", () => {
  test("claims the reload cooldown before preventDefault", () => {
    // Vite's preload helper resolves a failed import() to undefined when
    // vite:preloadError is canceled. React.lazy then throws reading
    // `.default` of that undefined. Preventing only after claimStaleDeployReload
    // wins keeps a cooldown refusal from swallowing the rejection.
    const claimAt = mainSource.indexOf("claimStaleDeployReload()");
    const preventAt = mainSource.indexOf("event.preventDefault()");
    expect(claimAt).toBeGreaterThan(-1);
    expect(preventAt).toBeGreaterThan(-1);
    expect(claimAt).toBeLessThan(preventAt);
  });
});
