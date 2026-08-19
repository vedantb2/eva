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
    versionConstant: "CLAUDE_AGENT_SDK_VERSION",
    loader: claudeLoader,
  },
  {
    packageName: "@cursor/sdk",
    version: "1.0.26",
    versionConstant: "CURSOR_SDK_VERSION",
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
  expect(claudeLoader).toMatch(
    /import type \{[^}]*\} from "@anthropic-ai\/claude-agent-sdk"/,
  );
  expect(claudeLoader).toContain("SdkModule = { query: typeof query }");
  expect(cursorLoader).toMatch(/import type \{[^}]*\} from "@cursor\/sdk"/);
  expect(cursorLoader).toContain("Cursor: typeof Cursor");
});

test("new snapshots preinstall both provider SDKs at the loader versions", () => {
  for (const sdk of sdkVersions) {
    // Version-pinned, never existence-only. A snapshot seeded before a pin
    // moved would otherwise keep serving an SDK whose message shapes the
    // callback's parsers do not recognise, which reads as a turn that streams
    // no activity at all rather than as an error.
    expect(snapshotActions).toContain(
      `const ${sdk.versionConstant} = "${sdk.version}"`,
    );
    expect(snapshotActions).toContain(
      `globalPackageIsVersion("${sdk.packageName}", ${sdk.versionConstant})`,
    );
    expect(snapshotActions).toContain(
      `${sdk.packageName}@\${${sdk.versionConstant}}`,
    );
  }
});

test("both loaders resolve their pin through one version-aware helper", () => {
  // The helper lives in the Claude loader; the others import it.
  expect(claudeLoader).toContain("export function resolvePinnedSdkEntry(");
  expect(claudeLoader).toContain("if (globalVersion === pin.version)");
  for (const sdk of sdkVersions) {
    expect(sdk.loader).toContain("resolvePinnedSdkEntry({");
    expect(sdk.loader).toContain("version: SDK_VERSION,");
  }
});

test("older snapshots retain the user-local SDK fallback", () => {
  expect(claudeLoader).toContain(
    'const SDK_LOCAL_PREFIX = "/home/eva/.eva-agent-sdk"',
  );
  expect(claudeLoader).toContain("npm install --prefix");
});
