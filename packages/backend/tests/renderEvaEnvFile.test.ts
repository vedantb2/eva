import { expect, test } from "vitest";
import { renderEvaEnvFile } from "../convex/_sandbox/vercelEnvFile";

test("renderEvaEnvFile escapes single quotes for shell sourcing", () => {
  // Values like it's must become 'it'\''s' so `. .eva-env.sh` stays valid.
  expect(
    renderEvaEnvFile({
      FOO: "bar",
      NOTE: "it's fine",
    }),
  ).toBe("export FOO='bar'\nexport NOTE='it'\\''s fine'\n");
});

test("renderEvaEnvFile ends with a trailing newline", () => {
  expect(renderEvaEnvFile({ A: "1" }).endsWith("\n")).toBe(true);
});
