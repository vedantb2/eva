import { expect, test } from "vitest";
import { MAX_GENERATED_TAGS, parseGeneratedTags } from "@eva/shared";

test("rejects off-vocabulary tags", () => {
  expect(parseGeneratedTags("bug, foobar, feature", [])).toEqual([
    "bug",
    "feature",
  ]);
});

test("normalises casing to the vocabulary form", () => {
  expect(parseGeneratedTags("Bug, FRONTEND, Performance", [])).toEqual([
    "bug",
    "frontend",
    "performance",
  ]);
});

test("strips wrapping quotes and backticks", () => {
  expect(parseGeneratedTags("\"bug\", 'ux', `security`", [])).toEqual([
    "bug",
    "ux",
    "security",
  ]);
});

test("drops tags already applied (case-insensitive)", () => {
  expect(parseGeneratedTags("bug, design, ux", ["Bug", "UX"])).toEqual([
    "design",
  ]);
});

test("caps at MAX_GENERATED_TAGS", () => {
  const tags = parseGeneratedTags(
    "bug, feature, frontend, backend, security, design",
    [],
  );
  expect(tags).toHaveLength(MAX_GENERATED_TAGS);
  expect(tags).toEqual(["bug", "feature", "frontend"]);
});

test("empty or blank reply yields no tags", () => {
  expect(parseGeneratedTags("", [])).toEqual([]);
  expect(parseGeneratedTags("   \n  ", [])).toEqual([]);
  expect(parseGeneratedTags("none of these fit", [])).toEqual([]);
});

test("splits on newlines as well as commas", () => {
  expect(parseGeneratedTags("bug\nfrontend\nsecurity", [])).toEqual([
    "bug",
    "frontend",
    "security",
  ]);
});
