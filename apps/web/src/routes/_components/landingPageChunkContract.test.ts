import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const landingPage = readFileSync(join(here, "LandingPage.tsx"), "utf8");

/**
 * The default compact landing used to static-import every full-page section.
 * Those mocks + motion variants sat on the first-visit JS even when
 * `VITE_NEW_LANDING` was off. The long page is a lazy chunk now.
 */
test("the compact landing does not static-import the full marketing page", () => {
  expect(landingPage).toContain('import { LandingCompact } from "./landing/LandingCompact"');
  expect(landingPage).toMatch(/lazy\(\s*\(\)\s*=>\s*import\("\.\/landing\/LandingFull"/);
  expect(landingPage).not.toMatch(/from\s+"\.\/landing\/LandingHero"/);
  expect(landingPage).not.toMatch(/from\s+"\.\/landing\/LandingWorkflow"/);
  expect(landingPage).not.toMatch(/from\s+"\.\/LandingTaskDetailMock"/);
  expect(landingPage).not.toContain("LANDING_PILLARS");
});
