import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import assert from "node:assert/strict";

export const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

const oxlintBin = path.join(repoRoot, "node_modules", "oxlint", "bin", "oxlint");

/**
 * Run oxlint on a single in-memory source string for one eva rule.
 *
 * `options` is either a filename shorthand (string, default "fixture.ts") or
 * an object with `filename`.
 * Returns combined stdout+stderr and the exit code.
 */
export function runOxlintRule(ruleName, source, options = {}) {
  const { filename = "fixture.ts" } =
    typeof options === "string" ? { filename: options } : options;

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "eva-oxlint-"));
  const filePath = path.join(dir, filename);
  const configPath = path.join(dir, ".oxlintrc.json");
  const pluginPath = path
    .join(repoRoot, "scripts", "oxlint-plugin-eva", "index.mjs")
    .replace(/\\/g, "/");

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, source, "utf8");

  fs.writeFileSync(
    configPath,
    JSON.stringify(
      {
        plugins: [],
        jsPlugins: [{ name: "eva", specifier: pluginPath }],
        rules: {
          [`eva/${ruleName}`]: "error",
          // Fixture snippets often declare unused locals; don't fail valid cases.
          "no-unused-vars": "off",
          "eslint/no-unused-vars": "off",
        },
      },
      null,
      2,
    ),
    "utf8",
  );

  const result = spawnSync(
    process.execPath,
    [oxlintBin, "-c", configPath, filePath],
    {
      cwd: repoRoot,
      encoding: "utf8",
    },
  );

  fs.rmSync(dir, { recursive: true, force: true });

  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  return { code: result.status ?? 1, output, error: result.error };
}

/** Assert the rule reports at least one diagnostic on `source`. */
export function assertInvalid(ruleName, source, options) {
  void test(`${ruleName} (invalid)`, () => {
    const { code, output, error } = runOxlintRule(ruleName, source, options);
    assert.equal(error, undefined, `spawn failed: ${error}`);
    assert.notEqual(
      code,
      0,
      `expected oxlint to fail for ${ruleName}, output:\n${output}`,
    );
    assert.match(
      output,
      new RegExp(`eva\\(${ruleName}\\)`),
      `expected rule id eva(${ruleName}) in output:\n${output}`,
    );
  });
}

/** Assert the rule does not report on `source`. */
export function assertValid(ruleName, source, options) {
  void test(`${ruleName} (valid)`, () => {
    const { code, output, error } = runOxlintRule(ruleName, source, options);
    assert.equal(error, undefined, `spawn failed: ${error}`);
    assert.equal(
      code,
      0,
      `expected oxlint to pass for ${ruleName}, output:\n${output}`,
    );
  });
}
