import { expect, test } from "vitest";
import { RESERVED_APP_TAB_SLUGS, slugifyAppTabName } from "./appTabSlug";

test("RESERVED_APP_TAB_SLUGS keeps computer and legacy desktop reserved", () => {
  // Computer tab URL is /computer; desktop stays reserved so custom tabs can't collide.
  expect(RESERVED_APP_TAB_SLUGS.has("computer")).toBe(true);
  expect(RESERVED_APP_TAB_SLUGS.has("desktop")).toBe(true);
  expect(RESERVED_APP_TAB_SLUGS.has("browser")).toBe(true);
});

test("slugifyAppTabName lowercases and hyphenates display names", () => {
  expect(slugifyAppTabName("Supabase Studio")).toBe("supabase-studio");
  expect(slugifyAppTabName("  Foo__Bar  ")).toBe("foo-bar");
  expect(slugifyAppTabName("!!!")).toBe("");
});
