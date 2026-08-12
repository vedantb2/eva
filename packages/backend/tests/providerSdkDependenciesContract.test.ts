import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

const testsDir = dirname(fileURLToPath(import.meta.url));

const backendPackage = readFileSync(join(testsDir, "../package.json"), "utf8");
const claudeLoader = readFileSync(
  join(testsDir, "../callback-src/providers/claudeSdk.ts"),
  "utf8",
);
const cursorLoader = readFileSync(
  join(testsDir, "../callback-src/providers/cursorSdk.ts"),
  "utf8",
);
const snapshotActions = readFileSync(
  join(testsDir, "../convex/snapshotActions.ts"),
  "utf8",
);

const sdkVersions = [
  {
    packageName: "@anthropic-ai/claude-agent-sdk",
    version: "0.3.201",
    loader: claudeLoader,
  },
  {
    packageName: "@cursor/sdk",
    version: "1.0.26",
    loader: cursorLoader,
  },
];

test("provider SDK dependencies match the callback loader versions", () => {
  for (const sdk of sdkVersions) {
    expect(backendPackage).toContain(
      `"${sdk.packageName}": "${sdk.version}"`,
    );
    expect(sdk.loader).toContain(`const SDK_PACKAGE = "${sdk.packageName}"`);
    expect(sdk.loader).toContain(`const SDK_VERSION = "${sdk.version}"`);
  }
});

test("provider boundaries use official SDK declarations", () => {
  expect(claudeLoader).toContain(
    'from "@anthropic-ai/claude-agent-sdk"',
  );
  expect(claudeLoader).toContain(
    'typeof import("@anthropic-ai/claude-agent-sdk")',
  );
  expect(cursorLoader).toContain('from "@cursor/sdk"');
  expect(cursorLoader).toContain('typeof import("@cursor/sdk")');
});

test("new snapshots preinstall both provider SDKs at the loader versions", () => {
  for (const sdk of sdkVersions) {
    expect(snapshotActions).toContain(
      `[ -d "$(npm root -g)/${sdk.packageName}" ]`,
    );
    expect(snapshotActions).toContain(`${sdk.packageName}@${sdk.version}`);
  }
});

test("older snapshots retain the user-local SDK fallback", () => {
  for (const sdk of sdkVersions) {
    expect(sdk.loader).toContain(
      'const SDK_LOCAL_PREFIX = "/home/eva/.eva-agent-sdk"',
    );
    expect(sdk.loader).toContain("npm install --prefix");
  }
});
